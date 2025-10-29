import { Component, effect, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SearchBoxComponent, SuggestionsComponent, ResultsComponent, provideSearchForComponent, SearchProvider } from '../../projects/ng-search-lib/src/public-api';
import { DemoSearchAdapter } from './demo-search.adapter';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [SearchBoxComponent, SuggestionsComponent, ResultsComponent, RouterLink],
  providers: [
    ...provideSearchForComponent()
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css', './home.component.css']
})
export class HomeComponent {
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

    // Update the search state (but don't trigger search yet)
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

  toggleFilters(): void {
    // This is just a demo method to show how you can add custom actions
  }
}
