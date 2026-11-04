import { useEffect, useId, useRef, useState } from 'react';
import { rotorColumns } from './geometry.ts';
import { t, tf } from '@/i18n';
import { url } from '@/lib/url';
import { slotName } from '../labels.ts';
import { windows } from '../session.ts';
import { useSimulator } from '../store.ts';
import { toggleTheme } from './Header.tsx';
import BenchKeyboard from './Keyboard.tsx';
import { Message } from './Sheet.tsx';
import { Dial } from './Well.tsx';

const NAV = [
  { href: 'come-funziona/', key: 'nav.howItWorks' },
  { href: 'storia/', key: 'nav.history' },
  { href: 'crittoanalisi/', key: 'nav.cryptanalysis' },
  { href: 'esercizi/', key: 'nav.exercises' },
  { href: 'glossario/', key: 'nav.glossary' },
  { href: 'docenti/', key: 'nav.teachers' },
] as const;

/** Intestazione da 52 px: il marchio e il pulsante del menu, che si apre come foglio sotto la barra. */
function CompactHeader() {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const button = useRef<HTMLButtonElement>(null);
  const sheet = useRef<HTMLDivElement>(null);

  // Aperto, il menu porta il fuoco sulla prima voce; Esc lo chiude e riporta il fuoco al pulsante.
  useEffect(() => {
    if (open) sheet.current?.querySelector<HTMLElement>('a, button')?.focus();
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setOpen(false);
      button.current?.focus();
    };
    const onPointerDown = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        !button.current?.contains(event.target) &&
        !sheet.current?.contains(event.target)
      )
        setOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [open]);

  return (
    <header className="bench-header compact-header">
      <a href={url()} className="bench-brand">
        {t('site.title')}
      </a>
      <button
        ref={button}
        type="button"
        className="compact-menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label={t('nav.menu')}
        onClick={() => setOpen((value) => !value)}
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 22 22"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          aria-hidden="true"
        >
          <path d={open ? 'M5 5l12 12M17 5L5 17' : 'M3 6h16M3 11h16M3 16h16'} />
        </svg>
      </button>
      {open && (
        <div ref={sheet} id={menuId} className="compact-sheet">
          <nav aria-label={t('nav.label')}>
            <ul>
              <li>
                <a href={url()} aria-current="page">
                  {t('nav.simulator')}
                </a>
              </li>
              {NAV.map((link) => (
                <li key={link.href}>
                  <a href={url(link.href)}>{t(link.key)}</a>
                </li>
              ))}
            </ul>
            <button type="button" className="compact-theme" onClick={toggleTheme}>
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                aria-hidden="true"
              >
                <circle cx="8" cy="8" r="6" />
                <path d="M8 2a6 6 0 0 0 0 12z" fill="currentColor" />
              </svg>
              {t('theme.label')}
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}

/** Le finestrelle dei rotori con le frecce da 44 px; l’anello e il resto si regolano sul computer. */
function CompactRotors() {
  const session = useSimulator((s) => s.session);
  const setWindow = useSimulator((s) => s.setWindow);
  const letters = windows(session).rotors;
  const { config } = session;

  return (
    <div role="group" aria-label={t('bench.compact.rotors')} className="compact-rotors">
      {rotorColumns(config.rotors.length).map(({ slot }) => (
        <div key={slot} className="compact-rotor">
          <Dial
            stacked
            knurl={false}
            label={tf('sim.wheel.label', { slot: slotName(config, slot) })}
            letter={letters[slot] ?? 'A'}
            onChange={(next) => setWindow(slot, next)}
          />
          <span className="compact-rotor-name">{config.rotors[slot]}</span>
        </div>
      ))}
    </div>
  );
}

/**
 * La versione ridotta della home (docs/design.md, «Versione ridotta»): finestrelle, lampade,
 * tasti, foglio del messaggio e l’avviso che rimanda al computer. Niente schema e niente
 * pannelli di configurazione. I tasti sono pulsanti: toccarli non apre la tastiera del telefono.
 */
export default function Compact({ invalidLink }: { invalidLink: boolean }) {
  return (
    <>
      <h1 className="sr-only">{t('bench.title')}</h1>
      <CompactHeader />
      <main id="contenuto" className="compact-main">
        <CompactRotors />
        <BenchKeyboard />
        <section aria-label={t('bench.sheet')} className="sheet compact-sheet-message">
          {invalidLink && (
            <p role="status" className="sheet-status">
              {t('sim.share.invalid')}
            </p>
          )}
          <Message perRow={4} minRows={3} compact />
        </section>
        <div className="compact-notice">
          <p>{t('bench.compact.notice')}</p>
          <a href={url('come-funziona/')}>{t('bench.compact.lessons')}</a>
        </div>
      </main>
    </>
  );
}
