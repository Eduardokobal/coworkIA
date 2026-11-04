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
