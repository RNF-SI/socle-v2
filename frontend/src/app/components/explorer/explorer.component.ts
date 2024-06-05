import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SitesService } from 'src/app/services/sites.service';

interface Espace {
  id: number;
  nom: string;
  slug: string;
}

@Component({
  selector: 'app-explorer',
  templateUrl: './explorer.component.html',
  styleUrls: ['./explorer.component.scss']
})
export class ExplorerComponent implements OnInit {
  espaces: Espace[] = [
    { id: 1, nom: 'Aiguilles Rouges', slug: 'aiguilles-rouges' },
    { id: 2, nom: 'Anciennes carrières d\'Orival', slug: 'anciennes-carrieres-dorival' },
    { id: 3, nom: 'Anciennes carrières de Cléty', slug: 'anciennes-carrieres-de-clety' },
    { id: 4, nom: 'Arjuzanx', slug: 'arjuzanx' },
    { id: 5, nom: 'Astroblème de Rochechouart-Chassenon', slug: 'astrobleme-de-rochechouart-chassenon' },
    { id: 6, nom: 'Baie de l\'Aiguillon (Charente-Maritime)', slug: 'baie-de-laiguillon-charente-maritime' },
    { id: 7, nom: 'Bois du Parc', slug: 'bois-du-parc' },
    { id: 8, nom: 'Carlaveyron', slug: 'carlaveyron' },
    { id: 9, nom: 'Casse de la Belle Henriette', slug: 'casse-de-la-belle-henriette' },
    { id: 10, nom: 'Chérine', slug: 'cherine' },
    { id: 11, nom: 'Contamines-Montjoie', slug: 'contamines-montjoie' },
    { id: 12, nom: 'Coteaux de la Seine', slug: 'coteaux-de-la-seine' },
    { id: 13, nom: 'Coteaux du Pont-Barré', slug: 'coteaux-du-pont-barre' },
    // Add more spaces here
  ];
  

  filteredEspaces: Espace[] = this.espaces;

  constructor(
    private router: Router,
    private _sitesService: SitesService
) { }

public sites = [];

  ngOnInit(): void {
     
  }

  goToEspaceDetail(slug: string): void {
    this.router.navigate(['/espace', slug]);
  }

  handleSearch(event: Event): void {
    event.preventDefault();
    const query = (event.target as HTMLInputElement).value.toLowerCase();
    this.filteredEspaces = this.espaces.filter(ep => ep.nom.toLowerCase().includes(query));
  }
}
