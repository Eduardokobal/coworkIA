export interface Pessoa {
  nome: string;
  endereco: string;
}

export interface Email {
  id: string;
  de: Pessoa;
  para: Pessoa[];
  cc: Pessoa[];
  assunto: string;
  /** ISO 8601, com ou sem deslocamento (spec, seção 4). */
  data: string;
  corpoTexto: string | null;
  corpoHtml: string | null;
  /** Cabeçalhos relevantes, com o nome em minúscula (por exemplo, "list-unsubscribe"). */
  cabecalhos: Record<string, string>;
  lido: boolean;
  temAnexo: boolean;
}

export type Categoria = 'urgente' | 'pede_resposta' | 'informativo' | 'propaganda';

export interface Classificacao {
  categoria: Categoria;
  motivos: string[];
}

/** Início ou fim de um evento, como na Calendar API: `data` (dia inteiro) ou `dataHora`. */
export interface MomentoDoEvento {
  data?: string;
  dataHora?: string;
}

export interface Evento {
  id: string;
  titulo: string;
  descricao: string;
  local: string;
  organizador: Pessoa | null;
  status: 'confirmed' | 'tentative' | 'cancelled';
  inicio: MomentoDoEvento;
  /** No dia inteiro, o `fim.data` é exclusivo, como na Calendar API. */
  fim: MomentoDoEvento;
  transparencia: 'opaque' | 'transparent';
  /** A resposta do participante com `self: true`; nulo quando o usuário não é convidado. */
  minhaResposta: 'accepted' | 'declined' | 'tentative' | 'needsAction' | null;
}

/** Versão 2, seção 5: uma mensagem do WhatsApp exportado. */
export interface MensagemWhatsapp {
  autor: string;
  /** ISO 8601 com o deslocamento do fuso (RW4 e H6). */
  data: string;
  texto: string;
  /** L5: falso para a mídia oculta e para o texto que começa com U+200E. */
  temTexto: boolean;
}

/** Versão 2, seção 4: uma conversa, lida de um arquivo da pasta. */
export interface Conversa {
  /** F4: os 12 primeiros caracteres hexadecimais do sha256 do nome do arquivo. */
  id: string;
  nome: string;
  /** L1: o formato da primeira linha que casou; nulo quando nenhuma casou (L4). */
  formato: 'android' | 'iphone' | null;
  mensagens: MensagemWhatsapp[];
  /** L3: as linhas que não continuam nenhuma mensagem. */
  linhasDescartadas: number;
}
