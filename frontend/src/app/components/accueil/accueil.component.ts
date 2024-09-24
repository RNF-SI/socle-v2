import { Component, OnInit } from '@angular/core';
import { SitesService } from 'src/app/services/sites.service';

@Component({
  selector: 'app-accueil',
  templateUrl: './accueil.component.html',
  styleUrls: ['./accueil.component.scss']
})
export class AccueilComponent implements OnInit {
  totalSites: number = 0;  // Variable pour stocker le nombre total de sites sans périmètre de protection
  totalStratotypes: number = 0;  // Pour le nombre de stratotypes
  totalInpgSites: number = 0;  // Pour le nombre de sites INPG
  inpgPercentage: number = 0;  // Pourcentage des sites INPG par rapport aux sites totaux

  constructor(private siteService: SitesService) { }

  ngOnInit(): void {
    // Récupérer le nombre de sites sans périmètre de protection
    this.siteService.getSiteCount().subscribe(response => {
      this.totalSites = response.total_sites;

      // Si les deux données sont disponibles, calculer le pourcentage
      if (this.totalSites > 0 && this.totalInpgSites > 0) {
        this.inpgPercentage = (this.totalSites / this.totalInpgSites) * 100;
      }
    });

    // Récupérer le nombre de stratotypes
    this.siteService.getStratotypeCount().subscribe(response => {
      this.totalStratotypes = response.total_stratotypes;
    });

    // Récupérer le nombre total de sites INPG
    this.siteService.getInpgSiteCount().subscribe(response => {
      this.totalInpgSites = response.total_inpg_sites;

      // Si les deux données sont disponibles, calculer le pourcentage
      if (this.totalSites > 0 && this.totalInpgSites > 0) {
        this.inpgPercentage = (this.totalSites / this.totalInpgSites) * 100;
      }
    });
  }
}
