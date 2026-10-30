import { describe, it, expect } from 'vitest';
import {
  getLocaleCode,
  formatDate,
  formatCurrency,
  formatNumber,
  formatPriceUnit,
} from '../utils/formatters';

describe('Formatters Utility', () => {
  it('returns correct locale codes for mr, hi, en', () => {
    expect(getLocaleCode('mr')).toBe('mr-IN');
    expect(getLocaleCode('hi')).toBe('hi-IN');
    expect(getLocaleCode('en')).toBe('en-IN');
  });

  it('formats dates into localized formats', () => {
    const formattedEn = formatDate('2026-10-15', 'en');
    expect(formattedEn).toContain('2026');
    expect(formattedEn).toContain('15');

    const empty = formatDate('', 'en');
    expect(empty).toBe('');

    const invalid = formatDate('not-a-date', 'en');
    expect(invalid).toBe('not-a-date');
  });

  it('formats currency with Indian numbering system', () => {
    expect(formatCurrency(210000, 'en')).toBe('₹2,10,000');
    expect(formatCurrency(0, 'en')).toBe('₹0');
    expect(formatCurrency(null, 'en')).toBe('₹0');
    expect(formatCurrency(NaN, 'en')).toBe('₹0');
  });

  it('formats regular numbers with proper decimals and grouping', () => {
    expect(formatNumber(1500000, 'en')).toBe('15,00,000');
    expect(formatNumber(12.3456, 'en', 2)).toBe('12.35');
    expect(formatNumber(null, 'en')).toBe('0');
  });

  it('returns localized price units', () => {
    expect(formatPriceUnit('mr')).toBe('/ क्विंटल');
    expect(formatPriceUnit('hi')).toBe('/ क्विंटल');
    expect(formatPriceUnit('en')).toBe('/ quintal');
  });
});
