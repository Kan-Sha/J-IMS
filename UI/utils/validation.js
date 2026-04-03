export const MAX_FEE_DIGITS = 7;

export function formatCurrency(amount) {
  if (amount == null || isNaN(amount)) return '0';
  const n = Math.max(0, Math.floor(Number(amount)));
  const s = String(n);
  return s.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export function parseCurrency(str) {
  if (str == null) return 0;
  const cleaned = String(str).replace(/[^\d]/g, '');
  if (!cleaned) return 0;
  const n = parseInt(cleaned, 10);
  return isNaN(n) ? 0 : n;
}

export function countDigits(value) {
  const n = Math.abs(parseCurrency(value));
  return String(n).length;
}

export function isFeeWithinLimit(value) {
  return countDigits(value) <= MAX_FEE_DIGITS;
}

