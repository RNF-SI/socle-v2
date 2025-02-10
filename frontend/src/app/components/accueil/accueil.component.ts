import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import * as L from 'leaflet';
// import 'Leaflet.Deflate';
import { SitesService } from 'src/app/services/sites.service';
import { Site } from '../../models/site.model';

L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'assets/images/leaflet/marker-icon-2x.png',
  iconUrl: 'assets/images/leaflet/marker-icon.png',
  shadowUrl: 'assets/images/leaflet/marker-shadow.png',
});

interface Stat {
  icon: string;
  iconfill?: string;
  chiffre: number | string;
  texte: string;
}

@Component({
  selector: 'app-accueil',
  templateUrl: './accueil.component.html',
  styleUrls: ['./accueil.component.scss']
})
export class AccueilComponent implements OnInit {
  espaces: Site[] = [];
  filteredEspaces: Site[] = [];
  selectedTypeRn: string = '';
  searchQuery: string = '';
  selectedCode: string = '';
  selectedPatrimoine: string = '';
  regions: string[] = ['Normandie', 'Pays de la Loire', 'Corse', 'Provence-Alpes-Côte d\'Azur', 'Grand Est', 'Auvergne-Rhône-Alpes', 'Bretagne', 'Hauts-de-France', 'Occitanie', 'Nouvelle-Aquitaine', 'Bourgogne-Franche-Comté', 'Île-de-France', 'Guyane', 'La Réunion', 'Centre-Val de Loire', 'Guadeloupe', 'Martinique', 'Mayotte'];
  selectedRegion: string = '';
  stats: Stat[] = [];

  displayedColumns: string[] = ['nom', 'code', 'type', 'inpg'];
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  dataSource = new MatTableDataSource();

  private map: L.Map | undefined;
  private centroidesLayer: L.LayerGroup | undefined;
  private polygonesLayer: L.FeatureGroup = L.featureGroup();  // Utilisez FeatureGroup au lieu de LayerGroup
  geoJson: any;
  accentColor: any;

  constructor(
    private siteService: SitesService,
    private router: Router
  ) { }

  ngOnInit(): void {

    this.loadSitesCentroid();  // Charger les centroïdes et métadonnées au démarrage
    this.initMap();
    setTimeout(() => {
      this.map!.invalidateSize();
    }, 0);
  }

  // Utiliser le hook AfterViewChecked pour invalider la taille de la carte après le retour sur la page
  ngAfterViewChecked(): void {
    setTimeout(() => {
      if (this.map) {
        this.map.invalidateSize();  // Forcer la mise à jour de la taille de la carte
      }
    }, 0);
  }

  private initMap(): void {
    const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    });

    const geologie = L.tileLayer.wms("https://geoservices.brgm.fr/geologie", {
      layers: "GEOLOGIE",
      format: "image/jpeg",
      transparent: false,
      version: "1.1.1",
      maxZoom: 15,
      tileSize: 256,
      attribution: "&copy; BRGM",
      updateWhenIdle: true,
      detectRetina: true
    });

    this.map = L.map('map', {
      center: [47.2, 2.5],
      zoom: 6,
      layers: [osm]
    });

    const baseMaps = {
      "OpenStreetMap": osm,
      "Carte géologique": geologie
    };
    L.control.layers(baseMaps).addTo(this.map);

    // Gestion des événements de zoom et déplacement
    this.map.on('zoomend moveend', () => {
      const zoom = this.map?.getZoom();
      if (zoom && zoom >= 11) {
        this.loadPolygones();  // Charger les polygones au zoom >= 12
        this.hideCentroides();  // Masquer les centroïdes
      } else {
        this.clearPolygones();  // Vider les polygones
        this.showCentroides();  // Réafficher les centroïdes
      }
    });
  }

  // Charger les centroïdes (geom_point) et les informations des sites
  loadSitesCentroid(): void {
    this.siteService.getSitesCentroid().subscribe(
      (sites: any[]) => {
        this.espaces = sites;
        this.filteredEspaces = this.espaces;

        this.dataSource.data = this.filteredEspaces;
        this.dataSource.paginator = this.paginator;

        // Créer le calque des centroïdes
        this.centroidesLayer = L.layerGroup();
        sites.forEach((site) => {
          const point = L.geoJSON(site.geom_point, {
            pointToLayer: (feature, latlng) => L.circleMarker(latlng, {
              radius: 8,
              opacity: 0.5,
              color: '#008f68',
              fillOpacity: 0.8,
              fillColor: '#6DB65B'
            }),
            onEachFeature: (feature, layer) => {
              // Crée le contenu du popup, par exemple avec une des propriétés de l'objet
              const tooltipContent = site.nom
              layer.bindTooltip(tooltipContent, {});
              /// Redirection vers la page correspondante au clic
              layer.on('click', () => {
                if (site.slug) {
                  // Remplace 'site/' par ton URL de base si nécessaire
                  this.router.navigate(['/site', site.slug]);
                }
              });
            }
          });
          this.centroidesLayer!.addLayer(point);
        });
        this.centroidesLayer.addTo(this.map!);

        // Calcul des statistiques
        this.computeStats();
      },
      error => {
        console.error('Error fetching centroides and site data', error);
      }
    );
  }

  // Charger les polygones dans la BBOX visible
  loadPolygones(): void {
    const bounds = this.map?.getBounds();
    if (!bounds) return;

    const bbox = `${bounds.getWest()},${bounds.getSouth()},${bounds.getEast()},${bounds.getNorth()}`;
    this.siteService.getPolygones(bbox).subscribe(
      (polygones: any[]) => {

        // Si `polygonesLayer` n'est pas encore sur la carte, l'ajouter
        if (!this.map?.hasLayer(this.polygonesLayer)) {
          this.polygonesLayer.addTo(this.map!);
        }

        // Ajouter chaque polygone au FeatureGroup
        polygones.forEach((polygone) => {
          const polygon = L.geoJSON(polygone.geom, {
            style: {
              weight: 3,
              opacity: 0.5,
              color: '#008f68',
              fillOpacity: 0.8,
              fillColor: '#6DB65B'
            },
            onEachFeature: (feature, layer) => {
              // Crée le contenu du popup, par exemple avec une des propriétés de l'objet
              const tooltipContent = polygone.nom
              layer.bindTooltip(tooltipContent, {});
              /// Redirection vers la page correspondante au clic
              layer.on('click', () => {
                if (polygone.slug) {
                  // Remplace 'site/' par ton URL de base si nécessaire
                  this.router.navigate(['/site', polygone.slug]);
                }
              });
            }
          }).on('click', () => {
            if (polygone.properties && polygone.properties.slug) {
              this.router.navigate(['/site', polygone.properties.slug]);
            }
          });
          this.polygonesLayer.addLayer(polygon);  // Ajoute le polygone au FeatureGroup
        });
      },
      error => {
        console.error('Error fetching polygones', error);
      }
    );
  }

  // Masquer les centroïdes
  hideCentroides(): void {
    if (this.centroidesLayer) {
      this.map?.removeLayer(this.centroidesLayer);
    }
  }

  // Réafficher les centroïdes
  showCentroides(): void {
    if (this.centroidesLayer) {
      this.centroidesLayer.addTo(this.map!);
    }
  }

  // Vider les polygones de la carte
  clearPolygones(): void {
    if (this.polygonesLayer) {
      this.polygonesLayer.clearLayers();  // Efface tous les polygones à l’intérieur de `polygonesLayer`
    }
  }

  computeStats(): void {
    const totalSites = this.espaces.length;
    const totalInpgSites = this.espaces.reduce((total, site) => total + (site.sites_inpg ? site.sites_inpg.length : 0), 0);
    const sitesAvecPatrimoine = this.espaces.filter(site => site.sites_inpg && site.sites_inpg.length > 0).length;
    const nbStratotypes = this.espaces.reduce((count, site) => {
      return count + (site.stratotypes ? site.stratotypes.length : 0);
    }, 0);
    const sitesCreationGeol = this.espaces.filter(site => site.creation_geol === true).length;
    this.stats = [
      { icon: 'assets/images/symbol11_final.png', chiffre: totalSites, texte: 'Nombre total de réserves' },
      { icon: 'assets/images/symbol11_prct.png', chiffre: `${(sitesAvecPatrimoine / totalSites * 100).toFixed(0)}%`, texte: 'Proportion de réserves avec patrimoine géologique' },
      { icon: 'assets/images/iconSynth.png', chiffre: sitesCreationGeol, texte: 'Réserves créées pour protéger du patrimoine géologique' },
      { icon: 'assets/images/INPG.png', chiffre: totalInpgSites, texte: 'Sites INPG localisés en réserve naturelle' },
      { icon: 'assets/images/stratotype.png', chiffre: nbStratotypes, texte: 'Nombre de stratotypes protégés' }
    ];
  }

  // Autres méthodes pour filtrage et interactions utilisateur

  onRowClick(element: any): void {
    this.router.navigate(['/site', element.slug]);  // Utilisation du Router pour naviguer
  }

  handleSearch(event: Event): void {
    const query = this.removeAccents((event.target as HTMLInputElement).value.toLowerCase());
    this.searchQuery = query;
    this.applyFilters();
  }

  private removeAccents(text: string): string {
    return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
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
    this.applyFilters();
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
        ? this.removeAccents(site.nom.toLowerCase()).includes(this.searchQuery) || site.code.toLowerCase().includes(this.searchQuery)
        : true;

      const matchesPatrimoine = this.selectedPatrimoine === 'oui'
        ? (site.sites_inpg && site.sites_inpg.length > 0) || (site.patrimoines_geologiques && site.patrimoines_geologiques.length > 0)
        : this.selectedPatrimoine === 'non'
          ? (!site.sites_inpg || site.sites_inpg.length === 0) && (!site.patrimoines_geologiques || site.patrimoines_geologiques.length === 0)
          : this.selectedPatrimoine === 'reserve_geologique'
            ? site.creation_geol === true
            : true;

      return matchesTypeRn && matchesRegion && matchesSearch && matchesPatrimoine;
    });

    this.dataSource.data = this.filteredEspaces;
    this.dataSource.paginator = this.paginator;
  }


  getNonConfidentialSites(element: any): any[] {

    return element.sites_inpg.filter((inpg: { inpg: { niveau_de_diffusion: string; }; }) => inpg.inpg.niveau_de_diffusion === 'Public');

  }

  countConfidentialSites(element: any): number {
    return element.sites_inpg.filter((inpg: { inpg: { niveau_de_diffusion: string; }; }) => inpg.inpg.niveau_de_diffusion === 'Confidentiel').length;
  }

  clearPatrimoineSelection(): void {
    this.selectedPatrimoine = '';
    this.onPatrimoineChange(this.selectedPatrimoine);
  }
}
