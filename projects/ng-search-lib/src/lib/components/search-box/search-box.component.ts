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
	selector: 'ngs-search-box',
	standalone: true,
	template: `
		<div class="ngs-search-box" [class.ngs-disabled]="disabled()">
			<div class="ngs-search-input-wrapper">
				<div class="ngs-input-container">
					@if (showSearchIcon()) {
						<span class="ngs-search-icon" aria-hidden="true">
							<svg
								width="20"
								height="20"
								viewBox="0 0 20 20"
								fill="none"
								xmlns="http://www.w3.org/2000/svg">
								<path
									d="M9 17A8 8 0 1 0 9 1a8 8 0 0 0 0 16zM19 19l-4.35-4.35"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
									stroke-linejoin="round" />
							</svg>
						</span>
					}

					<input
						#searchInput
						type="text"
						class="ngs-search-input"
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
						(blur)="onBlur()" />

					@if (showClearButton() && value()) {
						<button
							type="button"
							class="ngs-clear-button"
							[attr.aria-label]="clearButtonLabel()"
							(click)="clearInput()">
							<svg
								width="16"
								height="16"
								viewBox="0 0 16 16"
								fill="none"
								xmlns="http://www.w3.org/2000/svg">
								<path
									d="M12 4L4 12M4 4l8 8"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
									stroke-linejoin="round" />
							</svg>
						</button>
					}
				</div>

				<!-- Content projection for custom buttons/actions -->
				<ng-content select="[searchActions]" />
			</div>

			@if (loading()) {
				<div class="ngs-loading-indicator" role="status" aria-live="polite">
					<span class="ngs-spinner"></span>
					<span class="ngs-sr-only">Searching...</span>
				</div>
			}
		</div>
	`,
	styles: [
		`
			.ngs-search-box {
				position: relative;
				width: 100%;
			}

			.ngs-search-input-wrapper {
				display: flex;
				align-items: center;
				gap: 8px;
			}

			.ngs-input-container {
				position: relative;
				flex: 1;
				display: flex;
				align-items: center;
			}

			.ngs-search-icon {
				position: absolute;
				left: 12px;
				display: flex;
				align-items: center;
				color: #64748b;
				pointer-events: none;
				z-index: 1;
			}

			.ngs-search-input {
				flex: 1;
				width: 100%;
				padding: 12px 16px;
				padding-left: 44px;
				font-size: 16px;
				line-height: 1.5;
				border: 2px solid #e2e8f0;
				border-radius: 8px;
				background: white;
				transition: all 0.2s;
				outline: none;
			}

			.ngs-search-input:hover:not(:disabled) {
				border-color: #cbd5e1;
			}

			.ngs-search-input:focus {
				border-color: #3b82f6;
				box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
			}

			.ngs-search-input:disabled {
				background: #f1f5f9;
				cursor: not-allowed;
				opacity: 0.6;
			}

			.ngs-clear-button {
				position: absolute;
				right: 12px;
				display: flex;
				align-items: center;
				justify-content: center;
				padding: 6px;
				border: none;
				border-radius: 4px;
				background: transparent;
				color: #64748b;
				cursor: pointer;
				transition: all 0.2s;
			}

			.ngs-clear-button:hover {
				background: #f1f5f9;
				color: #334155;
			}

			.ngs-clear-button:focus-visible {
				outline: 2px solid #3b82f6;
				outline-offset: 2px;
			}

			.ngs-loading-indicator {
				position: absolute;
				right: 16px;
				top: 50%;
				transform: translateY(-50%);
				display: flex;
				align-items: center;
				gap: 8px;
			}

			.ngs-spinner {
				display: inline-block;
				width: 16px;
				height: 16px;
				border: 2px solid #e2e8f0;
				border-top-color: #3b82f6;
				border-radius: 50%;
				animation: ngs-spin 0.8s linear infinite;
			}

			@keyframes ngs-spin {
				to {
					transform: rotate(360deg);
				}
			}

			.ngs-sr-only {
				position: absolute;
				width: 1px;
				height: 1px;
				padding: 0;
				margin: -1px;
				overflow: hidden;
				clip: rect(0, 0, 0, 0);
				white-space: nowrap;
				border-width: 0;
			}

			.ngs-disabled {
				opacity: 0.6;
			}
		`,
	],
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
	readonly disableAutoSearch = input<boolean>(false); // Disable automatic debounced search on typing
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
