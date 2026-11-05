#!/usr/bin/env node
import { fileURLToPath } from 'node:url';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { criarDependencias } from './aplicacao.js';
import { lerConfig } from './config.js';
import { resumoParaTexto } from './saida/formatar.js';
import { resumoDoDia } from './servico.js';
import { criarServidor } from './servidor.js';

const PASTA_DEMO = fileURLToPath(new URL('../dados-demo', import.meta.url));

async function principal(argumentos: readonly string[]): Promise<void> {
  const config = lerConfig(process.env);
  const dep = criarDependencias(config, PASTA_DEMO);
  const [comando] = argumentos;
  if (comando === 'resumo') {
    process.stdout.write(`${resumoParaTexto(await resumoDoDia(dep), config.fuso)}\n`);
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
