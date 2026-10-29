import { useId, useState } from 'react';
import { ALPHABET, mod, MODELS, toIndex, toLetter } from '@/engine';
import { t, tf } from '@/i18n';

interface Props {
  rotore?: string;
  posizione?: string;
  anello?: string;
  lettera?: string;
  /** Mostra il selettore dell’anello (Ringstellung). */
  conAnello?: boolean;
}

const ROW = 16;
const TOP = 30;
const LEFT_X = 40;
const RIGHT_X = 260;
const y = (row: number) => TOP + row * ROW + ROW / 2;

/**
 * Un rotore da solo, attraversato da destra a sinistra. Si cambiano la posizione e l’anello e si
 * vede come cambia la lettera in uscita: il cablaggio interno resta lo stesso, ma ruota.
 */
export default function RotoreSingolo({
  rotore = 'I',
  posizione = 'A',
  anello = 'A',
  lettera = 'A',
  conAnello = false,
}: Props) {
  const id = useId();
  const wiring = MODELS.I.rotors[rotore]?.wiring ?? ALPHABET;
  const [position, setPosition] = useState(toIndex(posizione));
  const [ring, setRing] = useState(toIndex(anello));
  const [input, setInput] = useState(toIndex(lettera));

  const offset = position - ring;
  const map = (contact: number) => mod(toIndex(wiring[mod(contact + offset)] ?? 'A') - offset);
  const core = mod(input + offset);
  const coreOut = toIndex(wiring[core] ?? 'A');
  const output = map(input);
  const select = 'rounded-md border border-border bg-surface px-2 py-2 font-mono';

  return (
    <figure className="my-8 font-sans text-base">
      <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-4 sm:flex-row">
        <svg
          viewBox={`0 0 300 ${TOP + 26 * ROW + 10}`}
          className="mx-auto w-full max-w-xs shrink-0"
          role="img"
          aria-labelledby={`${id}-desc`}
        >
          <desc id={`${id}-desc`}>
            {tf('lesson.rotor.desc', { rotor: rotore, input: toLetter(input), output: toLetter(output) })}
          </desc>
          <text x={LEFT_X} y={16} textAnchor="middle" className="fill-text-muted" fontSize={11}>
            {t('lesson.rotor.leftSide')}
          </text>
          <text x={RIGHT_X} y={16} textAnchor="middle" className="fill-text-muted" fontSize={11}>
            {t('lesson.rotor.rightSide')}
          </text>
          <rect
            x={LEFT_X + 12}
            y={TOP - 4}
            width={RIGHT_X - LEFT_X - 24}
            height={26 * ROW + 8}
            rx={6}
            className="fill-surface-muted stroke-border"
          />
          {[...ALPHABET].map((_, row) => (
            <line
              key={row}
              x1={RIGHT_X - 12}
              y1={y(row)}
              x2={LEFT_X + 12}
              y2={y(map(row))}
              className="stroke-text-muted"
              strokeOpacity={0.3}
            />
          ))}
          <path
            d={`M ${RIGHT_X + 30} ${y(input)} L ${RIGHT_X - 12} ${y(input)} L ${LEFT_X + 12} ${y(output)} L ${LEFT_X - 30} ${y(output)}`}
            className="fill-none stroke-signal-forward"
            strokeWidth={3}
          />
          {[...ALPHABET].map((_, row) => {
            // I contatti della carcassa sono fissi: è il cablaggio a spostarsi sotto di loro.
            const label = toLetter(row);
            return (
              <g key={row}>
                {[LEFT_X, RIGHT_X].map((x) => {
                  const active = x === RIGHT_X ? row === input : row === output;
                  return (
                    <g key={x}>
                      {active && (
                        <rect
                          x={x - 8}
                          y={y(row) - 7}
                          width={16}
                          height={14}
                          rx={3}
                          className="fill-surface stroke-signal-forward"
                          strokeWidth={2}
                        />
                      )}
                      <text
                        x={x}
                        y={y(row)}
                        textAnchor="middle"
                        dominantBaseline="central"
                        className={active ? 'fill-text font-bold' : 'fill-text-muted'}
                        fontSize={10}
                      >
                        {label}
                      </text>
                    </g>
                  );
                })}
              </g>
            );
          })}
        </svg>
        <div className="flex w-full flex-col gap-3 text-sm">
          <label className="flex items-center justify-between gap-2">
            {t('lesson.rotor.input')}
            <select className={select} value={input} onChange={(e) => setInput(Number(e.target.value))}>
              {[...ALPHABET].map((letter, i) => (
                <option key={letter} value={i}>
                  {letter}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center justify-between gap-2">
            {t('lesson.rotor.position')}
            <select className={select} value={position} onChange={(e) => setPosition(Number(e.target.value))}>
              {[...ALPHABET].map((letter, i) => (
                <option key={letter} value={i}>
                  {letter}
                </option>
              ))}
            </select>
          </label>
          {conAnello && (
            <label className="flex items-center justify-between gap-2">
              {t('lesson.rotor.ring')}
              <select className={select} value={ring} onChange={(e) => setRing(Number(e.target.value))}>
                {[...ALPHABET].map((letter, i) => (
                  <option key={letter} value={i}>
                    {tf('sim.config.ringOption', { letter, number: String(i + 1).padStart(2, '0') })}
                  </option>
                ))}
              </select>
            </label>
          )}
          <ol className="flex list-decimal flex-col gap-1 ps-5" aria-live="polite">
            <li>
              {tf('lesson.rotor.step1', {
                input: toLetter(input),
                inputNumber: input,
                position,
                ring,
                core: toLetter(core),
                coreNumber: core,
              })}
            </li>
            <li>{tf('lesson.rotor.step2', { core: toLetter(core), coreOut: toLetter(coreOut), rotor: rotore })}</li>
            <li>{tf('lesson.rotor.step3', { coreOut: toLetter(coreOut), output: toLetter(output) })}</li>
          </ol>
          <p className="rounded-md bg-surface-muted px-3 py-2 font-mono text-lg">
            {toLetter(input)} → {toLetter(output)}
          </p>
        </div>
      </div>
    </figure>
  );
}
