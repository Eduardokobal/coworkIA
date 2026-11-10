# Spec do modo arquivos: o WhatsApp e os extratos sem o Google (versão 1 do documento)

**Base:** a spec da versão 1 (`docs/specs/2026-11-04-versao-1.md`) e os adendos AD1 a AD18, a spec do WhatsApp (`docs/specs/2026-11-06-versao-2-whatsapp.md`) com os adendos AW1 a AW7, e a spec das finanças (`docs/specs/2026-11-09-versao-2-financas.md`) continuam valendo. Esta spec só acrescenta um modo. Quando ela cita uma regra de lá (como a AD9, a F1, a E1 ou a S2), é a regra de lá, sem mudança.

## 1. Por quê

Hoje, para ler as conversas exportadas do WhatsApp ou os extratos OFX de verdade, o coworkIA precisa do modo `google`, e esse modo exige o `.env` e o login do Google (AD9). Sem o login, o servidor nem sobe, e o WhatsApp e as finanças, que só leem pastas, ficam inacessíveis. A spec das finanças deixou isso para um assunto próprio (F-D9).

## 2. Decisões

Do Eduardo, pela caixa, em 2026-11-10:
- M-D1. O próximo assunto é usar as finanças e o WhatsApp sem o Google ("Finanças e WhatsApp sem o Google").
- M-D2. Um modo novo, só com as pastas; o modo `google` não muda ("Um modo novo, só com as pastas").
- M-D3. O nome do modo é `arquivos` ("arquivos").
- M-D4. As ferramentas de e-mail e agenda continuam na lista e respondem com uma mensagem fixa ("Respondem com uma mensagem fixa").
- M-D5. O desenho foi aprovado ("Está certo, pode escrever").

## 3. As regras

- **MA1. O valor novo.** A `COWORKIA_MODO` aceita `demo`, `google` e `arquivos`, e o padrão continua sendo `demo`. Um valor fora desses dá o erro "COWORKIA_MODO inválido: "X". Use demo, google ou arquivos.".
- **MA2. O que o modo `arquivos` lê.**
  - O WhatsApp lê a pasta da `COWORKIA_WHATSAPP_PASTA`, com o usuário da `COWORKIA_WHATSAPP_EU` e os importantes da `COWORKIA_WHATSAPP_IMPORTANTES`, como no modo `google` (F1, V1 e W3). As finanças leem a pasta da `COWORKIA_FINANCAS_PASTA`, com as categorias da `COWORKIA_FINANCAS_CATEGORIAS`, também como no modo `google` (E1 e G3). Sem uma variável, ou com uma pasta que não pode ser lida, as ferramentas dão as mesmas mensagens do modo `google`.
  - O modo `arquivos` não lê o `.env`, não toca no cofre do sistema e não chama o Google nem a rede. O servidor sobe sem o login.
  - A linha do log de partida diz "servidor MCP no modo arquivos", como nos outros modos.
- **MA3. O e-mail e a agenda.** No modo `arquivos`, o `listar_emails`, o `ler_email`, o `triagem_emails`, o `listar_eventos` e o `verificar_disponibilidade` continuam na lista de ferramentas, e cada um responde, como erro, a mensagem fixa:

  > O e-mail e a agenda não estão ligados no modo arquivos. Use o modo google para lê-los.

  O `criticar_rascunho`, que não lê nenhuma fonte, funciona como nos outros modos.
- **MA4. O resumo do dia.**
  - Na ferramenta `resumo_do_dia`, no modo `arquivos`, a saída traz a `data`, um campo `email_e_agenda` com `{ "aviso": "<a mensagem da MA3>" }` e a seção do `whatsapp`, como hoje (7.7 e AW5). Os campos do e-mail e da agenda (`triagem`, `urgentes`, `pede_resposta`, `eventos_de_hoje`, `conflitos`, `proximo_compromisso` e `aviso_proximo`) não aparecem.
  - No `npm run resumo`, o texto traz a linha do título, uma linha em branco, a linha "E-mail e agenda: <a mensagem da MA3>" e, depois, a seção do WhatsApp, como hoje.
  - Nos modos `demo` e `google`, o resumo não muda, e o campo `email_e_agenda` não aparece. As finanças continuam fora do resumo (F-D4).
- **MA5. O que não muda.** Os modos `demo` e `google` ficam iguais. O `npm run login-google` e o `npm run logout-google` continuam funcionando, em qualquer modo, porque não dependem da `COWORKIA_MODO`.
- **MA6. O README.**
  - Na tabela das variáveis, a `COWORKIA_MODO` passa a dizer "`demo`, `google` ou `arquivos` (o `google` precisa do login; o `arquivos` lê só o WhatsApp e os extratos; veja abaixo)", e as linhas da `COWORKIA_WHATSAPP_PASTA` e da `COWORKIA_FINANCAS_PASTA` passam a dizer "no modo `google` ou `arquivos`".
  - Entra uma seção curta, "Usar só o WhatsApp e os extratos", antes da seção do WhatsApp. Ela diz como ligar o modo `arquivos`, que ele não pede o login do Google nem o `.env`, quais variáveis ele usa e que as ferramentas de e-mail e agenda respondem que não estão ligadas.
  - As frases que dizem que ler o WhatsApp e os extratos de verdade pede o login do Google passam a citar o modo `arquivos` como a saída para quem não quer o Google.
- **MA7. Os testes.**
  - A configuração tem testes do valor `arquivos` e da mensagem do modo inválido com os três valores.
  - A aplicação tem testes de que o modo `arquivos` lê as pastas do WhatsApp e das finanças e não toca no `.env`, no cofre nem na rede, com os recursos do Google que falham se forem usados, como no teste do modo `demo`; e de que as mensagens da F1 e da E1 saem quando falta a variável.
  - O serviço tem testes de que as 5 ferramentas de e-mail e agenda dão a mensagem da MA3 e de que o resumo do dia traz o aviso no lugar do e-mail e da agenda, com o WhatsApp.
  - A saída tem testes do resumo no modo `arquivos`, na ferramenta e no terminal, e de que nos outros modos ele não muda.
  - O teste de ponta a ponta sobe o servidor no modo `arquivos`, sem nenhum `.env` e com uma pasta temporária com uma conversa exportada, e confere que ele oferece as 12 ferramentas, que o `listar_emails` dá a mensagem da MA3 e que o `listar_conversas` lê a conversa.

## 4. Segurança

- O modo `arquivos` lê menos que o `google`: nenhuma credencial, nenhum token e nenhuma chamada de rede. A S2 continua valendo para tudo o que ele mostra, como no WhatsApp e nas finanças.
- A mensagem da MA3 é texto fixo, sem nada de terceiros.

## 5. Fora desta spec

Ligar só o e-mail ou só a agenda sem o outro; um modo que junte o Google com as pastas de outra forma (o `google` continua lendo as pastas, como hoje); e qualquer mudança na demonstração.

## 6. Pendências que continuam

O teste com a conta real do Google, a M-W1 (uma exportação real do WhatsApp) e a M-F1 (um extrato real do banco), todos no PC do Eduardo. Com o modo `arquivos`, a M-W1 e a M-F1 passam a poder ser feitas sem o login do Google.
