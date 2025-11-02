/**
 * Facet types and interfaces for the plugin system
 */

import { Type, Signal } from '@angular/core';
import { Observable } from 'rxjs';
import { AggregationResult, FilterConfig } from './search-types';

/**
 * Base facet configuration
 */
export interface FacetConfig {
  /** Unique identifier for the facet */
  id: string;
  /** Field name in the search backend */
  field: string;
  /** Display label */
  label: string;
  /** Facet type */
  type: FacetType;
  /** Whether facet is collapsible */
  collapsible?: boolean;
  /** Whether facet starts collapsed */
  collapsed?: boolean;
  /** Sort order for facet values */
  sort?: 'count' | 'key' | 'custom';
  /** Maximum number of values to display */
  maxValues?: number;
  /** Whether to show "Show more" button */
  showMore?: boolean;
  /** Custom configuration specific to facet type */
  config?: Record<string, any>;
  /** Static options (alternative to aggregations) */
  options?: FacetOption[];
  /** Whether to use aggregations from search results */
  useAggregations?: boolean;
}

/**
 * Facet types
 */
export type FacetType =
  | 'text'
  | 'text-typeahead'
  | 'number'
  | 'number-range'
  | 'checkbox'
  | 'radio'
  | 'toggle'
  | 'range'
  | 'slider'
  | 'date-range'
  | 'hierarchical'
  | 'custom'
  | (string & Record<never, never>);

/**
 * Facet option
 */
export interface FacetOption {
  /** Option value */
  value: string | number;
  /** Display label */
  label: string;
  /** Result count (from aggregations) */
  count?: number;
  /** Whether option is disabled */
  disabled?: boolean;
  /** Additional metadata */
  metadata?: Record<string, any>;
}

/**
 * Text facet configuration
 */
export interface TextFacetConfig extends FacetConfig {
  type: 'text';
  /** Whether to allow multiple selections */
  multiSelect?: boolean;
  /** Whether to show search box for filtering options */
  searchable?: boolean;
  /** Operator for combining selected values (only for multiSelect) */
  operator?: 'OR' | 'AND';
}

/**
 * Text typeahead facet configuration
 */
export interface TextTypeaheadFacetConfig extends FacetConfig {
  type: 'text-typeahead';
  /** Function to provide options based on query */
  optionsProvider?: (query: string) => Observable<FacetOption[]>;
  /** Minimum characters before searching */
  minQueryLength?: number;
  /** Debounce time in ms */
  debounceTime?: number;
  /** Whether to allow multiple selections */
  multiSelect?: boolean;
}

/**
 * Number facet configuration
 */
export interface NumberFacetConfig extends FacetConfig {
  type: 'number';
  /** Minimum value */
  min?: number;
  /** Maximum value */
  max?: number;
  /** Step size */
  step?: number;
  /** Placeholder text */
  placeholder?: string;
}

/**
 * Number range facet configuration
 */
export interface NumberRangeFacetConfig extends FacetConfig {
  type: 'number-range';
  /** Minimum value */
  min?: number;
  /** Maximum value */
  max?: number;
  /** Step size */
  step?: number;
  /** Whether to show slider UI */
  showSlider?: boolean;
  /** Value formatter */
  formatter?: (value: number) => string;
}

/**
 * Checkbox facet configuration
 */
export interface CheckboxFacetConfig extends FacetConfig {
  type: 'checkbox';
  /** Whether to show search box for filtering options */
  searchable?: boolean;
  /** Operator for combining selected values */
  operator?: 'OR' | 'AND';
}

/**
 * Range facet configuration
 */
export interface RangeFacetConfig extends FacetConfig {
  type: 'range' | 'slider';
  /** Minimum value */
  min?: number;
  /** Maximum value */
  max?: number;
  /** Step size */
  step?: number;
  /** Value formatter */
  formatter?: (value: number) => string;
}

/**
 * Date range facet configuration
 */
export interface DateRangeFacetConfig extends FacetConfig {
  type: 'date-range';
  /** Date format */
  format?: string;
  /** Predefined ranges */
  ranges?: DateRange[];
}

/**
 * Predefined date range
 */
export interface DateRange {
  /** Range label */
  label: string;
  /** Start date */
  from: Date | string;
  /** End date */
  to: Date | string;
}

/**
 * Hierarchical facet configuration
 */
export interface HierarchicalFacetConfig extends FacetConfig {
  type: 'hierarchical';
  /** Path separator */
  separator?: string;
  /** Maximum depth to display */
  maxDepth?: number;
}

/**
 * Facet value
 */
export interface FacetValue {
  /** Value key */
  key: string | number;
  /** Display label */
  label: string;
  /** Number of results for this value */
  count: number;
  /** Whether this value is selected */
  selected: boolean;
  /** Whether this value is disabled */
  disabled?: boolean;
  /** Nested values (for hierarchical facets) */
  children?: FacetValue[];
}

/**
 * Facet state
 */
export interface FacetState {
  /** Facet configuration */
  config: FacetConfig;
  /** Available values */
  values: FacetValue[];
  /** Selected values */
  selectedValues: Set<string | number>;
  /** Whether facet is collapsed */
  collapsed: boolean;
  /** Number of visible values */
  visibleCount: number;
  /** Whether facet is loading */
  loading?: boolean;
}

/**
 * Facet change event
 */
export interface FacetChangeEvent {
  /** Facet ID */
  facetId: string;
  /** Selected values */
  selectedValues: Set<string | number>;
  /** Previous selected values */
  previousValues?: Set<string | number>;
  /** Facet configuration */
  config: FacetConfig;
  /** Filter configuration generated from selection */
  filter: FilterConfig | null;
}

/**
 * Base interface for facet plugin components
 * All custom facet components must implement this interface
 */
export interface FacetPlugin {
  /** Facet configuration */
  config: Signal<FacetConfig>;
  /** Available facet values/options */
  values: Signal<FacetValue[] | FacetOption[]>;
  /** Currently selected values */
  selectedValues: Signal<Set<string | number>>;
  /** Callback when selection changes */
  onSelectionChange: (values: Set<string | number>) => void;
  /** Optional: callback when facet is collapsed/expanded */
  onToggleCollapse?: () => void;
}

/**
 * Facet plugin registration
 */
export interface FacetPluginRegistration {
  /** Facet type identifier */
  type: FacetType | string;
  /** Component class */
  component: Type<FacetPlugin>;
  /** Optional icon for UI */
  icon?: string;
  /** Optional description */
  description?: string;
}

/**
 * Facet registry interface
 */
export interface IFacetRegistry {
  /** Register a facet plugin */
  register(registration: FacetPluginRegistration): void;
  /** Unregister a facet plugin */
  unregister(type: string): void;
  /** Get facet plugin by type */
  get(type: string): Type<FacetPlugin> | undefined;
  /** Check if facet type is registered */
  has(type: string): boolean;
  /** Get all registered types */
  getTypes(): string[];
}

/**
 * Transform aggregation result to facet values
 */
export type AggregationToFacetTransformer = (
  aggregation: AggregationResult,
  config: FacetConfig
) => FacetValue[];

/**
 * Transform facet selection to filter configuration
 */
export type FacetToFilterTransformer = (
  selectedValues: Set<string | number>,
  config: FacetConfig
) => FilterConfig | null;
