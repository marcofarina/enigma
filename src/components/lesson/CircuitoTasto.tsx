import { useId, useState } from 'react';
import { t, tf } from '@/i18n';

/** Macchina giocattolo con quattro lettere e una scatola che le scambia a coppie, come un riflettore. */
const LETTERS = ['A', 'B', 'C', 'D'] as const;
const PARTNER: Record<string, string> = { A: 'C', B: 'D', C: 'A', D: 'B' };

const rowY = (i: number) => 50 + i * 70;
const BOX = { x: 20, width: 90 };
const PIVOT_X = 190;
const CONTACT_X = 240;
const PLUS_X = 270;
const LAMP_X = 320;
const MINUS_X = 370;
const BATTERY_Y = 330;

/**
 * Il circuito di un tasto: sotto ogni tasto c’è un deviatore. A riposo collega il filo della
 * lettera alla sua lampada; premuto, lo collega alla batteria. Per questo la lampada del tasto
 * premuto non può accendersi, e la corrente esce dalla lampada di un’altra lettera.
 */
export default function CircuitoTasto() {
  const id = useId();
  const [pressed, setPressed] = useState<string | null>(null);
  const lit = pressed ? PARTNER[pressed] : undefined;
  const on = (active: boolean) => (active ? 'stroke-signal-forward' : 'stroke-border');
  const width = (active: boolean) => (active ? 4 : 2);

  return (
    <figure className="my-8 font-sans text-base">
      <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-4">
        <svg viewBox="0 0 400 360" className="mx-auto w-full max-w-md" role="img" aria-labelledby={`${id}-desc`}>
          <desc id={`${id}-desc`}>
            {pressed
              ? tf('lesson.circuit.descPressed', { key: pressed, lamp: lit ?? '' })
              : t('lesson.circuit.descIdle')}
          </desc>
          {/* Scatola dei collegamenti: A–C e B–D. */}
          <rect x={BOX.x} y={20} width={BOX.width} height={240} rx={8} className="fill-surface-muted stroke-border" />
          <text x={BOX.x + BOX.width / 2} y={14} textAnchor="middle" className="fill-text-muted" fontSize={11}>
            {t('lesson.circuit.box')}
          </text>
          {[
            ['A', 0, 2, 36],
            ['B', 1, 3, 70],
          ].map(([name, from, to, bend]) => {
            const active =
              pressed !== null && (pressed === LETTERS[from as number] || pressed === LETTERS[to as number]);
            const x = BOX.x + BOX.width;
            return (
              <path
                key={name}
                d={`M ${x} ${rowY(from as number)} C ${bend} ${rowY(from as number)} ${bend} ${rowY(to as number)} ${x} ${rowY(to as number)}`}
                className={`fill-none ${on(active)}`}
                strokeWidth={width(active)}
              />
            );
          })}

          {/* Binario positivo e negativo della batteria. */}
          <line
            x1={PLUS_X}
            y1={rowY(0) + 15}
            x2={PLUS_X}
            y2={BATTERY_Y}
            className={on(pressed !== null)}
            strokeWidth={width(pressed !== null)}
          />
          <line
            x1={MINUS_X}
            y1={rowY(0) - 15}
            x2={MINUS_X}
            y2={BATTERY_Y}
            className={on(pressed !== null)}
            strokeWidth={width(pressed !== null)}
          />
          <line
            x1={PLUS_X}
            y1={BATTERY_Y}
            x2={305}
            y2={BATTERY_Y}
            className={on(pressed !== null)}
            strokeWidth={width(pressed !== null)}
          />
          <line
            x1={335}
            y1={BATTERY_Y}
            x2={MINUS_X}
            y2={BATTERY_Y}
            className={on(pressed !== null)}
            strokeWidth={width(pressed !== null)}
          />
          <line x1={305} y1={BATTERY_Y - 16} x2={305} y2={BATTERY_Y + 16} className="stroke-text" strokeWidth={3} />
          <line x1={335} y1={BATTERY_Y - 9} x2={335} y2={BATTERY_Y + 9} className="stroke-text" strokeWidth={5} />
          <text x={320} y={BATTERY_Y + 30} textAnchor="middle" className="fill-text-muted" fontSize={11}>
            {t('lesson.circuit.battery')}
          </text>

          {LETTERS.map((letter, i) => {
            const y = rowY(i);
            const isPressed = pressed === letter;
            const isLit = lit === letter;
            const wireActive = isPressed || isLit;
            const lampY = y - 15;
            const plusY = y + 15;
            return (
              <g key={letter}>
                <line
                  x1={BOX.x + BOX.width}
                  y1={y}
                  x2={PIVOT_X}
                  y2={y}
                  className={on(wireActive)}
                  strokeWidth={width(wireActive)}
                />
                <text x={150} y={y - 8} textAnchor="middle" className="fill-text-muted" fontSize={12}>
                  {letter}
                </text>
                {/* Deviatore: a riposo verso la lampada, premuto verso la batteria. */}
                <circle cx={PIVOT_X} cy={y} r={4} className="fill-text" />
                <line
                  x1={PIVOT_X}
                  y1={y}
                  x2={CONTACT_X}
                  y2={isPressed ? plusY : lampY}
                  className={on(wireActive)}
                  strokeWidth={width(wireActive) + 1}
                  strokeLinecap="round"
                />
                <circle cx={CONTACT_X} cy={lampY} r={3} className="fill-text-muted" />
                <circle cx={CONTACT_X} cy={plusY} r={3} className="fill-text-muted" />
                <line
                  x1={CONTACT_X}
                  y1={plusY}
                  x2={PLUS_X}
                  y2={plusY}
                  className={on(isPressed)}
                  strokeWidth={width(isPressed)}
                />
                <line
                  x1={CONTACT_X}
                  y1={lampY}
                  x2={LAMP_X - 12}
                  y2={lampY}
                  className={on(isLit)}
                  strokeWidth={width(isLit)}
                />
                <line
                  x1={LAMP_X + 12}
                  y1={lampY}
                  x2={MINUS_X}
                  y2={lampY}
                  className={on(isLit)}
                  strokeWidth={width(isLit)}
                />
                <circle
                  cx={LAMP_X}
                  cy={lampY}
                  r={12}
                  className={isLit ? 'fill-lamp-on stroke-lamp-on' : 'fill-surface stroke-border'}
                  strokeWidth={2}
                />
                <text
                  x={LAMP_X}
                  y={lampY}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className={isLit ? 'fill-lamp-on-text font-bold' : 'fill-text-muted'}
                  fontSize={12}
                >
                  {letter}
                </text>
              </g>
            );
          })}
          <text x={PIVOT_X + 10} y={20} textAnchor="middle" className="fill-text-muted" fontSize={11}>
            {t('lesson.circuit.keys')}
          </text>
          <text x={LAMP_X} y={20} textAnchor="middle" className="fill-text-muted" fontSize={11}>
            {t('lesson.circuit.lamps')}
          </text>
        </svg>
        <div
          className="flex flex-wrap items-center justify-center gap-2"
          role="group"
          aria-label={t('lesson.circuit.keys')}
        >
          {LETTERS.map((letter) => (
            <button
              key={letter}
              type="button"
              aria-pressed={pressed === letter}
              onClick={() => setPressed((current) => (current === letter ? null : letter))}
              className="h-12 w-12 rounded-md border-2 border-border bg-surface font-mono text-lg font-bold hover:border-accent aria-pressed:border-accent aria-pressed:bg-accent aria-pressed:text-accent-contrast"
            >
              {letter}
            </button>
          ))}
        </div>
        <p className="text-center text-sm text-text-muted" aria-live="polite">
          {pressed ? tf('lesson.circuit.descPressed', { key: pressed, lamp: lit ?? '' }) : t('lesson.circuit.hint')}
        </p>
      </div>
    </figure>
  );
}
