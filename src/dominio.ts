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
