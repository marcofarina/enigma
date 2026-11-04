import { useSyncExternalStore } from 'react';

/**
 * Da qui in su la home è la schermata unica di docs/design.md; sotto vale la versione ridotta
 * per il telefono. La stessa condizione sta in `bench.css`: se cambia, cambiano insieme.
 */
export const FULL_QUERY = '(min-width: 1024px) and (min-height: 576px)';

/** Vero sotto 1024×576: telefono, tablet in verticale, finestre molto basse. */
export function useCompact(): boolean {
  return useSyncExternalStore(
    (notify) => {
      const query = window.matchMedia(FULL_QUERY);
      query.addEventListener('change', notify);
      return () => query.removeEventListener('change', notify);
    },
    () => !window.matchMedia(FULL_QUERY).matches,
  );
}
