import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

interface Espace {
  id: number;
  nom: string;
}

@Component({
  selector: 'app-espace-detail',
  templateUrl: './espace-detail.component.html',
  styleUrls: ['./espace-detail.component.css']
})
export class EspaceDetailComponent implements OnInit {
  espace: Espace | undefined;
  espaces: Espace[] = [
    { id: 1, nom: 'Aiguilles Rouges' },
    { id: 2, nom: 'Anciennes carrières d\'Orival' },
    { id: 3, nom: 'Anciennes carrières de Cléty' },
    { id: 4, nom: 'Arjuzanx' },
    { id: 5, nom: 'Astroblème de Rochechouart-Chassenon' },
    { id: 6, nom: 'Baie de l\'Aiguillon (Charente-Maritime)' },
    { id: 7, nom: 'Bois du Parc' },
    { id: 8, nom: 'Carlaveyron' },
    { id: 9, nom: 'Casse de la Belle Henriette' },
    { id: 10, nom: 'Chérine' },
    { id: 11, nom: 'Contamines-Montjoie' },
    { id: 12, nom: 'Coteaux de la Seine' },
    { id: 13, nom: 'Coteaux du Pont-Barré' },
    { id: 14, nom: 'Côte de Mancy' },
    { id: 15, nom: 'Dunes et marais d\'Hourtin' },
    { id: 16, nom: 'Errota Handia' },
    { id: 17, nom: 'Falaise du Cap Romain' },
    { id: 18, nom: 'Forteresse de Mimoyecques' },
    { id: 19, nom: 'Forêt de la Massane' },
    { id: 20, nom: 'Frankenthal-Missheimle' },
    { id: 21, nom: 'François Le Bail (Île de Groix)' },
    { id: 22, nom: 'Gorges de Daluis' },
    { id: 23, nom: 'Gorges de l\'Ardèche' },
    { id: 24, nom: 'Gorges du Gardon' },
    { id: 25, nom: 'Grotte du T.M. 71' },
    { id: 26, nom: 'Géologique de Normandie-Maine' },
    { id: 27, nom: 'Géologique de Pontlevoy' },
    { id: 28, nom: 'Géologique de Saucats et La Brède' },
    { id: 29, nom: 'Géologique du Luberon' },
    { id: 30, nom: 'Hauts de Chartreuse' },
    { id: 31, nom: 'Hauts de Villaroger' },
    { id: 32, nom: 'Hauts plateaux du Vercors' },
    { id: 33, nom: 'Hettange-Grande' },
    { id: 34, nom: 'Intérêt géologique du département du Lot' },
    { id: 35, nom: 'La Désirade' },
    { id: 36, nom: 'Lac Luitel' },
    { id: 37, nom: 'Les Sauvages' },
    { id: 38, nom: 'Marais communal de Saint-Denis-du-Payré - Michel Brosselin' },
    { id: 39, nom: 'Marais d\'Yves' },
    { id: 40, nom: 'Marais de Müllembourg' },
    { id: 41, nom: 'Marais de la Vacherie' },
    { id: 42, nom: 'Mare de Vauville' },
    { id: 43, nom: 'Massif de Saint-Barthélémy' },
    { id: 44, nom: 'Molinet' },
    { id: 45, nom: 'Moëze-Oléron' },
    { id: 46, nom: 'Parc naturel régional du Vercors' },
    { id: 47, nom: 'Passy' },
    { id: 48, nom: 'Pierriers de Normandie' },
    { id: 49, nom: 'Plaine des Maures' },
    { id: 50, nom: 'Ravin de Valbois' },
    { id: 51, nom: 'Ristolas - Mont-Viso' },
    { id: 52, nom: 'Roc de Chère' },
    { id: 53, nom: 'Récif fossile de Marchon - Christian Gourrat' },
    { id: 54, nom: 'Réseau des landes et tourbières atlantiques du Parc Naturel Régional du Périgord-Limousin' },
    { id: 55, nom: 'Réserve géologique de Haute-Provence' },
    { id: 56, nom: 'Sainte-Lucie' },
    { id: 57, nom: 'Sainte-Victoire' },
    { id: 58, nom: 'Sept-Iles' },
    { id: 59, nom: 'Site des carrières de Tercis-les-Bains' },
    { id: 60, nom: 'Site géologique de Limay' },
    { id: 61, nom: 'Site géologique de Vigny-Longuesse' },
    { id: 62, nom: 'Sites d\'intérêt géologique de la presqu\'île de Crozon' },
    { id: 63, nom: 'Sites géologiques de l\'Essonne' },
    { id: 64, nom: 'Toarcien' },
    { id: 65, nom: 'Tourbière des Dauges' },
    { id: 66, nom: 'Tourbière des Saisies - Beaufortain - Val d\'Arly' },
    { id: 67, nom: 'Val-Suzon' },
    { id: 68, nom: 'Vallon de Bérard' },
    { id: 69, nom: 'Vallées de la Grand-Pierre et de Vitain' },
    { id: 70, nom: 'Vireux-Molhain' }
  ];
    router: any;

  constructor(private route: ActivatedRoute) { }

  ngOnInit(): void {
    const id = +this.route.snapshot.paramMap.get('id')!;
    this.espace = this.espaces.find(ep => ep.id === id);
  }
  goToEspaceDetail(id: number): void {
    this.router.navigate(['fiche-terrain/',id]);
  }
  goToMiniQuest(id: number): void {
    this.router.navigate(['mini-quest/',id]);
  }
}
