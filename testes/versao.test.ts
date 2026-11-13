import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { describe, expect, it } from 'vitest';
import { carregarDadosDemo } from '../src/fontes/demo/dados.js';
import { criarFontesDemo } from '../src/fontes/demo/fonte-demo.js';
import { criarServidor } from '../src/servidor.js';
import { relogioFixo } from '../src/tempo.js';

const SP = 'America/Sao_Paulo';
const PASTA = fileURLToPath(new URL('../dados-demo', import.meta.url));

function ler(arquivo: string): unknown {
  return JSON.parse(readFileSync(new URL(`../${arquivo}`, import.meta.url), 'utf8'));
}

const pacote = ler('package.json') as { version: string };

describe('a versão do coworkIA (spec da versão 1.0.0, V2)', () => {
  it('o servidor informa ao cliente a versão do package.json', async () => {
    const relogio = relogioFixo('2026-11-04T10:30', SP);
    const servidor = criarServidor({
      fontes: criarFontesDemo(carregarDadosDemo(PASTA, relogio()), SP),
      relogio,
      fuso: SP,
      importantes: [],
    });
    const [doCliente, doServidor] = InMemoryTransport.createLinkedPair();
    await servidor.connect(doServidor);
    const cliente = new Client({ name: 'teste-versao', version: '0.0.0' });
    await cliente.connect(doCliente);
    const informada = cliente.getServerVersion();
    await cliente.close();
    expect(informada).toEqual({ name: 'coworkia', version: pacote.version });
  });

  it('o package-lock.json tem a versão do package.json, na raiz e no pacote ""', () => {
    const lock = ler('package-lock.json') as {
      version: string;
      packages: Record<string, { version?: string }>;
    };
    expect([lock.version, lock.packages['']?.version]).toEqual([pacote.version, pacote.version]);
  });
});
