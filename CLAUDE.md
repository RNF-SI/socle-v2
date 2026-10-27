# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Projet

SOCLE V2 : saisie et consultation des données de géodiversité des réserves naturelles françaises (RNF). Stack GeoNature : Flask 3 + Angular 19 + PostgreSQL/PostGIS. Interface, modèles et commentaires sont en français — garder cette langue pour les libellés, messages d'erreur utilisateur et noms de champs métier.

## Mise en route (obligatoire avant tout développement)

Trois éléments ne sont pas versionnés et doivent exister :

1. **Sous-module frontend** (`frontend/src/app/home-rnf`, dépôt `RNF-SI/home-rnf`) — vide dans un clone frais, mais le routing et `app.module.ts` en dépendent (auth, nav, login, guards) :
   ```bash
   git submodule update --init --recursive
   ```
2. **`backend/config.py`** — copier `backend/config_sample.py` et renseigner la base, UsersHub et le mail.
3. **`frontend/src/environments/environment.ts` et `environment.prod.ts`** — gitignorés, absents du dépôt, mais importés par les services de l'application **et du sous-module**. Les cinq clés effectivement lues dans le code sont :
   - `apiUrl` — backend SOCLE, à aligner sur `API_ENDPOINT` (par défaut `http://127.0.0.1:5068`) ;
   - `apiGeoNature` — instance GeoNature distante, utilisée pour le login et les droits ;
   - `token` — jeton des exports GeoNature (voir ci-dessous), passé en query string ;
   - `id_application` — id SOCLE côté UsersHub (11) ;
   - `captcha_key` — reCAPTCHA du formulaire de contact.

   Un fichier d'environnement incomplet casse l'authentification sans erreur de compilation : vérifier ces cinq clés avant de diagnostiquer un bug de connexion.

La base PostGIS n'est pas décrite dans le dépôt : pas de SQL de création, et `backend/migrations` est gitignoré, donc aucune migration Alembic n'est versionnée. Ne pas supposer qu'un `flask db upgrade` suffit à créer le schéma — il faut une base existante ou un dump.

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

### Frontend — Angular 19, modules eager, un seul NgModule

`app.module.ts` déclare tout (pas de lazy loading). Les composants du projet portent `standalone: false` explicitement : en Angular 19 le défaut est l'inverse, et sans ce drapeau le NgModule refuse de les déclarer (NG6008). Les composants du sous-module, eux, sont standalone et sont importés dans le NgModule. Toutes les routes sont enfants de `NavHomeComponent`, qui vient du sous-module `home-rnf`.

Deux sources de configuration coexistent :
- `src/environments/*.ts` (gitignoré) — les cinq clés listées plus haut, utilisées par les services de l'app et du sous-module.
- `src/conf/app.config.ts` (versionné) pour le paramétrage de la coquille `home-rnf` : titres, menu, recherche, `API_ENDPOINT`, `ID_APPLICATION_GEONATURE`. Les deux dupliquent l'endpoint API et l'id d'application : les tenir synchronisés.

### Le sous-module `home-rnf`

`frontend/src/app/home-rnf` est un dépôt Git distinct (`RNF-SI/home-rnf`), socle partagé entre les applications RNF. **Ne pas y faire d'édition depuis ce dépôt** : un correctif qui le concerne se fait en amont, puis le pointeur de sous-module est mis à jour ici. Il fournit `NavHomeComponent` (coquille, menu, recherche globale), `LoginComponent`, `LogoutComponent`, `ForgotPasswordComponent`, `NotFoundComponent`, `AccessDeniedComponent`, `LoadingSpinnerComponent`, `AuthService`, les guards, `ExcelService`, `RedirectService` et `InputErrorPipe`.

Conventions qu'il impose, visibles dans son `README.md` et son dossier `install_files/` :
- ses dépendances npm (Angular 19, Material, Font Awesome, ng-recaptcha-2, ngx-toastr) sont **recopiées** dans le `package.json` racine, pas installées par lui : son `package.json` fait foi lors d'une montée de version ;
- il n'exporte plus que `LoadingSpinnerComponent` : `FontAwesomeModule` et consorts, autrefois ré-exportés, doivent être importés par `app.module.ts` ;
- `src/conf/` et `src/assets/` de l'application sont partis d'une copie de `install_files/` ; en cas de doute sur un fichier de conf ou un asset attendu, regarder `install_files/` ;
- `src/styles.scss` doit charger `styles/custom-theme.scss` puis `conf/custom.scss`, en `@use` (Material 19 n'expose plus l'API `@import '@angular/material/theming'`) ;
- le `HomeRnfModule` ré-exporte `CommonModule`, `BrowserModule`, `BrowserAnimationsModule`, `AppRoutingModule` et `FontAwesomeModule` : il importe lui-même `AppRoutingModule`, d'où une dépendance croisée avec le routing de l'application.

Le sous-module suit la branche **`angular-19`** (et non `main`, resté en Angular 15). Un `git submodule update` qui le ramènerait sur `main` casserait la compilation.

### Authentification et droits (entièrement côté client)

`AuthService` poste sur `${environment.apiGeoNature}/auth/login` avec `AppConfig.ID_APPLICATION_GEONATURE`, puis stocke dans le **localStorage** : `current_user`, `tk_id_token`, `expires_at` et `rnsUser` (la liste des réserves rattachées à l'utilisateur, obtenue de l'export GeoNature `/exports/api/3`). Les droits viennent de `/exports/api/4` ; ces deux exports exigent `environment.token`.

À connaître avant de toucher à l'auth :
- `authenticated` ne teste que la présence de `current_user` — `expires_at` n'est jamais vérifié côté client ;
- `logout()` ne supprime que `current_user` et laisse `tk_id_token`, `expires_at` et `rnsUser` en place ;
- le login est une **boîte de dialogue Material**, pas une page : `AuthGuardService` l'ouvre et attend sa fermeture, et la route `/login` est gardée par `LazyDialogLoader` qui renvoie toujours `false` (la route n'est jamais activée, seul le dialogue s'ouvre) ;
- autorisation sur une réserve (`RnAuthGuardService`, `hasAccessToRn`) : accès accordé si `id_droit_max === 6` (droit global) **ou** si le `rn_id` figure dans `rnsUser`. Toute erreur réseau sur l'appel des droits refuse l'accès et redirige vers `/non-autorise`.

Le paramètre de route `questionnaire-simplifie/:id_rn` est le `rn_id` GeoNature, qui correspond à la colonne `code` de `site` côté backend — d'où la route `/site/id_local/<id_local>` qui filtre sur `Site.code`. C'est le seul endroit où un site n'est pas adressé par son `slug`.

Les composants métier sont gros et autonomes (`questionnaire-simplifie` ~860 lignes, `synthese-site` ~600, `accueil` ~540) ; les services (`sites`, `nomenclatures`, `parametres`, `contact`) ne sont que des wrappers HTTP sans cache ni state. La logique d'affichage, de carte et de formulaire vit dans les composants.

Thème Material : les palettes SOCLE vivent dans `src/styles/_palettes.scss` (partiel sans effet de bord) ; `styles/custom-theme.scss` les consomme pour construire le thème, et les SCSS de composants font `@use 'styles/palettes' as palettes;` puis `palettes.couleur($palette, 500)`. Ne pas ré-importer `custom-theme.scss` depuis un composant : cela réémettrait tout le thème dans chaque feuille.

**Le sous-module ne se colore pas tout seul.** `home-rnf` style sa navbar, son footer et ses pages d'erreur avec `var(--custom-primary-500)`, une variable CSS que l'application hôte doit déclarer — le thème Sass ne la produit pas. C'est le rôle du mixin `palettes.variables-css`, inclus par `custom-theme.scss`, qui émet `--custom-primary-*` et `--custom-accent-*` sur `:root` à partir des mêmes maps que les palettes. Sans lui le socle s'affiche sans les couleurs de la plateforme, sans la moindre erreur de compilation.

Cartographie : Leaflet + `Leaflet.Deflate` + proj4/proj4leaflet. Les polygones sont chargés à la demande par emprise (`/sites-dans-bbox?bbox=xmin,ymin,xmax,ymax`, SRID 4326) tandis que les centroïdes de tous les sites sont chargés en une fois (`/sites-simple-centroides`). Exports : `xlsx`, `jspdf`, `html2canvas`/`html-to-image`, `file-saver`.

## Conventions

- Noms de tables, colonnes et champs métier en français ou en anglais selon l'existant — s'aligner sur la table concernée plutôt que d'uniformiser.
- Côté backend, les routes retournent soit `schema.jsonify(...)`, soit un dict `{type, msg}` (`'success'` / `'bug'`) consommé par `ngx-toastr` ; conserver cette forme pour les mutations.
- Branche d'intégration : `dev`, fusionnée vers `main` par pull request.
- Licence AGPL-3.0.
