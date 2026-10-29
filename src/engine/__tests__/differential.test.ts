import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { encipherWith, type MachineConfig } from '../index.ts';

/**
 * Confronto con il motore del simulatore originale di Summerside Makerspace.
 * I vettori sono generati da `scripts/legacy/generate-vectors.cjs`; per un controllo più ampio si
 * può puntare `LEGACY_VECTORS` a un file generato con più configurazioni.
 *
 * Divergenze volute, escluse dai vettori: riflettore delle macchine commerciali fuori dalla
 * posizione A, Uhr fuori dall’Enigma I, UKW-D fuori da Enigma I e M4, gestione dei caratteri
 * non validi.
 */
interface Vector {
  config: MachineConfig;
  plaintext: string;
  ciphertext: string;
}

const path = process.env['LEGACY_VECTORS'] ?? new URL('../../../fixtures/legacy-vectors.json', import.meta.url);
const { vectors } = JSON.parse(readFileSync(path, 'utf8')) as { vectors: Vector[] };

describe('confronto con il motore originale', () => {
  it(`coincide su ${vectors.length} configurazioni casuali di tutti i modelli`, () => {
    const mismatches = vectors.filter(
      ({ config, plaintext, ciphertext }) => encipherWith(config, plaintext) !== ciphertext,
    );
    expect(mismatches.slice(0, 3)).toEqual([]);
  }, 120_000);

  it('copre tutti i modelli, l’Uhr e l’UKW-D', () => {
    const models = new Set(vectors.map((v) => v.config.model));
    expect(models.size).toBe(15);
    expect(vectors.some((v) => v.config.uhr !== undefined)).toBe(true);
    expect(vectors.some((v) => v.config.reflector === 'D')).toBe(true);
  });
});
