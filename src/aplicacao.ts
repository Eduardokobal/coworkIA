import type { Config } from './config.js';
import { carregarDadosDemo } from './fontes/demo/dados.js';
import { criarFontesDemo } from './fontes/demo/fonte-demo.js';
import { type Buscar, criarFontesGoogle } from './fontes/google/fonte-google.js';
import type { Fontes } from './fontes/tipos.js';
import type { Cofre } from './login/cofre.js';
import { type CredenciaisDoCliente, credenciaisDoEnv } from './login/credenciais.js';
import type { Dependencias } from './servico.js';
import { relogioDoSistema, relogioFixo } from './tempo.js';

/** O que o modo google usa de fora: o cli.ts passa os de verdade, e os testes, os de mentira. */
export interface RecursosDoGoogle {
  lerEnv: () => string | null;
  cofre: Cofre;
  buscar: Buscar;
  criarAcesso: (credenciais: CredenciaisDoCliente, refreshToken: string) => () => Promise<string>;
}

/** AD9: o modo google precisa do .env e do login feito. */
function fontesDoGoogle(config: Config, google: RecursosDoGoogle): Fontes {
  const credenciais = credenciaisDoEnv(google.lerEnv());
  const refreshToken = google.cofre.ler();
  if (refreshToken === null) {
    throw new Error('Não há login do Google neste computador. Rode npm run login-google.');
  }
  return criarFontesGoogle({
    buscar: google.buscar,
    obterToken: google.criarAcesso(credenciais, refreshToken),
    fuso: config.fuso,
  });
}

/** RQ2, AD1 e AD9: liga a configuração ao relógio e às fontes, conforme o modo. */
export function criarDependencias(
  config: Config,
  pastaDemo: string,
  google: RecursosDoGoogle,
): Dependencias {
  const relogio =
    config.agora === null ? relogioDoSistema(config.fuso) : relogioFixo(config.agora, config.fuso);
  const fontes =
    config.modo === 'google'
      ? fontesDoGoogle(config, google)
      : criarFontesDemo(carregarDadosDemo(pastaDemo, relogio()), config.fuso);
  return { fontes, relogio, fuso: config.fuso, importantes: config.importantes };
}
