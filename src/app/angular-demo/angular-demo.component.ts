import { Component, effect, inject, signal, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  SearchBoxComponent,
  SuggestionsComponent,
  ResultsComponent,
  FacetsContainerComponent,
  AppliedFiltersComponent,
  provideSearchForComponent,
  SearchProvider,
  FacetRegistryService,
  FilterConfig,
  TextFacetConfig,
} from '@chesnokovtony/ng-search';
import { DemoSearchAdapter } from './demo-search.adapter';
import {
  DifficultyFacetConfig,
  DifficultyPillsFacetComponent,
} from '../facets/difficulty-pills-facet.component';

@Component({
  selector: 'app-angular-demo',
  standalone: true,
  imports: [
    SearchBoxComponent,
    SuggestionsComponent,
    ResultsComponent,
    FacetsContainerComponent,
    AppliedFiltersComponent,
    RouterLink,
  ],
  providers: [
    DemoSearchAdapter,
    provideSearchForComponent({
      adapter: DemoSearchAdapter,
      config: {
        debounceTime: 300,
        pageSize: 5,
        autoSearch: false,
      },
    }),
  ],
  templateUrl: './angular-demo.component.html',
  styleUrl: './angular-demo.component.css',
})
export class AngularDemoComponent {
  title = 'Angular Guides Demo';

  readonly searchProvider = inject(SearchProvider);
  private readonly facetRegistry = inject(FacetRegistryService);

  // Track the current input value separately from the search query
  readonly inputValue = signal<string>('');

  readonly facetLabels: Record<string, string> = {
    category: 'Category',
    difficulty: 'Skill level',
    author: 'Author',
    tags: 'Tags',
  };

  constructor() {
    this.registerCustomFacet();

    this.configureFacets();
    this.setupFacetAggregationSync();
    this.setupDebugLogging();

    // Trigger initial search to load all results
    this.searchProvider.executeSearch();
  }

  onQueryChange(query: string): void {
    // Update the input value (for display)
    this.inputValue.set(query);

    // Update the search state query (needed for suggestions visibility logic)
    this.searchProvider.state.setQuery(query);

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

  onFacetChange(event: { facetId: string; values: Set<string | number> }): void {
    this.searchProvider.updateFacetSelection(event.facetId, event.values);
    this.searchProvider.executeSearch();
  }

  onClearAllFilters(): void {
    this.searchProvider.clearAllFacets();
    this.searchProvider.executeSearch();
  }

  onRemoveFilter(filter: FilterConfig): void {
    this.searchProvider.clearFacet(filter.field);
    this.searchProvider.executeSearch();
  }

  onPageChange(page: number): void {
    // When autoSearch is disabled, we need to manually trigger search on pagination
    this.searchProvider.executeSearch();
  }

  private registerCustomFacet(): void {
    if (this.facetRegistry.has('difficulty-pills')) {
      return;
    }

    this.facetRegistry.register({
      type: 'difficulty-pills',
      component: DifficultyPillsFacetComponent as any,
      icon: '⭐️',
      description: 'Pill-style facet for showcasing difficulty levels with custom styling',
    });
  }

  private configureFacets(): void {
    const categoryFacet: TextFacetConfig = {
      id: 'category',
      field: 'category',
      label: 'Content type',
      type: 'text',
      multiSelect: true,
      collapsible: true,
      sort: 'key',
      options: [
        { value: 'Tutorial', label: 'Tutorial', count: 0 },
        { value: 'Guide', label: 'Guide', count: 0 },
        { value: 'Advanced', label: 'Advanced', count: 0 },
      ],
    };

    const difficultyFacet: DifficultyFacetConfig = {
      id: 'difficulty',
      field: 'difficulty',
      label: 'Skill level',
      type: 'difficulty-pills',
      multiSelect: true,
      collapsible: true,
      options: [
        { value: 'beginner', label: 'Beginner', count: 0 },
        { value: 'intermediate', label: 'Intermediate', count: 0 },
        { value: 'advanced', label: 'Advanced', count: 0 },
      ],
      config: {
        emphasis: 'solid',
        iconMap: {
          beginner: '🌱',
          intermediate: '🛠️',
          advanced: '🧠',
        },
        descriptions: {
          beginner: 'Foundational concepts & quick wins',
          intermediate: 'Level up with real-world patterns',
          advanced: 'Deep dives & architectural guidance',
        },
        showCounts: true,
      },
    };

    const authorFacet: TextFacetConfig = {
      id: 'author',
      field: 'author',
      label: 'Author',
      type: 'text',
      multiSelect: false,
      collapsible: true,
      options: [
        { value: 'Angular Team', label: 'Angular Team', count: 0 },
        { value: 'John Doe', label: 'John Doe', count: 0 },
        { value: 'Jane Smith', label: 'Jane Smith', count: 0 },
      ],
    };

    const tagFacet: TextFacetConfig = {
      id: 'tags',
      field: 'tags',
      label: 'Topics',
      type: 'text',
      multiSelect: true,
      searchable: true,
      collapsible: true,
      sort: 'count',
      maxValues: 8,
      options: [
        { value: 'signals', label: 'Signals', count: 0 },
        { value: 'performance', label: 'Performance', count: 0 },
        { value: 'state-management', label: 'State management', count: 0 },
        { value: 'components', label: 'Components', count: 0 },
        { value: 'ssr', label: 'SSR', count: 0 },
        { value: 'seo', label: 'SEO', count: 0 },
        { value: 'zoneless', label: 'Zoneless', count: 0 },
        { value: 'architecture', label: 'Architecture', count: 0 },
      ],
    };

    this.searchProvider.addFacets([categoryFacet, difficultyFacet, authorFacet, tagFacet]);
  }

  private setupFacetAggregationSync(): void {
    effect(() => {
      const aggregations = this.searchProvider.state.aggregations();
      if (!aggregations || Object.keys(aggregations).length === 0) {
        return;
      }

      untracked(() => {
        this.searchProvider.facetManager.updateAllFacetValues(aggregations);
      });
    });
  }

  private setupDebugLogging(): void {
    effect(() => {
      this.searchProvider.query();
      this.searchProvider.loading();
      this.searchProvider.results();
      this.searchProvider.error();
      this.searchProvider.total();
    });
  }
}
