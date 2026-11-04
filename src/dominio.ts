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
