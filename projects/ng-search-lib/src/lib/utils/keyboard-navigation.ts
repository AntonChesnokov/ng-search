/**
 * Keyboard navigation utilities
 * Zone-less compatible
 */

/**
 * Keyboard keys enum
 */
export enum KeyboardKey {
  ArrowUp = 'ArrowUp',
  ArrowDown = 'ArrowDown',
  ArrowLeft = 'ArrowLeft',
  ArrowRight = 'ArrowRight',
  Enter = 'Enter',
  Escape = 'Escape',
  Tab = 'Tab',
  Space = ' ',
  Home = 'Home',
  End = 'End',
  PageUp = 'PageUp',
  PageDown = 'PageDown',
}

/**
 * Check if key is navigation key
 */
export function isNavigationKey(key: string): boolean {
  return [
    KeyboardKey.ArrowUp,
    KeyboardKey.ArrowDown,
    KeyboardKey.ArrowLeft,
    KeyboardKey.ArrowRight,
    KeyboardKey.Home,
    KeyboardKey.End,
    KeyboardKey.PageUp,
    KeyboardKey.PageDown,
  ].includes(key as KeyboardKey);
}

/**
 * Check if key is action key
 */
export function isActionKey(key: string): boolean {
  return [
    KeyboardKey.Enter,
    KeyboardKey.Space,
  ].includes(key as KeyboardKey);
}

/**
 * Keyboard navigation handler for lists
 */
export class KeyboardNavigationHandler {
  private currentIndex = -1;
  private items: HTMLElement[] = [];

  constructor(private container: HTMLElement) {}

  /**
   * Update items list
   */
  updateItems(selector: string): void {
    this.items = Array.from(
      this.container.querySelectorAll<HTMLElement>(selector)
    );
  }

  /**
   * Handle keyboard event
   */
  handleKeyDown(event: KeyboardEvent): boolean {
    const { key } = event;

    switch (key) {
      case KeyboardKey.ArrowDown:
        event.preventDefault();
        this.moveNext();
        return true;

      case KeyboardKey.ArrowUp:
        event.preventDefault();
        this.movePrevious();
        return true;

      case KeyboardKey.Home:
        event.preventDefault();
        this.moveFirst();
        return true;

      case KeyboardKey.End:
        event.preventDefault();
        this.moveLast();
        return true;

      case KeyboardKey.Enter:
      case KeyboardKey.Space:
        event.preventDefault();
        this.selectCurrent();
        return true;

      case KeyboardKey.Escape:
        event.preventDefault();
        this.reset();
        return true;

      default:
        return false;
    }
  }

  /**
   * Move to next item
   */
  moveNext(): void {
    if (this.items.length === 0) return;

    this.currentIndex = (this.currentIndex + 1) % this.items.length;
    this.focusCurrent();
  }

  /**
   * Move to previous item
   */
  movePrevious(): void {
    if (this.items.length === 0) return;

    this.currentIndex = this.currentIndex <= 0
      ? this.items.length - 1
      : this.currentIndex - 1;
    this.focusCurrent();
  }

  /**
   * Move to first item
   */
  moveFirst(): void {
    if (this.items.length === 0) return;

    this.currentIndex = 0;
    this.focusCurrent();
  }

  /**
   * Move to last item
   */
  moveLast(): void {
    if (this.items.length === 0) return;

    this.currentIndex = this.items.length - 1;
    this.focusCurrent();
  }

  /**
   * Select current item
   */
  selectCurrent(): void {
    if (this.currentIndex >= 0 && this.currentIndex < this.items.length) {
      this.items[this.currentIndex].click();
    }
  }

  /**
   * Focus current item
   */
  private focusCurrent(): void {
    if (this.currentIndex >= 0 && this.currentIndex < this.items.length) {
      const item = this.items[this.currentIndex];
      item.focus();
      item.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }

  /**
   * Reset navigation
   */
  reset(): void {
    this.currentIndex = -1;
  }

  /**
   * Get current index
   */
  getCurrentIndex(): number {
    return this.currentIndex;
  }

  /**
   * Set current index
   */
  setCurrentIndex(index: number): void {
    if (index >= 0 && index < this.items.length) {
      this.currentIndex = index;
      this.focusCurrent();
    }
  }
}
