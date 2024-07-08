import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TInfosBaseSiteService } from 'src/app/services/t-infos-base-site.service';

@Component({
  selector: 'app-t-infos-base-site',
  templateUrl: './t-infos-base-site.component.html',
  styleUrls: ['./t-infos-base-site.component.scss']
})
export class TInfosBaseSiteComponent implements OnInit {
  tInfosBaseSiteForm: FormGroup;
  ages: string[] = ['Étage 1', 'Étage 2', 'Étage 3']; // Replace with appropriate values
  @Input() siteSlug: string | undefined;
  id_site: any;
   

  constructor(
    private fb: FormBuilder,
    private tInfosBaseSiteService: TInfosBaseSiteService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.tInfosBaseSiteForm = this.fb.group({
      id_site: [''], // add id_site as a hidden field
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
      geological_age: [''],
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
      offers_geodiversity_activities: [false]
    });
  }

  ngOnInit(): void {
    this.siteSlug = this.route.snapshot.paramMap.get('slug')!;
    this.fetchSiteDetails(this.siteSlug);
  }

  fetchSiteDetails(slug: string): void {
    this.tInfosBaseSiteService.getSiteBySlug(slug).subscribe(
      (site: any) => {
        this.id_site = site.id_site;
        this.tInfosBaseSiteForm.patchValue({ id_site: this.id_site });
      },
      error => {
        console.error('Error fetching site details', error);
      }
    );
  }

  onSubmit(): void {
    if (this.tInfosBaseSiteForm.valid) {
      const formData = this.tInfosBaseSiteForm.value;
      console.log('Form Data:', formData); // Log the form data to inspect it
      this.tInfosBaseSiteService.submitData(formData).subscribe(
        response => {
          console.log('Form submission successful', response);
          this.router.navigate([`/site/${this.siteSlug}`]); // Navigate to the EspaceDetail component with slug
        },
        error => {
          console.error('Error submitting form', error);
        }
      );
    } else {
      console.error('Form is invalid');
    }
  }
}
