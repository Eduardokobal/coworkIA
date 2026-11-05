# Adendo à spec da versão 1, para o plano B

Aprovado pelo Eduardo junto com o plano B, em 2026-11-05.

- **AD1.** A variável `COWORKIA_AGORA` (opcional, ISO, lida no fuso do RQ7) fixa o relógio. Ela existe para os testes de ponta a ponta, que sobem o servidor como processo e precisam de um "agora" fixo (H8). Sem ela, vale o relógio do sistema.
- **AD2.** Os modelos da demonstração vão além dos dois da seção 10:
  - `{{dia±N}}`, só a data, para o início e o fim de um evento de dia inteiro;
  - `{{dia±N:dd/mm/aaaa}}`, a data com o ano, para o prazo vencido;
  - `{{agora±Nh}}` e `{{agora±Nmin}}`, relativos ao agora. Com eles, a triagem das últimas 24 horas tem e-mails em qualquer hora do dia;
  - `{{U+XXXX}}`, um caractere pelo código. Com ele, o e-mail malicioso não guarda caracteres invisíveis no arquivo (lição do achado 73).
  Um modelo desconhecido é erro.
- **AD3.** Arquivos além da seção 8:
  - `src/servico.ts`, a lógica das 7 ferramentas, sem MCP;
  - `src/aplicacao.ts`, que liga a configuração às fontes. A seção 8 põe essa ligação no `src/servidor.ts`; ela fica num arquivo à parte porque o `npm run resumo` também precisa dela, sem subir o servidor;
  - `src/saida/formatar.ts`, a preparação e a marcação na fronteira de saída;
  - `src/fontes/tipos.ts`, as interfaces;
  - `src/fontes/calendar-api.ts`, o evento no formato da Calendar API e a conversão para o domínio, usados pela demonstração e, no plano C, pelo modo google;
  - `src/fontes/demo/modelos.ts`, `src/fontes/demo/dados.ts` e `src/fontes/demo/fonte-demo.ts`.
- **AD4.** No plano B, `COWORKIA_MODO=google` recusa com "O modo google ainda não está disponível nesta versão. Use COWORKIA_MODO=demo.". O plano C liga o Google.
- **AD5.** O `npm test` roda o build antes (`pretest`), porque o teste de ponta a ponta sobe o `dist/cli.js`.
- **AD6.** O resultado de cada ferramenta é um texto com JSON. Um campo de terceiros vazio sai vazio, sem marcação. A data do `resumo_do_dia` sai em ISO (`2026-11-04`), como as outras datas da saída (H6); no terminal, ela sai como `04/11/2026`.
- **AD7.** No `listar_emails`, o `remetente` casa por parte do nome ou do endereço, sem diferença de maiúscula, e a `busca` casa por parte do assunto ou do corpo, depois da normalização da seção 5.
- **AD8.** No `listar_eventos` e no `verificar_disponibilidade`, a `minha_resposta` sai em português: "aceito", "recusado", "talvez" ou "sem resposta", e nulo quando o usuário não é convidado.
