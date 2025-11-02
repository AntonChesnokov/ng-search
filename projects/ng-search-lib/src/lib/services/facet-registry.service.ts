/**
 * Facet Registry Service
 * Plugin system for facets - allows registering custom facet types
 * Zone-less compatible
 */

import { Injectable, Type, signal, Signal, inject } from '@angular/core';
import {
  FacetPlugin,
  FacetPluginRegistration,
  IFacetRegistry,
  FacetType,
} from '../types/facet-types';
import { TextFacetComponent } from '../components/facets/built-in/text-facet.component';
import { TextTypeaheadFacetComponent } from '../components/facets/built-in/text-typeahead-facet.component';
import { NumberFacetComponent } from '../components/facets/built-in/number-facet.component';
import { NumberRangeFacetComponent } from '../components/facets/built-in/number-range-facet.component';
import { DEFAULT_SEARCH_LOGGER, NG_SEARCH_LOGGER } from './search-logger';

/**
 * Facet registry service
 * Manages registration and retrieval of facet plugins
 */
@Injectable({
  providedIn: 'root',
})
export class FacetRegistryService implements IFacetRegistry {
  // Internal registry map
  private readonly registry = new Map<string, FacetPluginRegistration>();
  private readonly logger = inject(NG_SEARCH_LOGGER, { optional: true }) ?? DEFAULT_SEARCH_LOGGER;

  // Signal for reactive plugin list
  private readonly _registeredTypes = signal<string[]>([]);
  readonly registeredTypes: Signal<string[]> = this._registeredTypes.asReadonly();

  private static builtInsRegistered = false;

  constructor() {
    this.ensureBuiltInFacets();
  }

  /**
   * Register a facet plugin
   */
  register(registration: FacetPluginRegistration): void {
    const type = registration.type;

    if (this.registry.has(type)) {
      this.logger.warn(`Facet plugin "${type}" is already registered. Overwriting.`);
    }

    this.registry.set(type, registration);
    this._registeredTypes.set(Array.from(this.registry.keys()));
  }

  /**
   * Register multiple facet plugins
   */
  registerMany(registrations: FacetPluginRegistration[]): void {
    registrations.forEach((registration) => this.register(registration));
  }

  /**
   * Unregister a facet plugin
   */
  unregister(type: string): void {
    if (!this.registry.has(type)) {
      this.logger.warn(`Facet plugin "${type}" is not registered.`);
      return;
    }

    this.registry.delete(type);
    this._registeredTypes.set(Array.from(this.registry.keys()));
  }

  /**
   * Get facet plugin component by type
   */
  get(type: string): Type<FacetPlugin> | undefined {
    return this.registry.get(type)?.component;
  }

  /**
   * Get facet plugin registration by type
   */
  getRegistration(type: string): FacetPluginRegistration | undefined {
    return this.registry.get(type);
  }

  /**
   * Check if facet type is registered
   */
  has(type: string): boolean {
    return this.registry.has(type);
  }

  /**
   * Get all registered types
   */
  getTypes(): string[] {
    return Array.from(this.registry.keys());
  }

  /**
   * Get all registrations
   */
  getAllRegistrations(): FacetPluginRegistration[] {
    return Array.from(this.registry.values());
  }

  /**
   * Clear all registrations
   */
  clear(): void {
    this.registry.clear();
    this._registeredTypes.set([]);
    FacetRegistryService.builtInsRegistered = false;
  }

  /**
   * Get count of registered plugins
   */
  getCount(): number {
    return this.registry.size;
  }

  /**
   * Check if registry is empty
   */
  isEmpty(): boolean {
    return this.registry.size === 0;
  }

  /**
   * Ensure built-in facet plugins are registered once
   */
  ensureBuiltInFacets(): void {
    if (FacetRegistryService.builtInsRegistered) {
      return;
    }

    this.registerMany([
      {
        type: 'text',
        component: TextFacetComponent,
        description: 'Text facet with checkbox/radio selection',
      },
      {
        type: 'text-typeahead',
        component: TextTypeaheadFacetComponent,
        description: 'Text facet with typeahead search',
      },
      {
        type: 'number',
        component: NumberFacetComponent,
        description: 'Single number input facet',
      },
      {
        type: 'number-range',
        component: NumberRangeFacetComponent,
        description: 'Number range facet with min/max inputs',
      },
    ]);

    FacetRegistryService.builtInsRegistered = true;
  }
}
