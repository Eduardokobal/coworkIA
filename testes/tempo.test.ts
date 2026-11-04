import { describe, expect, it } from 'vitest';
import {
  diasDeCalendario,
  intervaloDoPeriodo,
  lerDataHora,
  lerFimDePeriodo,
  paraIso,
  relogioFixo,
} from '../src/tempo.js';

const SP = 'America/Sao_Paulo';

describe('lerDataHora (H1, H2, H6)', () => {
  it('lê data e hora sem deslocamento no fuso informado, e não no da máquina', () => {
    expect(paraIso(lerDataHora('2026-11-05T15:00', SP))).toBe('2026-11-05T15:00:00-03:00');
    expect(paraIso(lerDataHora('2026-11-05T15:00', 'Asia/Tokyo'))).toBe(
      '2026-11-05T15:00:00+09:00',
    );
  });

  it('respeita o deslocamento quando ele vem no texto', () => {
    expect(paraIso(lerDataHora('2026-11-05T15:00Z', SP))).toBe('2026-11-05T12:00:00-03:00');
  });

  it('lê data sem hora como 00:00 no fuso', () => {
    expect(paraIso(lerDataHora('2026-11-04', SP))).toBe('2026-11-04T00:00:00-03:00');
  });

  it('recusa data que não existe', () => {
    expect(() => lerDataHora('2026-02-31', SP)).toThrow('data inválida');
  });
});

describe('lerFimDePeriodo (H9)', () => {
  it('um fim sem hora inclui o dia inteiro', () => {
    expect(paraIso(lerFimDePeriodo('2026-11-05', SP))).toBe('2026-11-06T00:00:00-03:00');
  });

  it('um fim com hora fica como está', () => {
    expect(paraIso(lerFimDePeriodo('2026-11-05T18:00', SP))).toBe('2026-11-05T18:00:00-03:00');
  });
});

describe('intervaloDoPeriodo (H3, H4)', () => {
  const agora = relogioFixo('2026-11-04T10:30', SP)();
  const comoTexto = (periodo: 'hoje' | 'amanha' | 'semana') => {
    const { inicio, fim } = intervaloDoPeriodo(periodo, agora);
    return [paraIso(inicio), paraIso(fim)];
  };

  it('hoje vai das 00:00 de hoje às 00:00 de amanhã', () => {
    expect(comoTexto('hoje')).toEqual(['2026-11-04T00:00:00-03:00', '2026-11-05T00:00:00-03:00']);
  });

  it('amanhã é o dia seguinte inteiro', () => {
    expect(comoTexto('amanha')).toEqual(['2026-11-05T00:00:00-03:00', '2026-11-06T00:00:00-03:00']);
  });

  it('a semana tem 7 dias, contando hoje', () => {
    expect(comoTexto('semana')).toEqual(['2026-11-04T00:00:00-03:00', '2026-11-11T00:00:00-03:00']);
  });
});

describe('diasDeCalendario (H5)', () => {
  it('conta por data, sem olhar a hora', () => {
    expect(
      diasDeCalendario(lerDataHora('2026-11-04T23:00', SP), lerDataHora('2026-11-05T01:00', SP)),
    ).toBe(1);
    expect(
      diasDeCalendario(lerDataHora('2026-11-04T01:00', SP), lerDataHora('2026-11-04T23:00', SP)),
    ).toBe(0);
    expect(
      diasDeCalendario(lerDataHora('2026-11-04T10:00', SP), lerDataHora('2026-11-03T10:00', SP)),
    ).toBe(-1);
  });
});
