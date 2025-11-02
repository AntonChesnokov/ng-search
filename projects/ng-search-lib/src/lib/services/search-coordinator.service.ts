/**
 * Search Coordinator Service
 * Coordinates search execution with adapters
 * Handles debouncing, cancellation, and error handling
 * Zone-less compatible
 */

import { Injectable, signal, effect, Signal, DestroyRef, inject } from '@angular/core';
import { Subject, Subscription, timer, switchMap, catchError, of, finalize, map } from 'rxjs';
import { SearchAdapter } from '../types/adapter-types';
import { SearchQuery, SearchResponse } from '../types/search-types';
import { SearchStateService } from './search-state.service';
import { SearchConfigModel } from '../models/search-config.model';
import { SearchTelemetryService } from './search-telemetry.service';
import { DEFAULT_SEARCH_LOGGER, NG_SEARCH_LOGGER } from './search-logger';

/**
 * Search coordinator service
 * Orchestrates search execution between state and adapter
 */
@Injectable()
export class SearchCoordinatorService<T = any> {
  private readonly destroyRef = inject(DestroyRef);
  private readonly searchState = inject(SearchStateService<T>);
  private readonly telemetry = inject(SearchTelemetryService, { optional: true });
  private readonly logger = inject(NG_SEARCH_LOGGER, { optional: true }) ?? DEFAULT_SEARCH_LOGGER;

  // Search trigger subjects
  private readonly searchTrigger$ = new Subject<SearchQuery>();
  private readonly suggestTrigger$ = new Subject<string>();

  // Subscriptions
  private searchSubscription?: Subscription;
  private suggestSubscription?: Subscription;

  // Configuration
  private readonly _config = signal<SearchConfigModel>(new SearchConfigModel());
  readonly config: Signal<SearchConfigModel> = this._config.asReadonly();

  // Adapter
  private _adapter?: SearchAdapter<T>;

  private currentSearchMeta: { query: SearchQuery; startedAt: number } | null = null;
  private currentSuggestMeta: { query: string; startedAt: number } | null = null;
  private lastAutoSearchSignature: string | null = null;

  constructor() {
    this.setupAutoSearch();
    // Note: setupAutoSuggest() is called in setAdapter() after adapter is set
    this.setupCleanup();
    this.setupConfigSync();
  }

  /**
   * Set search adapter
   */
  setAdapter(adapter: SearchAdapter<T>): void {
    this._adapter = adapter;

    // Setup auto-suggest after adapter is set
    this.suggestSubscription?.unsubscribe();
    this.setupAutoSuggest();
  }

  /**
   * Set configuration
   */
  setConfig(config: Partial<SearchConfigModel>): void {
    this._config.update((current) => current.merge(config));
  }

  /**
   * Execute search manually
   */
  search(query?: SearchQuery): void {
    if (!this._adapter) {
      this.logger.error('[SearchCoordinator] Search adapter is not configured');
      return;
    }

    const searchQuery = query ?? this.searchState.searchQuery();

    // Validate minimum query length only if query is not empty
    if (
      searchQuery.query.trim().length > 0 &&
      searchQuery.query.trim().length < this._config().minQueryLength
    ) {
      return;
    }

    this.searchTrigger$.next(searchQuery);
  }

  /**
   * Request suggestions
   */
  suggest(query: string): void {
    if (!this._adapter?.suggest) {
      return;
    }

    if (query.trim().length < this._config().minQueryLength) {
      this.searchState.clearSuggestions();
      return;
    }

    this.suggestTrigger$.next(query);
  }

  /**
   * Cancel ongoing search
   */
  cancel(): void {
    this.searchSubscription?.unsubscribe();
    this.searchState.setLoading(false);
  }

  /**
   * Setup automatic search on query changes
   */
  private setupAutoSearch(): void {
    this.searchSubscription = this.searchTrigger$
      .pipe(
        switchMap((query) => {
          this.currentSearchMeta = { query, startedAt: Date.now() };
          this.searchState.markSearchStarted(query);
          this.searchState.setLoading(true);

          return timer(this._config().debounceTime).pipe(
            switchMap(() => {
              if (!this._adapter) {
                return of(null);
              }
              const startedAt = this.currentSearchMeta?.startedAt ?? Date.now();
              return this._adapter.search(query).pipe(
                map((response) => ({ response, query, startedAt })),
                catchError((error) => {
                  this.searchState.setError(error);
                  this.searchState.markSearchFailed(error, query);
                  this.telemetry?.recordError({
                    error,
                    source: 'search',
                    context: {
                      query: query.query,
                      filters: query.filters?.length ?? 0,
                    },
                  });
                  return of({ response: null, query, startedAt });
                }),
                finalize(() => {
                  this.searchState.setLoading(false);
                  this.currentSearchMeta = null;
                })
              );
            })
          );
        })
      )
      .subscribe((payload) => {
        if (!payload?.response) {
          return;
        }

        const { response, query, startedAt } = payload;
        this.handleSearchResponse(response);

        const duration = response.took ?? Date.now() - startedAt;
        this.searchState.markSearchCompleted({ query, total: response.total, took: duration });

        if (duration !== undefined) {
          this.telemetry?.recordTiming({
            name: 'search',
            duration,
            metadata: {
              query: query.query,
              total: response.total,
              filters: query.filters?.length ?? 0,
            },
          });
        }
      });

    effect(() => {
      const query = this.searchState.searchQuery();

      if (!this._config().autoSearch) {
        this.lastAutoSearchSignature = null;
        return;
      }

      const signature = this.serializeQuery(query);
      const hasQuery = query.query.trim().length >= this._config().minQueryLength;
      const hasFilters = (query.filters?.length ?? 0) > 0;

      if (!hasQuery && !hasFilters) {
        this.lastAutoSearchSignature = null;
        return;
      }

      if (signature === this.lastAutoSearchSignature) {
        return;
      }

      this.lastAutoSearchSignature = signature;
      this.search(query);
    });
  }

  /**
   * Setup automatic suggestions on query changes
   */
  private setupAutoSuggest(): void {
    if (!this._adapter?.suggest) {
      return;
    }

    this.suggestSubscription = this.suggestTrigger$
      .pipe(
        switchMap((query) => {
          this.currentSuggestMeta = { query, startedAt: Date.now() };
          this.searchState.markSuggestionsRequested(query);
          this.searchState.setLoadingSuggestions(true);

          return timer(this._config().debounceTime).pipe(
            switchMap(() => {
              if (!this._adapter?.suggest) {
                this.searchState.setLoadingSuggestions(false);
                this.currentSuggestMeta = null;
                return of({ suggestions: [], query, startedAt: Date.now() });
              }

              const startedAt = this.currentSuggestMeta?.startedAt ?? Date.now();
              return this._adapter
                .suggest(query, {
                  maxSuggestions: 10,
                  fuzzy: true,
                })
                .pipe(
                  map((suggestions) => ({ suggestions, query, startedAt })),
                  catchError((error) => {
                    this.logger.error('[SearchCoordinator] Suggestion error:', error);
                    this.searchState.markSuggestionsFailed(error, query);
                    this.telemetry?.recordError({
                      error,
                      source: 'suggestions',
                      context: { query },
                    });
                    return of({ suggestions: [], query, startedAt });
                  }),
                  finalize(() => {
                    this.searchState.setLoadingSuggestions(false);
                    this.currentSuggestMeta = null;
                  })
                );
            })
          );
        })
      )
      .subscribe((payload) => {
        if (!payload) {
          return;
        }

        const { suggestions, query, startedAt } = payload;
        this.searchState.setSuggestions(suggestions);

        if (suggestions.length > 0) {
          const duration = Date.now() - startedAt;
          this.telemetry?.recordTiming({
            name: 'suggestions',
            duration,
            metadata: {
              query,
              count: suggestions.length,
            },
          });
        }
      });
  }

  /**
   * Handle search response
   */
  private handleSearchResponse(response: SearchResponse<T>): void {
    this.searchState.setResults(response.results, response.total);

    if (response.aggregations) {
      this.searchState.setAggregations(response.aggregations);
    }

    if (response.suggestions && response.suggestions.length > 0) {
      this.searchState.setSuggestions(response.suggestions);
    }
  }

  /**
   * Setup cleanup on destroy
   */
  private setupCleanup(): void {
    this.destroyRef.onDestroy(() => {
      this.searchSubscription?.unsubscribe();
      this.suggestSubscription?.unsubscribe();
      this.searchTrigger$.complete();
      this.suggestTrigger$.complete();

      // Call adapter cleanup if available
      this._adapter?.destroy?.();
    });
  }

  private serializeQuery(query: SearchQuery): string {
    const normalizedFilters = query.filters?.map((filter) => ({
      field: filter.field,
      operator: filter.operator,
      type: filter.type,
      value: filter.value,
    }));

    return JSON.stringify({
      query: query.query,
      from: query.from,
      size: query.size,
      sort: query.sort,
      filters: normalizedFilters,
    });
  }

  private setupConfigSync(): void {
    effect(() => {
      const config = this._config();
      if (config.eventHistoryLimit !== undefined) {
        this.searchState.setEventHistoryLimit(config.eventHistoryLimit);
      } else {
        this.searchState.setEventHistoryLimit();
      }
    });
  }
}
