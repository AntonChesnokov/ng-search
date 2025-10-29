# @ng-search/core - Project Architecture

## Overview

This document outlines the architecture and design principles for the @ng-search/core library.

## Core Principles

### 1. Signal-Based State Management
- All state managed through Angular signals
- Computed signals for derived state
- WritableSignal for mutable state
- Effect for side effects

### 2. SSR Compatibility
- Platform-agnostic code (use isPlatformBrowser)
- No direct DOM manipulation in constructors
- Hydration-friendly state management
- Avoid browser-only APIs

### 3. Performance
- Virtual scrolling for large lists
- Deferrable views (@defer) for lazy loading
- OnPush change detection
- Minimal re-renders with signals

### 4. Extensibility
- Plugin-based facet system
- Custom templates for results/suggestions
- Injectable services for customization
- Type-safe APIs

## Directory Structure

```
projects/ng-search-lib/src/lib/
│
├── components/
│   ├── search-box/                    # Search input component
│   │   ├── search-box.component.ts
│   │   ├── search-box.component.html
│   │   ├── search-box.component.css
│   │   └── search-box.component.spec.ts
│   │
│   ├── suggestions/                    # Autocomplete dropdown
│   │   ├── suggestions.component.ts
│   │   ├── suggestions.component.html
│   │   ├── suggestions.component.css
│   │   ├── suggestions.component.spec.ts
│   │   └── suggestion-item.directive.ts  # Custom template directive
│   │
│   ├── results/                        # Results list
│   │   ├── results.component.ts
│   │   ├── results.component.html
│   │   ├── results.component.css
│   │   ├── results.component.spec.ts
│   │   ├── result-item.directive.ts     # Custom renderer
│   │   └── virtual-scroll.directive.ts  # Performance optimization
│   │
│   └── facets/                         # Facet system
│       ├── facet-container.component.ts  # Container for facets
│       ├── checkbox-facet/
│       │   ├── checkbox-facet.component.ts
│       │   └── checkbox-facet.component.spec.ts
│       ├── range-facet/
│       │   ├── range-facet.component.ts
│       │   └── range-facet.component.spec.ts
│       └── toggle-facet/
│           ├── toggle-facet.component.ts
│           └── toggle-facet.component.spec.ts
│
├── services/
│   ├── search-state.service.ts         # Central state management
│   ├── search-coordinator.service.ts   # Search execution
│   ├── facet-registry.service.ts       # Plugin registry
│   └── ssr-safe.service.ts            # SSR utilities
│
├── types/
│   ├── search-types.ts                 # Core search types
│   ├── facet-types.ts                  # Facet interfaces
│   └── component-types.ts              # Component interfaces
│
├── models/
│   ├── search-config.ts                # Configuration model
│   ├── search-result.ts                # Result model
│   └── facet-config.ts                 # Facet configuration
│
├── utils/
│   ├── search-utils.ts                 # Search utilities
│   ├── debounce.ts                     # Debouncing
│   └── keyboard-navigation.ts          # Keyboard handling
│
└── version.ts                          # Library version
```

## Component Design

### SearchBoxComponent
- **Inputs**: placeholder, initialQuery, debounceTime
- **Outputs**: searchQuery (using output())
- **Features**: 
  - Debounced input
  - Clear button
  - ARIA labels
  - Keyboard shortcuts (Esc to clear)

### SuggestionsComponent
- **Inputs**: suggestions, maxItems, customTemplate
- **Outputs**: suggestionSelected, suggestionHovered
- **Features**:
  - Keyboard navigation (Arrow keys, Enter, Esc)
  - Custom templates via ng-template
  - @defer for lazy rendering
  - Highlighting matched text

### ResultsComponent
- **Inputs**: results, loading, customRenderer, pageSize
- **Outputs**: resultClicked, pageChanged
- **Features**:
  - Virtual scrolling
  - Custom result renderers
  - Pagination
  - Loading states

### Facet System
- **Base Interface**: FacetPlugin
- **Built-in Types**: Checkbox, Range, Toggle
- **Features**:
  - Dynamic registration
  - Lazy loading
  - Custom facet types
  - State persistence

## Service Design

### SearchStateService
```typescript
{
  // Signals
  query: WritableSignal<string>
  filters: WritableSignal<Map<string, any>>
  results: WritableSignal<SearchResult[]>
  loading: WritableSignal<boolean>
  
  // Computed
  filteredResults: Signal<SearchResult[]>
  hasResults: Signal<boolean>
  
  // Methods
  setQuery(query: string): void
  addFilter(key: string, value: any): void
  clearFilters(): void
}
```

### SearchCoordinatorService
- Orchestrates search execution
- Handles debouncing
- Request cancellation
- Error handling

### FacetRegistryService
- Plugin registration
- Facet discovery
- Type validation
- Lazy loading

## Edge Cases & Solutions

### 1. Custom Result Renderers
- Use structural directive for custom templates
- Provide default renderer
- Type-safe context passing

### 2. Custom Suggestions
- ng-template with context
- Default suggestion template
- Highlighting service

### 3. Dynamic Facets
- Component factory for dynamic loading
- Registry pattern for discovery
- Lazy loaded bundles

### 4. SSR Considerations
- Check platform before DOM access
- Serialize state for transfer
- Hydration-safe initialization

### 5. Large Datasets
- Virtual scrolling with CDK
- Pagination with signal-based state
- Debouncing and throttling

### 6. URL State Sync
- Optional router integration
- Query parameter serialization
- Deep linking support

### 7. Accessibility
- ARIA labels and roles
- Keyboard navigation
- Screen reader support
- Focus management

## Next Steps

1. ✅ Initialize library structure
2. Define types and interfaces
3. Implement core services
4. Build components
5. Add tests
6. Create demo app
7. Documentation
