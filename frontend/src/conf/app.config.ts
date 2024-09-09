export const AppConfig = {
    "ID_APPLICATION_GEONATURE": 5,
    "API_ENDPOINT": "http://127.0.0.1:5068",
    "appName": "Socle2",
    "appTitle": " SOCLE",
    "appSubTitle": " Base de donnée de la géodiversité des réserves",
    "creditHeaderImage": "Bouches de Bonifacio - © Olivier Bonnenfant, OEC",
    "menu": [
        {
            "nom":"accueil", 
            "classFa":"fas" as const,
            "nomFa":"house" as const,
            "lien":""
        }
        ,{
            "nom":"saisir", 
            "classFa":"fas" as const,
            "nomFa":"magnifying-glass" as const,
            "lien":"saisir"
        },{
            "nom":"explorer", 
            "classFa":"fas" as const,
            "nomFa":"magnifying-glass" as const,
            "lien":"explorer"
        },
        {
            "nom":"A propos", 
            "classFa":"fas" as const,
            "nomFa":"magnifying-glass" as const,
            "lien":"A propos"
        },
        {
            "nom":"Contacts", 
            "classFa":"fas" as const,
            "nomFa":"magnifying-glass" as const,
            "lien":"Contacts"
        },
        {
            "nom":"aide", 
            "classFa":"fas" as const,
            "nomFa":"magnifying-glass" as const,
            "lien":"aide"
        },
       
       
    ],

    "menucompte": [
            {
                 "texte":"Déconnexion",
                 "classFa":"fas" as const,
                 "nomFa":"right-from-bracket" as const,
                 "lien":"logout"
             },
          
        ],
         
}