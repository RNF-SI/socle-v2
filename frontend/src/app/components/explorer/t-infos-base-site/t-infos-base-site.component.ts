import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NomenclaturesService } from 'src/app/services/nomenclatures.service';
import { TInfosBaseSiteService } from 'src/app/services/t-infos-base-site.service';
import { Nomenclature, NomenclatureType } from 'src/app/models/nomenclature.model';
import { SitesService } from 'src/app/services/sites.service';
import { PatrimoineGeologiqueService, PatrimoineGeologique } from 'src/app/services/patrimoine-geologique.service';


@Component({
  selector: 'app-t-infos-base-site',
  templateUrl: './t-infos-base-site.component.html',
  styleUrls: ['./t-infos-base-site.component.scss']
})
export class TInfosBaseSiteComponent implements OnInit {
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
  ];

  constructor(
    private fb: FormBuilder,
    private tInfosBaseSiteService: TInfosBaseSiteService,

    private nomenclaturesService : NomenclaturesService,

    private siteService: SitesService,
    private patrimoineGeologiqueService: PatrimoineGeologiqueService,

    private router: Router,
    private route: ActivatedRoute
  ) {
    this.tInfosBaseSiteForm = this.fb.group({
      id_site: [''],
      reserve_created_on_geological_basis: [false, Validators.required],
      reserve_contains_geological_heritage_inpg: [false],
      geologicalHeritages: this.fb.array([]),
      protection_perimeter_contains_geological_heritage_inpg: [false],
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
      reserve_has_geological_collections: [false, Validators.required],
      reserve_has_exhibition: [false, Validators.required],
      geological_age: [''],
      etage: [''],
      ere_periode_epoque: [''],
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
      associated_with_mineral_resources: [false],
      mineral_resources_old_quarry: [false],
      mineral_resources_active_quarry: [false],
      quarry_extracted_material: [''],
      quarry_fossiliferous_material: [false],
      mineral_resources_old_mine: [false],
      mineral_resources_active_mine: [false],
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
  }

  loadNomenclature(): void {
    this.nomenclaturesService.getNomenclaturesByTypeId(2).subscribe(
      (nomenclatures: any) => {
        this.eres = nomenclatures
        console.log(this.eres);
        
      }
    );
    this.nomenclaturesService.getNomenclaturesByTypeId(3).subscribe(
      (nomenclatures: any) => {
        this.systemes = nomenclatures
      }
    );
    this.nomenclaturesService.getNomenclaturesByTypeId(4).subscribe(
      (nomenclatures: any) => {
        this.series = nomenclatures
      }
    );
    this.nomenclaturesService.getNomenclaturesByTypeId(5).subscribe(
      (nomenclatures: any) => {
        this.etages = nomenclatures
      }
    );
  }

  fetchSiteDetails(slug: string): void {
    this.siteService.getSiteBySlug(slug).subscribe(
      (site: any) => {
        this.site = site;
        this.id_site = site.id_site;
        console.log(site);
        

        this.tInfosBaseSiteForm.patchValue({
          id_site: site.id_site,
          reserve_created_on_geological_basis: site.infos_base.reserve_created_on_geological_basis,
          reserve_contains_geological_heritage_inpg: site.reserve_contains_geological_heritage_inpg || site.inpg.length > 0,
          reserve_contains_geological_heritage_other: site.reserve_contains_geological_heritage_other,
          protection_perimeter_contains_geological_heritage_inpg: site.protection_perimeter_contains_geological_heritage_inpg || site.inpg.length > 0,
          protection_perimeter_contains_geological_heritage_other: site.infos_base.protection_perimeter_contains_geological_heritage_other,
          reserve_has_geological_collections: site.infos_base.reserve_has_geological_collections,
          reserve_has_exhibition: site.infos_base.reserve_has_exhibition,
          geological_age: site.infos_base.geological_age,
          etage: site.infos_base.etage,
          ere_periode_epoque: site.infos_base.ere_periode_epoque,
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
          associated_with_mineral_resources: site.infos_base.associated_with_mineral_resources,
          mineral_resources_old_quarry: site.infos_base.mineral_resources_old_quarry,
          mineral_resources_active_quarry: site.infos_base.mineral_resources_active_quarry,
          quarry_extracted_material: site.infos_base.quarry_extracted_material,
          quarry_fossiliferous_material: site.infos_base.quarry_fossiliferous_material,
          mineral_resources_old_mine: site.infos_base.mineral_resources_old_mine,
          mineral_resources_active_mine: site.infos_base.mineral_resources_active_mine,
          mine_extracted_material: site.infos_base.mine_extracted_material,
          mine_fossiliferous_material: site.infos_base.mine_fossiliferous_material,
          reserve_has_geological_site_for_visitors: site.infos_base.reserve_has_geological_site_for_visitors,
          offers_geodiversity_activities: site.infos_base.offers_geodiversity_activities
        });

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
          answer: site.infos_base.contains_paleontological_heritage,
          no_answer: !site.infos_base.contains_paleontological_heritage,
          vertebrates: site.infos_base.contains_paleontological_heritage_vertebrates,
          invertebrates: site.infos_base.contains_paleontological_heritage_invertebrates,
          plants: site.infos_base.contains_paleontological_heritage_plants,
          traceFossils: site.infos_base.contains_paleontological_heritage_trace_fossils,
          other: site.infos_base.contains_paleontological_heritage_other,
          otherDetails: site.infos_base.contains_paleontological_heritage_other_details
        });

        site.ages.forEach((element: any) => {
          console.log(element);
        });

        this.fetchPatrimoineGeologique();
      },
      error => {
        console.error('Error fetching site details', error);
      }
    );
  }

  onEresSelectionChange(event: { value: any[] }): void {
    this.selectedEresIds = event.value;
    this.filteredSystemes = this.systemes!.nomenclatures.filter((systeme: Nomenclature) =>
      this.selectedEresIds.includes(systeme.id_parent)
    );
    // Mise à jour des séries et étages
    this.updateSeriesAndEtages();
  }

  onSystemesSelectionChange(event: { value: any[] }): void {
    this.selectedSystemesIds = event.value;
    this.filteredSeries = this.series!.nomenclatures.filter((serie: Nomenclature) =>
      this.selectedSystemesIds.includes(serie.id_parent)
    );
    // Mise à jour des étages
    this.updateEtages();
  }

  onSeriesSelectionChange(event: { value: any[] }): void {
    this.selectedSeriesIds = event.value;
    // Mise à jour des étages
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
  fetchPatrimoineGeologique(): void {
    this.patrimoineGeologiqueService.getPatrimoineGeologique(this.id_site).subscribe(
      (data: any) => {
        if (Array.isArray(data)) {
          this.populateGeologicalHeritages(data);
        } else {
          console.error("Expected an array but got:", data);
        }
      },
      (error: any) => {
        console.error('Error fetching geological heritage data', error);
      }
    );
  }

  get geologicalHeritages(): FormArray {
    return this.tInfosBaseSiteForm.get('geologicalHeritages') as FormArray;
  }

  populateGeologicalHeritages(data: PatrimoineGeologique[]): void {
    const heritageArray = this.geologicalHeritages;
    data.forEach((heritage: PatrimoineGeologique) => {
      heritageArray.push(this.fb.group({
        lb: [heritage.lb, Validators.required],
        nombre_etoiles: [heritage.nombre_etoiles, Validators.required],
        interet_geol_principal: [heritage.interet_geol_principal, Validators.required],
        age_des_terrains_le_plus_recent: [heritage.age_des_terrains_le_plus_recent, Validators.required],
        age_des_terrains_le_plus_ancien: [heritage.age_des_terrains_le_plus_ancien, Validators.required],
        bibliographie: [heritage.bibliographie]  // Nouveau champ
      }));
    });
  }

  addHeritage(): void {
    this.geologicalHeritages.push(this.fb.group({
      lb: ['', Validators.required],
      nombre_etoiles: [0, Validators.required],
      interet_geol_principal: ['', Validators.required],
      age_des_terrains_le_plus_recent: ['', Validators.required],
      age_des_terrains_le_plus_ancien: ['', Validators.required],
      bibliographie: ['']  // Nouveau champ
    }));
  }

  removeHeritage(index: number): void {
    this.geologicalHeritages.removeAt(index);
  }

  rateHeritage(index: number, rating: number): void {
    this.geologicalHeritages.at(index).get('nombre_etoiles')?.setValue(rating);
  }

  onSubmit(): void {
    if (this.tInfosBaseSiteForm.valid) {
      const formData = this.tInfosBaseSiteForm.value;
      formData['id_site'] = this.id_site;

      console.log('Submitting form with slug:', this.siteSlug);
      console.log('Submitting form with id_site:', this.id_site);
      this.tInfosBaseSiteService.updateSite(this.siteSlug!, formData).subscribe(
        response => {
          this.router.navigate([`/site/${this.siteSlug}`]);
        },
        error => {
          console.error('Error updating site data', error);
        }
      );
    } else {
      console.error('Form is invalid');
    }
  }
}
