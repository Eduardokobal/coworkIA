# Spec da ferramenta classificar_emails (a triagem dos e-mails trazidos pela IA)

Aprovada pelo Eduardo junto com o plano da ferramenta classificar_emails.

**Versões:** a versão 1 (sha256 55bf1ed6000ea4273d2fe84916e2f2c1ffc75dd44996663183cefb89861414f4) recebeu CORRIGIR, pelos achados 142 e 143, e ANOTAR, pelos 144 e 145. A versão 2 (sha256 93580357df925819c74eae42017ac9b4005f591c88d18fbd79c01b11ad2349cb) recebeu CORRIGIR, pelos achados 146 e 147. A versão 3 (sha256 70c75767f38c902b9838918231233b1c585276fdf05546117f023d2295b6c848) foi liberada, com o achado 148 para ANOTAR no plano. O parecer da versão 1 do plano trouxe os achados 149 e 150, para ANOTAR. As seções "O que mudou", no fim, ligam cada mudança ao seu achado.

**Por quê.** Para triar o e-mail, o coworkIA lê o Gmail pela API, com um cliente OAuth no Google Cloud, o `.env` e o login no cofre do sistema (o modo google). O Eduardo perguntou se a própria IA poderia ler o e-mail. Algumas IAs já têm conectores próprios para o e-mail. Com uma ferramenta que receba os e-mails da IA, a triagem do coworkIA passa a valer para qualquer e-mail que a IA consiga ler, sem nenhum login do Google no coworkIA.

O Eduardo escolheu pela caixa, em 2026-11-11:
- "Próximo assunto, depois do CI (Recomendado)", para a ideia de a IA buscar os e-mails pelo conector dela e passar ao coworkIA, só para a triagem;
- "Só os campos da triagem (Recomendado)", para o que a IA manda;
- "A IA manda em cada chamada (Recomendado)", para o endereço do usuário;
- "Categoria e motivos, sem o texto (Recomendado)", para o que a ferramenta devolve;
- "Em todos (Recomendado)", para os modos;
- e aprovou o desenho com "Está certo (Recomendado)";
- depois do parecer da versão 1: "Vazio conta como ausente (Recomendado)" (achado 143), "Incluir os dois (Recomendado)" (achados 144 e 145), "Genérico (Recomendado)" (o conector no README) e "Tirar o aviso (Recomendado)" (o aviso de terceiros na descrição);
- depois do parecer da versão 2: "Só as formas da lista (Recomendado)" (achado 147), em 2026-11-11, e "Sim, dizer na descrição (Recomendado)" (o cabeçalho longo, por uma observação do auditor), em 2026-11-12;
- depois do parecer da versão 1 do plano, em 2026-11-12: "Acrescentar a frase (Recomendado)" (achado 150) e "Ciclo próprio, logo depois (Recomendado)" (achado 149).

## 1. A ferramenta

- **CE1. O nome.** `classificar_emails`, com o título "Classificação dos e-mails trazidos pela IA". Ela existe nos três modos (`demo`, `google` e `arquivos`), não lê o e-mail sozinha, não grava nada e não usa a rede. A `triagem_emails`, que lê a caixa de entrada pela fonte do modo, não muda.
- **CE2. A entrada.**
  - `seu_endereco`: o endereço da conta que a IA leu, obrigatório, de 1 a 320 caracteres. É ele que a regra T5 compara com o Para de cada e-mail.
  - `emails`: a lista dos e-mails, de 1 a 200. Cada um tem:
    - `id`: o identificador do e-mail no conector, de 1 a 200 caracteres, só com letras sem acento, dígitos e os sinais `.`, `_`, `:`, `=`, `/`, `+` e `-`. Dois e-mails com o mesmo `id` numa chamada são recusados;
    - `de`: o remetente, com o `endereco` (de 1 a 320 caracteres), obrigatório, e o `nome` (até 200 caracteres), opcional;
    - `para`: os destinatários, de 0 a 100, cada um com o `endereco` e o `nome` opcional, como o `de`;
    - `cc`: opcional, de 0 a 100, no mesmo formato;
    - `assunto`: o texto do assunto, de 0 a 1.000 caracteres;
    - `data`: a data do e-mail no conector (o Gmail, por exemplo, mostra a de recebimento), numa destas formas: `AAAA-MM-DD`, ou `AAAA-MM-DDTHH:MM`, com ou sem os segundos (`:SS`), com ou sem a fração de segundo depois dos segundos (um ponto e de 1 a 9 dígitos, como `09:30:00.123`), e com ou sem o deslocamento (`Z` ou `±HH:MM`). O esquema confere a forma por um padrão, e depois a data é lida como no resto do coworkIA (spec da versão 1, H1 e H2): sem o deslocamento, no fuso da `COWORKIA_FUSO`; só com o dia, como 00:00 nesse fuso. As outras formas do ISO 8601 que o leitor de datas do coworkIA aceita, como o ano sozinho (`2026`) ou a semana (`2026-W46-3`), são recusadas;
    - `corpo`: o corpo em texto, de 0 a 50.000 caracteres;
    - `cabecalhos`: opcional, com dois campos opcionais, `list_unsubscribe` e `precedence`, cada um com até 2.000 caracteres, quando o conector os tiver.
- **CE3. A validação.** O servidor valida a entrada pelo esquema da ferramenta. Uma entrada fora da CE2 (um `id` com outro caractere ou repetido, mais de 200 e-mails, um campo maior que o limite, uma data fora das formas da CE2 ou que não existe no calendário, como `2026-02-30`, ou um campo obrigatório que falta) não é classificada: a ferramenta responde com o erro de validação, como as outras ferramentas.
- **CE4. As regras.** Cada e-mail da entrada vira um e-mail do domínio (o `Email` de `src/dominio.ts`):
  - o `corpoTexto` é o `corpo`, e o `corpoHtml` é nulo;
  - o `nome` ausente vira `""`, e o `cc` ausente vira a lista vazia;
  - o `lido` e o `temAnexo` são falsos;
  - os cabeçalhos entram com os nomes em minúscula, `list-unsubscribe` e `precedence`. Um cabeçalho vazio ou só com espaços conta como ausente e não entra (achado 143), porque a T1 olha só se o `list-unsubscribe` existe.

  A classificação é a mesma `classificar` da triagem de hoje (spec da versão 1, seção 7.3), com as regras T1 a T6, na mesma ordem, sem nenhuma mudança. O mesmo e-mail dá a mesma categoria e os mesmos motivos na `triagem_emails` e na `classificar_emails` quando a IA manda o mesmo texto analisável e os mesmos dois cabeçalhos (achado 142):
  - o texto analisável é o corpo em texto puro, sem as mensagens citadas. A `triagem_emails` tira a citação do texto e converte o HTML em texto; a `classificar_emails` tira a citação do `corpo`, mas não converte HTML. Um corpo em HTML ou com uma citação que o coworkIA não reconhece pode mudar o resultado: um prazo dentro da mensagem citada pode virar urgente (T3);
  - sem os cabeçalhos de lista, a T1 não reconhece a propaganda, e ela cai na primeira das outras regras que casar (achado 146): urgente pela T2, com um termo de urgência no assunto, como o e-mail de propaganda com "urgente" da demonstração; urgente pela T3, com um prazo próximo no corpo, como "até o fim do dia"; pede resposta pela T5, com uma pergunta ou um pedido, como "por favor", num e-mail com o usuário no Para; ou informativo pela T6, como a newsletter da demonstração.
- **CE5. O contexto.** O `enderecoUsuario` é o `seu_endereco` da chamada. Os remetentes importantes da T4 vêm da `COWORKIA_IMPORTANTES`, como na triagem. O agora é o relógio do servidor, e o fuso é o da `COWORKIA_FUSO`.
- **CE6. A saída.** Um objeto com:
  - `contagem`: o número de e-mails em cada categoria (`urgente`, `pede_resposta`, `informativo` e `propaganda`);
  - `analisados`: o número de e-mails recebidos;
  - `grupos`: os quatro grupos, na ordem da entrada, cada item só com o `id` e os `motivos`.

  Nenhum texto dos e-mails volta: nem o assunto, nem o corpo, nem o remetente. Os motivos saem das regras e só citam termos das listas do próprio coworkIA, como `T2: termo "urgente" no assunto` ou `T5: pedido "me avisa"`.
- **CE7. A descrição para a IA.** A descrição da ferramenta diz, em português:
  - que ela classifica e-mails que a IA já leu por outro conector de e-mail, com as regras de triagem do coworkIA;
  - que a IA deve mandar só os campos pedidos, o endereço da conta em `seu_endereco`, o corpo em texto puro e, quando der, sem as mensagens citadas;
  - que a IA deve mandar o `list_unsubscribe` e o `precedence` sempre que o conector os tiver, porque sem eles a propaganda não é reconhecida;
  - que o `list_unsubscribe` e o `precedence` podem ser cortados nos 2.000 caracteres sem mudar a triagem, porque a T1 só olha se o `list-unsubscribe` existe e se o `precedence` é `bulk`, `list` ou `junk`, e que um campo acima do limite faz a chamada inteira falhar;
  - que a `data` vai numa das formas da CE2, de preferência com o deslocamento, como `2026-11-11T09:30:00-03:00`;
  - que a resposta traz só o `id` e os motivos de cada e-mail, sem nenhum texto do e-mail.

  A descrição não traz o aviso de terceiros (`AVISO_DE_TERCEIROS`), porque a resposta não tem texto de terceiros nem a marcação que ele explica.

## 2. Segurança

- **CE8.** O conteúdo dos e-mails vem de terceiros, pela IA. A ferramenta só o lê para as regras e não o devolve, não o grava e não o põe em log. A saída não tem texto de terceiros: o `id` é restrito pela CE2, e os motivos saem das listas do coworkIA. Por isso a saída não precisa da preparação de terceiros (S2).
- A ferramenta não usa a rede, não lê arquivos e não toca no cofre. No modo `google`, ela não chama o Gmail.
- Nenhuma dependência nova.

## 3. O README

- **CE9.**
  - Na seção "Ligar numa IA", a frase das ferramentas ganha a `classificar_emails`, logo depois da `triagem_emails`.
  - Entre as seções "Usar só o WhatsApp e os extratos" e "Ler as conversas do WhatsApp", entra a seção nova:

    > ### Triar os e-mails pela sua IA
    >
    > Se a sua IA já lê o seu e-mail por um conector próprio, como os conectores de Gmail que algumas IAs oferecem, ela pode passar os e-mails ao coworkIA para a triagem, sem o login do Google no coworkIA. A ferramenta `classificar_emails` recebe os e-mails e o seu endereço e devolve, para cada e-mail, a categoria (urgente, pede resposta, informativo ou propaganda) e os motivos, com as mesmas regras da triagem. Ela funciona em todos os modos e não lê, nem guarda, nada sozinha.
    >
    > Se esse conector também envia e-mail, deixe ligada a aprovação de cada chamada de ferramenta, como diz a seção Avisos.
    >
    > Peça, por exemplo: "Busque os meus e-mails das últimas 24 horas pelo conector de e-mail e classifique com o classificar_emails do coworkIA."
    >
    > Cada chamada aceita até 200 e-mails, com o corpo em texto de até 50.000 caracteres. A resposta traz só o identificador e os motivos de cada e-mail, sem repetir o texto. A regra do remetente importante (T4) usa a `COWORKIA_IMPORTANTES`, como na triagem.
    >
    > Se o conector não der os cabeçalhos de lista (`List-Unsubscribe` e `Precedence`), a propaganda não é reconhecida e pode sair em qualquer outra categoria, até como urgente. Um corpo em HTML ou com as mensagens citadas também pode mudar a classificação.

## 4. Os testes

- **CE10.**
  - A entrada:
    - o `id` com cada sinal aceito, um caractere fora (um espaço, um acento) e um `id` repetido, recusado;
    - 0, 1, 200 e 201 e-mails;
    - cada limite de tamanho da CE2 na ponta e um a mais;
    - as datas aceitas: só com o dia, com a hora sem os segundos, com os segundos, com a fração de segundo (como `2026-11-11T09:30:00.123Z`), sem o deslocamento, com `Z` e com `-03:00`;
    - as datas recusadas (achado 147): o ano sozinho (`2026`), a semana (`2026-W46-3`), a forma do cabeçalho Date (`Wed, 11 Nov 2026 09:30:00 -0300`), um espaço no lugar do `T` e uma data que não existe (`2026-02-30`);
    - o `cc`, o `nome` e os `cabecalhos` ausentes.
  - As regras:
    - para os 21 e-mails da demonstração, a `classificar_emails` dá a mesma categoria e os mesmos motivos da `triagem_emails`, e-mail por e-mail, com o `corpo` montado como o `corpoTexto` ou, quando ele é nulo, como o `htmlParaTexto(corpoHtml, { cortarCitacao: true })`, e com os dois cabeçalhos passados (achado 142);
    - os casos medidos sem os cabeçalhos, como testes da limitação (achados 142 e 146): o e-mail de propaganda com "urgente" no assunto vira urgente (T2); a newsletter vira informativo (T6); e uma lista mandada ao usuário vira informativo sem pergunta nem pedido (T6), pede resposta com "por favor" (T5) ou com uma pergunta (T5), e urgente com "até o fim do dia" (T3);
    - um caso para cada regra, de T1 a T6, montado na entrada da ferramenta, com o T1 por cada um dos dois cabeçalhos, o T4 com a `COWORKIA_IMPORTANTES` e o T5 só com o `seu_endereco` no Para;
    - o `list_unsubscribe` e o `precedence` vazios ou só com espaços, que contam como ausentes: um e-mail com uma pergunta ao usuário continua pede resposta (achado 143).
  - A saída: os grupos na ordem da entrada, cada item só com o `id` e os `motivos`, e nenhum assunto, corpo, nome ou endereço da entrada aparece no texto da resposta.
  - Os modos: a ferramenta responde no `demo`, no `google` (com recursos do Google que falham se forem usados, como no teste do modo arquivos) e no `arquivos`.
  - De ponta a ponta: o servidor lista a `classificar_emails`, e uma chamada pelo cliente MCP devolve a classificação.

## 5. Organização do código

- A função do serviço (`src/servico.ts`) recebe a entrada já validada, monta os e-mails do domínio e o contexto e chama a `agrupar` da triagem.
- A saída (`src/saida/formatar.ts`) monta o objeto da CE6.
- O servidor (`src/servidor.ts`) registra a ferramenta, com o esquema da CE2 em zod e a descrição da CE7.

## 6. Fora desta spec

- O resumo do dia com os e-mails trazidos pela IA.
- Converter o corpo em HTML (a IA manda o texto) e os anexos.
- A `classificar_emails` buscar o e-mail sozinha ou guardar o resultado.
- Outros cabeçalhos além dos dois de lista, e os rótulos do Gmail (como a categoria Promoções).
- O tempo da T3 num corpo muito longo (achado 149), que vem num ciclo próprio, logo depois deste, porque muda a T3 e a CE4 não muda as regras.

## O que mudou da versão 1 para a 2

- **142, a igualdade com a triagem_emails.** A CE4 diz que a igualdade vale com o mesmo texto analisável e os mesmos dois cabeçalhos, e o que muda sem eles. A CE7 pede à IA os dois cabeçalhos e o corpo sem as citações. O README ganha o parágrafo da limitação. A CE10 monta o corpo dos e-mails só em HTML pelo `htmlParaTexto` e testa os dois casos medidos pelo auditor sem os cabeçalhos.
- **143, o cabeçalho vazio.** O Eduardo escolheu "Vazio conta como ausente (Recomendado)": a CE4 deixa de fora o cabeçalho vazio ou só com espaços, e a CE10 ganha o caso.
- **144, ANOTAR, incluído** (o Eduardo escolheu "Incluir os dois (Recomendado)"). A CE2 diz as formas da data, com o fuso, e que ela é a data do e-mail no conector; os limites de cada campo; e a recusa do `id` repetido. A CE4 diz que o `nome` ausente vira `""` e o `cc` ausente, a lista vazia. A CE10 testa as pontas.
- **145, ANOTAR, incluído.** O README fala, de forma genérica, dos "conectores de Gmail que algumas IAs oferecem" e do "conector de e-mail", sem citar nenhuma marca (o Eduardo escolheu "Genérico (Recomendado)").
- **A observação sobre o aviso de terceiros.** O Eduardo escolheu "Tirar o aviso (Recomendado)": a CE7 não traz mais o `AVISO_DE_TERCEIROS`.

## O que mudou da versão 2 para a 3

- **146, o que a propaganda vira sem os cabeçalhos.** A CE4 dizia que uma lista sem pergunta vira informativo. Ela passou a dizer que a propaganda cai na primeira das outras regras que casar, com um exemplo medido para cada uma (T2, T3, T5 e T6). O README diz que ela pode sair em qualquer outra categoria, até como urgente, e a CE10 ganha os quatro casos medidos pelo auditor numa lista mandada ao usuário.
- **147, as formas da data.** O Eduardo escolheu "Só as formas da lista (Recomendado)". A CE2 lista as formas aceitas, com a fração de segundo, e diz que o esquema as confere por um padrão antes de a data ser lida; as outras formas do ISO 8601 são recusadas. A CE3 recusa a data fora dessas formas ou que não existe no calendário. A CE10 testa as formas aceitas e as recusadas.
- **O cabeçalho longo, por uma observação do auditor.** O Eduardo escolheu "Sim, dizer na descrição (Recomendado)": a CE7 diz à IA que os dois cabeçalhos podem ser cortados nos 2.000 caracteres sem mudar a triagem, e que um campo acima do limite faz a chamada inteira falhar.

## O que mudou da versão 3 para a 4

- **150, o aviso de injeção.** O Eduardo escolheu "Acrescentar a frase (Recomendado)": a seção nova do README, na CE9, ganha um parágrafo que lembra a aprovação de cada chamada de ferramenta quando o conector da IA também envia e-mail, como a seção Avisos pede.
- **149, o tempo da T3.** O Eduardo escolheu "Ciclo próprio, logo depois (Recomendado)": o conserto fica fora desta spec, na seção 6, e o README não cita a limitação, porque o conserto vem em seguida.
