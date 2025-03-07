import { Component } from "@angular/core";


@Component({
    selector: 'app-aide',
    templateUrl: './aide.component.html',
    styleUrls: ['./aide.component.scss']
})

export class AideComponent {

    sections = [
        {
            "titre": "COMMENT ACCÉDER AU MODE ÉDITION ?",
            "contenu": "<p>Vous pouvez librement consulter les données enregistrées dans Socle, soit par réserve (<span class=\"texte-highlight\">chaque RN dispose de sa fiche accessible en passant par la page d’accueil ou la barre de recherche</span>), soit sous forme de synthèse et chiffres-clés en page d’accueil.</p>\n<p>Mais pour pouvoir entrer des données dans Socle, vous devez au préalable vous créer un compte dans le système d’information de RNF, si ce n’est déjà fait. Pas de panique, c’est très rapide et vous aurez un identifiant unique pour toutes les plateformes RNF. Avec ce compte, vous aurez accès en édition à la ou aux RN dont vous avez la responsabilité.</p>\n<p><strong>Cliquez sur ce bouton pour vous connecter</strong></p>\n<p><img src=\"assets/images/aide/bouton-connexion.png\" alt=\"Bouton de connexion\"></p>\n<p>Ensuite, rendez-vous sur la page de la RN que vous souhaitez modifier et cliquez sur <strong>éditer les informations</strong>.</p>\n<p>Pour accéder facilement à la liste des RN pour lesquelles vous avez les droits d’édition, passez par le menu <span class=\"texte-highlight\">« Saisir »</span> du bandeau.</p>\n<p>Pensez à enregistrer vos modifications avant de fermer la page, à l’aide du bouton à la fin du questionnaire.</p>\n<p>Les liens suivants renvoient à la page d’inscription : <a class=\"lien-cliquable\" href=\"https://plateformes.reserves-naturelles.org/inscription\" target=\"_blank\">https://plateformes.reserves-naturelles.org/inscription</a></p>"
        },
        {
            "titre": "POURQUOI CERTAINES INFORMATIONS SONT-ELLES DÉJÀ RENSEIGNÉES ?",
            "contenu": "<p>Pour vous aider et faciliter le remplissage, certaines données sont récupérées automatiquement, comme la présence ou non de sites de l’Inventaire National du Patrimoine Géologique (<span class=\"texte-highlight\">INPG</span>) connue d’après les données cartographiques de PatriNat.</p>\n<p>Cependant, si vous considérez qu’un site INPG indiqué comme associé à la RN n’est pas pertinent par rapport aux enjeux de gestion, vous pouvez choisir de le décocher.</p>\n<p>Pour cela, cliquez sur le bouton ci-dessous, placé au bout de la ligne du site INPG concerné :</p>\n<p><img src=\"assets/images/aide/bouton-inpg.png\" alt=\"Bouton INPG\"></p>\n<p>Il vous sera demandé de justifier votre choix, afin de conserver une trace de la raison pour laquelle la donnée a été retirée.</p>\n<p>Vous pouvez cliquer sur le nom d’un site INPG pour accéder à la fiche correspondante, publiée par PatriNat, qui vous sera très utile pour votre plan de gestion.</p>\n<p>Le nombre d’étoiles correspond à l’indice de patrimonialité selon la nomenclature de l’INPG et le terme figurant après le nom du site correspond à l’intérêt géologique principal.</p>"
        },
        {
            "titre": "QU’EST-CE QUE LA FONCTION AJOUTER UN PATRIMOINE GÉOLOGIQUE ?",
            "contenu": "<p>Au début du questionnaire, sous les informations automatiquement récupérées depuis l’INPG, vous trouverez un bouton.</p>\n<p><strong>Ce bouton permet d’indiquer un patrimoine géologique que vous connaissez dans la RN et qui n’est pas listé dans l’INPG.</strong></p>\n<p>Vous aurez quelques informations de base à donner sur ce patrimoine :</p>\n<ul>\n  <li>Libellé (nom attribué à ce patrimoine)</li>\n  <li>Intérêt géologique principal (liste déroulante basée sur la nomenclature de l’INPG)</li>\n  <li>Bibliographie (préciser les références biblio qui établissent l’intérêt patrimonial)</li>\n</ul>\n<p>Vous pouvez également préciser l’âge des terrains associés à ce patrimoine géologique.</p>\n<p><img src=\"assets/images/aide/bouton-ajouter.png\" alt=\"Bouton Ajouter Patrimoine\"></p>"
        },
        {
            "titre": "EN CAS DE QUESTION SUR LE PATRIMOINE GÉOLOGIQUE",
            "contenu": "<p>Chaque région dispose d’une Commission Régionale du Patrimoine Géologique (<span class=\"texte-highlight\">CRPG</span>), groupement d’experts rattaché au Conseil Scientifique Régional du Patrimoine Naturel (<span class=\"texte-highlight\">CSRPN</span>). La CRPG est référente sur les questions de patrimoine géologique à cette échelle de territoire. En cas de besoin, vous pouvez la solliciter en passant par la DREAL (ou équivalent).</p>\n<p>Si vous avez un ou des sites INPG confidentiels dans votre RN ou à proximité, adressez-vous à votre CRPG pour récupérer les informations correspondantes, que vous ne pourrez pas trouver sur le site de l’INPN.</p>\n<p>Le réseau RNF dispose aussi d’une commission patrimoine géologique que vous pouvez solliciter en passant par l’équipe RNF (contact : Corentin GUINAULT, chargé de projet géodiversité et animateur de la commission, <a class=\"lien-cliquable\" href=\"mailto:corentin.guinault@rnfrance.org\">corentin.guinault@rnfrance.org</a>) ou par le portail RNF.</p>\n<p>Pour plus d’informations, consultez également : <a class=\"lien-cliquable\" href=\"https://www.portail.reserves-naturelles.org/page/1295662-commission-pg-gouvernance\" target=\"_blank\">Commission Patrimoine Géologique</a></p>"
        },
        {
            "titre": "C’EST QUOI UN STRATOTYPE ?",
            "contenu": "<p>Si vous avez des difficultés pour répondre à cette question, sachez qu’un stratotype est un affleurement qui sert de référence à l’échelle mondiale pour caractériser un intervalle des temps géologiques.</p>\n<p>Donc, si votre RN abritait un stratotype, il ferait nécessairement partie des sites INPG listés automatiquement par Socle.</p>"
        },
        {
            "titre": "LA BIBLIOGRAPHIE",
            "contenu": "<p>En fin de questionnaire, un champ texte vous est proposé pour lister les sources utilisées pour répondre aux questions.</p>\n<p>C’est indispensable pour qu’un autre utilisateur puisse plus tard comprendre d’où viennent vos réponses. Soyez aussi précis que possible pour que les données associées à votre RN soient bien vérifiables et retrouvables.</p>"
        },
        {
            "titre": "LA CARTE DE LA FICHE DE SYNTHÈSE",
            "contenu": "<p>Chaque RN dispose d’une fiche synthétique qui récapitule toutes les données enregistrées dans Socle et qui comporte également une carte.</p>\n<p>Le fond de carte affiché peut être, au choix, la carte générale OpenStreetMap ou la carte géologique. Pour passer de l’une à l’autre, cliquez sur le bouton en haut à droite de la carte.</p>\n<p>La carte géologique est celle imprimée au 1/50000 du BRGM. Il s’agit donc d’un assemblage de cartes et votre RN peut se trouver au niveau de plusieurs d’entre elles.</p>\n<p>Pour connaître la ou les cartes géologiques qui vous concernent et récupérer la légende et la notice associées, utilisez le visualiseur du BRGM nommé <a class=\"lien-cliquable\" href=\"http://infoterre.brgm.fr/viewer/MainTileForward.do\" target=\"_blank\">InfoTerre</a>.</p>\n<p>Sur la fiche synthétique de Socle figurent aussi les sites INPG. Une distinction est faite entre les sites INPG publics et les sites INPG confidentiels, ces derniers n’apparaissant que si vous avez les droits d’édition sur la page.</p>\n<p>Vous pouvez choisir d’afficher ou non tous ces périmètres, toujours avec le bouton en haut à droite de la carte.</p>\n<p><img src=\"assets/images/aide/carte.png\" alt=\"Image de la carte\"></p>"
        }
    ];

}