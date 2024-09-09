import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SitesService } from 'src/app/services/sites.service';
import { Site } from '../../models/site.model';

@Component({
  selector: 'app-saisir',
  templateUrl: './saisir.component.html',
  styleUrls: ['./saisir.component.scss']
})
export class SaisirComponent implements OnInit {
  espaces: Site[] = [];
  filteredEspaces: Site[] = [];

  constructor(
    private router: Router,
    private sitesService: SitesService
  ) { }

  ngOnInit(): void {
    this.sitesService.getSites().subscribe(
      sites => {
        // Filtrer les sites pour exclure ceux avec "perimetre protection" dans le nom
        this.espaces = sites.filter(site => !site.nom.toLowerCase().includes('perimetre protection'));
        this.filteredEspaces = this.espaces;
      },
      error => {
        console.error('Error fetching sites', error);
      }
    );
  }

  goToEspaceDetail(slug: string): void {
    this.router.navigate(['/t_infos_base_site', slug]) 
  }

  handleSearch(event: Event): void {
    const query = (event.target as HTMLInputElement).value.toLowerCase();
    this.filteredEspaces = this.espaces.filter(ep => ep.nom.toLowerCase().includes(query));
  }
}
