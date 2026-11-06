# Plano do teste do `completo` na última página, achado 97 (versão 1 do plano)

> **Para quem executa:** use a habilidade superpowers:executing-plans, tarefa por tarefa. Os passos usam caixas de seleção (`- [ ]`).

**Objetivo:** acrescentar um teste que confere o `completo` da lista de e-mails do Google quando o e-mail que passa do limite é o último da última página. Esse é o achado 97 do auditor, anotado no plano C e aprovado pelo Eduardo como um ajuste pequeno depois do PR 5.

**Arquitetura:** entra um caso novo em `testes/fontes/fonte-google.test.ts`. Nenhum arquivo de `src/` muda, porque o código já está certo.

**Base:**
- a spec `docs/specs/2026-11-04-versao-1.md`, seção 7.3 (o `completo` da triagem);
- o adendo `docs/specs/2026-11-05-versao-1-adendo-c.md`, AD11: "Quando o limite corta, ou quando passa do `limite` pedido, o `completo` sai falso";
- o achado 97 do auditor, sobre o plano C v2 (a linha 1857 citada é a desse plano), com estas palavras:
  - "(a) Na linha 1857, trocar `const completo = achados.length <= filtro.limite;` por `const completo = true;` (a minha aa2) deixa os 255 passando. Esse caminho só decide quando o e-mail que passa do limite é o último da última página."
  - "(b) O meu teste tem 3 e-mails numa página só, sem próxima página, e limite 2. No código do plano, ele passa. Com a aa2, cai com `emails=2 completo=true`, ou seja, a saída diria "completo" com um e-mail faltando."
  - "(c) O código do plano está certo. O que falta é só o teste."

**A spec não muda.** O comportamento que o teste confere já está no AD11 e na seção 7.3. Por isso este assunto não tem spec nova. Se o auditor ou o Eduardo acharem que precisa de uma, ela vem antes da execução.

**Versões deste plano:** esta é a versão 1.

**Ensaio feito pelo DEV antes de mandar:** ver a seção "Ensaio", no fim.

## Restrições globais (valem para todas as tarefas)

- **Nenhum arquivo de `src/` muda.** No fim, o `git diff --stat origin/main..HEAD` mostra só o plano e o arquivo de teste.
- O bloco de código deste plano já está no formato do Biome, e o `npm run formatar` não deve mudar nenhum arquivo. Se mudar, o DEV anota a diferença e a manda ao auditor antes de seguir.
- Nenhum teste usa a internet, uma conta real ou o cofre do sistema. O caso novo usa o Google de mentira que o arquivo de teste já tem (`googleDeMentira` e `caixaDeTres`).
- Os commits seguem a CONTRIBUTING.md, seção 4, "As regras de todo commit". As travas locais estão ativas. Antes de cada commit: `git branch --show-current` (espera `test/completo-na-ultima-pagina`) e `git status --short`.
- A cada tarefa, o DEV manda ao auditor o hash e os números.

## Por que o teste não tem um vermelho contra o código de hoje

A CONTRIBUTING.md (seção 8) pede o teste antes do código: primeiro ele falha, depois passa. Aqui não há código novo, e o código de hoje está certo (achado 97, item c). Por isso o caso novo passa logo que é escrito.

O vermelho vem do defeito posto de propósito. O Passo 3 da Tarefa 1 aplica a aa2 do auditor no próprio repositório, roda o teste e mostra a falha. Depois, ele volta o arquivo e confere que o `src/` não mudou.

## Mapa de arquivos

- Criar: `docs/planos/2026-11-05-completo-na-ultima-pagina.md` (este plano)
- Modificar: `testes/fontes/fonte-google.test.ts` (11 linhas novas e nenhuma removida)

---

### Tarefa 0: branch e plano

- [ ] **Passo 1: criar a branch a partir da main atualizada**

```bash
git status --short
git fetch origin
git switch --no-track -c test/completo-na-ultima-pagina origin/main
git log --oneline -1
git config --get core.hooksPath
```
Esperado: o status vazio antes de trocar de branch, o topo no `dc456ce` (o merge do PR 5) ou num merge mais novo, e as travas em `.githooks`.

- [ ] **Passo 2: commitar o plano, na versão LIBERADA**

A versão liberada é o arquivo `plano-97-vN.md` do scratchpad do DEV com o maior N que o auditor deu como LIBERADO.

```bash
cp "C:/Users/EDUARD~1/AppData/Local/Temp/claude/9bb78e7f8b1714b4/fc600f43-1af8-4aa6-adae-7be1427cd432/scratchpad/plano-97-vN.md" docs/planos/2026-11-05-completo-na-ultima-pagina.md
sha256sum docs/planos/2026-11-05-completo-na-ultima-pagina.md
git add docs/planos/2026-11-05-completo-na-ultima-pagina.md
git commit -m "docs: plano do teste do completo na última página" -m "Achado 97 do auditor. Cópia fiel da versão liberada pelo auditor."
```
Esperado: o sha256 igual ao que o auditor liberou.

---

### Tarefa 1: o `completo` no fim da última página (7.3 e AD11)

**Arquivos:**
- Modificar: `testes/fontes/fonte-google.test.ts`

**O caso:** a `caixaDeTres` do arquivo de teste tem duas páginas. A primeira traz o `m1` e o `m2`, e a segunda, a última, traz só o `m3`, o mais velho dos três. Os três casam com o filtro vazio.
- Com o `limite` 3, os três cabem: a lista vem inteira, e o `completo` é verdadeiro.
- Com o `limite` 2, o `m3` é o e-mail que passa do limite, e ele é o último da última página. O código lê o `m3`, a lista acaba, e o `completo` tem de sair falso, com o `m2` e o `m1`.
- A última linha confere que o `m3` foi lido nas duas chamadas. Assim, a decisão saiu do fim da última página, que é o caminho do achado 97, e não do corte antecipado.

- [ ] **Passo 1: escrever o caso novo**

O caso entra no `describe('fonte de e-mail do Google (7.1, 7.2, 7.3, AD10 e AD11)')`, entre o caso "para quando passa do limite e diz que ficou incompleto" e o caso "lê no máximo 200 e-mails por chamada", separado de cada um deles por uma linha em branco. Nada mais muda no arquivo.

```ts
  it('no fim da última página, compara o que achou com o limite (#97)', async () => {
    const { fontes, pedidos } = googleDeMentira(caixaDeTres);
    const justo = await fontes.email.listar({ limite: 3 });
    expect(ids(justo.emails)).toEqual(['m2', 'm1', 'm3']);
    expect(justo.completo).toBe(true);
    const passou = await fontes.email.listar({ limite: 2 });
    expect(ids(passou.emails)).toEqual(['m2', 'm1']);
    expect(passou.completo).toBe(false);
    expect(pedidos.filter((pedido) => pedido.url.pathname.endsWith('/m3'))).toHaveLength(2);
  });
```

Depois de escrever, conferir:

```bash
git diff --numstat
sha256sum testes/fontes/fonte-google.test.ts
```
Esperado: o `--numstat` com 11 linhas acrescentadas e 0 removidas, só no `testes/fontes/fonte-google.test.ts`, e o sha256 `58c0046be247875c80e09d75b542820b188707fea0fc85a7c68a35b4cc36917c`. Antes do caso novo, o arquivo da main tem o sha256 `7087ef82385952f343008e657341d5c84a298c2e1280d15d60f8982eb1536e20`.

- [ ] **Passo 2: rodar o arquivo de teste (verde logo de cara)**

```bash
npx vitest run testes/fontes/fonte-google.test.ts
```
Esperado: 12 testes passando, os 11 de antes e o caso novo.

- [ ] **Passo 3: o vermelho, com o defeito do achado 97 posto de propósito**

```bash
sed -i 's/const completo = achados.length <= filtro.limite;/const completo = true;/' src/fontes/google/fonte-google.ts
grep -c 'const completo = true;' src/fontes/google/fonte-google.ts
npx vitest run testes/fontes/fonte-google.test.ts
git restore src/fontes/google/fonte-google.ts
git status --short
```
Esperado:
- o `grep -c` dá 1;
- o vitest sai com 1, com 1 teste caído ("no fim da última página, compara o que achou com o limite (#97)") e 11 passando;
- depois do `git restore`, o status mostra só ` M testes/fontes/fonte-google.test.ts`.

- [ ] **Passo 4: a suíte, o lint, os tipos, o build e o formato**

```bash
npm test
npm run lint
npm run tipos
npm run build
npm run formatar
git status --short
```
Esperado: 24 arquivos de teste e 256 testes passando (os 255 do PR 5 e o caso novo); o lint, os tipos e o build com 0; o `npm run formatar` sem mudar nada, e o status ainda só com o arquivo de teste.

- [ ] **Passo 5: commitar**

```bash
git add testes/fontes/fonte-google.test.ts
git commit -m "test: completo quando o último e-mail passa do limite" -m "Achado 97 do auditor: nenhum teste conferia o completo quando o e-mail que passa do limite é o último da última página. O código já estava certo, e o caso novo pega o defeito de dizer completo com um e-mail faltando."
```

**Mutações** (como no achado 96 do plano C: cada uma troca um trecho exato de `src/fontes/google/fonte-google.ts`, roda `npx vitest run testes/fontes/fonte-google.test.ts` e volta o arquivo como estava; as três compilam, conferidas com `npx tsc --noEmit`):
- Trocar `const completo = achados.length <= filtro.limite;` por `const completo = true;` (a aa2 do auditor): cai "no fim da última página, compara o que achou com o limite (#97)".
- Trocar `achados.length <= filtro.limite` por `achados.length < filtro.limite`: cai o mesmo caso, no `limite` 3.
- Trocar `ordenar(achados, cfg.fuso).slice(0, filtro.limite), completo }` por `ordenar(achados, cfg.fuso), completo }`, que devolve os e-mails sem o corte no fim da última página: cai o mesmo caso, no `limite` 2.

Antes do caso novo, as três sobrevivem aos 255 testes da suíte.

---

### Tarefa 2: o fechamento

- [ ] **Passo 1: rodar tudo e anotar os números**

```bash
npm test
sh testes-travas/rodar.sh
git log --oneline origin/main..HEAD
git diff --stat origin/main..HEAD
git status --short
```
Esperado:
- 256 testes passando e as travas com 62 casos e 0 falhas;
- 2 commits: o `docs:` do plano e o `test:` do caso novo;
- o diff só com o plano e `testes/fontes/fonte-google.test.ts`, sem nenhum arquivo de `src/`;
- o status vazio.

- [ ] **Passo 2: mandar ao auditor e preparar o PR**

O HEAD, os números e a saída do vermelho do Passo 3 da Tarefa 1. O push e a abertura do PR pedem o OK do Eduardo pela caixa e o parecer do auditor antes.

## Cobertura da spec neste plano

| Requisito | Tarefa |
|---|---|
| 7.3 e AD11 (o `completo` falso quando passa do `limite` pedido, no fim da última página) | 1 |

## Ensaio

O DEV aplicou este plano do zero num clone do repositório no scratchpad, fora da pasta do projeto. O clone saiu da main `dc456ce`, com as travas ativas. Um script rodou cada linha dos blocos de comando, na ordem, e pôs o caso novo, lido deste arquivo, no lugar que o Passo 1 da Tarefa 1 descreve. O Passo 1 da Tarefa 0 foi feito à mão, porque o `origin` do clone é a pasta do projeto, e não o GitHub. Os resultados:
- o `git diff --numstat` deu 11 linhas acrescentadas e 0 removidas, só no arquivo de teste, e o sha256 do arquivo de teste deu o esperado;
- o arquivo de teste deu 12 testes passando;
- no vermelho do Passo 3:
  - o `grep -c` deu 1;
  - o vitest saiu com 1, com só o caso novo caído, na linha `expect(passou.completo).toBe(false);` ("expected true to be false");
  - depois do `git restore`, o status mostrou só o arquivo de teste;
- a suíte deu 24 arquivos e 256 testes passando; o lint, os tipos e o build saíram com 0; o `npm run formatar` não mudou nada ("No fixes applied");
- os 2 commits passaram pelas travas, com o autor do git global, e as travas deram 62 casos e 0 falhas;
- o diff contra a main tem 2 arquivos e nenhum de `src/`, e o status ficou vazio no fim;
- o commit do teste tem o patch-id `6cfd3dcf99f3017cc0893c5bea291886552b7b97`, e o arquivo de teste, o blob `e14d35e116bc56d28037af49ad46931298133ed1`. Os dois não dependem do texto deste plano.

As mutações:
- as três da Tarefa 1, rodadas sobre o resultado do ensaio, compilam e derrubam só o caso novo, tanto no arquivo de teste quanto na suíte inteira, com 256 testes;
- antes do caso novo, as três sobreviviam aos 255 testes da suíte;
- uma quarta, trocar `achados.length > filtro.limite` por `achados.length >= filtro.limite` no corte antecipado, já caía pelo caso "para quando passa do limite e diz que ficou incompleto" e cai também pelo caso novo. Ela não entra na lista, porque não mede o achado 97;
- depois das mutações, o clone ficou igual ao HEAD.

O commit do plano no ensaio levou uma versão anterior deste arquivo: sem esta seção e com a saída do `--numstat` escrita com tabulações. Os 9 blocos de comando e de código das duas versões são iguais, byte a byte. Por isso, o hash e a árvore dos dois commits do ensaio não são os da execução, mas o patch-id do commit do teste é. O ensaio não substitui a conferência do auditor.
