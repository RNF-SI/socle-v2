import { Component, Input, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Nomenclature, NomenclatureType } from 'src/app/models/nomenclature.model';
import { PatrimoineGeologique } from 'src/app/models/patrimoine-geologique.model';
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
  @Input() siteSlug: string | undefined;
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
    private route: ActivatedRoute
  ) {
    this.tInfosBaseSiteForm = this.fb.group({
      id_site: [''],
      geologicalUnits: this.fb.array([]), // Gère les ensembles géologiques sélectionnés
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
      offers_geodiversity_activities: [false],
      eres: [],
      systemes: [],
      series: [],
      etages: []
    });
  }

  ngOnInit(): void {
    this.siteSlug = this.route.snapshot.paramMap.get('slug')!;
    this.fetchSiteDetails(this.siteSlug);
    this.loadNomenclature();
    this.initGeologicalUnitsCheckboxes();
    // this.ajouterPatrimoineGeolPP();
    // this.ajouterPatrimoineGeol();
    // Surveiller les changements du champ de recherche pour filtrer les substances
    this.searchSubstanceTerm.valueChanges.subscribe((searchTerm: string | null) => {
      this.filterSubstances(searchTerm);
    });
  }

  initGeologicalUnitsCheckboxes(): void {
    const geologicalUnitsArray = this.geologicalUnitsOptions.map(unit =>
      new FormControl(this.isUnitSelected(unit.id_nomenclature))
    );
    this.tInfosBaseSiteForm.setControl('geologicalUnits', this.fb.array(geologicalUnitsArray));
  }

  // Vérifie si une unité géologique est sélectionnée
  isUnitSelected(id: number): boolean {
    // Vérifie si l'ID est présent dans les données du site
    return this.site?.infos_base?.geological_units?.includes(id) || false;
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

  fetchSiteDetails(slug: string): void {
    this.siteService.getSiteBySlug(slug).subscribe(
      (site: any) => {
        this.site = site;
        console.log(this.site);
        if (this.site.inpg.length < 6) {
          this.showInpg = true
        }
        if (this.site.perimetre_protection && this.site.perimetre_protection.inpg.length < 6) {
          this.showPpInpg = true
        }

        this.id_site = site.id_site;

        this.tInfosBaseSiteForm.patchValue({
          id_site: site.id_site,
          reserve_created_on_geological_basis: site.creation_geol,
          // reserve_contains_geological_heritage_inpg: site.reserve_contains_geological_heritage_inpg || site.inpg.length > 0,
          // protection_perimeter_contains_geological_heritage_inpg: site.protection_perimeter_contains_geological_heritage_inpg || site.inpg.length > 0,
          reserve_has_geological_collections: site.infos_base.reserve_has_geological_collections,
          reserve_has_exhibition: site.infos_base.reserve_has_exhibition,
          reserve_contains_stratotype: site.infos_base.reserve_contains_stratotype,
          stratotype_limit: site.infos_base.stratotype_limit,
          stratotype_limit_input: site.infos_base.stratotype_limit_input,
          stratotype_stage: site.infos_base.stratotype_stage,
          stratotype_stage_input: site.infos_base.stratotype_stage_input,
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
          offers_geodiversity_activities: site.infos_base.offers_geodiversity_activities,
          geologicalUnits: []


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

        });

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
    if (this.tInfosBaseSiteForm.valid) {
      Swal.fire({
        position: "center",
        icon: "success",
        title: "Vos données ont été bien envoyées",
        showConfirmButton: false,
        timer: 1500
      }).then(() => {
        Swal.fire({
          title: "Vous pouvez maintenant aller voir la synthèse ou remplir la fiche de détails.",
          showDenyButton: true,
          showCancelButton: true,
          confirmButtonText: "Synthèse",
          denyButtonText: `Fiche details`
        }).then((result) => {
          if (result.isConfirmed) {
            const selectedGeologicalUnits = this.getSelectedGeologicalUnits();
            const formData = this.tInfosBaseSiteForm.value;
            formData['id_site'] = this.id_site;
            formData['geologicalUnits'] = selectedGeologicalUnits;
            this.tInfosBaseSiteService.updateSite(this.siteSlug!, formData).subscribe(
              (response: any) => {

                this.tInfosBaseSiteForm.patchValue(response);
                Swal.fire("Les données sont sauvegardées.", "", "success").then(() => {
                  this.router.navigate([`/site/${this.siteSlug}`]);
                });
              },
              (error: any) => {
                Swal.fire("Error", "There was an error updating the site data", "error");
              }
            );
          } else if (result.isDenied) {
            Swal.fire("Allez remplir fiche details.", "", "success").then(() => {
              this.router.navigate([`/fiche-terrain/${this.siteSlug}`]);
            });
          }
        });
      });
    }
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
          substance: [item.substance.mnemonique, Validators.required],
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


}

