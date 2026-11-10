import { IANAZone } from 'luxon';
import { FUSO_PADRAO } from './tempo.js';

/** MA1: o modo arquivos lê só as pastas do WhatsApp e dos extratos, sem o Google. */
export type Modo = 'demo' | 'google' | 'arquivos';

export interface Config {
  modo: Modo;
  fuso: string;
  importantes: string[];
  /** AD1: só para testes e demonstração; fixa o relógio. */
  agora: string | null;
  /** Versão 2, F1, e MA2: a pasta das conversas exportadas, lida nos modos google e arquivos. */
  whatsappPasta: string | null;
  /** Versão 2, V1: os nomes com que o usuário aparece na exportação. */
  whatsappEu: string[];
  /** Versão 2, W3: os contatos importantes, como aparecem na exportação. */
  whatsappImportantes: string[];
  /** Versão 2, parte 2, E1, e MA2: a pasta dos extratos OFX, lida nos modos google e arquivos. */
  financasPasta: string | null;
  /** Versão 2, parte 2, G3: a COWORKIA_FINANCAS_CATEGORIAS, como veio. */
  financasCategorias: string;
}

/** Uma lista separada por vírgula, sem os espaços das pontas e sem os itens vazios. */
function lista(valor: string | undefined): string[] {
  return (valor ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item !== '');
}

export function lerConfig(ambiente: Record<string, string | undefined>): Config {
  const modo = (ambiente.COWORKIA_MODO ?? '').trim() || 'demo';
  if (modo !== 'demo' && modo !== 'google' && modo !== 'arquivos') {
    throw new Error(`COWORKIA_MODO inválido: "${modo}". Use demo, google ou arquivos.`);
  }
  const fuso = (ambiente.COWORKIA_FUSO ?? '').trim() || FUSO_PADRAO;
  if (!IANAZone.isValidZone(fuso)) {
    throw new Error(`COWORKIA_FUSO inválido: "${fuso}". Use um fuso como America/Sao_Paulo.`);
  }
  const agora = (ambiente.COWORKIA_AGORA ?? '').trim();
  const pasta = (ambiente.COWORKIA_WHATSAPP_PASTA ?? '').trim();
  const pastaDasFinancas = (ambiente.COWORKIA_FINANCAS_PASTA ?? '').trim();
  return {
    modo,
    fuso,
    importantes: lista(ambiente.COWORKIA_IMPORTANTES),
    agora: agora === '' ? null : agora,
    whatsappPasta: pasta === '' ? null : pasta,
    whatsappEu: lista(ambiente.COWORKIA_WHATSAPP_EU),
    whatsappImportantes: lista(ambiente.COWORKIA_WHATSAPP_IMPORTANTES),
    financasPasta: pastaDasFinancas === '' ? null : pastaDasFinancas,
    financasCategorias: ambiente.COWORKIA_FINANCAS_CATEGORIAS ?? '',
  };
}
