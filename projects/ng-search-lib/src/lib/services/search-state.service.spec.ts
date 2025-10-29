/**
 * Search State Service Tests
 */

import { TestBed } from '@angular/core/testing';
import { SearchStateService } from './search-state.service';
import { FilterConfig } from '../types/search-types';

describe('SearchStateService', () => {
	let service: SearchStateService;

	beforeEach(() => {
		TestBed.configureTestingModule({
			providers: [SearchStateService],
		});
		service = TestBed.inject(SearchStateService);
	});

	it('should be created', () => {
		expect(service).toBeTruthy();
	});

	it('should set query and reset to first page', () => {
		service.setPagination(2);
		service.setQuery('test query');

		expect(service.query()).toBe('test query');
		expect(service.currentPage()).toBe(1); // Should reset to page 1
	});

	it('should compute hasQuery correctly', () => {
		expect(service.hasQuery()).toBe(false);

		service.setQuery('test');
		expect(service.hasQuery()).toBe(true);

		service.setQuery('   ');
		expect(service.hasQuery()).toBe(false);
	});

	it('should manage filters', () => {
		const filter: FilterConfig = {
			field: 'category',
			type: 'term',
			value: 'books',
		};

		service.addFilter(filter);
		expect(service.hasFilters()).toBe(true);
		expect(service.filters().size).toBe(1);

		service.removeFilter('category');
		expect(service.hasFilters()).toBe(false);
		expect(service.filters().size).toBe(0);
	});

	it('should clear all filters', () => {
		service.addFilter({ field: 'category', type: 'term', value: 'books' });
		service.addFilter({ field: 'author', type: 'term', value: 'smith' });

		expect(service.filters().size).toBe(2);

		service.clearFilters();
		expect(service.filters().size).toBe(0);
	});

	it('should manage pagination', () => {
		service.setPagination(2, 20);

		expect(service.currentPage()).toBe(2);
		expect(service.pageSize()).toBe(20);
	});

	it('should navigate pages', () => {
		service.setResults([], 100);
		service.setPagination(1, 10);

		expect(service.hasNextPage()).toBe(true);
		expect(service.hasPrevPage()).toBe(false);

		service.nextPage();
		expect(service.currentPage()).toBe(2);
		expect(service.hasPrevPage()).toBe(true);

		service.prevPage();
		expect(service.currentPage()).toBe(1);
	});

	it('should compute searchQuery correctly', () => {
		service.setQuery('test');
		service.addFilter({ field: 'category', type: 'term', value: 'books' });
		service.setSort([{ field: 'date', order: 'desc' }]);
		service.setPagination(2, 20);

		const query = service.searchQuery();

		expect(query.query).toBe('test');
		expect(query.filters?.length).toBe(1);
		expect(query.sort?.length).toBe(1);
		expect(query.size).toBe(20);
		expect(query.from).toBe(20); // page 2, size 20 = offset 20
	});

	it('should manage loading state', () => {
		expect(service.loading()).toBe(false);

		service.setLoading(true);
		expect(service.loading()).toBe(true);
		expect(service.error()).toBeNull(); // Error should be cleared

		service.setLoading(false);
		expect(service.loading()).toBe(false);
	});

	it('should manage error state', () => {
		const error = new Error('Test error');

		service.setError(error);
		expect(service.error()).toBe(error);
		expect(service.hasError()).toBe(true);
		expect(service.loading()).toBe(false); // Loading should be cleared
	});

	it('should create and restore snapshot', () => {
		service.setQuery('test');
		service.addFilter({ field: 'category', type: 'term', value: 'books' });
		service.setResults([{ id: '1', data: {} }], 10);

		const snapshot = service.getSnapshot();

		// Create new service and restore
		const newService = new SearchStateService();
		newService.restoreSnapshot(snapshot);

		expect(newService.query()).toBe('test');
		expect(newService.filters().size).toBe(1);
		expect(newService.results().length).toBe(1);
		expect(newService.total()).toBe(10);
	});

	it('should reset all state', () => {
		service.setQuery('test');
		service.addFilter({ field: 'category', type: 'term', value: 'books' });
		service.setResults([{ id: '1', data: {} }], 10);
		service.setLoading(true);

		service.reset();

		expect(service.query()).toBe('');
		expect(service.filters().size).toBe(0);
		expect(service.results().length).toBe(0);
		expect(service.total()).toBe(0);
		expect(service.loading()).toBe(false);
	});

	it('should compute isEmpty correctly', () => {
		expect(service.isEmpty()).toBe(false);

		service.setQuery('test');
		service.setResults([], 0);
		service.setLoading(false);
		expect(service.isEmpty()).toBe(true);

		service.setResults([{ id: '1', data: {} }], 1);
		expect(service.isEmpty()).toBe(false);
	});
});
