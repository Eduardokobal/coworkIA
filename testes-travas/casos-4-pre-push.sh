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
