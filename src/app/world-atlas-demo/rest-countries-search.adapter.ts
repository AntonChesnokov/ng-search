import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map, shareReplay } from 'rxjs/operators';
import {
  AggregationResult,
  FilterConfig,
  SearchAdapter,
  SearchQuery,
  SearchResponse,
  Suggestion,
} from '@chesnokovtony/ng-search';

const BASE_URL =
  'https://restcountries.com/v3.1/all?fields=name,capital,region,subregion,population,flags,currencies,timezones,cca2,cca3';

export interface RestCountry {
  cca2: string;
  cca3: string;
  name: {
    common: string;
    official: string;
    nativeName?: Record<string, { official: string; common: string }>;
  };
  capital?: string[];
  region: string;
  subregion?: string;
  population: number;
  flags: { png?: string; svg?: string; alt?: string };
  currencies?: Record<string, { name: string; symbol?: string }>;
  timezones: string[];
}

@Injectable()
export class RestCountriesSearchAdapter implements SearchAdapter<RestCountry> {
  private readonly http = inject(HttpClient);

  private readonly countries$ = this.http.get<RestCountry[]>(BASE_URL).pipe(
    map((countries) => countries ?? []),
    catchError(() => of([] as RestCountry[])),
    shareReplay(1)
  );

  search(query: SearchQuery): Observable<SearchResponse<RestCountry>> {
    const size = Math.min(Math.max(query.size ?? 12, 1), 50);
    const from = Math.max(query.from ?? 0, 0);

    return this.countries$.pipe(
      map((countries) => {
        const base = this.filterByQuery(countries, query.query);
        const filtered = this.applyFilters(base, query.filters);
        const total = filtered.length;
        const results = filtered.slice(from, from + size).map((country) => ({
          id: country.cca3 ?? country.cca2,
          data: country,
          score: 1,
        }));

        const aggregations = this.buildAggregations(base, query.filters);

        return {
          results,
          total,
          took: 0,
          aggregations,
        } satisfies SearchResponse<RestCountry>;
      })
    );
  }

  suggest(query: string, options?: { maxSuggestions?: number }): Observable<Suggestion[]> {
    const trimmed = query.trim();
    if (!trimmed || trimmed.length < 2) {
      return of([]);
    }

    const maxSuggestions = options?.maxSuggestions ?? 8;

    return this.countries$.pipe(
      map((countries) =>
        countries
          .filter((country) => this.matchesText(country, trimmed))
          .slice(0, maxSuggestions)
          .map((country) => ({
            text: country.name.common,
            metadata: {
              region: country.region,
              flag: country.flags.png ?? country.flags.svg,
              population: country.population,
            },
          }))
      )
    );
  }

  private filterByQuery(countries: RestCountry[], query?: string): RestCountry[] {
    const term = query?.trim().toLowerCase();
    if (!term) {
      return countries;
    }

    return countries.filter((country) => this.matchesText(country, term));
  }

  private matchesText(country: RestCountry, term: string): boolean {
    const normalized = term.toLowerCase();
    const capitalMatch = (country.capital ?? []).some((cap) =>
      cap.toLowerCase().includes(normalized)
    );
    const nameMatch =
      country.name.common.toLowerCase().includes(normalized) ||
      country.name.official.toLowerCase().includes(normalized);

    const nativeMatch = Object.values(country.name.nativeName ?? {}).some(
      (native) =>
        native.common.toLowerCase().includes(normalized) ||
        native.official.toLowerCase().includes(normalized)
    );

    return nameMatch || capitalMatch || nativeMatch;
  }

  private applyFilters(countries: RestCountry[], filters?: FilterConfig[]): RestCountry[] {
    if (!filters || filters.length === 0) {
      return countries;
    }

    return filters.reduce((current, filter) => {
      switch (filter.field) {
        case 'region':
          return this.applyTermsFilter(current, filter, (country) => [country.region]);
        case 'subregion':
          return this.applyTermsFilter(current, filter, (country) =>
            country.subregion ? [country.subregion] : []
          );
        case 'timezones':
          return this.applyTermsFilter(current, filter, (country) => country.timezones ?? []);
        case 'population':
          if (filter.type === 'range') {
            const { gte, lte } = filter.value ?? {};
            return current.filter((country) => {
              if (typeof country.population !== 'number') {
                return false;
              }
              if (typeof gte === 'number' && country.population < gte) {
                return false;
              }
              if (typeof lte === 'number' && country.population > lte) {
                return false;
              }
              return true;
            });
          }
          return current;
        default:
          return current;
      }
    }, countries);
  }

  private applyTermsFilter(
    countries: RestCountry[],
    filter: FilterConfig,
    selector: (country: RestCountry) => (string | number | undefined | null)[]
  ): RestCountry[] {
    const values = this.normalizeFilterValues(filter);
    if (values.length === 0) {
      return countries;
    }

    const operator = (filter.operator ?? 'OR') === 'AND' ? 'AND' : 'OR';

    return countries.filter((country) => {
      const options = selector(country).map((option) => String(option).toLowerCase());
      if (options.length === 0) {
        return false;
      }

      if (operator === 'AND') {
        return values.every((value) => options.includes(value));
      }

      return values.some((value) => options.includes(value));
    });
  }

  private normalizeFilterValues(filter: FilterConfig): string[] {
    if (filter.type === 'term') {
      return [String(filter.value).toLowerCase()];
    }
    if (filter.type === 'terms') {
      const values = Array.isArray(filter.value) ? filter.value : [filter.value];
      return values.map((value) => String(value).toLowerCase());
    }
    return [];
  }

  private buildAggregations(
    base: RestCountry[],
    filters?: FilterConfig[]
  ): Record<string, AggregationResult> {
    const facetExtractors: Record<
      string,
      (country: RestCountry) => (string | number | undefined | null)[]
    > = {
      region: (country) => [country.region],
      subregion: (country) => (country.subregion ? [country.subregion] : []),
      timezones: (country) => country.timezones ?? [],
    };

    return Object.entries(facetExtractors).reduce<Record<string, AggregationResult>>(
      (acc, [field, extractor]) => {
        const scopedFilters = (filters ?? []).filter((filter) => filter.field !== field);
        const scopedCountries = this.applyFilters(base, scopedFilters);
        acc[field] = this.buildTermsAggregation(scopedCountries, extractor);
        return acc;
      },
      {}
    );
  }

  private buildTermsAggregation(
    countries: RestCountry[],
    extractor: (country: RestCountry) => (string | number | undefined | null)[]
  ): AggregationResult {
    const counts = new Map<string, { label: string; count: number }>();

    countries.forEach((country) => {
      extractor(country)
        .map((value) => (value ?? '').toString().trim())
        .filter((value) => value.length > 0)
        .forEach((value) => {
          const normalized = value.toLowerCase();
          const entry = counts.get(normalized);
          if (entry) {
            entry.count += 1;
          } else {
            counts.set(normalized, { label: value, count: 1 });
          }
        });
    });

    const buckets = Array.from(counts.values())
      .map(({ label, count }) => ({ key: label, doc_count: count }))
      .sort((a, b) => b.doc_count - a.doc_count);

    return { type: 'terms', buckets };
  }
}
