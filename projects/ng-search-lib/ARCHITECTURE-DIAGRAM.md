# @ng-search/core - Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      Consumer Application                        │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌───────────┐ │
│  │ SearchBox  │  │Suggestions │  │  Results   │  │  Facets   │ │
│  └─────┬──────┘  └──────┬─────┘  └──────┬─────┘  └─────┬─────┘ │
│        │                │               │              │        │
│        └────────────────┴───────────────┴──────────────┘        │
│                              │                                   │
└──────────────────────────────┼───────────────────────────────────┘
                               │
                    ┌──────────▼──────────┐
                    │  @ng-search/core    │
                    └──────────┬──────────┘
                               │
        ┏━━━━━━━━━━━━━━━━━━━━━━┻━━━━━━━━━━━━━━━━━━━━━━┓
        ┃                                              ┃
┌───────▼────────┐              ┌────────────────────▼──────────┐
│  State Layer   │              │     Plugin System             │
│ ┌────────────┐ │              │ ┌──────────────────────────┐  │
│ │   Search   │ │              │ │   Facet Registry         │  │
│ │   State    │ │              │ │  ┌─────────────────────┐ │  │
│ │  (Signals) │ │              │ │  │ CheckboxFacet       │ │  │
│ └────────────┘ │              │ │  │ RangeFacet          │ │  │
│                │              │ │  │ ToggleFacet         │ │  │
│ ┌────────────┐ │              │ │  │ Custom Facets...    │ │  │
│ │Coordinator │ │              │ │  └─────────────────────┘ │  │
│ │  Service   │ │              │ └──────────────────────────┘  │
│ └────────────┘ │              └───────────────────────────────┘
└────────┬───────┘
         │
┌────────▼───────────────────────────────────────────────────────┐
│                     Adapter Layer                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │  OpenSearch  │  │   Algolia    │  │  Custom API  │  ...    │
│  │   Adapter    │  │   Adapter    │  │   Adapter    │         │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘         │
└─────────┼──────────────────┼──────────────────┼────────────────┘
          │                  │                  │
          ▼                  ▼                  ▼
    ┌─────────┐        ┌─────────┐      ┌─────────┐
    │OpenSearch│        │ Algolia │      │Custom API│
    │  Server  │        │ Service │      │  Server  │
    └──────────┘        └─────────┘      └──────────┘
```

## Data Flow

### Search Flow
```
User Input
    │
    ▼
SearchBox Component
    │ (debounced)
    ▼
SearchStateService (signal update)
    │
    ▼
SearchCoordinatorService
    │
    ▼
SearchAdapter (transform query)
    │
    ▼
Backend API
    │
    ▼
SearchAdapter (parse response)
    │
    ▼
SearchStateService (signal update)
    │
    ▼
Results Component (renders)
```

### Facet Flow
```
Facet Component (user selection)
    │
    ▼
FacetPlugin.onSelectionChange()
    │
    ▼
SearchStateService (add filter)
    │
    ▼
SearchCoordinatorService (trigger search)
    │
    ▼
Backend API (with filters)
    │
    ▼
Results Updated
```

## Key Principles

### 1. Backend Agnostic ⭐
```typescript
// Any backend works!
SearchAdapter<T> {
  search(query: SearchQuery): Observable<SearchResponse<T>>
  suggest?(query: string): Observable<Suggestion[]>
}

// Consumers don't know about the backend
searchState.search(query); // Works with any adapter
```

### 2. Signal-Based Reactivity ⚡
```typescript
// State is managed with signals
const query = signal('');
const results = signal<SearchResult[]>([]);
const loading = signal(false);

// Computed for derived state
const hasResults = computed(() => results().length > 0);
```

### 3. Plugin Architecture 🔌
```typescript
// Register custom facets
registry.register({
  type: 'custom-facet',
  component: MyCustomFacetComponent
});

// Use anywhere
<ngs-facet-container [facets]="facetConfigs" />
```

### 4. Zone-less Compatible 🚀
```typescript
// No NgZone dependencies
debounceFunction(() => search(), 300); // Pure JS
KeyboardNavigationHandler // No zone
Signals // Built-in zone-less support
```

## Component Architecture

### SearchBox
```
Input Field ──> Debounce ──> Signal Update ──> Search Trigger
                   │
                   └──> Suggestions Request
```

### Results
```
Results Signal ──> Virtual Scroll ──> Custom Renderer
      │
      ├──> Pagination
      ├──> Loading State
      └──> Empty State
```

### Facets
```
Facet Config ──> Registry ──> Component Resolution
                                      │
                                      ├──> CheckboxFacet
                                      ├──> RangeFacet
                                      └──> Custom Facets
```

## Extension Points

1. **Custom Adapters**: Implement `SearchAdapter<T>`
2. **Custom Facets**: Implement `FacetPlugin` + register
3. **Custom Result Renderers**: Provide `itemComponent` or `itemTemplate`
4. **Custom Suggestion Templates**: Provide `itemTemplate`
5. **Custom Query Builders**: Override in adapter
6. **Custom Response Parsers**: Override in adapter

---

**Status**: Architecture established and ready for implementation 🎯
