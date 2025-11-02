import { Component, OnInit, signal, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  SearchProvider,
  provideSearchForComponent,
  FacetsContainerComponent,
  AppliedFiltersComponent,
  FilterConfig,
  TextFacetConfig,
  SearchBoxComponent,
  ResultsComponent,
  SuggestionsComponent,
} from '@chesnokovtony/ng-search';
import { RickMortySearchAdapter } from './rick-morty-search.adapter';

@Component({
  selector: 'app-rick-morty-demo',
  standalone: true,
  imports: [
    SearchBoxComponent,
    ResultsComponent,
    SuggestionsComponent,
    FacetsContainerComponent,
    AppliedFiltersComponent,
    RouterLink,
  ],
  providers: [
    RickMortySearchAdapter,
    provideSearchForComponent({
      adapter: RickMortySearchAdapter,
      config: {
        debounceTime: 300,
        autoSearch: false,
      },
    }),
  ],
  templateUrl: './rick-morty-demo.component.html',
  styleUrl: './rick-morty-demo.component.css',
})
export class RickMortyDemoComponent implements OnInit {
  readonly searchProvider = inject(SearchProvider);
  readonly inputValue = signal<string>('');

  ngOnInit(): void {
    // Configure facets
    const statusFacet: TextFacetConfig = {
      id: 'status',
      field: 'status',
      label: 'Status',
      type: 'text',
      multiSelect: false,
      collapsible: true,
      options: [
        { value: 'alive', label: 'Alive', count: 0 },
        { value: 'dead', label: 'Dead', count: 0 },
        { value: 'unknown', label: 'Unknown', count: 0 },
      ],
    };

    const genderFacet: TextFacetConfig = {
      id: 'gender',
      field: 'gender',
      label: 'Gender',
      type: 'text',
      multiSelect: false,
      collapsible: true,
      options: [
        { value: 'male', label: 'Male', count: 0 },
        { value: 'female', label: 'Female', count: 0 },
        { value: 'genderless', label: 'Genderless', count: 0 },
        { value: 'unknown', label: 'Unknown', count: 0 },
      ],
    };

    const speciesFacet: TextFacetConfig = {
      id: 'species',
      field: 'species',
      label: 'Species',
      type: 'text',
      multiSelect: true,
      searchable: true,
      collapsible: true,
      options: [
        { value: 'human', label: 'Human', count: 0 },
        { value: 'alien', label: 'Alien', count: 0 },
        { value: 'humanoid', label: 'Humanoid', count: 0 },
        { value: 'robot', label: 'Robot', count: 0 },
        { value: 'cronenberg', label: 'Cronenberg', count: 0 },
        { value: 'animal', label: 'Animal', count: 0 },
      ],
    };

    this.searchProvider.addFacets([statusFacet, genderFacet, speciesFacet]);

    // Perform initial search to show some results
    this.searchProvider.executeSearch();
  }

  onFacetChange(event: { facetId: string; values: Set<string | number> }): void {
    this.searchProvider.updateFacetSelection(event.facetId, event.values);
    this.searchProvider.executeSearch();
  }

  onClearAllFilters(): void {
    this.searchProvider.clearAllFacets();
    this.searchProvider.executeSearch();
  }

  onRemoveFilter(filter: FilterConfig): void {
    // The filter's field corresponds to the facet ID
    this.searchProvider.clearFacet(filter.field);
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

  onPageChange(page: number): void {
    // When autoSearch is disabled, we need to manually trigger search on pagination
    this.searchProvider.executeSearch();
  }
}
