import type { Language } from '../locales/entityMappings';

export function getLocaleCode(lang: Language): string {
  switch (lang) {
    case 'mr':
      return 'mr-IN';
    case 'hi':
      return 'hi-IN';
    default:
      return 'en-IN';
  }
}

/**
 * Formats a date string (YYYY-MM-DD) into locale-sensitive Indian format.
 * E.g. '2026-10-15' -> '15 ऑक्टो 2026' in Marathi
 */
export function formatDate(dateStr: string, lang: Language): string {
  if (!dateStr) return '';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3 && parts[0].length === 4) {
      const date = new Date(Date.UTC(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2])));
      const locale = getLocaleCode(lang);
      return new Intl.DateTimeFormat(locale, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        timeZone: 'UTC',
      }).format(date);
    }
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const locale = getLocaleCode(lang);
    return new Intl.DateTimeFormat(locale, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date);
  } catch {
    return dateStr;
  }
}

/**
 * Formats monetary amounts in Indian Rupee format (₹).
 */
export function formatCurrency(amount: number | null | undefined, lang: Language): string {
  if (amount == null || isNaN(amount)) return '₹0';
  const rounded = Math.round(amount);
  const locale = getLocaleCode(lang);
  try {
    return `₹${rounded.toLocaleString(locale)}`;
  } catch {
    return `₹${rounded.toLocaleString('en-IN')}`;
  }
}

/**
 * Formats regular numbers with Indian grouping.
 */
export function formatNumber(
  num: number | null | undefined,
  lang: Language,
  maxDecimals: number = 0
): string {
  if (num == null || isNaN(num)) return '0';
  const locale = getLocaleCode(lang);
  try {
    return num.toLocaleString(locale, {
      maximumFractionDigits: maxDecimals,
    });
  } catch {
    return num.toLocaleString('en-IN', {
      maximumFractionDigits: maxDecimals,
    });
  }
}

/**
 * Returns formatted price unit string.
 */
export function formatPriceUnit(lang: Language): string {
  if (lang === 'mr') return '/ क्विंटल';
  if (lang === 'hi') return '/ क्विंटल';
  return '/ quintal';
}
