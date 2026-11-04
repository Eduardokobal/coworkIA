import { DateTime } from 'luxon';

export const FUSO_PADRAO = 'America/Sao_Paulo';

export type Relogio = () => DateTime;

export interface Intervalo {
  inicio: DateTime;
  fim: DateTime;
}

export type Periodo = 'hoje' | 'amanha' | 'semana';

const SO_DATA = /^\d{4}-\d{2}-\d{2}$/;

/** H1 e H2: sem deslocamento, lê no fuso; só a data, lê como 00:00 no fuso. */
export function lerDataHora(texto: string, fuso: string): DateTime {
  const lido = DateTime.fromISO(texto, { zone: fuso, setZone: true });
  if (!lido.isValid) {
    throw new Error(`data inválida: ${texto}`);
  }
  return lido.setZone(fuso);
}

/** H9: um fim sem hora inclui o dia inteiro. */
export function lerFimDePeriodo(texto: string, fuso: string): DateTime {
  const lido = lerDataHora(texto, fuso);
  return SO_DATA.test(texto) ? lido.plus({ days: 1 }) : lido;
}

/** H3 e H4: intervalos fechados no início e abertos no fim. */
export function intervaloDoPeriodo(periodo: Periodo, agora: DateTime): Intervalo {
  const hoje = agora.startOf('day');
  if (periodo === 'hoje') {
    return { inicio: hoje, fim: hoje.plus({ days: 1 }) };
  }
  if (periodo === 'amanha') {
    return { inicio: hoje.plus({ days: 1 }), fim: hoje.plus({ days: 2 }) };
  }
  return { inicio: hoje, fim: hoje.plus({ days: 7 }) };
}

/** H5: diferença em dias de calendário, no fuso de `de`. */
export function diasDeCalendario(de: DateTime, ate: DateTime): number {
  const inicio = de.startOf('day');
  const fim = ate.setZone(de.zone).startOf('day');
  return Math.round(fim.diff(inicio, 'days').days);
}

/** H6: ISO com o deslocamento do fuso. */
export function paraIso(data: DateTime): string {
  const iso = data.toISO({ suppressMilliseconds: true });
  if (iso === null) {
    throw new Error('data inválida');
  }
  return iso;
}

/** H8: o relógio de verdade. */
export function relogioDoSistema(fuso: string): Relogio {
  return () => DateTime.now().setZone(fuso);
}

/** H8: o relógio fixo dos testes. */
export function relogioFixo(iso: string, fuso: string): Relogio {
  const fixo = lerDataHora(iso, fuso);
  return () => fixo;
}
