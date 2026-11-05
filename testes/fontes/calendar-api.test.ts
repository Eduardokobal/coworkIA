import { describe, expect, it } from 'vitest';
import { esquemaEventoDaApi, eventoDaApi } from '../../src/fontes/calendar-api.js';

describe('eventoDaApi (seção 10 e D-c)', () => {
  it('converte um evento com hora, com o organizador, a minha resposta e o livre', () => {
    expect(
      eventoDaApi({
        id: 'e1',
        status: 'tentative',
        summary: 'Reunião',
        description: 'Pauta',
        location: 'Sala 1',
        organizer: { email: 'ana@example.com', displayName: 'Ana Ribeiro' },
        start: { dateTime: '2026-11-04T14:00:00-03:00' },
        end: { dateTime: '2026-11-04T15:00:00-03:00' },
        transparency: 'transparent',
        attendees: [
          { email: 'ana@example.com', responseStatus: 'accepted' },
          { email: 'voce@example.com', self: true, responseStatus: 'declined' },
        ],
      }),
    ).toEqual({
      id: 'e1',
      titulo: 'Reunião',
      descricao: 'Pauta',
      local: 'Sala 1',
      organizador: { nome: 'Ana Ribeiro', endereco: 'ana@example.com' },
      status: 'tentative',
      inicio: { dataHora: '2026-11-04T14:00:00-03:00' },
      fim: { dataHora: '2026-11-04T15:00:00-03:00' },
      transparencia: 'transparent',
      minhaResposta: 'declined',
    });
  });

  it('o dia inteiro usa a data, e os campos ausentes viram os padrões da API', () => {
    expect(
      eventoDaApi({ id: 'e2', start: { date: '2026-11-04' }, end: { date: '2026-11-05' } }),
    ).toEqual({
      id: 'e2',
      titulo: '',
      descricao: '',
      local: '',
      organizador: null,
      status: 'confirmed',
      inicio: { data: '2026-11-04' },
      fim: { data: '2026-11-05' },
      transparencia: 'opaque',
      minhaResposta: null,
    });
  });

  it('sem um participante com self, a minha resposta é nula', () => {
    expect(
      eventoDaApi({
        id: 'e3',
        start: { date: '2026-11-04' },
        end: { date: '2026-11-05' },
        attendees: [{ email: 'ana@example.com', responseStatus: 'accepted' }],
      }).minhaResposta,
    ).toBeNull();
  });
});

describe('esquemaEventoDaApi', () => {
  it('recusa um início ou um fim sem date nem dateTime', () => {
    expect(
      esquemaEventoDaApi.safeParse({ id: 'e4', start: { date: '2026-11-04' }, end: {} }).success,
    ).toBe(false);
    expect(
      esquemaEventoDaApi.safeParse({
        id: 'e4',
        start: { date: '2026-11-04' },
        end: { date: '2026-11-05' },
      }).success,
    ).toBe(true);
  });
});
