import { AfterViewInit, Component, ElementRef, inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { filter, map, Observable, startWith, Subscription } from 'rxjs';

import { AuthService } from '../../auth/auth-service.service';
import { SearchItem, SearchService } from '../../services/search.service';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MatMenuModule } from '@angular/material/menu';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatOptionModule } from '@angular/material/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { AppConfig } from 'src/conf/app.config';
import { User } from '../../auth/user.model';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { SearchBarDialogComponent } from '../search-bar-dialog/search-bar-dialog.component';
import { JsonService } from '../../services/json.service';
import { environment } from 'src/environments/environment';

@Component({
    selector: 'app-nav-home',
    templateUrl: './nav-home.component.html',
    styleUrls: ['./nav-home.component.scss'],
    standalone: true,
    imports: [CommonModule, FontAwesomeModule, RouterModule, MatMenuModule, MatFormFieldModule, ReactiveFormsModule, MatToolbarModule, MatInputModule, MatAutocompleteModule, MatOptionModule, MatIconModule],
})
export class NavHomeComponent implements OnInit,AfterViewInit,OnDestroy {

  private _authService = inject(AuthService);
  private router = inject(Router);
  private searchService = inject(SearchService);
  private dialog = inject(MatDialog);


  // Paramètres provenant d'AppConfig pour la navbar
  title = AppConfig.appTitle;
  subtitle = AppConfig.appSubTitle;
  credit = AppConfig.creditHeaderImage;
  menu = AppConfig.menu;
  menucompte = AppConfig.menucompte
  isHomePage: boolean = false;
  displayFooter = AppConfig.displayFooter;

  // Pour l'autocomplete de recherche
  searchControl = new FormControl();
  searchItems: SearchItem[] = []; // Items récupérés depuis le backend
  filteredSearchItems!: Observable<SearchItem[]>;
  searchInput = AppConfig.SEARCH_INPUT;
  placeholder = AppConfig.SEARCH_PLACEHOLDER;
  isMobile = false;
  routerSub?:Subscription;
  @ViewChild('searchButton', { read: ElementRef }) searchButton!: ElementRef;

  partenaires:string[] = [];
  partSub?:Subscription;
  searchSub?:Subscription;
  jsonService = inject(JsonService);
  displayPartners =  AppConfig.displayPartners;
  private resizeHandler?: () => void;

  ngOnInit(): void {
    // Écoute les changements de route
    this.routerSub = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.isHomePage = event.urlAfterRedirects === '/';
      });

    // Définir la valeur au premier chargement
    this.isHomePage = this.router.url === '/';
    this.init();
    
    this.partSub = this.jsonService.getPartenairesJson().subscribe(partenaires =>{
      this.partenaires = partenaires;
     
    })
  }

  ngAfterViewInit(): void {
  
    if (this.searchInput && window.innerWidth >= 600){
      this.calculateWidthSearchBar();
    }
    if(!AppConfig.displayPartners){
      let elem = document.querySelector('.nav-grid-4-4-4') as HTMLElement;
      elem.style.gridTemplateColumns = "50% 0% 50%";
    }
  }

  init(){
 
    
    // Récupération des items de recherche depuis le backend,
    // en passant l'URL de l'API définie dans AppConfig.
    if (this.searchInput) {
      this.searchSub = this.searchService.getSearchItems(AppConfig.SEARCH_ITEMS_ROUTE).subscribe((items: SearchItem[]) => {
        this.searchItems = items;
        // Initialisation de l'autocomplete dès que la liste est disponible
        this.filteredSearchItems = this.searchControl.valueChanges.pipe(
          startWith(''),
          map(value => typeof value === 'string' ? value : value?.name),
          map(name => name ? this._filter(name) : this.searchItems.slice())
        );
      });
      this.checkScreenSize();
      // Stocker la référence à la fonction pour pouvoir la supprimer
      this.resizeHandler = () => this.checkScreenSize();
      window.addEventListener('resize', this.resizeHandler);
      this.calculateWidthSearchBar();
    }else{
      this.checkScreenSize();
    }
  }
  //Calcule la place disponible pour la barre de recherche et passe le menu en mode mobile si place trop petite.
  calculateWidthSearchBar(){
    const largeurPage:number = window.innerWidth;
    const menu = document.querySelector<HTMLElement>(".menu");
    const searchBar = document.querySelector<HTMLElement>(".search-bar");
    // .menuCompte n'est rendu que pour un utilisateur connecté : pour un
    // visiteur anonyme il est absent, et la largeur à réserver est nulle.
    const menuLogin = document.querySelector<HTMLElement>(".menuCompte");

    if (!menu || !searchBar) { return; }

    const placeForSearchBar:number = largeurPage - (menu.offsetWidth + (menuLogin?.offsetWidth ?? 0));
    if(placeForSearchBar/2 <= 180){
      this.isMobile = true;
    }else{
      searchBar.style.width = placeForSearchBar/2 + "px";
    }

  }


  checkScreenSize() {
    this.isMobile = window.innerWidth <= 600;
  }
  // Filtrage des items en fonction de la saisie utilisateur (non sensible à la casse)
  private _filter(name: string): SearchItem[] {
    const filterValue = this.removeAccents(name.toLowerCase());
    return this.searchItems.filter(item =>
      this.removeAccents(item.nom.toLowerCase()).includes(filterValue)
    );
  }

  private removeAccents(text: string): string {
    return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  // Fonction pour afficher le nom de l'item sélectionné dans l'input
  displayFn(item: SearchItem): string {
    return item && item.nom ? item.nom : '';
  }

  // Lorsqu'un item est sélectionné dans l'autocomplete, naviguer vers la route associée
  onSearchItemSelected(event: any): void {
    const item: SearchItem = event.option.value;
    if (item && item.slug) {

      // Force la navigation en passant par une URL temporaire
      this.router.navigateByUrl('/dummy', { skipLocationChange: true }).then(() => {
        this.router.navigate([AppConfig.SEARCH_PREFIXE, item.slug]);
        this.searchControl.setValue('');
      });
    }
  }

  //Affiche la barre de recherche en mode mobile et la colle au bouton loupe
  toggleSearchBar(){

    const rect = this.searchButton.nativeElement.getBoundingClientRect();

    this.dialog.open(SearchBarDialogComponent, {
      width: '220px',
      hasBackdrop: true,
      position: {
        top: rect.bottom + 'px',
        left: rect.left + 'px'
      },
      panelClass: 'custom-search-dialog'
    });
  }

  public get signedIn(): boolean {
    return this._authService.authenticated || false;
  }

  public get user(): null | User {
    return this._authService.getCurrentUser();
  }

  ngOnDestroy(): void {
    this.routerSub?.unsubscribe();
    this.partSub?.unsubscribe();
    this.searchSub?.unsubscribe();
    // Supprimer l'event listener de resize
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
    }
  }

}
