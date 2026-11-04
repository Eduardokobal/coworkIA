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
