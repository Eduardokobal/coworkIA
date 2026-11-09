import type { DateTime } from 'luxon';
import type { Conversa, MensagemWhatsapp } from '../dominio.js';
import { diasDeCalendario, lerDataHora } from '../tempo.js';
import { contemTermo, normalizar, primeiroTermo, semAcentos } from '../texto/normalizar.js';
import { PEDIDOS, prazosNoTexto, quandoVence, TERMOS_URGENCIA } from './triagem.js';

export type CategoriaWhatsapp = 'urgente' | 'pede_resposta' | 'informativo';

export interface ContextoWhatsapp {
  agora: DateTime;
  fuso: string;
  /** V1: os nomes com que o usuário aparece na exportação. */
  eu: readonly string[];
  /** W3: os contatos importantes, como aparecem na exportação. */
  importantes: readonly string[];
}

export interface ConversaClassificada {
  conversa: Conversa;
  grupo: boolean;
  /** Seção 8: as mensagens recebidas depois da última do usuário, dentro da janela. */
  bloco: MensagemWhatsapp[];
  categoria: CategoriaWhatsapp;
  motivos: string[];
  /** 7.10: a última mensagem do bloco com texto (L5), ou nulo. */
  trecho: MensagemWhatsapp | null;
}

export type GruposWhatsapp = Record<CategoriaWhatsapp, ConversaClassificada[]>;

/** V1: sem diferença de maiúscula nem de acento (N1 e N2) e sem os espaços das pontas. */
function comparavel(nome: string): string {
  return semAcentos(nome.trim().toLowerCase());
}

function estaNaLista(nome: string, lista: readonly string[]): boolean {
  const alvo = comparavel(nome);
  return lista.some((item) => comparavel(item) === alvo);
}

/** V1 */
export function ehDoUsuario(autor: string, eu: readonly string[]): boolean {
  return estaNaLista(autor, eu);
}

/** V3: mais de um autor de mensagem além do usuário. */
export function ehGrupo(conversa: Conversa, eu: readonly string[]): boolean {
  const outros = new Set(
    conversa.mensagens
      .filter((mensagem) => !ehDoUsuario(mensagem.autor, eu))
      .map((mensagem) => comparavel(mensagem.autor)),
  );
  return outros.size > 1;
}

/** V4: um dos nomes do usuário aparece como termo (N5); o "@" sai na normalização (N4). */
export function citaUsuario(texto: string, eu: readonly string[]): boolean {
  const normalizado = normalizar(texto);
  return eu.some((nome) => contemTermo(normalizado, nome));
}

/** Seção 8: as mensagens depois da última do usuário, a partir de `desde`. */
export function blocoEsperando(
  conversa: Conversa,
  eu: readonly string[],
  desde: DateTime,
  fuso: string,
): MensagemWhatsapp[] {
  let ultimaDoUsuario = -1;
  for (const [indice, mensagem] of conversa.mensagens.entries()) {
    if (ehDoUsuario(mensagem.autor, eu)) {
      ultimaDoUsuario = indice;
    }
  }
  return conversa.mensagens
    .slice(ultimaDoUsuario + 1)
    .filter((mensagem) => lerDataHora(mensagem.data, fuso).toMillis() >= desde.toMillis());
}

function regraW1(consideradas: readonly MensagemWhatsapp[]): string | null {
  for (const mensagem of consideradas) {
    const termo = primeiroTermo(normalizar(mensagem.texto), TERMOS_URGENCIA);
    if (termo !== null) {
      return `W1: termo "${termo}"`;
    }
  }
  return null;
}

function regraW2(
  consideradas: readonly MensagemWhatsapp[],
  contexto: ContextoWhatsapp,
): string | null {
  for (const mensagem of consideradas) {
    const dataDaMensagem = lerDataHora(mensagem.data, contexto.fuso);
    for (const prazo of prazosNoTexto(mensagem.texto, dataDaMensagem)) {
      const dias = diasDeCalendario(contexto.agora, prazo.data);
      if (dias >= 0 && dias <= 2) {
        return `W2: prazo ${prazo.descricao}, que ${quandoVence(dias)}`;
      }
    }
  }
  return null;
}

function regraW4(consideradas: readonly MensagemWhatsapp[]): string | null {
  for (const mensagem of consideradas) {
    const normalizado = normalizar(mensagem.texto);
    if (normalizado.includes('?')) {
      return 'W4: pergunta direta';
    }
    const pedido = primeiroTermo(normalizado, PEDIDOS);
    if (pedido !== null) {
      return `W4: pedido "${pedido}"`;
    }
  }
  return null;
}

/** Seção 8: a primeira regra que casar decide, na ordem W1 a W5; sem bloco, a conversa fica de fora. */
export function classificarConversa(
  conversa: Conversa,
  contexto: ContextoWhatsapp,
  desde: DateTime,
): ConversaClassificada | null {
  const bloco = blocoEsperando(conversa, contexto.eu, desde, contexto.fuso);
  if (bloco.length === 0) {
    return null;
  }
  const grupo = ehGrupo(conversa, contexto.eu);
  const comTexto = bloco.filter((mensagem) => mensagem.temTexto);
  const consideradas = grupo
    ? comTexto.filter((mensagem) => citaUsuario(mensagem.texto, contexto.eu))
    : comTexto;
  const decidir = (categoria: CategoriaWhatsapp, motivo: string): ConversaClassificada => ({
    conversa,
    grupo,
    bloco,
    categoria,
    motivos: [motivo],
    trecho: comTexto.at(-1) ?? null,
  });
  if (grupo && consideradas.length === 0) {
    return decidir('informativo', 'W5: grupo sem citação a você');
  }
  const w1 = regraW1(consideradas);
  if (w1 !== null) {
    return decidir('urgente', w1);
  }
  const w2 = regraW2(consideradas, contexto);
  if (w2 !== null) {
    return decidir('urgente', w2);
  }
  const w4 = regraW4(consideradas);
  const importante = consideradas.some((mensagem) =>
    estaNaLista(mensagem.autor, contexto.importantes),
  );
  if (w4 !== null && importante) {
    return decidir('urgente', `W3: contato importante e ${w4}`);
  }
  if (w4 !== null) {
    return decidir('pede_resposta', w4);
  }
  return decidir('informativo', 'W5: nenhuma outra regra casou');
}

/** 7.10: as conversas com bloco, agrupadas pela categoria. */
export function triarConversas(
  conversas: readonly Conversa[],
  contexto: ContextoWhatsapp,
  desde: DateTime,
): GruposWhatsapp {
  const grupos: GruposWhatsapp = { urgente: [], pede_resposta: [], informativo: [] };
  for (const conversa of conversas) {
    const classificada = classificarConversa(conversa, contexto, desde);
    if (classificada !== null) {
      grupos[classificada.categoria].push(classificada);
    }
  }
  return grupos;
}
