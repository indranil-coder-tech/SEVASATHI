import '@testing-library/jest-dom';

// Polyfill window.scrollTo if missing in jsdom
if (typeof window !== 'undefined') {
  window.scrollTo = () => {};
  window.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  const mockGeo = {
    getCurrentPosition: (success: (pos: unknown) => void) => {
      success({
        coords: {
          latitude: 16.8524,
          longitude: 74.5815,
          accuracy: 10,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
        },
        timestamp: Date.now(),
      });
    },
    watchPosition: () => 0,
    clearWatch: () => {},
  };
  Object.defineProperty(window.navigator, 'geolocation', {
    value: mockGeo,
    configurable: true,
    writable: true,
  });

  const originalFetch = global.fetch;
  global.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const urlStr = typeof input === 'string' ? input : input instanceof URL ? input.toString() : (input as Request).url;
    if (urlStr.includes('nominatim.openstreetmap.org')) {
      return new Response(
        JSON.stringify({
          address: {
            village: 'Sangli Rural',
            county: 'Sangli',
            state_district: 'Sangli',
            state: 'Maharashtra',
          },
        }),
        {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }
      );
    }
    return originalFetch(input, init);
  };
}
