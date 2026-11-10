import type { Fontes } from './tipos.js';

/** MA3: a mensagem fixa das ferramentas de e-mail e agenda no modo arquivos. */
export const EMAIL_E_AGENDA_DESLIGADOS =
  'O e-mail e a agenda não estão ligados no modo arquivos. Use o modo google para lê-los.';

/** MA3 e MA4: as ferramentas mostram a mensagem, e o resumo do dia a põe no lugar do e-mail e da agenda. */
export class EmailEAgendaDesligados extends Error {
  constructor() {
    super(EMAIL_E_AGENDA_DESLIGADOS);
    this.name = 'EmailEAgendaDesligados';
  }
}

/** MA2 e MA3: as fontes do modo arquivos, que nunca leem nada nem chamam a rede. */
export function fontesDesligadas(): Fontes {
  const desligada = async (): Promise<never> => {
    throw new EmailEAgendaDesligados();
  };
  return {
    email: { enderecoDoUsuario: desligada, listar: desligada, ler: desligada },
    agenda: { listar: desligada },
  };
}
