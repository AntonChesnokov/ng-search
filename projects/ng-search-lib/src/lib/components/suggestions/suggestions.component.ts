import {
  Component,
  input,
  output,
  signal,
  computed,
  effect,
  viewChild,
  ElementRef,
  TemplateRef,
  contentChild,
  ChangeDetectionStrategy,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { SearchStateService } from '../../services/search-state.service';
import { SSRSafeService } from '../../services/ssr-safe.service';
import { KeyboardNavigationHandler } from '../../utils/keyboard-navigation';
import type { Suggestion } from '../../types/search-types';
import type { SuggestionContext } from '../../types/component-types';

/**
 * Suggestions Component
 *
 * Displays search suggestions with:
 * - Custom templates via content projection
 * - Keyboard navigation (Arrow up/down, Enter, Escape)
 * - @defer blocks for lazy rendering
 * - SSR compatibility
 * - Accessibility support
 * - Signal-based reactivity
 *
 * @example
 * ```html
 * <ng-search-suggestions
 *   [maxSuggestions]="10"
 *   [highlightQuery]="true"
 *   (suggestionSelected)="onSelect($event)">
 *   <ng-template #suggestionTemplate let-suggestion let-index="index">
 *     <div class="custom-suggestion">
 *       <strong>{{ suggestion.text }}</strong>
 *       <span>{{ suggestion.count }} results</span>
 *     </div>
 *   </ng-template>
 * </ng-search-suggestions>
 * ```
 */
@Component({
  selector: 'ng-search-suggestions',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./suggestions.component.css'],
  template: `
    @if (isVisible()) {
      <div
        class="suggestions-container"
        [attr.role]="'listbox'"
        [attr.aria-label]="ariaLabel()"
        (keydown)="handleKeydown($event)"
        #container
      >
        @defer (when shouldRender()) {
          @if (isLoading()) {
            <div class="suggestions-loading" role="status">
              <span class="loading-spinner"></span>
              <span class="loading-text">{{ loadingText() }}</span>
            </div>
          } @else if (displayedSuggestions().length > 0) {
            <ul class="suggestions-list" role="presentation">
              @for (suggestion of displayedSuggestions(); track trackBy(suggestion, $index)) {
                <li
                  class="suggestion-item"
                  [class.highlighted]="highlightedIndex() === $index"
                  [attr.role]="'option'"
                  [attr.aria-selected]="highlightedIndex() === $index"
                  [attr.id]="'suggestion-' + $index"
                  (click)="selectSuggestion(suggestion)"
                  (mouseenter)="highlightIndex($index)"
                >
                  @if (customTemplate(); as template) {
                    <ng-container
                      *ngTemplateOutlet="template; context: createContext(suggestion, $index)"
                    />
                  } @else {
                    <div class="suggestion-default">
                      @if (showIcon()) {
                        <span class="suggestion-icon" [innerHTML]="searchIcon"></span>
                      }
                      <span class="suggestion-text" [innerHTML]="formatSuggestionText(suggestion)">
                      </span>
                      @if (suggestion.count !== undefined) {
                        <span class="suggestion-count">{{ suggestion.count }}</span>
                      }
                    </div>
                  }
                </li>
              }
            </ul>

            @if (hasMoreSuggestions()) {
              <div class="suggestions-footer">
                <button type="button" class="show-more-button" (click)="showAllSuggestions.emit()">
                  {{ showMoreText() }}
                </button>
              </div>
            }
          } @else if (showNoResults()) {
            <div class="suggestions-empty" role="status">
              {{ noResultsText() }}
            </div>
          }
        } @placeholder {
          <div class="suggestions-placeholder">
            <span class="loading-spinner"></span>
          </div>
        }
      </div>
    }
  `,
  host: {
    class: 'ng-search-suggestions',
  },
})
export class SuggestionsComponent {
  private readonly searchState = inject(SearchStateService, { optional: true });
  private readonly ssrSafe = inject(SSRSafeService);

  // ViewChild references
  readonly containerRef = viewChild<ElementRef<HTMLDivElement>>('container');

  // Content projection for custom template
  readonly customTemplate = contentChild<TemplateRef<SuggestionContext>>('suggestionTemplate');

  // Inputs
  readonly maxSuggestions = input<number>(10);
  readonly highlightQuery = input<boolean>(true);
  readonly showIcon = input<boolean>(true);
  readonly showNoResults = input<boolean>(false);
  readonly loadingText = input<string>('Loading suggestions...');
  readonly noResultsText = input<string>('No suggestions found');
  readonly showMoreText = input<string>('Show all suggestions');
  readonly ariaLabel = input<string>('Search suggestions');
  readonly minQueryLength = input<number>(1);
  readonly autoHighlightFirst = input<boolean>(true);
  readonly closeOnSelect = input<boolean>(true);

  // Outputs
  readonly suggestionSelected = output<Suggestion>();
  readonly suggestionHighlighted = output<Suggestion | null>();
  readonly showAllSuggestions = output<void>();
  readonly visibilityChange = output<boolean>();

  // Internal state
  private keyboardNav: KeyboardNavigationHandler | null = null;
  private manuallyHidden = signal<boolean>(false);
  private lastQuery = signal<string>('');

  readonly highlightedIndex = signal<number>(-1);
  readonly isVisible = signal<boolean>(false);

  // Computed signals
  readonly suggestions = computed(() => {
    return this.searchState?.suggestions() ?? [];
  });

  readonly isLoading = computed(() => {
    return this.searchState?.loadingSuggestions() ?? false;
  });

  readonly query = computed(() => {
    return this.searchState?.query() ?? '';
  });

  readonly displayedSuggestions = computed(() => {
    const suggestions = this.suggestions();
    const max = this.maxSuggestions();
    return max > 0 ? suggestions.slice(0, max) : suggestions;
  });

  readonly hasMoreSuggestions = computed(() => {
    return this.suggestions().length > this.maxSuggestions();
  });

  readonly shouldRender = computed(() => {
    const query = this.query();
    const minLength = this.minQueryLength();
    return query.length >= minLength;
  });

  // Search icon SVG
  readonly searchIcon = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="11" cy="11" r="8"></circle>
      <path d="m21 21-4.35-4.35"></path>
    </svg>
  `;

  constructor() {
    // Auto-highlight first suggestion when list changes
    effect(() => {
      const suggestions = this.displayedSuggestions();
      const autoHighlight = this.autoHighlightFirst();

      if (suggestions.length > 0 && autoHighlight && this.highlightedIndex() === -1) {
        this.highlightedIndex.set(0);
        this.emitHighlightedSuggestion();
      } else if (suggestions.length === 0) {
        this.highlightedIndex.set(-1);
      }
    });

    // Show suggestions when available, hide when query is cleared
    // Respect manual dismissal - only show again when query changes
    effect(() => {
      const suggestions = this.displayedSuggestions();
      const loading = this.isLoading();
      const query = this.query();
      const queryChanged = query !== this.lastQuery();

      // Reset manual dismissal flag when query changes
      if (queryChanged) {
        this.lastQuery.set(query);
        this.manuallyHidden.set(false);
      }

      // Only auto-show if not manually hidden
      if (!this.manuallyHidden()) {
        const shouldShow = (suggestions.length > 0 || loading) && query.length > 0;

        if (shouldShow !== this.isVisible()) {
          this.isVisible.set(shouldShow);
          this.visibilityChange.emit(shouldShow);
        }
      }
    });

    // Handle clicks outside to close suggestions
    if (this.ssrSafe.isBrowser()) {
      effect(() => {
        const container = this.containerRef();

        if (container && this.isVisible()) {
          const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;

            // Don't hide if clicking inside the suggestions container
            if (container.nativeElement.contains(target)) {
              return;
            }

            // Don't hide if clicking on the search input
            // Find the search input by checking if target is an input with class containing 'search'
            const isSearchInput =
              (target as HTMLElement).classList?.contains('ng-search-input') ||
              (target as HTMLElement).closest('.ng-search-box') !== null;

            if (isSearchInput) {
              return;
            }

            // Hide suggestions for any other outside click
            this.hideSuggestions();
          };

          // Add listener after a small delay to avoid immediate closure
          const timeoutId = window.setTimeout(() => {
            document.addEventListener('click', handleClickOutside);
          }, 100);

          // Cleanup
          return () => {
            window.clearTimeout(timeoutId);
            document.removeEventListener('click', handleClickOutside);
          };
        }

        return undefined;
      });
    }
  }

  /**
   * Handle keyboard events
   */
  handleKeydown(event: KeyboardEvent): void {
    const { key } = event;

    switch (key) {
      case 'ArrowDown':
        event.preventDefault();
        this.navigateSuggestions('down');
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.navigateSuggestions('up');
        break;
      case 'Enter':
        event.preventDefault();
        this.selectHighlightedSuggestion();
        break;
      case 'Escape':
        event.preventDefault();
        this.hideSuggestions();
        break;
    }
  }

  /**
   * Navigate suggestions using keyboard
   */
  private navigateSuggestions(direction: 'up' | 'down'): void {
    const suggestions = this.displayedSuggestions();
    if (suggestions.length === 0) return;

    const currentIndex = this.highlightedIndex();
    let newIndex: number;

    if (direction === 'down') {
      newIndex = currentIndex < suggestions.length - 1 ? currentIndex + 1 : 0;
    } else {
      newIndex = currentIndex > 0 ? currentIndex - 1 : suggestions.length - 1;
    }

    this.highlightIndex(newIndex);
    this.scrollToHighlighted();
  }

  /**
   * Highlight suggestion at given index
   */
  highlightIndex(index: number): void {
    this.highlightedIndex.set(index);
    this.emitHighlightedSuggestion();
  }

  /**
   * Select the currently highlighted suggestion
   */
  private selectHighlightedSuggestion(): void {
    const index = this.highlightedIndex();
    const suggestions = this.displayedSuggestions();

    if (index >= 0 && index < suggestions.length) {
      this.selectSuggestion(suggestions[index]);
    }
  }

  /**
   * Select a suggestion
   */
  selectSuggestion(suggestion: Suggestion): void {
    this.suggestionSelected.emit(suggestion);
    this.searchState?.markSuggestionSelected(suggestion, {
      index: this.highlightedIndex(),
      origin: 'component',
    });

    if (this.closeOnSelect()) {
      this.hideSuggestions();
    }
  }

  /**
   * Hide suggestions dropdown
   */
  hideSuggestions(): void {
    this.isVisible.set(false);
    this.highlightedIndex.set(-1);
    this.visibilityChange.emit(false);
    this.manuallyHidden.set(true);
  }

  /**
   * Show suggestions dropdown
   */
  showSuggestions(): void {
    if (this.displayedSuggestions().length > 0 || this.isLoading()) {
      this.isVisible.set(true);
      this.visibilityChange.emit(true);
      this.manuallyHidden.set(false);
    }
  }

  /**
   * Scroll to highlighted suggestion
   */
  private scrollToHighlighted(): void {
    if (!this.ssrSafe.isBrowser()) return;

    const container = this.containerRef();
    const index = this.highlightedIndex();

    if (container && index >= 0) {
      const element = container.nativeElement.querySelector(`#suggestion-${index}`);
      if (element) {
        element.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }

  /**
   * Emit the currently highlighted suggestion
   */
  private emitHighlightedSuggestion(): void {
    const index = this.highlightedIndex();
    const suggestions = this.displayedSuggestions();

    if (index >= 0 && index < suggestions.length) {
      this.suggestionHighlighted.emit(suggestions[index]);
    } else {
      this.suggestionHighlighted.emit(null);
    }
  }

  /**
   * Format suggestion text with query highlighting
   */
  formatSuggestionText(suggestion: Suggestion): string {
    if (!this.highlightQuery()) {
      return suggestion.text;
    }

    const query = this.query().trim();
    if (!query) {
      return suggestion.text;
    }

    // Escape special regex characters in query
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedQuery})`, 'gi');

    return suggestion.text.replace(regex, '<mark>$1</mark>');
  }

  /**
   * Create context for custom template
   */
  createContext(suggestion: Suggestion, index: number): SuggestionContext {
    return {
      $implicit: suggestion,
      index,
      highlighted: this.highlightedIndex() === index,
      query: this.query(),
    };
  }

  /**
   * Track by function for suggestions
   */
  trackBy(suggestion: Suggestion, index: number): string {
    return suggestion.id || `${suggestion.text}-${index}`;
  }
}
