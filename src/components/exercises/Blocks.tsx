import { ALPHABET } from '@/engine';
import { t } from '@/i18n';
import type { Block, KeySheet } from '@/exercises/catalog.ts';

const ringNumber = (letter: string) => String(ALPHABET.indexOf(letter) + 1).padStart(2, '0');

/** Area che scorre in orizzontale sugli schermi stretti e riceve il focus da tastiera. */
function Scroll({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div
      className="overflow-x-auto rounded-md border border-border"
      // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
      tabIndex={0}
      role="region"
      aria-label={label}
    >
      {children}
    </div>
  );
}

function KeySheetView({ sheet }: { sheet: KeySheet }) {
  const rows: [string, string][] = [
    [t('ex.key.rotors'), sheet.rotors.join(' – ')],
    [t('ex.key.rings'), [...sheet.rings].map((l) => (sheet.ringsAsNumbers ? ringNumber(l) : l)).join(' ')],
    [t('ex.key.plugboard'), sheet.plugboard.length > 0 ? sheet.plugboard.join(' ') : t('ex.key.noCables')],
    ...(sheet.positions ? [[t('ex.key.positions'), [...sheet.positions].join(' ')] as [string, string]] : []),
    [t('ex.key.reflector'), 'B'],
  ];
  return (
    <section aria-label={t('ex.key.title')} className="rounded-lg border-2 border-border bg-surface-muted p-4">
      <h3 className="mb-2 font-semibold">{t('ex.key.title')}</h3>
      <dl className="grid gap-x-4 gap-y-1 sm:grid-cols-[auto_1fr]">
        {rows.map(([label, value]) => (
          <div key={label} className="contents">
            <dt className="text-sm text-text-muted">{label}</dt>
            <dd className="font-mono text-lg tracking-wider">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export default function Blocks({ blocks }: { blocks: readonly Block[] }) {
  return (
    <div className="flex flex-col gap-4">
      {blocks.map((block, i) => {
        switch (block.kind) {
          case 'text':
            return <p key={i}>{block.text}</p>;
          case 'key':
            return <KeySheetView key={i} sheet={block.sheet} />;
          case 'message':
            return (
              <div key={i} className="flex flex-col gap-1">
                <span className="text-sm font-semibold">{block.label}</span>
                <p className="rounded-md bg-surface-muted px-3 py-2 font-mono text-lg tracking-wider">{block.text}</p>
              </div>
            );
          case 'wiring':
            return (
              <Scroll key={i} label={t('ex.wiring.title')}>
                <table className="border-collapse font-mono text-sm">
                  <caption className="sr-only">{t('ex.wiring.title')}</caption>
                  <thead>
                    <tr>
                      <th
                        scope="row"
                        className="sticky left-0 bg-surface px-2 py-1 text-left font-sans font-normal text-text-muted"
                      >
                        {t('ex.wiring.in')}
                      </th>
                      {[...ALPHABET].map((letter) => (
                        <th key={letter} scope="col" className="w-5 py-1 text-center">
                          {letter}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {block.rows.map((row) => (
                      <tr key={row.name} className="border-t border-border">
                        <th
                          scope="row"
                          className="sticky left-0 whitespace-nowrap bg-surface px-2 py-1 text-left font-sans font-normal"
                        >
                          {row.name}
                        </th>
                        {[...row.wiring].map((letter, j) => (
                          <td key={j} className="w-5 py-1 text-center">
                            {letter}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Scroll>
            );
          case 'compare':
            return (
              <Scroll key={i} label={t('ex.compare.caption')}>
                <table className="border-collapse font-mono">
                  <caption className="sr-only">{t('ex.compare.caption')}</caption>
                  <tbody>
                    <tr className="text-xs text-text-muted">
                      <th scope="row" className="sticky left-0 bg-surface px-2 text-left font-sans font-normal">
                        {t('ex.compare.position')}
                      </th>
                      {[...block.plain].map((_, j) => (
                        <td key={j} className="min-w-7 px-0.5 text-center">
                          {j + 1}
                        </td>
                      ))}
                    </tr>
                    {[
                      [t('ex.label.plain'), block.plain],
                      [t('ex.label.cipher'), block.cipher],
                    ].map(([label, text]) => (
                      <tr key={label} className="border-t border-border text-lg">
                        <th
                          scope="row"
                          className="sticky left-0 whitespace-nowrap bg-surface px-2 text-left font-sans text-sm font-normal"
                        >
                          {label}
                        </th>
                        {[...(text ?? '')].map((letter, j) => (
                          <td key={j} className="min-w-7 px-0.5 text-center">
                            {letter}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Scroll>
            );
        }
      })}
    </div>
  );
}
