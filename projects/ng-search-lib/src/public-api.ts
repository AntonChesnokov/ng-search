/*
 * Public API Surface of @chesnokovtony/ng-search
 */

// Version
export * from './lib/version';

// Types
export * from './lib/types/search-types';
export * from './lib/types/facet-types';
export * from './lib/types/adapter-types';
export * from './lib/types/component-types';
export * from './lib/types/telemetry-types';

// Models
export * from './lib/models/search-config.model';
export * from './lib/models/search-result.model';
export * from './lib/models/facet-config.model';

// Adapters
export * from './lib/adapters/base-http.adapter';
export * from './lib/adapters/rest-api.adapter';

// Utils
export * from './lib/utils';

// Core Services
export * from './lib/services';
export * from './lib/services/search-telemetry.service';
export * from './lib/services/search-logger';

// Provider functions
export * from './lib/provide-search';
export * from './lib/search.tokens';

// Components
export * from './lib/components/search-box/search-box.component';
export * from './lib/components/suggestions/suggestions.component';
export * from './lib/components/results/results.component';

// Facet Components
export * from './lib/components/facets/facets-container.component';
export * from './lib/components/facets/facet-wrapper.component';
export * from './lib/components/facets/applied-filters.component';

// Built-in Facet Plugins
export * from './lib/components/facets/built-in/text-facet.component';
export * from './lib/components/facets/built-in/text-typeahead-facet.component';
export * from './lib/components/facets/built-in/number-facet.component';
export * from './lib/components/facets/built-in/number-range-facet.component';
