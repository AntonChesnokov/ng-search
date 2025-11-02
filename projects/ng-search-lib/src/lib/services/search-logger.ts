import { InjectionToken } from '@angular/core';

/**
 * Logger interface used throughout the search library.
 *
 * Applications can provide their own implementation to integrate with
 * existing logging infrastructure. The default implementation is a noop to
 * ensure the library stays silent in production environments unless the
 * consumer opts in.
 */
export interface SearchLogger {
  debug: (...args: any[]) => void;
  info: (...args: any[]) => void;
  warn: (...args: any[]) => void;
  error: (...args: any[]) => void;
}

function noop(): void {}

export const DEFAULT_SEARCH_LOGGER: SearchLogger = {
  debug: noop,
  info: noop,
  warn: noop,
  error: noop,
};

export const NG_SEARCH_LOGGER = new InjectionToken<SearchLogger>('NG_SEARCH_LOGGER', {
  providedIn: 'root',
  factory: () => DEFAULT_SEARCH_LOGGER,
});
