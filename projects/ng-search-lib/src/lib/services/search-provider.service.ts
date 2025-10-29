/**
 * Search Provider
 * Convenient wrapper that provides complete search functionality
 * Use this to set up search in your application
 */

import { Injectable, Signal } from '@angular/core';
import { SearchStateService } from './search-state.service';
import { SearchCoordinatorService } from './search-coordinator.service';
import { FacetRegistryService } from './facet-registry.service';
import { SearchAdapter } from '../types/adapter-types';
import { SearchConfigModel } from '../models/search-config.model';
import { SearchResult, SearchQuery, FilterConfig, SortConfig, Suggestion } from '../types/search-types';
import { FacetConfig } from '../types/facet-types';

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
		public readonly registry: FacetRegistryService
	) {}

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
	get currentPage(): Signal<number> {
		return this.state.currentPage;
	}
	get totalPages(): Signal<number> {
		return this.state.totalPages;
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
}
