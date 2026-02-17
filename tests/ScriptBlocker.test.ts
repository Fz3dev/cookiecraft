import { ScriptBlocker } from '../src/blocking/ScriptBlocker';
import { CategoryManager } from '../src/blocking/CategoryManager';
import { EventEmitter } from '../src/core/EventEmitter';
import { ConsentCategories } from '../src/types';

describe('ScriptBlocker', () => {
  let cm: CategoryManager;
  let emitter: EventEmitter;
  let blocker: ScriptBlocker;

  beforeEach(() => {
    cm = new CategoryManager();
    emitter = new EventEmitter();
    blocker = new ScriptBlocker(cm, emitter);
    // Clear body scripts from previous tests
    document.body.innerHTML = '';
  });

  afterEach(() => {
    blocker.destroy();
  });

  function addScript(category: string, src?: string): HTMLScriptElement {
    const script = document.createElement('script');
    script.setAttribute('data-cookieconsent', category);
    if (src) {
      script.src = src;
    } else {
      script.textContent = 'console.log("test")';
    }
    document.body.appendChild(script);
    return script;
  }

  test('init blocks scripts with data-cookieconsent', () => {
    const script = addScript('analytics');
    blocker.init();
    expect(script.type).toBe('text/plain');
  });

  test('unblock reactivates consented scripts', () => {
    const script = addScript('analytics', 'https://www.google-analytics.com/analytics.js');
    blocker.init();
    expect(script.type).toBe('text/plain');

    const consent: ConsentCategories = { necessary: true, analytics: true, marketing: false };
    const emitSpy = jest.spyOn(emitter, 'emit');
    blocker.unblock(consent);

    expect(emitSpy).toHaveBeenCalledWith('script:activated', expect.objectContaining({
      category: 'analytics',
    }));
  });

  test('block resets blocker state', () => {
    addScript('analytics');
    blocker.init();
    blocker.block();
    // After block, scripts with data-cookieconsent should be re-blocked
    const scripts = document.querySelectorAll('script[data-cookieconsent]');
    scripts.forEach(s => {
      expect((s as HTMLScriptElement).type).toBe('text/plain');
    });
  });

  test('destroy disconnects MutationObserver', () => {
    blocker.init();
    expect(() => blocker.destroy()).not.toThrow();
    // Calling destroy again should be safe
    expect(() => blocker.destroy()).not.toThrow();
  });

  test('stores original type attribute', () => {
    const script = addScript('marketing');
    script.type = 'module';
    blocker.init();
    expect(script.getAttribute('data-original-type')).toBe('module');
    expect(script.type).toBe('text/plain');
  });
});
