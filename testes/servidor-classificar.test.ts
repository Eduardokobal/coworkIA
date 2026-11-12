import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { criarDependencias, type RecursosDoGoogle } from '../src/aplicacao.js';
import type { Dependencias } from '../src/servico.js';
import { criarServidor } from '../src/servidor.js';

const PASTA = fileURLToPath(new URL('../dados-demo', import.meta.url));
const BASE = {
  fuso: 'America/Sao_Paulo',
  importantes: ['diretoria@example.com'],
  agora: '2026-11-04T10:30',
  whatsappPasta: null,
  whatsappEu: [],
  whatsappImportantes: [],
  financasPasta: null,
  financasCategorias: '',
};
const SEU = 'lucia@example.com';

function falha(oQue: string): never {
  throw new Error(`a classificar_emails ${oQue}`);
}

/** O .env e o login existem, para o modo google subir, mas nada do Google pode ser usado. */
const GOOGLE_QUE_FALHA: RecursosDoGoogle = {
  lerEnv: () =>
    'COWORKIA_GOOGLE_CLIENT_ID=cliente-de-teste\nCOWORKIA_GOOGLE_CLIENT_SECRET=segredo-de-teste\n',
  cofre: {
    guardar: () => falha('gravou no cofre'),
    ler: () => 'rt-de-teste',
    apagar: () => falha('apagou o cofre'),
  },
  buscar: async () => falha('chamou a rede'),
  criarAcesso: () => async () => falha('pediu um token ao Google'),
};

async function conectar(dep: Dependencias): Promise<Client> {
  const [doCliente, doServidor] = InMemoryTransport.createLinkedPair();
  await criarServidor(dep).connect(doServidor);
  const novo = new Client({ name: 'teste-classificar', version: '0.0.0' });
  await novo.connect(doCliente);
  return novo;
}

let cliente: Client;

beforeAll(async () => {
  cliente = await conectar(criarDependencias({ ...BASE, modo: 'demo' }, PASTA, GOOGLE_QUE_FALHA));
});

afterAll(async () => {
  await cliente.close();
});

async function chamar(
  emails: unknown[],
  seuEndereco: unknown = SEU,
  alvo: Client = cliente,
): Promise<{ erro: boolean; texto: string }> {
  const resultado = await alvo.callTool({
    name: 'classificar_emails',
    arguments: { seu_endereco: seuEndereco, emails },
  });
  const partes = resultado.content as Array<{ text?: string }>;
  return {
    erro: resultado.isError === true,
    texto: partes.map((parte) => parte.text ?? '').join(''),
  };
}

/** Um e-mail válido para o usuário, sem o cc, o nome e os cabeçalhos, que são opcionais. */
function email(parcial: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 'msg-1',
    de: { endereco: 'ana@example.com' },
    para: [{ endereco: SEU }],
    assunto: 'Ata da reunião',
    data: '2026-11-04T09:00:00-03:00',
    corpo: 'Segue a ata.',
    ...parcial,
  };
}

/** "aceita", ou o texto do erro de validação, que nunca traz a pilha. */
async function validacao(emails: unknown[], seuEndereco: unknown = SEU): Promise<string> {
  const { erro, texto } = await chamar(emails, seuEndereco);
  if (!erro) {
    return 'aceita';
  }
  expect(texto).toContain('Input validation error: Invalid arguments for tool classificar_emails');
  expect(texto).not.toMatch(/\n\s+at /);
  return texto;
}

describe('a ferramenta classificar_emails (CE1 e CE7)', () => {
  it('tem o título e a descrição da CE7, sem o aviso de terceiros', async () => {
    const { tools } = await cliente.listTools();
    const ferramenta = tools.find((item) => item.name === 'classificar_emails');
    expect(ferramenta?.title).toBe('Classificação dos e-mails trazidos pela IA');
    expect(ferramenta?.description).toBe(
      'Classifica os e-mails que a IA já leu por outro conector de e-mail em urgente, pede resposta, informativo e propaganda, com as regras de triagem do coworkIA. Mande só os campos pedidos: o endereço da conta em seu_endereco e, em cada e-mail, o corpo em texto puro e, quando der, sem as mensagens citadas. Mande o list_unsubscribe e o precedence sempre que o conector os tiver, porque sem eles a propaganda não é reconhecida. Os dois podem ser cortados nos 2.000 caracteres sem mudar a triagem, porque a regra T1 só olha se o list_unsubscribe existe e se o precedence é bulk, list ou junk; um campo acima do limite faz a chamada inteira falhar. A data vai como AAAA-MM-DD ou AAAA-MM-DDTHH:MM, com ou sem os segundos, a fração de segundo e o deslocamento (Z ou ±HH:MM), de preferência com o deslocamento, como 2026-11-11T09:30:00-03:00. A resposta traz só o id e os motivos de cada e-mail, sem nenhum texto do e-mail.',
    );
    expect(ferramenta?.description).not.toContain('TERCEIROS');
  });
});

describe('a entrada da classificar_emails (CE2 e CE3)', () => {
  it('aceita o id com cada sinal e recusa um espaço, um acento e o id repetido', async () => {
    expect(await validacao([email({ id: 'Az09._:=/+-' })])).toBe('aceita');
    for (const id of ['msg 1', 'msg-é', '']) {
      expect(await validacao([email({ id })]), id).toContain(
        'o id só aceita letras sem acento, dígitos e os sinais . _ : = / + - at emails[0].id',
      );
    }
    expect(await validacao([email(), email()])).toContain('dois e-mails com o mesmo id at emails');
  });

  it('aceita de 1 a 200 e-mails', async () => {
    const varios = (quantos: number) =>
      Array.from({ length: quantos }, (_, indice) => email({ id: `m-${indice}` }));
    expect(await validacao(varios(0))).toContain('Too small');
    expect(await validacao(varios(1))).toBe('aceita');
    expect(await validacao(varios(200))).toBe('aceita');
    expect(await validacao(varios(201))).toContain('Too big');
  });

  it('aceita cada limite de tamanho na ponta e recusa um a mais', async () => {
    const texto = (tamanho: number) => 'a'.repeat(tamanho);
    const pessoas = (quantas: number) =>
      Array.from({ length: quantas }, (_, indice) => ({ endereco: `p${indice}@example.com` }));
    const casos: Array<[string, (tamanho: number) => Promise<string>, number]> = [
      ['seu_endereco', (tamanho) => validacao([email()], texto(tamanho)), 320],
      ['id', (tamanho) => validacao([email({ id: texto(tamanho) })]), 200],
      ['de.endereco', (tamanho) => validacao([email({ de: { endereco: texto(tamanho) } })]), 320],
      [
        'de.nome',
        (tamanho) => validacao([email({ de: { endereco: SEU, nome: texto(tamanho) } })]),
        200,
      ],
      ['para', (tamanho) => validacao([email({ para: pessoas(tamanho) })]), 100],
      ['cc', (tamanho) => validacao([email({ cc: pessoas(tamanho) })]), 100],
      ['assunto', (tamanho) => validacao([email({ assunto: texto(tamanho) })]), 1000],
      ['corpo', (tamanho) => validacao([email({ corpo: texto(tamanho) })]), 50_000],
      [
        'list_unsubscribe',
        (tamanho) => validacao([email({ cabecalhos: { list_unsubscribe: texto(tamanho) } })]),
        2000,
      ],
      [
        'precedence',
        (tamanho) => validacao([email({ cabecalhos: { precedence: texto(tamanho) } })]),
        2000,
      ],
    ];
    for (const [campo, tentar, limite] of casos) {
      expect(await tentar(limite), campo).toBe('aceita');
      expect(await tentar(limite + 1), campo).toContain('Too big');
    }
    expect(await validacao([email()], '')).toContain('Too small');
    expect(await validacao([email({ de: { endereco: '' } })])).toContain('Too small');
  });

  it('aceita o e-mail sem o cc, sem o nome e sem os cabeçalhos', async () => {
    expect(await validacao([email()])).toBe('aceita');
    expect(await validacao([email({ cabecalhos: {} })])).toBe('aceita');
  });

  it('aceita as datas nas formas da lista (achados 147 e 148)', async () => {
    for (const data of [
      '2026-11-11',
      '2026-11-11T09:30',
      '2026-11-11T09:30:00',
      '2026-11-11T09:30:00.1',
      '2026-11-11T09:30:00.123Z',
      '2026-11-11T09:30:00.123456789-03:00',
      '2026-11-11T09:30Z',
      '2026-11-11T09:30:00-03:00',
      '2026-11-11T23:59:59+14:00',
      '2026-11-11T00:00-14:00',
      '2028-02-29',
    ]) {
      expect(await validacao([email({ data })]), data).toBe('aceita');
    }
  });

  it('recusa no esquema as outras formas e a data que não existe (achados 147 e 148)', async () => {
    for (const data of [
      '2026',
      '2026-W46-3',
      'Wed, 11 Nov 2026 09:30:00 -0300',
      '2026-11-11 09:30',
      '2026-11-11T09:30:00.1234567890Z',
      '2026-11-11T09:30:00,5Z',
      '2026-11-11Z',
      '2026-11-11-03:00',
      '2026-11-11T24:00',
      '2026-11-11T09:30+15:00',
      '2026-11-11T09:30+25:00',
      '2026-11-11t09:30',
      '2026-11-11T09:30z',
      '2026-11-11T09:30+0300',
      '2026-11-11T09',
      '+002026-11-11',
    ]) {
      expect(await validacao([email({ data })]), data).toContain(
        'a data não está numa das formas aceitas at emails[0].data',
      );
    }
    for (const data of ['2026-02-30', '2026-02-29', '2026-13-01']) {
      const texto = await validacao([email({ data })]);
      expect(texto, data).toContain('a data não existe no calendário at emails[0].data');
      expect(texto, data).not.toContain('formas aceitas');
    }
  });
});

describe('a saída da classificar_emails (CE6)', () => {
  const entrada = [
    email({
      id: 'b-2',
      de: { endereco: 'remetente.um@example.org', nome: 'Nome Um' },
      assunto: 'Assunto um',
      corpo: 'Corpo um, você revisa?',
    }),
    email({ id: 'a-1', assunto: 'Contrato urgente', corpo: 'Corpo dois.' }),
    email({
      id: 'c-3',
      cc: [{ endereco: 'copia.tres@example.org', nome: 'Nome Tres' }],
      assunto: 'Assunto tres',
      corpo: 'Corpo tres.',
      cabecalhos: { list_unsubscribe: '<mailto:sair.tres@example.org>' },
    }),
    email({ id: 'd-4', assunto: 'Assunto quatro', corpo: 'Corpo quatro.' }),
    email({ id: 'e-5', assunto: 'Assunto cinco', corpo: 'Corpo cinco, por favor.' }),
  ];

  it('traz a contagem, os analisados e os grupos na ordem da entrada, só com o id e os motivos', async () => {
    const { erro, texto } = await chamar(entrada);
    expect(erro).toBe(false);
    expect(JSON.parse(texto)).toEqual({
      contagem: { urgente: 1, pede_resposta: 2, informativo: 1, propaganda: 1 },
      analisados: 5,
      grupos: {
        urgente: [{ id: 'a-1', motivos: ['T2: termo "urgente" no assunto'] }],
        pede_resposta: [
          { id: 'b-2', motivos: ['T5: pergunta direta'] },
          { id: 'e-5', motivos: ['T5: pedido "por favor"'] },
        ],
        informativo: [{ id: 'd-4', motivos: ['T6: nenhuma outra regra casou'] }],
        propaganda: [{ id: 'c-3', motivos: ['T1: cabeçalho List-Unsubscribe'] }],
      },
    });
  });

  it('nenhum assunto, corpo, nome ou endereço da entrada aparece na resposta', async () => {
    const { erro, texto } = await chamar(entrada);
    expect(erro).toBe(false);
    for (const item of entrada) {
      expect(texto).toContain(`"id": "${String(item.id)}"`);
    }
    const daEntrada = [
      SEU,
      'ana@example.com',
      'remetente.um@example.org',
      'Nome Um',
      'copia.tres@example.org',
      'Nome Tres',
      'sair.tres@example.org',
      ...entrada.flatMap((item) => [String(item.assunto), String(item.corpo)]),
    ];
    for (const trecho of daEntrada) {
      expect(texto, trecho).not.toContain(trecho);
    }
  });
});

describe('a classificar_emails nos três modos (CE1)', () => {
  it('responde no demo, no google e no arquivos, sem ler o e-mail, a agenda ou o Google', async () => {
    for (const modo of ['demo', 'google', 'arquivos'] as const) {
      const dep = criarDependencias({ ...BASE, modo }, PASTA, GOOGLE_QUE_FALHA);
      const doModo = await conectar(dep);
      const resposta = await chamar([email({ corpo: 'Você pode revisar?' })], SEU, doModo);
      await doModo.close();
      expect(resposta.erro, modo).toBe(false);
      expect(JSON.parse(resposta.texto), modo).toMatchObject({
        contagem: { urgente: 0, pede_resposta: 1, informativo: 0, propaganda: 0 },
        analisados: 1,
      });
    }
  });
});
