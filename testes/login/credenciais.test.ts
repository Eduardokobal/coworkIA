import { describe, expect, it } from 'vitest';
import { credenciaisDoEnv } from '../../src/login/credenciais.js';

describe('credenciaisDoEnv (S3 e AD14)', () => {
  it('lê o client id e o client secret do .env', () => {
    expect(
      credenciaisDoEnv(
        '# comentário\nCOWORKIA_GOOGLE_CLIENT_ID=123.apps.example\nCOWORKIA_GOOGLE_CLIENT_SECRET="segredo de teste"\n',
      ),
    ).toEqual({ clientId: '123.apps.example', clientSecret: 'segredo de teste' });
  });

  it('sem o arquivo, explica como criar', () => {
    expect(() => credenciaisDoEnv(null)).toThrow('Copie o .env.example para .env');
  });

  it('com um valor vazio, diz o nome que falta e nunca mostra o outro valor', () => {
    let mensagem = '';
    try {
      credenciaisDoEnv(
        'COWORKIA_GOOGLE_CLIENT_ID=\nCOWORKIA_GOOGLE_CLIENT_SECRET=segredo-de-teste\n',
      );
    } catch (erro) {
      mensagem = erro instanceof Error ? erro.message : '';
    }
    expect(mensagem).toBe('Falta preencher no .env: COWORKIA_GOOGLE_CLIENT_ID.');
    expect(mensagem).not.toContain('segredo-de-teste');
  });

  it('sem nenhuma das duas variáveis, diz as duas', () => {
    expect(() => credenciaisDoEnv('OUTRA=1\n')).toThrow(
      'Falta preencher no .env: COWORKIA_GOOGLE_CLIENT_ID e COWORKIA_GOOGLE_CLIENT_SECRET.',
    );
  });
});
