import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { criarDependencias, type RecursosDoGoogle } from '../src/aplicacao.js';
import type { Buscar } from '../src/fontes/google/fonte-google.js';
import type { CredenciaisDoCliente } from '../src/login/credenciais.js';
import { SEM_EU_DO_WHATSAPP, SEM_PASTA_DO_WHATSAPP } from '../src/servico.js';
import { paraIso } from '../src/tempo.js';

const PASTA = fileURLToPath(new URL('../dados-demo', import.meta.url));
const BASE = {
  fuso: 'America/Sao_Paulo',
  importantes: [],
  agora: '2026-11-04T10:30',
  whatsappPasta: null,
  whatsappEu: [],
  whatsappImportantes: [],
};
const ENV =
  'COWORKIA_GOOGLE_CLIENT_ID=cliente-de-teste\nCOWORKIA_GOOGLE_CLIENT_SECRET=segredo-de-teste\n';

function proibido(o_que: string): never {
  throw new Error(`o modo demo ${o_que}`);
}

/** O modo demo não pode tocar em nada do Google. */
const GOOGLE_PROIBIDO: RecursosDoGoogle = {
  lerEnv: () => proibido('leu o .env'),
  cofre: {
    guardar: () => proibido('tocou no cofre'),
    ler: () => proibido('tocou no cofre'),
    apagar: () => proibido('tocou no cofre'),
  },
  buscar: async () => proibido('chamou a rede'),
  criarAcesso: () => proibido('pediu acesso ao Google'),
};

function googleDeMentira(env: string | null, token: string | null) {
  const acessos: Array<{ credenciais: CredenciaisDoCliente; refreshToken: string }> = [];
  const autorizacoes: string[] = [];
  const buscar: Buscar = async (_url, opcoes) => {
    autorizacoes.push(opcoes.headers.authorization ?? '');
    return { ok: true, status: 200, json: async () => ({ emailAddress: 'voce@gmail.example' }) };
  };
  const recursos: RecursosDoGoogle = {
    lerEnv: () => env,
    cofre: { guardar: () => {}, ler: () => token, apagar: () => false },
    buscar,
    criarAcesso: (credenciais, refreshToken) => {
      acessos.push({ credenciais, refreshToken });
      return async () => 'acesso-de-teste';
    },
  };
  return { recursos, acessos, autorizacoes };
}

describe('criarDependencias (AD1 e AD9)', () => {
  it('com o agora fixo, o relógio devolve sempre o mesmo instante, sem tocar no Google', () => {
    const dep = criarDependencias({ ...BASE, modo: 'demo' }, PASTA, GOOGLE_PROIBIDO);
    expect(paraIso(dep.relogio())).toBe('2026-11-04T10:30:00-03:00');
    expect(paraIso(dep.relogio())).toBe(paraIso(dep.relogio()));
  });

  it('o modo google sem o .env explica como criar', () => {
    const { recursos } = googleDeMentira(null, 'rt-de-teste');
    expect(() => criarDependencias({ ...BASE, modo: 'google' }, PASTA, recursos)).toThrow(
      'Copie o .env.example para .env',
    );
  });

  it('o modo google sem o login pede o login', () => {
    const { recursos } = googleDeMentira(ENV, null);
    expect(() => criarDependencias({ ...BASE, modo: 'google' }, PASTA, recursos)).toThrow(
      'Não há login do Google neste computador. Rode npm run login-google.',
    );
  });

  it('o modo google com o .env e o login usa as fontes do Google', async () => {
    const { recursos, acessos, autorizacoes } = googleDeMentira(ENV, 'rt-de-teste');
    const dep = criarDependencias({ ...BASE, modo: 'google' }, PASTA, recursos);
    expect(acessos).toEqual([
      {
        credenciais: { clientId: 'cliente-de-teste', clientSecret: 'segredo-de-teste' },
        refreshToken: 'rt-de-teste',
      },
    ]);
    expect(await dep.fontes.email.enderecoDoUsuario()).toBe('voce@gmail.example');
    expect(autorizacoes).toEqual(['Bearer acesso-de-teste']);
  });
});

describe('o WhatsApp nas dependências (versão 2, F1 e V2)', () => {
  it('no modo demo, usa as conversas e o usuário da demonstração, sem ler a variável', async () => {
    const config = { ...BASE, modo: 'demo' as const, whatsappEu: ['Outro'] };
    const whatsapp = criarDependencias(config, PASTA, GOOGLE_PROIBIDO).whatsapp;
    if (typeof whatsapp !== 'object') {
      throw new Error('o modo demo ficou sem o WhatsApp');
    }
    expect(whatsapp.eu).toEqual(['Lúcia Prado', 'Lúcia']);
    expect((await whatsapp.fonte.conversas()).conversas.length).toBe(8);
  });

  it('no modo google, sem a pasta ou sem o usuário, diz o que falta', () => {
    const { recursos } = googleDeMentira(ENV, 'rt-de-teste');
    const google = { ...BASE, modo: 'google' as const };
    expect(criarDependencias(google, PASTA, recursos).whatsapp).toBe(SEM_PASTA_DO_WHATSAPP);
    const semEu = { ...google, whatsappPasta: 'C:/conversas' };
    expect(criarDependencias(semEu, PASTA, recursos).whatsapp).toBe(SEM_EU_DO_WHATSAPP);
  });

  it('no modo google, lê a pasta configurada, sem trocar os modelos da demonstração', async () => {
    const { recursos } = googleDeMentira(ENV, 'rt-de-teste');
    const config = {
      ...BASE,
      modo: 'google' as const,
      whatsappPasta: join(PASTA, 'whatsapp'),
      whatsappEu: ['Eu'],
      whatsappImportantes: ['Marta Souza'],
    };
    const whatsapp = criarDependencias(config, PASTA, recursos).whatsapp;
    if (typeof whatsapp !== 'object') {
      throw new Error('o modo google ficou sem o WhatsApp');
    }
    expect(whatsapp).toMatchObject({ eu: ['Eu'], importantes: ['Marta Souza'] });
    const { conversas } = await whatsapp.fonte.conversas();
    expect(conversas.every((conversa) => conversa.formato === null)).toBe(true);
  });
});
