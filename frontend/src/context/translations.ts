import mrLocale from '../locales/mr.json';
import hiLocale from '../locales/hi.json';
import enLocale from '../locales/en.json';

export type Language = 'mr' | 'hi' | 'en';

// Flattened or combined legacy translation mapping for backward compatibility
export const translations = {
  ...enLocale.common,
  ...enLocale.nav,
  ...enLocale.dashboard,
  ...enLocale.market,
  ...enLocale.storage,
  ...enLocale.calculator,
  ...enLocale.about,
  ...enLocale.footer,
};

export { mrLocale, hiLocale, enLocale };
