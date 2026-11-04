import { describe, expect, it } from 'vitest';
import {
  comecaComTermo,
  contemTermo,
  normalizar,
  palavras,
  primeiroTermo,
} from '../../src/texto/normalizar.js';

describe('normalizar (N1, N2, N3)', () => {
  it('passa para minúscula e tira os acentos', () => {
    expect(normalizar('URGÊNCIA É Já')).toBe('urgencia e ja');
  });

  it('troca os endereços web por espaço', () => {
    const resultado = normalizar('veja https://exemplo.com/?id=1 e www.exemplo.com/a?b ok');
    expect(resultado).not.toContain('?');
    expect(resultado).not.toContain('exemplo');
    expect(resultado).toContain('ok');
  });
});

describe('palavras (N4)', () => {
  it('aceita hífen e apóstrofo no meio da palavra', () => {
    expect(palavras('Não-sei d’água, 2026!')).toEqual(['Não-sei', 'd’água', '2026']);
  });
});

describe('contemTermo (N5)', () => {
  it('casa palavra inteira', () => {
    expect(contemTermo(normalizar('É URGENTE!'), 'urgente')).toBe(true);
    expect(contemTermo(normalizar('Responda urgentemente'), 'urgente')).toBe(false);
  });

  it('casa expressão de várias palavras, com pontuação em volta', () => {
    expect(contemTermo(normalizar('Por favor, me avise.'), 'por favor')).toBe(true);
    expect(contemTermo(normalizar('O prazo é hoje.'), 'prazo é hoje')).toBe(true);
  });

  it('ignora acento no termo e no texto', () => {
    expect(contemTermo(normalizar('Urgencia'), 'urgência')).toBe(true);
  });
});

describe('comecaComTermo e primeiroTermo', () => {
  it('confere só o começo do texto', () => {
    expect(comecaComTermo(normalizar('Bom dia, Ana'), 'bom dia')).toBe(true);
    expect(comecaComTermo(normalizar('Ana, bom dia'), 'bom dia')).toBe(false);
  });

  it('devolve o primeiro termo da lista que casa, ou nulo', () => {
    expect(primeiroTermo(normalizar('Pode confirmar?'), ['aguardo', 'pode'])).toBe('pode');
    expect(primeiroTermo(normalizar('nada aqui'), ['aguardo'])).toBeNull();
  });
});
