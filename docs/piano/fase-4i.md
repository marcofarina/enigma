# Fase 4i — Modello 3D: convenzione, abbozzo e catena di esportazione

**Modello: Opus · Effort: high · Durata: 2 h · Dipende da: D14, D15; non si fa nel cloud, Marco deve avere Blender aperto sul Mac**

**Obiettivo.** Provare da un capo all’altro il contratto fra Blender e il sito con un modello
abbozzato: scatole e cilindri con le dimensioni vere e i nodi, le origini e gli assi della
«Convenzione del modello 3D» (`docs/piano/convenzione-3d.md`). Il `.glb` si rigenera da una scena vuota con un comando e uno script
ne verifica la struttura. La 5a lavora su questo abbozzo; la 4j e la 4k ne sostituiscono la
geometria senza cambiare la convenzione.

**Prompt di apertura**

```
Prima di tutto: questa fase richiede Opus con effort high. Se non stai girando su Opus, fermati e
dimmelo senza fare altro.

Esegui docs/piano/fase-4i.md. Leggi prima l’indice docs/piano.md (le decisioni D14 e D15) e
docs/piano/convenzione-3d.md. Controlla che gli strumenti dell’MCP di Blender siano disponibili in
questa sessione;
se non lo sono, fermati e dimmi che cosa manca (Blender, l’addon, il server).
```

**Prima della sessione (Marco, una volta sola).**

1. Installa Blender con `brew install --cask blender` (verificato il 2026-11-05: `uv` è già
   installato, Blender no).
2. Installa in Blender l’addon di [ahujasid/blender-mcp](https://github.com/ahujasid/blender-mcp) e
   avviane il server dal pannello laterale. L’addon ascolta su una porta locale senza
   autenticazione ed esegue Python arbitrario: fermalo quando non serve e salva il `.blend` prima di
   ogni sessione.
3. Registra il server per l’utente, così serve anche a Python Doesn’t Byte, con la versione
   fissata: `claude mcp add --scope user blender -- uvx blender-mcp==<versione>` (la versione
   corrente è su PyPI, il comando esatto nel README). Nel README controlla se il server raccoglie
   telemetria e come si disattiva.
4. Facoltativo, dieci minuti al massimo: cerca su sketchfab.com un’Enigma con licenza CC0 o CC BY,
   pezzi separati e nominati e meno di circa 50 000 poligoni. Se la trovi, scaricala e tieni pronti
   il percorso del file e l’URL della pagina.

**Passi**

1. **Modello di terzi.** Se Marco ha scaricato un modello, importalo, confrontalo con la
   convenzione e digli quanto lavoro serve per adattarlo: decidete insieme se usarlo. Annota
   titolo, autore, URL e licenza verificata sulla pagina.
2. **Prima il file, poi l’esecuzione.** Ogni pezzo è una funzione in `scripts/blender/<pezzo>.py`:
   scrivi il file, poi fallo eseguire all’MCP e guarda la schermata. `scripts/blender/costruisci.py`
   parte da una scena vuota, chiama i pezzi in ordine, esporta il `.glb` e renderizza l’anteprima.
   Le modifiche fatte a mano nella GUI di Blender si perdono, perché il `.blend` non va in git:
   riportale negli script.
3. **Comando di ricostruzione.** In `package.json`, lo script `modello`:
   `${BLENDER:-/Applications/Blender.app/Contents/MacOS/Blender} -b --factory-startup --python-exit-code 1 -P scripts/blender/costruisci.py`
   (senza `--python-exit-code 1` Blender esce con 0 anche se lo script si ferma con un errore).
4. **Abbozzo.** Dimensioni della cassa dalla fonte `crypto-museum-enigma-i` (annotale
   nell’«Esito»); geometria semplice; tutti i nodi marcati «4i» nella convenzione, con le origini e
   gli assi giusti e `raggio_contatti` dove serve; materiali piani; tasti e lampade come copie
   collegate della stessa mesh. Controlla nella schermata che ogni rotore giri sul proprio asse X.
5. **Esportazione** in `public/modelli/enigma-i.glb`, glTF binario con Y in alto e
   `export_extras=True`. L’anteprima va in `public/modelli/enigma-i-anteprima.webp` (o `.png`, se
   la versione di Blender non scrive WebP), 1280 × 720: è l’immagine statica della 5a.
6. **Verifica.** `scripts/verifica-modello.ts`, senza dipendenze nuove, legge il blocco JSON del
   `.glb` e controlla:
   - il peso, sotto 300 KB per l’abbozzo;
   - che ci siano tutti i nodi di `NODI_ATTESI`, l’elenco in testa al file copiato dalla
     convenzione;
   - che le dimensioni della mesh di `cassa` (minimo e massimo dell’accessor `POSITION`) stiano
     entro il 10 % di quelle della fonte, così un errore di unità si vede subito;
   - che `raggio_contatti` sia un numero positivo dove la convenzione lo chiede.

   Aggiungi a `package.json` lo script `verifica:modello` (`node scripts/verifica-modello.ts`) e
   mettilo in `verify` prima della build.
7. **Licenza.** Se la riga D14 dell’indice (docs/piano.md) non riporta la licenza della geometria, chiedila
   a Marco e scrivila in quella riga. Se c’è una base di terzi, riporta titolo, autore, URL e
   licenza. La voce nei crediti la crea la 5a.
8. **Commit.** Il `.glb` e l’anteprima si committano a fine fase, non a ogni prova: sono binari e
   ogni versione resta nella storia di git.

**Criteri di accettazione**

```bash
pnpm modello && pnpm verifica:modello
```
exit 0: il `.glb` si rigenera da una scena vuota e passa la verifica.

```bash
pnpm verify
```

**Esito (2026-11-05)**

- **Strumenti.** Blender 5.2.3 LTS (esportatore glTF 5.2.41), addon «MCP for Blender» 1.8
  (protocollo 15), telemetria spenta (`get_addon_status` → `telemetry_consent: false`). Il server
  non è registrato con `claude mcp add`: sta in `claude_desktop_config.json` dell’app desktop come
  `uvx mcp-for-blender`, senza versione fissata. Il pacchetto su PyPI oggi si chiama
  `mcp-for-blender`, non `blender-mcp`. Per fissarlo, scrivi `mcp-for-blender==<versione>` in quel
  file.
- **Modello di terzi.** No: Marco non ne ha trovato uno (2026-11-05). La geometria è nostra,
  CC BY-NC-SA 4.0 come i contenuti, ed è scritta nella riga D14 dell’indice.
- **Dimensioni.** La pagina `crypto-museum-enigma-i` non dà misure (verificato il 2026-11-05).
  Ho usato la scheda del Deutsches Technikmuseum, inv. 1/2000/0146 0, nuova voce
  `technikmuseum-enigma` di `fonti.yaml`: 280 mm di larghezza, 340 di profondità, 160 di altezza a
  coperchio chiuso. La cassa senza coperchio è alta 115 mm, una stima. Concordano la scheda del
  Computer History Museum (11,0 × 13,4 × 5,9 pollici nei risultati di ricerca; la pagina oggi non li mostra) e una lezione
  dell’Università di Tubinga (340 × 280 × 150 mm). `verifica-modello.ts` controlla larghezza e
  profondità entro il 10 %, e l’altezza fra metà e tutta l’altezza chiusa.
- **Numeri.** `pnpm verifica:modello`: 46 KB, 69 nodi, 684 triangoli nelle mesh, 4 608 disegnati
  (tasti, lampade e anelli sono copie collegate). L’anteprima WebP pesa 19 KB. `pnpm modello`
  impiega circa 8 secondi.
- **Correzioni alla convenzione.** Aggiunte le misure, la gerarchia e le origini, e la regola che i
  nodi mossi dal codice hanno rotazione e scala nulle a riposo. `fase` e `raggio_contatti` stanno
  solo sui nodi che li richiedono. `FASE_MODELLO` dice quali nodi cercare, e la 4j lo porta a
  `'4j'`. La verifica controlla anche le copie collegate e la regola «chi muove che cosa» sulle
  animazioni. L’ho provata su un `.glb` guastato apposta: sette guasti, che hanno dato tutti e undici gli errori attesi.
- **Che cosa ha richiesto più tempo con l’MCP.** Il collegamento: l’addon era installato, ma il
  server non era avviato dal pannello. La conferma che i rotori girano su X: nelle schermate le
  pareti della cassa li nascondevano, quindi ho misurato la posizione della tacca nel mondo dopo
  la rotazione. Quella misura ha trovato anche un difetto, una tacca che spostava un solo vertice
  su due, che nelle schermate non si vedeva.
- **Per PQuest.**
  - Scrivi il pezzo in un file ed eseguilo con `exec(open(P).read(), {"__file__": P, "__name__": …})`.
    Con un `__name__` diverso da `"__main__"` lo script definisce le funzioni senza esportare.
  - Nella sessione aperta i moduli restano importati: ricaricali con `importlib.reload`, prima
    quelli comuni e poi quelli che li usano.
  - Per ripartire da zero, `svuota()` toglie i dati del file; `read_factory_settings` toccherebbe
    anche le preferenze e l’addon dell’MCP, quindi non lo uso.
  - Esporta prima di creare la camera e la luce dell’anteprima: nel `.glb` entra solo il modello.
  - Lancia Blender in background sempre con `--python-exit-code 1`.
  - Per controllare una rotazione, misura le coordinate: è più affidabile della schermata.
