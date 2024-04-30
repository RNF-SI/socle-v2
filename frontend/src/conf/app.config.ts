export const AppConfig = {
    "ID_APPLICATION_GEONATURE": 5,
    "API_ENDPOINT": "http://127.0.0.1:5088",
    "appName": "Socle2",
    "appTitle": " ",
    "appSubTitle": " ",
    "creditHeaderImage": "Etang du Moulin Neuf, Plounérin - © C. Le Gac",
    "menu": [
        {
            "nom":"accueil", 
            "classFa":"fas" as const,
            "nomFa":"house" as const,
            "lien":""
        },{
            "nom":"explorer", 
            "classFa":"fas" as const,
            "nomFa":"magnifying-glass" as const,
            "lien":"explorer"
        }],

    "menucompte": [
            {
                 "texte":"Déconnexion",
                 "classFa":"fas" as const,
                 "nomFa":"right-from-bracket" as const,
                 "lien":"logout"
             }
         ]
 
     
}