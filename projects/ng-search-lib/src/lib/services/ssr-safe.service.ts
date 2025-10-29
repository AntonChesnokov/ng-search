/**
 * SSR Safe Service
 * Provides utilities for SSR-compatible code
 */

import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * Service to check platform and provide SSR-safe utilities
 */
@Injectable({
	providedIn: 'root',
})
export class SSRSafeService {
	private readonly platformId = inject(PLATFORM_ID);

	/**
	 * Check if code is running in browser
	 */
	isBrowser(): boolean {
		return isPlatformBrowser(this.platformId);
	}

	/**
	 * Check if code is running on server
	 */
	isServer(): boolean {
		return !this.isBrowser();
	}

	/**
	 * Execute callback only in browser
	 */
	runInBrowser<T>(callback: () => T): T | undefined {
		if (this.isBrowser()) {
			return callback();
		}
		return undefined;
	}

	/**
	 * Execute callback only on server
	 */
	runOnServer<T>(callback: () => T): T | undefined {
		if (this.isServer()) {
			return callback();
		}
		return undefined;
	}

	/**
	 * Get window object safely
	 */
	getWindow(): Window | undefined {
		return this.isBrowser() ? window : undefined;
	}

	/**
	 * Get document object safely
	 */
	getDocument(): Document | undefined {
		return this.isBrowser() ? document : undefined;
	}

	/**
	 * Get localStorage safely
	 */
	getLocalStorage(): Storage | undefined {
		return this.isBrowser() ? localStorage : undefined;
	}

	/**
	 * Get sessionStorage safely
	 */
	getSessionStorage(): Storage | undefined {
		return this.isBrowser() ? sessionStorage : undefined;
	}

	/**
	 * Safe setTimeout
	 */
	setTimeout(callback: () => void, delay: number): number | undefined {
		if (this.isBrowser()) {
			return window.setTimeout(callback, delay);
		}
		return undefined;
	}

	/**
	 * Safe clearTimeout
	 */
	clearTimeout(id?: number): void {
		if (this.isBrowser() && id !== undefined) {
			window.clearTimeout(id);
		}
	}

	/**
	 * Safe setInterval
	 */
	setInterval(callback: () => void, delay: number): number | undefined {
		if (this.isBrowser()) {
			return window.setInterval(callback, delay);
		}
		return undefined;
	}

	/**
	 * Safe clearInterval
	 */
	clearInterval(id?: number): void {
		if (this.isBrowser() && id !== undefined) {
			window.clearInterval(id);
		}
	}

	/**
	 * Safe requestAnimationFrame
	 */
	requestAnimationFrame(callback: FrameRequestCallback): number | undefined {
		if (this.isBrowser()) {
			return window.requestAnimationFrame(callback);
		}
		return undefined;
	}

	/**
	 * Safe cancelAnimationFrame
	 */
	cancelAnimationFrame(id?: number): void {
		if (this.isBrowser() && id !== undefined) {
			window.cancelAnimationFrame(id);
		}
	}
}
