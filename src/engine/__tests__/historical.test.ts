import { describe, expect, it } from 'vitest';
import { encipherWith, type MachineConfig } from '../index.ts';

/**
 * Messaggi reali decifrati, dalla raccolta di Frank Spieß / Franklin Heath
 * (http://wiki.franklinheath.co.uk/index.php/Enigma/Sample_Messages), già usati nei test
 * del simulatore di Summerside Makerspace.
 */
const messages: { name: string; config: MachineConfig; ciphertext: string; plaintext: string }[] = [
  {
    name: 'Operazione Barbarossa, 7 luglio 1941, parte 1',
    config: {
      model: 'M3',
      rotors: ['II', 'IV', 'V'],
      rings: 'BUL',
      positions: 'BLA',
      reflector: 'B',
      plugboard: ['AV', 'BS', 'CG', 'DL', 'FU', 'HZ', 'IN', 'KM', 'OW', 'RX'],
    },
    ciphertext:
      'EDPUDNRGYSZRCXNUYTPOMRMBOFKTBZREZKMLXLVEFGUEYSIOZVEQMIKUBPMMYLKLTTDEISMDICAGYKUACTCDOMOHWXMUUIAUBSTSLRNBZSZWNRFXWFYSSXJZVIJHIDISHPRKLKAYUPADTXQSPINQMATLPIFSVKDASCTACDPBOPVHJK',
    plaintext:
      'AUFKLXABTEILUNGXVONXKURTINOWAXKURTINOWAXNORDWESTLXSEBEZXSEBEZXUAFFLIEGERSTRASZERIQTUNGXDUBROWKIXDUBROWKIXOPOTSCHKAXOPOTSCHKAXUMXEINSAQTDREINULLXUHRANGETRETENXANGRIFFXINFXRGTX',
  },
  {
    name: 'Operazione Barbarossa, 7 luglio 1941, parte 2',
    config: {
      model: 'M3',
      rotors: ['II', 'IV', 'V'],
      rings: 'BUL',
      positions: 'LSD',
      reflector: 'B',
      plugboard: ['AV', 'BS', 'CG', 'DL', 'FU', 'HZ', 'IN', 'KM', 'OW', 'RX'],
    },
    ciphertext:
      'SFBWDNJUSEGQOBHKRTAREEZMWKPPRBXOHDROEQGBBGTQVPGVKBVVGBIMHUSZYDAJQIROAXSSSNREHYGGRPISEZBOVMQIEMMZCYSGQDGRERVBILEKXYQIRGIRQNRDNVRXCYYTNJR',
    plaintext:
      'DREIGEHTLANGSAMABERSIQERVORWAERTSXEINSSIEBENNULLSEQSXUHRXROEMXEINSXINFRGTXDREIXAUFFLIEGERSTRASZEMITANFANGXEINSSEQSXKMXKMXOSTWXKAMENECXK',
  },
  {
    name: 'U-264 (Kapitänleutnant Hartwig Looks), 25 novembre 1942',
    config: {
      model: 'M4',
      rotors: ['Beta', 'II', 'IV', 'I'],
      rings: 'AAAV',
      positions: 'VJNA',
      reflector: 'B-thin',
      plugboard: ['AT', 'BL', 'DF', 'GJ', 'HM', 'NW', 'OP', 'QY', 'RZ', 'VX'],
    },
    ciphertext:
      'NCZWVUSXPNYMINHZXMQXSFWXWLKJAHSHNMCOCCAKUQPMKCSMHKSEINJUSBLKIOSXCKUBHMLLXCSJUSRRDVKOHULXWCCBGVLIYXEOAHXRHKKFVDREWEZLXOBAFGYUJQUKGRTVUKAMEURBVEKSUHHVOYHABCJWMAKLFKLMYFVNRIZRVVRTKOFDANJMOLBGFFLEOPRGTFLVRHOWOPBEKVWMUQFMPWPARMFHAGKXIIBG',
    plaintext:
      'VONVONJLOOKSJHFFTTTEINSEINSDREIZWOYYQNNSNEUNINHALTXXBEIANGRIFFUNTERWASSERGEDRUECKTYWABOSXLETZTERGEGNERSTANDNULACHTDREINULUHRMARQUANTONJOTANEUNACHTSEYHSDREIYZWOZWONULGRADYACHTSMYSTOSSENACHXEKNSVIERMBFAELLTYNNNNNNOOOVIERYSICHTEINSNULL',
  },
  {
    name: 'Scharnhorst (Konteradmiral Erich Bey), 26 dicembre 1943',
    config: {
      model: 'M3',
      rotors: ['III', 'VI', 'VIII'],
      rings: 'AHM',
      positions: 'UZV',
      reflector: 'B',
      plugboard: ['AN', 'EZ', 'HK', 'IJ', 'LR', 'MQ', 'OT', 'PV', 'SW', 'UX'],
    },
    ciphertext: 'YKAENZAPMSCHZBFOCUVMRMDPYCOFHADZIZMEFXTHFLOLPZLFGGBOTGOXGRETDWTJIQHLMXVJWKZUASTR',
    plaintext: 'STEUEREJTANAFJORDJANSTANDORTQUAAACCCVIERNEUNNEUNZWOFAHRTZWONULSMXXSCHARNHORSTHCO',
  },
];

describe('messaggi storici', () => {
  for (const message of messages) {
    it(message.name, () => {
      expect(encipherWith(message.config, message.ciphertext)).toBe(message.plaintext);
      expect(encipherWith(message.config, message.plaintext)).toBe(message.ciphertext);
    });
  }
});
