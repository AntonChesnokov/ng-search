import { Injectable } from '@angular/core';
import {
  SearchAdapter,
  SearchQuery,
  SearchResponse,
  Suggestion,
  FilterConfig,
  AggregationResult,
} from '@chesnokovtony/ng-search';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

// Mock data for demo
const MOCK_DOCUMENTS = [
  {
    id: '1',
    title: 'Getting Started with Angular Signals',
    description:
      'Learn the basics of Angular signals and how to use them effectively in your applications.',
    category: 'Tutorial',
    difficulty: 'beginner',
    tags: ['signals', 'reactive', 'state-management'],
    author: 'Angular Team',
    date: '2024-01-15',
    url: 'https://angular.dev/guide/signals',
  },
  {
    id: '2',
    title: 'Building SSR Applications with Angular',
    description:
      'A comprehensive guide to server-side rendering in Angular applications for better SEO and performance.',
    category: 'Guide',
    difficulty: 'advanced',
    tags: ['ssr', 'server-side-rendering', 'performance', 'seo'],
    author: 'John Doe',
    date: '2024-01-20',
    url: 'https://angular.dev/guide/ssr',
  },
  {
    id: '3',
    title: 'Zoneless Angular Applications',
    description:
      'How to build Angular apps without zones for better performance and smaller bundle sizes.',
    category: 'Advanced',
    difficulty: 'advanced',
    tags: ['zoneless', 'performance', 'optimization'],
    author: 'Jane Smith',
    date: '2024-02-01',
    url: 'https://angular.dev/guide/experimental/zoneless',
  },
  {
    id: '4',
    title: 'Angular Standalone Components',
    description:
      'Migrating to standalone components and embracing the new Angular architecture patterns.',
    category: 'Tutorial',
    difficulty: 'intermediate',
    tags: ['standalone', 'components', 'architecture'],
    author: 'Angular Team',
    date: '2024-02-10',
    url: 'https://angular.dev/guide/components',
  },
  {
    id: '5',
    title: 'Input and Output Functions in Angular',
    description: 'Using the new input() and output() functions for modern component communication.',
    category: 'Tutorial',
    difficulty: 'beginner',
    tags: ['input', 'output', 'components', 'signals'],
    author: 'John Doe',
    date: '2024-02-15',
    url: 'https://angular.dev/guide/components/inputs',
  },
];

const ALL_CATEGORIES = Array.from(new Set(MOCK_DOCUMENTS.map((doc) => doc.category)));
const ALL_DIFFICULTIES = Array.from(new Set(MOCK_DOCUMENTS.map((doc) => doc.difficulty)));
const ALL_AUTHORS = Array.from(new Set(MOCK_DOCUMENTS.map((doc) => doc.author)));
const ALL_TAGS = Array.from(
  new Set(
    MOCK_DOCUMENTS.flatMap((doc) => (Array.isArray(doc.tags) ? doc.tags : [])).sort((a, b) =>
      a.localeCompare(b)
    )
  )
);

type DocumentType = (typeof MOCK_DOCUMENTS)[number];

function normalizeToArray(value: unknown): (string | number)[] {
  if (Array.isArray(value)) {
    return value as (string | number)[];
  }
  if (value === undefined || value === null) {
    return [];
  }
  return [value as string | number];
}

function compareValues(a: unknown, b: unknown): boolean {
  return String(a).toLowerCase() === String(b).toLowerCase();
}

function matchesFilter(doc: DocumentType, filter: FilterConfig): boolean {
  const documentValue = (doc as Record<string, unknown>)[filter.field];
  const values = normalizeToArray(documentValue);

  switch (filter.type) {
    case 'term':
      return values.some((value) => compareValues(value, filter.value));
    case 'terms': {
      const selectedValues = normalizeToArray(filter.value);
      const operator = filter.operator ?? 'OR';
      if (values.length === 0) {
        return false;
      }

      if (operator === 'AND') {
        return selectedValues.every((selected) =>
          values.some((value) => compareValues(value, selected))
        );
      }

      return selectedValues.some((selected) =>
        values.some((value) => compareValues(value, selected))
      );
    }
    case 'range': {
      const range = filter.value as { gte?: number; lte?: number };
      const numericValue = Number(values[0]);
      if (Number.isNaN(numericValue)) {
        return false;
      }
      if (typeof range.gte === 'number' && numericValue < range.gte) {
        return false;
      }
      if (typeof range.lte === 'number' && numericValue > range.lte) {
        return false;
      }
      return true;
    }
    default:
      return true;
  }
}

function filterByQuery(documents: DocumentType[], query: string): DocumentType[] {
  const searchTerm = query.trim().toLowerCase();
  if (!searchTerm) {
    return documents;
  }

  return documents.filter(
    (doc) =>
      doc.title.toLowerCase().includes(searchTerm) ||
      doc.description.toLowerCase().includes(searchTerm) ||
      doc.category.toLowerCase().includes(searchTerm)
  );
}

function applyFilters(documents: DocumentType[], filters?: FilterConfig[]): DocumentType[] {
  if (!filters || filters.length === 0) {
    return documents;
  }

  return documents.filter((doc) => filters.every((filter) => matchesFilter(doc, filter)));
}

function buildTermsAggregation(
  documents: DocumentType[],
  field: keyof DocumentType,
  allPossibleValues: (string | number)[]
): AggregationResult {
  const counts = new Map<string | number, number>();
  const canonicalLookup = new Map(
    allPossibleValues.map((value) => [String(value).toLowerCase(), value])
  );

  allPossibleValues.forEach((value) => counts.set(value, 0));

  documents.forEach((doc) => {
    normalizeToArray(doc[field]).forEach((value) => {
      const canonical = canonicalLookup.get(String(value).toLowerCase()) ?? value;
      counts.set(canonical, (counts.get(canonical) ?? 0) + 1);
    });
  });

  const buckets = allPossibleValues.map((value) => ({
    key: value,
    doc_count: counts.get(value) ?? 0,
  }));

  return { type: 'terms', buckets };
}

function buildAggregations(
  baseDocuments: DocumentType[],
  filters?: FilterConfig[]
): Record<string, AggregationResult> {
  const aggregations: Record<string, AggregationResult> = {};
  const allValuesMap: Record<string, (string | number)[]> = {
    category: ALL_CATEGORIES,
    difficulty: ALL_DIFFICULTIES,
    author: ALL_AUTHORS,
    tags: ALL_TAGS,
  };

  Object.entries(allValuesMap).forEach(([field, values]) => {
    const scopedFilters = filters?.filter((filter) => filter.field !== field) ?? [];
    const scopedDocuments = applyFilters(baseDocuments, scopedFilters);
    aggregations[field] = buildTermsAggregation(
      scopedDocuments,
      field as keyof DocumentType,
      values
    );
  });

  return aggregations;
}

@Injectable({ providedIn: 'root' })
export class DemoSearchAdapter implements SearchAdapter {
  search(query: SearchQuery): Observable<SearchResponse> {
    const baseDocs = filterByQuery(MOCK_DOCUMENTS, query.query);
    const filteredDocs = applyFilters(baseDocs, query.filters);

    const total = filteredDocs.length;
    const startIndex = query.from || 0;
    const endIndex = startIndex + (query.size || 10);
    const paginatedDocs = filteredDocs.slice(startIndex, endIndex);

    const aggregations = buildAggregations(baseDocs, query.filters);

    const response: SearchResponse = {
      results: paginatedDocs.map((doc, index) => ({
        id: doc.id,
        data: doc,
        score: 1 - index * 0.1,
      })),
      total,
      took: Math.floor(Math.random() * 50) + 10,
      aggregations,
    };

    return of(response).pipe(delay(300));
  }

  suggest(
    query: string,
    options?: { maxSuggestions?: number; fuzzy?: boolean }
  ): Observable<Suggestion[]> {
    const searchTerm = query.toLowerCase();

    if (!searchTerm) {
      return of([]);
    }

    const maxSuggestions = options?.maxSuggestions || 10;

    const titleSuggestions: Suggestion[] = MOCK_DOCUMENTS.filter((doc) =>
      doc.title.toLowerCase().includes(searchTerm)
    )
      .slice(0, Math.min(5, maxSuggestions))
      .map((doc) => ({
        text: doc.title,
        type: 'title' as const,
        count: 1,
        metadata: {
          category: doc.category,
          type: 'tutorial',
        },
      }));

    const categories = [...new Set(MOCK_DOCUMENTS.map((d) => d.category))];
    const categorySuggestions: Suggestion[] = categories
      .filter((cat) => cat.toLowerCase().includes(searchTerm))
      .slice(0, Math.max(0, maxSuggestions - titleSuggestions.length))
      .map((cat) => {
        const count = MOCK_DOCUMENTS.filter((d) => d.category === cat).length;
        return {
          text: cat,
          type: 'category' as const,
          count,
          metadata: {
            category: cat,
            type: 'guide',
          },
        };
      });

    const allSuggestions = [...titleSuggestions, ...categorySuggestions];

    return of(allSuggestions).pipe(delay(100));
  }

  getById(id: string): Observable<any> {
    const doc = MOCK_DOCUMENTS.find((d) => d.id === id);
    return of(doc).pipe(delay(100));
  }
}
