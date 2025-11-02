/**
 * Telemetry types for the @chesnokovtony/ng-search library
 *
 * Consumers can implement the {@link SearchTelemetryClient} interface and
 * provide it via the `NG_SEARCH_TELEMETRY_CLIENTS` injection token to capture
 * analytics, logging or observability data. The library does not ship with a
 * concrete implementation which keeps instrumentation optional and
 * infrastructure-agnostic.
 */

import { SearchEvent, SearchEventType } from './search-types';

/**
 * Telemetry event emitted by the library. Extends the public
 * {@link SearchEvent} with optional categorisation and context metadata.
 */
export interface SearchTelemetryEvent extends SearchEvent {
  /** High level event category to simplify downstream routing */
  category?: 'search' | 'suggestions' | 'facets' | 'results' | 'pagination' | 'custom';
  /** Optional key/value context with sanitised metadata */
  context?: Record<string, any>;
}

/**
 * Duration metric that can be sent to telemetry backends.
 */
export interface SearchTelemetryTiming {
  /** Telemetry measurement name */
  name: 'search' | 'suggestions' | string;
  /** Measured duration in milliseconds */
  duration: number;
  /** Optional contextual metadata */
  metadata?: Record<string, any>;
}

/**
 * Error payload reported through telemetry clients.
 */
export interface SearchTelemetryError {
  /** The error instance */
  error: Error;
  /** Optional context describing the operation */
  context?: Record<string, any>;
  /** Optional hint which part of the pipeline failed */
  source?: 'search' | 'suggestions' | 'facets' | 'results' | 'custom';
}

/**
 * Telemetry client contract. Consumers can supply one or multiple clients to
 * forward analytics data to any observability platform.
 */
export interface SearchTelemetryClient {
  /** Handle structured telemetry events */
  trackEvent(event: SearchTelemetryEvent): void;
  /** Handle duration/timing measurements */
  trackTiming?(timing: SearchTelemetryTiming): void;
  /** Handle pipeline errors */
  trackError?(error: SearchTelemetryError): void;
}

/**
 * Helper type for mapping {@link SearchEventType} to default telemetry
 * categories. Useful when implementing custom telemetry clients.
 */
export type SearchTelemetryCategoryMap = Partial<
  Record<SearchEventType, SearchTelemetryEvent['category']>
>;
