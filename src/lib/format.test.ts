import { describe, expect, it } from 'vitest';
import { groupDigits, scientific } from './format.ts';

describe('formattazione dei numeri', () => {
  it('raggruppa le cifre a tre a tre', () => {
    expect(groupDigits(17_576)).toBe('17\u00a0576');
    expect(groupDigits(150_738_274_937_250n)).toBe('150\u00a0738\u00a0274\u00a0937\u00a0250');
    expect(groupDigits(325)).toBe('325');
    expect(groupDigits(17_576, ' ')).toBe('17 576');
  });

  it('scrive i numeri grandi in notazione scientifica', () => {
    expect(scientific(107_458_687_327_250_619_360_000n)).toBe('1,07 × 10²³');
    expect(scientific(62_583_939_499_390_760_715_264_000n)).toBe('6,26 × 10²⁵');
    expect(scientific(99_960n)).toBe('1,00 × 10⁵');
    expect(scientific(325n)).toBe('325');
  });
});
