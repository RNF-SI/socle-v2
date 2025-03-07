import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { ContactFormData, ContactService } from 'src/app/services/contact.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-contact',
  templateUrl: './contacts.component.html',
  styleUrls: ['./contacts.component.scss']
})
export class ContactsComponent implements OnInit {
  contactForm!: FormGroup;

  submitted = false;

  constructor(
    private fb: FormBuilder,
    private contactService: ContactService,
    private _toasterService: ToastrService,
    private router: Router
  ) { }

  captcha_key = environment.captcha_key;

  ngOnInit(): void {
    this.contactForm = this.fb.group({
      nom: ['', Validators.required],
      email: ['', Validators.required],
      sujet: ['', Validators.required],
      message: ['', Validators.required],
      recaptcha: ['', Validators.required]
    });
  }

  onCaptchaResolved(captchaResponse: string): void {
    // On peut mettre à jour le champ recaptcha si besoin
    this.contactForm.patchValue({ recaptcha: captchaResponse });
  }

  onSubmit(): void {
    this.submitted = true;
    if (this.contactForm.valid) {
      const formData: ContactFormData = this.contactForm.value;
      this.contactService.sendContactForm(formData).subscribe({
        next: (res) => {
          this._toasterService.info('Votre message a été envoyé avec succès.', 'Message envoyé!');
          this.router.navigate(['/']);
        },
        error: (err) => {
          this._toasterService.error(err.error.msg || 'Erreur lors de l\'envoi du message', '');
        }
      });
    }
  }

  onCancel(): void {
    // Redirige ou réinitialise le formulaire
    this.router.navigate(['/']);
  }
}
