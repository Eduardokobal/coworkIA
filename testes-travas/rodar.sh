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
