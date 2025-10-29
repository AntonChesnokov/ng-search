/**
 * Component-specific types and interfaces
 */

import { TemplateRef, Type } from '@angular/core';
import { SearchResult, Suggestion } from './search-types';

/**
 * Search box configuration
 */
export interface SearchBoxConfig {
  /** Placeholder text */
  placeholder?: string;
  /** Debounce time in milliseconds */
  debounceTime?: number;
  /** Minimum query length */
  minQueryLength?: number;
  /** Show clear button */
  showClearButton?: boolean;
  /** Show search button */
  showSearchButton?: boolean;
  /** ARIA label */
  ariaLabel?: string;
  /** Auto-focus on mount */
  autoFocus?: boolean;
  /** Disabled state */
  disabled?: boolean;
}

/**
 * Suggestions component configuration
 */
export interface SuggestionsConfig {
  /** Maximum suggestions to display */
  maxSuggestions?: number;
  /** Show on focus (empty query) */
  showOnFocus?: boolean;
  /** Highlight matching text */
  highlightMatches?: boolean;
  /** Custom template for suggestion item */
  itemTemplate?: TemplateRef<SuggestionContext>;
  /** Debounce time for suggestions */
  debounceTime?: number;
  /** Minimum query length */
  minQueryLength?: number;
  /** Position relative to search box */
  position?: 'bottom' | 'top';
  /** Enable keyboard navigation */
  keyboardNavigation?: boolean;
}

/**
 * Context passed to custom suggestion template
 */
export interface SuggestionContext {
  /** The suggestion data */
  $implicit: Suggestion;
  /** Index in the list */
  index: number;
  /** Whether this suggestion is highlighted */
  highlighted: boolean;
  /** Original query */
  query: string;
}

/**
 * Results component configuration
 */
export interface ResultsConfig<T = any> {
  /** Custom template for result item */
  itemTemplate?: TemplateRef<ResultContext<T>>;
  /** Custom component for result item */
  itemComponent?: Type<ResultRenderer<T>>;
  /** Enable virtual scrolling */
  virtualScroll?: boolean;
  /** Virtual scroll item size (required if virtualScroll is true) */
  itemSize?: number;
  /** Enable pagination */
  pagination?: boolean;
  /** Items per page */
  pageSize?: number;
  /** Show loading indicator */
  showLoading?: boolean;
  /** Show empty state */
  showEmpty?: boolean;
  /** Custom empty state template */
  emptyTemplate?: TemplateRef<void>;
  /** Custom loading template */
  loadingTemplate?: TemplateRef<void>;
}

/**
 * Context passed to custom result template
 */
export interface ResultContext<T = any> {
  /** The result data */
  $implicit: SearchResult<T>;
  /** Index in the list */
  index: number;
  /** Total number of results */
  total: number;
  /** Original query */
  query: string;
}

/**
 * Interface for custom result renderer components
 */
export interface ResultRenderer<T = any> {
  /** Result data */
  result: SearchResult<T>;
  /** Index in list */
  index?: number;
  /** Click handler */
  onClick?: () => void;
}

/**
 * Facet container configuration
 */
export interface FacetContainerConfig {
  /** Layout orientation */
  layout?: 'vertical' | 'horizontal';
  /** Whether facets are collapsible */
  collapsible?: boolean;
  /** Show clear all button */
  showClearAll?: boolean;
  /** Position */
  position?: 'left' | 'right' | 'top';
  /** Sticky behavior */
  sticky?: boolean;
}

/**
 * Pagination configuration
 */
export interface PaginationComponentConfig {
  /** Show first/last buttons */
  showFirstLast?: boolean;
  /** Show previous/next buttons */
  showPrevNext?: boolean;
  /** Maximum page buttons to show */
  maxPages?: number;
  /** Page size options */
  pageSizeOptions?: number[];
  /** Show page size selector */
  showPageSize?: boolean;
  /** Show total results */
  showTotal?: boolean;
}

/**
 * Keyboard navigation keys
 */
export interface KeyboardNavigationConfig {
  /** Key for moving up */
  up?: string;
  /** Key for moving down */
  down?: string;
  /** Key for selection */
  select?: string;
  /** Key for closing/escape */
  close?: string;
  /** Enable Ctrl+K shortcut */
  enableShortcut?: boolean;
}

/**
 * Highlight configuration
 */
export interface HighlightConfig {
  /** CSS class for highlighted text */
  highlightClass?: string;
  /** Pre-tag for highlighting */
  preTag?: string;
  /** Post-tag for highlighting */
  postTag?: string;
}

/**
 * Loading state
 */
export interface LoadingState {
  /** Whether currently loading */
  loading: boolean;
  /** Loading message */
  message?: string;
  /** Progress percentage (0-100) */
  progress?: number;
}

/**
 * Error state
 */
export interface ErrorState {
  /** Error object */
  error: Error | null;
  /** Error message */
  message?: string;
  /** Whether error is recoverable */
  recoverable?: boolean;
  /** Retry function */
  retry?: () => void;
}

/**
 * Empty state
 */
export interface EmptyState {
  /** Empty state message */
  message: string;
  /** Optional icon */
  icon?: string;
  /** Optional action */
  action?: {
    label: string;
    handler: () => void;
  };
}
