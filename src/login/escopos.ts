/** S1: só leitura do Gmail e da Agenda. */
export const ESCOPOS = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/calendar.readonly',
] as const;

/** S1: o token tem de voltar com os dois escopos, nem mais nem menos; devolve o problema ou nulo. */
export function conferirEscopos(concedidos: string | undefined): string | null {
  const lista = new Set((concedidos ?? '').split(' ').filter((escopo) => escopo !== ''));
  const pedidos: readonly string[] = ESCOPOS;
  const faltam = pedidos.filter((escopo) => !lista.has(escopo));
  const sobram = [...lista].filter((escopo) => !pedidos.includes(escopo));
  if (faltam.length === 0 && sobram.length === 0) {
    return null;
  }
  const partes: string[] = [];
  if (faltam.length > 0) {
    partes.push(`faltou permitir ${faltam.join(' e ')}`);
  }
  if (sobram.length > 0) {
    partes.push(`veio a mais ${sobram.join(' e ')}`);
  }
  return `O login não foi aceito: ${partes.join('; ')}. Rode npm run login-google de novo e permita só a leitura do Gmail e da Agenda.`;
}
