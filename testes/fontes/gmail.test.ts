import { DateTime } from 'luxon';
import { describe, expect, it } from 'vitest';
import {
  decodificarPalavras,
  esquemaMensagemDaApi,
  lerEnderecos,
  type MensagemDaApi,
  mensagemParaEmail,
} from '../../src/fontes/google/gmail.js';

const SP = 'America/Sao_Paulo';
const B64 = (texto: string) => Buffer.from(texto, 'utf8').toString('base64');
const B64URL_UTF8 = (texto: string) => Buffer.from(texto, 'utf8').toString('base64url');
const B64URL_LATIN1 = (texto: string) => Buffer.from(texto, 'latin1').toString('base64url');
const NOVE_DA_MANHA = String(DateTime.fromISO('2026-11-04T12:00:00Z').toMillis());

describe('decodificarPalavras (AD13)', () => {
  it('decodifica B em UTF-8 e Q em ISO-8859-1', () => {
    expect(decodificarPalavras(`=?UTF-8?B?${B64('Olá, ação')}?=`)).toBe('Olá, ação');
    expect(decodificarPalavras('=?ISO-8859-1?Q?Jo=E3o_Silva?=')).toBe('João Silva');
  });

  it('junta palavras codificadas vizinhas e mantém o texto em volta', () => {
    expect(decodificarPalavras('Re: =?UTF-8?Q?Or=C3=A7a?= =?UTF-8?Q?mento?= final')).toBe(
      'Re: Orçamento final',
    );
  });

  it('um texto já decodificado passa igual', () => {
    expect(decodificarPalavras('Olá, tudo bem? =?não é codificado')).toBe(
      'Olá, tudo bem? =?não é codificado',
    );
  });

  it('com um charset desconhecido, deixa a palavra como veio', () => {
    expect(decodificarPalavras('=?x-inventado?Q?abc?=')).toBe('=?x-inventado?Q?abc?=');
  });
});

describe('lerEnderecos', () => {
  it('lê nome e endereço, com vírgula entre aspas e nome codificado', () => {
    expect(
      lerEnderecos(
        `Ana Ribeiro <ana@example.com>, "Silva, João" <joao@example.org>, bia@example.com, =?UTF-8?B?${B64('Você')}?= <voce@example.com>`,
      ),
    ).toEqual([
      { nome: 'Ana Ribeiro', endereco: 'ana@example.com' },
      { nome: 'Silva, João', endereco: 'joao@example.org' },
      { nome: '', endereco: 'bia@example.com' },
      { nome: 'Você', endereco: 'voce@example.com' },
    ]);
  });

  it('um cabeçalho vazio dá uma lista vazia', () => {
    expect(lerEnderecos('')).toEqual([]);
  });
});

function mensagem(parcial: Partial<MensagemDaApi>): MensagemDaApi {
  return {
    id: 'm1',
    labelIds: ['INBOX', 'UNREAD'],
    internalDate: NOVE_DA_MANHA,
    payload: {
      mimeType: 'multipart/mixed',
      headers: [
        { name: 'From', value: 'Ana Ribeiro <ana@example.com>' },
        { name: 'To', value: 'Você <voce@example.com>, time@example.com' },
        { name: 'Cc', value: 'Carlos Lima <carlos@example.org>' },
        { name: 'Subject', value: `=?UTF-8?B?${B64('Orçamento revisado')}?=` },
        { name: 'List-Unsubscribe', value: '<mailto:sair@example.com>' },
        { name: 'Precedence', value: 'bulk' },
      ],
      parts: [
        {
          mimeType: 'multipart/alternative',
          parts: [
            {
              mimeType: 'text/plain',
              headers: [{ name: 'Content-Type', value: 'text/plain; charset=UTF-8' }],
              body: { data: B64URL_UTF8('Segue o orçamento.') },
            },
            {
              mimeType: 'text/html',
              headers: [{ name: 'Content-Type', value: 'text/html; charset=UTF-8' }],
              body: { data: B64URL_UTF8('<p>Segue o <b>orçamento</b>.</p>') },
            },
          ],
        },
        {
          mimeType: 'application/pdf',
          filename: 'proposta.pdf',
          body: { attachmentId: 'anexo-1' },
        },
      ],
    },
    ...parcial,
  };
}

describe('mensagemParaEmail (7.1, 7.2, AD12 e AD13)', () => {
  it('converte o remetente, os destinatários, o assunto, a data, os corpos e os cabeçalhos', () => {
    expect(mensagemParaEmail(mensagem({}), SP)).toEqual({
      id: 'm1',
      de: { nome: 'Ana Ribeiro', endereco: 'ana@example.com' },
      para: [
        { nome: 'Você', endereco: 'voce@example.com' },
        { nome: '', endereco: 'time@example.com' },
      ],
      cc: [{ nome: 'Carlos Lima', endereco: 'carlos@example.org' }],
      assunto: 'Orçamento revisado',
      data: '2026-11-04T09:00:00-03:00',
      corpoTexto: 'Segue o orçamento.',
      corpoHtml: '<p>Segue o <b>orçamento</b>.</p>',
      cabecalhos: { 'list-unsubscribe': '<mailto:sair@example.com>', precedence: 'bulk' },
      lido: false,
      temAnexo: true,
    });
  });

  it('sem o rótulo UNREAD é lido; uma mensagem simples tem o corpo na raiz', () => {
    const email = mensagemParaEmail(
      mensagem({
        labelIds: ['INBOX'],
        payload: {
          mimeType: 'text/plain',
          headers: [{ name: 'From', value: 'bia@example.com' }],
          body: { data: B64URL_UTF8('Oi!') },
        },
      }),
      SP,
    );
    expect(email).toMatchObject({
      de: { nome: '', endereco: 'bia@example.com' },
      para: [],
      assunto: '',
      corpoTexto: 'Oi!',
      corpoHtml: null,
      cabecalhos: {},
      lido: true,
      temAnexo: false,
    });
  });

  it('só com HTML, decodifica pelo charset da parte', () => {
    const email = mensagemParaEmail(
      mensagem({
        payload: {
          mimeType: 'text/html',
          headers: [
            { name: 'From', value: 'loja@example.org' },
            { name: 'Content-Type', value: 'text/html; charset="ISO-8859-1"' },
          ],
          body: { data: B64URL_LATIN1('<p>Promoção</p>') },
        },
      }),
      SP,
    );
    expect(email.corpoTexto).toBeNull();
    expect(email.corpoHtml).toBe('<p>Promoção</p>');
  });

  it('o esquema recusa uma mensagem sem a data interna em milissegundos', () => {
    expect(esquemaMensagemDaApi.safeParse(mensagem({})).success).toBe(true);
    expect(esquemaMensagemDaApi.safeParse({ ...mensagem({}), internalDate: 'ontem' }).success).toBe(
      false,
    );
  });
});
