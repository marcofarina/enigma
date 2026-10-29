/**
 * Conteggi dello spazio delle chiavi. Usano `bigint` perché i numeri superano presto la
 * precisione di `number` (2⁵³).
 */

function factorial(n: number): bigint {
  let result = 1n;
  for (let i = 2n; i <= BigInt(n); i++) result *= i;
  return result;
}

/**
 * Modi di collegare `cables` cavi sul pannello a spine da 26 prese:
 * 26! / ((26 − 2n)! · n! · 2ⁿ). Si scelgono le 2n lettere collegate, le si divide in coppie
 * e non conta né l’ordine delle coppie né quello delle due lettere in una coppia.
 */
export function plugboardSettings(cables: number): bigint {
  if (!Number.isInteger(cables) || cables < 0 || cables > 13) {
    throw new RangeError('Il pannello a spine accetta da 0 a 13 cavi.');
  }
  return factorial(26) / (factorial(26 - 2 * cables) * factorial(cables) * 2n ** BigInt(cables));
}
