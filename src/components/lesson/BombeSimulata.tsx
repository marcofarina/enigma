import { useEffect, useId, useMemo, useState } from 'react';
import { toLetter } from '@/engine';
import { t, tf } from '@/i18n';
import {
  buildMenu,
  crashes,
  menuLetters,
  menuLoops,
  runBombe,
  type BombeStop,
  type MenuEdge,
} from '@/cryptanalysis/bombe.ts';
import { BOMBE_CIPHER, BOMBE_CRIB, BOMBE_KEY } from '@/cryptanalysis/example.ts';

const SHOWN = 40;
const TOTAL = 26 * 26 * 26;
const CHUNK = 400;
const SIZE = 340;
const RADIUS = 140;

/** Lettere del menu in ordine di visita, così le lettere collegate stanno vicine sul cerchio. */
function circleOrder(edges: readonly MenuEdge[]): number[] {
  const letters = menuLetters(edges);
  const order: number[] = [];
  const visit = (letter: number) => {
    if (order.includes(letter)) return;
    order.push(letter);
    for (const { a, b } of edges) {
      if (a === letter) visit(b);
      else if (b === letter) visit(a);
    }
  };
  for (const letter of letters) visit(letter);
  return order;
}

function MenuGraph({ edges, loops, test }: { edges: readonly MenuEdge[]; loops: MenuEdge[][]; test: number }) {
  const order = circleOrder(edges);
  const point = (letter: number) => {
    const angle = (2 * Math.PI * order.indexOf(letter)) / order.length - Math.PI / 2;
    return { x: SIZE / 2 + RADIUS * Math.cos(angle), y: SIZE / 2 + RADIUS * Math.sin(angle) };
  };
  const inLoop = new Set(loops.flat());
  const seenPairs = new Map<string, number>();
  return (
    <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="mx-auto w-full max-w-sm" aria-hidden="true">
      {edges.map((edge) => {
        const p = point(edge.a);
        const q = point(edge.b);
        const pair = [edge.a, edge.b].sort().join('-');
        const repeat = seenPairs.get(pair) ?? 0;
        seenPairs.set(pair, repeat + 1);
        // I collegamenti ripetuti tra le stesse lettere si curvano, per restare distinguibili.
        const bend = repeat === 0 ? 0 : 28 * (repeat % 2 === 1 ? 1 : -1) * Math.ceil(repeat / 2);
        const mx = (p.x + q.x) / 2;
        const my = (p.y + q.y) / 2;
        const length = Math.hypot(q.x - p.x, q.y - p.y) || 1;
        const cx = mx + (bend * -(q.y - p.y)) / length;
        const cy = my + (bend * (q.x - p.x)) / length;
        const loop = inLoop.has(edge);
        return (
          <g key={edge.index}>
            <path
              d={`M ${p.x} ${p.y} Q ${cx} ${cy} ${q.x} ${q.y}`}
              fill="none"
              className={loop ? 'stroke-signal-forward' : 'stroke-border'}
              strokeWidth={loop ? 3 : 1.5}
            />
            <text
              x={(mx + cx) / 2}
              y={(my + cy) / 2}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={10}
              className="fill-text stroke-surface font-mono"
              strokeWidth={3}
              paintOrder="stroke"
            >
              {edge.index + 1}
            </text>
          </g>
        );
      })}
      {order.map((letter) => {
        const { x, y } = point(letter);
        return (
          <g key={letter}>
            <circle
              cx={x}
              cy={y}
              r={14}
              className={letter === test ? 'fill-lamp-on stroke-text' : 'fill-surface stroke-text'}
              strokeWidth={letter === test ? 2.5 : 1.5}
            />
            <text
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={13}
              className="fill-text font-mono font-bold"
            >
              {toLetter(letter)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

type Run =
  { status: 'idle' } | { status: 'running'; done: number; stops: BombeStop[] } | { status: 'done'; stops: BombeStop[] };

/**
 * Dal crib alla Bombe: si fa scorrere il crib lungo il testo cifrato, si scartano le posizioni in
 * cui una lettera cifrerebbe sé stessa, si costruisce il menu e lo si fa provare alla Bombe sulle
 * 17 576 posizioni di partenza dei rotori, con l’ordine dei rotori già noto.
 */
export default function BombeSimulata() {
  const id = useId();
  const [offset, setOffset] = useState(3);
  const [run, setRun] = useState<Run>({ status: 'idle' });
  const allCrashes = useMemo(() => crashes(BOMBE_CIPHER, BOMBE_CRIB), []);
  const maxOffset = Math.min(allCrashes.length, SHOWN - BOMBE_CRIB.length + 1) - 1;
  const crash = allCrashes[offset] ?? -1;
  const edges = useMemo(() => buildMenu(BOMBE_CRIB, BOMBE_CIPHER.slice(offset)), [offset]);
  const loops = useMemo(() => menuLoops(edges), [edges]);
  const test = menuLetters(edges)[0] ?? 0;

  // La Bombe gira a blocchi, così la pagina resta reattiva; cambiare posizione la ferma.
  useEffect(() => {
    if (run.status !== 'running') return;
    const handle = window.setTimeout(() => {
      const end = Math.min(run.done + CHUNK, TOTAL);
      const stops = [...run.stops, ...runBombe({ key: BOMBE_KEY, edges, offset }, run.done, end)];
      setRun(end === TOTAL ? { status: 'done', stops } : { status: 'running', done: end, stops });
    }, 0);
    return () => window.clearTimeout(handle);
  }, [run, edges, offset]);

  const move = (next: number) => {
    setOffset(Math.max(0, Math.min(maxOffset, next)));
    setRun({ status: 'idle' });
  };
  const button =
    'min-h-11 rounded-md border-2 border-border bg-surface px-3 font-semibold hover:border-accent disabled:cursor-not-allowed disabled:opacity-50';
  const stops = run.status === 'idle' ? [] : run.stops;
  const isTrue = (stop: BombeStop) => offset === 0 && stop.positions === BOMBE_KEY.positions;

  return (
    <figure className="my-8 font-sans text-base">
      <div className="flex flex-col gap-5 rounded-xl border border-border bg-surface p-4">
        <section aria-labelledby={`${id}-crib`} className="flex flex-col gap-3">
          <h3 id={`${id}-crib`} className="font-semibold">
            {t('lesson.bombe.cribTitle')}
          </h3>
          <div
            className="overflow-x-auto"
            // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
            tabIndex={0}
            role="region"
            aria-label={t('lesson.bombe.alignment')}
          >
            <table className="border-collapse font-mono">
              <caption className="sr-only">{t('lesson.bombe.alignment')}</caption>
              <tbody>
                <tr>
                  <th scope="row" className="pe-2 text-left font-sans text-sm font-normal text-text-muted">
                    {t('lesson.bombe.cipher')}
                  </th>
                  {[...BOMBE_CIPHER.slice(0, SHOWN)].map((letter, i) => (
                    <td key={i} className="w-6 text-center">
                      {letter}
                    </td>
                  ))}
                </tr>
                <tr>
                  <th scope="row" className="pe-2 text-left font-sans text-sm font-normal text-text-muted">
                    {t('lesson.bombe.crib')}
                  </th>
                  {Array.from({ length: SHOWN }, (_, i) => {
                    const k = i - offset;
                    const letter = BOMBE_CRIB[k];
                    const crashed = k === crash && crash >= 0;
                    return (
                      <td
                        key={i}
                        className={[
                          'w-6 text-center',
                          letter ? 'font-bold' : '',
                          crashed ? 'rounded-sm bg-plug-red text-accent-contrast' : '',
                        ].join(' ')}
                      >
                        {letter ?? ''}
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" className={button} disabled={offset === 0} onClick={() => move(offset - 1)}>
              ← {t('lesson.bombe.left')}
            </button>
            <button type="button" className={button} disabled={offset === maxOffset} onClick={() => move(offset + 1)}>
              {t('lesson.bombe.right')} →
            </button>
            <label className="flex items-center gap-2">
              {t('lesson.bombe.offset')}
              <input
                type="range"
                min={0}
                max={maxOffset}
                value={offset}
                onChange={(e) => move(Number(e.target.value))}
                className="w-40"
              />
            </label>
          </div>
          <p role="status" className={crash >= 0 ? 'font-semibold' : ''}>
            {crash >= 0
              ? tf('lesson.bombe.crash', { position: offset + 1, letter: BOMBE_CRIB[crash] ?? '' })
              : tf('lesson.bombe.noCrash', { position: offset + 1 })}
          </p>
        </section>

        {crash < 0 && (
          <section aria-labelledby={`${id}-menu`} className="flex flex-col gap-3">
            <h3 id={`${id}-menu`} className="font-semibold">
              {t('lesson.bombe.menuTitle')}
            </h3>
            <MenuGraph edges={edges} loops={loops} test={test} />
            <p>
              {loops.length === 1
                ? tf('lesson.bombe.loopsOne', { test: toLetter(test) })
                : tf('lesson.bombe.loops', { count: loops.length, test: toLetter(test) })}
            </p>
            {loops.length > 0 && (
              <ul className="list-disc ps-5 font-mono text-sm">
                {loops.map((loop) => (
                  <li key={loop[0]?.index}>
                    {loop.map((edge) => `${toLetter(edge.a)}${toLetter(edge.b)} (${edge.index + 1})`).join(' · ')}
                  </li>
                ))}
              </ul>
            )}
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                className={button}
                disabled={run.status === 'running'}
                onClick={() => setRun({ status: 'running', done: 0, stops: [] })}
              >
                {t('lesson.bombe.run')}
              </button>
              {run.status !== 'idle' && (
                <label className="flex items-center gap-2 text-sm">
                  {t('lesson.bombe.progress')}
                  <progress max={TOTAL} value={run.status === 'done' ? TOTAL : run.done} className="w-40" />
                </label>
              )}
            </div>
            <div aria-live="polite">
              {run.status === 'done' && (
                <p>
                  {stops.length === 0
                    ? t('lesson.bombe.noStops')
                    : stops.length === 1
                      ? t('lesson.bombe.stopsOne')
                      : tf('lesson.bombe.stops', { count: stops.length })}
                </p>
              )}
            </div>
            {stops.length > 0 && (
              <ul className="m-0 flex list-none flex-col gap-1 ps-0">
                {stops.slice(0, 12).map((stop) => (
                  <li key={stop.positions} className="font-mono">
                    {tf('lesson.bombe.stop', {
                      positions: stop.positions,
                      test: toLetter(test),
                      partner: toLetter(stop.partner),
                    })}
                    {run.status === 'done' && (
                      <span className="ms-2 font-sans text-sm font-semibold">
                        {isTrue(stop) ? t('lesson.bombe.true') : t('lesson.bombe.false')}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </div>
      <figcaption className="mt-2 text-sm text-text-muted">
        {tf('lesson.bombe.caption', { rotors: BOMBE_KEY.rotors.join(' – ') })}
      </figcaption>
    </figure>
  );
}
