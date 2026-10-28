import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  OnDestroy,
  Output,
  ViewChild,
} from '@angular/core';

import { environment } from 'src/environments/environment';

/** API minimale du widget Cloudflare Turnstile telle qu'on l'utilise ici. */
interface TurnstileApi {
  render(
    element: HTMLElement,
    options: {
      sitekey: string;
      language?: string;
      theme?: 'light' | 'dark' | 'auto';
      callback: (token: string) => void;
      'expired-callback'?: () => void;
      'error-callback'?: () => void;
    },
  ): string;
  reset(widgetId?: string): void;
  remove(widgetId?: string): void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js';

/**
 * Vérification anti-spam du formulaire de contact (Cloudflare Turnstile).
 *
 * Choisi plutôt qu'un reCAPTCHA : pas de cookie de pistage, pas de puzzle à
 * résoudre dans la grande majorité des cas, et conforme au RGPD sans bandeau
 * de consentement. Le jeton produit est revérifié par la route /contact : le
 * widget seul ne protège rien.
 */
@Component({
  standalone: false,
  selector: 'app-captcha',
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <div class="captcha">
      <div #host class="captcha__widget"></div>
      <mat-error *ngIf="echec" role="alert">
        La vérification anti-robot n'a pas pu se charger. Désactivez votre bloqueur pour ce site,
        ou écrivez directement à si&#64;rnfrance.org.
      </mat-error>
    </div>
  `,
  styles: [`
    .captcha {
      display: flex;
      flex-direction: column;
      align-items: center;
    }
  `],
})
export class CaptchaComponent implements AfterViewInit, OnDestroy {
  /** Jeton courant : null tant que la vérification n'est pas passée. */
  @Output() token = new EventEmitter<string | null>();

  protected echec = false;

  @ViewChild('host', { static: true }) private host!: ElementRef<HTMLDivElement>;
  private widgetId: string | null = null;

  ngAfterViewInit(): void {
    this.loadScript()
      .then(() => this.render())
      .catch(() => (this.echec = true));
  }

  ngOnDestroy(): void {
    if (this.widgetId) {
      window.turnstile?.remove(this.widgetId);
    }
  }

  /** Redemande une vérification : après un envoi, le jeton est consommé. */
  reset(): void {
    if (this.widgetId) {
      window.turnstile?.reset(this.widgetId);
      this.token.emit(null);
    }
  }

  private render(): void {
    const api = window.turnstile;
    if (!api) {
      this.echec = true;
      return;
    }

    this.widgetId = api.render(this.host.nativeElement, {
      sitekey: environment.turnstileSiteKey,
      language: 'fr',
      theme: 'light',
      callback: (token) => this.token.emit(token),
      'expired-callback': () => this.token.emit(null),
      'error-callback': () => {
        this.token.emit(null);
        this.echec = true;
      },
    });
  }

  /** Injecte le script une seule fois, même si le composant est recréé. */
  private loadScript(): Promise<void> {
    if (window.turnstile) {
      return Promise.resolve();
    }

    const existing = document.querySelector<HTMLScriptElement>(`script[src^="${SCRIPT_URL}"]`);
    const script = existing ?? document.createElement('script');

    const ready = new Promise<void>((resolve, reject) => {
      script.addEventListener('load', () => resolve(), { once: true });
      script.addEventListener('error', () => reject(new Error('turnstile')), { once: true });
    });

    if (!existing) {
      script.src = `${SCRIPT_URL}?render=explicit`;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }

    return ready;
  }
}
