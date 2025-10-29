/**
 * Example REST API adapter
 * Demonstrates how to implement a custom adapter for any backend
 */

import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { BaseHttpAdapter } from './base-http.adapter';
import { AdapterConfig, SuggestOptions } from '../types/adapter-types';
import { SearchQuery, SearchResponse, Suggestion } from '../types/search-types';

/**
 * Generic REST API adapter
 * Works with any REST API that follows a simple JSON format
 *
 * Example usage:
 * ```typescript
 * const adapter = new RestApiAdapter({
 *   type: 'custom',
 *   endpoint: 'https://api.example.com',
 *   credentials: { apiKey: 'your-key' }
 * });
 * ```
 */
export class RestApiAdapter<T = any> extends BaseHttpAdapter<T> {
  constructor(config: AdapterConfig) {
    super(config);

    if (!config.endpoint) {
      throw new Error('REST API endpoint is required');
    }
  }

  /**
   * Execute search query
   */
  search(query: SearchQuery): Observable<SearchResponse<T>> {
    const url = `${this.config.endpoint}/search`;
    const headers = this.createHeaders();

    // Build request body
    const body = this.buildSearchRequest(query);

    // Execute request
    return this.executeRequest(
      this.http.post<any>(url, body, { headers })
    ).pipe(
      map(response => this.parseSearchResponse(response))
    );
  }

  /**
   * Get suggestions
   */
  override suggest(query: string, options?: SuggestOptions): Observable<Suggestion[]> {
    const url = `${this.config.endpoint}/suggest`;
    const headers = this.createHeaders();

    const body = {
      query,
      max_suggestions: options?.maxSuggestions ?? 10,
      fields: options?.fields,
      fuzzy: options?.fuzzy ?? false,
    };

    return this.executeRequest(
      this.http.post<any>(url, body, { headers })
    ).pipe(
      map(response => this.parseSuggestResponse(response))
    );
  }

  /**
   * Get document by ID
   */
  override getById(id: string): Observable<T | null> {
    const url = `${this.config.endpoint}/document/${id}`;
    const headers = this.createHeaders();

    return this.executeRequest(
      this.http.get<any>(url, { headers })
    ).pipe(
      map(response => response?.data ?? null)
    );
  }

  /**
   * Build search request body
   * Override this method to customize the request format
   */
  protected buildSearchRequest(query: SearchQuery): any {
    return {
      query: query.query,
      size: query.size ?? 10,
      from: query.from ?? 0,
      fields: query.fields,
      sort: query.sort,
      filters: query.filters?.map(f => ({
        field: f.field,
        type: f.type,
        value: f.value,
        operator: f.operator,
      })),
    };
  }

  /**
   * Parse search response
   * Override this method to customize response parsing
   */
  protected parseSearchResponse(response: any): SearchResponse<T> {
    return {
      results: (response.results || []).map((item: any) => ({
        id: item.id || item._id,
        data: item.data || item,
        score: item.score || item._score,
        highlights: item.highlights || item.highlight,
        metadata: item.metadata,
      })),
      total: response.total || response.hits?.total?.value || 0,
      took: response.took,
      aggregations: response.aggregations || response.aggs,
      suggestions: response.suggestions,
    };
  }

  /**
   * Parse suggest response
   */
  protected parseSuggestResponse(response: any): Suggestion[] {
    const suggestions = response.suggestions || response.results || [];
    return suggestions.map((item: any) => ({
      text: item.text || item.value || item,
      highlighted: item.highlighted,
      score: item.score,
      metadata: item.metadata,
    }));
  }
}
