import { Component, OnInit } from "@angular/core";


@Component({
    selector: 'app-liens',
    templateUrl: './liens.component.html',
    styleUrls: ['./liens.component.scss']
})

export class LiensComponent implements OnInit {
    ngOnInit(): void {
        throw new Error("Method not implemented.");
    }

    items = [
        {
            "nom": "Cahier de géologie de RNF",
            "url": "http://www.pearltrees.com/t/geodiversite-patrimoine/cahier-de-geologie-rnf-2015/id29270734",
            "chemin_image": "assets/images/cahier_geol.png",
            "description": "Le document sur lequel se base cette application : un guide méthodologique destiné aux gestionnaires des réserves naturelles et autres espaces naturels."
        },
        {
            "nom": "Portail InfoTerre du BRGM",
            "url": "https://infoterre.brgm.fr/viewer/MainTileForward.do",
            "chemin_image": "https://infoterre.brgm.fr/viewer/style/default/images/logo.png",
            "description": "Un accès aux données scientifiques et techniques sur la géologie en France : visualisation cartographique..."
        },
        {
            "nom": "Inventaire National du Patrimoine Géologique",
            "url": "https://inpn.mnhn.fr/programme/patrimoine-geologique/presentation",
            "chemin_image": "https://inpn.mnhn.fr/css/images_template/logo_inpn.png",
            "description": "Présentation de la démarche nationale d'inventaire du patrimoine géologique.<br>Pour explorer les données : <br><a href=\"https://inpn.mnhn.fr/site/inpg/recherche\" class=\"link-spacing\">&#x2794; Consulter les fiches</a><br><a href=\"https://inpn.mnhn.fr/telechargement/cartes-et-information-geographique/inpg/inpg\" class=\"link-spacing\">&#x2794; Télécharger les données SIG</a>"
        },
        {
            "nom": "Geodiversite.net : exploration du monde des cailloux",
            "url": "https://www.geodiversite.net/",
            "chemin_image": "https://www.geodiversite.net/local/cache-vignettes/L300xH55/siteon0-e5814.png",
            "description": "Une application participative qui recense les particularités géologiques."
        },
        {
            "nom": "PaleoBioDB : Base de données sur la paléobiologie",
            "url": "https://paleobiodb.org/#/",
            "chemin_image": "https://paleobiodb.org/favicon.ico",
            "description": "Base de données internationale sur la paléontologie et les fossiles."
        },
        {
            "nom": "Dépliant Géodiversité, au coeur de la nature",
            "url": "http://www.pearltrees.com/t/geodiversite-patrimoine/depliant-geodiversite-2020/id61768287",
            "chemin_image": "assets/images/depliant-geo.png",
            "description": "Le dépliant Géodiversité, au coeur de la nature propose d'illustrer les liens existant entre géologie,<br>milieux naturels et activités humaines à partir d'exemples issus du réseau RNF autour d'un bloc diagramme dessiné.<br>Il permet aussi de comprendre les notions de géodiversité et de patrimoine géologique, ainsi que l'enjeu de conservation que ce dernier représente."
        },
        {
            "nom": "Portrait patrimoine géologique des RN 2024",
            "url": "http://www.pearltrees.com/t/geodiversite-patrimoine/portrait-patrimoine-geologique/id77062054",
            "chemin_image": "assets/images/portrait-PG.png",
            "description": "Le portrait du patrimoine géologique des réserves naturelles fournit, sous la forme de chiffres, de textes et de cartes réunies dans un dépliant, des informations générales sur la nature et la diversité du géopatrimoine abrité par les RN à l'échelle nationale. Ce portrait, établi selon l'état des connaissances début 2024, est amené à être actualisé et réédité régulièrement."
        },
        {
            "nom": "VigieTerre",
            "url": "https://www.vigie-terre.org/",
            "chemin_image": "https://www.vigie-terre.org/images/logo.dab84d05.svg",
            "description": "Vigie terre : Un programme de sciences participatives sur la diversité géologique"
        },
        {
            "nom": "Visualiseur cartographique de l'INPN",
            "url": "https://inpn.mnhn.fr/viewer-carto/espaces/",
            "chemin_image": "assets/images/inpn_viewer.png",
            "description": "Vous permet d'afficher facilement sur une même carte les sites (non confidentiels) de l'INPG et les différentes aires protégées et autres zonages, avec un renvoi aux fiches INPN correspondantes."
        }
    ]


    goToUrl(url: string): void {
        window.open(url, '_blank');
    }

}