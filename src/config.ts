import { IANAZone } from 'luxon';
import { FUSO_PADRAO } from './tempo.js';

export type Modo = 'demo' | 'google';

export interface Config {
  modo: Modo;
  fuso: string;
  importantes: string[];
  /** AD1: só para testes e demonstração; fixa o relógio. */
  agora: string | null;
}

export function lerConfig(ambiente: Record<string, string | undefined>): Config {
  const modo = (ambiente.COWORKIA_MODO ?? '').trim() || 'demo';
  if (modo !== 'demo' && modo !== 'google') {
    throw new Error(`COWORKIA_MODO inválido: "${modo}". Use demo ou google.`);
  }
  const fuso = (ambiente.COWORKIA_FUSO ?? '').trim() || FUSO_PADRAO;
  if (!IANAZone.isValidZone(fuso)) {
    throw new Error(`COWORKIA_FUSO inválido: "${fuso}". Use um fuso como America/Sao_Paulo.`);
  }
  const importantes = (ambiente.COWORKIA_IMPORTANTES ?? '')
    .split(',')
    .map((endereco) => endereco.trim())
    .filter((endereco) => endereco !== '');
  const agora = (ambiente.COWORKIA_AGORA ?? '').trim();
  return { modo, fuso, importantes, agora: agora === '' ? null : agora };
}
