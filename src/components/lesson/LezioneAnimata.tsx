import { useCallback, useEffect, useRef, useState } from 'react';
import { useStore } from 'zustand';
import { t, tf } from '@/i18n';
import type { Copione, Durate } from '@/lib/lezione-3d';
import type { StoreLezione } from '../macchina/lezione.ts';

/*
 * Il lettore della lezione animata (fase 5d di docs/piano/fase-5d.md, D16–D19; posto e comandi in
 * docs/design.md, «Pagina 3D»). Arriva con un import pigro, al clic su «Guarda come funziona».
 *
 * Il passo corrente suona il suo audio, e la sua animazione dura quanto l’audio: il lettore scrive in
 * `stato` il passo e i secondi passati, la scena li legge. Finito l’audio si passa al passo seguente.
 * Il tempo viene dall’audio quando suona, altrimenti da un orologio con la durata di `durate`: se il
 * browser non riproduce il file, la lezione va avanti lo stesso, con i sottotitoli. «A passi, senza
 * voce» toglie l’audio e il passaggio automatico: l’animazione del passo va fino in fondo e si ferma,
 * e si avanza a mano (serve alla LIM). Nessun audio si scarica prima del clic.
 */

type Andamento = 'in-corso' | 'in-pausa' | 'finito';

/** Se l’audio si blocca senza finire, dopo quanto oltre la durata il lettore passa avanti lo stesso. */
const MARGINE_AUDIO_S = 1.5;

export default function LezioneAnimata({
  copione,
  durate,
  audio,
  stato,
  senzaVoce,
  pronta,
}: {
  copione: Copione;
  durate: Durate;
  /** L’indirizzo della cartella dei file audio, con la barra finale. */
  audio: string;
  stato: StoreLezione;
  /** Parte «A passi, senza voce»: con `prefers-reduced-motion`. */
  senzaVoce: boolean;
  /** La scena è pronta, o non ci sarà: finché è falso la lezione aspetta al primo passo. */
  pronta: boolean;
}) {
  const passi = copione.passi;
  const indice = useStore(stato, (s) => s.indice);
  const [voce, setVoce] = useState(!senzaVoce);
  const [andamento, setAndamento] = useState<Andamento>('in-corso');
  const [giro, setGiro] = useState(0);
  const lettore = useRef<HTMLAudioElement | null>(null);
  const titolo = useRef<HTMLHeadingElement>(null);
  const passo = passi[indice];
  const ultimo = indice === passi.length - 1;

  // All’apertura il fuoco va al titolo del lettore.
  useEffect(() => titolo.current?.focus(), []);

  const vaiA = useCallback(
    (nuovo: number) => {
      stato.setState({ indice: Math.min(Math.max(nuovo, 0), passi.length - 1), t: 0 });
      setAndamento('in-corso');
      setGiro((g) => g + 1);
    },
    [stato, passi.length],
  );

  // L’orologio del passo: parte da dove era il tempo (dopo una pausa) e si ferma alla fine del passo.
  useEffect(() => {
    if (!pronta || andamento !== 'in-corso' || !passo) return;
    const durata = durate[passo.id]?.durata ?? 0;
    const partenza = stato.getState().t;
    const inizio = performance.now() - partenza * 1000;
    let suona = false;
    let frame = 0;
    let finito = false;

    const audioDelPasso = voce ? (lettore.current ??= new Audio()) : null;
    if (audioDelPasso) {
      const file = `${audio}${passo.id}.m4a`;
      if (!audioDelPasso.src.endsWith(file)) audioDelPasso.src = file;
      audioDelPasso.currentTime = partenza;
      audioDelPasso.onerror = () => {
        suona = false;
      };
      audioDelPasso.play().then(
        () => {
          suona = true;
        },
        () => {
          suona = false;
        },
      );
    }

    const tick = () => {
      const orologio = (performance.now() - inizio) / 1000;
      const t = suona && audioDelPasso && !audioDelPasso.paused ? audioDelPasso.currentTime : orologio;
      stato.setState({ t: Math.min(t, durata) });
      // Finito il passo: con la voce si aspetta che l’audio finisca davvero (al più un secondo e mezzo).
      const audioFinito = !suona || !audioDelPasso || audioDelPasso.ended || orologio > durata + MARGINE_AUDIO_S;
      if (t >= durata && audioFinito) {
        finito = true;
        if (voce && !ultimo) vaiA(indice + 1);
        else setAndamento('finito');
        return;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    // Se il browser sospende i fotogrammi (scheda in secondo piano), il passo finisce lo stesso.
    const scadenza = setInterval(() => {
      if (!finito && document.hidden) tick();
    }, 250);

    return () => {
      cancelAnimationFrame(frame);
      clearInterval(scadenza);
      audioDelPasso?.pause();
    };
  }, [pronta, andamento, passo, durate, stato, voce, audio, ultimo, indice, vaiA, giro]);

  // Chiudendo il lettore l’audio si ferma e si scarica.
  useEffect(
    () => () => {
      const elemento = lettore.current;
      if (!elemento) return;
      elemento.pause();
      elemento.removeAttribute('src');
      elemento.load();
    },
    [],
  );

  const pausaORiprendi = () => {
    if (andamento === 'in-corso') setAndamento('in-pausa');
    else if (andamento === 'in-pausa') setAndamento('in-corso');
    else vaiA(indice); // finito: si rivede il passo
  };
  const etichettaCentrale =
    andamento === 'in-corso'
      ? t('machine3d.lesson.pause')
      : andamento === 'in-pausa'
        ? t('machine3d.lesson.resume')
        : t('machine3d.lesson.replay');
  const iconaCentrale = andamento === 'in-corso' ? '⏸' : andamento === 'in-pausa' ? '▶' : '⟲';

  if (!passo) return null;
  return (
    <section aria-labelledby="macchina-lezione" className="macchina-sezione macchina-lezione" data-lezione={passo.id}>
      <div className="macchina-intestazione">
        <h2 id="macchina-lezione" tabIndex={-1} ref={titolo}>
          {t('machine3d.lesson.title')}
        </h2>
        <p className="macchina-contatore" data-contatore>
          {tf('machine3d.lesson.counter', { n: indice + 1, total: passi.length })}
        </p>
      </div>

      {!pronta && <p className="macchina-nota">{t('machine3d.lesson.waiting')}</p>}
      {/* Il sottotitolo: con la voce lo legge la voce; a passi lo annuncia il lettore di schermo. */}
      <p className="macchina-sottotitolo" aria-live={voce ? 'off' : 'polite'} data-sottotitolo>
        {passo.testo}
      </p>

      <div className="macchina-lettore" role="group" aria-label={t('machine3d.lesson.controls')}>
        <button
          type="button"
          className="macchina-comando macchina-quadrato"
          aria-label={t('machine3d.lesson.previous')}
          title={t('machine3d.lesson.previous')}
          disabled={indice === 0}
          onClick={() => vaiA(indice - 1)}
        >
          <span aria-hidden="true">◀</span>
        </button>
        <button
          type="button"
          className="macchina-comando macchina-quadrato"
          aria-label={etichettaCentrale}
          title={etichettaCentrale}
          disabled={!pronta}
          onClick={pausaORiprendi}
        >
          <span aria-hidden="true">{iconaCentrale}</span>
        </button>
        <button
          type="button"
          className="macchina-comando macchina-quadrato"
          aria-label={t('machine3d.lesson.next')}
          title={t('machine3d.lesson.next')}
          disabled={ultimo}
          onClick={() => vaiA(indice + 1)}
        >
          <span aria-hidden="true">▶</span>
        </button>
        <label className="macchina-senza-voce">
          <input
            type="checkbox"
            checked={!voce}
            onChange={(event) => {
              setVoce(!event.target.checked);
              if (andamento === 'finito' && !event.target.checked && !ultimo) vaiA(indice + 1);
            }}
          />
          {t('machine3d.lesson.steps')}
        </label>
      </div>

      <details className="macchina-trascrizione">
        <summary>{t('machine3d.lesson.transcript')}</summary>
        <ol>
          {passi.map((p) => (
            <li key={p.id} aria-current={p.id === passo.id ? 'step' : undefined}>
              {p.testo}
            </li>
          ))}
        </ol>
      </details>
    </section>
  );
}
