import { describe, expect, it } from 'vitest';
import { semCitacao } from '../../src/texto/citacao.js';

describe('semCitacao', () => {
  it('tira as linhas que começam com >', () => {
    expect(semCitacao('Oi\n> urgente\n  >> antigo\nTchau')).toBe('Oi\nTchau');
  });

  it('corta tudo a partir do "Em …, … escreveu:"', () => {
    const texto =
      'Ok, obrigado.\n\nEm qua., 4 de nov. de 2026 às 10:00, Ana <ana@example.com> escreveu:\nurgente até 05/11';
    expect(semCitacao(texto)).toBe('Ok, obrigado.\n');
  });

  it('corta tudo a partir do "On …, … wrote:"', () => {
    const texto = 'Thanks.\nOn Wed, Nov 4, 2026 at 10:00 AM, Ana <ana@example.com> wrote:\nurgent';
    expect(semCitacao(texto)).toBe('Thanks.');
  });

  it('mantém um texto sem citação', () => {
    expect(semCitacao('Linha 1\nLinha 2')).toBe('Linha 1\nLinha 2');
  });
});
