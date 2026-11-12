import type { DateTime } from 'luxon';
import type { Categoria, Classificacao, Email } from '../dominio.js';
import { diasDeCalendario, lerDataHora } from '../tempo.js';
import { semCitacao } from '../texto/citacao.js';
import { datasNumericas, resolverData } from '../texto/datas-no-texto.js';
import { htmlParaTexto } from '../texto/html.js';
import { contemTermo, normalizar, primeiroTermo } from '../texto/normalizar.js';

export interface ContextoTriagem {
  agora: DateTime;
  fuso: string;
  enderecoUsuario: string;
  importantes: readonly string[];
}

export const TERMOS_URGENCIA = [
  'urgente',
  'urgência',
  'imediato',
  'imediatamente',
  'o quanto antes',
  'asap',
] as const;

export const PEDIDOS = [
  'pode',
  'poderia',
  'consegue',
  'conseguiria',
  'por favor',
  'aguardo',
  'me avise',
  'me avisa',
  'confirme',
  'confirma',
  'preciso que',
] as const;

const EXPRESSOES_DE_PRAZO: ReadonlyArray<{ termo: string; diasDepoisDoEmail: number }> = [
  { termo: 'vence hoje', diasDepoisDoEmail: 0 },
  { termo: 'vence amanhã', diasDepoisDoEmail: 1 },
  { termo: 'vencimento hoje', diasDepoisDoEmail: 0 },
  { termo: 'vencimento amanhã', diasDepoisDoEmail: 1 },
  { termo: 'prazo é hoje', diasDepoisDoEmail: 0 },
  { termo: 'prazo é amanhã', diasDepoisDoEmail: 1 },
  { termo: 'até o fim do dia', diasDepoisDoEmail: 0 },
  { termo: 'até o final do dia', diasDepoisDoEmail: 0 },
];

/** Adendo AD20: os espaços são os do \s do JavaScript, como na expressão de antes. */
const ESPACO = /^\s$/u;
const LETRA_OU_DIGITO = /^[\p{L}\p{N}]$/u;

export interface Prazo {
  data: DateTime;
  descricao: string;
}

/** O primeiro prazo que vence de hoje a hoje + 2 (H5), com os dias até ele. */
export interface PrazoProximo {
  prazo: Prazo;
  dias: number;
}

/** 7.3, passo 1: o corpo sem a citação, em texto puro. */
export function textoAnalisavel(email: Email): string {
  if (email.corpoTexto !== null) {
    return semCitacao(email.corpoTexto);
  }
  if (email.corpoHtml !== null) {
    return semCitacao(htmlParaTexto(email.corpoHtml, { cortarCitacao: true }));
  }
  return '';
}

/** AD20: o caractere inteiro que termina antes de `fim`, com o par de surrogates junto. */
function caractereAntes(texto: string, fim: number): string {
  const ultimo = texto.charCodeAt(fim - 1);
  const penultimo = texto.charCodeAt(fim - 2);
  const parDeSurrogates =
    ultimo >= 0xdc00 && ultimo <= 0xdfff && penultimo >= 0xd800 && penultimo <= 0xdbff;
  return texto.slice(parDeSurrogates ? fim - 2 : fim - 1, fim);
}

/** AD20: a posição antes dos espaços que terminam em `fim`. */
function antesDosEspacos(texto: string, fim: number): number {
  let posicao = fim;
  while (posicao > 0 && ESPACO.test(caractereAntes(texto, posicao))) {
    posicao -= 1;
  }
  return posicao;
}

/** AD20: a palavra termina em `fim`, com pelo menos um espaço antes; devolve onde ele começa. */
function antesDaPalavra(texto: string, fim: number, palavra: string): number | null {
  const inicio = fim - palavra.length;
  if (inicio < 0 || texto.slice(inicio, fim) !== palavra) {
    return null;
  }
  const comEspacos = antesDosEspacos(texto, inicio);
  return comEspacos < inicio ? comEspacos : null;
}

/** AD20: o "ate", o "o" e o "dia" opcionais e os espaços até a data, de trás para a frente. */
function ateAntesDaData(normalizado: string, indice: number): boolean {
  const semEspacos = antesDosEspacos(normalizado, indice);
  const semDia = antesDaPalavra(normalizado, semEspacos, 'dia') ?? semEspacos;
  const semO = antesDaPalavra(normalizado, semDia, 'o') ?? semDia;
  const inicio = semO - 'ate'.length;
  if (inicio < 0 || normalizado.slice(inicio, semO) !== 'ate') {
    return false;
  }
  return inicio === 0 || !LETRA_OU_DIGITO.test(caractereAntes(normalizado, inicio));
}

/** AD21: as datas de hoje - 3 a hoje + 5, no calendário de agora, sem o ano e com ele. */
function datasPerto(agora: DateTime): Set<string> {
  const perto = new Set<string>();
  const hoje = agora.startOf('day');
  for (let deslocamento = -3; deslocamento <= 5; deslocamento += 1) {
    const dia = hoje.plus({ days: deslocamento });
    perto.add(`${dia.day}/${dia.month}`);
    perto.add(`${dia.day}/${dia.month}/${dia.year}`);
  }
  return perto;
}

/** H5: os dias até o prazo, quando ele vence de hoje a hoje + 2; senão, nulo. */
function venceLogo(data: DateTime, agora: DateTime): number | null {
  const dias = diasDeCalendario(agora, data);
  return dias >= 0 && dias <= 2 ? dias : null;
}

/**
 * 7.3 e adendo AD19 a AD21: o primeiro prazo do texto que vence de hoje a hoje + 2. Vêm primeiro as
 * datas numéricas com o "até", na ordem do texto, e depois as expressões fixas. A referência é a
 * data do e-mail ou da mensagem (DT2).
 */
export function primeiroPrazoProximo(
  texto: string,
  referencia: DateTime,
  agora: DateTime,
): PrazoProximo | null {
  const normalizado = normalizar(texto);
  const perto = datasPerto(agora);
  const vistas = new Set<string>();
  for (const achada of datasNumericas(normalizado)) {
    const semAno = `${achada.dia}/${achada.mes}`;
    const chave = achada.ano === null ? semAno : `${semAno}/${achada.ano}`;
    if (!perto.has(chave) || vistas.has(chave) || !ateAntesDaData(normalizado, achada.indice)) {
      continue;
    }
    vistas.add(chave);
    const data = resolverData(achada, referencia);
    const dias = data === null ? null : venceLogo(data, agora);
    if (data !== null && dias !== null) {
      return { prazo: { data, descricao: `até ${data.toFormat('dd/MM/yyyy')}` }, dias };
    }
  }
  for (const { termo, diasDepoisDoEmail } of EXPRESSOES_DE_PRAZO) {
    const data = referencia.startOf('day').plus({ days: diasDepoisDoEmail });
    const dias = venceLogo(data, agora);
    if (dias !== null && contemTermo(normalizado, termo)) {
      return { prazo: { data, descricao: `"${termo}" (${data.toFormat('dd/MM/yyyy')})` }, dias };
    }
  }
  return null;
}

export function quandoVence(dias: number): string {
  if (dias === 0) {
    return 'vence hoje';
  }
  return dias === 1 ? 'vence em 1 dia' : `vence em ${dias} dias`;
}

function regraT1(email: Email): string | null {
  if ('list-unsubscribe' in email.cabecalhos) {
    return 'T1: cabeçalho List-Unsubscribe';
  }
  const precedencia = (email.cabecalhos.precedence ?? '').trim().toLowerCase();
  if (precedencia === 'bulk' || precedencia === 'list' || precedencia === 'junk') {
    return `T1: Precedence ${precedencia}`;
  }
  return null;
}

function regraT2(email: Email): string | null {
  const termo = primeiroTermo(normalizar(email.assunto), TERMOS_URGENCIA);
  return termo === null ? null : `T2: termo "${termo}" no assunto`;
}

function regraT3(texto: string, email: Email, contexto: ContextoTriagem): string | null {
  const proximo = primeiroPrazoProximo(
    texto,
    lerDataHora(email.data, contexto.fuso),
    contexto.agora,
  );
  return proximo === null
    ? null
    : `T3: prazo ${proximo.prazo.descricao}, que ${quandoVence(proximo.dias)}`;
}

function regraT5(texto: string, email: Email, contexto: ContextoTriagem): string | null {
  const usuario = contexto.enderecoUsuario.toLowerCase();
  if (!email.para.some((pessoa) => pessoa.endereco.toLowerCase() === usuario)) {
    return null;
  }
  const normalizado = normalizar(texto);
  if (normalizado.includes('?')) {
    return 'T5: pergunta direta';
  }
  const pedido = primeiroTermo(normalizado, PEDIDOS);
  return pedido === null ? null : `T5: pedido "${pedido}"`;
}

function ehImportante(email: Email, contexto: ContextoTriagem): boolean {
  const remetente = email.de.endereco.toLowerCase();
  return contexto.importantes.some((endereco) => endereco.trim().toLowerCase() === remetente);
}

/** 7.3: a primeira regra que casar decide, na ordem T1 a T6. */
export function classificar(email: Email, contexto: ContextoTriagem): Classificacao {
  const t1 = regraT1(email);
  if (t1 !== null) {
    return { categoria: 'propaganda', motivos: [t1] };
  }
  const t2 = regraT2(email);
  if (t2 !== null) {
    return { categoria: 'urgente', motivos: [t2] };
  }
  const texto = textoAnalisavel(email);
  const t3 = regraT3(texto, email, contexto);
  if (t3 !== null) {
    return { categoria: 'urgente', motivos: [t3] };
  }
  const t5 = regraT5(texto, email, contexto);
  if (t5 !== null && ehImportante(email, contexto)) {
    return { categoria: 'urgente', motivos: [`T4: remetente importante e ${t5}`] };
  }
  if (t5 !== null) {
    return { categoria: 'pede_resposta', motivos: [t5] };
  }
  return { categoria: 'informativo', motivos: ['T6: nenhuma outra regra casou'] };
}

export interface EmailClassificado {
  email: Email;
  classificacao: Classificacao;
}

export type Grupos = Record<Categoria, EmailClassificado[]>;

export function agrupar(emails: readonly Email[], contexto: ContextoTriagem): Grupos {
  const grupos: Grupos = { urgente: [], pede_resposta: [], informativo: [], propaganda: [] };
  for (const email of emails) {
    const classificacao = classificar(email, contexto);
    grupos[classificacao.categoria].push({ email, classificacao });
  }
  return grupos;
}
