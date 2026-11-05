import { Entry } from '@napi-rs/keyring';

/** S4: o Windows aceita até 2.560 bytes num segredo (CRED_MAX_CREDENTIAL_BLOB_SIZE, medição M1). */
export const LIMITE_DO_COFRE = 2560;
/** AD15: o nome do serviço e da conta no cofre. */
export const SERVICO_DO_COFRE = 'coworkia';
export const CONTA_DO_COFRE = 'google-refresh-token';

/** O que o coworkIA usa de uma entrada do cofre; é a API síncrona do @napi-rs/keyring. */
export interface EntradaDoCofre {
  setSecret(segredo: Uint8Array): void;
  getSecret(): Array<number> | null;
  deleteCredential(): boolean;
}

export interface Cofre {
  guardar(token: string): void;
  ler(): string | null;
  apagar(): boolean;
}

export function tamanhoEmBytes(token: string): number {
  return new TextEncoder().encode(token).length;
}

/** S4: o refresh token fica no cofre em UTF-8, pelo setSecret (medição M1); nada vai para arquivo. */
export function criarCofre(
  abrir: (servico: string, conta: string) => EntradaDoCofre = (servico, conta) =>
    new Entry(servico, conta),
): Cofre {
  const entrada = () => abrir(SERVICO_DO_COFRE, CONTA_DO_COFRE);
  return {
    guardar: (token) => {
      const bytes = tamanhoEmBytes(token);
      if (bytes > LIMITE_DO_COFRE) {
        throw new Error(
          `O token tem ${bytes} bytes, e o cofre do Windows aceita até ${LIMITE_DO_COFRE}. O token não foi guardado.`,
        );
      }
      entrada().setSecret(new TextEncoder().encode(token));
    },
    ler: () => {
      const segredo = entrada().getSecret();
      return segredo === null ? null : new TextDecoder().decode(Uint8Array.from(segredo));
    },
    apagar: () => entrada().deleteCredential(),
  };
}
