import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-contacts',
  templateUrl: './contacts.component.html',
  styleUrls: ['./contacts.component.scss']
})
export class ContactsComponent implements OnInit {

  contacts: any[] = [
    { name: '', email: 'contact1@example.com', phone: '123-456-7890' },
    { name: 'Contact 2', email: 'contact2@example.com', phone: '098-765-4321' }
    // Ajoute ici les contacts ou récupère-les depuis un service
  ];

  constructor() { }

  ngOnInit(): void {
  }

}
