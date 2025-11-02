# @chesnokovtony/ng-search

A modern Angular library for building search applications with signals, SSR support, and customizable components.

[![npm version](https://img.shields.io/npm/v/@chesnokovtony/ng-search.svg)](https://www.npmjs.com/package/@chesnokovtony/ng-search)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**[🚀 Live Demo](https://ng-search.vercel.app/)** | [📖 Documentation](https://github.com/AntonChesnokov/ng-search) | [🐛 Issues](https://github.com/AntonChesnokov/ng-search/issues)

## Features

- 🔍 **Complete Search UI** - Search box, autocomplete, results, and faceted filtering
- 🎯 **Modern Angular** - Built with Angular 19+ signals and standalone components
- 🔌 **Backend Agnostic** - Works with any search API through adapters
- 🎨 **Fully Customizable** - Custom templates, theming, and styling
- ♿ **Accessible** - ARIA support and keyboard navigation
- 🌐 **SSR Ready** - Full server-side rendering support

## Live Examples

See the library in action with these interactive demos:

- **[Angular Docs Search](https://ng-search.vercel.app/angular-demo)** - Search Angular documentation with autocomplete
- **[Rick & Morty Search](https://ng-search.vercel.app/rick-morty)** - Character search with faceted filtering
- **[World Atlas](https://ng-search.vercel.app/countries)** - Country search with custom templates

## Installation

```bash
npm install @chesnokovtony/ng-search
```

## Quick Start

```typescript
import { Component } from '@angular/core';
import {
  SearchBoxComponent,
  SuggestionsComponent,
  ResultsComponent,
  provideSearch,
  RestApiAdapter,
} from '@chesnokovtony/ng-search';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [SearchBoxComponent, SuggestionsComponent, ResultsComponent],
  providers: [
    provideSearch({
      adapter: () => new RestApiAdapter({
        endpoint: 'https://api.example.com/search'
      }),
      config: {
        debounceTime: 300,
        pageSize: 20,
      },
    }),
  ],
  template: `
    <ng-search-box [placeholder]="'Search...'" />
    <ng-search-suggestions [maxSuggestions]="10" />
    <ng-search-results [showPagination]="true" />
  `,
})
export class SearchComponent {}
```

## Custom Templates

Customize how suggestions and results are displayed:

```typescript
@Component({
  template: `
    <ng-search-suggestions>
      <ng-template #suggestionTemplate let-suggestion>
        <div class="custom-suggestion">
          <strong>{{ suggestion.text }}</strong>
          <span>{{ suggestion.count }} results</span>
        </div>
      </ng-template>
    </ng-search-suggestions>

    <ng-search-results>
      <ng-template #resultTemplate let-result>
        <article>
          <h3>{{ result.data.title }}</h3>
          <p>{{ result.data.description }}</p>
        </article>
      </ng-template>
    </ng-search-results>
  `,
})
export class CustomSearchComponent {}
```

## Programmatic Control

Access search state and methods directly:

```typescript
import { Component, inject } from '@angular/core';
import { SearchStateService } from '@chesnokovtony/ng-search';

@Component({
  template: `
    <button (click)="search('angular')">Search</button>
    <button (click)="clearSearch()">Clear</button>
    <div>Results: {{ searchState.total() }}</div>
  `,
})
export class ProgrammaticSearchComponent {
  searchState = inject(SearchStateService);

  search(query: string) {
    this.searchState.setQuery(query);
  }

  clearSearch() {
    this.searchState.clear();
  }
}
```

## Faceted Search

Add filters to refine search results:

```typescript
import { Component, inject } from '@angular/core';
import {
  SearchProvider,
  FacetsContainerComponent,
  AppliedFiltersComponent
} from '@chesnokovtony/ng-search';

@Component({
  standalone: true,
  imports: [FacetsContainerComponent, AppliedFiltersComponent],
  template: `
    <ng-facets-container
      [facets]="searchProvider.facets()"
      (facetChange)="onFacetChange($event)"
    />

    <ng-applied-filters
      [filters]="searchProvider.appliedFilters()"
      (removeFilter)="onRemoveFilter($event)"
    />
  `,
})
export class FacetedSearchComponent {
  searchProvider = inject(SearchProvider);

  ngOnInit() {
    this.searchProvider.addFacets([
      {
        id: 'category',
        field: 'category',
        label: 'Category',
        type: 'text',
        multiSelect: true,
        options: [
          { value: 'electronics', label: 'Electronics' },
          { value: 'books', label: 'Books' },
        ],
      },
      {
        id: 'price',
        field: 'price',
        label: 'Price Range',
        type: 'number-range',
        min: 0,
        max: 1000,
      },
    ]);
  }

  onFacetChange() {
    this.searchProvider.executeSearch();
  }

  onRemoveFilter(filter: string) {
    this.searchProvider.clearFacet(filter);
    this.searchProvider.executeSearch();
  }
}
```

## Custom Backend Adapter

Integrate with any search backend:

```typescript
import { SearchAdapter, SearchQuery, SearchResponse } from '@chesnokovtony/ng-search';
import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

export class MySearchAdapter implements SearchAdapter {
  private http = inject(HttpClient);

  async search<T>(query: SearchQuery): Promise<SearchResponse<T>> {
    const response = await firstValueFrom(
      this.http.post<any>('/api/search', query)
    );

    return {
      results: response.hits.map(hit => ({
        id: hit.id,
        data: hit._source,
        score: hit._score,
      })),
      total: response.total,
      took: response.took,
    };
  }

  async suggest(query: string): Promise<Suggestion[]> {
    const response = await firstValueFrom(
      this.http.get<any>(`/api/suggest?q=${query}`)
    );
    return response.suggestions;
  }
}
```

## Styling & Theming

Import the default styles in your `angular.json`:

```json
{
  "styles": [
    "node_modules/@chesnokovtony/ng-search/styles/index.css"
  ]
}
```

Or customize using CSS variables:

```css
ng-search-box {
  --ng-color-primary: #0066cc;
  --ng-radius-md: 8px;
}
```

Dark mode support:

```html
<div data-theme="dark">
  <ng-search-box></ng-search-box>
</div>
```

## API Reference

### Components

**SearchBox**
- Search input with debouncing and keyboard navigation
- Inputs: `placeholder`, `debounceTime`, `disabled`, `showClearButton`
- Outputs: `queryChange`, `search`, `clear`, `focus`, `blur`

**Suggestions**
- Autocomplete dropdown
- Inputs: `maxSuggestions`, `highlightQuery`, `minQueryLength`
- Outputs: `suggestionSelected`, `visibilityChange`

**Results**
- Search results display with pagination
- Inputs: `pageSize`, `showPagination`, `enableVirtualScroll`
- Outputs: `resultClick`, `pageChange`, `retry`

**FacetsContainer**
- Container for multiple facets
- Inputs: `facets`, `title`
- Outputs: `facetChange`, `clearAll`

**AppliedFilters**
- Shows active filters as removable chips
- Inputs: `filters`, `fieldLabels`
- Outputs: `removeFilter`, `clearAll`

### Services

**SearchStateService**
- Signals: `query()`, `results()`, `loading()`, `total()`, `suggestions()`
- Methods: `setQuery()`, `clear()`, `nextPage()`, `previousPage()`

**SearchProvider**
- Main search orchestration service
- Methods: `executeSearch()`, `addFacet()`, `clearFacet()`, `clearAllFacets()`

**SearchCoordinatorService**
- Methods: `search()`, `suggest()`, `cancel()`

## Advanced Configuration

Use DI tokens for fine-grained control:

```typescript
import {
  provideSearch,
  NG_SEARCH_ADAPTER,
  NG_SEARCH_INITIAL_CONFIG,
} from '@chesnokovtony/ng-search';

export const appConfig = {
  providers: [
    { provide: NG_SEARCH_ADAPTER, useClass: MySearchAdapter },
    {
      provide: NG_SEARCH_INITIAL_CONFIG,
      useValue: { debounceTime: 200, pageSize: 15 },
    },
    provideSearch(),
  ],
};
```

## Contributing

Contributions are welcome! Please see our [contributing guidelines](https://github.com/AntonChesnokov/ng-search/blob/main/CONTRIBUTING.md).

## License

MIT © 2025 ng-search contributors

## Links

- [🚀 Live Demo](https://ng-search.vercel.app/)
- [📖 GitHub Repository](https://github.com/AntonChesnokov/ng-search)
- [🐛 Issue Tracker](https://github.com/AntonChesnokov/ng-search/issues)
- [📋 Changelog](https://github.com/AntonChesnokov/ng-search/blob/main/projects/ng-search-lib/CHANGELOG.md)
