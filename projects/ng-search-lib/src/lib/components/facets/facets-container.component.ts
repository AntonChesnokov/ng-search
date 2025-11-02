/**
 * Facets Container Component
 * Renders all facets for a search instance
 * Zone-less compatible, SSR-safe
 */

import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';

import { FacetState } from '../../types/facet-types';
import { FacetWrapperComponent } from './facet-wrapper.component';

@Component({
  selector: 'ng-facets-container',
  standalone: true,
  imports: [FacetWrapperComponent],
  styleUrls: ['./facets-container.component.css'],
  template: `
    <div class="ng-facets-container">
      @if (title()) {
        <h3 class="ng-facets-title">{{ title() }}</h3>
      }

      @if (facets().length === 0) {
        <div class="ng-facets-empty">No facets configured</div>
      } @else {
        @for (facet of facets(); track facet.config.id) {
          <ng-facet-wrapper
            [facetState]="facet"
            (selectionChange)="onFacetChange(facet.config.id, $event)"
            (collapseToggle)="onToggleCollapse(facet.config.id)"
          />
        }
      }

      @if (showClearAll() && hasSelections()) {
        <button type="button" class="ng-facets-clear-all" (click)="onClearAll()">
          Clear All Filters
        </button>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FacetsContainerComponent {
  // Inputs
  readonly facets = input<FacetState[]>([]);
  readonly title = input<string>('');
  readonly showClearAll = input<boolean>(true);

  // Outputs
  readonly facetChange = output<{ facetId: string; values: Set<string | number> }>();
  readonly clearAll = output<void>();
  readonly toggleCollapse = output<string>();

  // Methods
  onFacetChange(facetId: string, values: Set<string | number>): void {
    this.facetChange.emit({ facetId, values });
  }

  onClearAll(): void {
    this.clearAll.emit();
  }

  onToggleCollapse(facetId: string): void {
    this.toggleCollapse.emit(facetId);
  }

  hasSelections(): boolean {
    return this.facets().some((facet) => facet.selectedValues.size > 0);
  }
}
