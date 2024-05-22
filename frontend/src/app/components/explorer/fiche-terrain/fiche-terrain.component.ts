import { Component, OnInit, Renderer2 } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Site } from 'src/app/models/site.model';


@Component({
  selector: 'app-fiche-terrain',
  templateUrl: './fiche-terrain.component.html',
  styleUrls: ['./fiche-terrain.component.css']
})
export class FicheTerrainComponent implements OnInit {
  site: Site | undefined;
  entite_id: number | undefined;
  type_rubrique = 'Site';
  editable = true;  // Vous pouvez définir cela en fonction de votre logique d'authentification

  sites: Site[] = [
    {
      id: 2,
      nom: 'Anciennes carrières dOrival',
      photos: [{ url: 'https://example.com/photo.jpg' }],
      last_modified: '2023-05-16',
      modified_by_userid: 1,
      statut_validation: 'attente',
      monosite: 't'
    },
    {
        id: 1,
        nom: 'Aiguilles Rouges',
        photos: [{ url: 'https://example.com/photo.jpg' }],
        last_modified: '2023-05-16',
        modified_by_userid: 1,
        statut_validation: 'attente',
        monosite: 't'
      },
    // Ajoutez d'autres sites ici
  ];

  constructor(private route: ActivatedRoute, private renderer: Renderer2) { }

  ngOnInit(): void {
    const id = +this.route.snapshot.paramMap.get('id')!;
    this.site = this.sites.find(s => s.id === id);
    this.entite_id = this.site?.id;

    // Ajouter dynamiquement le script
    if (this.site) {
      this.addDynamicScript();
    }
  }

  addDynamicScript(): void {
    const script = this.renderer.createElement('script');
    const code = `
      var site = ${JSON.stringify(this.site)};
      var entite_id = ${this.entite_id};
      var type_rubrique = '${this.type_rubrique}';
    `;
    script.text = code;
    this.renderer.appendChild(document.body, script);
  }
}
