# Spec das travas locais do git (spec-travas, versão 3 do documento)

Data: 2026-11-04. Autor: DEV (coworkia-cd).
Fica fora do git até existir a branch do assunto. Quando entrar, vai para `docs/specs/2026-11-04-travas-locais.md`.
A versão 1 (sha256 52aeccd117f3fbf82033e8c678186bd9adb58757e57c573b7a7cc5bc3123d932) recebeu CORRIGIR, com o achado 50, e seis achados ANOTAR, do 51 ao 56. A seção 10 liga cada achado à seção que o resolve.
A versão 2 (sha256 83242e4029950a695cf072366d58013596e3560072bfdacffa4b83867e563447) recebeu CORRIGIR, com o achado 57, e duas observações. A seção 11 liga cada um à seção que o resolve.

## 1. Objetivo

Barrar na máquina o que o CONTRIBUTING proíbe, antes de o commit existir quando dá, e sempre antes de ele chegar ao GitHub. O GitHub não protege a main de um repositório privado sem o Pro (CONTRIBUTING.md:41), então essa barreira fica com as travas e com o auditor.

## 2. Decisões

Do Eduardo, pela caixa, em 2026-11-04:
- D1. As travas são hooks do git em `.githooks/`, escritos em shell puro, sem dependência e sem stack. Os testes também são em shell puro.
- D2. Os hooks são o `pre-commit`, o `commit-msg` e o `pre-push`. A versão 2 acrescenta o `pre-merge-commit`, que só chama as mesmas regras do `pre-commit` (achado 50).
- D3. Quatro extras, escolhidos pelo DEV porque o Eduardo deixou a escolha com ele ("faça o que você achar melhor e recomendado"): o autor certo, o bloqueio do `.env` forçado, a busca de chaves e o título de até 72 caracteres.
- D4. As travas vêm antes do plano A da versão 1.
- D5. A ativação usa `core.hooksPath`, só neste repositório.
- D11. O repositório no GitHub só aceita o merge commit, com o título do merge igual ao título do PR e a descrição em branco (configurado com o OK do Eduardo e conferido pelo auditor em 2026-11-04).

Propostas do DEV, a confirmar pelo Eduardo na leitura:
- D6. Barrar **qualquer** linha `Co-Authored-By`, e não só as de IA. Isso segue o pedido "deixe apenas o meu" nos colaboradores.
- D7. Barrar a arroba solta na mensagem (uma menção do GitHub fora de crase), que notificaria uma conta.
- D8. Permitir o "Merge …" padrão do git só num merge local em andamento, para atualizar uma branch com a main sem reescrever nada.
- D9. Permitir apagar uma branch remota, menos a main, só depois de ela entrar na main, para não sumir do GitHub um commit que o auditor já conferiu.
- D10. Os testes criam os repositórios temporários dentro da pasta do projeto, em `.tmp-travas/` (no `.gitignore`), para não tocar nada fora da pasta (CONTRIBUTING, seção 9).

## 3. Requisitos gerais

- RG1. Cada hook é um script `#!/bin/sh` POSIX que roda no `sh` do Git for Windows, no Linux e no macOS.
- RG2. Uma recusa sai com código diferente de 0 e imprime no stderr, em português: a trava (por exemplo, `[trava P1]`), o motivo e o conserto.
- RG3. Nenhuma trava imprime o valor de um segredo achado. Ela imprime o arquivo (e, no `pre-push`, o commit) e o nome da regra.
- RG4. Os hooks ficam com o bit de execução no git (`git update-index --chmod=+x`), para funcionar em clones no Linux e no macOS.
- RG5. As contas de caracteres usam `LC_ALL=C.UTF-8`, para um acento contar como um caractere.
- RG6. As regras ficam num arquivo só, `.githooks/regras.sh`, que os hooks carregam. Assim, o `pre-commit`, o `pre-merge-commit` e o `pre-push` usam o mesmo código para a mesma regra.

## 4. As regras

### 4.1 Regras de commit (P1 a P4)

- P1. A branch atual não pode ser a `main`. Um HEAD solto não é recusado por esta regra.
- P2. O autor e o committer são `Eduardo Kobal <162614913+Eduardokobal@users.noreply.github.com>`, comparando o nome e o e-mail.
- P3. Nenhum arquivo adicionado, copiado, modificado ou renomeado casa com a parte de segredos do `.gitignore`. Os quatro primeiros itens casam pelo nome do arquivo, em qualquer pasta; o último casa pelo caminho a partir da raiz do repositório:
  - `.env*`, menos `.env.example`;
  - `*.pem`, `*.key`, `*.p12`, `*.pfx`;
  - `id_rsa*`, `id_ed25519*`;
  - `credentials*.json`, `*service-account*.json`;
  - o caminho `.claude/settings.local.json`, que pode guardar variáveis de ambiente.
  Isso pega o `git add -f`, que passa por cima do `.gitignore`.
- P4. Nenhuma linha acrescentada casa com uma destas regras de chave:

| Regra | Expressão (ERE) |
|---|---|
| chave privada | `-----BEGIN [A-Z ]*PRIVATE KEY-----` |
| token do GitHub | `gh[pousr]_[A-Za-z0-9]{36}` |
| token fino do GitHub | `github_pat_[A-Za-z0-9_]{22,}` |
| chave da AWS | `AKIA[0-9A-Z]{16}` |
| chave de API do Google | `AIza[0-9A-Za-z_-]{35}` |
| client secret do Google | `GOCSPX-[A-Za-z0-9_-]{20,}` |
| token de acesso do Google | `ya29\.[0-9A-Za-z_-]{20,}` |
| refresh token do Google | `1//0[0-9A-Za-z_-]{20,}` |
| chave da OpenAI ou da Anthropic | `(^|[^A-Za-z0-9])sk-[A-Za-z0-9_-]{20,}` |

  A regra do `sk-` exige que ele não venha colado numa letra ou num dígito, para "task-…" não ser recusado. As expressões escritas nesta tabela, no hook e nesta spec não casam com elas mesmas, porque o `[` ou o `\` vem logo depois do prefixo.

### 4.2 Regras de mensagem (M1 a M6)

As linhas que começam com `#` são ignoradas.

- M1. A primeira linha segue o formato `tipo(escopo): frase`, `tipo: frase`, `tipo!: frase` ou `tipo(escopo)!: frase`:
  - `tipo` é um de `feat`, `fix`, `docs`, `test`, `refactor`, `perf`, `style`, `build`, `ci` e `chore`;
  - o `escopo` é opcional, com letras minúsculas, dígitos e hífen, sem acento;
  - o `!` é opcional, como no Conventional Commits 1.0.0 (CONTRIBUTING.md:67);
  - depois do `: ` vem uma frase que não começa com espaço e não termina com ponto.
  A regra não confere se a frase começa com minúscula, porque a exceção de nome próprio, sigla e nome de arquivo (CONTRIBUTING.md:65) não se decide por máquina. Essa parte fica com o auditor.
- M2. A primeira linha tem até 72 caracteres (RG5).
- M3. Se houver mais linhas, a segunda é vazia.
- M4. Nenhuma linha é `Co-Authored-By:` (D6), sem diferença de maiúscula, e nenhuma tem "Generated with" nem o emoji 🤖.
- M5. Depois de tirar os trechos entre crases, nenhuma arroba vem logo depois do começo da linha, de um espaço ou de uma pontuação e seguida de letra ou dígito (D7). Um e-mail como `ana@example.com` não é recusado, porque a arroba vem logo depois de uma letra.
- M6. Exceção do D8: num merge local, uma mensagem que começa com `Merge ` não passa pela M1 nem pela M2, mas continua sujeita à M3, à M4 e à M5. No `commit-msg`, o merge local é reconhecido pelo `MERGE_HEAD`. No `pre-push`, por um commit com mais de um pai.

### 4.3 Regras de push (U1 a U4)

O `pre-push` recebe o nome e a URL do remoto como argumentos e, na entrada padrão, uma linha por ref: `<ref local> <sha local> <ref remota> <sha remoto>`. "Só zeros" quer dizer o sha `0000…` que o git usa para uma ref que não existe.

- U1. A URL do remoto é `github.com/Eduardokobal/coworkIA`, por HTTPS (`https://github.com/Eduardokobal/coworkIA` com ou sem `.git`) ou por SSH (`git@github.com:Eduardokobal/coworkIA.git`). Isso barra a organização `Grupo-Vannuchi` e qualquer outro remoto.
- U2. Nenhum push para `refs/heads/main`, inclusive apagar a main.
- U3. Apagar outra branch remota (sha local só zeros) só passa quando o sha remoto é ancestral da `origin/main`, ou seja, quando a branch já entrou na main (D9). Se o sha remoto não existe no clone local, ou se ele não é ancestral da `origin/main`, a regra recusa. A mensagem pede um `git fetch` nos dois casos, porque a `origin/main` local pode estar atrasada em relação a um merge feito na página do GitHub.
- U4. Quando o sha local não é só zeros e o sha remoto também não é, o sha remoto tem de ser ancestral do local (`git merge-base --is-ancestor`). Senão, é push forçado, e a regra recusa. Se o sha remoto não existe no clone local, ela recusa e pede um `git fetch` antes.

## 5. Onde cada regra roda

| Hook | Quando o git chama | Regras |
|---|---|---|
| `pre-commit` | `git commit` | P1 a P4, sobre o stage |
| `pre-merge-commit` | `git merge` que cria um merge commit | P1 a P4, sobre o stage do merge (chama o `pre-commit`) |
| `commit-msg` | `git commit` e `git merge` | M1 a M6, sobre o arquivo da mensagem |
| `pre-push` | `git push` | U1 a U4, e a reconferência de cada commit que sobe |

**A reconferência do `pre-push` (achado 50).** O auditor mediu no git 2.55.0.windows.5 que o `git cherry-pick` e o `git revert --no-edit` não chamam o `pre-commit` nem o `commit-msg`, e que o `git merge --no-ff` não chama o `pre-commit`. Por isso, o `pre-push` reconfere cada commit novo antes de ele sair da máquina:
- os commits novos de uma ref são os do `git rev-list <sha local> --not <sha remoto> --remotes=origin`. Numa ref nova (sha remoto só zeros), o `<sha remoto>` sai do comando. A regra é uma só para os dois casos: um commit que já está em qualquer ref do `origin` não é reconferido. Assim, quando uma branch já enviada recebe a main por merge (D8), os merges feitos na página do GitHub, cujo committer é "GitHub <noreply@github.com>", não entram na lista (achado 57);
- em cada commit, valem a P2 (pelo `git log -1 --format`), a M1 a M6 (pela mensagem do commit), a P3 (pelos nomes de arquivo do commit contra o primeiro pai, ou contra a árvore vazia no primeiro commit) e a P4 (pelas linhas acrescentadas nessa mesma comparação);
- a saída de uma recusa diz o commit (o hash curto), a regra e o arquivo, nunca o valor (RG3).

## 6. Ativação e documentação

- A ativação é `git config core.hooksPath .githooks`, uma vez por clone. Ela grava só no `.git/config` deste repositório, o que a CONTRIBUTING.md:75 permite para um assunto aprovado.
- O README ganha a seção "Travas locais", com o comando de ativação e o de conferência (`git config --get core.hooksPath`).
- O CONTRIBUTING muda em quatro pontos:
  - a linha 41 passa a dizer que as travas existem, e onde;
  - a seção 4 ganha uma linha com o que as travas conferem e o que fica com o auditor;
  - a linha 75 cita que o `gh repo create`, o `git remote add` e o `git push -u` também gravam na config local (a observação do auditor de 2026-11-04);
  - as linhas 85 a 88 passam a dizer que o GitHub só oferece o merge commit, que o título do merge vem do título do PR e que a descrição fica em branco (D11 e achado 48).
- O `.gitignore` ganha `.tmp-travas/`.

## 7. Testes

- Um script `testes-travas/rodar.sh`, em shell puro, roda com `sh testes-travas/rodar.sh`. Ele imprime uma linha `ok` ou `FALHOU` por caso e sai com código diferente de 0 se algum caso falhar.
- Cada caso cria um repositório novo em `.tmp-travas/` (D10), aponta o `core.hooksPath` dele para o `.githooks/` do projeto e confere o código de saída e a mensagem da trava. No fim, o script apaga a `.tmp-travas/`.
- Os testes do `pre-push` chamam o hook direto, com os argumentos e a entrada padrão escritos pelo teste. Não há rede nem push de verdade.
- Os segredos de teste são montados em tempo de execução, por concatenação (por exemplo, `"AKIA""ABCDEFGHIJKLMNOP"`). Assim, o código-fonte dos testes não casa com a P4 e pode ser commitado.
- Cada regra (P1 a P4, M1 a M6 e U1 a U4) tem um caso que é recusado e um que passa. A M1 tem um caso com `tipo(escopo)!:`.
- A reconferência do `pre-push` tem três casos:
  - um segredo trazido por `git cherry-pick`;
  - um commit com outro autor;
  - um "Revert …" feito com `git revert --no-edit`.
  Os três passam pelo commit e são recusados no `pre-push`.
- A seleção da reconferência tem um caso que passa: uma branch já enviada recebe a main por merge, e a main traz um commit de outro committer (como o merge da página do GitHub). Esse push passa, e só o merge local novo é reconferido. O teste usa um remoto bare dentro da `.tmp-travas/`.
- A U3 tem o caso da `origin/main` atrasada: a branch já entrou na main do remoto, mas o clone não fez `git fetch`. A recusa pede o fetch.
- O `pre-merge-commit` tem um caso: um merge local que traz um `.env` forçado é recusado.
- O roteiro de mutações desfaz uma regra por vez e aponta qual caso cai.

## 8. Limitações conhecidas

- O `--no-verify`, o `-n` e o `git -c core.hooksPath=...` pulam as travas. O CONTRIBUTING proíbe os três, e o auditor confere.
- A própria sessão pode mudar o `.githooks/` ou o `core.hooksPath`. A guarda é o auditor conferir os dois em cada fase.
- As travas só valem depois da ativação, em cada clone.
- O `git cherry-pick`, o `git revert --no-edit` e o `git merge` pulam algumas travas na hora do commit (seção 5). Esses commits só são barrados no `pre-push`, então eles podem existir na máquina, mas não chegam ao GitHub.
- Todo commit feito na página do GitHub passa por fora das travas: o merge e também a edição de um arquivo, inclusive na main. O auditor confere o que entra na main.
- A minúscula do começo da frase não é conferida (M1).
- A busca de chaves (P4) cobre só os formatos da tabela e não lê arquivo binário. Um segredo em outro formato ou num binário passa, e o auditor faz a varredura antes de cada push.
- O `LC_ALL=C.UTF-8` (RG5) não foi medido no macOS.

## 9. Critério de pronto

- Os quatro hooks, o `.githooks/regras.sh` e o `testes-travas/rodar.sh` estão commitados, com o bit de execução nos hooks.
- O `sh testes-travas/rodar.sh` passa todos os casos, e o roteiro de mutações derruba um caso por mutação.
- A trava está ativa na pasta do DEV, e o auditor confere com `git config --get core.hooksPath`.
- O README e o CONTRIBUTING estão atualizados (seção 6).

## 10. O que mudou da versão 1 para a 2, achado por achado

- 50 (comandos que pulam hooks): a seção 5 nova, com o `pre-merge-commit` e a reconferência do `pre-push`, mais a RG6 (as regras num arquivo só), os testes da seção 7 e a limitação da seção 8.
- 51 (revert): a limitação do "Revert …" saiu da seção 8 e ficou na seção 5, com a medição do auditor. O "Revert …" é barrado no `pre-push`, com teste.
- 52 (`.claude/settings.local.json`): entrou na P3, que agora diz "a parte de segredos do `.gitignore`".
- 53 (apagar branch): a U3 só deixa apagar a branch que já entrou na `origin/main`, e a U4 só vale quando o sha local não é só zeros.
- 54 (`!` com escopo): a M1 aceita `tipo(escopo)!:`, com caso de teste.
- 55 (limitações): entraram a mudança do `.githooks/` pela própria sessão, os commits feitos na página do GitHub, o arquivo binário na P4 e o C.UTF-8 no macOS.
- 56 (CONTRIBUTING 85 a 88): a quarta mudança da seção 6, com a D11.

## 11. O que mudou da versão 2 para a 3

- 57 (seleção da reconferência): uma regra só, `git rev-list <sha local> --not <sha remoto> --remotes=origin`, sem o `<sha remoto>` quando ele é só zeros (seção 5), e um caso de teste que passa com a main trazendo um commit de outro committer (seção 7). A M6 no `pre-push` continua reconhecendo o merge por ter mais de um pai, e agora só os merges locais novos chegam a ela.
- Observação da P3: o `.claude/settings.local.json` casa pelo caminho, e os outros itens, pelo nome do arquivo.
- Observação da U3: a recusa pede o `git fetch` também quando o sha remoto não é ancestral da `origin/main`, com um caso de teste.
