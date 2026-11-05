import { describe, expect, it } from 'vitest';
import { conferirEscopos, ESCOPOS } from '../../src/login/escopos.js';

const GMAIL = 'https://www.googleapis.com/auth/gmail.readonly';
const AGENDA = 'https://www.googleapis.com/auth/calendar.readonly';

describe('conferirEscopos (S1)', () => {
  it('pede só a leitura do Gmail e da Agenda', () => {
    expect(ESCOPOS).toEqual([GMAIL, AGENDA]);
  });

  it('aceita os dois escopos, em qualquer ordem', () => {
    expect(conferirEscopos(`${AGENDA} ${GMAIL}`)).toBeNull();
  });

  it('recusa quando falta um escopo, dizendo qual', () => {
    expect(conferirEscopos(GMAIL)).toBe(
      `O login não foi aceito: faltou permitir ${AGENDA}. Rode npm run login-google de novo e permita só a leitura do Gmail e da Agenda.`,
    );
  });

  it('recusa quando vem um escopo a mais, dizendo qual', () => {
    expect(conferirEscopos(`${GMAIL} ${AGENDA} https://mail.google.com/`)).toContain(
      'veio a mais https://mail.google.com/',
    );
  });

  it('recusa quando o campo de escopos não vem', () => {
    expect(conferirEscopos(undefined)).toContain(`faltou permitir ${GMAIL} e ${AGENDA}`);
  });
});
