/**
 * Search Box Component
 * Standalone, signal-based search input with debouncing and keyboard navigation
 * Zone-less compatible, SSR-safe
 */

import {
  Component,
  input,
  output,
  signal,
  computed,
  effect,
  viewChild,
  ElementRef,
  inject,
  ChangeDetectionStrategy,
} from '@angular/core';
import { SSRSafeService } from '../../services/ssr-safe.service';
import { debounceFunction } from '../../utils/debounce';

@Component({
  selector: 'ng-search-box',
  standalone: true,
  styleUrls: ['./search-box.component.css'],
  template: `
    <div class="ng-search-box" [class.ng-disabled]="disabled()">
      <div class="ng-search-input-wrapper">
        <div class="ng-input-container">
          @if (showSearchIcon()) {
            <span class="ng-search-icon" aria-hidden="true">
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M9 17A8 8 0 1 0 9 1a8 8 0 0 0 0 16zM19 19l-4.35-4.35"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </span>
          }

          <input
            #searchInput
            type="text"
            class="ng-search-input"
            [value]="value()"
            [placeholder]="placeholder()"
            [disabled]="disabled()"
            [attr.aria-label]="ariaLabel()"
            [attr.aria-describedby]="ariaDescribedby()"
            [attr.aria-controls]="ariaControls()"
            [attr.aria-expanded]="ariaExpanded()"
            [attr.autocomplete]="autocomplete()"
            (input)="onInput($event)"
            (keydown)="onKeyDown($event)"
            (focus)="onFocus()"
            (blur)="onBlur()"
          />

          @if (showClearButton() && value()) {
            <button
              type="button"
              class="ng-clear-button"
              [attr.aria-label]="clearButtonLabel()"
              (click)="clearInput()"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 4L4 12M4 4l8 8"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </button>
          }
        </div>

        <!-- Content projection for custom buttons/actions -->
        <ng-content select="[searchActions]" />
      </div>

      @if (loading()) {
        <div class="ng-loading-indicator" role="status" aria-live="polite">
          <span class="ng-spinner"></span>
          <span class="ng-sr-only">Searching...</span>
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchBoxComponent {
  private readonly ssrSafe = inject(SSRSafeService);

  // Input signals using input() function
  readonly value = input<string>('');
  readonly placeholder = input<string>('Search...');
  readonly debounceTime = input<number>(300);
  readonly minQueryLength = input<number>(0);
  readonly disabled = input<boolean>(false);
  readonly autoFocus = input<boolean>(false);
  readonly showClearButton = input<boolean>(true);
  readonly showSearchIcon = input<boolean>(true);
  readonly loading = input<boolean>(false);
  readonly disableAutoSearch = input<boolean>(false);
  readonly ariaLabel = input<string>('Search');
  readonly ariaDescribedby = input<string | undefined>(undefined);
  readonly ariaControls = input<string | undefined>(undefined);
  readonly ariaExpanded = input<boolean | undefined>(undefined);
  readonly autocomplete = input<string>('off');
  readonly clearButtonLabel = input<string>('Clear search');

  // Output signals using output() function
  readonly queryChange = output<string>();
  readonly search = output<string>();
  readonly clear = output<void>();
  readonly focus = output<void>();
  readonly blur = output<void>();
  readonly keyDown = output<KeyboardEvent>();

  // View child
  private readonly searchInput = viewChild<ElementRef<HTMLInputElement>>('searchInput');

  // Internal state
  private readonly internalValue = signal<string>('');
  private readonly isFocused = signal<boolean>(false);

  // Debounced search function
  private debouncedSearch = debounceFunction((query: string) => {
    if (this.shouldTriggerSearch(query)) {
      this.search.emit(query);
    }
  }, this.debounceTime());

  constructor() {
    // Sync internal value with input
    effect(() => {
      this.internalValue.set(this.value());
    });

    // Auto-focus if requested
    effect(() => {
      if (this.autoFocus() && this.ssrSafe.isBrowser()) {
        this.ssrSafe.setTimeout(() => {
          this.focusInput();
        }, 0);
      }
    });

    // Update debounced function when debounceTime changes
    effect(() => {
      const time = this.debounceTime();
      this.debouncedSearch = debounceFunction((query: string) => {
        if (this.shouldTriggerSearch(query)) {
          this.search.emit(query);
        }
      }, time);
    });
  }

  /**
   * Handle input event
   */
  onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    const query = target.value;

    this.internalValue.set(query);
    this.queryChange.emit(query);

    // Trigger debounced search only if auto-search is not disabled
    if (!this.disableAutoSearch()) {
      this.debouncedSearch(query);
    }
  }

  /**
   * Handle key down event
   */
  onKeyDown(event: KeyboardEvent): void {
    this.keyDown.emit(event);

    // Enter key triggers immediate search
    if (event.key === 'Enter') {
      event.preventDefault();
      const query = this.internalValue();
      if (this.shouldTriggerSearch(query)) {
        this.search.emit(query);
      }
    }

    // Escape key clears input
    if (event.key === 'Escape') {
      event.preventDefault();
      this.clearInput();
    }
  }

  /**
   * Handle focus event
   */
  onFocus(): void {
    this.isFocused.set(true);
    this.focus.emit();
  }

  /**
   * Handle blur event
   */
  onBlur(): void {
    this.isFocused.set(false);
    this.blur.emit();
  }

  /**
   * Clear input
   */
  clearInput(): void {
    this.internalValue.set('');
    this.queryChange.emit('');
    this.clear.emit();
    this.search.emit('');
    this.focusInput();
  }

  /**
   * Focus input element
   */
  focusInput(): void {
    const input = this.searchInput();
    if (input && this.ssrSafe.isBrowser()) {
      input.nativeElement.focus();
    }
  }

  /**
   * Blur input element
   */
  blurInput(): void {
    const input = this.searchInput();
    if (input && this.ssrSafe.isBrowser()) {
      input.nativeElement.blur();
    }
  }

  /**
   * Trigger immediate search
   */
  triggerSearch(): void {
    const query = this.internalValue();
    if (this.shouldTriggerSearch(query)) {
      this.search.emit(query);
    }
  }

  /**
   * Check if search should be triggered
   */
  private shouldTriggerSearch(query: string): boolean {
    const trimmed = query.trim();
    return trimmed.length === 0 || trimmed.length >= this.minQueryLength();
  }
}
