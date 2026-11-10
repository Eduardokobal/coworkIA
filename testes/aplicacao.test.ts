import { randomBytes } from 'node:crypto';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it, vi } from 'vitest';
import { criarDependencias, type RecursosDoGoogle } from '../src/aplicacao.js';
import type { Buscar } from '../src/fontes/google/fonte-google.js';
import type { CredenciaisDoCliente } from '../src/login/credenciais.js';
import {
  SEM_EU_DO_WHATSAPP,
  SEM_PASTA_DAS_FINANCAS,
  SEM_PASTA_DO_WHATSAPP,
} from '../src/servico.js';
import { paraIso } from '../src/tempo.js';

// O randomBytes passa a ser observado, para o teste saber o tamanho da chave secreta (O10).
vi.mock('node:crypto', async (original) => {
  const crypto = await original<typeof import('node:crypto')>();
  return { ...crypto, randomBytes: vi.fn(crypto.randomBytes) };
});

const PASTA = fileURLToPath(new URL('../dados-demo', import.meta.url));
const BASE = {
  fuso: 'America/Sao_Paulo',
  importantes: [],
  agora: '2026-11-04T10:30',
  whatsappPasta: null,
  whatsappEu: [],
  whatsappImportantes: [],
  financasPasta: null,
  financasCategorias: '',
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

describe('as finanças nas dependências (versão 2, parte 2, E1, G3 e F-D7)', () => {
  it('no modo demo, usa os extratos da demonstração e a variável das categorias', async () => {
    const config = { ...BASE, modo: 'demo' as const, financasCategorias: 'academia=SMART FIT' };
    const financas = criarDependencias(config, PASTA, GOOGLE_PROIBIDO).financas;
    if (typeof financas !== 'object') {
      throw new Error('o modo demo ficou sem as finanças');
    }
    expect(financas.categorias).toBe('academia=SMART FIT');
    expect((await financas.fonte.extratos()).contas).toHaveLength(3);
  });

  it('no modo google, sem a pasta, diz o que falta', () => {
    const { recursos } = googleDeMentira(ENV, 'rt-de-teste');
    const google = { ...BASE, modo: 'google' as const };
    expect(criarDependencias(google, PASTA, recursos).financas).toBe(SEM_PASTA_DAS_FINANCAS);
  });

  it('no modo google, lê a pasta configurada, sem trocar os modelos da demonstração', async () => {
    const { recursos } = googleDeMentira(ENV, 'rt-de-teste');
    const config = { ...BASE, modo: 'google' as const, financasPasta: join(PASTA, 'financas') };
    const financas = criarDependencias(config, PASTA, recursos).financas;
    if (typeof financas !== 'object') {
      throw new Error('o modo google ficou sem as finanças');
    }
    const { lancamentos, avisos } = await financas.fonte.extratos();
    expect(lancamentos).toEqual([]);
    expect(avisos.length).toBeGreaterThan(0);
  });

  it('cada servidor tem a sua chave secreta, e o id da mesma conta muda (F-D7)', async () => {
    const config = { ...BASE, modo: 'demo' as const };
    const ids = async () => {
      const financas = criarDependencias(config, PASTA, GOOGLE_PROIBIDO).financas;
      if (typeof financas !== 'object') {
        throw new Error('o modo demo ficou sem as finanças');
      }
      return (await financas.fonte.extratos()).contas.map((conta) => conta.id);
    };
    const [primeiro, segundo] = [await ids(), await ids()];
    expect(primeiro).toHaveLength(3);
    expect(primeiro.some((id, indice) => id === segundo[indice])).toBe(false);
  });

  it('a chave secreta tem 32 bytes (O10)', () => {
    vi.mocked(randomBytes).mockClear();
    criarDependencias({ ...BASE, modo: 'demo' as const }, PASTA, GOOGLE_PROIBIDO);
    expect(vi.mocked(randomBytes).mock.calls).toEqual([[32]]);
  });
});
