import { useId, useMemo, useState } from 'react';
import { toLetter, type Stage } from '@/engine';
import { t, tf } from '@/i18n';
import { reflectorShortLabel } from '@/components/simulator/labels.ts';
import { currentState } from '@/components/simulator/session.ts';
import { useSimulator } from '@/components/simulator/store.ts';
import { layoutSchematic, rowY, type Column, type Mark } from './layout.ts';

const markClass: Record<Exclude<Mark, null>, string> = {
  forward: 'stroke-signal-forward',
  return: 'stroke-signal-return',
  both: 'stroke-signal-forward',
};

function ContactLabels({ column, side }: { column: Column; side: 'left' | 'right' }) {
  const x = side === 'left' ? column.leftX : column.rightX;
  const marks = side === 'left' ? column.leftMarks : column.rightMarks;
  return (
    <g>
      {column.labels.map((letter, row) => {
        const mark = marks[row] ?? null;
        const y = rowY(row);
        return (
          <g key={row}>
            {mark && (
              <>
                <rect
                  x={x - 8}
                  y={y - 8}
                  width={16}
                  height={16}
                  rx={4}
                  className={`fill-surface ${markClass[mark]}`}
                  strokeWidth={2}
                />
                {mark === 'both' && (
                  <rect
                    x={x - 10}
                    y={y - 10}
                    width={20}
                    height={20}
                    rx={5}
                    className="fill-none stroke-signal-return"
                    strokeWidth={2}
                    strokeDasharray="4 2"
                  />
                )}
              </>
            )}
            <text
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="central"
              className={mark ? 'fill-text font-bold' : 'fill-text-muted'}
              fontSize={11}
            >
              {letter}
            </text>
          </g>
        );
      })}
    </g>
  );
}

function describePath(input: string, stages: readonly Stage[]): string {
  const steps = stages.map((stage) => toLetter(stage.output));
  return tf('sim.schematic.path', { path: [input, ...steps].join(' → ') });
}

export default function SchematicView() {
  const id = useId();
  const session = useSimulator((s) => s.session);
  const [allWiring, setAllWiring] = useState(false);
  const { machine, config } = session;
  const last = session.presses.at(-1);
  const schematic = useMemo(() => {
    const state = currentState(session);
    return machine && state ? layoutSchematic(machine, state, last?.stages) : null;
  }, [session, machine, last]);

  const header = (column: Column): [string, string] => {
    switch (column.kind) {
      case 'keys':
        return [t('sim.schematic.keys'), ''];
      case 'plugboard':
        return [config.uhr === undefined ? t('sim.schematic.plugboard') : t('sim.schematic.uhr'), ''];
      case 'entry':
        return [t('sim.schematic.entry'), t('sim.schematic.entrySub')];
      case 'rotor':
        return [
          config.rotors[column.slot ?? 0] ?? '',
          tf('sim.schematic.ring', { letter: config.rings[column.slot ?? 0] ?? 'A' }),
        ];
      case 'reflector':
        return [reflectorShortLabel(config), t('sim.schematic.reflectorSub')];
    }
  };

  return (
    <section aria-labelledby={`${id}-title`} className="flex flex-col gap-2">
      <h2 id={`${id}-title`} className="text-xl font-semibold">
        {t('sim.schematic.title')}
      </h2>
      <p className="text-sm text-text-muted">{t('sim.schematic.hint')}</p>
      {!schematic ? (
        <p className="rounded-md border border-border bg-surface-muted px-4 py-3 text-sm">
          {t('sim.schematic.unavailable')}
        </p>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                className="h-5 w-5"
                checked={allWiring}
                onChange={(e) => setAllWiring(e.target.checked)}
              />
              {t('sim.schematic.allWiring')}
            </label>
            <span className="flex items-center gap-2">
              <svg width="32" height="8" aria-hidden="true">
                <line x1="0" y1="4" x2="32" y2="4" className="stroke-signal-forward" strokeWidth={3} />
              </svg>
              {t('sim.schematic.forward')}
            </span>
            <span className="flex items-center gap-2">
              <svg width="32" height="8" aria-hidden="true">
                <line
                  x1="0"
                  y1="4"
                  x2="32"
                  y2="4"
                  className="stroke-signal-return"
                  strokeWidth={3}
                  strokeDasharray="6 4"
                />
              </svg>
              {t('sim.schematic.return')}
            </span>
          </div>
          {/* Lo schema ha una larghezza minima leggibile: sugli schermi stretti scorre in orizzontale,
              e l’area deve ricevere il focus per poterla scorrere da tastiera (WCAG 2.1.1). */}
          <div
            className="overflow-x-auto rounded-lg border border-border bg-surface"
            // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
            tabIndex={0}
            role="region"
            aria-labelledby={`${id}-title`}
          >
            <svg
              viewBox={`0 0 ${schematic.width} ${schematic.height}`}
              className="block w-full min-w-[36rem] font-mono"
              role="img"
              aria-labelledby={`${id}-svg-title ${id}-svg-desc`}
            >
              <title id={`${id}-svg-title`}>{t('sim.schematic.title')}</title>
              <desc id={`${id}-svg-desc`}>
                {t('sim.schematic.description')}{' '}
                {last ? describePath(last.input, last.stages) : t('sim.schematic.empty')}
              </desc>
              {schematic.columns.map((column) => {
                const [title, subtitle] = header(column);
                return (
                  <g key={`${column.kind}-${column.slot ?? ''}`}>
                    {column.kind !== 'keys' && (
                      <rect
                        x={column.x}
                        y={schematic.top - 4}
                        width={column.width}
                        height={schematic.height - schematic.top - 4}
                        rx={6}
                        className="fill-surface-muted stroke-border"
                      />
                    )}
                    <text
                      x={column.x + column.width / 2}
                      y={18}
                      textAnchor="middle"
                      className="fill-text font-bold"
                      fontSize={13}
                    >
                      {title}
                    </text>
                    <text
                      x={column.x + column.width / 2}
                      y={34}
                      textAnchor="middle"
                      className="fill-text-muted"
                      fontSize={10}
                    >
                      {subtitle}
                    </text>
                    {allWiring &&
                      column.wiring.map((d, i) => (
                        <path
                          key={i}
                          d={d}
                          className="fill-none stroke-text-muted"
                          strokeOpacity={0.35}
                          strokeWidth={1}
                        />
                      ))}
                  </g>
                );
              })}
              <path
                d={schematic.forward}
                className="fill-none stroke-signal-forward"
                strokeWidth={3}
                strokeLinejoin="round"
              />
              <path
                d={schematic.back}
                className="fill-none stroke-signal-return"
                strokeWidth={3}
                strokeDasharray="6 4"
                strokeLinejoin="round"
              />
              {schematic.columns.map((column) => (
                <g key={`labels-${column.kind}-${column.slot ?? ''}`}>
                  <ContactLabels column={column} side="right" />
                  {column.leftX !== column.rightX && <ContactLabels column={column} side="left" />}
                </g>
              ))}
            </svg>
          </div>
          {!last && <p className="text-sm text-text-muted">{t('sim.schematic.empty')}</p>}
        </>
      )}
    </section>
  );
}
