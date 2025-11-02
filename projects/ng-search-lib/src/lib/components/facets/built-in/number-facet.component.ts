/**
 * Number Facet Component
 * Single number input with min/max validation
 * Zone-less compatible, SSR-safe
 */

import { Component, ChangeDetectionStrategy, input, output, signal, computed } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { FacetPlugin, NumberFacetConfig, FacetOption } from '../../../types/facet-types';
import { validateNumberRange, clampNumber, hasSelections } from '../../../utils/facet-utils';

@Component({
  selector: 'ng-number-facet',
  standalone: true,
  imports: [FormsModule],
  styleUrls: [
    '../facet-base.component.css',
    './number-facet.component.css',
  ],
  template: `
    <div class="ng-facet ng-number-facet">
      <div class="ng-facet-header">
        <h4 class="ng-facet-title">{{ config().label }}</h4>
        @if (hasActiveSelections()) {
          <button
            type="button"
            class="ng-facet-clear"
            (click)="clearValue()"
            aria-label="Clear value"
          >
            Clear
          </button>
        }
      </div>

      <div class="ng-number-input-container">
        <input
          type="number"
          class="ng-number-input"
          [placeholder]="config().placeholder ?? 'Enter value'"
          [(ngModel)]="inputValue"
          [attr.min]="config().min"
          [attr.max]="config().max"
          [step]="config().step ?? 1"
          (blur)="onInputBlur()"
          (keyup.enter)="applyValue()"
          [attr.aria-label]="config().label"
        />

        <button
          type="button"
          class="ng-number-apply"
          (click)="applyValue()"
          [disabled]="!isValidValue()"
        >
          Apply
        </button>
      </div>

      @if (validationError()) {
        <div class="ng-number-error">{{ validationError() }}</div>
      }

      @if (config().min !== undefined || config().max !== undefined) {
        <div class="ng-number-hint">
          @if (config().min !== undefined && config().max !== undefined) {
            Range: {{ config().min }} - {{ config().max }}
          } @else if (config().min !== undefined) {
            Min: {{ config().min }}
          } @else {
            Max: {{ config().max }}
          }
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NumberFacetComponent implements FacetPlugin {
  // Inputs
  readonly config = input.required<NumberFacetConfig>();
  readonly values = input<FacetOption[]>([]);
  readonly selectedValues = input<Set<string | number>>(new Set());

  // Outputs
  readonly selectionChange = output<Set<string | number>>();
  readonly onSelectionChange = (values: Set<string | number>) => {
    this.selectionChange.emit(values);
  };

  // Internal state
  readonly inputValue = signal<number | null>(null);
  readonly validationError = signal<string>('');

  // Computed
  readonly hasActiveSelections = computed(() => hasSelections(this.selectedValues()));

  readonly isValidValue = computed(() => {
    const value = this.inputValue();
    if (value === null) return false;

    const isValid = validateNumberRange(value, this.config().min, this.config().max);
    return isValid;
  });

  constructor() {
    // Initialize with selected value if exists
    const selected = Array.from(this.selectedValues());
    if (selected.length > 0 && typeof selected[0] === 'number') {
      this.inputValue.set(selected[0] as number);
    }
  }

  applyValue(): void {
    const value = this.inputValue();

    if (value === null) {
      this.validationError.set('Please enter a value');
      return;
    }

    // Validate range
    if (!this.isValidValue()) {
      const min = this.config().min;
      const max = this.config().max;
      if (min !== undefined && max !== undefined) {
        this.validationError.set(`Value must be between ${min} and ${max}`);
      } else if (min !== undefined) {
        this.validationError.set(`Value must be at least ${min}`);
      } else if (max !== undefined) {
        this.validationError.set(`Value must be at most ${max}`);
      }
      return;
    }

    this.validationError.set('');
    const clampedValue = clampNumber(value, this.config().min, this.config().max);
    this.onSelectionChange(new Set([clampedValue]));
  }

  clearValue(): void {
    this.inputValue.set(null);
    this.validationError.set('');
    this.onSelectionChange(new Set());
  }

  onInputBlur(): void {
    // Clear validation error on blur if value is empty
    if (this.inputValue() === null) {
      this.validationError.set('');
    }
  }
}
