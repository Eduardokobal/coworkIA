# Adendo à spec do WhatsApp (versão 2, parte 1), com as medições de 2026-11-11 e o README

Aprovado pelo Eduardo junto com o plano das medições de 2026-11-11.

**Versões:** a versão 1 (sha256 2953067f5526975b09acbbe6eafbb4a8bd8fe36a78923db693747ac666e53d69) recebeu CORRIGIR, pelo achado 135, e ANOTAR, pelo 136. A seção "O que mudou da versão 1 para a 2", no fim, liga cada mudança ao seu achado.

**Por quê.** Depois do PR 15 (a exportação do WhatsApp do computador, adendo AW8 a AW13), o Eduardo fez mais duas medições do WhatsApp na máquina do DEV e decidiu sobre o teste com a conta real do Google. O README ainda dizia que as exportações do celular não tinham sido medidas e não falava do "@todos" nem do modo google sem uma conta real. Este adendo registra as medições, as decisões dele pela caixa e a mudança do README. O código não muda.

As duas medições seguiram o cuidado da medição do computador:
- o DEV leu só a forma das linhas, com scripts que o auditor leu antes de rodarem. Eles contam os autores sem os nomes e mascaram os avisos e as marcas: o que está entre aspas e cada palavra fora de uma lista de palavras do WhatsApp viram «•»;
- o auditor não viu os arquivos;
- as cópias do DEV foram apagadas, e o DEV conferiu, pelos nomes, a área de trabalho, Downloads e a lixeira.

A S7 da spec da versão 1 diz: "Neste PC, que não é do Eduardo, só roda o modo `demo`." Cada medição abaixo é uma exceção a ela, por decisão do Eduardo.

**A exportação do celular.**
- A decisão: o Eduardo escolheu "Fazer agora (Recomendado)", com este texto:

  > Você exporta pelo celular o mesmo grupo em que só você escreve, sem mídia, e traz o arquivo para cá. Eu leio só a forma das linhas e apago as cópias depois. Como este PC não é seu, isso fica registrado como uma nova exceção à regra S7, como a de hoje.

- O arquivo veio de um celular Android, num `.zip` com um `.txt`, pelo WhatsApp Web nesta máquina. Além do script, o DEV rodou um comando que leu só dados do autor (se é "Você", se parece um telefone e quantas palavras e caracteres tem), declarado ao auditor depois de rodar.
- O que a medição mostrou:
  - as linhas seguem a L1 do Android: `dd/mm/aaaa hh:mm - `, com 24 horas, sem segundos e sem caracteres invisíveis;
  - há 1 autor, com 61 mensagens. As mensagens do usuário vêm com um nome de uma palavra, e não com "Você", então a V1 (a `COWORKIA_WHATSAPP_EU` com esse nome) basta;
  - a mídia vem como `<Mídia oculta>` (24 vezes), que a L5 já trata, e a mensagem apagada pelo próprio usuário vem como `Mensagem apagada` (13 vezes), que no Android conta como texto. Isso não pesa na triagem, porque a mensagem é do usuário;
  - os avisos são o da criptografia e o de criação do grupo, que saiu como "Você criou «•» grupo", porque a palavra do meio não estava na lista do script;
  - o leitor da main leu tudo: formato Android, 61 mensagens, 24 sem texto, 0 linhas descartadas e 0 datas impossíveis.
- A limpeza: o Eduardo escolheu "Pode apagar o .zip você", e o DEV apagou o arquivo. Sobre a mensagem por onde ele veio, o Eduardo escolheu "Sim, já apaguei".
- A conta do WhatsApp dele ficou aberta nesta máquina (achado 131). Ele escreveu: "eu vou desconectar, nao precisa fazer isso".

**O grupo de teste, para o que só outra pessoa produz.**
- As decisões:
  - primeiro, ele escreveu "Irei pegar um grupo aqui e exportar, apenas medimos o caso e depois apagamos os registros desse grupo" e escolheu "Sim, com o script mascarado (Recomendado)". O auditor registrou isso como risco aceito (achado 132);
  - por sugestão do auditor, ele trocou o grupo real por "Grupo de teste com consentimento (Recomendado)", com este texto:

    > Você cria um grupo novo com uma pessoa que concorde. Ela cita você com @, manda uma foto e apaga uma mensagem, só com texto inventado. Mede os mesmos casos sem dados reais de ninguém.

  - o caminho do arquivo foi "Pelo WhatsApp deste PC", com a desconexão no fim.
- O que a medição mostrou:
  - o arquivo é do Android, com 8 mensagens;
  - as 4 `<Mídia oculta>` são de um mesmo autor;
  - os avisos de participantes começam com U+200E;
  - nenhuma citação tem a forma de um nome. O único `@` tem a forma `@aaaaa.aaaa.aa)`, com as letras trocadas por "a", que é também a forma de um endereço de e-mail;
  - o arquivo tem 3 "autores" num grupo de duas pessoas. Sem ler o texto, isso fica sem explicação: pode ser um aviso com `: ` no meio (L2) ou o mesmo contato com duas formas de nome (V3).
- Pela caixa:
  - à pergunta de como a citação aparece no arquivo, o Eduardo respondeu "se nao me engano é @all (todos) não o meu @";
  - à pergunta de como aparece a mensagem que a pessoa apagou com "Apagar para todos", ele escolheu "Não aparece".
- A leitura:
  - a pessoa citou o grupo todo, mas a forma dessa citação na exportação não foi medida: o único `@` do arquivo pode ser um e-mail. Pela V4 (a `citaUsuario`, em `src/regras/triagem-whatsapp.ts`), só os nomes da `COWORKIA_WHATSAPP_EU` contam como citação, então a citação ao grupo todo não cita o usuário, qualquer que seja a forma dela no arquivo. A V3 conta quem escreveu, e não quem participa: num grupo em que só uma outra pessoa escreveu, a conversa conta como individual, e a citação não muda a triagem. No arquivo do grupo de teste, o script contou 3 autores, e com pelo menos 2 além do usuário a V3 veria um grupo;
  - nessa exportação do Android, a mensagem que a outra pessoa apagou para todos não apareceu, então ela não chegou à triagem. É uma exportação só, e isso não vale para todo Android;
  - a mídia de outra pessoa provavelmente vem como `<Mídia oculta>`.
- A limpeza: o Eduardo escolheu "Apague o .zip você; o resto eu faço", e o DEV apagou o arquivo. Sobre a mensagem por onde ele veio e a desconexão desta máquina, ele escolheu "Sim, as duas".
- Depois, o Eduardo escolheu fazer o "@todos" contar como citação e medir antes. Mas ele apagou o grupo de teste ("agora apaguei o grupo, entao vamos deixar isso anotado apenas") e escolheu "Só anotar no README (Recomendado)". As frases do README (AW14) foram aprovadas por ele com "Estão certas (Recomendado)" e, depois de duas precisões pedidas pelo auditor (não dar a forma da citação ao grupo todo como medida e não generalizar a mensagem apagada para todo Android), com "Aprovo as frases novas (Recomendado)".

**O Google.**
- O Eduardo escolheu "Aqui, com os cuidados (Recomendado)" para testar a conta real do Google nesta máquina, e o auditor registrou isso como risco aceito (achado 133). O auditor deu o "pode" a um roteiro, com o nome do app na tela de consentimento como achado 134.
- Depois, o Eduardo não escolheu o teste, e nada rodou: nem no Google Cloud, nem no `.env`, nem no cofre.
- O README passa a dizer que o modo google não foi testado com uma conta real.

- **AW14. O README.**
  - Na seção "Usar o Gmail e a Agenda de verdade", depois do parágrafo do login de 7 dias, entra este parágrafo:

    > O modo google foi testado com os dados de demonstração e com testes automáticos, mas ainda não com uma conta real do Google.

  - Na seção "Ler as conversas do WhatsApp", na lista das limitações, esta linha:

    > a citação pelo número de telefone não é reconhecida, e um aviso do WhatsApp com ": " no meio pode virar uma mensagem;

    passa a ser:

    > a citação pelo número de telefone e a citação ao grupo todo não são reconhecidas, porque só contam os nomes da `COWORKIA_WHATSAPP_EU`, e um aviso do WhatsApp com ": " no meio pode virar uma mensagem;

  - Na mesma seção, a última frase, "O coworkIA foi feito a partir das variações conhecidas e medido com exportações de exemplo publicadas por projetos abertos e com uma exportação real do WhatsApp do computador. As exportações do celular ainda não foram medidas com uma exportação real.", passa a ser estas três:

    > O coworkIA foi feito a partir das variações conhecidas e medido com exportações de exemplo publicadas por projetos abertos e com exportações reais do WhatsApp do computador e de um celular Android. Numa exportação do Android, a mensagem que outra pessoa apagou para todos não apareceu. A exportação do iPhone e a citação com o @ do seu nome ainda não foram medidas com uma exportação real.

- **AW15. Os testes.** Nenhum teste muda, porque o comportamento não muda. O fechamento roda a suíte inteira, o lint, os tipos, o build e as travas.

**Fora deste adendo.**
- A regra do "@todos": o Eduardo escolheu só anotar.
- A "Mensagem apagada" do próprio usuário no Android, que conta como texto.
- A exportação do iPhone e a citação com o @ do nome do usuário.
- O teste com a conta real do Google: o roteiro e o script das contagens ficam guardados na máquina do DEV, com o achado 134.
- A M-W1 continua aberta para esses pontos.

## O que mudou da versão 1 para a 2

- **135, a V3 no grupo de duas pessoas.** A versão 1 dizia que, num grupo só com o usuário e uma pessoa, a V3 trata a conversa como individual. A V3 conta quem escreveu, e não quem participa, e o arquivo do grupo de teste tinha 3 autores. A frase passou a dizer isso, com o texto pedido pelo auditor. O README não muda, porque a linha do grupo em que só uma outra pessoa falou já diz do jeito certo.
- **136, ANOTAR, incluído** (o Eduardo escolheu "Incluir na v2 (Recomendado)"). A versão 1 dava o aviso de criação do grupo, na exportação do celular, como "Você criou este grupo". A palavra do meio saiu mascarada, porque não estava na lista do script, e não foi medida. O adendo passou a dar a forma mascarada.
