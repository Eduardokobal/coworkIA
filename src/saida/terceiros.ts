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

/** S2, passos 1 a 5. A ordem importa e está escrita na spec. */
export function prepararTexto(
  valor: string,
  campo: Campo,
  opcoes: { html?: boolean } = {},
): TextoPreparado {
  const convertido = opcoes.html === true ? htmlParaTexto(valor, { cortarCitacao: false }) : valor;
  const limpo = convertido
    .normalize('NFKC')
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
