import { describe, expect, it } from 'vitest';
import { formatDisplayPrice } from './moneda.util';

describe('formatDisplayPrice', () => {
  it('conserva la moneda y los decimales del importe', () => {
    expect(formatDisplayPrice(1250.5, ' pen ')).toBe('S/ 1,250.5');
    expect(formatDisplayPrice('12.75', 'EUR')).toBe('€ 12.75');
    expect(formatDisplayPrice(30, 'USD')).toBe('US$ 30');
    expect(formatDisplayPrice(10, 'GBP')).toBe('GBP 10');
  });

  it('usa PEN si falta el código y deja vacíos los importes ausentes o inválidos', () => {
    expect(formatDisplayPrice(96, ' ')).toBe('S/ 96');
    expect(formatDisplayPrice(0, null)).toBe('S/ 0');
    expect(formatDisplayPrice(' ', 'PEN')).toBe('');
    expect(formatDisplayPrice(null, 'PEN')).toBe('');
    expect(formatDisplayPrice('inválido', 'PEN')).toBe('');
  });
});
