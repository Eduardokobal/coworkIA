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

/** "até", com "o dia" ou "dia" opcionais, logo antes da data (texto já normalizado). */
const ATE_ANTES_DA_DATA = /(?:^|[^\p{L}\p{N}])ate(?:\s+o)?(?:\s+dia)?\s*$/u;

export interface Prazo {
  data: DateTime;
  descricao: string;
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

export function prazosNoTexto(texto: string, dataDoEmail: DateTime): Prazo[] {
  const normalizado = normalizar(texto);
  const prazos: Prazo[] = [];
  for (const achada of datasNumericas(normalizado)) {
    if (!ATE_ANTES_DA_DATA.test(normalizado.slice(0, achada.indice))) {
      continue;
    }
    const data = resolverData(achada, dataDoEmail);
    if (data !== null) {
      prazos.push({ data, descricao: `até ${data.toFormat('dd/MM/yyyy')}` });
    }
  }
  for (const { termo, diasDepoisDoEmail } of EXPRESSOES_DE_PRAZO) {
    if (contemTermo(normalizado, termo)) {
      const data = dataDoEmail.startOf('day').plus({ days: diasDepoisDoEmail });
      prazos.push({ data, descricao: `"${termo}" (${data.toFormat('dd/MM/yyyy')})` });
    }
  }
  return prazos;
}

function quandoVence(dias: number): string {
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
  const dataDoEmail = lerDataHora(email.data, contexto.fuso);
  for (const prazo of prazosNoTexto(texto, dataDoEmail)) {
    const dias = diasDeCalendario(contexto.agora, prazo.data);
    if (dias >= 0 && dias <= 2) {
      return `T3: prazo ${prazo.descricao}, que ${quandoVence(dias)}`;
    }
  }
  return null;
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
