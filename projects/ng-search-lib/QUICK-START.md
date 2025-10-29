# Quick Start Guide - @ng-search/core

## Installation

```bash
npm install @ng-search/core
```

## Basic Usage

### 1. Set Up Search in Your App

```typescript
// app.config.ts
import { ApplicationConfig } from '@angular/core';
import { provideSearch, RestApiAdapter } from '@ng-search/core';

export const appConfig: ApplicationConfig = {
  providers: [
    provideSearch()
  ]
};
```

### 2. Create a Search Component

```typescript
// search.component.ts
import { Component, inject } from '@angular/core';
import { SearchProvider, RestApiAdapter } from '@ng-search/core';

@Component({
  selector: 'app-search',
  standalone: true,
  template: `
    <div class="search-container">
      <!-- Search Input -->
      <input 
        type="search"
        [value]="search.query()"
        (input)="onSearch($event)"
        placeholder="Search..." />

      <!-- Loading State -->
      @if (search.loading()) {
        <div class="loading">Searching...</div>
      }

      <!-- Error State -->
      @if (search.error()) {
        <div class="error">{{ search.error()?.message }}</div>
      }

      <!-- Empty State -->
      @if (search.isEmpty()) {
        <div class="empty">No results found</div>
      }

      <!-- Results -->
      <div class="results">
        @for (result of search.results(); track result.id) {
          <div class="result-item">
            <h3>{{ result.data.title }}</h3>
            <p>{{ result.data.description }}</p>
          </div>
        }
      </div>

      <!-- Pagination -->
      @if (search.hasResults()) {
        <div class="pagination">
          <button 
            (click)="search.prevPage()"
            [disabled]="!search.hasPrevPage()">
            Previous
          </button>
          
          <span>
            Page {{ search.currentPage() }} of {{ search.totalPages() }}
          </span>
          
          <button 
            (click)="search.nextPage()"
            [disabled]="!search.hasNextPage()">
            Next
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .search-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    
    input[type="search"] {
      width: 100%;
      padding: 12px;
      font-size: 16px;
      border: 2px solid #ddd;
      border-radius: 8px;
      margin-bottom: 20px;
    }
    
    .result-item {
      padding: 16px;
      border: 1px solid #eee;
      border-radius: 8px;
      margin-bottom: 12px;
    }
    
    .pagination {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 16px;
      margin-top: 20px;
    }
    
    button {
      padding: 8px 16px;
      border: 1px solid #ddd;
      border-radius: 4px;
      background: white;
      cursor: pointer;
    }
    
    button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    
    .loading, .error, .empty {
      padding: 20px;
      text-align: center;
    }
    
    .error {
      color: #d32f2f;
    }
  `]
})
export class SearchComponent {
  search = inject(SearchProvider);

  ngOnInit() {
    // Initialize with your backend adapter
    const adapter = new RestApiAdapter({
      type: 'custom',
      endpoint: 'https://api.example.com',
      credentials: {
        apiKey: 'your-api-key'
      }
    });

    this.search.initialize(adapter, {
      debounceTime: 300,
      pageSize: 10,
      minQueryLength: 2
    });
  }

  onSearch(event: Event) {
    const query = (event.target as HTMLInputElement).value;
    this.search.search(query);
  }
}
```

## Advanced Usage

### With Filters

```typescript
export class SearchWithFiltersComponent {
  search = inject(SearchProvider);

  // Add filter
  filterByCategory(category: string) {
    this.search.addFilter({
      field: 'category',
      type: 'term',
      value: category
    });
  }

  // Remove filter
  clearCategoryFilter() {
    this.search.removeFilter('category');
  }

  // Clear all filters
  clearAll() {
    this.search.clearFilters();
  }
}
```

### With Sorting

```typescript
export class SearchWithSortComponent {
  search = inject(SearchProvider);

  sortByDate() {
    this.search.setSort([
      { field: 'date', order: 'desc' }
    ]);
  }

  sortByRelevance() {
    this.search.setSort([
      { field: '_score', order: 'desc' }
    ]);
  }
}
```

### Component-Level Instance

For isolated search instances (e.g., multiple search components):

```typescript
import { provideSearchForComponent } from '@ng-search/core';

@Component({
  selector: 'app-product-search',
  standalone: true,
  providers: [provideSearchForComponent()], // Isolated instance
  template: `...`
})
export class ProductSearchComponent {
  search = inject(SearchProvider<Product>);
}
```

### Using Individual Services

For more control, inject services directly:

```typescript
import { SearchStateService, SearchCoordinatorService } from '@ng-search/core';

@Component({
  selector: 'app-custom-search',
  standalone: true,
  providers: [
    SearchStateService,
    SearchCoordinatorService
  ]
})
export class CustomSearchComponent {
  private state = inject(SearchStateService);
  private coordinator = inject(SearchCoordinatorService);

  // Access state signals
  query = this.state.query;
  results = this.state.results;
  loading = this.state.loading;

  // Control search
  search(query: string) {
    this.state.setQuery(query);
    // Coordinator automatically triggers search via effect
  }
}
```

## Creating a Custom Adapter

```typescript
import { BaseHttpAdapter, AdapterConfig, SearchQuery, SearchResponse } from '@ng-search/core';

export class MyCustomAdapter extends BaseHttpAdapter {
  constructor(config: AdapterConfig) {
    super(config);
  }

  search(query: SearchQuery): Observable<SearchResponse> {
    const url = `${this.config.endpoint}/search`;
    const headers = this.createHeaders();
    
    // Transform to your backend format
    const body = {
      q: query.query,
      limit: query.size,
      offset: query.from,
      // ... your custom format
    };

    return this.executeRequest(
      this.http.post(url, body, { headers })
    ).pipe(
      map(response => this.parseResponse(response))
    );
  }

  private parseResponse(response: any): SearchResponse {
    return {
      results: response.items.map(item => ({
        id: item.id,
        data: item,
        score: item.relevance
      })),
      total: response.totalCount,
      took: response.responseTime
    };
  }
}
```

## SSR Support

For server-side rendering:

```typescript
// Transfer state on server
export class SearchComponent {
  search = inject(SearchStateService);

  // Server-side
  getStateForTransfer() {
    return this.search.getSnapshot();
  }

  // Client-side (after hydration)
  restoreState(snapshot: any) {
    this.search.restoreSnapshot(snapshot);
  }
}
```

## TypeScript Types

Use generic types for type safety:

```typescript
interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
}

@Component({
  // ...
})
export class ProductSearchComponent {
  search = inject(SearchProvider<Product>);

  // results is now typed as Signal<SearchResult<Product>[]>
  products = this.search.results;
}
```

## Next Steps

- Check out the [full API documentation](./API.md)
- Learn about [custom facets](./FACETS.md)
- Explore [advanced configuration](./CONFIGURATION.md)
