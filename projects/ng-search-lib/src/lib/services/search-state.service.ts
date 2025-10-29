/**
 * Search State Service
 * Central state management using Angular signals
 * Zone-less compatible, SSR-safe
 */

import { Injectable, signal, computed, Signal, WritableSignal } from '@angular/core';
import {
	SearchResult,
	SearchQuery,
	FilterConfig,
	SortConfig,
	PaginationConfig,
	AggregationResult,
	Suggestion,
	SearchEvent,
	SearchEventType,
} from '../types/search-types';
import { SearchConfigModel } from '../models/search-config.model';

/**
 * Search state service
 * Manages all search-related state using signals
 */
@Injectable()
export class SearchStateService<T = any> {
	// Writable signals for mutable state
	private readonly _query = signal<string>('');
	private readonly _results = signal<SearchResult<T>[]>([]);
	private readonly _loading = signal<boolean>(false);
	private readonly _loadingSuggestions = signal<boolean>(false);
	private readonly _error = signal<Error | null>(null);
	private readonly _total = signal<number>(0);
	private readonly _filters = signal<Map<string, FilterConfig>>(new Map());
	private readonly _sort = signal<SortConfig[]>([]);
	private readonly _pagination = signal<PaginationConfig>({
		page: 1,
		pageSize: 10,
		total: 0,
	});
	private readonly _aggregations = signal<Record<string, AggregationResult>>({});
	private readonly _suggestions = signal<Suggestion[]>([]);
	private readonly _events = signal<SearchEvent[]>([]);

	// Readonly public signals
	readonly query: Signal<string> = this._query.asReadonly();
	readonly results: Signal<SearchResult<T>[]> = this._results.asReadonly();
	readonly loading: Signal<boolean> = this._loading.asReadonly();
	readonly loadingSuggestions: Signal<boolean> = this._loadingSuggestions.asReadonly();
	readonly error: Signal<Error | null> = this._error.asReadonly();
	readonly total: Signal<number> = this._total.asReadonly();
	readonly filters: Signal<Map<string, FilterConfig>> = this._filters.asReadonly();
	readonly sort: Signal<SortConfig[]> = this._sort.asReadonly();
	readonly pagination: Signal<PaginationConfig> = this._pagination.asReadonly();
	readonly aggregations: Signal<Record<string, AggregationResult>> = this._aggregations.asReadonly();
	readonly suggestions: Signal<Suggestion[]> = this._suggestions.asReadonly();
	readonly events: Signal<SearchEvent[]> = this._events.asReadonly();

	// Computed signals for derived state
	readonly hasQuery = computed(() => this._query().trim().length > 0);
	readonly hasResults = computed(() => this._results().length > 0);
	readonly hasError = computed(() => this._error() !== null);
	readonly hasFilters = computed(() => this._filters().size > 0);
	readonly hasSuggestions = computed(() => this._suggestions().length > 0);
	readonly isEmpty = computed(() => !this.loading() && !this.hasResults() && this.hasQuery());
	readonly isInitial = computed(() => !this.loading() && !this.hasQuery() && !this.hasResults());

	// Computed current page info
	readonly currentPage = computed(() => this._pagination().page);
	readonly pageSize = computed(() => this._pagination().pageSize);
	readonly totalPages = computed(() => {
		const { pageSize, total } = this._pagination();
		return Math.ceil(total / pageSize);
	});
	readonly hasNextPage = computed(() => this.currentPage() < this.totalPages());
	readonly hasPrevPage = computed(() => this.currentPage() > 1);

	// Computed search query object
	readonly searchQuery = computed<SearchQuery>(() => ({
		query: this._query(),
		size: this._pagination().pageSize,
		from: (this._pagination().page - 1) * this._pagination().pageSize,
		sort: this._sort(),
		filters: Array.from(this._filters().values()),
	}));

	/**
	 * Set search query
	 */
	setQuery(query: string): void {
		this._query.set(query);
		this._pagination.update((p) => ({ ...p, page: 1 })); // Reset to first page
		this.emitEvent('query_changed', { query });
	}

	/**
	 * Set results
	 */
	setResults(results: SearchResult<T>[], total: number): void {
		console.log('[SearchState] setResults() called with', results.length, 'results, total:', total);
		this._results.set(results);
		this._total.set(total);
		// Don't update pagination here as it triggers searchQuery computed which causes infinite loop
		// this._pagination.update((p) => ({ ...p, total }));
	}

	/**
	 * Set loading state
	 */
	setLoading(loading: boolean): void {
		this._loading.set(loading);
		if (loading) {
			this._error.set(null); // Clear error when starting new search
		}
	}

	/**
	 * Set suggestions loading state
	 */
	setLoadingSuggestions(loading: boolean): void {
		this._loadingSuggestions.set(loading);
	}

	/**
	 * Set error state
	 */
	setError(error: Error | null): void {
		this._error.set(error);
		if (error) {
			this._loading.set(false);
		}
	}

	/**
	 * Add or update filter
	 */
	addFilter(filter: FilterConfig): void {
		this._filters.update((filters) => {
			const newFilters = new Map(filters);
			newFilters.set(filter.field, filter);
			return newFilters;
		});
		this._pagination.update((p) => ({ ...p, page: 1 })); // Reset to first page
		this.emitEvent('filter_added', { filter });
	}

	/**
	 * Remove filter by field
	 */
	removeFilter(field: string): void {
		this._filters.update((filters) => {
			const newFilters = new Map(filters);
			newFilters.delete(field);
			return newFilters;
		});
		this._pagination.update((p) => ({ ...p, page: 1 })); // Reset to first page
		this.emitEvent('filter_removed', { field });
	}

	/**
	 * Clear all filters
	 */
	clearFilters(): void {
		this._filters.set(new Map());
		this._pagination.update((p) => ({ ...p, page: 1 })); // Reset to first page
		this.emitEvent('filter_cleared');
	}

	/**
	 * Update filter value
	 */
	updateFilter(field: string, value: any): void {
		this._filters.update((filters) => {
			const newFilters = new Map(filters);
			const existingFilter = newFilters.get(field);
			if (existingFilter) {
				newFilters.set(field, { ...existingFilter, value });
			}
			return newFilters;
		});
		this._pagination.update((p) => ({ ...p, page: 1 })); // Reset to first page
	}

	/**
	 * Set sort configuration
	 */
	setSort(sort: SortConfig[]): void {
		this._sort.set(sort);
		this._pagination.update((p) => ({ ...p, page: 1 })); // Reset to first page
	}

	/**
	 * Set pagination
	 */
	setPagination(page: number, pageSize?: number): void {
		this._pagination.update((p) => ({
			...p,
			page,
			pageSize: pageSize ?? p.pageSize,
		}));
		this.emitEvent('page_changed', { page, pageSize });
	}

	/**
	 * Go to next page
	 */
	nextPage(): void {
		if (this.hasNextPage()) {
			this.setPagination(this.currentPage() + 1);
		}
	}

	/**
	 * Go to previous page
	 */
	prevPage(): void {
		if (this.hasPrevPage()) {
			this.setPagination(this.currentPage() - 1);
		}
	}

	/**
	 * Set aggregations
	 */
	setAggregations(aggregations: Record<string, AggregationResult>): void {
		this._aggregations.set(aggregations);
	}

	/**
	 * Set suggestions
	 */
	setSuggestions(suggestions: Suggestion[]): void {
		this._suggestions.set(suggestions);
	}

	/**
	 * Clear suggestions
	 */
	clearSuggestions(): void {
		this._suggestions.set([]);
	}

	/**
	 * Reset all state
	 */
	reset(): void {
		this._query.set('');
		this._results.set([]);
		this._loading.set(false);
		this._error.set(null);
		this._total.set(0);
		this._filters.set(new Map());
		this._sort.set([]);
		this._pagination.set({ page: 1, pageSize: 10, total: 0 });
		this._aggregations.set({});
		this._suggestions.set([]);
	}

	/**
	 * Get state snapshot (useful for SSR)
	 */
	getSnapshot() {
		return {
			query: this._query(),
			results: this._results(),
			loading: this._loading(),
			error: this._error(),
			total: this._total(),
			filters: Array.from(this._filters().entries()),
			sort: this._sort(),
			pagination: this._pagination(),
			aggregations: this._aggregations(),
			suggestions: this._suggestions(),
		};
	}

	/**
	 * Restore state from snapshot (useful for SSR hydration)
	 */
	restoreSnapshot(snapshot: ReturnType<typeof this.getSnapshot>): void {
		this._query.set(snapshot.query);
		this._results.set(snapshot.results);
		this._loading.set(snapshot.loading);
		this._error.set(snapshot.error);
		this._total.set(snapshot.total);
		this._filters.set(new Map(snapshot.filters));
		this._sort.set(snapshot.sort);
		this._pagination.set(snapshot.pagination);
		this._aggregations.set(snapshot.aggregations);
		this._suggestions.set(snapshot.suggestions);
	}

	/**
	 * Emit event for tracking
	 */
	private emitEvent(type: SearchEventType, payload?: any): void {
		const event: SearchEvent = {
			type,
			timestamp: Date.now(),
			payload,
		};
		this._events.update((events) => [...events, event]);
	}

	/**
	 * Get recent events
	 */
	getRecentEvents(count: number = 10): SearchEvent[] {
		const allEvents = this._events();
		return allEvents.slice(-count);
	}

	/**
	 * Clear events
	 */
	clearEvents(): void {
		this._events.set([]);
	}
}
