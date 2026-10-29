/**
 * Costruisce un URL interno che rispetta `base` (il sito è servito sotto /enigma/ su GitHub Pages).
 * Accetta percorsi come `simulatore/` o `/simulatore/`.
 */
export function url(path = ''): string {
  const base = import.meta.env.BASE_URL.replace(/\/?$/, '/');
  const clean = path.replace(/^\//, '');
  return base + clean;
}
