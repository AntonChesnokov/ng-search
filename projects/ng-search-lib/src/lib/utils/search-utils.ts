/**
 * Search utility functions
 */

import { SearchQuery, FilterConfig, SortConfig } from '../types/search-types';

/**
 * Build a search query with defaults
 */
export function buildSearchQuery(
  query: string,
  options?: Partial<SearchQuery>
): SearchQuery {
  return {
    query,
    size: options?.size ?? 10,
    from: options?.from ?? 0,
    fields: options?.fields,
    sort: options?.sort,
    filters: options?.filters ?? [],
  };
}

/**
 * Add filter to search query
 */
export function addFilter(
  query: SearchQuery,
  filter: FilterConfig
): SearchQuery {
  return {
    ...query,
    filters: [...(query.filters || []), filter],
  };
}

/**
 * Remove filter from search query by field
 */
export function removeFilter(
  query: SearchQuery,
  field: string
): SearchQuery {
  return {
    ...query,
    filters: (query.filters || []).filter(f => f.field !== field),
  };
}

/**
 * Update filter in search query
 */
export function updateFilter(
  query: SearchQuery,
  field: string,
  value: any
): SearchQuery {
  return {
    ...query,
    filters: (query.filters || []).map(f =>
      f.field === field ? { ...f, value } : f
    ),
  };
}

/**
 * Clear all filters from search query
 */
export function clearFilters(query: SearchQuery): SearchQuery {
  return {
    ...query,
    filters: [],
  };
}

/**
 * Add or update sort in search query
 */
export function setSort(
  query: SearchQuery,
  sort: SortConfig[]
): SearchQuery {
  return {
    ...query,
    sort,
  };
}

/**
 * Set pagination in search query
 */
export function setPagination(
  query: SearchQuery,
  page: number,
  pageSize: number
): SearchQuery {
  return {
    ...query,
    size: pageSize,
    from: (page - 1) * pageSize,
  };
}

/**
 * Check if query is empty
 */
export function isEmptyQuery(query: string): boolean {
  return !query || query.trim().length === 0;
}

/**
 * Sanitize query string
 */
export function sanitizeQuery(query: string): string {
  return query.trim().replace(/\s+/g, ' ');
}

/**
 * Extract pagination info from query
 */
export function getPaginationInfo(query: SearchQuery): {
  page: number;
  pageSize: number;
} {
  const pageSize = query.size || 10;
  const from = query.from || 0;
  const page = Math.floor(from / pageSize) + 1;

  return { page, pageSize };
}

/**
 * Calculate total pages
 */
export function getTotalPages(total: number, pageSize: number): number {
  return Math.ceil(total / pageSize);
}

/**
 * Check if there's a next page
 */
export function hasNextPage(
  currentPage: number,
  total: number,
  pageSize: number
): boolean {
  return currentPage < getTotalPages(total, pageSize);
}

/**
 * Check if there's a previous page
 */
export function hasPrevPage(currentPage: number): boolean {
  return currentPage > 1;
}
