import { useMemo, useState, type CSSProperties } from 'react';
import {
  ALPHABET,
  buildMenu,
  createMachine,
  encipher,
  initialState,
  loopPermutation,
  menuCentre,
  menuComponents,
  menuLoops,
  step,
  testHypothesis,
  toIndex,
  toLetter,
  type MachineConfig,
  type MenuEdge,
} from '@/engine';
import { t, tf } from '@/i18n';

/** La chiave dell’esempio del README del motore: Enigma M3 con dieci cavi. */
const CONFIG: MachineConfig = {
  model: 'M3',
  rotors: ['II', 'IV', 'V'],
  rings: 'BUL',
  positions: 'BLA',
  reflector: 'B',
  plugboard: ['AV', 'BS', 'CG', 'DL', 'FU', 'HZ', 'IN', 'KM', 'OW', 'RX'],
};

interface Props {
  /** Il pezzo di testo in chiaro che si suppone di conoscere. */
  crib?: string;
  /** Il messaggio in chiaro da cui nasce il testo cifrato; contiene il crib. */
  messaggio?: string;
}

const FORWARD = 'var(--signal-forward-paper)';
const RETURN = 'var(--signal-return-paper)';
const SIZE = 360;
const NODE_R = 14;

type Point = [number, number];

/** I segmenti del grafo: dall’estremo `from` all’estremo `to`, accorciati sul bordo dei nodi. */
function segment(a: Point, b: Point, lane: number): { start: Point; end: Point; mid: Point } {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const length = Math.hypot(dx, dy) || 1;
  const ux = dx / length;
  const uy = dy / length;
  const ox = -uy * lane;
  const oy = ux * lane;
  const trim = NODE_R + 1;
  const start: Point = [a[0] + ux * trim + ox, a[1] + uy * trim + oy];
  const end: Point = [b[0] - ux * trim + ox, b[1] - uy * trim + oy];
  return { start, end, mid: [(a[0] + b[0]) / 2 + ox, (a[1] + b[1]) / 2 + oy] };
}

/**
 * Il menu di un crib e la prova della Bombe: crib e testo cifrato allineati, il grafo dei
 * collegamenti, un anello da percorrere e un’ipotesi sul pannello che si propaga lungo il menu
 * finché non si contraddice (o regge).
 */
export default function MenuBombe({
  crib = 'WETTERVORHERSAGE',
  messaggio = 'KEINEBESONDERENEREIGNISSEWETTERVORHERSAGEBISKAYA',
}: Props) {
  const model = useMemo(() => {
    const machine = createMachine(CONFIG);
    const start = initialState(machine);
    const offset = messaggio.indexOf(crib);
    if (offset < 0) throw new RangeError('Il crib non compare nel messaggio.');
    const ciphertext = encipher(machine, start, messaggio).output;
    const menu = buildMenu(crib, ciphertext, offset);
    const loops = menuLoops(menu);
    const centre = menuCentre(menu);
    const first = new Set(loops[0]?.letters ?? []);
    const order = [
      ...(loops[0]?.letters ?? []),
      ...menuComponents(menu)
        .flat()
        .filter((l) => !first.has(l)),
    ];
    const nodes = new Map<string, Point>(
      order.map((letter, i) => {
        const angle = -Math.PI / 2 + (2 * Math.PI * i) / order.length;
        const radius = SIZE / 2 - NODE_R - 22;
        return [letter, [SIZE / 2 + radius * Math.cos(angle), SIZE / 2 + radius * Math.sin(angle)]];
      }),
    );
    // Collegamenti fra le stesse due lettere: si affiancano.
    const lanes = new Map<MenuEdge, number>();
    const groups = new Map<string, MenuEdge[]>();
    for (const edge of menu.edges) {
      const key = [edge.plain, edge.cipher].sort().join('');
      groups.set(key, [...(groups.get(key) ?? []), edge]);
    }
    for (const group of groups.values()) group.forEach((edge, i) => lanes.set(edge, (i - (group.length - 1) / 2) * 9));
    const steckered = (letter: string) => toLetter(machine.plugboard.forward[toIndex(letter)] ?? 0);
    return { machine, start, menu, loops, centre, nodes, lanes, steckered };
  }, [crib, messaggio]);
  const { machine, menu, loops, nodes, lanes, steckered } = model;

  const [loopIndex, setLoopIndex] = useState(0);
  const [letter, setLetter] = useState(model.centre);
  const [partner, setPartner] = useState(() => model.steckered(model.centre));
  const [shift, setShift] = useState(0);
  const [diagonal, setDiagonal] = useState(true);
  const [shown, setShown] = useState(1);
  const [tour, setTour] = useState(0);

  const restart = () => setShown(1);
  const state = useMemo(() => {
    let current = model.start;
    for (let i = 0; i < shift; i++) current = step(machine, current).state;
    return current;
  }, [machine, model.start, shift]);
  const result = useMemo(
    () => testHypothesis(machine, state, menu, { letter, partner }, { diagonalBoard: diagonal }),
    [machine, state, menu, letter, partner, diagonal],
  );
  // La Bombe si ferma alla prima contraddizione: le conseguenze che seguirebbero non servono.
  const total = result.contradictions[0] ? result.contradictions[0].deduction + 1 : result.deductions.length;
  const visible = Math.min(shown, total);
  const loop = loops[loopIndex] ?? loops[0];
  const edgeLetters = (edge: MenuEdge) => ({ a: nodes.get(edge.plain) ?? [0, 0], b: nodes.get(edge.cipher) ?? [0, 0] });

  const shownDeductions = result.deductions.slice(0, visible);
  const shownPartners = new Map<string, string[]>();
  for (const d of shownDeductions) shownPartners.set(d.letter, [...(shownPartners.get(d.letter) ?? []), d.partner]);
  const clashes = result.contradictions.filter((c) => c.deduction < visible);
  const firstClash = clashes[0];

  const status = firstClash
    ? tf('lesson.menu.contradicted', {
        n: firstClash.deduction + 1,
        letter: firstClash.letter,
        first: firstClash.partners[0],
        second: firstClash.partners[1],
      })
    : visible < total
      ? tf('lesson.menu.partial', { shown: visible, total })
      : tf('lesson.menu.consistent', { total });

  const loopImage = (() => {
    if (!loop) return null;
    const first = loop.letters[0] ?? '';
    const mate = steckered(first);
    const image = loopPermutation(machine, state, loop)[toIndex(mate)] ?? 0;
    return { first, mate, image: toLetter(image) };
  })();

  const select = 'field field-mono min-w-0 max-w-full';
  const setHypothesis = (nextLetter: string, nextPartner: string) => {
    setLetter(nextLetter);
    setPartner(nextPartner);
    restart();
  };

  return (
    <figure className="my-8 font-sans text-base">
      <div className="flex flex-col gap-5 figure-panel">
        <div>
          <p className="mb-2 text-sm text-text-muted">{t('lesson.menu.stripCaption')}</p>
          <ol aria-label={t('lesson.menu.strip')} className="m-0 flex list-none flex-wrap gap-y-2 p-0 font-mono">
            {menu.edges.map((edge) => {
              const inLoop = loop?.edges.includes(edge) ?? false;
              return (
                <li
                  key={edge.position}
                  aria-label={tf('lesson.menu.column', {
                    position: edge.position + 1,
                    plain: edge.plain,
                    cipher: edge.cipher,
                  })}
                  className={`flex min-w-8 flex-col items-center border-x px-1 ${inLoop ? 'border-[var(--ink)] bg-[var(--paper)]' : 'border-transparent'}`}
                >
                  <span aria-hidden="true" className="text-xs text-text-muted">
                    {edge.position + 1}
                  </span>
                  <span aria-hidden="true" className="text-lg font-bold" style={{ color: FORWARD }}>
                    {edge.plain}
                  </span>
                  <span aria-hidden="true" className="text-lg font-bold" style={{ color: RETURN }}>
                    {edge.cipher}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>

        <div className="flex flex-wrap gap-4">
          <label className="flex max-w-full flex-wrap items-center gap-2">
            {t('lesson.menu.loop')}
            <select
              className={select}
              value={loopIndex}
              disabled={loops.length === 0}
              onChange={(e) => {
                setLoopIndex(Number(e.target.value));
                setTour(0);
              }}
            >
              {loops.map((l, i) => (
                <option key={l.edges.map((e) => e.position).join('-')} value={i}>
                  {tf('lesson.menu.loopOption', { letters: l.letters.join('–'), count: l.edges.length })}
                </option>
              ))}
            </select>
          </label>
          <button type="button" className="btn" disabled={!loop} onClick={() => setTour((n) => n + 1)}>
            {t('lesson.menu.tour')}
          </button>
        </div>

        <svg
          role="img"
          aria-label={t('lesson.menu.graph')}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className="mx-auto w-full max-w-[26rem]"
        >
          <g>
            {menu.edges.map((edge) => {
              const { a, b } = edgeLetters(edge);
              const { start, end, mid } = segment(a, b, lanes.get(edge) ?? 0);
              const inLoop = loop?.edges.includes(edge) ?? false;
              return (
                <g key={edge.position}>
                  <line
                    x1={start[0]}
                    y1={start[1]}
                    x2={end[0]}
                    y2={end[1]}
                    stroke={inLoop ? 'var(--ink)' : 'var(--field-border)'}
                    strokeWidth={inLoop ? 3 : 1.5}
                  />
                  <text
                    x={mid[0]}
                    y={mid[1]}
                    textAnchor="middle"
                    dominantBaseline="central"
                    paintOrder="stroke"
                    stroke="var(--paper-deep)"
                    strokeWidth="4"
                    className="fill-ink-muted font-mono text-[11px]"
                  >
                    {edge.position + 1}
                  </text>
                </g>
              );
            })}
          </g>

          {/* Il giro dell’anello: ogni collegamento si traccia nel verso in cui lo si percorre. */}
          {tour > 0 && loop && (
            <g key={`tour-${tour}-${loopIndex}`}>
              {loop.edges.map((edge, i) => {
                const from = loop.letters[i] ?? '';
                const to = loop.letters[(i + 1) % loop.letters.length] ?? '';
                const { start, end } = segment(
                  nodes.get(from) ?? [0, 0],
                  nodes.get(to) ?? [0, 0],
                  lanes.get(edge) ?? 0,
                );
                return (
                  <line
                    key={edge.position}
                    x1={start[0]}
                    y1={start[1]}
                    x2={end[0]}
                    y2={end[1]}
                    pathLength="1"
                    stroke={edge.plain === from ? FORWARD : RETURN}
                    strokeWidth="4"
                    className="tracciato"
                    style={{ '--ritardo': `calc(var(--dur-signal-slow) * ${i})` } as CSSProperties}
                  />
                );
              })}
            </g>
          )}

          {/* La propagazione dell’ipotesi: ogni deduzione lungo un collegamento si traccia nel suo verso. */}
          <g>
            {shownDeductions.map((d, i) => {
              if (d.cause.kind !== 'menu') return null;
              const source = result.deductions[d.cause.from];
              const from = source?.letter ?? '';
              const forward = d.cause.edge.plain === from;
              const lane = (lanes.get(d.cause.edge) ?? 0) + (forward ? 3.5 : -3.5);
              const { start, end } = segment(nodes.get(from) ?? [0, 0], nodes.get(d.letter) ?? [0, 0], lane);
              return (
                <line
                  key={`${i}-${visible === i + 1 ? 'new' : 'old'}`}
                  x1={start[0]}
                  y1={start[1]}
                  x2={end[0]}
                  y2={end[1]}
                  pathLength="1"
                  stroke={forward ? FORWARD : RETURN}
                  strokeWidth="2.5"
                  className={visible === i + 1 ? 'tracciato' : undefined}
                  style={{ '--dur': 'var(--dur-signal-slow)' } as CSSProperties}
                />
              );
            })}
          </g>

          {[...nodes.entries()].map(([name, [x, y]]) => {
            const partners = shownPartners.get(name);
            const clash = (partners?.length ?? 0) > 1;
            return (
              <g key={name} transform={`translate(${x} ${y})`}>
                <circle
                  r={NODE_R}
                  fill="var(--color-surface)"
                  stroke={clash ? 'var(--print-red)' : partners ? 'var(--ink)' : 'var(--field-border)'}
                  strokeWidth={clash ? 3 : partners ? 2 : 1.5}
                />
                <text
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="fill-ink font-mono text-[14px] font-bold"
                >
                  {name}
                </text>
                {partners && (
                  <text
                    y={NODE_R + 11}
                    textAnchor="middle"
                    dominantBaseline="central"
                    className={`font-mono text-[11px] font-bold ${clash ? 'fill-[var(--print-red)]' : 'fill-ink'}`}
                  >
                    {clash ? `${partners.join(' ≠ ')}` : `↔${partners[0]}`}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        <p className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-text-muted">
          <span>
            <span className="font-bold" style={{ color: FORWARD }}>
              ■
            </span>{' '}
            {t('lesson.menu.legendForward')}
          </span>
          <span>
            <span className="font-bold" style={{ color: RETURN }}>
              ■
            </span>{' '}
            {t('lesson.menu.legendReturn')}
          </span>
        </p>

        {loopImage && loop && (
          <p className="text-sm">
            {tf('lesson.menu.loopInfo', {
              letters: loop.letters.join('–'),
              positions: loop.edges.map((e) => e.position + 1).join(', '),
              partner: loopImage.mate,
              first: loopImage.first,
              image: loopImage.image,
            })}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-4">
          <label className="flex max-w-full flex-wrap items-center gap-2">
            {t('lesson.menu.letter')}
            <select
              className={select}
              value={letter}
              onChange={(e) => setHypothesis(e.target.value, steckered(e.target.value))}
            >
              {menu.letters.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </label>
          <label className="flex max-w-full flex-wrap items-center gap-2">
            {t('lesson.menu.partner')}
            <select className={select} value={partner} onChange={(e) => setHypothesis(letter, e.target.value)}>
              {[...ALPHABET].map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </label>
          <label className="flex max-w-full flex-wrap items-center gap-2">
            {t('lesson.menu.rotors')}
            <select
              className={select}
              value={shift}
              onChange={(e) => {
                setShift(Number(e.target.value));
                restart();
              }}
            >
              {Array.from({ length: 11 }, (_, n) => (
                <option key={n} value={n}>
                  {n === 0 ? t('lesson.menu.rotorsRight') : tf('lesson.menu.rotorsShifted', { count: n })}
                </option>
              ))}
            </select>
          </label>
          <label className="flex max-w-full flex-wrap items-center gap-2">
            <input
              type="checkbox"
              className="casella"
              checked={diagonal}
              onChange={(e) => {
                setDiagonal(e.target.checked);
                restart();
              }}
            />
            {t('lesson.menu.diagonal')}
          </label>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="btn btn-primary"
            disabled={visible >= total}
            onClick={() => setShown(visible + 1)}
          >
            {t('lesson.menu.next')}
          </button>
          <button type="button" className="btn" disabled={visible >= total} onClick={() => setShown(total)}>
            {t('lesson.menu.all')}
          </button>
          <button type="button" className="btn" disabled={visible === 1} onClick={restart}>
            {t('lesson.menu.restart')}
          </button>
        </div>

        <p aria-live="polite" className={`text-sm font-bold ${firstClash ? 'text-[var(--print-red)]' : ''}`}>
          {status}
        </p>

        <ol aria-label={t('lesson.menu.deductions')} className="m-0 flex list-none flex-col gap-1 p-0 text-sm">
          {shownDeductions.map((d, i) => {
            const clash = result.contradictions.find((c) => c.deduction === i);
            let text: string;
            let glyph = '·';
            let colour: string | undefined;
            if (d.cause.kind === 'hypothesis') {
              text = tf(d.letter === d.partner ? 'lesson.menu.hypothesisSelf' : 'lesson.menu.hypothesis', {
                letter: d.letter,
                partner: d.partner,
              });
            } else if (d.cause.kind === 'menu') {
              const source = result.deductions[d.cause.from];
              const forward = d.cause.edge.plain === source?.letter;
              glyph = forward ? '→' : '←';
              colour = forward ? FORWARD : RETURN;
              text = tf('lesson.menu.viaEdge', {
                position: d.cause.edge.position + 1,
                plain: d.cause.edge.plain,
                cipher: d.cause.edge.cipher,
                from: source?.partner ?? '',
                scrambled: d.partner,
                letter: d.letter,
                partner: d.partner,
              });
            } else {
              glyph = '⇄';
              text = tf('lesson.menu.viaDiagonal', {
                letter: result.deductions[d.cause.from]?.letter ?? '',
                partner: d.letter,
              });
            }
            return (
              <li key={i} className="inchiostro flex gap-2">
                <span
                  aria-hidden="true"
                  className="w-4 shrink-0 text-center font-mono font-bold"
                  style={{ color: colour }}
                >
                  {glyph}
                </span>
                <span>
                  {i + 1}. {text}
                  {clash && (
                    <strong className="text-[var(--print-red)]">
                      {' '}
                      {tf('lesson.menu.clash', { letter: clash.letter, first: clash.partners[0] })}
                    </strong>
                  )}
                </span>
              </li>
            );
          })}
        </ol>
      </div>
    </figure>
  );
}
