import { DateTime } from 'luxon';
import type { Conversa, Evento, MensagemWhatsapp } from './dominio.js';
import type { Fontes } from './fontes/tipos.js';
import {
  type AvisoDaPasta,
  ErroDaPasta,
  type FonteWhatsapp,
} from './fontes/whatsapp/fonte-whatsapp.js';
import { type Apontamento, criticar, type Rascunho, ROTEIRO_DA_CRITICA } from './regras/critica.js';
import {
  bloqueiaAgenda,
  conflitosEntre,
  type Disponibilidade,
  ehDiaInteiro,
  intervaloDoEvento,
  verificarDisponibilidade,
} from './regras/disponibilidade.js';
import {
  agrupar,
  type ContextoTriagem,
  classificar,
  type EmailClassificado,
  type Grupos,
} from './regras/triagem.js';
import {
  blocoEsperando,
  type ContextoWhatsapp,
  ehDoUsuario,
  ehGrupo,
  type GruposWhatsapp,
  triarConversas,
} from './regras/triagem-whatsapp.js';
import {
  intervaloDoPeriodo,
  lerDataHora,
  lerFimDePeriodo,
  type Periodo,
  type Relogio,
} from './tempo.js';

export const LIMITE_DA_TRIAGEM = 200;
export const LIMITE_PADRAO_DA_LISTA = 20;
/** Versão 2, 7.9 */
export const LIMITE_PADRAO_DA_CONVERSA = 50;
/** Versão 2, F1 e V2: o que falta configurar no modo google. */
export const SEM_PASTA_DO_WHATSAPP =
  'Defina COWORKIA_WHATSAPP_PASTA com a pasta das conversas exportadas.';
export const SEM_EU_DO_WHATSAPP =
  'Defina COWORKIA_WHATSAPP_EU com o nome que aparece nas suas mensagens exportadas.';

/** Versão 2: a fonte das conversas, os nomes do usuário (V1) e os contatos importantes (W3). */
export interface DependenciasWhatsapp {
  fonte: FonteWhatsapp;
  eu: readonly string[];
  importantes: readonly string[];
}

export interface Dependencias {
  fontes: Fontes;
  relogio: Relogio;
  fuso: string;
  importantes: readonly string[];
  /** Versão 2: as conversas, ou a mensagem que diz o que falta configurar (F1 e V2). */
  whatsapp?: DependenciasWhatsapp | string | undefined;
}

export interface EntradaListarEmails {
  naoLidos?: boolean | undefined;
  desde?: string | undefined;
  ate?: string | undefined;
  remetente?: string | undefined;
  busca?: string | undefined;
  limite?: number | undefined;
}

export interface ResultadoTriagem {
  grupos: Grupos;
  analisados: number;
  completo: boolean;
}

export interface ResultadoCritica {
  apontamentos: Apontamento[];
  roteiro: readonly string[];
}

export interface ResumoDoDia {
  hoje: DateTime;
  triagem: ResultadoTriagem;
  eventosDeHoje: Evento[];
  conflitos: Array<[Evento, Evento]>;
  proximoCompromisso: Evento | null;
  /** Versão 2, 7.7: a triagem do WhatsApp, ou o aviso do que falta configurar. */
  whatsapp: ResultadoTriagemWhatsapp | string;
}

export interface ConversaListada {
  conversa: Conversa;
  grupo: boolean;
  ultima: MensagemWhatsapp | null;
  esperandoVoce: number;
}

export interface ListaDeConversas {
  conversas: ConversaListada[];
  avisos: AvisoDaPasta[];
}

export interface EntradaLerConversa {
  id: string;
  desde?: string | undefined;
  ate?: string | undefined;
  limite?: number | undefined;
}

export interface MensagemLida extends MensagemWhatsapp {
  sua: boolean;
}

export interface ConversaLida {
  conversa: Conversa;
  mensagens: MensagemLida[];
  completo: boolean;
}

export interface ResultadoTriagemWhatsapp {
  grupos: GruposWhatsapp;
  analisadas: number;
}

async function contexto(dep: Dependencias): Promise<ContextoTriagem> {
  return {
    agora: dep.relogio(),
    fuso: dep.fuso,
    enderecoUsuario: await dep.fontes.email.enderecoDoUsuario(),
    importantes: dep.importantes,
  };
}

/** 7.1 */
export async function listarEmails(
  dep: Dependencias,
  entrada: EntradaListarEmails,
): Promise<EmailClassificado[]> {
  const pagina = await dep.fontes.email.listar({
    naoLidos: entrada.naoLidos,
    desde: entrada.desde === undefined ? undefined : lerDataHora(entrada.desde, dep.fuso),
    ate: entrada.ate === undefined ? undefined : lerFimDePeriodo(entrada.ate, dep.fuso),
    remetente: entrada.remetente,
    busca: entrada.busca,
    limite: entrada.limite ?? LIMITE_PADRAO_DA_LISTA,
  });
  const ctx = await contexto(dep);
  return pagina.emails.map((email) => ({ email, classificacao: classificar(email, ctx) }));
}

/** 7.2 */
export async function lerEmail(dep: Dependencias, id: string): Promise<EmailClassificado> {
  const email = await dep.fontes.email.ler(id);
  if (email === null) {
    throw new Error('e-mail não encontrado');
  }
  return { email, classificacao: classificar(email, await contexto(dep)) };
}

/** 7.3: a janela começa em `desde` ou 24 horas antes de agora, com até 200 e-mails. */
export async function triagem(dep: Dependencias, desde?: string): Promise<ResultadoTriagem> {
  const inicio =
    desde === undefined ? dep.relogio().minus({ hours: 24 }) : lerDataHora(desde, dep.fuso);
  const pagina = await dep.fontes.email.listar({ desde: inicio, limite: LIMITE_DA_TRIAGEM });
  return {
    grupos: agrupar(pagina.emails, await contexto(dep)),
    analisados: pagina.emails.length,
    completo: pagina.completo,
  };
}

/** 7.4 */
export async function listarEventos(dep: Dependencias, periodo: Periodo): Promise<Evento[]> {
  return dep.fontes.agenda.listar(intervaloDoPeriodo(periodo, dep.relogio()));
}

/** 7.5: um fim sem hora inclui o dia inteiro (H9). */
export async function disponibilidade(
  dep: Dependencias,
  inicio: string,
  fim: string,
): Promise<Disponibilidade> {
  const pedido = { inicio: lerDataHora(inicio, dep.fuso), fim: lerFimDePeriodo(fim, dep.fuso) };
  const eventos = await dep.fontes.agenda.listar(pedido);
  return verificarDisponibilidade(pedido, eventos, dep.fuso);
}

/** 7.6 */
export function criticarRascunho(rascunho: Rascunho): ResultadoCritica {
  return { apontamentos: criticar(rascunho), roteiro: ROTEIRO_DA_CRITICA };
}

/** 7.7: o próximo compromisso é o primeiro de hoje com hora, a partir de agora, que ocupa a agenda. */
export async function resumoDoDia(dep: Dependencias): Promise<ResumoDoDia> {
  const hoje = dep.relogio();
  const triagemDoDia = await triagem(dep);
  const eventosDeHoje = await listarEventos(dep, 'hoje');
  const inicioDe = (evento: Evento) => intervaloDoEvento(evento, dep.fuso).inicio.toMillis();
  const futuros = eventosDeHoje.filter(
    (evento) =>
      !ehDiaInteiro(evento) && bloqueiaAgenda(evento) && inicioDe(evento) >= hoje.toMillis(),
  );
  const proximoCompromisso = futuros.reduce<Evento | null>(
    (melhor, evento) => (melhor === null || inicioDe(evento) < inicioDe(melhor) ? evento : melhor),
    null,
  );
  return {
    hoje,
    triagem: triagemDoDia,
    eventosDeHoje,
    conflitos: conflitosEntre(eventosDeHoje, dep.fuso),
    proximoCompromisso,
    whatsapp: await secaoDoWhatsapp(dep),
  };
}

/**
 * Versão 2, 7.7 e F1: a triagem do WhatsApp, ou, no lugar dela, o aviso do que falta configurar ou da
 * pasta que não pôde ser lida (achado 114). O e-mail e a agenda saem do mesmo jeito.
 */
async function secaoDoWhatsapp(dep: Dependencias): Promise<ResultadoTriagemWhatsapp | string> {
  if (typeof dep.whatsapp !== 'object') {
    return whatsappAusente(dep);
  }
  try {
    return await triagemWhatsapp(dep);
  } catch (erro) {
    if (erro instanceof ErroDaPasta) {
      return erro.message;
    }
    throw erro;
  }
}

/** Versão 2, F1 e V2: a mensagem do que falta configurar. */
function whatsappAusente(dep: Dependencias): string {
  return typeof dep.whatsapp === 'string' ? dep.whatsapp : SEM_PASTA_DO_WHATSAPP;
}

function whatsappDe(dep: Dependencias): DependenciasWhatsapp {
  if (typeof dep.whatsapp !== 'object') {
    throw new Error(whatsappAusente(dep));
  }
  return dep.whatsapp;
}

/** Versão 2, 7.8: da última mensagem mais recente para a mais antiga. */
export async function listarConversas(dep: Dependencias): Promise<ListaDeConversas> {
  const whatsapp = whatsappDe(dep);
  const { conversas, avisos } = await whatsapp.fonte.conversas();
  const desdeSempre = DateTime.fromMillis(0);
  const instante = (mensagem: MensagemWhatsapp | null) =>
    mensagem === null ? -1 : lerDataHora(mensagem.data, dep.fuso).toMillis();
  const listadas = conversas.map((conversa) => ({
    conversa,
    grupo: ehGrupo(conversa, whatsapp.eu),
    ultima: conversa.mensagens.at(-1) ?? null,
    esperandoVoce: blocoEsperando(conversa, whatsapp.eu, desdeSempre, dep.fuso).length,
  }));
  listadas.sort((a, b) => instante(b.ultima) - instante(a.ultima));
  return { conversas: listadas, avisos };
}

/**
 * Versão 2, 7.9: só um id da lista da pasta (F4). Sem o `desde`, a janela começa 24 horas antes de
 * agora; sem o `ate`, ela não tem fim. O padrão do limite são 50 mensagens.
 */
export async function lerConversa(
  dep: Dependencias,
  entrada: EntradaLerConversa,
): Promise<ConversaLida> {
  const whatsapp = whatsappDe(dep);
  const { conversas } = await whatsapp.fonte.conversas();
  const conversa = conversas.find((item) => item.id === entrada.id);
  if (conversa === undefined) {
    throw new Error('Conversa não encontrada.');
  }
  const desde =
    entrada.desde === undefined
      ? dep.relogio().minus({ hours: 24 })
      : lerDataHora(entrada.desde, dep.fuso);
  const ate = entrada.ate === undefined ? null : lerFimDePeriodo(entrada.ate, dep.fuso);
  const doPeriodo = conversa.mensagens.filter((mensagem) => {
    const instante = lerDataHora(mensagem.data, dep.fuso).toMillis();
    return instante >= desde.toMillis() && (ate === null || instante < ate.toMillis());
  });
  const limite = entrada.limite ?? LIMITE_PADRAO_DA_CONVERSA;
  return {
    conversa,
    mensagens: doPeriodo
      .slice(-limite)
      .map((mensagem) => ({ ...mensagem, sua: ehDoUsuario(mensagem.autor, whatsapp.eu) })),
    completo: doPeriodo.length <= limite,
  };
}

/** Versão 2, 7.10: a janela começa em `desde` ou 24 horas antes de agora. */
export async function triagemWhatsapp(
  dep: Dependencias,
  desde?: string,
): Promise<ResultadoTriagemWhatsapp> {
  const whatsapp = whatsappDe(dep);
  const agora = dep.relogio();
  const inicio = desde === undefined ? agora.minus({ hours: 24 }) : lerDataHora(desde, dep.fuso);
  const contexto: ContextoWhatsapp = {
    agora,
    fuso: dep.fuso,
    eu: whatsapp.eu,
    importantes: whatsapp.importantes,
  };
  const { conversas } = await whatsapp.fonte.conversas();
  return { grupos: triarConversas(conversas, contexto, inicio), analisadas: conversas.length };
}
