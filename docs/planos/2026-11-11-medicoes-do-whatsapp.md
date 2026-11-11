# Plano das medições de 2026-11-11 no README (versão 1 do plano)

> **Para quem executa:** use a habilidade superpowers:executing-plans, tarefa por tarefa. Os passos usam caixas de seleção (`- [ ]`).

**Objetivo:** registrar no repositório as medições e as exceções de 2026-11-11 (o adendo) e pôr no README o que elas mostraram: a exportação real de um celular Android, a citação ao grupo todo que não é reconhecida, a mensagem apagada por outra pessoa que não apareceu numa exportação do Android, o iPhone e a citação com o @ do nome sem medição, e o modo google sem uma conta real (AW14).

**Arquitetura:**
- Só documentação: o adendo novo, este plano e três trocas no `README.md`. O código, os testes e a demonstração não mudam (AW15).
- Não há sonda de código nem mutações. A Tarefa 2 roda a suíte inteira, o lint, os tipos, o build e as travas, para mostrar que nada mais mudou.

**Base:**
- o adendo `docs/specs/2026-11-11-versao-2-whatsapp-adendo-medicoes.md`, na versão 2 do documento (sha256 348c6e2ae0410900c5907a9f37584ed1af71d61795d0fce4b30211b3e0fec896), liberado pelo auditor, que vai ao Eduardo junto com o pedido do "Aprovo o adendo e pode executar". Ele entra no repositório na Tarefa 0;
- as escolhas do Eduardo pela caixa em 2026-11-11, citadas no adendo, e as frases do README aprovadas por ele: primeiro com "Estão certas (Recomendado)" e, depois das duas precisões pedidas pelo auditor, com "Aprovo as frases novas (Recomendado)";
- a spec do WhatsApp (`docs/specs/2026-11-06-versao-2-whatsapp.md`, na versão 4 do documento) e os adendos AW1 a AW13, que continuam valendo.

**Versões deste plano:** esta é a versão 1.

**Ensaio feito pelo DEV antes de mandar:** ver a seção "Ensaio", no fim.

## Restrições globais (valem para todas as tarefas)

- Nenhum escape `\u` e nenhum caractere invisível entram nos arquivos. Nenhuma dependência nova.
- **Toda mudança de arquivo que já existe é uma troca exata**: o trecho "trocar" aparece uma vez só no arquivo e é trocado pelo trecho "por este".
- Depois da escrita, o `git diff --numstat` e o sha256 conferem os bytes.
- Os commits seguem a CONTRIBUTING.md, seção 4. As travas locais estão ativas. Cada bloco de commit começa com o `git branch --show-current` (espera `docs/medicoes-do-whatsapp`) e o `git status --short`.
- A cada tarefa, o DEV manda ao auditor os hashes e as saídas.

## Mapa de arquivos

- Criar: `docs/specs/2026-11-11-versao-2-whatsapp-adendo-medicoes.md` e `docs/planos/2026-11-11-medicoes-do-whatsapp.md` (Tarefa 0)
- Modificar: `README.md` (Tarefa 1)

---

### Tarefa 0: branch, adendo e plano

- [ ] **Passo 1: criar a branch a partir da main atualizada**

```bash
git status --short
git fetch origin
git switch --no-track -c docs/medicoes-do-whatsapp origin/main
git log --oneline -1
git config --get core.hooksPath
```
Esperado: o status vazio antes da troca, o topo no `f9307f9` (o merge do PR 15) ou num merge mais novo, e as travas em `.githooks`.

- [ ] **Passo 2: commitar o adendo liberado**

```bash
cp "C:/Users/EDUARD~1/AppData/Local/Temp/claude/9bb78e7f8b1714b4/fc600f43-1af8-4aa6-adae-7be1427cd432/scratchpad/adendo-medicoes-v2.md" docs/specs/2026-11-11-versao-2-whatsapp-adendo-medicoes.md
sha256sum docs/specs/2026-11-11-versao-2-whatsapp-adendo-medicoes.md
git branch --show-current
git status --short
git add docs/specs/2026-11-11-versao-2-whatsapp-adendo-medicoes.md
git commit -m "docs: adendo das medições do WhatsApp" -m "As medições e as exceções de 2026-11-11 (o celular, o grupo de teste e o Google) e a AW14, com o README, na versão 2 do documento, liberado pelo auditor e aprovado pelo Eduardo junto com o plano."
```
Esperado: o sha256 `348c6e2ae0410900c5907a9f37584ed1af71d61795d0fce4b30211b3e0fec896`.

- [ ] **Passo 3: commitar o plano, na versão LIBERADA**

A versão liberada é o arquivo `plano-medicoes-vN.md` do scratchpad do DEV com o maior N que o auditor deu como LIBERADO.

```bash
cp "C:/Users/EDUARD~1/AppData/Local/Temp/claude/9bb78e7f8b1714b4/fc600f43-1af8-4aa6-adae-7be1427cd432/scratchpad/plano-medicoes-vN.md" docs/planos/2026-11-11-medicoes-do-whatsapp.md
sha256sum docs/planos/2026-11-11-medicoes-do-whatsapp.md
git branch --show-current
git status --short
git add docs/planos/2026-11-11-medicoes-do-whatsapp.md
git commit -m "docs: plano das medições do WhatsApp" -m "As três trocas do README com as medições de 2026-11-11 e o fechamento. Cópia fiel da versão liberada pelo auditor."
```
Esperado: o sha256 igual ao que o auditor liberou.

---

### Tarefa 1: o README (AW14)

- [ ] **Passo 1: escrever**

Em `README.md`, trocar este trecho, que aparece uma vez:

```markdown

Com o app em "Teste", o Google faz o login valer 7 dias; depois disso, rode `npm run login-google` de novo. Publicar o app tira esse limite, mas o Google pode pedir uma verificação para as permissões do Gmail, e isso não foi testado.

### Usar só o WhatsApp e os extratos

Se você não quer conectar o Google, o modo `arquivos` lê só as conversas exportadas do WhatsApp e os extratos OFX. Ele não pede o login do Google nem o `.env` e não toca no cofre do sistema.
```

por este:

```markdown

Com o app em "Teste", o Google faz o login valer 7 dias; depois disso, rode `npm run login-google` de novo. Publicar o app tira esse limite, mas o Google pode pedir uma verificação para as permissões do Gmail, e isso não foi testado.

O modo google foi testado com os dados de demonstração e com testes automáticos, mas ainda não com uma conta real do Google.

### Usar só o WhatsApp e os extratos

Se você não quer conectar o Google, o modo `arquivos` lê só as conversas exportadas do WhatsApp e os extratos OFX. Ele não pede o login do Google nem o `.env` e não toca no cofre do sistema.
```

Em `README.md`, trocar este trecho, que aparece uma vez:

```markdown
- a hora com AM ou PM só é lida na exportação do WhatsApp do computador, e os idiomas além do português e a mídia não são lidos;
- na exportação do WhatsApp do computador, um contato salvo com o nome "Você" conta como você, uma mensagem só com um texto entre < e > conta como mídia, e a linha que imita uma mensagem sua, no meio de uma mensagem de várias linhas, não precisa do seu nome: basta o "Você";
- num celular configurado no formato mês/dia, como o dos Estados Unidos, com o relógio de 24 horas, as datas saem trocadas, e algumas mensagens se juntam à anterior. As ferramentas do WhatsApp e o resumo do dia avisam quando acham uma data que não existe, como o mês 13. Um arquivo em que todos os dias vão até 12 não dá para distinguir e sai sem aviso;
- a citação pelo número de telefone não é reconhecida, e um aviso do WhatsApp com ": " no meio pode virar uma mensagem;
- um grupo em que só uma outra pessoa falou conta como conversa individual, e um contato que muda de nome no meio da conversa faz ela contar como grupo.

O formato da exportação não é publicado pelo WhatsApp. O coworkIA foi feito a partir das variações conhecidas e medido com exportações de exemplo publicadas por projetos abertos e com uma exportação real do WhatsApp do computador. As exportações do celular ainda não foram medidas com uma exportação real.

### Ler os extratos do banco

```

por este:

```markdown
- a hora com AM ou PM só é lida na exportação do WhatsApp do computador, e os idiomas além do português e a mídia não são lidos;
- na exportação do WhatsApp do computador, um contato salvo com o nome "Você" conta como você, uma mensagem só com um texto entre < e > conta como mídia, e a linha que imita uma mensagem sua, no meio de uma mensagem de várias linhas, não precisa do seu nome: basta o "Você";
- num celular configurado no formato mês/dia, como o dos Estados Unidos, com o relógio de 24 horas, as datas saem trocadas, e algumas mensagens se juntam à anterior. As ferramentas do WhatsApp e o resumo do dia avisam quando acham uma data que não existe, como o mês 13. Um arquivo em que todos os dias vão até 12 não dá para distinguir e sai sem aviso;
- a citação pelo número de telefone e a citação ao grupo todo não são reconhecidas, porque só contam os nomes da `COWORKIA_WHATSAPP_EU`, e um aviso do WhatsApp com ": " no meio pode virar uma mensagem;
- um grupo em que só uma outra pessoa falou conta como conversa individual, e um contato que muda de nome no meio da conversa faz ela contar como grupo.

O formato da exportação não é publicado pelo WhatsApp. O coworkIA foi feito a partir das variações conhecidas e medido com exportações de exemplo publicadas por projetos abertos e com exportações reais do WhatsApp do computador e de um celular Android. Numa exportação do Android, a mensagem que outra pessoa apagou para todos não apareceu. A exportação do iPhone e a citação com o @ do seu nome ainda não foram medidas com uma exportação real.

### Ler os extratos do banco

```

Depois de escrever, conferir:

```bash
git diff --numstat
sha256sum README.md
```
Esperado: 4 linhas acrescentadas e 2 removidas, só no README, e o sha256 `0f3f6cd26a599abf51c0fac38d9605d489736a679e594b4837d9d7f8dc7e6fef`.

- [ ] **Passo 2: commitar**

```bash
git branch --show-current
git status --short
git add README.md
git commit -m "docs: as medições do WhatsApp e o Google no README" -m "Adendo AW14: a exportação real de um celular Android, a citação ao grupo todo que não é reconhecida, a mensagem apagada por outra pessoa, o que ainda não foi medido e o modo google sem uma conta real."
```

---

### Tarefa 2: o fechamento

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
- 38 arquivos de teste e 496 testes passando (num Windows sem o modo de desenvolvedor, 494 passando e 2 pulados, os dos links de arquivo), como na main;
- o lint, os tipos e o build com 0, o `npm run formatar` sem mudar nada e as travas com 62 casos e 0 falhas;
- 3 commits `docs:`;
- 3 arquivos no diff, e o status vazio.

- [ ] **Passo 2: mandar ao auditor e preparar o PR**

O HEAD, os números e a lista de commits. O push e a abertura do PR pedem o OK do Eduardo pela caixa e o "pode" do auditor antes, com o roteiro lido.

## Cobertura do adendo neste plano

| Item do adendo | Tarefa |
|---|---|
| AW14 (o README) | 1 |
| AW15 (os testes não mudam) | 2 |

## Ensaio

O DEV escreveu as três trocas primeiro numa sonda, um clone no scratchpad saído da main `f9307f9`, e conferiu que cada frase nova do README é a da AW14, e que a linha antiga da citação saiu. Um gerador montou este plano a partir dela: a troca sai do diff entre a main e a sonda, e o gerador conferiu que cada trecho "trocar" aparece uma vez e que aplicar as trocas na main dá exatamente o README da sonda.

Depois, o DEV aplicou o plano do zero num clone novo, saído da main `f9307f9`, com as travas ativas. Um script rodou cada linha dos blocos de comando, na ordem, e fez cada troca lida deste arquivo. O Passo 1 da Tarefa 0 foi feito à mão, porque o `origin` do clone é a pasta do projeto, e não o GitHub: a `origin/main` do clone veio da `origin/main` da pasta, que está no `f9307f9`, e o `git fetch origin` desse passo não rodou no clone. Os resultados:
- os 27 comandos saíram com 0, e o script fez 2 trocas;
- cada um dos 3 sha256 deu o esperado. O README do fim é igual, byte a byte, ao da sonda, e o adendo commitado é igual à versão 2 (`348c6e2ae0410900c5907a9f37584ed1af71d61795d0fce4b30211b3e0fec896`);
- no fim:
  - 38 arquivos e 496 testes passando, nenhum pulado, como na main;
  - o lint, os tipos e o build com 0, e o `npm run formatar` com "No fixes applied";
  - as travas com 62 casos e 0 falhas;
  - os 3 commits pelas travas, todos com o autor do git global;
  - 3 arquivos no diff, e o status vazio.

Os patch-ids dos 2 commits que não dependem do texto deste plano, na ordem:
- o adendo, `ff93f0b14a1648522be425976ca5d1bafee66ce0`;
- o README, `484e824d07d956a6f80e9128544eaae8b0510e2a`.

Um ensaio anterior, com a versão 1 do adendo, deu os mesmos números. Depois do parecer do auditor sobre ela (achados 135 e 136), o plano foi gerado de novo, para a versão 2, e ensaiado de novo.

O commit do plano no ensaio levou uma versão anterior deste arquivo, sem esta seção (sha256 c1df128b9f14b3827a1597b0c5f68e7f9e085145a4f24cae1013a8fdfb296992). Fora esta seção, as duas versões são iguais, byte a byte. Por isso, o hash e a árvore dos commits do ensaio não são os da execução, e o patch-id do commit do plano também não. O ensaio não substitui a conferência do auditor.
