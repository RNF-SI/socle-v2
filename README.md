# SOCLE V2

SOCLE 2 est la refonte de l'application de saisie de données géologiques des réserves naturelles. 

## Fonctionnalités

- **Système d'authentification**: Connexion sécurisée rattachée à UsersHub, le gestionnaire d'utilisateurs de GeoNature
- **Centralisation**: Retrouvez les données de sources externes comme l'INPG
- **Saisie**: Saisissez les données de votre réserve, dans un format simplifié et compréhensible pour les novices en géologie
- **Exploration**: Consultez les données des différentes réserves 

## Détails techniques

SOCLE 2 est construit avec les technologies de l'ecosystème GeoNature:

- **Flask**: Framework Backend basé sur le langage python
- **Angular**: Framework Frontend en TypeScript
- **PostgreSQL**: Base de données 

## Suivi des dépendances (SBOM)

Les dépendances de SOCLE sont inventoriées au format CycloneDX et suivies dans le
[Dependency-Track de RNF](https://dependencytrack.reserves-naturelles.org), qui
remonte les vulnérabilités connues des bibliothèques utilisées.

L'envoi est automatique à la **publication d'une release** GitHub
(`.github/workflows/sbom.yml`) : on inventorie ce qui est publié, pas chaque
commit. Deux projets sont alimentés, `socle-v2-backend` (pip) et
`socle-v2-frontend` (npm, hors dépendances de développement).

Pour régénérer les SBOM à la main, dans `sbom/` :

```bash
./scripts/generate-sbom.sh              # génère seulement
./scripts/generate-sbom.sh --envoi      # génère puis envoie
./scripts/generate-sbom.sh --avec-dev   # inclut les dépendances npm de dev
```

L'envoi depuis un poste demande une clé d'API dans
`~/.config/dependency-track/api.key` (mode 600) ; en CI elle vient du secret
`DT_API_KEY`.

Deux notions de version cohabitent, qu'on confond vite :

| Variable | Défaut | Rôle |
|---|---|---|
| `DT_VERSION` | `prod` | version des projets Dependency-Track — **fixe**, c'est l'environnement déployé |
| `APP_VERSION` | dernier tag Git | version applicative inscrite dans les SBOM |

`DT_VERSION` reste volontairement fixe : une version de projet par release
créerait deux projets neufs à chaque publication, à re-tagger et re-rattacher à
la main. Le numéro de release est tracé par le composant racine du SBOM.

## Déploiement

La procédure de mise en production est décrite dans
[`DEPLOIEMENT.md`](./DEPLOIEMENT.md) : prérequis du serveur, reconstruction du
venv, clés de configuration, et surtout le traitement des migrations Alembic sur
une base déjà peuplée — la baseline doit être *stampée*, pas jouée.

## Licence

Ce projet est sous licence **GNU Affero General Public License v3 (AGPL-3.0)**. Cela signifie que :

- Vous pouvez utiliser, modifier et distribuer ce logiciel librement, à condition de respecter les termes de la licence.
- Si vous modifiez et déployez ce logiciel sur un serveur accessible publiquement, vous devez fournir le code source de votre version modifiée.
- Il n'y a aucune garantie, explicite ou implicite, concernant ce logiciel.

Pour plus de détails, consultez le fichier [`LICENSE`](./LICENSE) ou la page officielle de la licence : [GNU AGPL-3.0](https://www.gnu.org/licenses/agpl-3.0.html).

## Contact

si@rnfrance.org