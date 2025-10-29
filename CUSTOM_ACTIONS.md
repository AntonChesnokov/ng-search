# Custom Search Actions Guide

The search box component uses content projection for all action buttons, giving you complete control over the UI and behavior. There are no built-in search buttons - you project your own and trigger search through the SearchProvider service or component events.

## Content Projection

Use the `searchActions` selector to project custom buttons or controls into the search box:

```html
<ngs-search-box>
  <div searchActions>
    <!-- Your custom buttons/actions here -->
  </div>
</ngs-search-box>
```

## Triggering Search

There are two ways to trigger search from your custom buttons:

### 1. Using SearchProvider Service (Recommended)

```typescript
import { SearchProvider } from '@ng-search/core';

export class MyComponent {
  searchProvider = inject(SearchProvider);
}
```

```html
<ngs-search-box>
  <button searchActions (click)="searchProvider.executeSearch()">
    Search
  </button>
</ngs-search-box>
```

### 2. Using Component's Search Event

```html
<ngs-search-box (search)="onSearch($event)">
  <button searchActions (click)="triggerSearch()">
    Search
  </button>
</ngs-search-box>
```

```typescript
onSearch(query: string): void {
  // Handle search
}
```

## Basic Example

```html
<ngs-search-box
  [value]="searchQuery()"
  (queryChange)="onQueryChange($event)">
  
  <button searchActions (click)="searchProvider.executeSearch()">
    🔍 Search
  </button>
</ngs-search-box>
```

## Multiple Custom Actions

```html
## Multiple Custom Actions

```html
<ngs-search-box (search)="onSearch($event)">
  <div searchActions class="search-actions">
    <button 
      class="search-btn"
      [disabled]="!searchQuery()"
      (click)="searchProvider.executeSearch()">
      🔍 Search
    </button>
    
    <button 
      class="filter-btn"
      (click)="openFilters()">
      🎯 Filters
    </button>
    
    <button 
      class="voice-btn"
      (click)="startVoiceSearch()">
      🎤 Voice
    </button>
  </div>
</ngs-search-box>
```

## Advanced Example - Dropdown Menu

```html
<ngs-search-box>
  <div searchActions class="actions-wrapper">
    <button class="primary-search" (click)="searchProvider.executeSearch()">
      Search
    </button>
    
    <div class="dropdown">
      <button class="dropdown-toggle" (click)="toggleMenu()">
        ⚙️
      </button>
      @if (menuOpen()) {
        <div class="dropdown-menu">
          <button (click)="searchInTitles()">Search in titles only</button>
          <button (click)="searchInContent()">Search in content</button>
          <button (click)="advancedSearch()">Advanced search</button>
        </div>
      }
    </div>
  </div>
</ngs-search-box>
```

## Example - Search with Scope Selector

```html
<ngs-search-box>
  <div searchActions class="search-with-scope">
    <select [(ngModel)]="searchScope" class="scope-select">
      <option value="all">All</option>
      <option value="titles">Titles</option>
      <option value="content">Content</option>
      <option value="tags">Tags</option>
    </select>
    
    <button class="search-btn" (click)="searchInScope()">
      Search
    </button>
  </div>
</ngs-search-box>
```

## Example - Icon-Only Buttons

```html
<ngs-search-box>
  <div searchActions class="icon-actions">
    <button 
      class="icon-btn" 
      title="Search"
      (click)="searchProvider.executeSearch()">
      <svg><!-- search icon --></svg>
    </button>
    
    <button 
      class="icon-btn" 
      title="Filters"
      (click)="toggleFilters()">
      <svg><!-- filter icon --></svg>
    </button>
    
    <button 
      class="icon-btn" 
      title="Settings"
      (click)="openSettings()">
      <svg><!-- settings icon --></svg>
    </button>
  </div>
</ngs-search-box>
```
```

## Advanced Example - Dropdown Menu

```html
<ngs-search-box [showSearchButton]="false">
  <div searchActions class="actions-wrapper">
    <button class="primary-search" (click)="search()">
      Search
    </button>
    
    <div class="dropdown">
      <button class="dropdown-toggle" (click)="toggleMenu()">
        ⚙️
      </button>
      @if (menuOpen()) {
        <div class="dropdown-menu">
          <button (click)="searchInTitles()">Search in titles only</button>
          <button (click)="searchInContent()">Search in content</button>
          <button (click)="advancedSearch()">Advanced search</button>
        </div>
      }
    </div>
  </div>
</ngs-search-box>
```

## Example - Search with Scope Selector

```html
<ngs-search-box [showSearchButton]="false">
  <div searchActions class="search-with-scope">
    <select [(ngModel)]="searchScope" class="scope-select">
      <option value="all">All</option>
      <option value="titles">Titles</option>
      <option value="content">Content</option>
      <option value="tags">Tags</option>
    </select>
    
    <button class="search-btn" (click)="searchInScope()">
      Search
    </button>
  </div>
</ngs-search-box>
```

## Example - Icon-Only Buttons

```html
<ngs-search-box [showSearchButton]="false">
  <div searchActions class="icon-actions">
    <button 
      class="icon-btn" 
      title="Search"
      (click)="search()">
      <svg><!-- search icon --></svg>
    </button>
    
    <button 
      class="icon-btn" 
      title="Filters"
      (click)="toggleFilters()">
      <svg><!-- filter icon --></svg>
    </button>
    
    <button 
      class="icon-btn" 
      title="Settings"
      (click)="openSettings()">
      <svg><!-- settings icon --></svg>
    </button>
  </div>
</ngs-search-box>
```

## Styling Custom Actions

### Basic Styles

```css
/* Container for custom actions */
.search-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

/* Custom button styles */
.search-btn {
  padding: 12px 24px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.search-btn:hover:not(:disabled) {
  background: #2563eb;
  transform: translateY(-1px);
}

.search-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.filter-btn {
  padding: 12px 20px;
  background: white;
  color: #3b82f6;
  border: 2px solid #3b82f6;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.filter-btn:hover {
  background: #eff6ff;
}
```

### Icon Button Styles

```css
.icon-actions {
  display: flex;
  gap: 4px;
}

.icon-btn {
  padding: 8px;
  background: transparent;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  color: #64748b;
  transition: all 0.2s;
}

.icon-btn:hover {
  background: #f1f5f9;
  color: #334155;
}

.icon-btn svg {
  width: 20px;
  height: 20px;
}
```

### Responsive Design

```css
.search-actions {
  display: flex;
  gap: 8px;
}

@media (max-width: 640px) {
  .search-actions {
    flex-direction: column;
    width: 100%;
  }
  
  .search-actions button {
    width: 100%;
  }
}
```

## Component Integration

### TypeScript

```typescript
import { Component, signal, inject } from '@angular/core';
import { SearchBoxComponent, SearchProvider } from '@ng-search/core';

@Component({
  selector: 'app-search',
  imports: [SearchBoxComponent],
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.css']
})
export class SearchComponent {
  searchProvider = inject(SearchProvider);
  searchQuery = signal<string>('');
  filtersOpen = signal<boolean>(false);
  
  onQueryChange(query: string): void {
    this.searchQuery.set(query);
    this.searchProvider.state.setQuery(query);
  }
  
  openFilters(): void {
    this.filtersOpen.set(true);
  }
  
  startVoiceSearch(): void {
    // Implement voice search
    if ('webkitSpeechRecognition' in window) {
      // Voice search logic
    }
  }
}
```

### Template

```html
<ngs-search-box
  [value]="searchQuery()"
  (queryChange)="onQueryChange($event)">
  
  <div searchActions>
    <button (click)="searchProvider.executeSearch()">
      🔍 Search
    </button>
    <button (click)="openFilters()">
      🎯 Filters
    </button>
    <button (click)="startVoiceSearch()">
      🎤 Voice
    </button>
  </div>
</ngs-search-box>
```

## Use Cases

### 1. E-Commerce Site

```html
<ngs-search-box [showSearchButton]="false">
  <div searchActions>
    <button (click)="search()">Search Products</button>
    <button (click)="scanBarcode()">📷 Scan</button>
    <button (click)="viewCart()">🛒 Cart ({{ cartCount() }})</button>
  </div>
</ngs-search-box>
```

### 2. Documentation Portal

```html
<ngs-search-box [showSearchButton]="false">
  <div searchActions>
    <select [(ngModel)]="version">
      <option value="latest">Latest</option>
      <option value="v2">v2.0</option>
      <option value="v1">v1.0</option>
    </select>
    <button (click)="search()">Search Docs</button>
  </div>
</ngs-search-box>
```

### 3. Advanced Search Features

```html
<ngs-search-box [showSearchButton]="false">
  <div searchActions>
    <button (click)="search()">Search</button>
    <button 
      [class.active]="exactMatch()"
      (click)="toggleExactMatch()">
      "Exact"
    </button>
    <button 
      [class.active]="caseSensitive()"
      (click)="toggleCaseSensitive()">
      Aa
    </button>
    <button (click)="openAdvanced()">Advanced</button>
  </div>
</ngs-search-box>
```

### 4. Social Media Search

```html
<ngs-search-box [showSearchButton]="false">
  <div searchActions>
    <button (click)="search()">Search</button>
    <button (click)="searchImages()">📷</button>
    <button (click)="searchVideos()">🎥</button>
    <button (click)="searchPeople()">👤</button>
  </div>
</ngs-search-box>
```

## Combining with Default Features

You can still use the built-in features alongside custom actions:

```html
<ngs-search-box
  [showSearchButton]="false"
  [showClearButton]="true"
  [showSearchIcon]="true"
  [loading]="isSearching()">
  
  <div searchActions>
    <!-- Your custom actions -->
  </div>
</ngs-search-box>
```

## Best Practices

1. **Keep it simple** - Don't overcrowd the search box with too many actions
2. **Mobile-first** - Ensure actions work well on small screens
3. **Accessibility** - Include proper aria-labels and keyboard support
4. **Visual hierarchy** - Make the primary search action most prominent
5. **Consistent placement** - Keep action buttons in predictable locations
6. **Loading states** - Disable buttons during search operations
7. **Tooltips** - Add tooltips for icon-only buttons

## Accessibility

Ensure your custom actions are accessible:

```html
<ngs-search-box [showSearchButton]="false">
  <div searchActions>
    <button
      type="button"
      aria-label="Search"
      (click)="search()">
      🔍
    </button>
    
    <button
      type="button"
      aria-label="Open filters"
      aria-expanded="false"
      aria-controls="filters-panel"
      (click)="toggleFilters()">
      Filters
    </button>
  </div>
</ngs-search-box>
```

## Notes

- The `searchActions` selector is required for content projection to work
- Custom actions are positioned after the clear button (if shown)
- You can disable the default search button with `[showSearchButton]="false"`
- Custom actions inherit the search box's disabled state context
- Actions are rendered in the order they appear in your template
