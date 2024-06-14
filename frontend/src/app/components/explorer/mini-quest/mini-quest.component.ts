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
      reserveCreatedOnGeologicalBasis: ['', Validators.required],
      reserveContainsGeologicalHeritage: this.fb.group({
        inpg: [false],
        inpgDetails: [''],
        other: [false],
        otherDetails: [''],
        none: [false]
      }),
      protectionPerimeterContainsGeologicalHeritage: this.fb.group({
        inpg: [false],
        inpgDetails: [''],
        other: [false],
        otherDetails: [''],
        none: [false]
      }),
      mainGeologicalInterests: this.fb.group({
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
      containsPaleontologicalHeritage: this.fb.group({
        answer: [''],
        vertebrates: [false],
        invertebrates: [false],
        plants: [false],
        traceFossils: [false],
        other: [false],
        otherDetails: ['']
      }),
      collectionsGeologiquesPropres: [''],
      expositionGeologiques: [''],
      ageTerrains: [[]],
      stratotype: [''],
      stratotypeLimite: [false],
      stratotypeLimiteDetails: [''],
      stratotypeEtage: [false],
      stratotypeEtageDetails: [''],
      milieuxSouterrains: [''], 
      cavitesNaturelles: [false],
      cavitesAnthropiques: [false],
      exploitationMinerale: [''],  
      ancienneCarriere: [false],
      carriereEnActivite: [false],
      substanceExploiteeCarriere: [''],
      materiauFossilifereCarriere: [''],
      ancienneMine: [false],
      mineEnActivite: [false],
      substanceExploiteeMine: [''],
      materiauFossilifereMine: [''],
      siteGeologiqueAmenege: [''],  
      animationsGeodiversite: ['']


    });
  }

  ngOnInit(): void {
    this.siteSlug = this.route.snapshot.paramMap.get('slug')!
    console.log('Slug of current site:', this.siteSlug);
  }

  onSubmit(): void {
    if (this.miniQuestForm.valid) {
      const formData = this.miniQuestForm.value;
      this.miniQuestService.submitData(formData).subscribe(
        response => {
          console.log('Form submission successful', response);
          this.miniQuestService.setResponses('current', formData); // Store the current form data
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
