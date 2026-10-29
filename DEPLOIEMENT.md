# Déploiement de SOCLE V2

Procédure de mise en production, écrite pendant le déploiement de la 1.3.0 sur
`socle.reserves-naturelles.org`, qui partait de la 1.0.0. Tout ce qui suit a été
rencontré pour de vrai : les pièges décrits ne sont pas des précautions
théoriques.

Les étapes sont dans l'ordre. L'étape 5 est la seule qui ne se rejoue pas.

## 0. Savoir d'où l'on part

```bash
git describe --tags            # version du code déployé
```

Puis l'état du suivi des migrations, qui détermine toute l'étape 5. La base est
sur un autre serveur et le client `psql` n'est pas installé sur le serveur
applicatif : passer par le venv, qui connaît déjà l'URI.

```bash
cd backend && venv/bin/python -c "
import config, sqlalchemy as sa
e = sa.create_engine(config.Config.SQLALCHEMY_DATABASE_URI)
with e.connect() as c:
    print(c.execute(sa.text('select version_num from alembic_version')).scalar())"
```

Trois réponses possibles, et trois traitements différents :

| Réponse | Signification | Traitement |
|---|---|---|
| une révision connue du dépôt | suivi à jour | `flask db upgrade` suffit |
| une révision **inconnue** du dépôt | la base a été tamponnée par un arbre de migrations non versionné | `flask db stamp <baseline> --purge` |
| « relation alembic_version does not exist » | aucun suivi | `flask db stamp <baseline>` |

Le deuxième cas est celui de la production en octobre 2026 : la base portait
`a8e71cda129c`, qui n'a jamais existé dans le dépôt — `backend/migrations/`
était gitignoré avant la 1.3.0, donc l'arbre qui a tamponné cette base ne
vivait que sur le serveur. D'où le `--purge`, qui vide la table avant de
tamponner au lieu de chercher à résoudre une révision introuvable.

## 1. Prérequis sur le serveur

- **Python 3.13 ou 3.14** pour le backend.
- `libpq-dev`, `pg_config`, `build-essential` : `psycopg2` est compilé depuis
  les sources.
- **Node 22** pour le frontend. Debian 13 ne fournit que la 20, et Angular 22
  exige 22.22.3 au minimum. Par le dépôt NodeSource :
  ```bash
  sudo apt install -y ca-certificates curl gnupg
  sudo install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key \
    | sudo gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg
  echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_22.x nodistro main" \
    | sudo tee /etc/apt/sources.list.d/nodesource.list
  sudo apt update && sudo apt install -y nodejs && node -v
  ```

## 2. Sauvegarder la base

L'étape 5 ajoute des colonnes, deux triggers et rattrape des lignes. La base
étant sur un autre serveur, la sauvegarde se fait depuis celui-là.

## 3. Récupérer le code

```bash
git fetch origin && git checkout main && git pull
```

Deux points si l'on vient d'une version antérieure à la 1.2.0 :

- `git pull` peut refuser à cause de modifications locales sur
  `backend/requirements.txt` et `frontend/tsconfig.json`. Les regarder avant de
  les écraser (`git diff`), mais elles sont normalement sans valeur : des
  versions re-figées par un `pip freeze` local, et un `strict` désactivé dans
  tsconfig que `main` réécrit de toute façon pour TypeScript 6.
- Le **sous-module `home-rnf` n'existe plus**. Git laisse son répertoire sur
  place, non suivi : `rm -rf frontend/src/app/home-rnf`.

## 4. Backend : venv et configuration

Reconstruire plutôt que mettre à jour — quatre paquets changent de version
majeure depuis la 1.0.0 :

```bash
cd backend
mv venv venv.precedent          # permet de redémarrer le service dessus en cas de pépin
python3.13 -m venv venv
venv/bin/python -m pip install -U pip
venv/bin/python -m pip install -r requirements.txt
```

`gunicorn` figure dans `requirements.txt` depuis la 1.3.0 seulement. Avant, il
était installé à la main dans le venv : une reconstruction le perd, et
`socle.service` échoue au démarrage sans que le message désigne la cause.

Six clés sont apparues depuis la 1.1.0 ; les comparer à `config_sample.py` :

```
ZAMMAD_URL       ZAMMAD_TOKEN       ZAMMAD_GROUP       TURNSTILE_SECRET
RADIS_API_URL    RADIS_API_KEY
```

## 5. Migrations

### Le point critique : Alembic joue tout dans une seule transaction

`flask db upgrade` enchaîne toutes les migrations restantes dans **une**
transaction. Si la dernière échoue, **les précédentes sont annulées aussi** —
`alembic_version` revient à sa valeur de départ. Conséquence pratique : après un
échec, relire `flask db current` avant toute réparation manuelle, car la valeur
n'est pas celle que les journaux laissent croire.

C'est ce qui a piégé le déploiement de la 1.3.0 : le bloc SQL de réparation
avait été écrit pour une version intermédiaire, son `UPDATE alembic_version` n'a
touché aucune ligne, et la base s'est retrouvée avec le schéma d'une migration
sans son marqueur.

### Le rôle applicatif doit posséder les tables

`ALTER TABLE` exige la **propriété** de la table, et ce droit ne se délègue pas
— contrairement à `TRIGGER` ou `INSERT`. Si les tables appartiennent à
`postgres` et que l'application se connecte comme `socle`, toute migration qui
ajoute une colonne échoue sur `InsufficientPrivilege`.

Vérifier :

```bash
cd backend && venv/bin/python -c "
import config, sqlalchemy as sa
e = sa.create_engine(config.Config.SQLALCHEMY_DATABASE_URI)
with e.connect() as c:
    print('rôle :', c.execute(sa.text('select current_user')).scalar())
    print('propriétaire de site :', c.execute(sa.text(
        \"select tableowner from pg_tables where tablename='site'\")).scalar())"
```

Si les deux diffèrent, transférer la propriété — en tant que `postgres`, dans
`psql` sur la base. Le bloc ci-dessous affiche chaque instruction au passage et
**écarte tout ce qui appartient à une extension**, donc PostGIS reste à
`postgres` : il ne faut surtout pas toucher à `spatial_ref_sys`, et encore moins
passer par `REASSIGN OWNED BY`, qui emporterait tout sans distinction.

```sql
DO $$
DECLARE instruction text;
BEGIN
  FOR instruction IN
    SELECT format('ALTER TABLE %I.%I OWNER TO socle', n.nspname, c.relname)
      FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE n.nspname IN ('public','infoterre')
       AND c.relkind IN ('r','p','S','v','m')
       AND NOT EXISTS (SELECT 1 FROM pg_depend d WHERE d.objid = c.oid AND d.deptype = 'e')
    UNION ALL
    SELECT format('ALTER FUNCTION %I.%I(%s) OWNER TO socle', n.nspname, p.proname,
                  pg_get_function_identity_arguments(p.oid))
      FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
     WHERE n.nspname IN ('public','infoterre')
       AND NOT EXISTS (SELECT 1 FROM pg_depend d WHERE d.objid = p.oid AND d.deptype = 'e')
  LOOP
    RAISE NOTICE '%', instruction;
    EXECUTE instruction;
  END LOOP;
END $$;

ALTER SCHEMA infoterre OWNER TO socle;
GRANT CREATE ON SCHEMA public TO socle;
```

`ALTER TABLE … OWNER TO` couvre aussi les séquences et les vues, d'où le bloc
unique. Le `GRANT CREATE` sert aux migrations futures : depuis PostgreSQL 15, un
rôle non propriétaire du schéma `public` ne peut plus y créer de table.

### Appliquer

```bash
cd backend && export FLASK_APP=wsgi.py
venv/bin/python -m flask db stamp d6733424a976 --purge   # selon le cas de l'étape 0
venv/bin/python -m flask db upgrade
venv/bin/python -m flask db check
```

`db check` doit conclure par « No new upgrade operations detected. ». C'est la
seule preuve que le schéma de production correspond aux modèles — d'autant plus
nécessaire ici qu'on postule l'état décrit par la baseline sans pouvoir le
vérifier autrement.

Puis le contrôle des données rattrapées :

```bash
cd backend && venv/bin/python - <<'EOF'
import config, sqlalchemy as sa
e = sa.create_engine(config.Config.SQLALCHEMY_DATABASE_URI)
with e.connect() as c:
    v = lambda s: c.execute(sa.text(s)).scalar()
    print("sites            :", v("select count(*) from site where perimetre_protection is not true"))
    print("fiches           :", v("select count(*) from t_infos_base_site"))
    print("sites sans fiche :", v("select count(*) from site s where s.perimetre_protection is not true"
          " and not exists (select 1 from t_infos_base_site t where t.id_site=s.id_site)"))
    print("liens INPG       :", v("select count(*) from cor_site_inpg"))
EOF
```

« sites sans fiche » doit valoir 0.

## 6. Redémarrer le backend

```bash
sudo systemctl restart socle
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:5000/sites-simple-centroides
```

Gunicorn écoute sur le **5000** en production ; le 5068 n'est que le port du
mode développement. Attendu : `200`.

## 7. Frontend

`src/environments/environment.ts` et `environment.prod.ts` ne sont pas
versionnés et doivent exister avant le build, avec les **huit** clés ci-dessous.
Il en manquait deux au fichier de production hérité de la 1.0.0, et l'absence
d'`apiPnUH` fait échouer la compilation sur trois erreurs TS2339 dans
`AuthService`.

```ts
export const environment = {
  production: true,
  apiUrl: '/api',                 // chemin relatif : Apache relaie /api/ vers le 5000
  apiGeoNature: 'https://geonature.reserves-naturelles.org/api',
  token: '…',                     // jeton des exports GeoNature /exports/api/3 et /4
  id_application: 11,
  turnstileSiteKey: '0x…',        // clé publique du widget déclaré pour le domaine de SOCLE
  flask_server: '/api',
  apiPnUH: ''                     // laisser vide : AuthService retombe sur apiGeoNature
};
```

`apiUrl` en chemin relatif plutôt qu'en URL absolue : le frontend et l'API sont
servis par le même hôte, et cela évite toute question de protocole.
`turnstileSiteKey` remplace `captcha_key`, qui n'est plus lue — et la clé est
liée au nom d'hôte, donc il faut celle du widget de SOCLE, sinon le widget ne
s'affiche pas du tout (erreur `110200`).

```bash
cd frontend && node -v && rm -rf node_modules && npm ci && npm run build
```

Le `rm -rf node_modules` est nécessaire si l'arbre a été installé sous une autre
version de Node. La sortie est **à plat** dans `dist/socle2/` — pas de
sous-répertoire `browser/`, le projet utilise encore le *builder* `:browser`.

Bascule, en conservant l'ancienne version pour le retour arrière :

```bash
sudo mv /var/www/socle-frontend /var/www/socle-frontend.precedent
sudo mkdir /var/www/socle-frontend
sudo cp -r ~/socle-v2/frontend/dist/socle2/. /var/www/socle-frontend/
```

Le vhost Apache porte déjà `FallbackResource /index.html` (routage Angular) et
`ProxyPass /api/ http://127.0.0.1:5000/`.

## 8. Vérifications

Dans un navigateur, **en forçant le rechargement** (Ctrl+Maj+R) : sans cela
l'ancien `index.html` en cache réclame des fichiers qui n'existent plus.

1. la carte d'accueil affiche les réserves ;
2. une fiche s'ouvre, et le rafraîchissement sur son URL fonctionne ;
3. la connexion aboutit et « Mes sites » liste les réserves de l'utilisateur
   (chemin qui dépend de `token` et `apiGeoNature`) ;
4. le questionnaire simplifié s'enregistre ;
5. l'export PDF d'une fiche aboutit ;
6. le formulaire de contact crée un ticket Zammad.

### Si le formulaire de contact échoue

Les codes sont parlants : **400** jeton Turnstile refusé (la paire
`turnstileSiteKey` / `TURNSTILE_SECRET` n'est pas celle du même widget), **500**
une clé manquante dans `config.py`, **502** Zammad injoignable ou refusant la
création. Le détail est journalisé côté serveur : `journalctl -u socle | grep -i zammad`.

**Zammad n'est pas joignable par son nom public depuis le serveur.** Les deux
machines sont des conteneurs derrière pfSense, et le nom public résout vers
l'extérieur sans réflexion NAT : la connexion est refusée. Le TLS est terminé
par un conteneur proxy distinct, sur un autre sous-réseau que Zammad lui-même.
Le réglage est un *Host Override* sur le DNS Resolver de pfSense, qui fait
pointer `zammad.reserves-naturelles.org` vers le proxy interne — ainsi le nom et
le certificat restent valides et `config.py` n'a rien à changer. Une entrée dans
`/etc/hosts` du conteneur dépanne, mais c'est le réglage que personne ne
retrouve le jour où le proxy change d'adresse.

À noter pour le diagnostic : Zammad répond **403** à un appel d'API sans jeton,
pas 401. Un 403 n'indique donc pas un problème de droits en soi.

## 9. Première synchronisation RADIS

```bash
cd backend && FLASK_APP=wsgi.py venv/bin/python -m flask synchro-radis --a-blanc
```

Le rapport liste les créations, les modifications et les codes présents dans
SOCLE mais inconnus de RADIS. Si tout est cohérent, relancer sans `--a-blanc`.
Un second passage immédiat ne doit rien modifier : la commande est idempotente.

## 10. Après coup

- **Publier la release** sur GitHub : c'est elle qui déclenche
  `.github/workflows/sbom.yml` et l'envoi des SBOM vers Dependency-Track.
- **Retirer `_sync_reserve_to_socle` de equipe-app**, dans une PR séparée — pas
  avant que la synchronisation tourne en production, puisque c'est ce push qui
  tient SOCLE à jour entre les deux.
- Supprimer `backend/venv.precedent` et `/var/www/socle-frontend.precedent` une
  fois la version éprouvée.
