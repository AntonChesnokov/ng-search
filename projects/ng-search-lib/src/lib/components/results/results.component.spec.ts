import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { ResultsComponent } from './results.component';
import { SearchStateService } from '../../services/search-state.service';
import { SSRSafeService } from '../../services/ssr-safe.service';
import type { SearchResult, SortConfig } from '../../types/search-types';

describe('ResultsComponent', () => {
  let component: ResultsComponent;
  let fixture: ComponentFixture<ResultsComponent>;
  let mockSearchState: Partial<SearchStateService>;
  let mockSSRSafe: Partial<SSRSafeService>;

  const mockResults: SearchResult[] = [
    {
      id: '1',
      data: { title: 'Angular Components Guide', description: 'Learn about Angular components' },
      score: 0.95,
    },
    {
      id: '2',
      data: { title: 'Angular Signals Tutorial', description: 'Master Angular signals' },
      score: 0.88,
    },
    {
      id: '3',
      data: { title: 'Angular Testing Best Practices', description: 'Write better tests' },
      score: 0.82,
    },
  ];

  beforeEach(async () => {
    mockSearchState = {
      results: signal(mockResults),
      loading: signal(false),
      error: signal(null),
      query: signal('angular'),
      total: signal(3),
      currentPage: signal(1),
      sort: signal([]),
      setPagination: jasmine.createSpy('setPagination'),
      setSort: jasmine.createSpy('setSort'),
    };

    mockSSRSafe = {
      isBrowser: () => true,
    };

    await TestBed.configureTestingModule({
      imports: [ResultsComponent],
      providers: [
        { provide: SearchStateService, useValue: mockSearchState },
        { provide: SSRSafeService, useValue: mockSSRSafe },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ResultsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display results from search state', () => {
    expect(component.results()).toEqual(mockResults);
    expect(component.displayedResults().length).toBe(3);
  });

  it('should show loading state', () => {
    (mockSearchState.loading as any).set(true);
    fixture.detectChanges();

    expect(component.isLoading()).toBe(true);
  });

  it('should show error state', () => {
    const error = new Error('Test error');
    (mockSearchState.error as any).set(error);
    fixture.detectChanges();

    expect(component.hasError()).toBe(true);
    expect(component.error()).toEqual(error);
  });

  it('should show empty state when no results', () => {
    (mockSearchState.results as any).set([]);
    (mockSearchState.query as any).set('test');
    fixture.detectChanges();

    expect(component.isEmpty()).toBe(true);
  });

  it('should emit resultClick when result is clicked', () => {
    let emittedData: { result: SearchResult; index: number } | undefined;
    component.resultClick.subscribe((data) => {
      emittedData = data;
    });

    component.selectResult(mockResults[0], 0);

    expect(emittedData).toEqual({ result: mockResults[0], index: 0 });
  });

  it('should highlight result on hover', () => {
    let highlightedResult: SearchResult | null | undefined;
    component.resultHighlighted.subscribe((result) => {
      highlightedResult = result;
    });

    component.highlightIndex(1);

    expect(component.highlightedIndex()).toBe(1);
    expect(highlightedResult).toEqual(mockResults[1]);
  });

  it('should calculate total pages correctly', () => {
    (mockSearchState.total as any).set(25);
    fixture.componentRef.setInput('pageSize', 10);
    fixture.detectChanges();

    expect(component.totalPages()).toBe(3);
  });

  it('should navigate to next page', () => {
    (mockSearchState.total as any).set(25);
    fixture.componentRef.setInput('pageSize', 10);
    fixture.detectChanges();

    component.nextPage();

    expect(mockSearchState.setPagination).toHaveBeenCalledWith(2);
  });

  it('should navigate to previous page', () => {
    (mockSearchState.currentPage as any).set(2);
    (mockSearchState.total as any).set(25);
    fixture.componentRef.setInput('pageSize', 10);
    fixture.detectChanges();

    component.previousPage();

    expect(mockSearchState.setPagination).toHaveBeenCalledWith(1);
  });

  it('should not navigate when on first page', () => {
    (mockSearchState.currentPage as any).set(1);
    fixture.detectChanges();

    expect(component.hasPreviousPage()).toBe(false);

    component.previousPage();

    expect(mockSearchState.setPagination).not.toHaveBeenCalled();
  });

  it('should not navigate when on last page', () => {
    (mockSearchState.currentPage as any).set(3);
    (mockSearchState.total as any).set(25);
    fixture.componentRef.setInput('pageSize', 10);
    fixture.detectChanges();

    expect(component.hasNextPage()).toBe(false);

    component.nextPage();

    expect(mockSearchState.setPagination).toHaveBeenCalledTimes(0);
  });

  it('should go to specific page', () => {
    (mockSearchState.total as any).set(25);
    fixture.componentRef.setInput('pageSize', 10);
    fixture.detectChanges();

    component.goToPage(3);

    expect(mockSearchState.setPagination).toHaveBeenCalledWith(3);
  });

  it('should emit pageChange when page changes', () => {
    (mockSearchState.total as any).set(25);
    fixture.componentRef.setInput('pageSize', 10);
    fixture.detectChanges();

    let emittedPage: number | undefined;
    component.pageChange.subscribe((page) => {
      emittedPage = page;
    });

    component.goToPage(2);

    expect(emittedPage).toBe(2);
  });

  it('should handle page size change', () => {
    const event = {
      target: { value: '20' } as HTMLSelectElement,
    } as unknown as Event;

    component.onPageSizeChange(event);

    expect(mockSearchState.setPagination).toHaveBeenCalledWith(1, 20);
  });

  it('should emit pageSizeChange event', () => {
    let emittedSize: number | undefined;
    component.pageSizeChange.subscribe((size) => {
      emittedSize = size;
    });

    const event = {
      target: { value: '50' } as HTMLSelectElement,
    } as unknown as Event;

    component.onPageSizeChange(event);

    expect(emittedSize).toBe(50);
  });

  it('should handle sort change', () => {
    const event = {
      target: { value: 'title-asc' } as HTMLSelectElement,
    } as unknown as Event;

    component.onSortChange(event);

    expect(mockSearchState.setSort).toHaveBeenCalledWith([
      { field: 'title', order: 'asc' },
    ]);
  });

  it('should emit sortChange event', () => {
    let emittedSort: string | undefined;
    component.sortChange.subscribe((sort) => {
      emittedSort = sort;
    });

    const event = {
      target: { value: 'date-desc' } as HTMLSelectElement,
    } as unknown as Event;

    component.onSortChange(event);

    expect(emittedSort).toBe('date-desc');
  });

  it('should calculate visible pages correctly', () => {
    (mockSearchState.currentPage as any).set(5);
    (mockSearchState.total as any).set(100);
    fixture.componentRef.setInput('pageSize', 10);
    fixture.componentRef.setInput('maxVisiblePages', 7);
    fixture.detectChanges();

    const pages = component.visiblePages();

    expect(pages).toContain(1);
    expect(pages).toContain(5);
    expect(pages).toContain(10);
    expect(pages).toContain('...');
  });

  it('should show all pages when total is less than max', () => {
    (mockSearchState.total as any).set(50);
    fixture.componentRef.setInput('pageSize', 10);
    fixture.componentRef.setInput('maxVisiblePages', 7);
    fixture.detectChanges();

    const pages = component.visiblePages();

    expect(pages).toEqual([1, 2, 3, 4, 5]);
    expect(pages).not.toContain('...');
  });

  it('should highlight query in text', () => {
    (mockSearchState.query as any).set('angular');
    fixture.componentRef.setInput('highlightQuery', true);
    fixture.detectChanges();

    const highlighted = component.highlightText('Learn Angular basics', 'angular');

    // The regex is case-insensitive, so it matches both 'angular' and 'Angular'
    expect(highlighted).toContain('<mark>');
    expect(highlighted.toLowerCase()).toContain('<mark>angular</mark>');
  });

  it('should not highlight when highlightQuery is false', () => {
    fixture.componentRef.setInput('highlightQuery', false);
    fixture.detectChanges();

    const highlighted = component.highlightText('Learn Angular basics', 'angular');

    expect(highlighted).toBe('Learn Angular basics');
    expect(highlighted).not.toContain('<mark>');
  });

  it('should create context for custom templates', () => {
    (mockSearchState.query as any).set('test query');
    (mockSearchState.total as any).set(10);
    fixture.detectChanges();

    const context = component.createContext(mockResults[0], 0);

    expect(context.$implicit).toEqual(mockResults[0]);
    expect(context.index).toBe(0);
    expect(context.total).toBe(10);
    expect(context.query).toBe('test query');
  });

  it('should track results by id', () => {
    const trackId = component.trackByFn(mockResults[0], 0);

    expect(trackId).toBe('1');
  });

  it('should track results by index when no id', () => {
    const result = { id: '', data: {} } as SearchResult;
    const trackId = component.trackByFn(result, 5);

    expect(trackId).toBe('5');
  });

  it('should format results count text correctly', () => {
    (mockSearchState.currentPage as any).set(2);
    (mockSearchState.total as any).set(25);
    fixture.componentRef.setInput('pageSize', 10);
    fixture.componentRef.setInput('showPagination', true);
    fixture.detectChanges();

    const text = component.getResultsCountText();

    expect(text).toBe('11-20 of 25 results');
  });

  it('should format results count for single result', () => {
    (mockSearchState.total as any).set(1);
    fixture.detectChanges();

    const text = component.getResultsCountText();

    expect(text).toBe('1 result');
  });

  it('should format results count for no pagination', () => {
    (mockSearchState.total as any).set(25);
    fixture.componentRef.setInput('showPagination', false);
    fixture.detectChanges();

    const text = component.getResultsCountText();

    expect(text).toBe('25 results');
  });

  it('should calculate virtual scroll offset', () => {
    fixture.componentRef.setInput('itemHeight', 100);
    component['virtualScrollStartIndex'].set(5);
    fixture.detectChanges();

    expect(component.virtualScrollOffset()).toBe(500);
  });

  it('should calculate total virtual height', () => {
    fixture.componentRef.setInput('itemHeight', 100);
    fixture.detectChanges();

    expect(component.totalVirtualHeight()).toBe(300); // 3 results * 100px
  });

  it('should slice results for virtual scrolling', () => {
    const manyResults = Array.from({ length: 50 }, (_, i) => ({
      id: `${i}`,
      data: { title: `Result ${i}` },
    }));

    (mockSearchState.results as any).set(manyResults);
    component['virtualScrollStartIndex'].set(10);
    component['virtualScrollEndIndex'].set(20);
    fixture.detectChanges();

    const visible = component.visibleResults();

    expect(visible.length).toBe(10);
    expect(visible[0].id).toBe('10');
    expect(visible[9].id).toBe('19');
  });

  it('should convert object to entries for template', () => {
    const obj = { key1: 'value1', key2: 'value2' };
    const entries = component.objectEntries(obj);

    expect(entries).toEqual([
      ['key1', 'value1'],
      ['key2', 'value2'],
    ]);
  });

  it('should emit retry event', () => {
    let retryEmitted = false;
    component.retry.subscribe(() => {
      retryEmitted = true;
    });

    component.retry.emit();

    expect(retryEmitted).toBe(true);
  });

  it('should get current sort value', () => {
    const sort: SortConfig[] = [{ field: 'title', order: 'asc' }];
    (mockSearchState.sort as any).set(sort);
    fixture.detectChanges();

    expect(component.currentSortValue()).toBe('title-asc');
  });

  it('should return empty string when no sort', () => {
    (mockSearchState.sort as any).set([]);
    fixture.detectChanges();

    expect(component.currentSortValue()).toBe('');
  });
});
