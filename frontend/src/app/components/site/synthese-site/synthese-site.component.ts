import { Component, ElementRef, OnInit, QueryList, Renderer2, ViewChildren, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { faArrowUpRightFromSquare, faKey, faUserPlus } from '@fortawesome/free-solid-svg-icons';
import { toPng } from 'html-to-image';
import { ExportFicheService } from 'src/app/services/export-fiche.service';
import * as L from 'leaflet';
import { AuthService } from 'src/app/core/auth/auth-service.service';
import { Nomenclature } from 'src/app/models/nomenclature.model';
import { Site } from 'src/app/models/site.model';
import { NomenclaturesService } from 'src/app/services/nomenclatures.service';
import { SitesService } from 'src/app/services/sites.service';

@Component({
  standalone: false,
  selector: 'app-synthese-site',
  templateUrl: './synthese-site.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./synthese-site.component.scss']
})
export class SyntheseSiteComponent implements OnInit {
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
  filteredGeologicalUnits: any = [];
  geologicalUnits: string[] = [];
  tInfosBaseSiteForm: any;
  faKey = faKey;
  faUserPlus = faUserPlus;
  faArrowUpRightFromSquare = faArrowUpRightFromSquare;
  selectedSite: any = {};
  substancesOptions: Nomenclature[] = [];
  uniqueInteretGeolPrincipal: string[] = [];
  rnId: string | null = null;
  sfgeol: string[] = [];

  private map: L.Map | undefined;
  private layerControl = L.control.layers();
  private bounds = L.latLngBounds([]);

  @ViewChildren('infoBlock') infoBlocks!: QueryList<ElementRef>;
  isDistributed = false;  // Flag pour s'assurer que la distribution se fait une seule fois
  leftColumn!: ElementRef;
  rightColumn!: ElementRef;

  nbInpgConfidentielsReserve: number = 0;
  nbInpgConfidentielsPP: number = 0;
  stratotypesLimite: any;
  stratotypesEtage: any;

  private osm: L.TileLayer | undefined;
  private geologie: L.TileLayer.WMS | undefined;


  hasAccessToRn: boolean = false; // Variable pour stocker l'accès

  constructor(
    private renderer: Renderer2,
    private route: ActivatedRoute,
    private siteService: SitesService,
    public authService: AuthService,
    private nomenclaturesService: NomenclaturesService,
    private exportFiche: ExportFicheService
  ) { }

  estConnecte() {
    if (this.authService.authenticated) {
      // logged in so return true
      return true;
    }
    else return false
  }

  /**
   * Une question du questionnaire a trois états : oui, non, et pas encore
   * renseignée (null). Les afficher en deux états faisait passer une question
   * sans réponse pour une réponse négative.
   */
  /**
   * Ensemble géologique saisi à la main via « Autre ».
   *
   * Il n'est pas dans la nomenclature : sans ce rendu, une réserve n'ayant
   * qu'un ensemble saisi librement s'affichait « Aucun ensemble géologique
   * sélectionné ».
   */
  /**
   * Sites INPG encore retenus par le gestionnaire.
   *
   * Un site écarté reste rattaché à la réserve en base, avec la raison, mais
   * n'a pas à figurer sur la fiche publique : il n'y est ni compté ni affiché.
   */
  get inpgActifs(): any[] {
    return (this.site?.sites_inpg ?? []).filter((inpg: any) => inpg.active !== false);
  }

  /** Idem pour le périmètre de protection. */
  get inpgActifsPerimetre(): any[] {
    return (this.site?.perimetre_protection?.sites_inpg ?? []).filter((inpg: any) => inpg.active !== false);
  }

  /**
   * La réserve abrite-t-elle du patrimoine géologique connu ?
   *
   * Les sites ajoutés à la main par le gestionnaire comptent autant que les
   * sites INPG : ne regarder que l'INPG faisait passer pour dépourvues des
   * réserves dont tout le patrimoine avait été saisi manuellement.
   */
  get aDuPatrimoineGeologique(): boolean {
    return this.inpgActifs.length > 0 || (this.site?.patrimoines_geologiques?.length ?? 0) > 0;
  }

  get ensembleGeologiqueAutre(): string {
    return (this.site?.infos_base?.geological_units_other ?? '').trim();
  }

  estRenseigne(valeur: boolean | null | undefined): boolean {
    return valeur === true || valeur === false;
  }

  ngOnInit(): void {

    const slug = this.route.snapshot.paramMap.get('slug');

    if (slug) {
      this.siteService.getSiteBySlug(slug).subscribe((site: Site) => {
        this.site = site;
        console.log(this.site);

        this.sfgeol = this.site?.sfgeol
          ? Array.from(new Set(this.site.sfgeol.map(s => s.descr)))
            .filter(descr => typeof descr === 'string' && descr.trim() !== '')
            .sort((a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base' }))
          : [];

        this.rnId = this.site.code;
        this.authService.hasAccessToRn(this.rnId).subscribe(
          access => this.hasAccessToRn = access, // Met à jour la variable
          error => this.hasAccessToRn = false // En cas d'erreur, refuse l'accès      
        );
        setTimeout(() => (this.initMap(), this.addLayers(), this.zoomToExtent()), 1);
        // Les intérêts se lisent sur les sites INPG encore retenus et sur le
        // patrimoine ajouté à la main, jusqu'ici ignoré.
        this.uniqueInteretGeolPrincipal = Array.from(
          new Set([
            ...this.inpgActifs.map((inpg: any) => inpg.inpg.interet_geol_principal),
            ...(this.site.patrimoines_geologiques ?? []).map((p: any) => p.interet_geol_principal),
          ].filter((interet: any) => !!interet))
        );
        this.nbInpgConfidentielsReserve = this.inpgActifs.filter((inpg: { inpg: { niveau_de_diffusion: string; }; }) => inpg.inpg.niveau_de_diffusion === 'Confidentiel').length;
        if (this.site.perimetre_protection) {
          this.nbInpgConfidentielsPP = this.inpgActifsPerimetre.filter((inpg: { inpg: { niveau_de_diffusion: string; }; }) => inpg.inpg.niveau_de_diffusion === 'Confidentiel').length;
        }
        this.stratotypesLimite = this.site.stratotypes.filter((stratotype) => stratotype.type === 'limite');
        this.stratotypesEtage = this.site.stratotypes.filter((stratotype) => stratotype.type === 'etage');
        if (this.site.infos_base.geological_units) {
          this.nomenclaturesService.getNomenclaturesByTypeId(6).subscribe(
            (response: any) => {
              if (response && Array.isArray(response.nomenclatures)) {
                this.filteredGeologicalUnits = response.nomenclatures.filter((option: { id_nomenclature: number; }) =>
                  this.site!.infos_base.geological_units.includes(option.id_nomenclature)
                );
              } else {
                console.error('Expected nomenclatures to be an array, but got:', response);
              }
            },
            (error: any) => {
              console.error('Error fetching geological units', error);
            }
          );
        }
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
    this.osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    });

    this.geologie = L.tileLayer.wms("https://geoservices.brgm.fr/geologie", {
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
      layers: [this.geologie]
    });

    const baseMaps = {
      "OpenStreetMap": this.osm,
      "Carte géologique": this.geologie
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

    // Fonction permettant de créer les popups :

    const getPopupContent = (
      inpg: any,
      title: string,
      titleColor: string,
      showButton: boolean
    ) => {
      const stars = "★".repeat(Math.min(3, Math.max(0, inpg.inpg.nombre_etoiles || 0)));

      return `
      <div style="display: flex; align-items: center; gap: 10px; padding-bottom: 5px; border-bottom: 1px solid #ccc;">
      <img src="assets/images/INPG.png" alt="INPG Logo" style="width: 40px; height: auto;">
      <h3 style="margin: 0; font-size: 1rem; font-weight: bold;color: ${titleColor};">${title}</h3>
      </div>
      <p><span style="color: gold; font-size: 1.2rem;">${stars}</span> <strong>${inpg.inpg.lb_site} - ${inpg.inpg.id_metier}</strong> (${inpg.inpg.interet_geol_principal})</p>
      ${showButton ? `
        <button onclick="window.open('https://inpn.mnhn.fr/site/inpg/${inpg.inpg.id_metier}', '_blank')" style="display: block; width: 100%; padding: 5px; background-color: #4a90e2; color: white; border: none; cursor: pointer;">
        Voir la fiche
        </button>
      ` : ''}
      `;
    };

    // 3. Couche INPG publics du site

    var siteLayerStyle = {
      weight: 3,
      opacity: 0.8,
      color: '#4a90e2',
      fillOpacity: 0.5,
      fillColor: '#4a90e2'
    };

    const inpgPublicLayers = this.site!.sites_inpg
      .filter((inpg: any) => inpg.inpg.niveau_de_diffusion === 'Public')
      .map((inpg: any) => L.geoJSON(
        inpg.inpg.geom, {
        style: siteLayerStyle,
        onEachFeature: (feature, layer) => {
          const popupContent = getPopupContent(inpg, "Site INPG public", "#4a90e2", true);
          layer.bindPopup(popupContent);
        }
      }));


    if (inpgPublicLayers.length > 0) {
      const publicGroup = L.layerGroup(inpgPublicLayers).addTo(this.map!);
      this.hachurer(publicGroup, 'hachures-inpg-public', siteLayerStyle.color);
      this.layerControl.addOverlay(publicGroup, "Sites INPG publics");
      inpgPublicLayers.forEach((layer: { getBounds: () => L.LatLngExpression | L.LatLngBoundsExpression; }) => this.bounds.extend(layer.getBounds()));
      this.addLegendItem(legendContainer!, siteLayerStyle.fillColor, siteLayerStyle.fillOpacity, siteLayerStyle.color, "Sites INPG publics")
    }

    // Création d'une liste des ID utilisés dans `inpgPublicLayers`
    const existingPublicInpgIds = new Set(
      this.site!.sites_inpg
        .filter((inpg: any) => inpg.inpg.niveau_de_diffusion === 'Public')
        .map((inpg: any) => inpg.inpg.id_inpg) // Stocke uniquement les ID
    );


    // 4. Couche INPG confidentiels du site

    siteLayerStyle = {
      weight: 3,
      opacity: 0.8,
      color: '#f5a623',
      fillOpacity: 0.5,
      fillColor: '#f5a623'
    };

    const inpgConfidentialLayers = this.site!.sites_inpg
      .filter((inpg: any) => inpg.inpg.niveau_de_diffusion === 'Confidentiel')
      .map((inpg: any) => L.geoJSON(
        inpg.inpg.geom, {
        style: siteLayerStyle,
        onEachFeature: (feature, layer) => {
          const popupContent = getPopupContent(inpg, "Site INPG confidentiel", "#f5a623", false);
          layer.bindPopup(popupContent);
        }
      }));

    if (inpgConfidentialLayers.length > 0 && this.estConnecte()) {
      const confidentialGroup = L.layerGroup(inpgConfidentialLayers).addTo(this.map!);
      this.hachurer(confidentialGroup, 'hachures-inpg-confidentiel', siteLayerStyle.color);
      this.layerControl.addOverlay(confidentialGroup, "Sites INPG confidentiels");
      inpgConfidentialLayers.forEach((layer: { getBounds: () => L.LatLngExpression | L.LatLngBoundsExpression; }) => this.bounds.extend(layer.getBounds()));
      this.addLegendItem(legendContainer!, siteLayerStyle.fillColor, siteLayerStyle.fillOpacity, siteLayerStyle.color, "Sites INPG confidentiels")
    }

    const existingConfidentialInpgIds = new Set(
      this.site!.sites_inpg
        .filter((inpg: any) => inpg.inpg.niveau_de_diffusion === 'Confidentiel')
        .map((inpg: any) => inpg.inpg.id_inpg) // Stocke uniquement les ID
    );

    // 5. Couche INPG publics du périmètre de protection

    siteLayerStyle = {
      weight: 3,
      opacity: 0.8,
      color: '#4a90e2',
      fillOpacity: 0.5,
      fillColor: '#4a90e2'
    };
    if (this.site!.perimetre_protection && this.site!.perimetre_protection.sites_inpg) {
      const protectionInpgPublicLayers = this.site!.perimetre_protection.sites_inpg
        .filter((inpg: any) => inpg.inpg.niveau_de_diffusion === 'Public' &&
          !existingPublicInpgIds.has(inpg.inpg.id_inpg) // Vérifie si l'ID est déjà présent)
        )
        .map((inpg: any) => L.geoJSON(
          inpg.inpg.geom, {
          style: siteLayerStyle,
          onEachFeature: (feature, layer) => {
            const popupContent = getPopupContent(inpg, "Site INPG public", "#4a90e2", true);
            layer.bindPopup(popupContent);
          }
        }));

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

    if (this.site!.perimetre_protection && this.site!.perimetre_protection.sites_inpg) {
      const protectionInpgConfidentialLayers = this.site!.perimetre_protection.sites_inpg
        .filter((inpg: any) => inpg.inpg.niveau_de_diffusion === 'Confidentiel' &&
          !existingConfidentialInpgIds.has(inpg.inpg.id_inpg) // Vérifie si l'ID est déjà présent)
        )
        .map((inpg: any) => L.geoJSON(
          inpg.inpg.geom, {
          style: siteLayerStyle,
          onEachFeature: (feature, layer) => {
            const popupContent = getPopupContent(inpg, "Site INPG confidentiel", "#f5a623", false);
            layer.bindPopup(popupContent);
          }
        }));

      if (protectionInpgConfidentialLayers.length > 0 && this.estConnecte()) {
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

  // fetchPatrimoineGeologique(siteId: any): void {
  //   this.patrimoineGeologiqueService.getPatrimoineGeologique(siteId).subscribe(
  //     (data: any) => {
  //       if (data && data.principal && data.protection) {
  //         this.principalHeritage = data.principal;
  //         this.protectionHeritage = data.protection;

  //       } else {
  //         console.error('Unexpected data format:', data);
  //       }
  //     },
  //     (error: any) => {
  //       console.error('Error fetching geological heritage data', error);
  //     }
  //   );
  // }

  // setGeologicalHeritages(): void {
  //   this.principalHeritage = this.patrimoineGeologique?.geologicalHeritages || [];
  // }

  // setProtectionGeologicalHeritages(): void {
  //   this.protectionHeritage = this.patrimoineGeologique?.protectionGeologicalHeritages || [];
  // }



  // setPaleontologicalLabels(): void {
  //   this.paleontologicalLabels = []; // Réinitialiser les labels

  //   // On vérifie si la réponse à la question 5 est "Oui"
  //   const heritage = this.tInfosBaseSiteForm.get('contains_paleontological_heritage');

  //   if (heritage?.get('answer')?.value === true) { // Vérifie si l'utilisateur a répondu "Oui"
  //     if (heritage.get('vertebrates')?.value) {
  //       this.paleontologicalLabels.push('Vertébrés');
  //     }
  //     if (heritage.get('invertebrates')?.value) {
  //       this.paleontologicalLabels.push('Invertébrés');
  //     }
  //     if (heritage.get('plants')?.value) {
  //       this.paleontologicalLabels.push('Végétaux');
  //     }
  //     if (heritage.get('traceFossils')?.value) {
  //       this.paleontologicalLabels.push('Traces fossiles');
  //     }

  //   }
  // }

  // setGeologicalInterests(patrimoineGeologique: any): void {
  //   const interests: GeologicalInterests = {
  //     stratigraphic: patrimoineGeologique?.main_geological_interests_stratigraphic,
  //     paleontological: patrimoineGeologique?.main_geological_interests_paleontological,
  //     sedimentological: patrimoineGeologique?.main_geological_interests_sedimentological,
  //     geomorphological: patrimoineGeologique?.main_geological_interests_geomorphological,
  //     mineral_resource: patrimoineGeologique?.main_geological_interests_mineral_resource,
  //     mineralogical: patrimoineGeologique?.main_geological_interests_mineralogical,
  //     metamorphism: patrimoineGeologique?.main_geological_interests_metamorphism,
  //     volcanism: patrimoineGeologique?.main_geological_interests_volcanism,
  //     plutonism: patrimoineGeologique?.main_geological_interests_plutonism,
  //     hydrogeology: patrimoineGeologique?.main_geological_interests_hydrogeology,
  //     tectonics: patrimoineGeologique?.main_geological_interests_tectonics
  //   };

  //   this.geologicalInterests = (Object.keys(interests) as (keyof GeologicalInterests)[])
  //     .filter(key => interests[key])
  //     .map(key => this.getInterestLabel(key));
  // }

  // getInterestLabel(key: keyof GeologicalInterests): string {
  //   const labels: { [key in keyof GeologicalInterests]: string } = {
  //     stratigraphic: 'Stratigraphique',
  //     paleontological: 'Paléontologique',
  //     sedimentological: 'Sédimentologique',
  //     geomorphological: 'Géomorphologique',
  //     mineral_resource: 'Ressource minérale',
  //     mineralogical: 'Minéralogique',
  //     metamorphism: 'Métamorphisme',
  //     volcanism: 'Volcanisme',
  //     plutonism: 'Plutonisme',
  //     hydrogeology: 'Hydrogéologie',
  //     tectonics: 'Tectonique'
  //   };
  //   return labels[key];
  // }

  // getSelectedSubstances(): Nomenclature[] {
  //   const selectedMnemonics = this.tInfosBaseSiteForm.get('substance')?.value || [];
  //   return this.substancesOptions.filter(substance => selectedMnemonics.includes(substance.mnemonique));
  // }

  /**
   * Exporte la fiche en PDF.
   *
   * Le PDF est composé à partir des données par ExportFicheService ; seule la
   * carte est capturée en image. Si la capture échoue — une feuille de style
   * distante qui refuse d'être lue suffit — l'export se poursuit sans elle
   * plutôt que de ne rien produire.
   */
  async exportData(): Promise<void> {
    // Seuls les pictogrammes sont capturés : ce sont des icônes vectorielles,
    // que jsPDF ne sait pas dessiner sans embarquer leur police. Les valeurs
    // et les libellés restent du texte.
    const pictos = await this.capturerPictos();
    const carte = await this.capturerCarte();
    const legende = await this.capturerElement('.legend-container');

    this.exportFiche.genererPdf({
      site: this.site,
      inpgActifs: this.inpgActifs,
      ensemblesGeologiques: this.filteredGeologicalUnits ?? [],
      ensembleGeologiqueAutre: this.ensembleGeologiqueAutre,
      interetsGeologiques: this.uniqueInteretGeolPrincipal ?? [],
      stratotypesLimite: this.stratotypesLimite ?? [],
      stratotypesEtage: this.stratotypesEtage ?? [],
      inpgActifsPerimetre: this.inpgActifsPerimetre,
      formationsGeologiques: this.sfgeol ?? [],
      pictos,
      carte,
      legende,
    });
  }

  /**
   * Convertit en PNG les pictogrammes du bandeau de chiffres clés.
   *
   * FontAwesome rend des SVG en ligne, qu'on sérialise et rasterise
   * directement. Passer par html-to-image, comme pour la carte, rejouait
   * l'inlining de toutes les feuilles de style à chaque icône : cinq appels
   * concurrents ne rendaient plus la main, la récupération des polices
   * distantes n'ayant pas de délai de garde.
   */
  private async capturerPictos(): Promise<(string | null)[]> {
    const svgs = Array.from(
      document.querySelectorAll<SVGElement>('.stats-container .stat-item fa-icon svg'));
    return Promise.all(svgs.map(svg => this.svgVersPng(svg)));
  }

  private svgVersPng(svg: SVGElement): Promise<string | null> {
    const COTE = 64;
    const copie = svg.cloneNode(true) as SVGElement;
    copie.setAttribute('width', `${COTE}`);
    copie.setAttribute('height', `${COTE}`);
    // currentColor n'a plus de contexte une fois le SVG détaché.
    copie.setAttribute('fill', getComputedStyle(svg).color || '#518196');

    const source = new XMLSerializer().serializeToString(copie);
    const url = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(source)));

    return new Promise(resolve => {
      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = COTE;
        canvas.height = COTE;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(null);
          return;
        }
        ctx.drawImage(image, 0, 0, COTE, COTE);
        resolve(canvas.toDataURL('image/png'));
      };
      image.onerror = () => resolve(null);
      image.src = url;
    });
  }

  /** Capture un bloc de la fiche en PNG, ou null si la capture échoue. */
  private async capturerElement(selecteur: string): Promise<string | null> {
    const element = document.querySelector<HTMLElement>(selecteur);
    if (!element) {
      return null;
    }
    try {
      return await toPng(element, { cacheBust: true, backgroundColor: '#ffffff' });
    } catch (erreur) {
      console.error(`Bloc ${selecteur} non exporté :`, erreur);
      return null;
    }
  }

  /** Capture la carte seule, recentrée sur la réserve et sans ses contrôles. */
  private async capturerCarte(): Promise<string | null> {
    const map = this.map;
    if (!map) {
      return null;
    }

    const controles = Array.from(
      document.querySelectorAll<HTMLElement>('.leaflet-control-layers, .leaflet-control-zoom'));
    controles.forEach(c => (c.style.visibility = 'hidden'));

    let fondInitial: L.Layer | null = null;
    map.eachLayer(couche => {
      if (couche === this.osm || couche === this.geologie) {
        fondInitial = couche;
      }
    });

    try {
      this.zoomToExtent();
      // Le fond OpenStreetMap s'exporte mieux que les tuiles du BRGM, qui
      // n'autorisent pas toujours la lecture depuis un canvas.
      if (fondInitial && fondInitial !== this.osm) {
        map.removeLayer(fondInitial);
        this.osm?.addTo(map);
      }
      map.invalidateSize();
      await new Promise(resolve => setTimeout(resolve, 1500));
      return await toPng(map.getContainer(), { cacheBust: true });
    } catch (erreur) {
      console.error("Carte non exportée :", erreur);
      return null;
    } finally {
      if (fondInitial && fondInitial !== this.osm) {
        map.removeLayer(this.osm!);
        (fondInitial as L.Layer).addTo(map);
      }
      controles.forEach(c => (c.style.visibility = ''));
    }
  }







  hexToRGBA(hex: string, opacity: number): string {
    const bigint = parseInt(hex.slice(1), 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }

  /**
   * Motif de hachures pour les emprises INPG.
   *
   * Les sites INPG se superposent souvent presque exactement à l'emprise de la
   * réserve : deux aplats de couleur deviennent alors indistinguables. Les
   * hachures laissent voir ce qu'il y a dessous.
   *
   * Leaflet n'expose pas les motifs SVG : on injecte le `<pattern>` dans le
   * `<svg>` que son moteur de rendu crée, puis on pointe le `fill` des tracés
   * dessus.
   */
  private assurerMotifHachures(id: string, couleur: string): void {
    const svg = this.map?.getPane('overlayPane')?.querySelector('svg');
    if (!svg || svg.querySelector(`#${id}`)) {
      return;
    }

    const ns = 'http://www.w3.org/2000/svg';
    let defs = svg.querySelector('defs');
    if (!defs) {
      defs = document.createElementNS(ns, 'defs');
      svg.insertBefore(defs, svg.firstChild);
    }

    const motif = document.createElementNS(ns, 'pattern');
    motif.setAttribute('id', id);
    motif.setAttribute('patternUnits', 'userSpaceOnUse');
    motif.setAttribute('width', '8');
    motif.setAttribute('height', '8');
    motif.setAttribute('patternTransform', 'rotate(45)');

    const trait = document.createElementNS(ns, 'line');
    trait.setAttribute('x1', '0');
    trait.setAttribute('y1', '0');
    trait.setAttribute('x2', '0');
    trait.setAttribute('y2', '8');
    trait.setAttribute('stroke', couleur);
    trait.setAttribute('stroke-width', '3');

    motif.appendChild(trait);
    defs.appendChild(motif);
  }

  /** Applique le motif de hachures aux tracés d'un groupe de couches. */
  private hachurer(groupe: L.LayerGroup, id: string, couleur: string): void {
    this.assurerMotifHachures(id, couleur);
    groupe.eachLayer((couche: any) => {
      const appliquer = (c: any) => {
        const element = typeof c.getElement === 'function' ? c.getElement() : null;
        if (element) {
          element.setAttribute('fill', `url(#${id})`);
          element.setAttribute('fill-opacity', '1');
        }
      };
      if (typeof couche.eachLayer === 'function') {
        couche.eachLayer(appliquer);
      } else {
        appliquer(couche);
      }
    });
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

