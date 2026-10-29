import { useId, useState } from 'react';
import { ALPHABET, groupLetters, mod, prepareText, toIndex } from '@/engine';
import { t, tf } from '@/i18n';

interface Props {
  /** Alfabeto del disco interno: quello ordinato (Cesare) o uno mescolato, per esempio un cablaggio di rotore. */
  interno?: string;
  spostamento?: number;
  testo?: string;
  /** Mostra l’opzione che fa ruotare il disco di un passo dopo ogni lettera. */
  rotazione?: boolean;
}

const SIZE = 320;
const C = SIZE / 2;

function ring(letters: string, radius: number, className: string, highlight?: number) {
  return [...letters].map((letter, i) => {
    const angle = (i / 26) * 2 * Math.PI - Math.PI / 2;
    const x = C + radius * Math.cos(angle);
    const y = C + radius * Math.sin(angle);
    return (
      <g key={i}>
        {highlight === i && <circle cx={x} cy={y} r={11} className="fill-lamp-on" />}
        <text
          x={x}
          y={y}
          textAnchor="middle"
          dominantBaseline="central"
          transform={`rotate(${(i / 26) * 360} ${x} ${y})`}
          className={highlight === i ? 'fill-lamp-on-text font-bold' : className}
          fontSize={14}
        >
          {letter}
        </text>
      </g>
    );
  });
}

/** Cifra con il disco: la lettera esterna i corrisponde alla lettera interna i + spostamento. */
export function discEncipher(letters: string, inner: string, shift: number, rotate: boolean): string {
  return [...letters].map((letter, n) => inner[mod(toIndex(letter) + shift + (rotate ? n : 0))] ?? letter).join('');
}

/**
 * Disco cifrante: un anello esterno fisso con l’alfabeto in chiaro e un disco interno che ruota.
 * Con l’alfabeto ordinato è il cifrario di Cesare; con uno mescolato e la rotazione a ogni
 * lettera diventa un rotore elementare.
 */
export default function DiscoCifrante({
  interno = ALPHABET,
  spostamento = 3,
  testo = 'VENI VIDI VICI',
  rotazione = false,
}: Props) {
  const id = useId();
  // Il conteggio dei passi non si riduce modulo 26, così la rotazione animata non torna mai indietro di un giro.
  const [turns, setTurns] = useState(spostamento);
  const shift = mod(turns);
  const [text, setText] = useState(testo);
  const [rotate, setRotate] = useState(false);
  const letters = prepareText(text);
  const output = discEncipher(letters, interno, shift, rotate);
  // Il disco interno gira in senso antiorario: la lettera allineata alla A esterna è interno[spostamento].
  const innerLetters = [...ALPHABET].map((_, i) => interno[mod(i + shift)] ?? '').join('');
  const first = letters[0];

  return (
    <figure className="my-8 font-sans text-base">
      <div className="flex flex-col items-center gap-4 rounded-xl border border-border bg-surface p-4 sm:flex-row sm:items-start">
        <svg
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className="w-full max-w-72 shrink-0"
          role="img"
          aria-labelledby={`${id}-desc`}
        >
          <desc id={`${id}-desc`}>{tf('lesson.disc.desc', { shift, letter: innerLetters[0] ?? '' })}</desc>
          <circle cx={C} cy={C} r={150} className="fill-surface-muted stroke-border" />
          <circle cx={C} cy={C} r={112} className="fill-surface stroke-border" />
          <circle cx={C} cy={C} r={76} className="fill-surface-muted stroke-border" />
          {ring(ALPHABET, 131, 'fill-text', first ? toIndex(first) : undefined)}
          <g
            style={{
              transform: `rotate(${(-turns * 360) / 26}deg)`,
              transformOrigin: `${C}px ${C}px`,
              transition: 'transform 300ms ease-out',
            }}
          >
            {ring(interno, 94, 'fill-text-muted', first ? mod(toIndex(first) + shift) : undefined)}
          </g>
          <text x={C} y={C} textAnchor="middle" dominantBaseline="central" className="fill-text-muted" fontSize={12}>
            {tf('lesson.disc.shiftShort', { shift })}
          </text>
        </svg>
        <div className="flex w-full flex-col gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="h-11 w-11 rounded-md border border-border hover:border-accent"
              aria-label={t('lesson.disc.left')}
              onClick={() => setTurns((n) => n - 1)}
            >
              ◀
            </button>
            <output className="min-w-32 text-center" aria-live="polite">
              {tf('lesson.disc.shift', { shift })}
            </output>
            <button
              type="button"
              className="h-11 w-11 rounded-md border border-border hover:border-accent"
              aria-label={t('lesson.disc.right')}
              onClick={() => setTurns((n) => n + 1)}
            >
              ▶
            </button>
          </div>
          <label htmlFor={`${id}-text`} className="text-sm font-semibold">
            {t('lesson.disc.plain')}
          </label>
          <input
            id={`${id}-text`}
            className="rounded-md border border-border bg-surface px-3 py-2"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          {rotazione && (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="h-5 w-5"
                checked={rotate}
                onChange={(e) => setRotate(e.target.checked)}
              />
              {t('lesson.disc.rotate')}
            </label>
          )}
          <p className="text-sm font-semibold">{t('lesson.disc.cipher')}</p>
          <p
            className="min-h-10 break-words rounded-md bg-surface-muted px-3 py-2 font-mono text-lg tracking-wider"
            aria-live="polite"
          >
            {groupLetters(output)}
          </p>
        </div>
      </div>
    </figure>
  );
}
