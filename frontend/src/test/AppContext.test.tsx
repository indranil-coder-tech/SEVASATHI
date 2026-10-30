import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppProvider, useApp } from '../context/AppContext';

const TestComponent = () => {
  const { language, setLanguage, t, translateEntity, userLocation, requestLocation } = useApp();

  return (
    <div>
      <span data-testid="current-lang">{language}</span>
      <span data-testid="translated-title">{t('common.app_name')}</span>
      <span data-testid="translated-crop">{translateEntity('Onion', 'commodity')}</span>
      <span data-testid="user-location-status">{userLocation.status}</span>
      <span data-testid="user-location-name">{userLocation.displayName}</span>
      <button onClick={() => setLanguage('en')}>Switch to English</button>
      <button onClick={() => setLanguage('hi')}>Switch to Hindi</button>
      <button onClick={() => setLanguage('mr')}>Switch to Marathi</button>
      <button onClick={requestLocation}>Request GPS</button>
    </div>
  );
};

describe('AppContext & Localization', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('TC-I18-01: Default language is Marathi (mr), translates correctly', () => {
    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );

    expect(screen.getByTestId('current-lang')).toHaveTextContent('mr');
    expect(screen.getByTestId('translated-title')).toHaveTextContent('सेवासाथी');
    expect(screen.getByTestId('translated-crop')).toHaveTextContent('कांदा');
  });

  it('TC-I18-02: Language switches to English and persists in localStorage', async () => {
    const user = userEvent.setup();
    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );

    await user.click(screen.getByText('Switch to English'));
    expect(screen.getByTestId('current-lang')).toHaveTextContent('en');
    expect(screen.getByTestId('translated-title')).toHaveTextContent('SevaSathi');
    expect(screen.getByTestId('translated-crop')).toHaveTextContent('Onion');
    expect(localStorage.getItem('sevasathi_language')).toBe('en');

    // Switch to Hindi
    await user.click(screen.getByText('Switch to Hindi'));
    expect(screen.getByTestId('current-lang')).toHaveTextContent('hi');
    expect(screen.getByTestId('translated-title')).toHaveTextContent('सेवासाथी');
    expect(screen.getByTestId('translated-crop')).toHaveTextContent('प्याज');
    expect(localStorage.getItem('sevasathi_language')).toBe('hi');
  });

  it('Initializes with default pilot center when geolocation denied or unavailable', () => {
    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );

    expect(screen.getByTestId('user-location-status')).toHaveTextContent('default');
    expect(screen.getByTestId('user-location-name')).toHaveTextContent('Lasalgaon');
  });
});
