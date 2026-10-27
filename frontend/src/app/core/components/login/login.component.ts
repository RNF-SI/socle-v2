import { HttpErrorResponse } from '@angular/common/http';
import { Component, Inject, OnDestroy } from '@angular/core';
import { ReactiveFormsModule, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AppConfig } from 'src/conf/app.config';
import { AuthService } from '../../auth/auth-service.service';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { InputErrorPipe } from '../../pipes/input-error.pipe';


export interface LoginData {
  code?: string;
  url?: string;
}

@Component({
    selector: 'pnx-login',
    templateUrl: 'login.component.html',
    styleUrls: ['./login.component.scss'],
    standalone:true,
    imports:[CommonModule,ReactiveFormsModule,MatFormFieldModule,MatInputModule,MatButtonModule,MatIconModule,MatProgressBarModule,FontAwesomeModule,InputErrorPipe]
})
export class LoginComponent implements OnDestroy {
  enable_sign_up: boolean = false;
  enable_user_management: boolean = false;
  public disableSubmit = false;

  readonly form: UntypedFormGroup;
  returnUrl: string = '/';
  private identifiant: UntypedFormControl;
  private password: UntypedFormControl;

  public errorCode: string | null = null;
  public APP_NAME = AppConfig.appName;
  public showPassword = false;
  public progress = false;
  private errorTimeout?: number;

  login_or_pass_recovery: boolean = false;
  messageError: string = '';

  constructor(
    @Inject(MAT_DIALOG_DATA) private data: LoginData,
    public _authService: AuthService,
    private ref: MatDialogRef<LoginComponent>,
    private _toasterService: ToastrService,
    private router: Router
  ) {
    // Initialisation des contrôles de formulaire
    this.identifiant = new UntypedFormControl(null, Validators.required);
    this.password = new UntypedFormControl(null, Validators.required);
    this.form = new UntypedFormGroup({});
    this.form.addControl('identifiant', this.identifiant);
    this.form.addControl('password', this.password);

    // Récupère l'url de retour depuis les données du dialogue
    if (data && data.url) {
      this.returnUrl = data.url;
    }

    // IMPORTANT : Supprimez ou commentez l'abonnement beforeClosed() qui interfère avec afterClosed()
    // this.ref.beforeClosed().subscribe(user => (user && this.navigate(data.url)));
  }

  signIn() {
    this.progress = true;
    this._authService.signinUser(this.identifiant.value, this.password.value)
      .subscribe({
        next: (user) => {
          // Connexion réussie : fermer le dialogue en renvoyant l'utilisateur
          console.log(user);
          if(user.max_level_profil > 0){
            this.ref.close(user);
          }else{
            this.progress = false;
            this._authService.logout();
            this.errorCode = 'INSUFFICIENT_PERMISSIONS';
            this.messageError = 'Problème avec la connexion';
            this._toasterService.error(this.messageError, 'Accès refusé');
          }
          
        },
        error: (error: HttpErrorResponse) => {
          this.showError(error);
          console.log(error);
        }
      });
  }

  clikonforgot() {
    // Redirige vers la réinitialisation du mot de passe, puis ferme le dialogue
    this.router.navigate(['/mot-de-passe-oublie']);
    this.ref.close(false);
  }

  /**
   * Affiche le message d'erreur
   * @param error : objet HttpErrorResponse contenant l'erreur
   */
  private showError(error: HttpErrorResponse) {
    this.progress = false;
    this.errorCode = error.error['type'];
    // Nettoyer le timeout précédent s'il existe
    if (this.errorTimeout) {
      clearTimeout(this.errorTimeout);
    }
    // Réinitialise le message d'erreur après 10 secondes
    this.errorTimeout = window.setTimeout(() => this.errorCode = null, 10000);
  }

  ngOnDestroy(): void {
    // Nettoyer le timeout s'il existe
    if (this.errorTimeout) {
      clearTimeout(this.errorTimeout);
    }
  }
}
