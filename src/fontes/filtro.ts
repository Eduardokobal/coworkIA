import type { Email } from '../dominio.js';
import { lerDataHora } from '../tempo.js';
import { htmlParaTexto } from '../texto/html.js';
import { normalizar } from '../texto/normalizar.js';
import type { FiltroEmails, PaginaDeEmails } from './tipos.js';

function textoDoEmail(email: Email): string {
  if (email.corpoTexto !== null) {
    return email.corpoTexto;
  }
  return email.corpoHtml === null ? '' : htmlParaTexto(email.corpoHtml, { cortarCitacao: false });
}

/** 7.1 e AD7: diz se um e-mail passa nos filtros; as duas fontes usam a mesma regra (AD11). */
export function casaComFiltro(email: Email, filtro: FiltroEmails, fuso: string): boolean {
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
  const remetente = (filtro.remetente ?? '').trim().toLowerCase();
  const pessoa = `${email.de.nome} ${email.de.endereco}`.toLowerCase();
  if (remetente !== '' && !pessoa.includes(remetente)) {
    return false;
  }
  const busca = normalizar(filtro.busca ?? '').trim();
  return busca === '' || normalizar(`${email.assunto}\n${textoDoEmail(email)}`).includes(busca);
}

/** 7.1 e AD7: os filtros, sobre e-mails já em ordem do mais novo para o mais velho. */
export function filtrarEmails(
  emails: readonly Email[],
  filtro: FiltroEmails,
  fuso: string,
): PaginaDeEmails {
  const filtrados = emails.filter((email) => casaComFiltro(email, filtro, fuso));
  return {
    emails: filtrados.slice(0, filtro.limite),
    completo: filtrados.length <= filtro.limite,
  };
}
