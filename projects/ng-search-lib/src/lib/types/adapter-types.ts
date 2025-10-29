/**
 * Backend adapter types for search integration
 * Supports any backend: OpenSearch, Algolia, Elasticsearch, custom APIs, etc.
 */

import { Observable } from 'rxjs';
import { SearchQuery, SearchResponse, Suggestion } from './search-types';

/**
 * Base search adapter interface
 * Implement this interface to integrate with any search backend
 */
export interface SearchAdapter<T = any> {
  /**
   * Execute a search query
   * @param query Search query parameters
   * @returns Observable of search response
   */
  search(query: SearchQuery): Observable<SearchResponse<T>>;

  /**
   * Get suggestions/autocomplete results
   * @param query Partial query string
   * @param options Optional configuration
   * @returns Observable of suggestions
   */
  suggest?(query: string, options?: SuggestOptions): Observable<Suggestion[]>;

  /**
   * Get a single document by ID
   * @param id Document ID
   * @returns Observable of search result
   */
  getById?(id: string): Observable<T | null>;

  /**
   * Check if adapter is ready/connected
   * @returns Observable of connection status
   */
  isReady?(): Observable<boolean>;

  /**
   * Cleanup/disconnect
   */
  destroy?(): void;
}

/**
 * Suggest options
 */
export interface SuggestOptions {
  /** Maximum number of suggestions */
  maxSuggestions?: number;
  /** Fields to search for suggestions */
  fields?: string[];
  /** Fuzzy matching options */
  fuzzy?: boolean;
  /** Additional backend-specific options */
  additionalOptions?: Record<string, any>;
}

/**
 * Adapter configuration
 */
export interface AdapterConfig {
  /** Backend type identifier */
  type: 'opensearch' | 'elasticsearch' | 'algolia' | 'custom';
  /** API endpoint URL */
  endpoint?: string;
  /** API key or credentials */
  credentials?: AdapterCredentials;
  /** Index name */
  index?: string;
  /** Additional backend-specific configuration */
  options?: Record<string, any>;
}

/**
 * Adapter credentials
 */
export interface AdapterCredentials {
  /** API key */
  apiKey?: string;
  /** Username */
  username?: string;
  /** Password */
  password?: string;
  /** Token */
  token?: string;
  /** Custom headers */
  headers?: Record<string, string>;
}

/**
 * Query builder interface
 * Transforms SearchQuery to backend-specific query format
 */
export interface QueryBuilder<TQuery = any> {
  /**
   * Build backend-specific query
   * @param query Generic search query
   * @returns Backend-specific query object
   */
  buildQuery(query: SearchQuery): TQuery;

  /**
   * Build suggest query
   * @param query Query string
   * @param options Suggest options
   * @returns Backend-specific suggest query
   */
  buildSuggestQuery?(query: string, options?: SuggestOptions): any;
}

/**
 * Response parser interface
 * Transforms backend-specific response to generic SearchResponse
 */
export interface ResponseParser<TResponse = any, T = any> {
  /**
   * Parse backend response to generic format
   * @param response Backend-specific response
   * @returns Generic search response
   */
  parseResponse(response: TResponse): SearchResponse<T>;

  /**
   * Parse suggest response
   * @param response Backend-specific response
   * @returns Array of suggestions
   */
  parseSuggestResponse?(response: any): Suggestion[];
}

/**
 * HTTP adapter options
 */
export interface HttpAdapterOptions {
  /** Request timeout in milliseconds */
  timeout?: number;
  /** Retry configuration */
  retry?: RetryConfig;
  /** Request interceptor */
  requestInterceptor?: (request: any) => any;
  /** Response interceptor */
  responseInterceptor?: (response: any) => any;
  /** Error handler */
  errorHandler?: (error: any) => Observable<never>;
}

/**
 * Retry configuration
 */
export interface RetryConfig {
  /** Maximum number of retries */
  maxRetries?: number;
  /** Delay between retries in milliseconds */
  delay?: number;
  /** Backoff strategy */
  backoff?: 'linear' | 'exponential';
}

/**
 * Adapter factory function type
 */
export type AdapterFactory<T = any> = (config: AdapterConfig) => SearchAdapter<T>;

/**
 * Adapter registry for managing multiple adapters
 */
export interface AdapterRegistry {
  /** Register an adapter factory */
  register(type: string, factory: AdapterFactory): void;
  /** Get adapter factory by type */
  get(type: string): AdapterFactory | undefined;
  /** Create adapter instance */
  create<T = any>(config: AdapterConfig): SearchAdapter<T>;
}
