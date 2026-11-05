# Adendo à spec da versão 1, para o plano C

Aprovado pelo Eduardo junto com o plano C, em 2026-11-05.

- **AD9.** O AD4 deixa de valer: o modo `google` funciona depois do login. Sem o `.env` ou sem o login, o servidor e o `npm run resumo` param com uma mensagem que diz o que fazer.
- **AD10.** No modo `google`, a lista, a leitura e a triagem usam só a caixa de entrada (`labelIds=INBOX`). Os enviados, os rascunhos, o spam e a lixeira ficam de fora.
- **AD11.** No modo `google`, os filtros do `listar_emails` são os mesmos da demonstração (AD7), aplicados pelo coworkIA sobre a data interna do Gmail (`internalDate`), com o mesmo código (`src/fontes/filtro.ts`). Isso vale para o não lido, o período, o remetente e a busca.
  - A busca do Gmail (`q`) só estreita a janela: `is:unread`, `after:` e `before:`. As pontas vão em segundos desde 1970, com 1 segundo de folga em cada ponta.
  - A página de filtros da Gmail API diz que uma data na busca vale a meia-noite no fuso do Pacífico, e que, para outros fusos, a data deve ir em segundos ("pass the value in seconds instead"). A página não diz se a ponta entra, e por isso há a folga de 1 segundo.
  - Uma chamada lê no máximo 200 e-mails (o limite da triagem, 7.3). Quando o limite corta, ou quando passa do `limite` pedido, o `completo` sai falso.
- **AD12.** O e-mail não lido é o que tem o rótulo de sistema `UNREAD`. A documentação lista o `UNREAD` entre os rótulos de sistema, mas não afirma isso com essas palavras.
- **AD13.** Os cabeçalhos com palavras codificadas do RFC 2047 (`=?charset?B?…?=` e `=?charset?Q?…?=`) são decodificados, porque a documentação não diz se a API os entrega decodificados; um texto já decodificado passa igual. O corpo, que vem em base64url, é decodificado pelo charset da parte, com UTF-8 como padrão.
- **AD14.** O `.env` fica na pasta do coworkIA, ao lado do `package.json`, e traz `COWORKIA_GOOGLE_CLIENT_ID` e `COWORKIA_GOOGLE_CLIENT_SECRET`. Ele é lido com o `parseEnv` do Node, sem dependência nova. Nenhuma mensagem mostra um valor do `.env`.
- **AD15.** O login mostra o endereço de autorização no terminal, e a pessoa o abre no navegador; o coworkIA não abre o navegador sozinho. O retorno espera até 5 minutos. O token fica no cofre com o serviço `coworkia` e a conta `google-refresh-token`.
- **AD16.** As respostas da API nos testes são escritas à mão, nos próprios testes, a partir do formato documentado. Este PC não tem conta real (S7). O teste com a conta real fica com o Eduardo, no PC dele (seção 17).
