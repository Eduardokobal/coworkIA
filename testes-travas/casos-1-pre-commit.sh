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
