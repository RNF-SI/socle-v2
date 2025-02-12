import { AfterViewChecked, Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import * as L from 'leaflet';
import { AuthService } from 'src/app/home-rnf/services/auth-service.service';
import { ExcelService } from 'src/app/home-rnf/services/excel.service';
import { Parametre } from 'src/app/models/parametres.model';
import { ParametresService } from 'src/app/services/parametres.service';
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
  overlayIcon?: string;
  iconfill?: string;
  chiffre: number | string;
  texte: string;
  overlayHeight?: number;
}

interface Location {
  name: string;
  lat: number;
  lng: number;
  zoom: number;
}

@Component({
  selector: 'app-accueil',
  templateUrl: './accueil.component.html',
  styleUrls: ['./accueil.component.scss']
})
export class AccueilComponent implements OnInit, AfterViewChecked {
  espaces: Site[] = [];
  filteredEspaces: Site[] = [];
  selectedTypeRn: string = '';
  searchQuery: string = '';
  selectedCode: string = '';
  selectedPatrimoine: string = '';
  regions: string[] = ['Normandie', 'Pays de la Loire', 'Corse', 'Provence-Alpes-Côte d\'Azur', 'Grand Est', 'Auvergne-Rhône-Alpes', 'Bretagne', 'Hauts-de-France', 'Occitanie', 'Nouvelle-Aquitaine', 'Bourgogne-Franche-Comté', 'Île-de-France', 'Guyane', 'La Réunion', 'Centre-Val de Loire', 'Guadeloupe', 'Martinique', 'Mayotte'];
  selectedRegion: string = '';
  stats: Stat[] = [];
  date_maj_inpg: Date | null = null;

  displayedColumns: string[] = ['nom', 'code', 'type', 'inpg'];
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  dataSource = new MatTableDataSource();

  private map: L.Map | undefined;
  private centroidesLayer: L.LayerGroup | undefined;
  private polygonesLayer: L.FeatureGroup = L.featureGroup();  // Ancien FeatureGroup (non utilisé avec la nouvelle logique)
  geoJson: any;
  accentColor: any;

  // =============================
  // Déclaration des différentes couches
  // Pour les centroïdes
  centroidesPatrimoineLayer: L.LayerGroup = L.layerGroup();
  centroidesContientLayer: L.LayerGroup = L.layerGroup();
  centroidesAutresLayer: L.LayerGroup = L.layerGroup();

  // Pour les polygones
  polygonesPatrimoineLayer: L.LayerGroup = L.layerGroup();
  polygonesContientLayer: L.LayerGroup = L.layerGroup();
  polygonesAutresLayer: L.LayerGroup = L.layerGroup();
  // =============================

  // Toggle switches pour les 3 catégories (affichage par défaut activé)
  showPatrimoine: boolean = true;
  showContient: boolean = true;
  showAutres: boolean = true;

  export: any = [];

  constructor(
    private siteService: SitesService,
    private router: Router,
    private excelService: ExcelService,
    public authService: AuthService,
    public parametresService: ParametresService
  ) { }

  locations: Location[] = [
    { name: 'Hexagone', lat: 46.45, lng: 2.21, zoom: 6 },
    { name: 'Antilles/Guyane', lat: 11, lng: -57.59, zoom: 6 },
    { name: 'Océan Indien', lat: -33.36, lng: 52.91, zoom: 4 }
    // Ajoutez autant de localisations que nécessaire
  ];

  selectedLocation: Location = { name: 'Hexagone', lat: 46.45, lng: 2.21, zoom: 6 };

  estConnecte() {
    return this.authService.authenticated;
  }

  ngOnInit(): void {
    this.loadSitesCentroid();  // Chargement des centroïdes et métadonnées au démarrage
    this.initMap();
    setTimeout(() => {
      this.map!.invalidateSize();
    }, 0);

    this.parametresService.getParamtreByLibelle('date_maj_inpg').subscribe(
      (parametre: Parametre) => {
        const parts = parametre.valeur.split('/');
        if (parts.length !== 3) {
          throw new Error(`Format de date invalide : ${parametre.valeur}. Le format attendu est JJ/MM/AAAA.`);
        }
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1; // Les mois commencent à 0 en JavaScript
        const year = parseInt(parts[2], 10);
        this.date_maj_inpg = new Date(year, month, day);
      }
    );
  }

  // =============================
  // Définition des styles selon la catégorie
  private getMarkerStyle(category: 'patrimoine' | 'contient' | 'autres'): L.CircleMarkerOptions {
    switch (category) {
      case 'patrimoine':
        return { radius: 8, opacity: 1, color: '#fabb64', fillOpacity: 1, fillColor: '#fcd6a2' };
      case 'contient':
        return { radius: 8, opacity: 1, color: '#518196', fillOpacity: 1, fillColor: '#97b3c0' };
      default:
        return { radius: 8, opacity: 1, color: '#c8d469', fillOpacity: 1, fillColor: '#dee5a5' };
    }
  }

  private getPolygonStyle(category: 'patrimoine' | 'contient' | 'autres'): L.PathOptions {
    switch (category) {
      case 'patrimoine':
        return { weight: 3, opacity: 0.5, color: '#fabb64', fillOpacity: 0.8, fillColor: '#fabb64' };
      case 'contient':
        return { weight: 3, opacity: 0.5, color: '#518196', fillOpacity: 0.8, fillColor: '#518196' };
      default:
        return { weight: 3, opacity: 0.5, color: '#c8d469', fillOpacity: 0.8, fillColor: '#c8d469' };
    }
  }
  // =============================

  // Invalider la taille de la carte après affichage
  ngAfterViewChecked(): void {
    setTimeout(() => {
      if (this.map) {
        this.map.invalidateSize();
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
      center: [46.45, 2.21],
      zoom: 6,
      layers: [osm]
    });

    const baseMaps = {
      "OpenStreetMap": osm,
      "Carte géologique": geologie
    };

    // (Optionnel) Vous pouvez toujours ajouter un contrôle de couches de base si vous le souhaitez
    L.control.layers(baseMaps).addTo(this.map);

    // Gestion des événements de zoom et de déplacement :
    this.map.on('zoomend moveend', () => {
      // En cas de zoom élevé, on charge (ou recharge) les polygones
      if (this.map!.getZoom() >= 11) {
        this.loadPolygones();
      }
      this.updateLayerDisplay();
    });
  }

  // =============================
  // Chargement des centroïdes
  loadSitesCentroid(): void {
    this.siteService.getSitesCentroid().subscribe(
      (sites: any[]) => {
        this.espaces = sites;
        this.filteredEspaces = this.espaces;
        this.dataSource.data = this.filteredEspaces;
        this.dataSource.paginator = this.paginator;

        sites.forEach((site) => {
          let category: 'patrimoine' | 'contient' | 'autres';
          if (site.creation_geol === true) {
            category = 'patrimoine';
          } else if (site.creation_geol === false &&
            ((site.sites_inpg && site.sites_inpg.length > 0) || (site.patrimoines_geologiques && site.patrimoines_geologiques.length > 0))) {
            category = 'contient';
          } else {
            category = 'autres';
          }

          const markerStyle = this.getMarkerStyle(category);

          const point = L.geoJSON(site.geom_point, {
            pointToLayer: (feature, latlng) => L.circleMarker(latlng, markerStyle),
            onEachFeature: (feature, layer) => {
              const tooltipContent = site.nom;
              layer.bindTooltip(tooltipContent, {});
              layer.on('click', () => {
                if (site.slug) {
                  const urlTree = this.router.createUrlTree(['/site', site.slug]);
                  const url = window.location.origin + this.router.serializeUrl(urlTree);
                  window.open(url, '_blank');
                }
              });
            }
          });

          // Ajout dans le groupe correspondant
          if (category === 'patrimoine') {
            this.centroidesPatrimoineLayer.addLayer(point);
          } else if (category === 'contient') {
            this.centroidesContientLayer.addLayer(point);
          } else {
            this.centroidesAutresLayer.addLayer(point);
          }
        });

        // Au démarrage, si le zoom est faible (< 11), on affiche les centroïdes
        if (this.map && this.map.getZoom() < 11) {
          this.centroidesPatrimoineLayer.addTo(this.map);
          this.centroidesContientLayer.addTo(this.map);
          this.centroidesAutresLayer.addTo(this.map);
        }
        this.computeStats();
      },
      error => {
        console.error('Error fetching centroides and site data', error);
      }
    );
  }

  // =============================
  // Chargement des polygones dans la BBOX visible
  loadPolygones(): void {
    const bounds = this.map?.getBounds();
    if (!bounds) return;
    const bbox = `${bounds.getWest()},${bounds.getSouth()},${bounds.getEast()},${bounds.getNorth()}`;

    this.siteService.getPolygones(bbox).subscribe(
      (polygones: any[]) => {
        // Pour chaque polygone, déterminer la catégorie et l'ajouter au groupe correspondant
        polygones.forEach((polygone) => {
          let category: 'patrimoine' | 'contient' | 'autres';
          if (polygone.creation_geol === true) {
            category = 'patrimoine';
          } else if (polygone.creation_geol === false &&
            ((polygone.sites_inpg && polygone.sites_inpg.length > 0) ||
              (polygone.patrimoines_geologiques && polygone.patrimoines_geologiques.length > 0))) {
            category = 'contient';
          } else {
            category = 'autres';
          }

          const polygonStyle = this.getPolygonStyle(category);

          const polygon = L.geoJSON(polygone.geom, {
            style: polygonStyle,
            onEachFeature: (feature, layer) => {
              const tooltipContent = polygone.nom;
              layer.bindTooltip(tooltipContent, {});
              layer.on('click', () => {
                if (polygone.slug) {
                  const urlTree = this.router.createUrlTree(['/site', polygone.slug]);
                  const url = window.location.origin + this.router.serializeUrl(urlTree);
                  window.open(url, '_blank');
                }
              });
            }
          })

          // Ajout dans le groupe correspondant
          if (category === 'patrimoine') {
            this.polygonesPatrimoineLayer.addLayer(polygon);
          } else if (category === 'contient') {
            this.polygonesContientLayer.addLayer(polygon);
          } else {
            this.polygonesAutresLayer.addLayer(polygon);
          }
        });
        // Une fois les polygones chargés, on met à jour l'affichage
        this.updateLayerDisplay();
      },
      error => {
        console.error('Error fetching polygones', error);
      }
    );
  }

  // =============================
  // Méthode de mise à jour de l'affichage des couches selon le zoom et les toggles
  updateLayerDisplay(): void {
    if (!this.map) return;
    const zoom = this.map.getZoom();

    if (zoom < 11) {
      // Pour un zoom faible, afficher les centroïdes selon l'état des toggles et retirer les polygones
      this.map.removeLayer(this.polygonesPatrimoineLayer);
      this.map.removeLayer(this.polygonesContientLayer);
      this.map.removeLayer(this.polygonesAutresLayer);

      if (this.showPatrimoine) {
        if (!this.map.hasLayer(this.centroidesPatrimoineLayer)) {
          this.centroidesPatrimoineLayer.addTo(this.map);
        }
      } else {
        this.map.removeLayer(this.centroidesPatrimoineLayer);
      }
      if (this.showContient) {
        if (!this.map.hasLayer(this.centroidesContientLayer)) {
          this.centroidesContientLayer.addTo(this.map);
        }
      } else {
        this.map.removeLayer(this.centroidesContientLayer);
      }
      if (this.showAutres) {
        if (!this.map.hasLayer(this.centroidesAutresLayer)) {
          this.centroidesAutresLayer.addTo(this.map);
        }
      } else {
        this.map.removeLayer(this.centroidesAutresLayer);
      }
    } else {
      // Pour un zoom élevé, afficher les polygones selon l'état des toggles et retirer les centroïdes
      this.map.removeLayer(this.centroidesPatrimoineLayer);
      this.map.removeLayer(this.centroidesContientLayer);
      this.map.removeLayer(this.centroidesAutresLayer);

      if (this.showPatrimoine) {
        if (!this.map.hasLayer(this.polygonesPatrimoineLayer)) {
          this.polygonesPatrimoineLayer.addTo(this.map);
        }
      } else {
        this.map.removeLayer(this.polygonesPatrimoineLayer);
      }
      if (this.showContient) {
        if (!this.map.hasLayer(this.polygonesContientLayer)) {
          this.polygonesContientLayer.addTo(this.map);
        }
      } else {
        this.map.removeLayer(this.polygonesContientLayer);
      }
      if (this.showAutres) {
        if (!this.map.hasLayer(this.polygonesAutresLayer)) {
          this.polygonesAutresLayer.addTo(this.map);
        }
      } else {
        this.map.removeLayer(this.polygonesAutresLayer);
      }
    }
  }

  // Méthode appelée lors du changement d'un toggle dans le template
  onToggleChange(): void {
    this.updateLayerDisplay();
  }
  // =============================

  // Méthodes de masquage / affichage (anciennes versions, ici non utilisées directement)
  hideCentroides(): void {
    this.map!.removeLayer(this.centroidesPatrimoineLayer);
    this.map!.removeLayer(this.centroidesContientLayer);
    this.map!.removeLayer(this.centroidesAutresLayer);
  }

  showCentroides(): void {
    this.centroidesPatrimoineLayer.addTo(this.map!);
    this.centroidesContientLayer.addTo(this.map!);
    this.centroidesAutresLayer.addTo(this.map!);
  }

  clearPolygones(): void {
    this.polygonesPatrimoineLayer.clearLayers();
    this.polygonesContientLayer.clearLayers();
    this.polygonesAutresLayer.clearLayers();
  }

  computeStats(): void {
    const totalSites = this.espaces.length;
    const totalInpgSites = this.espaces.reduce((total, site) => total + (site.sites_inpg ? site.sites_inpg.length : 0), 0);
    const sitesAvecPatrimoine = this.espaces.filter(site => site.sites_inpg && site.sites_inpg.length > 0).length;
    const nbStratotypes = this.espaces.reduce((count, site) => count + (site.stratotypes ? site.stratotypes.length : 0), 0);
    const sitesCreationGeol = this.espaces.filter(site => site.creation_geol === true).length;
    const proportion = Number((sitesAvecPatrimoine / totalSites * 100).toFixed(0));

    this.stats = [
      { icon: 'assets/images/alveole_straw.png', chiffre: totalSites, texte: 'Nombre total de réserves' },
      {
        icon: 'assets/images/alveole_straw.png',
        chiffre: `${proportion}%`,
        texte: 'Proportion de réserves avec patrimoine géologique',
        overlayIcon: 'assets/images/alveole_teal_blue.png', // Icône à superposer
        overlayHeight: proportion // Hauteur relative de l'overlay en pourcentage
      },
      { icon: 'assets/images/iconSynth.png', chiffre: sitesCreationGeol, texte: 'Réserves créées pour protéger du patrimoine géologique' },
      { icon: 'assets/images/INPG.png', chiffre: totalInpgSites, texte: 'Sites INPG localisés en réserve naturelle' },
      { icon: 'assets/images/stratotype.png', chiffre: nbStratotypes, texte: 'Nombre de stratotypes protégés' }
    ];
  }


  // =============================
  // Méthodes de filtrage et interactions utilisateur
  onRowClick(element: any): void {
    const urlTree = this.router.createUrlTree(['/site', element.slug]);
    const url = window.location.origin + this.router.serializeUrl(urlTree);
    window.open(url, '_blank');
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
      const matchesTypeRn = this.selectedTypeRn.length > 0 ? this.selectedTypeRn.includes(site.type_rn) : true;
      const matchesRegion = this.selectedRegion.length > 0 ? this.selectedRegion.includes(site.region) : true;
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

  exportAsXlsx(): void {
    this.export = [];
    this.filteredEspaces.forEach(element => {
      let sites_inpg_nom: any[] = [];
      let sites_inpg_code: any[] = [];
      let sites_inpg_confidentiel_nom: any[] = [];
      let sites_inpg_confidentiel_code: any[] = [];
      element.sites_inpg.forEach((inpg: { inpg: any; }) => {
        if (inpg.inpg.niveau_de_diffusion == 'Public') {
          sites_inpg_nom.push(inpg.inpg.lb_site + " (" + inpg.inpg.id_metier + ")");
          sites_inpg_code.push(inpg.inpg.id_metier);
        } else {
          sites_inpg_confidentiel_nom.push(inpg.inpg.lb_site + " (" + inpg.inpg.id_metier + ")");
          sites_inpg_confidentiel_code.push(inpg.inpg.id_metier);
        }
      });
      let temp: any = {};
      temp['Nom du site'] = element.nom;
      temp['Code RNF'] = element.code;
      temp['Type de réserve'] = element.type_rn;
      temp['Sites INPG publics (Nom complet)'] = sites_inpg_nom.join(' ; ');
      temp['Sites INPG publics (Identifiant)'] = sites_inpg_code.join(' ; ');
      if (this.estConnecte()) {
        temp['Sites INPG confidentiels (Nom complet)'] = sites_inpg_confidentiel_nom.join(' ; ');
        temp['Sites INPG confidentiels (Identifiant)'] = sites_inpg_confidentiel_code.join(' ; ');
      }
      this.export.push(temp);
    });
    this.excelService.exportAsExcelFile(this.export, 'geologie_reserves_naturelles');
  }
  // Méthode appelée lors du changement de la sélection dans la liste déroulante
  onLocationChange(): void {
    if (this.map && this.selectedLocation) {
      // Utilise setView pour centrer la carte sur les coordonnées et le niveau de zoom sélectionnés
      this.map.setView([this.selectedLocation.lat, this.selectedLocation.lng], this.selectedLocation.zoom);
    }
  }
}
