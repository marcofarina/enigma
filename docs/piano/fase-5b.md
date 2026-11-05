# Fase 5b — Pagina 3D: vista esplosa, cablaggio e nottolini

**Modello: Sonnet · Effort: high · Durata: 3 h · Dipende da: 4k, 5a**

**Obiettivo.** Un selettore fa scorrere la macchina da chiusa a smontata; dentro i rotori si vede
il cablaggio disegnato dal codice, sul pannello i cavi della configurazione, e i tre nottolini
mostrano il doppio passo a ogni tasto.

**Prompt di apertura**

```
Prima di tutto: questa fase richiede Sonnet con effort high. Se non stai girando su Sonnet,
fermati e dimmelo senza fare altro.

Esegui docs/piano/fase-5b.md. Leggi prima l’indice docs/piano.md e
docs/piano/convenzione-3d.md; parti dalla pagina costruita in 5a e dalla clip `smontaggio`
della 4k. Avvia il sito con il server
«astro-dev» e verifica nel browser.
```

**Passi**

1. **Selettore.** Un `input type="range"` nativo da 0 a 4 con `step="any"`; `aria-valuetext` dice
   la fase in parole, con i testi della tabella «Le fasi dello smontaggio». Il valore è il tempo
   della clip `smontaggio`: azione di `AnimationMixer` in pausa e `mixer.setTime(valore)`.
2. **Tastiera bloccata.** Con il selettore sopra 0 né i tasti del modello né la tastiera fisica
   cifrano, e un messaggio, annunciato anche nell’area `aria-live`, dice di rimontare la macchina.
3. **Cablaggio.** Linee fra i contatti delle due facce di ogni rotore, calcolati da
   `raggio_contatti` e dai cablaggi di `models.ts` per i rotori della configurazione. Il cablaggio
   compare dalla fase 3, quando i rotori sono aperti, e cambia quando cambia il rotore scelto.
4. **Cavi del pannello.** Una curva fra `ancora_presa_<l>` per ogni coppia della configurazione.
5. **Nottolini.** Una funzione pura del motore, per esempio `engagedPawls` in
   `src/engine/machine.ts`, dice quali nottolini entrano in una tacca al prossimo tasto. Unit test
   sulla sequenza ADU → ADV → AEW → BFX della lezione 5. A ogni tasto i tre nottolini si muovono;
   quelli in presa spingono, e al doppio passo il `nottolino_sinistro` spinge insieme il rotore
   centrale e quello di sinistra.
6. **Preferenze.** Con `prefers-reduced-motion` il selettore sposta i pezzi senza animare la camera.

**Criteri di accettazione**

```bash
pnpm test
```
con i test di `engagedPawls`.

```bash
pnpm verify && pnpm test:e2e
```
con un test che porta il selettore a 4 e controlla `aria-valuetext`, uno che con il selettore a 2
batte una lettera e trova il messaggio invece della lampada, e uno che batte le lettere del doppio
passo (da ADU) e controlla le posizioni mostrate.
