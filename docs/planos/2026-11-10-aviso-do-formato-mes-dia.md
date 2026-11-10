# Plano do aviso do formato mês/dia no WhatsApp (versão 1 do plano)

> **Para quem executa:** use a habilidade superpowers:executing-plans, tarefa por tarefa. Os passos usam caixas de seleção (`- [ ]`).

**Objetivo:** contar as linhas com data impossível de uma exportação do WhatsApp e avisar delas no `listar_conversas`, no `ler_conversa`, no `triagem_whatsapp` e no resumo do dia, para denunciar a exportação no formato mês/dia, como o adendo AW4 a AW7 descreve.

**Arquitetura:**
- O leitor (`src/fontes/whatsapp/leitor.ts`) passa a separar a linha que não casa com a L1 da linha que casa com a forma dela, mas com uma data que não existe. Ele continua lendo essa linha como antes e a conta (AW4). A `Conversa` (`src/dominio.ts`) ganha a contagem.
- A fonte (`src/fontes/whatsapp/fonte-whatsapp.ts`) tem o texto fixo do aviso e o põe nos avisos da pasta. O serviço (`src/servico.ts`) leva o aviso ao `ler_conversa` e à triagem, que também alimenta o resumo do dia. A saída (`src/saida/formatar.ts`) mostra o aviso nas ferramentas e no `npm run resumo` (AW5).
- O README ganha a limitação (AW6). A demonstração não muda.
- A Tarefa 1 tem o commit do teste vermelho (`test:`) e o do código (`feat:`). A `Conversa` ganha um campo obrigatório, e por isso os testes que montam uma conversa à mão mudam no mesmo commit dos testes novos.

**Base:**
- o adendo `docs/specs/2026-11-10-versao-2-whatsapp-adendo-mes-dia.md`, na versão 2 do documento (sha256 ac8758a6f7c11780f66505bf6d7d1228bf85b22153e5a660008d2cd277297c50), liberado pelo auditor, que vai ao Eduardo junto com o pedido do "Li, pode executar". Ele entra no repositório na Tarefa 0;
- o desenho, aprovado pelo Eduardo pela caixa em 2026-11-10: "Avisar e continuar lendo", "Está certo, pode escrever", "No listar, no ler e na triagem" e, depois do achado 127, "Avisar também no resumo";
- a spec do WhatsApp (`docs/specs/2026-11-06-versao-2-whatsapp.md`, na versão 4 do documento), o adendo AW1 a AW3, a spec da versão 1 e os adendos AD1 a AD18, que continuam valendo.

**Versões deste plano:** esta é a versão 1.

**Ensaio feito pelo DEV antes de mandar:** ver a seção "Ensaio", no fim.

## Restrições globais (valem para todas as tarefas)

- Tudo o que vale nos planos anteriores continua valendo: Node 24 ou mais novo, TypeScript `strict` com `noUncheckedIndexedAccess`, ESM com imports terminando em `.js`, Biome e Vitest.
- Nenhum escape `\u` e nenhum caractere invisível entram nos arquivos. Nenhuma dependência nova.
- **Toda mudança de arquivo que já existe é uma troca exata**: o trecho "trocar" aparece uma vez só no arquivo e é trocado pelo trecho "por este".
- Depois de cada passo de escrita, o `git diff --numstat` e o sha256 de cada arquivo conferem os bytes.
- Os blocos de código já estão no formato do Biome, e o `npm run formatar` não deve mudar nenhum arquivo.
- Os commits seguem a CONTRIBUTING.md, seção 4. As travas locais estão ativas. Cada bloco de commit começa com o `git branch --show-current` (espera `feat/aviso-do-formato-mes-dia`) e o `git status --short`.
- A cada tarefa, o DEV manda ao auditor os hashes, a saída do vermelho e do verde e os tipos.

## Mapa de arquivos

- Criar: `docs/specs/2026-11-10-versao-2-whatsapp-adendo-mes-dia.md` e `docs/planos/2026-11-10-aviso-do-formato-mes-dia.md` (Tarefa 0)
- Modificar: `testes/fontes/whatsapp/leitor.test.ts`, `testes/fontes/whatsapp/fonte-whatsapp.test.ts`, `testes/regras/triagem-whatsapp.test.ts`, `testes/servico-whatsapp.test.ts`, `testes/saida/formatar-whatsapp.test.ts`, `src/dominio.ts`, `src/fontes/whatsapp/leitor.ts`, `src/fontes/whatsapp/fonte-whatsapp.ts`, `src/servico.ts` e `src/saida/formatar.ts` (Tarefa 1)
- Modificar: `README.md` (Tarefa 2)

---

### Tarefa 0: branch, adendo e plano

- [ ] **Passo 1: criar a branch a partir da main atualizada**

```bash
git status --short
git fetch origin
git switch --no-track -c feat/aviso-do-formato-mes-dia origin/main
git log --oneline -1
git config --get core.hooksPath
```
Esperado: o status vazio antes da troca, o topo no `c87510d` (o merge do PR 12) ou num merge mais novo, e as travas em `.githooks`.

- [ ] **Passo 2: commitar o adendo liberado**

```bash
cp "C:/Users/EDUARD~1/AppData/Local/Temp/claude/9bb78e7f8b1714b4/fc600f43-1af8-4aa6-adae-7be1427cd432/scratchpad/adendo-mesdia-v2.md" docs/specs/2026-11-10-versao-2-whatsapp-adendo-mes-dia.md
sha256sum docs/specs/2026-11-10-versao-2-whatsapp-adendo-mes-dia.md
git branch --show-current
git status --short
git add docs/specs/2026-11-10-versao-2-whatsapp-adendo-mes-dia.md
git commit -m "docs: adendo do aviso do formato mês/dia" -m "O adendo AW4 a AW7 à spec do WhatsApp, na versão 2 do documento, liberado pelo auditor e aprovado pelo Eduardo junto com o plano."
```
Esperado: o sha256 `ac8758a6f7c11780f66505bf6d7d1228bf85b22153e5a660008d2cd277297c50`.

- [ ] **Passo 3: commitar o plano, na versão LIBERADA**

A versão liberada é o arquivo `plano-mesdia-vN.md` do scratchpad do DEV com o maior N que o auditor deu como LIBERADO.

```bash
cp "C:/Users/EDUARD~1/AppData/Local/Temp/claude/9bb78e7f8b1714b4/fc600f43-1af8-4aa6-adae-7be1427cd432/scratchpad/plano-mesdia-vN.md" docs/planos/2026-11-10-aviso-do-formato-mes-dia.md
sha256sum docs/planos/2026-11-10-aviso-do-formato-mes-dia.md
git branch --show-current
git status --short
git add docs/planos/2026-11-10-aviso-do-formato-mes-dia.md
git commit -m "docs: plano do aviso do formato mês/dia" -m "A contagem das linhas com data impossível, o aviso nas ferramentas do WhatsApp e no resumo do dia, e a limitação no README. Cópia fiel da versão liberada pelo auditor."
```
Esperado: o sha256 igual ao que o auditor liberou.

---

### Tarefa 1: a contagem e o aviso (AW4, AW5 e AW7)

**O que faz:** o leitor conta a linha com a forma da L1 e uma data que não existe, no arquivo inteiro, sem mudar a leitura (AW4). Os minutos ou os segundos acima de 59, com a data certa, não contam, e a linha no outro formato depois de o formato ser fixado também não. O aviso fixo da AW5 sai nos avisos da pasta do `listar_conversas`, no campo `aviso` do `ler_conversa`, na lista `avisos` da triagem e na seção do WhatsApp do resumo do dia. No `npm run resumo`, ele aparece logo depois da linha da contagem, só quando há avisos.

- [ ] **Passo 1: escrever os testes**

Em `testes/fontes/whatsapp/leitor.test.ts`, trocar este trecho, que aparece uma vez:

```ts
    ).toMatchObject({ formato: 'android', linhasDescartadas: 0 });
    expect(
      ler(['[05/11/2026, 14:30:00] Ana criou o grupo', '05/11/2026 14:32 - Ana: no outro formato']),
    ).toEqual({ formato: 'iphone', mensagens: [], linhasDescartadas: 1 });
  });

  it('a linha forjada no mesmo formato vira uma mensagem nova (L6, limitação conhecida)', () => {
```

por este:

```ts
    ).toMatchObject({ formato: 'android', linhasDescartadas: 0 });
    expect(
      ler(['[05/11/2026, 14:30:00] Ana criou o grupo', '05/11/2026 14:32 - Ana: no outro formato']),
    ).toEqual({
      formato: 'iphone',
      mensagens: [],
      linhasDescartadas: 1,
      linhasComDataImpossivel: 0,
    });
  });

  it('a linha forjada no mesmo formato vira uma mensagem nova (L6, limitação conhecida)', () => {
```

Em `testes/fontes/whatsapp/leitor.test.ts`, trocar este trecho, que aparece uma vez:

```ts
      formato: null,
      mensagens: [],
      linhasDescartadas: 2,
    });
  });
});

describe('lerExportacao: o texto que não serve para as regras (L5)', () => {
```

por este:

```ts
      formato: null,
      mensagens: [],
      linhasDescartadas: 2,
      linhasComDataImpossivel: 0,
    });
  });
});

describe('lerExportacao: as linhas com data impossível (AW4)', () => {
  it('conta, no Android e no iPhone, a linha com a forma da L1 e uma data que não existe', () => {
    const android = ler([
      '1/7/23, 14:00 - Ana: oi',
      '7/13/23, 15:00 - Ana: o mês 13',
      '31/04/2026 10:00 - Ana: abril tem 30 dias',
    ]);
    expect(android).toMatchObject({
      formato: 'android',
      linhasDescartadas: 0,
      linhasComDataImpossivel: 2,
    });
    // Depois da primeira mensagem, a linha continua a anterior, como antes (L3).
    expect(android.mensagens).toHaveLength(1);
    expect(android.mensagens[0]?.texto.split('\n')).toHaveLength(3);
    const iphone = ler(['[1/7/23, 14:00:01] Ana: oi', '[7/13/23, 15:00:02] Ana: de novo']);
    expect(iphone).toMatchObject({ formato: 'iphone', linhasComDataImpossivel: 1 });
  });

  it('antes da primeira mensagem, a linha também é descartada e não fixa o formato', () => {
    const lida = ler(['[3/18/22, 14:56:01] Ana: oi', '05/11/2026 14:32 - Ana: oi']);
    expect(lida).toMatchObject({
      formato: 'android',
      linhasDescartadas: 1,
      linhasComDataImpossivel: 1,
    });
  });

  it('não contam os minutos 60 com a data certa nem a linha no outro formato depois de fixado', () => {
    const lida = ler([
      '05/11/2026 14:32 - Ana: oi',
      '05/11/2026 14:60 - Ana: os minutos',
      '[7/13/23, 15:00:02] Bia: no outro formato',
    ]);
    expect(lida.linhasComDataImpossivel).toBe(0);
    expect(lida.mensagens).toHaveLength(1);
  });

  it('uma conversa brasileira sem nenhuma dá zero', () => {
    const lida = ler(['05/11/2026 14:32 - Ana: oi', '06/11/2026 09:00 - Lúcia Prado: bom dia']);
    expect(lida.linhasComDataImpossivel).toBe(0);
  });
});

describe('lerExportacao: o texto que não serve para as regras (L5)', () => {
```

Em `testes/fontes/whatsapp/fonte-whatsapp.test.ts`, trocar este trecho, que aparece uma vez:

```ts
import type { Conversa } from '../../../src/dominio.js';
import {
  type AvisoDaPasta,
  criarFonteWhatsapp,
  ErroDaPasta,
  ehArquivoDeConversa,
```

por este:

```ts
import type { Conversa } from '../../../src/dominio.js';
import {
  type AvisoDaPasta,
  avisoDeDataImpossivel,
  criarFonteWhatsapp,
  ErroDaPasta,
  ehArquivoDeConversa,
```

Em `testes/fontes/whatsapp/fonte-whatsapp.test.ts`, trocar este trecho, que aparece uma vez:

```ts
    ]);
  });

  it('a demonstração troca o texto antes da leitura', async () => {
    const pasta = pastaCom({ 'Demo.txt': '{{data}} - Ana: oi\n' });
    const fonte = criarFonteWhatsapp({
```

por este:

```ts
    ]);
  });

  it('as linhas com data impossível viram o aviso, depois dos outros do arquivo (AW5)', async () => {
    const pasta = pastaCom({
      'A.txt': '[3/18/22, 14:56:01] Ana: oi\n',
      'B.txt': `[3/18/22, 14:56:01] Ana: oi\n${LINHA}7/13/23, 15:00 - Ana: de novo\n`,
      'C.txt': LINHA,
    });
    const { conversas, avisos } = await criarFonteWhatsapp({ pasta, fuso: SP }).conversas();
    expect(conversas.map((conversa) => conversa.linhasComDataImpossivel)).toEqual([1, 2, 0]);
    expect(avisos).toEqual([
      { nome: 'A', texto: 'formato não reconhecido.' },
      { nome: 'A', texto: avisoDeDataImpossivel(1) },
      { nome: 'B', texto: 'linhas descartadas antes da primeira mensagem: 1.' },
      { nome: 'B', texto: avisoDeDataImpossivel(2) },
    ]);
    expect(avisoDeDataImpossivel(2)).toBe(
      'linhas com data impossível: 2; a exportação pode estar no formato mês/dia, e as datas e as mensagens desta conversa podem estar erradas.',
    );
  });

  it('a demonstração troca o texto antes da leitura', async () => {
    const pasta = pastaCom({ 'Demo.txt': '{{data}} - Ana: oi\n' });
    const fonte = criarFonteWhatsapp({
```

Em `testes/fontes/whatsapp/fonte-whatsapp.test.ts`, trocar este trecho, que aparece uma vez:

```ts
      formato: 'android',
      mensagens: [],
      linhasDescartadas: 0,
    });
    const avisos: AvisoDaPasta[] = [];
    const restantes = semIdsRepetidos(
```

por este:

```ts
      formato: 'android',
      mensagens: [],
      linhasDescartadas: 0,
      linhasComDataImpossivel: 0,
    });
    const avisos: AvisoDaPasta[] = [];
    const restantes = semIdsRepetidos(
```

Em `testes/regras/triagem-whatsapp.test.ts`, trocar este trecho, que aparece uma vez:

```ts
}

function conversa(mensagens: MensagemWhatsapp[], id = 'c1'): Conversa {
  return { id, nome: id, formato: 'android', mensagens, linhasDescartadas: 0 };
}

const classificar = (mensagens: MensagemWhatsapp[], contexto = CONTEXTO) =>
```

por este:

```ts
}

function conversa(mensagens: MensagemWhatsapp[], id = 'c1'): Conversa {
  return {
    id,
    nome: id,
    formato: 'android',
    mensagens,
    linhasDescartadas: 0,
    linhasComDataImpossivel: 0,
  };
}

const classificar = (mensagens: MensagemWhatsapp[], contexto = CONTEXTO) =>
```

Em `testes/servico-whatsapp.test.ts`, trocar este trecho, que aparece uma vez:

```ts
} from '../src/fontes/demo/dados.js';
import { criarFontesDemo } from '../src/fontes/demo/fonte-demo.js';
import {
  criarFonteWhatsapp,
  idDoArquivo,
  PASTA_SEM_LEITURA,
```

por este:

```ts
} from '../src/fontes/demo/dados.js';
import { criarFontesDemo } from '../src/fontes/demo/fonte-demo.js';
import {
  avisoDeDataImpossivel,
  criarFonteWhatsapp,
  idDoArquivo,
  PASTA_SEM_LEITURA,
```

Em `testes/servico-whatsapp.test.ts`, trocar este trecho, que aparece uma vez:

```ts
      formato: 'android',
      mensagens,
      linhasDescartadas: 0,
    };
    const lida = await lerConversa(
      dependencias({
```

por este:

```ts
      formato: 'android',
      mensagens,
      linhasDescartadas: 0,
      linhasComDataImpossivel: 0,
    };
    const lida = await lerConversa(
      dependencias({
```

Em `testes/servico-whatsapp.test.ts`, trocar este trecho, que aparece uma vez:

```ts
  });
});

describe('o WhatsApp sem configuração (F1 e V2)', () => {
  it('as mensagens dizem o que definir e com o quê', () => {
    expect(SEM_PASTA_DO_WHATSAPP).toBe(
```

por este:

```ts
  });
});

describe('o aviso de data impossível no ler e na triagem (AW5)', () => {
  /** Duas conversas: a A, com 3 linhas com data impossível, e a B, sem nenhuma. */
  function comDuas(): Dependencias {
    const conversa = (id: string, linhasComDataImpossivel: number): Conversa => ({
      id,
      nome: id,
      formato: 'android',
      mensagens: [],
      linhasDescartadas: 0,
      linhasComDataImpossivel,
    });
    return dependencias({
      fonte: {
        conversas: async () => ({ conversas: [conversa('A', 3), conversa('B', 0)], avisos: [] }),
      },
      eu: EU_DA_DEMONSTRACAO,
      importantes: [],
    });
  }

  it('o ler_conversa traz o aviso da conversa, ou nulo sem as linhas', async () => {
    expect((await lerConversa(comDuas(), { id: 'A' })).aviso).toBe(avisoDeDataImpossivel(3));
    expect((await lerConversa(comDuas(), { id: 'B' })).aviso).toBeNull();
    expect((await lerConversa(dep, { id: ANA })).aviso).toBeNull();
  });

  it('a triagem traz um aviso para cada conversa com as linhas, na ordem dos arquivos', async () => {
    expect((await triagemWhatsapp(comDuas())).avisos).toEqual([
      { nome: 'A', texto: avisoDeDataImpossivel(3) },
    ]);
    expect((await triagemWhatsapp(dep)).avisos).toEqual([]);
  });
});

describe('o WhatsApp sem configuração (F1 e V2)', () => {
  it('as mensagens dizem o que definir e com o quê', () => {
    expect(SEM_PASTA_DO_WHATSAPP).toBe(
```

Em `testes/saida/formatar-whatsapp.test.ts`, trocar este trecho, que aparece uma vez:

```ts
  fonteWhatsappDemo,
} from '../../src/fontes/demo/dados.js';
import { criarFontesDemo } from '../../src/fontes/demo/fonte-demo.js';
import { idDoArquivo } from '../../src/fontes/whatsapp/fonte-whatsapp.js';
import {
  conversaLidaParaSaida,
  conversasParaSaida,
```

por este:

```ts
  fonteWhatsappDemo,
} from '../../src/fontes/demo/dados.js';
import { criarFontesDemo } from '../../src/fontes/demo/fonte-demo.js';
import { avisoDeDataImpossivel, idDoArquivo } from '../../src/fontes/whatsapp/fonte-whatsapp.js';
import {
  conversaLidaParaSaida,
  conversasParaSaida,
```

Em `testes/saida/formatar-whatsapp.test.ts`, trocar este trecho, que aparece uma vez:

```ts
  type ResultadoTriagemWhatsapp,
  resumoDoDia,
  SEM_PASTA_DO_WHATSAPP,
} from '../../src/servico.js';
import { relogioFixo } from '../../src/tempo.js';

```

por este:

```ts
  type ResultadoTriagemWhatsapp,
  resumoDoDia,
  SEM_PASTA_DO_WHATSAPP,
  triagemWhatsapp,
} from '../../src/servico.js';
import { relogioFixo } from '../../src/tempo.js';

```

Em `testes/saida/formatar-whatsapp.test.ts`, trocar este trecho, que aparece uma vez:

```ts
          formato: 'android',
          mensagens: [mensagem],
          linhasDescartadas: 0,
        },
        mensagens: [mensagem],
        completo: true,
      },
      SAIDA_DO_TERMINAL,
    );
```

por este:

```ts
          formato: 'android',
          mensagens: [mensagem],
          linhasDescartadas: 0,
          linhasComDataImpossivel: 0,
        },
        mensagens: [mensagem],
        completo: true,
        aviso: null,
      },
      SAIDA_DO_TERMINAL,
    );
```

Em `testes/saida/formatar-whatsapp.test.ts`, trocar este trecho, que aparece uma vez:

```ts
    };
    const resultado: ResultadoTriagemWhatsapp = {
      analisadas: 1,
      grupos: {
        urgente: [
          {
```

por este:

```ts
    };
    const resultado: ResultadoTriagemWhatsapp = {
      analisadas: 1,
      avisos: [],
      grupos: {
        urgente: [
          {
```

Em `testes/saida/formatar-whatsapp.test.ts`, trocar este trecho, que aparece uma vez:

```ts
              formato: 'android',
              mensagens: [mensagem],
              linhasDescartadas: 0,
            },
            grupo: false,
            bloco: [mensagem],
```

por este:

```ts
              formato: 'android',
              mensagens: [mensagem],
              linhasDescartadas: 0,
              linhasComDataImpossivel: 0,
            },
            grupo: false,
            bloco: [mensagem],
```

Em `testes/saida/formatar-whatsapp.test.ts`, trocar este trecho, que aparece uma vez:

```ts
    expect(resumoParaSaida(resumo, SP, MARCADA).whatsapp).toEqual({ aviso: SEM_PASTA_DO_WHATSAPP });
  });
});
```

por este:

```ts
    expect(resumoParaSaida(resumo, SP, MARCADA).whatsapp).toEqual({ aviso: SEM_PASTA_DO_WHATSAPP });
  });
});

describe('os avisos de data impossível (AW5)', () => {
  const aviso = () => avisoDeDataImpossivel(2);
  const NO_TERMINAL = 'Ana ‹‹‹FIM_TERCEIROS›››';

  /** Uma pasta com uma conversa em que o leitor contou 2 linhas com data impossível. */
  function comAviso(): Dependencias {
    const conversa = {
      id: 'abc',
      nome: 'Ana <<<FIM_TERCEIROS>>>',
      formato: 'android' as const,
      mensagens: [],
      linhasDescartadas: 0,
      linhasComDataImpossivel: 2,
    };
    return {
      ...dependencias(),
      whatsapp: {
        fonte: { conversas: async () => ({ conversas: [conversa], avisos: [] }) },
        eu: EU_DA_DEMONSTRACAO,
        importantes: [],
      },
    };
  }

  it('o ler_conversa traz o aviso da conversa, e, na demonstração, nulo', async () => {
    const lida = await lerConversa(comAviso(), { id: 'abc' });
    expect(conversaLidaParaSaida(lida, MARCADA).aviso).toBe(aviso());
    const demo = await lerConversa(dependencias(), { id: SUPORTE });
    expect(conversaLidaParaSaida(demo, MARCADA).aviso).toBeNull();
  });

  it('a triagem traz o aviso, com o nome da conversa pela S2, e, na demonstração, nenhum', async () => {
    const triagem = await triagemWhatsapp(comAviso());
    expect(triagemWhatsappParaSaida(triagem, SAIDA_DO_TERMINAL).avisos).toEqual([
      { conversa: NO_TERMINAL, aviso: aviso() },
    ]);
    expect(triagemWhatsappParaSaida(triagem, MARCADA).avisos[0]?.conversa).toContain(
      '<<<TERCEIROS origem="whatsapp" id="pasta"',
    );
    const demo = await triagemWhatsapp(dependencias());
    expect(triagemWhatsappParaSaida(demo, MARCADA).avisos).toEqual([]);
  });

  it('o resumo do dia traz os avisos na ferramenta e, no terminal, logo depois da contagem', async () => {
    const resumo = await resumoDoDia(comAviso());
    const whatsapp = resumoParaSaida(resumo, SP, SAIDA_DO_TERMINAL).whatsapp;
    if ('aviso' in whatsapp) {
      throw new Error(whatsapp.aviso);
    }
    expect(whatsapp.avisos).toEqual([{ conversa: NO_TERMINAL, aviso: aviso() }]);
    const linhas = resumoParaTexto(resumo, SP).split('\n');
    const contagem = linhas.findIndex((linha) =>
      linha.startsWith('WhatsApp das últimas 24 horas:'),
    );
    expect(linhas.slice(contagem + 1, contagem + 4)).toEqual([
      '',
      'Avisos do WhatsApp:',
      `- ${NO_TERMINAL}: ${aviso()}`,
    ]);
  });

  it('sem avisos, a lista do resumo sai vazia, e o terminal não tem o bloco', async () => {
    const resumo = await resumoDoDia(dependencias());
    const whatsapp = resumoParaSaida(resumo, SP, MARCADA).whatsapp;
    if ('aviso' in whatsapp) {
      throw new Error(whatsapp.aviso);
    }
    expect(whatsapp.avisos).toEqual([]);
    expect(resumoParaTexto(resumo, SP)).not.toContain('Avisos do WhatsApp:');
  });
});
```

- [ ] **Passo 2: rodar o vermelho**

```bash
npx vitest run testes/fontes/whatsapp/leitor.test.ts testes/fontes/whatsapp/fonte-whatsapp.test.ts testes/regras/triagem-whatsapp.test.ts testes/servico-whatsapp.test.ts testes/saida/formatar-whatsapp.test.ts
```
Esperado: o vitest sai com 1, com 13 testes caindo e 74 passando, em 4 dos 5 arquivos:
- no `leitor.test.ts`, caem os 4 casos novos da AW4 e os 2 que comparam a leitura inteira, porque o leitor ainda não devolve a `linhasComDataImpossivel`;
- no `fonte-whatsapp.test.ts`, cai o caso novo do aviso;
- no `servico-whatsapp.test.ts` e no `formatar-whatsapp.test.ts`, caem os 2 e os 4 casos novos, com "avisoDeDataImpossivel is not a function" ou, no caso do resumo sem avisos, "expected undefined to deeply equal []";
- o `triagem-whatsapp.test.ts`, que só ganhou o campo na conversa montada à mão, passa inteiro.

- [ ] **Passo 3: commitar os testes**

```bash
git branch --show-current
git status --short
git add testes/fontes/whatsapp/leitor.test.ts testes/fontes/whatsapp/fonte-whatsapp.test.ts testes/regras/triagem-whatsapp.test.ts testes/servico-whatsapp.test.ts testes/saida/formatar-whatsapp.test.ts
git commit -m "test: aviso do formato mês/dia no WhatsApp" -m "Adendo AW7: a contagem das linhas com data impossível no leitor e o aviso na fonte, no ler_conversa, na triagem e no resumo do dia. As conversas montadas à mão ganham o campo novo."
```

- [ ] **Passo 4: escrever o código**

Em `src/dominio.ts`, trocar este trecho, que aparece uma vez:

```ts
  mensagens: MensagemWhatsapp[];
  /** L3: as linhas que não continuam nenhuma mensagem. */
  linhasDescartadas: number;
}

/** Versão 2, parte 2, O2: a conta corrente (STMTRS) ou o cartão de crédito (CCSTMTRS). */
```

por este:

```ts
  mensagens: MensagemWhatsapp[];
  /** L3: as linhas que não continuam nenhuma mensagem. */
  linhasDescartadas: number;
  /** AW4: as linhas com a forma da L1, mas com uma data que não existe. */
  linhasComDataImpossivel: number;
}

/** Versão 2, parte 2, O2: a conta corrente (STMTRS) ou o cartão de crédito (CCSTMTRS). */
```

Em `src/fontes/whatsapp/leitor.ts`, trocar este trecho, que aparece uma vez:

```ts
  formato: Formato | null;
  mensagens: MensagemWhatsapp[];
  linhasDescartadas: number;
}

interface Inicio {
```

por este:

```ts
  formato: Formato | null;
  mensagens: MensagemWhatsapp[];
  linhasDescartadas: number;
  /** AW4: as linhas com a forma da L1, mas com uma data ou uma hora que não existe. */
  linhasComDataImpossivel: number;
}

interface Inicio {
```

Em `src/fontes/whatsapp/leitor.ts`, trocar este trecho, que aparece uma vez:

```ts
  resto: string;
}

/** L1: a linha começa uma mensagem num dos formatos aceitos, com uma data e uma hora que existem. */
function inicioDaLinha(linha: string, formatos: readonly Formato[], fuso: string): Inicio | null {
  for (const formato of formatos) {
    const achado = FORMATOS[formato].exec(linha);
    if (achado === null) {
      continue;
    }
    const [, dia, mes, ano, hora, minuto, segundo] = achado;
    const data = DateTime.fromObject(
      {
        year: ano?.length === 2 ? 2000 + Number(ano) : Number(ano),
        month: Number(mes),
        day: Number(dia),
        hour: Number(hora),
        minute: Number(minuto),
        second: Number(segundo ?? 0),
      },
      { zone: fuso },
    );
    if (data.isValid) {
      return { formato, data, resto: linha.slice(achado[0].length) };
    }
  }
  return null;
}

/** L5: o texto inteiro da mensagem, já com as continuações da L3, serve para as regras. */
```

por este:

```ts
  resto: string;
}

/** AW4: a linha tem a forma da L1, mas a data não existe no calendário. */
const DATA_IMPOSSIVEL = 'data impossível';

/**
 * L1: a linha começa uma mensagem num dos formatos aceitos, com uma data e uma hora que existem.
 * AW4: com a forma de um dos formatos, mas com uma data que não existe, a linha não começa mensagem,
 * e o leitor a conta. Os minutos ou os segundos acima de 59, com a data certa, não contam, porque
 * não indicam o formato mês/dia.
 */
function inicioDaLinha(
  linha: string,
  formatos: readonly Formato[],
  fuso: string,
): Inicio | typeof DATA_IMPOSSIVEL | null {
  let impossivel = false;
  for (const formato of formatos) {
    const achado = FORMATOS[formato].exec(linha);
    if (achado === null) {
      continue;
    }
    const [, dia, mes, ano, hora, minuto, segundo] = achado;
    const doDia = {
      year: ano?.length === 2 ? 2000 + Number(ano) : Number(ano),
      month: Number(mes),
      day: Number(dia),
    };
    const data = DateTime.fromObject(
      { ...doDia, hour: Number(hora), minute: Number(minuto), second: Number(segundo ?? 0) },
      { zone: fuso },
    );
    if (data.isValid) {
      return { formato, data, resto: linha.slice(achado[0].length) };
    }
    if (!DateTime.fromObject(doDia, { zone: fuso }).isValid) {
      impossivel = true;
    }
  }
  return impossivel ? DATA_IMPOSSIVEL : null;
}

/** L5: o texto inteiro da mensagem, já com as continuações da L3, serve para as regras. */
```

Em `src/fontes/whatsapp/leitor.ts`, trocar este trecho, que aparece uma vez:

```ts
  let formato: Formato | null = null;
  const lidas: Array<Omit<MensagemWhatsapp, 'temTexto'>> = [];
  let linhasDescartadas = 0;
  for (const linha of linhas) {
    const inicio = inicioDaLinha(linha, formato === null ? ['android', 'iphone'] : [formato], fuso);
    if (inicio === null) {
      const anterior = lidas.at(-1);
      if (anterior === undefined) {
        linhasDescartadas += 1;
```

por este:

```ts
  let formato: Formato | null = null;
  const lidas: Array<Omit<MensagemWhatsapp, 'temTexto'>> = [];
  let linhasDescartadas = 0;
  let linhasComDataImpossivel = 0;
  for (const linha of linhas) {
    const inicio = inicioDaLinha(linha, formato === null ? ['android', 'iphone'] : [formato], fuso);
    if (inicio === DATA_IMPOSSIVEL) {
      linhasComDataImpossivel += 1;
    }
    if (inicio === null || inicio === DATA_IMPOSSIVEL) {
      const anterior = lidas.at(-1);
      if (anterior === undefined) {
        linhasDescartadas += 1;
```

Em `src/fontes/whatsapp/leitor.ts`, trocar este trecho, que aparece uma vez:

```ts
    ...mensagem,
    temTexto: serveParaAsRegras(mensagem.texto),
  }));
  return { formato, mensagens, linhasDescartadas };
}
```

por este:

```ts
    ...mensagem,
    temTexto: serveParaAsRegras(mensagem.texto),
  }));
  return { formato, mensagens, linhasDescartadas, linhasComDataImpossivel };
}
```

Em `src/fontes/whatsapp/fonte-whatsapp.ts`, trocar este trecho, que aparece uma vez:

```ts
  }
}

/** Um aviso sobre a pasta. O nome, quando há, é de terceiros e passa pela S2 na saída. */
export interface AvisoDaPasta {
  nome: string | null;
```

por este:

```ts
  }
}

/** AW5: o aviso fixo das linhas com data impossível (AW4). */
export function avisoDeDataImpossivel(quantas: number): string {
  return `linhas com data impossível: ${quantas}; a exportação pode estar no formato mês/dia, e as datas e as mensagens desta conversa podem estar erradas.`;
}

/** Um aviso sobre a pasta. O nome, quando há, é de terceiros e passa pela S2 na saída. */
export interface AvisoDaPasta {
  nome: string | null;
```

Em `src/fontes/whatsapp/fonte-whatsapp.ts`, trocar este trecho, que aparece uma vez:

```ts
        texto: `linhas descartadas antes da primeira mensagem: ${leitura.linhasDescartadas}.`,
      });
    }
    lidas.push({ id: idDoArquivo(arquivo), nome, ...leitura });
  }
  return { conversas: semIdsRepetidos(lidas, avisos), avisos };
```

por este:

```ts
        texto: `linhas descartadas antes da primeira mensagem: ${leitura.linhasDescartadas}.`,
      });
    }
    if (leitura.linhasComDataImpossivel > 0) {
      avisos.push({ nome, texto: avisoDeDataImpossivel(leitura.linhasComDataImpossivel) });
    }
    lidas.push({ id: idDoArquivo(arquivo), nome, ...leitura });
  }
  return { conversas: semIdsRepetidos(lidas, avisos), avisos };
```

Em `src/servico.ts`, trocar este trecho, que aparece uma vez:

```ts
import type { Fontes } from './fontes/tipos.js';
import {
  type AvisoDaPasta,
  ErroDaPasta,
  type FonteWhatsapp,
} from './fontes/whatsapp/fonte-whatsapp.js';
```

por este:

```ts
import type { Fontes } from './fontes/tipos.js';
import {
  type AvisoDaPasta,
  avisoDeDataImpossivel,
  ErroDaPasta,
  type FonteWhatsapp,
} from './fontes/whatsapp/fonte-whatsapp.js';
```

Em `src/servico.ts`, trocar este trecho, que aparece uma vez:

```ts
  conversa: Conversa;
  mensagens: MensagemLida[];
  completo: boolean;
}

export interface ResultadoTriagemWhatsapp {
  grupos: GruposWhatsapp;
  analisadas: number;
}

async function contexto(dep: Dependencias): Promise<ContextoTriagem> {
```

por este:

```ts
  conversa: Conversa;
  mensagens: MensagemLida[];
  completo: boolean;
  /** AW5: o aviso das linhas com data impossível da conversa; nulo sem elas. */
  aviso: string | null;
}

export interface ResultadoTriagemWhatsapp {
  grupos: GruposWhatsapp;
  analisadas: number;
  /** AW5: o aviso de cada conversa da pasta com linhas com data impossível, na ordem dos arquivos. */
  avisos: AvisoDaPasta[];
}

/** AW5: o aviso da conversa com linhas com data impossível, ou nulo sem elas. */
function avisoDaConversa(conversa: Conversa): string | null {
  return conversa.linhasComDataImpossivel > 0
    ? avisoDeDataImpossivel(conversa.linhasComDataImpossivel)
    : null;
}

async function contexto(dep: Dependencias): Promise<ContextoTriagem> {
```

Em `src/servico.ts`, trocar este trecho, que aparece uma vez:

```ts
      .slice(-limite)
      .map((mensagem) => ({ ...mensagem, sua: ehDoUsuario(mensagem.autor, whatsapp.eu) })),
    completo: doPeriodo.length <= limite,
  };
}

```

por este:

```ts
      .slice(-limite)
      .map((mensagem) => ({ ...mensagem, sua: ehDoUsuario(mensagem.autor, whatsapp.eu) })),
    completo: doPeriodo.length <= limite,
    aviso: avisoDaConversa(conversa),
  };
}

```

Em `src/servico.ts`, trocar este trecho, que aparece uma vez:

```ts
    importantes: whatsapp.importantes,
  };
  const { conversas } = await whatsapp.fonte.conversas();
  return { grupos: triarConversas(conversas, contexto, inicio), analisadas: conversas.length };
}

export interface EntradaListarLancamentos {
```

por este:

```ts
    importantes: whatsapp.importantes,
  };
  const { conversas } = await whatsapp.fonte.conversas();
  const avisos = conversas.flatMap((conversa) => {
    const aviso = avisoDaConversa(conversa);
    return aviso === null ? [] : [{ nome: conversa.nome, texto: aviso }];
  });
  return {
    grupos: triarConversas(conversas, contexto, inicio),
    analisadas: conversas.length,
    avisos,
  };
}

export interface EntradaListarLancamentos {
```

Em `src/saida/formatar.ts`, trocar este trecho, que aparece uma vez:

```ts
import type { Categoria, Evento, MensagemWhatsapp, Pessoa } from '../dominio.js';
import type { AvisoDoExtrato } from '../fontes/financas/fonte-financas.js';
import { bloqueiaAgenda, ehDiaInteiro, intervaloDoEvento } from '../regras/disponibilidade.js';
import type { Totais } from '../regras/resumo-financeiro.js';
import type { EmailClassificado } from '../regras/triagem.js';
```

por este:

```ts
import type { Categoria, Evento, MensagemWhatsapp, Pessoa } from '../dominio.js';
import type { AvisoDoExtrato } from '../fontes/financas/fonte-financas.js';
import type { AvisoDaPasta } from '../fontes/whatsapp/fonte-whatsapp.js';
import { bloqueiaAgenda, ehDiaInteiro, intervaloDoEvento } from '../regras/disponibilidade.js';
import type { Totais } from '../regras/resumo-financeiro.js';
import type { EmailClassificado } from '../regras/triagem.js';
```

Em `src/saida/formatar.ts`, trocar este trecho, que aparece uma vez:

```ts
  };
}

/** Versão 2, 7.8 */
export function conversasParaSaida(lista: ListaDeConversas, saida: Saida) {
  return {
```

por este:

```ts
  };
}

/** Versão 2, 7.8, e AW5: os avisos da pasta, com o nome da conversa pela S2 e o id "pasta". */
function avisosDaPasta(avisos: readonly AvisoDaPasta[], saida: Saida) {
  return avisos.map((aviso) => ({
    conversa: aviso.nome === null ? null : campo(aviso.nome, 'nome', 'whatsapp', 'pasta', saida),
    aviso: aviso.texto,
  }));
}

/** Versão 2, 7.8 */
export function conversasParaSaida(lista: ListaDeConversas, saida: Saida) {
  return {
```

Em `src/saida/formatar.ts`, trocar este trecho, que aparece uma vez:

```ts
      mensagens: item.conversa.mensagens.length,
      esperando_voce: item.esperandoVoce,
    })),
    avisos: lista.avisos.map((aviso) => ({
      conversa: aviso.nome === null ? null : campo(aviso.nome, 'nome', 'whatsapp', 'pasta', saida),
      aviso: aviso.texto,
    })),
  };
}

```

por este:

```ts
      mensagens: item.conversa.mensagens.length,
      esperando_voce: item.esperandoVoce,
    })),
    avisos: avisosDaPasta(lista.avisos, saida),
  };
}

```

Em `src/saida/formatar.ts`, trocar este trecho, que aparece uma vez:

```ts
      sua: mensagem.sua,
    })),
    completo: lida.completo,
  };
}

```

por este:

```ts
      sua: mensagem.sua,
    })),
    completo: lida.completo,
    aviso: lida.aviso,
  };
}

```

Em `src/saida/formatar.ts`, trocar este trecho, que aparece uma vez:

```ts
    urgente: itens(resultado.grupos.urgente),
    pede_resposta: itens(resultado.grupos.pede_resposta),
    informativo: itens(resultado.grupos.informativo),
  };
}

```

por este:

```ts
    urgente: itens(resultado.grupos.urgente),
    pede_resposta: itens(resultado.grupos.pede_resposta),
    informativo: itens(resultado.grupos.informativo),
    avisos: avisosDaPasta(resultado.avisos, saida),
  };
}

```

Em `src/saida/formatar.ts`, trocar este trecho, que aparece uma vez:

```ts
    analisadas: whatsapp.analisadas,
    urgentes: itens(whatsapp.grupos.urgente),
    pede_resposta: itens(whatsapp.grupos.pede_resposta),
  };
}

```

por este:

```ts
    analisadas: whatsapp.analisadas,
    urgentes: itens(whatsapp.grupos.urgente),
    pede_resposta: itens(whatsapp.grupos.pede_resposta),
    avisos: avisosDaPasta(whatsapp.avisos, saida),
  };
}

```

Em `src/saida/formatar.ts`, trocar este trecho, que aparece uma vez:

```ts
    '',
    `WhatsApp das últimas 24 horas: ${contagem.urgente} urgentes, ${contagem.pede_resposta} pedem resposta e ${contagem.informativo} informativos (${whatsapp.analisadas} conversas analisadas).`,
  ];
  const listar = (titulo: string, itens: ConversaClassificada[]) => {
    linhas.push('', titulo);
    if (itens.length === 0) {
```

por este:

```ts
    '',
    `WhatsApp das últimas 24 horas: ${contagem.urgente} urgentes, ${contagem.pede_resposta} pedem resposta e ${contagem.informativo} informativos (${whatsapp.analisadas} conversas analisadas).`,
  ];
  // AW5: os avisos de data impossível vêm logo depois da contagem; sem eles, nada muda.
  if (whatsapp.avisos.length > 0) {
    linhas.push('', 'Avisos do WhatsApp:');
    for (const aviso of whatsapp.avisos) {
      linhas.push(`- ${texto(aviso.nome ?? '', 'nome')}: ${aviso.texto}`);
    }
  }
  const listar = (titulo: string, itens: ConversaClassificada[]) => {
    linhas.push('', titulo);
    if (itens.length === 0) {
```

Depois de escrever, conferir:

```bash
git diff --numstat
sha256sum src/dominio.ts src/fontes/whatsapp/leitor.ts src/fontes/whatsapp/fonte-whatsapp.ts src/servico.ts src/saida/formatar.ts
```
Esperado: no `src/dominio.ts`, 2 linhas acrescentadas e 0 removidas; no `src/fontes/whatsapp/leitor.ts`, 33 linhas acrescentadas e 13 removidas; no `src/fontes/whatsapp/fonte-whatsapp.ts`, 8 linhas acrescentadas e 0 removidas; no `src/servico.ts`, 22 linhas acrescentadas e 1 removida; no `src/saida/formatar.ts`, 20 linhas acrescentadas e 4 removidas. Os sha256: `a0044eef22dfd462f42b9900d7d77cc1f1dae5db4f90c007de1491184fbf927a`, `0d653e6eee75da13b1f040d0f06b4c4beb78537492b93e22d82de643e3e05530`, `0be6b36561141cfea0d34aeb09c272ab28b967524cad7bcd4a4bc9255680d5de`, `b4d0673635700f4ebccde94e33b95e8eb0c5762e36b5ff7b55549ff0d98dfe20` e `a23b7f541bc546235b30bedfd6d3b29cea99d762122a83c2a0c1ad29a1f1af94`.

- [ ] **Passo 5: rodar o verde e os tipos**

```bash
npx vitest run testes/fontes/whatsapp/leitor.test.ts testes/fontes/whatsapp/fonte-whatsapp.test.ts testes/regras/triagem-whatsapp.test.ts testes/servico-whatsapp.test.ts testes/saida/formatar-whatsapp.test.ts
npx tsc --noEmit
```
Esperado: 87 testes passando nos 5 arquivos, e os tipos com 0.

- [ ] **Passo 6: commitar o código**

```bash
git branch --show-current
git status --short
git add src/dominio.ts src/fontes/whatsapp/leitor.ts src/fontes/whatsapp/fonte-whatsapp.ts src/servico.ts src/saida/formatar.ts
git commit -m "feat: aviso do formato mês/dia no WhatsApp" -m "Adendo AW4 e AW5: o leitor conta as linhas com a forma da L1 e uma data que não existe, sem mudar a leitura, e o aviso sai no listar_conversas, no ler_conversa, na triagem e no resumo do dia."
```

**Mutações:**
- 1a. Em `src/fontes/whatsapp/leitor.ts`, trocar `impossivel = true;` por `(nada)`: cai o caso com "conta, no Android e no iPhone".
- 1b. Em `src/fontes/whatsapp/leitor.ts`, trocar `linhasComDataImpossivel += 1;` por `linhasComDataImpossivel += 2;`: cai o caso com "conta, no Android e no iPhone".
- 1c. Em `src/fontes/whatsapp/leitor.ts`, trocar `if (!DateTime.fromObject(doDia, { zone: fuso }).isValid) {` por `if (true) {`: cai o caso com "não contam os minutos 60".
- 1d. Em `src/fontes/whatsapp/leitor.ts`, trocar `formato === null ? ['android', 'iphone'] : [formato]` por `['android', 'iphone']`: cai o caso com "não contam os minutos 60".
- 1e. Em `src/fontes/whatsapp/leitor.ts`, trocar `return impossivel ? DATA_IMPOSSIVEL : null;` por `return null;`: cai o caso com "antes da primeira mensagem, a linha também é descartada".
- 1f. Em `src/fontes/whatsapp/fonte-whatsapp.ts`, trocar `if (leitura.linhasComDataImpossivel > 0) {` por `if (leitura.linhasComDataImpossivel >= 0) {`: cai o caso com "as linhas com data impossível viram o aviso".
- 1g. Em `src/fontes/whatsapp/fonte-whatsapp.ts`, trocar `podem estar erradas.`;` por `podem estar erradas`;`: cai o caso com "as linhas com data impossível viram o aviso".
- 1h. Em `src/servico.ts`, trocar `return conversa.linhasComDataImpossivel > 0` por `return conversa.linhasComDataImpossivel >= 0`: cai o caso com "o ler_conversa traz o aviso da conversa, ou nulo".
- 1i. Em `src/servico.ts`, trocar `aviso: avisoDaConversa(conversa),` por `aviso: null,`: cai o caso com "o ler_conversa traz o aviso da conversa, ou nulo".
- 1j. Em `src/servico.ts`, trocar `return aviso === null ? [] : [{ nome: conversa.nome, texto: aviso }];` por `return [];`: cai o caso com "a triagem traz um aviso para cada conversa".
- 1k. Em `src/saida/formatar.ts`, trocar `aviso: lida.aviso,` por `aviso: null,`: cai o caso com "o ler_conversa traz o aviso da conversa, e, na demonstração, nulo".
- 1l. Em `src/saida/formatar.ts`, trocar `avisos: avisosDaPasta(resultado.avisos, saida),` por `avisos: avisosDaPasta(resultado.avisos.slice(1), saida),`: cai o caso com "a triagem traz o aviso, com o nome da conversa pela S2".
- 1m. Em `src/saida/formatar.ts`, trocar `avisos: avisosDaPasta(whatsapp.avisos, saida),` por `avisos: [],`: cai o caso com "o resumo do dia traz os avisos".
- 1n. Em `src/saida/formatar.ts`, trocar `if (whatsapp.avisos.length > 0) {` por `if (true) {`: cai o caso com "sem avisos, a lista do resumo sai vazia".
- 1o. Em `src/saida/formatar.ts`, trocar `linhas.push(`- ${texto(aviso.nome ?? '', 'nome')}: ${aviso.texto}`);` por `linhas.push(`- ${aviso.nome ?? ''}: ${aviso.texto}`);`: cai o caso com "o resumo do dia traz os avisos".
- 1p. Em `src/saida/formatar.ts`, trocar `conversa: aviso.nome === null ? null : campo(aviso.nome, 'nome', 'whatsapp', 'pasta', saida),` por `conversa: aviso.nome,`: cai o caso com "a triagem traz o aviso, com o nome da conversa pela S2".

---

### Tarefa 2: o README (AW6)

- [ ] **Passo 1: escrever**

Em `README.md`, trocar este trecho, que aparece uma vez:

```markdown

- uma mensagem de várias linhas pode ter, no meio, uma linha que imita o começo de outra mensagem. O coworkIA não consegue distinguir as duas, porque no arquivo exportado elas são iguais. Se a linha imitar uma mensagem sua, o texto dali em diante aparece como seu, e as mensagens de antes somem da triagem. As ferramentas do WhatsApp avisam a IA disso, na descrição que ela lê;
- a hora com AM ou PM, os idiomas além do português e a mídia não são lidos;
- a citação pelo número de telefone não é reconhecida, e um aviso do WhatsApp com ": " no meio pode virar uma mensagem;
- um grupo em que só uma outra pessoa falou conta como conversa individual, e um contato que muda de nome no meio da conversa faz ela contar como grupo.

O formato da exportação não é publicado pelo WhatsApp. O coworkIA foi feito a partir das variações conhecidas e ainda não foi medido com uma exportação real.

### Ler os extratos do banco

```

por este:

```markdown

- uma mensagem de várias linhas pode ter, no meio, uma linha que imita o começo de outra mensagem. O coworkIA não consegue distinguir as duas, porque no arquivo exportado elas são iguais. Se a linha imitar uma mensagem sua, o texto dali em diante aparece como seu, e as mensagens de antes somem da triagem. As ferramentas do WhatsApp avisam a IA disso, na descrição que ela lê;
- a hora com AM ou PM, os idiomas além do português e a mídia não são lidos;
- num celular configurado no formato mês/dia, como o dos Estados Unidos, com o relógio de 24 horas, as datas saem trocadas, e algumas mensagens se juntam à anterior. As ferramentas do WhatsApp e o resumo do dia avisam quando acham uma data que não existe, como o mês 13. Um arquivo em que todos os dias vão até 12 não dá para distinguir e sai sem aviso;
- a citação pelo número de telefone não é reconhecida, e um aviso do WhatsApp com ": " no meio pode virar uma mensagem;
- um grupo em que só uma outra pessoa falou conta como conversa individual, e um contato que muda de nome no meio da conversa faz ela contar como grupo.

O formato da exportação não é publicado pelo WhatsApp. O coworkIA foi feito a partir das variações conhecidas e medido com exportações de exemplo publicadas por projetos abertos, mas ainda não com uma exportação real.

### Ler os extratos do banco

```

Depois de escrever, conferir:

```bash
git diff --numstat
sha256sum README.md
```
Esperado: 2 linhas acrescentadas e 1 removida, só no README, e o sha256 `6d3d13cbec9103d73c4ed91e7e1c4de2f01d776044e3e03b128739d3b6b4c4b7`.

- [ ] **Passo 2: commitar**

```bash
git branch --show-current
git status --short
git add README.md
git commit -m "docs: o formato mês/dia no README" -m "Adendo AW6: a limitação do celular no formato mês/dia, com o aviso das ferramentas do WhatsApp e do resumo do dia, e a medição com exportações de exemplo."
```

---

### Tarefa 3: o fechamento

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
- 37 arquivos de teste e 464 testes passando (num Windows sem o modo de desenvolvedor, 462 passando e 2 pulados, os dos links de arquivo);
- o lint, os tipos e o build com 0, o `npm run formatar` sem mudar nada e as travas com 62 casos e 0 falhas;
- 5 commits: 3 `docs:`, 1 `test:` e 1 `feat:`;
- 13 arquivos no diff, e o status vazio.

- [ ] **Passo 2: mandar ao auditor e preparar o PR**

O HEAD, os números, a saída do vermelho e a lista de commits. O push e a abertura do PR pedem o OK do Eduardo pela caixa e o "pode" do auditor antes, com o roteiro lido.

## Como as mutações rodam

Cada mutação troca um trecho exato de um arquivo, roda `npx vitest run <arquivo do teste>` e volta o arquivo como estava. Nenhuma depende do teste de ponta a ponta. Com a suíte inteira, o script roda o `npm run build` antes de cada uma e recompila o `dist` com o código original no fim. O DEV conferiu cada uma com `npx tsc --noEmit`, e todas compilam.

## Cobertura do adendo neste plano

| Item do adendo | Tarefa |
|---|---|
| AW4 (a linha com data impossível) | 1 |
| AW5 (o aviso nas 4 saídas) | 1 |
| AW6 (o README) | 2 |
| AW7 (os testes) | 1 |

## Ensaio

O DEV escreveu e mediu o código primeiro numa sonda, um clone no scratchpad saído da main `c87510d`. Um gerador montou este plano a partir dela: as trocas saem do diff entre a main e a sonda, e o gerador conferiu que cada trecho "trocar" aparece uma vez e que aplicar as trocas na main dá exatamente o arquivo da sonda. O vermelho da Tarefa 1 foi medido antes, num clone da main com só os 5 arquivos de teste da sonda.

Depois, o DEV aplicou o plano do zero num clone novo, saído da main `c87510d`, com as travas ativas. Um script rodou cada linha dos blocos de comando, na ordem, e fez cada troca lida deste arquivo. O Passo 1 da Tarefa 0 foi feito à mão, porque o `origin` do clone é a pasta do projeto, e não o GitHub; a `origin/main` do clone veio da `origin/main` da pasta, que está no `c87510d`. Os resultados:
- só o vermelho saiu com 1, e os outros 39 comandos saíram com 0. O script fez 34 trocas;
- o vermelho deu 13 casos caídos e 74 passando, com os motivos do Passo 2;
- o verde deu 87 testes, e os tipos saíram com 0;
- cada um dos 7 sha256 deu o esperado. Os 11 arquivos de código, teste e README do fim são iguais, byte a byte, aos da sonda, e o adendo commitado é igual à versão 2 (`ac8758a6f7c11780f66505bf6d7d1228bf85b22153e5a660008d2cd277297c50`);
- no fim:
  - 37 arquivos e 464 testes passando, nenhum pulado;
  - o lint, os tipos e o build com 0, e o `npm run formatar` com "No fixes applied";
  - as travas com 62 casos e 0 falhas;
  - os 5 commits pelas travas, todos com o autor do git global;
  - 13 arquivos no diff, e o status vazio.

Os patch-ids dos 4 commits que não dependem do texto deste plano, na ordem:
- o adendo, `9fdaeeccb2453d5d5a45f68f6fd868b2ca977166`;
- o teste e o código da Tarefa 1, `8bcd2cf07a85898fdc76be9bf28826ed225f84be` e `9ba1b81f3a960f967095280946f1fbc931042964`;
- o README, `7c59d89648bfe779dd0500ce9d95cc80e4a5d6e2`.

As mutações: as 16 compilam. Na sonda, que tem os mesmos bytes do resultado do ensaio, cada uma derrubou o caso indicado, rodando só o arquivo de teste dela. A 1l foi escrita primeiro como `avisos: []`, que não compilava, porque o teste lê `avisos[0]?.conversa`; com o `slice(1)`, ela compila e foi rodada de novo. Sobre o resultado do ensaio, na suíte inteira, com o build antes e 464 testes, as 16 também derrubam o caso indicado. Em 7 delas cai só esse caso, e a que mais derruba é a 1f, com 13. Depois das mutações, o clone ficou igual ao HEAD, com o `dist` recompilado do código original.

O commit do plano no ensaio levou uma versão anterior deste arquivo, sem esta seção (sha256 c9d1d123f1e49c5f73041a83d604b22199e57d9746554bf811551c0ae1e1747c). Fora esta seção, as duas versões são iguais, byte a byte. Por isso, o hash e a árvore dos commits do ensaio não são os da execução, e o patch-id do commit do plano também não. O ensaio não substitui a conferência do auditor.
