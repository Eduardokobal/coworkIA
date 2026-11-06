# Plano do ajuste dos anotados 77, 81, 91 e 92 da versão 1 (versão 2 do plano)

> **Para quem executa:** use a habilidade superpowers:executing-plans, tarefa por tarefa. Os passos usam caixas de seleção (`- [ ]`).

**Objetivo:** consertar os quatro achados anotados que o Eduardo escolheu em 2026-11-06:
- 91: o resto da sequência de cor (`[31m`) que sobra no texto de terceiros;
- 92: o evento cancelado que sai como ocupado;
- 77: o compromisso de hoje que já passou, que só passa depois das 09:30;
- 81: o aviso do VS Code no README.

**Arquitetura:**
- O 91 muda a preparação de terceiros (`src/saida/terceiros.ts`), no passo 3 da S2.
- O 92 muda só o campo `ocupado` da saída de eventos (`src/saida/formatar.ts`), que passa a usar o `bloqueiaAgenda`, a regra que os conflitos e o próximo compromisso já usam.
- O 77 muda só os dados da demonstração (`dados-demo/eventos.json`).
- O 81 muda só o README.
- Cada conserto de código tem o commit do teste vermelho (`test:`) e o do conserto (`fix:`).

**Base:**
- a spec `docs/specs/2026-11-04-versao-1.md`: a S2 (seção 11), o 7.4, a D-c e a D-d (7.5), a seção 10 e a seção 14;
- os adendos dos planos B (AD1 a AD8) e C (AD9 a AD16), que continuam valendo;
- o adendo da seção seguinte (AD17 e AD18), que entra no repositório na Tarefa 0;
- os achados 77, 81, 91 e 92 do auditor, nos relatórios de 2026-11-05;
- as notas do auditor de 2026-11-06 sobre o desenho: a gramática da CSI, o que o AD17 cobre e deixa de fora, a OSC com um controle antes do terminador e o limite do 77;
- as páginas do VS Code lidas em 2026-11-06 (seção "Fontes consultadas", no fim).

**As escolhas do Eduardo, pela caixa, em 2026-11-06:**
- os quatro achados, juntos, num assunto só;
- no 77, o horário cedo (07:00), e não o horário relativo ao agora;
- no 81, manter o exemplo do `.vscode/mcp.json` e avisar;
- o desenho, com "Está certo, pode planejar".

**Versões deste plano:**
- a versão 1 (sha256 cecf8298327dc52bccf95ac567b830dd899915c2d455182d4f4d7cd68a202b68) recebeu CORRIGIR, com o achado 101, e dois achados ANOTAR, o 102 e o 103, cada um com o conserto já medido pelo auditor.
A seção "O que mudou da versão 1 para a 2", no fim, liga cada mudança ao seu motivo.

**Ensaio feito pelo DEV antes de mandar:** ver a seção "Ensaio", no fim.

## Adendo à spec, proposto pelo DEV (vale depois da aprovação do Eduardo)

- **AD17.** No passo 3 da S2, antes de saírem os caracteres de controle, saem inteiras as sequências de escape ANSI de dois tipos, nas formas de 7 e de 8 bits. Isso vale nas ferramentas e no terminal, como os passos 1 a 5.
  - A CSI, das cores e do cursor: `ESC [` ou U+009B, seguido, pela gramática do ECMA-48, de zero ou mais parâmetros (U+0030 a U+003F), de zero ou mais intermediários (U+0020 a U+002F) e de um final (U+0040 a U+007E).
  - A OSC, dos títulos e dos links: `ESC ]` ou U+009D, seguido de zero ou mais caracteres que não são de controle (Cc) e de um terminador, que é o BEL (U+0007), o `ESC \` ou o ST (U+009C).
  - Uma sequência fora dessa forma conta como sem fim. É o caso da CSI com outro caractere antes do final (como `ESC [é`) e da OSC com um controle antes do terminador (como uma quebra de linha ou outro ESC). Dela, no resto do passo 3, saem só os caracteres de controle, como o ESC ou o caractere de 8 bits do começo, e o resto fica como texto.
  - Ficam de fora, e, como antes, só perdem os caracteres de controle: o DCS (`ESC P`, U+0090), o SOS (`ESC X`, U+0098), o PM (`ESC ^`, U+009E), o APC (`ESC _`, U+009F) e os escapes de dois caracteres (como `ESC c` e `ESC ( B`).
- **AD18.** No 7.4, o `ocupado` é falso quando o evento não ocupa a agenda pela D-c e pela D-d: o cancelado, o marcado como livre (`transparency: transparent`) e o convite que o usuário recusou. É a mesma regra dos conflitos e do próximo compromisso, e o `status` e a `minha_resposta` continuam saindo como antes.

## O que não muda na spec

- **77.** A seção 10 só pede "um evento de hoje que já passou". A Daily passa a ser das 07:00 às 07:30, com o modelo `{{dia+0 HH:MM}}` de sempre.
  - **Limite que fica:** antes das 07:30, a Daily ainda não passou, e o caso da seção 10 não aparece. A troca estreita a janela do defeito (de antes das 09:30 para antes das 07:30), mas não a fecha.
  - O Eduardo escolheu isso em vez do horário relativo ao agora. Um evento 1h30 antes do agora cairia, entre 15:00 e 17:30, sobre os eventos das 14:00, das 14:30 e das 15:30, e criaria conflitos falsos no resumo.
- **81.** A seção 14 pede o `.vscode/mcp.json`, e ele continua. O README ganha uma frase. O exemplo de caminho do Windows, a outra parte do 81, já está no README desde o PR 4.

## Restrições globais (valem para todas as tarefas)

- Tudo o que vale nos planos A, B e C continua valendo. Nenhum escape `\u` novo e nenhum caractere invisível entram nos arquivos: um caractere especial vem de `String.fromCodePoint`.
- `src/saida/terceiros.ts` e `testes/saida/terceiros.test.ts` têm escapes `\u` do plano A: 2 no código e 39 no teste (37 com 4 dígitos e 2 com chaves). As trocas deste plano não os tocam, e o sha256 de cada arquivo, conferido depois das trocas, prova os bytes.
- **Toda mudança de arquivo é uma troca exata.** O trecho "trocar" aparece uma vez só no arquivo e é trocado pelo trecho "por este". Para pôr um bloco novo, o trecho "trocar" é a linha vizinha, e o "por este" traz o bloco junto com ela.
- Os blocos de código já estão no formato do Biome, e o `npm run formatar` não deve mudar nenhum arquivo. Se mudar, o DEV anota a diferença e a manda ao auditor antes de seguir.
- Nenhuma dependência nova.
- Nenhum teste usa a internet, uma conta real ou o cofre do sistema.
- Os commits seguem a CONTRIBUTING.md, seção 4, "As regras de todo commit". As travas locais estão ativas. Cada bloco de commit começa com o `git branch --show-current` (espera `fix/anotados-da-versao-1`) e o `git status --short`.
- A cada tarefa, o DEV manda ao auditor os hashes, a saída do vermelho e do verde e os tipos.

## Mapa de arquivos

- Criar: `docs/planos/2026-11-06-ajuste-dos-anotados.md` (este plano) e `docs/specs/2026-11-06-versao-1-adendo-anotados.md` (o adendo)
- Modificar: `testes/saida/terceiros.test.ts` e `src/saida/terceiros.ts` (Tarefa 1)
- Modificar: `testes/saida/formatar.test.ts` e `src/saida/formatar.ts` (Tarefa 2)
- Modificar: `testes/servico.test.ts` e `dados-demo/eventos.json` (Tarefa 3)
- Modificar: `README.md` (Tarefa 4)

---

### Tarefa 0: branch, plano e adendo

- [ ] **Passo 1: criar a branch a partir da main atualizada**

```bash
git status --short
git fetch origin
git switch --no-track -c fix/anotados-da-versao-1 origin/main
git log --oneline -1
git config --get core.hooksPath
```
Esperado: o status vazio antes da troca, o topo no `d09400b` (o merge do PR 6) ou num merge mais novo, e as travas em `.githooks`.

- [ ] **Passo 2: commitar o plano, na versão LIBERADA**

A versão liberada é o arquivo `plano-anotados-vN.md` do scratchpad do DEV com o maior N que o auditor deu como LIBERADO.

```bash
cp "C:/Users/EDUARD~1/AppData/Local/Temp/claude/9bb78e7f8b1714b4/fc600f43-1af8-4aa6-adae-7be1427cd432/scratchpad/plano-anotados-vN.md" docs/planos/2026-11-06-ajuste-dos-anotados.md
sha256sum docs/planos/2026-11-06-ajuste-dos-anotados.md
git branch --show-current
git status --short
git add docs/planos/2026-11-06-ajuste-dos-anotados.md
git commit -m "docs: plano do ajuste dos anotados da versão 1" -m "Os achados 77, 81, 91 e 92, escolhidos pelo Eduardo. Cópia fiel da versão liberada pelo auditor."
```
Esperado: o sha256 igual ao que o auditor liberou.

- [ ] **Passo 3: commitar o adendo da spec**

O adendo sai do plano já commitado: o título, a frase e a lista AD17 e AD18 da seção "Adendo à spec", copiada sem mudança. O `grep -c` é o sinal positivo e tem de dar 2; com outro número, o DEV para e avisa o auditor.

```bash
{ printf '# Adendo à spec da versão 1, para o ajuste dos anotados\n\nAprovado pelo Eduardo junto com o plano do ajuste dos anotados, em 2026-11-06.\n\n'; awk '/^- \*\*AD17\.\*\*/,/^- \*\*AD18\.\*\*/' docs/planos/2026-11-06-ajuste-dos-anotados.md; } > docs/specs/2026-11-06-versao-1-adendo-anotados.md
grep -cE '^- \*\*AD1[78]\.\*\*' docs/specs/2026-11-06-versao-1-adendo-anotados.md
git branch --show-current
git status --short
git add docs/specs/2026-11-06-versao-1-adendo-anotados.md
git commit -m "docs: adendo da spec para o ajuste dos anotados" -m "AD17: as sequências ANSI de cor, cursor, título e link saem inteiras na S2. AD18: o ocupado do 7.4 segue a regra dos conflitos."
```

---

### Tarefa 1: as sequências ANSI inteiras (S2, AD17 e achado 91)

**Arquivos:**
- Modificar: `testes/saida/terceiros.test.ts`
- Modificar: `src/saida/terceiros.ts`

**Os casos:**
- a CSI de 7 e de 8 bits sai inteira, inclusive com um intermediário (`ESC [2 q`), com um parâmetro privado (`ESC [?25l`) e com um final que não é letra (`ESC [200~`);
- a OSC sai inteira com os três terminadores, inclusive o link (`ESC ]8;;…ESC \`);
- fora da gramática, a sequência conta como sem fim e só perde o ESC: a CSI com "é" antes do final, a CSI sem final, a OSC sem terminador, a OSC com uma quebra de linha e a OSC cortada por outro ESC;
- o DCS e o `ESC c` só perdem o ESC, como antes;
- o caso de hoje que fixa o resto `[31mVermelho` passa a esperar `Vermelho`.

- [ ] **Passo 1: escrever os testes**

Em `testes/saida/terceiros.test.ts`, trocar este trecho, que aparece uma vez:

```ts
.toBe('[31mVermelho');
```

por este:

```ts
.toBe('Vermelho');
```

Em `testes/saida/terceiros.test.ts`, trocar este trecho, que aparece uma vez:

```ts
describe('S2, passo 5: o corte', () => {
```

por este:

```ts
describe('S2, passo 3, e AD17: as sequências ANSI saem inteiras', () => {
  const ESC = String.fromCodePoint(0x1b);
  const BEL = String.fromCodePoint(0x07);
  const CSI8 = String.fromCodePoint(0x9b);
  const ST8 = String.fromCodePoint(0x9c);
  const OSC8 = String.fromCodePoint(0x9d);

  it('tira a CSI das cores e do cursor, nas formas de 7 e de 8 bits', () => {
    expect(preparar(`${ESC}[31mVermelho${ESC}[0m`)).toBe('Vermelho');
    expect(preparar(`${ESC}[38;5;196mCor${ESC}[2 q`)).toBe('Cor');
    expect(preparar(`${CSI8}1mNegrito`)).toBe('Negrito');
    expect(preparar(`${ESC}[?25lTexto${ESC}[200~`)).toBe('Texto');
  });

  it('tira a OSC dos títulos e dos links, com os três terminadores', () => {
    expect(preparar(`${ESC}]0;Título${BEL}Texto`)).toBe('Texto');
    expect(preparar(`${ESC}]8;;https://example.com${ESC}\\link${ESC}]8;;${ESC}\\`)).toBe('link');
    expect(preparar(`${OSC8}0;x${ST8}Fim`)).toBe('Fim');
  });

  it('fora da gramática, a sequência conta como sem fim e só perde o ESC', () => {
    expect(preparar(`${ESC}[é texto`)).toBe('[é texto');
    expect(preparar(`${ESC}[31`)).toBe('[31');
    expect(preparar(`${ESC}]0;sem fim`)).toBe(']0;sem fim');
    expect(preparar(`${ESC}]0;quebra\nTexto${BEL}`)).toBe(']0;quebra\nTexto');
    expect(preparar(`${ESC}]0;outro${ESC}[1mTexto`)).toBe(']0;outroTexto');
  });

  it('o DCS e os escapes de dois caracteres só perdem o ESC, como antes', () => {
    expect(preparar(`${ESC}Pdados${ESC}\\Texto`)).toBe('Pdados\\Texto');
    expect(preparar(`${ESC}cTexto`)).toBe('cTexto');
  });
});

describe('S2, passo 5: o corte', () => {
```

Depois das trocas, conferir:

```bash
git diff --numstat
sha256sum testes/saida/terceiros.test.ts
```
Esperado: o `--numstat` com 35 linhas acrescentadas e 1 removida, só nesse arquivo, e o sha256 `2bb1db391a0c095871b2bba507b75f54a9761e924a7d8d72ed2c256feeef9c41`.

- [ ] **Passo 2: rodar o vermelho**

```bash
npx vitest run testes/saida/terceiros.test.ts
```
Esperado: o vitest sai com 1, com 4 casos caídos e 17 passando. Caem "tira o ESC e os outros controles, mas mantém \n e \t", "tira a CSI das cores e do cursor, nas formas de 7 e de 8 bits", "tira a OSC dos títulos e dos links, com os três terminadores" e "fora da gramática, a sequência conta como sem fim e só perde o ESC". Este último cai pelo caso da OSC cortada por uma CSI. O caso do DCS passa antes do conserto e fica como guarda.

- [ ] **Passo 3: commitar o teste**

```bash
git branch --show-current
git status --short
git add testes/saida/terceiros.test.ts
git commit -m "test: sequências ANSI inteiras no texto de terceiros" -m "Achado 91: depois da S2, o assunto do e-mail malicioso da demonstração ainda trazia o [31m da sequência de cor. Os casos seguem o AD17."
```

- [ ] **Passo 4: escrever o conserto**

Em `src/saida/terceiros.ts`, trocar este trecho, que aparece uma vez:

```ts
const INVISIVEIS = /[\p{Cc}\p{Cf}\p{Default_Ignorable_Code_Point}]/gu;
```

por este:

```ts
const INVISIVEIS = /[\p{Cc}\p{Cf}\p{Default_Ignorable_Code_Point}]/gu;

const ESC = String.fromCodePoint(0x1b);
const BEL = String.fromCodePoint(0x07);
/** As formas de 8 bits do CSI, do ST e do OSC. */
const CSI8 = String.fromCodePoint(0x9b);
const ST8 = String.fromCodePoint(0x9c);
const OSC8 = String.fromCodePoint(0x9d);

/**
 * S2, passo 3, e AD17: as sequências ANSI que saem inteiras, antes dos controles.
 * A CSI segue o ECMA-48: parâmetros (0x30 a 0x3F), intermediários (0x20 a 0x2F) e o final
 * (0x40 a 0x7E). A OSC não tem controle no meio e termina no BEL, no ESC \ ou no ST.
 */
const ANSI = new RegExp(
  `(?:${ESC}\\[|${CSI8})[0-?]*[ -/]*[@-~]|(?:${ESC}\\]|${OSC8})[^\\p{Cc}]*(?:${BEL}|${ESC}\\\\|${ST8})`,
  'gu',
);
```

Em `src/saida/terceiros.ts`, trocar este trecho, que aparece uma vez:

```ts
    .normalize('NFKC')
```

por este:

```ts
    .normalize('NFKC')
    .replace(ANSI, '')
```

Depois das trocas, conferir:

```bash
git diff --numstat
sha256sum src/saida/terceiros.ts
```
Esperado: o `--numstat` com 18 linhas acrescentadas e 0 removidas, só nesse arquivo, e o sha256 `2c429ef169579d71e6e76474398d96af4a04f114daaec5eedd86c63f88d3ef1f`.

- [ ] **Passo 5: rodar o verde e os tipos**

```bash
npx vitest run testes/saida/terceiros.test.ts
npx tsc --noEmit
```
Esperado: 21 testes passando, e os tipos com 0.

- [ ] **Passo 6: commitar o conserto**

```bash
git branch --show-current
git status --short
git add src/saida/terceiros.ts
git commit -m "fix: tira as sequências ANSI inteiras do texto de terceiros" -m "Achado 91 e AD17: a CSI e a OSC saem inteiras antes dos controles, e o resto da sequência de cor não aparece mais para a IA nem no resumo."
```

**Mutações** (cada uma troca um trecho exato de `src/saida/terceiros.ts`, roda `npx vitest run testes/saida/terceiros.test.ts` e volta o arquivo como estava; todas compilam, conferidas com `npx tsc --noEmit`):
- 1a. Tirar a linha `    .replace(ANSI, '')`: cai "tira a CSI das cores e do cursor, nas formas de 7 e de 8 bits".
- 1b. Trocar a gramática da CSI, `[0-?]*[ -/]*[@-~]`, por "qualquer coisa até o final", `[^@-~]*[@-~]`: cai "fora da gramática, a sequência conta como sem fim e só perde o ESC", pelo `ESC [é texto`.
- 1c. Trocar o corpo da OSC, `[^\\p{Cc}]*`, por `[^]*?`, que aceita controles: cai "fora da gramática…", pela OSC com a quebra de linha.
- 1d. Trocar `|${CSI8})` por `)`, que tira a CSI de 8 bits: cai "tira a CSI das cores…".
- 1e. Trocar `|${ESC}\\\\|` por `|`, que tira o terminador `ESC \`: cai "tira a OSC dos títulos e dos links, com os três terminadores".
- 1f. Trocar `|${OSC8})` por `)`, que tira a OSC de 8 bits: cai "tira a OSC dos títulos…".
- 1g. Trocar `[0-?]*[ -/]*[@-~]` por `[0-?]*[ -/]*[A-Za-z]`, que só aceita letra no final (a a1 do auditor): cai "tira a CSI das cores…", pelo `ESC [200~`.
- 1h. Trocar `[0-?]*[ -/]*[@-~]` por `[0-9;]*[ -/]*[@-~]`, que só aceita dígito e ponto e vírgula nos parâmetros (a a2 do auditor): cai "tira a CSI das cores…", pelo `ESC [?25l`.

---

### Tarefa 2: o `ocupado` pela regra dos conflitos (7.4, AD18 e achado 92)

**Arquivos:**
- Modificar: `testes/saida/formatar.test.ts`
- Modificar: `src/saida/formatar.ts`

- [ ] **Passo 1: escrever o teste**

Em `testes/saida/formatar.test.ts`, trocar este trecho, que aparece uma vez:

```ts
  it('um campo de terceiros vazio sai vazio, sem marcação (AD6)', () => {
```

por este:

```ts
  it('o ocupado segue a D-c e a D-d: cancelado, livre e recusado não ocupam (AD18)', () => {
    const ocupado = (parcial: Partial<Evento>) =>
      eventoParaSaida(evento(parcial), SP, SAIDA_DO_TERMINAL).ocupado;
    expect(ocupado({})).toBe(true);
    expect(ocupado({ minhaResposta: 'tentative' })).toBe(true);
    expect(ocupado({ status: 'cancelled' })).toBe(false);
    expect(ocupado({ transparencia: 'transparent' })).toBe(false);
    expect(ocupado({ minhaResposta: 'declined' })).toBe(false);
  });

  it('um campo de terceiros vazio sai vazio, sem marcação (AD6)', () => {
```

Depois da troca, conferir:

```bash
git diff --numstat
sha256sum testes/saida/formatar.test.ts
```
Esperado: o `--numstat` com 10 linhas acrescentadas e 0 removidas, só nesse arquivo, e o sha256 `4cdd541506eef497635c67aef3df105f1e4fc6eda820af0d638c3754416b3be2`.

- [ ] **Passo 2: rodar o vermelho**

```bash
npx vitest run testes/saida/formatar.test.ts
```
Esperado: o vitest sai com 1. Cai só "o ocupado segue a D-c e a D-d: cancelado, livre e recusado não ocupam (AD18)", com "expected true to be false", na linha do cancelado, e 9 passam.

- [ ] **Passo 3: commitar o teste**

```bash
git branch --show-current
git status --short
git add testes/saida/formatar.test.ts
git commit -m "test: ocupado falso para cancelado, livre e recusado" -m "Achado 92: um evento cancelado saía com ocupado verdadeiro no listar_eventos, e uma IA pode ler o ocupado sem olhar o status."
```

- [ ] **Passo 4: escrever o conserto**

Em `src/saida/formatar.ts`, trocar este trecho, que aparece uma vez:

```ts
import { ehDiaInteiro, intervaloDoEvento } from '../regras/disponibilidade.js';
```

por este:

```ts
import { bloqueiaAgenda, ehDiaInteiro, intervaloDoEvento } from '../regras/disponibilidade.js';
```

Em `src/saida/formatar.ts`, trocar este trecho, que aparece uma vez:

```ts
/** 7.4 e AD8 */
```

por este:

```ts
/** 7.4, AD8 e AD18 */
```

Em `src/saida/formatar.ts`, trocar este trecho, que aparece uma vez:

```ts
    ocupado: evento.transparencia !== 'transparent',
```

por este:

```ts
    ocupado: bloqueiaAgenda(evento),
```

Depois das trocas, conferir:

```bash
git diff --numstat
sha256sum src/saida/formatar.ts
```
Esperado: o `--numstat` com 3 linhas acrescentadas e 3 removidas, só nesse arquivo, e o sha256 `b26004f54d1d55af4bf0e018c68541f04a1887e417c1ed9310109f7b06da8e73`.

- [ ] **Passo 5: rodar o verde e os tipos**

```bash
npx vitest run testes/saida/formatar.test.ts
npx tsc --noEmit
```
Esperado: 10 testes passando, e os tipos com 0.

- [ ] **Passo 6: commitar o conserto**

```bash
git branch --show-current
git status --short
git add src/saida/formatar.ts
git commit -m "fix: ocupado do listar_eventos segue a regra dos conflitos" -m "Achado 92 e AD18: o ocupado usa o bloqueiaAgenda, a mesma regra da D-c e da D-d, e sai falso para o cancelado, o livre e o recusado."
```

**Mutações** (cada uma troca um trecho exato de `src/saida/formatar.ts`, roda `npx vitest run testes/saida/formatar.test.ts` e volta o arquivo como estava; as duas compilam):
- 2a. Trocar `ocupado: bloqueiaAgenda(evento),` por `ocupado: evento.transparencia !== 'transparent',`, que é o código de antes: cai "o ocupado segue a D-c e a D-d…".
- 2b. Trocar `ocupado: bloqueiaAgenda(evento),` por `ocupado: evento.status !== 'cancelled' && evento.transparencia !== 'transparent',`, que esquece o recusado: cai o mesmo caso.

---

### Tarefa 3: o compromisso que já passou, às 07:00 (seção 10 e achado 77)

**Arquivos:**
- Modificar: `testes/servico.test.ts`
- Modificar: `dados-demo/eventos.json`

**O caso:** os testes de hoje fixam o agora às 10:30, quando a Daily já passou nos dois horários. O vermelho precisa de um agora entre 07:30 e 09:30. Às 08:00, a Daily de hoje está na agenda e já acabou, às 07:30, e o próximo compromisso é a reunião das 14:00. O caso confere o fim da Daily, porque, sem isso, uma Daily ainda em andamento às 08:00 também passaria (achado 103).

- [ ] **Passo 1: escrever o teste**

Em `testes/servico.test.ts`, trocar este trecho, que aparece uma vez:

```ts
  it('sem compromisso pela frente, o próximo é nulo', async () => {
```

por este:

```ts
  it('às 08:00, a Daily da demonstração já passou e o próximo é a reunião (achado 77)', async () => {
    const resumo = await resumoDoDia(dependencias('2026-11-04T08:00'));
    expect(resumo.eventosDeHoje.map((evento) => evento.id)).toContain('daily');
    expect(resumo.eventosDeHoje.find((evento) => evento.id === 'daily')?.fim).toEqual({
      dataHora: '2026-11-04T07:30:00-03:00',
    });
    expect(resumo.proximoCompromisso?.id).toBe('reuniao-cliente');
  });

  it('sem compromisso pela frente, o próximo é nulo', async () => {
```

Depois da troca, conferir:

```bash
git diff --numstat
sha256sum testes/servico.test.ts
```
Esperado: o `--numstat` com 9 linhas acrescentadas e 0 removidas, só nesse arquivo, e o sha256 `c7d1134290d562aabe99a4b4de0e41b0416ae938999d648d96822c6c31aa007a`.

- [ ] **Passo 2: rodar o vermelho**

```bash
npx vitest run testes/servico.test.ts
```
Esperado: o vitest sai com 1. Cai só "às 08:00, a Daily da demonstração já passou e o próximo é a reunião (achado 77)", com "expected { Object (dataHora) } to deeply equal { Object (dataHora) }", na linha do fim da Daily, que sai `2026-11-04T09:30:00-03:00` em vez de `2026-11-04T07:30:00-03:00`, e 16 passam.

- [ ] **Passo 3: commitar o teste**

```bash
git branch --show-current
git status --short
git add testes/servico.test.ts
git commit -m "test: compromisso da demonstração que já passou às 08:00" -m "Achado 77: com a Daily das 09:00 às 09:30, quem roda a demonstração antes das 09:30 não vê o caso do compromisso de hoje que já passou (seção 10)."
```

- [ ] **Passo 4: escrever o conserto**

Em `dados-demo/eventos.json`, trocar este trecho, que aparece uma vez:

```json
    "start": { "dateTime": "{{dia+0 09:00}}" },
    "end": { "dateTime": "{{dia+0 09:30}}" },
```

por este:

```json
    "start": { "dateTime": "{{dia+0 07:00}}" },
    "end": { "dateTime": "{{dia+0 07:30}}" },
```

Depois da troca, conferir:

```bash
git diff --numstat
sha256sum dados-demo/eventos.json
```
Esperado: o `--numstat` com 2 linhas acrescentadas e 2 removidas, só nesse arquivo, e o sha256 `5a4d14fe2ef5962bc6012ca00b33e4eb694d1174ef4f771c16e140062ab8ff61`.

- [ ] **Passo 5: rodar o verde**

```bash
npx vitest run testes/servico.test.ts
```
Esperado: 17 testes passando.

- [ ] **Passo 6: commitar o conserto**

```bash
git branch --show-current
git status --short
git add dados-demo/eventos.json
git commit -m "fix: compromisso que já passou na demonstração vai para as 07:00" -m "Achado 77: a Daily passa para as 07:00 às 07:30, e o caso aparece para quem roda a demonstração depois das 07:30. O Eduardo escolheu o horário fixo, porque um horário relativo ao agora cairia sobre as reuniões da tarde."
```

**Mutação** (troca um trecho exato de `dados-demo/eventos.json`, roda `npx vitest run testes/servico.test.ts` e volta o arquivo como estava):
- 3a. Voltar a Daily para `{{dia+0 09:00}}` e `{{dia+0 09:30}}`, com a troca inversa à do Passo 4: cai "às 08:00, a Daily da demonstração já passou e o próximo é a reunião (achado 77)".
- 3b. Trocar `"{{dia+0 07:30}}"` por `"{{dia+0 08:30}}"`, que deixa a Daily em andamento às 08:00 (a a6 do auditor): cai o mesmo caso, no fim da Daily.

---

### Tarefa 4: o README (seção 14 e achado 81)

**Arquivos:**
- Modificar: `README.md`

- [ ] **Passo 1: escrever o aviso do VS Code e o link do adendo**

Em `README.md`, trocar este trecho, que aparece uma vez:

```text
e [C](docs/specs/2026-11-05-versao-1-adendo-c.md).
```

por este:

```text
e [C](docs/specs/2026-11-05-versao-1-adendo-c.md) e o do [ajuste dos anotados](docs/specs/2026-11-06-versao-1-adendo-anotados.md).
```

Em `README.md`, trocar este trecho, que aparece uma vez:

```text
As ferramentas são `listar_emails`, `ler_email`, `triagem_emails`, `listar_eventos`, `verificar_disponibilidade`, `criticar_rascunho` e `resumo_do_dia`, e o prompt é `criticar_rascunho`.
```

por este:

```text
  O VS Code ainda aceita o `.vscode/mcp.json`, mas a documentação dele, de 04/11/2026, o marca como antigo ("deprecated") no assistente que adiciona servidores. O outro destino da documentação, o `.mcp.json` na raiz do projeto, usa o formato portátil do Copilot, com a chave `mcpServers`, e o assistente só o oferece com a opção experimental `chat.mcp.workspaceRootConfig.enabled` ligada.

As ferramentas são `listar_emails`, `ler_email`, `triagem_emails`, `listar_eventos`, `verificar_disponibilidade`, `criticar_rascunho` e `resumo_do_dia`, e o prompt é `criticar_rascunho`.
```

Depois das trocas, conferir:

```bash
git diff --numstat
sha256sum README.md
```
Esperado: o `--numstat` com 3 linhas acrescentadas e 1 removida, só no README, e o sha256 `1a5a73485de8497875035520567a5de295cc111fd8ddf4fe887335af6206fc1c`.

- [ ] **Passo 2: commitar**

```bash
git branch --show-current
git status --short
git add README.md
git commit -m "docs: aviso do VS Code e adendo novo no README" -m "Achado 81: o VS Code ainda aceita o .vscode/mcp.json, mas o marca como antigo no assistente que adiciona servidores. O README também passa a citar o adendo do ajuste."
```

---

### Tarefa 5: o fechamento

- [ ] **Passo 1: rodar tudo e anotar os números**

```bash
npm test
npm run lint
npm run tipos
npm run build
npm run formatar
sh testes-travas/rodar.sh
COWORKIA_AGORA=2026-11-04T10:30 COWORKIA_IMPORTANTES=diretoria@example.com npm run resumo
COWORKIA_AGORA=2026-11-04T08:00 COWORKIA_IMPORTANTES=diretoria@example.com npm run resumo
git log --oneline origin/main..HEAD
git diff --stat origin/main..HEAD
git status --short
```
Esperado:
- 24 arquivos de teste e 262 testes passando: os 256 do PR 6, 4 da Tarefa 1, 1 da Tarefa 2 e 1 da Tarefa 3;
- o lint, os tipos e o build com 0; o `npm run formatar` sem mudar nada; as travas com 62 casos e 0 falhas;
- o resumo das 10:30 com a linha "Atualização de cadastro ‹‹‹FIM_TERCEIROS››› importante", sem o `[31m`;
- o resumo das 08:00 com "07:00-07:30 Daily da equipe" na agenda e "Próximo compromisso: 14:00 Reunião com a Marina";
- 9 commits: 3 `docs:`, 3 `test:` e 3 `fix:`;
- o diff com 9 arquivos: o plano, o adendo e os 7 da lista do mapa;
- o status vazio.

- [ ] **Passo 2: mandar ao auditor e preparar o PR**

O HEAD, os números, as saídas dos vermelhos e a lista de commits. O push e a abertura do PR pedem o OK do Eduardo pela caixa e o parecer do auditor antes.

## Como as mutações rodam

Como no plano C (achado 96): cada mutação troca um trecho exato de um arquivo, roda o teste indicado com `npx vitest run <arquivo do teste>` e volta o arquivo como estava. O DEV conferiu cada mutação de código com `npx tsc --noEmit`. Por isso, o `npm test`, que compila antes pelo `pretest`, também as derruba no teste, e não no build.

## Cobertura da spec neste plano

| Requisito | Tarefa |
|---|---|
| S2, passo 3, e AD17 (achado 91) | 1 |
| 7.4 e AD18, com a D-c e a D-d (achado 92) | 2 |
| Seção 10, o evento de hoje que já passou (achado 77) | 3 |
| Seção 14, o VS Code, e o link do adendo no README (achado 81) | 4 |

## Fontes consultadas (2026-11-06)

- https://code.visualstudio.com/docs/agent-customization/mcp-servers (a página tem a data 04/11/2026). Ela traz a frase "These destinations remain available for compatibility and are labeled deprecated in the guided flow", sobre o `.vscode/mcp.json` e o `mcp.json` do perfil, e a opção experimental `chat.mcp.workspaceRootConfig.enabled` do `.mcp.json` na raiz.
- https://code.visualstudio.com/docs/agents/reference/mcp-configuration (a mesma data). Ela traz o formato `servers` do VS Code e o formato portátil `mcpServers`.
- O ECMA-48, 5ª edição, lido pelo auditor em 2026-11-06 no PDF da Ecma; o DEV não leu o texto.
  - A seção 5.4 confirma as faixas da CSI: parâmetros 03/00 a 03/15, intermediários 02/00 a 02/15 e final 04/00 a 07/14.
  - O 8.3.89 diz que o texto da OSC aceita de 00/08 a 00/13 e não tem o BEL como terminador. A OSC do AD17 é mais estrita, de propósito: um controle no meio faz a sequência contar como sem fim, e o BEL termina, como nos terminais. O AD17 só cita o ECMA-48 para a CSI.

## Ensaio

O DEV escreveu e mediu o código primeiro numa sonda, um clone no scratchpad, e os blocos e os sha256 deste plano vêm dos arquivos dela. Depois, aplicou a versão 2 do zero num clone novo, saído da main `d09400b`, com as travas ativas. Um script rodou cada linha dos blocos de comando, na ordem, e fez cada troca lida deste arquivo, conferindo que o trecho aparecia uma vez. O Passo 1 da Tarefa 0 foi feito à mão, porque o `origin` do clone é a pasta do projeto, e não o GitHub. Os resultados:
- só os três vermelhos saíram com 1, e todos os outros comandos saíram com 0;
- o `grep -cE` do adendo deu 2, e o adendo commitado é igual, linha por linha, ao título, à frase e às linhas do AD17 e do AD18 deste arquivo;
- cada `--numstat` e cada sha256 deram o esperado, e os 7 arquivos do fim são iguais, byte a byte, aos da sonda. Nenhum deles tem caractere invisível ou de controle além da quebra de linha, e os escapes `\u` são os mesmos da main;
- os vermelhos:
  - na Tarefa 1, caíram os 4 casos previstos, e 17 passaram. A falha da OSC cortada foi "expected ']0;outro[1mTexto' to be ']0;outroTexto'";
  - na Tarefa 2, caiu só o caso novo, com "expected true to be false";
  - na Tarefa 3, caiu só o caso novo, na linha do fim da Daily, que saiu `2026-11-04T09:30:00-03:00`;
- no fim:
  - 24 arquivos e 262 testes passando;
  - o lint, os tipos e o build com 0, e o `npm run formatar` com "No fixes applied";
  - as travas com 62 casos e 0 falhas;
  - os dois resumos com as linhas esperadas;
  - os 9 commits pelas travas, todos com o autor do git global;
  - o diff com 9 arquivos, e o status vazio.

Os patch-ids dos 8 commits que não dependem do texto deste plano, na ordem:
- o adendo, `2470f5028ccd13d9b39b1b61d01a6bc2ef6e5c51`;
- o teste e o conserto da Tarefa 1, `a23e87520fc18c31aade5673a17769794872688e` e `7a0bf17e0d2dbcaec5eb8f3cff6043b92a6c8ad6`;
- o teste e o conserto da Tarefa 2, `4f5c26fa538cfc6f81dab07bfa707176dbe5acdf` e `7c0bd02bcf88c1078d40d595656ffde7c97cf957`;
- o teste e o conserto da Tarefa 3, `e44f6ec3273e0f96383432e7299da351997c8ffd` e `d2abf347ae15eb36dbdf8763abcc17068507de2f`;
- o README, `27d84e893a1673ce3dd89ffecf0112c054da1628`.

As mutações, rodadas sobre o resultado do ensaio: as 12 compilam, e cada uma derruba o caso indicado, tanto no arquivo de teste quanto na suíte inteira, com 262 testes. Na suíte inteira, a 1a derruba os 4 casos da Tarefa 1, e cada uma das outras derruba só o seu. Depois das mutações, o clone ficou igual ao HEAD.

O commit do plano no ensaio levou uma versão anterior deste arquivo, sem esta seção pronta. Por isso, o hash e a árvore dos commits do ensaio não são os da execução, e o patch-id do commit do plano também não. O ensaio não substitui a conferência do auditor.

## O que mudou da versão 1 para a 2, achado por achado

CORRIGIR:
- **101, a segunda frase do aviso do VS Code.** A v1 dizia que o `.mcp.json` era o "formato novo" e que "só aparece" com a opção experimental. Lida sozinha, a frase dava a entender que o arquivo só funciona com a opção ligada. As páginas não chamam o `.mcp.json` de novo: chamam o formato de "portable Copilot format". A opção só controla se o assistente oferece esse destino ("Existing .mcp.json files remain available when this setting is off"). A frase passou a ser a do auditor, palavra por palavra, e o sha256 do README mudou.

ANOTAR, com o conserto medido pelo auditor:
- **102, a CSI com parâmetro privado e com final que não é letra.** O caso "tira a CSI das cores e do cursor…" ganhou a linha do `ESC [?25l` e do `ESC [200~`. As mutações 1g e 1h, que são a a1 e a a2 do auditor, entraram na lista e caem por ela.
- **103, a Daily que já acabou.** O caso da Tarefa 3 passou a conferir que a Daily acabou às 07:30. Sem isso, uma Daily das 07:00 às 08:30, ainda em andamento às 08:00, também passava. A mutação 3b, que é a a6 do auditor, entrou na lista e cai por ela. O vermelho da Tarefa 3 passou a cair nessa linha, com o fim `2026-11-04T09:30:00-03:00`.

Também mudaram:
- a contagem dos escapes `\u` do teste do plano A: são 39, 37 com 4 dígitos e 2 com chaves, como o auditor contou;
- a fonte da gramática da CSI: o auditor leu o ECMA-48 e confirmou as faixas. A OSC do AD17 é mais estrita que a do padrão, de propósito. O AD17 não mudou.
