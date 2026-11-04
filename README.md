# coworkIA

Um projeto pessoal. A ideia ainda está em desenho. O que o sistema faz e como rodá-lo entram aqui quando a spec do projeto for aprovada.

## Regras

As regras de trabalho (branches, commits, PR, segurança e qualidade) estão no [CONTRIBUTING.md](CONTRIBUTING.md).

## Travas locais

O repositório traz travas do git em `.githooks/`. Elas barram, antes do commit e de novo antes do push, o que o [CONTRIBUTING.md](CONTRIBUTING.md) proíbe. Ative uma vez em cada clone:

    git config core.hooksPath .githooks

Para conferir, `git config --get core.hooksPath` mostra `.githooks`. Os testes das travas rodam com `sh testes-travas/rodar.sh`.
