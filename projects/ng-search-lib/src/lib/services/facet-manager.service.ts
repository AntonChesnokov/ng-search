/**
 * Facet Manager Service
 * Manages facet state for a search instance
 * Zone-less compatible, signal-based
 */

import { Injectable, signal, computed, Signal, inject } from '@angular/core';
import {
  FacetConfig,
  FacetState,
  FacetValue,
  FacetOption,
  FacetChangeEvent,
} from '../types/facet-types';
import { FilterConfig, AggregationResult } from '../types/search-types';
import { DEFAULT_SEARCH_LOGGER, NG_SEARCH_LOGGER } from './search-logger';

/**
 * Facet Manager Service
 * Handles facet state management for a single search instance
 */
@Injectable()
export class FacetManagerService {
  private readonly logger = inject(NG_SEARCH_LOGGER, { optional: true }) ?? DEFAULT_SEARCH_LOGGER;
  // Internal state
  private readonly _facets = signal<Map<string, FacetState>>(new Map());
  private readonly _changeEvents = signal<FacetChangeEvent | null>(null);

  // Public signals
  readonly facets = computed(() => Array.from(this._facets().values()));
  readonly facetsMap: Signal<Map<string, FacetState>> = this._facets.asReadonly();
  readonly lastChange: Signal<FacetChangeEvent | null> = this._changeEvents.asReadonly();

  // Applied filters computed from facet selections
  readonly appliedFilters = computed(() => {
    const filters: FilterConfig[] = [];
    const facetsMap = this._facets();

    facetsMap.forEach((facetState) => {
      if (facetState.selectedValues.size > 0) {
        const filter = this.facetSelectionToFilter(facetState);
        if (filter) {
          filters.push(filter);
        }
      }
    });

    return filters;
  });

  /**
   * Add or update facet configuration
   */
  addFacet(config: FacetConfig): void {
    const currentMap = new Map(this._facets());
    const existingState = currentMap.get(config.id);

    const newState: FacetState = {
      config,
      values: existingState?.values ?? this.getInitialValues(config),
      selectedValues: existingState?.selectedValues ?? new Set(),
      collapsed: config.collapsed ?? false,
      visibleCount: config.maxValues ?? 10,
      loading: false,
    };

    currentMap.set(config.id, newState);
    this._facets.set(currentMap);
  }

  /**
   * Add multiple facets
   */
  addFacets(configs: FacetConfig[]): void {
    configs.forEach((config) => this.addFacet(config));
  }

  /**
   * Remove facet
   */
  removeFacet(facetId: string): void {
    const currentMap = new Map(this._facets());
    currentMap.delete(facetId);
    this._facets.set(currentMap);
  }

  /**
   * Update facet selection
   */
  updateFacetSelection(facetId: string, values: Set<string | number>): void {
    const currentMap = new Map(this._facets());
    const facetState = currentMap.get(facetId);

    if (!facetState) {
      this.logger.warn(`Facet "${facetId}" not found`);
      return;
    }

    const previousValues = new Set(facetState.selectedValues);
    const updatedState: FacetState = {
      ...facetState,
      selectedValues: new Set(values),
      values: facetState.values.map((v) => ({
        ...v,
        selected: values.has(v.key),
      })),
    };

    currentMap.set(facetId, updatedState);
    this._facets.set(currentMap);

    // Emit change event
    const filter = this.facetSelectionToFilter(updatedState);
    const changeEvent: FacetChangeEvent = {
      facetId,
      selectedValues: new Set(values),
      previousValues,
      config: facetState.config,
      filter,
    };

    this._changeEvents.set(changeEvent);
  }

  /**
   * Clear facet selection
   */
  clearFacet(facetId: string): void {
    this.updateFacetSelection(facetId, new Set());
  }

  /**
   * Clear all facets
   */
  clearAllFacets(): void {
    const currentMap = new Map(this._facets());
    currentMap.forEach((_, facetId) => {
      this.clearFacet(facetId);
    });
  }

  /**
   * Toggle facet collapsed state
   */
  toggleCollapsed(facetId: string): void {
    const currentMap = new Map(this._facets());
    const facetState = currentMap.get(facetId);

    if (!facetState) {
      return;
    }

    const updatedState: FacetState = {
      ...facetState,
      collapsed: !facetState.collapsed,
    };

    currentMap.set(facetId, updatedState);
    this._facets.set(currentMap);
  }

  /**
   * Update facet values from aggregations
   */
  updateFacetValues(facetId: string, aggregation: AggregationResult): void {
    const currentMap = new Map(this._facets());
    const facetState = currentMap.get(facetId);

    if (!facetState) {
      return;
    }

    const values = this.aggregationToFacetValues(
      aggregation,
      facetState.config,
      facetState.selectedValues
    );
    const updatedState: FacetState = {
      ...facetState,
      values,
    };

    currentMap.set(facetId, updatedState);
    this._facets.set(currentMap);
  }

  /**
   * Update all facet values from aggregations map
   */
  updateAllFacetValues(aggregations: Record<string, AggregationResult>): void {
    Object.keys(aggregations).forEach((field) => {
      const facet = this.findFacetByField(field);
      if (facet && aggregations[field]) {
        this.updateFacetValues(facet.config.id, aggregations[field]);
      }
    });
  }

  /**
   * Get facet state by ID
   */
  getFacet(facetId: string): FacetState | undefined {
    return this._facets().get(facetId);
  }

  /**
   * Find facet by field name
   */
  findFacetByField(field: string): FacetState | undefined {
    const facetsMap = this._facets();
    for (const facetState of facetsMap.values()) {
      if (facetState.config.field === field) {
        return facetState;
      }
    }
    return undefined;
  }

  /**
   * Check if any facets have selections
   */
  hasActiveSelections(): boolean {
    const facetsMap = this._facets();
    for (const facetState of facetsMap.values()) {
      if (facetState.selectedValues.size > 0) {
        return true;
      }
    }
    return false;
  }

  /**
   * Get count of active selections across all facets
   */
  getActiveSelectionsCount(): number {
    let count = 0;
    const facetsMap = this._facets();
    facetsMap.forEach((facetState) => {
      count += facetState.selectedValues.size;
    });
    return count;
  }

  /**
   * Reset all facets to initial state
   */
  reset(): void {
    this._facets.set(new Map());
    this._changeEvents.set(null);
  }

  // Private helper methods

  /**
   * Get initial values for a facet from config
   */
  private getInitialValues(config: FacetConfig): FacetValue[] {
    if (config.options) {
      return config.options.map((opt) => ({
        key: opt.value,
        label: opt.label,
        count: opt.count ?? 0,
        selected: false,
        disabled: opt.disabled,
      }));
    }
    return [];
  }

  /**
   * Convert aggregation result to facet values
   */
  private aggregationToFacetValues(
    aggregation: AggregationResult,
    config: FacetConfig,
    selectedValues: Set<string | number>
  ): FacetValue[] {
    if (!aggregation.buckets) {
      return [];
    }

    let values = aggregation.buckets.map((bucket) => ({
      key: bucket.key,
      label: bucket.key.toString(),
      count: bucket.doc_count,
      selected: selectedValues.has(bucket.key),
      disabled: bucket.doc_count === 0,
    }));

    // Apply sorting
    if (config.sort === 'count') {
      values = values.sort((a, b) => b.count - a.count);
    } else if (config.sort === 'key') {
      values = values.sort((a, b) => a.label.localeCompare(b.label));
    }

    // Apply max values limit
    if (config.maxValues && values.length > config.maxValues) {
      values = values.slice(0, config.maxValues);
    }

    return values.map((value) => ({
      ...value,
      selected: selectedValues.has(value.key),
    }));
  }

  /**
   * Convert facet selection to filter configuration
   */
  private facetSelectionToFilter(facetState: FacetState): FilterConfig | null {
    if (facetState.selectedValues.size === 0) {
      return null;
    }

    const config = facetState.config;
    const values = Array.from(facetState.selectedValues);

    // Handle different facet types
    switch (config.type) {
      case 'text':
      case 'text-typeahead':
      case 'checkbox':
        if (values.length === 1) {
          return {
            field: config.field,
            type: 'term',
            value: values[0],
          };
        } else {
          return {
            field: config.field,
            type: 'terms',
            value: values,
            operator: (config as any).operator ?? 'OR',
          };
        }

      case 'number':
        return {
          field: config.field,
          type: 'term',
          value: values[0],
        };

      case 'number-range':
      case 'range':
      case 'slider':
        // Assume values is [min, max]
        return {
          field: config.field,
          type: 'range',
          value: {
            gte: values[0],
            lte: values[1] ?? values[0],
          },
        };

      case 'radio':
      case 'toggle':
        return {
          field: config.field,
          type: 'term',
          value: values[0],
        };

      default:
        // Custom type - use terms
        return {
          field: config.field,
          type: values.length === 1 ? 'term' : 'terms',
          value: values.length === 1 ? values[0] : values,
        };
    }
  }
}
