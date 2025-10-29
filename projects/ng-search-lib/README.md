# @ng-search/core

A modern, performant, and extensible Angular 20+ library for building search applications with signals, SSR support, and a plugin-based architecture.

[![npm version](https://img.shields.io/npm/v/@ng-search/core.svg)](https://www.npmjs.com/package/@ng-search/core)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## ✨ Features

### 🎯 Modern Angular 20 APIs
- **Signal-based state management** - Reactive state with Angular signals
- **Input/output functions** - Modern component API
- **Standalone components** - No NgModules required
- **Deferrable views** - Performance-optimized lazy rendering with `@defer`
- **Zone-less compatible** - Works perfectly without zone.js for better performance
- **Full SSR support** - Server-side rendering compatible (SSR support with zone-less coming soon)

### 🔍 Core Components
- **SearchBox** - Responsive search input with debouncing, keyboard navigation, and ARIA support
- **Suggestions** - Autocomplete dropdown with custom templates and keyboard navigation
- **Results** - Flexible results display with pagination, virtual scrolling, and custom renderers
- **Facets** *(coming soon)* - Plugin-based filtering system

### 🚀 Performance & Scalability
- Signal-based reactivity for efficient change detection
- Virtual scrolling for large result sets
- Lazy loading with `@defer` blocks
- Tree-shakeable architecture
- Optimized for SSR and hydration

### 🎨 Backend Agnostic
Works with any search backend through adapters:
- OpenSearch
- Elasticsearch
- Algolia
- Custom REST APIs
- Any other search service

## 📦 Installation

```bash
npm install @ng-search/core
```

## 🚀 Quick Start

### 1. Basic Setup

```typescript
import { Component, inject } from '@angular/core';
import { 
  SearchBoxComponent, 
  SuggestionsComponent, 
  ResultsComponent,
  provideSearch,
  RestApiAdapter 
} from '@ng-search/core';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [SearchBoxComponent, SuggestionsComponent, ResultsComponent],
  providers: [
    provideSearch({
      adapter: new RestApiAdapter({
        baseUrl: 'https://api.example.com',
        searchEndpoint: '/search',
        suggestEndpoint: '/suggest',
      }),
      debounceTime: 300,
      minQueryLength: 2,
      pageSize: 20,
    })
  ],
  template: `
    <div class="search-container">
      <ng-search-box
        [placeholder]="'Search...'"
        [debounceTime]="300"
        [showClearButton]="true"
        [showSearchButton]="true" />
      
      <ng-search-suggestions
        [maxSuggestions]="10"
        [highlightQuery]="true" />
      
      <ng-search-results
        [pageSize]="20"
        [showPagination]="true" />
    </div>
  `
})
export class SearchComponent {}
```

### 2. With Custom Templates

```typescript
@Component({
  selector: 'app-custom-search',
  standalone: true,
  imports: [SearchBoxComponent, SuggestionsComponent, ResultsComponent],
  template: `
    <ng-search-box />
    
    <ng-search-suggestions>
      <ng-template #suggestionTemplate let-suggestion let-index="index">
        <div class="custom-suggestion">
          <strong>{{ suggestion.text }}</strong>
          <span class="count">{{ suggestion.count }} results</span>
        </div>
      </ng-template>
    </ng-search-suggestions>
    
    <ng-search-results>
      <ng-template #resultTemplate let-result let-index="index">
        <article class="search-result">
          <h3>{{ result.data.title }}</h3>
          <p>{{ result.data.description }}</p>
          <div class="metadata">
            <span>Score: {{ result.score }}</span>
            <span>Index: {{ index }}</span>
          </div>
        </article>
      </ng-template>
    </ng-search-results>
  `
})
export class CustomSearchComponent {}
```

### 3. Programmatic Control

```typescript
import { Component, inject } from '@angular/core';
import { SearchStateService } from '@ng-search/core';

@Component({
  selector: 'app-search-with-control',
  template: `
    <button (click)="search('angular')">Search Angular</button>
    <button (click)="clearSearch()">Clear</button>
    <button (click)="nextPage()">Next Page</button>
    
    <div>Results: {{ searchState.total() }}</div>
    <div>Loading: {{ searchState.loading() }}</div>
  `
})
export class SearchWithControlComponent {
  searchState = inject(SearchStateService);
  
  search(query: string) {
    this.searchState.setQuery(query);
  }
  
  clearSearch() {
    this.searchState.clear();
  }
  
  nextPage() {
    this.searchState.nextPage();
  }
}
```

## 📚 API Reference

### Components

#### SearchBox

Input/output based search input with debouncing and keyboard navigation.

**Inputs:**
- `value: string` - Current search value
- `placeholder: string` - Placeholder text (default: 'Search...')
- `debounceTime: number` - Debounce delay in ms (default: 300)
- `minQueryLength: number` - Minimum query length (default: 0)
- `disabled: boolean` - Disabled state (default: false)
- `autoFocus: boolean` - Auto-focus on mount (default: false)
- `showClearButton: boolean` - Show clear button (default: true)
- `showSearchButton: boolean` - Show search button (default: false)
- `showSearchIcon: boolean` - Show search icon (default: true)
- `loading: boolean` - Loading indicator (default: false)
- `ariaLabel: string` - ARIA label for accessibility

**Outputs:**
- `queryChange: string` - Emitted on value change
- `search: string` - Emitted on search action
- `clear: void` - Emitted on clear
- `focus: void` - Emitted on focus
- `blur: void` - Emitted on blur
- `keyDown: KeyboardEvent` - Emitted on key press

#### Suggestions

Autocomplete suggestions dropdown with keyboard navigation.

**Inputs:**
- `maxSuggestions: number` - Max suggestions to display (default: 10)
- `highlightQuery: boolean` - Highlight matching text (default: true)
- `showIcon: boolean` - Show search icon (default: true)
- `showNoResults: boolean` - Show "no results" message (default: false)
- `loadingText: string` - Loading message
- `noResultsText: string` - No results message
- `minQueryLength: number` - Min query length (default: 1)
- `autoHighlightFirst: boolean` - Auto-highlight first item (default: true)
- `closeOnSelect: boolean` - Close on selection (default: true)

**Outputs:**
- `suggestionSelected: Suggestion` - Emitted when suggestion selected
- `suggestionHighlighted: Suggestion | null` - Emitted when highlight changes
- `showAllSuggestions: void` - Emitted on "show more" click
- `visibilityChange: boolean` - Emitted when dropdown visibility changes

#### Results

Search results display with pagination and virtual scrolling.

**Inputs:**
- `pageSize: number` - Results per page (default: 10)
- `showPagination: boolean` - Show pagination (default: true)
- `showPageSize: boolean` - Show page size selector (default: false)
- `showSort: boolean` - Show sort dropdown (default: false)
- `showScore: boolean` - Show relevance scores (default: false)
- `showResultsInfo: boolean` - Show results count (default: true)
- `highlightQuery: boolean` - Highlight search terms (default: true)
- `enableVirtualScroll: boolean` - Enable virtual scrolling (default: false)
- `virtualScrollHeight: number` - Viewport height for virtual scroll (default: 600)
- `itemHeight: number` - Item height for virtual scroll (default: 100)

**Outputs:**
- `resultClick: { result, index }` - Emitted when result clicked
- `resultHighlighted: SearchResult | null` - Emitted when result highlighted
- `pageChange: number` - Emitted on page change
- `pageSizeChange: number` - Emitted on page size change
- `sortChange: string` - Emitted on sort change
- `retry: void` - Emitted on retry button click

### Services

#### SearchStateService

Central state management using Angular signals.

**Signals (readonly):**
- `query: Signal<string>` - Current search query
- `results: Signal<SearchResult[]>` - Search results
- `loading: Signal<boolean>` - Loading state
- `error: Signal<Error | null>` - Error state
- `total: Signal<number>` - Total results count
- `suggestions: Signal<Suggestion[]>` - Autocomplete suggestions
- `pagination: Signal<PaginationConfig>` - Pagination state
- `filters: Signal<Map<string, FilterConfig>>` - Active filters
- `aggregations: Signal<Record<string, AggregationResult>>` - Facet aggregations

**Methods:**
- `setQuery(query: string): void` - Update search query
- `setResults(results: SearchResult[], total: number): void` - Update results
- `setLoading(loading: boolean): void` - Update loading state
- `setError(error: Error | null): void` - Update error state
- `addFilter(filter: FilterConfig): void` - Add filter
- `removeFilter(field: string): void` - Remove filter
- `clearFilters(): void` - Clear all filters
- `setPagination(page: number, pageSize?: number): void` - Update pagination
- `nextPage(): void` - Go to next page
- `previousPage(): void` - Go to previous page
- `clear(): void` - Clear all state

#### SearchCoordinatorService

Orchestrates search execution with debouncing and cancellation.

**Methods:**
- `search(query?: string): Promise<void>` - Execute search
- `suggest(query?: string): Promise<void>` - Get suggestions
- `cancel(): void` - Cancel ongoing requests

## 🔌 Adapters

### Creating a Custom Adapter

```typescript
import { SearchAdapter, SearchQuery, SearchResponse } from '@ng-search/core';
import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

export class MyCustomAdapter implements SearchAdapter {
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

## 🎨 Styling

The library provides minimal default styles. You can override them:

```css
/* Custom SearchBox styles */
ng-search-box {
  --search-box-border: 2px solid #0066cc;
  --search-box-focus-shadow: 0 0 0 3px rgba(0, 102, 204, 0.1);
}

/* Custom Results styles */
ng-search-results .result-item:hover {
  background-color: #f0f8ff;
}
```

## 🧪 Testing

```typescript
import { TestBed } from '@angular/core/testing';
import { SearchStateService } from '@ng-search/core';

describe('MySearchComponent', () => {
  let searchState: SearchStateService;
  
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SearchStateService]
    });
    
    searchState = TestBed.inject(SearchStateService);
  });
  
  it('should update query', () => {
    searchState.setQuery('test');
    expect(searchState.query()).toBe('test');
  });
});
```

## 📖 Architecture

```
@ng-search/core
├── components/
│   ├── search-box/         # Search input component
│   ├── suggestions/        # Autocomplete suggestions
│   └── results/            # Search results display
├── services/
│   ├── search-state        # Signal-based state management
│   ├── search-coordinator  # Search orchestration
│   ├── facet-registry      # Facet plugin system
│   └── ssr-safe           # SSR utilities
├── adapters/
│   ├── base-http          # Base HTTP adapter
│   └── rest-api           # REST API adapter
├── types/                 # TypeScript interfaces
├── models/                # Data models
└── utils/                 # Utility functions
```

## ⚡ Zone-less Mode

This library is fully compatible with Angular's experimental zone-less mode, providing significant performance and bundle size benefits.

### Enable Zone-less Mode

```typescript
// app.config.ts
import { provideExperimentalZonelessChangeDetection } from '@angular/core';

export const appConfig: ApplicationConfig = {
  providers: [
    provideExperimentalZonelessChangeDetection(),
    // ... other providers
  ]
};
```

### Remove zone.js from angular.json

```json
{
  "polyfills": []
}
```

### Benefits

- **~90KB smaller bundle** (zone.js removed)
- **10-20% faster runtime** (no zone patching overhead)
- **Predictable change detection** via signals
- **Better SSR compatibility**

All components use signals and `OnPush` change detection strategy, making them inherently zone-less compatible.

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines.

## 📄 License

MIT © 2025

## 🔗 Links

- [Documentation](https://github.com/yourusername/ng-search)
- [Issue Tracker](https://github.com/yourusername/ng-search/issues)
- [Changelog](https://github.com/yourusername/ng-search/blob/main/CHANGELOG.md)
