/**
 * Search State Service
 * Central state management using Angular signals
 * Zone-less compatible, SSR-safe
 */

import { Injectable, signal, computed, Signal, WritableSignal, inject } from '@angular/core';
import {
  FilterConfig,
  SortConfig,
  PaginationConfig,
  AggregationResult,
  Suggestion,
  SearchEvent,
  SearchEventType,
  SearchQuery,
  SearchResult,
} from '../types/search-types';
import { SearchConfigModel } from '../models/search-config.model';
import { SearchTelemetryService } from './search-telemetry.service';
import { DEFAULT_SEARCH_LOGGER, NG_SEARCH_LOGGER } from './search-logger';

const DEFAULT_EVENT_HISTORY_LIMIT = 100;

/**
 * Search state service
 * Manages all search-related state using signals
 */
@Injectable()
export class SearchStateService<T = any> {
  private readonly telemetry = inject(SearchTelemetryService, { optional: true });
  private readonly logger = inject(NG_SEARCH_LOGGER, { optional: true }) ?? DEFAULT_SEARCH_LOGGER;
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
  private readonly _eventHistoryLimit = signal<number | null>(DEFAULT_EVENT_HISTORY_LIMIT);

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
  readonly aggregations: Signal<Record<string, AggregationResult>> =
    this._aggregations.asReadonly();
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
    this._pagination.update((p) => ({ ...p, page: 1 }));
    this.emitEvent('query_changed', { query });
  }

  /**
   * Set results
   */
  setResults(results: SearchResult<T>[], total: number): void {
    this._results.set(results);
    this._total.set(total);
    this._pagination.update((p) => {
      if (p.total === total) {
        return p;
      }
      return { ...p, total };
    });
  }

  /**
   * Set loading state
   */
  setLoading(loading: boolean): void {
    this._loading.set(loading);
    if (loading) {
      this._error.set(null);
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
    this._pagination.update((p) => ({ ...p, page: 1 }));
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
    this._pagination.update((p) => ({ ...p, page: 1 }));
    this.emitEvent('filter_removed', { field });
  }

  /**
   * Clear all filters
   */
  clearFilters(): void {
    this._filters.set(new Map());
    this._pagination.update((p) => ({ ...p, page: 1 }));
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
    this._pagination.update((p) => ({ ...p, page: 1 }));
  }

  /**
   * Set sort configuration
   */
  setSort(sort: SortConfig[]): void {
    this._sort.set(sort);
    this._pagination.update((p) => ({ ...p, page: 1 }));
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
    this.emitEvent('suggestions_received', { count: suggestions.length });
  }

  /**
   * Clear suggestions
   */
  clearSuggestions(): void {
    this._suggestions.set([]);
    this.emitEvent('suggestions_cleared');
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
  markSearchStarted(query: SearchQuery): void {
    this.emitEvent('search_started', { query });
  }

  markSearchCompleted(details: { query: SearchQuery; total: number; took?: number }): void {
    this.emitEvent('search_completed', details);
  }

  markSearchFailed(error: Error, query: SearchQuery): void {
    this.emitEvent('search_failed', { message: error.message, query });
  }

  markSuggestionsRequested(query: string): void {
    this.emitEvent('suggestions_requested', { query });
  }

  markSuggestionsFailed(error: Error, query: string): void {
    this.emitEvent('suggestions_failed', { message: error.message, query });
  }

  markSuggestionSelected(
    suggestion: Suggestion,
    metadata?: { index?: number; origin?: string }
  ): void {
    this.emitEvent('suggestion_selected', { suggestion, ...metadata });
  }

  markResultClicked(result: SearchResult<T>, metadata?: { index?: number; origin?: string }): void {
    this.emitEvent('result_clicked', { result, ...metadata });
  }

  private emitEvent(type: SearchEventType, payload?: any): void {
    const event: SearchEvent = {
      type,
      timestamp: Date.now(),
      payload,
    };
    const limit = this._eventHistoryLimit();
    this._events.update((events) => {
      if (limit === null) {
        return [...events, event];
      }

      if (limit <= 0) {
        return [];
      }

      const next = [...events, event];
      return next.length > limit ? next.slice(-limit) : next;
    });

    const sanitized = this.sanitizeForTelemetry(type, payload);
    this.telemetry?.recordEvent(event, sanitized);
  }

  private sanitizeForTelemetry(
    type: SearchEventType,
    payload?: any
  ): Record<string, any> | undefined {
    if (!payload) {
      return undefined;
    }

    switch (type) {
      case 'search_started':
        return {
          query: payload.query?.query ?? payload.query ?? '',
          filters: payload.query?.filters?.length ?? 0,
        };
      case 'search_completed':
        return {
          query: payload.query?.query ?? payload.query ?? '',
          total: payload.total,
          took: payload.took,
        };
      case 'search_failed':
        return {
          query: payload.query?.query ?? payload.query ?? '',
          message: payload.message,
        };
      case 'suggestions_requested':
        return { query: payload.query };
      case 'suggestions_received':
        return { count: payload.count };
      case 'suggestions_cleared':
        return {};
      case 'suggestions_failed':
        return { query: payload.query, message: payload.message };
      case 'suggestion_selected':
        return {
          suggestion: payload.suggestion?.text,
          id: payload.suggestion?.id,
          index: payload.index,
          origin: payload.origin,
        };
      case 'result_clicked':
        return {
          id: payload.result?.id,
          score: payload.result?.score,
          index: payload.index,
          origin: payload.origin,
        };
      case 'filter_added':
        return {
          field: payload.filter?.field,
          type: payload.filter?.type,
        };
      case 'filter_removed':
        return { field: payload.field };
      case 'page_changed':
        return { page: payload.page, pageSize: payload.pageSize };
      default:
        return undefined;
    }
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

  /**
   * Configure how many events are kept in memory.
   * Pass `null` to keep all events, `0` to disable event history, or omit the value to reset to the default.
   */
  setEventHistoryLimit(limit?: number | null): void {
    if (limit === null) {
      this._eventHistoryLimit.set(null);
      return;
    }

    if (limit === undefined) {
      this._eventHistoryLimit.set(DEFAULT_EVENT_HISTORY_LIMIT);
      this.trimEventHistory(DEFAULT_EVENT_HISTORY_LIMIT);
      return;
    }

    const normalized = Number.isFinite(limit)
      ? Math.max(0, Math.floor(limit))
      : DEFAULT_EVENT_HISTORY_LIMIT;
    this._eventHistoryLimit.set(normalized);
    this.trimEventHistory(normalized);
  }

  private trimEventHistory(limit: number | null): void {
    if (limit === null) {
      return;
    }

    if (limit <= 0) {
      this._events.set([]);
      return;
    }

    const current = this._events();
    if (current.length > limit) {
      this._events.set(current.slice(-limit));
    }
  }
}
