/**
 * Search telemetry service
 *
 * Provides a lightweight indirection over consumer supplied telemetry clients.
 * The service is completely optional – if no clients are registered nothing is
 * recorded which keeps the library backend agnostic.
 */

import { Injectable, InjectionToken, inject } from '@angular/core';
import { SearchEvent, SearchEventType } from '../types/search-types';
import {
  SearchTelemetryClient,
  SearchTelemetryError,
  SearchTelemetryEvent,
  SearchTelemetryTiming,
} from '../types/telemetry-types';
import { DEFAULT_SEARCH_LOGGER, NG_SEARCH_LOGGER } from './search-logger';

/**
 * Injection token for providing custom telemetry clients. The token is marked
 * as `multi` so applications can wire up multiple observability backends.
 */
export const NG_SEARCH_TELEMETRY_CLIENTS = new InjectionToken<SearchTelemetryClient[]>(
  'NG_SEARCH_TELEMETRY_CLIENTS',
  {
    providedIn: 'root',
    factory: () => [],
  }
);

@Injectable({ providedIn: 'root' })
export class SearchTelemetryService {
  private readonly clients = inject(NG_SEARCH_TELEMETRY_CLIENTS);
  private readonly logger = inject(NG_SEARCH_LOGGER, { optional: true }) ?? DEFAULT_SEARCH_LOGGER;

  /**
   * Emit a telemetry event. Payloads are sanitised before being passed to
   * clients to avoid leaking sensitive data by default.
   */
  recordEvent(event: SearchEvent, context?: Record<string, any>): void {
    if (!this.clients.length) {
      return;
    }

    const telemetryEvent: SearchTelemetryEvent = {
      ...event,
      category: this.resolveCategory(event.type),
      context,
    };

    for (const client of this.clients) {
      try {
        client.trackEvent(telemetryEvent);
      } catch (error) {
        this.logger.error('[SearchTelemetry] trackEvent failed', error);
      }
    }
  }

  /**
   * Emit a duration measurement.
   */
  recordTiming(timing: SearchTelemetryTiming): void {
    if (!this.clients.length) {
      return;
    }

    for (const client of this.clients) {
      if (!client.trackTiming) {
        continue;
      }

      try {
        client.trackTiming(timing);
      } catch (error) {
        this.logger.error('[SearchTelemetry] trackTiming failed', error);
      }
    }
  }

  /**
   * Emit an error notification.
   */
  recordError(error: SearchTelemetryError): void {
    if (!this.clients.length) {
      return;
    }

    for (const client of this.clients) {
      if (!client.trackError) {
        continue;
      }

      try {
        client.trackError(error);
      } catch (err) {
        this.logger.error('[SearchTelemetry] trackError failed', err);
      }
    }
  }

  private resolveCategory(type: SearchEventType): SearchTelemetryEvent['category'] {
    switch (type) {
      case 'search_started':
      case 'search_completed':
      case 'search_failed':
        return 'search';
      case 'suggestions_requested':
      case 'suggestions_received':
      case 'suggestions_cleared':
      case 'suggestions_failed':
      case 'suggestion_selected':
        return 'suggestions';
      case 'filter_added':
      case 'filter_removed':
      case 'filter_cleared':
        return 'facets';
      case 'result_clicked':
        return 'results';
      case 'page_changed':
        return 'pagination';
      default:
        return 'custom';
    }
  }
}
