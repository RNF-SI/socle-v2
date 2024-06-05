import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MiniQuestService } from 'src/app/services/mini-quest.service';


@Component({
  selector: 'app-mini-quest',
  templateUrl: './mini-quest.component.html',
  styleUrls: ['./mini-quest.component.scss']
})
export class MiniQuestComponent implements OnInit {
  miniQuestForm: FormGroup;
  ages: string[] = ['Étage 1', 'Étage 2', 'Étage 3']; // Exemples d'âges, remplacez par des valeurs appropriées

  constructor(private fb: FormBuilder, private miniQuestService: MiniQuestService) {
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
      exploitationRessourcesMinerales: [''],
      ancienneCarriere: [false],
      carriereEnActivite: [false],
      substanceExploiteeCarriere: [''],
      materiauFossilifereCarriere: [''],
      ancienneMine: [false],
      mineEnActivite: [false],
      substanceExploiteeMine: [''],
      materiauFossilifereMine: [''],
      siteGeologiqueAmenage: [''],
      animationsGeodiversite: ['']


    });
  }

  ngOnInit(): void {}

  onSubmit(): void {
    if (this.miniQuestForm.valid) {
      const formData = this.miniQuestForm.value;
      this.miniQuestService.submitData(formData).subscribe(
        response => {
          console.log('Form submission successful', response);
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
