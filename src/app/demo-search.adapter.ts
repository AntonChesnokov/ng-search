import { SearchAdapter, SearchQuery, SearchResponse, Suggestion } from '../../projects/ng-search-lib/src/public-api';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

// Mock data for demo
const MOCK_DOCUMENTS = [
  {
    id: '1',
    title: 'Getting Started with Angular Signals',
    description: 'Learn the basics of Angular signals and how to use them effectively in your applications.',
    category: 'Tutorial',
    difficulty: 'beginner',
    tags: ['signals', 'reactive', 'state-management'],
    author: 'Angular Team',
    date: '2024-01-15',
    url: 'https://angular.dev/guide/signals'
  },
  {
    id: '2',
    title: 'Building SSR Applications with Angular',
    description: 'A comprehensive guide to server-side rendering in Angular applications for better SEO and performance.',
    category: 'Guide',
    difficulty: 'advanced',
    tags: ['ssr', 'server-side-rendering', 'performance', 'seo'],
    author: 'John Doe',
    date: '2024-01-20',
    url: 'https://angular.dev/guide/ssr'
  },
  {
    id: '3',
    title: 'Zoneless Angular Applications',
    description: 'How to build Angular apps without zones for better performance and smaller bundle sizes.',
    category: 'Advanced',
    difficulty: 'advanced',
    tags: ['zoneless', 'performance', 'optimization'],
    author: 'Jane Smith',
    date: '2024-02-01',
    url: 'https://angular.dev/guide/experimental/zoneless'
  },
  {
    id: '4',
    title: 'Angular Standalone Components',
    description: 'Migrating to standalone components and embracing the new Angular architecture patterns.',
    category: 'Tutorial',
    difficulty: 'intermediate',
    tags: ['standalone', 'components', 'architecture'],
    author: 'Angular Team',
    date: '2024-02-10',
    url: 'https://angular.dev/guide/components'
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
    url: 'https://angular.dev/guide/components/inputs'
  }
];

export class DemoSearchAdapter implements SearchAdapter {
  search(query: SearchQuery): Observable<SearchResponse> {
    console.log('[DemoSearchAdapter] search() called with query:', query);
    const searchTerm = query.query.toLowerCase();

    let filteredDocs = MOCK_DOCUMENTS;
    if (searchTerm) {
      filteredDocs = MOCK_DOCUMENTS.filter(doc =>
        doc.title.toLowerCase().includes(searchTerm) ||
        doc.description.toLowerCase().includes(searchTerm) ||
        doc.category.toLowerCase().includes(searchTerm)
      );
    }

    const total = filteredDocs.length;
    const startIndex = query.from || 0;
    const endIndex = startIndex + (query.size || 10);
    const paginatedDocs = filteredDocs.slice(startIndex, endIndex);

    const response: SearchResponse = {
      results: paginatedDocs.map((doc, index) => ({
        id: doc.id,
        data: doc,
        score: 1 - (index * 0.1)
      })),
      total,
      took: Math.floor(Math.random() * 50) + 10
    };

    console.log('[DemoSearchAdapter] search() returning response:', response);
    return of(response).pipe(delay(300));
  }

  suggest(query: string, options?: { maxSuggestions?: number; fuzzy?: boolean }): Observable<Suggestion[]> {
    console.log('[DemoSearchAdapter] suggest() called with query:', query, 'options:', options);
    const searchTerm = query.toLowerCase();

    if (!searchTerm) {
      return of([]);
    }

    const maxSuggestions = options?.maxSuggestions || 10;

    const titleSuggestions: Suggestion[] = MOCK_DOCUMENTS
      .filter(doc => doc.title.toLowerCase().includes(searchTerm))
      .slice(0, Math.min(5, maxSuggestions))
      .map(doc => ({
        text: doc.title,
        type: 'title' as const,
        count: 1,
        metadata: {
          category: doc.category,
          type: 'tutorial'
        }
      }));

    const categories = [...new Set(MOCK_DOCUMENTS.map(d => d.category))];
    const categorySuggestions: Suggestion[] = categories
      .filter(cat => cat.toLowerCase().includes(searchTerm))
      .slice(0, Math.max(0, maxSuggestions - titleSuggestions.length))
      .map(cat => {
        const count = MOCK_DOCUMENTS.filter(d => d.category === cat).length;
        return {
          text: cat,
          type: 'category' as const,
          count,
          metadata: {
            category: cat,
            type: 'guide'
          }
        };
      });

    const allSuggestions = [...titleSuggestions, ...categorySuggestions];
    console.log('[DemoSearchAdapter] suggest() returning suggestions:', allSuggestions);

    return of(allSuggestions).pipe(delay(100));
  }

  getById(id: string): Observable<any> {
    const doc = MOCK_DOCUMENTS.find(d => d.id === id);
    return of(doc).pipe(delay(100));
  }
}
