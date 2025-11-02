import { Injectable } from '@angular/core';
import {
  SearchAdapter,
  SearchQuery,
  SearchResponse,
  Suggestion,
} from '@chesnokovtony/ng-search';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';

const BASE_URL = 'https://rickandmortyapi.com/api';

export interface RickMortyCharacter {
  id: number;
  name: string;
  status: 'Alive' | 'Dead' | 'unknown';
  species: string;
  type: string;
  gender: 'Female' | 'Male' | 'Genderless' | 'unknown';
  origin: {
    name: string;
    url: string;
  };
  location: {
    name: string;
    url: string;
  };
  image: string;
  episode: string[];
  url: string;
  created: string;
}

export interface RickMortyApiResponse {
  info: {
    count: number;
    pages: number;
    next: string | null;
    prev: string | null;
  };
  results: RickMortyCharacter[];
}

@Injectable({ providedIn: 'root' })
export class RickMortySearchAdapter implements SearchAdapter {
  constructor(private readonly http: HttpClient) {}

  search(query: SearchQuery): Observable<SearchResponse> {
    // Build query parameters
    const params: any = {};

    // Handle search query - use name filter
    if (query.query && query.query.trim()) {
      params.name = query.query.trim();
    }

    // Handle pagination
    const page = Math.floor((query.from || 0) / (query.size || 20)) + 1;
    params.page = page.toString();

    // Handle filters - filters is an array of FilterConfig objects
    if (query.filters && query.filters.length > 0) {
      query.filters.forEach((filter) => {
        if (filter.field === 'status') {
          params.status = filter.value;
        } else if (filter.field === 'species') {
          params.species = filter.value;
        } else if (filter.field === 'gender') {
          params.gender = filter.value;
        } else if (filter.field === 'type') {
          params.type = filter.value;
        }
      });
    }

    // Build URL with query parameters
    const queryString = new URLSearchParams(params).toString();
    const url = `${BASE_URL}/character${queryString ? '?' + queryString : ''}`;

    return this.http.get<RickMortyApiResponse>(url).pipe(
      map((response) => {
        const searchResponse: SearchResponse = {
          results: response.results.map((character, index) => ({
            id: character.id.toString(),
            data: character,
            score: 1 - index * 0.01, // Simple scoring based on order
          })),
          total: response.info.count,
          took: 0, // API doesn't provide timing
        };

        return searchResponse;
      }),
      catchError((error) => {
        // Return empty results on error (e.g., no matches found)
        if (error.status === 404) {
          return of({
            results: [],
            total: 0,
            took: 0,
          });
        }

        throw error;
      })
    );
  }

  suggest(
    query: string,
    options?: { maxSuggestions?: number; fuzzy?: boolean }
  ): Observable<Suggestion[]> {
    if (!query || query.trim().length < 2) {
      return of([]);
    }

    const maxSuggestions = options?.maxSuggestions || 8;

    // Search for characters matching the query
    const url = `${BASE_URL}/character/?name=${encodeURIComponent(query.trim())}`;

    return this.http.get<RickMortyApiResponse>(url).pipe(
      map((response) => {
        const suggestions: Suggestion[] = response.results
          .slice(0, maxSuggestions)
          .map((character) => ({
            text: character.name,
            type: 'character' as const,
            metadata: {
              status: character.status,
              species: character.species,
              image: character.image,
              id: character.id,
            },
          }));

        return suggestions;
      }),
      catchError((error) => {
        return of([]);
      })
    );
  }

  getById(id: string): Observable<RickMortyCharacter> {
    const url = `${BASE_URL}/character/${id}`;
    return this.http.get<RickMortyCharacter>(url).pipe(
      catchError((error) => {
        throw error;
      })
    );
  }
}
