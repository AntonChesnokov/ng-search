import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

import {
  FacetConfig,
  FacetOption,
  FacetValue,
} from '@chesnokovtony/ng-search';

type FacetItem = FacetValue | FacetOption;

export interface DifficultyFacetSettings {
  descriptions?: Record<string, string>;
  iconMap?: Record<string, string>;
  showCounts?: boolean;
  emphasis?: 'solid' | 'outline';
}

export interface DifficultyFacetConfig extends Omit<FacetConfig, 'type' | 'config'> {
  type: 'difficulty-pills';
  /** Allow selecting multiple difficulty levels */
  multiSelect?: boolean;
  /** Custom presentation settings for the facet */
  config?: (DifficultyFacetSettings & Record<string, any>) | undefined;
}

interface NormalizedFacetItem {
  key: string | number;
  label: string;
  count: number;
  selected: boolean;
  disabled: boolean;
}

@Component({
  selector: 'demo-difficulty-pills-facet',
  standalone: true,
  imports: [],
  template: `
    <div class="difficulty-facet" role="group" [attr.aria-label]="config().label">
      <div class="difficulty-facet__header">
        <h4 class="difficulty-facet__title">{{ config().label }}</h4>
        @if (hasSelections()) {
          <button
            type="button"
            class="difficulty-facet__clear"
            (click)="clearSelections()"
            [attr.aria-label]="'Clear ' + config().label + ' filters'"
          >
            Clear
          </button>
        }
      </div>

      <div class="difficulty-facet__pills">
        @for (option of normalizedValues(); track option.key) {
          <button
            type="button"
            class="difficulty-facet__pill"
            [class.difficulty-facet__pill--selected]="option.selected"
            [class.difficulty-facet__pill--solid]="settings().emphasis === 'solid'"
            [class.difficulty-facet__pill--outline]="settings().emphasis !== 'solid'"
            [disabled]="option.disabled"
            (click)="toggleValue(option.key)"
            [attr.aria-pressed]="option.selected"
            [attr.aria-disabled]="option.disabled"
          >
            <span class="difficulty-facet__pill-icon" aria-hidden="true">
              {{ resolveIcon(option.key) }}
            </span>
            <span class="difficulty-facet__pill-content">
              <span class="difficulty-facet__pill-label">{{ option.label }}</span>
              @if (resolveDescription(option.key); as description) {
                <span class="difficulty-facet__pill-description">{{ description }}</span>
              }
            </span>
            @if (settings().showCounts) {
              <span class="difficulty-facet__pill-count" aria-hidden="true">{{
                option.count
              }}</span>
            }
          </button>
        }

        @if (normalizedValues().length === 0) {
          <div class="difficulty-facet__empty">No difficulty options available</div>
        }
      </div>
    </div>
  `,
  styles: [
    `
      .difficulty-facet {
        display: block;
        font-family: inherit;
        color: inherit;
      }

      .difficulty-facet__header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 1rem;
      }

      .difficulty-facet__title {
        margin: 0;
        font-size: 0.95rem;
        font-weight: 700;
      }

      .difficulty-facet__clear {
        background: none;
        border: none;
        color: var(--ng-accent, #6366f1);
        cursor: pointer;
        font-size: 0.8rem;
        font-weight: 600;
        padding: 0.25rem 0.5rem;
        border-radius: 6px;
      }

      .difficulty-facet__clear:hover {
        background-color: rgba(99, 102, 241, 0.1);
      }

      .difficulty-facet__pills {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
      }

      .difficulty-facet__pill {
        display: inline-flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.75rem 1rem;
        border-radius: 999px;
        border: 1px solid currentColor;
        cursor: pointer;
        background: transparent;
        color: inherit;
        transition:
          transform 0.15s ease,
          box-shadow 0.15s ease,
          background-color 0.15s ease;
        min-width: 0;
        text-align: left;
      }

      .difficulty-facet__pill:disabled {
        opacity: 0.45;
        cursor: not-allowed;
      }

      .difficulty-facet__pill:not(:disabled):hover {
        transform: translateY(-1px);
        box-shadow: 0 6px 16px rgba(79, 70, 229, 0.18);
      }

      .difficulty-facet__pill--selected.difficulty-facet__pill--outline {
        border-color: var(--ng-accent, #6366f1);
        background: rgba(99, 102, 241, 0.12);
        color: var(--ng-accent, #6366f1);
      }

      .difficulty-facet__pill--selected.difficulty-facet__pill--solid {
        background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
        color: #fff;
        border: none;
        box-shadow: 0 8px 20px rgba(99, 102, 241, 0.35);
      }

      .difficulty-facet__pill-icon {
        font-size: 1.15rem;
      }

      .difficulty-facet__pill-content {
        display: flex;
        flex-direction: column;
        gap: 0.2rem;
        line-height: 1.1;
      }

      .difficulty-facet__pill-label {
        font-size: 0.85rem;
        font-weight: 700;
      }

      .difficulty-facet__pill-description {
        font-size: 0.75rem;
        opacity: 0.75;
      }

      .difficulty-facet__pill-count {
        font-size: 0.75rem;
        font-weight: 600;
        opacity: 0.7;
      }

      .difficulty-facet__empty {
        padding: 0.75rem 1rem;
        font-size: 0.85rem;
        opacity: 0.7;
      }

      @media (forced-colors: active) {
        .difficulty-facet__pill {
          border: 1px solid ButtonText;
        }
        .difficulty-facet__pill--selected {
          forced-color-adjust: none;
          background: Highlight;
          color: HighlightText;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DifficultyPillsFacetComponent {
  readonly config = input.required<DifficultyFacetConfig>();
  readonly values = input<FacetItem[]>([]);
  readonly selectedValues = input<Set<string | number>>(new Set());

  readonly selectionChange = output<Set<string | number>>();
  onSelectionChange = (values: Set<string | number>) => {
    this.selectionChange.emit(values);
  };

  readonly settings = computed(() => {
    const facet = this.config();
    const defaults: DifficultyFacetSettings = {
      showCounts: true,
      emphasis: 'outline',
      iconMap: {
        beginner: '🌱',
        intermediate: '🚀',
        advanced: '🧠',
      },
      descriptions: {
        beginner: 'Perfect for getting started',
        intermediate: 'Build on foundational knowledge',
        advanced: 'Deep dives & expert content',
      },
    };

    return {
      ...defaults,
      ...facet.config,
      multiSelect: facet.multiSelect ?? false,
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
      const label = optionLabelLookup.get(lowerKey) ?? item.label ?? key.toString();
      const count = 'count' in item ? (item.count ?? 0) : 0;
      const disabled = 'disabled' in item ? (item.disabled ?? false) : false;
      const selected =
        'selected' in item && typeof item.selected === 'boolean'
          ? item.selected
          : currentSelection.has(key);

      return { key, label, count, selected, disabled };
    });
  });

  readonly hasSelections = computed(() => this.selectedValues().size > 0);

  toggleValue(value: string | number): void {
    const current = new Set(this.selectedValues());
    const multi = this.settings().multiSelect ?? false;

    if (multi) {
      if (current.has(value)) {
        current.delete(value);
      } else {
        current.add(value);
      }
    } else {
      if (current.has(value)) {
        current.clear();
      } else {
        current.clear();
        current.add(value);
      }
    }

    this.onSelectionChange(current);
  }

  clearSelections(): void {
    this.onSelectionChange(new Set());
  }

  resolveIcon(value: string | number): string {
    const key = String(value).toLowerCase();
    const icons = this.settings().iconMap ?? {};
    return icons[key] ?? '⭐️';
  }

  resolveDescription(value: string | number): string | undefined {
    const key = String(value).toLowerCase();
    return this.settings().descriptions?.[key];
  }
}
