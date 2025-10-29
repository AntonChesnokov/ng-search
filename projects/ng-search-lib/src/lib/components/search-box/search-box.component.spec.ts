/**
 * Search Box Component Tests
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SearchBoxComponent } from './search-box.component';
import { signal } from '@angular/core';

describe('SearchBoxComponent', () => {
	let component: SearchBoxComponent;
	let fixture: ComponentFixture<SearchBoxComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [SearchBoxComponent],
		}).compileComponents();

		fixture = TestBed.createComponent(SearchBoxComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	it('should render input with placeholder', () => {
		fixture.componentRef.setInput('placeholder', 'Test placeholder');
		fixture.detectChanges();

		const input = fixture.nativeElement.querySelector('input');
		expect(input.placeholder).toBe('Test placeholder');
	});

	it('should emit queryChange on input', (done) => {
		component.queryChange.subscribe((query) => {
			expect(query).toBe('test query');
			done();
		});

		const input = fixture.nativeElement.querySelector('input');
		input.value = 'test query';
		input.dispatchEvent(new Event('input'));
	});

	it('should emit search on Enter key', (done) => {
		fixture.componentRef.setInput('value', 'test query');
		fixture.detectChanges();

		component.search.subscribe((query) => {
			expect(query).toBe('test query');
			done();
		});

		const input = fixture.nativeElement.querySelector('input');
		input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
	});

	it('should clear input on Escape key', (done) => {
		fixture.componentRef.setInput('value', 'test query');
		fixture.detectChanges();

		component.clear.subscribe(() => {
			done();
		});

		const input = fixture.nativeElement.querySelector('input');
		input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
	});

	it('should show clear button when value exists', () => {
		fixture.componentRef.setInput('value', '');
		fixture.detectChanges();
		let clearButton = fixture.nativeElement.querySelector('.ngs-clear-button');
		expect(clearButton).toBeNull();

		fixture.componentRef.setInput('value', 'test');
		fixture.detectChanges();
		clearButton = fixture.nativeElement.querySelector('.ngs-clear-button');
		expect(clearButton).toBeTruthy();
	});

	it('should hide clear button when showClearButton is false', () => {
		fixture.componentRef.setInput('value', 'test');
		fixture.componentRef.setInput('showClearButton', false);
		fixture.detectChanges();

		const clearButton = fixture.nativeElement.querySelector('.ngs-clear-button');
		expect(clearButton).toBeNull();
	});

	it('should show search button when showSearchButton is true', () => {
		fixture.componentRef.setInput('showSearchButton', true);
		fixture.detectChanges();

		const searchButton = fixture.nativeElement.querySelector('.ngs-search-button');
		expect(searchButton).toBeTruthy();
	});

	it('should show search icon by default', () => {
		const icon = fixture.nativeElement.querySelector('.ngs-search-icon');
		expect(icon).toBeTruthy();
	});

	it('should hide search icon when showSearchIcon is false', () => {
		fixture.componentRef.setInput('showSearchIcon', false);
		fixture.detectChanges();

		const icon = fixture.nativeElement.querySelector('.ngs-search-icon');
		expect(icon).toBeNull();
	});

	it('should disable input when disabled is true', () => {
		fixture.componentRef.setInput('disabled', true);
		fixture.detectChanges();

		const input = fixture.nativeElement.querySelector('input');
		expect(input.disabled).toBe(true);
	});

	it('should show loading indicator when loading is true', () => {
		fixture.componentRef.setInput('loading', false);
		fixture.detectChanges();
		let indicator = fixture.nativeElement.querySelector('.ngs-loading-indicator');
		expect(indicator).toBeNull();

		fixture.componentRef.setInput('loading', true);
		fixture.detectChanges();
		indicator = fixture.nativeElement.querySelector('.ngs-loading-indicator');
		expect(indicator).toBeTruthy();
	});

	it('should set aria attributes', () => {
		fixture.componentRef.setInput('ariaLabel', 'Custom search');
		fixture.componentRef.setInput('ariaDescribedby', 'search-help');
		fixture.componentRef.setInput('ariaControls', 'search-results');
		fixture.componentRef.setInput('ariaExpanded', true);
		fixture.detectChanges();

		const input = fixture.nativeElement.querySelector('input');
		expect(input.getAttribute('aria-label')).toBe('Custom search');
		expect(input.getAttribute('aria-describedby')).toBe('search-help');
		expect(input.getAttribute('aria-controls')).toBe('search-results');
		expect(input.getAttribute('aria-expanded')).toBe('true');
	});

	it('should emit focus event', (done) => {
		component.focus.subscribe(() => {
			done();
		});

		const input = fixture.nativeElement.querySelector('input');
		input.dispatchEvent(new FocusEvent('focus'));
	});

	it('should emit blur event', (done) => {
		component.blur.subscribe(() => {
			done();
		});

		const input = fixture.nativeElement.querySelector('input');
		input.dispatchEvent(new FocusEvent('blur'));
	});

	it('should emit keyDown event', (done) => {
		component.keyDown.subscribe((event) => {
			expect(event.key).toBe('a');
			done();
		});

		const input = fixture.nativeElement.querySelector('input');
		input.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
	});

	it('should respect minQueryLength', (done) => {
		fixture.componentRef.setInput('minQueryLength', 3);
		fixture.detectChanges();

		let searchEmitted = false;
		component.search.subscribe(() => {
			searchEmitted = true;
		});

		// Short query should not trigger
		const input = fixture.nativeElement.querySelector('input');
		input.value = 'ab';
		input.dispatchEvent(new Event('input'));

		setTimeout(() => {
			expect(searchEmitted).toBe(false);
			done();
		}, 100);
	});
});
