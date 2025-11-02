/**
 * Base HTTP adapter implementation
 * Provides common HTTP functionality for search adapters
 */

import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, throwError, TimeoutError } from 'rxjs';
import { catchError, retry, timeout } from 'rxjs/operators';
import {
  SearchAdapter,
  HttpAdapterOptions,
  AdapterConfig,
  SuggestOptions,
} from '../types/adapter-types';
import { SearchQuery, SearchResponse, Suggestion } from '../types/search-types';

/**
 * Abstract base class for HTTP-based search adapters
 * Extend this class to implement specific backend integrations
 */
export abstract class BaseHttpAdapter<T = any> implements SearchAdapter<T> {
  protected http = inject(HttpClient);
  protected config: AdapterConfig;
  protected options: HttpAdapterOptions;

  constructor(config: AdapterConfig, options?: HttpAdapterOptions) {
    this.config = config;
    this.options = {
      timeout: options?.timeout ?? 30000,
      retry: {
        maxRetries: options?.retry?.maxRetries ?? 2,
        delay: options?.retry?.delay ?? 1000,
        backoff: options?.retry?.backoff ?? 'exponential',
      },
      ...options,
    };
  }

  /**
   * Execute search query
   * Must be implemented by concrete adapter classes
   */
  abstract search(query: SearchQuery): Observable<SearchResponse<T>>;

  /**
   * Get suggestions
   * Optional - override if backend supports suggestions
   */
  suggest(query: string, options?: SuggestOptions): Observable<Suggestion[]> {
    return throwError(() => new Error('Suggestions not implemented'));
  }

  /**
   * Get document by ID
   * Optional - override if needed
   */
  getById(id: string): Observable<T | null> {
    return throwError(() => new Error('GetById not implemented'));
  }

  /**
   * Check if adapter is ready
   */
  isReady(): Observable<boolean> {
    return new Observable((observer) => {
      observer.next(true);
      observer.complete();
    });
  }

  /**
   * Cleanup
   */
  destroy(): void {
    // Override if cleanup is needed
  }

  /**
   * Create HTTP headers from config
   */
  protected createHeaders(): HttpHeaders {
    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
    });

    if (this.config.credentials?.apiKey) {
      headers = headers.set('Authorization', `Bearer ${this.config.credentials.apiKey}`);
    }

    if (this.config.credentials?.headers) {
      Object.entries(this.config.credentials.headers).forEach(([key, value]) => {
        headers = headers.set(key, value);
      });
    }

    return headers;
  }

  /**
   * Create HTTP params
   */
  protected createParams(params: Record<string, any>): HttpParams {
    let httpParams = new HttpParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        httpParams = httpParams.set(key, String(value));
      }
    });
    return httpParams;
  }

  /**
   * Execute HTTP request with error handling and retries
   */
  protected executeRequest<R>(request: Observable<R>): Observable<R> {
    let processedRequest = request.pipe(timeout(this.options.timeout!));

    // Apply retry logic
    if (this.options.retry && this.options.retry.maxRetries! > 0) {
      processedRequest = processedRequest.pipe(
        retry({
          count: this.options.retry.maxRetries!,
          delay: (error, retryCount) => {
            // Don't retry on client errors (4xx)
            if (error.status >= 400 && error.status < 500) {
              throw error;
            }

            const delay =
              this.options.retry!.backoff === 'exponential'
                ? this.options.retry!.delay! * Math.pow(2, retryCount - 1)
                : this.options.retry!.delay!;

            return new Observable<void>((observer) => {
              setTimeout(() => {
                observer.next(undefined);
                observer.complete();
              }, delay);
            });
          },
        })
      );
    }

    // Apply error handler
    processedRequest = processedRequest.pipe(
      catchError((error) => {
        if (this.options.errorHandler) {
          return this.options.errorHandler(error);
        }
        return throwError(() => this.handleError(error));
      })
    );

    // Apply response interceptor
    if (this.options.responseInterceptor) {
      processedRequest = processedRequest.pipe(
        catchError((error) => throwError(() => error)),
        (source) =>
          new Observable((observer) => {
            source.subscribe({
              next: (value) => {
                try {
                  const intercepted = this.options.responseInterceptor!(value);
                  observer.next(intercepted);
                } catch (err) {
                  observer.error(err);
                }
              },
              error: (err) => observer.error(err),
              complete: () => observer.complete(),
            });
          })
      );
    }

    return processedRequest;
  }

  /**
   * Handle errors
   */
  protected handleError(error: any): Error {
    if (error instanceof TimeoutError) {
      return new Error('Search request timed out');
    }

    if (error.status === 401) {
      return new Error('Unauthorized: Invalid credentials');
    }

    if (error.status === 403) {
      return new Error('Forbidden: Access denied');
    }

    if (error.status === 404) {
      return new Error('Not found: Invalid endpoint or index');
    }

    if (error.status >= 500) {
      return new Error(`Server error: ${error.message || 'Unknown error'}`);
    }

    return new Error(error.message || 'An unknown error occurred');
  }
}
