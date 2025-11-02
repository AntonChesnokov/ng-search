/**
 * Text Facet Component
 * Displays checkbox or radio list for text values
 * Zone-less compatible, SSR-safe
 */

import { Component, ChangeDetectionStrategy, input, output, signal, computed } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { FacetPlugin, FacetValue, FacetOption, TextFacetConfig } from '../../../types/facet-types';
import { toggleSelection, filterFacetValues, hasSelections } from '../../../utils/facet-utils';

@Component({
  selector: 'ng-text-facet',
  standalone: true,
  imports: [FormsModule],
  styleUrls: [
    '../facet-base.component.css',
    './text-facet.component.css',
  ],
  template: `
    <div class="ng-facet ng-text-facet">
      <div class="ng-facet-header">
        <h4 class="ng-facet-title">{{ config().label }}</h4>
        @if (hasSelections()) {
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

      @if (isSearchable()) {
        <div class="ng-facet-search">
          <input
            type="text"
            class="ng-facet-search-input"
            placeholder="Search..."
            [(ngModel)]="searchQuery"
            (ngModelChange)="onSearchChange($event)"
            aria-label="Search facet options"
          />
        </div>
      }

      <div class="ng-facet-values" [attr.role]="isMultiSelect() ? 'group' : 'radiogroup'">
        @for (value of filteredValues(); track value.key) {
          <label class="ng-facet-value" [class.ng-facet-value-disabled]="value.disabled">
            <input
              [type]="isMultiSelect() ? 'checkbox' : 'radio'"
              [name]="config().id"
              [value]="value.key"
              [checked]="isSelected(value.key)"
              [disabled]="value.disabled"
              (change)="toggleValue(value.key)"
              [attr.aria-label]="value.label"
            />
            <span class="ng-facet-value-label">{{ value.label }}</span>
            @if (value.count !== undefined && value.count > 0) {
              <span class="ng-facet-value-count">({{ value.count }})</span>
            }
          </label>
        }

        @if (filteredValues().length === 0) {
          <div class="ng-facet-empty">No options found</div>
        }
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TextFacetComponent implements FacetPlugin {
  // Inputs
  readonly config = input.required<TextFacetConfig>();
  readonly values = input<FacetValue[] | FacetOption[]>([]);
  readonly selectedValues = input<Set<string | number>>(new Set());

  // Outputs
  readonly selectionChange = output<Set<string | number>>();
  readonly onSelectionChange = (values: Set<string | number>) => {
    this.selectionChange.emit(values);
  };

  // Internal state
  readonly searchQuery = signal('');
  readonly filteredValues = computed(() => {
    const query = this.searchQuery();
    const vals = this.values() as FacetValue[];
    return filterFacetValues(vals, query) as FacetValue[];
  });

  // Computed properties
  readonly isMultiSelect = computed(() => this.config().multiSelect ?? true);
  readonly isSearchable = computed(() => this.config().searchable ?? false);
  readonly hasSelections = computed(() => hasSelections(this.selectedValues()));

  // Methods
  toggleValue(value: string | number): void {
    const newSelection = toggleSelection(this.selectedValues(), value, this.isMultiSelect());
    this.onSelectionChange(newSelection);
  }

  isSelected(value: string | number): boolean {
    return this.selectedValues().has(value);
  }

  clearAll(): void {
    this.onSelectionChange(new Set());
  }

  onSearchChange(query: string): void {
    this.searchQuery.set(query);
  }
}
