/**
 * Number Range Facet Component
 * Min/max inputs with optional slider
 * Zone-less compatible, SSR-safe
 */

import { Component, ChangeDetectionStrategy, input, output, signal, computed } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { FacetPlugin, NumberRangeFacetConfig, FacetOption } from '../../../types/facet-types';
import {
  validateNumberRange,
  clampNumber,
  formatNumberValue,
  hasSelections,
} from '../../../utils/facet-utils';

@Component({
  selector: 'ng-number-range-facet',
  standalone: true,
  imports: [FormsModule],
  styleUrls: [
    '../facet-base.component.css',
    './number-range-facet.component.css',
  ],
  template: `
    <div class="ng-facet ng-number-range-facet">
      <div class="ng-facet-header">
        <h4 class="ng-facet-title">{{ config().label }}</h4>
        @if (hasActiveSelections()) {
          <button
            type="button"
            class="ng-facet-clear"
            (click)="clearRange()"
            aria-label="Clear range"
          >
            Clear
          </button>
        }
      </div>

      <div class="ng-range-inputs">
        <div class="ng-range-input-group">
          <label class="ng-range-label">Min</label>
          <input
            type="number"
            class="ng-range-input"
            placeholder="Min"
            [(ngModel)]="minValue"
            [attr.min]="config().min"
            [attr.max]="maxValue() ?? config().max"
            [step]="config().step ?? 1"
            (blur)="onMinBlur()"
            [attr.aria-label]="'Minimum ' + config().label"
          />
        </div>

        <div class="ng-range-separator">–</div>

        <div class="ng-range-input-group">
          <label class="ng-range-label">Max</label>
          <input
            type="number"
            class="ng-range-input"
            placeholder="Max"
            [(ngModel)]="maxValue"
            [attr.min]="minValue() ?? config().min"
            [attr.max]="config().max"
            [step]="config().step ?? 1"
            (blur)="onMaxBlur()"
            [attr.aria-label]="'Maximum ' + config().label"
          />
        </div>
      </div>

      @if (config().showSlider) {
        <div class="ng-range-slider">
          <input
            type="range"
            class="ng-slider ng-slider-min"
            [attr.min]="config().min ?? 0"
            [attr.max]="config().max ?? 100"
            [step]="config().step ?? 1"
            [(ngModel)]="minValue"
            (ngModelChange)="onSliderChange()"
            [attr.aria-label]="'Minimum ' + config().label"
          />
          <input
            type="range"
            class="ng-slider ng-slider-max"
            [attr.min]="config().min ?? 0"
            [attr.max]="config().max ?? 100"
            [step]="config().step ?? 1"
            [(ngModel)]="maxValue"
            (ngModelChange)="onSliderChange()"
            [attr.aria-label]="'Maximum ' + config().label"
          />
        </div>

        <div class="ng-range-values">
          <span>{{ formatValue(minValue() ?? config().min ?? 0) }}</span>
          <span>{{ formatValue(maxValue() ?? config().max ?? 100) }}</span>
        </div>
      }

      <button
        type="button"
        class="ng-range-apply"
        (click)="applyRange()"
        [disabled]="!isValidRange()"
      >
        Apply Range
      </button>

      @if (validationError()) {
        <div class="ng-range-error">{{ validationError() }}</div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NumberRangeFacetComponent implements FacetPlugin {
  // Inputs
  readonly config = input.required<NumberRangeFacetConfig>();
  readonly values = input<FacetOption[]>([]);
  readonly selectedValues = input<Set<string | number>>(new Set());

  // Outputs
  readonly selectionChange = output<Set<string | number>>();
  readonly onSelectionChange = (values: Set<string | number>) => {
    this.selectionChange.emit(values);
  };

  // Internal state
  readonly minValue = signal<number | null>(null);
  readonly maxValue = signal<number | null>(null);
  readonly validationError = signal<string>('');

  // Computed
  readonly hasActiveSelections = computed(() => hasSelections(this.selectedValues()));

  readonly isValidRange = computed(() => {
    const min = this.minValue();
    const max = this.maxValue();

    if (min === null && max === null) return false;

    // Validate individual values
    if (min !== null && !validateNumberRange(min, this.config().min, this.config().max)) {
      return false;
    }
    if (max !== null && !validateNumberRange(max, this.config().min, this.config().max)) {
      return false;
    }

    // Ensure min <= max
    if (min !== null && max !== null && min > max) {
      return false;
    }

    return true;
  });

  constructor() {
    // Initialize with selected values if exist
    const selected = Array.from(this.selectedValues());
    if (selected.length >= 2) {
      this.minValue.set(selected[0] as number);
      this.maxValue.set(selected[1] as number);
    } else if (selected.length === 1) {
      this.minValue.set(selected[0] as number);
    }
  }

  applyRange(): void {
    const min = this.minValue();
    const max = this.maxValue();

    if (!this.isValidRange()) {
      if (min !== null && max !== null && min > max) {
        this.validationError.set('Minimum value must be less than or equal to maximum');
      } else {
        this.validationError.set('Please enter valid values within the allowed range');
      }
      return;
    }

    this.validationError.set('');

    const configMin = this.config().min;
    const configMax = this.config().max;

    const clampedMin = min !== null ? clampNumber(min, configMin, configMax) : (configMin ?? 0);
    const clampedMax = max !== null ? clampNumber(max, configMin, configMax) : (configMax ?? 100);

    // Store as [min, max] in the Set
    this.onSelectionChange(new Set([clampedMin, clampedMax]));
  }

  clearRange(): void {
    this.minValue.set(null);
    this.maxValue.set(null);
    this.validationError.set('');
    this.onSelectionChange(new Set());
  }

  onMinBlur(): void {
    const min = this.minValue();
    if (min !== null) {
      const clamped = clampNumber(min, this.config().min, this.maxValue() ?? this.config().max);
      this.minValue.set(clamped);
    }
  }

  onMaxBlur(): void {
    const max = this.maxValue();
    if (max !== null) {
      const clamped = clampNumber(max, this.minValue() ?? this.config().min, this.config().max);
      this.maxValue.set(clamped);
    }
  }

  onSliderChange(): void {
    // Ensure min doesn't exceed max
    const min = this.minValue();
    const max = this.maxValue();

    if (min !== null && max !== null && min > max) {
      this.minValue.set(max);
    }
  }

  formatValue(value: number): string {
    const formatter = this.config().formatter;
    return formatNumberValue(value, formatter);
  }
}
