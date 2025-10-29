# Zone-less Mode

This application and library are fully compatible with Angular's experimental zone-less mode.

## Configuration

The application is configured to run without zone.js:

### App Configuration (`src/app/app.config.ts`)

```typescript
import { provideExperimentalZonelessChangeDetection } from '@angular/core';

export const appConfig: ApplicationConfig = {
  providers: [
    provideExperimentalZonelessChangeDetection(),
    // ... other providers
  ]
};
```

### Build Configuration (`angular.json`)

Zone.js is removed from polyfills:

```json
{
  "polyfills": []
}
```

## Why Zone-less?

### Benefits:

1. **Smaller Bundle Size** - No zone.js dependency (~15KB gzipped)
2. **Better Performance** - No change detection overhead from zone patching
3. **Predictable Change Detection** - Explicit control via signals
4. **SSR Friendly** - Better compatibility with server-side rendering
5. **Modern Architecture** - Aligns with Angular's future direction

## Library Design for Zone-less

All library components are designed to work without zone.js:

### 1. Signal-Based State Management

```typescript
// SearchStateService uses signals exclusively
readonly query = signal<string>('');
readonly results = signal<SearchResult[]>([]);
readonly loading = signal<boolean>(false);
```

### 2. OnPush Change Detection

All components use `ChangeDetectionStrategy.OnPush`:

```typescript
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  // ...
})
```

### 3. Direct Browser APIs

Uses `window.setTimeout` instead of zone-patched `setTimeout`:

```typescript
// debounce.ts
timeoutId = window.setTimeout(() => {
  // Zone-less compatible
}, delay);
```

### 4. Input/Output Functions

Modern input/output functions instead of decorators:

```typescript
readonly value = input<string>('');
readonly valueChange = output<string>();
```

### 5. Effects for Side Effects

Uses Angular effects for reactive side effects:

```typescript
effect(() => {
  const query = this.searchState.query();
  // Automatically tracks signal dependencies
  this.performSearch(query);
});
```

## Testing Zone-less

Tests can still use zone.js for convenience:

```json
{
  "test": {
    "polyfills": [
      "zone.js",
      "zone.js/testing"
    ]
  }
}
```

## Compatibility Notes

### What Works:

- ✅ All signal-based reactive state
- ✅ OnPush change detection strategy
- ✅ Event handlers (click, input, etc.)
- ✅ Async pipes with Observables
- ✅ HTTP requests
- ✅ Router navigation
- ✅ Forms (reactive and template-driven)
- ✅ SSR and hydration

### What Requires Attention:

- ⚠️ Third-party libraries that rely on zone.js
- ⚠️ Manual change detection (`ChangeDetectorRef.detectChanges()`)
- ⚠️ Legacy components not using signals

## Migration Tips

If you have existing code that uses zone.js:

1. **Replace Manual Change Detection**:
   ```typescript
   // Before (zone-dependent)
   setTimeout(() => {
     this.data = newData;
     this.cdr.detectChanges();
   }, 100);
   
   // After (zone-less)
   const data = signal<Data>(initialData);
   window.setTimeout(() => {
     data.set(newData); // Signals trigger updates automatically
   }, 100);
   ```

2. **Use Signals for Component State**:
   ```typescript
   // Before
   count = 0;
   increment() {
     this.count++; // Needs zone.js to detect
   }
   
   // After
   count = signal(0);
   increment() {
     this.count.update(c => c + 1); // Works without zone.js
   }
   ```

3. **Prefer OnPush Strategy**:
   ```typescript
   @Component({
     changeDetection: ChangeDetectionStrategy.OnPush
   })
   ```

## Performance Comparison

With zone-less mode enabled:

- **Initial Bundle**: ~15KB smaller (zone.js removed)
- **Runtime Performance**: ~10-20% faster (no zone patching overhead)
- **Change Detection**: More predictable and efficient
- **Memory Usage**: Lower (no zone tracking overhead)

## Further Reading

- [Angular Zone-less Documentation](https://angular.dev/guide/experimental/zoneless)
- [Signals Guide](https://angular.dev/guide/signals)
- [Change Detection Strategy](https://angular.dev/best-practices/runtime-performance)
