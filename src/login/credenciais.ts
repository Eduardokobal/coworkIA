import { parseEnv } from 'node:util';

export interface CredenciaisDoCliente {
  clientId: string;
  clientSecret: string;
}

/** S3 e AD14: o cliente OAuth de cada usuário vem do .env; nenhuma mensagem mostra um valor. */
export function credenciaisDoEnv(conteudo: string | null): CredenciaisDoCliente {
  if (conteudo === null) {
    throw new Error(
      'Não achei o arquivo .env na pasta do coworkIA. Copie o .env.example para .env e preencha o cliente OAuth do seu app no Google Cloud.',
    );
  }
  const valores = parseEnv(conteudo);
  const clientId = (valores.COWORKIA_GOOGLE_CLIENT_ID ?? '').trim();
  const clientSecret = (valores.COWORKIA_GOOGLE_CLIENT_SECRET ?? '').trim();
  const faltam = [
    clientId === '' ? 'COWORKIA_GOOGLE_CLIENT_ID' : null,
    clientSecret === '' ? 'COWORKIA_GOOGLE_CLIENT_SECRET' : null,
  ].filter((nome) => nome !== null);
  if (faltam.length > 0) {
    throw new Error(`Falta preencher no .env: ${faltam.join(' e ')}.`);
  }
  return { clientId, clientSecret };
}
