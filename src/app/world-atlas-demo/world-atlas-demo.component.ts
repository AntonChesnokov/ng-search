import { Component, effect, inject, signal, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  AppliedFiltersComponent,
  FacetRegistryService,
  FacetsContainerComponent,
  FilterConfig,
  NumberRangeFacetConfig,
  ResultsComponent,
  SearchBoxComponent,
  SearchProvider,
  SuggestionsComponent,
  TextFacetConfig,
  provideSearchForComponent,
} from '@chesnokovtony/ng-search';
import { BadgeFacetComponent, BadgeFacetConfig } from '../facets/badge-facet.component';
import { RestCountriesSearchAdapter, RestCountry } from './rest-countries-search.adapter';

@Component({
  selector: 'app-world-atlas-demo',
  standalone: true,
  imports: [
    RouterLink,
    SearchBoxComponent,
    SuggestionsComponent,
    ResultsComponent,
    FacetsContainerComponent,
    AppliedFiltersComponent,
  ],
  providers: [
    RestCountriesSearchAdapter,
    provideSearchForComponent({
      adapter: RestCountriesSearchAdapter,
      config: {
        debounceTime: 250,
        pageSize: 15,
        autoSearch: true,
        enableSuggestions: true,
      },
    }),
  ],
  templateUrl: './world-atlas-demo.component.html',
  styleUrls: ['./world-atlas-demo.component.css'],
})
export class WorldAtlasDemoComponent {
  readonly searchProvider = inject(SearchProvider);
  private readonly facetRegistry = inject(FacetRegistryService);

  readonly inputValue = signal<string>('');
  readonly facetLabels: Record<string, string> = {
    region: 'Region',
    subregion: 'Sub-region',
    timezones: 'Time zones',
    population: 'Population',
  };

  constructor() {
    this.registerBadgeFacet();

    this.configureFacets();
    this.setupFacetAggregationSync();
    this.setupDebugLogging();
    this.searchProvider.executeSearch();
  }

  onQueryChange(query: string): void {
    this.inputValue.set(query);
    this.searchProvider.state.setQuery(query);

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

  onPageChange(): void {
    this.searchProvider.executeSearch();
  }

  readonly formatNumber = (value?: number): string | null => {
    if (typeof value !== 'number' || Number.isNaN(value)) {
      return null;
    }
    return new Intl.NumberFormat('en-US').format(value);
  };

  readonly listCurrencies = (country: RestCountry): string[] => {
    if (!country.currencies) {
      return [];
    }
    return Object.values(country.currencies)
      .map((currency) =>
        currency.symbol ? `${currency.name} (${currency.symbol})` : currency.name
      )
      .slice(0, 3);
  };

  readonly primaryFlag = (country: RestCountry): string | null =>
    country.flags?.svg ?? country.flags?.png ?? null;

  private registerBadgeFacet(): void {
    if (!this.facetRegistry.has('badge-grid')) {
      this.facetRegistry.register({
        type: 'badge-grid',
        component: BadgeFacetComponent as any,
        icon: '🪄',
        description: 'Badge facet for highlighting categorical selections',
      });
    }
  }

  private configureFacets(): void {
    const regionFacet: BadgeFacetConfig = {
      id: 'region',
      field: 'region',
      label: 'Global region',
      type: 'badge-grid',
      multiSelect: true,
      collapsible: false,
      config: {
        columns: 1,
        badges: {
          africa: { icon: '🌍', description: 'African nations' },
          americas: { icon: '🗽', description: 'North & South America' },
          asia: { icon: '🛕', description: 'Asia-Pacific' },
          europe: { icon: '🏰', description: 'European countries' },
          oceania: { icon: '🏝️', description: 'Oceania & Pacific' },
          antarctic: { icon: '❄️', description: 'Antarctic territories' },
        },
      },
    };

    const subregionFacet: TextFacetConfig = {
      id: 'subregion',
      field: 'subregion',
      label: 'Sub-region',
      type: 'text',
      multiSelect: true,
      collapsible: true,
      sort: 'count',
    };

    const timezonesFacet: TextFacetConfig = {
      id: 'timezones',
      field: 'timezones',
      label: 'Time zones',
      type: 'text',
      multiSelect: true,
      collapsible: true,
      sort: 'count',
    };

    const populationFacet: NumberRangeFacetConfig = {
      id: 'population',
      field: 'population',
      label: 'Population range',
      type: 'number-range',
      collapsible: true,
      min: 0,
      max: 1500000000,
      step: 500000,
      showSlider: false,
      formatter: (value) => `${new Intl.NumberFormat('en-US').format(value)} people`,
    };

    this.searchProvider.addFacets([regionFacet, subregionFacet, timezonesFacet, populationFacet]);
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
