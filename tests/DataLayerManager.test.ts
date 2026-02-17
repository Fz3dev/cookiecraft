import { DataLayerManager } from '../src/integrations/DataLayerManager';

describe('DataLayerManager', () => {
  let dlm: DataLayerManager;

  beforeEach(() => {
    window.dataLayer = undefined;
    window.gtag = undefined;
    dlm = new DataLayerManager();
  });

  test('initializes dataLayer and gtag on first pushConsent', () => {
    dlm.pushConsent('default', { ad_storage: 'denied' });
    expect(window.dataLayer).toBeDefined();
    expect(Array.isArray(window.dataLayer)).toBe(true);
    expect(typeof window.gtag).toBe('function');
  });

  test('pushConsent adds to dataLayer', () => {
    dlm.pushConsent('default', { analytics_storage: 'denied' });
    expect(window.dataLayer!.length).toBeGreaterThan(0);
  });

  test('pushSet adds to dataLayer', () => {
    dlm.pushSet('url_passthrough', true);
    expect(window.dataLayer!.length).toBeGreaterThan(0);
  });

  test('does not override existing gtag function', () => {
    const customGtag = jest.fn();
    window.gtag = customGtag;
    window.dataLayer = [];
    dlm.pushConsent('update', { ad_storage: 'granted' });
    expect(window.gtag).toBe(customGtag);
    expect(customGtag).toHaveBeenCalledWith('consent', 'update', { ad_storage: 'granted' });
  });
});
