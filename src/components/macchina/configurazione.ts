import { defaultConfig, MODELS } from '@/engine';
import { createSession, pressAll, type Session } from '../simulator/session.ts';
import { readSharedLink, shareQuery } from '../simulator/share.ts';

/** Perché la pagina 3D non mostra la configurazione del link. */
export type AvvisoConfigurazione =
  | { tipo: 'nessuno' }
  | { tipo: 'link-non-valido' }
  /** Il link chiede un modello diverso dall’Enigma I: il simulatore lo apre, la vista 3D no. */
  | { tipo: 'altro-modello'; modello: string; query: string };

/**
 * Legge la query come la home (`Simulator.tsx`), ma la vista 3D ha solo l’Enigma I: con un altro
 * modello parte dalla configurazione di base e ricorda la query per il link al simulatore.
 */
export function sessioneDallaQuery(search: string): { session: Session; avviso: AvvisoConfigurazione } {
  const link = readSharedLink(search);
  const base = () => createSession(defaultConfig('I'));
  if (link.kind === 'none') return { session: base(), avviso: { tipo: 'nessuno' } };
  if (link.kind === 'invalid') return { session: base(), avviso: { tipo: 'link-non-valido' } };
  if (link.config.model !== 'I') {
    return {
      session: base(),
      avviso: { tipo: 'altro-modello', modello: MODELS[link.config.model].label, query: search.replace(/^\?/, '') },
    };
  }
  return { session: pressAll(createSession(link.config), link.message), avviso: { tipo: 'nessuno' } };
}

/** Query che riapre nel simulatore lo stato attuale: la configurazione di partenza e i tasti battuti. */
export function queryPerIlSimulatore(session: Session): string {
  return shareQuery(session.config, session.presses.map((p) => p.input).join(''));
}
