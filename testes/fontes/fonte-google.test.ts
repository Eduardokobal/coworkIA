import { DateTime } from 'luxon';
import { describe, expect, it } from 'vitest';
import {
  type Buscar,
  consultaDoGmail,
  criarFontesGoogle,
  LIMITE_DE_LEITURA,
} from '../../src/fontes/google/fonte-google.js';
import type { MensagemDaApi } from '../../src/fontes/google/gmail.js';
import { lerDataHora } from '../../src/tempo.js';

const SP = 'America/Sao_Paulo';
const hora = (texto: string) => lerDataHora(texto, SP);

/** AD16: uma mensagem da Gmail API escrita à mão, no formato documentado. */
function mensagem(id: string, quando: string, de: string, assunto: string, rotulos = ['INBOX']) {
  const corpo: MensagemDaApi = {
    id,
    labelIds: rotulos,
    internalDate: String(DateTime.fromISO(quando, { zone: SP }).toMillis()),
    payload: {
      mimeType: 'text/plain',
      headers: [
        { name: 'From', value: de },
        { name: 'To', value: 'Você <voce@example.com>' },
        { name: 'Subject', value: assunto },
      ],
      body: { data: Buffer.from(`Corpo de ${assunto}.`, 'utf8').toString('base64url') },
    },
  };
  return corpo;
}

interface Pedido {
  url: URL;
  autorizacao: string | undefined;
}

/** Um Google de mentira: responde pelas rotas e anota cada pedido; nada sai da máquina. */
function googleDeMentira(responder: (url: URL) => unknown) {
  const pedidos: Pedido[] = [];
  const buscar: Buscar = async (endereco, opcoes) => {
    const url = new URL(endereco);
    pedidos.push({ url, autorizacao: opcoes.headers.authorization });
    const corpo = responder(url);
    if (typeof corpo === 'number') {
      return { ok: false, status: corpo, json: async () => ({}) };
    }
    return { ok: true, status: 200, json: async () => corpo };
  };
  const fontes = criarFontesGoogle({ buscar, obterToken: async () => 'token-de-teste', fuso: SP });
  return { fontes, pedidos };
}

const CAIXA: Record<string, MensagemDaApi> = {
  m1: mensagem('m1', '2026-11-04T09:00', 'Ana Ribeiro <ana@example.com>', 'Reunião'),
  m2: mensagem('m2', '2026-11-04T10:00', 'Carlos Lima <carlos@example.org>', 'Relatório', [
    'INBOX',
    'UNREAD',
  ]),
  m3: mensagem('m3', '2026-11-03T18:00', 'Bia Souza <bia@example.com>', 'Fotos'),
};

function caixaDeTres(url: URL): unknown {
  if (url.pathname.endsWith('/messages')) {
    return url.searchParams.get('pageToken') === 'p2'
      ? { messages: [{ id: 'm3' }] }
      : { messages: [{ id: 'm1' }, { id: 'm2' }], nextPageToken: 'p2' };
  }
  const id = url.pathname.split('/').at(-1) ?? '';
  return CAIXA[id] ?? 404;
}

const ids = (emails: Array<{ id: string }>) => emails.map((email) => email.id);

describe('consultaDoGmail (AD11)', () => {
  it('estreita pelo não lido e pelas datas em segundos, com 1 segundo de folga em cada ponta', () => {
    expect(
      consultaDoGmail({
        limite: 20,
        naoLidos: true,
        desde: hora('2026-11-04T10:30'),
        ate: hora('2026-11-05'),
      }),
    ).toBe('is:unread after:1793798999 before:1793847601');
    expect(consultaDoGmail({ limite: 20, remetente: 'ana', busca: 'x' })).toBe('');
  });
});

describe('fonte de e-mail do Google (7.1, 7.2, 7.3, AD10 e AD11)', () => {
  it('lê o endereço do perfil uma vez só, com o token no cabeçalho', async () => {
    const { fontes, pedidos } = googleDeMentira(() => ({ emailAddress: 'voce@gmail.example' }));
    expect(await fontes.email.enderecoDoUsuario()).toBe('voce@gmail.example');
    expect(await fontes.email.enderecoDoUsuario()).toBe('voce@gmail.example');
    expect(pedidos).toHaveLength(1);
    expect(pedidos[0]?.url.toString()).toBe(
      'https://gmail.googleapis.com/gmail/v1/users/me/profile',
    );
    expect(pedidos[0]?.autorizacao).toBe('Bearer token-de-teste');
  });

  it('lista a caixa de entrada pelas páginas, do mais novo para o mais velho', async () => {
    const { fontes, pedidos } = googleDeMentira(caixaDeTres);
    const pagina = await fontes.email.listar({ limite: 10 });
    expect(ids(pagina.emails)).toEqual(['m2', 'm1', 'm3']);
    expect(pagina.completo).toBe(true);
    const listas = pedidos.filter((pedido) => pedido.url.pathname.endsWith('/messages'));
    expect(listas.map((pedido) => pedido.url.searchParams.get('labelIds'))).toEqual([
      'INBOX',
      'INBOX',
    ]);
    expect(listas.map((pedido) => pedido.url.searchParams.get('maxResults'))).toEqual([
      '100',
      '100',
    ]);
    expect(listas[1]?.url.searchParams.get('pageToken')).toBe('p2');
    expect(
      pedidos
        .filter((pedido) => !pedido.url.pathname.endsWith('/messages'))
        .map((pedido) => pedido.url.searchParams.get('format')),
    ).toEqual(['full', 'full', 'full']);
  });

  it('aplica o remetente, a busca e o período exatos no coworkIA (AD11)', async () => {
    const { fontes } = googleDeMentira(caixaDeTres);
    expect(ids((await fontes.email.listar({ limite: 10, remetente: 'CARLOS' })).emails)).toEqual([
      'm2',
    ]);
    expect(ids((await fontes.email.listar({ limite: 10, busca: 'relatorio' })).emails)).toEqual([
      'm2',
    ]);
    expect(
      ids((await fontes.email.listar({ limite: 10, desde: hora('2026-11-04T09:30') })).emails),
    ).toEqual(['m2']);
    expect(ids((await fontes.email.listar({ limite: 10, naoLidos: true })).emails)).toEqual(['m2']);
  });

  it('para quando passa do limite e diz que ficou incompleto', async () => {
    const { fontes, pedidos } = googleDeMentira(caixaDeTres);
    const pagina = await fontes.email.listar({ limite: 1 });
    expect(ids(pagina.emails)).toEqual(['m2']);
    expect(pagina.completo).toBe(false);
    expect(pedidos.some((pedido) => pedido.url.pathname.endsWith('/m3'))).toBe(false);
  });

  it('lê no máximo 200 e-mails por chamada', async () => {
    const muitos = Array.from({ length: LIMITE_DE_LEITURA + 1 }, (_, i) => ({ id: `x${i}` }));
    const { fontes, pedidos } = googleDeMentira((url) =>
      url.pathname.endsWith('/messages')
        ? { messages: muitos }
        : mensagem(url.pathname.split('/').at(-1) ?? '', '2026-11-04T08:00', 'a@example.com', 'x'),
    );
    const pagina = await fontes.email.listar({ limite: 500 });
    expect(LIMITE_DE_LEITURA).toBe(200);
    expect(pagina.emails).toHaveLength(200);
    expect(pagina.completo).toBe(false);
    expect(pedidos.filter((pedido) => !pedido.url.pathname.endsWith('/messages'))).toHaveLength(
      200,
    );
  });

  it('lê pelo id e devolve nulo no 404', async () => {
    const { fontes, pedidos } = googleDeMentira(caixaDeTres);
    expect((await fontes.email.ler('m1'))?.assunto).toBe('Reunião');
    expect(await fontes.email.ler('não existe/..')).toBeNull();
    expect(pedidos.at(-1)?.url.pathname).toBe('/gmail/v1/users/me/messages/n%C3%A3o%20existe%2F..');
  });

  it('um erro da API diz só o status, sem o token (S5)', async () => {
    const { fontes } = googleDeMentira(() => 500);
    const falha = fontes.email.enderecoDoUsuario();
    await expect(falha).rejects.toThrow('A API do Google respondeu com o status 500.');
    await expect(falha).rejects.not.toThrow('token-de-teste');
  });
});

describe('triagem no Google (7.3 e #93)', () => {
  it('com a busca em segundos, o limite de 200 não se gasta fora da janela', async () => {
    const agora = hora('2026-11-04T10:30');
    const dentro = Array.from({ length: 150 }, (_, i) =>
      mensagem(`d${i}`, agora.minus({ minutes: 5 + i * 9 }).toISO() ?? '', 'a@example.com', 'x'),
    );
    const fora = Array.from({ length: 100 }, (_, i) =>
      mensagem(
        `f${i}`,
        agora.minus({ hours: 25, minutes: i * 6 }).toISO() ?? '',
        'a@example.com',
        'x',
      ),
    );
    const caixa = [...dentro, ...fora];
    /** Um Gmail de mentira que respeita o after: em segundos, como o de verdade. */
    const { fontes } = googleDeMentira((url) => {
      if (url.pathname.endsWith('/messages')) {
        const depois = Number(/after:(\d+)/.exec(url.searchParams.get('q') ?? '')?.[1] ?? 0);
        return {
          messages: caixa
            .filter((item) => Number(item.internalDate) / 1000 > depois)
            .map((item) => ({ id: item.id })),
        };
      }
      return caixa.find((item) => item.id === url.pathname.split('/').at(-1)) ?? 404;
    });
    const pagina = await fontes.email.listar({
      limite: LIMITE_DE_LEITURA,
      desde: agora.minus({ hours: 24 }),
    });
    expect(pagina.emails).toHaveLength(150);
    expect(pagina.completo).toBe(true);
  });
});

describe('fonte de agenda do Google (7.4 e 7.5)', () => {
  const evento = (id: string, inicio: string, fim: string) => ({
    id,
    status: 'confirmed',
    summary: id,
    start: { dateTime: inicio },
    end: { dateTime: fim },
  });

  it('lê a agenda principal com as ocorrências abertas, pelas páginas', async () => {
    const { fontes, pedidos } = googleDeMentira((url) =>
      url.searchParams.get('pageToken') === 'q2'
        ? { items: [evento('b', '2026-11-04T14:00:00-03:00', '2026-11-04T15:00:00-03:00')] }
        : {
            items: [evento('a', '2026-11-04T09:00:00-03:00', '2026-11-04T10:00:00-03:00')],
            nextPageToken: 'q2',
          },
    );
    const eventos = await fontes.agenda.listar({
      inicio: hora('2026-11-04'),
      fim: hora('2026-11-05'),
    });
    expect(eventos.map((item) => item.id)).toEqual(['a', 'b']);
    expect(eventos[0]?.inicio).toEqual({ dataHora: '2026-11-04T09:00:00-03:00' });
    const primeiro = pedidos[0]?.url;
    expect(primeiro?.origin + (primeiro?.pathname ?? '')).toBe(
      'https://www.googleapis.com/calendar/v3/calendars/primary/events',
    );
    expect(Object.fromEntries(primeiro?.searchParams ?? [])).toEqual({
      timeMin: '2026-11-04T00:00:00-03:00',
      timeMax: '2026-11-05T00:00:00-03:00',
      singleEvents: 'true',
      orderBy: 'startTime',
      maxResults: '250',
    });
    expect(pedidos[1]?.url.searchParams.get('pageToken')).toBe('q2');
  });

  it('um evento fora do formato da API dá erro', async () => {
    const { fontes } = googleDeMentira(() => ({ items: [{ id: 'sem-inicio', end: {} }] }));
    await expect(
      fontes.agenda.listar({ inicio: hora('2026-11-04'), fim: hora('2026-11-05') }),
    ).rejects.toThrow();
  });
});
