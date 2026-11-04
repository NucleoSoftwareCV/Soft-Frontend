/**
 * Formato de moneda para OONA (Perú).
 *
 * El backend entrega el precio junto al código ISO 4217 de la moneda
 * (PEN, EUR, USD...). La interfaz debe mostrarlo con el símbolo local:
 *
 *   PEN -> "S/ 96"     (sol peruano)
 *   EUR -> "€ 50"
 *   USD -> "US$ 30"
 *
 * Para cualquier otro código se muestra el propio código delante del
 * importe. El número usa la convención peruana: coma para miles y
 * punto decimal ("S/ 1,250.50").
 */

const SIMBOLOS_MONEDA: Record<string, string> = {
  PEN: 'S/',
  EUR: '€',
  USD: 'US$',
};

/** Devuelve el símbolo asociado a un código ISO de moneda (PEN -> "S/"). */
export function simboloMoneda(moneda?: string | null): string {
  const codigo = (moneda ?? 'PEN').trim().toUpperCase();
  return SIMBOLOS_MONEDA[codigo] ?? codigo;
}

/**
 * Formatea un importe con el símbolo de su moneda.
 *
 *   formatearMonto(96, 'PEN')        -> "S/ 96"
 *   formatearMonto(150.5, 'PEN', 2)  -> "S/ 150.50"
 *   formatearMonto(50, 'EUR')        -> "€ 50"
 *
 * Si no llega valor devuelve cadena vacía; la lógica de "Gratis"
 * la decide cada pantalla antes de llamar aquí.
 */
export function formatearMonto(
  valor: number | string | null | undefined,
  moneda?: string | null,
  decimales = 0,
): string {
  const numero = Number(valor);
  if (valor === null || valor === undefined || !Number.isFinite(numero)) {
    return '';
  }
  const monto = new Intl.NumberFormat('es-PE', {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  }).format(numero);
  return `${simboloMoneda(moneda)} ${monto}`;
}
