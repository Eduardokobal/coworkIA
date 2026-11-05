# Plano C da versão 1 do coworkIA: Google, login e cofre (versão 2 do plano)

> **Para quem executa:** use a habilidade superpowers:executing-plans, tarefa por tarefa. Os passos usam caixas de seleção (`- [ ]`).

**Objetivo:** ligar o modo `google`. Ele traz as fontes do Gmail e da Agenda, só de leitura, o login com PKCE (`npm run login-google`), o token no cofre do sistema, o `npm run logout-google` e o README de uso com a conta real.

**Arquitetura:**
- As fontes do Google implementam as mesmas interfaces das fontes da demonstração (`src/fontes/tipos.ts`). Por isso, o serviço, a saída e o servidor do plano B não mudam.
- As chamadas à API são feitas com `fetch` direto, recebido por injeção (`Buscar`). Os testes usam um Google de mentira, sem rede.
- O login fica em `src/login/`:
  - os escopos, a leitura do `.env`, o cofre, o fluxo com o retorno em 127.0.0.1 e o acesso com o refresh token;
  - o cofre e a troca do código também chegam por injeção, para que os testes nunca toquem no cofre do sistema nem no Google.
- Cada tarefa tem o commit do teste vermelho (`test:`) e o do código (`feat:`). A única exceção é a refatoração da Tarefa 2.

**Stack:** o do plano B mais `google-auth-library` 11.3.3 e `@napi-rs/keyring` 2.1.2 (spec, seção 13, e medição M2).

**Base:**
- a spec `docs/specs/2026-11-04-versao-1.md` (spec-p1-v3, sha256 ef212ce32d683152b84cf812149c4f50b50c6f6b265b6b71b59780986d3cdf17), seções 3, 7, 8, 11, 12, 13, 14, 16 e 17;
- o adendo do plano B (`docs/specs/2026-11-05-versao-1-adendo.md`, AD1 a AD8), que continua valendo, menos o AD4;
- o adendo da seção seguinte (AD9 a AD16), que entra no repositório na Tarefa 0;
- a documentação oficial lida em 2026-11-05: Gmail API (`users.messages.list`, `users.messages.get`, `users.getProfile` e o recurso `Message`), Calendar API (`events.list`), OAuth 2.0 para apps de computador e a expiração do refresh token. As URLs estão na seção "Fontes consultadas", no fim.

**Versões deste plano:**
- a versão 1 (sha256 61271d574dd5fe14d62e41d847f2caf3b58164b7ea436798b9c205b43ebfa0c2) recebeu CORRIGIR, com os achados 93 e 94, e dois achados ANOTAR, o 95 e o 96.
A seção "O que mudou da versão 1 para a 2", no fim, liga cada mudança ao seu motivo.

**Ensaio feito pelo DEV antes de mandar:** ver a seção "Ensaio", no fim.

## Adendo à spec, proposto pelo DEV (vale depois da aprovação do Eduardo)

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

## Restrições globais (valem para todas as tarefas)

- Tudo o que vale nos planos A e B continua valendo: Node 24 ou mais novo, TypeScript `strict` com `noUncheckedIndexedAccess`, ESM com imports relativos terminando em `.js`, Biome, Vitest, nenhum escape de barra e u e nenhum caractere invisível nos arquivos.
- Os blocos de código deste plano já estão no formato do Biome, e o `npm run formatar` não deve mudar nenhum arquivo. Se mudar, o DEV anota a diferença e a manda ao auditor antes de seguir.
- As dependências novas de produção são só `google-auth-library` e `@napi-rs/keyring`, nas versões da seção 13 e da M2, cada uma com o motivo no corpo do commit.
- **Nenhum teste usa a internet, uma conta real ou o cofre do sistema.**
  - O Google é de mentira, por injeção do `Buscar` e do `TrocarCodigo`.
  - O cofre é de mentira, por injeção da `EntradaDoCofre`.
  - Os testes do login abrem uma porta em 127.0.0.1, que é a própria máquina.
- **Neste PC, o DEV não roda o `npm run login-google` nem o `npm run logout-google`** (S7). O `logout-google` mexe no cofre do sistema, e o login pede uma conta do Google.
- **Segredo nunca vai para o código, um log, um commit ou uma mensagem** (RQ6 e S5).
  - Os valores de teste são inventados e não batem nos padrões de chave das travas (por exemplo, nenhum começa com `GOCSPX-`).
  - As mensagens de erro nunca repetem o código de autorização, um token, o client secret nem a resposta do Google.
- Os commits seguem a CONTRIBUTING.md, seção 4, "As regras de todo commit". As travas locais estão ativas. Antes de cada commit: `git branch --show-current` (espera `feat/google-e-cofre`) e `git status --short`.
- A cada tarefa, o DEV manda ao auditor os hashes, a saída do vermelho e do verde, o lint, os tipos e o build.

## Mapa de arquivos

| Arquivo | Responsabilidade |
|---|---|
| `src/fontes/filtro.ts` | O filtro de e-mails (AD7 e AD11), agora das duas fontes; sai do `fonte-demo.ts`. |
| `src/login/escopos.ts` | Os dois escopos e a conferência do S1. |
| `src/login/credenciais.ts` | A leitura do `.env` (S3 e AD14). |
| `src/login/cofre.ts` | O token no cofre do sistema, com o limite de 2.560 bytes (S4 e AD15). |
| `src/login/login.ts` | O login com PKCE, state e retorno em 127.0.0.1, e o logout (S3 e S4). |
| `src/login/acesso.ts` | O token de acesso a partir do refresh token (S4 e S5). |
| `src/fontes/google/gmail.ts` | A mensagem da Gmail API para o `Email` do domínio (AD12 e AD13). |
| `src/fontes/google/fonte-google.ts` | As fontes do Gmail e da Agenda (7.1 a 7.5, AD10 e AD11). |
| `src/aplicacao.ts` | Liga o modo `google` (AD9). |
| `src/cli.ts` | Os comandos `login-google` e `logout-google`. |
| `.env.example` | Os nomes das variáveis do cliente OAuth, sem valores. |
| `testes/**` | Um arquivo de teste por arquivo novo de `src/`. |

---

### Tarefa 0: branch e documentos

- [ ] **Passo 1: criar a branch a partir da main atualizada**

```bash
git fetch origin
git switch --no-track -c feat/google-e-cofre origin/main
git log --oneline -1
git config --get core.hooksPath
```
Esperado: o topo é o `d68bcd3` (o merge do PR 4) ou um merge mais novo, e as travas mostram `.githooks`.

- [ ] **Passo 2: commitar o plano, na versão LIBERADA**

A versão liberada é o arquivo `plano-c-vN.md` do scratchpad do DEV com o maior N que o auditor deu como LIBERADO.

```bash
cp "C:/Users/EDUARD~1/AppData/Local/Temp/claude/9bb78e7f8b1714b4/fc600f43-1af8-4aa6-adae-7be1427cd432/scratchpad/plano-c-vN.md" docs/planos/2026-11-05-versao-1-plano-c.md
sha256sum docs/planos/2026-11-05-versao-1-plano-c.md
git add docs/planos/2026-11-05-versao-1-plano-c.md
git commit -m "docs: plano C da versão 1" -m "O Google, o login com PKCE e o cofre, com o teste antes do código. Cópia fiel da versão liberada pelo auditor."
```

- [ ] **Passo 3: commitar o adendo da spec**

O adendo sai do plano já commitado: o título, a frase e a lista AD9 a AD16 da seção "Adendo à spec", copiada sem mudança. O `grep -c` é o sinal positivo e tem de dar 8; com outro número, o DEV para e avisa o auditor.

```bash
{ printf '# Adendo à spec da versão 1, para o plano C\n\nAprovado pelo Eduardo junto com o plano C, em 2026-11-05.\n\n'; awk '/^- \*\*AD9\.\*\*/,/^- \*\*AD16\.\*\*/' docs/planos/2026-11-05-versao-1-plano-c.md; } > docs/specs/2026-11-05-versao-1-adendo-c.md
grep -cE '^- \*\*AD(9|1[0-6])\.\*\*' docs/specs/2026-11-05-versao-1-adendo-c.md
git add docs/specs/2026-11-05-versao-1-adendo-c.md
git commit -m "docs: adendo da spec para o plano C" -m "AD9 a AD16: o modo google ligado, só a caixa de entrada, os mesmos filtros da demonstração, o rótulo UNREAD, a decodificação dos cabeçalhos e do corpo, o .env, o login no terminal e o cofre, e as respostas da API escritas à mão."
```

---

### Tarefa 1: dependências

**Arquivos:**
- Modificar: `package.json`, `package-lock.json`

- [ ] **Passo 1: instalar e commitar**

```bash
npm install google-auth-library@11.3.3 @napi-rs/keyring@2.1.2
npm ls google-auth-library @napi-rs/keyring --depth=0
git add package.json package-lock.json
git commit -m "build: google-auth-library e keyring" -m 'Dependências novas, da seção 13 da spec: `google-auth-library`, para o PKCE e a troca e a renovação do token (S3), e `@napi-rs/keyring`, para o token no cofre do sistema (S4, medição M1).'
```
Esperado: a `google-auth-library` na 11.3.3 e o `@napi-rs/keyring` na 2.1.2.

---

### Tarefa 2: o filtro de e-mails das duas fontes (refatoração)

**Arquivos:**
- Criar: `src/fontes/filtro.ts`
- Modificar: `src/fontes/demo/fonte-demo.ts`

**Interfaces:**
- Produz: `casaComFiltro(email: Email, filtro: FiltroEmails, fuso: string): boolean` e `filtrarEmails(emails, filtro, fuso): PaginaDeEmails`, que saem do `fonte-demo.ts` sem mudar o comportamento.

Esta tarefa não tem teste vermelho: ela só move o código. Os testes do plano B (`testes/fontes/fonte-demo.test.ts` e os de ponta a ponta) continuam cobrindo o filtro.

- [ ] **Passo 1: escrever o filtro (`src/fontes/filtro.ts`)**

```ts
import type { Email } from '../dominio.js';
import { lerDataHora } from '../tempo.js';
import { htmlParaTexto } from '../texto/html.js';
import { normalizar } from '../texto/normalizar.js';
import type { FiltroEmails, PaginaDeEmails } from './tipos.js';

function textoDoEmail(email: Email): string {
  if (email.corpoTexto !== null) {
    return email.corpoTexto;
  }
  return email.corpoHtml === null ? '' : htmlParaTexto(email.corpoHtml, { cortarCitacao: false });
}

/** 7.1 e AD7: diz se um e-mail passa nos filtros; as duas fontes usam a mesma regra (AD11). */
export function casaComFiltro(email: Email, filtro: FiltroEmails, fuso: string): boolean {
  const instante = lerDataHora(email.data, fuso).toMillis();
  if (filtro.naoLidos === true && email.lido) {
    return false;
  }
  if (filtro.desde !== undefined && instante < filtro.desde.toMillis()) {
    return false;
  }
  if (filtro.ate !== undefined && instante >= filtro.ate.toMillis()) {
    return false;
  }
  const remetente = (filtro.remetente ?? '').trim().toLowerCase();
  const pessoa = `${email.de.nome} ${email.de.endereco}`.toLowerCase();
  if (remetente !== '' && !pessoa.includes(remetente)) {
    return false;
  }
  const busca = normalizar(filtro.busca ?? '').trim();
  return busca === '' || normalizar(`${email.assunto}\n${textoDoEmail(email)}`).includes(busca);
}

/** 7.1 e AD7: os filtros, sobre e-mails já em ordem do mais novo para o mais velho. */
export function filtrarEmails(
  emails: readonly Email[],
  filtro: FiltroEmails,
  fuso: string,
): PaginaDeEmails {
  const filtrados = emails.filter((email) => casaComFiltro(email, filtro, fuso));
  return {
    emails: filtrados.slice(0, filtro.limite),
    completo: filtrados.length <= filtro.limite,
  };
}
```

- [ ] **Passo 2: trocar o `src/fontes/demo/fonte-demo.ts` inteiro por este (`src/fontes/demo/fonte-demo.ts`)**

```ts
import type { Email, Evento } from '../../dominio.js';
import { conflitam, intervaloDoEvento } from '../../regras/disponibilidade.js';
import { lerDataHora } from '../../tempo.js';
import { filtrarEmails } from '../filtro.js';
import type { Fontes } from '../tipos.js';

export const ENDERECO_DEMO = 'voce@example.com';

export interface DadosDemo {
  emails: Email[];
  eventos: Evento[];
}

export function criarFontesDemo(dados: DadosDemo, fuso: string): Fontes {
  const instante = (email: Email) => lerDataHora(email.data, fuso).toMillis();
  const emails = [...dados.emails].sort((a, b) => instante(b) - instante(a));
  const inicio = (evento: Evento) => intervaloDoEvento(evento, fuso).inicio.toMillis();
  const eventos = [...dados.eventos].sort((a, b) => inicio(a) - inicio(b));
  return {
    email: {
      enderecoDoUsuario: async () => ENDERECO_DEMO,
      listar: async (filtro) => filtrarEmails(emails, filtro, fuso),
      ler: async (id) => emails.find((email) => email.id === id) ?? null,
    },
    agenda: {
      listar: async (intervalo) =>
        eventos.filter((evento) => conflitam(intervaloDoEvento(evento, fuso), intervalo)),
    },
  };
}
```

- [ ] **Passo 3: rodar tudo, conferir e commitar**

```bash
npm test
npm run formatar && npm run lint && npm run tipos && npm run build
git add src/fontes/filtro.ts src/fontes/demo/fonte-demo.ts
git commit -m "refactor: filtro de e-mails compartilhado pelas duas fontes" -m "O filtro do listar_emails (AD7) sai da fonte da demonstração para src/fontes/filtro.ts, porque a fonte do Google vai usar a mesma regra (AD11). O comportamento não muda, e os testes do plano B continuam passando."
```
Esperado: os 207 testes do plano B passam.

**Mutações:**
- Em `casaComFiltro`, trocar `instante >= filtro.ate.toMillis()` por `instante > filtro.ate.toMillis()`: cai "filtra pelo período, com o fim aberto" (`testes/fontes/fonte-demo.test.ts`).
- Em `casaComFiltro`, trocar `return busca === '' ||` por `return true ||`: cai "busca no assunto e no corpo, sem acento e também no HTML (AD7)".

---

### Tarefa 3: os escopos e as credenciais (S1, S3 e AD14)

**Arquivos:**
- Criar: `src/login/escopos.ts`, `src/login/credenciais.ts`
- Teste: `testes/login/escopos.test.ts`, `testes/login/credenciais.test.ts`

**Interfaces:**
- Produz:
  - `ESCOPOS`, com o `gmail.readonly` e o `calendar.readonly`;
  - `conferirEscopos(concedidos: string | undefined): string | null`, que devolve o problema ou nulo;
  - `interface CredenciaisDoCliente { clientId: string; clientSecret: string }`;
  - `credenciaisDoEnv(conteudo: string | null): CredenciaisDoCliente`.

- [ ] **Passo 1: escrever os testes que falham**

`testes/login/escopos.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { conferirEscopos, ESCOPOS } from '../../src/login/escopos.js';

const GMAIL = 'https://www.googleapis.com/auth/gmail.readonly';
const AGENDA = 'https://www.googleapis.com/auth/calendar.readonly';

describe('conferirEscopos (S1)', () => {
  it('pede só a leitura do Gmail e da Agenda', () => {
    expect(ESCOPOS).toEqual([GMAIL, AGENDA]);
  });

  it('aceita os dois escopos, em qualquer ordem', () => {
    expect(conferirEscopos(`${AGENDA} ${GMAIL}`)).toBeNull();
  });

  it('recusa quando falta um escopo, dizendo qual', () => {
    expect(conferirEscopos(GMAIL)).toBe(
      `O login não foi aceito: faltou permitir ${AGENDA}. Rode npm run login-google de novo e permita só a leitura do Gmail e da Agenda.`,
    );
  });

  it('recusa quando vem um escopo a mais, dizendo qual', () => {
    expect(conferirEscopos(`${GMAIL} ${AGENDA} https://mail.google.com/`)).toContain(
      'veio a mais https://mail.google.com/',
    );
  });

  it('recusa quando o campo de escopos não vem', () => {
    expect(conferirEscopos(undefined)).toContain(`faltou permitir ${GMAIL} e ${AGENDA}`);
  });
});
```

`testes/login/credenciais.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { credenciaisDoEnv } from '../../src/login/credenciais.js';

describe('credenciaisDoEnv (S3 e AD14)', () => {
  it('lê o client id e o client secret do .env', () => {
    expect(
      credenciaisDoEnv(
        '# comentário\nCOWORKIA_GOOGLE_CLIENT_ID=123.apps.example\nCOWORKIA_GOOGLE_CLIENT_SECRET="segredo de teste"\n',
      ),
    ).toEqual({ clientId: '123.apps.example', clientSecret: 'segredo de teste' });
  });

  it('sem o arquivo, explica como criar', () => {
    expect(() => credenciaisDoEnv(null)).toThrow('Copie o .env.example para .env');
  });

  it('com um valor vazio, diz o nome que falta e nunca mostra o outro valor', () => {
    let mensagem = '';
    try {
      credenciaisDoEnv(
        'COWORKIA_GOOGLE_CLIENT_ID=\nCOWORKIA_GOOGLE_CLIENT_SECRET=segredo-de-teste\n',
      );
    } catch (erro) {
      mensagem = erro instanceof Error ? erro.message : '';
    }
    expect(mensagem).toBe('Falta preencher no .env: COWORKIA_GOOGLE_CLIENT_ID.');
    expect(mensagem).not.toContain('segredo-de-teste');
  });

  it('sem nenhuma das duas variáveis, diz as duas', () => {
    expect(() => credenciaisDoEnv('OUTRA=1\n')).toThrow(
      'Falta preencher no .env: COWORKIA_GOOGLE_CLIENT_ID e COWORKIA_GOOGLE_CLIENT_SECRET.',
    );
  });
});
```

- [ ] **Passo 2: rodar, ver falhar e commitar o vermelho**

```bash
npm test -- testes/login/escopos.test.ts testes/login/credenciais.test.ts
git add testes/login/escopos.test.ts testes/login/credenciais.test.ts
git commit -m "test: casos dos escopos e das credenciais do Google" -m "Teste vermelho do S1, do S3 e do AD14: os dois escopos, nem mais nem menos, e a leitura do .env sem mostrar nenhum valor."
```
Esperado: FALHA, porque os módulos de `src/login/` não existem.

- [ ] **Passo 3: escrever os escopos (`src/login/escopos.ts`)**

```ts
/** S1: só leitura do Gmail e da Agenda. */
export const ESCOPOS = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/calendar.readonly',
] as const;

/** S1: o token tem de voltar com os dois escopos, nem mais nem menos; devolve o problema ou nulo. */
export function conferirEscopos(concedidos: string | undefined): string | null {
  const lista = new Set((concedidos ?? '').split(' ').filter((escopo) => escopo !== ''));
  const pedidos: readonly string[] = ESCOPOS;
  const faltam = pedidos.filter((escopo) => !lista.has(escopo));
  const sobram = [...lista].filter((escopo) => !pedidos.includes(escopo));
  if (faltam.length === 0 && sobram.length === 0) {
    return null;
  }
  const partes: string[] = [];
  if (faltam.length > 0) {
    partes.push(`faltou permitir ${faltam.join(' e ')}`);
  }
  if (sobram.length > 0) {
    partes.push(`veio a mais ${sobram.join(' e ')}`);
  }
  return `O login não foi aceito: ${partes.join('; ')}. Rode npm run login-google de novo e permita só a leitura do Gmail e da Agenda.`;
}
```

- [ ] **Passo 4: escrever as credenciais (`src/login/credenciais.ts`)**

```ts
import { parseEnv } from 'node:util';

export interface CredenciaisDoCliente {
  clientId: string;
  clientSecret: string;
}

/** S3 e AD14: o cliente OAuth de cada usuário vem do .env; nenhuma mensagem mostra um valor. */
export function credenciaisDoEnv(conteudo: string | null): CredenciaisDoCliente {
  if (conteudo === null) {
    throw new Error(
      'Não achei o arquivo .env na pasta do coworkIA. Copie o .env.example para .env e preencha o cliente OAuth do seu app no Google Cloud.',
    );
  }
  const valores = parseEnv(conteudo);
  const clientId = (valores.COWORKIA_GOOGLE_CLIENT_ID ?? '').trim();
  const clientSecret = (valores.COWORKIA_GOOGLE_CLIENT_SECRET ?? '').trim();
  const faltam = [
    clientId === '' ? 'COWORKIA_GOOGLE_CLIENT_ID' : null,
    clientSecret === '' ? 'COWORKIA_GOOGLE_CLIENT_SECRET' : null,
  ].filter((nome) => nome !== null);
  if (faltam.length > 0) {
    throw new Error(`Falta preencher no .env: ${faltam.join(' e ')}.`);
  }
  return { clientId, clientSecret };
}
```

- [ ] **Passo 5: rodar, ver passar, conferir e commitar o verde**

```bash
npm test -- testes/login/escopos.test.ts testes/login/credenciais.test.ts
npm run formatar && npm run lint && npm run tipos && npm run build
git add src/login/escopos.ts src/login/credenciais.ts
git commit -m "feat: escopos e credenciais do cliente OAuth" -m "S1: o login só aceita o gmail.readonly e o calendar.readonly, nem mais nem menos. S3 e AD14: o cliente OAuth vem do .env, lido com o parseEnv do Node, e nenhuma mensagem mostra um valor."
```

**Mutações:**
- Em `conferirEscopos`, trocar `faltam.length === 0 && sobram.length === 0` por `faltam.length === 0`: cai "recusa quando vem um escopo a mais, dizendo qual".
- Em `credenciaisDoEnv`, trocar `clientId === '' ? 'COWORKIA_GOOGLE_CLIENT_ID' : null` por `null`: cai "com um valor vazio, diz o nome que falta e nunca mostra o outro valor".

---

### Tarefa 4: o cofre (S4 e AD15)

**Arquivos:**
- Criar: `src/login/cofre.ts`
- Teste: `testes/login/cofre.test.ts`

**Interfaces:**
- Produz:
  - `LIMITE_DO_COFRE = 2560`, `SERVICO_DO_COFRE = 'coworkia'` e `CONTA_DO_COFRE = 'google-refresh-token'`;
  - `interface EntradaDoCofre { setSecret; getSecret; deleteCredential }`, a API síncrona do `@napi-rs/keyring`;
  - `interface Cofre { guardar(token: string): void; ler(): string | null; apagar(): boolean }`;
  - `criarCofre(abrir?)`, que no uso real abre a `Entry` do `@napi-rs/keyring`.

- [ ] **Passo 1: escrever o teste que falha (`testes/login/cofre.test.ts`)**

```ts
import { describe, expect, it } from 'vitest';
import {
  CONTA_DO_COFRE,
  criarCofre,
  type EntradaDoCofre,
  LIMITE_DO_COFRE,
  SERVICO_DO_COFRE,
} from '../../src/login/cofre.js';

/** Um cofre de mentira, em memória: os testes nunca tocam no cofre do sistema. */
function cofreDeMentira() {
  const guardados = new Map<string, Uint8Array>();
  const abertos: string[] = [];
  const abrir = (servico: string, conta: string): EntradaDoCofre => {
    const chave = `${servico}/${conta}`;
    abertos.push(chave);
    return {
      setSecret: (segredo) => {
        guardados.set(chave, Uint8Array.from(segredo));
      },
      getSecret: () => {
        const segredo = guardados.get(chave);
        return segredo === undefined ? null : Array.from(segredo);
      },
      deleteCredential: () => guardados.delete(chave),
    };
  };
  return { cofre: criarCofre(abrir), guardados, abertos };
}

describe('criarCofre (S4 e AD15)', () => {
  it('guarda, lê e apaga o token na entrada coworkia/google-refresh-token', () => {
    const { cofre, guardados, abertos } = cofreDeMentira();
    expect(cofre.ler()).toBeNull();
    cofre.guardar('token-de-teste-çã');
    expect(cofre.ler()).toBe('token-de-teste-çã');
    expect(abertos.every((chave) => chave === `${SERVICO_DO_COFRE}/${CONTA_DO_COFRE}`)).toBe(true);
    expect(SERVICO_DO_COFRE).toBe('coworkia');
    expect(CONTA_DO_COFRE).toBe('google-refresh-token');
    expect(guardados.get('coworkia/google-refresh-token')).toEqual(
      new TextEncoder().encode('token-de-teste-çã'),
    );
    expect(cofre.apagar()).toBe(true);
    expect(cofre.apagar()).toBe(false);
    expect(cofre.ler()).toBeNull();
  });

  it('aceita até 2.560 bytes e recusa 2.561, sem guardar e sem mostrar o token', () => {
    const { cofre, guardados } = cofreDeMentira();
    expect(LIMITE_DO_COFRE).toBe(2560);
    cofre.guardar('a'.repeat(2560));
    expect(cofre.ler()).toHaveLength(2560);
    cofre.apagar();
    const grande = `${'b'.repeat(2559)}ç`;
    expect(() => cofre.guardar(grande)).toThrow(
      'O token tem 2561 bytes, e o cofre do Windows aceita até 2560. O token não foi guardado.',
    );
    expect(guardados.size).toBe(0);
  });
});
```

- [ ] **Passo 2: rodar, ver falhar e commitar o vermelho**

```bash
npm test -- testes/login/cofre.test.ts
git add testes/login/cofre.test.ts
git commit -m "test: casos do cofre do token" -m "Teste vermelho do S4 e do AD15: guardar, ler e apagar na entrada coworkia/google-refresh-token, e o limite de 2.560 bytes, com um cofre de mentira."
```
Esperado: FALHA, porque `src/login/cofre.ts` não existe.

- [ ] **Passo 3: escrever o cofre (`src/login/cofre.ts`)**

```ts
import { Entry } from '@napi-rs/keyring';

/** S4: o Windows aceita até 2.560 bytes num segredo (CRED_MAX_CREDENTIAL_BLOB_SIZE, medição M1). */
export const LIMITE_DO_COFRE = 2560;
/** AD15: o nome do serviço e da conta no cofre. */
export const SERVICO_DO_COFRE = 'coworkia';
export const CONTA_DO_COFRE = 'google-refresh-token';

/** O que o coworkIA usa de uma entrada do cofre; é a API síncrona do @napi-rs/keyring. */
export interface EntradaDoCofre {
  setSecret(segredo: Uint8Array): void;
  getSecret(): Array<number> | null;
  deleteCredential(): boolean;
}

export interface Cofre {
  guardar(token: string): void;
  ler(): string | null;
  apagar(): boolean;
}

export function tamanhoEmBytes(token: string): number {
  return new TextEncoder().encode(token).length;
}

/** S4: o refresh token fica no cofre em UTF-8, pelo setSecret (medição M1); nada vai para arquivo. */
export function criarCofre(
  abrir: (servico: string, conta: string) => EntradaDoCofre = (servico, conta) =>
    new Entry(servico, conta),
): Cofre {
  const entrada = () => abrir(SERVICO_DO_COFRE, CONTA_DO_COFRE);
  return {
    guardar: (token) => {
      const bytes = tamanhoEmBytes(token);
      if (bytes > LIMITE_DO_COFRE) {
        throw new Error(
          `O token tem ${bytes} bytes, e o cofre do Windows aceita até ${LIMITE_DO_COFRE}. O token não foi guardado.`,
        );
      }
      entrada().setSecret(new TextEncoder().encode(token));
    },
    ler: () => {
      const segredo = entrada().getSecret();
      return segredo === null ? null : new TextDecoder().decode(Uint8Array.from(segredo));
    },
    apagar: () => entrada().deleteCredential(),
  };
}
```

- [ ] **Passo 4: rodar, ver passar, conferir e commitar o verde**

```bash
npm test -- testes/login/cofre.test.ts
npm run formatar && npm run lint && npm run tipos && npm run build
git add src/login/cofre.ts
git commit -m "feat: cofre do token no sistema" -m "S4: o refresh token fica no cofre do sistema, em UTF-8, pelo setSecret (medição M1), e o login confere os 2.560 bytes antes de gravar. Nada vai para arquivo."
```

**Mutações:**
- Trocar `new TextEncoder().encode(token).length` por `token.length`: cai "aceita até 2.560 bytes e recusa 2.561, sem guardar e sem mostrar o token" (o `ç` tem 2 bytes).
- Trocar `bytes > LIMITE_DO_COFRE` por `bytes > LIMITE_DO_COFRE + 1`: cai o mesmo teste.

---

### Tarefa 5: o login e o acesso (S1, S3, S4 e S5)

**Arquivos:**
- Criar: `src/login/login.ts`, `src/login/acesso.ts`
- Teste: `testes/login/login.test.ts`

**Interfaces:**
- Consome: `ESCOPOS` e `conferirEscopos` (Tarefa 3); `Cofre`, `criarCofre` e `EntradaDoCofre` (Tarefa 4); `CredenciaisDoCliente` (Tarefa 3).
- Produz:
  - `PRAZO_DO_LOGIN_MS`, `TokensDoLogin`, `TrocarCodigo` e `trocarCodigoNoGoogle`;
  - `esperarRetorno(servidor, estado, prazoMs): Promise<string>` e `guardarToken(tokens, cofre): void`;
  - `fazerLogin(dep: DependenciasDoLogin): Promise<void>` e `fazerLogout(cofre, mostrar): void`;
  - em `src/login/acesso.ts`: `ClienteDeAcesso`, `obterTokenDe(cliente)` e `criarAcessoAoGoogle(credenciais, refreshToken)`.

- [ ] **Passo 1: escrever o teste que falha (`testes/login/login.test.ts`)**

O teste faz o papel do navegador: ele lê o endereço que o login mostra e volta para o `redirect_uri`, em 127.0.0.1, com o `code` e o `state`. A troca do código é de mentira. O arquivo é o `testes/login/login.test.ts`:

```ts
import type { OAuth2Client } from 'google-auth-library';
import { describe, expect, it } from 'vitest';
import { obterTokenDe } from '../../src/login/acesso.js';
import { type Cofre, criarCofre, type EntradaDoCofre } from '../../src/login/cofre.js';
import {
  fazerLogin,
  fazerLogout,
  type TokensDoLogin,
  type TrocarCodigo,
  trocarCodigoNoGoogle,
} from '../../src/login/login.js';

const GMAIL = 'https://www.googleapis.com/auth/gmail.readonly';
const AGENDA = 'https://www.googleapis.com/auth/calendar.readonly';
const CREDENCIAIS = { clientId: 'cliente-de-teste.apps.example', clientSecret: 'segredo-de-teste' };

/** Um cofre de mentira, em memória: os testes nunca tocam no cofre do sistema. */
function cofreDeMentira(): Cofre {
  let guardado: Uint8Array | null = null;
  const entrada: EntradaDoCofre = {
    setSecret: (segredo) => {
      guardado = Uint8Array.from(segredo);
    },
    getSecret: () => (guardado === null ? null : Array.from(guardado)),
    deleteCredential: () => {
      const havia = guardado !== null;
      guardado = null;
      return havia;
    },
  };
  return criarCofre(() => entrada);
}

interface Ensaio {
  login: Promise<void>;
  endereco: URL;
  mensagens: string[];
  trocas: Array<{ codigo: string; verificador: string; redirectUri: string }>;
  cofre: Cofre;
}

/** Sobe o login com o Google de mentira e espera o endereço aparecer no terminal. */
async function iniciar(tokens: TokensDoLogin, prazoMs = 10_000): Promise<Ensaio> {
  const mensagens: string[] = [];
  const trocas: Ensaio['trocas'] = [];
  const cofre = cofreDeMentira();
  let avisar: (texto: string) => void = () => {};
  const mostrado = new Promise<string>((resolver) => {
    avisar = resolver;
  });
  const trocarCodigo: TrocarCodigo = async (_cliente, codigo, verificador, redirectUri) => {
    trocas.push({ codigo, verificador, redirectUri });
    return tokens;
  };
  const login = fazerLogin({
    credenciais: CREDENCIAIS,
    cofre,
    mostrar: (texto) => {
      mensagens.push(texto);
      avisar(texto);
    },
    trocarCodigo,
    prazoMs,
  });
  login.catch(() => {});
  const primeira = await mostrado;
  const endereco = new URL(primeira.slice(primeira.indexOf('https://')));
  return { login, endereco, mensagens, trocas, cofre };
}

/** O navegador volta para o endereço de retorno, só em 127.0.0.1. */
async function voltar(endereco: URL, parametros: Record<string, string>, caminho = '/') {
  const retorno = new URL(endereco.searchParams.get('redirect_uri') ?? '');
  retorno.pathname = caminho;
  for (const [nome, valor] of Object.entries(parametros)) {
    retorno.searchParams.set(nome, valor);
  }
  return fetch(retorno);
}

describe('fazerLogin (S1, S3 e S4)', () => {
  it('monta o endereço com PKCE S256, state, acesso offline e os dois escopos', async () => {
    const ensaio = await iniciar({ refresh_token: 'rt-de-teste', scope: `${GMAIL} ${AGENDA}` });
    const p = ensaio.endereco.searchParams;
    expect(ensaio.endereco.origin).toBe('https://accounts.google.com');
    expect(p.get('response_type')).toBe('code');
    expect(p.get('client_id')).toBe(CREDENCIAIS.clientId);
    expect(p.get('redirect_uri')).toMatch(/^http:\/\/127\.0\.0\.1:\d+$/);
    expect(p.get('scope')).toBe(`${GMAIL} ${AGENDA}`);
    expect(p.get('access_type')).toBe('offline');
    expect(p.get('prompt')).toBe('consent');
    expect(p.get('code_challenge_method')).toBe('S256');
    expect(p.get('code_challenge')).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(p.get('state')).toMatch(/^[0-9a-f]{32}$/);
    expect(ensaio.endereco.toString()).not.toContain(CREDENCIAIS.clientSecret);
    await voltar(ensaio.endereco, { state: p.get('state') ?? '', code: 'codigo-de-teste' });
    await ensaio.login;
  });

  it('cada login tem um state e um code_challenge novos', async () => {
    const tokens = { refresh_token: 'rt-de-teste', scope: `${GMAIL} ${AGENDA}` };
    const primeiro = await iniciar(tokens);
    const segundo = await iniciar(tokens);
    const de = (ensaio: Ensaio, nome: string) => ensaio.endereco.searchParams.get(nome) ?? '';
    expect(de(primeiro, 'state')).not.toBe(de(segundo, 'state'));
    expect(de(primeiro, 'code_challenge')).not.toBe(de(segundo, 'code_challenge'));
    for (const ensaio of [primeiro, segundo]) {
      await voltar(ensaio.endereco, { state: de(ensaio, 'state'), code: 'codigo-de-teste' });
      await ensaio.login;
    }
  });

  it('com o state certo, troca o código e guarda o token, sem mostrar segredo', async () => {
    const ensaio = await iniciar({ refresh_token: 'rt-de-teste', scope: `${GMAIL} ${AGENDA}` });
    const estado = ensaio.endereco.searchParams.get('state') ?? '';
    const resposta = await voltar(ensaio.endereco, { state: estado, code: 'codigo-de-teste' });
    expect(await resposta.text()).toContain('Login recebido');
    await ensaio.login;
    expect(ensaio.trocas).toHaveLength(1);
    expect(ensaio.trocas[0]?.codigo).toBe('codigo-de-teste');
    expect(ensaio.trocas[0]?.verificador.length).toBeGreaterThanOrEqual(43);
    expect(ensaio.trocas[0]?.redirectUri).toBe(ensaio.endereco.searchParams.get('redirect_uri'));
    expect(ensaio.cofre.ler()).toBe('rt-de-teste');
    expect(ensaio.mensagens.at(-1)).toContain('Login feito');
    for (const texto of ensaio.mensagens) {
      expect(texto).not.toContain('codigo-de-teste');
      expect(texto).not.toContain('rt-de-teste');
      expect(texto).not.toContain(CREDENCIAIS.clientSecret);
    }
  });

  it('um pedido fora da raiz não encerra a espera', async () => {
    const ensaio = await iniciar({ refresh_token: 'rt-de-teste', scope: `${GMAIL} ${AGENDA}` });
    expect((await voltar(ensaio.endereco, {}, '/favicon.ico')).status).toBe(404);
    const estado = ensaio.endereco.searchParams.get('state') ?? '';
    await voltar(ensaio.endereco, { state: estado, code: 'codigo-de-teste' });
    await ensaio.login;
    expect(ensaio.cofre.ler()).toBe('rt-de-teste');
  });

  it('com o state errado, recusa sem trocar o código', async () => {
    const ensaio = await iniciar({ refresh_token: 'rt-de-teste', scope: `${GMAIL} ${AGENDA}` });
    const resposta = await voltar(ensaio.endereco, { state: 'outro', code: 'codigo-de-teste' });
    expect(await resposta.text()).toContain('não deu certo');
    await expect(ensaio.login).rejects.toThrow('o state não confere');
    expect(ensaio.trocas).toHaveLength(0);
    expect(ensaio.cofre.ler()).toBeNull();
  });

  it('quando o Google recusa, não troca nada', async () => {
    const ensaio = await iniciar({ refresh_token: 'rt-de-teste', scope: `${GMAIL} ${AGENDA}` });
    const estado = ensaio.endereco.searchParams.get('state') ?? '';
    await voltar(ensaio.endereco, { state: estado, error: 'access_denied' });
    await expect(ensaio.login).rejects.toThrow('o Google recusou');
    expect(ensaio.trocas).toHaveLength(0);
  });

  it('sem um dos escopos, não guarda o token (S1)', async () => {
    const ensaio = await iniciar({ refresh_token: 'rt-de-teste', scope: GMAIL });
    const estado = ensaio.endereco.searchParams.get('state') ?? '';
    await voltar(ensaio.endereco, { state: estado, code: 'codigo-de-teste' });
    await expect(ensaio.login).rejects.toThrow(`faltou permitir ${AGENDA}`);
    expect(ensaio.cofre.ler()).toBeNull();
  });

  it('sem o refresh token, não guarda nada', async () => {
    const ensaio = await iniciar({ scope: `${GMAIL} ${AGENDA}` });
    const estado = ensaio.endereco.searchParams.get('state') ?? '';
    await voltar(ensaio.endereco, { state: estado, code: 'codigo-de-teste' });
    await expect(ensaio.login).rejects.toThrow('não devolveu o token de atualização');
    expect(ensaio.cofre.ler()).toBeNull();
  });

  it('desiste no fim do prazo e fecha a porta', async () => {
    const ensaio = await iniciar({ refresh_token: 'rt-de-teste', scope: `${GMAIL} ${AGENDA}` }, 50);
    await expect(ensaio.login).rejects.toThrow('não terminou no prazo');
    await expect(voltar(ensaio.endereco, { state: 'x', code: 'y' })).rejects.toThrow();
  });
});

describe('trocarCodigoNoGoogle (S3 e S5)', () => {
  it('devolve os tokens da biblioteca', async () => {
    const cliente = {
      getToken: async () => ({ tokens: { refresh_token: 'rt', scope: GMAIL } }),
    } as unknown as OAuth2Client;
    expect(await trocarCodigoNoGoogle(cliente, 'c', 'v', 'http://127.0.0.1:1')).toEqual({
      refresh_token: 'rt',
      scope: GMAIL,
    });
  });

  it('num erro, não repete o código nem a resposta do Google', async () => {
    const cliente = {
      getToken: async () => {
        throw new Error('invalid_grant para o código codigo-secreto');
      },
    } as unknown as OAuth2Client;
    const falha = trocarCodigoNoGoogle(cliente, 'codigo-secreto', 'v', 'http://127.0.0.1:1');
    await expect(falha).rejects.toThrow('O Google não aceitou o código de autorização.');
    await expect(falha).rejects.not.toThrow('codigo-secreto');
  });
});

describe('fazerLogout (S4)', () => {
  it('apaga o token e diz quando não havia', () => {
    const cofre = cofreDeMentira();
    const mensagens: string[] = [];
    cofre.guardar('rt-de-teste');
    fazerLogout(cofre, (texto) => mensagens.push(texto));
    fazerLogout(cofre, (texto) => mensagens.push(texto));
    expect(mensagens).toEqual(['O token foi apagado do cofre.', 'Não havia token no cofre.']);
    expect(cofre.ler()).toBeNull();
  });
});

describe('obterTokenDe (S4 e S5)', () => {
  it('devolve o token de acesso', async () => {
    expect(await obterTokenDe({ getAccessToken: async () => ({ token: 'ya-de-teste' }) })()).toBe(
      'ya-de-teste',
    );
  });

  it('sem token, ou com erro, pede um novo login sem repetir a resposta', async () => {
    const vazio = obterTokenDe({ getAccessToken: async () => ({ token: null }) });
    await expect(vazio()).rejects.toThrow('Rode npm run login-google de novo.');
    const quebrado = obterTokenDe({
      getAccessToken: async () => {
        throw new Error('invalid_grant com rt-secreto');
      },
    });
    await expect(quebrado()).rejects.toThrow('o login vale 7 dias');
    await expect(quebrado()).rejects.not.toThrow('rt-secreto');
  });
});
```

- [ ] **Passo 2: rodar, ver falhar e commitar o vermelho**

```bash
npm test -- testes/login/login.test.ts
git add testes/login/login.test.ts
git commit -m "test: casos do login com PKCE e do acesso ao Google" -m "Teste vermelho do S1, do S3, do S4 e do S5: o endereço com PKCE S256, state e os dois escopos, o retorno em 127.0.0.1, o state errado, a recusa, os escopos, o prazo, o logout e o acesso, sem nenhum segredo nas mensagens."
```
Esperado: FALHA, porque `src/login/login.ts` e `src/login/acesso.ts` não existem.

- [ ] **Passo 3: escrever o login (`src/login/login.ts`)**

```ts
import { randomBytes } from 'node:crypto';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { CodeChallengeMethod, OAuth2Client } from 'google-auth-library';
import type { Cofre } from './cofre.js';
import type { CredenciaisDoCliente } from './credenciais.js';
import { conferirEscopos, ESCOPOS } from './escopos.js';

/** AD15: o retorno do navegador espera no máximo 5 minutos. */
export const PRAZO_DO_LOGIN_MS = 5 * 60 * 1000;

const PAGINA_OK =
  '<!doctype html><meta charset="utf-8"><title>coworkIA</title><p>Login recebido. Pode fechar esta aba e voltar ao terminal.</p>';
const PAGINA_ERRO =
  '<!doctype html><meta charset="utf-8"><title>coworkIA</title><p>O login não deu certo. Volte ao terminal para ver o motivo.</p>';

export interface TokensDoLogin {
  refresh_token?: string | null | undefined;
  scope?: string | undefined;
}

export type TrocarCodigo = (
  cliente: OAuth2Client,
  codigo: string,
  verificador: string,
  redirectUri: string,
) => Promise<TokensDoLogin>;

/** S3: a troca usa a google-auth-library; a mensagem de erro nunca traz o código nem a resposta. */
export const trocarCodigoNoGoogle: TrocarCodigo = async (
  cliente,
  codigo,
  verificador,
  redirectUri,
) => {
  try {
    const { tokens } = await cliente.getToken({
      code: codigo,
      codeVerifier: verificador,
      redirect_uri: redirectUri,
    });
    return tokens;
  } catch {
    throw new Error(
      'O Google não aceitou o código de autorização. Rode npm run login-google de novo.',
    );
  }
};

/** S3: atende uma única volta, confere o state e responde uma página simples. */
export function esperarRetorno(servidor: Server, estado: string, prazoMs: number): Promise<string> {
  return new Promise((resolver, rejeitar) => {
    const tempo = setTimeout(() => {
      rejeitar(new Error('O login não terminou no prazo. Rode npm run login-google de novo.'));
    }, prazoMs);
    servidor.on('request', (pedido, resposta) => {
      const url = new URL(pedido.url ?? '/', 'http://127.0.0.1');
      if (url.pathname !== '/') {
        resposta.writeHead(404).end();
        return;
      }
      clearTimeout(tempo);
      const codigo = url.searchParams.get('code');
      const valido =
        url.searchParams.get('error') === null &&
        codigo !== null &&
        url.searchParams.get('state') === estado;
      resposta.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
      resposta.end(valido ? PAGINA_OK : PAGINA_ERRO);
      if (valido) {
        resolver(codigo);
      } else {
        rejeitar(
          new Error(
            'O retorno do login não foi aceito: o Google recusou ou o state não confere. Rode npm run login-google de novo.',
          ),
        );
      }
    });
  });
}

/** S1 e S4: confere os escopos e o token antes de guardar. */
export function guardarToken(tokens: TokensDoLogin, cofre: Cofre): void {
  const problema = conferirEscopos(tokens.scope);
  if (problema !== null) {
    throw new Error(problema);
  }
  const token = tokens.refresh_token ?? '';
  if (token === '') {
    throw new Error(
      'O Google não devolveu o token de atualização. Rode npm run login-google de novo.',
    );
  }
  cofre.guardar(token);
}

export interface DependenciasDoLogin {
  credenciais: CredenciaisDoCliente;
  cofre: Cofre;
  mostrar: (texto: string) => void;
  trocarCodigo?: TrocarCodigo;
  prazoMs?: number;
}

/** S3: PKCE (S256), state aleatório e retorno em http://127.0.0.1, numa porta livre. */
export async function fazerLogin(dep: DependenciasDoLogin): Promise<void> {
  const servidor = createServer();
  await new Promise<void>((resolver) => {
    servidor.listen(0, '127.0.0.1', resolver);
  });
  try {
    const { address, port } = servidor.address() as AddressInfo;
    const redirectUri = `http://${address}:${port}`;
    const cliente = new OAuth2Client({
      clientId: dep.credenciais.clientId,
      clientSecret: dep.credenciais.clientSecret,
      redirectUri,
    });
    const { codeVerifier, codeChallenge } = await cliente.generateCodeVerifierAsync();
    const estado = randomBytes(16).toString('hex');
    const endereco = cliente.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: [...ESCOPOS],
      code_challenge_method: CodeChallengeMethod.S256,
      code_challenge: codeChallenge ?? '',
      state: estado,
    });
    dep.mostrar(
      `Abra este endereço no navegador e permita a leitura do Gmail e da Agenda:\n${endereco}`,
    );
    const codigo = await esperarRetorno(servidor, estado, dep.prazoMs ?? PRAZO_DO_LOGIN_MS);
    const trocar = dep.trocarCodigo ?? trocarCodigoNoGoogle;
    guardarToken(await trocar(cliente, codigo, codeVerifier, redirectUri), dep.cofre);
    dep.mostrar(
      'Login feito. O token está no cofre do sistema. Para usar o Gmail, defina COWORKIA_MODO=google.',
    );
  } finally {
    servidor.close();
  }
}

/** S4: o logout apaga o token do cofre. */
export function fazerLogout(cofre: Cofre, mostrar: (texto: string) => void): void {
  mostrar(cofre.apagar() ? 'O token foi apagado do cofre.' : 'Não havia token no cofre.');
}
```

- [ ] **Passo 4: escrever o acesso (`src/login/acesso.ts`)**

```ts
import { OAuth2Client } from 'google-auth-library';
import type { CredenciaisDoCliente } from './credenciais.js';

/** O que o coworkIA usa do OAuth2Client para pedir um token de acesso. */
export interface ClienteDeAcesso {
  getAccessToken(): Promise<{ token?: string | null | undefined }>;
}

/** S4: o token de acesso é pedido de novo a cada sessão; o erro nunca traz o token nem a resposta. */
export function obterTokenDe(cliente: ClienteDeAcesso): () => Promise<string> {
  return async () => {
    let token: string | null | undefined;
    try {
      ({ token } = await cliente.getAccessToken());
    } catch {
      token = null;
    }
    if (token === null || token === undefined || token === '') {
      throw new Error(
        'O Google não renovou o acesso. Com o app em teste, o login vale 7 dias. Rode npm run login-google de novo.',
      );
    }
    return token;
  };
}

/** S3: o cliente OAuth do usuário, com o refresh token do cofre. */
export function criarAcessoAoGoogle(
  credenciais: CredenciaisDoCliente,
  refreshToken: string,
): () => Promise<string> {
  const cliente = new OAuth2Client({
    clientId: credenciais.clientId,
    clientSecret: credenciais.clientSecret,
  });
  cliente.setCredentials({ refresh_token: refreshToken });
  return obterTokenDe(cliente);
}
```

- [ ] **Passo 5: rodar, ver passar, conferir e commitar o verde**

```bash
npm test -- testes/login/login.test.ts
npm run formatar && npm run lint && npm run tipos && npm run build
git add src/login/login.ts src/login/acesso.ts
git commit -m "feat: login com PKCE e acesso ao Google" -m "S3: PKCE S256, state aleatório e retorno em 127.0.0.1, numa porta livre, com um servidor próprio que atende uma volta e fecha; a troca usa a google-auth-library. S1 e S4: o token só vai para o cofre com os dois escopos. S5: nenhuma mensagem traz o código, o token, o client secret ou a resposta do Google."
```

**Mutações:**
- Em `esperarRetorno`, trocar `url.searchParams.get('state') === estado` por `true`: cai "com o state errado, recusa sem trocar o código".
- Em `fazerLogin`, trocar `CodeChallengeMethod.S256` por `CodeChallengeMethod.Plain`: cai "monta o endereço com PKCE S256, state, acesso offline e os dois escopos".
- Em `guardarToken`, trocar `if (problema !== null) {` por `if (problema === 'nunca') {`: cai "sem um dos escopos, não guarda o token (S1)".
- Em `fazerLogin`, trocar `servidor.listen(0, '127.0.0.1', resolver);` por `servidor.listen(0, resolver);`, que escuta em todos os endereços (ca1 do auditor): cai "monta o endereço com PKCE S256, state, acesso offline e os dois escopos", porque o `redirect_uri` vem do endereço em que o servidor escuta.
- Em `fazerLogin`, tirar a linha `prompt: 'consent',` (ca2 do auditor): cai o mesmo teste.
- Em `fazerLogin`, trocar `const estado = randomBytes(16).toString('hex');` por `const estado = 'a'.repeat(32);` (ca3 do auditor): cai "cada login tem um state e um code_challenge novos".
- Em `fazerLogin`, tirar o `servidor.close();` do `finally`: cai "desiste no fim do prazo e fecha a porta".
- Em `obterTokenDe`, trocar `token = null;` por `throw new Error('quebrou com rt-secreto');`, que simula repetir a resposta do Google: cai "sem token, ou com erro, pede um novo login sem repetir a resposta".

---

### Tarefa 6: a mensagem do Gmail (7.1, 7.2, AD12 e AD13)

**Arquivos:**
- Criar: `src/fontes/google/gmail.ts`
- Teste: `testes/fontes/gmail.test.ts`

**Interfaces:**
- Produz:
  - `ParteDaMensagem`, `esquemaMensagemDaApi` e `MensagemDaApi`;
  - `decodificarPalavras(valor: string): string` (AD13);
  - `lerEnderecos(valor: string): Pessoa[]`;
  - `mensagemParaEmail(mensagem: MensagemDaApi, fuso: string): Email`.

- [ ] **Passo 1: escrever o teste que falha (`testes/fontes/gmail.test.ts`)**

```ts
import { DateTime } from 'luxon';
import { describe, expect, it } from 'vitest';
import {
  decodificarPalavras,
  esquemaMensagemDaApi,
  lerEnderecos,
  type MensagemDaApi,
  mensagemParaEmail,
} from '../../src/fontes/google/gmail.js';

const SP = 'America/Sao_Paulo';
const B64 = (texto: string) => Buffer.from(texto, 'utf8').toString('base64');
const B64URL_UTF8 = (texto: string) => Buffer.from(texto, 'utf8').toString('base64url');
const B64URL_LATIN1 = (texto: string) => Buffer.from(texto, 'latin1').toString('base64url');
const NOVE_DA_MANHA = String(DateTime.fromISO('2026-11-04T12:00:00Z').toMillis());

describe('decodificarPalavras (AD13)', () => {
  it('decodifica B em UTF-8 e Q em ISO-8859-1', () => {
    expect(decodificarPalavras(`=?UTF-8?B?${B64('Olá, ação')}?=`)).toBe('Olá, ação');
    expect(decodificarPalavras('=?ISO-8859-1?Q?Jo=E3o_Silva?=')).toBe('João Silva');
  });

  it('junta palavras codificadas vizinhas e mantém o texto em volta', () => {
    expect(decodificarPalavras('Re: =?UTF-8?Q?Or=C3=A7a?= =?UTF-8?Q?mento?= final')).toBe(
      'Re: Orçamento final',
    );
  });

  it('um texto já decodificado passa igual', () => {
    expect(decodificarPalavras('Olá, tudo bem? =?não é codificado')).toBe(
      'Olá, tudo bem? =?não é codificado',
    );
  });

  it('com um charset desconhecido, deixa a palavra como veio', () => {
    expect(decodificarPalavras('=?x-inventado?Q?abc?=')).toBe('=?x-inventado?Q?abc?=');
  });
});

describe('lerEnderecos', () => {
  it('lê nome e endereço, com vírgula entre aspas e nome codificado', () => {
    expect(
      lerEnderecos(
        `Ana Ribeiro <ana@example.com>, "Silva, João" <joao@example.org>, bia@example.com, =?UTF-8?B?${B64('Você')}?= <voce@example.com>`,
      ),
    ).toEqual([
      { nome: 'Ana Ribeiro', endereco: 'ana@example.com' },
      { nome: 'Silva, João', endereco: 'joao@example.org' },
      { nome: '', endereco: 'bia@example.com' },
      { nome: 'Você', endereco: 'voce@example.com' },
    ]);
  });

  it('um cabeçalho vazio dá uma lista vazia', () => {
    expect(lerEnderecos('')).toEqual([]);
  });
});

function mensagem(parcial: Partial<MensagemDaApi>): MensagemDaApi {
  return {
    id: 'm1',
    labelIds: ['INBOX', 'UNREAD'],
    internalDate: NOVE_DA_MANHA,
    payload: {
      mimeType: 'multipart/mixed',
      headers: [
        { name: 'From', value: 'Ana Ribeiro <ana@example.com>' },
        { name: 'To', value: 'Você <voce@example.com>, time@example.com' },
        { name: 'Cc', value: 'Carlos Lima <carlos@example.org>' },
        { name: 'Subject', value: `=?UTF-8?B?${B64('Orçamento revisado')}?=` },
        { name: 'List-Unsubscribe', value: '<mailto:sair@example.com>' },
        { name: 'Precedence', value: 'bulk' },
      ],
      parts: [
        {
          mimeType: 'multipart/alternative',
          parts: [
            {
              mimeType: 'text/plain',
              headers: [{ name: 'Content-Type', value: 'text/plain; charset=UTF-8' }],
              body: { data: B64URL_UTF8('Segue o orçamento.') },
            },
            {
              mimeType: 'text/html',
              headers: [{ name: 'Content-Type', value: 'text/html; charset=UTF-8' }],
              body: { data: B64URL_UTF8('<p>Segue o <b>orçamento</b>.</p>') },
            },
          ],
        },
        {
          mimeType: 'application/pdf',
          filename: 'proposta.pdf',
          body: { attachmentId: 'anexo-1' },
        },
      ],
    },
    ...parcial,
  };
}

describe('mensagemParaEmail (7.1, 7.2, AD12 e AD13)', () => {
  it('converte o remetente, os destinatários, o assunto, a data, os corpos e os cabeçalhos', () => {
    expect(mensagemParaEmail(mensagem({}), SP)).toEqual({
      id: 'm1',
      de: { nome: 'Ana Ribeiro', endereco: 'ana@example.com' },
      para: [
        { nome: 'Você', endereco: 'voce@example.com' },
        { nome: '', endereco: 'time@example.com' },
      ],
      cc: [{ nome: 'Carlos Lima', endereco: 'carlos@example.org' }],
      assunto: 'Orçamento revisado',
      data: '2026-11-04T09:00:00-03:00',
      corpoTexto: 'Segue o orçamento.',
      corpoHtml: '<p>Segue o <b>orçamento</b>.</p>',
      cabecalhos: { 'list-unsubscribe': '<mailto:sair@example.com>', precedence: 'bulk' },
      lido: false,
      temAnexo: true,
    });
  });

  it('sem o rótulo UNREAD é lido; uma mensagem simples tem o corpo na raiz', () => {
    const email = mensagemParaEmail(
      mensagem({
        labelIds: ['INBOX'],
        payload: {
          mimeType: 'text/plain',
          headers: [{ name: 'From', value: 'bia@example.com' }],
          body: { data: B64URL_UTF8('Oi!') },
        },
      }),
      SP,
    );
    expect(email).toMatchObject({
      de: { nome: '', endereco: 'bia@example.com' },
      para: [],
      assunto: '',
      corpoTexto: 'Oi!',
      corpoHtml: null,
      cabecalhos: {},
      lido: true,
      temAnexo: false,
    });
  });

  it('só com HTML, decodifica pelo charset da parte', () => {
    const email = mensagemParaEmail(
      mensagem({
        payload: {
          mimeType: 'text/html',
          headers: [
            { name: 'From', value: 'loja@example.org' },
            { name: 'Content-Type', value: 'text/html; charset="ISO-8859-1"' },
          ],
          body: { data: B64URL_LATIN1('<p>Promoção</p>') },
        },
      }),
      SP,
    );
    expect(email.corpoTexto).toBeNull();
    expect(email.corpoHtml).toBe('<p>Promoção</p>');
  });

  it('o esquema recusa uma mensagem sem a data interna em milissegundos', () => {
    expect(esquemaMensagemDaApi.safeParse(mensagem({})).success).toBe(true);
    expect(esquemaMensagemDaApi.safeParse({ ...mensagem({}), internalDate: 'ontem' }).success).toBe(
      false,
    );
  });
});
```

- [ ] **Passo 2: rodar, ver falhar e commitar o vermelho**

```bash
npm test -- testes/fontes/gmail.test.ts
git add testes/fontes/gmail.test.ts
git commit -m "test: casos da conversão das mensagens do Gmail" -m "Teste vermelho do 7.1, do 7.2, do AD12 e do AD13: as palavras codificadas, os endereços com vírgula entre aspas, os corpos pelo charset, o anexo, o rótulo UNREAD e a data interna, com mensagens escritas à mão no formato documentado (AD16)."
```
Esperado: FALHA, porque `src/fontes/google/gmail.ts` não existe.

- [ ] **Passo 3: escrever a conversão (`src/fontes/google/gmail.ts`)**

```ts
import { DateTime } from 'luxon';
import { z } from 'zod';
import type { Email, Pessoa } from '../../dominio.js';
import { paraIso } from '../../tempo.js';

export interface ParteDaMensagem {
  mimeType?: string | undefined;
  filename?: string | undefined;
  headers?: Array<{ name: string; value: string }> | undefined;
  body?: { data?: string | undefined; attachmentId?: string | undefined } | undefined;
  parts?: ParteDaMensagem[] | undefined;
}

const esquemaParte: z.ZodType<ParteDaMensagem> = z.lazy(() =>
  z.object({
    mimeType: z.string().optional(),
    filename: z.string().optional(),
    headers: z.array(z.object({ name: z.string(), value: z.string() })).optional(),
    body: z.object({ data: z.string().optional(), attachmentId: z.string().optional() }).optional(),
    parts: z.array(esquemaParte).optional(),
  }),
);

/** O recurso Message da Gmail API (format=full), só com os campos que o coworkIA usa. */
export const esquemaMensagemDaApi = z.object({
  id: z.string(),
  labelIds: z.array(z.string()).optional(),
  internalDate: z.string().regex(/^\d+$/),
  payload: esquemaParte,
});

export type MensagemDaApi = z.infer<typeof esquemaMensagemDaApi>;

const PALAVRA_CODIFICADA = /=\?([^?\s]+)\?([BbQq])\?([^?\s]*)\?=/g;

function decodificarBytes(bytes: Uint8Array, charset: string): string | null {
  try {
    return new TextDecoder(charset.toLowerCase()).decode(bytes);
  } catch {
    return null;
  }
}

/** AD13: decodifica as palavras do RFC 2047 (B e Q); um texto já decodificado passa igual. */
export function decodificarPalavras(valor: string): string {
  const juntas = valor.replace(/(\?=)\s+(?==\?)/g, '$1');
  return juntas.replace(
    PALAVRA_CODIFICADA,
    (original, charset: string, modo: string, texto: string) => {
      const bytes =
        modo.toUpperCase() === 'B'
          ? Uint8Array.from(Buffer.from(texto, 'base64'))
          : Uint8Array.from(
              Buffer.from(
                texto
                  .replace(/_/g, ' ')
                  .replace(/=([0-9A-Fa-f]{2})/g, (_, hexa: string) =>
                    String.fromCharCode(Number.parseInt(hexa, 16)),
                  ),
                'latin1',
              ),
            );
      return decodificarBytes(bytes, charset) ?? original;
    },
  );
}

/** Separa uma lista de endereços pelas vírgulas que não estão entre aspas nem entre < e >. */
function separarEnderecos(valor: string): string[] {
  const partes: string[] = [];
  let atual = '';
  let aspas = false;
  let angulo = false;
  let escapado = false;
  for (const caractere of valor) {
    if (escapado) {
      atual += caractere;
      escapado = false;
    } else if (caractere === '\\' && aspas) {
      escapado = true;
    } else if (caractere === '"') {
      aspas = !aspas;
    } else if (caractere === '<' && !aspas) {
      angulo = true;
      atual += caractere;
    } else if (caractere === '>' && !aspas) {
      angulo = false;
      atual += caractere;
    } else if (caractere === ',' && !aspas && !angulo) {
      partes.push(atual);
      atual = '';
    } else {
      atual += caractere;
    }
  }
  partes.push(atual);
  return partes.map((parte) => parte.trim()).filter((parte) => parte !== '');
}

/** "Nome <endereco>", "endereco" ou "Sobrenome, Nome" <endereco>, separados por vírgula. */
export function lerEnderecos(valor: string): Pessoa[] {
  return separarEnderecos(valor).map((parte) => {
    const comNome = /^(.*)<([^>]*)>$/.exec(parte);
    if (comNome === null) {
      return { nome: '', endereco: parte };
    }
    return {
      nome: decodificarPalavras((comNome[1] ?? '').trim()),
      endereco: (comNome[2] ?? '').trim(),
    };
  });
}

function cabecalho(parte: ParteDaMensagem, nome: string): string | undefined {
  return parte.headers?.find((item) => item.name.toLowerCase() === nome)?.value;
}

function charsetDa(parte: ParteDaMensagem): string {
  const tipo = cabecalho(parte, 'content-type') ?? '';
  return /charset="?([^";\s]+)"?/i.exec(tipo)?.[1] ?? 'utf-8';
}

/** O body.data vem em base64url; o texto segue o charset da parte, com UTF-8 como padrão (AD13). */
function textoDaParte(parte: ParteDaMensagem): string | null {
  const dados = parte.body?.data;
  if (dados === undefined) {
    return null;
  }
  const bytes = Uint8Array.from(Buffer.from(dados, 'base64url'));
  return decodificarBytes(bytes, charsetDa(parte)) ?? decodificarBytes(bytes, 'utf-8');
}

function todasAsPartes(parte: ParteDaMensagem): ParteDaMensagem[] {
  return [parte, ...(parte.parts ?? []).flatMap(todasAsPartes)];
}

function ehAnexo(parte: ParteDaMensagem): boolean {
  return (parte.filename ?? '') !== '';
}

function primeiroCorpo(partes: ParteDaMensagem[], tipo: string): string | null {
  const parte = partes.find(
    (item) => !ehAnexo(item) && (item.mimeType ?? '').toLowerCase() === tipo,
  );
  return parte === undefined ? null : textoDaParte(parte);
}

const CABECALHOS_DA_TRIAGEM = ['list-unsubscribe', 'precedence'] as const;

/** 7.1 e 7.2: converte a mensagem da Gmail API no Email do domínio. */
export function mensagemParaEmail(mensagem: MensagemDaApi, fuso: string): Email {
  const raiz = mensagem.payload;
  const partes = todasAsPartes(raiz);
  const cabecalhos: Record<string, string> = {};
  for (const nome of CABECALHOS_DA_TRIAGEM) {
    const valor = cabecalho(raiz, nome);
    if (valor !== undefined) {
      cabecalhos[nome] = valor;
    }
  }
  return {
    id: mensagem.id,
    de: lerEnderecos(cabecalho(raiz, 'from') ?? '')[0] ?? { nome: '', endereco: '' },
    para: lerEnderecos(cabecalho(raiz, 'to') ?? ''),
    cc: lerEnderecos(cabecalho(raiz, 'cc') ?? ''),
    assunto: decodificarPalavras(cabecalho(raiz, 'subject') ?? ''),
    data: paraIso(DateTime.fromMillis(Number(mensagem.internalDate)).setZone(fuso)),
    corpoTexto: primeiroCorpo(partes, 'text/plain'),
    corpoHtml: primeiroCorpo(partes, 'text/html'),
    cabecalhos,
    lido: !(mensagem.labelIds ?? []).includes('UNREAD'),
    temAnexo: partes.some(ehAnexo),
  };
}
```

- [ ] **Passo 4: rodar, ver passar, conferir e commitar o verde**

```bash
npm test -- testes/fontes/gmail.test.ts
npm run formatar && npm run lint && npm run tipos && npm run build
git add src/fontes/google/gmail.ts
git commit -m "feat: conversão das mensagens do Gmail" -m "7.1, 7.2, AD12 e AD13: a mensagem da Gmail API vira o Email do domínio, com os cabeçalhos decodificados, o corpo pelo charset da parte, o anexo pelo nome do arquivo, o não lido pelo rótulo UNREAD e a data pelo internalDate, no fuso."
```

**Mutações:**
- Trocar `!(mensagem.labelIds ?? []).includes('UNREAD')` por `true`: cai "converte o remetente, os destinatários, o assunto, a data, os corpos e os cabeçalhos".
- Em `textoDaParte`, trocar `charsetDa(parte)` por `'utf-8'`: cai "só com HTML, decodifica pelo charset da parte".
- Em `separarEnderecos`, trocar `caractere === ',' && !aspas && !angulo` por `caractere === ',' && !angulo`: cai "lê nome e endereço, com vírgula entre aspas e nome codificado".
- Em `decodificarPalavras`, trocar `valor.replace(/(\?=)\s+(?==\?)/g, '$1')` por `valor`: cai "junta palavras codificadas vizinhas e mantém o texto em volta".

---

### Tarefa 7: as fontes do Gmail e da Agenda (7.1 a 7.5, AD10 e AD11)

**Arquivos:**
- Criar: `src/fontes/google/fonte-google.ts`
- Teste: `testes/fontes/fonte-google.test.ts`

**Interfaces:**
- Consome: `casaComFiltro` (Tarefa 2); `esquemaMensagemDaApi` e `mensagemParaEmail` (Tarefa 6); `esquemaEventoDaApi` e `eventoDaApi` (plano B).
- Produz:
  - `LIMITE_DE_LEITURA = 200` e `PAGINAS_DA_AGENDA = 4`;
  - `type Buscar`, o pedaço do `fetch` que a fonte usa, e `ConfigFonteGoogle { buscar; obterToken; fuso }`;
  - `consultaDoGmail(filtro): string` (AD11);
  - `criarFontesGoogle(cfg: ConfigFonteGoogle): Fontes`.

- [ ] **Passo 1: escrever o teste que falha (`testes/fontes/fonte-google.test.ts`)**

```ts
import { DateTime } from 'luxon';
import { describe, expect, it } from 'vitest';
import {
  type Buscar,
  consultaDoGmail,
  criarFontesGoogle,
  LIMITE_DE_LEITURA,
} from '../../src/fontes/google/fonte-google.js';
import type { MensagemDaApi } from '../../src/fontes/google/gmail.js';
import { lerDataHora } from '../../src/tempo.js';

const SP = 'America/Sao_Paulo';
const hora = (texto: string) => lerDataHora(texto, SP);

/** AD16: uma mensagem da Gmail API escrita à mão, no formato documentado. */
function mensagem(id: string, quando: string, de: string, assunto: string, rotulos = ['INBOX']) {
  const corpo: MensagemDaApi = {
    id,
    labelIds: rotulos,
    internalDate: String(DateTime.fromISO(quando, { zone: SP }).toMillis()),
    payload: {
      mimeType: 'text/plain',
      headers: [
        { name: 'From', value: de },
        { name: 'To', value: 'Você <voce@example.com>' },
        { name: 'Subject', value: assunto },
      ],
      body: { data: Buffer.from(`Corpo de ${assunto}.`, 'utf8').toString('base64url') },
    },
  };
  return corpo;
}

interface Pedido {
  url: URL;
  autorizacao: string | undefined;
}

/** Um Google de mentira: responde pelas rotas e anota cada pedido; nada sai da máquina. */
function googleDeMentira(responder: (url: URL) => unknown) {
  const pedidos: Pedido[] = [];
  const buscar: Buscar = async (endereco, opcoes) => {
    const url = new URL(endereco);
    pedidos.push({ url, autorizacao: opcoes.headers.authorization });
    const corpo = responder(url);
    if (typeof corpo === 'number') {
      return { ok: false, status: corpo, json: async () => ({}) };
    }
    return { ok: true, status: 200, json: async () => corpo };
  };
  const fontes = criarFontesGoogle({ buscar, obterToken: async () => 'token-de-teste', fuso: SP });
  return { fontes, pedidos };
}

const CAIXA: Record<string, MensagemDaApi> = {
  m1: mensagem('m1', '2026-11-04T09:00', 'Ana Ribeiro <ana@example.com>', 'Reunião'),
  m2: mensagem('m2', '2026-11-04T10:00', 'Carlos Lima <carlos@example.org>', 'Relatório', [
    'INBOX',
    'UNREAD',
  ]),
  m3: mensagem('m3', '2026-11-03T18:00', 'Bia Souza <bia@example.com>', 'Fotos'),
};

function caixaDeTres(url: URL): unknown {
  if (url.pathname.endsWith('/messages')) {
    return url.searchParams.get('pageToken') === 'p2'
      ? { messages: [{ id: 'm3' }] }
      : { messages: [{ id: 'm1' }, { id: 'm2' }], nextPageToken: 'p2' };
  }
  const id = url.pathname.split('/').at(-1) ?? '';
  return CAIXA[id] ?? 404;
}

const ids = (emails: Array<{ id: string }>) => emails.map((email) => email.id);

describe('consultaDoGmail (AD11)', () => {
  it('estreita pelo não lido e pelas datas em segundos, com 1 segundo de folga em cada ponta', () => {
    expect(
      consultaDoGmail({
        limite: 20,
        naoLidos: true,
        desde: hora('2026-11-04T10:30'),
        ate: hora('2026-11-05'),
      }),
    ).toBe('is:unread after:1793798999 before:1793847601');
    expect(consultaDoGmail({ limite: 20, remetente: 'ana', busca: 'x' })).toBe('');
  });
});

describe('fonte de e-mail do Google (7.1, 7.2, 7.3, AD10 e AD11)', () => {
  it('lê o endereço do perfil uma vez só, com o token no cabeçalho', async () => {
    const { fontes, pedidos } = googleDeMentira(() => ({ emailAddress: 'voce@gmail.example' }));
    expect(await fontes.email.enderecoDoUsuario()).toBe('voce@gmail.example');
    expect(await fontes.email.enderecoDoUsuario()).toBe('voce@gmail.example');
    expect(pedidos).toHaveLength(1);
    expect(pedidos[0]?.url.toString()).toBe(
      'https://gmail.googleapis.com/gmail/v1/users/me/profile',
    );
    expect(pedidos[0]?.autorizacao).toBe('Bearer token-de-teste');
  });

  it('lista a caixa de entrada pelas páginas, do mais novo para o mais velho', async () => {
    const { fontes, pedidos } = googleDeMentira(caixaDeTres);
    const pagina = await fontes.email.listar({ limite: 10 });
    expect(ids(pagina.emails)).toEqual(['m2', 'm1', 'm3']);
    expect(pagina.completo).toBe(true);
    const listas = pedidos.filter((pedido) => pedido.url.pathname.endsWith('/messages'));
    expect(listas.map((pedido) => pedido.url.searchParams.get('labelIds'))).toEqual([
      'INBOX',
      'INBOX',
    ]);
    expect(listas.map((pedido) => pedido.url.searchParams.get('maxResults'))).toEqual([
      '100',
      '100',
    ]);
    expect(listas[1]?.url.searchParams.get('pageToken')).toBe('p2');
    expect(
      pedidos
        .filter((pedido) => !pedido.url.pathname.endsWith('/messages'))
        .map((pedido) => pedido.url.searchParams.get('format')),
    ).toEqual(['full', 'full', 'full']);
  });

  it('aplica o remetente, a busca e o período exatos no coworkIA (AD11)', async () => {
    const { fontes } = googleDeMentira(caixaDeTres);
    expect(ids((await fontes.email.listar({ limite: 10, remetente: 'CARLOS' })).emails)).toEqual([
      'm2',
    ]);
    expect(ids((await fontes.email.listar({ limite: 10, busca: 'relatorio' })).emails)).toEqual([
      'm2',
    ]);
    expect(
      ids((await fontes.email.listar({ limite: 10, desde: hora('2026-11-04T09:30') })).emails),
    ).toEqual(['m2']);
    expect(ids((await fontes.email.listar({ limite: 10, naoLidos: true })).emails)).toEqual(['m2']);
  });

  it('para quando passa do limite e diz que ficou incompleto', async () => {
    const { fontes, pedidos } = googleDeMentira(caixaDeTres);
    const pagina = await fontes.email.listar({ limite: 1 });
    expect(ids(pagina.emails)).toEqual(['m2']);
    expect(pagina.completo).toBe(false);
    expect(pedidos.some((pedido) => pedido.url.pathname.endsWith('/m3'))).toBe(false);
  });

  it('lê no máximo 200 e-mails por chamada', async () => {
    const muitos = Array.from({ length: LIMITE_DE_LEITURA + 1 }, (_, i) => ({ id: `x${i}` }));
    const { fontes, pedidos } = googleDeMentira((url) =>
      url.pathname.endsWith('/messages')
        ? { messages: muitos }
        : mensagem(url.pathname.split('/').at(-1) ?? '', '2026-11-04T08:00', 'a@example.com', 'x'),
    );
    const pagina = await fontes.email.listar({ limite: 500 });
    expect(LIMITE_DE_LEITURA).toBe(200);
    expect(pagina.emails).toHaveLength(200);
    expect(pagina.completo).toBe(false);
    expect(pedidos.filter((pedido) => !pedido.url.pathname.endsWith('/messages'))).toHaveLength(
      200,
    );
  });

  it('lê pelo id e devolve nulo no 404', async () => {
    const { fontes, pedidos } = googleDeMentira(caixaDeTres);
    expect((await fontes.email.ler('m1'))?.assunto).toBe('Reunião');
    expect(await fontes.email.ler('não existe/..')).toBeNull();
    expect(pedidos.at(-1)?.url.pathname).toBe('/gmail/v1/users/me/messages/n%C3%A3o%20existe%2F..');
  });

  it('um erro da API diz só o status, sem o token (S5)', async () => {
    const { fontes } = googleDeMentira(() => 500);
    const falha = fontes.email.enderecoDoUsuario();
    await expect(falha).rejects.toThrow('A API do Google respondeu com o status 500.');
    await expect(falha).rejects.not.toThrow('token-de-teste');
  });
});

describe('triagem no Google (7.3 e #93)', () => {
  it('com a busca em segundos, o limite de 200 não se gasta fora da janela', async () => {
    const agora = hora('2026-11-04T10:30');
    const dentro = Array.from({ length: 150 }, (_, i) =>
      mensagem(`d${i}`, agora.minus({ minutes: 5 + i * 9 }).toISO() ?? '', 'a@example.com', 'x'),
    );
    const fora = Array.from({ length: 100 }, (_, i) =>
      mensagem(
        `f${i}`,
        agora.minus({ hours: 25, minutes: i * 6 }).toISO() ?? '',
        'a@example.com',
        'x',
      ),
    );
    const caixa = [...dentro, ...fora];
    /** Um Gmail de mentira que respeita o after: em segundos, como o de verdade. */
    const { fontes } = googleDeMentira((url) => {
      if (url.pathname.endsWith('/messages')) {
        const depois = Number(/after:(\d+)/.exec(url.searchParams.get('q') ?? '')?.[1] ?? 0);
        return {
          messages: caixa
            .filter((item) => Number(item.internalDate) / 1000 > depois)
            .map((item) => ({ id: item.id })),
        };
      }
      return caixa.find((item) => item.id === url.pathname.split('/').at(-1)) ?? 404;
    });
    const pagina = await fontes.email.listar({
      limite: LIMITE_DE_LEITURA,
      desde: agora.minus({ hours: 24 }),
    });
    expect(pagina.emails).toHaveLength(150);
    expect(pagina.completo).toBe(true);
  });
});

describe('fonte de agenda do Google (7.4 e 7.5)', () => {
  const evento = (id: string, inicio: string, fim: string) => ({
    id,
    status: 'confirmed',
    summary: id,
    start: { dateTime: inicio },
    end: { dateTime: fim },
  });

  it('lê a agenda principal com as ocorrências abertas, pelas páginas', async () => {
    const { fontes, pedidos } = googleDeMentira((url) =>
      url.searchParams.get('pageToken') === 'q2'
        ? { items: [evento('b', '2026-11-04T14:00:00-03:00', '2026-11-04T15:00:00-03:00')] }
        : {
            items: [evento('a', '2026-11-04T09:00:00-03:00', '2026-11-04T10:00:00-03:00')],
            nextPageToken: 'q2',
          },
    );
    const eventos = await fontes.agenda.listar({
      inicio: hora('2026-11-04'),
      fim: hora('2026-11-05'),
    });
    expect(eventos.map((item) => item.id)).toEqual(['a', 'b']);
    expect(eventos[0]?.inicio).toEqual({ dataHora: '2026-11-04T09:00:00-03:00' });
    const primeiro = pedidos[0]?.url;
    expect(primeiro?.origin + (primeiro?.pathname ?? '')).toBe(
      'https://www.googleapis.com/calendar/v3/calendars/primary/events',
    );
    expect(Object.fromEntries(primeiro?.searchParams ?? [])).toEqual({
      timeMin: '2026-11-04T00:00:00-03:00',
      timeMax: '2026-11-05T00:00:00-03:00',
      singleEvents: 'true',
      orderBy: 'startTime',
      maxResults: '250',
    });
    expect(pedidos[1]?.url.searchParams.get('pageToken')).toBe('q2');
  });

  it('um evento fora do formato da API dá erro', async () => {
    const { fontes } = googleDeMentira(() => ({ items: [{ id: 'sem-inicio', end: {} }] }));
    await expect(
      fontes.agenda.listar({ inicio: hora('2026-11-04'), fim: hora('2026-11-05') }),
    ).rejects.toThrow();
  });
});
```

- [ ] **Passo 2: rodar, ver falhar e commitar o vermelho**

```bash
npm test -- testes/fontes/fonte-google.test.ts
git add testes/fontes/fonte-google.test.ts
git commit -m "test: casos das fontes do Gmail e da Agenda" -m "Teste vermelho do 7.1 ao 7.5, do AD10 e do AD11, com um Google de mentira: o perfil, a caixa de entrada pelas páginas, os filtros exatos no coworkIA, a busca em segundos, o limite de 200 sem gasto fora da janela, o 404, o erro sem o token e a agenda principal com as ocorrências abertas."
```
Esperado: FALHA, porque `src/fontes/google/fonte-google.ts` não existe.

- [ ] **Passo 3: escrever as fontes (`src/fontes/google/fonte-google.ts`)**

```ts
import { z } from 'zod';
import type { Email } from '../../dominio.js';
import { lerDataHora, paraIso } from '../../tempo.js';
import { esquemaEventoDaApi, eventoDaApi } from '../calendar-api.js';
import { casaComFiltro } from '../filtro.js';
import type { FiltroEmails, Fontes } from '../tipos.js';
import { esquemaMensagemDaApi, mensagemParaEmail } from './gmail.js';

const GMAIL = 'https://gmail.googleapis.com/gmail/v1/users/me';
const AGENDA = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';

/** AD11: uma chamada lê no máximo 200 e-mails, como a triagem (7.3). */
export const LIMITE_DE_LEITURA = 200;
/** A agenda lê no máximo 4 páginas de 250 eventos por intervalo. */
export const PAGINAS_DA_AGENDA = 4;

/** O pedaço do fetch que a fonte usa; nos testes, um Google de mentira. */
export type Buscar = (
  url: string,
  opcoes: { headers: Record<string, string> },
) => Promise<{ ok: boolean; status: number; json(): Promise<unknown> }>;

export interface ConfigFonteGoogle {
  buscar: Buscar;
  obterToken: () => Promise<string>;
  fuso: string;
}

const esquemaPerfil = z.object({ emailAddress: z.string() });
const esquemaLista = z.object({
  messages: z.array(z.object({ id: z.string() })).optional(),
  nextPageToken: z.string().optional(),
});
const esquemaEventos = z.object({
  items: z.array(z.unknown()).optional(),
  nextPageToken: z.string().optional(),
});

/** S5: o erro diz só o status, nunca o token nem a resposta. */
async function pedir(
  cfg: ConfigFonteGoogle,
  url: string,
): Promise<{ status: number; corpo: unknown }> {
  const token = await cfg.obterToken();
  const resposta = await cfg.buscar(url, { headers: { authorization: `Bearer ${token}` } });
  if (!resposta.ok) {
    if (resposta.status === 404) {
      return { status: 404, corpo: null };
    }
    throw new Error(`A API do Google respondeu com o status ${resposta.status}.`);
  }
  return { status: resposta.status, corpo: await resposta.json() };
}

/**
 * AD11: a busca do Gmail só estreita a janela. As pontas vão em segundos desde 1970, que o Gmail
 * aceita para datas fora do fuso do Pacífico, com 1 segundo de folga; o filtro exato é o do coworkIA.
 */
export function consultaDoGmail(filtro: FiltroEmails): string {
  const partes: string[] = [];
  if (filtro.naoLidos === true) {
    partes.push('is:unread');
  }
  if (filtro.desde !== undefined) {
    partes.push(`after:${Math.floor(filtro.desde.toSeconds()) - 1}`);
  }
  if (filtro.ate !== undefined) {
    partes.push(`before:${Math.ceil(filtro.ate.toSeconds()) + 1}`);
  }
  return partes.join(' ');
}

export function criarFontesGoogle(cfg: ConfigFonteGoogle): Fontes {
  let endereco: string | null = null;

  async function ler(id: string): Promise<Email | null> {
    const { status, corpo } = await pedir(
      cfg,
      `${GMAIL}/messages/${encodeURIComponent(id)}?format=full`,
    );
    return status === 404 ? null : mensagemParaEmail(esquemaMensagemDaApi.parse(corpo), cfg.fuso);
  }

  return {
    email: {
      enderecoDoUsuario: async () => {
        if (endereco === null) {
          endereco = esquemaPerfil.parse((await pedir(cfg, `${GMAIL}/profile`)).corpo).emailAddress;
        }
        return endereco;
      },
      /** 7.1, 7.3, AD10 e AD11: a caixa de entrada, do mais novo para o mais velho. */
      listar: async (filtro) => {
        const consulta = consultaDoGmail(filtro);
        const achados: Email[] = [];
        let lidos = 0;
        let pagina: string | undefined;
        while (true) {
          const parametros = new URLSearchParams({ labelIds: 'INBOX', maxResults: '100' });
          if (consulta !== '') {
            parametros.set('q', consulta);
          }
          if (pagina !== undefined) {
            parametros.set('pageToken', pagina);
          }
          const lista = esquemaLista.parse(
            (await pedir(cfg, `${GMAIL}/messages?${parametros}`)).corpo,
          );
          for (const item of lista.messages ?? []) {
            if (lidos === LIMITE_DE_LEITURA || achados.length > filtro.limite) {
              return {
                emails: ordenar(achados, cfg.fuso).slice(0, filtro.limite),
                completo: false,
              };
            }
            lidos += 1;
            const email = await ler(item.id);
            if (email !== null && casaComFiltro(email, filtro, cfg.fuso)) {
              achados.push(email);
            }
          }
          pagina = lista.nextPageToken;
          if (pagina === undefined) {
            const completo = achados.length <= filtro.limite;
            return { emails: ordenar(achados, cfg.fuso).slice(0, filtro.limite), completo };
          }
        }
      },
      ler,
    },
    agenda: {
      /** 7.4 e 7.5: só a agenda principal, com os eventos repetidos já abertos em ocorrências. */
      listar: async (intervalo) => {
        const eventos = [];
        let pagina: string | undefined;
        for (let vez = 0; vez < PAGINAS_DA_AGENDA; vez += 1) {
          const parametros = new URLSearchParams({
            timeMin: paraIso(intervalo.inicio),
            timeMax: paraIso(intervalo.fim),
            singleEvents: 'true',
            orderBy: 'startTime',
            maxResults: '250',
          });
          if (pagina !== undefined) {
            parametros.set('pageToken', pagina);
          }
          const resposta = esquemaEventos.parse(
            (await pedir(cfg, `${AGENDA}?${parametros}`)).corpo,
          );
          for (const item of resposta.items ?? []) {
            eventos.push(eventoDaApi(esquemaEventoDaApi.parse(item)));
          }
          pagina = resposta.nextPageToken;
          if (pagina === undefined) {
            break;
          }
        }
        return eventos;
      },
    },
  };
}

function ordenar(emails: Email[], fuso: string): Email[] {
  const instante = (email: Email) => lerDataHora(email.data, fuso).toMillis();
  return [...emails].sort((a, b) => instante(b) - instante(a));
}
```

- [ ] **Passo 4: rodar, ver passar, conferir e commitar o verde**

```bash
npm test -- testes/fontes/fonte-google.test.ts
npm run formatar && npm run lint && npm run tipos && npm run build
git add src/fontes/google/fonte-google.ts
git commit -m "feat: fontes do Gmail e da Agenda do Google" -m "7.1 a 7.5, AD10 e AD11: a caixa de entrada pelas páginas, com a busca do Gmail em segundos, os filtros exatos aplicados pelo coworkIA e no máximo 200 e-mails por chamada, e a agenda principal com as ocorrências abertas, por fetch direto na API REST (seção 13)."
```

**Mutações:**
- Trocar `new URLSearchParams({ labelIds: 'INBOX', maxResults: '100' })` por `new URLSearchParams({ maxResults: '100' })`: cai "lista a caixa de entrada pelas páginas, do mais novo para o mais velho".
- Trocar `casaComFiltro(email, filtro, cfg.fuso)` por `true`: cai "aplica o remetente, a busca e o período exatos no coworkIA (AD11)".
- Trocar `lidos === LIMITE_DE_LEITURA` por `lidos === LIMITE_DE_LEITURA + 1`: cai "lê no máximo 200 e-mails por chamada".
- Em `consultaDoGmail`, trocar `Math.floor(filtro.desde.toSeconds()) - 1` por `Math.floor(filtro.desde.minus({ days: 1 }).toSeconds())`, que volta à folga de um dia: cai "com a busca em segundos, o limite de 200 não se gasta fora da janela".
- Em `consultaDoGmail`, trocar `Math.ceil(filtro.ate.toSeconds()) + 1` por `Math.ceil(filtro.ate.toSeconds())`: cai "estreita pelo não lido e pelas datas em segundos, com 1 segundo de folga em cada ponta".
- Trocar `if (endereco === null) {` por `if (true) {`: cai "lê o endereço do perfil uma vez só, com o token no cabeçalho".
- Em `pedir`, trocar `if (resposta.status === 404) {` por `if (false) {`: cai "lê pelo id e devolve nulo no 404".

---

### Tarefa 8: o modo google na aplicação e na linha de comando (RQ2, AD9 e AD14)

**Arquivos:**
- Modificar: `package.json` (os scripts `login-google` e `logout-google`), `src/aplicacao.ts`, `src/cli.ts`
- Criar: `.env.example`
- Teste: `testes/aplicacao.test.ts` (troca o caso do AD4)

**Interfaces:**
- Consome: as Tarefas 3 a 7.
- Produz:
  - `interface RecursosDoGoogle { lerEnv; cofre; buscar; criarAcesso }`;
  - `criarDependencias(config, pastaDemo, google: RecursosDoGoogle): Dependencias`, agora com o terceiro parâmetro;
  - os comandos `node dist/cli.js login-google` e `node dist/cli.js logout-google`.

- [ ] **Passo 1: os scripts, o `.env.example` e o commit**

O bloco `"scripts"` do `package.json` fica assim, com as duas linhas novas depois do `"resumo"` e a vírgula no fim da linha do `"resumo"`:

```json
  "scripts": {
    "test": "vitest run",
    "lint": "biome check .",
    "formatar": "biome check --write .",
    "tipos": "tsc --noEmit",
    "build": "tsc -p tsconfig.build.json",
    "pretest": "npm run build",
    "resumo": "node dist/cli.js resumo",
    "login-google": "node dist/cli.js login-google",
    "logout-google": "node dist/cli.js logout-google"
  },
```

Criar o `.env.example`, com este conteúdo:

```text
# Copie este arquivo para .env, na mesma pasta, e preencha com o cliente OAuth
# do seu app no Google Cloud (tipo "App para computador"). O .env fica fora do git.
COWORKIA_GOOGLE_CLIENT_ID=
COWORKIA_GOOGLE_CLIENT_SECRET=
```

```bash
npm run lint
git add package.json .env.example
git commit -m "build: comandos do login e o .env de exemplo" -m "Os scripts login-google e logout-google (seção 8 da spec) e o .env.example, só com os nomes das variáveis do cliente OAuth (S3 e AD14)."
```

- [ ] **Passo 2: escrever o teste que falha (`testes/aplicacao.test.ts`)**

O caso "o modo google ainda é recusado" (AD4) sai, e entram os casos do AD9. O modo demo passa a receber um Google que quebra se for tocado. O arquivo inteiro fica assim (`testes/aplicacao.test.ts`):

```ts
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { criarDependencias, type RecursosDoGoogle } from '../src/aplicacao.js';
import type { Buscar } from '../src/fontes/google/fonte-google.js';
import type { CredenciaisDoCliente } from '../src/login/credenciais.js';
import { paraIso } from '../src/tempo.js';

const PASTA = fileURLToPath(new URL('../dados-demo', import.meta.url));
const BASE = { fuso: 'America/Sao_Paulo', importantes: [], agora: '2026-11-04T10:30' };
const ENV =
  'COWORKIA_GOOGLE_CLIENT_ID=cliente-de-teste\nCOWORKIA_GOOGLE_CLIENT_SECRET=segredo-de-teste\n';

function proibido(o_que: string): never {
  throw new Error(`o modo demo ${o_que}`);
}

/** O modo demo não pode tocar em nada do Google. */
const GOOGLE_PROIBIDO: RecursosDoGoogle = {
  lerEnv: () => proibido('leu o .env'),
  cofre: {
    guardar: () => proibido('tocou no cofre'),
    ler: () => proibido('tocou no cofre'),
    apagar: () => proibido('tocou no cofre'),
  },
  buscar: async () => proibido('chamou a rede'),
  criarAcesso: () => proibido('pediu acesso ao Google'),
};

function googleDeMentira(env: string | null, token: string | null) {
  const acessos: Array<{ credenciais: CredenciaisDoCliente; refreshToken: string }> = [];
  const autorizacoes: string[] = [];
  const buscar: Buscar = async (_url, opcoes) => {
    autorizacoes.push(opcoes.headers.authorization ?? '');
    return { ok: true, status: 200, json: async () => ({ emailAddress: 'voce@gmail.example' }) };
  };
  const recursos: RecursosDoGoogle = {
    lerEnv: () => env,
    cofre: { guardar: () => {}, ler: () => token, apagar: () => false },
    buscar,
    criarAcesso: (credenciais, refreshToken) => {
      acessos.push({ credenciais, refreshToken });
      return async () => 'acesso-de-teste';
    },
  };
  return { recursos, acessos, autorizacoes };
}

describe('criarDependencias (AD1 e AD9)', () => {
  it('com o agora fixo, o relógio devolve sempre o mesmo instante, sem tocar no Google', () => {
    const dep = criarDependencias({ ...BASE, modo: 'demo' }, PASTA, GOOGLE_PROIBIDO);
    expect(paraIso(dep.relogio())).toBe('2026-11-04T10:30:00-03:00');
    expect(paraIso(dep.relogio())).toBe(paraIso(dep.relogio()));
  });

  it('o modo google sem o .env explica como criar', () => {
    const { recursos } = googleDeMentira(null, 'rt-de-teste');
    expect(() => criarDependencias({ ...BASE, modo: 'google' }, PASTA, recursos)).toThrow(
      'Copie o .env.example para .env',
    );
  });

  it('o modo google sem o login pede o login', () => {
    const { recursos } = googleDeMentira(ENV, null);
    expect(() => criarDependencias({ ...BASE, modo: 'google' }, PASTA, recursos)).toThrow(
      'Não há login do Google neste computador. Rode npm run login-google.',
    );
  });

  it('o modo google com o .env e o login usa as fontes do Google', async () => {
    const { recursos, acessos, autorizacoes } = googleDeMentira(ENV, 'rt-de-teste');
    const dep = criarDependencias({ ...BASE, modo: 'google' }, PASTA, recursos);
    expect(acessos).toEqual([
      {
        credenciais: { clientId: 'cliente-de-teste', clientSecret: 'segredo-de-teste' },
        refreshToken: 'rt-de-teste',
      },
    ]);
    expect(await dep.fontes.email.enderecoDoUsuario()).toBe('voce@gmail.example');
    expect(autorizacoes).toEqual(['Bearer acesso-de-teste']);
  });
});
```

- [ ] **Passo 3: rodar, ver falhar e commitar o vermelho**

```bash
npm test -- testes/aplicacao.test.ts
git add testes/aplicacao.test.ts
git commit -m "test: casos do modo google na aplicação" -m "Teste vermelho do AD9: sem o .env, sem o login e com os dois, e o modo demo sem tocar no Google. O caso do AD4 sai, porque o modo google passa a funcionar."
```
Esperado: FALHA em 3 dos 4 casos, porque o `criarDependencias` ainda recusa o modo google.

- [ ] **Passo 4: escrever a aplicação (`src/aplicacao.ts`)**

```ts
import type { Config } from './config.js';
import { carregarDadosDemo } from './fontes/demo/dados.js';
import { criarFontesDemo } from './fontes/demo/fonte-demo.js';
import { type Buscar, criarFontesGoogle } from './fontes/google/fonte-google.js';
import type { Fontes } from './fontes/tipos.js';
import type { Cofre } from './login/cofre.js';
import { type CredenciaisDoCliente, credenciaisDoEnv } from './login/credenciais.js';
import type { Dependencias } from './servico.js';
import { relogioDoSistema, relogioFixo } from './tempo.js';

/** O que o modo google usa de fora: o cli.ts passa os de verdade, e os testes, os de mentira. */
export interface RecursosDoGoogle {
  lerEnv: () => string | null;
  cofre: Cofre;
  buscar: Buscar;
  criarAcesso: (credenciais: CredenciaisDoCliente, refreshToken: string) => () => Promise<string>;
}

/** AD9: o modo google precisa do .env e do login feito. */
function fontesDoGoogle(config: Config, google: RecursosDoGoogle): Fontes {
  const credenciais = credenciaisDoEnv(google.lerEnv());
  const refreshToken = google.cofre.ler();
  if (refreshToken === null) {
    throw new Error('Não há login do Google neste computador. Rode npm run login-google.');
  }
  return criarFontesGoogle({
    buscar: google.buscar,
    obterToken: google.criarAcesso(credenciais, refreshToken),
    fuso: config.fuso,
  });
}

/** RQ2, AD1 e AD9: liga a configuração ao relógio e às fontes, conforme o modo. */
export function criarDependencias(
  config: Config,
  pastaDemo: string,
  google: RecursosDoGoogle,
): Dependencias {
  const relogio =
    config.agora === null ? relogioDoSistema(config.fuso) : relogioFixo(config.agora, config.fuso);
  const fontes =
    config.modo === 'google'
      ? fontesDoGoogle(config, google)
      : criarFontesDemo(carregarDadosDemo(pastaDemo, relogio()), config.fuso);
  return { fontes, relogio, fuso: config.fuso, importantes: config.importantes };
}
```

- [ ] **Passo 5: escrever a linha de comando (`src/cli.ts`)**

```ts
#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { criarDependencias, type RecursosDoGoogle } from './aplicacao.js';
import { lerConfig } from './config.js';
import { criarAcessoAoGoogle } from './login/acesso.js';
import { criarCofre } from './login/cofre.js';
import { credenciaisDoEnv } from './login/credenciais.js';
import { fazerLogin, fazerLogout } from './login/login.js';
import { resumoParaTexto } from './saida/formatar.js';
import { resumoDoDia } from './servico.js';
import { criarServidor } from './servidor.js';

const PASTA_DEMO = fileURLToPath(new URL('../dados-demo', import.meta.url));
/** AD14: o .env fica na pasta do coworkIA, ao lado do package.json. */
const ARQUIVO_ENV = fileURLToPath(new URL('../.env', import.meta.url));

function lerEnv(): string | null {
  try {
    return readFileSync(ARQUIVO_ENV, 'utf8');
  } catch {
    return null;
  }
}

function recursosDoGoogle(): RecursosDoGoogle {
  return {
    lerEnv,
    cofre: criarCofre(),
    buscar: (url, opcoes) => fetch(url, opcoes),
    criarAcesso: criarAcessoAoGoogle,
  };
}

function mostrar(texto: string): void {
  process.stdout.write(`${texto}\n`);
}

async function principal(argumentos: readonly string[]): Promise<void> {
  const [comando] = argumentos;
  if (comando === 'login-google') {
    await fazerLogin({ credenciais: credenciaisDoEnv(lerEnv()), cofre: criarCofre(), mostrar });
    return;
  }
  if (comando === 'logout-google') {
    fazerLogout(criarCofre(), mostrar);
    return;
  }
  const config = lerConfig(process.env);
  const dep = criarDependencias(config, PASTA_DEMO, recursosDoGoogle());
  if (comando === 'resumo') {
    mostrar(resumoParaTexto(await resumoDoDia(dep), config.fuso));
    return;
  }
  if (comando !== undefined) {
    throw new Error(`comando desconhecido: ${comando}`);
  }
  // RQ8: no modo stdio, o stdout é do protocolo; o log vai para o stderr.
  process.stderr.write(`coworkIA: servidor MCP no modo ${config.modo}, fuso ${config.fuso}.\n`);
  await criarServidor(dep).connect(new StdioServerTransport());
}

principal(process.argv.slice(2)).catch((erro: unknown) => {
  process.stderr.write(`coworkIA: ${erro instanceof Error ? erro.message : String(erro)}\n`);
  process.exitCode = 1;
});
```

- [ ] **Passo 6: rodar, ver passar, conferir e commitar o verde**

```bash
npm test
npm run formatar && npm run lint && npm run tipos && npm run build
COWORKIA_AGORA=2026-11-04T10:30 COWORKIA_IMPORTANTES=diretoria@example.com npm run resumo
test ! -e .env && { COWORKIA_MODO=google node dist/cli.js resumo; test $? -ne 0; }
git add src/aplicacao.ts src/cli.ts
git commit -m "feat: modo google na aplicação e na linha de comando" -m "AD9: o modo google liga as fontes do Google com o .env e o token do cofre, e para com uma mensagem clara sem um deles. Seção 8 da spec: os comandos login-google e logout-google."
```
Esperado:
- todos os testes passam;
- o resumo da demonstração sai como no plano B;
- o modo google sem o `.env` sai com erro, e o stderr diz "Não achei o arquivo .env na pasta do coworkIA". A linha só roda quando não há `.env` na pasta (`test ! -e .env`), para nunca chamar o Google de verdade; neste PC, não há.

**Mutações:**
- Em `fontesDoGoogle`, trocar `const refreshToken = google.cofre.ler();` por `const refreshToken = google.cofre.ler() ?? 'sem-login';`: cai "o modo google sem o login pede o login".
- Em `criarDependencias`, trocar `config.modo === 'google'` por `false`: cai "o modo google sem o .env explica como criar".

---

### Tarefa 9: o README do modo google (seção 14, S6 e PA3)

**Arquivos:**
- Modificar: `README.md`

- [ ] **Passo 1: o `README.md` fica assim (`README.md`)**

O bloco abaixo é o arquivo inteiro, com quatro crases porque tem blocos de três crases dentro (`README.md`):

````markdown
# coworkIA

Um projeto pessoal. Um servidor MCP que roda no seu PC e dá à sua IA (Claude, Codex, VS Code) ferramentas para ler e fazer a triagem dos e-mails, consultar a agenda, criticar um rascunho e montar o resumo do dia. A versão 1 está descrita em [docs/specs/2026-11-04-versao-1.md](docs/specs/2026-11-04-versao-1.md), com os adendos dos planos [B](docs/specs/2026-11-05-versao-1-adendo.md) e [C](docs/specs/2026-11-05-versao-1-adendo-c.md). Ela roda no modo de demonstração, com uma caixa de e-mail e uma agenda inventadas, ou com o seu Gmail e a sua Agenda do Google, só para leitura.

## Como usar

Precisa do Node.js 24 ou mais novo.

    git clone https://github.com/Eduardokobal/coworkIA.git
    cd coworkIA
    npm install
    npm run build

### Ver sem IA

    npm run resumo

Mostra o resumo do dia da demonstração: a triagem dos e-mails das últimas 24 horas, a agenda de hoje, os conflitos e o próximo compromisso.

Na demonstração, o e-mail de `diretoria@example.com` só vira urgente (regra T4) com a variável `COWORKIA_IMPORTANTES=diretoria@example.com`. Sem ela, ele aparece em "pedem resposta".

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

As ferramentas são `listar_emails`, `ler_email`, `triagem_emails`, `listar_eventos`, `verificar_disponibilidade`, `criticar_rascunho` e `resumo_do_dia`, e o prompt é `criticar_rascunho`.

### Variáveis de ambiente

| Variável | Para quê | Padrão |
|---|---|---|
| `COWORKIA_MODO` | `demo` ou `google` (o `google` precisa do login; veja abaixo) | `demo` |
| `COWORKIA_FUSO` | O fuso das datas e horas | `America/Sao_Paulo` |
| `COWORKIA_IMPORTANTES` | Remetentes importantes, separados por vírgula | nenhum |
| `COWORKIA_AGORA` | Fixa o relógio; só para testes e demonstração | o relógio do sistema |

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

## Avisos

- **Dados de terceiros e a LGPD:** o texto dos e-mails e da agenda vai para o provedor da IA que você usa. Num uso profissional, isso envolve dados de clientes e de colegas.
- **Injeção de instrução:** um e-mail pode tentar mandar a IA fazer algo. O coworkIA nunca envia nada e marca o texto de terceiros como dado, mas a IA pode ter outras ferramentas. Use o coworkIA numa IA sem conectores que enviam e-mail ou mensagem, ou com a aprovação de cada chamada de ferramenta ligada.
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
````

- [ ] **Passo 2: conferir e commitar**

```bash
npm run lint
git add README.md
git commit -m "docs: README do modo google" -m "Seção 14, S6 e PA3 da spec: como criar o cliente OAuth, preencher o .env, fazer o login e o logout, ligar o modo google, e o limite de 7 dias do app em teste."
```

---

### Tarefa 10: o fechamento

- [ ] **Passo 1: rodar tudo e anotar os números**

```bash
npm test
npm run lint
npm run tipos
npm run build
sh testes-travas/rodar.sh
COWORKIA_AGORA=2026-11-04T10:30 COWORKIA_IMPORTANTES=diretoria@example.com npm run resumo
git log --oneline origin/main..HEAD
git status --short
```
Esperado: ver a seção "Ensaio", no fim, com os números.

- [ ] **Passo 2: o teste com a conta real fica com o Eduardo**

Neste PC, só roda o modo demo (S7). O critério de pronto (seção 17) pede o modo google testado com respostas gravadas, que são as Tarefas 6 a 8. O teste com a conta real fica com o Eduardo, no PC dele, seguindo o README: o `.env`, o `npm run login-google`, uma sessão com o `COWORKIA_MODO=google` e o `npm run logout-google`.

- [ ] **Passo 3: mandar ao auditor e preparar o PR 5**

O HEAD, os números, a lista de commits e o roteiro de mutações de cada tarefa. O push e a abertura do PR pedem o OK do Eduardo pela caixa e o parecer do auditor antes.

## Como as mutações rodam (achado 96)

Cada mutação troca um trecho exato de um arquivo, roda o teste indicado e volta o arquivo como estava. O teste roda com `npx vitest run <arquivo do teste>`, que não compila o projeto. Todas as mutações deste plano compilam: o DEV conferiu cada uma com `npx tsc --noEmit`. Por isso, o `npm test`, que compila antes pelo `pretest`, também as derruba no teste, e não no build.

## Cobertura da spec neste plano

| Requisito | Tarefa |
|---|---|
| RQ2 (modos) e AD9 | 8 |
| RQ3 (só leitura; escopos `gmail.readonly` e `calendar.readonly`) | 3, 5 e 7: só GET na API |
| RQ5 (sem internet nos testes) | todas: o Google e o cofre são de mentira |
| RQ6 e S5 (sem segredo) | 3, 5, 7 e 8 |
| 7.1 a 7.5 no modo google, AD10 a AD13 | 6 e 7 |
| Seção 8 (`src/fontes/google/`, os comandos) | 2, 6, 7 e 8 |
| S1 (escopos) | 3 e 5 |
| S3 (login com PKCE) e AD15 | 5 e 8 |
| S4 (cofre) e AD15 | 4 e 5 |
| S6 e seção 14 (README) e PA3 | 9 |
| Seção 12 (fontes do Google com respostas gravadas) e AD16 | 6 e 7 |
| Seção 13 (dependências) | 1 |
| Seção 17 (critério de pronto) | 10 |

## Fontes consultadas (2026-11-05)

- https://developers.google.com/workspace/gmail/api/reference/rest/v1/users.messages/list
- https://developers.google.com/workspace/gmail/api/reference/rest/v1/users.messages/get
- https://developers.google.com/workspace/gmail/api/reference/rest/v1/users.messages
- https://developers.google.com/workspace/gmail/api/reference/rest/v1/users.messages.attachments
- https://developers.google.com/workspace/gmail/api/reference/rest/v1/users/getProfile
- https://developers.google.com/workspace/gmail/api/guides/labels
- https://developers.google.com/workspace/gmail/api/guides/filtering (lida pelo auditor, achado 93)
- https://support.google.com/mail/answer/7190
- https://developers.google.com/workspace/calendar/api/v3/reference/events/list
- https://developers.google.com/identity/protocols/oauth2/native-app
- https://developers.google.com/identity/protocols/oauth2

## Ensaio

O DEV aplicou este plano do zero num clone do repositório no scratchpad, fora da pasta do projeto. O clone saiu da main `d68bcd3`, com as travas ativas, e um script escreveu cada bloco de arquivo e rodou cada linha dos blocos de comando, na ordem. Os resultados:
- os 6 vermelhos falharam: os das Tarefas 3 a 7 porque o módulo ainda não existia, e o da Tarefa 8 em 3 dos 4 casos;
- todos os outros comandos saíram com 0, inclusive os 18 commits, que passaram pelas travas: 3 `docs:`, 2 `build:`, 1 `refactor:`, 6 `test:` e 6 `feat:`;
- o `grep -cE` do adendo deu 8, e o adendo commitado foi conferido, byte a byte, contra o título, a frase e as linhas AD9 a AD16 deste arquivo;
- o `npm run formatar` não mudou nenhum arquivo, e o status ficou limpo no fim;
- no fim: 24 arquivos de teste e 255 testes passando (os 207 do plano B e 48 novos); o lint, os tipos e o build com 0; as travas com 62 casos e 0 falhas;
- o modo google sem o `.env` saiu com erro, com a mensagem do `.env`;
- num segundo clone, as 27 mutações listadas nas tarefas derrubaram o teste indicado, as 27 compilam, e o conteúdo voltou igual ao de antes.

Nenhum teste usa a rede de fora nem o cofre do sistema, por construção: o Google e o cofre são de mentira, por injeção, e os testes do login só chamam o 127.0.0.1. O ensaio não substitui a conferência do auditor.

## O que mudou da versão 1 para a 2, achado por achado

CORRIGIR:
- **93, o limite de 200 gasto fora da janela.** A busca do Gmail usava datas com um dia de folga, e os e-mails do dia anterior gastavam o limite de 200 antes de o filtro exato descartá-los. A triagem podia dizer "parcial" sem ser. Agora:
  - o `after:` e o `before:` vão em segundos, com 1 segundo de folga, como a página de filtros da Gmail API manda para fusos fora do Pacífico;
  - o AD11 foi reescrito, e a página entrou nas fontes;
  - o teste da consulta usa os segundos;
  - um caso novo, com um Gmail de mentira que respeita o `after:` em segundos, tem 150 e-mails nas últimas 24 horas e 100 entre 25 e 35 horas atrás. Ele dá 150 analisados e `completo` verdadeiro. A mutação que volta à folga de um dia derruba esse caso.
- **94, os testes do login ao contrário.** O `redirect_uri` agora vem do endereço em que o servidor escuta (`servidor.address()`), e não de um texto fixo. Por isso, o teste do endereço pega o servidor que escuta em todos os endereços (ca1). Um caso novo, com dois logins, confere que o state e o code_challenge mudam a cada login (ca3). As duas entraram nas mutações da Tarefa 5.

ANOTAR:
- **95.** O teste do endereço confere o `prompt=consent`, e a ca2 entrou nas mutações da Tarefa 5.
- **96.** As duas mutações que não compilavam foram reescritas: a do `guardarToken` usa `problema === 'nunca'`, e a da aplicação usa `google.cofre.ler() ?? 'sem-login'`. A seção "Como as mutações rodam" diz o comando e que todas compilam.
