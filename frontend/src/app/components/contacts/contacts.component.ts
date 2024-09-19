import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-contacts',
  templateUrl: './contacts.component.html',
  styleUrls: ['./contacts.component.scss']
})
export class ContactsComponent implements OnInit {

  contacts: any[] = [
    { name: 'En cas de question sur le projet Socle :', role:'Corentin Guinault: Chargé de projet Géodiversité ', email: 'corentin.guinault@rnfrance.org', phone: '03.80.48.94.77' },
    { name: 'En cas de question sur les aspects informatiques et base de données :', role: ' Zacharie moulin: Chargé de mission Géomatique ', email: 'zacharie.moulin@rnfrance.org', phone: '0380489478' }
    // Ajoute ici les contacts ou récupère-les depuis un service
  ];

  constructor() { }

  ngOnInit(): void {
  }

}
