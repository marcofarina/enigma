import { useMemo, useState, type CSSProperties } from 'react';
import {
  addIndicator,
  chains,
  createMachine,
  cycleNotation,
  cycles,
  defaultConfig,
  doubledIndicators,
  emptyCharacteristic,
  hasPairedCycles,
  isComplete,
  PRODUCT_NAMES,
  toIndex,
  toLetter,
  type PartialCharacteristic,
  type PartialPermutation,
  type ProductName,
} from '@/engine';
import { t, tf } from '@/i18n';

/** Una giornata d’esempio: Enigma I con sei cavi, come nei primi anni Trenta. */
const DAY = createMachine({
  ...defaultConfig('I'),
  rotors: ['II', 'I', 'III'],
  positions: 'KUL',
  plugboard: ['AM', 'FI', 'NV', 'PS', 'TU', 'WZ'],
});

const LETTER_R = 11;
const FORWARD = 'var(--signal-forward-paper)';
const RETURN = 'var(--signal-return-paper)';

/** Chiavi di messaggio in un ordine fisso, finché AD, BE e CF sono tutte complete (Rejewski 1980, p. 6). */
function dayKeys(): string[] {
  let seed = 1938;
  const next = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return (seed >>> 16) % 26;
  };
  const keys: string[] = [];
  let partial: PartialCharacteristic = emptyCharacteristic();
  while (keys.length < 600 && !PRODUCT_NAMES.every((name) => isComplete(partial[name]))) {
    const key = toLetter(next()) + toLetter(next()) + toLetter(next());
    keys.push(key);
    const [indicator] = doubledIndicators(DAY, [key]);
    partial = addIndicator(partial, indicator ?? '');
  }
  return keys;
}

interface Link {
  from: number;
  to: number;
}

function pointOn(radius: number, angle: number): [number, number] {
  return [radius * Math.cos(angle), radius * Math.sin(angle)];
}

/** Un ciclo chiuso disegnato come anello: le frecce si tracciano una dopo l’altra. */
function Ring({ cycle, latest }: { cycle: number[]; latest: Link | null }) {
  const n = cycle.length;
  const label = tf('lesson.indicators.cycleLabel', { cycle: `(${cycle.map(toLetter).join('')})` });
  const marked = (i: number): Link | null => {
    const from = cycle[i] ?? 0;
    const to = cycle[(i + 1) % n] ?? 0;
    return latest !== null && latest.from === from && latest.to === to ? latest : null;
  };

  if (n === 1) {
    const letter = cycle[0] ?? 0;
    const isLatest = latest !== null && latest.from === letter && latest.to === letter;
    const colour = isLatest ? FORWARD : 'var(--ink-muted)';
    return (
      <svg role="img" aria-label={label} viewBox="-22 -40 44 62" width="44" height="62" className="inchiostro">
        <path
          d="M -7 -10 A 9 9 0 1 1 7 -10"
          pathLength="1"
          fill="none"
          stroke={colour}
          strokeWidth="2"
          className="tracciato"
          style={{ '--dur': 'var(--dur-signal)' } as CSSProperties}
        />
        <circle r={LETTER_R} fill="var(--color-surface)" stroke="var(--field-border)" />
        <text textAnchor="middle" dominantBaseline="central" className="fill-ink font-mono text-[13px] font-bold">
          {toLetter(letter)}
        </text>
      </svg>
    );
  }

  const radius = Math.max(22, 15 / Math.sin(Math.PI / n));
  const half = radius + LETTER_R + 3;
  const gap = (LETTER_R + 3) / radius;
  const angle = (i: number) => -Math.PI / 2 + (2 * Math.PI * i) / n;

  return (
    <svg
      role="img"
      aria-label={label}
      viewBox={`${-half} ${-half} ${half * 2} ${half * 2}`}
      width={half * 2}
      height={half * 2}
      className="inchiostro max-w-full"
    >
      {cycle.map((from, i) => {
        const start = pointOn(radius, angle(i) + gap);
        const end = pointOn(radius, angle(i + 1) - gap);
        const last = angle(i + 1) - gap;
        const tangent: [number, number] = [-Math.sin(last), Math.cos(last)];
        const normal: [number, number] = [Math.cos(last), Math.sin(last)];
        const base: [number, number] = [end[0] - tangent[0] * 6, end[1] - tangent[1] * 6];
        const head = [
          end,
          [base[0] + normal[0] * 3.5, base[1] + normal[1] * 3.5],
          [base[0] - normal[0] * 3.5, base[1] - normal[1] * 3.5],
        ]
          .map((point) => point.join(','))
          .join(' ');
        const colour = marked(i) ? FORWARD : 'var(--ink-muted)';
        return (
          <g key={`${from}-${i}`}>
            <path
              d={`M ${start.join(' ')} A ${radius} ${radius} 0 0 1 ${end.join(' ')}`}
              pathLength="1"
              fill="none"
              stroke={colour}
              strokeWidth={marked(i) ? 2.5 : 1.5}
              className="tracciato"
              style={{ '--dur': 'var(--dur-signal)', '--ritardo': `calc(var(--dur-signal) * ${i})` } as CSSProperties}
            />
            <polygon
              points={head}
              fill={colour}
              className="inchiostro"
              style={{ animationDelay: `calc(var(--dur-signal) * ${i + 1})`, animationFillMode: 'backwards' }}
            />
          </g>
        );
      })}
      {cycle.map((letter, i) => {
        const [x, y] = pointOn(radius, angle(i));
        const stroke =
          latest !== null && latest.from === letter
            ? FORWARD
            : latest !== null && latest.to === letter
              ? RETURN
              : 'var(--field-border)';
        return (
          <g key={`${letter}-${i}`} transform={`translate(${x} ${y})`}>
            <circle
              r={LETTER_R}
              fill="var(--color-surface)"
              stroke={stroke}
              strokeWidth={stroke === 'var(--field-border)' ? 1 : 2.5}
            />
            <text textAnchor="middle" dominantBaseline="central" className="fill-ink font-mono text-[13px] font-bold">
              {toLetter(letter)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function Chain({ chain, latest }: { chain: number[]; latest: Link | null }) {
  const label = tf('lesson.indicators.chainLabel', { chain: chain.map(toLetter).join(' → ') });
  return (
    <span
      role="img"
      aria-label={label}
      className="figure-result inchiostro flex max-w-full flex-wrap items-center gap-x-1 font-mono !px-2 !py-1"
    >
      <span aria-hidden="true" className="text-text-muted">
        …
      </span>
      {chain.map((letter, i) => (
        <span key={letter} aria-hidden="true" className="flex items-center gap-1">
          {i > 0 && <span className="text-text-muted">→</span>}
          <span
            className="font-bold"
            style={{
              color: latest?.from === letter ? FORWARD : latest?.to === letter ? RETURN : undefined,
            }}
          >
            {toLetter(letter)}
          </span>
        </span>
      ))}
      <span aria-hidden="true" className="text-text-muted">
        …
      </span>
    </span>
  );
}

function knownCount(map: PartialPermutation): number {
  return map.filter((target) => target !== null).length;
}

function describe(name: ProductName, map: PartialPermutation): string {
  const { closed, open } = chains(map);
  return `${name}, ${tf('lesson.indicators.known', { known: knownCount(map) })}, ${closed.length} cicli chiusi, ${open.length} catene aperte`;
}

/**
 * La struttura in cicli di AD, BE e CF che si costruisce indicatore dopo indicatore, come la
 * ricavava Rejewski dagli indicatori doppi di una giornata (1980, p. 6).
 */
export default function CicliIndicatori() {
  const model = useMemo(() => {
    const keys = dayKeys();
    const indicators = doubledIndicators(DAY, keys);
    const steps: PartialCharacteristic[] = [emptyCharacteristic()];
    for (const indicator of indicators) {
      steps.push(addIndicator(steps.at(-1) ?? emptyCharacteristic(), indicator));
    }
    return { keys, indicators, steps };
  }, []);
  const total = model.indicators.length;
  const [count, setCount] = useState(0);

  const partial = model.steps[count] ?? emptyCharacteristic();
  const indicator = count > 0 ? (model.indicators[count - 1] ?? '') : '';
  const key = count > 0 ? (model.keys[count - 1] ?? '') : '';
  const latest: Record<ProductName, Link | null> = {
    AD: indicator ? { from: toIndex(indicator.charAt(0)), to: toIndex(indicator.charAt(3)) } : null,
    BE: indicator ? { from: toIndex(indicator.charAt(1)), to: toIndex(indicator.charAt(4)) } : null,
    CF: indicator ? { from: toIndex(indicator.charAt(2)), to: toIndex(indicator.charAt(5)) } : null,
  };
  const summary = tf('lesson.indicators.summary', {
    count,
    ad: describe('AD', partial.AD),
    be: describe('BE', partial.BE),
    cf: describe('CF', partial.CF),
  });
  const advance = (by: number) => setCount((c) => Math.min(total, c + by));

  return (
    <figure className="my-8 font-sans text-base">
      <div className="flex flex-col gap-4 figure-panel">
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn btn-primary" disabled={count >= total} onClick={() => advance(1)}>
            {t('lesson.indicators.add')}
          </button>
          <button type="button" className="btn" disabled={count >= total} onClick={() => advance(10)}>
            {t('lesson.indicators.addTen')}
          </button>
          <button type="button" className="btn" disabled={count >= total} onClick={() => setCount(total)}>
            {t('lesson.indicators.complete')}
          </button>
          <button type="button" className="btn" disabled={count === 0} onClick={() => setCount(0)}>
            {t('lesson.indicators.reset')}
          </button>
        </div>

        <p className="font-mono text-lg" aria-hidden={count === 0 ? 'true' : undefined}>
          {count === 0 ? (
            <span className="text-text-muted">······</span>
          ) : (
            <span key={count} className="inchiostro inline-block">
              <span className="font-bold" style={{ color: FORWARD }}>
                {indicator.slice(0, 3)}
              </span>
              <span className="font-bold" style={{ color: RETURN }}>
                {indicator.slice(3)}
              </span>
            </span>
          )}
        </p>
        <p className="text-sm text-text-muted">
          <span className="font-bold" style={{ color: FORWARD }}>
            ■
          </span>{' '}
          {t('lesson.indicators.legendForward')} ·{' '}
          <span className="font-bold" style={{ color: RETURN }}>
            ■
          </span>{' '}
          {t('lesson.indicators.legendReturn')}
        </p>
        <p aria-live="polite" className="text-sm">
          {count === 0
            ? t('lesson.indicators.start')
            : tf('lesson.indicators.last', {
                count,
                key,
                indicator,
                a: indicator.charAt(0),
                d: indicator.charAt(3),
                b: indicator.charAt(1),
                e: indicator.charAt(4),
                c: indicator.charAt(2),
                f: indicator.charAt(5),
              })}
        </p>

        <div className="grid gap-4 sm:grid-cols-3">
          {PRODUCT_NAMES.map((name) => {
            const map = partial[name];
            const { closed, open } = chains(map);
            const complete = isComplete(map);
            const parts = complete ? cycles(map).sort((a, b) => b.length - a.length) : [];
            return (
              <section key={name} aria-label={describe(name, map)} className="figure-result flex flex-col gap-3">
                <h3 className="flex items-baseline justify-between font-mono text-lg font-bold">
                  {name}
                  <span className="font-sans text-sm font-normal text-text-muted">
                    {tf('lesson.indicators.known', { known: knownCount(map) })}
                  </span>
                </h3>
                <div className="flex flex-col gap-1">
                  <h4 className="text-caption text-text-muted">{t('lesson.indicators.closed')}</h4>
                  {closed.length === 0 ? (
                    <p className="text-sm text-text-muted">{t('lesson.indicators.none')}</p>
                  ) : (
                    <ul className="m-0 flex list-none flex-wrap items-center gap-2 p-0">
                      {closed.map((cycle) => (
                        <li key={cycle.join('-')}>
                          <Ring cycle={cycle} latest={latest[name]} />
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  <h4 className="text-caption text-text-muted">{t('lesson.indicators.open')}</h4>
                  {open.length === 0 ? (
                    <p className="text-sm text-text-muted">{t('lesson.indicators.none')}</p>
                  ) : (
                    <ul className="m-0 flex min-w-0 list-none flex-col items-start gap-1 p-0">
                      {open.map((chain) => (
                        <li key={chain.join('-')}>
                          <Chain chain={chain} latest={latest[name]} />
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                {complete && (
                  <p className="text-sm">
                    <span className="font-mono">{cycleNotation(map)}</span>
                    <br />
                    {tf('lesson.indicators.done', {
                      count: parts.length,
                      lengths: parts.map((cycle) => cycle.length).join(', '),
                    })}{' '}
                    {hasPairedCycles(map) && t('lesson.indicators.paired')}
                  </p>
                )}
              </section>
            );
          })}
        </div>
        <p className="sr-only" aria-live="polite">
          {summary}
        </p>
      </div>
    </figure>
  );
}
