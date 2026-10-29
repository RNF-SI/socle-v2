# Déploiement de SOCLE V2

Procédure de mise en production. Elle couvre le passage depuis la **1.1.0** ou
la **1.2.0** vers la version courante de `main`, c'est-à-dire tout ce qui s'est
accumulé depuis : Angular 22, la pile Python moderne, le formulaire de contact
Zammad, les migrations Alembic remises en place et la synchronisation des
réserves depuis RADIS.

Les étapes sont dans l'ordre. L'étape 5 (migrations) est la seule qui ne se
rejoue pas : la lire avant de la lancer.

## 0. Savoir d'où l'on part

Sur le serveur, dans le dépôt :

```bash
git describe --tags            # version du code déployé
```

Puis l'état du suivi des migrations, qui conditionne l'étape 5 :

```bash
psql socle -tAc "select version_num from alembic_version"
```

Une erreur « relation alembic_version does not exist » est le cas **normal** ici :
les migrations ont été remises en place après la 1.2.0, donc une base déployée
avant n'a aucun suivi. C'est ce cas que décrit l'étape 5.

Ce qui change selon le point de départ :

| Déployé | Reste à faire |
|---|---|
| 1.0.0 | tout, venv compris (Flask 2→3, SQLAlchemy 1.4→2, pypnusershub 2→3, Python ≥ 3.13) |
| 1.1.0 | tout sauf la pile backend, déjà en Flask 3 — mais le venv est à reconstruire quand même si le Python du serveur a changé |
| 1.2.0 | étapes 3 à 9 |

## 1. Prérequis sur le serveur

- **Python 3.13 ou 3.14**. `requirements.txt` est figé sur Flask 3 / SQLAlchemy 2.
- `libpq-dev`, `pg_config` et un compilateur : `psycopg2` est compilé depuis les
  sources, pas installé en binaire.
- **Node 22** si le build du frontend se fait sur le serveur. Sinon il peut se
  faire sur un poste et seul `dist/socle2/` est déposé (voir étape 6).

## 2. Sauvegarder la base

Non négociable : l'étape 5 ajoute des colonnes, deux triggers et rattrape des
lignes manquantes.

```bash
pg_dump -Fc socle > ~/socle-avant-deploiement-$(date +%F).dump
```

## 3. Récupérer le code

```bash
git fetch origin
git checkout main
git pull
```

## 4. Backend : venv et configuration

Reconstruire le venv plutôt que le mettre à jour en place — la pile a changé de
version majeure sur quatre paquets :

```bash
cd backend
rm -rf venv
python3.14 -m venv venv          # ou uv venv --python 3.14 venv
venv/bin/python -m pip install -r requirements.txt
```

Puis compléter `backend/config.py`, qui n'est pas versionné. Six clés sont
apparues depuis la 1.1.0 ; les comparer à `config_sample.py` :

```
ZAMMAD_URL       ZAMMAD_TOKEN       ZAMMAD_GROUP       TURNSTILE_SECRET
RADIS_API_URL    RADIS_API_KEY
```

`ZAMMAD_TOKEN` doit appartenir à un agent ayant le droit *create* sur le groupe
`Support SI RNF::Support SOCLE` — nom complet, séparateur `::` compris.
`TURNSTILE_SECRET` est le pendant serveur de `turnstileSiteKey` du frontend :
les deux clés vont par paire et sont liées au nom d'hôte.
`RADIS_API_KEY` s'obtient auprès du Pôle SI.

Sans l'une des clés Zammad ou Turnstile, `/contact` répond 500 au lieu d'envoyer
sans vérification : l'échec est volontairement fermé.

## 5. Migrations — l'étape à ne pas improviser

La base de production contient déjà toutes les tables, mais pas la table
`alembic_version`. Or la première migration, `d6733424a976`, **crée tout le
schéma** : la lancer telle quelle échouerait sur un `DuplicateTable`.

Il faut donc déclarer cet état comme déjà atteint, sans l'exécuter :

```bash
cd backend
export FLASK_APP=wsgi.py

venv/bin/python -m flask db current                 # vide → poursuivre
venv/bin/python -m flask db stamp d6733424a976      # baseline : marquée, pas jouée
venv/bin/python -m flask db upgrade                 # les trois suivantes
venv/bin/python -m flask db check                   # doit dire « No new upgrade operations detected. »
```

Si `db current` renvoie déjà une révision, **ne pas stamper** : passer
directement à `db upgrade`.

Les trois migrations appliquées par `upgrade` :

| Révision | Effet |
|---|---|
| `ce3ab3176f38` | trigger `trg_maj_cor_site_inpg` — recalcule les croisements INPG au changement de périmètre |
| `a1c7f2b40e93` | rattrape les liens INPG manquants (insertion idempotente) |
| `b7e4d1f93c02` | colonnes `ancienne_reserve` / `date_declassement` / `raison_declassement`, trigger `trg_cree_infos_base_site`, et rattrapage des fiches absentes |

En local, le dernier rattrapage a créé **13 fiches** `t_infos_base_site`
manquantes. Vérifier qu'il ne reste pas de trou :

```bash
psql socle -tAc "select count(*) from site s where s.perimetre_protection is not true
  and not exists (select 1 from t_infos_base_site t where t.id_site = s.id_site)"
# attendu : 0
```

## 6. Frontend

`src/environments/environment.ts` et `environment.prod.ts` ne sont pas
versionnés et doivent exister avant le build. Deux clés sont nouvelles depuis la
1.1.0 :

- `turnstileSiteKey` — remplace `captcha_key`, qui n'est plus lue. La clé de
  production doit correspondre à un widget Turnstile **déclaré pour le domaine
  de SOCLE** ; une clé d'un autre site renvoie l'erreur `110200` et le widget
  ne s'affiche pas du tout ;
- `apiPnUH` — peut rester vide : `AuthService` retombe alors sur
  `apiGeoNature` pour le login.

Les trois autres restent `apiUrl`, `apiGeoNature`, `token` et `id_application`.

```bash
cd frontend
nvm use                 # Node 22, voir .nvmrc
npm ci
npm run build           # sortie dans dist/socle2
```

Déposer le contenu de `dist/socle2/` dans la racine servie par le serveur web.

## 7. Redémarrer le backend

Relancer le service qui sert `wsgi.py` (gunicorn / uWSGI selon
l'hébergement). Le venv ayant été reconstruit, un simple *reload* ne suffit pas.

## 8. Vérifications

Dans cet ordre, parce que chacune dépend de la précédente :

1. la carte d'accueil affiche les centroïdes — `/sites-simple-centroides` répond ;
2. une fiche de réserve s'ouvre — `/site/<slug>` ;
3. la connexion aboutit, et « Mes sites » liste bien les réserves de l'utilisateur
   (c'est le chemin qui dépend de `token` et `id_application`) ;
4. le questionnaire simplifié s'enregistre ;
5. l'export PDF d'une fiche aboutit ;
6. le formulaire de contact crée bien un ticket Zammad. En cas de 502, lire les
   logs du backend : le détail du refus y est journalisé, le client ne voit qu'un
   message générique.

## 9. Première synchronisation RADIS

À faire une fois l'API de RADIS déployée, d'abord sans rien écrire :

```bash
cd backend
FLASK_APP=wsgi.py venv/bin/python -m flask synchro-radis --a-blanc
```

Le rapport liste les créations, les modifications et les codes présents dans
SOCLE mais inconnus de RADIS. Si tout est cohérent, relancer sans `--a-blanc`.
Un second passage immédiat doit ne rien modifier : la commande est idempotente.

## 10. Après coup

- **Publier la release** sur GitHub. C'est elle qui déclenche
  `.github/workflows/sbom.yml` et l'envoi des SBOM vers Dependency-Track.
- **Retirer `_sync_reserve_to_socle` de equipe-app**, dans une PR séparée. Pas
  avant que la commande ci-dessus tourne en production : entre les deux, c'est ce
  push qui tient SOCLE à jour.
