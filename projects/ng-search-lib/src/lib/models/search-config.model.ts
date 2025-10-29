/**
 * Search configuration model
 * Provides default values and validation
 */

import { SearchConfig, SortConfig } from '../types/search-types';

export class SearchConfigModel implements SearchConfig {
  debounceTime: number;
  minQueryLength: number;
  pageSize: number;
  autoSearch: boolean;
  enableSuggestions: boolean;
  enableAggregations: boolean;
  searchFields?: string[];
  defaultSort?: SortConfig[];
  enableHighlighting: boolean;
  highlightFields?: string[];

  constructor(config?: Partial<SearchConfig>) {
    // Set defaults
    this.debounceTime = config?.debounceTime ?? 300;
    this.minQueryLength = config?.minQueryLength ?? 1;
    this.pageSize = config?.pageSize ?? 10;
    this.autoSearch = config?.autoSearch ?? true; // Default to true for backward compatibility
    this.enableSuggestions = config?.enableSuggestions ?? true;
    this.enableAggregations = config?.enableAggregations ?? true;
    this.enableHighlighting = config?.enableHighlighting ?? true;
    this.searchFields = config?.searchFields;
    this.defaultSort = config?.defaultSort;
    this.highlightFields = config?.highlightFields;

    this.validate();
  }

  /**
   * Validate configuration
   */
  private validate(): void {
    if (this.debounceTime < 0) {
      throw new Error('debounceTime must be non-negative');
    }
    if (this.minQueryLength < 0) {
      throw new Error('minQueryLength must be non-negative');
    }
    if (this.pageSize < 1) {
      throw new Error('pageSize must be at least 1');
    }
  }

  /**
   * Create a copy with overrides
   */
  merge(overrides: Partial<SearchConfig>): SearchConfigModel {
    return new SearchConfigModel({
      ...this,
      ...overrides,
    });
  }

  /**
   * Convert to plain object
   */
  toJSON(): SearchConfig {
    return {
      debounceTime: this.debounceTime,
      minQueryLength: this.minQueryLength,
      pageSize: this.pageSize,
      autoSearch: this.autoSearch,
      enableSuggestions: this.enableSuggestions,
      enableAggregations: this.enableAggregations,
      searchFields: this.searchFields,
      defaultSort: this.defaultSort,
      enableHighlighting: this.enableHighlighting,
      highlightFields: this.highlightFields,
    };
  }
}
