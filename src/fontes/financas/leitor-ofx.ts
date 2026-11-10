import { DateTime } from 'luxon';
import type { Lancamento, Saldo, TipoDeConta } from '../../dominio.js';

const SUBSTITUTO = String.fromCodePoint(0xfffd);
export const SEM_DESCRICAO = '(sem descrição)';

const ENTIDADES_NOMEADAS: Readonly<Record<string, string>> = {
  lt: '<',
  gt: '>',
  amp: '&',
  quot: '"',
  apos: "'",
};
/** O1: as entidades da lista e as numéricas. */
const ENTIDADE = /&(?:#(\d+)|#[xX]([0-9A-Fa-f]+)|(lt|gt|amp|quot|apos));/g;
/** O2: os extratos da conta e do cartão. */
const EXTRATOS = ['STMTRS', 'CCSTMTRS'] as const;
/** O5: um sinal, de 1 a 11 dígitos e, se houver centavos, ponto ou vírgula e 1 ou 2 dígitos. */
const VALOR = /^([+-]?)(\d{1,11})(?:[.,](\d{1,2}))?$/;
/** O6: os 8 primeiros dígitos são a data; o resto é ignorado. */
const DATA = /^(\d{4})(\d{2})(\d{2})/;

/** Seção 5: um extrato lido de um arquivo, antes de juntar as contas (O10 e O11). */
export interface ExtratoLido {
  tipo: TipoDeConta;
  /** O2: o BANKID; vazio no cartão. Nunca sai (RF5). */
  banco: string;
  /** O2: o ACCTID. Nunca sai inteiro (RF5). */
  numero: string;
  /** O2: o ACCTTYPE; vazio no cartão. */
  tipoDaConta: string;
  /** O3: o CURDEF, em maiúscula. */
  moeda: string;
  lancamentos: Lancamento[];
  /** O4: os STMTTRN sem um TRNAMT ou um DTPOSTED válido. */
  descartados: number;
  /** O9 */
  saldo: Saldo | null;
  /** O12: o DTEND, ou a data do lançamento mais novo; nulo sem nenhum dos dois. */
  fim: string | null;
}

/**
 * E3: UTF-8 quando os bytes são UTF-8 válido; senão, Windows-1252. O BOM sai pelo próprio
 * TextDecoder do UTF-8, que o tira por padrão.
 */
export function decodificar(bytes: Uint8Array): string {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    return new TextDecoder('windows-1252').decode(bytes);
  }
}

/**
 * O1: as entidades viram o caractere numa passada só. A numérica de zero, acima de U+10FFFF ou
 * de U+D800 a U+DFFF vira U+FFFD, e um nome fora da lista fica como está escrito.
 */
export function decodificarEntidades(texto: string): string {
  return texto.replace(
    ENTIDADE,
    (inteira, decimal: string | undefined, hexa: string | undefined, nome: string | undefined) => {
      if (nome !== undefined) {
        return ENTIDADES_NOMEADAS[nome] ?? inteira;
      }
      const codigo = decimal !== undefined ? Number(decimal) : Number.parseInt(hexa ?? '', 16);
      if (!(codigo > 0 && codigo <= 0x10ffff) || (codigo >= 0xd800 && codigo <= 0xdfff)) {
        return SUBSTITUTO;
      }
      return String.fromCodePoint(codigo);
    },
  );
}

/**
 * O1 e #124: cada bloco <NOME>…</NOME> de um dos nomes, na ordem do texto, com a marca como veio e
 * o miolo até o fechamento mais próximo, pelo nome inteiro e sem diferença de maiúscula. A busca só
 * anda para a frente: um nome que ficou sem fechamento depois de uma abertura também fica sem ele
 * depois das próximas, e não é procurado de novo. Assim o tempo cresce com o tamanho do texto, e
 * não com o quadrado dele.
 */
function blocosDe(texto: string, nomes: readonly string[]): Array<[string, string]> {
  const abertura = new RegExp(`<(${nomes.join('|')})>`, 'gi');
  const fechamentos = new Map<string, RegExp>();
  const semFechamento = new Set<string>();
  const achados: Array<[string, string]> = [];
  for (let aberta = abertura.exec(texto); aberta !== null; aberta = abertura.exec(texto)) {
    const marca = aberta[1] ?? '';
    const nome = marca.toUpperCase();
    if (semFechamento.has(nome)) {
      continue;
    }
    const fechamento = fechamentos.get(nome) ?? new RegExp(`</${nome}>`, 'gi');
    fechamentos.set(nome, fechamento);
    const inicio = aberta.index + aberta[0].length;
    fechamento.lastIndex = inicio;
    const fechada = fechamento.exec(texto);
    if (fechada === null) {
      semFechamento.add(nome);
      continue;
    }
    achados.push([marca, texto.slice(inicio, fechada.index)]);
    abertura.lastIndex = fechada.index + fechada[0].length;
  }
  return achados;
}

/** O1: o miolo de cada bloco <NOME>…</NOME>. */
function blocos(texto: string, nome: string): string[] {
  return blocosDe(texto, [nome]).map(([, miolo]) => miolo);
}

/** O1: o valor do primeiro elemento <NOME>, até o próximo < ou o fim da linha. */
function elemento(texto: string, nome: string): string | null {
  const achado = new RegExp(`<${nome}>([^<\\r\\n]*)`, 'i').exec(texto);
  return achado === null ? null : decodificarEntidades(achado[1] ?? '').trim();
}

/** O5: o valor em centavos, ou nulo quando a forma não é aceita. "-0" vira 0. */
export function lerValor(texto: string | null): number | null {
  const achado = texto === null ? null : VALOR.exec(texto.trim());
  if (achado === null) {
    return null;
  }
  const [, sinal, inteiro = '', fracao = ''] = achado;
  const centavos = Number(inteiro) * 100 + Number(fracao.padEnd(2, '0'));
  return sinal === '-' && centavos !== 0 ? -centavos : centavos;
}

/** O6: a data como AAAA-MM-DD, dos 8 primeiros dígitos, sem converter o fuso. */
export function lerData(texto: string | null): string | null {
  const achado = texto === null ? null : DATA.exec(texto.trim());
  if (achado === null) {
    return null;
  }
  const [, ano = '', mes = '', dia = ''] = achado;
  const data = DateTime.fromObject(
    { year: Number(ano), month: Number(mes), day: Number(dia) },
    { zone: 'UTC' },
  );
  return data.isValid ? `${ano}-${mes}-${dia}` : null;
}

/** O7 */
function descricaoDe(transacao: string): string {
  const nome = elemento(transacao, 'NAME') ?? '';
  const memo = elemento(transacao, 'MEMO') ?? '';
  if (nome !== '' && memo !== '' && nome !== memo) {
    return `${nome} / ${memo}`;
  }
  return nome || memo || SEM_DESCRICAO;
}

/**
 * O4: o lançamento, ou nulo quando falta um TRNAMT ou um DTPOSTED válido. O FITID não é lido,
 * porque há banco que o muda a cada exportação e banco que o repete (O11).
 */
function lancamentoDe(transacao: string): Lancamento | null {
  const centavos = lerValor(elemento(transacao, 'TRNAMT'));
  const data = lerData(elemento(transacao, 'DTPOSTED'));
  if (centavos === null || data === null) {
    return null;
  }
  return { data, centavos, descricao: descricaoDe(transacao) };
}

/** O9 */
function saldoDe(corpo: string): Saldo | null {
  const bloco = blocos(corpo, 'LEDGERBAL')[0];
  if (bloco === undefined) {
    return null;
  }
  const centavos = lerValor(elemento(bloco, 'BALAMT'));
  const data = lerData(elemento(bloco, 'DTASOF'));
  return centavos === null || data === null ? null : { centavos, data };
}

function extratoDe(marca: string, corpo: string): ExtratoLido {
  const tipo: TipoDeConta = marca.toUpperCase() === 'STMTRS' ? 'conta' : 'cartao';
  const de = blocos(corpo, tipo === 'conta' ? 'BANKACCTFROM' : 'CCACCTFROM')[0] ?? '';
  const lista = blocos(corpo, 'BANKTRANLIST')[0] ?? '';
  const lancamentos: Lancamento[] = [];
  let descartados = 0;
  for (const transacao of blocos(lista, 'STMTTRN')) {
    const lancamento = lancamentoDe(transacao);
    if (lancamento === null) {
      descartados += 1;
    } else {
      lancamentos.push(lancamento);
    }
  }
  const maisNova = lancamentos.reduce<string | null>(
    (data, item) => (data === null || item.data > data ? item.data : data),
    null,
  );
  return {
    tipo,
    banco: tipo === 'conta' ? (elemento(de, 'BANKID') ?? '') : '',
    numero: elemento(de, 'ACCTID') ?? '',
    tipoDaConta: tipo === 'conta' ? (elemento(de, 'ACCTTYPE') ?? '').toUpperCase() : '',
    moeda: (elemento(corpo, 'CURDEF') ?? '').toUpperCase(),
    lancamentos,
    descartados,
    saldo: saldoDe(corpo),
    fim: lerData(elemento(lista, 'DTEND')) ?? maisNova,
  };
}

/** Seção 5: o texto de um arquivo OFX, 1.x ou 2.x, vira a lista dos extratos, na ordem do arquivo. */
export function lerOfx(texto: string): ExtratoLido[] {
  return blocosDe(texto, EXTRATOS).map(([marca, corpo]) => extratoDe(marca, corpo));
}
