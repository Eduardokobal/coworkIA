# Adendo à spec do WhatsApp (versão 2, parte 1), para o aviso do formato mês/dia

Aprovado pelo Eduardo junto com o plano do aviso do formato mês/dia.

**Versões:** a versão 1 (sha256 44449123313d9755cd2516d37e8735f422584df96e1000782d71e6b8693ad6e2) recebeu CORRIGIR, pelo achado 127, e ANOTAR, pelo 128. A seção "O que mudou da versão 1 para a 2", no fim, liga cada mudança ao seu achado.

**Por quê.** Na medição com amostras públicas de 2026-11-09 (spec das finanças, seção 15), uma exportação de um iPhone no formato americano, mês/dia, com o relógio de 24 horas (https://github.com/starkdmi/whats_json, `test/data/calendars`), mostrou uma limitação da parte 1. A coworkia-5c mediu o efeito inteiro no leitor da main, com dados inventados (achado 122):
- "1/7/23" e "1/8/23" saem como 1º de julho e 1º de agosto;
- as linhas com o dia acima de 12, como "7/13/23", não viram mensagem e grudam no texto da mensagem anterior (L3), sem nenhuma linha descartada e sem aviso;
- a triagem, o `ler_conversa` e o resumo do dia ficam errados, sem aviso.

O Eduardo escolheu pela caixa "Avisar, depois das finanças" (F-D13 da spec das finanças) e, no desenho deste adendo:
- "Avisar e continuar lendo";
- "No listar, no ler e na triagem";
- depois do achado 127, "Avisar também no resumo".

O leitor continua aceitando só o dia antes do mês (L1), e as linhas continuam sendo lidas como hoje. O que muda é que elas passam a ser contadas, e a conversa ganha um aviso, que chega também às ferramentas que ficavam erradas sem avisar.

A mesma medição leu, com o leitor da main, exportações de exemplo no formato brasileiro (dia/mês, 24 horas). Os arquivos foram baixados só na máquina do DEV, lidos e apagados, e as contagens foram conferidas por uma contagem feita por fora do leitor:
- do projeto rodrigogs/whats-reader (https://github.com/rodrigogs/whats-reader): `examples/chats/android-group-chat`, com 42 mensagens, e `examples/chats/android-private-chat`, com 43, e os testes `examples/parser-tests/french-format-test.txt` e `spanish-format-test.txt`, com 6 cada;
- do projeto starkdmi/whats_json (https://github.com/starkdmi/whats_json): `test/data/android/WhatsApp Chat with Dmitry S EN Android.txt`, com 59.

As do iPhone em inglês, com AM ou PM, ficaram de fora, como a L4 manda. É nisso que a frase nova do README se apoia (AW6).

- **AW4. A linha com data impossível.** É a linha que tem a forma do começo de mensagem da L1, com o prefixo, a data no formato `d/m/aaaa`, `dd/mm/aaaa`, `d/m/aa` ou `dd/mm/aa` e as horas de 0 a 23, mas cuja data não existe no calendário, como o mês 13 ou o 31/04.
  - Só a data conta. Uma linha com a data certa e os minutos ou os segundos acima de 59 continua não começando mensagem, como hoje, mas não conta, porque ela não indica o formato mês/dia.
  - Antes de o formato do arquivo ser fixado (L1), conta a linha com a forma de qualquer um dos dois formatos. Depois, só a do formato do arquivo; uma linha no outro formato continua a anterior, como hoje, e não conta.
  - A linha continua sendo lida como hoje: antes da primeira mensagem, ela é descartada e conta como linha descartada (L3); depois, ela continua a mensagem anterior. Ela não fixa o formato do arquivo.
  - O leitor conta essas linhas no arquivo inteiro.
- **AW5. O aviso.** Quando um arquivo tem uma ou mais linhas com data impossível, a conversa ganha este aviso, em que N é o número de linhas da AW4:

  > linhas com data impossível: N; a exportação pode estar no formato mês/dia, e as datas e as mensagens desta conversa podem estar erradas.

  O texto é fixo e não traz nada de terceiros. Ele sai em quatro lugares:
  - no `listar_conversas` (7.8), na lista dos avisos da pasta, com o nome da conversa passando pela S2, como nos outros avisos por arquivo. Ele vem depois do "formato não reconhecido." ou das linhas descartadas do mesmo arquivo, quando houver;
  - no `ler_conversa` (7.9), num campo novo, `aviso`, com o texto, quando a conversa lida tem linhas com data impossível; sem elas, o campo é nulo;
  - no `triagem_whatsapp` (7.10), numa lista nova, `avisos`, com um item para cada conversa da pasta que tem linhas com data impossível, na ordem dos arquivos. Cada item traz a `conversa`, com o nome passando pela S2, como no `listar_conversas`, e o `aviso`, com o texto. Sem nenhuma, a lista é vazia;
  - no resumo do dia (7.7):
    - na ferramenta `resumo_do_dia`, a seção do WhatsApp ganha a mesma lista `avisos` da triagem, num campo próprio. O campo `aviso`, que já existe, continua sendo só o da F1, quando a seção não existe;
    - no `npm run resumo`, quando há avisos, a seção do WhatsApp ganha, logo depois da linha da contagem, uma linha em branco, a linha "Avisos do WhatsApp:" e uma linha "- nome: aviso" para cada conversa, com o nome pelos passos 1 a 5 da S2, como os nomes das conversas na mesma seção. Sem avisos, a saída do terminal não muda.

  A conversa continua sendo lida, mesmo com o aviso. Uma linha com data impossível escrita por outra pessoa dentro de uma mensagem só gera o aviso; ela não esconde a conversa.
- **AW6. O README.** Na seção "Ler as conversas do WhatsApp":
  - a lista das limitações ganha, depois da linha da hora com AM ou PM, esta: "num celular configurado no formato mês/dia, como o dos Estados Unidos, com o relógio de 24 horas, as datas saem trocadas, e algumas mensagens se juntam à anterior. As ferramentas do WhatsApp e o resumo do dia avisam quando acham uma data que não existe, como o mês 13. Um arquivo em que todos os dias vão até 12 não dá para distinguir e sai sem aviso;";
  - a última frase passa a dizer que o coworkIA foi medido com exportações de exemplo publicadas por projetos abertos, mas ainda não com uma exportação real.
- **AW7. Os testes.**
  - O leitor tem testes da contagem:
    - no Android e no iPhone;
    - antes da primeira mensagem, onde a linha também conta como descartada, e depois dela, onde a linha continua a mensagem anterior;
    - com o mês 13 e o dia 31 de um mês de 30 dias;
    - os minutos 60 com a data certa, que não contam;
    - a linha no outro formato depois de o formato ser fixado, que não conta;
    - uma conversa brasileira sem nenhuma, com zero.
  - A fonte tem testes do aviso com o número e da falta do aviso com zero.
  - O serviço e a saída têm testes do campo `aviso` do `ler_conversa`, com e sem as linhas, da lista `avisos` da triagem e do resumo do dia, com a S2 no nome da conversa, e das linhas do `npm run resumo`, com e sem avisos.
  - A demonstração não muda. Nela, o `aviso` do `ler_conversa` sai nulo, os `avisos` da triagem e do resumo saem vazios, e a saída do `npm run resumo` não muda.

**Fora deste adendo.** Ler o formato mês/dia: o Eduardo escolheu avisar, e não ler, porque um arquivo em que todos os dias vão até 12 não dá para distinguir. A hora com AM ou PM continua não sendo reconhecida (L4). A medição M-W1, com uma exportação real do Eduardo, continua pendente.

## O que mudou da versão 1 para a 2

- **127, o resumo do dia ficava sem o aviso.** A seção do WhatsApp do resumo é a mesma triagem. O Eduardo escolheu pela caixa "Avisar também no resumo": a AW5 passou a citar o resumo do dia, na ferramenta e no terminal, e a AW6 e a AW7 acompanham.
- **128, ANOTAR, os dois incluídos:**
  - o "Por quê" registra as amostras do formato brasileiro, com os endereços e as contagens, em que a frase nova do README se apoia;
  - a AW4 passou a contar só a data que não existe. Os minutos ou os segundos acima de 59, com a data certa, não indicam o formato mês/dia e não contam.
