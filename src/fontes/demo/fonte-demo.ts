import type { Email, Evento } from '../../dominio.js';
import { conflitam, intervaloDoEvento } from '../../regras/disponibilidade.js';
import { lerDataHora } from '../../tempo.js';
import { htmlParaTexto } from '../../texto/html.js';
import { normalizar } from '../../texto/normalizar.js';
import type { FiltroEmails, Fontes, PaginaDeEmails } from '../tipos.js';

export const ENDERECO_DEMO = 'voce@example.com';

export interface DadosDemo {
  emails: Email[];
  eventos: Evento[];
}

function textoDoEmail(email: Email): string {
  if (email.corpoTexto !== null) {
    return email.corpoTexto;
  }
  return email.corpoHtml === null ? '' : htmlParaTexto(email.corpoHtml, { cortarCitacao: false });
}

/** 7.1 e AD7: os filtros, sobre e-mails já em ordem do mais novo para o mais velho. */
export function filtrarEmails(
  emails: readonly Email[],
  filtro: FiltroEmails,
  fuso: string,
): PaginaDeEmails {
  const remetente = (filtro.remetente ?? '').trim().toLowerCase();
  const busca = normalizar(filtro.busca ?? '').trim();
  const filtrados = emails.filter((email) => {
    const instante = lerDataHora(email.data, fuso).toMillis();
    if (filtro.naoLidos === true && email.lido) {
      return false;
    }
    if (filtro.desde !== undefined && instante < filtro.desde.toMillis()) {
      return false;
    }
    if (filtro.ate !== undefined && instante >= filtro.ate.toMillis()) {
      return false;
    }
    const pessoa = `${email.de.nome} ${email.de.endereco}`.toLowerCase();
    if (remetente !== '' && !pessoa.includes(remetente)) {
      return false;
    }
    return busca === '' || normalizar(`${email.assunto}\n${textoDoEmail(email)}`).includes(busca);
  });
  return {
    emails: filtrados.slice(0, filtro.limite),
    completo: filtrados.length <= filtro.limite,
  };
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
