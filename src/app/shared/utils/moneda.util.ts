const currencySymbols = new Map([
  ['PEN', 'S/'],
  ['EUR', '€'],
  ['USD', 'US$'],
]);
const amountFormat = new Intl.NumberFormat('es-PE', { maximumFractionDigits: 2 });

export function formatDisplayPrice(
  value: number | string | null | undefined,
  currency: string | null | undefined,
): string {
  if (value == null || (typeof value === 'string' && value.trim() === '')) {
    return '';
  }
  const amount = Number(value);
  if (!Number.isFinite(amount)) {
    return '';
  }
  const code = currency?.trim().toUpperCase() || 'PEN';
  const symbol = currencySymbols.get(code) ?? code;
  return `${symbol} ${amountFormat.format(amount)}`;
}
