# Plano do modo arquivos: o WhatsApp e os extratos sem o Google (versão 1 do plano)

> **Para quem executa:** use a habilidade superpowers:executing-plans, tarefa por tarefa. Os passos usam caixas de seleção (`- [ ]`).

**Objetivo:** um terceiro modo, `COWORKIA_MODO=arquivos`, que lê só as pastas do WhatsApp e dos extratos, sobe sem o login do Google e responde com uma mensagem fixa nas ferramentas de e-mail e agenda e no resumo do dia, como a spec do modo arquivos (MA1 a MA7) descreve.

**Arquitetura:**
- A configuração (`src/config.ts`) aceita o valor novo (MA1).
- Um arquivo novo, `src/fontes/desligadas.ts`, tem a mensagem fixa, o erro `EmailEAgendaDesligados` e as fontes de e-mail e agenda que só dão esse erro. A aplicação (`src/aplicacao.ts`) usa essas fontes no modo `arquivos` e não chama nada do Google. O WhatsApp e as finanças já seguem o caminho das pastas fora do modo `demo` (MA2 e MA3).
- As 5 ferramentas de e-mail e agenda dão a mensagem sem mudança no serviço, porque é o erro das fontes. O resumo do dia (`src/servico.ts`) troca esse erro pelo aviso, num campo novo, `emailEAgenda`, e a saída (`src/saida/formatar.ts`) mostra o aviso no lugar do e-mail e da agenda, na ferramenta e no terminal (MA4).
- O README ganha o modo (MA6). Os modos `demo` e `google` não mudam (MA5).
- Cada tarefa de código tem o commit do teste vermelho (`test:`) e o do código (`feat:`).

**Base:**
- a spec `docs/specs/2026-11-10-modo-arquivos.md`, na versão 1 do documento (sha256 2f9f470fa30a02aa764672f597e78ff57466a918ddb014a4df967091b512c0e0), liberada pelo auditor e aprovada pelo Eduardo em 2026-11-10. Ela entra no repositório na Tarefa 0;
- a spec da versão 1 e os adendos AD1 a AD18, a spec do WhatsApp com os adendos AW1 a AW7 e a spec das finanças, que continuam valendo.

**Versões deste plano:** esta é a versão 1.

**Ensaio feito pelo DEV antes de mandar:** ver a seção "Ensaio", no fim.

## Restrições globais (valem para todas as tarefas)

- Tudo o que vale nos planos anteriores continua valendo: Node 24 ou mais novo, TypeScript `strict` com `noUncheckedIndexedAccess`, ESM com imports terminando em `.js`, Biome e Vitest.
- Nenhum escape `\u` e nenhum caractere invisível entram nos arquivos. Nenhuma dependência nova.
- **Toda mudança de arquivo que já existe é uma troca exata**: o trecho "trocar" aparece uma vez só no arquivo e é trocado pelo trecho "por este". Um arquivo novo vem inteiro, com "Criar `caminho` com este conteúdo:".
- Depois de cada passo de escrita, o `git diff --numstat` e o sha256 de cada arquivo conferem os bytes.
- Os blocos de código já estão no formato do Biome, e o `npm run formatar` não deve mudar nenhum arquivo.
- Os commits seguem a CONTRIBUTING.md, seção 4. As travas locais estão ativas. Cada bloco de commit começa com o `git branch --show-current` (espera `feat/modo-arquivos`) e o `git status --short`.
- O teste de ponta a ponta usa o `dist`. Por isso, o `npm run build` vem antes de cada rodada dele.
- A garantia de que o modo `arquivos` não lê o `.env`, não toca no cofre e não chama a rede é o teste da aplicação, com os recursos do Google que falham se forem usados. O `.env` fica na pasta do coworkIA, e num PC que tenha um `.env` o teste de ponta a ponta roda com ele lá; esse teste só mostra que o servidor sobe e funciona no modo `arquivos`.
- A cada tarefa, o DEV manda ao auditor os hashes, a saída do vermelho e do verde e os tipos.

## Mapa de arquivos

- Criar: `docs/specs/2026-11-10-modo-arquivos.md` e `docs/planos/2026-11-10-modo-arquivos.md` (Tarefa 0)
- Criar: `src/fontes/desligadas.ts`; modificar: `src/config.ts`, `src/aplicacao.ts`, `testes/config.test.ts`, `testes/aplicacao.test.ts` e `testes/e2e/servidor.test.ts` (Tarefa 1)
- Criar: `testes/modo-arquivos.test.ts`; modificar: `src/servico.ts` e `src/saida/formatar.ts` (Tarefa 2)
- Modificar: `README.md` (Tarefa 3)

---

### Tarefa 0: branch, spec e plano

- [ ] **Passo 1: criar a branch a partir da main atualizada**

```bash
git status --short
git fetch origin
git switch --no-track -c feat/modo-arquivos origin/main
git log --oneline -1
git config --get core.hooksPath
```
Esperado: o status vazio antes da troca, o topo no `00d6755` (o merge do PR 13) ou num merge mais novo, e as travas em `.githooks`.

- [ ] **Passo 2: commitar a spec aprovada**

```bash
cp "C:/Users/EDUARD~1/AppData/Local/Temp/claude/9bb78e7f8b1714b4/fc600f43-1af8-4aa6-adae-7be1427cd432/scratchpad/spec-modo-arquivos-v1.md" docs/specs/2026-11-10-modo-arquivos.md
sha256sum docs/specs/2026-11-10-modo-arquivos.md
git branch --show-current
git status --short
git add docs/specs/2026-11-10-modo-arquivos.md
git commit -m "docs: spec do modo arquivos" -m "A spec do modo que lê só o WhatsApp e os extratos, sem o Google, na versão 1 do documento, liberada pelo auditor e aprovada pelo Eduardo em 2026-11-10."
```
Esperado: o sha256 `2f9f470fa30a02aa764672f597e78ff57466a918ddb014a4df967091b512c0e0`.

- [ ] **Passo 3: commitar o plano, na versão LIBERADA**

A versão liberada é o arquivo `plano-arquivos-vN.md` do scratchpad do DEV com o maior N que o auditor deu como LIBERADO.

```bash
cp "C:/Users/EDUARD~1/AppData/Local/Temp/claude/9bb78e7f8b1714b4/fc600f43-1af8-4aa6-adae-7be1427cd432/scratchpad/plano-arquivos-vN.md" docs/planos/2026-11-10-modo-arquivos.md
sha256sum docs/planos/2026-11-10-modo-arquivos.md
git branch --show-current
git status --short
git add docs/planos/2026-11-10-modo-arquivos.md
git commit -m "docs: plano do modo arquivos" -m "A configuração, as fontes desligadas, o resumo do dia e o README do modo arquivos, com o teste antes do código. Cópia fiel da versão liberada pelo auditor."
```
Esperado: o sha256 igual ao que o auditor liberou.

---

### Tarefa 1: a configuração, a aplicação e as fontes desligadas (MA1 a MA3)

**O que faz:** a `COWORKIA_MODO` aceita `arquivos`, e o erro do modo inválido cita os três (MA1). No modo `arquivos`, a aplicação usa as fontes desligadas, que só dão o erro com a mensagem fixa, e não lê o `.env`, não toca no cofre e não chama a rede. O WhatsApp e as finanças leem as pastas como no modo `google`, com as mesmas mensagens quando falta uma variável (MA2 e MA3). O teste de ponta a ponta sobe o servidor no modo `arquivos` com uma pasta temporária.

- [ ] **Passo 1: escrever os testes**

Em `testes/config.test.ts`, trocar este trecho, que aparece uma vez:

```ts
    });
  });

  it('recusa um modo desconhecido', () => {
    expect(() => lerConfig({ COWORKIA_MODO: 'outlook' })).toThrow('COWORKIA_MODO inválido');
  });

  it('recusa um fuso que não existe', () => {
```

por este:

```ts
    });
  });

  it('aceita o modo arquivos (MA1)', () => {
    expect(lerConfig({ COWORKIA_MODO: ' arquivos ' }).modo).toBe('arquivos');
  });

  it('recusa um modo desconhecido, citando os três (MA1)', () => {
    expect(() => lerConfig({ COWORKIA_MODO: 'outlook' })).toThrow(
      'COWORKIA_MODO inválido: "outlook". Use demo, google ou arquivos.',
    );
  });

  it('recusa um fuso que não existe', () => {
```

Em `testes/aplicacao.test.ts`, trocar este trecho, que aparece uma vez:

```ts
import { fileURLToPath } from 'node:url';
import { describe, expect, it, vi } from 'vitest';
import { criarDependencias, type RecursosDoGoogle } from '../src/aplicacao.js';
import type { Buscar } from '../src/fontes/google/fonte-google.js';
import type { CredenciaisDoCliente } from '../src/login/credenciais.js';
import {
```

por este:

```ts
import { fileURLToPath } from 'node:url';
import { describe, expect, it, vi } from 'vitest';
import { criarDependencias, type RecursosDoGoogle } from '../src/aplicacao.js';
import { EMAIL_E_AGENDA_DESLIGADOS, EmailEAgendaDesligados } from '../src/fontes/desligadas.js';
import type { Buscar } from '../src/fontes/google/fonte-google.js';
import type { CredenciaisDoCliente } from '../src/login/credenciais.js';
import {
```

Em `testes/aplicacao.test.ts`, trocar este trecho, que aparece uma vez:

```ts
    expect(vi.mocked(randomBytes).mock.calls).toEqual([[32]]);
  });
});
```

por este:

```ts
    expect(vi.mocked(randomBytes).mock.calls).toEqual([[32]]);
  });
});

describe('o modo arquivos nas dependências (MA2 e MA3)', () => {
  const ARQUIVOS = {
    ...BASE,
    modo: 'arquivos' as const,
    whatsappPasta: join(PASTA, 'whatsapp'),
    whatsappEu: ['Eu'],
    financasPasta: join(PASTA, 'financas'),
  };

  it('lê as pastas do WhatsApp e das finanças sem tocar no .env, no cofre nem na rede', async () => {
    const dep = criarDependencias(ARQUIVOS, PASTA, GOOGLE_PROIBIDO);
    if (typeof dep.whatsapp !== 'object' || typeof dep.financas !== 'object') {
      throw new Error('o modo arquivos ficou sem as pastas');
    }
    expect(dep.whatsapp.eu).toEqual(['Eu']);
    // As pastas são lidas como estão, sem trocar os modelos da demonstração, como no modo google.
    const { conversas } = await dep.whatsapp.fonte.conversas();
    expect(conversas.length).toBe(8);
    expect(conversas.every((conversa) => conversa.formato === null)).toBe(true);
    expect((await dep.financas.fonte.extratos()).lancamentos).toEqual([]);
  });

  it('as fontes de e-mail e agenda dão o erro do modo arquivos, sem chamar nada', async () => {
    const { fontes } = criarDependencias(ARQUIVOS, PASTA, GOOGLE_PROIBIDO);
    await expect(fontes.email.enderecoDoUsuario()).rejects.toBeInstanceOf(EmailEAgendaDesligados);
    await expect(fontes.email.listar({ limite: 1 })).rejects.toThrow(EMAIL_E_AGENDA_DESLIGADOS);
    await expect(fontes.email.ler('x')).rejects.toThrow(EMAIL_E_AGENDA_DESLIGADOS);
  });

  it('sem as variáveis, diz o que falta, como o modo google', () => {
    const semNada = criarDependencias({ ...BASE, modo: 'arquivos' }, PASTA, GOOGLE_PROIBIDO);
    expect(semNada.whatsapp).toBe(SEM_PASTA_DO_WHATSAPP);
    expect(semNada.financas).toBe(SEM_PASTA_DAS_FINANCAS);
    const semEu = { ...BASE, modo: 'arquivos' as const, whatsappPasta: 'C:/conversas' };
    expect(criarDependencias(semEu, PASTA, GOOGLE_PROIBIDO).whatsapp).toBe(SEM_EU_DO_WHATSAPP);
  });
});
```

Em `testes/e2e/servidor.test.ts`, trocar este trecho, que aparece uma vez:

```ts
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
```

por este:

```ts
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
```

Em `testes/e2e/servidor.test.ts`, trocar este trecho, que aparece uma vez:

```ts
    expect(erro).not.toContain('FIM_TERCEIROS');
  }, 30_000);
});
```

por este:

```ts
    expect(erro).not.toContain('FIM_TERCEIROS');
  }, 30_000);
});

describe('o servidor no modo arquivos (MA2, MA3 e MA7)', () => {
  // A garantia de que o modo arquivos não lê o .env, o cofre nem a rede é o teste da aplicação,
  // com os recursos do Google que falham se forem usados. Este teste mostra que o servidor sobe
  // e funciona nesse modo, com uma pasta temporária no lugar da pasta do usuário.
  let arquivos: Client;
  let pasta: string;

  beforeAll(async () => {
    pasta = mkdtempSync(join(tmpdir(), 'coworkia-arquivos-'));
    writeFileSync(
      join(pasta, 'Conversa do WhatsApp com Ana.txt'),
      '04/11/2026 09:00 - Ana: Oi, tudo bem?\n',
    );
    arquivos = new Client({ name: 'teste-modo-arquivos', version: '0.0.0' });
    await arquivos.connect(
      new StdioClientTransport({
        command: process.execPath,
        args: [CLI],
        env: {
          ...AMBIENTE,
          COWORKIA_MODO: 'arquivos',
          COWORKIA_WHATSAPP_PASTA: pasta,
          COWORKIA_WHATSAPP_EU: 'Lúcia Prado',
        },
        stderr: 'pipe',
      }),
    );
  }, 30_000);

  afterAll(async () => {
    await arquivos.close();
    rmSync(pasta, { recursive: true, force: true });
  });

  it('sobe sem o login do Google e oferece as 12 ferramentas', async () => {
    const { tools } = await arquivos.listTools();
    expect(tools).toHaveLength(12);
  });

  it('o listar_emails dá a mensagem fixa, como erro, e o listar_conversas lê a pasta', async () => {
    const emails = await arquivos.callTool({ name: 'listar_emails', arguments: {} });
    expect(emails.isError).toBe(true);
    expect(JSON.stringify(emails.content)).toContain(
      'O e-mail e a agenda não estão ligados no modo arquivos. Use o modo google para lê-los.',
    );
    const conversas = await arquivos.callTool({ name: 'listar_conversas', arguments: {} });
    expect(conversas.isError).not.toBe(true);
    const partes = conversas.content as Array<{ text?: string }>;
    const lista = JSON.parse(partes.map((parte) => parte.text ?? '').join('')) as {
      conversas: Array<{ nome: string; mensagens: number }>;
    };
    expect(lista.conversas).toHaveLength(1);
    expect(lista.conversas[0]?.nome).toContain('>>>Ana<<<');
    expect(lista.conversas[0]?.mensagens).toBe(1);
  });
});
```

- [ ] **Passo 2: rodar o vermelho**

```bash
npm run build
npx vitest run testes/config.test.ts testes/aplicacao.test.ts testes/e2e/servidor.test.ts
```
Esperado: o vitest sai com 1, com 2 testes caindo, 24 passando e 2 pulados, e os 3 arquivos com falha:
- no `config.test.ts`, caem os 2 casos novos: o modo `arquivos` ainda dá "COWORKIA_MODO inválido", e a mensagem ainda é "Use demo ou google.";
- o `aplicacao.test.ts` não carrega, com "Cannot find module" do `src/fontes/desligadas.js`, que ainda não existe;
- no teste de ponta a ponta, os 21 casos do modo `demo` passam, e o servidor do modo `arquivos` não sobe ("Connection closed"), porque o modo ainda é inválido. Os 2 casos desse modo ficam pulados.

- [ ] **Passo 3: commitar os testes**

```bash
git branch --show-current
git status --short
git add testes/config.test.ts testes/aplicacao.test.ts testes/e2e/servidor.test.ts
git commit -m "test: modo arquivos na configuração e na aplicação" -m "Spec do modo arquivos, MA1 a MA3 e MA7: o valor novo, as pastas sem o Google, as fontes de e-mail e agenda com a mensagem fixa e o servidor que sobe nesse modo."
```

- [ ] **Passo 4: escrever o código**

Criar `src/fontes/desligadas.ts` com este conteúdo:

```ts
import type { Fontes } from './tipos.js';

/** MA3: a mensagem fixa das ferramentas de e-mail e agenda no modo arquivos. */
export const EMAIL_E_AGENDA_DESLIGADOS =
  'O e-mail e a agenda não estão ligados no modo arquivos. Use o modo google para lê-los.';

/** MA3 e MA4: as ferramentas mostram a mensagem, e o resumo do dia a põe no lugar do e-mail e da agenda. */
export class EmailEAgendaDesligados extends Error {
  constructor() {
    super(EMAIL_E_AGENDA_DESLIGADOS);
    this.name = 'EmailEAgendaDesligados';
  }
}

/** MA2 e MA3: as fontes do modo arquivos, que nunca leem nada nem chamam a rede. */
export function fontesDesligadas(): Fontes {
  const desligada = async (): Promise<never> => {
    throw new EmailEAgendaDesligados();
  };
  return {
    email: { enderecoDoUsuario: desligada, listar: desligada, ler: desligada },
    agenda: { listar: desligada },
  };
}
```

Em `src/config.ts`, trocar este trecho, que aparece uma vez:

```ts
import { IANAZone } from 'luxon';
import { FUSO_PADRAO } from './tempo.js';

export type Modo = 'demo' | 'google';

export interface Config {
  modo: Modo;
```

por este:

```ts
import { IANAZone } from 'luxon';
import { FUSO_PADRAO } from './tempo.js';

/** MA1: o modo arquivos lê só as pastas do WhatsApp e dos extratos, sem o Google. */
export type Modo = 'demo' | 'google' | 'arquivos';

export interface Config {
  modo: Modo;
```

Em `src/config.ts`, trocar este trecho, que aparece uma vez:

```ts
  importantes: string[];
  /** AD1: só para testes e demonstração; fixa o relógio. */
  agora: string | null;
  /** Versão 2, F1: a pasta das conversas exportadas, lida só no modo google. */
  whatsappPasta: string | null;
  /** Versão 2, V1: os nomes com que o usuário aparece na exportação. */
  whatsappEu: string[];
  /** Versão 2, W3: os contatos importantes, como aparecem na exportação. */
  whatsappImportantes: string[];
  /** Versão 2, parte 2, E1: a pasta dos extratos OFX, lida só no modo google. */
  financasPasta: string | null;
  /** Versão 2, parte 2, G3: a COWORKIA_FINANCAS_CATEGORIAS, como veio. */
  financasCategorias: string;
```

por este:

```ts
  importantes: string[];
  /** AD1: só para testes e demonstração; fixa o relógio. */
  agora: string | null;
  /** Versão 2, F1, e MA2: a pasta das conversas exportadas, lida nos modos google e arquivos. */
  whatsappPasta: string | null;
  /** Versão 2, V1: os nomes com que o usuário aparece na exportação. */
  whatsappEu: string[];
  /** Versão 2, W3: os contatos importantes, como aparecem na exportação. */
  whatsappImportantes: string[];
  /** Versão 2, parte 2, E1, e MA2: a pasta dos extratos OFX, lida nos modos google e arquivos. */
  financasPasta: string | null;
  /** Versão 2, parte 2, G3: a COWORKIA_FINANCAS_CATEGORIAS, como veio. */
  financasCategorias: string;
```

Em `src/config.ts`, trocar este trecho, que aparece uma vez:

```ts

export function lerConfig(ambiente: Record<string, string | undefined>): Config {
  const modo = (ambiente.COWORKIA_MODO ?? '').trim() || 'demo';
  if (modo !== 'demo' && modo !== 'google') {
    throw new Error(`COWORKIA_MODO inválido: "${modo}". Use demo ou google.`);
  }
  const fuso = (ambiente.COWORKIA_FUSO ?? '').trim() || FUSO_PADRAO;
  if (!IANAZone.isValidZone(fuso)) {
```

por este:

```ts

export function lerConfig(ambiente: Record<string, string | undefined>): Config {
  const modo = (ambiente.COWORKIA_MODO ?? '').trim() || 'demo';
  if (modo !== 'demo' && modo !== 'google' && modo !== 'arquivos') {
    throw new Error(`COWORKIA_MODO inválido: "${modo}". Use demo, google ou arquivos.`);
  }
  const fuso = (ambiente.COWORKIA_FUSO ?? '').trim() || FUSO_PADRAO;
  if (!IANAZone.isValidZone(fuso)) {
```

Em `src/aplicacao.ts`, trocar este trecho, que aparece uma vez:

```ts
  fonteWhatsappDemo,
} from './fontes/demo/dados.js';
import { criarFontesDemo } from './fontes/demo/fonte-demo.js';
import { criarFonteFinancas } from './fontes/financas/fonte-financas.js';
import { type Buscar, criarFontesGoogle } from './fontes/google/fonte-google.js';
import type { Fontes } from './fontes/tipos.js';
```

por este:

```ts
  fonteWhatsappDemo,
} from './fontes/demo/dados.js';
import { criarFontesDemo } from './fontes/demo/fonte-demo.js';
import { fontesDesligadas } from './fontes/desligadas.js';
import { criarFonteFinancas } from './fontes/financas/fonte-financas.js';
import { type Buscar, criarFontesGoogle } from './fontes/google/fonte-google.js';
import type { Fontes } from './fontes/tipos.js';
```

Em `src/aplicacao.ts`, trocar este trecho, que aparece uma vez:

```ts
  });
}

/** Versão 2, F1 e V2: no modo demo, a pasta e o usuário fixos; no google, os da configuração. */
function whatsappDaConfig(
  config: Config,
  pastaDemo: string,
```

por este:

```ts
  });
}

/**
 * Versão 2, F1 e V2, e MA2: no modo demo, a pasta e o usuário fixos; no google e no arquivos, os da
 * configuração.
 */
function whatsappDaConfig(
  config: Config,
  pastaDemo: string,
```

Em `src/aplicacao.ts`, trocar este trecho, que aparece uma vez:

```ts
  };
}

/** Versão 2, parte 2, E1 e G3: no modo demo, os extratos da demonstração; no google, a pasta. */
function financasDaConfig(
  config: Config,
  pastaDemo: string,
```

por este:

```ts
  };
}

/**
 * Versão 2, parte 2, E1 e G3, e MA2: no modo demo, os extratos da demonstração; no google e no
 * arquivos, a pasta.
 */
function financasDaConfig(
  config: Config,
  pastaDemo: string,
```

Em `src/aplicacao.ts`, trocar este trecho, que aparece uma vez:

```ts
  };
}

/** RQ2, AD1 e AD9: liga a configuração ao relógio e às fontes, conforme o modo. */
export function criarDependencias(
  config: Config,
  pastaDemo: string,
```

por este:

```ts
  };
}

/** AD9 e MA2: as fontes de e-mail e agenda de cada modo. */
function fontesDoModo(
  config: Config,
  pastaDemo: string,
  agora: DateTime,
  google: RecursosDoGoogle,
): Fontes {
  if (config.modo === 'google') {
    return fontesDoGoogle(config, google);
  }
  // MA2: o modo arquivos não lê o .env, não toca no cofre e não chama o Google.
  if (config.modo === 'arquivos') {
    return fontesDesligadas();
  }
  return criarFontesDemo(carregarDadosDemo(pastaDemo, agora), config.fuso);
}

/** RQ2, AD1 e AD9, e MA1: liga a configuração ao relógio e às fontes, conforme o modo. */
export function criarDependencias(
  config: Config,
  pastaDemo: string,
```

Em `src/aplicacao.ts`, trocar este trecho, que aparece uma vez:

```ts
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
```

por este:

```ts
): Dependencias {
  const relogio =
    config.agora === null ? relogioDoSistema(config.fuso) : relogioFixo(config.agora, config.fuso);
  const fontes = fontesDoModo(config, pastaDemo, relogio(), google);
  return {
    fontes,
    relogio,
```

Depois de escrever, conferir:

```bash
git diff --numstat
sha256sum src/fontes/desligadas.ts src/config.ts src/aplicacao.ts
```
Esperado: no `src/config.ts`, 6 linhas acrescentadas e 5 removidas; no `src/aplicacao.ts`, 28 linhas acrescentadas e 7 removidas (o `desligadas.ts` é novo e não aparece no `--numstat`). Os sha256: `c0a3b36fd256931b88d50a1544bee6719243f15ff495988000a7dff8d3a89bb8`, `34f5e25d287edee4b433614034d65f891235cc3516937325d739a77e54833dd6` e `22ce9c87fe590c28ef3742618707ef00eb54653de586989c30f3c346ddf68fad`.

- [ ] **Passo 5: rodar o verde e os tipos**

```bash
npm run build
npx vitest run testes/config.test.ts testes/aplicacao.test.ts testes/e2e/servidor.test.ts
npx tsc --noEmit
```
Esperado: 43 testes passando nos 3 arquivos, e os tipos com 0.

- [ ] **Passo 6: commitar o código**

```bash
git branch --show-current
git status --short
git add src/fontes/desligadas.ts src/config.ts src/aplicacao.ts
git commit -m "feat: modo arquivos na configuração e na aplicação" -m "Spec do modo arquivos, MA1 a MA3: o COWORKIA_MODO=arquivos lê só as pastas do WhatsApp e dos extratos, sem o .env, o cofre ou a rede, e as fontes de e-mail e agenda dão a mensagem fixa."
```

**Mutações:**
- 1a. Em `src/config.ts`, trocar ` && modo !== 'arquivos'` por `(nada)`: cai o caso com "aceita o modo arquivos".
- 1b. Em `src/config.ts`, trocar `Use demo, google ou arquivos.` por `Use demo ou google.`: cai o caso com "citando os três".
- 1c. Em `src/aplicacao.ts`, trocar `if (config.modo === 'arquivos') {` por `if (false) {`: cai o caso com "as fontes de e-mail e agenda dão o erro do modo arquivos".
- 1d. Em `src/aplicacao.ts`, trocar `return fontesDesligadas();` por `return fontesDoGoogle(config, google);`: cai o caso com "sem tocar no .env, no cofre nem na rede".
- 1e. Em `src/fontes/desligadas.ts`, trocar `throw new EmailEAgendaDesligados();` por `throw new Error(EMAIL_E_AGENDA_DESLIGADOS);`: cai o caso com "as fontes de e-mail e agenda dão o erro do modo arquivos".
- 1f. Em `src/fontes/desligadas.ts`, trocar `Use o modo google para lê-los.` por `Use o modo google.`: cai o caso com "as 5 ferramentas de e-mail e agenda dão a mensagem fixa".
- 1g. Em `src/aplicacao.ts`, trocar `if (config.modo === 'arquivos') {` por `if (config.modo === 'demo') {`: cai o caso com "o listar_emails dá a mensagem fixa".

---

### Tarefa 2: o resumo do dia no modo arquivos (MA3 e MA4)

**O que faz:** as 5 ferramentas de e-mail e agenda dão a mensagem fixa, porque é o erro das fontes desligadas, e o `criticar_rascunho` funciona. O resumo do dia troca esse erro pelo aviso, num campo novo, `emailEAgenda`, nulo nos outros modos; com o aviso, a triagem e a agenda ficam vazias e não saem. Na ferramenta, a saída traz a `data`, o `email_e_agenda` e o `whatsapp`. No terminal, a linha "E-mail e agenda: …" vem depois do título, e a seção do WhatsApp, depois dela. Qualquer outro erro continua derrubando o resumo.

- [ ] **Passo 1: escrever o teste**

Criar `testes/modo-arquivos.test.ts` com este conteúdo:

```ts
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  carregarDadosDemo,
  EU_DA_DEMONSTRACAO,
  fonteWhatsappDemo,
} from '../src/fontes/demo/dados.js';
import { criarFontesDemo } from '../src/fontes/demo/fonte-demo.js';
import { EMAIL_E_AGENDA_DESLIGADOS, fontesDesligadas } from '../src/fontes/desligadas.js';
import type { Fontes } from '../src/fontes/tipos.js';
import { resumoParaSaida, resumoParaTexto } from '../src/saida/formatar.js';
import {
  criticarRascunho,
  type Dependencias,
  disponibilidade,
  lerEmail,
  listarEmails,
  listarEventos,
  resumoDoDia,
  triagem,
} from '../src/servico.js';
import { relogioFixo } from '../src/tempo.js';

const SP = 'America/Sao_Paulo';
const PASTA = fileURLToPath(new URL('../dados-demo', import.meta.url));
const MARCADA = { marcar: true, chave: 'K' };
const relogio = relogioFixo('2026-11-04T10:30', SP);

/** As fontes do modo arquivos, com o WhatsApp da demonstração no lugar de uma pasta de verdade. */
function dependencias(fontes: Fontes = fontesDesligadas()): Dependencias {
  return {
    fontes,
    relogio,
    fuso: SP,
    importantes: [],
    whatsapp: {
      fonte: fonteWhatsappDemo(PASTA, relogio(), SP),
      eu: EU_DA_DEMONSTRACAO,
      importantes: [],
    },
  };
}

describe('o e-mail e a agenda no modo arquivos (MA3)', () => {
  it('as 5 ferramentas de e-mail e agenda dão a mensagem fixa', async () => {
    const dep = dependencias();
    const chamadas = [
      () => listarEmails(dep, {}),
      () => lerEmail(dep, 'qualquer'),
      () => triagem(dep),
      () => listarEventos(dep, 'hoje'),
      () => disponibilidade(dep, '2026-11-04T14:00', '2026-11-04T15:00'),
    ];
    for (const chamar of chamadas) {
      await expect(chamar()).rejects.toThrow(EMAIL_E_AGENDA_DESLIGADOS);
    }
    expect(EMAIL_E_AGENDA_DESLIGADOS).toBe(
      'O e-mail e a agenda não estão ligados no modo arquivos. Use o modo google para lê-los.',
    );
  });

  it('o criticar_rascunho, que não lê nenhuma fonte, funciona', () => {
    expect(
      criticarRascunho({ texto: 'Segue em anexo o contrato.' }).roteiro.length,
    ).toBeGreaterThan(0);
  });
});

describe('o resumo do dia no modo arquivos (MA4)', () => {
  it('na ferramenta, traz o aviso no lugar dos campos do e-mail e da agenda, com o WhatsApp', async () => {
    const resumo = await resumoDoDia(dependencias());
    expect(resumo.emailEAgenda).toBe(EMAIL_E_AGENDA_DESLIGADOS);
    const saida = resumoParaSaida(resumo, SP, MARCADA);
    expect(Object.keys(saida)).toEqual(['data', 'email_e_agenda', 'whatsapp']);
    expect(saida).toMatchObject({
      data: '2026-11-04',
      email_e_agenda: { aviso: EMAIL_E_AGENDA_DESLIGADOS },
      whatsapp: { contagem: { urgente: 2, pede_resposta: 4, informativo: 1 }, analisadas: 8 },
    });
  });

  it('no terminal, a linha do aviso vem depois do título, e a seção do WhatsApp, depois dela', async () => {
    const texto = resumoParaTexto(await resumoDoDia(dependencias()), SP);
    expect(texto.split('\n').slice(0, 5)).toEqual([
      'Resumo do dia 04/11/2026',
      '',
      `E-mail e agenda: ${EMAIL_E_AGENDA_DESLIGADOS}`,
      '',
      'WhatsApp das últimas 24 horas: 2 urgentes, 4 pedem resposta e 1 informativos (8 conversas analisadas).',
    ]);
    expect(texto).not.toContain('Triagem das últimas 24 horas');
    expect(texto).not.toContain('Agenda de hoje:');
  });

  it('nos outros modos, o resumo não traz o aviso', async () => {
    const resumo = await resumoDoDia(
      dependencias(criarFontesDemo(carregarDadosDemo(PASTA, relogio()), SP)),
    );
    expect(resumo.emailEAgenda).toBeNull();
    expect(resumoParaSaida(resumo, SP, MARCADA)).not.toHaveProperty('email_e_agenda');
    expect(resumoParaTexto(resumo, SP)).not.toContain('E-mail e agenda:');
  });

  it('um erro que não é o do modo arquivos continua derrubando o resumo', async () => {
    const falha = async (): Promise<never> => {
      throw new Error('falha inesperada');
    };
    const quebradas: Fontes = {
      email: { enderecoDoUsuario: falha, listar: falha, ler: falha },
      agenda: { listar: falha },
    };
    await expect(resumoDoDia(dependencias(quebradas))).rejects.toThrow('falha inesperada');
  });
});
```

- [ ] **Passo 2: rodar o vermelho**

```bash
npx vitest run testes/modo-arquivos.test.ts
```
Esperado: o vitest sai com 1, com 3 testes caindo e 3 passando:
- caem os 2 casos do resumo no modo arquivos, na ferramenta e no terminal, porque o resumo ainda deixa sair o erro das fontes desligadas ("EmailEAgendaDesligados: O e-mail e a agenda não estão ligados no modo arquivos. Use o modo google para lê-los.");
- cai o caso dos outros modos, com "expected undefined to be null", porque o resumo ainda não tem o campo `emailEAgenda`;
- passam as 5 ferramentas com a mensagem fixa e o `criticar_rascunho`, que já vêm das fontes desligadas da Tarefa 1, e o caso do erro que não é o do modo arquivos, que o resumo ainda deixa sair.

- [ ] **Passo 3: commitar o teste**

```bash
git branch --show-current
git status --short
git add testes/modo-arquivos.test.ts
git commit -m "test: resumo do dia no modo arquivos" -m "Spec do modo arquivos, MA3, MA4 e MA7: as 5 ferramentas de e-mail e agenda com a mensagem fixa, o criticar_rascunho e o resumo do dia com o aviso, na ferramenta e no terminal."
```

- [ ] **Passo 4: escrever o código**

Em `src/servico.ts`, trocar este trecho, que aparece uma vez:

```ts
import { DateTime } from 'luxon';
import type { Conversa, Evento, MensagemWhatsapp } from './dominio.js';
import type { AvisoDoExtrato, FonteFinancas } from './fontes/financas/fonte-financas.js';
import type { Fontes } from './fontes/tipos.js';
import {
```

por este:

```ts
import { DateTime } from 'luxon';
import type { Conversa, Evento, MensagemWhatsapp } from './dominio.js';
import { EmailEAgendaDesligados } from './fontes/desligadas.js';
import type { AvisoDoExtrato, FonteFinancas } from './fontes/financas/fonte-financas.js';
import type { Fontes } from './fontes/tipos.js';
import {
```

Em `src/servico.ts`, trocar este trecho, que aparece uma vez:

```ts

export interface ResumoDoDia {
  hoje: DateTime;
  triagem: ResultadoTriagem;
  eventosDeHoje: Evento[];
  conflitos: Array<[Evento, Evento]>;
```

por este:

```ts

export interface ResumoDoDia {
  hoje: DateTime;
  /**
   * MA4: no modo arquivos, o aviso no lugar do e-mail e da agenda; nos outros, nulo. Com o aviso,
   * a triagem e a agenda ficam vazias e não saem.
   */
  emailEAgenda: string | null;
  triagem: ResultadoTriagem;
  eventosDeHoje: Evento[];
  conflitos: Array<[Evento, Evento]>;
```

Em `src/servico.ts`, trocar este trecho, que aparece uma vez:

```ts
/** 7.7: o próximo compromisso é o primeiro de hoje com hora, a partir de agora, que ocupa a agenda. */
export async function resumoDoDia(dep: Dependencias): Promise<ResumoDoDia> {
  const hoje = dep.relogio();
  const triagemDoDia = await triagem(dep);
  const eventosDeHoje = await listarEventos(dep, 'hoje');
  const inicioDe = (evento: Evento) => intervaloDoEvento(evento, dep.fuso).inicio.toMillis();
  const futuros = eventosDeHoje.filter(
    (evento) =>
```

por este:

```ts
/** 7.7: o próximo compromisso é o primeiro de hoje com hora, a partir de agora, que ocupa a agenda. */
export async function resumoDoDia(dep: Dependencias): Promise<ResumoDoDia> {
  const hoje = dep.relogio();
  let triagemDoDia: ResultadoTriagem;
  let eventosDeHoje: Evento[];
  try {
    triagemDoDia = await triagem(dep);
    eventosDeHoje = await listarEventos(dep, 'hoje');
  } catch (erro) {
    // MA4: no modo arquivos, o aviso fica no lugar do e-mail e da agenda, e o WhatsApp sai como sempre.
    if (erro instanceof EmailEAgendaDesligados) {
      return {
        hoje,
        emailEAgenda: erro.message,
        triagem: {
          grupos: { urgente: [], pede_resposta: [], informativo: [], propaganda: [] },
          analisados: 0,
          completo: true,
        },
        eventosDeHoje: [],
        conflitos: [],
        proximoCompromisso: null,
        whatsapp: await secaoDoWhatsapp(dep),
      };
    }
    throw erro;
  }
  const inicioDe = (evento: Evento) => intervaloDoEvento(evento, dep.fuso).inicio.toMillis();
  const futuros = eventosDeHoje.filter(
    (evento) =>
```

Em `src/servico.ts`, trocar este trecho, que aparece uma vez:

```ts
  );
  return {
    hoje,
    triagem: triagemDoDia,
    eventosDeHoje,
    conflitos: conflitosEntre(eventosDeHoje, dep.fuso),
```

por este:

```ts
  );
  return {
    hoje,
    emailEAgenda: null,
    triagem: triagemDoDia,
    eventosDeHoje,
    conflitos: conflitosEntre(eventosDeHoje, dep.fuso),
```

Em `src/saida/formatar.ts`, trocar este trecho, que aparece uma vez:

```ts

/** 7.7, nas ferramentas */
export function resumoParaSaida(resumo: ResumoDoDia, fuso: string, saida: Saida) {
  const itens = (lista: EmailClassificado[]) =>
    lista.map(({ email, classificacao }) => ({
      id: email.id,
```

por este:

```ts

/** 7.7, nas ferramentas */
export function resumoParaSaida(resumo: ResumoDoDia, fuso: string, saida: Saida) {
  // MA4: no modo arquivos, o aviso no lugar dos campos do e-mail e da agenda.
  if (resumo.emailEAgenda !== null) {
    return {
      data: resumo.hoje.toISODate(),
      email_e_agenda: { aviso: resumo.emailEAgenda },
      whatsapp: whatsappDoResumo(resumo.whatsapp, saida),
    };
  }
  const itens = (lista: EmailClassificado[]) =>
    lista.map(({ email, classificacao }) => ({
      id: email.id,
```

Em `src/saida/formatar.ts`, trocar este trecho, que aparece uma vez:

```ts

/** 7.7 no terminal: os passos 1 a 5 da S2, sem a marcação. */
export function resumoParaTexto(resumo: ResumoDoDia, fuso: string): string {
  const texto = (valor: string, tipo: Campo) => prepararTexto(valor, tipo).texto;
  const contagem = contar(resumo.triagem);
  const linhas = [
```

por este:

```ts

/** 7.7 no terminal: os passos 1 a 5 da S2, sem a marcação. */
export function resumoParaTexto(resumo: ResumoDoDia, fuso: string): string {
  // MA4: no modo arquivos, a linha do aviso no lugar do e-mail e da agenda.
  if (resumo.emailEAgenda !== null) {
    return [
      `Resumo do dia ${resumo.hoje.toFormat('dd/MM/yyyy')}`,
      '',
      `E-mail e agenda: ${resumo.emailEAgenda}`,
      ...linhasDoWhatsapp(resumo.whatsapp),
    ].join('\n');
  }
  const texto = (valor: string, tipo: Campo) => prepararTexto(valor, tipo).texto;
  const contagem = contar(resumo.triagem);
  const linhas = [
```

Depois de escrever, conferir:

```bash
git diff --numstat
sha256sum src/servico.ts src/saida/formatar.ts
```
Esperado: no `src/servico.ts`, 31 linhas acrescentadas e 2 removidas; no `src/saida/formatar.ts`, 17 linhas acrescentadas e 0 removidas. Os sha256: `37139dd3511a2e9e689c9ca28fc99ebabe5c6037f2e836cfa95a4223f51341e9` e `93c21d5f3334f272ce1a76a1bff6cc61c7a54cf8b9b2d1d6f9a6e9a757205b9a`.

- [ ] **Passo 5: rodar o verde e os tipos**

```bash
npx vitest run testes/modo-arquivos.test.ts testes/servico.test.ts testes/servico-whatsapp.test.ts testes/saida
npx tsc --noEmit
```
Esperado: 87 testes passando nos 7 arquivos, e os tipos com 0.

- [ ] **Passo 6: commitar o código**

```bash
git branch --show-current
git status --short
git add src/servico.ts src/saida/formatar.ts
git commit -m "feat: resumo do dia no modo arquivos" -m "Spec do modo arquivos, MA4: o resumo do dia traz o aviso no lugar do e-mail e da agenda, na ferramenta e no terminal, com o WhatsApp como sempre."
```

**Mutações:**
- 2a. Em `src/servico.ts`, trocar `if (erro instanceof EmailEAgendaDesligados) {` por `if (erro instanceof Error) {`: cai o caso com "um erro que não é o do modo arquivos".
- 2b. Em `src/servico.ts`, trocar `emailEAgenda: erro.message,` por `emailEAgenda: null,`: cai o caso com "na ferramenta, traz o aviso".
- 2c. Em `src/saida/formatar.ts`, trocar `  // MA4: no modo arquivos, o aviso no lugar dos campos do e-mail e da agenda.
  if (resumo.emailEAgenda !== null) {` por `  // MA4: no modo arquivos, o aviso no lugar dos campos do e-mail e da agenda.
  if (false) {`: cai o caso com "na ferramenta, traz o aviso".
- 2d. Em `src/saida/formatar.ts`, trocar `email_e_agenda: { aviso: resumo.emailEAgenda },` por `email_e_agenda: resumo.emailEAgenda,`: cai o caso com "na ferramenta, traz o aviso".
- 2e. Em `src/saida/formatar.ts`, trocar `  // MA4: no modo arquivos, a linha do aviso no lugar do e-mail e da agenda.
  if (resumo.emailEAgenda !== null) {` por `  // MA4: no modo arquivos, a linha do aviso no lugar do e-mail e da agenda.
  if (false) {`: cai o caso com "no terminal, a linha do aviso vem depois do título".
- 2f. Em `src/saida/formatar.ts`, trocar ``E-mail e agenda: ${resumo.emailEAgenda}`,` por ``E-mail e agenda ${resumo.emailEAgenda}`,`: cai o caso com "no terminal, a linha do aviso vem depois do título".
- 2g. Em `src/saida/formatar.ts`, trocar `...linhasDoWhatsapp(resumo.whatsapp),` por `(nada)`: cai o caso com "no terminal, a linha do aviso vem depois do título".

---

### Tarefa 3: o README (MA6)

- [ ] **Passo 1: escrever**

Em `README.md`, trocar este trecho, que aparece uma vez:

```markdown

| Variável | Para quê | Padrão |
|---|---|---|
| `COWORKIA_MODO` | `demo` ou `google` (o `google` precisa do login; veja abaixo) | `demo` |
| `COWORKIA_FUSO` | O fuso das datas e horas | `America/Sao_Paulo` |
| `COWORKIA_IMPORTANTES` | Remetentes importantes, separados por vírgula | nenhum |
| `COWORKIA_AGORA` | Fixa o relógio; só para testes e demonstração | o relógio do sistema |
| `COWORKIA_WHATSAPP_PASTA` | A pasta das conversas exportadas do WhatsApp, no modo `google` | nenhuma |
| `COWORKIA_WHATSAPP_EU` | Os nomes com que você aparece nas suas mensagens exportadas, separados por vírgula | nenhum |
| `COWORKIA_WHATSAPP_IMPORTANTES` | Os contatos importantes no WhatsApp, como aparecem na exportação | nenhum |
| `COWORKIA_FINANCAS_PASTA` | A pasta dos extratos OFX, no modo `google` | nenhuma |
| `COWORKIA_FINANCAS_CATEGORIAS` | As suas categorias, no formato `nome=termo1,termo2;nome2=termo3`; valem antes das do coworkIA | nenhuma |

### Usar o Gmail e a Agenda de verdade
```

por este:

```markdown

| Variável | Para quê | Padrão |
|---|---|---|
| `COWORKIA_MODO` | `demo`, `google` ou `arquivos` (o `google` precisa do login; o `arquivos` lê só o WhatsApp e os extratos; veja abaixo) | `demo` |
| `COWORKIA_FUSO` | O fuso das datas e horas | `America/Sao_Paulo` |
| `COWORKIA_IMPORTANTES` | Remetentes importantes, separados por vírgula | nenhum |
| `COWORKIA_AGORA` | Fixa o relógio; só para testes e demonstração | o relógio do sistema |
| `COWORKIA_WHATSAPP_PASTA` | A pasta das conversas exportadas do WhatsApp, no modo `google` ou `arquivos` | nenhuma |
| `COWORKIA_WHATSAPP_EU` | Os nomes com que você aparece nas suas mensagens exportadas, separados por vírgula | nenhum |
| `COWORKIA_WHATSAPP_IMPORTANTES` | Os contatos importantes no WhatsApp, como aparecem na exportação | nenhum |
| `COWORKIA_FINANCAS_PASTA` | A pasta dos extratos OFX, no modo `google` ou `arquivos` | nenhuma |
| `COWORKIA_FINANCAS_CATEGORIAS` | As suas categorias, no formato `nome=termo1,termo2;nome2=termo3`; valem antes das do coworkIA | nenhuma |

### Usar o Gmail e a Agenda de verdade
```

Em `README.md`, trocar este trecho, que aparece uma vez:

```markdown

Com o app em "Teste", o Google faz o login valer 7 dias; depois disso, rode `npm run login-google` de novo. Publicar o app tira esse limite, mas o Google pode pedir uma verificação para as permissões do Gmail, e isso não foi testado.

### Ler as conversas do WhatsApp

O coworkIA lê as conversas que você exporta pelo próprio WhatsApp. Ele não usa nenhuma biblioteca não oficial e não se conecta ao WhatsApp: só lê os arquivos, sem alterar nem enviar nada.
```

por este:

```markdown

Com o app em "Teste", o Google faz o login valer 7 dias; depois disso, rode `npm run login-google` de novo. Publicar o app tira esse limite, mas o Google pode pedir uma verificação para as permissões do Gmail, e isso não foi testado.

### Usar só o WhatsApp e os extratos

Se você não quer conectar o Google, o modo `arquivos` lê só as conversas exportadas do WhatsApp e os extratos OFX. Ele não pede o login do Google nem o `.env` e não toca no cofre do sistema.

1. Defina `COWORKIA_MODO=arquivos` para o servidor e as variáveis da pasta que você vai usar: a `COWORKIA_WHATSAPP_PASTA` e a `COWORKIA_WHATSAPP_EU` para o WhatsApp, e a `COWORKIA_FINANCAS_PASTA` para os extratos. No Claude Code, por exemplo:

       claude mcp add coworkia -e COWORKIA_MODO=arquivos -e COWORKIA_WHATSAPP_PASTA=/caminho/das/conversas -e "COWORKIA_WHATSAPP_EU=Seu Nome" -- node /caminho/para/coworkIA/dist/cli.js

2. As duas seções abaixo dizem como exportar as conversas e baixar os extratos.

Nesse modo, as ferramentas de e-mail e agenda respondem que não estão ligadas, e o resumo do dia traz o mesmo aviso no lugar do e-mail e da agenda, com o WhatsApp.

### Ler as conversas do WhatsApp

O coworkIA lê as conversas que você exporta pelo próprio WhatsApp. Ele não usa nenhuma biblioteca não oficial e não se conecta ao WhatsApp: só lê os arquivos, sem alterar nem enviar nada.
```

Em `README.md`, trocar este trecho, que aparece uma vez:

```markdown
- as categorias são palavras na descrição e erram às vezes, e as suas corrigem;
- uma transferência entre as suas contas conta como entrada numa e saída na outra;
- um lançamento cuja data, valor ou descrição mude entre duas exportações conta duas vezes, e dois lançamentos iguais do mesmo dia, cada um num arquivo que não traz o outro, contam uma vez;
- no modo `google`, ler os extratos também pede o login do Google.

O formato OFX é público, mas cada banco o usa do seu jeito. O coworkIA foi feito a partir da especificação e medido com extratos de exemplo publicados por projetos abertos, mas ainda não com um extrato real.

```

por este:

```markdown
- as categorias são palavras na descrição e erram às vezes, e as suas corrigem;
- uma transferência entre as suas contas conta como entrada numa e saída na outra;
- um lançamento cuja data, valor ou descrição mude entre duas exportações conta duas vezes, e dois lançamentos iguais do mesmo dia, cada um num arquivo que não traz o outro, contam uma vez;
- no modo `google`, ler os extratos também pede o login do Google; o modo `arquivos` lê os extratos sem ele.

O formato OFX é público, mas cada banco o usa do seu jeito. O coworkIA foi feito a partir da especificação e medido com extratos de exemplo publicados por projetos abertos, mas ainda não com um extrato real.

```

Depois de escrever, conferir:

```bash
git diff --numstat
sha256sum README.md
```
Esperado: 16 linhas acrescentadas e 4 removidas, só no README, e o sha256 `e4412510859d2feb327ee7367e064b0580509a13c641ee79844adc03a045300b`.

- [ ] **Passo 2: commitar**

```bash
git branch --show-current
git status --short
git add README.md
git commit -m "docs: o modo arquivos no README" -m "Spec do modo arquivos, MA6: o valor novo na tabela das variáveis, a seção \"Usar só o WhatsApp e os extratos\" e a saída para quem não quer o Google."
```

---

### Tarefa 4: o fechamento

- [ ] **Passo 1: rodar tudo e anotar os números**

```bash
npm test
npm run lint
npm run tipos
npm run build
npm run formatar
sh testes-travas/rodar.sh
git log --oneline origin/main..HEAD
git diff --stat origin/main..HEAD
git status --short
```
Esperado:
- 38 arquivos de teste e 476 testes passando (num Windows sem o modo de desenvolvedor, 474 passando e 2 pulados, os dos links de arquivo);
- o lint, os tipos e o build com 0, o `npm run formatar` sem mudar nada e as travas com 62 casos e 0 falhas;
- 7 commits: 3 `docs:`, 2 `test:` e 2 `feat:`;
- 12 arquivos no diff, e o status vazio.

- [ ] **Passo 2: mandar ao auditor e preparar o PR**

O HEAD, os números, as saídas dos vermelhos e a lista de commits. O push e a abertura do PR pedem o OK do Eduardo pela caixa e o "pode" do auditor antes, com o roteiro lido.

## Como as mutações rodam

Cada mutação troca um trecho exato de um arquivo, roda `npx vitest run <arquivo do teste>` e volta o arquivo como estava. A conferida pelo teste de ponta a ponta (1g) roda o `npm run build` antes, porque esse teste usa o `dist`, e o script recompila o `dist` no fim. O DEV conferiu cada uma com `npx tsc --noEmit`, e todas compilam.

## Cobertura da spec neste plano

| Regra da spec | Tarefa |
|---|---|
| MA1 (o valor novo) | 1 |
| MA2 (o que o modo lê) | 1 |
| MA3 (o e-mail e a agenda) | 1 e 2 |
| MA4 (o resumo do dia) | 2 |
| MA5 (o que não muda) | 1, 2 e 4 |
| MA6 (o README) | 3 |
| MA7 (os testes) | 1 e 2 |

## Ensaio

O DEV escreveu e mediu o código primeiro numa sonda, um clone no scratchpad saído da main `00d6755`. Um gerador montou este plano a partir dela: os arquivos novos vêm inteiros, e as trocas saem do diff entre a main e a sonda. O gerador conferiu que cada trecho "trocar" aparece uma vez e que aplicar as trocas na main dá exatamente o arquivo da sonda. Os vermelhos das Tarefas 1 e 2 foram medidos antes, num clone da main com os testes de cada tarefa e, na Tarefa 2, com o código da Tarefa 1.

Depois, o DEV aplicou o plano do zero num clone novo, saído da main `00d6755`, com as travas ativas. Um script rodou cada linha dos blocos de comando, na ordem, criou cada arquivo novo e fez cada troca lida deste arquivo. O Passo 1 da Tarefa 0 foi feito à mão, porque o `origin` do clone é a pasta do projeto, e não o GitHub; a `origin/main` do clone veio da `origin/main` da pasta, que está no `00d6755`. Os resultados:
- só os 2 vermelhos saíram com 1, e os outros 53 comandos saíram com 0. O script criou 2 arquivos e fez 22 trocas;
- os vermelhos:
  - na Tarefa 1, 2 casos caídos, 24 passando e 2 pulados, com o `aplicacao.test.ts` sem carregar e o servidor do modo arquivos sem subir;
  - na Tarefa 2, 3 caídos e 3 passando;
  - cada um com os motivos do Passo 2 da tarefa;
- os verdes deram 43 e 87 testes, e os tipos saíram com 0 nas duas tarefas;
- cada um dos 7 sha256 deu o esperado. Os 10 arquivos de código, teste e README do fim são iguais, byte a byte, aos da sonda, e a spec commitada é igual à versão 1 (`2f9f470fa30a02aa764672f597e78ff57466a918ddb014a4df967091b512c0e0`);
- no fim:
  - 38 arquivos e 476 testes passando, nenhum pulado;
  - o lint, os tipos e o build com 0, e o `npm run formatar` com "No fixes applied";
  - as travas com 62 casos e 0 falhas;
  - os 7 commits pelas travas (3 `docs:`, 2 `test:` e 2 `feat:`), todos com o autor do git global;
  - 12 arquivos no diff, e o status vazio.

Os patch-ids dos 6 commits que não dependem do texto deste plano, na ordem:
- a spec, `70bcccaa89e4cf60b4ddd1410c516aa9ffc69efe`;
- o teste e o código da Tarefa 1, `53dc43932157b9a938a2767c79d9151104aa249f` e `48eda92e85b17b4912745ed09045d2dd4ceda71e`;
- o teste e o código da Tarefa 2, `ebc8d344eadd823c71ee9987d958523caae77120` e `269b422b8d3562a0c51f2fd9d703dbf143275a40`;
- o README, `c7eba7ac7b62882ada94c1a42888cb299cad5a20`.

As mutações: as 14 compilam. Na sonda, que tem os mesmos bytes do resultado do ensaio, cada uma derrubou o caso indicado, rodando só o arquivo de teste dela. Duas foram escritas primeiro de um jeito que não compilava e foram trocadas por equivalentes que compilam:
- a 1d trocava o `if` do modo google, e o TypeScript recusava a comparação seguinte; agora ela faz o modo arquivos chamar o Google;
- a 2a usava `if (true)`, que deixava o `erro` sem tipo; agora ela troca o erro do modo arquivos por qualquer `Error`.

Sobre o resultado do ensaio, na suíte inteira, com o build antes e 476 testes, as 14 também derrubam o caso indicado. Em 8 delas cai só esse caso, e a que mais derruba é a 1g, com 10. Depois das mutações, o clone ficou igual ao HEAD, com o `dist` recompilado do código original.

O commit do plano no ensaio levou uma versão anterior deste arquivo, sem esta seção (sha256 44534afbdf7506604b83f0ad81974c4ed447a5323cd97b0c1cef03b34a3e9a50). Fora esta seção, as duas versões são iguais, byte a byte. Por isso, o hash e a árvore dos commits do ensaio não são os da execução, e o patch-id do commit do plano também não. O ensaio não substitui a conferência do auditor.
