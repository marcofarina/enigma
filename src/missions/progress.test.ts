import { describe, expect, it } from 'vitest';
import { missionProgress } from './progress.ts';

describe('avanzamento di una missione', () => {
  const cipher = 'QWERTY';
  const plain = 'ABCDEF';

  it('riconosce il nastro vuoto e le lettere estranee al messaggio', () => {
    expect(missionProgress('', '', cipher, plain)).toEqual({ kind: 'empty' });
    expect(missionProgress('KCH', 'BLA', cipher, plain)).toEqual({ kind: 'other' });
  });

  it('conta le lettere decifrate correttamente', () => {
    expect(missionProgress('QWE', 'ABC', cipher, plain)).toEqual({ kind: 'ok', done: 3, total: 6 });
    expect(missionProgress(cipher, plain, cipher, plain)).toEqual({ kind: 'solved' });
  });

  it('indica la prima lettera che non torna', () => {
    expect(missionProgress('QWE', 'ABX', cipher, plain)).toEqual({ kind: 'wrong', at: 3 });
  });
});
