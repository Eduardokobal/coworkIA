import { randomBytes } from 'node:crypto';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { CodeChallengeMethod, OAuth2Client } from 'google-auth-library';
import type { Cofre } from './cofre.js';
import type { CredenciaisDoCliente } from './credenciais.js';
import { conferirEscopos, ESCOPOS } from './escopos.js';

/** AD15: o retorno do navegador espera no máximo 5 minutos. */
export const PRAZO_DO_LOGIN_MS = 5 * 60 * 1000;

const PAGINA_OK =
  '<!doctype html><meta charset="utf-8"><title>coworkIA</title><p>Login recebido. Pode fechar esta aba e voltar ao terminal.</p>';
const PAGINA_ERRO =
  '<!doctype html><meta charset="utf-8"><title>coworkIA</title><p>O login não deu certo. Volte ao terminal para ver o motivo.</p>';

export interface TokensDoLogin {
  refresh_token?: string | null | undefined;
  scope?: string | undefined;
}

export type TrocarCodigo = (
  cliente: OAuth2Client,
  codigo: string,
  verificador: string,
  redirectUri: string,
) => Promise<TokensDoLogin>;

/** S3: a troca usa a google-auth-library; a mensagem de erro nunca traz o código nem a resposta. */
export const trocarCodigoNoGoogle: TrocarCodigo = async (
  cliente,
  codigo,
  verificador,
  redirectUri,
) => {
  try {
    const { tokens } = await cliente.getToken({
      code: codigo,
      codeVerifier: verificador,
      redirect_uri: redirectUri,
    });
    return tokens;
  } catch {
    throw new Error(
      'O Google não aceitou o código de autorização. Rode npm run login-google de novo.',
    );
  }
};

/** S3: atende uma única volta, confere o state e responde uma página simples. */
export function esperarRetorno(servidor: Server, estado: string, prazoMs: number): Promise<string> {
  return new Promise((resolver, rejeitar) => {
    const tempo = setTimeout(() => {
      rejeitar(new Error('O login não terminou no prazo. Rode npm run login-google de novo.'));
    }, prazoMs);
    servidor.on('request', (pedido, resposta) => {
      const url = new URL(pedido.url ?? '/', 'http://127.0.0.1');
      if (url.pathname !== '/') {
        resposta.writeHead(404).end();
        return;
      }
      clearTimeout(tempo);
      const codigo = url.searchParams.get('code');
      const valido =
        url.searchParams.get('error') === null &&
        codigo !== null &&
        url.searchParams.get('state') === estado;
      resposta.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
      resposta.end(valido ? PAGINA_OK : PAGINA_ERRO);
      if (valido) {
        resolver(codigo);
      } else {
        rejeitar(
          new Error(
            'O retorno do login não foi aceito: o Google recusou ou o state não confere. Rode npm run login-google de novo.',
          ),
        );
      }
    });
  });
}

/** S1 e S4: confere os escopos e o token antes de guardar. */
export function guardarToken(tokens: TokensDoLogin, cofre: Cofre): void {
  const problema = conferirEscopos(tokens.scope);
  if (problema !== null) {
    throw new Error(problema);
  }
  const token = tokens.refresh_token ?? '';
  if (token === '') {
    throw new Error(
      'O Google não devolveu o token de atualização. Rode npm run login-google de novo.',
    );
  }
  cofre.guardar(token);
}

export interface DependenciasDoLogin {
  credenciais: CredenciaisDoCliente;
  cofre: Cofre;
  mostrar: (texto: string) => void;
  trocarCodigo?: TrocarCodigo;
  prazoMs?: number;
}

/** S3: PKCE (S256), state aleatório e retorno em http://127.0.0.1, numa porta livre. */
export async function fazerLogin(dep: DependenciasDoLogin): Promise<void> {
  const servidor = createServer();
  await new Promise<void>((resolver) => {
    servidor.listen(0, '127.0.0.1', resolver);
  });
  try {
    const { address, port } = servidor.address() as AddressInfo;
    const redirectUri = `http://${address}:${port}`;
    const cliente = new OAuth2Client({
      clientId: dep.credenciais.clientId,
      clientSecret: dep.credenciais.clientSecret,
      redirectUri,
    });
    const { codeVerifier, codeChallenge } = await cliente.generateCodeVerifierAsync();
    const estado = randomBytes(16).toString('hex');
    const endereco = cliente.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: [...ESCOPOS],
      code_challenge_method: CodeChallengeMethod.S256,
      code_challenge: codeChallenge ?? '',
      state: estado,
    });
    dep.mostrar(
      `Abra este endereço no navegador e permita a leitura do Gmail e da Agenda:\n${endereco}`,
    );
    const codigo = await esperarRetorno(servidor, estado, dep.prazoMs ?? PRAZO_DO_LOGIN_MS);
    const trocar = dep.trocarCodigo ?? trocarCodigoNoGoogle;
    guardarToken(await trocar(cliente, codigo, codeVerifier, redirectUri), dep.cofre);
    dep.mostrar(
      'Login feito. O token está no cofre do sistema. Para usar o Gmail, defina COWORKIA_MODO=google.',
    );
  } finally {
    servidor.close();
  }
}

/** S4: o logout apaga o token do cofre. */
export function fazerLogout(cofre: Cofre, mostrar: (texto: string) => void): void {
  mostrar(cofre.apagar() ? 'O token foi apagado do cofre.' : 'Não havia token no cofre.');
}
