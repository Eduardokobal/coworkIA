import type { DateTime } from 'luxon';
import type { Email, Evento } from '../dominio.js';
import type { Intervalo } from '../tempo.js';

export interface FiltroEmails {
  naoLidos?: boolean | undefined;
  desde?: DateTime | undefined;
  /** Exclusivo (H3). */
  ate?: DateTime | undefined;
  remetente?: string | undefined;
  busca?: string | undefined;
  limite: number;
}

export interface PaginaDeEmails {
  emails: Email[];
  /** Falso quando o filtro tinha mais e-mails do que o limite. */
  completo: boolean;
}

export interface FonteEmail {
  enderecoDoUsuario(): Promise<string>;
  /** Do mais novo para o mais velho. */
  listar(filtro: FiltroEmails): Promise<PaginaDeEmails>;
  ler(id: string): Promise<Email | null>;
}

export interface FonteAgenda {
  /** Os eventos da agenda principal que tocam o intervalo, em ordem de início. */
  listar(intervalo: Intervalo): Promise<Evento[]>;
}

export interface Fontes {
  email: FonteEmail;
  agenda: FonteAgenda;
}
