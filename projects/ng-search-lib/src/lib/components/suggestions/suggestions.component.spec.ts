import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { SuggestionsComponent } from './suggestions.component';
import { SearchStateService } from '../../services/search-state.service';
import { SSRSafeService } from '../../services/ssr-safe.service';
import type { Suggestion } from '../../types/search-types';

describe('SuggestionsComponent', () => {
  let component: SuggestionsComponent;
  let fixture: ComponentFixture<SuggestionsComponent>;
  let mockSearchState: Partial<SearchStateService>;
  let mockSSRSafe: Partial<SSRSafeService>;

  const mockSuggestions: Suggestion[] = [
    { id: '1', text: 'angular components', count: 150 },
    { id: '2', text: 'angular signals', count: 85 },
    { id: '3', text: 'angular testing', count: 120 },
  ];

  beforeEach(async () => {
    mockSearchState = {
      suggestions: signal(mockSuggestions),
      loadingSuggestions: signal(false),
      query: signal('angular'),
      markSuggestionSelected: jasmine.createSpy('markSuggestionSelected'),
    };

    mockSSRSafe = {
      isBrowser: () => true,
    };

    await TestBed.configureTestingModule({
      imports: [SuggestionsComponent],
      providers: [
        { provide: SearchStateService, useValue: mockSearchState },
        { provide: SSRSafeService, useValue: mockSSRSafe },
        provideZonelessChangeDetection(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SuggestionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display suggestions from search state', () => {
    expect(component.suggestions()).toEqual(mockSuggestions);
    expect(component.displayedSuggestions().length).toBe(3);
  });

  it('should limit displayed suggestions based on maxSuggestions input', () => {
    fixture.componentRef.setInput('maxSuggestions', 2);
    fixture.detectChanges();

    expect(component.displayedSuggestions().length).toBe(2);
    expect(component.hasMoreSuggestions()).toBe(true);
  });

  it('should show loading state', () => {
    (mockSearchState.loadingSuggestions as any).set(true);
    fixture.detectChanges();

    expect(component.isLoading()).toBe(true);
  });

  it('should emit suggestionSelected when a suggestion is clicked', () => {
    let selectedSuggestion: Suggestion | undefined;
    component.suggestionSelected.subscribe((suggestion) => {
      selectedSuggestion = suggestion;
    });

    component.selectSuggestion(mockSuggestions[0]);

    expect(selectedSuggestion).toEqual(mockSuggestions[0]);
  });

  it('should hide suggestions after selection if closeOnSelect is true', () => {
    fixture.componentRef.setInput('closeOnSelect', true);
    component.isVisible.set(true);
    fixture.detectChanges();

    component.selectSuggestion(mockSuggestions[0]);

    expect(component.isVisible()).toBe(false);
  });

  it('should not hide suggestions after selection if closeOnSelect is false', () => {
    fixture.componentRef.setInput('closeOnSelect', false);
    component.isVisible.set(true);
    fixture.detectChanges();

    component.selectSuggestion(mockSuggestions[0]);

    expect(component.isVisible()).toBe(true);
  });

  it('should navigate suggestions with keyboard', () => {
    fixture.componentRef.setInput('autoHighlightFirst', false);
    component.isVisible.set(true);
    component.highlightedIndex.set(-1);
    fixture.detectChanges();

    // Initially no highlight
    expect(component.highlightedIndex()).toBe(-1);

    // Navigate down
    const downEvent = new KeyboardEvent('keydown', { key: 'ArrowDown' });
    component.handleKeydown(downEvent);
    expect(component.highlightedIndex()).toBe(0);

    // Navigate down again
    component.handleKeydown(downEvent);
    expect(component.highlightedIndex()).toBe(1);

    // Navigate up
    const upEvent = new KeyboardEvent('keydown', { key: 'ArrowUp' });
    component.handleKeydown(upEvent);
    expect(component.highlightedIndex()).toBe(0);
  });

  it('should wrap around when navigating past bounds', () => {
    component.isVisible.set(true);
    fixture.detectChanges();

    // Set to last item
    component.highlightIndex(2);

    // Navigate down should wrap to first
    const downEvent = new KeyboardEvent('keydown', { key: 'ArrowDown' });
    component.handleKeydown(downEvent);
    expect(component.highlightedIndex()).toBe(0);

    // Navigate up should wrap to last
    const upEvent = new KeyboardEvent('keydown', { key: 'ArrowUp' });
    component.handleKeydown(upEvent);
    expect(component.highlightedIndex()).toBe(2);
  });

  it('should select highlighted suggestion on Enter key', () => {
    let selectedSuggestion: Suggestion | undefined;
    component.suggestionSelected.subscribe((suggestion) => {
      selectedSuggestion = suggestion;
    });

    component.isVisible.set(true);
    component.highlightIndex(1);
    fixture.detectChanges();

    const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
    component.handleKeydown(enterEvent);

    expect(selectedSuggestion).toEqual(mockSuggestions[1]);
  });

  it('should hide suggestions on Escape key', () => {
    component.isVisible.set(true);
    fixture.detectChanges();

    const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
    component.handleKeydown(escapeEvent);

    expect(component.isVisible()).toBe(false);
  });

  it('should emit suggestionHighlighted when highlighting changes', () => {
    let highlightedSuggestion: Suggestion | null | undefined;
    component.suggestionHighlighted.subscribe((suggestion) => {
      highlightedSuggestion = suggestion;
    });

    component.highlightIndex(1);

    expect(highlightedSuggestion).toEqual(mockSuggestions[1]);
  });

  it('should format suggestion text with query highlighting', () => {
    (mockSearchState.query as any).set('angular');
    fixture.componentRef.setInput('highlightQuery', true);
    fixture.detectChanges();

    const formatted = component.formatSuggestionText(mockSuggestions[0]);
    expect(formatted).toContain('<mark>angular</mark>');
    expect(formatted).toContain('components');
  });

  it('should not highlight query if highlightQuery is false', () => {
    fixture.componentRef.setInput('highlightQuery', false);
    fixture.detectChanges();

    const formatted = component.formatSuggestionText(mockSuggestions[0]);
    expect(formatted).toBe('angular components');
    expect(formatted).not.toContain('<mark>');
  });

  it('should show suggestions when shouldRender is true', () => {
    (mockSearchState.query as any).set('angular');
    fixture.componentRef.setInput('minQueryLength', 3);
    fixture.detectChanges();

    expect(component.shouldRender()).toBe(true);
  });

  it('should not render when query is too short', () => {
    (mockSearchState.query as any).set('an');
    fixture.componentRef.setInput('minQueryLength', 3);
    fixture.detectChanges();

    expect(component.shouldRender()).toBe(false);
  });

  it('should create context for custom templates', () => {
    (mockSearchState.query as any).set('angular');
    fixture.detectChanges();

    const context = component.createContext(mockSuggestions[0], 0);

    expect(context.$implicit).toEqual(mockSuggestions[0]);
    expect(context.index).toBe(0);
    expect(context.query).toBe('angular');
    // highlighted should match whether index 0 is the highlighted index
    expect(context.highlighted).toBe(component.highlightedIndex() === 0);
  });

  it('should track suggestions by id or text', () => {
    const trackId1 = component.trackBy(mockSuggestions[0], 0);
    const trackId2 = component.trackBy({ text: 'test' }, 1);

    expect(trackId1).toBe('1');
    expect(trackId2).toBe('test-1');
  });

  it('should emit visibilityChange when visibility changes', () => {
    let visibility: boolean | undefined;
    component.visibilityChange.subscribe((visible) => {
      visibility = visible;
    });

    component.showSuggestions();

    expect(visibility).toBe(true);

    component.hideSuggestions();

    expect(visibility).toBe(false);
  });

  it('should handle empty suggestions gracefully', () => {
    (mockSearchState.suggestions as any).set([]);
    fixture.detectChanges();

    expect(component.displayedSuggestions().length).toBe(0);
    expect(component.hasMoreSuggestions()).toBe(false);
  });
});
