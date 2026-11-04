# Plano das travas locais do git (versão 3 do plano)

> **Para quem executa:** use a habilidade superpowers:executing-plans, tarefa por tarefa. Os passos usam caixas de seleção (`- [ ]`).

**Objetivo:** criar as travas da spec `docs/specs/2026-11-04-travas-locais.md` (spec-travas-v3, sha256 f9403935c3dbf85482d31084a9b10edc677fb09515b0eb82a2d7c1ff2b135185, LIBERADA pelo auditor e aprovada pelo Eduardo em 2026-11-04, com as propostas D6 a D10), com o teste antes do código.

**Arquitetura:** as regras ficam num arquivo só, `.githooks/regras.sh` (RG6). Os quatro hooks só carregam esse arquivo e chamam as regras. Os testes são um script em shell puro, `testes-travas/rodar.sh`, que carrega `testes-travas/comum.sh` e os arquivos `testes-travas/casos-*.sh`, em ordem. Cada tarefa tem o commit do teste vermelho (`test:`) e o do código que o deixa verde (`chore:`).

**Stack:** `sh` POSIX (o do Git for Windows aqui), `git`, `grep -E`, `sed`, `awk`, `cut`, `wc`. Sem dependência nova.

## Restrições globais (valem para todas as tarefas)

- Cada hook começa com `#!/bin/sh` e só usa sh POSIX. Não há `local`: as variáveis das funções levam um sufixo próprio (`_p3`, `_m`, `_r`), para uma função não apagar a variável de outra.
- Os hooks ficam com o bit de execução no git: `git update-index --chmod=+x` logo depois do `git add` de cada hook (RG4).
- Os commits seguem a CONTRIBUTING.md, linhas 72 a 79: Conventional Commits em português, sem rodapé de IA, sem arroba solta, `git add` com o caminho de cada arquivo, e nunca pular os hooks. Antes de cada commit: `git branch --show-current` (espera `chore/travas-locais`) e `git status --short`.
- As travas só ficam ativas na pasta do DEV na Tarefa 6. Até lá, quem confere os commits é o auditor. No push, o `pre-push` reconfere todos os commits da branch.
- Os testes criam repositórios só dentro de `.tmp-travas/` (D10). Nesses repositórios de teste, o script usa `git config` local, `git -c user.*`, `--no-verify` e `GIT_COMMITTER_*` de propósito: é assim que ele simula o que as travas têm de barrar. Nada disso roda no repositório do projeto.
- Os segredos de teste são montados por concatenação, e o código-fonte não casa com a P4.
- A cada tarefa, o DEV manda ao auditor os hashes do `test:` e do `chore:`, a saída do `sh testes-travas/rodar.sh` no vermelho e no verde, e o roteiro de mutações da tarefa.

## Mapa de arquivos

| Arquivo | Responsabilidade |
|---|---|
| `.githooks/regras.sh` | As regras P1 a P4, M1 a M6, U1 a U4 e a reconferência (spec, seções 4 e 5). |
| `.githooks/pre-commit` | P1 a P4 sobre o stage. |
| `.githooks/commit-msg` | M1 a M6 sobre a mensagem. |
| `.githooks/pre-merge-commit` | Chama o `pre-commit` no merge local. |
| `.githooks/pre-push` | U1 a U4 e a reconferência dos commits novos. |
| `testes-travas/rodar.sh` | Prepara a `.tmp-travas/`, carrega os casos e dá o placar. |
| `testes-travas/comum.sh` | As funções dos testes (`espera`, `novo_repo`, `arquivo`, `empurrar`, `mostra`, `nao_mostra`). |
| `testes-travas/casos-1-pre-commit.sh` a `casos-5-reconferencia.sh` | Os casos de cada hook. |
| `.gitignore`, `README.md`, `CONTRIBUTING.md` | A pasta temporária e a documentação (spec, seção 6). |

---

### Tarefa 0: branch e documentos

- [ ] **Passo 1: criar a branch a partir da main atualizada**

```bash
git fetch origin
git switch -c chore/travas-locais origin/main
git log --oneline -1
```
Esperado: o topo é o `85a0ca9` (o merge do PR 1) ou um merge mais novo da main.

- [ ] **Passo 2: copiar e commitar a spec**

```bash
mkdir -p docs/specs docs/planos
cp "C:/Users/EDUARD~1/AppData/Local/Temp/claude/9bb78e7f8b1714b4/fc600f43-1af8-4aa6-adae-7be1427cd432/scratchpad/spec-travas-v3.md" docs/specs/2026-11-04-travas-locais.md
sha256sum docs/specs/2026-11-04-travas-locais.md
git add docs/specs/2026-11-04-travas-locais.md
git commit -m "docs: spec das travas locais" -m "Cópia fiel da spec-travas-v3, LIBERADA pelo auditor e aprovada pelo Eduardo em 2026-11-04, com as propostas D6 a D10."
```
Esperado: o sha256 é `f9403935c3dbf85482d31084a9b10edc677fb09515b0eb82a2d7c1ff2b135185`.

- [ ] **Passo 3: copiar e commitar o plano, na versão LIBERADA**

A versão liberada é o arquivo `plano-travas-vN.md` do scratchpad do DEV com o maior N que o auditor deu como LIBERADO. O auditor cita o sha256 dela no parecer.

```bash
cp "C:/Users/EDUARD~1/AppData/Local/Temp/claude/9bb78e7f8b1714b4/fc600f43-1af8-4aa6-adae-7be1427cd432/scratchpad/plano-travas-vN.md" docs/planos/2026-11-04-travas-locais.md
sha256sum docs/planos/2026-11-04-travas-locais.md
git add docs/planos/2026-11-04-travas-locais.md
git commit -m "docs: plano das travas locais" -m "Cópia fiel da versão liberada pelo auditor."
```

---

### Tarefa 1: a base dos testes e o `pre-commit` (P1 a P4)

**Arquivos:**
- Modificar: `.gitignore`
- Criar: `testes-travas/rodar.sh`, `testes-travas/comum.sh`, `testes-travas/casos-1-pre-commit.sh`
- Criar: `.githooks/regras.sh`, `.githooks/pre-commit`

**Interfaces:**
- Produz, em `.githooks/regras.sh`:
  - `AUTOR_ESPERADO`
  - `recusar <trava> <motivo> <conserto>`: imprime a recusa no stderr
  - `eh_zeros <sha>`
  - `sem_data <identidade do git var>`
  - `regra_p1`
  - `regra_p2 <autor> <committer> <onde>`
  - `regra_p2_no_commit`
  - `eh_caminho_de_segredo <caminho>`
  - `regra_p3 <onde>`, que lê os caminhos na entrada padrão
  - `REGRAS_DE_CHAVE`
  - `regra_p4 <onde>`, que lê o diff unificado na entrada padrão
- Produz, em `testes-travas/comum.sh`: `espera`, `mostra`, `nao_mostra`, `novo_repo`, `arquivo` e `empurrar`, e as variáveis `AUTOR_NOME`, `AUTOR_EMAIL`, `URL_CERTA`, `ZEROS`, `CHAVE_AWS`, `CHAVE_SK`, `CABECALHO_PRIVADO`, `ULTIMA_SAIDA`, `total` e `falhas`.

- [ ] **Passo 1: ignorar a pasta temporária dos testes**

No `.gitignore`, antes da linha `# A parte da stack (dependências, build, cobertura) entra quando ela for escolhida.`, que continua sendo a última, acrescentar:

```gitignore
# Repositórios temporários dos testes das travas.
.tmp-travas/

```

```bash
git add .gitignore
git commit -m "chore: ignora a pasta temporária dos testes das travas" -m "Os testes das travas criam repositórios em .tmp-travas/, dentro da pasta do projeto (spec das travas, D10)."
```

- [ ] **Passo 2: escrever o `testes-travas/rodar.sh`**

```sh
#!/bin/sh
# Testes das travas locais (spec das travas, seção 7).
# Rode da raiz do repositório: sh testes-travas/rodar.sh
RAIZ=$(cd "$(dirname "$0")/.." && git rev-parse --show-toplevel) || exit 2
GANCHOS="$RAIZ/.githooks"
TMP="$RAIZ/.tmp-travas"
PASTA_TESTES="$RAIZ/testes-travas"

. "$PASTA_TESTES/comum.sh"

rm -rf "$TMP"
mkdir -p "$TMP"

for casos in "$PASTA_TESTES"/casos-*.sh; do
  [ -f "$casos" ] || continue
  . "$casos"
done

rm -rf "$TMP"
printf '\n%s casos, %s falhas\n' "$total" "$falhas"
[ "$falhas" -eq 0 ]
```

- [ ] **Passo 3: escrever o `testes-travas/comum.sh`**

```sh
# Funções comuns dos testes das travas (spec das travas, seção 7). Carregado pelo rodar.sh.

AUTOR_NOME='Eduardo Kobal'
AUTOR_EMAIL='162614913+Eduardokobal@users.noreply.github.com'
URL_CERTA='https://github.com/Eduardokobal/coworkIA.git'
ZEROS='0000000000000000000000000000000000000000'

# Segredos de teste, montados por concatenação para o código-fonte não casar com a P4.
CHAVE_AWS="AKIA""ABCDEFGHIJKLMNOP"
CHAVE_SK="sk-""abcdefghijklmnopqrstuvwx"
CABECALHO_PRIVADO="-----BEGIN ""RSA PRIVATE KEY-----"

total=0
falhas=0
ULTIMA_SAIDA=''

ok() {
  total=$((total + 1))
  printf 'ok %s - %s\n' "$total" "$1"
}

nao_ok() {
  total=$((total + 1))
  falhas=$((falhas + 1))
  printf 'FALHOU %s - %s\n' "$total" "$1"
}

# espera <descrição> <0|1> <trava ou -> <comando…>
# Com 0, o comando tem de passar. Com 1, tem de falhar e citar "[trava X]" na saída.
espera() {
  descricao_e=$1
  esperado_e=$2
  trava_e=$3
  shift 3
  saida_e=$("$@" 2>&1)
  codigo_e=$?
  ULTIMA_SAIDA=$saida_e
  if [ "$esperado_e" = 0 ] && [ "$codigo_e" -eq 0 ]; then
    ok "$descricao_e"
  elif [ "$esperado_e" = 1 ] && [ "$codigo_e" -ne 0 ] &&
    printf '%s' "$saida_e" | grep -qF "[trava $trava_e]"; then
    ok "$descricao_e"
  else
    nao_ok "$descricao_e (código $codigo_e: $(printf '%s' "$saida_e" | head -n 3 | tr '\n' ' '))"
  fi
}

# mostra <descrição> <texto>: a última saída tem o texto.
mostra() {
  if printf '%s' "$ULTIMA_SAIDA" | grep -qF -e "$2"; then
    ok "$1"
  else
    nao_ok "$1"
  fi
}

# nao_mostra <descrição> <texto>: a última saída não tem o texto (RG3).
nao_mostra() {
  if printf '%s' "$ULTIMA_SAIDA" | grep -qF -e "$2"; then
    nao_ok "$1"
  else
    ok "$1"
  fi
}

# novo_repo <nome>: cria o repositório em $TMP, faz um commit na main antes de ligar as travas,
# liga as travas e muda para a branch feat/teste. Imprime o caminho.
novo_repo() {
  dir_n="$TMP/$1"
  git init -q -b main "$dir_n"
  git -C "$dir_n" config user.name "$AUTOR_NOME"
  git -C "$dir_n" config user.email "$AUTOR_EMAIL"
  # Sem a conversão de fim de linha do git global deste PC, que só poluiria a saída dos testes.
  git -C "$dir_n" config core.autocrlf false
  printf 'base\n' >"$dir_n/LEIA.md"
  git -C "$dir_n" add LEIA.md
  git -C "$dir_n" commit -q -m 'chore: base do teste'
  git -C "$dir_n" config core.hooksPath "$GANCHOS"
  git -C "$dir_n" switch -q -c feat/teste
  printf '%s\n' "$dir_n"
}

# arquivo <repo> <caminho> <conteúdo>: cria o arquivo e o põe no stage, à força.
arquivo() {
  mkdir -p "$(dirname "$1/$2")"
  printf '%s\n' "$3" >"$1/$2"
  git -C "$1" add -f -- "$2"
}

# empurrar <repo> <url> <linha da entrada padrão>: chama o pre-push direto, sem rede.
empurrar() {
  printf '%s\n' "$3" | (cd "$1" && sh "$GANCHOS/pre-push" origin "$2")
}
```

- [ ] **Passo 4: escrever o `testes-travas/casos-1-pre-commit.sh`**

```sh
# Casos do pre-commit: P1 a P4 (spec das travas, seção 4.1).

r=$(novo_repo p1)
git -C "$r" switch -q main
arquivo "$r" a.txt 'a'
espera 'P1 recusa commit na main' 1 P1 git -C "$r" commit -q -m 'feat: algo'
git -C "$r" switch -q feat/teste
espera 'P1 aceita commit fora da main' 0 - git -C "$r" commit -q -m 'feat: algo'
git -C "$r" switch -q --detach
espera 'P1 aceita commit com HEAD solto' 0 - git -C "$r" commit -q --allow-empty -m 'feat: solto'

r=$(novo_repo p2)
espera 'P2 recusa outro autor' 1 P2 \
  git -C "$r" -c user.name=Outra -c user.email=outra@example.com commit -q --allow-empty -m 'feat: algo'
espera 'P2 recusa outro committer' 1 P2 \
  env GIT_COMMITTER_EMAIL=outra@example.com git -C "$r" commit -q --allow-empty -m 'feat: algo'
espera 'P2 aceita o autor certo' 0 - git -C "$r" commit -q --allow-empty -m 'feat: algo'

r=$(novo_repo p3)
arquivo "$r" .env 'SEGREDO=1'
espera 'P3 recusa .env forçado' 1 P3 git -C "$r" commit -q -m 'feat: algo'
git -C "$r" rm -q --cached .env
arquivo "$r" config/credentials-gmail.json '{}'
espera 'P3 recusa credentials*.json em subpasta' 1 P3 git -C "$r" commit -q -m 'feat: algo'
git -C "$r" rm -q --cached config/credentials-gmail.json
arquivo "$r" .claude/settings.local.json '{}'
espera 'P3 recusa o caminho .claude/settings.local.json' 1 P3 git -C "$r" commit -q -m 'feat: algo'
git -C "$r" rm -q --cached .claude/settings.local.json
arquivo "$r" .env.example 'SEGREDO='
arquivo "$r" docs/settings.local.json '{}'
espera 'P3 aceita .env.example e settings.local.json fora da .claude' 0 - \
  git -C "$r" commit -q -m 'feat: algo'
arquivo "$r" nome.txt 'SEGREDO=1'
git -C "$r" commit -q -m 'feat: nome'
# O .env do caso anterior saiu só do stage e continua na pasta; sem ele, o git mv tem destino livre.
rm -f "$r/.env"
git -C "$r" mv nome.txt .env
espera 'P3 recusa renomear para .env' 1 P3 git -C "$r" commit -q -m 'feat: algo'

r=$(novo_repo p4)
arquivo "$r" config.txt "chave=$CHAVE_AWS"
espera 'P4 recusa chave da AWS' 1 P4 git -C "$r" commit -q -m 'feat: algo'
nao_mostra 'P4 não mostra o valor da chave' "$CHAVE_AWS"
git -C "$r" rm -q --cached config.txt
arquivo "$r" chave.txt "$CABECALHO_PRIVADO"
espera 'P4 recusa chave privada' 1 P4 git -C "$r" commit -q -m 'feat: algo'
git -C "$r" rm -q --cached chave.txt
arquivo "$r" openai.txt "OPENAI=$CHAVE_SK"
espera 'P4 recusa chave sk- com fronteira' 1 P4 git -C "$r" commit -q -m 'feat: algo'
git -C "$r" rm -q --cached openai.txt
arquivo "$r" tarefa.txt 'task-abcdefghijklmnopqrstuvwx'
espera 'P4 aceita "task-…", que não é chave' 0 - git -C "$r" commit -q -m 'feat: algo'
```

- [ ] **Passo 5: rodar, ver falhar e commitar o vermelho**

```bash
sh testes-travas/rodar.sh
```
Esperado: FALHA. Sem o `.githooks/`, o git não roda trava nenhuma, então todo caso "recusa" falha, e todo caso "aceita" passa.

```bash
git add testes-travas/rodar.sh testes-travas/comum.sh testes-travas/casos-1-pre-commit.sh
git commit -m "test: base dos testes das travas e casos do pre-commit" -m "Teste vermelho das regras P1 a P4 da spec das travas (seção 4.1): commit na main, HEAD solto, outro autor e outro committer, os nomes de segredo e as chaves, sem mostrar o valor."
```

- [ ] **Passo 6: escrever o `.githooks/regras.sh`**

```sh
# Regras das travas locais do git (spec das travas, seções 4 e 5).
# Os hooks carregam este arquivo com ".". Não há "local" no sh POSIX:
# por isso, as variáveis de cada função levam um sufixo próprio.

AUTOR_ESPERADO='Eduardo Kobal <162614913+Eduardokobal@users.noreply.github.com>'

# RG2: a recusa vai para o stderr, com a trava, o motivo e o conserto.
recusar() {
  printf '[trava %s] %s\n  Conserto: %s\n' "$1" "$2" "$3" >&2
}

# Verdadeiro quando o sha é só zeros (a ref não existe).
eh_zeros() {
  case "$1" in
    *[!0]*) return 1 ;;
    *) return 0 ;;
  esac
}

# Tira a data do fim de "Nome <email> 1700000000 -0300".
sem_data() {
  printf '%s\n' "$1" | sed 's/ [0-9][0-9]* [-+][0-9][0-9]*$//'
}

# P1: a branch atual não pode ser a main. Um HEAD solto passa.
regra_p1() {
  ramo_p1=$(git symbolic-ref --short -q HEAD) || return 0
  if [ "$ramo_p1" = main ]; then
    recusar P1 'commit direto na main.' 'crie uma branch por assunto: git switch -c tipo/assunto-curto'
    return 1
  fi
  return 0
}

# P2: $1 = autor e $2 = committer, como "Nome <email>"; $3 = onde.
regra_p2() {
  if [ "$1" = "$AUTOR_ESPERADO" ] && [ "$2" = "$AUTOR_ESPERADO" ]; then
    return 0
  fi
  recusar P2 "autor ou committer diferente de $AUTOR_ESPERADO${3:+ ($3)}." \
    'use o autor do git global e nunca mude o autor (CONTRIBUTING, seção 4).'
  return 1
}

# P2 sobre o commit que está sendo feito.
regra_p2_no_commit() {
  regra_p2 "$(sem_data "$(git var GIT_AUTHOR_IDENT)")" "$(sem_data "$(git var GIT_COMMITTER_IDENT)")" ''
}

# P3, um caminho: verdadeiro quando ele casa com a parte de segredos do .gitignore.
eh_caminho_de_segredo() {
  if [ "$1" = .claude/settings.local.json ]; then
    return 0
  fi
  nome_p3=${1##*/}
  case "$nome_p3" in
    .env.example) return 1 ;;
    .env* | *.pem | *.key | *.p12 | *.pfx | id_rsa* | id_ed25519* | credentials*.json | *service-account*.json)
      return 0
      ;;
  esac
  return 1
}

# P3: um caminho por linha na entrada padrão; $1 = onde.
regra_p3() {
  falhou_p3=0
  while IFS= read -r caminho_p3; do
    [ -n "$caminho_p3" ] || continue
    if eh_caminho_de_segredo "$caminho_p3"; then
      recusar P3 "arquivo de segredo: $caminho_p3${1:+ ($1)}." \
        'tire o arquivo do commit (git restore --staged <arquivo>) e nunca use git add -f nele.'
      falhou_p3=1
    fi
  done
  return "$falhou_p3"
}

# P4: "nome|expressão", uma regra por linha (a tabela da spec das travas, seção 4.1).
REGRAS_DE_CHAVE='chave privada|-----BEGIN [A-Z ]*PRIVATE KEY-----
token do GitHub|gh[pousr]_[A-Za-z0-9]{36}
token fino do GitHub|github_pat_[A-Za-z0-9_]{22,}
chave da AWS|AKIA[0-9A-Z]{16}
chave de API do Google|AIza[0-9A-Za-z_-]{35}
client secret do Google|GOCSPX-[A-Za-z0-9_-]{20,}
token de acesso do Google|ya29\.[0-9A-Za-z_-]{20,}
refresh token do Google|1//0[0-9A-Za-z_-]{20,}
chave da OpenAI ou da Anthropic|(^|[^A-Za-z0-9])sk-[A-Za-z0-9_-]{20,}'

# P4: o diff unificado na entrada padrão; $1 = onde. Imprime o arquivo e a regra, nunca o valor (RG3).
regra_p4() {
  acrescentadas_p4=$(awk '
    /^diff --git / { cabecalho = 1; next }
    /^@@/ { cabecalho = 0; next }
    cabecalho && /^\+\+\+ / { arquivo = substr($0, 5); sub(/^b\//, "", arquivo); next }
    !cabecalho && /^\+/ { print arquivo "\t" substr($0, 2) }
  ')
  [ -n "$acrescentadas_p4" ] || return 0
  conteudos_p4=$(printf '%s\n' "$acrescentadas_p4" | cut -f2-)
  arquivos_p4=$(printf '%s\n' "$acrescentadas_p4" | cut -f1)
  falhou_p4=0
  while IFS= read -r linha_p4; do
    nome_p4=${linha_p4%%|*}
    expressao_p4=${linha_p4#*|}
    for numero_p4 in $(printf '%s\n' "$conteudos_p4" | grep -nE -e "$expressao_p4" | cut -d: -f1); do
      arquivo_p4=$(printf '%s\n' "$arquivos_p4" | sed -n "${numero_p4}p")
      recusar P4 "possível $nome_p4 em $arquivo_p4${1:+ ($1)}." \
        'tire o segredo do arquivo e guarde no .env, que fica fora do git.'
      falhou_p4=1
    done
  done <<EOF
$REGRAS_DE_CHAVE
EOF
  return "$falhou_p4"
}
```

- [ ] **Passo 7: escrever o `.githooks/pre-commit`**

```sh
#!/bin/sh
# Trava local: P1 a P4 sobre o stage (spec das travas, seções 4.1 e 5).
. "$(dirname "$0")/regras.sh"

recusou=0
regra_p1 || recusou=1
regra_p2_no_commit || recusou=1
git -c core.quotepath=off diff --cached --name-only --diff-filter=ACMR | regra_p3 '' || recusou=1
git -c core.quotepath=off diff --cached -U0 --no-color --no-ext-diff --diff-filter=ACMR |
  regra_p4 '' || recusou=1
exit "$recusou"
```

- [ ] **Passo 8: rodar, ver passar e commitar o verde**

```bash
sh testes-travas/rodar.sh
```
Esperado: todos os casos com `ok`, e a última linha diz `0 falhas`.

```bash
git add .githooks/regras.sh .githooks/pre-commit
git update-index --chmod=+x .githooks/pre-commit
git commit -m "chore: trava de pre-commit" -m "Regras P1 a P4 da spec das travas: commit na main, autor e committer, nomes de segredo (inclusive com git add -f) e chaves conhecidas, sem mostrar o valor."
```

**Mutações (cada uma derruba pelo menos um caso):**
- Em `regra_p1`, trocar `main` por `master`: cai "P1 recusa commit na main".
- Em `regra_p2`, tirar `&& [ "$2" = "$AUTOR_ESPERADO" ]`: cai "P2 recusa outro committer".
- Em `eh_caminho_de_segredo`, tirar a linha `.env.example) return 1 ;;`: cai "P3 aceita .env.example …".
- Em `eh_caminho_de_segredo`, trocar o teste do caminho por `[ "$nome_p3" = settings.local.json ]`: cai "P3 aceita … settings.local.json fora da .claude".
- No `pre-commit`, trocar o `--diff-filter=ACMR` da P3 por `--diff-filter=AM`: cai "P3 recusa renomear para .env".
- Em `REGRAS_DE_CHAVE`, tirar o `(^|[^A-Za-z0-9])` do `sk-`: cai "P4 aceita "task-…", que não é chave".
- Em `regra_p4`, trocar a mensagem para incluir `$conteudos_p4`: cai "P4 não mostra o valor da chave".

---

### Tarefa 2: o `commit-msg` (M1 a M5)

**Arquivos:**
- Criar: `testes-travas/casos-2-commit-msg.sh`
- Modificar: `.githooks/regras.sh` (acrescentar no fim)
- Criar: `.githooks/commit-msg`

**Interfaces:**
- Consome: `recusar` (Tarefa 1).
- Produz: `TIPOS` e `regras_de_mensagem <texto> <1 se merge local> <onde>`.

- [ ] **Passo 1: escrever o `testes-travas/casos-2-commit-msg.sh`**

```sh
# Casos do commit-msg: M1 a M5 (spec das travas, seção 4.2). A M6 está em casos-3.

r=$(novo_repo msg)
commitar() {
  git -C "$r" commit -q --allow-empty "$@"
}
espera 'M1 recusa título sem tipo' 1 M1 commitar -m 'atualiza coisas'
espera 'M1 recusa tipo fora da lista' 1 M1 commitar -m 'feature: algo'
espera 'M1 recusa tipo em maiúscula' 1 M1 commitar -m 'Feat: algo'
espera 'M1 recusa escopo com maiúscula' 1 M1 commitar -m 'feat(Reservas): algo'
espera 'M1 recusa título com ponto final' 1 M1 commitar -m 'feat: algo.'
espera 'M1 aceita nome de arquivo no começo' 0 - commitar -m 'docs: README inicial'
espera 'M1 aceita escopo com !' 0 - commitar -m 'feat(reservas)!: muda o formato'
espera 'M1 aceita frase de uma letra' 0 - commitar -m 'fix: a'
titulo72="feat: $(printf 'á%.0s' $(seq 66))"
titulo73="feat: $(printf 'á%.0s' $(seq 67))"
espera 'M2 aceita 72 caracteres com acento' 0 - commitar -m "$titulo72"
espera 'M2 recusa 73 caracteres' 1 M2 commitar -m "$titulo73"
espera 'M3 recusa corpo sem linha em branco' 1 M3 commitar -m "$(printf 'feat: algo\ncorpo colado')"
espera 'M3 aceita corpo depois da linha em branco' 0 - commitar -m 'feat: algo' -m 'O porquê.'
espera 'M4 recusa coautor' 1 M4 commitar -m 'feat: algo' -m 'Co-Authored-By: Fulana <fulana@example.com>'
espera 'M4 recusa rodapé de IA' 1 M4 commitar -m 'feat: algo' -m 'Generated with uma ferramenta'
espera 'M4 recusa o emoji de robô' 1 M4 commitar -m 'feat: algo' -m '🤖'
espera 'M5 recusa arroba solta' 1 M5 commitar -m 'feat: algo' -m 'Avise (@fulana) depois.'
espera 'M5 aceita arroba entre crases e e-mail' 0 - \
  commitar -m 'build: tipos do node' -m 'Entra o `@types/node`; dúvidas com ana@example.com.'
espera 'M6 não vale fora de um merge' 1 M1 commitar -m "Merge branch 'outra'"
```

- [ ] **Passo 2: rodar, ver falhar e commitar o vermelho**

```bash
sh testes-travas/rodar.sh
```
Esperado: FALHA nos casos "recusa" da M1 a M5 e no "M6 não vale fora de um merge". Os casos da Tarefa 1 continuam `ok`.

```bash
git add testes-travas/casos-2-commit-msg.sh
git commit -m "test: casos da trava de mensagem" -m "Teste vermelho das regras M1 a M5 da spec das travas (seção 4.2), com as bordas: frase de uma letra, escopo com !, 72 e 73 caracteres com acento, arroba entre crases e e-mail."
```

- [ ] **Passo 3: acrescentar as regras de mensagem no fim do `.githooks/regras.sh`**

```sh

# M1: os tipos do CONTRIBUTING, seção 4.
TIPOS='feat|fix|docs|test|refactor|perf|style|build|ci|chore'

# M1 a M6: $1 = texto da mensagem; $2 = 1 quando é merge local; $3 = onde.
regras_de_mensagem() {
  texto_m=$(printf '%s\n' "$1" | grep -v '^#')
  titulo_m=$(printf '%s\n' "$texto_m" | sed -n '1p')
  falhou_m=0
  if [ "$2" = 1 ] && [ "${titulo_m#Merge }" != "$titulo_m" ]; then
    : # M6: o "Merge …" de um merge local não passa pela M1 nem pela M2.
  else
    if ! printf '%s\n' "$titulo_m" | LC_ALL=C grep -qE "^($TIPOS)(\\([a-z0-9-]+\\))?!?: [^ ]"; then
      recusar M1 "título fora do formato tipo(escopo): frase${3:+ ($3)}." \
        'use um dos tipos do CONTRIBUTING, seção 4, por exemplo: feat: cadastro de salas'
      falhou_m=1
    elif [ "${titulo_m%.}" != "$titulo_m" ]; then
      recusar M1 "o título termina com ponto${3:+ ($3)}." 'tire o ponto final do título.'
      falhou_m=1
    fi
    tamanho_m=$(printf '%s' "$titulo_m" | LC_ALL=C.UTF-8 wc -m | tr -d ' ')
    if [ "$tamanho_m" -gt 72 ]; then
      recusar M2 "o título tem $tamanho_m caracteres, e o limite é 72${3:+ ($3)}." \
        'encurte o título e leve o detalhe para o corpo.'
      falhou_m=1
    fi
  fi
  if [ "$(printf '%s\n' "$texto_m" | wc -l | tr -d ' ')" -gt 1 ] &&
    [ -n "$(printf '%s\n' "$texto_m" | sed -n '2p')" ]; then
    recusar M3 "falta a linha em branco depois do título${3:+ ($3)}." 'separe o título do corpo com uma linha vazia.'
    falhou_m=1
  fi
  if printf '%s\n' "$texto_m" | grep -qiE '^co-authored-by:'; then
    recusar M4 "a mensagem tem Co-Authored-By${3:+ ($3)}." 'tire a linha: o único autor é o Eduardo.'
    falhou_m=1
  fi
  if printf '%s\n' "$texto_m" | grep -qiF 'generated with' || printf '%s\n' "$texto_m" | grep -qF '🤖'; then
    recusar M4 "a mensagem tem rodapé de IA${3:+ ($3)}." 'tire o rodapé.'
    falhou_m=1
  fi
  if printf '%s\n' "$texto_m" | sed 's/`[^`]*`//g' | LC_ALL=C grep -qE '(^|[[:space:][:punct:]])@[A-Za-z0-9]'; then
    recusar M5 "arroba solta fora de crase${3:+ ($3)}." 'ponha o nome entre crases ou tire a arroba.'
    falhou_m=1
  fi
  return "$falhou_m"
}
```

- [ ] **Passo 4: escrever o `.githooks/commit-msg`**

```sh
#!/bin/sh
# Trava local: M1 a M6 sobre a mensagem (spec das travas, seção 4.2).
. "$(dirname "$0")/regras.sh"

merge_local=0
if git rev-parse -q --verify MERGE_HEAD >/dev/null; then
  merge_local=1
fi
regras_de_mensagem "$(cat "$1")" "$merge_local" ''
```

- [ ] **Passo 5: rodar, ver passar e commitar o verde**

```bash
sh testes-travas/rodar.sh
git add .githooks/regras.sh .githooks/commit-msg
git update-index --chmod=+x .githooks/commit-msg
git commit -m "chore: trava de mensagem de commit" -m "Regras M1 a M6 da spec das travas: formato do Conventional Commits, 72 caracteres, linha em branco, nenhum coautor ou rodapé de IA, nenhuma arroba solta, e o Merge só num merge local."
```
Esperado: `0 falhas`.

**Mutações:**
- Em `TIPOS`, acrescentar `|feature`: cai "M1 recusa tipo fora da lista".
- Tirar o `!?` da expressão da M1: cai "M1 aceita escopo com !".
- Tirar o bloco do ponto final (`elif …`): cai "M1 recusa título com ponto final".
- Trocar `LC_ALL=C.UTF-8 wc -m` por `wc -c`: cai "M2 aceita 72 caracteres com acento".
- Tirar o `sed 's/`[^`]*`//g'` da M5: cai "M5 aceita arroba entre crases e e-mail".
- Trocar a condição da M6 por `[ "${titulo_m#Merge }" != "$titulo_m" ]` (sem o `$2`): cai "M6 não vale fora de um merge".

---

### Tarefa 3: o merge local (`pre-merge-commit` e M6)

**Arquivos:**
- Criar: `testes-travas/casos-3-merge.sh`
- Criar: `.githooks/pre-merge-commit`

**Interfaces:**
- Consome: o `.githooks/pre-commit` (Tarefa 1) e a `regras_de_mensagem` (Tarefa 2).

- [ ] **Passo 1: escrever o `testes-travas/casos-3-merge.sh`**

```sh
# Casos do merge local: o pre-merge-commit (P1 a P4) e a M6 (spec das travas, seções 4.2 e 5).

r=$(novo_repo merge)
git -C "$r" switch -q -c outra main
arquivo "$r" outra.txt 'outra'
git -C "$r" commit -q -m 'feat: outra'
git -C "$r" switch -q feat/teste
espera 'M6 aceita o "Merge …" num merge local' 0 - \
  git -C "$r" merge -q --no-ff outra -m "Merge branch 'outra' into feat/teste"

git -C "$r" switch -q -c segredo main
arquivo "$r" .env 'SEGREDO=1'
# Simula um commit que escapou das travas, para provar a trava do merge.
git -C "$r" commit -q --no-verify -m 'feat: segredo'
git -C "$r" switch -q feat/teste
espera 'pre-merge-commit recusa merge que traz .env' 1 P3 \
  git -C "$r" merge -q --no-ff segredo -m "Merge branch 'segredo' into feat/teste"
git -C "$r" merge --abort 2>/dev/null

git -C "$r" switch -q -c outra2 main
arquivo "$r" outra2.txt 'outra2'
git -C "$r" commit -q -m 'feat: outra2'
git -C "$r" switch -q feat/teste
espera 'M6 mantém a M4 no merge local' 1 M4 \
  git -C "$r" merge -q --no-ff outra2 -m "Merge branch 'outra2' into feat/teste" \
  -m 'Co-Authored-By: Fulana <fulana@example.com>'
git -C "$r" merge --abort 2>/dev/null
```

- [ ] **Passo 2: rodar, ver falhar e commitar o vermelho**

```bash
sh testes-travas/rodar.sh
```
Esperado: FALHA em "pre-merge-commit recusa merge que traz .env", porque o merge não chama o `pre-commit` (medido pelo auditor). Os dois casos da M6 já passam, porque o `commit-msg` da Tarefa 2 roda no merge.

```bash
git add testes-travas/casos-3-merge.sh
git commit -m "test: casos do merge local" -m "Teste vermelho do pre-merge-commit (spec das travas, seção 5): um merge que traz um .env forçado. Também ficam os casos da M6, que já passam com o commit-msg."
```

- [ ] **Passo 3: escrever o `.githooks/pre-merge-commit`**

```sh
#!/bin/sh
# Trava local: o merge local passa pelas mesmas regras do pre-commit (spec das travas, seção 5).
exec sh "$(dirname "$0")/pre-commit"
```

- [ ] **Passo 4: rodar, ver passar e commitar o verde**

```bash
sh testes-travas/rodar.sh
git add .githooks/pre-merge-commit
git update-index --chmod=+x .githooks/pre-merge-commit
git commit -m "chore: trava do merge local" -m "O git merge não chama o pre-commit, como o auditor mediu. O pre-merge-commit chama as mesmas regras P1 a P4."
```
Esperado: `0 falhas`.

**Mutações:**
- Trocar o conteúdo do `pre-merge-commit` por `exit 0`: cai "pre-merge-commit recusa merge que traz .env".
- No `commit-msg`, fixar `merge_local=0`: cai "M6 aceita o "Merge …" num merge local".

---

### Tarefa 4: o `pre-push` (U1 a U4)

**Arquivos:**
- Criar: `testes-travas/casos-4-pre-push.sh`
- Modificar: `.githooks/regras.sh` (acrescentar no fim)
- Criar: `.githooks/pre-push`

**Interfaces:**
- Consome: `recusar` e `eh_zeros` (Tarefa 1).
- Produz: `url_sem_credencial <url>`, `regra_u1 <url>`, `regra_u2 <ref remota>`, `regra_u3 <ref remota> <sha remoto>` e `regra_u4 <ref remota> <sha remoto> <sha local>`.

- [ ] **Passo 1: escrever o `testes-travas/casos-4-pre-push.sh`**

```sh
# Casos do pre-push: U1 a U4 (spec das travas, seção 4.3). O hook é chamado direto, sem rede.

r=$(novo_repo push)
base=$(git -C "$r" rev-parse main)
git -C "$r" update-ref refs/remotes/origin/main "$base"
git -C "$r" commit -q --allow-empty -m 'feat: um'
um=$(git -C "$r" rev-parse HEAD)
nova="refs/heads/feat/teste $um refs/heads/feat/teste $ZEROS"

espera 'U1 recusa a organização' 1 U1 empurrar "$r" 'https://github.com/Grupo-Vannuchi/coworkIA.git' "$nova"
espera 'U1 recusa URL com credencial' 1 U1 \
  empurrar "$r" 'https://eduardo:SENHA123@github.com/Eduardokobal/coworkIA.git' "$nova"
nao_mostra 'U1 não mostra a credencial da URL' 'SENHA123'
espera 'U1 aceita o HTTPS certo' 0 - empurrar "$r" "$URL_CERTA" "$nova"
espera 'U1 aceita o HTTPS sem .git' 0 - empurrar "$r" 'https://github.com/Eduardokobal/coworkIA' "$nova"
espera 'U1 aceita o SSH certo' 0 - empurrar "$r" 'git@github.com:Eduardokobal/coworkIA.git' "$nova"

espera 'U2 recusa push para a main' 1 U2 empurrar "$r" "$URL_CERTA" "refs/heads/feat/teste $um refs/heads/main $base"
espera 'U2 recusa apagar a main' 1 U2 empurrar "$r" "$URL_CERTA" "(delete) $ZEROS refs/heads/main $base"

espera 'U3 aceita apagar branch que já está na origin/main' 0 - \
  empurrar "$r" "$URL_CERTA" "(delete) $ZEROS refs/heads/velha $base"
espera 'U3 recusa apagar branch fora da origin/main' 1 U3 \
  empurrar "$r" "$URL_CERTA" "(delete) $ZEROS refs/heads/feat/teste $um"
mostra 'U3 pede o git fetch' 'git fetch'
espera 'U3 recusa sha remoto ausente' 1 U3 \
  empurrar "$r" "$URL_CERTA" "(delete) $ZEROS refs/heads/feat/teste $(printf 'ab%.0s' $(seq 20))"

git -C "$r" commit -q --allow-empty -m 'feat: dois'
dois=$(git -C "$r" rev-parse HEAD)
espera 'U4 aceita avanço normal' 0 - empurrar "$r" "$URL_CERTA" "refs/heads/feat/teste $dois refs/heads/feat/teste $um"
git -C "$r" switch -q -c lateral main
git -C "$r" commit -q --allow-empty -m 'feat: lateral'
lateral=$(git -C "$r" rev-parse HEAD)
git -C "$r" switch -q feat/teste
espera 'U4 recusa push forçado' 1 U4 \
  empurrar "$r" "$URL_CERTA" "refs/heads/feat/teste $dois refs/heads/feat/teste $lateral"
espera 'U4 recusa sha remoto ausente' 1 U4 \
  empurrar "$r" "$URL_CERTA" "refs/heads/feat/teste $dois refs/heads/feat/teste $(printf 'cd%.0s' $(seq 20))"
```

- [ ] **Passo 2: rodar, ver falhar e commitar o vermelho**

```bash
sh testes-travas/rodar.sh
```
Esperado: FALHA nos casos da U1 a U4, porque o `sh .githooks/pre-push` não existe e sai com erro, sem a "[trava …]".

```bash
git add testes-travas/casos-4-pre-push.sh
git commit -m "test: casos da trava de push" -m "Teste vermelho das regras U1 a U4 da spec das travas (seção 4.3): remoto errado e com credencial, push e apagamento da main, apagar branch dentro e fora da origin/main, push forçado e sha remoto ausente."
```

- [ ] **Passo 3: acrescentar as regras de push no fim do `.githooks/regras.sh`**

```sh

# RG3: a URL sai sem usuário e senha.
url_sem_credencial() {
  printf '%s\n' "$1" | sed 's#://[^/@]*@#://***@#'
}

# U1: o remoto é o github.com/Eduardokobal/coworkIA, por HTTPS ou SSH.
regra_u1() {
  case "$1" in
    https://github.com/Eduardokobal/coworkIA | https://github.com/Eduardokobal/coworkIA.git | git@github.com:Eduardokobal/coworkIA.git)
      return 0
      ;;
  esac
  recusar U1 "push para outro remoto: $(url_sem_credencial "$1")." \
    'o remoto tem de ser github.com/Eduardokobal/coworkIA; confira o git remote -v (nunca a organização Grupo-Vannuchi).'
  return 1
}

# U2: nada vai para a main, nem para apagá-la.
regra_u2() {
  if [ "$1" != refs/heads/main ]; then
    return 0
  fi
  recusar U2 'push para a main.' 'a main só muda por PR, com o merge do Eduardo.'
  return 1
}

# U3: apagar uma branch só depois de ela entrar na origin/main. $1 = ref remota, $2 = sha remoto.
regra_u3() {
  if git cat-file -e "$2^{commit}" 2>/dev/null &&
    git merge-base --is-ancestor "$2" refs/remotes/origin/main 2>/dev/null; then
    return 0
  fi
  recusar U3 "apagar $1, que não está na origin/main deste clone." \
    'rode git fetch origin e confira se o PR dela já teve o merge.'
  return 1
}

# U4: sem push forçado. $1 = ref remota, $2 = sha remoto, $3 = sha local.
regra_u4() {
  if ! git cat-file -e "$2^{commit}" 2>/dev/null; then
    recusar U4 "o commit remoto de $1 não está neste clone." 'rode git fetch origin antes do push.'
    return 1
  fi
  if git merge-base --is-ancestor "$2" "$3"; then
    return 0
  fi
  recusar U4 "push forçado em $1: o remoto tem commits que o local não tem." \
    'nunca reescreva o que já subiu; traga o remoto com git fetch e git merge.'
  return 1
}
```

- [ ] **Passo 4: escrever o `.githooks/pre-push`**

```sh
#!/bin/sh
# Trava local: U1 a U4 e a reconferência de cada commit novo (spec das travas, seções 4.3 e 5).
. "$(dirname "$0")/regras.sh"

regra_u1 "$2" || exit 1
recusou=0
while read -r ref_local sha_local ref_remota sha_remoto; do
  [ -n "$ref_local" ] || continue
  if ! regra_u2 "$ref_remota"; then
    recusou=1
    continue
  fi
  if eh_zeros "$sha_local"; then
    regra_u3 "$ref_remota" "$sha_remoto" || recusou=1
    continue
  fi
  if ! eh_zeros "$sha_remoto" && ! regra_u4 "$ref_remota" "$sha_remoto" "$sha_local"; then
    recusou=1
    continue
  fi
done
exit "$recusou"
```

- [ ] **Passo 5: rodar, ver passar e commitar o verde**

```bash
sh testes-travas/rodar.sh
git add .githooks/regras.sh .githooks/pre-push
git update-index --chmod=+x .githooks/pre-push
git commit -m "chore: trava de push" -m "Regras U1 a U4 da spec das travas: só o github.com/Eduardokobal/coworkIA, nada na main, apagar branch só depois de ela entrar na main, e nenhum push forçado."
```
Esperado: `0 falhas`.

**Mutações:**
- Em `regra_u1`, acrescentar `| https://github.com/Grupo-Vannuchi/coworkIA.git` à lista: cai "U1 recusa a organização".
- Em `regra_u1`, tirar a forma `https://github.com/Eduardokobal/coworkIA` (sem `.git`): cai "U1 aceita o HTTPS sem .git".
- Tirar o `url_sem_credencial` da mensagem da U1: cai "U1 não mostra a credencial da URL".
- Em `regra_u3`, trocar `refs/remotes/origin/main` por `"$2"`: cai "U3 recusa apagar branch fora da origin/main".
- Em `regra_u4`, trocar `"$2" "$3"` por `"$3" "$2"`: cai "U4 aceita avanço normal".

---

### Tarefa 5: a reconferência do `pre-push` (seção 5)

**Arquivos:**
- Criar: `testes-travas/casos-5-reconferencia.sh`
- Modificar: `.githooks/regras.sh` (acrescentar no fim) e `.githooks/pre-push` (uma linha)

**Interfaces:**
- Consome: `regra_p2`, `regra_p3`, `regra_p4` (Tarefa 1), `regras_de_mensagem` (Tarefa 2), `eh_zeros` (Tarefa 1).
- Produz: `reconferir <sha local> <sha remoto>`.

- [ ] **Passo 1: escrever o `testes-travas/casos-5-reconferencia.sh`**

```sh
# Casos da reconferência do pre-push (spec das travas, seção 5).

r=$(novo_repo reconf)
git -C "$r" update-ref refs/remotes/origin/main "$(git -C "$r" rev-parse main)"
ref_nova() {
  printf 'refs/heads/feat/teste %s refs/heads/feat/teste %s' "$(git -C "$r" rev-parse HEAD)" "$ZEROS"
}

# a) Um segredo trazido por cherry-pick, que não chama o pre-commit.
git -C "$r" switch -q -c fonte main
arquivo "$r" config.txt "chave=$CHAVE_AWS"
git -C "$r" commit -q --no-verify -m 'feat: config'
fonte=$(git -C "$r" rev-parse HEAD)
git -C "$r" switch -q feat/teste
git -C "$r" cherry-pick "$fonte" >/dev/null
espera 'reconferência recusa segredo trazido por cherry-pick' 1 P4 empurrar "$r" "$URL_CERTA" "$(ref_nova)"
nao_mostra 'reconferência não mostra o valor da chave' "$CHAVE_AWS"
git -C "$r" reset -q --hard main

# a2) Um arquivo de segredo pelo nome, trazido por cherry-pick.
git -C "$r" switch -q -c fonte2 main
arquivo "$r" .env 'SEGREDO=1'
git -C "$r" commit -q --no-verify -m 'feat: segredo'
fonte2=$(git -C "$r" rev-parse HEAD)
git -C "$r" switch -q feat/teste
git -C "$r" cherry-pick "$fonte2" >/dev/null
espera 'reconferência recusa arquivo de segredo trazido por cherry-pick' 1 P3 \
  empurrar "$r" "$URL_CERTA" "$(ref_nova)"
git -C "$r" reset -q --hard main

# b) Um commit com outro autor, feito por fora do pre-commit.
git -C "$r" -c user.name=Outra -c user.email=outra@example.com \
  commit -q --allow-empty --no-verify -m 'feat: outra pessoa'
espera 'reconferência recusa outro autor' 1 P2 empurrar "$r" "$URL_CERTA" "$(ref_nova)"
git -C "$r" reset -q --hard main

# c) O "Revert …" do git revert --no-edit, que não chama o commit-msg.
arquivo "$r" x.txt 'x'
git -C "$r" commit -q -m 'feat: x'
git -C "$r" revert --no-edit HEAD >/dev/null
espera 'reconferência recusa o "Revert …"' 1 M1 empurrar "$r" "$URL_CERTA" "$(ref_nova)"
git -C "$r" reset -q --hard main

# d) Achado 57: uma branch já enviada recebe a main, que traz um commit de outro committer.
remoto="$TMP/remoto.git"
git init -q --bare -b main "$remoto"
git -C "$r" remote add origin "$remoto"
git -C "$r" commit -q --allow-empty -m 'feat: um'
# Montagem: estes pushes vão sem as travas, porque o remoto de teste não é o GitHub.
git -C "$r" push -q --no-verify origin main feat/teste
enviado=$(git -C "$r" rev-parse HEAD)
git -C "$r" switch -q main
env GIT_COMMITTER_NAME=GitHub GIT_COMMITTER_EMAIL=noreply@github.com \
  git -C "$r" commit -q --allow-empty --no-verify -m 'Merge pull request #1 from Eduardokobal/teste'
git -C "$r" push -q --no-verify origin main
git -C "$r" switch -q feat/teste
git -C "$r" merge -q --no-ff main -m "Merge branch 'main' into feat/teste"
espera 'reconferência ignora o que já está no origin (achado 57)' 0 - \
  empurrar "$r" "$URL_CERTA" "refs/heads/feat/teste $(git -C "$r" rev-parse HEAD) refs/heads/feat/teste $enviado"

# e) U3 com a origin/main atrasada: a branch entrou na main do remoto, mas este clone não fez fetch.
git -C "$r" push -q --no-verify origin feat/teste
outro="$TMP/outro-clone"
git clone -q "$remoto" "$outro"
git -C "$outro" config user.name "$AUTOR_NOME"
git -C "$outro" config user.email "$AUTOR_EMAIL"
git -C "$outro" config core.autocrlf false
git -C "$outro" merge -q --no-ff origin/feat/teste -m 'Merge pull request #2 from Eduardokobal/feat/teste'
git -C "$outro" push -q origin main
apagar="(delete) $ZEROS refs/heads/feat/teste $(git -C "$r" rev-parse origin/feat/teste)"
espera 'U3 recusa com a origin/main atrasada' 1 U3 empurrar "$r" "$URL_CERTA" "$apagar"
mostra 'U3 pede o git fetch com a origin/main atrasada' 'git fetch'
git -C "$r" fetch -q origin
espera 'U3 aceita depois do fetch' 0 - empurrar "$r" "$URL_CERTA" "$apagar"

# f) O primeiro commit, sem pai, também é reconferido, contra a árvore vazia.
raiz="$TMP/raiz"
git init -q -b main "$raiz"
git -C "$raiz" config user.name "$AUTOR_NOME"
git -C "$raiz" config user.email "$AUTOR_EMAIL"
git -C "$raiz" config core.autocrlf false
arquivo "$raiz" .env 'SEGREDO=1'
# Montagem: o primeiro commit é feito antes de ligar as travas.
git -C "$raiz" commit -q -m 'chore: começo com segredo'
git -C "$raiz" config core.hooksPath "$GANCHOS"
espera 'reconferência confere o primeiro commit contra a árvore vazia' 1 P3 \
  empurrar "$raiz" "$URL_CERTA" "refs/heads/main $(git -C "$raiz" rev-parse HEAD) refs/heads/feat/raiz $ZEROS"
```

- [ ] **Passo 2: rodar, ver falhar e commitar o vermelho**

```bash
sh testes-travas/rodar.sh
```
Esperado: FALHA nos cinco casos de recusa da reconferência (a, a2, b, c e f), porque o `pre-push` ainda não reconfere os commits. O caso (d) e os da U3 (e) já passam.

```bash
git add testes-travas/casos-5-reconferencia.sh
git commit -m "test: casos da reconferência no push" -m "Teste vermelho da reconferência da spec das travas (seção 5): segredo por cherry-pick, outro autor, Revert do git revert --no-edit. Também ficam o caso do achado 57 e o da origin/main atrasada, que já passam."
```

- [ ] **Passo 3: acrescentar a reconferência no fim do `.githooks/regras.sh`**

```sh

# Seção 5: reconfere cada commit novo que sobe. $1 = sha local, $2 = sha remoto (pode ser só zeros).
# Um commit que já está em qualquer ref do origin não entra na lista (achado 57).
reconferir() {
  if eh_zeros "$2"; then
    commits_r=$(git rev-list "$1" --not --remotes=origin)
  else
    commits_r=$(git rev-list "$1" --not "$2" --remotes=origin)
  fi
  falhou_r=0
  for commit_r in $commits_r; do
    curto_r=$(git rev-parse --short "$commit_r")
    regra_p2 "$(git log -1 --format='%an <%ae>' "$commit_r")" \
      "$(git log -1 --format='%cn <%ce>' "$commit_r")" "commit $curto_r" || falhou_r=1
    pais_r=$(git log -1 --format=%P "$commit_r" | wc -w | tr -d ' ')
    merge_r=0
    if [ "$pais_r" -gt 1 ]; then
      merge_r=1
    fi
    regras_de_mensagem "$(git log -1 --format=%B "$commit_r")" "$merge_r" "commit $curto_r" || falhou_r=1
    if [ "$pais_r" -eq 0 ]; then
      base_r=$(git hash-object -t tree --stdin </dev/null)
    else
      base_r="$commit_r^1"
    fi
    git -c core.quotepath=off diff --name-only --diff-filter=ACMR "$base_r" "$commit_r" |
      regra_p3 "commit $curto_r" || falhou_r=1
    git -c core.quotepath=off diff -U0 --no-color --no-ext-diff --diff-filter=ACMR "$base_r" "$commit_r" |
      regra_p4 "commit $curto_r" || falhou_r=1
  done
  return "$falhou_r"
}
```

- [ ] **Passo 4: chamar a reconferência no `.githooks/pre-push`**

Trocar o fim do laço:

```sh
    recusou=1
    continue
  fi
done
```

por:

```sh
    recusou=1
    continue
  fi
  reconferir "$sha_local" "$sha_remoto" </dev/null || recusou=1
done
```

- [ ] **Passo 5: rodar, ver passar e commitar o verde**

```bash
sh testes-travas/rodar.sh
git add .githooks/regras.sh .githooks/pre-push
git update-index --chmod=+x .githooks/pre-push
git commit -m "chore: reconferência dos commits no push" -m "O cherry-pick, o revert --no-edit e o merge pulam travas na hora do commit, como o auditor mediu. O pre-push reconfere autor, mensagem, nomes de segredo e chaves de cada commit que ainda não está no origin."
```
Esperado: `0 falhas`.

**Mutações:**
- Trocar a seleção por `git rev-list "$2..$1"`, a regra antiga: cai "reconferência ignora o que já está no origin (achado 57)".
- Tirar a chamada da `regra_p4` da reconferência: cai "reconferência recusa segredo trazido por cherry-pick".
- Tirar a chamada da `regra_p3` da reconferência: caem "reconferência recusa arquivo de segredo trazido por cherry-pick" e "reconferência confere o primeiro commit contra a árvore vazia".
- Trocar a árvore vazia por `base_r="$commit_r^1"` também no primeiro commit: cai "reconferência confere o primeiro commit contra a árvore vazia", porque o diff do commit sem pai falha e não mostra o `.env`.
- Tirar a chamada da `regra_p2` da reconferência: cai "reconferência recusa outro autor".
- Tirar a chamada da `regras_de_mensagem` da reconferência: cai "reconferência recusa o "Revert …"".
- Fixar `merge_r=0`: cai "reconferência ignora o que já está no origin (achado 57)", porque o "Merge branch 'main' …" local passa a ser recusado pela M1.

---

### Tarefa 6: a ativação e a documentação (spec, seção 6)

**Arquivos:**
- Modificar: `README.md`, `CONTRIBUTING.md`

- [ ] **Passo 1: ativar as travas na pasta do DEV e conferir**

```bash
git config core.hooksPath .githooks
git config --get core.hooksPath
```
Esperado: `.githooks`. A partir daqui, os commits desta branch passam pelas travas. Esse passo só grava no `.git/config` deste repositório (spec, seção 6, e CONTRIBUTING.md:75). O auditor confere.

- [ ] **Passo 2: a seção "Travas locais" no `README.md`**

Acrescentar no fim do arquivo:

```markdown

## Travas locais

O repositório traz travas do git em `.githooks/`. Elas barram, antes do commit e de novo antes do push, o que o [CONTRIBUTING.md](CONTRIBUTING.md) proíbe. Ative uma vez em cada clone:

    git config core.hooksPath .githooks

Para conferir, `git config --get core.hooksPath` mostra `.githooks`. Os testes das travas rodam com `sh testes-travas/rodar.sh`.
```

```bash
git add README.md
git commit -m "docs: travas locais no README" -m "Como ativar e conferir as travas, e como rodar os testes delas (spec das travas, seção 6)."
```
Esperado: o commit passa pelas travas (`pre-commit` e `commit-msg`).

- [ ] **Passo 3: as travas no `CONTRIBUTING.md`**

Na linha 41, trocar `o auditor e as travas locais do git (hooks), que entram num assunto próprio, logo depois deste documento.` por:

```markdown
o auditor e as travas locais do git, em `.githooks/`, descritas em `docs/specs/2026-11-04-travas-locais.md` e ativadas com `git config core.hooksPath .githooks`.
```

Na linha 75, acrescentar ao fim:

```markdown
 O `gh repo create`, o `git remote add` e o `git push -u` também gravam na configuração local (o remoto e a branch acompanhada), e são permitidos.
```

Trocar a linha 79 por:

```markdown
- Nunca pular os hooks do git, que são as travas locais: nem `--no-verify`, nem `-n` no commit, nem `git -c core.hooksPath=...`. A única exceção são os testes das travas (`testes-travas/`), que usam esses atalhos de propósito, e só nos repositórios temporários da `.tmp-travas/`, para provar que as travas barram.
- As travas conferem, antes do commit e de novo antes do push, o que está na spec das travas: commit e push na main, o autor, os arquivos de segredo, as chaves conhecidas, o formato da mensagem, o tamanho do título, o rodapé de IA, os coautores e a arroba solta. A minúscula do começo da frase e o que as travas não cobrem (spec das travas, seção 8) ficam com o auditor.
```

```bash
git add CONTRIBUTING.md
git commit -m "docs: travas locais no CONTRIBUTING" -m "As travas existem e estão descritas na spec delas; o que elas conferem e o que fica com o auditor; e a config local que o gh repo create e o git push -u gravam (observação do auditor de 2026-11-04)."
```

- [ ] **Passo 4: o merge no `CONTRIBUTING.md`**

Trocar o bloco abaixo, achado pelo conteúdo. Na main (85a0ca9) ele está nas linhas 85 a 89, conferidas com `sed -n '85,89p'`. Depois do passo 3, que troca uma linha por duas, ele está nas linhas 86 a 90:

```markdown
- O corpo traz o porquê, os números (testes, lint, tipos e build), os achados que o auditor mandou anotar, os riscos aceitos, o que o Eduardo deve conferir e a mensagem do merge pronta.
- O merge é do Eduardo, sempre com **merge commit**: a main guarda cada commit com o mesmo hash que o auditor conferiu.
- A caixa de merge do GitHub vem com os dois campos preenchidos, e os dois são trocados:
  - título: `tipo: frase do assunto (#N)`, em que N é o número do PR;
  - descrição: o porquê em uma ou duas linhas, sem rodapé de IA.
```

por:

```markdown
- O corpo traz o porquê, os números (testes, lint, tipos e build), os achados que o auditor mandou anotar, os riscos aceitos e o que o Eduardo deve conferir.
- O merge é do Eduardo, sempre com **merge commit**: a main guarda cada commit com o mesmo hash que o auditor conferiu. O repositório no GitHub só oferece esse tipo de merge.
- O título do merge vem do título do PR, e a descrição vem em branco (configuração do repositório desde 2026-11-04). Nenhum campo precisa ser trocado. O auditor confere a mensagem que entrou.
```

```bash
git add CONTRIBUTING.md
git commit -m "docs: merge com o título do PR no CONTRIBUTING" -m "O repositório só oferece o merge commit, com o título do PR e a descrição em branco (D11 da spec das travas e achado 48 do auditor)."
```

---

### Tarefa 7: o fechamento

- [ ] **Passo 1: rodar tudo e anotar os números**

```bash
sh testes-travas/rodar.sh
git config --get core.hooksPath
git ls-files -s .githooks
git log --oneline origin/main..HEAD
git status --short
```
Esperado: `0 falhas`; `.githooks`; os quatro hooks com o modo `100755` e o `regras.sh` com `100644`; 16 commits; e o status limpo.

- [ ] **Passo 2: mandar ao auditor**

O HEAD, o placar do `rodar.sh`, a lista dos commits `test:` e `chore:` e o roteiro de mutações de cada tarefa.

- [ ] **Passo 3: o push e o PR, com o OK do Eduardo e o parecer do auditor antes**

O push desta branch é o primeiro que passa pelo `pre-push`: ele reconfere todos os commits da branch. O corpo do PR segue o CONTRIBUTING, seção 5.

## Cobertura da spec neste plano

| Seção da spec das travas | Tarefa |
|---|---|
| 4.1 (P1 a P4) e RG2, RG3, RG6 | 1 |
| 4.2 (M1 a M5) e RG5 | 2 |
| 4.2 (M6) e 5 (`pre-merge-commit`) | 3 |
| 4.3 (U1 a U4) | 4 |
| 5 (reconferência, achado 57, e o primeiro commit contra a árvore vazia, caso f) | 5 |
| 6 (ativação, README, CONTRIBUTING, `.gitignore`) | 1 e 6 |
| 7 (testes) | 1 a 5 |
| RG4 (bit de execução) | 1 a 5 e 7 |
| 9 (critério de pronto) | 7 |
