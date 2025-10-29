/**
 * Provide search functionality
 * Helper functions to set up search in Angular applications
 */

import { Provider, makeEnvironmentProviders, EnvironmentProviders } from '@angular/core';
import { SearchStateService } from './services/search-state.service';
import { SearchCoordinatorService } from './services/search-coordinator.service';
import { FacetRegistryService } from './services/facet-registry.service';
import { SearchProvider } from './services/search-provider.service';
import { SearchAdapter } from './types/adapter-types';
import { SearchConfigModel } from './models/search-config.model';

/**
 * Options for providing search
 */
export interface ProvideSearchOptions {
	/** Search adapter instance */
	adapter?: SearchAdapter;
	/** Search configuration */
	config?: Partial<SearchConfigModel>;
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
	const providers: Provider[] = [
		SearchStateService,
		SearchCoordinatorService,
		FacetRegistryService,
		SearchProvider,
	];

	return makeEnvironmentProviders(providers);
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
export function provideSearchForComponent(): Provider[] {
	return [SearchStateService, SearchCoordinatorService, SearchProvider];
}
