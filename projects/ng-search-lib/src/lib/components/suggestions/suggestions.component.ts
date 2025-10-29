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
  template: `
    @if (isVisible()) {
      <div
        class="suggestions-container"
        [attr.role]="'listbox'"
        [attr.aria-label]="ariaLabel()"
        (keydown)="handleKeydown($event)"
        #container>

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
                  (mouseenter)="highlightIndex($index)">

                  @if (customTemplate(); as template) {
                    <ng-container
                      *ngTemplateOutlet="template; context: createContext(suggestion, $index)" />
                  } @else {
                    <div class="suggestion-default">
                      @if (showIcon()) {
                        <span class="suggestion-icon" [innerHTML]="searchIcon"></span>
                      }
                      <span
                        class="suggestion-text"
                        [innerHTML]="formatSuggestionText(suggestion)">
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
                <button
                  type="button"
                  class="show-more-button"
                  (click)="showAllSuggestions.emit()">
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
  styles: [`
    .suggestions-container {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      margin-top: 4px;
      background: white;
      border: 1px solid #ddd;
      border-radius: 4px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      max-height: 400px;
      overflow-y: auto;
      z-index: 1000;
    }

    .suggestions-loading,
    .suggestions-empty,
    .suggestions-placeholder {
      padding: 16px;
      text-align: center;
      color: #666;
    }

    .loading-spinner {
      display: inline-block;
      width: 16px;
      height: 16px;
      border: 2px solid #f3f3f3;
      border-top: 2px solid #666;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin-right: 8px;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .loading-text {
      vertical-align: middle;
    }

    .suggestions-list {
      list-style: none;
      margin: 0;
      padding: 0;
    }

    .suggestion-item {
      padding: 12px 16px;
      cursor: pointer;
      border-bottom: 1px solid #f0f0f0;
      transition: background-color 0.15s ease;
    }

    .suggestion-item:last-child {
      border-bottom: none;
    }

    .suggestion-item:hover,
    .suggestion-item.highlighted {
      background-color: #f5f5f5;
    }

    .suggestion-default {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .suggestion-icon {
      flex-shrink: 0;
      width: 16px;
      height: 16px;
      opacity: 0.5;
    }

    .suggestion-icon :deep(svg) {
      width: 100%;
      height: 100%;
    }

    .suggestion-text {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .suggestion-text :deep(mark) {
      background-color: #fff3cd;
      font-weight: 600;
      padding: 0 2px;
    }

    .suggestion-count {
      flex-shrink: 0;
      font-size: 0.875em;
      color: #999;
    }

    .suggestions-footer {
      padding: 8px;
      border-top: 1px solid #f0f0f0;
      text-align: center;
    }

    .show-more-button {
      background: none;
      border: none;
      color: #0066cc;
      cursor: pointer;
      font-size: 0.875em;
      padding: 4px 8px;
      transition: color 0.15s ease;
    }

    .show-more-button:hover {
      color: #0052a3;
      text-decoration: underline;
    }
  `],
  host: {
    'class': 'ng-search-suggestions',
  }
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
            const isSearchInput = (target as HTMLElement).classList?.contains('ngs-search-input') ||
                                  (target as HTMLElement).closest('.ngs-search-box') !== null;

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
    this.manuallyHidden.set(true); // Mark as manually hidden
  }

  /**
   * Show suggestions dropdown
   */
  showSuggestions(): void {
    if (this.displayedSuggestions().length > 0 || this.isLoading()) {
      this.isVisible.set(true);
      this.visibilityChange.emit(true);
      this.manuallyHidden.set(false); // Reset manual hidden flag
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
