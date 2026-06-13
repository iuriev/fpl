import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock react-joyride (uses browser-only APIs incompatible with jsdom)
vi.mock('react-joyride', async () => {
  const React = await import('react');
  type Step = { title?: React.ReactNode; content?: React.ReactNode };
  type JoyrideProps = {
    run?: boolean;
    steps?: Step[];
    callback?: (data: { status: string }) => void;
    locale?: { back?: string; next?: string; last?: string; skip?: string };
  };
  const MockJoyride = ({ run, steps = [], callback, locale }: JoyrideProps) => {
    const [index, setIndex] = React.useState(0);
    if (!run) return null;
    const step = steps[index];
    const isLast = index === steps.length - 1;
    return React.createElement(
      'div',
      { 'data-testid': 'joyride' },
      React.createElement('h3', null, step?.title),
      React.createElement('p', null, step?.content),
      index > 0 &&
        React.createElement('button', { onClick: () => setIndex((i) => i - 1) }, locale?.back ?? 'Back'),
      React.createElement(
        'button',
        {
          onClick: () => {
            if (isLast) {
              callback?.({ status: 'finished' });
            } else {
              setIndex((i) => i + 1);
            }
          },
        },
        isLast ? (locale?.last ?? 'Finish') : (locale?.next ?? 'Next'),
      ),
      React.createElement(
        'button',
        { onClick: () => callback?.({ status: 'skipped' }) },
        locale?.skip ?? 'Skip',
      ),
    );
  };
  return { default: MockJoyride, Joyride: MockJoyride, STATUS: { FINISHED: 'finished', SKIPPED: 'skipped' } };
});

// Mock IntersectionObserver (not implemented in jsdom)
class IntersectionObserverStub {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  constructor() {}
}
Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  configurable: true,
  value: IntersectionObserverStub,
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Polyfill Popover API (not implemented in jsdom)
if (!HTMLElement.prototype.showPopover) {
  HTMLElement.prototype.showPopover = function () {
    this.setAttribute('popover-open', '');
  };
}
if (!HTMLElement.prototype.hidePopover) {
  HTMLElement.prototype.hidePopover = function () {
    this.removeAttribute('popover-open');
  };
}
if (!HTMLElement.prototype.togglePopover) {
  HTMLElement.prototype.togglePopover = function () {
    if (this.hasAttribute('popover-open')) {
      this.hidePopover();
      return false;
    } else {
      this.showPopover();
      return true;
    }
  };
}

// Polyfill HTMLDialogElement (jsdom does not implement showModal/close)
if (!HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute('open', '');
  };
}
if (!HTMLDialogElement.prototype.close) {
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute('open');
    this.dispatchEvent(new Event('close'));
  };
}

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    key: (index: number) => Object.keys(store)[index] || null,
    get length() {
      return Object.keys(store).length;
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});
