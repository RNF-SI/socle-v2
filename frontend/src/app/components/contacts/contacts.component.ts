import { Component, OnInit, ChangeDetectionStrategy, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NotificationService } from '../../core/services/notification.service';
import { ContactFormData, ContactResponse, ContactService } from 'src/app/services/contact.service';
import { CaptchaComponent } from '../../core/components/captcha/captcha.component';

@Component({
  standalone: false,
  selector: 'app-contact',
  templateUrl: './contacts.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./contacts.component.scss']
})
export class ContactsComponent implements OnInit {
  contactForm!: FormGroup;

  submitted = false;

  constructor(
    private fb: FormBuilder,
    private contactService: ContactService,
    private _toasterService: NotificationService,
    private router: Router
  ) { }

  @ViewChild(CaptchaComponent) private captcha?: CaptchaComponent;

  ngOnInit(): void {
    this.contactForm = this.fb.group({
      nom: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      sujet: ['', Validators.required],
      message: ['', Validators.required],
      captchaToken: ['', Validators.required]
    });
  }

  // Turnstile émet null quand le jeton expire ou que le widget est réinitialisé
  onCaptchaResolved(captchaResponse: string | null): void {
    this.contactForm.patchValue({ captchaToken: captchaResponse ?? '' });
  }

  onSubmit(): void {
    this.submitted = true;
    if (this.contactForm.valid) {
      const formData: ContactFormData = this.contactForm.value;
      this.contactService.sendContactForm(formData).subscribe({
        next: (res: ContactResponse) => {
          const suite = res.ticketNumber
            ? `Votre demande porte le numéro ${res.ticketNumber}.`
            : 'Votre message a été transmis au support.';
          this._toasterService.info(suite, 'Message envoyé !');
          this.router.navigate(['/']);
        },
        error: (err) => {
          this._toasterService.error(err?.error?.msg || 'Erreur lors de l\'envoi du message', '');
          // Le jeton est consommé par la tentative : en redemander un.
          this.captcha?.reset();
          this.contactForm.patchValue({ captchaToken: '' });
        }
      });
    }
  }

  onCancel(): void {
    // Redirige ou réinitialise le formulaire
    this.router.navigate(['/']);
  }
}
