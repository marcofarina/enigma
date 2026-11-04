import { useEffect, useId, useRef, type ReactNode } from 'react';
import { t } from '@/i18n';
import { useBench, type PanelId } from './ui.ts';

interface Props {
  id: PanelId;
  title: ReactNode;
  /** Dove si apre: sopra la colonna sinistra, sotto l’intestazione a destra, o sopra il campo «Digita». */
  place: 'left' | 'right' | 'bottom';
  children: ReactNode;
}

/** Identificativo del pannello nel DOM, per `aria-controls` dei pulsanti che lo aprono. */
export const panelDomId = (id: PanelId) => `pannello-${id}`;

/**
 * Pannello ancorato, non modale: lascia la macchina scoperta e utilizzabile. All’apertura il
 * fuoco entra nel pannello; si chiude con Esc, con la ×, con il pulsante che l’ha aperto o con un
 * clic fuori, e il fuoco torna al pulsante.
 */
export default function Panel({ id, title, place, children }: Props) {
  const titleId = useId();
  const ref = useRef<HTMLDivElement>(null);
  const open = useBench((s) => s.panel === id);
  const close = useBench((s) => s.closePanel);

  useEffect(() => {
    if (!open) return;
    const element = ref.current;
    const first = element?.querySelector<HTMLElement>('input, select, button:not([data-close])');
    (first ?? element)?.focus();
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      const opener = useBench.getState().opener;
      if (!target || element?.contains(target) || opener?.contains(target)) return;
      // Un clic fuori chiude il pannello senza riportare il fuoco al pulsante: va dove si è cliccato.
      useBench.setState({ panel: null, opener: null });
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  if (!open) return null;
  return (
    <div
      ref={ref}
      id={panelDomId(id)}
      role="dialog"
      aria-labelledby={titleId}
      tabIndex={-1}
      className={`panel panel-${place}`}
    >
      <div className="panel-title">
        <h2 id={titleId}>{title}</h2>
        <button type="button" data-close className="arrow panel-close" aria-label={t('bench.close')} onClick={close}>
          ×
        </button>
      </div>
      {children}
    </div>
  );
}
