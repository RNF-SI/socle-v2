import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NomenclaturesService } from 'src/app/services/nomenclatures.service';
import { TInfosBaseSiteService } from 'src/app/services/t-infos-base-site.service';
import { Nomenclature, NomenclatureType } from 'src/app/models/nomenclature.model';

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

  constructor(
    private fb: FormBuilder,
    private tInfosBaseSiteService: TInfosBaseSiteService,
    private nomenclaturesService : NomenclaturesService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.tInfosBaseSiteForm = this.fb.group({
      id_site: [''],
      reserve_created_on_geological_basis: [false, Validators.required],
      reserve_contains_geological_heritage_inpg: [false],
      reserve_contains_geological_heritage_other: [''],
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
        vertebrates: [false],
        invertebrates: [false],
        plants: [false],
        traceFossils: [false],
        other: [false],
        otherDetails: ['']
      }),
      reserve_has_geological_collections: [false, Validators.required],
      reserve_has_exhibition: [false, Validators.required],
      geological_age: [''],  // Champ texte libre
      etage: [''],  // Champ texte libre
      ere_periode_epoque: [''],  // Champ texte libre
      reserve_contains_stratotype: [false],
      stratotype_details: [''],
      contains_subterranean_habitats: [false],
      subterranean_habitats_natural_cavities: [false],
      subterranean_habitats_anthropogenic_cavities: [false],
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
    this.tInfosBaseSiteService.getSiteBySlug(slug).subscribe(
      (site: any) => {
        this.id_site = site.id_site;

        // Patch the form with the retrieved data
        this.tInfosBaseSiteForm.patchValue({
          id_site: site.id_site,
          reserve_created_on_geological_basis: site.reserve_created_on_geological_basis,
          reserve_contains_geological_heritage_inpg: site.reserve_contains_geological_heritage_inpg,
          reserve_contains_geological_heritage_other: site.reserve_contains_geological_heritage_other,
          protection_perimeter_contains_geological_heritage_inpg: site.protection_perimeter_contains_geological_heritage_inpg,
          protection_perimeter_contains_geological_heritage_other: site.protection_perimeter_contains_geological_heritage_other,
          reserve_has_geological_collections: site.reserve_has_geological_collections,
          reserve_has_exhibition: site.reserve_has_exhibition,
          geological_age: site.geological_age,
          etage: site.etage,
          ere_periode_epoque: site.ere_periode_epoque,
          reserve_contains_stratotype: site.reserve_contains_stratotype,
          stratotype_details: site.stratotype_details,
          contains_subterranean_habitats: site.contains_subterranean_habitats,
          subterranean_habitats_natural_cavities: site.subterranean_habitats_natural_cavities,
          subterranean_habitats_anthropogenic_cavities: site.subterranean_habitats_anthropogenic_cavities,
          associated_with_mineral_resources: site.associated_with_mineral_resources,
          mineral_resources_old_quarry: site.mineral_resources_old_quarry,
          mineral_resources_active_quarry: site.mineral_resources_active_quarry,
          quarry_extracted_material: site.quarry_extracted_material,
          quarry_fossiliferous_material: site.quarry_fossiliferous_material,
          mineral_resources_old_mine: site.mineral_resources_old_mine,
          mineral_resources_active_mine: site.mineral_resources_active_mine,
          mine_extracted_material: site.mine_extracted_material,
          mine_fossiliferous_material: site.mine_fossiliferous_material,
          reserve_has_geological_site_for_visitors: site.reserve_has_geological_site_for_visitors,
          offers_geodiversity_activities: site.offers_geodiversity_activities
        });

        // Patch the sub-group main_geological_interests
        this.tInfosBaseSiteForm.get('main_geological_interests')?.patchValue({
          stratigraphic: site.main_geological_interests_stratigraphic,
          paleontological: site.main_geological_interests_paleontological,
          sedimentological: site.main_geological_interests_sedimentological,
          geomorphological: site.main_geological_interests_geomorphological,
          mineral_resource: site.main_geological_interests_mineral_resource,
          mineralogical: site.main_geological_interests_mineralogical,
          metamorphism: site.main_geological_interests_metamorphism,
          volcanism: site.main_geological_interests_volcanism,
          plutonism: site.main_geological_interests_plutonism,
          hydrogeology: site.main_geological_interests_hydrogeology,
          tectonics: site.main_geological_interests_tectonics
        });

        // Patch the contains_paleontological_heritage form group
        this.tInfosBaseSiteForm.get('contains_paleontological_heritage')?.patchValue({
          answer: site.contains_paleontological_heritage,
          vertebrates: site.contains_paleontological_heritage_vertebrates,
          invertebrates: site.contains_paleontological_heritage_invertebrates,
          plants: site.contains_paleontological_heritage_plants,
          traceFossils: site.contains_paleontological_heritage_trace_fossils,
          other: site.contains_paleontological_heritage_other,
          //otherDetails: site.contains_paleontological_heritage_other_details
        });
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

  onSubmit(): void {
    if (this.tInfosBaseSiteForm.valid) {
      const formData = this.tInfosBaseSiteForm.value;
      formData['id_site'] = this.id_site;

      console.log('Submitting form with slug:', this.siteSlug);  // Debugging log
      console.log('Submitting form with id_site:', this.id_site);  // Debugging log
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
