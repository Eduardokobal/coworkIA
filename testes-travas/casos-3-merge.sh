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
