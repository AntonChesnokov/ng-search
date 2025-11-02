import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import {
  FacetConfig,
  FacetOption,
  FacetValue,
} from '@chesnokovtony/ng-search';

type FacetItem = FacetValue | FacetOption;

export interface BadgeFacetBadgeConfig {
  icon?: string;
  description?: string;
  color?: string;
  accentColor?: string;
}

export interface BadgeFacetSettings {
  columns?: number;
  emphasis?: 'solid' | 'outline';
  showCounts?: boolean;
  badges?: Record<string, BadgeFacetBadgeConfig>;
  allowDeselect?: boolean;
  multiSelect?: boolean;
}

export interface BadgeFacetConfig extends Omit<FacetConfig, 'type' | 'config'> {
  type: 'badge-grid';
  multiSelect?: boolean;
  config?: (BadgeFacetSettings & Record<string, any>) | undefined;
}

interface NormalizedFacetItem {
  key: string | number;
  label: string;
  count: number;
  selected: boolean;
  disabled: boolean;
  badge?: BadgeFacetBadgeConfig;
}

@Component({
  selector: 'demo-badge-facet',
  standalone: true,
  template: `
    <div class="badge-facet" role="group" [attr.aria-label]="config().label">
      <header class="badge-facet__header">
        <h4 class="badge-facet__title">{{ config().label }}</h4>
        @if (hasSelections() && settings().allowDeselect !== false) {
          <button
            type="button"
            class="badge-facet__clear"
            (click)="clearSelections()"
            [attr.aria-label]="'Clear ' + config().label + ' filters'"
          >
            Clear
          </button>
        }
      </header>

      <div class="badge-facet__grid" [style.--badge-columns]="settings().columns ?? 2" role="list">
        @for (item of normalizedValues(); track item.key) {
          <button
            type="button"
            role="listitem"
            class="badge-facet__badge"
            [class.badge-facet__badge--selected]="item.selected"
            [class.badge-facet__badge--solid]="settings().emphasis === 'solid'"
            [class.badge-facet__badge--outline]="settings().emphasis !== 'solid'"
            [style.--badge-color]="item.badge?.color ?? 'var(--ng-accent, #2563eb)'"
            [style.--badge-accent]="item.badge?.accentColor ?? 'var(--ng-accent, #2563eb)'"
            [disabled]="item.disabled"
            (click)="toggleValue(item.key)"
            [attr.aria-pressed]="item.selected"
            [attr.aria-disabled]="item.disabled"
          >
            <div class="badge-facet__badge-icon" aria-hidden="true">
              {{ item.badge?.icon ?? '🔎' }}
            </div>
            <div class="badge-facet__badge-content">
              <span class="badge-facet__badge-label">{{ item.label }}</span>
              @if (item.badge?.description) {
                <span class="badge-facet__badge-description">{{ item.badge?.description }}</span>
              }
            </div>
            @if (settings().showCounts) {
              <span class="badge-facet__badge-count" aria-hidden="true">{{ item.count }}</span>
            }
          </button>
        }

        @if (normalizedValues().length === 0) {
          <div class="badge-facet__empty">No options available</div>
        }
      </div>
    </div>
  `,
  styles: [
    `
      .badge-facet {
        display: block;
        font-family: inherit;
        color: inherit;
      }

      .badge-facet__header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 0.75rem;
        gap: 0.75rem;
      }

      .badge-facet__title {
        margin: 0;
        font-size: 0.95rem;
        font-weight: 700;
      }

      .badge-facet__clear {
        border: none;
        background: none;
        color: var(--ng-accent, #2563eb);
        cursor: pointer;
        font-size: 0.8rem;
        padding: 0.25rem 0.5rem;
        border-radius: 6px;
      }

      .badge-facet__clear:hover {
        background-color: rgba(37, 99, 235, 0.12);
      }

      .badge-facet__grid {
        --badge-columns: 2;
        display: grid;
        grid-template-columns: repeat(var(--badge-columns), minmax(0, 1fr));
        gap: 0.75rem;
      }

      .badge-facet__badge {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.75rem 0.85rem;
        border-radius: 14px;
        border: 1px solid var(--badge-accent, currentColor);
        background: transparent;
        cursor: pointer;
        text-align: left;
        color: inherit;
        transition:
          transform 0.16s ease,
          box-shadow 0.18s ease,
          background 0.18s ease;
      }

      .badge-facet__badge:disabled {
        opacity: 0.45;
        cursor: not-allowed;
      }

      .badge-facet__badge:not(:disabled):hover {
        transform: translateY(-1px);
        box-shadow: 0 8px 20px rgba(37, 99, 235, 0.18);
      }

      .badge-facet__badge--selected.badge-facet__badge--outline {
        border-color: var(--badge-accent, currentColor);
        background-color: rgba(37, 99, 235, 0.12);
      }

      .badge-facet__badge--selected.badge-facet__badge--solid {
        background: linear-gradient(
          135deg,
          var(--badge-accent, #2563eb),
          var(--badge-color, #1d4ed8)
        );
        color: white;
        border: none;
      }

      .badge-facet__badge-icon {
        font-size: 1.4rem;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 2.25rem;
        height: 2.25rem;
        border-radius: 50%;
        background: rgba(37, 99, 235, 0.08);
      }

      .badge-facet__badge--selected.badge-facet__badge--solid .badge-facet__badge-icon {
        background: rgba(255, 255, 255, 0.18);
      }

      .badge-facet__badge-content {
        display: flex;
        flex-direction: column;
        gap: 0.2rem;
        min-width: 0;
      }

      .badge-facet__badge-label {
        font-size: 0.85rem;
        font-weight: 700;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .badge-facet__badge-description {
        font-size: 0.75rem;
        opacity: 0.7;
      }

      .badge-facet__badge-count {
        margin-left: auto;
        font-size: 0.75rem;
        font-weight: 600;
        opacity: 0.7;
      }

      .badge-facet__empty {
        grid-column: 1 / -1;
        padding: 0.75rem 0.5rem;
        font-size: 0.85rem;
        opacity: 0.7;
        text-align: center;
      }

      @media (max-width: 640px) {
        .badge-facet__grid {
          --badge-columns: 1 !important;
        }
      }

      @media (forced-colors: active) {
        .badge-facet__badge {
          border: 1px solid ButtonText;
        }

        .badge-facet__badge--selected {
          forced-color-adjust: none;
          background: Highlight;
          color: HighlightText;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BadgeFacetComponent {
  readonly config = input.required<BadgeFacetConfig>();
  readonly values = input<FacetItem[]>([]);
  readonly selectedValues = input<Set<string | number>>(new Set());

  readonly selectionChange = output<Set<string | number>>();
  onSelectionChange = (values: Set<string | number>) => {
    this.selectionChange.emit(values);
  };

  readonly settings = computed(() => {
    const facet = this.config();
    const defaults: BadgeFacetSettings = {
      columns: 2,
      emphasis: 'outline',
      showCounts: true,
      allowDeselect: true,
      badges: {},
      multiSelect: facet.multiSelect ?? true,
    };

    return {
      ...defaults,
      ...facet.config,
      multiSelect: facet.multiSelect ?? defaults.multiSelect,
    };
  });

  readonly normalizedValues = computed<NormalizedFacetItem[]>(() => {
    const currentSelection = this.selectedValues();
    const optionLabelLookup = new Map(
      (this.config().options ?? []).map((option: FacetOption) => [
        String(option.value).toLowerCase(),
        option.label ?? String(option.value),
      ])
    );

    return (this.values() ?? []).map((item) => {
      const key = 'key' in item ? item.key : item.value;
      const lowerKey = String(key).toLowerCase();
      const label =
        optionLabelLookup.get(lowerKey) ??
        ('label' in item && item.label ? item.label : key.toString());
      const count = 'count' in item ? (item.count ?? 0) : 0;
      const disabled = 'disabled' in item ? (item.disabled ?? false) : false;
      const selected =
        'selected' in item && typeof item.selected === 'boolean'
          ? item.selected
          : currentSelection.has(key);

      const badgeSettings = this.settings().badges ?? {};
      const badge = badgeSettings[lowerKey];

      return { key, label, count, disabled, selected, badge };
    });
  });

  readonly hasSelections = computed(() => this.selectedValues().size > 0);

  toggleValue(value: string | number): void {
    const current = new Set(this.selectedValues());
    const multi = this.settings().multiSelect ?? true;

    if (multi) {
      if (current.has(value)) {
        if (this.settings().allowDeselect !== false) {
          current.delete(value);
        }
      } else {
        current.add(value);
      }
    } else {
      if (current.has(value)) {
        if (this.settings().allowDeselect !== false) {
          current.clear();
        }
      } else {
        current.clear();
        current.add(value);
      }
    }

    this.onSelectionChange(current);
  }

  clearSelections(): void {
    if (this.settings().allowDeselect === false) {
      return;
    }
    this.onSelectionChange(new Set());
  }
}
