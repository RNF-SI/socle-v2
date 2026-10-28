import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

/** Réponse de la route /contact, qui ouvre le ticket Zammad côté serveur. */
export interface ContactResponse {
  msg: string;
  /** Numéro du ticket Zammad, quand l'API le renvoie. */
  ticketNumber?: string;
}

export interface ContactFormData {
  nom: string;
  email: string;
  sujet: string;
  message: string;
  /** Jeton Cloudflare Turnstile, revérifié côté serveur. */
  captchaToken?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ContactService {

  constructor(private http: HttpClient) { }

  /**
   * Poste la demande au backend SOCLE, qui vérifie le captcha puis ouvre un
   * ticket Zammad. Le jeton Zammad ne transite jamais par le navigateur.
   */
  sendContactForm(data: ContactFormData): Observable<ContactResponse> {
    return this.http.post<ContactResponse>(`${environment.apiUrl}/contact`, data);
  }
}
