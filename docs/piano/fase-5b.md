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

**Esito (2026-11-05)**

- **Selettore.** `input type="range"` da 0 a 4 con `step="any"` sotto il palco, visibile solo a vista
  avviata (`Macchina.tsx`). `aria-valuetext` dice il testo della tabella sulle fasi intere e
  «da rotori estratti a rotori aperti» a metà fra due (`posizioneSelettore` in `geometria.ts`). Con
  `step="any"` i tasti freccia non hanno un passo: un gestore li porta alla fase vicina. Accanto, il
  pulsante «Rimonta la macchina», attivo da 0 in su.
- **Clip.** Un solo `AnimationMixer` sulla scena, con l'azione `smontaggio` in pausa. Non uso
  `mixer.setTime(valore)`: l'ho provato in Node con three e dà sempre la posizione 0, in pausa o no,
  perché azzera il tempo delle azioni. Funziona `azione.time = valore` e `mixer.update(0)`. Il tempo
  si ferma a 3,9999 s, dove un'azione che si ripete tornerebbe a 0. La tela porta `data-tempo-clip`,
  per i test.
- **Tastiera bloccata.** `useKeyCapture(store, bloccata?)` in `store.ts`: la funzione, se c'è, può
  assorbire lettere e Backspace. Con il selettore sopra 0 la pagina assorbe anche il clic sui tasti
  del modello. Il rifiuto compare in un paragrafo (`data-blocco`) e va nell'area `aria-live`, che
  torna alla lampada al primo tasto dopo il rimontaggio; con il selettore a 0 il paragrafo sparisce,
  ma l'annuncio resta com'è e non si ripete.
- **Cablaggio.** `CablaggioRotore` in `Scena.tsx`: 26 linee per rotore (`Line` di drei, 1,4 px),
  figlie del nodo del rotore, quindi girano con lui. I punti li dà `segmentiCablaggio`
  (`geometria.ts`) da `raggio_contatti` (dagli `extras`) e dalle facce del nucleo, lette dalla sua
  geometria (da −14 a +13,5 mm), con il cablaggio `forward` di `machine.rotors[slot]`: cambia con i
  rotori della configurazione. Compare fra il valore 2 e il 3; nello stesso tratto il nucleo, che è
  opaco, diventa trasparente (opacità fino a 0,15; il materiale è clonato, perché è condiviso con
  altri pezzi). L'orientamento dei contatti è quello della convenzione, tradotto da Blender a glTF:
  il contatto 0 in alto, l'angolo cresce verso il retro (−Z).
- **Cavi del pannello.** `CaviPannello`: un tubo (`TubeGeometry`, 2,6 mm) su una curva fra le due
  `ancora_presa_<l>` di ogni coppia, con il colore di `--print-red`. Compaiono a partire da 0,8,
  quando lo sportello si è alzato: prima passerebbero attraverso di lui. Le ancore non seguono lo
  smontaggio e il pannello nemmeno, quindi i cavi restano dove sono.
- **Nottolini.** `engagedPawls(machine, state)` in `src/engine/machine.ts`: un booleano per slot,
  da sinistra. Il veloce è sempre in presa; il centrale quando il veloce è sulla tacca; il lento
  quando lo è il centrale, e allora spinge lui e il centrale (doppio passo). Per le macchine a
  ingranaggi e per il rotore sottile della M4 restano `false`. Test in `machine.test.ts`: la
  sequenza da ADU (`--R`, `-CR`, `L-R`, `--R`), tutti e due in presa, concordanza con `step().moved`
  su sette stati, M4 e G31. A ogni tasto i tre nottolini ruotano su X attorno al perno e tornano in
  180 ms: 0,32 rad quello in presa, 0,1 gli altri; la `leva_tasti` accompagna con 0,05 rad. I rotori
  che il motore fa avanzare girano nello stesso tempo; da Z ad A non fanno il giro lungo. Il verso
  dei nottolini (negativo) l'ho ricavato dalla geometria (la punta deve scendere verso il retro, dove
  il cricchetto avanza) e non l'ho confrontato con una foto. Da una prova in Chromium: da ADU i
  picchi sono 0,23 rad sul destro al primo tasto e 0,23 su sinistro e destro al terzo (doppio
  passo), e il rotore sinistro passa da 0 a 0,242 rad (un passo). Il movimento ha un timer di
  riserva: se il browser sospende i fotogrammi, finisce lo stesso.
- **Camera.** `CameraSullo`: l'inquadratura (`inquadratura(valore)`, interpolata su cinque punti) alza
  il punto guardato da 5,5 a 14 cm e allontana la camera fino a 1,5 volte; la direzione e lo zoom
  scelti con il mouse restano. `maxDistance` sale da 2 a 3. Con `prefers-reduced-motion` salta alla
  nuova inquadratura senza transizione; nello stesso caso i nottolini e i rotori non si animano.
  Lo sportello spostato in avanti non copre la tastiera: dall'inquadratura predefinita la tastiera resta
  visibile (guardate le immagini delle fasi 2, 3 e 4 a 1280 × 900).
- **Tacca.** Deciso di accettare la discrepanza, come già annotato nella 4j: gli anelli hanno la
  stessa mesh, quindi la tacca visibile sta sotto il 01 anche quando il motore dice Q, E o V.
  Spostarla avrebbe voluto dire cambiare la geometria o far girare anche i numeri; un segnalino
  disegnato dal codice, accanto alla tacca vera, avrebbe confuso. Il nottolino in presa dice quando
  entra davvero (è il motore a deciderlo), e la 5c può spiegare a parole dove sta la tacca di ogni
  rotore.
- **Prove.** `tests/e2e/macchina.spec.ts`, sei test in più: selettore a 4 e `aria-valuetext` (e a
  2,5), frecce, messaggio a selettore 2 con il paragrafo e l'annuncio, poi rimontaggio e lampada;
  doppio passo da ADU con le finestrelle ADV, AEW, BFX, BFY e le lampade del motore;
  `prefers-reduced-motion`; axe con cablaggio e cavi. Unit test in `macchina.test.ts` per selettore,
  rampa, camera, contatti e segmenti del cablaggio.
- **Comandi eseguiti.** `pnpm verify` (unit test compresi), `pnpm test:e2e` (198 passati, 24 saltati
  come prima), `pnpm test:lighthouse` (`/macchina/` 100/100 a desktop e a 375 px; la scena non cambia
  lo stato iniziale). Il chunk `Scena` passa da 322 a 346 KB (drei `Line`).
- **Non verificato.** Il movimento dei nottolini l'ho guardato solo come numeri (rotazioni campionate
  in Chromium headless): il riquadro del browser dell'app sospende i fotogrammi, quindi nessuna
  immagine a metà tasto. Le immagini delle cinque fasi, invece, le ho guardate.
