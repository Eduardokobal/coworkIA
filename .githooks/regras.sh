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
  # O git roda o hook com LC_CTYPE=C.UTF-8, e nele o grep do Git for Windows não acha o 🤖
  # (fora do plano básico do Unicode). Com LC_ALL=C, a busca é byte a byte e acha.
  if printf '%s\n' "$texto_m" | grep -qiF 'generated with' ||
    printf '%s\n' "$texto_m" | LC_ALL=C grep -qF '🤖'; then
    recusar M4 "a mensagem tem rodapé de IA${3:+ ($3)}." 'tire o rodapé.'
    falhou_m=1
  fi
  if printf '%s\n' "$texto_m" | sed 's/`[^`]*`//g' | LC_ALL=C grep -qE '(^|[[:space:][:punct:]])@[A-Za-z0-9]'; then
    recusar M5 "arroba solta fora de crase${3:+ ($3)}." 'ponha o nome entre crases ou tire a arroba.'
    falhou_m=1
  fi
  return "$falhou_m"
}

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
