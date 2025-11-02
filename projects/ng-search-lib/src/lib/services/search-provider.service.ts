/**
 * Search Provider
 * Convenient wrapper that provides complete search functionality
 * Use this to set up search in your application
 */

import { Injectable, Signal, Inject, Optional } from '@angular/core';
import { SearchStateService } from './search-state.service';
import { SearchCoordinatorService } from './search-coordinator.service';
import { FacetRegistryService } from './facet-registry.service';
import { FacetManagerService } from './facet-manager.service';
import { SearchAdapter } from '../types/adapter-types';
import { SearchConfigModel } from '../models/search-config.model';
import {
  SearchResult,
  SearchQuery,
  FilterConfig,
  SortConfig,
  Suggestion,
  SearchEvent,
} from '../types/search-types';
import { FacetConfig, FacetState } from '../types/facet-types';
import {
  NG_SEARCH_ADAPTER,
  NG_SEARCH_AUTO_INITIALIZE,
  NG_SEARCH_INITIAL_CONFIG,
  NG_SEARCH_INITIAL_FACETS,
} from '../search.tokens';

/**
 * Search provider service
 * High-level API for search functionality
 * Combines state, coordination, and registry
 */
@Injectable()
export class SearchProvider<T = any> {
  constructor(
    public readonly state: SearchStateService<T>,
    public readonly coordinator: SearchCoordinatorService<T>,
    public readonly registry: FacetRegistryService,
    public readonly facetManager: FacetManagerService,
    @Optional()
    @Inject(NG_SEARCH_ADAPTER)
    private readonly initialAdapter?: SearchAdapter<T> | null,
    @Optional()
    @Inject(NG_SEARCH_INITIAL_CONFIG)
    private readonly initialConfig?: Partial<SearchConfigModel> | null,
    @Optional()
    @Inject(NG_SEARCH_INITIAL_FACETS)
    private readonly initialFacets?: FacetConfig[] | null,
    @Optional() @Inject(NG_SEARCH_AUTO_INITIALIZE) private readonly autoInitialize?: boolean | null
  ) {
    this.registry.ensureBuiltInFacets();
    this.bootstrapFromTokens();
  }

  private bootstrapFromTokens(): void {
    const adapter = this.initialAdapter ?? undefined;
    const config = this.initialConfig ?? undefined;
    const facets = this.initialFacets ?? undefined;
    const shouldInitialize = this.autoInitialize ?? true;

    if (!adapter && !config && !facets?.length) {
      return;
    }

    if (adapter && shouldInitialize) {
      this.initialize(adapter, config);
    } else if (config) {
      this.coordinator.setConfig(config);
    }

    if (facets?.length) {
      this.addFacets(facets);
    }
  }

  // Expose signals from state as getters
  get query(): Signal<string> {
    return this.state.query;
  }
  get results(): Signal<SearchResult<T>[]> {
    return this.state.results;
  }
  get loading(): Signal<boolean> {
    return this.state.loading;
  }
  get error(): Signal<Error | null> {
    return this.state.error;
  }
  get total(): Signal<number> {
    return this.state.total;
  }
  get hasResults(): Signal<boolean> {
    return this.state.hasResults;
  }
  get isEmpty(): Signal<boolean> {
    return this.state.isEmpty;
  }
  get suggestions(): Signal<Suggestion[]> {
    return this.state.suggestions;
  }
  get events(): Signal<SearchEvent[]> {
    return this.state.events;
  }
  get currentPage(): Signal<number> {
    return this.state.currentPage;
  }
  get totalPages(): Signal<number> {
    return this.state.totalPages;
  }
  get facets(): Signal<FacetState[]> {
    return this.facetManager.facets;
  }
  get appliedFilters(): Signal<FilterConfig[]> {
    return this.facetManager.appliedFilters;
  }

  /**
   * Initialize search with adapter and configuration
   */
  initialize(adapter: SearchAdapter<T>, config?: Partial<SearchConfigModel>): void {
    this.coordinator.setAdapter(adapter);
    if (config) {
      this.coordinator.setConfig(config);
    }
  }

  /**
   * Set search query
   */
  search(query: string): void {
    this.state.setQuery(query);
  }

  /**
   * Add filter
   */
  addFilter(filter: FilterConfig): void {
    this.state.addFilter(filter);
  }

  /**
   * Remove filter
   */
  removeFilter(field: string): void {
    this.state.removeFilter(field);
  }

  /**
   * Clear all filters
   */
  clearFilters(): void {
    this.state.clearFilters();
  }

  /**
   * Set sort
   */
  setSort(sort: SortConfig[]): void {
    this.state.setSort(sort);
  }

  /**
   * Go to page
   */
  goToPage(page: number): void {
    this.state.setPagination(page);
  }

  /**
   * Next page
   */
  nextPage(): void {
    this.state.nextPage();
  }

  /**
   * Previous page
   */
  prevPage(): void {
    this.state.prevPage();
  }

  /**
   * Get suggestions
   */
  getSuggestions(query: string): void {
    this.coordinator.suggest(query);
  }

  /**
   * Clear suggestions
   */
  clearSuggestions(): void {
    this.state.clearSuggestions();
  }

  /**
   * Reset search
   */
  reset(): void {
    this.state.reset();
  }

  /**
   * Manual search execution
   */
  executeSearch(query?: SearchQuery): void {
    this.coordinator.search(query);
  }

  // Facet methods

  /**
   * Add facet configuration
   */
  addFacet(config: FacetConfig): void {
    this.facetManager.addFacet(config);
  }

  /**
   * Add multiple facets
   */
  addFacets(configs: FacetConfig[]): void {
    this.facetManager.addFacets(configs);
  }

  /**
   * Remove facet
   */
  removeFacet(facetId: string): void {
    this.facetManager.removeFacet(facetId);
  }

  /**
   * Update facet selection
   */
  updateFacetSelection(facetId: string, values: Set<string | number>): void {
    this.facetManager.updateFacetSelection(facetId, values);
    // Optionally sync with state filters
    const changeEvent = this.facetManager.lastChange();
    if (!changeEvent) {
      return;
    }

    if (changeEvent.filter) {
      this.state.addFilter(changeEvent.filter);
    } else {
      this.state.removeFilter(changeEvent.config.field);
    }
  }

  /**
   * Clear facet
   */
  clearFacet(facetId: string): void {
    const facet = this.facetManager.getFacet(facetId);
    this.facetManager.clearFacet(facetId);
    if (facet) {
      this.state.removeFilter(facet.config.field);
    }
  }

  /**
   * Clear all facets
   */
  clearAllFacets(): void {
    const facets = this.facetManager.facets();
    facets.forEach((facet) => this.state.removeFilter(facet.config.field));
    this.facetManager.clearAllFacets();
  }

  /**
   * Toggle facet collapsed state
   */
  toggleFacetCollapsed(facetId: string): void {
    this.facetManager.toggleCollapsed(facetId);
  }
}
