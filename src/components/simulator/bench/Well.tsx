import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { mod, MODELS, prepareText, rotorNames, toIndex, toLetter } from '@/engine';
import { t, tf } from '@/i18n';
import { changeRing, changeRotor } from '../config-edit.ts';
import { hasSettableReflector, reflectorShortLabel, slotName } from '../labels.ts';
import { currentState, windows } from '../session.ts';
import { useSimulator } from '../store.ts';
import { describeTraceStep, traceOf } from '../trace.ts';
import {
  KEYS_X,
  REFLECTOR_CENTER,
  rotorColumns,
  rowY,
  signalPath,
  SPINE_CENTER,
  VIEW_HEIGHT,
  VIEW_WIDTH,
  wiring,
  type RotorColumn,
  type SignalPath,
} from './geometry.ts';
import { panelDomId } from './Panel.tsx';
import { cableCount } from './Panels.tsx';
import { useBench, type SignalMode } from './ui.ts';

const rem = (px: number) => `${px / 16}rem`;

/** Vero se il sistema chiede meno movimento: «Al rallentatore» lascia il posto a «Passo passo». */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(
    (notify) => {
      const query = window.matchMedia('(prefers-reduced-motion: reduce)');
      query.addEventListener('change', notify);
      return () => query.removeEventListener('change', notify);
    },
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
}

/**
 * Di quanto è girata la lettera dall’ultima volta: +1 se il rotore è avanzato di uno, −1 se è
 * tornato indietro di uno, 0 per un salto. `n` cambia a ogni giro e fa ripartire l’animazione.
 */
function useTurn(letter: string): { n: number; dir: -1 | 0 | 1 } {
  const [previous, setPrevious] = useState(letter);
  const [turn, setTurn] = useState<{ n: number; dir: -1 | 0 | 1 }>({ n: 0, dir: 0 });
  if (previous !== letter) {
    const delta = mod(toIndex(letter) - toIndex(previous));
    setPrevious(letter);
    setTurn((current) => ({ n: current.n + 1, dir: delta === 1 ? 1 : delta === 25 ? -1 : 0 }));
  }
  return turn;
}

/**
 * Finestrella con la sua rotella: è uno spinbutton. Si gira con le frecce (Home e Fine vanno ad
 * A e Z), con la rotella del mouse, con i pulsanti ▲ ▼ o digitando una lettera.
 */
function Dial({
  label,
  letter,
  onChange,
  knurl = true,
}: {
  label: string;
  letter: string;
  onChange: (letter: string) => void;
  knurl?: boolean;
}) {
  const dial = useRef<HTMLDivElement>(null);
  const index = toIndex(letter);
  const shift = (delta: number) => onChange(toLetter(index + delta));
  const turn = useTurn(letter);

  // La rotella si registra a mano: i gestori di React sono passivi e non bloccano lo scorrimento.
  const latest = useRef(shift);
  useEffect(() => {
    latest.current = shift;
  });
  useEffect(() => {
    const element = dial.current;
    if (!element) return;
    const onWheel = (event: WheelEvent) => {
      if (event.deltaY === 0) return;
      event.preventDefault();
      latest.current(event.deltaY > 0 ? 1 : -1);
    };
    element.addEventListener('wheel', onWheel, { passive: false });
    return () => element.removeEventListener('wheel', onWheel);
  }, []);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const moves: Record<string, () => void> = {
      ArrowUp: () => shift(1),
      ArrowRight: () => shift(1),
      ArrowDown: () => shift(-1),
      ArrowLeft: () => shift(-1),
      PageUp: () => shift(5),
      PageDown: () => shift(-5),
      Home: () => onChange('A'),
      End: () => onChange('Z'),
    };
    const move = moves[event.key];
    const typed = event.key.length === 1 && !event.ctrlKey && !event.metaKey ? prepareText(event.key) : '';
    if (move) move();
    else if (typed.length === 1) onChange(typed);
    else return;
    // La lettera digitata qui gira il rotore e non arriva alla tastiera della macchina.
    event.preventDefault();
    event.stopPropagation();
  };

  return (
    <div className="rotor-dial">
      <div className="rotor-arrows">
        <button
          type="button"
          tabIndex={-1}
          className="arrow"
          aria-label={`${label}: ${t('sim.wheel.up')}`}
          onClick={() => shift(1)}
        >
          ▲
        </button>
        <button
          type="button"
          tabIndex={-1}
          className="arrow"
          aria-label={`${label}: ${t('sim.wheel.down')}`}
          onClick={() => shift(-1)}
        >
          ▼
        </button>
      </div>
      <div
        ref={dial}
        role="spinbutton"
        tabIndex={0}
        aria-label={label}
        aria-valuemin={1}
        aria-valuemax={26}
        aria-valuenow={index + 1}
        aria-valuetext={letter}
        onKeyDown={onKeyDown}
        className="window"
      >
        <span key={turn.n} className={turn.dir === 1 ? 'tick' : turn.dir === -1 ? 'tick-back' : undefined}>
          {letter}
        </span>
      </div>
      {knurl && <div className="knurl" aria-hidden="true" />}
    </div>
  );
}

function RotorHead({ column, letter }: { column: RotorColumn; letter: string }) {
  const config = useSimulator((s) => s.session.config);
  const configure = useSimulator((s) => s.configure);
  const setWindow = useSimulator((s) => s.setWindow);
  const { slot } = column;
  const model = MODELS[config.model];
  const names = rotorNames(model);
  const thin = config.rotors.length === 4 && slot === 0;
  const slotLabel = slotName(config, slot);
  const ring = config.rings[slot] ?? 'A';
  const ringIndex = toIndex(ring);
  const setRing = (delta: number) => configure((c) => changeRing(c, slot, toLetter(ringIndex + delta)));

  return (
    <div
      role="group"
      aria-label={tf('sim.slot.rotor', { slot: slotLabel })}
      className="rotor-head"
      style={{ left: rem(column.center) }}
    >
      <select
        className="ctl"
        aria-label={tf('sim.slot.rotor', { slot: slotLabel })}
        value={config.rotors[slot]}
        onChange={(event) => configure((c) => changeRotor(c, slot, event.target.value))}
      >
        {(thin ? names.thin : names.regular).map((name) => (
          <option key={name} value={name}>
            {name}
          </option>
        ))}
      </select>
      <Dial
        label={tf('sim.wheel.label', { slot: slotLabel })}
        letter={letter}
        onChange={(next) => setWindow(slot, next)}
      />
      <div className="ring-set">
        <button
          type="button"
          className="arrow"
          aria-label={tf('bench.ring.down', { slot: slotLabel })}
          onClick={() => setRing(-1)}
        >
          ‹
        </button>
        <span>{tf('bench.ring', { number: String(ringIndex + 1).padStart(2, '0'), letter: ring })}</span>
        <button
          type="button"
          className="arrow"
          aria-label={tf('bench.ring.up', { slot: slotLabel })}
          onClick={() => setRing(1)}
        >
          ›
        </button>
      </div>
    </div>
  );
}

function ReflectorHead({ letter }: { letter: string }) {
  const config = useSimulator((s) => s.session.config);
  const setReflectorWindow = useSimulator((s) => s.setReflectorWindow);
  const panelOpen = useBench((s) => s.panel === 'ukwd');
  const togglePanel = useBench((s) => s.togglePanel);
  const rewirable = MODELS[config.model].reflectors[config.reflector]?.rewirable;
  const settable = hasSettableReflector(config);
  const name = <b>{reflectorShortLabel(config)}</b>;

  return (
    <div className="rotor-head" style={{ left: rem(REFLECTOR_CENTER) }}>
      {settable ? (
        <>
          <span className="col-label" style={{ position: 'static', transform: 'none' }}>
            {t('bench.column.reflector')}
          </span>
          <Dial label={t('sim.wheel.reflectorLabel')} letter={letter} onChange={setReflectorWindow} knurl={false} />
          <span className="col-label" style={{ position: 'static', transform: 'none' }}>
            {name}
          </span>
        </>
      ) : (
        <span className="col-label" style={{ position: 'static', transform: 'none', marginTop: '2.5rem' }}>
          {t('bench.column.reflector')}
          <br />
          {name}
        </span>
      )}
      {rewirable && (
        <button
          type="button"
          className="ctl well-head-button"
          aria-expanded={panelOpen}
          aria-controls={panelOpen ? panelDomId('ukwd') : undefined}
          onClick={(event) => togglePanel('ukwd', event.currentTarget)}
        >
          {t('bench.ukwd.button')}
        </button>
      )}
    </div>
  );
}

function SpineLabel() {
  const config = useSimulator((s) => s.session.config);
  const model = MODELS[config.model];
  let title = t('bench.column.entry');
  let value: ReactNode = 'ETW';
  if (model.plugboard) {
    title = config.uhr === undefined ? t('bench.column.spine') : t('sim.schematic.uhr');
    value = config.uhr === undefined ? cableCount(config.plugboard?.length ?? 0) : String(config.uhr).padStart(2, '0');
  }
  return (
    <span className="col-label" style={{ left: rem(SPINE_CENTER) }}>
      {title}
      <br />
      <b>{value}</b>
    </span>
  );
}

/** Fili di un rotore e lettere del suo anello: salgono di una riga quando il rotore avanza. */
function RotorWires({ column, d, letter, path }: { column: RotorColumn; d: string; letter: string; path: SignalPath }) {
  const turn = useTurn(letter);
  const start = toIndex(letter);
  const x = column.right - 17;
  const forward = path.ring.forward[column.slot];
  const back = path.ring.back[column.slot];
  return (
    <g key={turn.n} className={turn.dir === 1 ? 'turn' : turn.dir === -1 ? 'turn-back' : undefined}>
      <path className="wire" d={d} />
      <rect className="ring-bg" x={x} y={0} width={14} height={VIEW_HEIGHT} />
      {Array.from({ length: 26 }, (_, row) => (
        <text
          key={row}
          x={x + 7}
          y={rowY(row)}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={10}
          className={`ring-letter${row === forward ? ' label-forward' : row === back ? ' label-return' : ''}`}
        >
          {toLetter(start + row)}
        </text>
      ))}
    </g>
  );
}

function Circuit({ mode }: { mode: SignalMode }) {
  const session = useSimulator((s) => s.session);
  const trace = useSimulator((s) => s.trace);
  const pulse = useSimulator((s) => s.pulse);
  const { machine } = session;
  const letters = useMemo(() => windows(session), [session]);
  const last = session.presses.at(-1);
  const wires = useMemo(() => {
    const state = currentState(session);
    return machine && state ? wiring(machine, state) : null;
  }, [session, machine]);
  const count = session.config.rotors.length;
  const columns = useMemo(() => rotorColumns(count), [count]);
  const path = useMemo(() => signalPath(last?.stages ?? [], count, trace ?? undefined), [last, count, trace]);
  const draw = pulse > 0 && mode !== 'step' ? ' draw' : '';

  if (!wires) return <div className="circuit" />;
  return (
    <div className="circuit">
      <svg viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`} aria-hidden="true">
        <path className="wire" d={wires.reflector} />
        <path className="wire" d={wires.spine} />
        {columns.map((column) => (
          <RotorWires
            key={column.slot}
            column={column}
            d={wires.rotors[column.slot] ?? ''}
            letter={letters.rotors[column.slot] ?? 'A'}
            path={path}
          />
        ))}
        {columns.flatMap((column) =>
          Array.from({ length: 26 }, (_, row) => (
            <circle key={`${column.slot}-${row}`} className="contact" cx={column.left} cy={rowY(row)} r={2.5} />
          )),
        )}
        {Array.from({ length: 26 }, (_, row) => (
          <circle key={`s-${row}`} className="contact" cx={columns.at(-1)?.right} cy={rowY(row)} r={2.5} />
        ))}
        {path.forward && (
          <path key={`f-${pulse}`} className={`signal signal-forward${draw}`} d={path.forward} pathLength={1} />
        )}
        {path.back && (
          <path key={`r-${pulse}`} className={`signal signal-return${draw}`} d={path.back} pathLength={1} />
        )}
        {path.contacts.map((contact) => (
          <circle
            key={`${contact.x}-${contact.row}-${contact.direction}`}
            className="contact"
            data-dir={contact.direction}
            cx={contact.x}
            cy={rowY(contact.row)}
            r={2.5}
          />
        ))}
        {Array.from({ length: 26 }, (_, row) => (
          <text
            key={row}
            x={KEYS_X}
            y={rowY(row)}
            dominantBaseline="central"
            fontSize={11}
            className={`key-letter${row === path.key ? ' label-forward' : row === path.lamp ? ' label-return' : ''}`}
          >
            {toLetter(row)}
          </text>
        ))}
      </svg>
    </div>
  );
}

function Issues() {
  const issues = useSimulator((s) => s.session.issues);
  const togglePanel = useBench((s) => s.togglePanel);
  const fields = new Set(issues.map((issue) => issue.field));
  return (
    <div role="status" className="issues">
      <h2>{t('sim.issues.title')}</h2>
      <ul>
        {issues.map((issue) => (
          <li key={`${issue.field}-${issue.message}`}>{issue.message}</li>
        ))}
      </ul>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        {(fields.has('plugboard') || fields.has('uhr')) && (
          <button type="button" className="ctl" onClick={(event) => togglePanel('plugs', event.currentTarget)}>
            {t('bench.issues.plugs')}
          </button>
        )}
        {fields.has('ukwD') && (
          <button type="button" className="ctl" onClick={(event) => togglePanel('ukwd', event.currentTarget)}>
            {t('bench.issues.ukwd')}
          </button>
        )}
      </div>
    </div>
  );
}

function Foot({ mode }: { mode: SignalMode }) {
  const session = useSimulator((s) => s.session);
  const traceStep = useSimulator((s) => s.trace);
  const setTrace = useSimulator((s) => s.setTrace);
  const setMode = useBench((s) => s.setMode);
  const reduced = useReducedMotion();
  const trace = useMemo(() => traceOf(session), [session]);
  const last = session.presses.at(-1);
  const lastStep = trace ? trace.steps.length - 1 : 0;
  const index = Math.min(traceStep ?? lastStep, lastStep);
  const current = trace?.steps[index];

  let text = t('bench.path.idle');
  if (mode === 'step' && trace && current) text = describeTraceStep(session.config, trace, current);
  else if (last) text = tf('bench.path.done', { input: last.input, output: last.output });

  const modes: SignalMode[] = reduced ? ['normal', 'step'] : ['normal', 'slow', 'step'];
  const go = (step: number) => setTrace(Math.max(0, Math.min(step, lastStep)));

  return (
    <div className="well-foot">
      <p aria-live="polite">{text}</p>
      <div className="controls">
        {mode === 'step' && trace && (
          <>
            <button
              type="button"
              className="arrow"
              aria-label={t('sim.trace.previous')}
              disabled={index === 0}
              onClick={() => go(index - 1)}
            >
              ◀
            </button>
            <span>{tf('sim.trace.counter', { current: index + 1, total: lastStep + 1 })}</span>
            <button
              type="button"
              className="arrow"
              aria-label={t('sim.trace.next')}
              disabled={index >= lastStep}
              onClick={() => go(index + 1)}
            >
              ▶
            </button>
          </>
        )}
        <select
          className="ctl"
          aria-label={t('bench.mode.label')}
          value={reduced && mode === 'slow' ? 'step' : mode}
          onChange={(event) => {
            const next = event.target.value as SignalMode;
            setMode(next);
            setTrace(next === 'step' && trace ? 0 : null);
          }}
        >
          {modes.map((option) => (
            <option key={option} value={option}>
              {t(`bench.mode.${option}`)}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

/** La modalità del segnale in uso: con il movimento ridotto «Al rallentatore» diventa «Passo passo». */
export function useSignalMode(): SignalMode {
  const chosen = useBench((s) => s.mode);
  const reduced = useReducedMotion();
  return reduced && chosen === 'slow' ? 'step' : chosen;
}

export default function Well() {
  const session = useSimulator((s) => s.session);
  const pulse = useSimulator((s) => s.pulse);
  const setTrace = useSimulator((s) => s.setTrace);
  const mode = useSignalMode();
  const letters = useMemo(() => windows(session), [session]);
  const columns = rotorColumns(session.config.rotors.length);

  // Nel passo passo ogni tasto nuovo riparte dal primo passo (prima del disegno, senza lampi).
  useLayoutEffect(() => {
    if (mode === 'step' && pulse > 0) setTrace(0);
  }, [mode, pulse, setTrace]);

  return (
    <section aria-label={t('bench.well')} className="well">
      <div className="well-heads">
        <ReflectorHead letter={letters.reflector} />
        {columns.map((column) => (
          <RotorHead key={column.slot} column={column} letter={letters.rotors[column.slot] ?? 'A'} />
        ))}
        <SpineLabel />
        <span className="col-label" style={{ left: rem(KEYS_X + 6) }}>
          {t('bench.column.keys')}
        </span>
      </div>
      {session.machine ? (
        <Circuit mode={mode} />
      ) : (
        <>
          <div className="circuit" />
          <Issues />
        </>
      )}
      <Foot mode={mode} />
    </section>
  );
}
