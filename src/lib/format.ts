/**
 * Raggruppa le cifre a tre a tre, come nel testo delle lezioni. Per difetto lo spazio non va a
 * capo; con `' '` i numeri molto lunghi possono andare a capo tra un gruppo e l’altro.
 */
export function groupDigits(value: bigint | number, separator = '\u00a0'): string {
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, separator);
}

const SUPERSCRIPT = '⁰¹²³⁴⁵⁶⁷⁸⁹';

/** Notazione scientifica all’italiana con tre cifre significative: “1,07 × 10²³”. */
export function scientific(value: bigint): string {
  const digits = value.toString();
  if (digits.length <= 3) return digits;
  const exponent = digits.length - 1;
  // Arrotonda a tre cifre significative; un riporto (999 → 1000) alza l’esponente.
  let mantissa = Math.round(Number(digits.slice(0, 4)) / 10);
  let power = exponent;
  if (mantissa >= 1000) {
    mantissa = 100;
    power += 1;
  }
  const text = `${Math.floor(mantissa / 100)},${String(mantissa % 100).padStart(2, '0')}`;
  const sup = [...String(power)].map((d) => SUPERSCRIPT[Number(d)]).join('');
  return `${text} × 10${sup}`;
}
