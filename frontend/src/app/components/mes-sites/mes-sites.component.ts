import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDatepickerInputEvent } from '@angular/material/datepicker';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/home-rnf/services/auth-service.service';
import { SitesService } from 'src/app/services/sites.service';
import { environment } from 'src/environments/environment';
import { Site } from '../../models/site.model';

@Component({
  selector: 'app-mes-sites',
  templateUrl: './mes-sites.component.html',
  styleUrls: ['./mes-sites.component.scss']
})
export class MessitesComponent implements OnInit {
  espaces: Site[] = [];
  filteredEspaces: Site[] = [];
  selectedDate: Date | null = null;
  searchQuery: string = "";
  selectedStartDate: Date | null = null;
  selectedEndDate: Date | null = null;
  // Valeurs en pourcentage
  completionMin: number = 0;
  completionMax: number = 100;

  displayedColumns: string[] = ['nom', 'code', 'type'];
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  dataSource = new MatTableDataSource();

  panelOpenState = false;

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
        this.sitesService.getSitesPourAdmin().subscribe(
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

  // Méthode appelée lors de la saisie du nom
  // Méthode appelée lors de la saisie du nom
  handleSearch(event: Event): void {
    this.searchQuery = (event.target as HTMLInputElement).value.toLowerCase();
    this.applyFilters();
  }

  // Méthode appelée lors de la sélection de la date de début
  handleStartDate(event: MatDatepickerInputEvent<Date>): void {
    this.selectedStartDate = event.value;
    this.applyFilters();
  }

  // Méthode appelée lors de la sélection de la date de fin
  handleEndDate(event: MatDatepickerInputEvent<Date>): void {
    this.selectedEndDate = event.value;
    this.applyFilters();
  }

  // Méthode commune qui applique tous les filtres
  applyFilters(): void {
    this.filteredEspaces = this.espaces.filter(ep => {
      // Filtrage par nom
      const matchesQuery = ep.nom.toLowerCase().includes(this.searchQuery);

      // Filtrage par intervalle de dates pour la dernière modification
      let matchesDate = true;
      if (this.selectedStartDate || this.selectedEndDate) {
        if (!ep.modifications || ep.modifications.length === 0) {
          matchesDate = false;
        } else {
          // On considère que la première modification est la plus récente
          const lastModificationDate = new Date(ep.modifications[0].date_update);
          if (this.selectedStartDate && lastModificationDate < this.selectedStartDate) {
            matchesDate = false;
          }
          if (this.selectedEndDate && lastModificationDate > this.selectedEndDate) {
            matchesDate = false;
          }
        }
      }

      // Filtrage par taux de complétion (conversion en pourcentage)
      const completionRate = ep.completion * 100;
      const matchesCompletion = completionRate >= this.completionMin && completionRate <= this.completionMax;

      return matchesQuery && matchesDate && matchesCompletion;
    });

    // Par exemple, si vous utilisez un dataSource pour un table, mettez-le à jour :
    // this.dataSource.data = this.filteredEspaces;
  }



  onRowClick(element: any): void {
    this.router.navigate(['/site', element.slug]);  // Utilisation du Router pour naviguer
  }
}
