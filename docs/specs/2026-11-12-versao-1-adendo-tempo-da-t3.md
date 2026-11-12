# Adendo à spec da versão 1, para o tempo da regra de prazo (T3)

Aprovado pelo Eduardo junto com o plano do tempo da T3.

**Versões:** a versão 1 (sha256 09cbc801d5882419180be449300c8726fe434780e81e5e2854d2b0220a5c057b) recebeu CORRIGIR, pelos achados 153 e 154. A seção "O que mudou da versão 1 para a 2", no fim, liga cada mudança ao seu achado.

**Por quê.** Achado 149, do parecer do plano da `classificar_emails`. Para cada data numérica do texto, a T3 confere o "até" com uma expressão aplicada ao texto inteiro, do começo até a data (`ATE_ANTES_DA_DATA`, em `src/regras/triagem.ts`, linha 73 na main `5b0ed03`). Depois, ela resolve cada data com o "até" (DT2) e conta os dias até ela (H5). A W2 do WhatsApp (spec do WhatsApp, seção 8) usa a mesma função. O servidor roda numa linha só e fica parado nesse tempo. Não vaza nada, mas é o mesmo tipo do achado 124.

As medições, todas com a classificação de um e-mail cujo corpo é "ate 1/1 " repetido, o caso montado pelo auditor:

| Tamanho do corpo | Auditor, na main `36f8add` | DEV, na main `5b0ed03` |
|---|---|---|
| 12.496 caracteres | 367 ms | de 230 a 268 ms |
| 25.000 caracteres | 657 ms | de 537 a 598 ms |
| 50.000 caracteres | 1.498 ms | de 1.320 a 1.691 ms |
| 100.000 caracteres | 4.022 ms | de 3.531 a 4.284 ms |

O menor tamanho tem 1.562 repetições nas duas medidas. Cada número do DEV vem de 3 rodadas, depois de uma de aquecimento. Um texto comum de 50.000 caracteres leva 45 ms na medida do auditor. Na do DEV, com um texto sem datas, leva de 43 a 54 ms.

O tempo tem duas partes (achado 153):
- a do "até" cresce com o quadrado do tamanho. Medida à parte, só ela levou 29, 163, 665 e 2.434 ms nos 4 tamanhos;
- a conta de cada data com o "até" cresce com o tamanho. Com só o "até" consertado, os 100.000 caracteres ainda levaram de 1.627 a 1.683 ms.

Juntas, no caso medido, dobrar o corpo multiplica o tempo por 1,8 a 2,7, e não por 4.

O Eduardo escolheu pela caixa, em 2026-11-12:
- "Ciclo próprio, logo depois (Recomendado)", para o achado 149, no parecer do plano da `classificar_emails`;
- "Mesmo resultado, com atalhos (Recomendado)", para o desenho deste adendo.

- **AD19. O resultado não muda.** A T3 (7.3) e a W2 continuam com a mesma definição de prazo e o mesmo motivo. O prazo que decide continua sendo o primeiro que vence entre hoje e hoje + 2 dias (H5), nesta ordem: as datas numéricas com o "até", na ordem do texto, e depois as expressões fixas, na ordem da lista do 7.3. Para qualquer texto, data de referência e agora, a categoria e os motivos são os de antes deste adendo.
- **AD20. O "até" antes da data.** Para cada data numérica, a regra confere o "até" lendo o texto normalizado de trás para a frente, a partir da data, sem reler o texto do começo a cada data. A forma é a mesma da `ATE_ANTES_DA_DATA`. Aqui, espaço é todo caractere do `\s` do JavaScript, como na expressão de antes: entre eles, o espaço, o tab, a quebra de linha, o CR, o NBSP (U+00A0), o EM SPACE (U+2003), o U+2028 e o U+3000. O U+200B não é espaço. A N1 a N3 não trocam esses caracteres, e o NBSP é comum no e-mail que vem do HTML. Na ordem do texto, a forma tem:
  - o "ate", que começa no começo do texto ou depois de um caractere que não é letra nem dígito;
  - o "o" e o "dia", que podem faltar, nessa ordem, cada um com pelo menos um espaço antes;
  - os espaços até a data, que também podem faltar.

  Um caractere de fora do plano básico do Unicode, que ocupa dois códigos no texto, conta como um caractere só, como na expressão de antes.
- **AD21. Só as datas perto de hoje.** A conta da DT2 e da H5 só roda para a data numérica cujo dia e mês, e o ano, quando ele vem escrito, ficam entre hoje - 3 e hoje + 5, no calendário de agora.
  - As outras não podem vencer entre hoje e hoje + 2. A data do prazo é a meia-noite no fuso da referência, e os deslocamentos dos fusos vão de -12:00 a +14:00. Por isso, passar a data para o fuso de agora muda o dia do calendário em, no máximo, 2 dias.
  - A janela atravessa a virada do mês e do ano. Com o agora e a data do e-mail em 31/12/2026, "até 2/1" vira 02/01/2027, pela DT2, e vence em 2 dias. "Até 2/1/27" e "até 2/1/2027" também entram na janela, e "até 2/1/2026" não.
  - Cada data igual, com o mesmo dia, mês e ano escrito, ou com a falta dele, passa pela conta uma vez só, porque dá sempre o mesmo prazo. A data só é lembrada depois de passar pela conferência do "até". Uma data que aparece primeiro sem o "até" e depois com ele continua sendo prazo.
- **AD22. O tempo.** No caso medido acima, a classificação de um e-mail leva menos de 500 ms em cada um dos 4 tamanhos. A medida do DEV com um protótipo dos atalhos, sobre o `dist` da main `5b0ed03`, deu de 64 a 148 ms com 100.000 caracteres e de 28 a 58 ms com 50.000. O texto comum de 50.000 caracteres ficou entre 53 e 75 ms.
- **AD23. O código.**
  - `src/regras/triagem.ts` ganha a `primeiroPrazoProximo`, que recebe o texto, a data de referência e o agora e devolve o primeiro prazo que vence de 0 a 2 dias, com os dias, ou nulo.
  - A `regraT3` e a `regraW2` (`src/regras/triagem-whatsapp.ts`) passam a usá-la.
  - A `prazosNoTexto` e a `ATE_ANTES_DA_DATA`, que só a T3 e a W2 usavam, saem.
  - Nenhuma dependência nova.
- **AD24. Os testes.**
  - **A comparação com a forma de antes.** O teste tem uma cópia da forma de antes: a `ATE_ANTES_DA_DATA` e o laço sobre a `prazosNoTexto`. Os dois dão o mesmo motivo em pelo menos 20.000 textos sorteados, com semente fixa. Os textos misturam:
    - o "até", o "o", o "dia" e palavras parecidas, como "bate", "ateo" e "dias";
    - entre as palavras, um dos espaços da AD20, o U+200B ou nada;
    - uma letra e um dígito de fora do plano básico do Unicode, também colados no "ate";
    - datas de hoje - 4 a hoje + 4, sem ano e com o ano de 2 e de 4 dígitos, do ano da data, do anterior e do seguinte;
    - a mesma data repetida, com e sem o "até";
    - as expressões fixas.

    O agora é sorteado no calendário de 2026 a 2028, e cerca de metade das vezes cai numa ponta: o começo e o fim do mês e do ano, e o 28/02, o 29/02 e o 01/03, num ano bissexto e num comum. A data de referência fica a até 5 dias antes ou depois de agora. Os fusos são America/Sao_Paulo, Asia/Tokyo, Pacific/Kiritimati (+14:00), Etc/GMT+12 (-12:00) e UTC, com o agora no mesmo fuso da referência ou noutro.
  - **O "até" na ponta.** Casos escritos:
    - o "até" no começo do texto e depois de uma pontuação;
    - "até o dia", "até dia" e "até o" antes da data;
    - várias quebras de linha entre o "até" e a data;
    - o NBSP, o CR, o U+2028 e o U+3000 entre o "até" e a data, que contam como espaço, e o U+200B, que não conta;
    - "bate 05/11" e "ateo 05/11", que não são prazo;
    - uma letra de fora do plano básico logo antes do "ate", que também não é prazo.
  - **A virada e a data repetida.** Casos escritos:
    - com o agora e a data do e-mail em 31/12/2026: "até 2/1", "até 2/1/27" e "até 2/1/2027", que vencem em 2 dias, e "até 2/1/2026", que não;
    - com o agora e a data do e-mail em 28/02/2028, bissexto, "até 1/3", que vence em 2 dias; e em 28/02/2027, comum, "até 2/3", que também vence em 2 dias;
    - a mesma data primeiro sem o "até" e depois com ele, que continua sendo prazo, e com o "até" duas vezes, com o motivo de uma vez só.
  - **O tempo.** Os 4 tamanhos do caso medido, cada um com menos de 500 ms. Cada tamanho é medido na segunda classificação do mesmo e-mail, depois de uma de aquecimento. O teste também roda no CI, no Linux, e a primeira execução no PR mostra a margem lá.
  - Os testes da T3 e da W2 que já existem continuam passando sem mudança.

**Fora deste adendo.** Continuam sem ser prazo: "Preciso disso até amanhã." e "até amanhã às 10h" (7.3). Fica de fora também o tempo das outras regras num texto longo. A medida dele é a do texto comum acima.

## O que mudou da versão 1 para a 2

- **153, o "quadrado do tamanho".** O "Por quê" separa as duas partes do tempo, com as medidas de cada uma, e diz que, juntas, no caso medido, dobrar o corpo multiplica o tempo por 1,8 a 2,7. A primeira linha da tabela passa a ser 12.496 caracteres nas duas colunas.
- **154, as lacunas da prova da AD19.**
  - Os espaços: a AD20 diz que o espaço é o do `\s` do JavaScript, com a lista medida, e que o U+200B não é espaço. A AD24 sorteia esses caracteres entre as palavras e tem casos escritos com cada um.
  - A virada do mês e do ano: a AD21 diz que a janela atravessa a virada, com o exemplo de 31/12. A AD24 sorteia o agora no calendário, com as pontas do mês, do ano e de fevereiro, e tem casos escritos na virada e em fevereiro.
  - A data repetida: a AD21 diz que a data só é lembrada depois da conferência do "até". A AD24 tem os dois casos escritos.
- **A observação sobre o teste de tempo.** A AD24 diz que cada tamanho é medido depois de uma rodada de aquecimento e que o teste também roda no CI.
