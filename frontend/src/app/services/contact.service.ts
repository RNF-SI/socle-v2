import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface ContactFormData {
  nom: string;
  email: string;
  sujet: string;
  message: string;
  recaptcha?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ContactService {

  constructor(private http: HttpClient) { }

  sendContactForm(data: ContactFormData): Observable<any> {
    return this.http.post(`${environment.apiUrl}/contact`, data);
  }
}
