import { z } from 'zod';
import type { Email } from '../../dominio.js';
import { lerDataHora, paraIso } from '../../tempo.js';
import { esquemaEventoDaApi, eventoDaApi } from '../calendar-api.js';
import { casaComFiltro } from '../filtro.js';
import type { FiltroEmails, Fontes } from '../tipos.js';
import { esquemaMensagemDaApi, mensagemParaEmail } from './gmail.js';

const GMAIL = 'https://gmail.googleapis.com/gmail/v1/users/me';
const AGENDA = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';

/** AD11: uma chamada lê no máximo 200 e-mails, como a triagem (7.3). */
export const LIMITE_DE_LEITURA = 200;
/** A agenda lê no máximo 4 páginas de 250 eventos por intervalo. */
export const PAGINAS_DA_AGENDA = 4;

/** O pedaço do fetch que a fonte usa; nos testes, um Google de mentira. */
export type Buscar = (
  url: string,
  opcoes: { headers: Record<string, string> },
) => Promise<{ ok: boolean; status: number; json(): Promise<unknown> }>;

export interface ConfigFonteGoogle {
  buscar: Buscar;
  obterToken: () => Promise<string>;
  fuso: string;
}

const esquemaPerfil = z.object({ emailAddress: z.string() });
const esquemaLista = z.object({
  messages: z.array(z.object({ id: z.string() })).optional(),
  nextPageToken: z.string().optional(),
});
const esquemaEventos = z.object({
  items: z.array(z.unknown()).optional(),
  nextPageToken: z.string().optional(),
});

/** S5: o erro diz só o status, nunca o token nem a resposta. */
async function pedir(
  cfg: ConfigFonteGoogle,
  url: string,
): Promise<{ status: number; corpo: unknown }> {
  const token = await cfg.obterToken();
  const resposta = await cfg.buscar(url, { headers: { authorization: `Bearer ${token}` } });
  if (!resposta.ok) {
    if (resposta.status === 404) {
      return { status: 404, corpo: null };
    }
    throw new Error(`A API do Google respondeu com o status ${resposta.status}.`);
  }
  return { status: resposta.status, corpo: await resposta.json() };
}

/**
 * AD11: a busca do Gmail só estreita a janela. As pontas vão em segundos desde 1970, que o Gmail
 * aceita para datas fora do fuso do Pacífico, com 1 segundo de folga; o filtro exato é o do coworkIA.
 */
export function consultaDoGmail(filtro: FiltroEmails): string {
  const partes: string[] = [];
  if (filtro.naoLidos === true) {
    partes.push('is:unread');
  }
  if (filtro.desde !== undefined) {
    partes.push(`after:${Math.floor(filtro.desde.toSeconds()) - 1}`);
  }
  if (filtro.ate !== undefined) {
    partes.push(`before:${Math.ceil(filtro.ate.toSeconds()) + 1}`);
  }
  return partes.join(' ');
}

export function criarFontesGoogle(cfg: ConfigFonteGoogle): Fontes {
  let endereco: string | null = null;

  async function ler(id: string): Promise<Email | null> {
    const { status, corpo } = await pedir(
      cfg,
      `${GMAIL}/messages/${encodeURIComponent(id)}?format=full`,
    );
    return status === 404 ? null : mensagemParaEmail(esquemaMensagemDaApi.parse(corpo), cfg.fuso);
  }

  return {
    email: {
      enderecoDoUsuario: async () => {
        if (endereco === null) {
          endereco = esquemaPerfil.parse((await pedir(cfg, `${GMAIL}/profile`)).corpo).emailAddress;
        }
        return endereco;
      },
      /** 7.1, 7.3, AD10 e AD11: a caixa de entrada, do mais novo para o mais velho. */
      listar: async (filtro) => {
        const consulta = consultaDoGmail(filtro);
        const achados: Email[] = [];
        let lidos = 0;
        let pagina: string | undefined;
        while (true) {
          const parametros = new URLSearchParams({ labelIds: 'INBOX', maxResults: '100' });
          if (consulta !== '') {
            parametros.set('q', consulta);
          }
          if (pagina !== undefined) {
            parametros.set('pageToken', pagina);
          }
          const lista = esquemaLista.parse(
            (await pedir(cfg, `${GMAIL}/messages?${parametros}`)).corpo,
          );
          for (const item of lista.messages ?? []) {
            if (lidos === LIMITE_DE_LEITURA || achados.length > filtro.limite) {
              return {
                emails: ordenar(achados, cfg.fuso).slice(0, filtro.limite),
                completo: false,
              };
            }
            lidos += 1;
            const email = await ler(item.id);
            if (email !== null && casaComFiltro(email, filtro, cfg.fuso)) {
              achados.push(email);
            }
          }
          pagina = lista.nextPageToken;
          if (pagina === undefined) {
            const completo = achados.length <= filtro.limite;
            return { emails: ordenar(achados, cfg.fuso).slice(0, filtro.limite), completo };
          }
        }
      },
      ler,
    },
    agenda: {
      /** 7.4 e 7.5: só a agenda principal, com os eventos repetidos já abertos em ocorrências. */
      listar: async (intervalo) => {
        const eventos = [];
        let pagina: string | undefined;
        for (let vez = 0; vez < PAGINAS_DA_AGENDA; vez += 1) {
          const parametros = new URLSearchParams({
            timeMin: paraIso(intervalo.inicio),
            timeMax: paraIso(intervalo.fim),
            singleEvents: 'true',
            orderBy: 'startTime',
            maxResults: '250',
          });
          if (pagina !== undefined) {
            parametros.set('pageToken', pagina);
          }
          const resposta = esquemaEventos.parse(
            (await pedir(cfg, `${AGENDA}?${parametros}`)).corpo,
          );
          for (const item of resposta.items ?? []) {
            eventos.push(eventoDaApi(esquemaEventoDaApi.parse(item)));
          }
          pagina = resposta.nextPageToken;
          if (pagina === undefined) {
            break;
          }
        }
        return eventos;
      },
    },
  };
}

function ordenar(emails: Email[], fuso: string): Email[] {
  const instante = (email: Email) => lerDataHora(email.data, fuso).toMillis();
  return [...emails].sort((a, b) => instante(b) - instante(a));
}
