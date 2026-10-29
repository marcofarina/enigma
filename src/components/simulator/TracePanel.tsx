import { useEffect, useId, useMemo, useState } from 'react';
import { ALPHABET, toLetter } from '@/engine';
import { t, tf } from '@/i18n';
import { useSimulator } from './store.ts';
import { describeTraceStep, traceOf, type TraceStep } from './trace.ts';

const SPEEDS = { slow: 2000, medium: 1200, fast: 600 } as const;
type Speed = keyof typeof SPEEDS;

/** Le due righe della sostituzione, con la lettera attraversata evidenziata. */
function StageMap({ step }: { step: Extract<TraceStep, { kind: 'stage' }> }) {
  const color = step.stage.direction === 'backward' ? 'border-signal-return' : 'border-signal-forward';
  const cell = 'flex h-6 w-5 shrink-0 items-center justify-center rounded-sm border-2';
  const row = (letters: string[], active: number) =>
    letters.map((letter, i) => (
      <span key={i} className={`${cell} ${i === active ? `${color} font-bold text-text` : 'border-transparent'}`}>
        {letter}
      </span>
    ));
  return (
    <figure className="flex flex-col gap-1">
      <figcaption className="text-sm text-text-muted">{t('sim.trace.map')}</figcaption>
      {/* Le righe non entrano sempre negli schermi stretti: l’area scorre anche da tastiera. */}
      <div
        className="overflow-x-auto rounded-md border border-border bg-surface-muted px-2 py-2"
        // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
        tabIndex={0}
        role="region"
        aria-label={t('sim.trace.map')}
      >
        <div aria-hidden="true" className="flex w-max flex-col gap-0.5 font-mono text-sm text-text-muted">
          <div className="flex items-center gap-0.5">
            <span className="w-12 shrink-0 font-sans text-xs">{t('sim.trace.mapIn')}</span>
            {row([...ALPHABET], step.stage.input)}
          </div>
          <div className="flex items-center gap-0.5">
            <span className="w-12 shrink-0 font-sans text-xs">{t('sim.trace.mapOut')}</span>
            {row(
              step.map.map((target) => toLetter(target)),
              step.stage.input,
            )}
          </div>
        </div>
      </div>
    </figure>
  );
}

/**
 * Comandi della traccia passo-passo dell’ultimo tasto. Il passo scelto vive nello store, così
 * lo schema e le lampade lo seguono.
 */
export default function TracePanel({ heading = true }: { heading?: boolean }) {
  const id = useId();
  const session = useSimulator((s) => s.session);
  const traceStep = useSimulator((s) => s.trace);
  const setTrace = useSimulator((s) => s.setTrace);
  const trace = useMemo(() => traceOf(session), [session]);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<Speed>('medium');

  const last = trace ? trace.steps.length - 1 : 0;
  const index = Math.min(traceStep ?? last, last);

  // Riproduzione: un passo alla volta fino alla lampada. Arrivata alla fine, o se un tasto nuovo
  // riporta la traccia alla fine, si ferma da sola.
  const running = playing && trace !== null && index < last;
  useEffect(() => {
    if (!running) return;
    const timer = window.setTimeout(() => setTrace(index + 1), SPEEDS[speed]);
    return () => window.clearTimeout(timer);
  }, [running, index, speed, setTrace]);

  const go = (step: number) => {
    setPlaying(false);
    setTrace(Math.max(0, Math.min(step, last)));
  };
  const togglePlay = () => {
    if (running) {
      setPlaying(false);
      return;
    }
    if (index >= last) setTrace(0);
    setPlaying(true);
  };

  const button =
    'h-11 min-w-11 rounded-md border-2 border-border bg-surface px-3 font-semibold hover:border-accent disabled:cursor-not-allowed disabled:opacity-50';
  const current = trace?.steps[index];

  return (
    <section aria-labelledby={`${id}-title`} className="flex flex-col gap-3">
      <h2 id={`${id}-title`} className={heading ? 'text-xl font-semibold' : 'sr-only'}>
        {t('sim.trace.title')}
      </h2>
      {heading && <p className="text-sm text-text-muted">{t('sim.trace.hint')}</p>}
      {!trace || !current ? (
        <p className="rounded-md border border-border bg-surface-muted px-4 py-3 text-sm">{t('sim.trace.empty')}</p>
      ) : (
        <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4">
          <div role="group" aria-label={t('sim.trace.controls')} className="flex flex-wrap items-center gap-2">
            <button type="button" className={button} disabled={index === 0} onClick={() => go(0)}>
              <span aria-hidden="true">⏮</span>
              <span className="sr-only">{t('sim.trace.first')}</span>
            </button>
            <button type="button" className={button} disabled={index === 0} onClick={() => go(index - 1)}>
              <span aria-hidden="true">◀</span>
              <span className="sr-only">{t('sim.trace.previous')}</span>
            </button>
            <button type="button" className={`${button} min-w-24`} onClick={togglePlay}>
              {running ? t('sim.trace.pause') : t('sim.trace.play')}
            </button>
            <button type="button" className={button} disabled={index >= last} onClick={() => go(index + 1)}>
              <span aria-hidden="true">▶</span>
              <span className="sr-only">{t('sim.trace.next')}</span>
            </button>
            <button type="button" className={button} disabled={index >= last} onClick={() => go(last)}>
              <span aria-hidden="true">⏭</span>
              <span className="sr-only">{t('sim.trace.last')}</span>
            </button>
            <label className="ms-auto flex items-center gap-2 text-sm">
              {t('sim.trace.speed')}
              <select
                className="rounded-md border border-border bg-surface px-2 py-2"
                value={speed}
                onChange={(event) => setSpeed(event.target.value as Speed)}
              >
                {(Object.keys(SPEEDS) as Speed[]).map((key) => (
                  <option key={key} value={key}>
                    {t(`sim.trace.${key}`)}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <p className="text-sm text-text-muted">{tf('sim.trace.counter', { current: index + 1, total: last + 1 })}</p>
          <p aria-live="polite" className="rounded-md bg-surface-muted px-3 py-2">
            {describeTraceStep(session.config, trace, current)}
          </p>
          {current.kind === 'stage' && <StageMap step={current} />}
        </div>
      )}
    </section>
  );
}
