# Regras do coworkIA

Estas são as regras de trabalho do coworkIA. Elas valem para qualquer pessoa ou sessão do Claude que mexa no repositório. Quando uma regra mudar, ela muda aqui, num PR, e só com o OK do Eduardo.

## 1. Papéis

- **Eduardo**: decide. Escolhe o assunto, aprova a spec e o plano, dá o OK para tudo o que grava fora da máquina e faz o merge.
- **DEV**: constrói. Desenha com o Eduardo, escreve a spec, o plano, os testes e o código, e manda cada hash ao auditor.
- **Auditor**: mede. Lê pelo hash, mede numa cópia própria e reporta. Não escreve no repositório e não aprova nada no lugar do Eduardo. O relatório dele fica fora do repositório.

Os nomes das sessões mudam todo dia. O papel de cada uma se confirma com o Eduardo.

## 2. O ciclo de um assunto

Os passos marcados com **portão** só seguem depois do parecer do auditor e do OK do Eduardo.

1. O Eduardo escolhe o assunto.
2. O DEV abre a branch do assunto a partir da main atualizada (a `origin/main`, quando o remoto existir).
3. **Spec** (portão). O DEV desenha com o Eduardo e commita a spec em `docs/specs/AAAA-MM-DD-assunto.md`. O auditor dá o parecer e o Eduardo aprova.
4. **Plano** (portão). O DEV escreve o plano em `docs/planos/AAAA-MM-DD-assunto.md`, em fases numeradas, com o teste antes de cada código. O auditor dá o parecer e o Eduardo diz "Li, pode executar".
5. **Fases**. A cada fase, o DEV manda ao auditor o hash e os números: o teste vermelho antes, o verde depois, o lint, os tipos e o build. O DEV segue para a fase seguinte sem esperar a resposta.
6. **Push** (portão). Acontece com o OK do Eduardo e depois de o auditor conferir o commit do topo e a branch.
7. **PR**. O auditor confere o corpo e a mensagem do merge antes de o PR abrir.
8. **Merge** (portão). Quem faz é o Eduardo. Depois, o auditor confere se a main ficou igual ao que foi conferido, e só então o assunto está fechado.
9. **Deploy**, quando existir. Acontece só com o OK do Eduardo, e o auditor confere só lendo.

Um assunto só de documentação, sem código, não tem plano nem fases: o próprio documento é a spec.

O ensaio do plano numa cópia à parte ficou de fora no começo, por decisão do Eduardo em 2026-11-04. Ele pode voltar quando houver regra de negócio pesada.

## 3. Branches

- Uma branch por assunto e um PR por branch. Um assunto novo vira uma branch nova.
- O nome segue `tipo/assunto-curto`, com o tipo da lista da seção 4 e o assunto em português, minúsculo, sem acento e com hífen. Exemplo: `feat/cadastro-de-salas`.
- Nunca commitar nem dar push na main, local ou remota.
- Nunca dar force push e nunca reescrever o que já foi empurrado.
- Commit conferido pelo auditor não se reescreve: a correção vai num commit novo.

**Exceção única:** o commit vazio `chore: início do repositório`, que deu origem à main, foi feito direto nela. É risco aceito pelo Eduardo em 2026-11-04.

**Por que as regras estão aqui e não no GitHub:** o repositório é privado numa conta sem o GitHub Pro, que é o plano que permite proteger a main. A barreira fica na máquina: o auditor e as travas locais do git (hooks), que entram num assunto próprio, logo depois deste documento.

## 4. Commits

O formato segue o [Conventional Commits](https://www.conventionalcommits.org/pt-br/v1.0.0/):

```
tipo(escopo): frase em português

O porquê da mudança, quando ele não é óbvio.
```

- **tipo**: um destes.
  - `feat`: algo novo para quem usa.
  - `fix`: conserto de defeito.
  - `docs`: só documentação.
  - `test`: só testes.
  - `refactor`: muda o código sem mudar o comportamento.
  - `perf`: melhora o desempenho.
  - `style`: formatação, sem mudar a lógica.
  - `build`: build ou dependências.
  - `ci`: integração contínua.
  - `chore`: manutenção que não entra em nenhum dos outros.
- **escopo**: opcional. É a parte do sistema que muda, entre parênteses. Exemplo: `fix(reservas): impede reserva no passado`.
- **frase**: em português, começando com minúscula e sem ponto final, com até 72 caracteres. Ela diz o efeito da mudança. Exemplo: `feat: cadastro de salas`.
- **corpo**: depois de uma linha em branco. Diz o porquê, não o como.
- **mudança que quebra compatibilidade**: leva `!` depois do tipo (`feat!: ...`) e um rodapé `BREAKING CHANGE: o que quebra`.

As regras de todo commit:

- Uma coisa só por commit, e commits pequenos.
- Sem rodapé de IA: nada de `Co-Authored-By` de IA nem "Generated with", no commit, no PR ou na mensagem do merge.
- O autor é o do git global: `Eduardo Kobal <162614913+Eduardokobal@users.noreply.github.com>`.
- Nunca mudar o autor nem a configuração global do git (`git config --global`). Uma opção pontual vai no próprio comando, com `git -c`. A configuração local deste repositório só muda quando um assunto aprovado pede.
- Nome de pacote, papel ou exemplo com arroba vai entre crases, porque o GitHub notifica a conta citada.
- `git add` com o caminho de cada arquivo. Nunca `git add -A`, `git add .` nem `git add -u`.
- Antes de commitar, conferir `git branch --show-current` e `git status --short`.
- Nunca usar `--no-verify`, porque ele pula os hooks do git, que são as travas locais.

## 5. PR e merge

- A base do PR é a main, e o head é o hash que o auditor conferiu.
- O título segue o formato de commit da seção 4.
- O corpo traz o porquê, os números (testes, lint, tipos e build), os achados que o auditor mandou anotar, os riscos aceitos, o que o Eduardo deve conferir e a mensagem do merge pronta.
- O merge é do Eduardo, sempre com **merge commit**: a main guarda cada commit com o mesmo hash que o auditor conferiu.
- A caixa de merge do GitHub vem com os dois campos preenchidos, e os dois são trocados:
  - título: `tipo: frase do assunto (#N)`, em que N é o número do PR;
  - descrição: o porquê em uma ou duas linhas, sem rodapé de IA.

## 6. O que pede o OK do Eduardo antes

Tudo o que grava fora da máquina pede o OK do Eduardo antes, pela caixa: criar o repositório, push, abrir PR, deploy, banco de produção, serviço pago e qualquer outra gravação externa.

Numa gravação em banco ou serviço externo, a ordem é esta:

1. o DEV diz o que vai gravar e a hora;
2. o auditor lê como estava antes;
3. o auditor responde "pode";
4. o DEV grava;
5. o auditor lê o depois e compara com o antes.

Antes do primeiro push, o `git remote -v` precisa mostrar `github.com/Eduardokobal/coworkIA`. Nunca a organização `Grupo-Vannuchi`.

## 7. Segurança

- Segredo (chave, token ou senha) nunca vai para o código, um log, um teste, um commit, um PR ou uma mensagem entre sessões.
- Os arquivos `.env*` ficam fora do git. O `.env.example` vai com os nomes das variáveis e sem os valores.
- Chave nunca é impressa. Para saber se ela existe, confira o nome e o tamanho, nunca o valor.
- O teste de integração nunca roda contra a produção.

## 8. Qualidade

- O README diz o que o projeto é e como rodar, e é atualizado no mesmo PR que muda isso.
- O `.gitignore` acompanha a stack.
- Nas regras de negócio, o teste vem antes do código. Primeiro ele falha, depois passa, e só então o código é refatorado.
- O projeto tem lint e formatação, e os comandos ficam no README.
- As versões ficam fixadas pelo arquivo de lock, que é commitado. Dependência nova só entra com motivo, escrito no corpo do commit.
- Os arquivos de texto usam fim de linha LF, garantido pelo `.gitattributes`.

## 9. Limites

- Nada fora da pasta do coworkIA é tocado. A exceção é a pasta do relatório do auditor, que fica ao lado e fora do repositório.
- O projeto é pessoal e temporário. Nada dele vai para a memória de outros projetos.
