/**
 * Search result model with utility methods
 */

import { SearchResult } from '../types/search-types';

export class SearchResultModel<T = any> implements SearchResult<T> {
  id: string;
  data: T;
  score?: number;
  highlights?: Record<string, string[]>;
  metadata?: Record<string, any>;

  constructor(result: SearchResult<T>) {
    this.id = result.id;
    this.data = result.data;
    this.score = result.score;
    this.highlights = result.highlights;
    this.metadata = result.metadata;
  }

  /**
   * Check if result has highlights
   */
  hasHighlights(): boolean {
    return !!this.highlights && Object.keys(this.highlights).length > 0;
  }

  /**
   * Get highlight for a specific field
   */
  getHighlight(field: string): string[] | undefined {
    return this.highlights?.[field];
  }

  /**
   * Get first highlight snippet for a field
   */
  getFirstHighlight(field: string): string | undefined {
    const highlights = this.getHighlight(field);
    return highlights?.[0];
  }

  /**
   * Check if result has metadata
   */
  hasMetadata(): boolean {
    return !!this.metadata && Object.keys(this.metadata).length > 0;
  }

  /**
   * Get metadata value
   */
  getMetadata<V = any>(key: string): V | undefined {
    return this.metadata?.[key] as V | undefined;
  }

  /**
   * Get display value from data by path
   * Example: getField('user.name') returns data.user.name
   */
  getField(path: string): any {
    return path.split('.').reduce((obj, key) => obj?.[key], this.data as any);
  }

  /**
   * Convert to plain object
   */
  toJSON(): SearchResult<T> {
    return {
      id: this.id,
      data: this.data,
      score: this.score,
      highlights: this.highlights,
      metadata: this.metadata,
    };
  }
}
