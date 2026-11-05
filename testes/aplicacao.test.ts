import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { criarDependencias } from '../src/aplicacao.js';
import { paraIso } from '../src/tempo.js';

const PASTA = fileURLToPath(new URL('../dados-demo', import.meta.url));
const BASE = { fuso: 'America/Sao_Paulo', importantes: [], agora: '2026-11-04T10:30' };

describe('criarDependencias (AD1 e AD4)', () => {
  it('o modo google ainda é recusado', () => {
    expect(() => criarDependencias({ ...BASE, modo: 'google' }, PASTA)).toThrow(
      'O modo google ainda não está disponível nesta versão. Use COWORKIA_MODO=demo.',
    );
  });

  it('com o agora fixo, o relógio devolve sempre o mesmo instante', () => {
    const dep = criarDependencias({ ...BASE, modo: 'demo' }, PASTA);
    expect(paraIso(dep.relogio())).toBe('2026-11-04T10:30:00-03:00');
    expect(paraIso(dep.relogio())).toBe(paraIso(dep.relogio()));
  });
});
