import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import mrLocale from '../locales/mr.json';
import hiLocale from '../locales/hi.json';
import enLocale from '../locales/en.json';
import { translateEntity } from '../locales/entityMappings';
import { formatDate, formatCurrency, formatNumber, formatPriceUnit } from '../utils/formatters';

export type Language = 'mr' | 'hi' | 'en';

export interface UserLocation {
  latitude: number;
  longitude: number;
  displayName: string;
  district?: string;
  status: 'detecting' | 'granted' | 'denied' | 'default';
}

interface AppContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  userLocation: UserLocation;
  requestLocation: () => void;
  // Helpers
  translateEntity: (arg1: string, arg2?: string) => string;
  formatDate: (dateStr: string) => string;
  formatCurrency: (amount: number | null | undefined) => string;
  formatNumber: (num: number | null | undefined, maxDecimals?: number) => string;
  formatPriceUnit: () => string;
}

const LOCALES: Record<Language, any> = {
  mr: mrLocale,
  hi: hiLocale,
  en: enLocale,
};

// Known Maharashtra reference locations for fast proximity naming
const MAHARASHTRA_CITIES = [
  { name: 'लासलगाव (Lasalgaon)', district: 'Nashik', lat: 20.1472, lng: 74.2281 },
  { name: 'नाशिक (Nashik)', district: 'Nashik', lat: 19.9975, lng: 73.7898 },
  { name: 'पिंपळगाव (Pimpalgaon)', district: 'Nashik', lat: 20.1741, lng: 73.9856 },
  { name: 'येवला (Yeola)', district: 'Nashik', lat: 20.0435, lng: 74.4842 },
  { name: 'निफाड (Niphad)', district: 'Nashik', lat: 20.0872, lng: 74.1085 },
  { name: 'पुणे (Pune)', district: 'Pune', lat: 18.5204, lng: 73.8567 },
  { name: 'नारायणगाव (Narayangaon)', district: 'Pune', lat: 19.1232, lng: 73.9781 },
  { name: 'मंचर (Manchar)', district: 'Pune', lat: 19.0068, lng: 73.9392 },
  { name: 'अहमदनगर (Ahmednagar)', district: 'Ahmednagar', lat: 19.0952, lng: 74.7496 },
  { name: 'सोलापूर (Solapur)', district: 'Solapur', lat: 17.6599, lng: 75.9064 },
  { name: 'छत्रपती संभाजीनगर (Aurangabad)', district: 'Chhatrapati Sambhajinagar', lat: 19.8762, lng: 75.3433 },
  { name: 'जळगाव (Jalgaon)', district: 'Jalgaon', lat: 21.0077, lng: 75.5626 },
  { name: 'लातूर (Latur)', district: 'Latur', lat: 18.4088, lng: 76.5604 },
  { name: 'मुंबई (Mumbai)', district: 'Mumbai', lat: 19.0760, lng: 72.8777 },
];

function findNearestCity(lat: number, lng: number) {
  let closest = MAHARASHTRA_CITIES[0];
  let minDistance = Infinity;

  for (const city of MAHARASHTRA_CITIES) {
    const dLat = city.lat - lat;
    const dLng = city.lng - lng;
    const distSq = dLat * dLat + dLng * dLng;
    if (distSq < minDistance) {
      minDistance = distSq;
      closest = city;
    }
  }
  return closest;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Helper to resolve nested, flat, dotted or underscore-delimited keys from locale object
function lookupKey(obj: unknown, key: string): string | undefined {
  if (!obj || typeof obj !== 'object') return undefined;
  const root = obj as Record<string, unknown>;

  // 1. Direct key match
  if (typeof root[key] === 'string') return root[key] as string;

  // 2. Dot-delimited key match
  if (key.includes('.')) {
    const parts = key.split('.');
    let cur: unknown = root;
    for (const p of parts) {
      if (cur && typeof cur === 'object' && p in cur) {
        cur = (cur as Record<string, unknown>)[p];
      } else {
        cur = undefined;
        break;
      }
    }
    if (typeof cur === 'string') return cur;
  }

  // 3. Underscore-separated key match
  if (key.includes('_')) {
    const firstUnderscore = key.indexOf('_');
    const sectionPrefix = key.slice(0, firstUnderscore);
    const subKey = key.slice(firstUnderscore + 1);
    const section = root[sectionPrefix];

    if (section && typeof section === 'object') {
      const secRec = section as Record<string, unknown>;
      if (typeof secRec[subKey] === 'string') {
        return secRec[subKey] as string;
      }
      if (typeof secRec[key] === 'string') {
        return secRec[key] as string;
      }
    }
  }

  // 4. Common Cold Storage & Navbar alias fallbacks
  const storageSec = root['storage'] as Record<string, unknown> | undefined;
  if (key === 'storage_page_title' || key === 'storage.page_title') {
    const candidate =
      storageSec?.page_title ||
      storageSec?.storage_page_title ||
      root['storage_page_title'];
    if (typeof candidate === 'string') return candidate as string;
  }
  if (key === 'storage_page_desc' || key === 'storage.page_desc') {
    const candidate =
      storageSec?.page_desc ||
      storageSec?.page_subtitle ||
      storageSec?.storage_page_desc ||
      root['storage_page_desc'];
    if (typeof candidate === 'string') return candidate as string;
  }

  // 5. Search across all top-level sections
  for (const sectionKey of Object.keys(root)) {
    const section = root[sectionKey];
    if (section && typeof section === 'object') {
      const secRec = section as Record<string, unknown>;
      if (typeof secRec[key] === 'string') {
        return secRec[key] as string;
      }
      if (key.includes('.')) {
        const leaf = key.split('.').pop()!;
        if (typeof secRec[leaf] === 'string') {
          return secRec[leaf] as string;
        }
      }
    }
  }

  return undefined;
}
const translationLookupCache = new Map<string, string | undefined>();

function getTranslation(lang: Language, key: string): string | undefined {
  const cacheKey = `${lang}:${key}`;
  if (translationLookupCache.has(cacheKey)) {
    return translationLookupCache.get(cacheKey);
  }

  let val = lookupKey(LOCALES[lang], key);
  if (val === undefined && lang !== 'mr') {
    val = lookupKey(LOCALES['mr'], key);
  }
  if (val === undefined && lang !== 'en') {
    val = lookupKey(LOCALES['en'], key);
  }

  translationLookupCache.set(cacheKey, val);
  return val;
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize language from localStorage, defaulting strictly to Marathi ('mr')
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('sevasathi_language') as Language;
      if (saved && (saved === 'mr' || saved === 'hi' || saved === 'en')) {
        return saved;
      }
    } catch {
      // Ignore storage access errors
    }
    return 'mr';
  });

  // Sync document.documentElement.lang on language change
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language;
    }
  }, [language]);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('sevasathi_language', lang);
    } catch {
      // Ignore storage access errors
    }
  }, []);

  // Location state (initial: default pilot reference center, GPS not requested until user initiates)
  const [userLocation, setUserLocation] = useState<UserLocation>({
    latitude: 20.1472,
    longitude: 74.2281,
    displayName: 'लासलगाव संदर्भ केंद्र (Lasalgaon Pilot Center)',
    district: 'Nashik',
    status: 'default',
  });

  // In-memory reverse geocoding cache to respect Nominatim policy & prevent StrictMode duplicates
  const reverseGeocodeCache = React.useRef<Map<string, { displayName: string; district: string }>>(new Map());

  // Prompt/request geolocation ONLY on explicit user action
  const requestLocation = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setUserLocation((prev) => ({
        ...prev,
        displayName: 'GPS या उपकरणावर उपलब्ध नाही (GPS unavailable)',
        status: 'default',
      }));
      return;
    }

    setUserLocation((prev) => ({
      ...prev,
      displayName: 'स्थान शोधत आहे... (Detecting...)',
      status: 'detecting',
    }));

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const nearest = findNearestCity(latitude, longitude);
        const cacheKey = `${latitude.toFixed(3)},${longitude.toFixed(3)}`;

        if (reverseGeocodeCache.current.has(cacheKey)) {
          const cached = reverseGeocodeCache.current.get(cacheKey)!;
          setUserLocation({
            latitude,
            longitude,
            displayName: cached.displayName,
            district: cached.district,
            status: 'granted',
          });
          return;
        }

        fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=mr,hi,en`,
          {
            headers: {
              'User-Agent': 'SevaSathi-AgriPlatform/1.0',
            },
          }
        )
          .then((res) => res.json())
          .then((data) => {
            const addr = data.address || {};
            const localName =
              addr.village ||
              addr.town ||
              addr.city ||
              addr.county ||
              addr.state_district ||
              nearest.name;
            const state = addr.state || 'महाराष्ट्र';
            const resolvedDisplayName = `${localName}, ${state}`;
            const resolvedDistrict = addr.state_district || nearest.district;

            reverseGeocodeCache.current.set(cacheKey, {
              displayName: resolvedDisplayName,
              district: resolvedDistrict,
            });

            setUserLocation({
              latitude,
              longitude,
              displayName: resolvedDisplayName,
              district: resolvedDistrict,
              status: 'granted',
            });
          })
          .catch(() => {
            const fallbackName = `${nearest.name} (आपले स्थान)`;
            setUserLocation({
              latitude,
              longitude,
              displayName: fallbackName,
              district: nearest.district,
              status: 'granted',
            });
          });
      },
      (err) => {
        console.warn('Geolocation permission not granted or unavailable:', (err instanceof Error ? err.message : String(err)));
        setUserLocation((prev) => ({
          ...prev,
          displayName: 'स्थान परवानगी नाकारली (Location access denied)',
          status: 'denied',
        }));
      },
      { timeout: 9000, enableHighAccuracy: true }
    );
  }, []);

  // Note: We intentionally DO NOT call requestLocation() on mount, respecting user privacy and avoiding automatic GPS popups.

  // Centralized Translation Function with O(1) Cache Lookup
  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      let val = getTranslation(language, key);

      // If missing, warn in development and return formatted key
      if (val === undefined) {
        if (import.meta.env.DEV) {
          console.warn(`[i18n] Missing translation key: "${key}" for language "${language}"`);
        }
        return key;
      }

      // Replace placeholder parameters e.g. "{count}" or "{commodity}"
      if (params && Object.keys(params).length > 0) {
        for (const [pKey, pVal] of Object.entries(params)) {
          val = val.replace(new RegExp(`\\{${pKey}\\}`, 'g'), String(pVal));
        }
      }

      return val;
    },
    [language]
  );

  // Reusable helpers bound to current language
  const boundTranslateEntity = useCallback(
    (arg1: string, arg2?: string) => {
      return translateEntity(arg1, arg2, language);
    },
    [language]
  );

  const boundFormatDate = useCallback(
    (dateStr: string) => formatDate(dateStr, language),
    [language]
  );

  const boundFormatCurrency = useCallback(
    (amount: number | null | undefined) => formatCurrency(amount, language),
    [language]
  );

  const boundFormatNumber = useCallback(
    (num: number | null | undefined, maxDecimals: number = 0) =>
      formatNumber(num, language, maxDecimals),
    [language]
  );

  const boundFormatPriceUnit = useCallback(
    () => formatPriceUnit(language),
    [language]
  );

  const contextValue = React.useMemo<AppContextType>(
    () => ({
      language,
      setLanguage,
      t,
      userLocation,
      requestLocation,
      translateEntity: boundTranslateEntity,
      formatDate: boundFormatDate,
      formatCurrency: boundFormatCurrency,
      formatNumber: boundFormatNumber,
      formatPriceUnit: boundFormatPriceUnit,
    }),
    [
      language,
      setLanguage,
      t,
      userLocation,
      requestLocation,
      boundTranslateEntity,
      boundFormatDate,
      boundFormatCurrency,
      boundFormatNumber,
      boundFormatPriceUnit,
    ]
  );

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export const useAppContext = useApp;

