import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MiniQuestService } from 'src/app/services/mini-quest.service';

@Component({
  selector: 'app-mini-quest',
  templateUrl: './mini-quest.component.html',
  styleUrls: ['./mini-quest.component.scss']
})
export class MiniQuestComponent implements OnInit {
  @Input() siteSlug: string | undefined;
  miniQuestForm: FormGroup;
  ages: string[] = ['Étage 1', 'Étage 2', 'Étage 3']; // Exemples d'âges, remplacez par des valeurs appropriées

  constructor(
    private fb: FormBuilder, 
    private miniQuestService: MiniQuestService, 
    private router: Router,
    private route: ActivatedRoute
  ) {
     this.miniQuestForm = this.fb.group({
      reserve_created_on_geological_basis: [false, Validators.required],
      reserve_contains_geological_heritage: this.fb.group({
        inpg: [false],
        inpgDetails: [''],
        other: [false],
        otherDetails: [''],
        none: [false]
      }),
      protection_perimeter_contains_geological_heritage: this.fb.group({
        inpg: [false],
        inpgDetails: [''],
        other: [false],
        otherDetails: [''],
        none: [false]
      }),
      main_geological_interests: this.fb.group({
        stratigraphic: [false],
        paleontological: [false],
        sedimentological: [false],
        geomorphological: [false],
        mineralResource: [false],
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
      collectionsGeologiquesPropres: [],
      expositionGeologiques: [false],
      ageTerrains: [[]],
      stratotype: [false],
      stratotypeLimite: [false],
      stratotypeLimiteDetails: [''],
      stratotypeEtage: [false],
      stratotypeEtageDetails: [''],
      milieuxSouterrains: [false], 
      cavitesNaturelles: [false],
      cavitesAnthropiques: [false],
      exploitationMinerale: [false],  
      ancienneCarriere: [false],
      carriereEnActivite: [false],
      substanceExploiteeCarriere: [''],
      materiauFossilifereCarriere: [''],
      ancienneMine: [false],
      mineEnActivite: [false],
      substanceExploiteeMine: [''],
      materiauFossilifereMine: [''],
      siteGeologiqueAmenege: [false],  
      animationsGeodiversite: [false]


    });
  }

  ngOnInit(): void {
    this.siteSlug = this.route.snapshot.paramMap.get('slug')!
    console.log('Slug of current site:', this.siteSlug);
  }

  onSubmit(): void {
    if (this.miniQuestForm.valid) {
      const formData = this.miniQuestForm.value;
      console.log('Form Data:', formData); // Log the form data to inspect it
      this.miniQuestService.submitData(formData).subscribe(
        response => {
          console.log('Form submission successful', response);
          this.router.navigate([`/synthese/${this.siteSlug}`]); // Navigate to the synthese component with slug
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