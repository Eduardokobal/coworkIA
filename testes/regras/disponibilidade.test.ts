import { describe, expect, it } from 'vitest';
import type { Evento } from '../../src/dominio.js';
import {
  conflitosEntre,
  ehDiaInteiro,
  verificarDisponibilidade,
} from '../../src/regras/disponibilidade.js';
import { type Intervalo, lerDataHora } from '../../src/tempo.js';

const SP = 'America/Sao_Paulo';

function evento(parcial: Partial<Evento>): Evento {
  return {
    id: 'ev',
    titulo: 'Reunião',
    descricao: '',
    local: '',
    organizador: null,
    status: 'confirmed',
    inicio: { dataHora: '2026-11-05T15:00' },
    fim: { dataHora: '2026-11-05T16:00' },
    transparencia: 'opaque',
    minhaResposta: null,
    ...parcial,
  };
}

function pedido(inicio: string, fim: string): Intervalo {
  return { inicio: lerDataHora(inicio, SP), fim: lerDataHora(fim, SP) };
}

const livre = (p: Intervalo, eventos: Evento[]) => verificarDisponibilidade(p, eventos, SP).livre;

const DIA_INTEIRO = { inicio: { data: '2026-11-05' }, fim: { data: '2026-11-06' } };

describe('D-a, sobreposição', () => {
  it('conflita quando os intervalos se sobrepõem', () => {
    expect(livre(pedido('2026-11-05T14:30', '2026-11-05T15:30'), [evento({})])).toBe(false);
  });

  it('encostar não é conflito', () => {
    expect(livre(pedido('2026-11-05T14:00', '2026-11-05T15:00'), [evento({})])).toBe(true);
    expect(livre(pedido('2026-11-05T16:00', '2026-11-05T17:00'), [evento({})])).toBe(true);
  });

  it('devolve os eventos em conflito', () => {
    const reuniao = evento({ id: 'r1' });
    expect(
      verificarDisponibilidade(pedido('2026-11-05T15:30', '2026-11-05T15:45'), [reuniao], SP)
        .conflitos,
    ).toEqual([reuniao]);
  });
});

describe('D-b, dia inteiro', () => {
  it('cobre o dia todo, com o fim exclusivo', () => {
    expect(ehDiaInteiro(evento(DIA_INTEIRO))).toBe(true);
    expect(livre(pedido('2026-11-05T09:00', '2026-11-05T10:00'), [evento(DIA_INTEIRO)])).toBe(
      false,
    );
    expect(livre(pedido('2026-11-06T09:00', '2026-11-06T10:00'), [evento(DIA_INTEIRO)])).toBe(true);
  });

  it('um evento de vários dias cobre todos eles', () => {
    const tresDias = evento({ inicio: { data: '2026-11-05' }, fim: { data: '2026-11-08' } });
    expect(livre(pedido('2026-11-07T10:00', '2026-11-07T11:00'), [tresDias])).toBe(false);
    expect(livre(pedido('2026-11-08T10:00', '2026-11-08T11:00'), [tresDias])).toBe(true);
  });
});

describe('D-c e D-d, o que não conflita', () => {
  const horario = pedido('2026-11-05T15:00', '2026-11-05T16:00');

  it('cancelado, livre e recusado não conflitam', () => {
    expect(livre(horario, [evento({ status: 'cancelled' })])).toBe(true);
    expect(livre(horario, [evento({ transparencia: 'transparent' })])).toBe(true);
    expect(livre(horario, [evento({ minhaResposta: 'declined' })])).toBe(true);
  });

  it('o "talvez" ainda conflita', () => {
    expect(livre(horario, [evento({ minhaResposta: 'tentative' })])).toBe(false);
  });

  it('a marcação de livre vence a de dia inteiro', () => {
    expect(livre(horario, [evento({ ...DIA_INTEIRO, transparencia: 'transparent' })])).toBe(true);
  });
});

describe('entrada e conflitos entre eventos', () => {
  it('recusa fim igual ou antes do início', () => {
    expect(() => livre(pedido('2026-11-05T15:00', '2026-11-05T15:00'), [])).toThrow(
      'o fim precisa ser depois do início',
    );
  });

  it('acha os pares em conflito, sem contar o cancelado nem os que só se encostam', () => {
    const a = evento({ id: 'a' });
    const b = evento({
      id: 'b',
      inicio: { dataHora: '2026-11-05T15:30' },
      fim: { dataHora: '2026-11-05T16:30' },
    });
    const c = evento({
      id: 'c',
      inicio: { dataHora: '2026-11-05T16:30' },
      fim: { dataHora: '2026-11-05T17:00' },
    });
    const d = evento({ id: 'd', status: 'cancelled' });
    expect(conflitosEntre([a, b, c, d], SP).map(([x, y]) => [x.id, y.id])).toEqual([['a', 'b']]);
  });
});
