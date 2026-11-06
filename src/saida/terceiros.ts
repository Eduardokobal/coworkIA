import { randomBytes } from 'node:crypto';
import { htmlParaTexto } from '../texto/html.js';

/** S2, passo 5: limites por campo, em pontos de código. */
export const LIMITES = {
  corpo: 20_000,
  descricao: 5_000,
  assunto: 500,
  titulo: 500,
  local: 500,
  nome: 200,
  endereco: 200,
  trecho: 200,
} as const;

export type Campo = keyof typeof LIMITES;

export type Origem = 'email' | 'agenda';

export interface TextoPreparado {
  texto: string;
  cortado: boolean;
}

/** S2, passo 3: controles, formato e ignoráveis por padrão (o \n e o \t voltam no replace). */
const INVISIVEIS = /[\p{Cc}\p{Cf}\p{Default_Ignorable_Code_Point}]/gu;

const ESC = String.fromCodePoint(0x1b);
const BEL = String.fromCodePoint(0x07);
/** As formas de 8 bits do CSI, do ST e do OSC. */
const CSI8 = String.fromCodePoint(0x9b);
const ST8 = String.fromCodePoint(0x9c);
const OSC8 = String.fromCodePoint(0x9d);

/**
 * S2, passo 3, e AD17: as sequências ANSI que saem inteiras, antes dos controles.
 * A CSI segue o ECMA-48: parâmetros (0x30 a 0x3F), intermediários (0x20 a 0x2F) e o final
 * (0x40 a 0x7E). A OSC não tem controle no meio e termina no BEL, no ESC \ ou no ST.
 */
const ANSI = new RegExp(
  `(?:${ESC}\\[|${CSI8})[0-?]*[ -/]*[@-~]|(?:${ESC}\\]|${OSC8})[^\\p{Cc}]*(?:${BEL}|${ESC}\\\\|${ST8})`,
  'gu',
);

/** S2, passos 1 a 5. A ordem importa e está escrita na spec. */
export function prepararTexto(
  valor: string,
  campo: Campo,
  opcoes: { html?: boolean } = {},
): TextoPreparado {
  const convertido = opcoes.html === true ? htmlParaTexto(valor, { cortarCitacao: false }) : valor;
  const limpo = convertido
    .normalize('NFKC')
    .replace(ANSI, '')
    .replace(INVISIVEIS, (caractere) => (caractere === '\n' || caractere === '\t' ? caractere : ''))
    .replace(/<{3,}/g, (sequencia) => '\u2039'.repeat(sequencia.length))
    .replace(/>{3,}/g, (sequencia) => '\u203A'.repeat(sequencia.length));
  const pontos = Array.from(limpo);
  const limite = LIMITES[campo];
  if (pontos.length <= limite) {
    return { texto: limpo, cortado: false };
  }
  return { texto: pontos.slice(0, limite).join(''), cortado: true };
}

/** S2, passo 6: 128 bits aleatórios, novos a cada chamada de ferramenta. */
export function novaChave(): string {
  return randomBytes(16).toString('hex');
}

/** S2, passo 6: só nas ferramentas; o terminal usa só os passos 1 a 5. */
export function marcar(texto: string, origem: Origem, id: string, chave: string): string {
  const idSeguro = id.replace(/[^A-Za-z0-9_-]/g, '_');
  return `<<<TERCEIROS origem="${origem}" id="${idSeguro}" chave="${chave}">>>${texto}<<<FIM_TERCEIROS chave="${chave}">>>`;
}
