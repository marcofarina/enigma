# Fase 5f — Pagina 3D: resa

**Modello: Opus · Effort: high · Durata: 2,5 h · Dipende da: 4l (il modello con le texture); non in parallelo con la 5g, che tocca lo stesso `Scena.tsx`**

**Obiettivo.** Il browser mostra il modello come lo mostra Sketchfab: colori con tone mapping,
metalli che riflettono una luce credibile, la macchina appoggiata su un’ombra, le lampade che si
accendono davvero. Il pulsante «Avvia la vista 3D» dice quanto pesa il download.

**Prompt di apertura**

```
Prima di tutto: questa fase richiede Opus con effort high. Se non stai girando su Opus, fermati e
dimmelo senza fare altro.

Esegui docs/piano/fase-5f.md. Leggi prima l’indice docs/piano.md, docs/piano/convenzione-3d.md e
gli «Esito» delle fasi 4l–4n già fatte.
```

**Fatti verificati il 2026-11-05**

- Il `<Canvas>` di `src/components/macchina/Scena.tsx` ha la prop `flat`, cioè `NoToneMapping`:
  è la causa principale dei colori piatti.
- La luce è una `ambientLight`, una `directionalLight` e tre `Lightformer` dentro `<Environment>`;
  nessuna ombra. Niente `preset` di `<Environment>` perché lo scaricherebbe da un CDN.

**Passi**

1. **Prima.** Salva in `docs/screenshot/3d/prima/` la pagina a 1280 × 720 nelle fasi 0, 2 e 4 dello
   smontaggio, in tema chiaro e scuro.
2. **Tone mapping.** Togli `flat` e scegli fra `AgXToneMapping` e `ACESFilmicToneMapping` guardando
   le texture di ASHISH. Controlla che l’arancio del segnale e il colore delle lampade accese, presi
   dai token, restino riconoscibili.
3. **Luce d’ambiente.** Prova i `Lightformer` ritoccati e una HDRI da studio di Poly Haven (CC0) a
   1K, servita da `public/` e caricata con `<Environment files>`. La HDRI entra solo se il confronto
   delle immagini la giustifica e pesa meno di 1,5 MB; la voce va in `src/content/immagini.yaml`.
4. **Ombre.** `ContactShadows` di drei sotto la cassa, calcolata una volta sola (`frames={1}`): la
   scena gira in `frameloop="demand"`. Niente ombre in tempo reale delle luci.
5. **Lampade.** Emissivo dal token `--signal-forward` sul vetro della lampada accesa (la forma la
   decide la 4l). Il bloom entra solo se a 375 px la pagina resta fluida su un telefono di fascia
   media emulato (Chrome, CPU 4× più lenta): scrivi la misura nell’«Esito».
6. **Peso sul pulsante.** Il pulsante dice il peso, per esempio «Avvia la vista 3D (5,2 MB)», letto
   a build time dalla dimensione di `public/modelli/enigma-i.glb`, non scritto a mano.
7. **Dopo.** Salva le stesse immagini del passo 1 in `docs/screenshot/3d/dopo/` e mostrale a Marco.

**Criteri di accettazione**

```bash
grep -c '\bflat\b' src/components/macchina/Scena.tsx
```
`0`.

```bash
ls docs/screenshot/3d/prima/*.png docs/screenshot/3d/dopo/*.png | wc -l
```
almeno `12`.

```bash
pnpm verify && pnpm build && pnpm test:e2e && pnpm test:lighthouse
```
verdi; il test «nessuna richiesta esce dal sito» resta com’è e copre anche la HDRI.

**Esito.** Da compilare: tone mapping scelto, HDRI sì o no con il peso, misura con la CPU
rallentata, giudizio di Marco sulle immagini.
