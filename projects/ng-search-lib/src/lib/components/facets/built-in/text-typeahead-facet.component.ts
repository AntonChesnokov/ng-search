/**
 * Text Typeahead Facet Component
 * Searchable text input with autocomplete suggestions
 * Zone-less compatible, SSR-safe
 */

import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  signal,
  computed,
  effect,
} from '@angular/core';

import { FormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, switchMap, catchError, of } from 'rxjs';
import { FacetPlugin, FacetOption, TextTypeaheadFacetConfig } from '../../../types/facet-types';
import { toggleSelection, hasSelections } from '../../../utils/facet-utils';

@Component({
  selector: 'ng-text-typeahead-facet',
  standalone: true,
  imports: [FormsModule],
  styleUrls: [
    '../facet-base.component.css',
    './text-typeahead-facet.component.css',
  ],
  template: `
    <div class="ng-facet ng-typeahead-facet">
      <div class="ng-facet-header">
        <h4 class="ng-facet-title">{{ config().label }}</h4>
        @if (hasActiveSelections()) {
          <button
            type="button"
            class="ng-facet-clear"
            (click)="clearAll()"
            aria-label="Clear selections"
          >
            Clear
          </button>
        }
      </div>

      <div class="ng-typeahead-container">
        <input
          type="text"
          class="ng-typeahead-input"
          [placeholder]="'Search ' + config().label.toLowerCase() + '...'"
          [(ngModel)]="searchQuery"
          (focus)="onFocus()"
          (blur)="onBlur()"
          [attr.aria-label]="'Search ' + config().label"
          [attr.aria-expanded]="showDropdown()"
          [attr.aria-controls]="dropdownId()"
        />

        @if (showDropdown()) {
          <div class="ng-typeahead-dropdown" [id]="dropdownId()" role="listbox">
            @if (loading()) {
              <div class="ng-typeahead-loading">Loading...</div>
            } @else if (filteredOptions().length > 0) {
              @for (option of filteredOptions(); track option.value) {
                <div
                  class="ng-typeahead-option"
                  [class.ng-typeahead-option-selected]="isSelected(option.value)"
                  (mousedown)="selectOption(option.value)"
                  role="option"
                  [attr.aria-selected]="isSelected(option.value)"
                >
                  <span class="ng-typeahead-option-label">{{ option.label }}</span>
                  @if (option.count !== undefined && option.count > 0) {
                    <span class="ng-typeahead-option-count">({{ option.count }})</span>
                  }
                </div>
              }
            } @else {
              <div class="ng-typeahead-empty">No options found</div>
            }
          </div>
        }
      </div>

      @if (selectedOptions().length > 0) {
        <div class="ng-selected-tags">
          @for (option of selectedOptions(); track option.value) {
            <span class="ng-selected-tag">
              {{ option.label }}
              <button
                type="button"
                class="ng-tag-remove"
                (click)="removeSelection(option.value)"
                [attr.aria-label]="'Remove ' + option.label"
              >
                ×
              </button>
            </span>
          }
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TextTypeaheadFacetComponent implements FacetPlugin {
  // Inputs
  readonly config = input.required<TextTypeaheadFacetConfig>();
  readonly values = input<FacetOption[]>([]);
  readonly selectedValues = input<Set<string | number>>(new Set());

  // Outputs
  readonly selectionChange = output<Set<string | number>>();
  readonly onSelectionChange = (values: Set<string | number>) => {
    this.selectionChange.emit(values);
  };

  // Internal state
  readonly searchQuery = signal('');
  readonly loading = signal(false);
  readonly focused = signal(false);
  readonly availableOptions = signal<FacetOption[]>([]);

  // Computed
  readonly dropdownId = computed(() => `typeahead-${this.config().id}`);
  readonly isMultiSelect = computed(() => this.config().multiSelect ?? false);
  readonly minQueryLength = computed(() => this.config().minQueryLength ?? 1);
  readonly hasActiveSelections = computed(() => hasSelections(this.selectedValues()));

  readonly showDropdown = computed(
    () => this.focused() && this.searchQuery().length >= this.minQueryLength()
  );

  readonly filteredOptions = computed(() => {
    const options = this.availableOptions().length > 0 ? this.availableOptions() : this.values();
    const query = this.searchQuery().toLowerCase();

    if (!query) return options;

    return options.filter((opt) => opt.label.toLowerCase().includes(query));
  });

  readonly selectedOptions = computed(() => {
    const selected = this.selectedValues();
    const allOptions = this.values();
    return allOptions.filter((opt) => selected.has(opt.value));
  });

  constructor() {
    // Watch for search query changes and fetch options if provider exists
    effect(() => {
      const query = this.searchQuery();
      const provider = this.config().optionsProvider;

      if (query.length >= this.minQueryLength() && provider) {
        this.loading.set(true);

        provider(query)
          .pipe(
            debounceTime(this.config().debounceTime ?? 300),
            distinctUntilChanged(),
            switchMap((options) => of(options)),
            catchError(() => of([]))
          )
          .subscribe((options) => {
            this.availableOptions.set(options);
            this.loading.set(false);
          });
      }
    });
  }

  selectOption(value: string | number): void {
    const newSelection = toggleSelection(this.selectedValues(), value, this.isMultiSelect());
    this.onSelectionChange(newSelection);

    // Clear search and close dropdown for single select
    if (!this.isMultiSelect()) {
      this.searchQuery.set('');
      this.focused.set(false);
    }
  }

  removeSelection(value: string | number): void {
    const newSelection = new Set(this.selectedValues());
    newSelection.delete(value);
    this.onSelectionChange(newSelection);
  }

  isSelected(value: string | number): boolean {
    return this.selectedValues().has(value);
  }

  clearAll(): void {
    this.onSelectionChange(new Set());
  }

  onFocus(): void {
    this.focused.set(true);
  }

  onBlur(): void {
    // Delay to allow click events to fire
    setTimeout(() => this.focused.set(false), 200);
  }
}
