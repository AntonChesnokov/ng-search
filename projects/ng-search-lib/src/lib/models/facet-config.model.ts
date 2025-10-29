/**
 * Facet configuration model with validation and utilities
 */

import { FacetConfig, FacetType } from '../types/facet-types';

export class FacetConfigModel implements FacetConfig {
  id: string;
  field: string;
  label: string;
  type: FacetType;
  collapsible: boolean;
  collapsed: boolean;
  sort?: 'count' | 'key' | 'custom';
  maxValues?: number;
  showMore: boolean;
  config?: Record<string, any>;

  constructor(config: FacetConfig) {
    this.id = config.id;
    this.field = config.field;
    this.label = config.label;
    this.type = config.type;
    this.collapsible = config.collapsible ?? true;
    this.collapsed = config.collapsed ?? false;
    this.sort = config.sort ?? 'count';
    this.maxValues = config.maxValues;
    this.showMore = config.showMore ?? false;
    this.config = config.config;

    this.validate();
  }

  /**
   * Validate configuration
   */
  private validate(): void {
    if (!this.id) {
      throw new Error('Facet id is required');
    }
    if (!this.field) {
      throw new Error('Facet field is required');
    }
    if (!this.label) {
      throw new Error('Facet label is required');
    }
    if (this.maxValues !== undefined && this.maxValues < 1) {
      throw new Error('maxValues must be at least 1');
    }
  }

  /**
   * Check if facet is a specific type
   */
  isType(type: FacetType): boolean {
    return this.type === type;
  }

  /**
   * Get type-specific configuration
   */
  getTypeConfig<T = any>(): T | undefined {
    return this.config as T | undefined;
  }

  /**
   * Create a copy with overrides
   */
  merge(overrides: Partial<FacetConfig>): FacetConfigModel {
    return new FacetConfigModel({
      ...this,
      ...overrides,
    });
  }

  /**
   * Convert to plain object
   */
  toJSON(): FacetConfig {
    return {
      id: this.id,
      field: this.field,
      label: this.label,
      type: this.type,
      collapsible: this.collapsible,
      collapsed: this.collapsed,
      sort: this.sort,
      maxValues: this.maxValues,
      showMore: this.showMore,
      config: this.config,
    };
  }
}
