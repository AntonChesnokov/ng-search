/**
 * Core search types and interfaces for the @ng-search/core library
 */

/**
 * Generic search result item
 * Can be extended by consumers for custom result types
 */
export interface SearchResult<T = any> {
  /** Unique identifier for the result */
  id: string;
  /** The actual data of the result */
  data: T;
  /** Optional relevance score */
  score?: number;
  /** Optional highlighting information */
  highlights?: Record<string, string[]>;
  /** Optional metadata */
  metadata?: Record<string, any>;
}

/**
 * Search query parameters
 */
export interface SearchQuery {
  /** The search query string */
  query: string;
  /** Number of results to return */
  size?: number;
  /** Offset for pagination */
  from?: number;
  /** Fields to search in */
  fields?: string[];
  /** Sort configuration */
  sort?: SortConfig[];
  /** Filter configuration */
  filters?: FilterConfig[];
}

/**
 * Sort configuration
 */
export interface SortConfig {
  /** Field to sort by */
  field: string;
  /** Sort order */
  order: 'asc' | 'desc';
}

/**
 * Filter configuration
 */
export interface FilterConfig {
  /** Field to filter */
  field: string;
  /** Filter type */
  type: 'term' | 'terms' | 'range' | 'match' | 'exists' | 'custom';
  /** Filter value(s) */
  value: any;
  /** Optional operator for combining filters */
  operator?: 'AND' | 'OR' | 'NOT';
}

/**
 * Search response from backend
 */
export interface SearchResponse<T = any> {
  /** Array of search results */
  results: SearchResult<T>[];
  /** Total number of results */
  total: number;
  /** Time taken for search in milliseconds */
  took?: number;
  /** Aggregations/facets data */
  aggregations?: Record<string, AggregationResult>;
  /** Suggestions for query correction */
  suggestions?: Suggestion[];
}

/**
 * Aggregation result from backend
 */
export interface AggregationResult {
  /** Type of aggregation */
  type: 'terms' | 'range' | 'histogram' | 'stats' | 'custom';
  /** Aggregation buckets */
  buckets?: AggregationBucket[];
  /** Statistical values (for stats aggregation) */
  stats?: {
    min: number;
    max: number;
    avg: number;
    sum: number;
    count: number;
  };
}

/**
 * Aggregation bucket
 */
export interface AggregationBucket {
  /** Bucket key */
  key: string | number;
  /** Number of documents in bucket */
  doc_count: number;
  /** Nested aggregations */
  nested?: Record<string, AggregationResult>;
}

/**
 * Search suggestion
 */
export interface Suggestion {
  /** Optional unique identifier */
  id?: string;
  /** Suggestion text */
  text: string;
  /** Optional highlighted version */
  highlighted?: string;
  /** Relevance score */
  score?: number;
  /** Number of results for this suggestion */
  count?: number;
  /** Additional metadata */
  metadata?: Record<string, any>;
}

/**
 * Pagination configuration
 */
export interface PaginationConfig {
  /** Current page (1-indexed) */
  page: number;
  /** Items per page */
  pageSize: number;
  /** Total items */
  total: number;
}

/**
 * Search state
 */
export interface SearchState<T = any> {
  /** Current query */
  query: string;
  /** Current results */
  results: SearchResult<T>[];
  /** Loading state */
  loading: boolean;
  /** Error state */
  error: Error | null;
  /** Total results count */
  total: number;
  /** Current filters */
  filters: Map<string, FilterConfig>;
  /** Current pagination */
  pagination: PaginationConfig;
  /** Available aggregations */
  aggregations: Record<string, AggregationResult>;
  /** Current suggestions */
  suggestions: Suggestion[];
}

/**
 * Search configuration
 */
export interface SearchConfig {
  /** Debounce time for search input (ms) */
  debounceTime?: number;
  /** Minimum query length to trigger search */
  minQueryLength?: number;
  /** Default page size */
  pageSize?: number;
  /** Enable automatic search on query change */
  autoSearch?: boolean;
  /** Enable suggestions */
  enableSuggestions?: boolean;
  /** Enable aggregations/facets */
  enableAggregations?: boolean;
  /** Fields to search */
  searchFields?: string[];
  /** Default sort */
  defaultSort?: SortConfig[];
  /** Enable highlighting */
  enableHighlighting?: boolean;
  /** Highlight fields */
  highlightFields?: string[];
}

/**
 * Search event types for tracking
 */
export type SearchEventType =
  | 'query_changed'
  | 'search_started'
  | 'search_completed'
  | 'search_failed'
  | 'filter_added'
  | 'filter_removed'
  | 'filter_cleared'
  | 'page_changed'
  | 'result_clicked'
  | 'suggestion_selected';

/**
 * Search event
 */
export interface SearchEvent {
  /** Event type */
  type: SearchEventType;
  /** Event timestamp */
  timestamp: number;
  /** Event payload */
  payload?: any;
}
