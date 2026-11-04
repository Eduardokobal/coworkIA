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
