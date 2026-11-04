import type { Evento } from '../dominio.js';
import { type Intervalo, lerDataHora } from '../tempo.js';

export function ehDiaInteiro(evento: Evento): boolean {
  return evento.inicio.data !== undefined;
}

/** D-b: o dia inteiro cobre [00:00 de start.date, 00:00 de end.date), no fuso. */
export function intervaloDoEvento(evento: Evento, fuso: string): Intervalo {
  const inicio = evento.inicio.data ?? evento.inicio.dataHora;
  const fim = evento.fim.data ?? evento.fim.dataHora;
  if (inicio === undefined || fim === undefined) {
    throw new Error(`evento ${evento.id} sem início ou sem fim`);
  }
  return { inicio: lerDataHora(inicio, fuso), fim: lerDataHora(fim, fuso) };
}

/** D-c e D-d: cancelado, livre e recusado não ocupam a agenda. */
export function bloqueiaAgenda(evento: Evento): boolean {
  if (evento.status === 'cancelled') {
    return false;
  }
  if (evento.transparencia === 'transparent') {
    return false;
  }
  return evento.minhaResposta !== 'declined';
}

/** D-a: a.inicio < b.fim e b.inicio < a.fim. */
export function conflitam(a: Intervalo, b: Intervalo): boolean {
  return a.inicio.toMillis() < b.fim.toMillis() && b.inicio.toMillis() < a.fim.toMillis();
}

export interface Disponibilidade {
  livre: boolean;
  conflitos: Evento[];
}

export function verificarDisponibilidade(
  pedido: Intervalo,
  eventos: readonly Evento[],
  fuso: string,
): Disponibilidade {
  if (pedido.fim.toMillis() <= pedido.inicio.toMillis()) {
    throw new Error('o fim precisa ser depois do início');
  }
  const conflitos = eventos.filter(
    (evento) => bloqueiaAgenda(evento) && conflitam(pedido, intervaloDoEvento(evento, fuso)),
  );
  return { livre: conflitos.length === 0, conflitos };
}

export function conflitosEntre(eventos: readonly Evento[], fuso: string): Array<[Evento, Evento]> {
  const ativos = eventos.filter(bloqueiaAgenda);
  const pares: Array<[Evento, Evento]> = [];
  for (let i = 0; i < ativos.length; i += 1) {
    for (let j = i + 1; j < ativos.length; j += 1) {
      const a = ativos[i];
      const b = ativos[j];
      if (
        a !== undefined &&
        b !== undefined &&
        conflitam(intervaloDoEvento(a, fuso), intervaloDoEvento(b, fuso))
      ) {
        pares.push([a, b]);
      }
    }
  }
  return pares;
}
