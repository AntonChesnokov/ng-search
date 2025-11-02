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
  ViewContainerRef,
  ComponentRef,
  Type,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { SearchStateService } from '../../services/search-state.service';
import { SSRSafeService } from '../../services/ssr-safe.service';
import type { SearchResult } from '../../types/search-types';
import type { ResultContext, ResultRenderer } from '../../types/component-types';

/**
 * Results Component
 *
 * Displays search results with:
 * - Custom templates or components for result items
 * - Pagination with configurable page size
 * - Loading, error, and empty states
 * - Virtual scrolling for large result sets
 * - Keyboard navigation
 * - Result highlighting
 * - @defer blocks for lazy rendering
 * - SSR compatibility
 *
 * @example
 * ```html
 * <ng-search-results
 *   [pageSize]="20"
 *   [showPagination]="true"
 *   (resultClick)="onResultClick($event)">
 *   <ng-template #resultTemplate let-result let-index="index">
 *     <div class="custom-result">
 *       <h3>{{ result.data.title }}</h3>
 *       <p>{{ result.data.description }}</p>
 *     </div>
 *   </ng-template>
 * </ng-search-results>
 * ```
 */
@Component({
  selector: 'ng-search-results',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./results.component.css'],
  template: `
    <div class="results-container" [attr.role]="'region'" [attr.aria-label]="ariaLabel()">
      @if (isLoading()) {
        <div class="results-loading" role="status">
          @if (customLoadingTemplate(); as template) {
            <ng-container *ngTemplateOutlet="template" />
          } @else {
            <div class="loading-spinner"></div>
            <p class="loading-text">{{ loadingText() }}</p>
          }
        </div>
      } @else if (hasError()) {
        <div class="results-error" role="alert">
          @if (customErrorTemplate(); as template) {
            <ng-container *ngTemplateOutlet="template; context: { $implicit: error() }" />
          } @else {
            <div class="error-icon">⚠️</div>
            <h3 class="error-title">{{ errorTitle() }}</h3>
            <p class="error-message">{{ error()?.message || errorMessage() }}</p>
            @if (showRetry()) {
              <button type="button" class="retry-button" (click)="retry.emit()">
                {{ retryText() }}
              </button>
            }
          }
        </div>
      } @else if (isEmpty()) {
        <div class="results-empty" role="status">
          @if (customEmptyTemplate(); as template) {
            <ng-container *ngTemplateOutlet="template" />
          } @else {
            <div class="empty-icon">🔍</div>
            <h3 class="empty-title">{{ emptyTitle() }}</h3>
            <p class="empty-message">{{ emptyMessage() }}</p>
          }
        </div>
      } @else {
        @defer (when shouldRender()) {
          <!-- Results header with count and sort -->
          @if (showResultsInfo()) {
            <div class="results-header">
              <div class="results-count">
                {{ getResultsCountText() }}
              </div>
              @if (showSort() && sortOptions().length > 0) {
                <div class="results-sort">
                  <label for="sort-select">{{ sortLabel() }}</label>
                  <select
                    id="sort-select"
                    [value]="currentSortValue()"
                    (change)="onSortChange($event)"
                    class="sort-select"
                  >
                    @for (option of sortOptions(); track option.value) {
                      <option [value]="option.value">{{ option.label }}</option>
                    }
                  </select>
                </div>
              }
            </div>
          }

          <!-- Virtual scrolling viewport -->
          @if (enableVirtualScroll()) {
            <div
              class="results-virtual-viewport"
              [style.height.px]="virtualScrollHeight()"
              (scroll)="onVirtualScroll($event)"
              #viewport
            >
              <div class="results-virtual-spacer" [style.height.px]="totalVirtualHeight()">
                <ul
                  class="results-list"
                  [attr.role]="'list'"
                  [style.transform]="'translateY(' + virtualScrollOffset() + 'px)'"
                >
                  @for (result of visibleResults(); track trackByFn(result, $index)) {
                    <li
                      class="result-item"
                      [attr.role]="'listitem'"
                      [attr.id]="'result-' + $index"
                      [class.highlighted]="highlightedIndex() === $index"
                      (click)="selectResult(result, $index)"
                      (mouseenter)="highlightIndex($index)"
                    >
                      <ng-container
                        *ngTemplateOutlet="renderResult; context: createContext(result, $index)"
                      />
                    </li>
                  }
                </ul>
              </div>
            </div>
          } @else {
            <!-- Standard list rendering -->
            <ul class="results-list" [attr.role]="'list'">
              @for (result of displayedResults(); track trackByFn(result, $index)) {
                <li
                  class="result-item"
                  [attr.role]="'listitem'"
                  [attr.id]="'result-' + $index"
                  [class.highlighted]="highlightedIndex() === $index"
                  (click)="selectResult(result, $index)"
                  (mouseenter)="highlightIndex($index)"
                >
                  <ng-container
                    *ngTemplateOutlet="renderResult; context: createContext(result, $index)"
                  />
                </li>
              }
            </ul>
          }

          <!-- Pagination -->
          @if (showPagination() && totalPages() > 1) {
            <div class="results-pagination" role="navigation" aria-label="Pagination">
              <button
                type="button"
                class="pagination-button"
                [disabled]="!hasPreviousPage()"
                (click)="previousPage()"
                [attr.aria-label]="'Previous page'"
              >
                ‹
              </button>

              @for (page of visiblePages(); track page) {
                @if (page === '...') {
                  <span class="pagination-ellipsis">...</span>
                } @else {
                  <button
                    type="button"
                    class="pagination-button"
                    [class.active]="page === currentPage()"
                    (click)="goToPage(page)"
                    [attr.aria-label]="'Page ' + page"
                    [attr.aria-current]="page === currentPage() ? 'page' : null"
                  >
                    {{ page }}
                  </button>
                }
              }

              <button
                type="button"
                class="pagination-button"
                [disabled]="!hasNextPage()"
                (click)="nextPage()"
                [attr.aria-label]="'Next page'"
              >
                ›
              </button>

              @if (showPageSize()) {
                <select
                  class="page-size-select"
                  [value]="pageSize()"
                  (change)="onPageSizeChange($event)"
                  [attr.aria-label]="'Items per page'"
                >
                  @for (size of pageSizeOptions(); track size) {
                    <option [value]="size">{{ size }} per page</option>
                  }
                </select>
              }
            </div>
          }
        } @placeholder {
          <div class="results-placeholder">
            <div class="loading-spinner"></div>
          </div>
        }
      }
    </div>

    <!-- Template for rendering individual results -->
    <ng-template #renderResult let-result let-index="index" let-total="total" let-query="query">
      @if (customResultTemplate(); as template) {
        <ng-container
          *ngTemplateOutlet="template; context: { $implicit: result, index, total, query }"
        />
      } @else {
        <div class="result-default">
          <div class="result-title">
            <span [innerHTML]="highlightText(result.data?.title || 'Untitled', query)"></span>
          </div>
          @if (result.data?.description) {
            <p
              class="result-description"
              [innerHTML]="highlightText(result.data.description, query)"
            ></p>
          }
          @if (result.score !== undefined && showScore()) {
            <div class="result-score">Score: {{ result.score.toFixed(2) }}</div>
          }
          @if (result.metadata) {
            <div class="result-metadata">
              @for (entry of objectEntries(result.metadata); track entry[0]) {
                <span class="metadata-item">
                  <strong>{{ entry[0] }}:</strong> {{ entry[1] }}
                </span>
              }
            </div>
          }
        </div>
      }
    </ng-template>
  `,
  host: {
    class: 'ng-search-results',
  },
})
export class ResultsComponent<T = any> {
  private readonly searchState = inject(SearchStateService, { optional: true });
  private readonly ssrSafe = inject(SSRSafeService);

  // ViewChild references
  readonly viewportRef = viewChild<ElementRef<HTMLDivElement>>('viewport');

  // Content projection for custom templates
  readonly customResultTemplate = contentChild<TemplateRef<ResultContext<T>>>('resultTemplate');
  readonly customLoadingTemplate = contentChild<TemplateRef<void>>('loadingTemplate');
  readonly customErrorTemplate =
    contentChild<TemplateRef<{ $implicit: Error | null }>>('errorTemplate');
  readonly customEmptyTemplate = contentChild<TemplateRef<void>>('emptyTemplate');

  // Inputs - Display options
  readonly showResultsInfo = input<boolean>(true);
  readonly showPagination = input<boolean>(true);
  readonly showPageSize = input<boolean>(false);
  readonly showSort = input<boolean>(false);
  readonly showScore = input<boolean>(false);
  readonly showRetry = input<boolean>(true);
  readonly highlightQuery = input<boolean>(true);

  // Inputs - Text customization
  readonly ariaLabel = input<string>('Search results');
  readonly loadingText = input<string>('Loading results...');
  readonly emptyTitle = input<string>('No results found');
  readonly emptyMessage = input<string>('Try adjusting your search or filters');
  readonly errorTitle = input<string>('Something went wrong');
  readonly errorMessage = input<string>('An error occurred while loading results');
  readonly retryText = input<string>('Try again');
  readonly sortLabel = input<string>('Sort by:');
  readonly resultsCountText = input<string>('');

  // Inputs - Pagination
  readonly pageSize = input<number>(10);
  readonly pageSizeOptions = input<number[]>([10, 20, 50, 100]);
  readonly maxVisiblePages = input<number>(7);

  // Inputs - Virtual scrolling
  readonly enableVirtualScroll = input<boolean>(false);
  readonly virtualScrollHeight = input<number>(600);
  readonly itemHeight = input<number>(100);

  // Inputs - Sort options
  readonly sortOptions = input<{ value: string; label: string }[]>([]);

  // Outputs
  readonly resultClick = output<{ result: SearchResult<T>; index: number }>();
  readonly resultHighlighted = output<SearchResult<T> | null>();
  readonly pageChange = output<number>();
  readonly pageSizeChange = output<number>();
  readonly sortChange = output<string>();
  readonly retry = output<void>();

  // Internal state
  readonly highlightedIndex = signal<number>(-1);
  private readonly virtualScrollStartIndex = signal<number>(0);
  private readonly virtualScrollEndIndex = signal<number>(20);

  // Computed signals from search state
  readonly results = computed(() => {
    return (this.searchState?.results() as SearchResult<T>[]) ?? [];
  });

  readonly isLoading = computed(() => {
    return this.searchState?.loading() ?? false;
  });

  readonly error = computed(() => {
    return this.searchState?.error() ?? null;
  });

  readonly query = computed(() => {
    return this.searchState?.query() ?? '';
  });

  readonly total = computed(() => {
    return this.searchState?.total() ?? 0;
  });

  readonly currentPage = computed(() => {
    return this.searchState?.currentPage() ?? 1;
  });

  readonly currentSortValue = computed(() => {
    const sort = this.searchState?.sort() ?? [];
    return sort.length > 0 ? `${sort[0].field}-${sort[0].order}` : '';
  });

  // Computed display state
  readonly hasError = computed(() => this.error() !== null);
  readonly isEmpty = computed(() => {
    return !this.isLoading() && this.results().length === 0 && this.query().length > 0;
  });

  readonly shouldRender = computed(() => {
    return this.results().length > 0;
  });

  readonly displayedResults = computed(() => {
    return this.results();
  });

  // Pagination computed
  readonly totalPages = computed(() => {
    return Math.ceil(this.total() / this.pageSize());
  });

  readonly hasPreviousPage = computed(() => {
    return this.currentPage() > 1;
  });

  readonly hasNextPage = computed(() => {
    return this.currentPage() < this.totalPages();
  });

  readonly visiblePages = computed(() => {
    const current = this.currentPage();
    const total = this.totalPages();
    const max = this.maxVisiblePages();

    if (total <= max) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    const pages: (number | string)[] = [];
    const halfMax = Math.floor(max / 2);

    let start = Math.max(1, current - halfMax);
    let end = Math.min(total, current + halfMax);

    if (current <= halfMax) {
      end = max - 1;
    } else if (current >= total - halfMax) {
      start = total - max + 2;
    }

    if (start > 1) {
      pages.push(1);
      if (start > 2) pages.push('...');
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (end < total) {
      if (end < total - 1) pages.push('...');
      pages.push(total);
    }

    return pages;
  });

  // Virtual scrolling computed
  readonly totalVirtualHeight = computed(() => {
    return this.results().length * this.itemHeight();
  });

  readonly virtualScrollOffset = computed(() => {
    return this.virtualScrollStartIndex() * this.itemHeight();
  });

  readonly visibleResults = computed(() => {
    const start = this.virtualScrollStartIndex();
    const end = this.virtualScrollEndIndex();
    return this.results().slice(start, end);
  });

  /**
   * Get results count text
   */
  getResultsCountText(): string {
    const customText = this.resultsCountText();
    if (customText) return customText;

    const total = this.total();
    const current = this.currentPage();
    const size = this.pageSize();
    const start = (current - 1) * size + 1;
    const end = Math.min(current * size, total);

    if (total === 0) return 'No results';
    if (total === 1) return '1 result';
    if (this.showPagination()) {
      return `${start}-${end} of ${total} results`;
    }
    return `${total} results`;
  }

  /**
   * Select a result
   */
  selectResult(result: SearchResult<T>, index: number): void {
    this.resultClick.emit({ result, index });
    this.searchState?.markResultClicked(result, {
      index,
      origin: 'component',
    });
  }

  /**
   * Highlight result at index
   */
  highlightIndex(index: number): void {
    this.highlightedIndex.set(index);
    const results = this.displayedResults();
    if (index >= 0 && index < results.length) {
      this.resultHighlighted.emit(results[index]);
    } else {
      this.resultHighlighted.emit(null);
    }
  }

  /**
   * Go to specific page
   */
  goToPage(page: number | string): void {
    if (typeof page === 'number' && page >= 1 && page <= this.totalPages()) {
      this.searchState?.setPagination(page);
      this.pageChange.emit(page);
    }
  }

  /**
   * Go to next page
   */
  nextPage(): void {
    if (this.hasNextPage()) {
      this.goToPage(this.currentPage() + 1);
    }
  }

  /**
   * Go to previous page
   */
  previousPage(): void {
    if (this.hasPreviousPage()) {
      this.goToPage(this.currentPage() - 1);
    }
  }

  /**
   * Handle page size change
   */
  onPageSizeChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const size = parseInt(select.value, 10);
    this.searchState?.setPagination(1, size);
    this.pageSizeChange.emit(size);
  }

  /**
   * Handle sort change
   */
  onSortChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const value = select.value;
    const [field, order] = value.split('-');

    if (field && order) {
      this.searchState?.setSort([{ field, order: order as 'asc' | 'desc' }]);
      this.sortChange.emit(value);
    }
  }

  /**
   * Handle virtual scroll
   */
  onVirtualScroll(event: Event): void {
    if (!this.ssrSafe.isBrowser()) return;

    const viewport = event.target as HTMLElement;
    const scrollTop = viewport.scrollTop;
    const itemHeight = this.itemHeight();
    const bufferSize = 5;

    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - bufferSize);
    const visibleCount = Math.ceil(this.virtualScrollHeight() / itemHeight) + bufferSize * 2;
    const endIndex = Math.min(this.results().length, startIndex + visibleCount);

    this.virtualScrollStartIndex.set(startIndex);
    this.virtualScrollEndIndex.set(endIndex);
  }

  /**
   * Create context for custom template
   */
  createContext(result: SearchResult<T>, index: number): ResultContext<T> {
    return {
      $implicit: result,
      index,
      total: this.total(),
      query: this.query(),
    };
  }

  /**
   * Track by function for results
   */
  trackByFn(result: SearchResult<T>, index: number): string {
    return result.id || `${index}`;
  }

  /**
   * Highlight text based on query
   */
  highlightText(text: string, query: string): string {
    if (!this.highlightQuery() || !query || !text) {
      return text;
    }

    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedQuery})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }

  /**
   * Get object entries for template
   */
  objectEntries(obj: Record<string, any>): [string, any][] {
    return Object.entries(obj);
  }
}
