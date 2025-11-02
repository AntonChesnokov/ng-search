/**
 * Provide search functionality
 * Helper functions to set up search in Angular applications
 */

import {
  Provider,
  makeEnvironmentProviders,
  EnvironmentProviders,
  Type,
  inject,
} from '@angular/core';
import { SearchStateService } from './services/search-state.service';
import { SearchCoordinatorService } from './services/search-coordinator.service';
import { FacetRegistryService } from './services/facet-registry.service';
import { FacetManagerService } from './services/facet-manager.service';
import { SearchProvider } from './services/search-provider.service';
import { SearchAdapter } from './types/adapter-types';
import { SearchConfigModel } from './models/search-config.model';
import { FacetConfig } from './types/facet-types';
import { SearchTelemetryClient } from './types/telemetry-types';
import { NG_SEARCH_TELEMETRY_CLIENTS } from './services/search-telemetry.service';
import { NG_SEARCH_LOGGER, SearchLogger } from './services/search-logger';
import {
  NG_SEARCH_ADAPTER,
  NG_SEARCH_INITIAL_CONFIG,
  NG_SEARCH_INITIAL_FACETS,
  NG_SEARCH_AUTO_INITIALIZE,
} from './search.tokens';

/**
 * Options for providing search
 */
type SearchAdapterFactory = () => SearchAdapter;
type SearchAdapterSource = SearchAdapter | SearchAdapterFactory | Type<SearchAdapter>;

export interface ProvideSearchOptions {
  /** Search adapter instance, factory, or injectable type */
  adapter?: SearchAdapterSource;
  /** Search configuration */
  config?: Partial<SearchConfigModel>;
  /** Optional facet presets to register on initialisation */
  facets?: FacetConfig[];
  /** Optional telemetry clients */
  telemetry?: SearchTelemetryClient | SearchTelemetryClient[];
  /** Optional logger implementation */
  logger?: SearchLogger;
  /** Automatically initialise the adapter (defaults to true) */
  autoInitialize?: boolean;
}

function resolveAdapter(adapter?: SearchAdapterSource): SearchAdapter | undefined {
  if (!adapter) {
    return undefined;
  }

  if (typeof adapter === 'function') {
    const maybeType = adapter as Type<SearchAdapter>;
    if (maybeType.prototype?.search) {
      return inject(maybeType);
    }

    return (adapter as SearchAdapterFactory)();
  }

  if (typeof (adapter as SearchAdapter).search === 'function') {
    return adapter as SearchAdapter;
  }

  return undefined;
}

function createTelemetryProviders(options?: ProvideSearchOptions): Provider[] {
  if (!options?.telemetry) {
    return [];
  }

  const providers: Provider[] = [];
  const clients = Array.isArray(options.telemetry) ? options.telemetry : [options.telemetry];
  clients.forEach((client) => {
    providers.push({
      provide: NG_SEARCH_TELEMETRY_CLIENTS,
      useValue: client,
      multi: true,
    });
  });
  return providers;
}

function createLoggerProviders(options?: ProvideSearchOptions): Provider[] {
  if (!options?.logger) {
    return [];
  }

  return [
    {
      provide: NG_SEARCH_LOGGER,
      useValue: options.logger,
    },
  ];
}

function createAdapterProviders(options?: ProvideSearchOptions): Provider[] {
  if (!options?.adapter) {
    return [];
  }

  return [
    {
      provide: NG_SEARCH_ADAPTER,
      useFactory: () => resolveAdapter(options.adapter),
    },
  ];
}

function createConfigProviders(options?: ProvideSearchOptions): Provider[] {
  const providers: Provider[] = [];

  if (options?.config) {
    providers.push({
      provide: NG_SEARCH_INITIAL_CONFIG,
      useValue: options.config,
    });
  }

  if (options?.facets?.length) {
    providers.push({
      provide: NG_SEARCH_INITIAL_FACETS,
      useValue: options.facets,
    });
  }

  if (options?.autoInitialize !== undefined) {
    providers.push({
      provide: NG_SEARCH_AUTO_INITIALIZE,
      useValue: options.autoInitialize,
    });
  }

  return providers;
}

function createSearchProviders(options?: ProvideSearchOptions): Provider[] {
  return [
    SearchStateService,
    SearchCoordinatorService,
    FacetManagerService,
    SearchProvider,
    ...createTelemetryProviders(options),
    ...createLoggerProviders(options),
    ...createAdapterProviders(options),
    ...createConfigProviders(options),
  ];
}

/**
 * Provide search services at the root level
 * Use in app.config.ts or main.ts
 *
 * @example
 * ```typescript
 * export const appConfig: ApplicationConfig = {
 *   providers: [
 *     provideSearch({
 *       adapter: new RestApiAdapter({ endpoint: 'https://api.example.com' }),
 *       config: { debounceTime: 300, pageSize: 20 }
 *     })
 *   ]
 * };
 * ```
 */
export function provideSearch(options?: ProvideSearchOptions): EnvironmentProviders {
  return makeEnvironmentProviders(createSearchProviders(options));
}

/**
 * Provide search services at component level
 * Use in component providers array for isolated search instances
 *
 * @example
 * ```typescript
 * @Component({
 *   providers: [provideSearchForComponent()],
 * })
 * export class SearchComponent {
 *   private search = inject(SearchProvider);
 * }
 * ```
 */
export function provideSearchForComponent(options?: ProvideSearchOptions): Provider[] {
  return createSearchProviders(options);
}

/**
 * Register built-in facet components
 * Called automatically by provideSearch
 * Can be called manually if needed
 */
export function registerBuiltInFacets(registry: FacetRegistryService): void {
  registry.ensureBuiltInFacets();
}
