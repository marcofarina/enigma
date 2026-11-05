/**
 * Comprime con meshopt il `.glb` grezzo che esporta Blender (fase 4l, decisione D23) e lo scrive in
 * public/modelli/. È l’ultimo passo di `pnpm modello`.
 *
 * Il metodo è FILTER e non QUANTIZE: la quantizzazione di gltf-transform compensa la scala delle
 * posizioni cambiando traslazione e scala dei nodi, e allora i nodi che la pagina ruota (gli anelli)
 * non girerebbero più attorno alla loro origine; i nodi che il codice muove devono avere, a riposo,
 * rotazione e scala nulle (convenzione-3d). FILTER comprime i dati così come sono.
 *
 * Il decoder meshopt sta nel bundle di drei: nella pagina `useGLTF(file, false, true)`, nessuna
 * richiesta esce dal sito.
 */
import { statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS, EXTMeshoptCompression } from '@gltf-transform/extensions';
import { reorder } from '@gltf-transform/functions';
import { MeshoptDecoder, MeshoptEncoder } from 'meshoptimizer';

const radice = join(import.meta.dirname, '..');
const grezzo = process.argv[2] ?? join(radice, 'scripts', 'blender', 'sorgenti', 'enigma-i-grezzo.glb');
const uscita = process.argv[3] ?? join(radice, 'public', 'modelli', 'enigma-i.glb');

await Promise.all([MeshoptDecoder.ready, MeshoptEncoder.ready]);
const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({ 'meshopt.decoder': MeshoptDecoder, 'meshopt.encoder': MeshoptEncoder });

const documento = await io.read(grezzo);
await documento.transform(reorder({ encoder: MeshoptEncoder }));
documento
  .createExtension(EXTMeshoptCompression)
  .setRequired(true)
  .setEncoderOptions({ method: EXTMeshoptCompression.EncoderMethod.FILTER });
await io.write(uscita, documento);

const kb = (file: string) => `${(statSync(file).size / 1024).toFixed(0)} KB`;
console.log(`${relative(radice, grezzo)} (${kb(grezzo)}) → ${relative(radice, uscita)} (${kb(uscita)})`);
