import type { Email, Evento } from '../../dominio.js';
import { conflitam, intervaloDoEvento } from '../../regras/disponibilidade.js';
import { lerDataHora } from '../../tempo.js';
import { filtrarEmails } from '../filtro.js';
import type { Fontes } from '../tipos.js';

export const ENDERECO_DEMO = 'voce@example.com';

export interface DadosDemo {
  emails: Email[];
  eventos: Evento[];
}

export function criarFontesDemo(dados: DadosDemo, fuso: string): Fontes {
  const instante = (email: Email) => lerDataHora(email.data, fuso).toMillis();
  const emails = [...dados.emails].sort((a, b) => instante(b) - instante(a));
  const inicio = (evento: Evento) => intervaloDoEvento(evento, fuso).inicio.toMillis();
  const eventos = [...dados.eventos].sort((a, b) => inicio(a) - inicio(b));
  return {
    email: {
      enderecoDoUsuario: async () => ENDERECO_DEMO,
      listar: async (filtro) => filtrarEmails(emails, filtro, fuso),
      ler: async (id) => emails.find((email) => email.id === id) ?? null,
    },
    agenda: {
      listar: async (intervalo) =>
        eventos.filter((evento) => conflitam(intervaloDoEvento(evento, fuso), intervalo)),
    },
  };
}
