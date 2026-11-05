import { OAuth2Client } from 'google-auth-library';
import type { CredenciaisDoCliente } from './credenciais.js';

/** O que o coworkIA usa do OAuth2Client para pedir um token de acesso. */
export interface ClienteDeAcesso {
  getAccessToken(): Promise<{ token?: string | null | undefined }>;
}

/** S4: o token de acesso é pedido de novo a cada sessão; o erro nunca traz o token nem a resposta. */
export function obterTokenDe(cliente: ClienteDeAcesso): () => Promise<string> {
  return async () => {
    let token: string | null | undefined;
    try {
      ({ token } = await cliente.getAccessToken());
    } catch {
      token = null;
    }
    if (token === null || token === undefined || token === '') {
      throw new Error(
        'O Google não renovou o acesso. Com o app em teste, o login vale 7 dias. Rode npm run login-google de novo.',
      );
    }
    return token;
  };
}

/** S3: o cliente OAuth do usuário, com o refresh token do cofre. */
export function criarAcessoAoGoogle(
  credenciais: CredenciaisDoCliente,
  refreshToken: string,
): () => Promise<string> {
  const cliente = new OAuth2Client({
    clientId: credenciais.clientId,
    clientSecret: credenciais.clientSecret,
  });
  cliente.setCredentials({ refresh_token: refreshToken });
  return obterTokenDe(cliente);
}
