/**
 * Highlight utility for search results
 */

/**
 * Highlight configuration
 */
export interface HighlightOptions {
  /** CSS class to apply to highlighted text */
  className?: string;
  /** Pre-tag for highlights */
  preTag?: string;
  /** Post-tag for highlights */
  postTag?: string;
  /** Case sensitive matching */
  caseSensitive?: boolean;
}

/**
 * Highlight text matches in a string
 */
export function highlightText(text: string, query: string, options: HighlightOptions = {}): string {
  if (!text || !query) {
    return text;
  }

  const {
    className = 'highlight',
    preTag = `<mark class="${className}">`,
    postTag = '</mark>',
    caseSensitive = false,
  } = options;

  // Escape special regex characters
  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // Create regex
  const flags = caseSensitive ? 'g' : 'gi';
  const regex = new RegExp(escapedQuery, flags);

  // Replace matches
  return text.replace(regex, (match) => `${preTag}${match}${postTag}`);
}

/**
 * Highlight multiple terms in text
 */
export function highlightTerms(
  text: string,
  terms: string[],
  options: HighlightOptions = {}
): string {
  if (!text || !terms || terms.length === 0) {
    return text;
  }

  let result = text;
  terms.forEach((term) => {
    result = highlightText(result, term, options);
  });

  return result;
}

/**
 * Extract highlighted snippets from text
 */
export function extractSnippet(
  text: string,
  query: string,
  maxLength: number = 200,
  options: HighlightOptions = {}
): string {
  if (!text || !query) {
    return text.substring(0, maxLength);
  }

  const lowerText = options.caseSensitive ? text : text.toLowerCase();
  const lowerQuery = options.caseSensitive ? query : query.toLowerCase();
  const index = lowerText.indexOf(lowerQuery);

  if (index === -1) {
    return text.substring(0, maxLength) + (text.length > maxLength ? '...' : '');
  }

  // Calculate snippet boundaries
  const beforeLength = Math.floor((maxLength - query.length) / 2);
  const start = Math.max(0, index - beforeLength);
  const end = Math.min(text.length, start + maxLength);

  // Extract snippet
  let snippet = text.substring(start, end);

  // Add ellipsis
  if (start > 0) {
    snippet = '...' + snippet;
  }
  if (end < text.length) {
    snippet = snippet + '...';
  }

  // Highlight the query
  return highlightText(snippet, query, options);
}

/**
 * Strip HTML tags from highlighted text
 */
export function stripHighlight(highlightedText: string): string {
  return highlightedText.replace(/<\/?mark[^>]*>/g, '');
}

/**
 * Get highlight boundaries
 */
export function getHighlightBoundaries(
  text: string,
  query: string,
  caseSensitive: boolean = false
): Array<{ start: number; end: number }> {
  if (!text || !query) {
    return [];
  }

  const boundaries: Array<{ start: number; end: number }> = [];
  const searchText = caseSensitive ? text : text.toLowerCase();
  const searchQuery = caseSensitive ? query : query.toLowerCase();

  let index = 0;
  while ((index = searchText.indexOf(searchQuery, index)) !== -1) {
    boundaries.push({
      start: index,
      end: index + query.length,
    });
    index += query.length;
  }

  return boundaries;
}
