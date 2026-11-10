# Spec da versão 2 do coworkIA, parte 2: as finanças por extrato (versão 4 do documento)

**Base:** a spec da versão 1 (`docs/specs/2026-11-04-versao-1.md`), os adendos AD1 a AD18 e a spec do WhatsApp (`docs/specs/2026-11-06-versao-2-whatsapp.md`, com o adendo AW1 a AW3) continuam valendo. Esta spec só acrescenta. Quando ela cita uma regra de lá (como a S2, a N5 ou a H2), é a regra de lá, sem mudança.

**Versões:** a versão 1 (sha256 9dd0bf7d7a8d321eddcac9dbe3fca540b17a34e811bd8f63d88f4ab08e38a690) recebeu CORRIGIR, com os achados 116 a 119, e ANOTAR, com o 120 e o 121. A seção 17 liga cada mudança ao seu achado. A versão 2 (sha256 e5fe78eb5f802d40ed94c7081dbe96172bf614798a9b48495d802e0ecb55a866) foi LIBERADA e aprovada pelo Eduardo. Depois, a medição com amostras públicas (seção 15) mostrou que o FITID não serve para achar os repetidos, e o Eduardo decidiu as mudanças da versão 3 (F-D10 e F-D11). A seção 18 diz o que mudou. A versão 3 (sha256 79f66645cc5a68d1a4f77b33a80e98cb6642f9b0294fea5639bb691d93beb789) foi LIBERADA, com o ANOTAR 122 (o WhatsApp da main) e o 123 (precisões), e o Eduardo escolheu uma versão 4 pequena com as precisões (F-D12). A seção 19 diz o que mudou.

## 1. Objetivo

Dar à IA os extratos que o usuário baixa do próprio banco, em OFX, para listar e buscar os lançamentos e resumir um mês: as entradas, as saídas e o total por categoria e por conta. O coworkIA só lê os arquivos e nunca conecta com o banco.

## 2. Decisões

Do Eduardo, pela caixa, em 2026-11-09:
- F-D1. A IA lê e resume por categoria: lista e busca os lançamentos e faz o resumo do mês, com as categorias por regras fixas e testadas ("Ler e resumir por categoria").
- F-D2. O coworkIA lê só o OFX. O CSV fica para depois, se fizer falta ("Só OFX").
- F-D3. As categorias são as fixas do coworkIA e as do usuário, numa variável. As do usuário valem antes ("Fixas e as do usuário").
- F-D4. As finanças não entram no resumo do dia ("Não entra").
- F-D5. O coworkIA lê a conta corrente e o cartão de crédito. O pagamento da fatura fica numa categoria própria, fora do total, para o gasto do cartão não contar duas vezes ("Conta e cartão").
- F-D6. O desenho foi aprovado ("Está certo, pode escrever"): a pasta com os `.ofx`, o OFX antigo e o novo sem dependência nova, a conta só com os 4 últimos dígitos, sem duplicar extratos sobrepostos, as duas ferramentas novas e a demonstração com um extrato malicioso.
- F-D7. O `id` da conta é novo a cada sessão: ele vem de uma chave aleatória criada quando o servidor sobe, e nada é guardado ("Novo a cada sessão", achado 116).
- F-D8. As aplicações e os resgates de investimento ganham a categoria fixa "investimentos", fora das entradas e das saídas, como o pagamento da fatura. O estorno entra como entrada na categoria do gasto ("Investimento fora do total", achado 121).
- F-D9. No modo `google`, as finanças continuam pedindo o login do Google, como o resto do modo (AD9). Separar as finanças e o WhatsApp do login fica para um assunto próprio ("Deixar para depois", achado 121).

Do Eduardo, pela caixa, em 2026-11-09, depois da medição com amostras públicas (seção 15):
- F-D10. Os repetidos são achados pelo conteúdo, e não pelo FITID: entre arquivos diferentes da mesma conta, a mesma data, o mesmo valor e a mesma descrição contam uma vez; no mesmo arquivo, todos contam (O11, "Pelo conteúdo").
- F-D11. Quando o `ACCTID` não é um número de conta, como um código com letras, o rótulo diz "sem número", em vez de inventar um final com os dígitos soltos do código (O10, a opção Usar "sem número").

Do Eduardo, pela caixa, em 2026-11-09, depois do parecer da versão 3:
- F-D12. Uma versão 4 pequena com as precisões do achado 123: o número mascarado (com `*` ou `X`) conta como número de conta e dá o final, e o código com outras letras continua "sem número" (O10); o "mais um" dos FITIDs do Santander e a fonte do `X` entram na seção 15 ("Fazer uma v4 pequena").
- F-D13. A limitação do WhatsApp achada na medição (achado 122) ganha um aviso num ciclo próprio, logo depois do PR das finanças, e fica fora desta parte (seção 15, "Avisar, depois das finanças").

## 3. Requisitos

- RF1. O RQ3 vale também aqui: o coworkIA só lê os arquivos da pasta. Ele nunca os altera, apaga ou move, nunca conecta com o banco e não usa o Open Finance.
- RF2. O RQ4 passa a incluir a descrição de cada lançamento, que é texto de terceiros: um PIX pode trazer a mensagem de quem mandou. Ela passa pela S2, e a marcação do passo 6 usa `origem="extrato"`.
- RF3. O RQ5, o RQ6 e o RQ8 valem iguais: nenhum teste usa um extrato real, nenhum segredo aparece, e nenhum log traz um lançamento, um valor ou um número de conta.
- RF4. O dinheiro é guardado em centavos, como número inteiro, e nunca como número com casas decimais. Cada valor tem até 11 dígitos na parte inteira (O5), e as somas usam inteiros de precisão arbitrária (o `BigInt`), para nenhuma conta passar do maior inteiro exato do JavaScript.
- RF5. O número da conta, que vem do `ACCTID`, nunca sai inteiro: só os 4 últimos dígitos, no rótulo (O10). O `id` da conta não deixa chegar ao número (O10). O código do banco não sai. A descrição de um lançamento e o nome de um arquivo saem como estão, com a S2, e podem trazer um número de conta que o próprio banco ou o usuário escreveu neles.

## 4. A pasta e os arquivos

- E1. No modo `demo`, a pasta é `dados-demo/financas/`. No modo `google`, ela vem da variável `COWORKIA_FINANCAS_PASTA`. Sem a variável, as ferramentas das finanças respondem "Defina COWORKIA_FINANCAS_PASTA com a pasta dos extratos OFX.". Com a variável, mas com uma pasta que não existe ou não pode ser lida, elas respondem "A pasta de COWORKIA_FINANCAS_PASTA não pôde ser lida; confira se ela existe.", sem a mensagem de erro do sistema.
- E2. Só entram os arquivos terminados em `.ofx`, sem diferença de maiúscula (`.OFX` também entra), que estão direto na pasta, sem subpastas. São lidos até 200 arquivos, na ordem dos nomes pelas unidades de código UTF-16 (a ordem do `sort()` padrão do JavaScript: "B.ofx" vem antes de "a.ofx"), e cada um com até 5 MB. Um arquivo maior fica de fora, com um aviso. Passar de 200 arquivos também dá um aviso, com o número dos que ficaram de fora. Só entram arquivos comuns: um link simbólico, ou qualquer outro tipo de entrada, fica de fora e nunca é seguido. Um arquivo que não puder ser lido fica de fora, com o aviso fixo "o arquivo não pôde ser lido e ficou de fora.", sem a mensagem de erro do sistema, e os outros são lidos.
- E3. A codificação: o arquivo é lido como UTF-8 quando os bytes são UTF-8 válido; senão, como Windows-1252. O que o cabeçalho declara não decide, porque o `CHARSET` declarado pode não ser o real (seção 15). Uma marca de ordem de bytes (BOM) no começo sai, e o fim de linha pode ser `\r\n` ou `\n`.
- E4. O aviso de um arquivo sai com o nome do arquivo, que passa pela S2 (como um nome, 200), no campo `nome`, com o `id` "pasta" na marcação, como no WhatsApp. Um arquivo sem nenhum extrato (O2) dá o aviso "formato não reconhecido.". Os outros avisos da leitura estão na seção 5.
- E5. Qualquer erro do leitor num arquivo deixa só aquele arquivo de fora, com o aviso "formato não reconhecido." e sem a mensagem do erro. Os outros arquivos são lidos.

## 5. A leitura do OFX

A seção 15 diz de onde vem cada regra.

- O1. Os dois formatos:
  - o OFX 1.x tem um cabeçalho de linhas `CHAVE:VALOR` (como `OFXHEADER:100` e `DATA:OFXSGML`) e um corpo em que os elementos, como `<TRNAMT>`, podem vir sem a marca de fechamento;
  - o OFX 2.x é XML, com a declaração `<?xml …?>`, o cabeçalho `<?OFX …?>` e todas as marcas fechadas.
  O leitor não valida o documento inteiro: ele procura os extratos e os lançamentos pelas marcas e lê o valor de cada elemento até o próximo `<` ou o fim da linha.
  - Uma marca é `<NOME>` ou `</NOME>`, e casa pelo nome inteiro, sem diferença de maiúscula: `<STMTRS>` não casa com `<STMTTRNRS>`, e `<STMTTRN>` não casa com `<STMTTRNRS>`.
  - No texto de um elemento, as entidades `&lt;`, `&gt;`, `&amp;`, `&quot;`, `&apos;` e as numéricas (`&#233;` e `&#xE9;`) viram o caractere, numa passada só: o que sai de uma entidade não é lido de novo, e `&amp;lt;` vira `&lt;`.
  - Uma entidade numérica de zero, acima de U+10FFFF ou de U+D800 a U+DFFF vira U+FFFD. Um nome que não está na lista (como `&nbsp;`) fica como está escrito.
- O2. Um extrato é um `<STMTRS>`, da conta, ou um `<CCSTMTRS>`, do cartão. Um arquivo pode ter mais de um. Da conta, o leitor tira o `BANKID`, o `ACCTID` e o `ACCTTYPE`, de dentro do `<BANKACCTFROM>`. Do cartão, o `ACCTID`, de dentro do `<CCACCTFROM>`. Também tira a moeda (`CURDEF`) e o saldo (O9).
- O3. Só a moeda `BRL` é lida. Um extrato em outra moeda fica de fora, com o aviso "extrato em outra moeda, que não é lida.".
- O4. Um lançamento é um `<STMTTRN>` dentro do `<BANKTRANLIST>` do extrato. Ele precisa de um `TRNAMT` e de um `DTPOSTED` válidos (O5 e O6). Sem eles, ele é descartado, e o arquivo ganha o aviso "lançamentos descartados: N.".
- O5. O valor (`TRNAMT`): um sinal opcional (`-` ou `+`), de 1 a 11 dígitos e, se houver centavos, um separador decimal, ponto ou vírgula, seguido de 1 ou 2 dígitos. Os espaços das pontas saem. O valor vira centavos (RF4): "-0,5" e "-0,50" são -50 centavos, e "-0,05" é -5. O valor zero é válido: o lançamento aparece na lista e não soma nas entradas nem nas saídas, e "-0" vira 0. Qualquer outra forma, como um separador de milhar, 3 casas decimais ou mais de 11 dígitos, invalida o lançamento.
- O6. A data (`DTPOSTED`): a data do lançamento são os 8 primeiros dígitos (`AAAAMMDD`), como estão escritos, sem converter o fuso, e a data tem de existir no calendário. O resto (a hora, os milésimos e o fuso entre colchetes) é ignorado. O motivo: pela especificação, uma data sem fuso é meia-noite em GMT, e convertida para o fuso do Brasil ela cairia no dia anterior. A data do extrato é a data do banco, e é ela que o usuário vê no aplicativo. A medição M-F1 confere.
- O7. A descrição: o `NAME` e o `MEMO`, cada um sem os espaços das pontas. Quando os dois existem e são diferentes, a descrição é "NAME / MEMO". Quando só um existe, ou os dois são iguais, é esse. Sem nenhum, é "(sem descrição)".
- O8. O sinal: o valor é do ponto de vista do cliente. Negativo é saída (uma compra no cartão ou um débito na conta). Positivo é entrada (um crédito na conta, um pagamento ou um estorno no cartão).
- O9. O saldo: o `<LEDGERBAL>` do extrato, com o valor (`BALAMT`, como na O5, com o sinal) e a data (`DTASOF`, como na O6). Um extrato sem ele, ou com um dos dois inválido, fica sem saldo. O saldo de uma conta é o do extrato com a `DTASOF` mais nova; num empate, o do extrato que vem por último na ordem dos arquivos (E2) e, no mesmo arquivo, o último.
- O10. A conta:
  - a chave da conta é "tipo|BANKID|ACCTID", com o tipo `conta` ou `cartao` e o `BANKID` vazio no cartão. Ela só serve para juntar os extratos da mesma conta e nunca sai;
  - o `id` são os 12 primeiros caracteres hexadecimais do HMAC-SHA256 da chave da conta, com uma chave secreta aleatória de 32 bytes criada quando o servidor sobe, guardada só na memória e nunca gravada nem impressa. Ele muda quando o servidor reinicia (F-D7). Ele é opaco: sem a chave secreta, não leva ao número da conta, e nunca vira caminho. Nos testes, a chave secreta é fixa;
  - o rótulo é texto fixo do coworkIA, com os 4 últimos dígitos do `ACCTID` (só os dígitos; com menos de 4, todos eles): "Conta corrente final 1234" (`CHECKING`), "Poupança final 1234" (`SAVINGS`), "Conta final 1234" (outro `ACCTTYPE`) ou "Cartão final 1234";
  - o final só sai quando o `ACCTID` é um número de conta, inteiro ou mascarado: só dígitos, espaços, pontos, traços, barras, asteriscos e a letra `X` (ou `x`), com pelo menos um dígito. O `X` é o dígito verificador de alguns bancos ("1234.5678-X", seção 15) e, como o asterisco, a máscara de um cartão ("5555 XXXX XXXX 1234" e "************1234"). Fora disso, o final é "sem número" (F-D11 e F-D12). Por exemplo, "12345-6", "1234.5678-X", "5555 XXXX XXXX 1234" e "************1234" dão "final 3456", "final 5678", "final 1234" e "final 1234", e "0f3c9a2e-5b7d-4c1e-8a6f-2d9b4e7c1a35", um código com outras letras que não é o número impresso no cartão, dá "Cartão final sem número". Uma máscara que escondesse o fim do número daria um final errado; a M-F1 confere o `ACCTID` do cartão.
- O11. Os repetidos, pelo conteúdo (F-D10). O FITID não é lido, porque a medição (seção 15) mostrou bancos que o mudam a cada exportação e bancos que o repetem em lançamentos diferentes:
  - a chave de um lançamento é a chave da conta (O10), a data (O6), o valor em centavos (O5) e a descrição (O7), como saíram da leitura;
  - no mesmo arquivo, todos os lançamentos contam, mesmo os que têm a mesma chave: dois cafés do mesmo valor no mesmo dia são dois lançamentos;
  - entre arquivos, cada chave conta, na conta, tantas vezes quanto no arquivo que mais a tem. Os arquivos são vistos na ordem da E2: num arquivo, o n-ésimo lançamento com uma chave é repetido, e fica de fora, quando os arquivos anteriores já deixaram n ou mais lançamentos com essa chave na conta. Assim ficam os primeiros, na ordem dos arquivos e, no mesmo arquivo, na ordem em que aparecem;
  - a repetição entre arquivos é o normal de dois extratos sobrepostos e não dá aviso.
- O12. O período do extrato: o `DTEND` do `<BANKTRANLIST>` (como na O6). Sem ele, a data do lançamento mais novo do extrato.

## 6. As categorias

As regras ficam em `src/regras/categorias.ts`, como funções puras, com teste antes do código.

- G1. A categoria vem de termos na descrição (O7), normalizada pelas N1, N2 e N4, sem a N3, e casada como termo pela N5. A N3 fica de fora porque apagaria "WWW.NETFLIX.COM" inteiro. A primeira que casar decide, nesta ordem: as do usuário (G3), na ordem da variável; depois as fixas, na ordem da tabela G2. Sem nenhuma, a categoria é "outros".
- G2. As categorias fixas, na ordem, com os termos (já normalizados):
  1. **pagamento da fatura**, só nestas duas condições:
     - na conta, uma saída com "pagamento fatura", "pagamento de fatura", "pagamento da fatura", "pagto fatura", "pgto fatura", "pag fatura", "pagamento cartao", "pagto cartao", "pgto cartao", "pag cartao", "fatura cartao" ou "fatura do cartao";
     - no cartão, uma entrada com "pagamento", "pagto" ou "pgto";
  2. **tarifas**: "tarifa", "tar", "anuidade", "iof", "juros", "encargos", "multa", "cesta de servicos";
  3. **investimentos**: "aplicacao", "aplic", "resgate", "resg", "investimento", "invest", "cdb", "rdb", "lci", "lca", "tesouro direto";
  4. **renda**, só em entradas: "salario", "proventos", "folha", "remuneracao", "pro labore";
  5. **assinaturas**: "netflix", "spotify", "amazon prime", "prime video", "disney", "hbo", "youtube premium", "google one", "icloud", "apple com", "globoplay", "deezer", "paramount";
  6. **transporte**: "uber", "99app", "99 pop", "cabify", "posto", "combustivel", "shell", "ipiranga", "estacionamento", "sem parar", "conectcar", "veloe", "metro", "bilhete unico", "pedagio";
  7. **alimentação**: "ifood", "rappi", "restaurante", "lanchonete", "padaria", "pizzaria", "burger", "mcdonalds", "mc donalds", "cafeteria";
  8. **mercado**: "mercado", "supermercado", "carrefour", "pao de acucar", "assai", "atacadao", "hortifruti", "sacolao", "atacarejo";
  9. **moradia**: "aluguel", "condominio", "enel", "light", "sabesp", "copasa", "cemig", "comgas", "copel", "celesc", "energia", "agua", "internet", "vivo", "claro", "tim";
  10. **saúde**: "farmacia", "drogaria", "drogasil", "droga raia", "pague menos", "unimed", "amil", "hapvida", "sulamerica", "hospital", "clinica", "laboratorio", "odonto";
  11. **educação**: "escola", "colegio", "faculdade", "universidade", "curso", "alura", "udemy", "livraria";
  12. **lazer**: "cinema", "ingresso", "ingressos", "teatro", "steam", "playstation", "xbox", "nintendo", "show";
  13. **transferências**: "pix", "ted", "doc", "transferencia", "transf".
  As transferências vêm por último, para "PIX IFOOD" ser alimentação. As tarifas vêm antes dos investimentos, para "IOF RESGATE" ser tarifa. O pagamento da fatura só casa nas duas condições, e "ANUIDADE CARTAO DE CREDITO" é tarifa. A lista é uma hipótese a partir dos nomes conhecidos de empresas e das abreviações comuns dos bancos. Ela erra às vezes ("mercado" casa com "MERCADO PAGO"; um "PAGAMENTO FATURA" de uma conta de luz vira pagamento da fatura; e "internet" casa com "CANAIS INTERNET", que num banco da medição é o canal do internet banking, seção 15), e a G3 corrige, porque vem antes. O estorno não tem categoria própria: "ESTORNO IFOOD" é uma entrada em alimentação (F-D8).
- G3. A variável `COWORKIA_FINANCAS_CATEGORIAS` traz as categorias do usuário, no formato `nome=termo1,termo2;nome2=termo3`. Por exemplo: `mercado=ASSAI,ATACADAO;academia=SMART FIT;outros=MERCADO PAGO`.
  - O nome e cada termo saem sem os espaços das pontas e são comparados depois da N1 e da N2.
  - Uma categoria do usuário vale para qualquer conta e qualquer sinal, menos o "pagamento da fatura" e a "renda", que seguem as condições da G2: um termo do usuário em "pagamento da fatura" só casa com uma saída na conta ou com uma entrada no cartão, e um em "renda", só com uma entrada.
  - Um nome igual ao de uma categoria fixa é essa categoria: um termo do usuário em "pagamento da fatura" ou em "investimentos" também fica fora do total (G4).
  - Um item sem `=`, sem nome ou sem nenhum termo é ignorado, e as ferramentas das finanças avisam "a categoria N da COWORKIA_FINANCAS_CATEGORIAS foi ignorada.", pelo número do item, a partir de 1.
- G4. O pagamento da fatura e os investimentos ficam fora das entradas e das saídas do resumo, porque são o dinheiro do próprio usuário mudando de lugar. Cada um aparece numa linha à parte.
- G5. O nome da categoria é texto fixo do coworkIA ou do próprio usuário. Ele não é texto de terceiros e não passa pela S2.

## 7. As ferramentas novas

### 7.11 `listar_lancamentos`
- Entrada: `desde` e `ate`, `conta` (o `id` da O10), `categoria` (o nome, comparado como na G3), `busca` (um texto) e `limite` (de 1 a 200; padrão 50).
- O período:
  - o `desde` e o `ate` são lidos pela seção 4 da versão 1 e valem pela data deles no fuso do RQ7: a hora, se vier, só serve para achar essa data. O lançamento entra quando `desde` ≤ data ≤ `ate`, com as duas pontas incluídas;
  - sem o `desde`, ele é o `ate` menos 30 dias, quando há `ate`, ou hoje menos 30 dias. Sem o `ate`, o período não tem fim;
  - um `desde` depois do `ate` dá erro de entrada.
- A busca: o texto e a descrição passam pela N1, pela N2 e pela N4, sem a N3 (como na G1), e o lançamento entra quando a descrição contém o texto, por parte, como no `listar_emails`.
- Saída: os lançamentos do período, do mais novo para o mais velho, até o limite. No mesmo dia, a ordem é a dos arquivos (E2) e, no mesmo arquivo, a ordem em que aparecem. Cada um traz:
  - a `conta`, com o `id` e o `rotulo` (O10);
  - a `data`, como `AAAA-MM-DD`;
  - o `valor`, em reais, como texto com o sinal, sem separador de milhar e com vírgula e duas casas, como `-1234,56`, `350,00` e `0,00`;
  - a `descricao`, com a S2 (como um assunto, 500), marcada com o `id` da conta;
  - a `categoria`.
  O campo `completo` é falso quando o limite cortou lançamentos do período. Também traz os avisos da pasta, da leitura e da G3.
- Um `conta` que não está na lista dos extratos dá "Conta não encontrada.".

### 7.12 `resumo_financeiro`
- Entrada: `mes` (`AAAA-MM`; padrão: o mês de hoje, no fuso do RQ7).
- Saída:
  - o `mes`;
  - as `entradas` e as `saidas` do mês, somadas de todas as contas, sem o pagamento da fatura e sem os investimentos (G4), como texto em reais (7.11), as saídas sem o sinal;
  - por categoria, com todas as contas juntas, sem o pagamento da fatura e sem os investimentos: as `entradas` e as `saidas`, da maior saída para a menor; num empate, pelo nome da categoria, na ordem da E2;
  - o `pagamento_da_fatura` e os `investimentos`: o total das saídas e o das entradas de cada um;
  - por conta: o `id`, o `rotulo`, as `entradas` e as `saidas` do mês (sem o pagamento da fatura e sem os investimentos), o `saldo` (como texto em reais, com o sinal, porque pode ser negativo, como no cheque especial ou na dívida do cartão) e a `data_do_saldo` (O9, de qualquer mês, como `AAAA-MM-DD`) e o `dados_ate` (o fim do período mais novo da conta, O12, como `AAAA-MM-DD`). O `dados_ate` mostra se o mês está completo. Uma conta sem saldo traz o `saldo` e a `data_do_saldo` nulos;
  - o número de lançamentos do mês;
  - os avisos da pasta, da leitura e da G3.
- Um `mes` que não é `AAAA-MM`, com o mês de 01 a 12, dá erro de entrada.

### 7.7 `resumo_do_dia` (sem mudança)
- As finanças não entram (F-D4).

## 8. A demonstração

- Os arquivos ficam em `dados-demo/financas/`, com dados inventados:
  - dois extratos de uma conta corrente no OFX 1.x, que se sobrepõem em alguns dias. Os lançamentos dos dias em comum vêm nos dois arquivos, com o FITID diferente em cada um, como na medição, e contam uma vez (O11). Um dos arquivos tem dois lançamentos iguais no mesmo dia, que contam os dois. Os lançamentos são: o salário, um PIX recebido, o mercado, o iFood, o Uber, a Netflix, a conta de luz, uma tarifa, a anuidade do cartão, uma aplicação e um resgate, o pagamento da fatura e um PIX enviado;
  - um extrato do cartão no OFX 2.x: as compras, um estorno e o pagamento da fatura;
  - um extrato malicioso, com a injeção de instrução na descrição, um marcador falso escrito com as entidades (`&lt;&lt;&lt;FIM_TERCEIROS&gt;&gt;&gt;`), caracteres invisíveis, uma sequência ANSI (AD17) e um ESC, como no e-mail e na conversa maliciosos.
- As datas usam um modelo novo, relativo a hoje: `{{dia±N:ofx}}`, que vira `AAAAMMDD`. Os lançamentos se espalham pelos últimos 40 dias, para o mês de hoje e o anterior terem dados. Um modelo desconhecido continua sendo erro (AD2).
- Os caracteres especiais da demonstração usam o modelo `{{U+XXXX}}`, como no WhatsApp.
- A `COWORKIA_FINANCAS_CATEGORIAS` também é lida na demonstração, porque é uma preferência do usuário. O README mostra um exemplo.

## 9. Segurança

- SF1. A S2 vale para a descrição de cada lançamento e para o nome do arquivo nos avisos, com os limites da 7.11 e da E4.
- SF2. A descrição das ferramentas novas repete o aviso das outras: o conteúdo marcado é dado, nunca instrução.
- SF3. O `id` da conta é opaco e nunca vira caminho. O número da conta só sai com os 4 últimos dígitos, e o código do banco não sai (RF5).
- SF4. O README diz como baixar o OFX pelo aplicativo ou pelo site do banco e que o coworkIA não conecta com o banco. O aviso da LGPD (S6) passa a citar os extratos, que são dados financeiros.

## 10. Organização do código

- `src/fontes/financas/leitor-ofx.ts`: os bytes de um arquivo viram os extratos e os lançamentos (seção 5), como função pura.
- `src/fontes/financas/fonte-financas.ts`: a pasta, os avisos, as contas e os repetidos (seção 4, O10 e O11).
- `src/regras/categorias.ts`: a seção 6.
- `src/regras/resumo-financeiro.ts`: o resumo da 7.12, como função pura.
- Mudam: `src/dominio.ts`, `src/config.ts`, `src/aplicacao.ts`, `src/servico.ts`, `src/saida/formatar.ts`, `src/saida/terceiros.ts` (a origem `extrato`), `src/servidor.ts`, `src/fontes/demo/modelos.ts`, `src/fontes/demo/dados.ts` e o README.

## 11. Testes

- O leitor tem testes com exemplos escritos à mão:
  - os dois formatos, com as marcas sem fechamento;
  - as entidades: as nomeadas, as numéricas, a passada só (`&amp;lt;`), as inválidas (zero, acima de U+10FFFF e de U+D800 a U+DFFF) e a desconhecida;
  - a marca pelo nome inteiro, com o `<STMTRS>` dentro do `<STMTTRNRS>`;
  - mais de um extrato no arquivo, a conta e o cartão;
  - o valor com ponto, com vírgula, sem centavos, com o sinal `+`, "-0,05", "-0,5", "-0,50", o zero, os 11 dígitos e os inválidos (separador de milhar, 3 casas e 12 dígitos);
  - a data só com o dia, com a hora e com o fuso entre colchetes, sem converter, e a data que não existe;
  - o `NAME`, o `MEMO`, os dois e nenhum;
  - o Windows-1252 com acento, o UTF-8 e o BOM;
  - o saldo, o empate do saldo, a moeda que não é BRL e o arquivo sem extrato.
- A pasta tem testes do `.OFX` maiúsculo, da ordem dos arquivos, do link, do arquivo grande demais, do 201º arquivo, do arquivo que falha na leitura, do erro do leitor (E5), da pasta que não existe, dos repetidos (O11) e do `id` e do rótulo da conta, com a chave secreta fixa e com duas chaves diferentes.
  - Os repetidos: o mesmo lançamento em dois arquivos, com o FITID diferente, conta uma vez; dois iguais no mesmo arquivo contam os dois; uma chave que aparece 3 vezes num arquivo e 2 noutro conta 3, em qualquer ordem dos arquivos; o mesmo FITID com a data, o valor ou a descrição diferente conta os dois; a mesma data, valor e descrição em contas diferentes conta nas duas; e ficam os primeiros, na ordem dos arquivos.
  - O rótulo: o `ACCTID` só com dígitos, com traço e ponto, com o `X` no fim, mascarado com `X` e com `*`, com menos de 4 dígitos, sem dígito e com outras letras (o código, que dá "sem número").
- As categorias têm teste antes do código: a ordem, o termo inteiro, a descrição com endereço web (G1 sem a N3), a renda só em entradas, o pagamento da fatura na conta e no cartão e fora dessas condições (a anuidade e o PIX recebido), os investimentos depois das tarifas, o estorno, as do usuário antes das fixas, o nome do usuário igual ao de uma fixa, com as condições dela, e o item ignorado.
- O `listar_lancamentos` tem teste das pontas do período, do `desde` com hora, do `ate` sem `desde`, do `desde` depois do `ate` e da busca por parte.
- O resumo tem teste do mês, das contas, do pagamento da fatura e dos investimentos à parte, do saldo mais novo, do saldo negativo, do empate das categorias e das somas grandes.
- A demonstração tem um teste com o relógio fixo.
- O teste de ponta a ponta chama as 2 ferramentas novas e confere a S2 no extrato malicioso.
- Nenhum teste lê um extrato real.

## 12. Dependências

Nenhuma nova. O Windows-1252 é lido pelo `TextDecoder` do próprio Node (medido no Node 24.19: `new TextDecoder('windows-1252')` lê "PÃO DE AÇÚCAR", e o `TextDecoder('utf-8', { fatal: true })` recusa os mesmos bytes).

## 13. Como usar (vai para o README)

- Baixar o extrato da conta e a fatura do cartão em OFX, pelo aplicativo ou pelo site do banco (o nome da opção muda de banco para banco: "Exportar", "Salvar extrato" ou "Money/OFX").
- Pôr os `.ofx` numa pasta e definir `COWORKIA_FINANCAS_PASTA` e, se quiser, `COWORKIA_FINANCAS_CATEGORIAS`.
- As limitações conhecidas: só o OFX e só a moeda real; a data é a do banco, sem converter o fuso; as categorias são palavras na descrição e erram às vezes; uma transferência entre as contas do próprio usuário conta como entrada numa e saída na outra; um lançamento cuja data, valor ou descrição mude entre duas exportações conta duas vezes, e dois lançamentos iguais do mesmo dia, cada um num arquivo que não traz o outro, contam uma vez (O11); o `id` da conta muda quando o servidor reinicia; e, para ler os extratos de verdade, o modo `google` também pede o login do Google (F-D9).

## 14. Fora desta parte

O CSV, o Open Finance e qualquer conexão com o banco, os extratos de investimento (`INVSTMTRS`), a fatura em PDF, os alertas e o orçamento, as finanças no resumo do dia, outras moedas, qualquer pagamento ou transferência, e ler as finanças e o WhatsApp de verdade sem o login do Google (F-D9, um assunto próprio).

## 15. Medições e pontos abertos

- M-F1. Um OFX real do banco do Eduardo, da conta e do cartão, no PC dele: o cabeçalho e a codificação, o uso do `NAME` e do `MEMO`, o formato do `DTPOSTED` e do `TRNAMT`, o sinal no cartão, se a data, o valor e a descrição de um lançamento continuam iguais em dois downloads sobrepostos (O11), o `ACCTID` do cartão (inteiro, mascarado ou um código, O10), o `LEDGERBAL`, como aparece o pagamento da fatura na conta e no cartão, se o cartão vem num `<CCSTMTRS>`, e como aparecem as compras parceladas, os lançamentos futuros e as aplicações e os resgates. Até essa medição, as seções 5 e 6 são a melhor hipótese, e a demonstração é escrita a partir delas.
- As fontes, lidas em 2026-11-09:
  - a especificação OFX 2.0.2, na cópia publicada pelo Scotiabank (https://www1.scotiaconnectuat.scotiabank.com/help/secured/en_US/Official_OFX_File_Specification_v202.pdf), que diz:
    - 2.8: "OFX 1.0.2 required any parser to accept end tags but did not require clients or servers to send elements with end tags";
    - 2.8.2: o cabeçalho antigo, de linhas `OFXHEADER:100`, `DATA:OFXSGML`, `VERSION:102`, `SECURITY`, `ENCODING`, `CHARSET`, `COMPRESSION`, `OLDFILEUID` e `NEWFILEUID`, e o novo, `<?OFX OFXHEADER="200" …?>`;
    - 2.8.3: "OFX 1.x only required support for USASCII and UTF-8";
    - 3.2.3: "FITIDs must be unique within the scope of an account", com o banco, o `ACCTID` e o `FITID` como chave única;
    - 3.2.6: o `MEMO` tem até 255 caracteres; e, no `STMTTRN`, o `NAME` tem até 32;
    - 3.2.8: o formato `YYYYMMDDHHMMSS.XXX [gmt offset[:tz name]]`, e os campos que faltam valem "12:00 AM (the start of the day), GMT";
    - 3.2.9.1: os valores "must include a decimal point or comma to indicate the start of the fractional amount" e não têm separador de milhar;
    - 3.2.9.2: "a <TRNTYPE>DEBIT should have a negative <TRNAMT> value";
    - 11.4.3: "Transaction amounts are signed from the perspective of the customer. For example, a credit card payment is positive while a credit card purchase is negative.";
    - no `STMTRS`, o `<LEDGERBAL>` traz o `BALAMT` e o `DTASOF`;
  - a lista de usuários do GnuCash:
    - uma resposta de 05/03/2010 (https://lists.gnucash.org/pipermail/gnucash-user/2010-March/034025.html) traz um exemplo de cabeçalho 1.02 com `ENCODING:USASCII` e `CHARSET:1252`;
    - uma mensagem de 11/11/2006 (https://lists.gnucash.org/pipermail/gnucash-user/2006-November/018150.html) relata um arquivo com `CHARSET:1252` que, segundo o autor, estava em ISO-8859-2 ou CP1250. É o motivo da E3.
- A medição com amostras públicas, em 2026-11-09 (o Eduardo escolheu "Medir com amostras públicas"). Os arquivos foram baixados só nesta máquina, lidos pelo leitor da sonda e apagados. Nenhum entra no repositório nem nos testes (RF3).
  - Os 5 extratos brasileiros de exemplo do projeto adelarcubs/ofxparser (https://github.com/adelarcubs/ofxparser, pasta `tests/fixtures`: Caixa, Itaú, um segundo do Itaú, Santander e uma fatura de cartão). Os 83 lançamentos foram lidos, sem nenhum descartado, com os valores, as datas e os saldos certos. Isso inclui o valor com vírgula e espaços antes ("-560,00"), a data com hora e fuso ("[-3:BRT]") e o OFX 1.02 com e sem a marca de fechamento. O segundo arquivo do Itaú declara `CHARSET:1252` e vem em UTF-8, e a E3 leu os acentos certos.
  - 13 exemplos do python-ofxparse (https://github.com/jseutter/ofxparse, `tests/fixtures`) e 3 do libofx (https://github.com/libofx/libofx, `doc/ofx_sample_files`), todos estrangeiros. Eles deram o aviso da O3 ou "formato não reconhecido." (E4), sem erro.
  - No Santander, 13 dos 24 FITIDs são a posição do lançamento no arquivo mais um, seguida de "2709" (o 2º lançamento tem "00032709", e o 22º, "00232709"), e o arquivo foi gerado em 27/09 (`DTSERVER` 20160927). Pelo jeito, o mesmo lançamento ganha outro FITID em outra exportação, e a O11 da versão 2 somaria duas vezes os dias em comum de dois extratos, sem aviso. É uma dedução de um arquivo só. O KMyMoney registra o mesmo em outros bancos (https://bugs.kde.org/show_bug.cgi?id=390681, no commit da correção: "some banks issue a different FITID every time you download the same statement").
  - Um projeto público relata um banco, sem dizer qual, que repete o FITID do débito automático todo mês (https://github.com/TiagoCameli/erp-emt/pull/557). A O11 da versão 2 descartaria o lançamento do mês seguinte. Na amostra da Caixa, o IOF vem com o FITID "0".
  - No Itaú, dois "TIT PAG TIT ULO ITAU" de -276,04, no mesmo dia e no mesmo arquivo, com FITIDs diferentes, são dois lançamentos. Por isso a O11 nunca junta lançamentos do mesmo arquivo.
  - A fatura de cartão traz no `ACCTID` um código com letras, e a O10 da versão 2 dava "Cartão final 2085", um final que não existe (F-D11).
  - "CANAIS INTERNET", no Santander, caiu em moradia (G2).
  - A medição também achou uma limitação da parte 1, o WhatsApp, que já está na main, numa exportação no formato americano (mês/dia) com relógio de 24 horas (https://github.com/starkdmi/whats_json, `test/data/calendars`). A coworkia-5c mediu o efeito inteiro no leitor da main, com dados inventados (achado 122):
    - "1/7/23" e "1/8/23" saem como 1º de julho e 1º de agosto;
    - as linhas com o dia acima de 12, como "7/13/23", não viram mensagem e grudam no texto da mensagem anterior, sem nenhuma linha descartada e sem aviso;
    - a triagem e o `ler_conversa` ficam errados, sem aviso.
    O Eduardo primeiro decidiu "Anotar e decidir depois". Com o efeito inteiro, escolheu "Avisar, depois das finanças" (F-D13): um aviso quando uma linha com cara de data não vira mensagem, num ciclo próprio, logo depois do PR das finanças. Isso não entra nesta parte.
  - O `X` da O10: a página do iDinheiro (https://www.idinheiro.com.br/contas/digito-verificador-x-conta-corrente/), lida pela coworkia-5c em 2026-11-09, diz que "no Banco do Brasil, algumas contas possuem a letra "X" no local destinado ao Dígito Verificador". A máscara do cartão no `ACCTID` é uma suposição: a coworkia-5c só achou números mascarados por usuários em fóruns, e a M-F1 confere.
- A medição trouxe um caso de codificação e textos de descrição de 4 bancos brasileiros, mas nenhuma fonte diz como cada banco escreve o pagamento da fatura. A G2 continua sendo uma hipótese, e a G3 deixa o usuário corrigir.

## 16. Critério de pronto da parte 2

- As 2 ferramentas novas funcionam na demonstração e no Claude Code.
- O lint, os tipos, o build e todos os testes passam, e as travas aceitam os commits.
- O README traz a seção 13.
- O teste com um extrato real (M-F1) fica com o Eduardo, no PC dele, como o da conta real e o do WhatsApp.

## 17. O que mudou da versão 1 para a 2, achado por achado

CORRIGIR:
- **116, o `id` da conta deixava achar o número.** Ele era o sha256 sem segredo de "tipo|BANKID|ACCTID", e, com o "final 1234" do rótulo, o número saía por tentativa. O Eduardo escolheu um `id` novo a cada sessão (F-D7): a O10 passou a usar o HMAC-SHA256 com uma chave secreta aleatória, só na memória. A RF5 diz o que o `id` garante e o que a descrição e o nome do arquivo podem trazer.
- **117, a leitura não dizia o que fazer com uma entidade inválida nem com um erro no meio do arquivo.** A O1 ganhou a marca pelo nome inteiro, a troca das entidades numa passada só e o U+FFFD para a entidade numérica inválida. A E5 deixa só o arquivo com erro de fora, sem a mensagem do erro. A seção 11 ganhou os casos.
- **118, o período comparava instantes com datas.** A 7.11 diz que o `desde` e o `ate` valem pela data no fuso, com as duas pontas incluídas, que o `desde` padrão sai do `ate` quando ele vem, e que um `desde` depois do `ate` é erro.
- **119, o pagamento da fatura pegava o que não era fatura.** Saiu o "cartao de credito" sozinho, e "ANUIDADE CARTAO DE CREDITO" é tarifa. Na conta, entraram os termos de pagamento de fatura. No cartão, entraram o "pagto" e o "pgto". Os termos do usuário em "pagamento da fatura" seguem as condições da fixa (G3), e um "PIX RECEBIDO … NUBANK" não sai mais das entradas.

ANOTAR, todos incluídos:
- **120:**
  - o FITID repetido no mesmo arquivo e o repetido com valor ou data diferente ganharam avisos (O11);
  - a ordem dos arquivos é a do `sort()` padrão (E2);
  - a marcação da descrição usa o `id` da conta, e o aviso, o `id` "pasta" (7.11 e E4);
  - a RF5 deixou de prometer o que a descrição pode desfazer.
- **121:**
  - o empate do saldo (O9) e o das categorias (7.12);
  - o formato do saldo, com o sinal, e o das datas (7.12);
  - o valor zero e o limite de 11 dígitos, com as somas em `BigInt` (O5 e RF4);
  - os testes de "-0,05" e "-0,50" (seção 11);
  - a G1 sem a N3;
  - a busca por parte do texto, como no `listar_emails` (7.11).
  O Eduardo decidiu:
  - os investimentos numa categoria fora do total e o estorno na categoria do gasto (F-D8, G2 e G4);
  - o modo `google` continua pedindo o login do Google (F-D9, seções 13 e 14).
  A M-F1 mede também as parcelas, os lançamentos futuros e o `<CCSTMTRS>`.

## 18. O que mudou da versão 2 para a 3

Tudo vem da medição com amostras públicas (seção 15) e das decisões F-D10 e F-D11:
- **O11, os repetidos pelo conteúdo (F-D10).** O FITID deixou de ser lido. Entre arquivos, a chave é a conta, a data, o valor e a descrição, e cada chave conta tantas vezes quanto no arquivo que mais a tem. No mesmo arquivo, todos contam. Saíram os três avisos do FITID: o do repetido no mesmo arquivo, o do repetido com valor ou data diferente e o do lançamento sem FITID.
- **O10, o final só sai de um número de conta (F-D11).** Um `ACCTID` com letras, como um código, dá "sem número". O `X` no fim é aceito, porque é o dígito verificador de alguns bancos.
- **G2:** o "CANAIS INTERNET" entrou na lista dos erros conhecidos, sem mudar os termos.
- **7.11:** a descrição deixou de citar o FITID, que não é lido.
- **Seção 8:** a demonstração mostra os dias em comum com o FITID diferente e dois lançamentos iguais no mesmo arquivo.
- **Seção 11:** os testes dos repetidos e do rótulo.
- **Seção 13:** as limitações da O11 entraram no lugar da do lançamento sem FITID.
- **Seção 15:** a medição com amostras públicas. A M-F1 passou a medir se o lançamento continua igual em dois downloads sobrepostos, em vez do FITID.

## 19. O que mudou da versão 3 para a 4

ANOTAR 122 e 123, todos incluídos (F-D12 e F-D13):
- **O10, o número mascarado:** o asterisco e o `X` em qualquer lugar contam como número de conta, e "5555 XXXX XXXX 1234" e "************1234" dão "final 1234". O código com outras letras continua "sem número". A O10 diz que uma máscara no fim daria um final errado.
- **Seção 11:** os testes do rótulo mascarado com `X` e com `*`.
- **Seção 15:**
  - os FITIDs do Santander são a posição mais um, seguida de "2709";
  - o efeito inteiro da limitação do WhatsApp e a decisão de avisar depois das finanças;
  - a fonte do `X`;
  - a M-F1 confere o `ACCTID` do cartão.
- **Seção 2:** as decisões F-D12 e F-D13.
