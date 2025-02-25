import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from 'src/app/home-rnf/services/auth-service.service';
import { Nomenclature, NomenclatureType } from 'src/app/models/nomenclature.model';
import { PatrimoineGeologique } from 'src/app/models/patrimoine-geologique.model';
import { Stratotype } from 'src/app/models/site.model';
import { NomenclaturesService } from 'src/app/services/nomenclatures.service';
import { PatrimoineGeologiqueService } from 'src/app/services/patrimoine-geologique.service';
import { SitesService } from 'src/app/services/sites.service';
import { TInfosBaseSiteService } from 'src/app/services/t-infos-base-site.service';
import Swal from 'sweetalert2';


@Component({
  selector: 'app-questionnaire-simplifie',
  templateUrl: './questionnaire-simplifie.component.html',
  styleUrls: ['./questionnaire-simplifie.component.scss']
})
export class QuestionnaireSimplifieComponent implements OnInit {
  tInfosBaseSiteForm: FormGroup;
  siteSlug: string | undefined;
  siteIdLocal: string | undefined;
  id_site: any;
  eres: NomenclatureType | undefined;
  systemes: NomenclatureType | undefined;
  filteredSystemes: Nomenclature[] | undefined;
  series: NomenclatureType | undefined;
  filteredSeries: Nomenclature[] | undefined;
  etages: NomenclatureType | undefined;
  filteredEtages: Nomenclature[] | undefined;
  selectedEresIds: number[] = [];
  selectedSystemesIds: number[] = [];
  selectedSeriesIds: number[] = [];
  site: any;
  sitesWithProtection: any[] = [];
  principalHeritage: any[] = [];
  protectionHeritage: any[] = [];
  geologicalUnitsOptions: Nomenclature[] = [];
  substancesOptions: Nomenclature[] = [];
  filteredSubstancesOptions: Nomenclature[] = [];
  searchSubstanceTerm = new FormControl('');
  showInpg: boolean = false;
  showPpInpg: boolean = false;
  stratotypesEtage: Stratotype[] = [];
  stratotypesLimite: Stratotype[] = [];
  filteredStratotypesEtage: Stratotype[] = [];
  filteredStratotypesLimite: Stratotype[] = [];
  searchStratotypesEtageTerm = new FormControl('');
  searchStratotypesLimiteTerm = new FormControl('');
  isFormSubmitted = false;


  geologicalInterestOptions: string[] = [
    'Paléontologie',
    'Ressources naturelles',
    'Plutonisme',
    'Métamorphisme',
    'Hydrogéologie',
    'Volcanisme',
    'Pétrologie',
    'Hydrothermalisme',
    'Géochronologie',
    'Sédimentologie',
    'Stratigraphie',
    'Tectonique',
    'Géomorphologie',
    'Minéralogie',
    'Collection'
  ]



  constructor(
    private fb: FormBuilder,
    private tInfosBaseSiteService: TInfosBaseSiteService,
    private nomenclaturesService: NomenclaturesService,
    private siteService: SitesService,
    private patrimoineGeologiqueService: PatrimoineGeologiqueService,
    private router: Router,
    private route: ActivatedRoute,
    public authService: AuthService
  ) {

    console.log(this.authService.getCurrentUser());


    this.tInfosBaseSiteForm = this.fb.group({
      id_site: [''],
      geologicalUnits: this.fb.array([]), // Gère les ensembles géologiques sélectionnés
      geologicalUnitsAutre: [false],
      geologicalUnitsOtherText: [''],
      stratotypesLimite: this.fb.array([]),
      stratotypesEtage: this.fb.array([]),
      associated_with_mineral_resources: [false],
      mineral_resources_old_quarry: [false],
      mineral_resources_active_quarry: [false],
      mineral_resources_old_mine: [false],
      mineral_resources_active_mine: [false],
      quarry_extracted_materials: this.fb.array([]),
      mine_extracted_materials: this.fb.array([]),

      reserve_created_on_geological_basis: [false],
      reserve_contains_geological_heritage_inpg: [false],
      geologicalHeritages: this.fb.array([]),
      protection_perimeter_contains_geological_heritage_inpg: [false],
      protection_geologicalHeritages: this.fb.array([]),
      protection_perimeter_contains_geological_heritage_other: [''],
      main_geological_interests: this.fb.group({
        stratigraphic: [false],
        paleontological: [false],
        sedimentological: [false],
        geomorphological: [false],
        mineral_resource: [false],
        mineralogical: [false],
        metamorphism: [false],
        volcanism: [false],
        plutonism: [false],
        hydrogeology: [false],
        tectonics: [false]
      }),
      contains_paleontological_heritage: this.fb.group({
        answer: [false],
        no_answer: [false],
        vertebrates: [false],
        invertebrates: [false],
        plants: [false],
        traceFossils: [false],
        other: [false],
        otherDetails: ['']
      }),
      reserve_has_geological_collections: [false],
      reserve_has_exhibition: [false],
      reserve_contains_stratotype: [false],
      stratotype_limit: [false],
      stratotype_limit_input: [''],
      stratotype_stage: [false],
      stratotype_stage_input: [''],
      reserve_does_not_contain_stratotype: [false],
      contains_subterranean_habitats: [false],
      subterranean_habitats_natural_cavities: [false],
      subterranean_habitats_anthropogenic_cavities: [false],
      does_not_contain_subterranean_habitats: [false],
      quarry_extracted_material: [''],
      quarry_fossiliferous_material: [false],
      mine_extracted_material: [''],
      mine_fossiliferous_material: [false],
      reserve_has_geological_site_for_visitors: [false],
      site_for_visitors_free_access: [],
      offers_geodiversity_activities: [false],
      eres: [],
      systemes: [],
      series: [],
      etages: [],
      biblio: [],
      user_update: [this.authService.getCurrentUser().nom_complet + " (" + this.authService.getCurrentUser().id_role + ")"]
    }, { validators: [this.validateStratotypeSelection, this.validatePaleontologicalHeritageSelection, this.validateSubterraneanHabitatsSelection, this.validateAssociatedWithMineralResources] });
  }

  private validateStratotypeSelection(form: FormGroup): { [key: string]: boolean } | null {
    const containsStratotype = form.get('reserve_contains_stratotype')?.value;
    const stratotypesLimite = form.get('stratotypesLimite') as FormArray;
    const stratotypesEtage = form.get('stratotypesEtage') as FormArray;

    if (containsStratotype && stratotypesLimite.length === 0 && stratotypesEtage.length === 0) {
      return { missingStratotype: true }; // Ajoute une erreur personnalisée
    }

    return null; // Pas d'erreur
  }

  private validatePaleontologicalHeritageSelection(form: FormGroup): { [key: string]: boolean } | null {
    const paleoGroup = form.get('contains_paleontological_heritage') as FormGroup;
    if (!paleoGroup) return null;

    const answer = paleoGroup.get('answer')?.value;
    const vertebrates = paleoGroup.get('vertebrates')?.value;
    const invertebrates = paleoGroup.get('invertebrates')?.value;
    const plants = paleoGroup.get('plants')?.value;
    const traceFossils = paleoGroup.get('traceFossils')?.value;
    const other = paleoGroup.get('other')?.value;

    // Vérifier si answer est vrai et si aucun des champs suivants n'est coché
    if (answer && !vertebrates && !invertebrates && !plants && !traceFossils && !other) {
      return { missingPaleontologicalSelection: true }; // Retourne une erreur
    }

    return null; // Aucune erreur
  }

  private validateSubterraneanHabitatsSelection(form: FormGroup): { [key: string]: boolean } | null {
    const containsHabitats = form.get('contains_subterranean_habitats')?.value;
    const naturalCavities = form.get('subterranean_habitats_natural_cavities')?.value;
    const anthropogenicCavities = form.get('subterranean_habitats_anthropogenic_cavities')?.value;

    // Vérifier si contains_subterranean_habitats est true et que les deux autres sont false
    if (containsHabitats && !naturalCavities && !anthropogenicCavities) {
      return { missingSubterraneanSelection: true }; // Retourne une erreur
    }

    return null; // Pas d'erreur
  }

  private validateAssociatedWithMineralResources(form: FormGroup): { [key: string]: boolean } | null {
    const associated_with_mineral_resources = form.get('associated_with_mineral_resources')?.value;
    const mineral_resources_old_quarry = form.get('mineral_resources_old_quarry')?.value;
    const mineral_resources_active_quarry = form.get('mineral_resources_active_quarry')?.value;
    const mineral_resources_old_mine = form.get('mineral_resources_old_mine')?.value;
    const mineral_resources_active_mine = form.get('mineral_resources_active_mine')?.value;

    // Vérifier si contains_subterranean_habitats est true et que les deux autres sont false
    if (associated_with_mineral_resources && !mineral_resources_old_quarry && !mineral_resources_active_quarry && !mineral_resources_old_mine && !mineral_resources_active_mine) {
      return { missingMineralResourcesSelection: true }; // Retourne une erreur
    }

    return null; // Pas d'erreur
  }



  ngOnInit(): void {
    this.siteIdLocal = this.route.snapshot.paramMap.get('id_rn')!;
    this.fetchSiteDetails(this.siteIdLocal);
    this.loadNomenclature();
    this.loadStratotypes();
    this.initGeologicalUnitsCheckboxes();
    // this.ajouterPatrimoineGeolPP();
    // this.ajouterPatrimoineGeol();
    // Surveiller les changements du champ de recherche pour filtrer les substances
    this.searchSubstanceTerm.valueChanges.subscribe((searchTerm: string | null) => {
      this.filterSubstances(searchTerm);
    });
    this.searchStratotypesEtageTerm.valueChanges.subscribe((searchTerm: string | null) => {
      this.filterStratotypeEtage(searchTerm);
    })
    this.searchStratotypesLimiteTerm.valueChanges.subscribe((searchTerm: string | null) => {
      this.filterStratotypeLimite(searchTerm);
    })
    this.resetFieldOnParentChange('contains_paleontological_heritage.answer', 'contains_paleontological_heritage.vertebrates');
    this.resetFieldOnParentChange('contains_paleontological_heritage.answer', 'contains_paleontological_heritage.invertebrates');
    this.resetFieldOnParentChange('contains_paleontological_heritage.answer', 'contains_paleontological_heritage.plants');
    this.resetFieldOnParentChange('contains_paleontological_heritage.answer', 'contains_paleontological_heritage.traceFossils');
    this.resetFieldOnParentChange('contains_paleontological_heritage.answer', 'contains_paleontological_heritage.other');
    this.resetFieldOnParentChange('contains_paleontological_heritage.answer', 'contains_paleontological_heritage.otherDetails');
    this.resetFieldOnParentChange('contains_paleontological_heritage.other', 'contains_paleontological_heritage.otherDetails');
    this.resetFieldOnParentChange('geologicalUnitsOther', 'geologicalUnitsOtherText');
    this.resetFieldOnParentChange('stratotype_limit', 'stratotypesLimite', true);
    this.resetFieldOnParentChange('stratotype_stage', 'stratotypesEtage', true);
    this.resetFieldOnParentChange('reserve_contains_stratotype', 'stratotypesLimite', true);
    this.resetFieldOnParentChange('reserve_contains_stratotype', 'stratotypesEtage', true);
    this.resetFieldOnParentChange('reserve_contains_stratotype', 'stratotype_limit');
    this.resetFieldOnParentChange('reserve_contains_stratotype', 'stratotype_stage');
    this.resetFieldOnParentChange('contains_subterranean_habitats', 'subterranean_habitats_natural_cavities');
    this.resetFieldOnParentChange('contains_subterranean_habitats', 'subterranean_habitats_anthropogenic_cavities');
    this.resetFieldOnParentChange('reserve_has_geological_site_for_visitors', 'site_for_visitors_free_access');
    this.resetFieldOnParentChange('associated_with_mineral_resources', 'quarry_extracted_materials', true);
    this.resetFieldOnParentChange('associated_with_mineral_resources', 'mineral_resources_old_quarry');
    this.resetFieldOnParentChange('associated_with_mineral_resources', 'mineral_resources_active_quarry');
    this.resetFieldOnParentChange('associated_with_mineral_resources', 'mineral_resources_old_mine');
    this.resetFieldOnParentChange('associated_with_mineral_resources', 'mineral_resources_active_mine');
  }

  private resetFieldOnParentChange(parentControlName: string, childControlName: string, isArray: boolean = false): void {
    this.tInfosBaseSiteForm.get(parentControlName)?.valueChanges.subscribe(value => {
      if (!value) {
        const childControl = this.tInfosBaseSiteForm.get(childControlName);

        if (isArray && childControl instanceof FormArray) {
          // Réinitialiser le FormArray en le vidant
          while (childControl.length !== 0) {
            childControl.removeAt(0);
          }
        } else {
          // Réinitialiser un champ classique à null
          childControl?.setValue(null, { emitEvent: false });
        }
      }
    });
  }


  initGeologicalUnitsCheckboxes(): void {
    const geologicalUnitsArray = this.geologicalUnitsOptions.map(unit =>
      new FormControl(this.isUnitSelected(unit.id_nomenclature))
    );
    geologicalUnitsArray.push(new FormControl(false)); // Case "Autre"

    this.tInfosBaseSiteForm.setControl('geologicalUnits', this.fb.array(geologicalUnitsArray));
    if (!this.tInfosBaseSiteForm.get('geologicalUnitsOther')) {
      this.tInfosBaseSiteForm.addControl('geologicalUnitsOther', new FormControl(false));
    }
    if (!this.tInfosBaseSiteForm.get('geologicalUnitsOtherText')) {
      this.tInfosBaseSiteForm.addControl('geologicalUnitsOtherText', new FormControl(''));
    }
  }


  // Vérifie si une unité géologique est sélectionnée
  isUnitSelected(id: number): boolean {
    // Vérifie si l'ID est présent dans les données du site
    return this.site?.infos_base?.geological_units?.includes(id) || false;
  }

  getFormControl(controlName: string): FormControl {
    return this.tInfosBaseSiteForm.get(controlName) as FormControl;
  }


  getSelectedGeologicalUnits(): number[] {
    return this.tInfosBaseSiteForm.value.geologicalUnits
      .map((checked: boolean, i: number) => checked ? this.geologicalUnitsOptions[i].id_nomenclature : null)
      .filter((id: number | null) => id !== null);
  }



  loadNomenclature(): void {
    this.nomenclaturesService.getNomenclaturesByTypeId(6).subscribe(
      (response: any) => {
        if (response && Array.isArray(response.nomenclatures)) {
          this.geologicalUnitsOptions = response.nomenclatures;
        } else {
          console.error('Expected nomenclatures to be an array, but got:', response);
        }
      },
      (error: any) => {
        console.error('Error fetching geological units', error);
      }
    );
    this.nomenclaturesService.getNomenclaturesByTypeId(7).subscribe(
      (response: any) => {
        if (response && Array.isArray(response.nomenclatures)) {
          this.substancesOptions = response.nomenclatures;
          this.filteredSubstancesOptions = this.substancesOptions;

        } else {
          console.error('Expected nomenclatures to be an array, but got:', response);
        }
      },
      (error: any) => {
        console.error('Error fetching substances', error);
      }
    );
  }

  loadStratotypes(): void {
    this.siteService.getStratotypesEtage().subscribe(
      data => {
        this.stratotypesEtage = data
        this.filteredStratotypesEtage = data
      }
    );
    this.siteService.getStratotypesLimite().subscribe(
      data => {
        this.stratotypesLimite = data
        this.filteredStratotypesLimite = data
      }
    )
  }

  fetchSiteDetails(id_rn: string): void {
    this.siteService.getSiteByIdLocal(id_rn).subscribe(
      (site: any) => {
        this.site = site;
        this.siteSlug = this.site.slug;
        console.log(this.site);
        if (this.site.sites_inpg.length < 6) {
          this.showInpg = true
        }
        if (this.site.perimetre_protection && this.site.perimetre_protection.sites_inpg.length < 6) {
          this.showPpInpg = true
        }

        this.id_site = site.id_site;

        this.tInfosBaseSiteForm.patchValue({
          id_site: site.id_site,
          reserve_created_on_geological_basis: site.creation_geol,
          // reserve_contains_geological_heritage_inpg: site.reserve_contains_geological_heritage_inpg || site.sites_inpg.length > 0,
          // protection_perimeter_contains_geological_heritage_inpg: site.protection_perimeter_contains_geological_heritage_inpg || site.sites_inpg.length > 0,
          reserve_has_geological_collections: site.infos_base.reserve_has_geological_collections,
          reserve_has_exhibition: site.infos_base.reserve_has_exhibition,
          reserve_contains_stratotype: site.stratotypes.length > 0,
          // stratotype_limit: site.infos_base.stratotype_limit,
          // stratotype_limit_input: site.infos_base.stratotype_limit_input,
          // stratotype_stage: site.infos_base.stratotype_stage,
          // stratotype_stage_input: site.infos_base.stratotype_stage_input,
          reserve_does_not_contain_stratotype: site.infos_base.reserve_does_not_contain_stratotype,
          contains_subterranean_habitats: site.infos_base.contains_subterranean_habitats,
          subterranean_habitats_natural_cavities: site.infos_base.subterranean_habitats_natural_cavities,
          subterranean_habitats_anthropogenic_cavities: site.infos_base.subterranean_habitats_anthropogenic_cavities,
          does_not_contain_subterranean_habitats: site.infos_base.does_not_contain_subterranean_habitats,
          associated_with_mineral_resources: site.infos_base.mineral_resources_old_quarry || site.infos_base.mineral_resources_active_quarry || site.infos_base.mineral_resources_old_mine || site.infos_base.mineral_resources_active_mine,
          mineral_resources_old_quarry: site.infos_base.mineral_resources_old_quarry,
          mineral_resources_active_quarry: site.infos_base.mineral_resources_active_quarry,
          quarry_extracted_material: site.infos_base.quarry_extracted_material,
          quarry_fossiliferous_material: site.infos_base.quarry_fossiliferous_material,
          mineral_resources_old_mine: site.infos_base.mineral_resources_old_mine,
          mineral_resources_active_mine: site.infos_base.mineral_resources_active_mine,
          mine_extracted_material: site.infos_base.mine_extracted_material,
          mine_fossiliferous_material: site.infos_base.mine_fossiliferous_material,
          reserve_has_geological_site_for_visitors: site.infos_base.reserve_has_geological_site_for_visitors,
          site_for_visitors_free_access: site.infos_base.site_for_visitors_free_access,
          offers_geodiversity_activities: site.infos_base.offers_geodiversity_activities,
          geologicalUnits: [],
          geologicalUnitsOther: site.infos_base.geological_units_other,
          geologicalUnitsOtherText: site.infos_base.geological_units_other,
          biblio: site.infos_base.biblio
        });

        this.initGeologicalUnitsCheckboxes();

        this.tInfosBaseSiteForm.get('main_geological_interests')?.patchValue({
          stratigraphic: site.infos_base.main_geological_interests_stratigraphic,
          paleontological: site.infos_base.main_geological_interests_paleontological,
          sedimentological: site.infos_base.main_geological_interests_sedimentological,
          geomorphological: site.infos_base.main_geological_interests_geomorphological,
          mineral_resource: site.infos_base.main_geological_interests_mineral_resource,
          mineralogical: site.infos_base.main_geological_interests_mineralogical,
          metamorphism: site.infos_base.main_geological_interests_metamorphism,
          volcanism: site.infos_base.main_geological_interests_volcanism,
          plutonism: site.infos_base.main_geological_interests_plutonism,
          hydrogeology: site.infos_base.main_geological_interests_hydrogeology,
          tectonics: site.infos_base.main_geological_interests_tectonics
        });

        this.tInfosBaseSiteForm.get('contains_paleontological_heritage')?.patchValue({
          answer: site.infos_base.contains_paleontological_heritage_vertebrates || site.infos_base.contains_paleontological_heritage_invertebrates || site.infos_base.contains_paleontological_heritage_plants || site.infos_base.contains_paleontological_heritage_trace_fossils,
          // no_answer: !site.infos_base.contains_paleontological_heritage,
          vertebrates: site.infos_base.contains_paleontological_heritage_vertebrates,
          invertebrates: site.infos_base.contains_paleontological_heritage_invertebrates,
          plants: site.infos_base.contains_paleontological_heritage_plants,
          traceFossils: site.infos_base.contains_paleontological_heritage_trace_fossils,
          other: site.infos_base.contains_paleontological_heritage_other_details,
          otherDetails: site.infos_base.contains_paleontological_heritage_other_details

        });
        this.patchStratotypes(site.stratotypes);

        this.patchSubstances();
        this.populateGeologicalHeritages(site.patrimoines_geologiques)
        if (site.perimetre_protection) {
          this.populateProtectionGeologicalHeritages(site.perimetre_protection.patrimoines_geologiques)
        }
      },
      error => {
        console.error('Error fetching site details', error);
      }
    );
  }

  patchStratotypes(stratotypes: any[]): void {
    const stratotypesLimite = stratotypes
      .filter((stratotype: any) => stratotype.type === 'limite')
      .map((stratotype: any) => stratotype.id_stratotype);

    this.tInfosBaseSiteForm.get('stratotype_limit')?.setValue(stratotypesLimite.length > 0);

    const stratotypesEtage = stratotypes
      .filter((stratotype: any) => stratotype.type === 'etage')
      .map((stratotype: any) => stratotype.id_stratotype);

    this.tInfosBaseSiteForm.get('stratotype_stage')?.setValue(stratotypesEtage.length > 0);

    // Mise à jour des FormArray
    const stratotypesLimiteArray = this.tInfosBaseSiteForm.get('stratotypesLimite') as FormArray;
    stratotypesLimiteArray.clear();
    stratotypesLimite.forEach((id: number) => stratotypesLimiteArray.push(new FormControl(id)));

    const stratotypesEtageArray = this.tInfosBaseSiteForm.get('stratotypesEtage') as FormArray;
    stratotypesEtageArray.clear();
    stratotypesEtage.forEach((id: number) => stratotypesEtageArray.push(new FormControl(id)));
  }



  get geologicalHeritages(): FormArray {
    return this.tInfosBaseSiteForm.get('geologicalHeritages') as FormArray;
  }

  get protectionGeologicalHeritages(): FormArray {
    return this.tInfosBaseSiteForm.get('protection_geologicalHeritages') as FormArray;
  }

  populateGeologicalHeritages(data: PatrimoineGeologique[]): void {
    const heritageArray = this.geologicalHeritages;
    data.forEach((heritage: PatrimoineGeologique) => {
      heritageArray.push(this.fb.group({
        lb: [heritage.lb, Validators.required],
        nombre_etoiles: [heritage.nombre_etoiles],
        interet_geol_principal: [heritage.interet_geol_principal, Validators.required],
        age_des_terrains_le_plus_recent: [heritage.age_des_terrains_le_plus_recent],
        age_des_terrains_le_plus_ancien: [heritage.age_des_terrains_le_plus_ancien],
        bibliographie: [heritage.bibliographie, Validators.required]
      }));
    });
  }

  populateProtectionGeologicalHeritages(data: PatrimoineGeologique[]): void {
    const heritageArray = this.protectionGeologicalHeritages;
    data.forEach((heritage: PatrimoineGeologique) => {
      heritageArray.push(this.fb.group({
        lb: [heritage.lb, Validators.required],
        nombre_etoiles: [heritage.nombre_etoiles],
        interet_geol_principal: [heritage.interet_geol_principal, Validators.required],
        age_des_terrains_le_plus_recent: [heritage.age_des_terrains_le_plus_recent],
        age_des_terrains_le_plus_ancien: [heritage.age_des_terrains_le_plus_ancien],
        bibliographie: [heritage.bibliographie, Validators.required]
      }));
    });
  }

  ajouterPatrimoineGeol(): void {
    this.geologicalHeritages.push(this.fb.group({
      lb: ['', Validators.required],
      nombre_etoiles: [0],
      interet_geol_principal: ['', Validators.required],
      age_des_terrains_le_plus_recent: [''],
      age_des_terrains_le_plus_ancien: [''],
      bibliographie: ['', Validators.required]
    }));
  }

  ajouterPatrimoineGeolPP(): void {
    this.protectionGeologicalHeritages.push(this.fb.group({
      lb: ['', Validators.required],
      nombre_etoiles: [0],
      interet_geol_principal: ['', Validators.required],
      age_des_terrains_le_plus_recent: [''],
      age_des_terrains_le_plus_ancien: [''],
      bibliographie: ['', Validators.required]
    }));
  }


  removeHeritage(index: number): void {
    this.geologicalHeritages.removeAt(index);
  }

  removeSubstance(index: number): void {
    this.quarryExtractedMaterials.removeAt(index);
  }

  removeProtectionHeritage(index: number): void {
    this.protectionGeologicalHeritages.removeAt(index);
  }

  rateHeritage(index: number, rating: number): void {
    this.geologicalHeritages.at(index).get('nombre_etoiles')?.setValue(rating);
  }

  rateProtectionHeritage(index: number, rating: number): void {
    this.protectionGeologicalHeritages.at(index).get('nombre_etoiles')?.setValue(rating);
  }

  onEresSelectionChange(event: { value: any[] }): void {
    this.selectedEresIds = event.value;
    this.filteredSystemes = this.systemes!.nomenclatures.filter((systeme: Nomenclature) =>
      this.selectedEresIds.includes(systeme.id_parent)
    );
    this.updateSeriesAndEtages();
  }

  onSystemesSelectionChange(event: { value: any[] }): void {
    this.selectedSystemesIds = event.value;
    this.filteredSeries = this.series!.nomenclatures.filter((serie: Nomenclature) =>
      this.selectedSystemesIds.includes(serie.id_parent)
    );
    this.updateEtages();
  }

  onSeriesSelectionChange(event: { value: any[] }): void {
    this.selectedSeriesIds = event.value;
    this.updateEtages();
  }

  updateSeriesAndEtages(): void {
    this.filteredSeries = this.series!.nomenclatures.filter((serie: Nomenclature) =>
      this.selectedSystemesIds.includes(serie.id_parent)
    );
    this.updateEtages();
  }

  updateEtages(): void {
    this.filteredEtages = this.etages!.nomenclatures.filter((etage: Nomenclature) =>
      (this.selectedSystemesIds.includes(etage.id_parent) || this.selectedSeriesIds.includes(etage.id_parent))
    );
  }

  get quarryExtractedMaterials(): FormArray {
    return this.tInfosBaseSiteForm.get('quarry_extracted_materials') as FormArray;
  }

  addExtractedMaterial(): void {
    this.quarryExtractedMaterials.push(
      this.fb.group({
        substance: ['', Validators.required],
        fossiliferous: [false]
      })
    );
  }

  onSubmit(): void {
    this.isFormSubmitted = true;

    if (this.tInfosBaseSiteForm.valid) {
      const selectedGeologicalUnits = this.getSelectedGeologicalUnits();
      const formData = {
        ...this.tInfosBaseSiteForm.value,
        geologicalUnits: selectedGeologicalUnits,
        geologicalUnitsOtherText: this.tInfosBaseSiteForm.get('geologicalUnitsOther')?.value
          ? this.tInfosBaseSiteForm.get('geologicalUnitsOtherText')?.value
          : null
      };

      // Envoi des données
      this.tInfosBaseSiteService.updateSite(this.siteSlug!, formData).subscribe(
        (response: any) => {
          // Affiche le message de la réponse du backend
          Swal.fire({
            position: "center",
            icon: response.type, // Affiche l'icône "success" ou "error"
            title: response.msg, // Affiche le message du backend
          }).then(() => {
            // Si la réponse est un succès, proposer des actions supplémentaires
            if (response.type === 'success') {
              this.router.navigate([`/site/${this.siteSlug}`]);
              Swal.fire({
                title: "Souhaitez-vous remplir le questionnaire détaillé ?",
                showDenyButton: true,
                confirmButtonText: "Allons-y !",
                denyButtonText: `Pas cette fois.`
              }).then((result) => {
                if (result.isConfirmed) {
                  this.router.navigate([`/fiche-terrain/${this.siteSlug}`]);
                }
              });
            }
          });
        },
        (error: any) => {
          // Gestion des erreurs lors de l'appel
          Swal.fire({
            icon: "error",
            title: "Erreur",
            text: "Une erreur est survenue lors de l'envoi des données."
          });
        }
      );
    } else {
      // Gestion de formulaire invalide
      Swal.fire({
        icon: "error",
        title: "Formulaire invalide",
        text: "Veuillez vérifier les champs du formulaire avant de soumettre."
      });
    }
  }

  confirmDeletion(siteName: string, siteId: number, inpgId: number, pp: boolean): void {
    Swal.fire({
      title: 'Selon vous, le site INPG ' + siteName + ' ne doit pas être associé à la réserve',
      input: 'textarea',
      inputPlaceholder: 'Saisissez la raison ici...',
      showCancelButton: true,
      confirmButtonText: 'Retirer le site INPG',
      cancelButtonText: 'Annuler',
      footer: 'Cette action n\'est pas irréversible. Le site INPG restera présenté dans ce formulaire comme n\'étant pas associé à la réserve.',
      inputValidator: (value) => {
        if (!value) {
          return 'Vous devez saisir une raison !';
        }
        return undefined;
      }
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        const reason = result.value;

        // Appeler le service pour effectuer la modification côté back
        this.siteService.invalidInpgSite(siteId, inpgId, reason).subscribe({
          next: () => {
            // Mise à jour locale de l'objet site
            if (pp == true) {
              const inpgToUpdate = this.site.perimetre_protection.sites_inpg.find(
                (inpg: any) => inpg.inpg.id_inpg === inpgId
              );
              if (inpgToUpdate) {
                inpgToUpdate.active = false;
                inpgToUpdate.raison_desactive = reason;
              }
            } else {
              const inpgToUpdate = this.site.sites_inpg.find(
                (inpg: any) => inpg.inpg.id_inpg === inpgId
              );
              if (inpgToUpdate) {
                inpgToUpdate.active = false;
                inpgToUpdate.raison_desactive = reason;
              }
            }

            Swal.fire('Succès', `Le site INPG ${siteName} a été dissocié de la réserve.`, 'success');
          },
          error: (err) => {
            Swal.fire('Erreur', 'Une erreur s\'est produite lors de la mise à jour.', 'error');
          }
        });
      }
    });
  }

  confirmRevalid(siteName: string, siteId: number, inpgId: number, raison: string, pp: boolean): void {
    Swal.fire({
      title: 'Selon vous, le site INPG ' + siteName + ' doit finalement être associé à la réserve',
      text: 'La raison qui avait été donnée pour le dissocier était : ' + raison,
      showCancelButton: true,
      confirmButtonText: 'Confirmer',
      cancelButtonText: 'Annuler'
    }).then((result) => {
      if (result.isConfirmed) {
        // Appeler le service pour effectuer la modification côté back
        this.siteService.revalidInpgSite(siteId, inpgId).subscribe({
          next: () => {
            // Mise à jour locale de l'objet site
            if (pp == true) {
              const inpgToUpdate = this.site.perimetre_protection.sites_inpg.find(
                (inpg: any) => inpg.inpg.id_inpg === inpgId
              );
              if (inpgToUpdate) {
                inpgToUpdate.active = true;
              }
            } else {
              const inpgToUpdate = this.site.sites_inpg.find(
                (inpg: any) => inpg.inpg.id_inpg === inpgId
              );
              if (inpgToUpdate) {
                inpgToUpdate.active = true;
              }
            }

            Swal.fire('Succès', `Le site INPG ${siteName} a été réassocié à la réserve.`, 'success');
          },
          error: (err) => {
            Swal.fire('Erreur', 'Une erreur s\'est produite lors de la mise à jour.', 'error');
          }
        });
      }
    });
  }




  changeInpgView() {
    this.showInpg = !this.showInpg
  }

  changePpInpgView() {
    this.showPpInpg = !this.showPpInpg
  }

  patchSubstances(): void {
    const substances = this.site.substances || [];
    const quarryMaterialsArray = this.quarryExtractedMaterials;


    // Reset the array to avoid duplication
    quarryMaterialsArray.clear();

    substances.forEach((item: any) => {
      quarryMaterialsArray.push(
        this.fb.group({
          substance: [item.substance.id_nomenclature, Validators.required],
          fossiliferous: [item.fossilifere]
        })
      );
    });
  }

  filterSubstances(searchTerm: string | null): void {
    const term = (searchTerm || '').toLowerCase(); // Utilise une chaîne vide si searchTerm est null
    this.filteredSubstancesOptions = this.substancesOptions.filter(substance =>
      substance.label.toLowerCase().includes(term)
    );
  }

  filterStratotypeEtage(searchTerm: string | null): void {
    const term = (searchTerm || '').toLowerCase();
    this.filteredStratotypesEtage = this.stratotypesEtage.filter(stratotype =>
      stratotype.libelle.toLowerCase().includes(term)
    );
  }

  filterStratotypeLimite(searchTerm: string | null): void {
    const term = (searchTerm || '').toLowerCase();
    this.filteredStratotypesLimite = this.stratotypesLimite.filter(stratotype =>
      stratotype.libelle.toLowerCase().includes(term)
    );
  }

  onStratotypesLimiteChange(event: any): void {
    const selectedIds = event.value;
    const stratotypesArray = this.tInfosBaseSiteForm.get('stratotypesLimite') as FormArray;

    // Mise à jour des valeurs dans le FormArray
    stratotypesArray.clear();
    selectedIds.forEach((id: number) => stratotypesArray.push(new FormControl(id)));
  }

  onStratotypesEtageChange(event: any): void {
    const selectedIds = event.value;
    const stratotypesArray = this.tInfosBaseSiteForm.get('stratotypesEtage') as FormArray;

    // Mise à jour des valeurs dans le FormArray
    stratotypesArray.clear();
    selectedIds.forEach((id: number) => stratotypesArray.push(new FormControl(id)));
  }



}

