import type { OAuth2Client } from 'google-auth-library';
import { describe, expect, it } from 'vitest';
import { obterTokenDe } from '../../src/login/acesso.js';
import { type Cofre, criarCofre, type EntradaDoCofre } from '../../src/login/cofre.js';
import {
  fazerLogin,
  fazerLogout,
  type TokensDoLogin,
  type TrocarCodigo,
  trocarCodigoNoGoogle,
} from '../../src/login/login.js';

const GMAIL = 'https://www.googleapis.com/auth/gmail.readonly';
const AGENDA = 'https://www.googleapis.com/auth/calendar.readonly';
const CREDENCIAIS = { clientId: 'cliente-de-teste.apps.example', clientSecret: 'segredo-de-teste' };

/** Um cofre de mentira, em memória: os testes nunca tocam no cofre do sistema. */
function cofreDeMentira(): Cofre {
  let guardado: Uint8Array | null = null;
  const entrada: EntradaDoCofre = {
    setSecret: (segredo) => {
      guardado = Uint8Array.from(segredo);
    },
    getSecret: () => (guardado === null ? null : Array.from(guardado)),
    deleteCredential: () => {
      const havia = guardado !== null;
      guardado = null;
      return havia;
    },
  };
  return criarCofre(() => entrada);
}

interface Ensaio {
  login: Promise<void>;
  endereco: URL;
  mensagens: string[];
  trocas: Array<{ codigo: string; verificador: string; redirectUri: string }>;
  cofre: Cofre;
}

/** Sobe o login com o Google de mentira e espera o endereço aparecer no terminal. */
async function iniciar(tokens: TokensDoLogin, prazoMs = 10_000): Promise<Ensaio> {
  const mensagens: string[] = [];
  const trocas: Ensaio['trocas'] = [];
  const cofre = cofreDeMentira();
  let avisar: (texto: string) => void = () => {};
  const mostrado = new Promise<string>((resolver) => {
    avisar = resolver;
  });
  const trocarCodigo: TrocarCodigo = async (_cliente, codigo, verificador, redirectUri) => {
    trocas.push({ codigo, verificador, redirectUri });
    return tokens;
  };
  const login = fazerLogin({
    credenciais: CREDENCIAIS,
    cofre,
    mostrar: (texto) => {
      mensagens.push(texto);
      avisar(texto);
    },
    trocarCodigo,
    prazoMs,
  });
  login.catch(() => {});
  const primeira = await mostrado;
  const endereco = new URL(primeira.slice(primeira.indexOf('https://')));
  return { login, endereco, mensagens, trocas, cofre };
}

/** O navegador volta para o endereço de retorno, só em 127.0.0.1. */
async function voltar(endereco: URL, parametros: Record<string, string>, caminho = '/') {
  const retorno = new URL(endereco.searchParams.get('redirect_uri') ?? '');
  retorno.pathname = caminho;
  for (const [nome, valor] of Object.entries(parametros)) {
    retorno.searchParams.set(nome, valor);
  }
  return fetch(retorno);
}

describe('fazerLogin (S1, S3 e S4)', () => {
  it('monta o endereço com PKCE S256, state, acesso offline e os dois escopos', async () => {
    const ensaio = await iniciar({ refresh_token: 'rt-de-teste', scope: `${GMAIL} ${AGENDA}` });
    const p = ensaio.endereco.searchParams;
    expect(ensaio.endereco.origin).toBe('https://accounts.google.com');
    expect(p.get('response_type')).toBe('code');
    expect(p.get('client_id')).toBe(CREDENCIAIS.clientId);
    expect(p.get('redirect_uri')).toMatch(/^http:\/\/127\.0\.0\.1:\d+$/);
    expect(p.get('scope')).toBe(`${GMAIL} ${AGENDA}`);
    expect(p.get('access_type')).toBe('offline');
    expect(p.get('prompt')).toBe('consent');
    expect(p.get('code_challenge_method')).toBe('S256');
    expect(p.get('code_challenge')).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(p.get('state')).toMatch(/^[0-9a-f]{32}$/);
    expect(ensaio.endereco.toString()).not.toContain(CREDENCIAIS.clientSecret);
    await voltar(ensaio.endereco, { state: p.get('state') ?? '', code: 'codigo-de-teste' });
    await ensaio.login;
  });

  it('cada login tem um state e um code_challenge novos', async () => {
    const tokens = { refresh_token: 'rt-de-teste', scope: `${GMAIL} ${AGENDA}` };
    const primeiro = await iniciar(tokens);
    const segundo = await iniciar(tokens);
    const de = (ensaio: Ensaio, nome: string) => ensaio.endereco.searchParams.get(nome) ?? '';
    expect(de(primeiro, 'state')).not.toBe(de(segundo, 'state'));
    expect(de(primeiro, 'code_challenge')).not.toBe(de(segundo, 'code_challenge'));
    for (const ensaio of [primeiro, segundo]) {
      await voltar(ensaio.endereco, { state: de(ensaio, 'state'), code: 'codigo-de-teste' });
      await ensaio.login;
    }
  });

  it('com o state certo, troca o código e guarda o token, sem mostrar segredo', async () => {
    const ensaio = await iniciar({ refresh_token: 'rt-de-teste', scope: `${GMAIL} ${AGENDA}` });
    const estado = ensaio.endereco.searchParams.get('state') ?? '';
    const resposta = await voltar(ensaio.endereco, { state: estado, code: 'codigo-de-teste' });
    expect(await resposta.text()).toContain('Login recebido');
    await ensaio.login;
    expect(ensaio.trocas).toHaveLength(1);
    expect(ensaio.trocas[0]?.codigo).toBe('codigo-de-teste');
    expect(ensaio.trocas[0]?.verificador.length).toBeGreaterThanOrEqual(43);
    expect(ensaio.trocas[0]?.redirectUri).toBe(ensaio.endereco.searchParams.get('redirect_uri'));
    expect(ensaio.cofre.ler()).toBe('rt-de-teste');
    expect(ensaio.mensagens.at(-1)).toContain('Login feito');
    for (const texto of ensaio.mensagens) {
      expect(texto).not.toContain('codigo-de-teste');
      expect(texto).not.toContain('rt-de-teste');
      expect(texto).not.toContain(CREDENCIAIS.clientSecret);
    }
  });

  it('um pedido fora da raiz não encerra a espera', async () => {
    const ensaio = await iniciar({ refresh_token: 'rt-de-teste', scope: `${GMAIL} ${AGENDA}` });
    expect((await voltar(ensaio.endereco, {}, '/favicon.ico')).status).toBe(404);
    const estado = ensaio.endereco.searchParams.get('state') ?? '';
    await voltar(ensaio.endereco, { state: estado, code: 'codigo-de-teste' });
    await ensaio.login;
    expect(ensaio.cofre.ler()).toBe('rt-de-teste');
  });

  it('com o state errado, recusa sem trocar o código', async () => {
    const ensaio = await iniciar({ refresh_token: 'rt-de-teste', scope: `${GMAIL} ${AGENDA}` });
    const resposta = await voltar(ensaio.endereco, { state: 'outro', code: 'codigo-de-teste' });
    expect(await resposta.text()).toContain('não deu certo');
    await expect(ensaio.login).rejects.toThrow('o state não confere');
    expect(ensaio.trocas).toHaveLength(0);
    expect(ensaio.cofre.ler()).toBeNull();
  });

  it('quando o Google recusa, não troca nada', async () => {
    const ensaio = await iniciar({ refresh_token: 'rt-de-teste', scope: `${GMAIL} ${AGENDA}` });
    const estado = ensaio.endereco.searchParams.get('state') ?? '';
    await voltar(ensaio.endereco, { state: estado, error: 'access_denied' });
    await expect(ensaio.login).rejects.toThrow('o Google recusou');
    expect(ensaio.trocas).toHaveLength(0);
  });

  it('sem um dos escopos, não guarda o token (S1)', async () => {
    const ensaio = await iniciar({ refresh_token: 'rt-de-teste', scope: GMAIL });
    const estado = ensaio.endereco.searchParams.get('state') ?? '';
    await voltar(ensaio.endereco, { state: estado, code: 'codigo-de-teste' });
    await expect(ensaio.login).rejects.toThrow(`faltou permitir ${AGENDA}`);
    expect(ensaio.cofre.ler()).toBeNull();
  });

  it('sem o refresh token, não guarda nada', async () => {
    const ensaio = await iniciar({ scope: `${GMAIL} ${AGENDA}` });
    const estado = ensaio.endereco.searchParams.get('state') ?? '';
    await voltar(ensaio.endereco, { state: estado, code: 'codigo-de-teste' });
    await expect(ensaio.login).rejects.toThrow('não devolveu o token de atualização');
    expect(ensaio.cofre.ler()).toBeNull();
  });

  it('desiste no fim do prazo e fecha a porta', async () => {
    const ensaio = await iniciar({ refresh_token: 'rt-de-teste', scope: `${GMAIL} ${AGENDA}` }, 50);
    await expect(ensaio.login).rejects.toThrow('não terminou no prazo');
    await expect(voltar(ensaio.endereco, { state: 'x', code: 'y' })).rejects.toThrow();
  });
});

describe('trocarCodigoNoGoogle (S3 e S5)', () => {
  it('devolve os tokens da biblioteca', async () => {
    const cliente = {
      getToken: async () => ({ tokens: { refresh_token: 'rt', scope: GMAIL } }),
    } as unknown as OAuth2Client;
    expect(await trocarCodigoNoGoogle(cliente, 'c', 'v', 'http://127.0.0.1:1')).toEqual({
      refresh_token: 'rt',
      scope: GMAIL,
    });
  });

  it('num erro, não repete o código nem a resposta do Google', async () => {
    const cliente = {
      getToken: async () => {
        throw new Error('invalid_grant para o código codigo-secreto');
      },
    } as unknown as OAuth2Client;
    const falha = trocarCodigoNoGoogle(cliente, 'codigo-secreto', 'v', 'http://127.0.0.1:1');
    await expect(falha).rejects.toThrow('O Google não aceitou o código de autorização.');
    await expect(falha).rejects.not.toThrow('codigo-secreto');
  });
});

describe('fazerLogout (S4)', () => {
  it('apaga o token e diz quando não havia', () => {
    const cofre = cofreDeMentira();
    const mensagens: string[] = [];
    cofre.guardar('rt-de-teste');
    fazerLogout(cofre, (texto) => mensagens.push(texto));
    fazerLogout(cofre, (texto) => mensagens.push(texto));
    expect(mensagens).toEqual(['O token foi apagado do cofre.', 'Não havia token no cofre.']);
    expect(cofre.ler()).toBeNull();
  });
});

describe('obterTokenDe (S4 e S5)', () => {
  it('devolve o token de acesso', async () => {
    expect(await obterTokenDe({ getAccessToken: async () => ({ token: 'ya-de-teste' }) })()).toBe(
      'ya-de-teste',
    );
  });

  it('sem token, ou com erro, pede um novo login sem repetir a resposta', async () => {
    const vazio = obterTokenDe({ getAccessToken: async () => ({ token: null }) });
    await expect(vazio()).rejects.toThrow('Rode npm run login-google de novo.');
    const quebrado = obterTokenDe({
      getAccessToken: async () => {
        throw new Error('invalid_grant com rt-secreto');
      },
    });
    await expect(quebrado()).rejects.toThrow('o login vale 7 dias');
    await expect(quebrado()).rejects.not.toThrow('rt-secreto');
  });
});
