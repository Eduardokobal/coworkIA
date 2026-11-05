import { describe, expect, it } from 'vitest';
import type { Email, Evento } from '../../src/dominio.js';
import { criarFontesDemo, ENDERECO_DEMO } from '../../src/fontes/demo/fonte-demo.js';
import type { FiltroEmails } from '../../src/fontes/tipos.js';
import { lerDataHora } from '../../src/tempo.js';

const SP = 'America/Sao_Paulo';
const VOCE = { nome: 'Você', endereco: ENDERECO_DEMO };

function email(id: string, data: string, parcial: Partial<Email> = {}): Email {
  return {
    id,
    de: { nome: 'Ana Ribeiro', endereco: 'ana@example.com' },
    para: [VOCE],
    cc: [],
    assunto: `Assunto ${id}`,
    data,
    corpoTexto: 'Texto.',
    corpoHtml: null,
    cabecalhos: {},
    lido: false,
    temAnexo: false,
    ...parcial,
  };
}

function evento(id: string, inicio: string, fim: string): Evento {
  return {
    id,
    titulo: id,
    descricao: '',
    local: '',
    organizador: null,
    status: 'confirmed',
    inicio: { dataHora: inicio },
    fim: { dataHora: fim },
    transparencia: 'opaque',
    minhaResposta: null,
  };
}

const fontes = criarFontesDemo(
  {
    emails: [
      email('velho', '2026-11-01T09:00', { lido: true }),
      email('novo', '2026-11-04T09:00', {
        de: { nome: 'Carlos Lima', endereco: 'carlos@example.org' },
      }),
      email('meio', '2026-11-03T09:00', {
        corpoTexto: null,
        corpoHtml: '<p>Segue o <b>orçamento</b>.</p>',
      }),
    ],
    eventos: [
      evento('tarde', '2026-11-04T14:00', '2026-11-04T15:00'),
      evento('manha', '2026-11-04T09:00', '2026-11-04T10:00'),
      evento('amanha', '2026-11-05T09:00', '2026-11-05T10:00'),
    ],
  },
  SP,
);

const ids = async (filtro: FiltroEmails) =>
  (await fontes.email.listar(filtro)).emails.map((item) => item.id);
const hora = (texto: string) => lerDataHora(texto, SP);

describe('fonte de e-mail da demonstração', () => {
  it('lista do mais novo para o mais velho', async () => {
    expect(await ids({ limite: 10 })).toEqual(['novo', 'meio', 'velho']);
  });

  it('filtra os não lidos', async () => {
    expect(await ids({ limite: 10, naoLidos: true })).toEqual(['novo', 'meio']);
  });

  it('filtra pelo período, com o fim aberto', async () => {
    expect(
      await ids({ limite: 10, desde: hora('2026-11-03T09:00'), ate: hora('2026-11-04T09:00') }),
    ).toEqual(['meio']);
  });

  it('filtra o remetente por parte do nome ou do endereço (AD7)', async () => {
    expect(await ids({ limite: 10, remetente: 'CARLOS' })).toEqual(['novo']);
    expect(await ids({ limite: 10, remetente: 'example.org' })).toEqual(['novo']);
  });

  it('busca no assunto e no corpo, sem acento e também no HTML (AD7)', async () => {
    expect(await ids({ limite: 10, busca: 'Orcamento' })).toEqual(['meio']);
  });

  it('corta no limite e diz se ficou incompleto', async () => {
    expect((await fontes.email.listar({ limite: 2 })).completo).toBe(false);
    expect((await fontes.email.listar({ limite: 3 })).completo).toBe(true);
  });

  it('lê pelo id e devolve nulo quando não acha', async () => {
    expect((await fontes.email.ler('meio'))?.id).toBe('meio');
    expect(await fontes.email.ler('nao-existe')).toBeNull();
  });

  it('o usuário da demonstração é o voce@example.com', async () => {
    expect(await fontes.email.enderecoDoUsuario()).toBe('voce@example.com');
  });
});

describe('fonte de agenda da demonstração', () => {
  it('lista os eventos que tocam o intervalo, em ordem de início', async () => {
    const eventos = await fontes.agenda.listar({
      inicio: hora('2026-11-04'),
      fim: hora('2026-11-05'),
    });
    expect(eventos.map((item) => item.id)).toEqual(['manha', 'tarde']);
  });
});
