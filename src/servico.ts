import type { DateTime } from 'luxon';
import type { Evento } from './dominio.js';
import type { Fontes } from './fontes/tipos.js';
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
  intervaloDoPeriodo,
  lerDataHora,
  lerFimDePeriodo,
  type Periodo,
  type Relogio,
} from './tempo.js';

export const LIMITE_DA_TRIAGEM = 200;
export const LIMITE_PADRAO_DA_LISTA = 20;

export interface Dependencias {
  fontes: Fontes;
  relogio: Relogio;
  fuso: string;
  importantes: readonly string[];
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
  };
}
