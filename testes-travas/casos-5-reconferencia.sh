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
