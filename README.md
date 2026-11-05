# coworkIA

Um projeto pessoal. Um servidor MCP que roda no seu PC e dá à sua IA (Claude, Codex, VS Code) ferramentas para ler e fazer a triagem dos e-mails, consultar a agenda, criticar um rascunho e montar o resumo do dia. A versão 1 está descrita em [docs/specs/2026-11-04-versao-1.md](docs/specs/2026-11-04-versao-1.md), com o [adendo](docs/specs/2026-11-05-versao-1-adendo.md). Hoje ela roda no modo de demonstração, com uma caixa de e-mail e uma agenda inventadas; o Gmail e a Agenda do Google vêm na próxima etapa.

## Como usar

Precisa do Node.js 24 ou mais novo.

    git clone https://github.com/Eduardokobal/coworkIA.git
    cd coworkIA
    npm install
    npm run build

### Ver sem IA

    npm run resumo

Mostra o resumo do dia da demonstração: a triagem dos e-mails das últimas 24 horas, a agenda de hoje, os conflitos e o próximo compromisso.

Na demonstração, o e-mail de `diretoria@example.com` só vira urgente (regra T4) com a variável `COWORKIA_IMPORTANTES=diretoria@example.com`. Sem ela, ele aparece em "pedem resposta".

### Ligar numa IA

O servidor fala MCP pela entrada e pela saída padrão. Troque `/caminho/para/coworkIA` pela pasta onde você clonou o projeto. No Windows, use a barra normal, como em `C:/Users/voce/coworkIA/dist/cli.js`: o Node aceita, e o JSON não precisa de escape.

- **Claude Code:**

      claude mcp add coworkia -- node /caminho/para/coworkIA/dist/cli.js

- **Claude Desktop**, no `claude_desktop_config.json`:

  ```json
  {
    "mcpServers": {
      "coworkia": { "command": "node", "args": ["/caminho/para/coworkIA/dist/cli.js"] }
    }
  }
  ```

- **Codex**, no `~/.codex/config.toml`:

  ```toml
  [mcp_servers.coworkia]
  command = "node"
  args = ["/caminho/para/coworkIA/dist/cli.js"]
  ```

- **VS Code**, no `.vscode/mcp.json` do seu projeto:

  ```json
  {
    "servers": {
      "coworkia": { "type": "stdio", "command": "node", "args": ["/caminho/para/coworkIA/dist/cli.js"] }
    }
  }
  ```

As ferramentas são `listar_emails`, `ler_email`, `triagem_emails`, `listar_eventos`, `verificar_disponibilidade`, `criticar_rascunho` e `resumo_do_dia`, e o prompt é `criticar_rascunho`.

### Variáveis de ambiente

| Variável | Para quê | Padrão |
|---|---|---|
| `COWORKIA_MODO` | `demo` ou `google` (o `google` ainda não está disponível) | `demo` |
| `COWORKIA_FUSO` | O fuso das datas e horas | `America/Sao_Paulo` |
| `COWORKIA_IMPORTANTES` | Remetentes importantes, separados por vírgula | nenhum |
| `COWORKIA_AGORA` | Fixa o relógio; só para testes e demonstração | o relógio do sistema |

## Avisos

- **Dados de terceiros e a LGPD:** o texto dos e-mails e da agenda vai para o provedor da IA que você usa. Num uso profissional, isso envolve dados de clientes e de colegas.
- **Injeção de instrução:** um e-mail pode tentar mandar a IA fazer algo. O coworkIA nunca envia nada e marca o texto de terceiros como dado, mas a IA pode ter outras ferramentas. Use o coworkIA numa IA sem conectores que enviam e-mail ou mensagem, ou com a aprovação de cada chamada de ferramenta ligada.
- **E-mail da empresa:** só entra com a autorização da empresa.
- **Limitações da triagem:** "Preciso disso até amanhã." não é detectado como prazo, e a citação do Outlook não é reconhecida.

## Desenvolvimento

Precisa do Node.js 24 ou mais novo.

    npm install
    npm test          # testes (Vitest)
    npm run lint      # lint e formatação (Biome)
    npm run formatar  # corrige a formatação
    npm run tipos     # checagem de tipos (TypeScript)
    npm run build     # gera a pasta dist/

## Regras

As regras de trabalho (branches, commits, PR, segurança e qualidade) estão no [CONTRIBUTING.md](CONTRIBUTING.md).

## Travas locais

O repositório traz travas do git em `.githooks/`. Elas barram, antes do commit e de novo antes do push, o que o [CONTRIBUTING.md](CONTRIBUTING.md) proíbe. Ative uma vez em cada clone:

    git config core.hooksPath .githooks

Para conferir, `git config --get core.hooksPath` mostra `.githooks`. Os testes das travas rodam com `sh testes-travas/rodar.sh`.
