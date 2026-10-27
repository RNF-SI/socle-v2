import { Component, inject, OnDestroy, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { map, Observable, startWith } from 'rxjs';
import { AuthService } from '../../auth/auth-service.service';
import { SearchService, SearchItem } from '../../services/search.service';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatOptionModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatToolbarModule } from '@angular/material/toolbar';
import { AppConfig } from 'src/conf/app.config';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-search-bar-dialog',
  imports: [CommonModule,MatFormFieldModule,ReactiveFormsModule,MatToolbarModule,MatInputModule,MatAutocompleteModule,MatOptionModule,MatIconModule,MatDialogModule],
  templateUrl: './search-bar-dialog.component.html',
  styleUrl: './search-bar-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone:true
})
export class SearchBarDialogComponent implements OnInit, OnDestroy{
  constructor(
    public dialogRef: MatDialogRef<SearchBarDialogComponent>,
   
) {}
  private router = inject(Router);
  private searchService = inject(SearchService);
  searchControl = new FormControl();
  searchItems: SearchItem[] = []; // Items récupérés depuis le backend
  filteredSearchItems!: Observable<SearchItem[]>;
  private searchSub?: Subscription;

  placeholder = AppConfig.SEARCH_PLACEHOLDER;

  ngOnInit(): void {
    this.searchSub = this.searchService.getSearchItems(AppConfig.SEARCH_ITEMS_ROUTE).subscribe((items: SearchItem[]) => {
      this.searchItems = items;
      // Initialisation de l'autocomplete dès que la liste est disponible
      this.filteredSearchItems = this.searchControl.valueChanges.pipe(
        startWith(''),
        map(value => typeof value === 'string' ? value : value?.name),
        map(name => name ? this._filter(name) : this.searchItems.slice())
      );
    });
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

  ngOnDestroy(): void {
    this.searchSub?.unsubscribe();
  }
}
