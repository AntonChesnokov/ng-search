/**
 * Applied Filters Component
 * Displays currently active filters with remove buttons
 * Zone-less compatible, SSR-safe
 */

import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';

import { FilterConfig } from '../../types/search-types';

interface AppliedFilter {
  id: string;
  label: string;
  value: string;
  filterConfig: FilterConfig;
}

@Component({
  selector: 'ng-applied-filters',
  standalone: true,
  imports: [],
  styleUrls: ['./applied-filters.component.css'],
  template: `
    <div class="ng-applied-filters">
      @if (appliedFiltersDisplay().length > 0) {
        <div class="ng-applied-filters-header">
          <h4 class="ng-applied-filters-title">{{ title() }}</h4>
          @if (showClearAll()) {
            <button
              type="button"
              class="ng-applied-filters-clear-all"
              (click)="onClearAll()"
              aria-label="Clear all filters"
            >
              Clear All
            </button>
          }
        </div>

        <div class="ng-applied-filters-list">
          @for (filter of appliedFiltersDisplay(); track filter.id) {
            <div class="ng-applied-filter">
              <span class="ng-applied-filter-label">{{ filter.label }}:</span>
              <span class="ng-applied-filter-value">{{ filter.value }}</span>
              <button
                type="button"
                class="ng-applied-filter-remove"
                (click)="onRemoveFilter(filter)"
                [attr.aria-label]="'Remove filter: ' + filter.label"
              >
                ×
              </button>
            </div>
          }
        </div>
      } @else if (showEmpty()) {
        <div class="ng-applied-filters-empty">{{ emptyMessage() }}</div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppliedFiltersComponent {
  // Inputs
  readonly filters = input<FilterConfig[]>([]);
  readonly title = input<string>('Active Filters');
  readonly showClearAll = input<boolean>(true);
  readonly showEmpty = input<boolean>(false);
  readonly emptyMessage = input<string>('No filters applied');
  readonly fieldLabels = input<Record<string, string>>({});

  // Outputs
  readonly removeFilter = output<FilterConfig>();
  readonly clearAll = output<void>();

  // Computed
  readonly appliedFiltersDisplay = computed(() => {
    return this.filters().map((filter, index) => {
      const label = this.fieldLabels()[filter.field] || filter.field;
      const value = this.formatFilterValue(filter);
      return {
        id: `${filter.field}-${index}`,
        label,
        value,
        filterConfig: filter,
      };
    });
  });

  // Methods
  onRemoveFilter(filter: AppliedFilter): void {
    this.removeFilter.emit(filter.filterConfig);
  }

  onClearAll(): void {
    this.clearAll.emit();
  }

  private formatFilterValue(filter: FilterConfig): string {
    if (Array.isArray(filter.value)) {
      return filter.value.join(', ');
    }

    if (typeof filter.value === 'object' && filter.value !== null) {
      // Handle range filters
      if ('gte' in filter.value && 'lte' in filter.value) {
        return `${filter.value.gte} - ${filter.value.lte}`;
      }
      if ('gte' in filter.value) {
        return `≥ ${filter.value.gte}`;
      }
      if ('lte' in filter.value) {
        return `≤ ${filter.value.lte}`;
      }
      if ('gt' in filter.value) {
        return `> ${filter.value.gt}`;
      }
      if ('lt' in filter.value) {
        return `< ${filter.value.lt}`;
      }
    }

    return String(filter.value);
  }
}
