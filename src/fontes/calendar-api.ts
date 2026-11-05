import { z } from 'zod';
import type { Evento, MomentoDoEvento } from '../dominio.js';

const esquemaMomento = z
  .object({ date: z.string().optional(), dateTime: z.string().optional() })
  .refine((momento) => momento.date !== undefined || momento.dateTime !== undefined, {
    message: 'o início e o fim precisam de date ou dateTime',
  });

/** Seção 10: o evento como a Calendar API devolve, só com os campos que o coworkIA usa. */
export const esquemaEventoDaApi = z.object({
  id: z.string(),
  status: z.enum(['confirmed', 'tentative', 'cancelled']).optional(),
  summary: z.string().optional(),
  description: z.string().optional(),
  location: z.string().optional(),
  organizer: z
    .object({ email: z.string().optional(), displayName: z.string().optional() })
    .optional(),
  start: esquemaMomento,
  end: esquemaMomento,
  transparency: z.enum(['opaque', 'transparent']).optional(),
  attendees: z
    .array(
      z.object({
        email: z.string().optional(),
        self: z.boolean().optional(),
        responseStatus: z.enum(['needsAction', 'declined', 'tentative', 'accepted']),
      }),
    )
    .optional(),
});

export type EventoDaApi = z.infer<typeof esquemaEventoDaApi>;

function momento(bruto: EventoDaApi['start']): MomentoDoEvento {
  return bruto.date !== undefined ? { data: bruto.date } : { dataHora: bruto.dateTime };
}

/** D-c: a minha resposta é a do participante com `self: true`; sem ele, o usuário não é convidado. */
export function eventoDaApi(bruto: EventoDaApi): Evento {
  const eu = bruto.attendees?.find((participante) => participante.self === true);
  return {
    id: bruto.id,
    titulo: bruto.summary ?? '',
    descricao: bruto.description ?? '',
    local: bruto.location ?? '',
    organizador:
      bruto.organizer === undefined
        ? null
        : { nome: bruto.organizer.displayName ?? '', endereco: bruto.organizer.email ?? '' },
    status: bruto.status ?? 'confirmed',
    inicio: momento(bruto.start),
    fim: momento(bruto.end),
    transparencia: bruto.transparency ?? 'opaque',
    minhaResposta: eu?.responseStatus ?? null,
  };
}
