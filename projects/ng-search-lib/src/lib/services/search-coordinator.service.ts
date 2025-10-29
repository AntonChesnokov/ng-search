/**
 * Search Coordinator Service
 * Coordinates search execution with adapters
 * Handles debouncing, cancellation, and error handling
 * Zone-less compatible
 */

import { Injectable, signal, effect, Signal, DestroyRef, inject } from '@angular/core';
import { Subject, Subscription, timer, switchMap, catchError, of, finalize } from 'rxjs';
import { SearchAdapter } from '../types/adapter-types';
import { SearchQuery, SearchResponse, Suggestion } from '../types/search-types';
import { SearchStateService } from './search-state.service';
import { SearchConfigModel } from '../models/search-config.model';

/**
 * Search coordinator service
 * Orchestrates search execution between state and adapter
 */
@Injectable()
export class SearchCoordinatorService<T = any> {
	private readonly destroyRef = inject(DestroyRef);
	private readonly searchState = inject(SearchStateService<T>);

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

	constructor() {
		console.log('[SearchCoordinator] Initialized');
		this.setupAutoSearch();
		// Note: setupAutoSuggest() is called in setAdapter() after adapter is set
		this.setupCleanup();
	}

	/**
	 * Set search adapter
	 */
	setAdapter(adapter: SearchAdapter<T>): void {
		console.log('[SearchCoordinator] setAdapter() called with:', adapter);
		this._adapter = adapter;

		// Setup auto-suggest after adapter is set
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
		console.log('[SearchCoordinator] search() called with query:', query);
		console.log('[SearchCoordinator] adapter:', this._adapter);

		if (!this._adapter) {
			console.error('[SearchCoordinator] Search adapter is not configured');
			return;
		}

		const searchQuery = query ?? this.searchState.searchQuery();
		console.log('[SearchCoordinator] searchQuery:', searchQuery);

		// For demo purposes, allow empty queries to show all results
		// Validate minimum query length only if query is not empty
		if (
			searchQuery.query.trim().length > 0 &&
			searchQuery.query.trim().length < this._config().minQueryLength
		) {
			console.log('[SearchCoordinator] Query too short, skipping search');
			return;
		}

		console.log('[SearchCoordinator] Triggering search via searchTrigger$');
		this.searchTrigger$.next(searchQuery);
	}	/**
	 * Request suggestions
	 */
	suggest(query: string): void {
		console.log('[SearchCoordinator] suggest() called with query:', query);
		console.log('[SearchCoordinator] adapter.suggest exists:', !!this._adapter?.suggest);

		if (!this._adapter?.suggest) {
			console.log('[SearchCoordinator] No suggest method on adapter');
			return;
		}

		if (query.trim().length < this._config().minQueryLength) {
			console.log('[SearchCoordinator] Query too short for suggestions, clearing');
			this.searchState.clearSuggestions();
			return;
		}

		console.log('[SearchCoordinator] Triggering suggestTrigger$');
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
		console.log('[SearchCoordinator] setupAutoSearch()');

		// Subscribe to search trigger with debouncing
		this.searchSubscription = this.searchTrigger$
			.pipe(
				switchMap((query) => {
					console.log('[SearchCoordinator] searchTrigger$ fired with query:', query);
					this.searchState.setLoading(true);

					return timer(this._config().debounceTime).pipe(
						switchMap(() => {
							console.log('[SearchCoordinator] Executing adapter.search()');
							if (!this._adapter) {
								return of(null);
							}
							return this._adapter.search(query).pipe(
								catchError((error) => {
									this.searchState.setError(error);
									return of(null);
								}),
								finalize(() => {
									console.log('[SearchCoordinator] Search completed, setting loading to false');
									this.searchState.setLoading(false);
								})
							);
						})
					);
				})
			)
			.subscribe((response) => {
				console.log('[SearchCoordinator] Search response received:', response);
				if (response) {
					this.handleSearchResponse(response);
				}
			});

		// Setup effect to trigger search on state changes
		effect(() => {
			const query = this.searchState.searchQuery();
			console.log('[SearchCoordinator] effect triggered with query:', query);

			// Only auto-search if enabled in config
			if (!this._config().autoSearch) {
				console.log('[SearchCoordinator] autoSearch is disabled, skipping automatic search');
				return;
			}

			// Trigger search if we have a query, filters, or if adapter supports empty searches
			// For demo purposes, always trigger search to show initial results
			if (query.query.trim().length > 0 || (query.filters && query.filters.length > 0) || true) {
				console.log('[SearchCoordinator] Calling search() from effect');
				this.search(query);
			}
		});
	}

	/**
	 * Setup automatic suggestions on query changes
	 */
	private setupAutoSuggest(): void {
		console.log('[SearchCoordinator] setupAutoSuggest()');
		console.log('[SearchCoordinator] adapter.suggest:', this._adapter?.suggest);

		if (!this._adapter?.suggest) {
			console.log('[SearchCoordinator] No suggest method, skipping auto-suggest setup');
			return;
		}

		this.suggestSubscription = this.suggestTrigger$
			.pipe(
				switchMap((query) => {
					console.log('[SearchCoordinator] suggestTrigger$ fired with query:', query);
					return timer(this._config().debounceTime).pipe(
						switchMap(() => {
							console.log('[SearchCoordinator] Executing adapter.suggest()');
							if (!this._adapter?.suggest) {
								return of([]);
							}
							return this._adapter.suggest(query, {
								maxSuggestions: 10,
								fuzzy: true,
							}).pipe(
								catchError((error) => {
									console.error('[SearchCoordinator] Suggestion error:', error);
									return of([]);
								})
							);
						})
					);
				})
			)
			.subscribe((suggestions) => {
				console.log('[SearchCoordinator] Suggestions received:', suggestions);
				this.searchState.setSuggestions(suggestions);
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
}
