# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Projet

SOCLE V2 : saisie et consultation des données de géodiversité des réserves naturelles françaises (RNF). Stack GeoNature : Flask 3 + Angular 22 + PostgreSQL/PostGIS. Interface, modèles et commentaires sont en français — garder cette langue pour les libellés, messages d'erreur utilisateur et noms de champs métier.

## Mise en route (obligatoire avant tout développement)

Trois éléments ne sont pas versionnés et doivent exister :

1. **Node 22.22 minimum** — Angular 22 refuse de démarrer en deçà. Un `.nvmrc` fixe la version :
   ```bash
   cd frontend && nvm use
   ```
2. **`backend/config.py`** — copier `backend/config_sample.py` et renseigner la base, UsersHub et le mail.
3. **`frontend/src/environments/environment.ts` et `environment.prod.ts`** — gitignorés, absents du dépôt, mais importés par les services de l'application **et du sous-module**. Les cinq clés effectivement lues dans le code sont :
   - `apiUrl` — backend SOCLE, à aligner sur `API_ENDPOINT` (par défaut `http://127.0.0.1:5068`) ;
   - `apiGeoNature` — instance GeoNature distante, utilisée pour le login et les droits ;
   - `token` — jeton des exports GeoNature (voir ci-dessous), passé en query string ;
   - `id_application` — id SOCLE côté UsersHub (11) ;
   - `captcha_key` — reCAPTCHA du formulaire de contact.

   Un fichier d'environnement incomplet casse l'authentification sans erreur de compilation : vérifier ces cinq clés avant de diagnostiquer un bug de connexion.

Le schéma métier est décrit par les migrations Alembic de `backend/migrations`, désormais versionnées. Une installation neuve se monte ainsi :

```bash
createdb socle -T template0 && psql socle -c 'create extension postgis' -c 'create schema infoterre'
cd backend && FLASK_APP=wsgi.py venv/bin/python -m flask db upgrade
```

Deux points à connaître avant de toucher aux migrations :

- `env.py` filtre les tables via `include_object` : Alembic ne gère que celles déclarées dans `models.py`. Sans ce filtre, un autogenerate propose de supprimer les tables de pypnusershub, celles de PostGIS et le schéma `infoterre`, qu'aucun modèle ne décrit.
- l'autogénération **n'importe pas `geoalchemy2`** alors qu'elle émet `geoalchemy2.types.Geometry`, et **redéclare les index spatiaux** `idx_<table>_<colonne>` que geoalchemy2 crée lui-même avec la table. Les deux font échouer la migration ; les corriger à la main après chaque `flask db migrate`.

Les données, elles, ne sont pas dans le dépôt : les migrations créent les tables, pas leur contenu (nomenclatures, INPG, carte BRGM).

Elle contient deux schémas : `public` (données métier) et `infoterre` (carte géologique BRGM — `s_fgeol` fait ~1 M de polygones, `echelle` l'échelle stratigraphique). Attention au nom : `config_sample.py` propose `socle2`, alors que la base de travail s'appelle `socle` — vérifier `SQLALCHEMY_DATABASE_URI` avant de conclure à un problème de droits.

## Commandes

Backend (depuis `backend/`) — Python **3.13 ou 3.14**. `requirements.txt` est figé par `pip freeze` sur une pile moderne (Flask 3, SQLAlchemy 2, pypnusershub 3) ; regénérer le fichier de la même façon après toute montée de version.

```bash
uv venv --python 3.14 venv            # ou pyenv / python3.13 -m venv
venv/bin/python -m pip install -r requirements.txt
python wsgi.dev.py          # dev, debug, port 5068
FLASK_APP=wsgi.py flask run --port 5080   # variante VS Code (.vscode/launch.json)
```

Frontend (depuis `frontend/`) :
```bash
nvm use                     # Node 22, voir .nvmrc
npm start                   # ng serve, http://127.0.0.1:4200
npm run build               # build production dans dist/socle2
npm test                    # Karma + Jasmine, Chrome
ng test --include='**/sites.service.spec.ts'   # un seul fichier de test
```

`psycopg2` (et non `psycopg2-binary`) est compilé depuis les sources : `libpq-dev` et `pg_config` doivent être présents. Un `.claude/launch.json` lance le front.

Il n'y a ni linter ni test backend configuré. Les `.spec.ts` du frontend sont les squelettes générés par le CLI : les tests ne sont pas une pratique établie ici.

## Architecture

### Backend — un module Flask à plat, pas de factory

`app.py` crée `app`, `db`, `ma`, `mail` au niveau module ; `models.py`, `schemas.py` et `routes.py` importent ces objets depuis `app`. Conséquence : les imports sont circulaires par conception et l'ordre dans `app.py` compte (blueprints enregistrés après la création des extensions). Pas de blueprint par domaine : toutes les routes métier vivent dans `routes.py` sous un unique `bp`.

`app.py` enregistre le blueprint **pypnusershub** `/auth`, mais le frontend ne s'en sert pas : il s'authentifie directement contre `environment.apiGeoNature` (voir plus bas). Ce blueprint est donc monté sans être appelé par l'application — ne pas en déduire que le login passe par ce backend. pypnusershub 3 a supprimé `routes_register` : il n'y a plus de `/pypn/register`.

Corollaire important : **aucune route de `routes.py` n'est protégée**, ni par décorateur ni par vérification de `current_user`, y compris les `PUT` de mise à jour. Tout le contrôle d'accès est côté Angular. Une route sensible ajoutée ici est ouverte par défaut.

Sérialisation : Marshmallow (`schemas.py`) avec `SQLAlchemyAutoSchema`. Les géométries ne sont jamais exposées en WKB : chaque schéma concerné définit une `fields.Method` qui convertit via `geoalchemy2.shape.to_shape` + `shapely.geometry.mapping` pour produire du GeoJSON. Les schémas sont souvent instanciés avec `only=(...)` pour limiter la charge ; les routes de liste y associent `load_only` / `joinedload` (voir `/sites-simple-centroides`) — garder ce couple schéma/requête cohérent lors d'un ajout de champ.

### Modèle de données

`Site` (table `site`) est le pivot. Particularités à connaître :

- **`slug`** est la clé d'accès publique : l'API et le routing Angular adressent les sites par slug (`/site/<slug>`, `/t_infos_base_site/<slug>`), pas par `id_site`.
- **Périmètres de protection** : auto-référence `id_perimetre_protection` + drapeau `perimetre_protection`. Les listes filtrent systématiquement `Site.perimetre_protection != True` pour ne pas afficher un périmètre comme une réserve.
- **`TInfosBaseSite`** (`t_infos_base_site`, PK = FK vers `site.id_site`) porte toutes les réponses du questionnaire géologique. `completion` (float 0–1) y est stocké mais n'est jamais écrit par le code applicatif — il est calculé en base. Idem pour `suivi_infos_base_site` (`SuivisModifs`, colonnes JSONB `ancien`/`nouveau`) : l'historique est alimenté côté base, l'application ne fait que le relire et le mettre en forme (`transform_modifications` dans `routes.py`, avec son dictionnaire de libellés français par champ).
- **INPG** (inventaire national du patrimoine géologique, source externe) : table `inpg` en lecture, liée par `cor_site_inpg` qui porte `active` / `raison_desactive` — un gestionnaire peut invalider un rattachement INPG sans supprimer la donnée (`/invalid-inpg-from-site`, `/revalid-inpg-from-site`).
- **Nomenclatures** : `t_nomenclatures` / `bib_nomenclatures_types` à la mode GeoNature. Les `id_type` sont codés en dur dans les composants Angular (6 = âges, 7 = substances), pas résolus par mnémonique.
- Tables d'association déclaratives (`cor_site_ages`, `cor_site_stratotype`, `cor_site_sfgeol`) avec `ondelete="CASCADE"` et `passive_deletes=True`.

`PUT /t_infos_base_site/<slug>` est la route centrale (~175 lignes) : elle reçoit le payload du questionnaire sous forme d'objets imbriqués (`contains_paleontological_heritage.answer`, `.vertebrates`, …), applique les champs un à un avec la valeur existante en défaut, puis reconstruit les relations (stratotypes, patrimoines, substances). Toute évolution du questionnaire touche conjointement cette route, `models.py`, le composant `questionnaire-simplifie` et son modèle TypeScript.

### Frontend — Angular 22, modules eager, un seul NgModule

`app.module.ts` déclare tout (pas de lazy loading). Les composants du projet portent `standalone: false` explicitement : en Angular 19 le défaut est l'inverse, et sans ce drapeau le NgModule refuse de les déclarer (NG6008). Les composants du sous-module, eux, sont standalone et sont importés dans le NgModule. Toutes les routes sont enfants de `NavHomeComponent`, qui vient du sous-module `home-rnf`.

Deux sources de configuration coexistent :
- `src/environments/*.ts` (gitignoré) — les cinq clés listées plus haut, utilisées par les services de l'app et du sous-module.
- `src/conf/app.config.ts` (versionné) pour le paramétrage de la coquille `home-rnf` : titres, menu, recherche, `API_ENDPOINT`, `ID_APPLICATION_GEONATURE`. Les deux dupliquent l'endpoint API et l'id d'application : les tenir synchronisés.

### `src/app/core` — l'ancien socle `home-rnf`

`core/` contient ce qui venait du sous-module `RNF-SI/home-rnf` : coquille applicative (`nav-home`), pages de connexion, déconnexion, mot de passe oublié, 404 et accès refusé, les guards, `AuthService`, `ExcelService` et `SearchService`.

**Le sous-module a été supprimé, ne pas le remettre.** Ses branches avaient divergé en parallèle depuis plus d'un an — `angular-19` et `keycloak` ne partagent aucun commit — si bien qu'il ne jouait plus son rôle de base commune tout en bloquant les montées de version d'Angular. Seul ce que SOCLE utilise a été repris ; `mail.service`, le formulaire de contact du socle, `loading-spinner`, `input-error` et `redirect.service` ont été abandonnés.

L'authentification est isolée dans `core/auth/` : c'est la seule partie qu'il faudra re-synchroniser si RNF bascule sur Keycloak, travail qui existe en amont sur la branche `keycloak`, bâtie sur la ligne Angular 15.

`src/conf/app.config.ts` reste le paramétrage de cette coquille : titres, menu, recherche, `displayFooter`, `displayPartners`.

### Formulaire de contact — ticket Zammad

`POST /contact` vérifie le jeton Cloudflare Turnstile puis ouvre un ticket Zammad, sur le modèle de `cicada_vitrine`. Le jeton d'API Zammad et le secret Turnstile ne quittent jamais le serveur : le frontend ne connaît que cette route.

Quatre clés dans `config.py` (documentées dans `config_sample.py`) : `ZAMMAD_URL`, `ZAMMAD_TOKEN`, `ZAMMAD_GROUP`, `TURNSTILE_SECRET`. Si l'une manque, la route répond 500 plutôt que d'envoyer sans vérification — elle **échoue volontairement fermée**.

**Les droits Zammad sont par groupe.** Le jeton doit appartenir à un agent ayant `create` sur le groupe visé ; un jeton d'une autre application RNF liste bien les groupes mais reçoit un 403 « Not authorized » à la création. Le détail du refus est journalisé côté serveur, le client ne voit qu'un message générique : en cas de 502, lire les logs du backend.

**Le nom du groupe est un chemin complet.** Zammad imbrique les groupes avec `::` et l'API attend le nom exact : c'est `Support SI RNF::Support SOCLE`, pas `Support SOCLE`. Un nom partiel fait refuser la création du ticket.

Le ticket est créé avec `customer_id: guess:<email>`, qui laisse Zammad créer le demandeur à la volée.

L'article porte `sender: Customer`, qui l'attribue au demandeur et non à l'agent du jeton.

**Ne pas basculer l'article en `type: email` pour préremplir le destinataire d'une réponse.** Essayé : Zammad refuse en 422 `email_recipient — Sending an email without a valid recipient is not possible`, car il valide un destinataire dès que le type est `email`, y compris avec `sender: Customer`. Le faire passer demanderait de renseigner aussi `to` avec l'adresse du support, au risque d'un envoi sortant réel. Les `MAIL_DEST_TECHNIQUE` / `MAIL_DEST_GEOL` ne servent plus : le routage par sujet se fait dans Zammad, pas dans le code.

**Turnstile plutôt que reCAPTCHA** : pas de cookie de pistage, pas de puzzle dans la plupart des cas, conforme au RGPD sans bandeau de consentement. Le widget vit dans `core/components/captcha/`, adapté de celui de `cicada_vitrine`.

**Les clés Turnstile sont liées à des noms d'hôte.** Une clé d'un autre site renvoie l'erreur `110200` (domaine non autorisé) et le widget ne s'affiche pas. En développement, `environment.ts` utilise la paire de test Cloudflare (`1x00000000000000000000AA` côté client, `1x0000000000000000000000000000000AA` côté serveur), qui accepte tout. La production exige un widget Turnstile déclaré pour le domaine de SOCLE.

### Authentification et droits (entièrement côté client)

`AuthService` poste sur `${environment.apiGeoNature}/auth/login` avec `AppConfig.ID_APPLICATION_GEONATURE`, puis stocke dans le **localStorage** : `current_user`, `tk_id_token`, `expires_at` et `rnsUser` (la liste des réserves rattachées à l'utilisateur, obtenue de l'export GeoNature `/exports/api/3`). Les droits viennent de `/exports/api/4` ; ces deux exports exigent `environment.token`.

À connaître avant de toucher à l'auth :
- `authenticated` ne teste que la présence de `current_user` — `expires_at` n'est jamais vérifié côté client ;
- `logout()` ne supprime que `current_user` et laisse `tk_id_token`, `expires_at` et `rnsUser` en place ;
- le login est une **boîte de dialogue Material**, pas une page : `AuthGuardService` l'ouvre et attend sa fermeture, et la route `/login` est gardée par `LazyDialogLoader` qui renvoie toujours `false` (la route n'est jamais activée, seul le dialogue s'ouvre) ;
- autorisation sur une réserve (`RnAuthGuardService`, `hasAccessToRn`) : accès accordé si `id_droit_max === 6` (droit global) **ou** si le `rn_id` figure dans `rnsUser`. Toute erreur réseau sur l'appel des droits refuse l'accès et redirige vers `/non-autorise`.

Le paramètre de route `questionnaire-simplifie/:id_rn` est le `rn_id` GeoNature, qui correspond à la colonne `code` de `site` côté backend — d'où la route `/site/id_local/<id_local>` qui filtre sur `Site.code`. C'est le seul endroit où un site n'est pas adressé par son `slug`.

Les composants métier sont gros et autonomes (`questionnaire-simplifie` ~860 lignes, `synthese-site` ~600, `accueil` ~540) ; les services (`sites`, `nomenclatures`, `parametres`, `contact`) ne sont que des wrappers HTTP sans cache ni state. La logique d'affichage, de carte et de formulaire vit dans les composants.

**Détection de changements.** Angular 22 démarre en zoneless par défaut, mais l'application n'utilise pas les signaux : `app.module.ts` fournit `provideZoneChangeDetection()`. Sans lui, les retours HTTP ne déclenchent plus de rendu et les vues restent vides **sans erreur** — symptôme déroutant, à connaître avant de le retirer. Les composants portent `ChangeDetectionStrategy.Eager`, posé par la migration officielle pour préserver l'ancien comportement.

**TypeScript 6.** `moduleResolution` est en `bundler` : les paquets Angular 22 ne se résolvent pas en `node10`. `baseUrl` est remplacé par `paths` (`src/*`), et `downlevelIteration` supprimé — tous deux refusés par TS 6.

Thème Material : les palettes SOCLE vivent dans `src/styles/_palettes.scss` (partiel sans effet de bord) ; `styles/custom-theme.scss` les consomme pour construire le thème, et les SCSS de composants font `@use 'styles/palettes' as palettes;` puis `palettes.couleur($palette, 500)`. Ne pas ré-importer `custom-theme.scss` depuis un composant : cela réémettrait tout le thème dans chaque feuille.

**La coquille ne se colore pas toute seule.** `core/` style sa navbar, son footer et ses pages d'erreur avec `var(--custom-primary-500)`, une variable CSS que l'application hôte doit déclarer — le thème Sass ne la produit pas. C'est le rôle du mixin `palettes.variables-css`, inclus par `custom-theme.scss`, qui émet `--custom-primary-*` et `--custom-accent-*` sur `:root` à partir des mêmes maps que les palettes. Sans lui la navbar et le pied de page s'affichent sans les couleurs de la plateforme, sans la moindre erreur de compilation.

Cartographie : Leaflet + `Leaflet.Deflate` + proj4/proj4leaflet. Les polygones sont chargés à la demande par emprise (`/sites-dans-bbox?bbox=xmin,ymin,xmax,ymax`, SRID 4326) tandis que les centroïdes de tous les sites sont chargés en une fois (`/sites-simple-centroides`). Exports : `xlsx`, `jspdf`, `html2canvas`/`html-to-image`, `file-saver`.

## Conventions

- Noms de tables, colonnes et champs métier en français ou en anglais selon l'existant — s'aligner sur la table concernée plutôt que d'uniformiser.
- Côté backend, les routes retournent soit `schema.jsonify(...)`, soit un dict `{type, msg}` (`'success'` / `'bug'`) ; conserver cette forme pour les mutations. Les notifications passent par `core/services/notification.service.ts` (MatSnackBar), ngx-toastr ayant été retiré en Angular 22.
- Branche d'intégration : `dev`, fusionnée vers `main` par pull request.
- Licence AGPL-3.0.
