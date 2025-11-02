import { InjectionToken } from '@angular/core';
import { SearchAdapter } from './types/adapter-types';
import { SearchConfigModel } from './models/search-config.model';
import { FacetConfig } from './types/facet-types';

export const NG_SEARCH_ADAPTER = new InjectionToken<SearchAdapter>('NG_SEARCH_ADAPTER');

export const NG_SEARCH_INITIAL_CONFIG = new InjectionToken<Partial<SearchConfigModel>>(
  'NG_SEARCH_INITIAL_CONFIG'
);

export const NG_SEARCH_INITIAL_FACETS = new InjectionToken<FacetConfig[]>(
  'NG_SEARCH_INITIAL_FACETS'
);

export const NG_SEARCH_AUTO_INITIALIZE = new InjectionToken<boolean>('NG_SEARCH_AUTO_INITIALIZE');
