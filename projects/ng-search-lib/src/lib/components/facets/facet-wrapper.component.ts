/**
 * Facet Wrapper Component
 * Dynamically loads and renders facet plugins from registry
 * Zone-less compatible, SSR-safe
 */

import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  computed,
  viewChild,
  effect,
  Type,
  ComponentRef,
  ViewContainerRef,
  EnvironmentInjector,
  inject,
} from '@angular/core';

import { FacetPlugin, FacetState } from '../../types/facet-types';
import { FacetRegistryService } from '../../services/facet-registry.service';
import { DEFAULT_SEARCH_LOGGER, NG_SEARCH_LOGGER } from '../../services/search-logger';

@Component({
  selector: 'ng-facet-wrapper',
  standalone: true,
  imports: [],
  styleUrls: ['./facet-wrapper.component.css'],
  template: `
    <div class="ng-facet-wrapper" [class.ng-facet-collapsed]="facetState().collapsed">
      @if (facetState().config.collapsible) {
        <button
          type="button"
          class="ng-facet-toggle"
          (click)="toggleCollapse()"
          [attr.aria-expanded]="!facetState().collapsed"
          [attr.aria-controls]="'facet-' + facetState().config.id"
        >
          <span class="ng-facet-toggle-icon">{{ facetState().collapsed ? '▶' : '▼' }}</span>
          <span>{{ facetState().config.label }}</span>
          @if (facetState().selectedValues.size > 0) {
            <span class="ng-facet-badge">{{ facetState().selectedValues.size }}</span>
          }
        </button>
      }

      @if (!facetState().collapsed) {
        <div
          class="ng-facet-content"
          [id]="'facet-' + facetState().config.id"
          role="region"
          [attr.aria-label]="facetState().config.label"
        >
          <!-- ВАЖНО: именно ng-template, а не div -->
          <ng-template #facetHost></ng-template>
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FacetWrapperComponent {
  // Inputs
  readonly facetState = input.required<FacetState>();

  // Outputs
  readonly selectionChange = output<Set<string | number>>();
  readonly collapseToggle = output<void>();

  // ViewChild for dynamic component loading
  readonly facetHost = viewChild('facetHost', { read: ViewContainerRef });

  // Computed
  readonly facetType = computed(() => this.facetState().config.type);

  private componentRef: ComponentRef<FacetPlugin> | null = null;

  constructor(
    private readonly registry: FacetRegistryService,
    private readonly envInjector: EnvironmentInjector
  ) {
    const logger = inject(NG_SEARCH_LOGGER, { optional: true }) ?? DEFAULT_SEARCH_LOGGER;
    // Effect to load facet component dynamically
    effect(() => {
      const state = this.facetState();
      const vc = this.facetHost();
      if (!vc) return;

      const Cmp = this.registry.get(state.config.type);
      if (!Cmp) {
        logger.warn(`Facet type "${state.config.type}" not registered`);
        this.destroyComponent();
        vc.clear();
        return;
      }

      if (!this.componentRef || this.componentRef.componentType !== Cmp) {
        this.destroyComponent();
        vc.clear();
        this.componentRef = vc.createComponent(Cmp as Type<FacetPlugin>, {
          environmentInjector: this.envInjector,
        });

        const instance = this.componentRef.instance;
        instance.onSelectionChange = (values: Set<string | number>) =>
          this.selectionChange.emit(values);
        if (instance.onToggleCollapse) {
          instance.onToggleCollapse = () => this.collapseToggle.emit();
        }
      }

      this.componentRef!.setInput('config', state.config);
      this.componentRef!.setInput('values', state.values);
      this.componentRef!.setInput('selectedValues', state.selectedValues);
      this.componentRef!.changeDetectorRef.markForCheck();
    });

    // Destroy component when container disappears (e.g., collapsed)
    effect(() => {
      if (!this.facetHost()) this.destroyComponent();
    });
  }

  toggleCollapse(): void {
    this.collapseToggle.emit();
  }

  private destroyComponent(): void {
    if (this.componentRef) {
      this.componentRef.destroy();
      this.componentRef = null;
    }
  }
}
