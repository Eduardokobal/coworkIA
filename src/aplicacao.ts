import { randomBytes } from 'node:crypto';
import type { DateTime } from 'luxon';
import type { Config } from './config.js';
import {
  carregarDadosDemo,
  EU_DA_DEMONSTRACAO,
  fonteFinancasDemo,
  fonteWhatsappDemo,
} from './fontes/demo/dados.js';
import { criarFontesDemo } from './fontes/demo/fonte-demo.js';
import { criarFonteFinancas } from './fontes/financas/fonte-financas.js';
import { type Buscar, criarFontesGoogle } from './fontes/google/fonte-google.js';
import type { Fontes } from './fontes/tipos.js';
import { criarFonteWhatsapp } from './fontes/whatsapp/fonte-whatsapp.js';
import type { Cofre } from './login/cofre.js';
import { type CredenciaisDoCliente, credenciaisDoEnv } from './login/credenciais.js';
import {
  type Dependencias,
  type DependenciasFinancas,
  type DependenciasWhatsapp,
  SEM_EU_DO_WHATSAPP,
  SEM_PASTA_DAS_FINANCAS,
  SEM_PASTA_DO_WHATSAPP,
} from './servico.js';
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

/** Versão 2, F1 e V2: no modo demo, a pasta e o usuário fixos; no google, os da configuração. */
function whatsappDaConfig(
  config: Config,
  pastaDemo: string,
  agora: DateTime,
): DependenciasWhatsapp | string {
  if (config.modo === 'demo') {
    return {
      fonte: fonteWhatsappDemo(pastaDemo, agora, config.fuso),
      eu: EU_DA_DEMONSTRACAO,
      importantes: config.whatsappImportantes,
    };
  }
  if (config.whatsappPasta === null) {
    return SEM_PASTA_DO_WHATSAPP;
  }
  if (config.whatsappEu.length === 0) {
    return SEM_EU_DO_WHATSAPP;
  }
  return {
    fonte: criarFonteWhatsapp({ pasta: config.whatsappPasta, fuso: config.fuso }),
    eu: config.whatsappEu,
    importantes: config.whatsappImportantes,
  };
}

/** Versão 2, parte 2, E1 e G3: no modo demo, os extratos da demonstração; no google, a pasta. */
function financasDaConfig(
  config: Config,
  pastaDemo: string,
  agora: DateTime,
  segredo: Uint8Array,
): DependenciasFinancas | string {
  if (config.modo === 'demo') {
    return {
      fonte: fonteFinancasDemo(pastaDemo, agora, segredo),
      categorias: config.financasCategorias,
    };
  }
  if (config.financasPasta === null) {
    return SEM_PASTA_DAS_FINANCAS;
  }
  return {
    fonte: criarFonteFinancas({ pasta: config.financasPasta, segredo }),
    categorias: config.financasCategorias,
  };
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
  return {
    fontes,
    relogio,
    fuso: config.fuso,
    importantes: config.importantes,
    whatsapp: whatsappDaConfig(config, pastaDemo, relogio()),
    // F-D7 e O10: a chave secreta do id da conta nasce a cada servidor, e só fica na memória.
    financas: financasDaConfig(config, pastaDemo, relogio(), randomBytes(32)),
  };
}
