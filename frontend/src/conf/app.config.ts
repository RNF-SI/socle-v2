export const AppConfig = {
    "ID_APPLICATION_GEONATURE": 11,
    "API_ENDPOINT": "http://127.0.0.1:5068",
    "SEARCH_INPUT": true,
    "SEARCH_ITEMS_ROUTE": "/sites-simple-centroides",
    "SEARCH_PREFIXE": "/site",
    "SEARCH_PLACEHOLDER": "Rechercher une réserve...",
    "appName": "Socle2",
    "appTitle": " SOCLE",
    "appSubTitle": " Base de données de la géodiversité des réserves naturelles",
    "creditHeaderImage": "Bouches de Bonifacio - © Olivier Bonnenfant, OEC",
    "menu": [
        {
            "nom": "accueil",
            "classFa": "fas" as const,
            "nomFa": "house" as const,
            "lien": ""
        },
        {
            "nom": "saisir",
            "classFa": "fas" as const,
            "nomFa": "pen" as const,
            "lien": "saisir"  // Pas d'icône ici
        },

        {
            "nom": "A propos",
            "classFa": "fas" as const,
            "nomFa": "circle-info" as const,
            "lien": "A propos"  // Pas d'icône ici
        },
        {
            "nom": "Contacts",
            "classFa": "fas" as const,
            "nomFa": "envelope" as const,
            "lien": "contacts"  // Pas d'icône ici
        },
        {
            "nom": "aide",
            "classFa": "fas" as const,
            "nomFa": "circle-question" as const,
            "lien": "aide"  // Pas d'icône ici
        }
    ],
    "menucompte": [
        {
            "texte": "Déconnexion",
            "classFa": "fas" as const,
            "nomFa": "right-from-bracket" as const,
            "lien": "logout"
        }
    ]
}
