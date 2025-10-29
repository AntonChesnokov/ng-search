/**
 * Facet types and interfaces for the plugin system
 */

import { Type } from '@angular/core';
import { Signal } from '@angular/core';
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
}

/**
 * Facet types
 */
export type FacetType =
  | 'checkbox'
  | 'radio'
  | 'toggle'
  | 'range'
  | 'slider'
  | 'date-range'
  | 'hierarchical'
  | 'custom';

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
}

/**
 * Base interface for facet plugin components
 * All custom facet components must implement this interface
 */
export interface FacetPlugin {
  /** Facet configuration */
  config: Signal<FacetConfig>;
  /** Available facet values from aggregation */
  values: Signal<FacetValue[]>;
  /** Currently selected values */
  selectedValues: Signal<Set<string | number>>;
  /** Callback when selection changes */
  onSelectionChange: (values: Set<string | number>) => void;
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
