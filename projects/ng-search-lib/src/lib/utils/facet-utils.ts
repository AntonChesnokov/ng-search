/**
 * Utility functions for facet operations
 */

import { FacetValue, FacetOption, FacetConfig } from '../types/facet-types';

/**
 * Filter facet values by query string
 */
export function filterFacetValues(
  values: FacetValue[] | FacetOption[],
  query: string
): (FacetValue | FacetOption)[] {
  if (!query || query.trim() === '') {
    return values;
  }

  const lowerQuery = query.toLowerCase().trim();
  return values.filter((value) => {
    const label = 'label' in value ? value.label : (value as FacetValue).key.toString();
    return label.toLowerCase().includes(lowerQuery);
  });
}

/**
 * Sort facet values
 */
export function sortFacetValues(
  values: FacetValue[],
  sort: 'count' | 'key' | 'custom' = 'count'
): FacetValue[] {
  const sorted = [...values];

  switch (sort) {
    case 'count':
      return sorted.sort((a, b) => b.count - a.count);
    case 'key':
      return sorted.sort((a, b) => a.label.localeCompare(b.label));
    case 'custom':
      // No sorting, return as is
      return sorted;
    default:
      return sorted;
  }
}

/**
 * Toggle value selection in a Set
 */
export function toggleSelection(
  selectedValues: Set<string | number>,
  value: string | number,
  multiSelect: boolean = true
): Set<string | number> {
  const newSet = new Set(selectedValues);

  if (!multiSelect) {
    // Single select - clear and add only this value
    if (newSet.has(value)) {
      newSet.clear();
    } else {
      newSet.clear();
      newSet.add(value);
    }
  } else {
    // Multi select - toggle value
    if (newSet.has(value)) {
      newSet.delete(value);
    } else {
      newSet.add(value);
    }
  }

  return newSet;
}

/**
 * Check if value is selected
 */
export function isValueSelected(
  selectedValues: Set<string | number>,
  value: string | number
): boolean {
  return selectedValues.has(value);
}

/**
 * Get selected count for display
 */
export function getSelectedCountText(count: number): string {
  if (count === 0) return '';
  if (count === 1) return '(1 selected)';
  return `(${count} selected)`;
}

/**
 * Format number value with formatter
 */
export function formatNumberValue(value: number, formatter?: (value: number) => string): string {
  if (formatter) {
    return formatter(value);
  }
  return value.toString();
}

/**
 * Validate number range
 */
export function validateNumberRange(value: number, min?: number, max?: number): boolean {
  if (min !== undefined && value < min) return false;
  if (max !== undefined && value > max) return false;
  return true;
}

/**
 * Clamp number to range
 */
export function clampNumber(value: number, min?: number, max?: number): number {
  let clamped = value;
  if (min !== undefined) clamped = Math.max(min, clamped);
  if (max !== undefined) clamped = Math.min(max, clamped);
  return clamped;
}

/**
 * Parse number input value
 */
export function parseNumberInput(input: string, fallback: number = 0): number {
  const parsed = parseFloat(input);
  return isNaN(parsed) ? fallback : parsed;
}

/**
 * Check if facet has selections
 */
export function hasSelections(selectedValues: Set<string | number>): boolean {
  return selectedValues.size > 0;
}

/**
 * Get facet summary text
 */
export function getFacetSummary(config: FacetConfig, selectedCount: number): string {
  if (selectedCount === 0) {
    return config.label;
  }
  return `${config.label} ${getSelectedCountText(selectedCount)}`;
}
