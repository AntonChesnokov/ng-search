# Custom Templates Guide

The `@ng-search/core` library provides flexible template customization for both search results and suggestions. This allows you to render any custom UI that matches your specific data structure and design requirements.

## Table of Contents
- [Custom Result Templates](#custom-result-templates)
- [Custom Suggestion Templates](#custom-suggestion-templates)
- [Template Context](#template-context)
- [Complete Examples](#complete-examples)

## Custom Result Templates

### Basic Usage

Use the `#resultTemplate` template reference to customize how search results are displayed:

```html
<ng-search-results>
  <ng-template #resultTemplate let-result let-index="index" let-query="query">
    <!-- Your custom result UI here -->
    <div class="my-custom-result">
      <h3>{{ result.data.title }}</h3>
      <p>{{ result.data.description }}</p>
    </div>
  </ng-template>
</ng-search-results>
```

### Available Context Variables

| Variable | Type | Description |
|----------|------|-------------|
| `$implicit` (or `result`) | `SearchResult<T>` | The search result object |
| `index` | `number` | Zero-based index of the result in current page |
| `total` | `number` | Total number of results |
| `query` | `string` | Current search query |

### SearchResult Structure

```typescript
interface SearchResult<T> {
  id: string;           // Unique identifier
  data: T;             // Your custom data object
  score?: number;      // Relevance score (0-1)
  highlights?: Record<string, string[]>; // Highlighted text snippets
  metadata?: Record<string, any>;        // Additional metadata
}
```

### Advanced Example

```html
<ng-search-results [pageSize]="20" [showPagination]="true">
  <ng-template #resultTemplate let-result let-index="index">
    <article class="search-result">
      <!-- Numbered badge -->
      <div class="result-number">{{ index + 1 }}</div>
      
      <div class="result-content">
        <!-- Title with category badge -->
        <h3>
          {{ result.data.title }}
          <span class="badge">{{ result.data.category }}</span>
        </h3>
        
        <!-- Description -->
        <p>{{ result.data.description }}</p>
        
        <!-- Footer with metadata -->
        <div class="result-footer">
          <!-- Difficulty level -->
          @if (result.data.difficulty) {
            <span class="difficulty" [attr.data-level]="result.data.difficulty">
              {{ result.data.difficulty }}
            </span>
          }
          
          <!-- Tags -->
          @if (result.data.tags && result.data.tags.length > 0) {
            <div class="tags">
              @for (tag of result.data.tags; track tag) {
                <span class="tag">{{ tag }}</span>
              }
            </div>
          }
          
          <!-- Relevance score -->
          @if (result.score !== undefined) {
            <span class="score">{{ result.score.toFixed(2) }}</span>
          }
        </div>
      </div>
    </article>
  </ng-template>
</ng-search-results>
```

## Custom Suggestion Templates

### Basic Usage

Use the `#suggestionTemplate` template reference to customize how suggestions are displayed:

```html
<ng-search-suggestions>
  <ng-template #suggestionTemplate let-suggestion let-index="index">
    <!-- Your custom suggestion UI here -->
    <div class="my-custom-suggestion">
      {{ suggestion.text }}
    </div>
  </ng-template>
</ng-search-suggestions>
```

### Available Context Variables

| Variable | Type | Description |
|----------|------|-------------|
| `$implicit` (or `suggestion`) | `Suggestion` | The suggestion object |
| `index` | `number` | Zero-based index of the suggestion |
| `highlighted` | `boolean` | Whether this suggestion is highlighted (keyboard navigation) |
| `query` | `string` | Current search query |

### Suggestion Structure

```typescript
interface Suggestion {
  id?: string;                    // Optional unique identifier
  text: string;                   // Suggestion text to display
  type?: string;                  // Type of suggestion (e.g., 'query', 'recent', 'popular')
  count?: number;                 // Number of results for this suggestion
  metadata?: Record<string, any>; // Additional metadata
}
```

### Advanced Example

```html
<ng-search-suggestions [maxSuggestions]="8">
  <ng-template #suggestionTemplate 
               let-suggestion 
               let-index="index" 
               let-highlighted="highlighted">
    <div class="custom-suggestion" [class.active]="highlighted">
      <!-- Icon based on type -->
      <div class="icon">
        @if (suggestion.metadata?.type === 'tutorial') {
          📚
        } @else if (suggestion.metadata?.type === 'guide') {
          📖
        } @else {
          🔍
        }
      </div>
      
      <!-- Content -->
      <div class="content">
        <div class="title">{{ suggestion.text }}</div>
        @if (suggestion.metadata?.category) {
          <div class="category">{{ suggestion.metadata.category }}</div>
        }
      </div>
      
      <!-- Result count badge -->
      @if (suggestion.count !== undefined) {
        <span class="count-badge">{{ suggestion.count }}</span>
      }
    </div>
  </ng-template>
</ng-search-suggestions>
```

## Template Context

### Using Template Variables

You can destructure the context in multiple ways:

**Implicit variable (default):**
```html
<ng-template #resultTemplate let-result>
  {{ result.data.title }}
</ng-template>
```

**Named variables:**
```html
<ng-template #resultTemplate let-result="$implicit" let-idx="index">
  {{ idx }}: {{ result.data.title }}
</ng-template>
```

**Multiple variables:**
```html
<ng-template #suggestionTemplate 
             let-suggestion 
             let-index="index" 
             let-highlighted="highlighted"
             let-query="query">
  <!-- Access all context variables -->
</ng-template>
```

## Complete Examples

### E-Commerce Product Search

```html
<ng-search-results>
  <ng-template #resultTemplate let-product="result">
    <div class="product-card">
      <img [src]="product.data.imageUrl" [alt]="product.data.name">
      <div class="product-info">
        <h3>{{ product.data.name }}</h3>
        <div class="price">{{ product.data.price | currency }}</div>
        <div class="rating">
          ⭐ {{ product.data.rating }} ({{ product.data.reviewCount }} reviews)
        </div>
        <button (click)="addToCart(product.data)">Add to Cart</button>
      </div>
    </div>
  </ng-template>
</ng-search-results>
```

### Documentation Search with Code Snippets

```html
<ng-search-results>
  <ng-template #resultTemplate let-doc="result">
    <article class="doc-result">
      <header>
        <h3>{{ doc.data.title }}</h3>
        <span class="version">v{{ doc.data.version }}</span>
      </header>
      
      <p>{{ doc.data.description }}</p>
      
      @if (doc.data.codeSnippet) {
        <pre><code [highlight]="doc.data.codeSnippet"></code></pre>
      }
      
      <footer>
        <a [routerLink]="['/docs', doc.id]">View Full Documentation →</a>
      </footer>
    </article>
  </ng-template>
</ng-search-results>
```

### User/Contact Search with Avatars

```html
<ng-search-results>
  <ng-template #resultTemplate let-user="result">
    <div class="user-card">
      <img class="avatar" [src]="user.data.avatarUrl" [alt]="user.data.name">
      <div class="user-info">
        <h4>{{ user.data.name }}</h4>
        <p class="email">{{ user.data.email }}</p>
        <p class="role">{{ user.data.role }}</p>
      </div>
      <button (click)="viewProfile(user.data)">View Profile</button>
    </div>
  </ng-template>
</ng-search-results>
```

### Search History Suggestions

```html
<ng-search-suggestions>
  <ng-template #suggestionTemplate let-suggestion let-highlighted="highlighted">
    <div class="history-suggestion" [class.highlighted]="highlighted">
      <span class="icon">🕐</span>
      <span class="text">{{ suggestion.text }}</span>
      <button class="remove" (click)="removeHistory($event, suggestion)">×</button>
    </div>
  </ng-template>
</ng-search-suggestions>
```

## Styling Custom Templates

You can style your custom templates using:

1. **Component styles** - Scoped to your component
2. **Global styles** - In `styles.css`
3. **CSS classes** - Applied conditionally based on data

### Example Component Styles

```css
/* app.component.css */
.custom-result {
  display: flex;
  gap: 16px;
  padding: 20px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.custom-result:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-color: #667eea;
}

.custom-suggestion {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  cursor: pointer;
}

.custom-suggestion.active {
  background-color: #f0f4ff;
}
```

## TypeScript Integration

Define your custom data types for better type safety:

```typescript
// Define your data structure
interface Tutorial {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
}

// Use in your component
export class AppComponent {
  searchProvider = inject(SearchProvider<Tutorial>);
  
  // Your custom result will be typed as SearchResult<Tutorial>
}
```

## Best Practices

1. **Keep templates simple** - Complex logic should be in your component
2. **Use @if/@for** - Leverage Angular control flow for cleaner templates
3. **Handle missing data** - Always check for optional properties
4. **Accessibility** - Include proper ARIA attributes
5. **Performance** - Use `track` in @for loops for better rendering
6. **Responsive** - Consider mobile layouts in your custom templates
7. **Keyboard navigation** - Respect the `highlighted` state in suggestions

## Loading States

Both components provide templates for loading, error, and empty states:

```html
<ng-search-results>
  <!-- Custom loading state -->
  <ng-template #loadingTemplate>
    <div class="custom-loading">
      <div class="spinner"></div>
      <p>Searching for results...</p>
    </div>
  </ng-template>
  
  <!-- Custom error state -->
  <ng-template #errorTemplate let-error>
    <div class="custom-error">
      <h3>Oops! Something went wrong</h3>
      <p>{{ error.message }}</p>
      <button (click)="retry()">Try Again</button>
    </div>
  </ng-template>
  
  <!-- Custom empty state -->
  <ng-template #emptyTemplate>
    <div class="custom-empty">
      <div class="empty-icon">🔍</div>
      <h3>No results found</h3>
      <p>Try adjusting your search terms</p>
    </div>
  </ng-template>
  
  <!-- Main result template -->
  <ng-template #resultTemplate let-result>
    <!-- Your result UI -->
  </ng-template>
</ng-search-results>
```

## Learn More

- See the demo application in `/src/app` for complete working examples
- Check the component source code for all available inputs and outputs
- Refer to the main README for general usage and API documentation
