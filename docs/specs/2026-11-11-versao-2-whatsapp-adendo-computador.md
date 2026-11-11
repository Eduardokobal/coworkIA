# Adendo à spec do WhatsApp (versão 2, parte 1), para a exportação do WhatsApp do computador

Aprovado pelo Eduardo junto com o plano da exportação do WhatsApp do computador.

**Versões:** a versão 1 (sha256 66f6aaec2a5604f7762a3aa285a9548c53cb90fc3ad92cf3646354fca9ac1fbe) recebeu CORRIGIR, pelo achado 129, e ANOTAR, pelo 130. A versão 2 (sha256 248e9258e55fe9613ce294c58af3fb7a6e7d3e9b8b19ae75d7c783ff8e6b535f) foi LIBERADA, com uma nota sem achado sobre a citação da S7. As seções "O que mudou", no fim, ligam cada mudança ao seu achado ou à nota.

**Por quê.** A medição M-W1 (seção 16 da spec do WhatsApp) foi feita em 2026-11-11 com uma exportação real do Eduardo, na máquina do DEV, que não é dele. A S7 da spec da versão 1 diz: "Neste PC, que não é do Eduardo, só roda o modo `demo`." A M-W1 previa o PC dele. O Eduardo escolheu pela caixa "Registrar como exceção", com este texto:

> A M-W1 da exportação do computador foi feita neste PC, como exceção à S7 e à M-W1, com um grupo em que só eu escrevo, lido pelo DEV só pela forma das linhas, com as cópias apagadas e os .zip removidos do PC.

Ele exportou, pelo WhatsApp do computador (o aplicativo do Windows ou o WhatsApp Web, sem extensão nem outro programa), um grupo em que só ele escreve. A medição foi do DEV: o arquivo foi copiado para uma pasta temporária do DEV e lido por um script que mostra só a forma das linhas e as marcas do WhatsApp, com o texto das mensagens trocado pelo número de caracteres, e as cópias foram apagadas em seguida. O auditor não viu o arquivo: ele reproduziu o resultado do leitor da main com linhas inventadas no mesmo formato. Antes desse arquivo, um primeiro `.zip`, com a conversa com outra pessoa, ficou na área de trabalho, e o DEV não o abriu. O Eduardo apagou os dois `.zip` e esvaziou a lixeira, e o DEV conferiu, procurando só pelos dois nomes, que nenhum deles está na área de trabalho, em Downloads ou na lixeira. O que a medição mostrou:
- a exportação é um `.zip` com dois arquivos, `chat.txt` e `chat.md`. A ajuda do WhatsApp já dizia, para a web e o computador, que "Seu histórico de conversas será exportado em um arquivo ZIP" (seção 16);
- no `chat.txt`, as mensagens são como `[9/21/26, 9:44:18 AM] Você: texto`, e os avisos, como `[9/21/26, 9:43:35 AM] - Você criou o grupo`, com o traço só nos avisos;
- a data tem o mês antes do dia: o primeiro número vai até 11, e o segundo, até 31. O ano tem 2 dígitos. A hora vai de 1 a 12, com os segundos, e o `AM` ou o `PM` vem depois de um espaço comum;
- o arquivo é UTF-8, sem BOM, com `\n` no fim das linhas e sem nenhum caractere U+200E, U+200F, U+202F ou U+00A0;
- a primeira linha repete, sem a data, o aviso da criptografia que vem na linha seguinte. As continuações de uma mensagem de várias linhas vêm sem prefixo, como no celular;
- o Windows da máquina está em português (pt-BR, com a data `dd/MM/yyyy` e a hora `HH:mm:ss`), e mesmo assim a data saiu em mês/dia, com AM ou PM. Com uma amostra só, a hipótese deste adendo é que o `.txt` do computador tem esse formato fixo;
- as mensagens do usuário vêm com o autor "Você", e não com o nome dele;
- a mídia e a mensagem apagada vêm como `<imagem ocultada>` (21 vezes), `<figurinha omitida>` (3), `<Mensagem de album>` (2) e `Mensagem apagada` (12). Os avisos são o da criptografia e "Você criou o grupo";
- o `chat.md` traz o dia por extenso (`## 21 de setembro de 2026`), a hora de 0 a 23 sem os segundos, as mensagens como `[9:44] **Você:** texto` e os avisos como `[9:43] __Você criou o grupo__`. A mídia vem como `[Imagem]`, `[Figurinha]` e `[Mensagem de album]`, e a mensagem apagada, como `_Mensagem apagada_`;
- os 62 blocos (60 mensagens e 2 avisos) batem nos dois arquivos, na data, na hora e no tipo, e os 24 textos que não são mídia nem mensagem apagada são iguais nos dois, com as várias linhas;
- o leitor da main (e725d87) lê 0 das 60 mensagens: nenhuma linha casa com a L1, 82 linhas são descartadas, e o `listar_conversas` mostra "formato não reconhecido.".

O grupo não tem outra pessoa, então a citação num grupo continua sem medição. As exportações do celular continuam medidas só com as amostras públicas (adendo do mês/dia).

O Eduardo escolheu pela caixa:
- "Ler o chat.txt", e não o `chat.md` nem só um aviso no README;
- "'Você' é sempre o usuário";
- "Regra geral com < e >", para a mídia;
- "Renomear, como no iPhone", para o nome da conversa;
- e aprovou o desenho com "Está certo, pode escrever";
- depois do parecer da versão 1, "Registrar como exceção" (achado 129) e "Incluir os dois na v2" (achado 130).

- **AW8. O formato do computador.** A L1 ganha um terceiro formato:
  - Computador: zero ou mais caracteres U+200E ou U+200F, `[`, a data, uma vírgula, um espaço, a hora, um espaço, `AM` ou `PM` e `]`, e depois ` - ` ou um espaço. Exemplos: `[9/21/26, 9:44:18 AM] Ana: oi` e `[9/21/26, 9:43:35 AM] - Ana criou o grupo`.
  - A data tem o formato `m/d/aa`, `mm/dd/aa`, `m/d/aaaa` ou `mm/dd/aaaa`, com o mês antes do dia. O ano com 2 dígitos é 2000 + aa, e uma data que não existe no calendário não casa.
  - Na hora, as horas vão de 1 a 12, com 1 ou 2 dígitos, e os minutos e os segundos têm 2 dígitos, de 00 a 59. Os segundos são opcionais. `12 AM` é 0 h, `12 PM` é 12 h, e de `1 PM` a `11 PM` somam 12 horas. `AM` e `PM` só valem em maiúsculas, depois de um espaço comum.
  - Com o traço (` - `), a linha é um aviso do WhatsApp (L2), mesmo que o texto tenha `: `. Como os outros avisos, ela não é mensagem, não conta como linha descartada e fixa o formato do arquivo. Sem o traço, vale a L2: a linha é uma mensagem quando tem "autor: texto", e sem `: ` é um aviso.
  - Nenhuma linha do Android ou do iPhone casa com este formato, e nenhuma linha dele casa com os outros dois. Como na L1, o formato do arquivo é o da primeira linha que casar, e depois uma linha em outro formato continua a anterior (L3).
  - Num arquivo no formato do computador, a primeira linha do arquivo, quando não casa com a L1, é descartada como na L3, mas não conta como linha descartada: ela é o aviso da criptografia repetido sem a data. As outras linhas antes da primeira mensagem continuam contando.
  - A L4 muda: a hora com AM ou PM só é reconhecida no formato do computador.
- **AW9. O "Você".** A V1 muda. No formato do computador, a mensagem cujo autor é exatamente "Você", com o V maiúsculo e o acento, é do usuário, mesmo que "Você" não esteja na `COWORKIA_WHATSAPP_EU`.
  - O leitor marca essa mensagem como do usuário. Tudo o que pergunta se uma mensagem é do usuário passa a aceitar a marca ou a lista da V1:
    - a V3, que conta os autores além do usuário para saber se a conversa é um grupo;
    - a seção 8, com o bloco que espera resposta, usado na triagem e no `esperando_voce` do `listar_conversas`;
    - o campo `sua` do `ler_conversa`.
  - A V4 não muda: "Você" não entra na busca de citações, que continua só com os nomes da `COWORKIA_WHATSAPP_EU`.
  - A V2 não muda: a variável continua obrigatória.
  - No Android e no iPhone, um autor "Você" continua seguindo só a V1.
  - As limitações conhecidas:
    - numa exportação do computador, um contato salvo com o nome "Você" conta como o usuário;
    - a linha forjada (L6) fica mais fácil: no formato do computador, ela não precisa do nome do usuário. Uma linha como `[9/21/26, 9:44:18 AM] Você: ok`, no meio de uma mensagem de várias linhas de outra pessoa, faz o bloco recomeçar ali, e a conversa parece respondida.
- **AW10. A mídia.** A L5 ganha, só no formato do computador, dois textos que não servem para as regras:
  - a mensagem cujo texto inteiro, já com as continuações da L3, começa com `<`, termina com `>` e não tem outro `<`, outro `>` nem quebra de linha no meio, como `<imagem ocultada>`;
  - a mensagem cujo texto é exatamente `Mensagem apagada`.

  Como na L5, ela conta como mensagem do autor, na hora dela. No Android e no iPhone, a L5 continua igual. A limitação conhecida: uma mensagem escrita por alguém só com um texto entre `<` e `>`, como `<oi>`, não entra na triagem.
- **AW11. A data impossível no formato do computador.** A AW4 vale também para o formato do computador, com a data lida como mês/dia: uma linha com a forma do formato do computador e uma data que não existe, como o mês 21, conta. Para um arquivo no formato do computador, o aviso da AW5 diz "dia/mês" no lugar de "mês/dia":

  > linhas com data impossível: N; a exportação pode estar no formato dia/mês, e as datas e as mensagens desta conversa podem estar erradas.

  Ele sai nos mesmos quatro lugares da AW5. No Android, no iPhone e num arquivo sem formato reconhecido, o texto da AW5 não muda.
- **AW12. O README.** Na seção "Ler as conversas do WhatsApp":
  - o passo 1 ganha, no fim, esta frase:

    > No WhatsApp do computador, a conversa exportada vem num `.zip` com um `chat.txt` e um `chat.md`: tire o `chat.txt` e renomeie o arquivo com o nome da conversa.

  - o passo 3 ganha, no fim, esta frase:

    > Na exportação do WhatsApp do computador, as suas mensagens aparecem como "Você", e o coworkIA as reconhece sem a variável, que continua necessária para as citações nos grupos e para as exportações do celular.

  - na lista das limitações, esta linha:

    > a hora com AM ou PM, os idiomas além do português e a mídia não são lidos;

    passa a ser estas duas:

    > a hora com AM ou PM só é lida na exportação do WhatsApp do computador, e os idiomas além do português e a mídia não são lidos;
    >
    > na exportação do WhatsApp do computador, um contato salvo com o nome "Você" conta como você, uma mensagem só com um texto entre < e > conta como mídia, e a linha que imita uma mensagem sua, no meio de uma mensagem de várias linhas, não precisa do seu nome: basta o "Você";

  - a última frase da seção, "O coworkIA foi feito a partir das variações conhecidas e medido com exportações de exemplo publicadas por projetos abertos, mas ainda não com uma exportação real.", passa a ser estas duas:

    > O coworkIA foi feito a partir das variações conhecidas e medido com exportações de exemplo publicadas por projetos abertos e com uma exportação real do WhatsApp do computador. As exportações do celular ainda não foram medidas com uma exportação real.
- **AW13. Os testes.**
  - O leitor tem testes do formato do computador:
    - a mensagem e o aviso com o traço, inclusive um aviso com `: ` no texto, que não vira mensagem;
    - a hora: `12:05:00 AM` é 0 h 05, `12:05:00 PM` é 12 h 05, `1:36:02 PM` é 13 h 36, e a hora sem os segundos;
    - as horas 0 e 13 com AM ou PM e o `am` minúsculo, que não casam;
    - o ano com 2 e com 4 dígitos;
    - a primeira linha sem prefixo, que não conta como descartada, e uma segunda linha sem prefixo antes da primeira mensagem, que conta;
    - as continuações;
    - a linha do computador num arquivo do Android, que continua a anterior, e a do Android num arquivo do computador;
    - a marca do usuário: o "Você" no formato do computador, que é do usuário, e o "Você" no Android, fora da lista, que não é;
    - a mídia: `<imagem ocultada>`, um `<áudio ocultado>` inventado, que cai na regra geral, `Mensagem apagada`, e `<a> e <b>`, que conta como texto; e o `<imagem ocultada>` no Android, que conta como texto;
    - a data impossível, como `[21/9/26, 9:43:35 AM]`, que conta.
  - A triagem tem testes do "Você" sem a variável, que fecha o bloco que espera resposta, que não conta como outro autor na V3 e que não vira citação num grupo. Um teste fixa a limitação da AW9: uma linha forjada com o "Você", no meio da mensagem de várias linhas de outra pessoa, recomeça o bloco, e a mensagem de antes dela sai do bloco.
  - A fonte tem teste do aviso da AW11 num arquivo do computador.
  - O serviço tem teste do campo `sua` do `ler_conversa` com o "Você" de uma exportação do computador.
  - A demonstração não muda.

**Fora deste adendo.** O `chat.md`, ler o `.zip` direto, a hora com AM ou PM nas exportações do celular (como a do iPhone americano, que põe um caractere U+202F antes do AM), o "You" e os outros idiomas, e a citação num grupo, que a amostra não teve. A M-W1 continua aberta para as exportações do celular e, na exportação do computador, para o que só outra pessoa produz: a citação num grupo e a mídia e a mensagem apagada de outra pessoa, que podem vir com outro texto (por exemplo, "Esta mensagem foi apagada") e, então, contar como texto.

## O que mudou da versão 1 para a 2

- **129, a M-W1 foi feita na máquina do DEV.** Pela S7 da spec da versão 1, nessa máquina só roda o modo `demo`, e a M-W1 previa o PC do Eduardo. O Eduardo escolheu pela caixa "Registrar como exceção", e o texto da opção entrou no "Por quê", com quem mediu (o DEV, pelo script de forma), o que o auditor fez (só reproduziu o leitor com linhas inventadas), o primeiro `.zip`, que não foi aberto, e a conferência de que os dois `.zip` saíram da máquina.
- **130, ANOTAR, os dois incluídos** (o Eduardo escolheu "Incluir os dois na v2"):
  - a AW9 e a limitação nova do README (AW12) dizem que, no formato do computador, a linha forjada (L6) não precisa do nome do usuário, e a AW13 ganha um teste que fixa esse efeito;
  - o "Fora deste adendo" põe na M-W1 aberta a mídia e a mensagem apagada de outra pessoa na exportação do computador.

## O que mudou da versão 2 para a 3

- **A nota do auditor sobre a S7, sem achado.** O "Por quê" e o item do 129 diziam que, pela S7, a máquina do DEV "só roda dados fictícios". A S7 diz "só roda o modo `demo`", e os dois trechos passaram a usar as palavras dela. Nada mais mudou.
