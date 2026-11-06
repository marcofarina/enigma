import { useEffect, useRef, type RefObject } from 'react';
import { t, tf, type UiKey } from '@/i18n';
import type { Pezzo } from './pezzi.ts';

/*
 * L’elenco dei pezzi e la scheda di un pezzo (fase 5c, docs/design.md «Pagina 3D»): stanno nel
 * foglio al posto della sezione «Messaggio», con × per chiuderli. Il fuoco lo sposta la pagina, che
 * cerca l’elemento con `data-fuoco`.
 */

/** Esc, con il fuoco dentro la sezione, la chiude come il ×. */
function useEsc(chiudi: () => void): RefObject<HTMLElement | null> {
  const sezione = useRef<HTMLElement>(null);
  const corrente = useRef(chiudi);
  useEffect(() => {
    corrente.current = chiudi;
  });
  useEffect(() => {
    const elemento = sezione.current;
    if (!elemento) return;
    const premuto = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.stopPropagation();
      corrente.current();
    };
    elemento.addEventListener('keydown', premuto);
    return () => elemento.removeEventListener('keydown', premuto);
  }, []);
  return sezione;
}

function Chiudi({ etichetta, onClick }: { etichetta: string; onClick: () => void }) {
  return (
    <button type="button" className="macchina-chiudi" aria-label={etichetta} title={etichetta} onClick={onClick}>
      <span aria-hidden="true">×</span>
    </button>
  );
}

export function ElencoPezzi({
  pezzi,
  onScegli,
  onChiudi,
}: {
  pezzi: readonly Pezzo[];
  onScegli: (id: string) => void;
  onChiudi: () => void;
}) {
  const sezione = useEsc(onChiudi);
  return (
    <section
      ref={sezione}
      aria-labelledby="macchina-elenco"
      className="macchina-sezione"
      id="macchina-pannello-pezzi"
      data-elenco
    >
      <div className="macchina-intestazione">
        <h2 id="macchina-elenco" tabIndex={-1} data-fuoco="elenco">
          {t('machine3d.parts.list')}
        </h2>
        <Chiudi etichetta={t('machine3d.parts.closeList')} onClick={onChiudi} />
      </div>
      <p className="macchina-nota">{t('machine3d.parts.hint')}</p>
      <ul className="macchina-pezzi">
        {pezzi.map((pezzo) => (
          <li key={pezzo.id}>
            <button type="button" data-fuoco={`voce:${pezzo.id}`} onClick={() => onScegli(pezzo.id)}>
              {pezzo.nome}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function SchedaPezzo({
  pezzo,
  fase,
  onMostra,
  onChiudi,
}: {
  pezzo: Pezzo;
  /** La fase dello smontaggio da cui il pezzo si vede; `null` se non si muove o se la scena non è pronta. */
  fase: number | null;
  onMostra: (fase: number) => void;
  onChiudi: () => void;
}) {
  const sezione = useEsc(onChiudi);
  return (
    <section
      ref={sezione}
      aria-labelledby="macchina-scheda"
      className="macchina-sezione macchina-scheda"
      id="macchina-pannello-pezzi"
      data-scheda={pezzo.id}
    >
      <div className="macchina-intestazione">
        <h2 id="macchina-scheda" tabIndex={-1} data-fuoco="scheda">
          {pezzo.nome}
        </h2>
        <Chiudi etichetta={t('machine3d.parts.close')} onClick={onChiudi} />
      </div>
      <p className="macchina-descrizione">{pezzo.descrizione}</p>
      <p className="macchina-lezione">
        <a href={pezzo.lezione.href}>{tf('machine3d.parts.lesson', { title: pezzo.lezione.titolo })}</a>
      </p>
      {fase !== null && (
        <button type="button" className="btn" onClick={() => onMostra(fase)}>
          {tf('machine3d.parts.show', { phase: t(`machine3d.phase.${fase}` as UiKey) })}
        </button>
      )}
      {pezzo.fonti.length > 0 && (
        <p className="macchina-fonti">
          {t('machine3d.parts.sources')}:{' '}
          {pezzo.fonti.map((fonte, i) => (
            <span key={fonte.titolo}>
              {i > 0 && '; '}
              {fonte.url ? <a href={fonte.url}>{fonte.titolo}</a> : fonte.titolo} ({fonte.autori})
            </span>
          ))}
        </p>
      )}
    </section>
  );
}
