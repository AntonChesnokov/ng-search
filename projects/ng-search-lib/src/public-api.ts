/*
 * Public API Surface of @ng-search/core
 */

// Version
export * from './lib/version';

// Types
export * from './lib/types/search-types';
export * from './lib/types/facet-types';
export * from './lib/types/adapter-types';
export * from './lib/types/component-types';

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

// Provider functions
export * from './lib/provide-search';

// Components
export * from './lib/components/search-box/search-box.component';
export * from './lib/components/suggestions/suggestions.component';
export * from './lib/components/results/results.component';
// export * from './lib/components/facets/facet-container.component';

// Facet Plugins (to be implemented)
// export * from './lib/components/facets/checkbox-facet/checkbox-facet.component';
// export * from './lib/components/facets/range-facet/range-facet.component';
// export * from './lib/components/facets/toggle-facet/toggle-facet.component';
