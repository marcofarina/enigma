import { useId } from 'react';
import { toIndex, toLetter } from '@/engine';
import { cablePath, machineLayout, type MachineLayoutOptions, type Point } from './layout.ts';

export interface MachineIllustrationProps extends MachineLayoutOptions {
  /** Lettere nelle finestrelle dei rotori, da sinistra a destra. */
  windows: string;
  reflectorLetter?: string;
  /** Coppie collegate sul pannello (vuoto se non ci sono cavi). */
  pairs: readonly string[];
  /** Lampada accesa e tasto abbassato, se ce ne sono. */
  lit?: string | null;
  pressed?: string | null;
  /** Posizione dell’Uhr, se i cavi vanno all’Uhr invece che da presa a presa. */
  uhr?: number;
  title: string;
  description: string;
  className?: string;
}

const CABLE_CLASSES = ['stroke-cable-a', 'stroke-cable-b'] as const;

/** Finestrella con il tamburo del rotore: la lettera corrente e, sfumate, la precedente e la successiva. */
function RotorWindow({
  x,
  y,
  width,
  letter,
  clip,
}: {
  x: number;
  y: number;
  width: number;
  letter: string;
  clip: string;
}) {
  const index = toIndex(letter);
  const center = x + width / 2;
  return (
    <g>
      <rect x={x - 4} y={y - 4} width={width + 8} height={58} rx={6} className="fill-machine-edge" />
      <clipPath id={clip}>
        <rect x={x} y={y} width={width} height={50} rx={3} />
      </clipPath>
      <g clipPath={`url(#${clip})`}>
        <rect x={x} y={y} width={width} height={50} className="fill-lamp-off" />
        {/* Ombre in alto e in basso: il tamburo è un cilindro. */}
        <rect x={x} y={y} width={width} height={10} className="fill-machine" opacity={0.35} />
        <rect x={x} y={y + 40} width={width} height={10} className="fill-machine" opacity={0.35} />
        {[-1, 0, 1].map((delta) => (
          <text
            key={delta}
            x={center}
            y={y + 25 + delta * 22}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={delta === 0 ? 22 : 14}
            className="fill-lamp-off-text font-mono font-bold"
            opacity={delta === 0 ? 1 : 0.45}
          >
            {toLetter(index - delta)}
          </text>
        ))}
      </g>
    </g>
  );
}

/** Rotella zigrinata che sporge dal coperchio accanto alla finestrella. */
function Thumbwheel({ x, y }: Point) {
  return (
    <g>
      <rect x={x} y={y - 10} width={14} height={70} rx={4} className="fill-metal" />
      {Array.from({ length: 11 }, (_, i) => (
        <line
          key={i}
          x1={x + 1}
          x2={x + 13}
          y1={y - 5 + i * 6}
          y2={y - 5 + i * 6}
          className="stroke-machine"
          strokeWidth={1.5}
        />
      ))}
    </g>
  );
}

/**
 * Illustrazione parametrica di un’Enigma, generata dai dati del modello: finestrelle, lampade,
 * tasti e, se il modello lo prevede, il pannello a spine con i cavi. Non ha comandi: è una figura,
 * che il simulatore aggiorna e che si può riusare nelle lezioni e nel libro.
 */
export default function MachineIllustration(props: MachineIllustrationProps) {
  const id = useId();
  const layout = machineLayout(props);
  const { deck, front } = layout;
  const { pairs } = props;

  return (
    <svg
      viewBox={`0 0 ${layout.width} ${layout.height}`}
      role="img"
      aria-labelledby={`${id}-title`}
      aria-describedby={`${id}-desc`}
      className={props.className ?? 'block w-full'}
    >
      <title id={`${id}-title`}>{props.title}</title>
      <desc id={`${id}-desc`}>{props.description}</desc>
      <defs>
        <radialGradient id={`${id}-glow`}>
          <stop offset="0%" className="[stop-color:var(--color-lamp-on)]" stopOpacity={0.9} />
          <stop offset="100%" className="[stop-color:var(--color-lamp-on)]" stopOpacity={0} />
        </radialGradient>
      </defs>

      {/* Cassetta di legno: il bordo, il piano nero e il fronte in prospettiva. */}
      <rect x={6} y={6} width={layout.width - 12} height={layout.height - 12} rx={18} className="fill-wood-dark" />
      <rect x={12} y={12} width={layout.width - 24} height={front.y + front.height - 6} rx={14} className="fill-wood" />
      <rect x={deck.x} y={deck.y} width={deck.width} height={deck.height} rx={10} className="fill-machine" />
      <path
        d={`M ${front.x} ${front.y} L ${front.x + front.width} ${front.y} L ${front.x + front.width - 10} ${front.y + front.height} L ${front.x + 10} ${front.y + front.height} Z`}
        className="fill-machine-edge"
      />

      {/* Coperchio dei rotori. */}
      <rect
        x={deck.x + 70}
        y={deck.y + 8}
        width={deck.width - 140}
        height={92}
        rx={8}
        className="fill-machine-edge"
        opacity={0.6}
      />
      {layout.windows.map((slot) => {
        const letter = slot.slot === -1 ? (props.reflectorLetter ?? 'A') : (props.windows[slot.slot] ?? 'A');
        return (
          <g key={slot.slot}>
            <RotorWindow x={slot.x} y={slot.y} width={slot.width} letter={letter} clip={`${id}-w${slot.slot + 1}`} />
            <Thumbwheel x={slot.x + slot.width + 8} y={slot.y} />
            <text
              x={slot.x + slot.width / 2}
              y={slot.y + 70}
              textAnchor="middle"
              fontSize={11}
              className="fill-key-text font-mono"
              opacity={0.75}
            >
              {slot.slot === -1 ? 'UKW' : props.rotors[slot.slot]?.name}
            </text>
          </g>
        );
      })}

      {/* Lampade. */}
      {Object.entries(layout.lamps).map(([letter, { x, y }]) => {
        const lit = props.lit === letter;
        return (
          <g key={letter} data-lamp={letter} data-lit={lit || undefined}>
            {lit && <circle cx={x} cy={y} r={34} fill={`url(#${id}-glow)`} />}
            <circle cx={x} cy={y} r={20} className="fill-machine-edge" />
            <circle cx={x} cy={y} r={16} className={lit ? 'fill-lamp-on' : 'fill-lamp-off'} />
            <text
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={15}
              className={`${lit ? 'fill-lamp-on-text' : 'fill-lamp-off-text'} font-mono font-bold`}
            >
              {letter}
            </text>
          </g>
        );
      })}

      {/* Tasti: ellissi, perché li vediamo un po’ di sbieco; quello premuto scende. */}
      {Object.entries(layout.keys).map(([letter, { x, y }]) => {
        const down = props.pressed === letter;
        const shift = down ? 4 : 0;
        return (
          <g key={letter} data-key={letter} data-pressed={down || undefined}>
            <ellipse cx={x} cy={y + 8} rx={23} ry={19} className="fill-machine-edge" />
            <g
              className="motion-safe:transition-transform motion-safe:duration-100"
              transform={`translate(0 ${shift})`}
            >
              <ellipse cx={x} cy={y} rx={23} ry={19} className="fill-metal" />
              <ellipse cx={x} cy={y} rx={19} ry={15.5} className="fill-key" />
              <text
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={16}
                className="fill-key-text font-mono font-bold"
              >
                {letter}
              </text>
            </g>
          </g>
        );
      })}

      {/* Pannello a spine: due fori per presa e i cavi che pendono tra le coppie. */}
      {Object.entries(layout.sockets).map(([letter, { x, y }]) => (
        <g key={letter}>
          <text x={x} y={y - 18} textAnchor="middle" fontSize={11} className="fill-key-text font-mono">
            {letter}
          </text>
          <circle cx={x} cy={y} r={6} className="fill-socket stroke-metal" strokeWidth={1.5} />
          <circle cx={x} cy={y + 14} r={4} className="fill-socket stroke-metal" strokeWidth={1.5} />
        </g>
      ))}
      {Object.keys(layout.sockets).length > 0 &&
        pairs.map((pair, i) => {
          const a = layout.sockets[pair[0] ?? ''];
          const b = layout.sockets[pair[1] ?? ''];
          if (!a || !b) return null;
          const cable = CABLE_CLASSES[i % CABLE_CLASSES.length];
          return (
            <g key={pair}>
              <path
                d={cablePath({ x: a.x, y: a.y + 7 }, { x: b.x, y: b.y + 7 }, layout.height - 8)}
                fill="none"
                className={cable}
                strokeWidth={4}
                strokeLinecap="round"
              />
              {[a, b].map((p, j) => (
                <rect
                  key={j}
                  x={p.x - 5}
                  y={p.y - 4}
                  width={10}
                  height={22}
                  rx={3}
                  className="fill-machine stroke-metal"
                  strokeWidth={1.5}
                />
              ))}
            </g>
          );
        })}
      {props.uhr !== undefined && Object.keys(layout.sockets).length > 0 && (
        <g>
          <rect
            x={front.x + front.width - 92}
            y={front.y + front.height + 2}
            width={80}
            height={30}
            rx={6}
            className="fill-machine stroke-metal"
          />
          <text
            x={front.x + front.width - 52}
            y={front.y + front.height + 17}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={13}
            className="fill-key-text font-mono"
          >
            {`Uhr ${String(props.uhr).padStart(2, '0')}`}
          </text>
        </g>
      )}
    </svg>
  );
}
