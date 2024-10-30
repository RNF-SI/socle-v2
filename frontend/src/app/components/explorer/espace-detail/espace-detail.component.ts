import { Component, ElementRef, OnInit, QueryList, Renderer2, ViewChildren } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { faArrowUpRightFromSquare, faKey, faUserPlus } from '@fortawesome/free-solid-svg-icons';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import * as L from 'leaflet';
import { GeologicalInterests } from 'src/app/models/geological-interests.model';
import { Nomenclature } from 'src/app/models/nomenclature.model';
import { Site } from 'src/app/models/site.model';
import { PatrimoineGeologiqueService } from 'src/app/services/patrimoine-geologique.service';
import { SitesService } from 'src/app/services/sites.service';
import { TInfosBaseSiteService } from 'src/app/services/t-infos-base-site.service';

@Component({
  selector: 'app-espace-detail',
  templateUrl: './espace-detail.component.html',
  styleUrls: ['./espace-detail.component.scss']
})
export class EspaceDetailComponent implements OnInit {
  site: Site | undefined;
  tInfosBaseSite: any;
  patrimoineGeologique: any;
  geologicalInterests: string[] = [];
  paleontologicalLabels: string[] = [];
  principalHeritage: any[] = [];
  protectionHeritage: any[] = [];
  reserveContainsGeologicalHeritage: any[] = [];
  protectionPerimeterContainsGeologicalHeritage: any[] = [];
  siteSlug: any;
  geologicalUnitsOptions: string[] = [];
  geologicalUnits: string[] = [];
  tInfosBaseSiteForm: any;
  faKey = faKey;
  faUserPlus = faUserPlus;
  faArrowUpRightFromSquare = faArrowUpRightFromSquare;
  selectedSite: any = {};
  substancesOptions: Nomenclature[] = [];
  uniqueInteretGeolPrincipal = [];

  private map: L.Map | undefined;
  private layerControl = L.control.layers();
  private bounds = L.latLngBounds([]);

  @ViewChildren('infoBlock') infoBlocks!: QueryList<ElementRef>;
  isDistributed = false;  // Flag pour s'assurer que la distribution se fait une seule fois
  leftColumn!: ElementRef;
  rightColumn!: ElementRef;

  // Correct the type to be a single object instead of an array


  // Applications = [
  //   {
  //     'nom': 'Aiguilles Rouges',
  //     'superficie': '3276.00 ',
  //     'sitesInpg': '2',
  //     'autresSitesDeGeopatrimoine': '2',
  //     'nombreDeStratotypes': '2',
  //     'terrainsLesPlusAnciens': 'Bathonien',
  //     'terrainsLesPlusRecents': 'Holocène'
  //   },
  //   {
  //     'nom': 'Anciennes carrières de Cléty',
  //     'superficie': '2050.00',
  //     'sitesInpg': '3',
  //     'autresSitesDeGeopatrimoine': '3',
  //     'nombreDeStratotypes': '3',
  //     'terrainsLesPlusAnciens': 'Albien',
  //     'terrainsLesPlusRecents': 'Holocène'
  //   },
  //   {
  //     'nom': 'Anciennes carrières d\'Orival',
  //     'superficie': '1506.00',
  //     'sitesInpg': '4',
  //     'autresSitesDeGeopatrimoine': '4',
  //     'nombreDeStratotypes': '4',
  //     'terrainsLesPlusAnciens': 'Bathonien',
  //     'terrainsLesPlusRecents': 'Holocène'
  //   }
  // ];

  constructor(
    private renderer: Renderer2,
    private route: ActivatedRoute,
    private siteService: SitesService,
    private tInfosBaseSiteService: TInfosBaseSiteService,
    private patrimoineGeologiqueService: PatrimoineGeologiqueService
  ) { }

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug');

    if (slug) {
      this.siteService.getSiteBySlug(slug).subscribe((site: Site) => {
        this.site = site;
        console.log(this.site);
        setTimeout(() => (this.initMap(), this.addLayers(), this.zoomToExtent()), 1);
        this.uniqueInteretGeolPrincipal = Array.from(
          new Set(this.site.inpg.map((inpg: any) => inpg.interet_geol_principal))
        );
      })
    }
  }


  ngAfterViewChecked(): void {
    // Vérifie si `infoBlocks` est disponible et que la distribution n'a pas encore été faite
    if (this.infoBlocks && this.infoBlocks.length > 0 && !this.isDistributed) {
      this.isDistributed = true;  // Assure qu'on ne fait cela qu'une fois
      // Cible les colonnes une fois la vue initialisée
      this.leftColumn = this.renderer.selectRootElement('#left-column', true);
      this.rightColumn = this.renderer.selectRootElement('#right-column', true);
      this.distributeItems();
    }
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

    this.map = L.map('mapReserve', {
      center: [47.2, 2.5],
      zoom: 6,
      layers: [geologie]
    });

    const baseMaps = {
      "OpenStreetMap": osm,
      "Carte géologique": geologie
    };
    this.layerControl = L.control.layers(baseMaps)
    this.layerControl.addTo(this.map);
  }

  private addLayers(): void {
    // On récupère la div de la légende pour la compléter
    const legendContainer = document.getElementById('legend');

    // 1. Couche principale du site
    if (this.site!.geom) {
      const siteLayerStyle = {
        weight: 3,
        opacity: 0.8,
        color: '#008f68',
        fillOpacity: 0.5,
        fillColor: '#6DB65B'
      };
      const siteLayer = L.geoJSON(this.site!.geom, {
        style: siteLayerStyle
      })
      // On ajoute la couche à la map
      siteLayer.addTo(this.map!);
      // On ajoute un controle de cette couche
      this.layerControl.addOverlay(siteLayer, "Site");
      // On étend la carte sur les limites de la couche
      this.bounds.extend(siteLayer.getBounds());
      // On ajoute la légende pour cette couche
      this.addLegendItem(legendContainer!, siteLayerStyle.fillColor, siteLayerStyle.fillOpacity, siteLayerStyle.color, "Réserve")
    }

    // 2. Couche périmètre de protection du site
    if (this.site!.perimetre_protection && this.site!.perimetre_protection.geom) {
      const siteLayerStyle = {
        weight: 3,
        opacity: 0.8,
        color: '#b08b57',
        fillOpacity: 0.5,
        fillColor: '#b08b57'
      };
      const perimetreProtectionLayer = L.geoJSON(this.site!.perimetre_protection.geom, { style: siteLayerStyle }).addTo(this.map!);
      this.layerControl.addOverlay(perimetreProtectionLayer, "Périmètre de protection");
      this.bounds.extend(perimetreProtectionLayer.getBounds());
      this.addLegendItem(legendContainer!, siteLayerStyle.fillColor, siteLayerStyle.fillOpacity, siteLayerStyle.color, "Périmètre de protection")
    }

    // 3. Couche INPG publics du site

    var siteLayerStyle = {
      weight: 3,
      opacity: 0.8,
      color: '#4a90e2',
      fillOpacity: 0.5,
      fillColor: '#4a90e2'
    };

    const inpgPublicLayers = this.site!.inpg
      .filter((inpg: any) => inpg.niveau_de_diffusion === 'Public')
      .map((inpg: any) => L.geoJSON(
        inpg.geom, {
        style: siteLayerStyle,
        onEachFeature: (feature, layer) => {
          layer.bindPopup(`<a href="https://inpn.mnhn.fr/site/inpg/${inpg.id_metier}" target="_blank">
            ${inpg.lb_site} - ${inpg.id_metier} (${inpg.interet_geol_principal})
          </a>`)
        }
      }));

    if (inpgPublicLayers.length > 0) {
      const publicGroup = L.layerGroup(inpgPublicLayers).addTo(this.map!);
      this.layerControl.addOverlay(publicGroup, "Sites INPG publics");
      inpgPublicLayers.forEach((layer: { getBounds: () => L.LatLngExpression | L.LatLngBoundsExpression; }) => this.bounds.extend(layer.getBounds()));
      this.addLegendItem(legendContainer!, siteLayerStyle.fillColor, siteLayerStyle.fillOpacity, siteLayerStyle.color, "Sites INPG publics")
    }

    // 4. Couche INPG confidentiels du site

    siteLayerStyle = {
      weight: 3,
      opacity: 0.8,
      color: '#f5a623',
      fillOpacity: 0.5,
      fillColor: '#f5a623'
    };

    const inpgConfidentialLayers = this.site!.inpg
      .filter((inpg: any) => inpg.niveau_de_diffusion === 'Confidentiel')
      .map((inpg: any) => L.geoJSON(inpg.geom, { style: siteLayerStyle }));

    if (inpgConfidentialLayers.length > 0) {
      const confidentialGroup = L.layerGroup(inpgConfidentialLayers).addTo(this.map!);
      this.layerControl.addOverlay(confidentialGroup, "Sites INPG confidentiels");
      inpgConfidentialLayers.forEach((layer: { getBounds: () => L.LatLngExpression | L.LatLngBoundsExpression; }) => this.bounds.extend(layer.getBounds()));
      this.addLegendItem(legendContainer!, siteLayerStyle.fillColor, siteLayerStyle.fillOpacity, siteLayerStyle.color, "Sites INPG confidentiels")
    }

    // 5. Couche INPG publics du périmètre de protection

    siteLayerStyle = {
      weight: 3,
      opacity: 0.8,
      color: '#4a90e2',
      fillOpacity: 0.5,
      fillColor: '#4a90e2'
    };
    if (this.site!.perimetre_protection && this.site!.perimetre_protection.inpg) {
      const protectionInpgPublicLayers = this.site!.perimetre_protection.inpg
        .filter((inpg: any) => inpg.niveau_de_diffusion === 'Public')
        .map((inpg: any) => L.geoJSON(inpg.geom, { style: siteLayerStyle }));

      if (protectionInpgPublicLayers.length > 0) {
        const protectionPublicGroup = L.layerGroup(protectionInpgPublicLayers).addTo(this.map!);
        this.layerControl.addOverlay(protectionPublicGroup, "Sites INPG publics du périmètre de protection");
        protectionInpgPublicLayers.forEach((layer: { getBounds: () => L.LatLngExpression | L.LatLngBoundsExpression; }) => this.bounds.extend(layer.getBounds()));
        if (inpgPublicLayers.length == 0) {
          this.addLegendItem(legendContainer!, siteLayerStyle.fillColor, siteLayerStyle.fillOpacity, siteLayerStyle.color, "Sites INPG publics")
        }
      }
    }

    // 6. Couche INPG confidentiels du périmètre de protection
    siteLayerStyle = {
      weight: 3,
      opacity: 0.8,
      color: '#f5a623',
      fillOpacity: 0.5,
      fillColor: '#f5a623'
    };

    if (this.site!.perimetre_protection && this.site!.perimetre_protection.inpg) {
      const protectionInpgConfidentialLayers = this.site!.perimetre_protection.inpg
        .filter((inpg: any) => inpg.niveau_de_diffusion === 'Confidentiel')
        .map((inpg: any) => L.geoJSON(inpg.geom));

      if (protectionInpgConfidentialLayers.length > 0) {
        const protectionConfidentialGroup = L.layerGroup(protectionInpgConfidentialLayers).addTo(this.map!);
        this.layerControl.addOverlay(protectionConfidentialGroup, "Sites INPG confidentiels du périmètre de protection");
        protectionInpgConfidentialLayers.forEach((layer: { getBounds: () => L.LatLngExpression | L.LatLngBoundsExpression; }) => this.bounds.extend(layer.getBounds()));
        if (inpgConfidentialLayers.length == 0) {
          this.addLegendItem(legendContainer!, siteLayerStyle.fillColor, siteLayerStyle.fillOpacity, siteLayerStyle.color, "Sites INPG confidentiels")
        }
      }
    }
  }

  private zoomToExtent(): void {
    if (this.bounds.isValid()) {
      this.map!.fitBounds(this.bounds);
    }
  }

  fetchPatrimoineGeologique(siteId: any): void {
    this.patrimoineGeologiqueService.getPatrimoineGeologique(siteId).subscribe(
      (data: any) => {
        console.log('Fetched Geological Heritage Data:', data); // Log pour vérifier les données récupérées
        if (data && data.principal && data.protection) {
          this.principalHeritage = data.principal;
          this.protectionHeritage = data.protection;

        } else {
          console.error('Unexpected data format:', data);
        }
      },
      (error: any) => {
        console.error('Error fetching geological heritage data', error);
      }
    );
  }


  // TODO : sdfsgfsdf
  setGeologicalHeritages(): void {
    this.principalHeritage = this.patrimoineGeologique?.geologicalHeritages || [];
  }

  setProtectionGeologicalHeritages(): void {
    this.protectionHeritage = this.patrimoineGeologique?.protectionGeologicalHeritages || [];
  }



  setPaleontologicalLabels(): void {
    this.paleontologicalLabels = []; // Réinitialiser les labels

    // On vérifie si la réponse à la question 5 est "Oui"
    const heritage = this.tInfosBaseSiteForm.get('contains_paleontological_heritage');

    if (heritage?.get('answer')?.value === true) { // Vérifie si l'utilisateur a répondu "Oui"
      if (heritage.get('vertebrates')?.value) {
        this.paleontologicalLabels.push('Vertébrés');
      }
      if (heritage.get('invertebrates')?.value) {
        this.paleontologicalLabels.push('Invertébrés');
      }
      if (heritage.get('plants')?.value) {
        this.paleontologicalLabels.push('Végétaux');
      }
      if (heritage.get('traceFossils')?.value) {
        this.paleontologicalLabels.push('Traces fossiles');
      }

    }

    console.log('Paleontological Labels:', this.paleontologicalLabels);
  }

  setGeologicalInterests(patrimoineGeologique: any): void {
    const interests: GeologicalInterests = {
      stratigraphic: patrimoineGeologique?.main_geological_interests_stratigraphic,
      paleontological: patrimoineGeologique?.main_geological_interests_paleontological,
      sedimentological: patrimoineGeologique?.main_geological_interests_sedimentological,
      geomorphological: patrimoineGeologique?.main_geological_interests_geomorphological,
      mineral_resource: patrimoineGeologique?.main_geological_interests_mineral_resource,
      mineralogical: patrimoineGeologique?.main_geological_interests_mineralogical,
      metamorphism: patrimoineGeologique?.main_geological_interests_metamorphism,
      volcanism: patrimoineGeologique?.main_geological_interests_volcanism,
      plutonism: patrimoineGeologique?.main_geological_interests_plutonism,
      hydrogeology: patrimoineGeologique?.main_geological_interests_hydrogeology,
      tectonics: patrimoineGeologique?.main_geological_interests_tectonics
    };

    this.geologicalInterests = (Object.keys(interests) as (keyof GeologicalInterests)[])
      .filter(key => interests[key])
      .map(key => this.getInterestLabel(key));
  }

  getInterestLabel(key: keyof GeologicalInterests): string {
    const labels: { [key in keyof GeologicalInterests]: string } = {
      stratigraphic: 'Stratigraphique',
      paleontological: 'Paléontologique',
      sedimentological: 'Sédimentologique',
      geomorphological: 'Géomorphologique',
      mineral_resource: 'Ressource minérale',
      mineralogical: 'Minéralogique',
      metamorphism: 'Métamorphisme',
      volcanism: 'Volcanisme',
      plutonism: 'Plutonisme',
      hydrogeology: 'Hydrogéologie',
      tectonics: 'Tectonique'
    };
    return labels[key];
  }

  getSelectedSubstances(): Nomenclature[] {
    const selectedMnemonics = this.tInfosBaseSiteForm.get('substance')?.value || [];
    return this.substancesOptions.filter(substance => selectedMnemonics.includes(substance.mnemonique));
  }

  exportData() {
    const data = document.getElementById('export-content');
    if (data) {
      html2canvas(data).then(canvas => {
        const imgWidth = 208;
        const pageHeight = 295;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;
        const contentDataURL = canvas.toDataURL('image/png');
        let pdf = new jsPDF('p', 'mm', 'a4');
        let position = 0;
        pdf.addImage(contentDataURL, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
        while (heightLeft > 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(contentDataURL, 'PNG', 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }
        pdf.save('site-details.pdf');
      });
    }
  }

  hexToRGBA(hex: string, opacity: number): string {
    const bigint = parseInt(hex.slice(1), 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }

  private addLegendItem(legendContainer: HTMLElement, fillColor: string, fillOpacity: number, borderColor: string, label: string): void {
    const item = document.createElement('span');
    item.className = 'legend-item';

    // Convertir la couleur hexadécimale en RGBA avec l'opacité
    const fillColorWithOpacity = this.hexToRGBA(fillColor, fillOpacity);

    // Créer l'élément HTML pour la légende
    item.innerHTML = `<span style="display: inline-block; width: 15px; height: 15px; background-color: ${fillColorWithOpacity}; margin-right: 5px; margin-left: 5px; border-radius: 3px; border: 2px solid ${borderColor};"></span>${label}`;

    // Ajouter l'élément de légende au conteneur
    legendContainer.appendChild(item);
  }

  leftColumnItems: any[] = [];
  rightColumnItems: any[] = [];

  distributeItems(): void {
    let leftHeight = 0;
    let rightHeight = 0;
    const blocksArray = this.infoBlocks.toArray(); // Conversion pour accéder à l'index du dernier élément

    blocksArray.forEach((block: ElementRef, index: number) => {
      const height = block.nativeElement.offsetHeight;

      // Si c'est le dernier élément, applique une condition spéciale
      if (index === blocksArray.length - 1) {
        // Vérifie si placer le dernier élément dans `rightColumn` équilibre mieux les hauteurs
        if (rightHeight + height <= leftHeight) {
          this.renderer.appendChild(this.rightColumn, block.nativeElement);
          rightHeight += height;
        } else {
          this.renderer.appendChild(this.leftColumn, block.nativeElement);
          leftHeight += height;
        }
      } else {
        // Logique normale pour les autres éléments
        if (leftHeight <= rightHeight) {
          this.renderer.appendChild(this.leftColumn, block.nativeElement);
          leftHeight += height;
        } else {
          this.renderer.appendChild(this.rightColumn, block.nativeElement);
          rightHeight += height;
        }
      }
    });
  }


}

