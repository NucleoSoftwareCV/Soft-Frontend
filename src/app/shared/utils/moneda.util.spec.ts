import { formatearMonto, simboloMoneda } from './moneda.util';

describe('moneda.util', () => {
  describe('simboloMoneda', () => {
    it('devuelve el simbolo del sol peruano para PEN', () => {
      expect(simboloMoneda('PEN')).toBe('S/');
    });

    it('devuelve el simbolo del euro para EUR', () => {
      expect(simboloMoneda('EUR')).toBe('€');
    });

    it('devuelve el codigo tal cual para monedas desconocidas', () => {
      expect(simboloMoneda('GBP')).toBe('GBP');
    });

    it('usa PEN por defecto si no llega moneda', () => {
      expect(simboloMoneda(null)).toBe('S/');
      expect(simboloMoneda(undefined)).toBe('S/');
      expect(simboloMoneda('')).toBe('S/');
    });
  });

  describe('formatearMonto', () => {
    it('formatea soles con el simbolo delante', () => {
      expect(formatearMonto(96, 'PEN')).toBe('S/ 96');
    });

    it('formatea soles con decimales cuando se piden', () => {
      expect(formatearMonto(150.5, 'PEN', 2)).toBe('S/ 150.50');
    });

    it('formatea euros con el simbolo del euro', () => {
      expect(formatearMonto(50, 'EUR')).toBe('€ 50');
    });

    it('acepta importes como texto (llegan asi del backend)', () => {
      expect(formatearMonto('96', 'PEN')).toBe('S/ 96');
    });

    it('devuelve cadena vacia cuando no hay importe', () => {
      expect(formatearMonto(null, 'PEN')).toBe('');
      expect(formatearMonto(undefined, 'PEN')).toBe('');
    });
  });
});
