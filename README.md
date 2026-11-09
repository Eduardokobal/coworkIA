# coworkIA

Um projeto pessoal. Um servidor MCP que roda no seu PC e dá à sua IA (Claude, Codex, VS Code) ferramentas para ler e fazer a triagem dos e-mails e das conversas exportadas do WhatsApp, consultar a agenda, criticar um rascunho e montar o resumo do dia. A versão 1 está descrita em [docs/specs/2026-11-04-versao-1.md](docs/specs/2026-11-04-versao-1.md), com os adendos dos planos [B](docs/specs/2026-11-05-versao-1-adendo.md) e [C](docs/specs/2026-11-05-versao-1-adendo-c.md) e o do [ajuste dos anotados](docs/specs/2026-11-06-versao-1-adendo-anotados.md). A versão 2 começa pelo WhatsApp exportado, descrito em [docs/specs/2026-11-06-versao-2-whatsapp.md](docs/specs/2026-11-06-versao-2-whatsapp.md). Ela roda no modo de demonstração, com uma caixa de e-mail e uma agenda inventadas, ou com o seu Gmail e a sua Agenda do Google, só para leitura.

## Como usar

Precisa do Node.js 24 ou mais novo.

    git clone https://github.com/Eduardokobal/coworkIA.git
    cd coworkIA
    npm install
    npm run build

### Ver sem IA

    npm run resumo

Mostra o resumo do dia da demonstração: a triagem dos e-mails das últimas 24 horas, a agenda de hoje, os conflitos, o próximo compromisso e a triagem das conversas do WhatsApp.

Na demonstração, o e-mail de `diretoria@example.com` só vira urgente (regra T4) com a variável `COWORKIA_IMPORTANTES=diretoria@example.com`. Sem ela, ele aparece em "pedem resposta". Do mesmo jeito, a conversa da Marta Souza no WhatsApp só vira urgente (regra W3) com `COWORKIA_WHATSAPP_IMPORTANTES="Marta Souza"`.

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

  O VS Code ainda aceita o `.vscode/mcp.json`, mas a documentação dele, de 04/11/2026, o marca como antigo ("deprecated") no assistente que adiciona servidores. O outro destino da documentação, o `.mcp.json` na raiz do projeto, usa o formato portátil do Copilot, com a chave `mcpServers`, e o assistente só o oferece com a opção experimental `chat.mcp.workspaceRootConfig.enabled` ligada.

As ferramentas são `listar_emails`, `ler_email`, `triagem_emails`, `listar_eventos`, `verificar_disponibilidade`, `criticar_rascunho`, `resumo_do_dia`, `listar_conversas`, `ler_conversa` e `triagem_whatsapp`, e o prompt é `criticar_rascunho`.

### Variáveis de ambiente

| Variável | Para quê | Padrão |
|---|---|---|
| `COWORKIA_MODO` | `demo` ou `google` (o `google` precisa do login; veja abaixo) | `demo` |
| `COWORKIA_FUSO` | O fuso das datas e horas | `America/Sao_Paulo` |
| `COWORKIA_IMPORTANTES` | Remetentes importantes, separados por vírgula | nenhum |
| `COWORKIA_AGORA` | Fixa o relógio; só para testes e demonstração | o relógio do sistema |
| `COWORKIA_WHATSAPP_PASTA` | A pasta das conversas exportadas do WhatsApp, no modo `google` | nenhuma |
| `COWORKIA_WHATSAPP_EU` | Os nomes com que você aparece nas suas mensagens exportadas, separados por vírgula | nenhum |
| `COWORKIA_WHATSAPP_IMPORTANTES` | Os contatos importantes no WhatsApp, como aparecem na exportação | nenhum |

### Usar o Gmail e a Agenda de verdade

O coworkIA só lê: as permissões pedidas são `gmail.readonly` e `calendar.readonly`. O cliente OAuth é seu, criado no seu projeto do Google Cloud. O token fica no cofre do sistema (o Gerenciador de Credenciais do Windows, o Keychain do macOS ou o Secret Service do Linux), e nunca num arquivo.

1. No Google Cloud Console, crie um projeto e ative a Gmail API e a Google Calendar API.
2. Configure a tela de consentimento OAuth como "Externo", deixe o app em "Teste" e acrescente o seu e-mail como usuário de teste.
3. Crie um cliente OAuth do tipo "App para computador".
4. Copie o `.env.example` para `.env`, na pasta do coworkIA, e preencha o `COWORKIA_GOOGLE_CLIENT_ID` e o `COWORKIA_GOOGLE_CLIENT_SECRET`. O `.env` fica fora do git.
5. Rode `npm run login-google`, abra o endereço que aparece no terminal e permita a leitura do Gmail e da Agenda. O login só é aceito com essas duas permissões, nem mais nem menos.
6. Defina `COWORKIA_MODO=google` para o servidor. No Claude Code, por exemplo:

       claude mcp add coworkia -e COWORKIA_MODO=google -- node /caminho/para/coworkIA/dist/cli.js

No modo google, o coworkIA lê só a caixa de entrada, e no máximo 200 e-mails por chamada. Para sair, rode `npm run logout-google`, que apaga o token do cofre.

Com o app em "Teste", o Google faz o login valer 7 dias; depois disso, rode `npm run login-google` de novo. Publicar o app tira esse limite, mas o Google pode pedir uma verificação para as permissões do Gmail, e isso não foi testado.

### Ler as conversas do WhatsApp

O coworkIA lê as conversas que você exporta pelo próprio WhatsApp. Ele não usa nenhuma biblioteca não oficial e não se conecta ao WhatsApp: só lê os arquivos, sem alterar nem enviar nada.

1. Exporte cada conversa sem mídia. No Android, abra a conversa, toque em "Mais" e depois em "Exportar conversa", e escolha "Sem mídia". No iPhone, exporte sem mídia, tire o `_chat.txt` de dentro do `.zip` e renomeie o arquivo com o nome da conversa.
2. Ponha os `.txt` numa pasta e defina `COWORKIA_WHATSAPP_PASTA` com o caminho dela.
3. Defina `COWORKIA_WHATSAPP_EU` com o nome que aparece nas suas mensagens exportadas e, se quiser, os apelidos com que citam você nos grupos, separados por vírgula.
4. Se quiser, defina `COWORKIA_WHATSAPP_IMPORTANTES` com os contatos importantes.

A triagem olha, em cada conversa, o que chegou depois da sua última resposta, nas últimas 24 horas. Num grupo, só conta o que cita você. As limitações conhecidas:

- uma mensagem de várias linhas pode ter, no meio, uma linha que imita o começo de outra mensagem. O coworkIA não consegue distinguir as duas, porque no arquivo exportado elas são iguais. Se a linha imitar uma mensagem sua, o texto dali em diante aparece como seu, e as mensagens de antes somem da triagem. As ferramentas do WhatsApp avisam a IA disso, na descrição que ela lê;
- a hora com AM ou PM, os idiomas além do português e a mídia não são lidos;
- a citação pelo número de telefone não é reconhecida, e um aviso do WhatsApp com ": " no meio pode virar uma mensagem;
- um grupo em que só uma outra pessoa falou conta como conversa individual, e um contato que muda de nome no meio da conversa faz ela contar como grupo.

O formato da exportação não é publicado pelo WhatsApp. O coworkIA foi feito a partir das variações conhecidas e ainda não foi medido com uma exportação real.

## Avisos

- **Dados de terceiros e a LGPD:** o texto dos e-mails, da agenda e das conversas do WhatsApp vai para o provedor da IA que você usa. Num uso profissional, isso envolve dados de clientes e de colegas.
- **Injeção de instrução:** um e-mail ou uma mensagem pode tentar mandar a IA fazer algo. O coworkIA nunca envia nada e marca o texto de terceiros como dado, mas a IA pode ter outras ferramentas. Use o coworkIA numa IA sem conectores que enviam e-mail ou mensagem, ou com a aprovação de cada chamada de ferramenta ligada.
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

## Como o projeto foi feito

O coworkIA foi construído com o Claude Code, em duas sessões com papéis separados: uma constrói (o DEV) e a outra confere (o auditor). Nenhuma das duas decide sozinha: o Eduardo aprova cada spec e cada plano, dá o OK para tudo o que grava fora da máquina e faz o merge de cada PR.

- Cada parte com código começou por uma spec, em [docs/specs/](docs/specs/), e por um plano com o teste antes do código, em [docs/planos/](docs/planos/).
- O auditor conferiu cada commit antes do push. A partir do plano B, ele também aplicou cada plano do zero, numa cópia própria, e comparou o resultado commit por commit.
- O [CLAUDE.md](CLAUDE.md) traz as instruções que as sessões seguem, e o [CONTRIBUTING.md](CONTRIBUTING.md), as regras do processo.

## Licença

MIT. Veja o [LICENSE](LICENSE).
