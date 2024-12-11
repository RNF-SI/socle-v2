import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/home-rnf/services/auth-service.service';
import { SitesService } from 'src/app/services/sites.service';
import { environment } from 'src/environments/environment';
import { Site } from '../../models/site.model';

@Component({
  selector: 'app-saisir',
  templateUrl: './saisir.component.html',
  styleUrls: ['./saisir.component.scss']
})
export class SaisirComponent implements OnInit {
  espaces: Site[] = [];
  filteredEspaces: Site[] = [];

  displayedColumns: string[] = ['nom', 'code', 'type'];
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  dataSource = new MatTableDataSource();

  constructor(
    private router: Router,
    private sitesService: SitesService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    const currentUser = this.authService.getCurrentUser();

    if (!currentUser) {
      console.error('No current user found');
      return;
    }

    // Vérifier les droits d'accès
    this.authService.getRulesByUserAndApplication(currentUser.id_role, environment.id_application).subscribe(
      result => {
        const hasGlobalAccess = result.items[0]?.id_droit_max === 6;

        // Charger les sites en fonction des droits
        this.sitesService.getSitesCentroid().subscribe(
          sites => {
            if (hasGlobalAccess) {
              // Si l'utilisateur a un accès global, charger tous les sites
              this.espaces = sites;
            } else {
              // Sinon, filtrer les sites par getRnsUser
              const userRns = this.authService.getRnsUser();
              const rnIds = userRns.map((rn: { rn_id: string }) => rn.rn_id); // Extraire les rn_id
              this.espaces = sites.filter((site: { code: string }) => rnIds.includes(site.code));
            }

            // Appliquer un filtre supplémentaire si nécessaire
            this.filteredEspaces = this.espaces



            this.dataSource.data = this.filteredEspaces;
            this.dataSource.paginator = this.paginator;
          },
          error => {
            console.error('Error fetching sites', error);
          }
        );
      },
      error => {
        console.error('Error fetching user rules', error);
      }
    );
  }


  goToEspaceDetail(slug: string): void {
    this.router.navigate(['/t_infos_base_site', slug])
  }

  handleSearch(event: Event): void {
    const query = (event.target as HTMLInputElement).value.toLowerCase();
    this.filteredEspaces = this.espaces.filter(ep => ep.nom.toLowerCase().includes(query));
    this.dataSource.data = this.filteredEspaces;
    this.dataSource.paginator = this.paginator;
  }

  onRowClick(element: any): void {
    this.router.navigate(['/site', element.slug]);  // Utilisation du Router pour naviguer
  }
}
