import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router'; // Importer le Router ici
import { SitesService } from 'src/app/services/sites.service';
import { Site } from '../../models/site.model'; // Assurez-vous que le modèle Site est bien importé


interface Stat {
  icon: string;
  iconfill?: string; // `iconfill` est optionnel, donc on utilise `?`
  chiffre: number | string;
  texte: string;
}

@Component({
  selector: 'app-accueil',
  templateUrl: './accueil.component.html',
  styleUrls: ['./accueil.component.scss']
})
export class AccueilComponent implements OnInit {
  // totalSites: number = 0;
  // totalStratotypes: number = 0;
  // totalInpgSites: number = 0;
  // inpgPercentage: number = 0;
  // sitesAvecPatrimoine: number = 0;
  espaces: Site[] = [];
  filteredEspaces: Site[] = [];
  selectedTypeRn: string = '';
  searchQuery: string = '';
  selectedCode: string = '';
  selectedPatrimoine: string = '';
  regions: string[] = ['Normandie', 'Pays de la Loire', 'Corse', 'Provence-Alpes-Côte d\'Azur', 'Grand Est', 'Auvergne-Rhône-Alpes', 'Bretagne', 'Hauts-de-France', 'Occitanie', 'Nouvelle-Aquitaine', 'Bourgogne-Franche-Comté', 'Île-de-France', 'Guyane', 'La Réunion', 'Centre-Val de Loire', 'Guadeloupe', 'Martinique', 'Mayotte'];  // Liste des régions
  selectedRegion: string = '';
  stats: Stat[] = [];

  displayedColumns: string[] = ['nom', 'code', 'type', 'inpg'];
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  dataSource = new MatTableDataSource();

  constructor(
    private siteService: SitesService,
    private router: Router
  ) { }

  ngOnInit(): void {
    // Fetch statistics
    // this.siteService.getSiteCount().subscribe(response => {
    //   this.totalSites = response.total_sites;
    //   if (this.totalSites > 0 && this.totalInpgSites > 0) {
    //     this.inpgPercentage = (this.totalSites / this.totalInpgSites) * 100;
    //   }
    // });

    // this.siteService.getStratotypeCount().subscribe(response => {
    //   this.totalStratotypes = response.total_stratotypes;
    // });

    // this.siteService.getInpgSiteCount().subscribe(response => {
    //   this.totalInpgSites = response.total_inpg_sites;
    //   if (this.totalSites > 0 && this.totalInpgSites > 0) {
    //     this.inpgPercentage = (this.totalSites / this.totalInpgSites) * 100;
    //   }
    // });

    // Fetch the list of sites (espaces) and filter out "perimetre protection"
    this.loadSites();

    // this.siteService.getSitesWithInpg().subscribe(
    //   sites => {
    //     this.espaces = sites.filter(site => !site.nom.toLowerCase().includes('perimetre protection'));
    //     this.filteredEspaces = this.espaces; // Initialement, les sites sont affichés sans filtre
    //   },
    //   error => {
    //     console.error('Error fetching sites with INPG', error);
    //   }
    // );
  }

  loadSites(): void {
    this.siteService.getSites().subscribe(
      data => {
        console.log(data);

        // Filtrage des sites
        this.espaces = data;
        this.filteredEspaces = this.espaces;
        this.dataSource.data = this.filteredEspaces;
        this.dataSource.paginator = this.paginator;

        // Nombre de sites
        var totalSites = this.espaces.length;
        // Nombre de sites INPG
        var totalInpgSites = this.espaces.reduce((total, site) => total + (site.inpg ? site.inpg.length : 0), 0);
        // Calculer le nombre de sites dont inpg.length > 0
        var sitesAvecPatrimoine = this.espaces.filter(site => site.inpg && site.inpg.length > 0).length;
        // Calculer le nombre de sites qui contiennent des stratotypes 
        var sitesAvecStratotype = this.espaces.filter(site => site.infos_base && site.infos_base.reserve_contains_stratotype === true).length;
        // Calculer le nombre de sites créé pour leur patrimoine geol 
        var sitesCreationGeol = this.espaces.filter(site => site.creation_geol === true).length;
        this.stats = [
          {
            icon: 'assets/images/symbol11_final.png',
            chiffre: totalSites,
            texte: 'Nombre total de réserves naturelles, en France métropolitaine et ultramarine'
          },
          {
            icon: 'assets/images/symbol11_prct.png',
            iconfill: 'assets/images/symbol22_final.png',
            chiffre: (sitesAvecPatrimoine / totalSites * 100).toFixed(0) + '%',
            texte: 'Soit la proportion des réserves naturelles qui sont connues pour abriter du patrimoine géologique'
          },
          {
            icon: 'assets/images/IconCG.png',
            chiffre: sitesCreationGeol,
            texte: 'C\'est le nombre de réserves naturelles qui ont été créées en premier lieu pour protéger du patrimoine géologique'
          },
          {
            icon: 'assets/images/INPG.png',
            chiffre: totalInpgSites,
            texte: 'Nombre de sites de l’Inventaire National du Patrimoine Géologique qui sont localisés au moins en partie en réserve naturelle'
          },
          {
            icon: 'assets/images/stratotype.png',
            chiffre: sitesAvecStratotype,
            texte: 'C’est le nombre de stratotypes protégés par des réserves naturelles, c’est-à-dire des affleurements de référence pour les géologues du monde entier'
          }
        ]

      },
      error => {
        console.error('Error fetching sites', error);
      }
    );
  }

  onRowClick(element: any): void {
    this.router.navigate(['/site', element.slug]);  // Utilisation du Router pour naviguer
  }

  handleSearch(event: Event): void {
    const query = (event.target as HTMLInputElement).value.toLowerCase();
    this.searchQuery = query;
    this.applyFilters();
  }

  onTypeRnChange(typeRn: string): void {
    this.selectedTypeRn = typeRn;
    this.applyFilters();
  }

  onCodeChange(event: Event): void {
    this.selectedCode = (event.target as HTMLInputElement).value;
    this.applyFilters();
  }

  onPatrimoineChange(patrimoine: string): void {
    this.selectedPatrimoine = patrimoine;

    // Fetch les sites avec le filtre patrimoine
    this.siteService.getFilteredSites(this.selectedPatrimoine).subscribe(
      sites => {
        // Filtrage des sites qui n'incluent pas "perimetre protection"
        this.espaces = sites.filter(site => !site.nom.toLowerCase().includes('perimetre protection'));

        // Filtrage des sites INPG
        this.filteredEspaces = this.espaces.filter(site => {
          if (this.selectedPatrimoine === 'oui' && !site.id_metier) {
            return true; // Sites avec patrimoine géologique et sans site INPG
          } else if (this.selectedPatrimoine === 'non' && !site.id_metier) {
            return true; // Sites sans patrimoine géologique et sans site INPG
          } else if (this.selectedPatrimoine === '') {
            return true; // Affiche tous les sites sans filtrage
          }
          return true;
        });

        // Ajout du filtrage pour la création de réserves sur le fondement du patrimoine géologique
        if (this.selectedPatrimoine === 'reserve_geologique') {
          this.filteredEspaces = this.espaces.filter(site => {
            console.log(site.reserve_created_on_geological_basis); // Vérifie chaque valeur
            return site.reserve_created_on_geological_basis === true;
          });
        }
      },
      error => {
        console.error('Error fetching filtered sites', error);
      }
    );
  }


  onRegionChange(region: string): void {
    this.selectedRegion = region;
    this.applyFilters();
  }

  applyFilters(): void {
    this.filteredEspaces = this.espaces.filter(site => {
      const matchesTypeRn = this.selectedTypeRn.length > 0
        ? this.selectedTypeRn.includes(site.type_rn)
        : true;

      const matchesRegion = this.selectedRegion.length > 0
        ? this.selectedRegion.includes(site.region)
        : true;

      const matchesSearch = this.searchQuery
        ? site.nom.toLowerCase().includes(this.searchQuery) || site.code.toLowerCase().includes(this.searchQuery)
        : true;

      return matchesTypeRn && matchesRegion && matchesSearch;
    });
  }

  isLastElement(array: any[], element: any): boolean {
    return array.indexOf(element) === array.length - 1;
  }


  getClipPath(percentage: number): string {
    const clipHeight = 100 - percentage;
    return `inset(${clipHeight}% 0 0 0)`;
  }
}

