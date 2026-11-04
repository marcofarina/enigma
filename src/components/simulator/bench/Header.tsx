import type { ReactNode } from 'react';
import { MODEL_IDS, MODELS, type ModelId } from '@/engine';
import { t, tf } from '@/i18n';
import { url } from '@/lib/url';
import { changeModel, changeReflector } from '../config-edit.ts';
import { reflectorLabel } from '../labels.ts';
import { useSimulator } from '../store.ts';
import { panelDomId } from './Panel.tsx';
import { cableCount } from './Panels.tsx';
import { useBench, type PanelId } from './ui.ts';

const THEME_KEY = 'enigma-theme';

/** Stesso comportamento di `ThemeToggle.astro`: la scelta si ricorda fra le pagine. */
function toggleTheme() {
  const explicit = document.documentElement.dataset['theme'];
  const dark =
    explicit === 'dark' || (explicit !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  const next = dark ? 'light' : 'dark';
  document.documentElement.dataset['theme'] = next;
  try {
    localStorage.setItem(THEME_KEY, next);
  } catch {
    // Archiviazione non disponibile (navigazione privata): il tema vale solo per questa pagina.
  }
}

function PanelButton({ panel, children }: { panel: PanelId; children: ReactNode }) {
  const open = useBench((s) => s.panel === panel);
  const togglePanel = useBench((s) => s.togglePanel);
  return (
    <button
      type="button"
      className="ctl"
      aria-expanded={open}
      aria-controls={open ? panelDomId(panel) : undefined}
      onClick={(event) => togglePanel(panel, event.currentTarget)}
    >
      {children}
    </button>
  );
}

const NAV = [
  { href: 'come-funziona/', key: 'nav.howItWorks' },
  { href: 'storia/', key: 'nav.history' },
  { href: 'esercizi/', key: 'nav.exercises' },
  { href: 'glossario/', key: 'nav.glossary' },
] as const;

export default function Header({ lim, onLim }: { lim: boolean; onLim: () => void }) {
  const config = useSimulator((s) => s.session.config);
  const configure = useSimulator((s) => s.configure);
  const model = MODELS[config.model];
  const featured = MODEL_IDS.filter((id) => MODELS[id].featured);
  const others = MODEL_IDS.filter((id) => !MODELS[id].featured);

  return (
    <header className="bench-header">
      <a href={url()} className="bench-brand">
        {t('site.title')}
      </a>
      <select
        className="ctl"
        aria-label={t('sim.config.model')}
        value={config.model}
        onChange={(event) => configure((c) => changeModel(c, event.target.value as ModelId))}
      >
        <optgroup label={t('sim.config.featured')}>
          {featured.map((id) => (
            <option key={id} value={id}>
              {MODELS[id].label}
            </option>
          ))}
        </optgroup>
        <optgroup label={t('sim.config.others')}>
          {others.map((id) => (
            <option key={id} value={id}>
              {MODELS[id].label}
            </option>
          ))}
        </optgroup>
      </select>
      <select
        className="ctl"
        aria-label={t('sim.config.reflector')}
        value={config.reflector}
        onChange={(event) => configure((c) => changeReflector(c, event.target.value))}
      >
        {Object.keys(model.reflectors).map((name) => (
          <option key={name} value={name}>
            {reflectorLabel(name)}
          </option>
        ))}
      </select>
      {model.plugboard && (
        <PanelButton panel="plugs">
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
            aria-hidden="true"
          >
            <circle cx="3.5" cy="3.5" r="2" />
            <circle cx="10.5" cy="10.5" r="2" />
            <path d="M5 5l4 4" />
          </svg>
          {tf('bench.plugs.button', { count: cableCount(config.plugboard?.length ?? 0) })}
        </PanelButton>
      )}
      <nav aria-label={t('nav.label')} className="bench-nav">
        {NAV.map((link) => (
          <a key={link.href} href={url(link.href)}>
            {t(link.key)}
          </a>
        ))}
      </nav>
      <div className="bench-tools">
        <PanelButton panel="share">{t('bench.share.button')}</PanelButton>
        <button type="button" className="ctl" aria-pressed={lim} onClick={onLim}>
          {t('sim.lim.enter')}
        </button>
        <button
          type="button"
          className="ctl ctl-icon"
          aria-label={t('theme.toggle')}
          title={t('theme.toggle')}
          onClick={toggleTheme}
        >
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
        </button>
      </div>
    </header>
  );
}
