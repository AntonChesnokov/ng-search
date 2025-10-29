import { Component, OnInit, signal, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { SearchProvider, provideSearchForComponent } from '../../../projects/ng-search-lib/src/public-api';
import { SearchBoxComponent } from '../../../projects/ng-search-lib/src/lib/components/search-box/search-box.component';
import { ResultsComponent } from '../../../projects/ng-search-lib/src/lib/components/results/results.component';
import { SuggestionsComponent } from '../../../projects/ng-search-lib/src/lib/components/suggestions/suggestions.component';
import { RickMortySearchAdapter } from '../rick-morty-search.adapter';

@Component({
  selector: 'app-rick-morty-demo',
  standalone: true,
  imports: [
    SearchBoxComponent,
    ResultsComponent,
    SuggestionsComponent,
    RouterLink
  ],
  providers: [
    ...provideSearchForComponent()
  ],
  templateUrl: './rick-morty-demo.component.html',
  styleUrl: './rick-morty-demo.component.css'
})
export class RickMortyDemoComponent implements OnInit {
  readonly searchProvider = inject(SearchProvider);
  readonly http = inject(HttpClient);
  readonly inputValue = signal<string>('');
  readonly selectedFilters = signal<{ status?: string; species?: string; gender?: string }>({});

  ngOnInit(): void {
    // Initialize the search provider with Rick and Morty adapter
    this.searchProvider.initialize(new RickMortySearchAdapter(this.http), {
      debounceTime: 300,
      autoSearch: false
    });

    // Perform initial search to show some results
    this.searchProvider.executeSearch();
  }

  onQueryChange(query: string): void {
    this.inputValue.set(query);
    this.searchProvider.state.setQuery(query);

    // Get suggestions for queries with 2+ characters
    if (query.length >= 2) {
      this.searchProvider.getSuggestions(query);
    } else {
      this.searchProvider.clearSuggestions();
    }
  }

  onSearch(query: string): void {
    this.inputValue.set(query);
    this.searchProvider.state.setQuery(query);
    this.searchProvider.executeSearch();
  }

  onSuggestionSelected(suggestion: any): void {
    this.inputValue.set(suggestion.text);
    this.searchProvider.state.setQuery(suggestion.text);
    this.searchProvider.clearSuggestions();
    this.searchProvider.executeSearch();
  }

  filterByStatus(status: string): void {
    const filters = { ...this.selectedFilters() };

    if (filters.status === status) {
      delete filters.status;
      this.searchProvider.state.removeFilter('status');
    } else {
      filters.status = status;
      this.searchProvider.state.addFilter({
        field: 'status',
        value: status,
        type: 'term'
      });
    }

    this.selectedFilters.set(filters);
    this.searchProvider.executeSearch();
  }

  filterByGender(gender: string): void {
    const filters = { ...this.selectedFilters() };

    if (filters.gender === gender) {
      delete filters.gender;
      this.searchProvider.state.removeFilter('gender');
    } else {
      filters.gender = gender;
      this.searchProvider.state.addFilter({
        field: 'gender',
        value: gender,
        type: 'term'
      });
    }

    this.selectedFilters.set(filters);
    this.searchProvider.executeSearch();
  }

  clearFilters(): void {
    this.selectedFilters.set({});
    this.searchProvider.state.clearFilters();
    this.searchProvider.executeSearch();
  }

  hasActiveFilters(): boolean {
    const filters = this.selectedFilters();
    return Object.keys(filters).length > 0;
  }

  onPageChange(page: number): void {
    // When autoSearch is disabled, we need to manually trigger search on pagination
    this.searchProvider.executeSearch();
  }
}
