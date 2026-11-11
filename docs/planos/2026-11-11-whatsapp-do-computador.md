# Plano da exportação do WhatsApp do computador (versão 1 do plano)

> **Para quem executa:** use a habilidade superpowers:executing-plans, tarefa por tarefa. Os passos usam caixas de seleção (`- [ ]`).

**Objetivo:** ler o `.txt` exportado pelo WhatsApp do computador, com o mês antes do dia e a hora com AM ou PM, como o adendo AW8 a AW13 descreve: o "Você" como o usuário, a mídia entre `<` e `>` e a mensagem apagada fora das regras, o aviso de data impossível com "dia/mês" nesse formato e o README.

**Arquitetura:**
- O leitor (`src/fontes/whatsapp/leitor.ts`) ganha o terceiro formato da L1, com a hora de 1 a 12 convertida para 0 a 23, o traço que faz da linha um aviso e a primeira linha do arquivo que deixa de contar como descartada (AW8). Ele marca a mensagem do "Você" (AW9) e, só nesse formato, tira das regras a mensagem inteira entre `<` e `>` e a "Mensagem apagada" (AW10). A `Conversa` (`src/dominio.ts`) aceita o formato novo, e a `MensagemWhatsapp` ganha a marca opcional `doUsuario`.
- A regra da triagem (`src/regras/triagem-whatsapp.ts`) ganha a `mensagemDoUsuario`, que aceita a marca ou a lista da V1. Ela passa a valer no grupo (V3), no bloco que espera resposta (seção 8) e, pelo serviço (`src/servico.ts`), no campo `sua` do `ler_conversa`. A busca de citações (V4) não muda.
- O aviso de data impossível (`src/fontes/whatsapp/fonte-whatsapp.ts`) recebe o formato e diz "dia/mês" no formato do computador (AW11), nos avisos da pasta e, pelo serviço, no `ler_conversa`, na triagem e no resumo do dia.
- O README ganha a exportação do computador, o "Você", as limitações e a medição (AW12). A demonstração não muda.
- A Tarefa 1 tem o commit do teste vermelho (`test:`) e o do código (`feat:`). Os testes que já existem não mudam: a marca é opcional, e o aviso aceita o formato como segundo parâmetro, nulo quando falta.

**Base:**
- o adendo `docs/specs/2026-11-11-versao-2-whatsapp-adendo-computador.md`, na versão 3 do documento (sha256 49964449524796cdc2a6a4c362b1a456017ba19d9fd67525b4cb783971dcf0a5). A versão 2 foi liberada pelo auditor, e a 3 só troca a citação da S7 pelas palavras dela, por uma nota do auditor sem achado. Ele vai ao Eduardo junto com o pedido do "Aprovo o adendo e pode executar" e entra no repositório na Tarefa 0;
- as escolhas do Eduardo pela caixa em 2026-11-11: "Ler o chat.txt", "'Você' é sempre o usuário", "Regra geral com < e >", "Renomear, como no iPhone", "Está certo, pode escrever" e, depois do parecer da versão 1 do adendo, "Registrar como exceção" e "Incluir os dois na v2";
- a spec do WhatsApp (`docs/specs/2026-11-06-versao-2-whatsapp.md`, na versão 4 do documento), os adendos AW1 a AW3 e AW4 a AW7, a spec da versão 1 e os adendos AD1 a AD18, que continuam valendo.

**Versões deste plano:** esta é a versão 1.

**Ensaio feito pelo DEV antes de mandar:** ver a seção "Ensaio", no fim.

## Restrições globais (valem para todas as tarefas)

- Tudo o que vale nos planos anteriores continua valendo: Node 24 ou mais novo, TypeScript `strict` com `noUncheckedIndexedAccess`, ESM com imports terminando em `.js`, Biome e Vitest.
- Nenhum escape `\u` e nenhum caractere invisível entram nos arquivos. Os testes montam o U+202F com `String.fromCodePoint`. Nenhuma dependência nova.
- **Toda mudança de arquivo que já existe é uma troca exata**: o trecho "trocar" aparece uma vez só no arquivo e é trocado pelo trecho "por este".
- Depois de cada passo de escrita, o `git diff --numstat` e o sha256 de cada arquivo conferem os bytes.
- Os blocos de código já estão no formato do Biome, e o `npm run formatar` não deve mudar nenhum arquivo.
- Os commits seguem a CONTRIBUTING.md, seção 4. As travas locais estão ativas. Cada bloco de commit começa com o `git branch --show-current` (espera `feat/whatsapp-do-computador`) e o `git status --short`.
- A cada tarefa, o DEV manda ao auditor os hashes, a saída do vermelho e do verde e os tipos.

## Mapa de arquivos

- Criar: `docs/specs/2026-11-11-versao-2-whatsapp-adendo-computador.md` e `docs/planos/2026-11-11-whatsapp-do-computador.md` (Tarefa 0)
- Modificar: `testes/fontes/whatsapp/leitor.test.ts`, `testes/fontes/whatsapp/fonte-whatsapp.test.ts`, `testes/regras/triagem-whatsapp.test.ts`, `testes/servico-whatsapp.test.ts`, `src/dominio.ts`, `src/fontes/whatsapp/leitor.ts`, `src/fontes/whatsapp/fonte-whatsapp.ts`, `src/regras/triagem-whatsapp.ts` e `src/servico.ts` (Tarefa 1)
- Modificar: `README.md` (Tarefa 2)

---

### Tarefa 0: branch, adendo e plano

- [ ] **Passo 1: criar a branch a partir da main atualizada**

```bash
git status --short
git fetch origin
git switch --no-track -c feat/whatsapp-do-computador origin/main
git log --oneline -1
git config --get core.hooksPath
```
Esperado: o status vazio antes da troca, o topo no `e725d87` (o merge do PR 14) ou num merge mais novo, e as travas em `.githooks`.

- [ ] **Passo 2: commitar o adendo liberado**

```bash
cp "C:/Users/EDUARD~1/AppData/Local/Temp/claude/9bb78e7f8b1714b4/fc600f43-1af8-4aa6-adae-7be1427cd432/scratchpad/adendo-computador-v3.md" docs/specs/2026-11-11-versao-2-whatsapp-adendo-computador.md
sha256sum docs/specs/2026-11-11-versao-2-whatsapp-adendo-computador.md
git branch --show-current
git status --short
git add docs/specs/2026-11-11-versao-2-whatsapp-adendo-computador.md
git commit -m "docs: adendo da exportação do WhatsApp do computador" -m "O adendo AW8 a AW13 à spec do WhatsApp, na versão 3 do documento, liberado pelo auditor e aprovado pelo Eduardo junto com o plano."
```
Esperado: o sha256 `49964449524796cdc2a6a4c362b1a456017ba19d9fd67525b4cb783971dcf0a5`.

- [ ] **Passo 3: commitar o plano, na versão LIBERADA**

A versão liberada é o arquivo `plano-computador-vN.md` do scratchpad do DEV com o maior N que o auditor deu como LIBERADO.

```bash
cp "C:/Users/EDUARD~1/AppData/Local/Temp/claude/9bb78e7f8b1714b4/fc600f43-1af8-4aa6-adae-7be1427cd432/scratchpad/plano-computador-vN.md" docs/planos/2026-11-11-whatsapp-do-computador.md
sha256sum docs/planos/2026-11-11-whatsapp-do-computador.md
git branch --show-current
git status --short
git add docs/planos/2026-11-11-whatsapp-do-computador.md
git commit -m "docs: plano da exportação do WhatsApp do computador" -m "O formato do computador no leitor, o Você como o usuário, a mídia fora das regras, o aviso com dia/mês e o README. Cópia fiel da versão liberada pelo auditor."
```
Esperado: o sha256 igual ao que o auditor liberou.

---

### Tarefa 1: o formato, o "Você", a mídia e o aviso (AW8 a AW11 e AW13)

**O que faz:** o leitor reconhece a linha `[m/d/aa, h:mm:ss AM] ` do computador, com o traço nos avisos, e a primeira linha do arquivo, sem prefixo, deixa de contar como descartada (AW8). A mensagem do "Você", só nesse formato, ganha a marca do usuário, que vale no grupo, no bloco que espera resposta e no campo `sua` (AW9). Nesse formato, a mensagem inteira entre `<` e `>` e a "Mensagem apagada" não servem para as regras (AW10). O aviso de data impossível diz "dia/mês" num arquivo do computador (AW11).

- [ ] **Passo 1: escrever os testes**

Em `testes/fontes/whatsapp/leitor.test.ts`, trocar este trecho, que aparece uma vez:

```ts
const LRM = String.fromCodePoint(0x200e);
const RLM = String.fromCodePoint(0x200f);
const BOM = String.fromCodePoint(0xfeff);
const ler = (linhas: string[]) => lerExportacao(linhas.join('\n'), SP);

describe('lerExportacao: o formato do Android (L1 e L2)', () => {
```

por este:

```ts
const LRM = String.fromCodePoint(0x200e);
const RLM = String.fromCodePoint(0x200f);
const BOM = String.fromCodePoint(0xfeff);
const ESPACO_ESTREITO = String.fromCodePoint(0x202f);
const ler = (linhas: string[]) => lerExportacao(linhas.join('\n'), SP);

describe('lerExportacao: o formato do Android (L1 e L2)', () => {
```

Em `testes/fontes/whatsapp/leitor.test.ts`, trocar este trecho, que aparece uma vez:

```ts
  });
});

describe('lerExportacao: o arquivo (F3)', () => {
  it('tira o BOM, aceita o fim de linha do Windows e ignora a quebra do fim', () => {
    const lida = lerExportacao(
```

por este:

```ts
  });
});

describe('lerExportacao: o formato do computador (AW8)', () => {
  it('lê a mensagem e o aviso com o traço, mesmo com ": " no aviso', () => {
    expect(
      ler([
        'As mensagens são protegidas com a criptografia de ponta a ponta.',
        '[9/21/26, 9:43:35 AM] - As mensagens são protegidas com a criptografia de ponta a ponta.',
        '[9/21/26, 9:43:36 AM] - Ana mudou a descrição do grupo: obra',
        '[9/21/26, 9:44:18 AM] Ana: oi',
      ]),
    ).toEqual({
      formato: 'computador',
      mensagens: [{ autor: 'Ana', data: '2026-09-21T09:44:18-03:00', texto: 'oi', temTexto: true }],
      linhasDescartadas: 0,
      linhasComDataImpossivel: 0,
    });
  });

  it('a hora de 1 a 12 com AM ou PM, com ou sem os segundos', () => {
    const lida = ler([
      '[9/21/26, 12:05:00 AM] Ana: meia-noite',
      '[9/21/26, 12:05:00 PM] Ana: meio-dia',
      '[9/21/26, 1:36:02 PM] Ana: tarde',
      '[9/21/26, 11:59 PM] Ana: sem os segundos',
    ]);
    expect(lida.mensagens.map((mensagem) => mensagem.data)).toEqual([
      '2026-09-21T00:05:00-03:00',
      '2026-09-21T12:05:00-03:00',
      '2026-09-21T13:36:02-03:00',
      '2026-09-21T23:59:00-03:00',
    ]);
  });

  it('as horas 0 e 13, o am minúsculo e o espaço estreito antes do AM não casam', () => {
    expect(ler(['[9/21/26, 0:05:00 AM] Ana: oi']).formato).toBeNull();
    expect(ler(['[9/21/26, 13:05:00 PM] Ana: oi']).formato).toBeNull();
    expect(ler(['[9/21/26, 9:05:00 am] Ana: oi']).formato).toBeNull();
    expect(ler([`[9/21/26, 9:05:00${ESPACO_ESTREITO}AM] Ana: oi`]).formato).toBeNull();
  });

  it('o mês antes do dia, com o ano de 2 ou de 4 dígitos', () => {
    expect(ler(['[9/21/2026, 9:44:18 AM] Ana: oi']).mensagens[0]?.data).toBe(
      '2026-09-21T09:44:18-03:00',
    );
    expect(ler(['[09/01/26, 9:44:18 AM] Ana: oi']).mensagens[0]?.data).toBe(
      '2026-09-01T09:44:18-03:00',
    );
  });

  it('só a primeira linha do arquivo, sem prefixo, deixa de contar como descartada', () => {
    const lida = ler(['aviso sem data', 'outra linha solta', '[9/21/26, 9:44:18 AM] Ana: oi']);
    expect(lida).toMatchObject({ formato: 'computador', linhasDescartadas: 1 });
    const comAviso = ler([
      '[9/21/26, 9:43:35 AM] - Ana criou o grupo',
      'linha solta',
      '[9/21/26, 9:44:18 AM] Ana: oi',
    ]);
    expect(comAviso).toMatchObject({ formato: 'computador', linhasDescartadas: 1 });
  });

  it('junta as continuações à mensagem', () => {
    const lida = ler(['[9/21/26, 9:44:18 AM] Ana: primeira', 'segunda', '', 'quarta']);
    expect(lida.mensagens[0]?.texto).toBe('primeira\nsegunda\n\nquarta');
  });

  it('a linha de um formato continua a anterior num arquivo do outro', () => {
    const android = ler(['05/11/2026 14:32 - Ana: oi', '[9/21/26, 9:44:18 AM] Bia: do computador']);
    expect(android).toMatchObject({ formato: 'android', linhasComDataImpossivel: 0 });
    expect(android.mensagens).toHaveLength(1);
    const computador = ler([
      '[9/21/26, 9:44:18 AM] Ana: oi',
      '05/11/2026 14:32 - Bia: do Android',
      '[05/11/2026, 14:33:00] Bia: do iPhone',
    ]);
    expect(computador.formato).toBe('computador');
    expect(computador.mensagens).toHaveLength(1);
  });

  it('conta a data impossível lida como mês/dia (AW11)', () => {
    const lida = ler(['[9/21/26, 9:44:18 AM] Ana: oi', '[21/9/26, 9:45:00 AM] Ana: o mês 21']);
    expect(lida).toMatchObject({ formato: 'computador', linhasComDataImpossivel: 1 });
    expect(lida.mensagens).toHaveLength(1);
  });
});

describe('lerExportacao: o "Você" do computador (AW9)', () => {
  it('a mensagem do "Você" ganha a marca do usuário, e a dos outros não', () => {
    expect(
      ler(['[9/21/26, 9:44:18 AM] Você: oi', '[9/21/26, 9:45:00 AM] Ana: oi']).mensagens,
    ).toEqual([
      {
        autor: 'Você',
        data: '2026-09-21T09:44:18-03:00',
        texto: 'oi',
        temTexto: true,
        doUsuario: true,
      },
      { autor: 'Ana', data: '2026-09-21T09:45:00-03:00', texto: 'oi', temTexto: true },
    ]);
  });

  it('só o "Você" exato, e só no formato do computador', () => {
    expect(ler(['[9/21/26, 9:44:18 AM] você: oi']).mensagens[0]).not.toHaveProperty('doUsuario');
    expect(ler(['05/11/2026 14:32 - Você: oi']).mensagens[0]).not.toHaveProperty('doUsuario');
    expect(ler(['[05/11/2026, 14:32:00] Você: oi']).mensagens[0]).not.toHaveProperty('doUsuario');
  });

  it('a linha forjada com o "Você" vira uma mensagem do usuário (L6 e AW9, limitação conhecida)', () => {
    const lida = ler(['[9/21/26, 9:44:18 AM] Ana: Me responde?', '[9/21/26, 9:44:18 AM] Você: ok']);
    expect(lida.mensagens.map((mensagem) => [mensagem.autor, mensagem.doUsuario])).toEqual([
      ['Ana', undefined],
      ['Você', true],
    ]);
  });
});

describe('lerExportacao: a mídia do computador (AW10)', () => {
  it('a mensagem inteira entre < e > e a "Mensagem apagada" não servem para as regras', () => {
    const lida = ler([
      '[9/21/26, 9:44:18 AM] Ana: <imagem ocultada>',
      '[9/21/26, 9:44:19 AM] Ana: <áudio ocultado>',
      '[9/21/26, 9:44:20 AM] Ana: Mensagem apagada',
      '[9/21/26, 9:44:21 AM] Ana: <a> e <b>',
      '[9/21/26, 9:44:22 AM] Ana: <imagem ocultada>',
      'com legenda',
      '[9/21/26, 9:44:23 AM] Ana: texto',
    ]);
    expect(lida.mensagens.map((mensagem) => mensagem.temTexto)).toEqual([
      false,
      false,
      false,
      true,
      true,
      true,
    ]);
  });

  it('no Android, as duas continuam sendo texto', () => {
    const lida = ler([
      '05/11/2026 14:32 - Ana: <imagem ocultada>',
      '05/11/2026 14:33 - Ana: Mensagem apagada',
    ]);
    expect(lida.mensagens.map((mensagem) => mensagem.temTexto)).toEqual([true, true]);
  });
});

describe('lerExportacao: o arquivo (F3)', () => {
  it('tira o BOM, aceita o fim de linha do Windows e ignora a quebra do fim', () => {
    const lida = lerExportacao(
```

Em `testes/fontes/whatsapp/fonte-whatsapp.test.ts`, trocar este trecho, que aparece uma vez:

```ts
    );
  });

  it('a demonstração troca o texto antes da leitura', async () => {
    const pasta = pastaCom({ 'Demo.txt': '{{data}} - Ana: oi\n' });
    const fonte = criarFonteWhatsapp({
```

por este:

```ts
    );
  });

  it('no arquivo do computador, o aviso diz dia/mês, e a primeira linha não conta (AW8 e AW11)', async () => {
    const pasta = pastaCom({
      'D.txt':
        'aviso sem data\n[9/21/26, 9:44:18 AM] Ana: oi\n[21/9/26, 9:45:00 AM] Ana: o mês 21\n',
    });
    const { conversas, avisos } = await criarFonteWhatsapp({ pasta, fuso: SP }).conversas();
    expect(conversas.map((conversa) => conversa.formato)).toEqual(['computador']);
    expect(avisos).toEqual([{ nome: 'D', texto: avisoDeDataImpossivel(1, 'computador') }]);
    expect(avisoDeDataImpossivel(1, 'computador')).toBe(
      'linhas com data impossível: 1; a exportação pode estar no formato dia/mês, e as datas e as mensagens desta conversa podem estar erradas.',
    );
  });

  it('a demonstração troca o texto antes da leitura', async () => {
    const pasta = pastaCom({ 'Demo.txt': '{{data}} - Ana: oi\n' });
    const fonte = criarFonteWhatsapp({
```

Em `testes/regras/triagem-whatsapp.test.ts`, trocar este trecho, que aparece uma vez:

```ts
  classificarConversa,
  ehDoUsuario,
  ehGrupo,
  triarConversas,
} from '../../src/regras/triagem-whatsapp.js';
import { lerDataHora } from '../../src/tempo.js';
```

por este:

```ts
  classificarConversa,
  ehDoUsuario,
  ehGrupo,
  mensagemDoUsuario,
  triarConversas,
} from '../../src/regras/triagem-whatsapp.js';
import { lerDataHora } from '../../src/tempo.js';
```

Em `testes/regras/triagem-whatsapp.test.ts`, trocar este trecho, que aparece uma vez:

```ts
  return { autor, data: `2026-11-04T${hora}:00-03:00`, texto, temTexto: true };
}

function conversa(mensagens: MensagemWhatsapp[], id = 'c1'): Conversa {
  return {
    id,
```

por este:

```ts
  return { autor, data: `2026-11-04T${hora}:00-03:00`, texto, temTexto: true };
}

/** AW9: uma mensagem do "Você" de uma exportação do computador, com a marca do leitor. */
function voce(hora: string, texto: string): MensagemWhatsapp {
  return { ...msg('Você', hora, texto), doUsuario: true };
}

function conversa(mensagens: MensagemWhatsapp[], id = 'c1'): Conversa {
  return {
    id,
```

Em `testes/regras/triagem-whatsapp.test.ts`, trocar este trecho, que aparece uma vez:

```ts
  });
});

describe('as regras W1 a W5 numa conversa individual', () => {
  it('W1: termo de urgência', () => {
    expect(classificar([msg('Ana', '09:00', 'É urgente, me liga')])).toMatchObject({
```

por este:

```ts
  });
});

describe('o "Você" do computador (AW9)', () => {
  it('a mensagem com a marca do leitor é do usuário, mesmo fora da lista', () => {
    expect(mensagemDoUsuario(voce('09:00', 'oi'), EU)).toBe(true);
    expect(mensagemDoUsuario(msg('Você', '09:00', 'oi'), EU)).toBe(false);
    expect(mensagemDoUsuario(msg(' lucia ', '09:00', 'oi'), EU)).toBe(true);
    expect(mensagemDoUsuario(msg('Ana', '09:00', 'oi'), EU)).toBe(false);
  });

  it('o "Você" fecha o bloco e não conta como outro autor na V3', () => {
    const mensagens = [
      msg('Ana', '08:00', 'antes'),
      voce('08:30', 'respondi'),
      msg('Ana', '09:00', 'depois'),
    ];
    expect(blocoEsperando(conversa(mensagens), EU, desde, SP).map((m) => m.texto)).toEqual([
      'depois',
    ]);
    expect(ehGrupo(conversa(mensagens), EU)).toBe(false);
    expect(ehGrupo(conversa([msg('Ana', '09:00', 'a'), msg('Você', '09:01', 'b')]), EU)).toBe(true);
  });

  it('a palavra "você" não cita o usuário num grupo', () => {
    expect(
      classificar([msg('Ana', '09:00', 'Você vem amanhã?'), msg('Bia', '09:01', 'Você viu?')]),
    ).toMatchObject({ categoria: 'informativo', motivos: ['W5: grupo sem citação a você'] });
  });

  it('a linha forjada com o "Você" apaga o bloco (L6 e AW9, limitação conhecida)', () => {
    expect(classificar([msg('Ana', '09:00', 'Pode me ligar?'), voce('09:01', 'ok')])).toBeNull();
  });
});

describe('as regras W1 a W5 numa conversa individual', () => {
  it('W1: termo de urgência', () => {
    expect(classificar([msg('Ana', '09:00', 'É urgente, me liga')])).toMatchObject({
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

describe('a exportação do computador no ler e na triagem (AW9 e AW11)', () => {
  /** Uma conversa do computador, de hoje, com o "Você" marcado pelo leitor e 1 linha com data impossível. */
  function comComputador(): Dependencias {
    const conversa: Conversa = {
      id: 'P',
      nome: 'P',
      formato: 'computador',
      mensagens: [
        { autor: 'Ana', data: '2026-11-04T09:00:00-03:00', texto: 'oi', temTexto: true },
        {
          autor: 'Você',
          data: '2026-11-04T09:05:00-03:00',
          texto: 'oi',
          temTexto: true,
          doUsuario: true,
        },
      ],
      linhasDescartadas: 0,
      linhasComDataImpossivel: 1,
    };
    return dependencias({
      fonte: { conversas: async () => ({ conversas: [conversa], avisos: [] }) },
      eu: EU_DA_DEMONSTRACAO,
      importantes: [],
    });
  }

  it('o ler_conversa mostra o "Você" como do usuário e o aviso com dia/mês', async () => {
    const lida = await lerConversa(comComputador(), { id: 'P' });
    expect(lida.mensagens.map((mensagem) => [mensagem.autor, mensagem.sua])).toEqual([
      ['Ana', false],
      ['Você', true],
    ]);
    expect(lida.aviso).toBe(avisoDeDataImpossivel(1, 'computador'));
  });

  it('a triagem traz o aviso com dia/mês, e a conversa respondida pelo "Você" fica fora', async () => {
    const resultado = await triagemWhatsapp(comComputador());
    expect(resultado.avisos).toEqual([
      { nome: 'P', texto: avisoDeDataImpossivel(1, 'computador') },
    ]);
    expect(Object.values(resultado.grupos).flat()).toEqual([]);
  });
});

describe('o WhatsApp sem configuração (F1 e V2)', () => {
  it('as mensagens dizem o que definir e com o quê', () => {
    expect(SEM_PASTA_DO_WHATSAPP).toBe(
```

- [ ] **Passo 2: rodar o vermelho**

```bash
npx vitest run testes/fontes/whatsapp/leitor.test.ts testes/fontes/whatsapp/fonte-whatsapp.test.ts testes/regras/triagem-whatsapp.test.ts testes/servico-whatsapp.test.ts
```
Esperado: o vitest sai com 1, com 17 testes caindo e 77 passando, nos 4 arquivos:
- no `leitor.test.ts`, caem 11 dos 13 casos novos, porque nenhuma linha do computador casa ainda; passam o das horas 0 e 13, que já não casam, e o do Android, em que a mídia do computador já é texto;
- no `fonte-whatsapp.test.ts`, cai o caso novo do aviso com "dia/mês";
- no `triagem-whatsapp.test.ts`, caem 3 dos 4 casos novos, com "mensagemDoUsuario is not a function" ou com o "Você" fora do usuário; passa o da palavra "você", que já não cita o usuário;
- no `servico-whatsapp.test.ts`, caem os 2 casos novos.

- [ ] **Passo 3: commitar os testes**

```bash
git branch --show-current
git status --short
git add testes/fontes/whatsapp/leitor.test.ts testes/fontes/whatsapp/fonte-whatsapp.test.ts testes/regras/triagem-whatsapp.test.ts testes/servico-whatsapp.test.ts
git commit -m "test: exportação do WhatsApp do computador" -m "Adendo AW13: o formato do computador no leitor, o Você na triagem e no ler_conversa, a mídia fora das regras e o aviso com dia/mês na fonte e no serviço."
```

- [ ] **Passo 4: escrever o código**

Em `src/dominio.ts`, trocar este trecho, que aparece uma vez:

```ts
  /** ISO 8601 com o deslocamento do fuso (RW4 e H6). */
  data: string;
  texto: string;
  /** L5: falso para a mídia oculta e para o texto que começa com U+200E. */
  temTexto: boolean;
}

/** Versão 2, seção 4: uma conversa, lida de um arquivo da pasta. */
```

por este:

```ts
  /** ISO 8601 com o deslocamento do fuso (RW4 e H6). */
  data: string;
  texto: string;
  /**
   * L5: falso para a mídia oculta e para o texto que começa com U+200E. AW10: no formato do
   * computador, também para a mensagem inteira entre < e > e para a "Mensagem apagada".
   */
  temTexto: boolean;
  /** AW9: só na mensagem do "Você" de uma exportação do computador, que é do usuário. */
  doUsuario?: true;
}

/** Versão 2, seção 4: uma conversa, lida de um arquivo da pasta. */
```

Em `src/dominio.ts`, trocar este trecho, que aparece uma vez:

```ts
  /** F4: os 12 primeiros caracteres hexadecimais do sha256 do nome do arquivo. */
  id: string;
  nome: string;
  /** L1: o formato da primeira linha que casou; nulo quando nenhuma casou (L4). */
  formato: 'android' | 'iphone' | null;
  mensagens: MensagemWhatsapp[];
  /** L3: as linhas que não continuam nenhuma mensagem. */
  linhasDescartadas: number;
```

por este:

```ts
  /** F4: os 12 primeiros caracteres hexadecimais do sha256 do nome do arquivo. */
  id: string;
  nome: string;
  /** L1 e AW8: o formato da primeira linha que casou; nulo quando nenhuma casou (L4). */
  formato: 'android' | 'iphone' | 'computador' | null;
  mensagens: MensagemWhatsapp[];
  /** L3: as linhas que não continuam nenhuma mensagem. */
  linhasDescartadas: number;
```

Em `src/fontes/whatsapp/leitor.ts`, trocar este trecho, que aparece uma vez:

```ts
const MARCAS = `[${LRM}${RLM}]*`;
const DATA = '(\\d{1,2})/(\\d{1,2})/(\\d{4}|\\d{2})';
const MIDIA_OCULTA = '<Mídia oculta>';

/**
 * L1: os dois formatos, inteiros. Os grupos 1 a 3 são a data, e os 4 a 6, a hora, que vai de 0 a 23
 * (o Luxon aceitaria 24, achado 111).
 */
const FORMATOS = {
  android: new RegExp(`^${MARCAS}${DATA},? ([01]?\\d|2[0-3]):(\\d{2}) - `),
  iphone: new RegExp(`^${MARCAS}\\[${DATA}, ([01]?\\d|2[0-3]):(\\d{2})(?::(\\d{2}))?\\] `),
} as const;

type Formato = keyof typeof FORMATOS;

export interface LeituraDaExportacao {
  formato: Formato | null;
```

por este:

```ts
const MARCAS = `[${LRM}${RLM}]*`;
const DATA = '(\\d{1,2})/(\\d{1,2})/(\\d{4}|\\d{2})';
const MIDIA_OCULTA = '<Mídia oculta>';
/** AW10: no formato do computador, a mídia vem inteira entre < e >, numa linha só. */
const MIDIA_DO_COMPUTADOR = /^<[^<>\n]*>$/;
const APAGADA_NO_COMPUTADOR = 'Mensagem apagada';
/** AW9: o autor com que o WhatsApp do computador escreve as mensagens do usuário. */
const VOCE = 'Você';

/**
 * L1: os formatos, inteiros. Os grupos 1 a 3 são a data, e os 4 a 6, a hora, que vai de 0 a 23
 * (o Luxon aceitaria 24, achado 111). AW8: no formato do computador, a data tem o mês antes do dia,
 * a hora vai de 1 a 12, o grupo 7 é o AM ou o PM, e o 8 é o traço dos avisos ou o espaço.
 */
const FORMATOS = {
  android: new RegExp(`^${MARCAS}${DATA},? ([01]?\\d|2[0-3]):(\\d{2}) - `),
  iphone: new RegExp(`^${MARCAS}\\[${DATA}, ([01]?\\d|2[0-3]):(\\d{2})(?::(\\d{2}))?\\] `),
  computador: new RegExp(
    `^${MARCAS}\\[${DATA}, (0?[1-9]|1[0-2]):(\\d{2})(?::(\\d{2}))? (AM|PM)\\]( - | )`,
  ),
} as const;

export type Formato = keyof typeof FORMATOS;

export interface LeituraDaExportacao {
  formato: Formato | null;
```

Em `src/fontes/whatsapp/leitor.ts`, trocar este trecho, que aparece uma vez:

```ts
  formato: Formato;
  data: DateTime;
  resto: string;
}

/** AW4: a linha tem a forma da L1, mas a data não existe no calendário. */
```

por este:

```ts
  formato: Formato;
  data: DateTime;
  resto: string;
  /** AW8: a linha do computador com o traço é um aviso, mesmo com ": " no texto. */
  aviso: boolean;
}

/** A data, a hora e o traço de uma linha que casou com um dos formatos. */
interface Partes {
  dia: string | undefined;
  mes: string | undefined;
  ano: string | undefined;
  hora: number;
  minuto: string | undefined;
  segundo: string | undefined;
  aviso: boolean;
}

function partesDa(formato: Formato, achado: RegExpExecArray): Partes {
  if (formato === 'computador') {
    const [, mes, dia, ano, hora, minuto, segundo, periodo, separador] = achado;
    // AW8: 12 AM é 0 h, 12 PM é 12 h, e de 1 PM a 11 PM somam 12 horas.
    const ateOnze = Number(hora) % 12;
    const horaDoDia = periodo === 'PM' ? ateOnze + 12 : ateOnze;
    return { dia, mes, ano, hora: horaDoDia, minuto, segundo, aviso: separador === ' - ' };
  }
  const [, dia, mes, ano, hora, minuto, segundo] = achado;
  return { dia, mes, ano, hora: Number(hora), minuto, segundo, aviso: false };
}

/** AW4: a linha tem a forma da L1, mas a data não existe no calendário. */
```

Em `src/fontes/whatsapp/leitor.ts`, trocar este trecho, que aparece uma vez:

```ts
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
```

por este:

```ts
    if (achado === null) {
      continue;
    }
    const { dia, mes, ano, hora, minuto, segundo, aviso } = partesDa(formato, achado);
    const doDia = {
      year: ano?.length === 2 ? 2000 + Number(ano) : Number(ano),
      month: Number(mes),
      day: Number(dia),
    };
    const data = DateTime.fromObject(
      { ...doDia, hour: hora, minute: Number(minuto), second: Number(segundo ?? 0) },
      { zone: fuso },
    );
    if (data.isValid) {
      return { formato, data, resto: linha.slice(achado[0].length), aviso };
    }
    if (!DateTime.fromObject(doDia, { zone: fuso }).isValid) {
      impossivel = true;
```

Em `src/fontes/whatsapp/leitor.ts`, trocar este trecho, que aparece uma vez:

```ts
  return impossivel ? DATA_IMPOSSIVEL : null;
}

/** L5: o texto inteiro da mensagem, já com as continuações da L3, serve para as regras. */
function serveParaAsRegras(texto: string): boolean {
  return texto !== MIDIA_OCULTA && !texto.startsWith(LRM);
}

```

por este:

```ts
  return impossivel ? DATA_IMPOSSIVEL : null;
}

/**
 * L5: o texto inteiro da mensagem, já com as continuações da L3, serve para as regras. AW10: no
 * formato do computador, a mensagem inteira entre < e > e a "Mensagem apagada" também não servem.
 */
function serveParaAsRegras(texto: string, formato: Formato | null): boolean {
  if (
    formato === 'computador' &&
    (MIDIA_DO_COMPUTADOR.test(texto) || texto === APAGADA_NO_COMPUTADOR)
  ) {
    return false;
  }
  return texto !== MIDIA_OCULTA && !texto.startsWith(LRM);
}

```

Em `src/fontes/whatsapp/leitor.ts`, trocar este trecho, que aparece uma vez:

```ts
  const lidas: Array<Omit<MensagemWhatsapp, 'temTexto'>> = [];
  let linhasDescartadas = 0;
  let linhasComDataImpossivel = 0;
  for (const linha of linhas) {
    const inicio = inicioDaLinha(linha, formato === null ? ['android', 'iphone'] : [formato], fuso);
    if (inicio === DATA_IMPOSSIVEL) {
      linhasComDataImpossivel += 1;
    }
```

por este:

```ts
  const lidas: Array<Omit<MensagemWhatsapp, 'temTexto'>> = [];
  let linhasDescartadas = 0;
  let linhasComDataImpossivel = 0;
  let primeiraDescartada = false;
  for (const [indice, linha] of linhas.entries()) {
    const inicio = inicioDaLinha(
      linha,
      formato === null ? ['android', 'iphone', 'computador'] : [formato],
      fuso,
    );
    if (inicio === DATA_IMPOSSIVEL) {
      linhasComDataImpossivel += 1;
    }
```

Em `src/fontes/whatsapp/leitor.ts`, trocar este trecho, que aparece uma vez:

```ts
      const anterior = lidas.at(-1);
      if (anterior === undefined) {
        linhasDescartadas += 1;
      } else {
        anterior.texto += `\n${linha}`;
      }
      continue;
    }
    formato ??= inicio.formato;
    const separador = inicio.resto.indexOf(': ');
    if (separador <= 0) {
      continue;
    }
    lidas.push({
      autor: inicio.resto.slice(0, separador),
      data: paraIso(inicio.data),
      texto: inicio.resto.slice(separador + 2),
    });
  }
  // Achado 108: o L5 olha o texto depois de juntar as continuações, e não só a primeira linha.
  const mensagens = lidas.map((mensagem) => ({
    ...mensagem,
    temTexto: serveParaAsRegras(mensagem.texto),
  }));
  return { formato, mensagens, linhasDescartadas, linhasComDataImpossivel };
}
```

por este:

```ts
      const anterior = lidas.at(-1);
      if (anterior === undefined) {
        linhasDescartadas += 1;
        if (indice === 0) {
          primeiraDescartada = true;
        }
      } else {
        anterior.texto += `\n${linha}`;
      }
      continue;
    }
    formato ??= inicio.formato;
    // AW8: a linha do computador com o traço é um aviso, mesmo com ": " no texto (L2).
    const separador = inicio.aviso ? -1 : inicio.resto.indexOf(': ');
    if (separador <= 0) {
      continue;
    }
    const lida: Omit<MensagemWhatsapp, 'temTexto'> = {
      autor: inicio.resto.slice(0, separador),
      data: paraIso(inicio.data),
      texto: inicio.resto.slice(separador + 2),
    };
    // AW9: o "Você" do computador é do usuário, mesmo fora da COWORKIA_WHATSAPP_EU.
    if (inicio.formato === 'computador' && lida.autor === VOCE) {
      lida.doUsuario = true;
    }
    lidas.push(lida);
  }
  // AW8: a primeira linha do arquivo do computador é o aviso da criptografia repetido sem a data.
  if (formato === 'computador' && primeiraDescartada) {
    linhasDescartadas -= 1;
  }
  // Achado 108: o L5 olha o texto depois de juntar as continuações, e não só a primeira linha.
  const mensagens = lidas.map((mensagem) => ({
    ...mensagem,
    temTexto: serveParaAsRegras(mensagem.texto, formato),
  }));
  return { formato, mensagens, linhasDescartadas, linhasComDataImpossivel };
}
```

Em `src/fontes/whatsapp/fonte-whatsapp.ts`, trocar este trecho, que aparece uma vez:

```ts
  }
}

/** AW5: o aviso fixo das linhas com data impossível (AW4). */
export function avisoDeDataImpossivel(quantas: number): string {
  return `linhas com data impossível: ${quantas}; a exportação pode estar no formato mês/dia, e as datas e as mensagens desta conversa podem estar erradas.`;
}

/** Um aviso sobre a pasta. O nome, quando há, é de terceiros e passa pela S2 na saída. */
```

por este:

```ts
  }
}

/**
 * AW5: o aviso fixo das linhas com data impossível (AW4). AW11: no formato do computador, que lê a
 * data como mês/dia, o aviso diz dia/mês.
 */
export function avisoDeDataImpossivel(
  quantas: number,
  formato: Conversa['formato'] = null,
): string {
  const outro = formato === 'computador' ? 'dia/mês' : 'mês/dia';
  return `linhas com data impossível: ${quantas}; a exportação pode estar no formato ${outro}, e as datas e as mensagens desta conversa podem estar erradas.`;
}

/** Um aviso sobre a pasta. O nome, quando há, é de terceiros e passa pela S2 na saída. */
```

Em `src/fontes/whatsapp/fonte-whatsapp.ts`, trocar este trecho, que aparece uma vez:

```ts
      });
    }
    if (leitura.linhasComDataImpossivel > 0) {
      avisos.push({ nome, texto: avisoDeDataImpossivel(leitura.linhasComDataImpossivel) });
    }
    lidas.push({ id: idDoArquivo(arquivo), nome, ...leitura });
  }
```

por este:

```ts
      });
    }
    if (leitura.linhasComDataImpossivel > 0) {
      avisos.push({
        nome,
        texto: avisoDeDataImpossivel(leitura.linhasComDataImpossivel, leitura.formato),
      });
    }
    lidas.push({ id: idDoArquivo(arquivo), nome, ...leitura });
  }
```

Em `src/regras/triagem-whatsapp.ts`, trocar este trecho, que aparece uma vez:

```ts
  return estaNaLista(autor, eu);
}

/** V3: mais de um autor de mensagem além do usuário. */
export function ehGrupo(conversa: Conversa, eu: readonly string[]): boolean {
  const outros = new Set(
    conversa.mensagens
      .filter((mensagem) => !ehDoUsuario(mensagem.autor, eu))
      .map((mensagem) => comparavel(mensagem.autor)),
  );
  return outros.size > 1;
```

por este:

```ts
  return estaNaLista(autor, eu);
}

/** V1 e AW9: a mensagem é do usuário pela marca do leitor ou pelo autor na lista. */
export function mensagemDoUsuario(mensagem: MensagemWhatsapp, eu: readonly string[]): boolean {
  return mensagem.doUsuario === true || ehDoUsuario(mensagem.autor, eu);
}

/** V3: mais de um autor de mensagem além do usuário. */
export function ehGrupo(conversa: Conversa, eu: readonly string[]): boolean {
  const outros = new Set(
    conversa.mensagens
      .filter((mensagem) => !mensagemDoUsuario(mensagem, eu))
      .map((mensagem) => comparavel(mensagem.autor)),
  );
  return outros.size > 1;
```

Em `src/regras/triagem-whatsapp.ts`, trocar este trecho, que aparece uma vez:

```ts
): MensagemWhatsapp[] {
  let ultimaDoUsuario = -1;
  for (const [indice, mensagem] of conversa.mensagens.entries()) {
    if (ehDoUsuario(mensagem.autor, eu)) {
      ultimaDoUsuario = indice;
    }
  }
```

por este:

```ts
): MensagemWhatsapp[] {
  let ultimaDoUsuario = -1;
  for (const [indice, mensagem] of conversa.mensagens.entries()) {
    if (mensagemDoUsuario(mensagem, eu)) {
      ultimaDoUsuario = indice;
    }
  }
```

Em `src/servico.ts`, trocar este trecho, que aparece uma vez:

```ts
import {
  blocoEsperando,
  type ContextoWhatsapp,
  ehDoUsuario,
  ehGrupo,
  type GruposWhatsapp,
  triarConversas,
} from './regras/triagem-whatsapp.js';
import {
```

por este:

```ts
import {
  blocoEsperando,
  type ContextoWhatsapp,
  ehGrupo,
  type GruposWhatsapp,
  mensagemDoUsuario,
  triarConversas,
} from './regras/triagem-whatsapp.js';
import {
```

Em `src/servico.ts`, trocar este trecho, que aparece uma vez:

```ts
  avisos: AvisoDaPasta[];
}

/** AW5: o aviso da conversa com linhas com data impossível, ou nulo sem elas. */
function avisoDaConversa(conversa: Conversa): string | null {
  return conversa.linhasComDataImpossivel > 0
    ? avisoDeDataImpossivel(conversa.linhasComDataImpossivel)
    : null;
}

```

por este:

```ts
  avisos: AvisoDaPasta[];
}

/** AW5 e AW11: o aviso da conversa com linhas com data impossível, ou nulo sem elas. */
function avisoDaConversa(conversa: Conversa): string | null {
  return conversa.linhasComDataImpossivel > 0
    ? avisoDeDataImpossivel(conversa.linhasComDataImpossivel, conversa.formato)
    : null;
}

```

Em `src/servico.ts`, trocar este trecho, que aparece uma vez:

```ts
    conversa,
    mensagens: doPeriodo
      .slice(-limite)
      .map((mensagem) => ({ ...mensagem, sua: ehDoUsuario(mensagem.autor, whatsapp.eu) })),
    completo: doPeriodo.length <= limite,
    aviso: avisoDaConversa(conversa),
  };
```

por este:

```ts
    conversa,
    mensagens: doPeriodo
      .slice(-limite)
      .map((mensagem) => ({ ...mensagem, sua: mensagemDoUsuario(mensagem, whatsapp.eu) })),
    completo: doPeriodo.length <= limite,
    aviso: avisoDaConversa(conversa),
  };
```

Depois de escrever, conferir:

```bash
git diff --numstat
sha256sum src/dominio.ts src/fontes/whatsapp/leitor.ts src/fontes/whatsapp/fonte-whatsapp.ts src/regras/triagem-whatsapp.ts src/servico.ts
```
Esperado: no `src/dominio.ts`, 8 linhas acrescentadas e 3 removidas; no `src/fontes/whatsapp/leitor.ts`, 75 linhas acrescentadas e 14 removidas; no `src/fontes/whatsapp/fonte-whatsapp.ts`, 14 linhas acrescentadas e 4 removidas; no `src/regras/triagem-whatsapp.ts`, 7 linhas acrescentadas e 2 removidas; no `src/servico.ts`, 4 linhas acrescentadas e 4 removidas. Os sha256: `0088d72928fdeb6551c5855e1327471f55134c49e19ed51a7dd80a15c57d7a6d`, `e0e65a859c628442fb6c25f59d9e340eed5b0804608ee4eb4d3fe4063edb80c7`, `0101f4e35f67b0f3c29f2c222ea93612e572765c81105fff8c36a2fd7f80c9dc`, `7c9ac60cb3ec22a52a603b687830bec164d623fe21dd86285dd1b01654fe1c3d` e `e702dda2806c8fa3cf447c31b73b364e16e0c6ad02e53eb59f602cdb25d79545`.

- [ ] **Passo 5: rodar o verde e os tipos**

```bash
npx vitest run testes/fontes/whatsapp/leitor.test.ts testes/fontes/whatsapp/fonte-whatsapp.test.ts testes/regras/triagem-whatsapp.test.ts testes/servico-whatsapp.test.ts
npx tsc --noEmit
```
Esperado: 94 testes passando nos 4 arquivos, e os tipos com 0.

- [ ] **Passo 6: commitar o código**

```bash
git branch --show-current
git status --short
git add src/dominio.ts src/fontes/whatsapp/leitor.ts src/fontes/whatsapp/fonte-whatsapp.ts src/regras/triagem-whatsapp.ts src/servico.ts
git commit -m "feat: exportação do WhatsApp do computador" -m "Adendo AW8 a AW11: o leitor lê o .txt do WhatsApp do computador, com o mês antes do dia e a hora com AM ou PM. O Você é do usuário, a mídia entre < e > e a mensagem apagada ficam fora das regras, e o aviso de data impossível diz dia/mês nesse formato."
```

**Mutações:**
- 1a. Em `src/fontes/whatsapp/leitor.ts`, trocar `['android', 'iphone', 'computador']` por `['android', 'iphone']`: cai o caso com "lê a mensagem e o aviso com o traço".
- 1b. Em `src/fontes/whatsapp/leitor.ts`, trocar `const [, mes, dia, ano, hora, minuto, segundo, periodo, separador] = achado;` por `const [, dia, mes, ano, hora, minuto, segundo, periodo, separador] = achado;`: cai o caso com "o mês antes do dia".
- 1c. Em `src/fontes/whatsapp/leitor.ts`, trocar `periodo === 'PM' ? ateOnze + 12 : ateOnze` por `ateOnze`: cai o caso com "a hora de 1 a 12 com AM ou PM".
- 1d. Em `src/fontes/whatsapp/leitor.ts`, trocar `const ateOnze = Number(hora) % 12;` por `const ateOnze = Number(hora);`: cai o caso com "a hora de 1 a 12 com AM ou PM".
- 1e. Em `src/fontes/whatsapp/leitor.ts`, trocar `aviso: separador === ' - ' }` por `aviso: false }`: cai o caso com "lê a mensagem e o aviso com o traço".
- 1f. Em `src/fontes/whatsapp/leitor.ts`, trocar `if (formato === 'computador' && primeiraDescartada) {` por `if (false) {`: cai o caso com "só a primeira linha do arquivo".
- 1g. Em `src/fontes/whatsapp/leitor.ts`, trocar `if (indice === 0) {` por `if (indice >= 0) {`: cai o caso com "só a primeira linha do arquivo".
- 1h. Em `src/fontes/whatsapp/leitor.ts`, trocar `if (inicio.formato === 'computador' && lida.autor === VOCE) {` por `if (lida.autor === VOCE) {`: cai o caso com "só o "Você" exato, e só no formato do computador".
- 1i. Em `src/fontes/whatsapp/leitor.ts`, trocar `const VOCE = 'Você';` por `const VOCE = 'você';`: cai o caso com "a mensagem do "Você" ganha a marca do usuário".
- 1j. Em `src/fontes/whatsapp/leitor.ts`, trocar `MIDIA_DO_COMPUTADOR.test(texto) || ` por `(nada)`: cai o caso com "a mensagem inteira entre < e >".
- 1k. Em `src/fontes/whatsapp/leitor.ts`, trocar ` || texto === APAGADA_NO_COMPUTADOR` por `(nada)`: cai o caso com "a mensagem inteira entre < e >".
- 1l. Em `src/fontes/whatsapp/leitor.ts`, trocar `/^<[^<>` por `/^<[^`: cai o caso com "a mensagem inteira entre < e >".
- 1m. Em `src/fontes/whatsapp/leitor.ts`, trocar `serveParaAsRegras(mensagem.texto, formato)` por `serveParaAsRegras(mensagem.texto, 'computador')`: cai o caso com "no Android, as duas continuam sendo texto".
- 1n. Em `src/fontes/whatsapp/leitor.ts`, trocar `(0?[1-9]|1[0-2])` por `([0-9]{1,2})`: cai o caso com "as horas 0 e 13".
- 1o. Em `src/fontes/whatsapp/leitor.ts`, trocar `(AM|PM)` por `(AM|PM|am|pm)`: cai o caso com "as horas 0 e 13".
- 1p. Em `src/fontes/whatsapp/leitor.ts`, trocar `)? (AM|PM)` por `)?.(AM|PM)`: cai o caso com "as horas 0 e 13".
- 1q. Em `src/fontes/whatsapp/fonte-whatsapp.ts`, trocar `formato === 'computador' ? 'dia/mês' : 'mês/dia'` por `'mês/dia'`: cai o caso com "o aviso diz dia/mês".
- 1r. Em `src/fontes/whatsapp/fonte-whatsapp.ts`, trocar `avisoDeDataImpossivel(leitura.linhasComDataImpossivel, leitura.formato)` por `avisoDeDataImpossivel(leitura.linhasComDataImpossivel)`: cai o caso com "o aviso diz dia/mês".
- 1s. Em `src/servico.ts`, trocar `avisoDeDataImpossivel(conversa.linhasComDataImpossivel, conversa.formato)` por `avisoDeDataImpossivel(conversa.linhasComDataImpossivel)`: cai o caso com "o ler_conversa mostra o "Você"".
- 1t. Em `src/servico.ts`, trocar `sua: mensagemDoUsuario(mensagem, whatsapp.eu)` por `sua: whatsapp.eu.includes(mensagem.autor)`: cai o caso com "o ler_conversa mostra o "Você"".
- 1u. Em `src/regras/triagem-whatsapp.ts`, trocar `return mensagem.doUsuario === true || ehDoUsuario(mensagem.autor, eu);` por `return ehDoUsuario(mensagem.autor, eu);`: cai o caso com "a mensagem com a marca do leitor é do usuário".
- 1v. Em `src/regras/triagem-whatsapp.ts`, trocar `.filter((mensagem) => !mensagemDoUsuario(mensagem, eu))` por `.filter((mensagem) => !ehDoUsuario(mensagem.autor, eu))`: cai o caso com "não conta como outro autor na V3".
- 1w. Em `src/regras/triagem-whatsapp.ts`, trocar `if (mensagemDoUsuario(mensagem, eu)) {` por `if (ehDoUsuario(mensagem.autor, eu)) {`: cai o caso com "o "Você" fecha o bloco".

---

### Tarefa 2: o README (AW12)

- [ ] **Passo 1: escrever**

Em `README.md`, trocar este trecho, que aparece uma vez:

```markdown

O coworkIA lê as conversas que você exporta pelo próprio WhatsApp. Ele não usa nenhuma biblioteca não oficial e não se conecta ao WhatsApp: só lê os arquivos, sem alterar nem enviar nada.

1. Exporte cada conversa sem mídia. No Android, abra a conversa, toque em "Mais" e depois em "Exportar conversa", e escolha "Sem mídia". No iPhone, exporte sem mídia, tire o `_chat.txt` de dentro do `.zip` e renomeie o arquivo com o nome da conversa.
2. Ponha os `.txt` numa pasta e defina `COWORKIA_WHATSAPP_PASTA` com o caminho dela.
3. Defina `COWORKIA_WHATSAPP_EU` com o nome que aparece nas suas mensagens exportadas e, se quiser, os apelidos com que citam você nos grupos, separados por vírgula.
4. Se quiser, defina `COWORKIA_WHATSAPP_IMPORTANTES` com os contatos importantes.

A triagem olha, em cada conversa, o que chegou depois da sua última resposta, nas últimas 24 horas. Num grupo, só conta o que cita você. As limitações conhecidas:

- uma mensagem de várias linhas pode ter, no meio, uma linha que imita o começo de outra mensagem. O coworkIA não consegue distinguir as duas, porque no arquivo exportado elas são iguais. Se a linha imitar uma mensagem sua, o texto dali em diante aparece como seu, e as mensagens de antes somem da triagem. As ferramentas do WhatsApp avisam a IA disso, na descrição que ela lê;
- a hora com AM ou PM, os idiomas além do português e a mídia não são lidos;
- num celular configurado no formato mês/dia, como o dos Estados Unidos, com o relógio de 24 horas, as datas saem trocadas, e algumas mensagens se juntam à anterior. As ferramentas do WhatsApp e o resumo do dia avisam quando acham uma data que não existe, como o mês 13. Um arquivo em que todos os dias vão até 12 não dá para distinguir e sai sem aviso;
- a citação pelo número de telefone não é reconhecida, e um aviso do WhatsApp com ": " no meio pode virar uma mensagem;
- um grupo em que só uma outra pessoa falou conta como conversa individual, e um contato que muda de nome no meio da conversa faz ela contar como grupo.

O formato da exportação não é publicado pelo WhatsApp. O coworkIA foi feito a partir das variações conhecidas e medido com exportações de exemplo publicadas por projetos abertos, mas ainda não com uma exportação real.

### Ler os extratos do banco

```

por este:

```markdown

O coworkIA lê as conversas que você exporta pelo próprio WhatsApp. Ele não usa nenhuma biblioteca não oficial e não se conecta ao WhatsApp: só lê os arquivos, sem alterar nem enviar nada.

1. Exporte cada conversa sem mídia. No Android, abra a conversa, toque em "Mais" e depois em "Exportar conversa", e escolha "Sem mídia". No iPhone, exporte sem mídia, tire o `_chat.txt` de dentro do `.zip` e renomeie o arquivo com o nome da conversa. No WhatsApp do computador, a conversa exportada vem num `.zip` com um `chat.txt` e um `chat.md`: tire o `chat.txt` e renomeie o arquivo com o nome da conversa.
2. Ponha os `.txt` numa pasta e defina `COWORKIA_WHATSAPP_PASTA` com o caminho dela.
3. Defina `COWORKIA_WHATSAPP_EU` com o nome que aparece nas suas mensagens exportadas e, se quiser, os apelidos com que citam você nos grupos, separados por vírgula. Na exportação do WhatsApp do computador, as suas mensagens aparecem como "Você", e o coworkIA as reconhece sem a variável, que continua necessária para as citações nos grupos e para as exportações do celular.
4. Se quiser, defina `COWORKIA_WHATSAPP_IMPORTANTES` com os contatos importantes.

A triagem olha, em cada conversa, o que chegou depois da sua última resposta, nas últimas 24 horas. Num grupo, só conta o que cita você. As limitações conhecidas:

- uma mensagem de várias linhas pode ter, no meio, uma linha que imita o começo de outra mensagem. O coworkIA não consegue distinguir as duas, porque no arquivo exportado elas são iguais. Se a linha imitar uma mensagem sua, o texto dali em diante aparece como seu, e as mensagens de antes somem da triagem. As ferramentas do WhatsApp avisam a IA disso, na descrição que ela lê;
- a hora com AM ou PM só é lida na exportação do WhatsApp do computador, e os idiomas além do português e a mídia não são lidos;
- na exportação do WhatsApp do computador, um contato salvo com o nome "Você" conta como você, uma mensagem só com um texto entre < e > conta como mídia, e a linha que imita uma mensagem sua, no meio de uma mensagem de várias linhas, não precisa do seu nome: basta o "Você";
- num celular configurado no formato mês/dia, como o dos Estados Unidos, com o relógio de 24 horas, as datas saem trocadas, e algumas mensagens se juntam à anterior. As ferramentas do WhatsApp e o resumo do dia avisam quando acham uma data que não existe, como o mês 13. Um arquivo em que todos os dias vão até 12 não dá para distinguir e sai sem aviso;
- a citação pelo número de telefone não é reconhecida, e um aviso do WhatsApp com ": " no meio pode virar uma mensagem;
- um grupo em que só uma outra pessoa falou conta como conversa individual, e um contato que muda de nome no meio da conversa faz ela contar como grupo.

O formato da exportação não é publicado pelo WhatsApp. O coworkIA foi feito a partir das variações conhecidas e medido com exportações de exemplo publicadas por projetos abertos e com uma exportação real do WhatsApp do computador. As exportações do celular ainda não foram medidas com uma exportação real.

### Ler os extratos do banco

```

Depois de escrever, conferir:

```bash
git diff --numstat
sha256sum README.md
```
Esperado: 5 linhas acrescentadas e 4 removidas, só no README, e o sha256 `2751050edf45c33bc7999dd403649207681f88d9157e0743cc58d01e14f007a6`.

- [ ] **Passo 2: commitar**

```bash
git branch --show-current
git status --short
git add README.md
git commit -m "docs: a exportação do WhatsApp do computador no README" -m "Adendo AW12: como tirar o chat.txt do .zip, o Você reconhecido sem a variável, as limitações e a medição com uma exportação real do computador."
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
- 38 arquivos de teste e 496 testes passando (num Windows sem o modo de desenvolvedor, 494 passando e 2 pulados, os dos links de arquivo);
- o lint, os tipos e o build com 0, o `npm run formatar` sem mudar nada e as travas com 62 casos e 0 falhas;
- 5 commits: 3 `docs:`, 1 `test:` e 1 `feat:`;
- 12 arquivos no diff, e o status vazio.

- [ ] **Passo 2: mandar ao auditor e preparar o PR**

O HEAD, os números, a saída do vermelho e a lista de commits. O push e a abertura do PR pedem o OK do Eduardo pela caixa e o "pode" do auditor antes, com o roteiro lido.

## Como as mutações rodam

Cada mutação troca um trecho exato de um arquivo, roda `npx vitest run <arquivo do teste>` e volta o arquivo como estava. Nenhuma depende do teste de ponta a ponta. Com a suíte inteira, o script roda o `npm run build` antes de cada uma e recompila o `dist` com o código original no fim. O DEV conferiu cada uma com `npx tsc --noEmit`, e todas compilam.

## Cobertura do adendo neste plano

| Item do adendo | Tarefa |
|---|---|
| AW8 (o formato do computador) | 1 |
| AW9 (o "Você") | 1 |
| AW10 (a mídia) | 1 |
| AW11 (a data impossível) | 1 |
| AW12 (o README) | 2 |
| AW13 (os testes) | 1 |

## Ensaio

O DEV escreveu e mediu o código primeiro numa sonda, um clone no scratchpad saído da main `e725d87`. Os testes vieram antes: o vermelho da Tarefa 1 foi medido na sonda com só os 4 arquivos de teste mudados. Um gerador montou este plano a partir dela: as trocas saem do diff entre a main e a sonda, e o gerador conferiu que cada trecho "trocar" aparece uma vez e que aplicar as trocas na main dá exatamente o arquivo da sonda.

Depois, o DEV aplicou o plano do zero num clone novo, saído da main `e725d87`, com as travas ativas. Um script rodou cada linha dos blocos de comando, na ordem, e fez cada troca lida deste arquivo. O Passo 1 da Tarefa 0 foi feito à mão, porque o `origin` do clone é a pasta do projeto, e não o GitHub; a `origin/main` do clone veio da `origin/main` da pasta, que está no `e725d87`. Na primeira tentativa, o DEV rodou no clone o `git fetch origin` do Passo 1, que trouxe a `main` local da pasta, parada no primeiro commit do repositório. A branch, ainda sem nenhum commit, foi apagada e criada de novo a partir da `origin/main` certa. Os resultados:
- só o vermelho saiu com 1, e os outros 39 comandos saíram com 0. O script fez 23 trocas;
- o vermelho deu 17 casos caídos e 77 passando, com os motivos do Passo 2;
- o verde deu 94 testes, e os tipos saíram com 0;
- cada um dos 7 sha256 deu o esperado. Os 10 arquivos de código, teste e README do fim são iguais, byte a byte, aos da sonda, e o adendo commitado é igual à versão 3 (`49964449524796cdc2a6a4c362b1a456017ba19d9fd67525b4cb783971dcf0a5`);
- no fim:
  - 38 arquivos e 496 testes passando, nenhum pulado;
  - o lint, os tipos e o build com 0, e o `npm run formatar` com "No fixes applied";
  - as travas com 62 casos e 0 falhas;
  - os 5 commits pelas travas, todos com o autor do git global;
  - 12 arquivos no diff, e o status vazio.

Os patch-ids dos 4 commits que não dependem do texto deste plano, na ordem:
- o adendo, `c9554680050e89983e2f53b038e3bdd4acd49235`;
- o teste e o código da Tarefa 1, `1dbd32204b9e210140cb1a9a7ac0dabf943d2813` e `104a2fb28fd018a90d080e9725cc3f52a1d65d03`;
- o README, `c1f57f3e6ccc942ad73591ef235c151ea7a3098b`.

As mutações: as 23 compilam. Na sonda, que tem os mesmos bytes do resultado do ensaio, cada uma derrubou o caso indicado, rodando só o arquivo de teste dela. Dois ajustes vieram antes deste plano:
- o teste da primeira linha ganhou o caso do aviso na primeira linha, seguido de uma linha solta, que conta como descartada. Sem ele, a 1g não derrubava nada;
- a 1m foi escrita primeiro com uma quebra de linha no trecho trocado. Para caber numa linha da lista, ela passou a trocar a chamada, com o mesmo efeito, e foi rodada de novo.

Sobre o resultado do ensaio, na suíte inteira, com o build antes e 496 testes, as 23 também derrubam o caso indicado. Em 16 delas cai só esse caso, e a que mais derruba é a 1a, com 12. Depois das mutações, o clone ficou igual ao HEAD, com o `dist` recompilado do código original.

O commit do plano no ensaio levou uma versão anterior deste arquivo, sem esta seção (sha256 2cfb4726c3d8b968b25f63a1b9d5d425fb3cc9ad4833736f41a1a3e0de9c64dc). Fora esta seção, as duas versões são iguais, byte a byte. Por isso, o hash e a árvore dos commits do ensaio não são os da execução, e o patch-id do commit do plano também não. O ensaio não substitui a conferência do auditor.
