import it from './it.json';

export const locales = ['it'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'it';

const dictionaries = { it } satisfies Record<Locale, Record<string, string>>;

export type UiKey = keyof typeof it;

/** Restituisce la stringa d’interfaccia per la lingua richiesta, con ripiego sull’italiano. */
export function t(key: UiKey, locale: Locale = defaultLocale): string {
  return dictionaries[locale][key] ?? dictionaries[defaultLocale][key];
}
