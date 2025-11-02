/**
 * Debounce utility for search input
 * Zone-less compatible
 */

import { MonoTypeOperatorFunction, Observable, timer } from 'rxjs';
import { debounce, distinctUntilChanged } from 'rxjs/operators';

/**
 * Debounce operator with configurable time
 */
export function debounceSearch<T>(dueTime: number): MonoTypeOperatorFunction<T> {
  return (source: Observable<T>) =>
    source.pipe(
      distinctUntilChanged(),
      debounce(() => timer(dueTime))
    );
}

/**
 * Create a debounced function
 * Works without NgZone
 */
export function debounceFunction<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: number | undefined;

  return function (this: any, ...args: Parameters<T>) {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const context = this;

    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }

    timeoutId = window.setTimeout(() => {
      func.apply(context, args);
    }, wait);
  };
}

/**
 * Throttle function
 * Works without NgZone
 */
export function throttleFunction<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: number | undefined;
  let lastRan: number | undefined;

  return function (this: any, ...args: Parameters<T>) {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const context = this;

    if (!lastRan) {
      func.apply(context, args);
      lastRan = Date.now();
    } else {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      timeoutId = window.setTimeout(
        () => {
          if (Date.now() - lastRan! >= wait) {
            func.apply(context, args);
            lastRan = Date.now();
          }
        },
        wait - (Date.now() - lastRan)
      );
    }
  };
}
