import { Component, effect, inject, signal } from '@angular/core';
import { SearchBoxComponent, SuggestionsComponent, ResultsComponent, provideSearchForComponent, SearchProvider } from '../../projects/ng-search-lib/src/public-api';
import { DemoSearchAdapter } from './demo-search.adapter';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [SearchBoxComponent, SuggestionsComponent, ResultsComponent, RouterLink],
  providers: [
    ...provideSearchForComponent()
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = '@ng-search/core Demo';

  searchProvider = inject(SearchProvider);

  // Track the current input value separately from the search query
  inputValue = signal<string>('');

  constructor() {
    // Initialize the search with the adapter
    const adapter = new DemoSearchAdapter();
    this.searchProvider.initialize(adapter, {
      debounceTime: 300,
      pageSize: 5,
      autoSearch: false // Disable automatic search on query change
    });

    // Trigger initial search to load all results
    this.searchProvider.executeSearch();

    // Log state changes
    effect(() => {
      this.searchProvider.query();
      this.searchProvider.loading();
      this.searchProvider.results();
      this.searchProvider.error();
      this.searchProvider.total();
    });
  }

  onQueryChange(query: string): void {
    // Update the input value (for display)
    this.inputValue.set(query);

    // Update the search state query (needed for suggestions visibility logic)
    // This won't trigger search because autoSearch is false
    this.searchProvider.state.setQuery(query);

    // Only handle suggestions on query change, not search
    // Search is triggered only by: Enter key, search button, or suggestion selection

    // Request suggestions as user types, or clear them if query is too short
    if (query.length >= 2) {
      this.searchProvider.getSuggestions(query);
    } else {
      this.searchProvider.clearSuggestions();
    }
  }

  onSearch(query: string): void {
    // Update the query state and trigger manual search
    this.inputValue.set(query);
    this.searchProvider.state.setQuery(query);
    this.searchProvider.executeSearch();
  }

  onSuggestionSelected(suggestion: any): void {
    // When a suggestion is selected, update query, input value, trigger search, and clear suggestions
    this.inputValue.set(suggestion.text);
    this.searchProvider.state.setQuery(suggestion.text);
    this.searchProvider.clearSuggestions();
    this.searchProvider.executeSearch();
  }

  toggleFilters(): void {
    // Example: Open a filters sidebar or modal
    // This demonstrates custom button actions beyond just search
  }

  onPageChange(page: number): void {
    // When autoSearch is disabled, we need to manually trigger search on pagination
    this.searchProvider.executeSearch();
  }
}
