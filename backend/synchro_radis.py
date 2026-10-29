"""Synchronisation des réserves depuis RADIS.

Historiquement, RADIS écrivait dans SOCLE : sa fonction `_sync_reserve_to_socle`
ouvrait une connexion sur la base de SOCLE et y faisait un UPDATE puis, à zéro
ligne touchée, un INSERT en SQL brut. Ce flux poussait les créations et les
modifications mais ne réconciliait jamais : une réserve déclassée côté RADIS
restait indéfiniment affichée dans SOCLE, et un évènement manqué restait
manqué.

Le flux est inversé : SOCLE tire par l'API publique de RADIS. L'inventaire
(`/reserves/inventaire`) donne l'état d'ensemble — ce qui existe, ce qui est
déclassé — et la liste paginée les données et les périmètres. SOCLE compare et
applique.

Ce que la synchronisation ne fait jamais :

- **supprimer un site.** RADIS déclasse, il ne supprime pas. Un site supprimé
  emporterait sa fiche géologique, ses rattachements INPG et les décisions de
  gestionnaire qu'ils portent. Un déclassement se répercute dans
  `ancienne_reserve`, qui le retire des listes en conservant la saisie ;
- **écraser un `slug`.** C'est la clé d'accès publique : l'API et le routing
  Angular adressent les sites par slug. Le recalculer au renommage d'une
  réserve casserait toutes les URL existantes. Il n'est donc posé qu'à la
  création ;
- **effacer une géométrie.** Une réserve dont RADIS ne connaît pas le périmètre
  garde celui que SOCLE détient. Écrire NULL déclencherait en plus
  `trg_maj_cor_site_inpg`, qui supprime alors tous les rattachements INPG du
  site ;
- **réécrire ce qui n'a pas changé.** Chaque mise à jour est conditionnée à une
  différence réelle, pour ne pas toucher `date_maj` ni relancer le croisement
  INPG de toutes les réserves à chaque passage. Les périmètres se comparent à
  neuf décimales, la finesse que le GeoJSON transmet (voir
  `_appliquer_reserve`) ;
- **toucher un périmètre de protection.** Les 17 sites `perimetre_protection`
  de SOCLE ne viennent pas de RADIS ;
- **toucher `creation_geol`**, qui est une saisie de SOCLE.
"""
from __future__ import annotations

import datetime
import json

import requests
from slugify import slugify
from sqlalchemy import text

# Les trois caractères que `site.type_rn` peut contenir. RADIS expose le type
# comme une nomenclature ; sa valeur courte est reprise ici après contrôle,
# plutôt que de risquer d'écrire un libellé long dans une colonne de trois
# caractères.
TYPES_RN_CONNUS = ('RNN', 'RNR', 'RNC', 'PP')

# Au-delà, une page de périmètres complets se compte en mégaoctets.
TAILLE_PAGE = 20

DELAI_REQUETE = 60


class ErreurSynchro(Exception):
    """La synchronisation ne peut pas aboutir."""


def _appel(base, cle, chemin, params=None):
    reponse = requests.get(
        f"{base.rstrip('/')}/api/v1{chemin}",
        headers={'X-API-Key': cle},
        params=params,
        timeout=DELAI_REQUETE,
    )
    if reponse.status_code != 200:
        raise ErreurSynchro(
            f"{chemin} a répondu {reponse.status_code} : {reponse.text[:200]}"
        )
    return reponse.json()


def lire_inventaire(base, cle):
    """État d'ensemble des réserves de RADIS, indexé par id_local."""
    charge = _appel(base, cle, '/reserves/inventaire')
    return {item['id_local']: item for item in charge.get('items', [])}


def lire_reserves(base, cle, taille_page=TAILLE_PAGE):
    """Réserves détaillées, périmètres compris, page par page.

    `ancienne_reserve=all` lève le filtre par défaut de l'API : les réserves
    déclassées doivent être lues pour que leur statut soit répercuté.
    """
    page = 1
    while True:
        charge = _appel(base, cle, '/reserves', {
            'page': page,
            'per_page': taille_page,
            'ancienne_reserve': 'all',
            'geometry': 'full',
        })
        items = charge.get('items', [])
        if not items:
            return
        yield from items
        if page >= (charge.get('pages') or 1):
            return
        page += 1


def _type_rn(item):
    """Code court du type de réserve, ou None s'il n'est pas reconnaissable."""
    nomenclature = item.get('type_rn') or {}
    for valeur in (nomenclature.get('label'), nomenclature.get('mnemonique')):
        if valeur and str(valeur).strip().upper() in TYPES_RN_CONNUS:
            return str(valeur).strip().upper()
    return None


def _geometrie_json(item):
    geometrie = item.get('geometry')
    if not geometrie:
        return None
    return json.dumps(geometrie)


def _appliquer_reserve(conn, item, rapport):
    code = (item.get('id_local') or '').strip()
    nom = (item.get('nom_site') or '').strip()
    if not code or not nom:
        rapport['ignores'].append((code or '?', 'id_local ou nom_site absent'))
        return

    existant = conn.execute(
        text("""SELECT id_site, perimetre_protection
                  FROM site WHERE code = :code"""),
        {'code': code},
    ).fetchone()

    if existant and existant.perimetre_protection:
        rapport['ignores'].append((code, 'périmètre de protection, hors RADIS'))
        return

    type_rn = _type_rn(item)
    if type_rn is None and not existant:
        # `site.type_rn` est NOT NULL : sans type reconnaissable, la création
        # échouerait au lieu de signaler le problème.
        rapport['ignores'].append((code, f"type_rn non reconnu : {item.get('type_rn')!r}"))
        return

    geom_json = _geometrie_json(item)
    valeurs = {
        'code': code,
        'nom': nom,
        'jonction_nom': (item.get('jonction_nom') or None),
        'surf_off': item.get('surf_off'),
        'ancienne_reserve': bool(item.get('ancienne_reserve')),
        'date_declassement': item.get('date_declassement'),
        'raison_declassement': item.get('raison_declassement'),
        'geom_json': geom_json,
    }
    if type_rn is not None:
        valeurs['type_rn'] = type_rn
    # `region` omis de la réponse signifie « information indisponible » et non
    # « pas de région » : ne pas écraser celle que SOCLE détient.
    if 'region' in item:
        valeurs['region'] = item.get('region')

    if not existant:
        rapport['crees'].append(code)
        valeurs['slug'] = _slug_libre(conn, nom, code)
        conn.execute(text("""
            INSERT INTO site (
                nom, jonction_nom, slug, code, type_rn, region, surf_off,
                geom, geom_point,
                ancienne_reserve, date_declassement, raison_declassement,
                date_ajout, date_maj, creation_geol, perimetre_protection
            ) VALUES (
                :nom, :jonction_nom, :slug, :code, :type_rn, :region, :surf_off,
                CASE WHEN :geom_json IS NULL THEN NULL
                     ELSE ST_Multi(ST_SetSRID(ST_GeomFromGeoJSON(:geom_json), 4326)) END,
                CASE WHEN :geom_json IS NULL THEN NULL
                     ELSE ST_Centroid(ST_SetSRID(ST_GeomFromGeoJSON(:geom_json), 4326)) END,
                :ancienne_reserve, :date_declassement, :raison_declassement,
                now(), now(), false, false
            )
        """), {**valeurs, 'type_rn': type_rn, 'region': valeurs.get('region')})
        return

    # Mise à jour conditionnelle : la clause WHERE ne retient la ligne que si
    # quelque chose diffère réellement, pour ne pas réécrire 390 périmètres et
    # autant de `date_maj` à chaque passage.
    affectations = [
        'nom = :nom',
        'jonction_nom = :jonction_nom',
        'surf_off = :surf_off',
        'ancienne_reserve = :ancienne_reserve',
        'date_declassement = :date_declassement',
        'raison_declassement = :raison_declassement',
    ]
    conditions = [
        'nom IS DISTINCT FROM :nom',
        'jonction_nom IS DISTINCT FROM :jonction_nom',
        'surf_off IS DISTINCT FROM :surf_off',
        'ancienne_reserve IS DISTINCT FROM :ancienne_reserve',
        'date_declassement IS DISTINCT FROM CAST(:date_declassement AS date)',
        'raison_declassement IS DISTINCT FROM :raison_declassement',
    ]
    if type_rn is not None:
        affectations.append('type_rn = :type_rn')
        conditions.append('type_rn IS DISTINCT FROM :type_rn')
    if 'region' in item:
        affectations.append('region = :region')
        conditions.append('region IS DISTINCT FROM :region')
    if geom_json is not None:
        geom = 'ST_Multi(ST_SetSRID(ST_GeomFromGeoJSON(:geom_json), 4326))'
        affectations.append(f'geom = {geom}')
        affectations.append(f'geom_point = ST_Centroid({geom})')
        # Comparaison à la résolution du GeoJSON, et non au bit près :
        # ST_AsGeoJSON arrondit à neuf décimales, si bien qu'un aller-retour
        # par l'API n'est jamais identique à l'original en double précision.
        # ST_OrderingEquals et même ST_Equals répondaient donc « différent »
        # pour les 390 réserves à chaque passage, réécrivant tous les
        # périmètres et relançant le croisement INPG pour rien. Neuf décimales
        # de degré valent un dixième de millimètre : c'est la finesse que
        # l'API peut transmettre, donc celle à laquelle la question « est-ce
        # que ça a changé ? » a un sens.
        conditions.append(
            f'ST_AsGeoJSON(geom, 9) IS DISTINCT FROM ST_AsGeoJSON({geom}, 9)'
        )

    requete = text(f"""
        UPDATE site SET {', '.join(affectations)}, date_maj = now()
         WHERE code = :code
           AND perimetre_protection IS NOT TRUE
           AND ({' OR '.join(conditions)})
    """)
    if conn.execute(requete, valeurs).rowcount:
        rapport['modifies'].append(code)
    else:
        rapport['inchanges'] += 1


def _appliquer_page(conn, items, rapport, a_blanc):
    transaction = conn.begin()
    try:
        for item in items:
            _appliquer_reserve(conn, item, rapport)
    except Exception:
        transaction.rollback()
        raise
    if a_blanc:
        transaction.rollback()
    else:
        transaction.commit()


def _slug_libre(conn, nom, code):
    """Slug de création, suffixé si le nom est déjà pris.

    Le slug est unique en base et sert de clé d'accès publique : deux réserves
    homonymes ne doivent pas faire échouer l'insertion de la seconde.
    """
    base = slugify(nom) or slugify(code) or code.lower()
    candidat, suffixe = base, 1
    while conn.execute(
        text('SELECT 1 FROM site WHERE slug = :slug'), {'slug': candidat}
    ).fetchone():
        suffixe += 1
        candidat = f'{base}-{suffixe}'
    return candidat


def _signaler_absents(conn, inventaire, rapport):
    """Sites de SOCLE dont le code est inconnu de RADIS.

    Rien n'est modifié : ces sites sont signalés pour arbitrage. Les supprimer
    sans examen détruirait des fiches, et l'absence peut tout aussi bien venir
    d'un code saisi de travers côté SOCLE.
    """
    rows = conn.execute(text("""
        SELECT code, nom FROM site
         WHERE perimetre_protection IS NOT TRUE
           AND code IS NOT NULL AND code <> ''
         ORDER BY nom
    """)).fetchall()
    rapport['inconnus_de_radis'] = [
        (row.code, row.nom) for row in rows if row.code not in inventaire
    ]


def synchroniser(db, base, cle, taille_page=TAILLE_PAGE, a_blanc=False):
    """Applique l'état de RADIS à la table `site`. Renvoie un rapport."""
    if not base or not cle:
        raise ErreurSynchro(
            'RADIS_API_URL et RADIS_API_KEY doivent être renseignés dans config.py'
        )

    inventaire = lire_inventaire(base, cle)
    if not inventaire:
        # Appliquer un inventaire vide reviendrait à déclasser tout le réseau.
        raise ErreurSynchro("L'inventaire RADIS est vide : rien n'est appliqué")

    rapport = {
        'debut': datetime.datetime.now(),
        'reserves_radis': len(inventaire),
        'crees': [],
        'modifies': [],
        'ignores': [],
        'inchanges': 0,
        'inconnus_de_radis': [],
        'a_blanc': a_blanc,
    }

    # Une transaction par page, et non une pour toute la synchronisation : la
    # lecture de RADIS prend des minutes et garder une transaction ouverte
    # pendant ce temps tiendrait des verrous sur `site` pour rien. Chaque
    # réserve est indépendante, appliquer page par page est aussi correct.
    with db.engine.connect() as conn:
        page = []
        for item in lire_reserves(base, cle, taille_page):
            page.append(item)
            if len(page) >= taille_page:
                _appliquer_page(conn, page, rapport, a_blanc)
                page = []
        if page:
            _appliquer_page(conn, page, rapport, a_blanc)
        _signaler_absents(conn, inventaire, rapport)

    rapport['declassees'] = sorted(
        code for code, item in inventaire.items() if item.get('ancienne_reserve')
    )
    return rapport


def enregistrer_commandes(app):
    import click

    @app.cli.command('synchro-radis')
    @click.option('--a-blanc', is_flag=True,
                  help="Montre ce qui changerait sans rien écrire.")
    @click.option('--taille-page', default=TAILLE_PAGE, show_default=True,
                  help='Réserves par page ; les périmètres complets sont lourds.')
    def commande_synchro_radis(a_blanc, taille_page):
        """Synchronise les réserves depuis l'API de RADIS."""
        from app import db

        try:
            rapport = synchroniser(
                db,
                app.config.get('RADIS_API_URL'),
                app.config.get('RADIS_API_KEY'),
                taille_page=taille_page,
                a_blanc=a_blanc,
            )
        except ErreurSynchro as erreur:
            raise click.ClickException(str(erreur))

        if a_blanc:
            click.echo('--- à blanc : rien n\'a été écrit ---')
        click.echo(f"{rapport['reserves_radis']} réserves dans RADIS")
        click.echo(f"  créées      : {len(rapport['crees'])}")
        click.echo(f"  modifiées   : {len(rapport['modifies'])}")
        click.echo(f"  inchangées  : {rapport['inchanges']}")
        click.echo(f"  déclassées  : {len(rapport['declassees'])}")
        for code in rapport['crees']:
            click.echo(f'  + {code}')
        for code, raison in rapport['ignores']:
            click.echo(f'  ! {code} ignorée — {raison}')
        if rapport['inconnus_de_radis']:
            click.echo(
                f"\n{len(rapport['inconnus_de_radis'])} site(s) de SOCLE "
                'inconnus de RADIS, laissés en place :'
            )
            for code, nom in rapport['inconnus_de_radis']:
                click.echo(f'  ? {code} — {nom}')
