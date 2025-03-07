import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SitesService } from 'src/app/services/sites.service';
import { Site } from '../../models/site.model';

@Component({
  selector: 'app-explorer',
  templateUrl: './explorer.component.html',
  styleUrls: ['./explorer.component.scss']
})
export class ExplorerComponent implements OnInit {
  espaces: Site[] = [];
  filteredEspaces: Site[] = [];

  constructor(
    private router: Router,
    private sitesService: SitesService
  ) { }

  ngOnInit(): void {
    this.sitesService.getSitesCentroid().subscribe(
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
    this.router.navigate(['/site', slug]);
  }

  handleSearch(event: Event): void {
    const query = (event.target as HTMLInputElement).value.toLowerCase();
    this.filteredEspaces = this.espaces.filter(ep => ep.nom.toLowerCase().includes(query));
  }
}
