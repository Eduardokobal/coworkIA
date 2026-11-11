# coworkIA

Um projeto pessoal. Um servidor MCP que roda no seu PC e dá à sua IA (Claude, Codex, VS Code) ferramentas para ler e fazer a triagem dos e-mails e das conversas exportadas do WhatsApp, ler e resumir os extratos do banco em OFX, consultar a agenda, criticar um rascunho e montar o resumo do dia. A versão 1 está descrita em [docs/specs/2026-11-04-versao-1.md](docs/specs/2026-11-04-versao-1.md), com os adendos dos planos [B](docs/specs/2026-11-05-versao-1-adendo.md) e [C](docs/specs/2026-11-05-versao-1-adendo-c.md) e o do [ajuste dos anotados](docs/specs/2026-11-06-versao-1-adendo-anotados.md). A versão 2 começa pelo WhatsApp exportado, descrito em [docs/specs/2026-11-06-versao-2-whatsapp.md](docs/specs/2026-11-06-versao-2-whatsapp.md), e segue com as finanças por extrato, descritas em [docs/specs/2026-11-09-versao-2-financas.md](docs/specs/2026-11-09-versao-2-financas.md). Ela roda no modo de demonstração, com uma caixa de e-mail e uma agenda inventadas, ou com o seu Gmail e a sua Agenda do Google, só para leitura.

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

As finanças não entram no resumo do dia. Na demonstração, elas aparecem nas ferramentas `listar_lancamentos` e `resumo_financeiro`, com uma conta corrente, um cartão, uma poupança e um extrato malicioso.

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

As ferramentas são `listar_emails`, `ler_email`, `triagem_emails`, `listar_eventos`, `verificar_disponibilidade`, `criticar_rascunho`, `resumo_do_dia`, `listar_conversas`, `ler_conversa`, `triagem_whatsapp`, `listar_lancamentos` e `resumo_financeiro`, e o prompt é `criticar_rascunho`.

### Variáveis de ambiente

| Variável | Para quê | Padrão |
|---|---|---|
| `COWORKIA_MODO` | `demo`, `google` ou `arquivos` (o `google` precisa do login; o `arquivos` lê só o WhatsApp e os extratos; veja abaixo) | `demo` |
| `COWORKIA_FUSO` | O fuso das datas e horas | `America/Sao_Paulo` |
| `COWORKIA_IMPORTANTES` | Remetentes importantes, separados por vírgula | nenhum |
| `COWORKIA_AGORA` | Fixa o relógio; só para testes e demonstração | o relógio do sistema |
| `COWORKIA_WHATSAPP_PASTA` | A pasta das conversas exportadas do WhatsApp, no modo `google` ou `arquivos` | nenhuma |
| `COWORKIA_WHATSAPP_EU` | Os nomes com que você aparece nas suas mensagens exportadas, separados por vírgula | nenhum |
| `COWORKIA_WHATSAPP_IMPORTANTES` | Os contatos importantes no WhatsApp, como aparecem na exportação | nenhum |
| `COWORKIA_FINANCAS_PASTA` | A pasta dos extratos OFX, no modo `google` ou `arquivos` | nenhuma |
| `COWORKIA_FINANCAS_CATEGORIAS` | As suas categorias, no formato `nome=termo1,termo2;nome2=termo3`; valem antes das do coworkIA | nenhuma |

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

O modo google foi testado com os dados de demonstração e com testes automáticos, mas ainda não com uma conta real do Google.

### Usar só o WhatsApp e os extratos

Se você não quer conectar o Google, o modo `arquivos` lê só as conversas exportadas do WhatsApp e os extratos OFX. Ele não pede o login do Google nem o `.env` e não toca no cofre do sistema.

1. Defina `COWORKIA_MODO=arquivos` para o servidor e as variáveis da pasta que você vai usar: a `COWORKIA_WHATSAPP_PASTA` e a `COWORKIA_WHATSAPP_EU` para o WhatsApp, e a `COWORKIA_FINANCAS_PASTA` para os extratos. No Claude Code, por exemplo:

       claude mcp add coworkia -e COWORKIA_MODO=arquivos -e COWORKIA_WHATSAPP_PASTA=/caminho/das/conversas -e "COWORKIA_WHATSAPP_EU=Seu Nome" -- node /caminho/para/coworkIA/dist/cli.js

2. As duas seções abaixo dizem como exportar as conversas e baixar os extratos.

Nesse modo, as ferramentas de e-mail e agenda respondem que não estão ligadas, e o resumo do dia traz o mesmo aviso no lugar do e-mail e da agenda, com o WhatsApp.

### Ler as conversas do WhatsApp

O coworkIA lê as conversas que você exporta pelo próprio WhatsApp. Ele não usa nenhuma biblioteca não oficial e não se conecta ao WhatsApp: só lê os arquivos, sem alterar nem enviar nada.

1. Exporte cada conversa sem mídia. No Android, abra a conversa, toque em "Mais" e depois em "Exportar conversa", e escolha "Sem mídia". No iPhone, exporte sem mídia, tire o `_chat.txt` de dentro do `.zip` e renomeie o arquivo com o nome da conversa. No WhatsApp do computador, a conversa exportada vem num `.zip` com um `chat.txt` e um `chat.md`: tire o `chat.txt` e renomeie o arquivo com o nome da conversa.
2. Ponha os `.txt` numa pasta e defina `COWORKIA_WHATSAPP_PASTA` com o caminho dela.
3. Defina `COWORKIA_WHATSAPP_EU` com o nome que aparece nas suas mensagens exportadas e, se quiser, os apelidos com que citam você nos grupos, separados por vírgula. Na exportação do WhatsApp do computador, as suas mensagens aparecem como "Você", e o coworkIA as reconhece sem a variável, que continua necessária para as citações nos grupos e para as exportações do celular.
4. Se quiser, defina `COWORKIA_WHATSAPP_IMPORTANTES` com os contatos importantes.

A triagem olha, em cada conversa, o que chegou depois da sua última resposta, nas últimas 24 horas. Num grupo, só conta o que cita você. As limitações conhecidas:

- uma mensagem de várias linhas pode ter, no meio, uma linha que imita o começo de outra mensagem. O coworkIA não consegue distinguir as duas, porque no arquivo exportado elas são iguais. Se a linha imitar uma mensagem sua, o texto dali em diante aparece como seu, e as mensagens de antes somem da triagem. As ferramentas do WhatsApp avisam a IA disso, na descrição que ela lê;
- a hora com AM ou PM só é lida na exportação do WhatsApp do computador, e os idiomas além do português e a mídia não são lidos;
- na exportação do WhatsApp do computador, um contato salvo com o nome "Você" conta como você, uma mensagem só com um texto entre < e > conta como mídia, e a linha que imita uma mensagem sua, no meio de uma mensagem de várias linhas, não precisa do seu nome: basta o "Você";
- num celular configurado no formato mês/dia, como o dos Estados Unidos, com o relógio de 24 horas, as datas saem trocadas, e algumas mensagens se juntam à anterior. As ferramentas do WhatsApp e o resumo do dia avisam quando acham uma data que não existe, como o mês 13. Um arquivo em que todos os dias vão até 12 não dá para distinguir e sai sem aviso;
- a citação pelo número de telefone e a citação ao grupo todo não são reconhecidas, porque só contam os nomes da `COWORKIA_WHATSAPP_EU`, e um aviso do WhatsApp com ": " no meio pode virar uma mensagem;
- um grupo em que só uma outra pessoa falou conta como conversa individual, e um contato que muda de nome no meio da conversa faz ela contar como grupo.

O formato da exportação não é publicado pelo WhatsApp. O coworkIA foi feito a partir das variações conhecidas e medido com exportações de exemplo publicadas por projetos abertos e com exportações reais do WhatsApp do computador e de um celular Android. Numa exportação do Android, a mensagem que outra pessoa apagou para todos não apareceu. A exportação do iPhone e a citação com o @ do seu nome ainda não foram medidas com uma exportação real.

### Ler os extratos do banco

O coworkIA lê os extratos que você baixa do próprio banco, em OFX. Ele não se conecta com o banco nem usa o Open Finance: só lê os arquivos, sem alterar nem mover nada.

1. Baixe o extrato da conta e a fatura do cartão em OFX, pelo aplicativo ou pelo site do banco. O nome da opção muda de banco para banco, como "Exportar", "Salvar extrato" ou "Money/OFX".
2. Ponha os `.ofx` numa pasta e defina `COWORKIA_FINANCAS_PASTA` com o caminho dela. Extratos que se sobrepõem não repetem os lançamentos: o mesmo dia, valor e descrição em dois arquivos da mesma conta contam uma vez.
3. Se quiser, defina `COWORKIA_FINANCAS_CATEGORIAS` com as suas categorias, como `mercado=ASSAI,ATACADAO;academia=SMART FIT;outros=MERCADO PAGO`. Elas valem antes das do coworkIA.

As ferramentas mostram a conta só com os 4 últimos dígitos, como "Conta corrente final 3456", ou com "sem número", quando o banco manda um código no lugar do número, e o id dela muda quando o servidor reinicia. O resumo do mês deixa o pagamento da fatura e as aplicações e os resgates de investimento fora das entradas e das saídas, numa linha à parte. As limitações conhecidas:

- só o OFX é lido, e só em real; o CSV fica para depois;
- a data é a do banco, sem converter o fuso;
- as categorias são palavras na descrição e erram às vezes, e as suas corrigem;
- uma transferência entre as suas contas conta como entrada numa e saída na outra;
- um lançamento cuja data, valor ou descrição mude entre duas exportações conta duas vezes, e dois lançamentos iguais do mesmo dia, cada um num arquivo que não traz o outro, contam uma vez;
- no modo `google`, ler os extratos também pede o login do Google; o modo `arquivos` lê os extratos sem ele.

O formato OFX é público, mas cada banco o usa do seu jeito. O coworkIA foi feito a partir da especificação e medido com extratos de exemplo publicados por projetos abertos, mas ainda não com um extrato real.

## Avisos

- **Dados de terceiros e a LGPD:** o texto dos e-mails, da agenda, das conversas do WhatsApp e dos extratos vai para o provedor da IA que você usa. Num uso profissional, isso envolve dados de clientes e de colegas, e os extratos são dados financeiros.
- **Injeção de instrução:** um e-mail, uma mensagem ou a descrição de um PIX pode tentar mandar a IA fazer algo. O coworkIA nunca envia nada e marca o texto de terceiros como dado, mas a IA pode ter outras ferramentas. Use o coworkIA numa IA sem conectores que enviam e-mail ou mensagem, ou com a aprovação de cada chamada de ferramenta ligada.
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
