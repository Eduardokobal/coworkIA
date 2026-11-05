#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { criarDependencias, type RecursosDoGoogle } from './aplicacao.js';
import { lerConfig } from './config.js';
import { criarAcessoAoGoogle } from './login/acesso.js';
import { criarCofre } from './login/cofre.js';
import { credenciaisDoEnv } from './login/credenciais.js';
import { fazerLogin, fazerLogout } from './login/login.js';
import { resumoParaTexto } from './saida/formatar.js';
import { resumoDoDia } from './servico.js';
import { criarServidor } from './servidor.js';

const PASTA_DEMO = fileURLToPath(new URL('../dados-demo', import.meta.url));
/** AD14: o .env fica na pasta do coworkIA, ao lado do package.json. */
const ARQUIVO_ENV = fileURLToPath(new URL('../.env', import.meta.url));

function lerEnv(): string | null {
  try {
    return readFileSync(ARQUIVO_ENV, 'utf8');
  } catch {
    return null;
  }
}

function recursosDoGoogle(): RecursosDoGoogle {
  return {
    lerEnv,
    cofre: criarCofre(),
    buscar: (url, opcoes) => fetch(url, opcoes),
    criarAcesso: criarAcessoAoGoogle,
  };
}

function mostrar(texto: string): void {
  process.stdout.write(`${texto}\n`);
}

async function principal(argumentos: readonly string[]): Promise<void> {
  const [comando] = argumentos;
  if (comando === 'login-google') {
    await fazerLogin({ credenciais: credenciaisDoEnv(lerEnv()), cofre: criarCofre(), mostrar });
    return;
  }
  if (comando === 'logout-google') {
    fazerLogout(criarCofre(), mostrar);
    return;
  }
  const config = lerConfig(process.env);
  const dep = criarDependencias(config, PASTA_DEMO, recursosDoGoogle());
  if (comando === 'resumo') {
    mostrar(resumoParaTexto(await resumoDoDia(dep), config.fuso));
    return;
  }
  if (comando !== undefined) {
    throw new Error(`comando desconhecido: ${comando}`);
  }
  // RQ8: no modo stdio, o stdout é do protocolo; o log vai para o stderr.
  process.stderr.write(`coworkIA: servidor MCP no modo ${config.modo}, fuso ${config.fuso}.\n`);
  await criarServidor(dep).connect(new StdioServerTransport());
}

principal(process.argv.slice(2)).catch((erro: unknown) => {
  process.stderr.write(`coworkIA: ${erro instanceof Error ? erro.message : String(erro)}\n`);
  process.exitCode = 1;
});
