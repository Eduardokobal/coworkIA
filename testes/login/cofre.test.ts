import { describe, expect, it } from 'vitest';
import {
  CONTA_DO_COFRE,
  criarCofre,
  type EntradaDoCofre,
  LIMITE_DO_COFRE,
  SERVICO_DO_COFRE,
} from '../../src/login/cofre.js';

/** Um cofre de mentira, em memória: os testes nunca tocam no cofre do sistema. */
function cofreDeMentira() {
  const guardados = new Map<string, Uint8Array>();
  const abertos: string[] = [];
  const abrir = (servico: string, conta: string): EntradaDoCofre => {
    const chave = `${servico}/${conta}`;
    abertos.push(chave);
    return {
      setSecret: (segredo) => {
        guardados.set(chave, Uint8Array.from(segredo));
      },
      getSecret: () => {
        const segredo = guardados.get(chave);
        return segredo === undefined ? null : Array.from(segredo);
      },
      deleteCredential: () => guardados.delete(chave),
    };
  };
  return { cofre: criarCofre(abrir), guardados, abertos };
}

describe('criarCofre (S4 e AD15)', () => {
  it('guarda, lê e apaga o token na entrada coworkia/google-refresh-token', () => {
    const { cofre, guardados, abertos } = cofreDeMentira();
    expect(cofre.ler()).toBeNull();
    cofre.guardar('token-de-teste-çã');
    expect(cofre.ler()).toBe('token-de-teste-çã');
    expect(abertos.every((chave) => chave === `${SERVICO_DO_COFRE}/${CONTA_DO_COFRE}`)).toBe(true);
    expect(SERVICO_DO_COFRE).toBe('coworkia');
    expect(CONTA_DO_COFRE).toBe('google-refresh-token');
    expect(guardados.get('coworkia/google-refresh-token')).toEqual(
      new TextEncoder().encode('token-de-teste-çã'),
    );
    expect(cofre.apagar()).toBe(true);
    expect(cofre.apagar()).toBe(false);
    expect(cofre.ler()).toBeNull();
  });

  it('aceita até 2.560 bytes e recusa 2.561, sem guardar e sem mostrar o token', () => {
    const { cofre, guardados } = cofreDeMentira();
    expect(LIMITE_DO_COFRE).toBe(2560);
    cofre.guardar('a'.repeat(2560));
    expect(cofre.ler()).toHaveLength(2560);
    cofre.apagar();
    const grande = `${'b'.repeat(2559)}ç`;
    expect(() => cofre.guardar(grande)).toThrow(
      'O token tem 2561 bytes, e o cofre do Windows aceita até 2560. O token não foi guardado.',
    );
    expect(guardados.size).toBe(0);
  });
});
