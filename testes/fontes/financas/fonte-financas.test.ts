import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  criarFonteFinancas,
  ErroDaPastaDasFinancas,
  ehArquivoDeExtrato,
  idDaConta,
  LIMITE_DE_ARQUIVOS,
  PASTA_DAS_FINANCAS_SEM_LEITURA,
  rotuloDaConta,
} from '../../../src/fontes/financas/fonte-financas.js';

// O readFileSync passa a ser observado, para os testes saberem que arquivo foi lido.
vi.mock('node:fs', async (original) => {
  const fs = await original<typeof import('node:fs')>();
  return { ...fs, readFileSync: vi.fn(fs.readFileSync) };
});

const SEGREDO = Buffer.alloc(32, 7);
const pastas: string[] = [];

interface Trn {
  data: string;
  valor: string;
  fitid?: string;
  memo?: string;
}

interface OpcoesDoExtrato {
  conta?: string;
  moeda?: string;
  saldo?: [string, string];
  fim?: string;
}

/** O bloco <STMTRS> de um extrato da conta, para os testes da pasta. */
function extrato(transacoes: Trn[], opcoes: OpcoesDoExtrato = {}): string {
  const linhas = transacoes.map((t) =>
    [
      '<STMTTRN>',
      `<DTPOSTED>${t.data}`,
      `<TRNAMT>${t.valor}`,
      t.fitid === undefined ? '' : `<FITID>${t.fitid}`,
      `<MEMO>${t.memo ?? 'COMPRA'}`,
      '</STMTTRN>',
    ].join('\n'),
  );
  const saldo =
    opcoes.saldo === undefined
      ? ''
      : `<LEDGERBAL><BALAMT>${opcoes.saldo[0]}<DTASOF>${opcoes.saldo[1]}</LEDGERBAL>`;
  return [
    '<STMTRS>',
    `<CURDEF>${opcoes.moeda ?? 'BRL'}`,
    `<BANKACCTFROM><BANKID>0341<ACCTID>${opcoes.conta ?? '12345-6'}<ACCTTYPE>CHECKING</BANKACCTFROM>`,
    '<BANKTRANLIST>',
    opcoes.fim === undefined ? '' : `<DTEND>${opcoes.fim}`,
    ...linhas,
    '</BANKTRANLIST>',
    saldo,
    '</STMTRS>',
  ].join('\n');
}

/** Um arquivo OFX 1.x com os extratos, na ordem. */
function arquivo(...extratos: string[]): string {
  return [
    'OFXHEADER:100',
    '',
    '<OFX><BANKMSGSRSV1><STMTTRNRS>',
    ...extratos,
    '</STMTTRNRS></BANKMSGSRSV1></OFX>',
    '',
  ].join('\n');
}

/** Um arquivo OFX 1.x com um extrato da conta. */
function ofx(transacoes: Trn[], opcoes: OpcoesDoExtrato = {}): string {
  return arquivo(extrato(transacoes, opcoes));
}

const UM = ofx([{ data: '20261005', valor: '-10.00', fitid: 'X1' }]);

/** Uma pasta temporária, apagada depois de cada teste. */
function pastaCom(arquivos: Record<string, string>): string {
  const pasta = mkdtempSync(join(tmpdir(), 'coworkia-financas-'));
  pastas.push(pasta);
  for (const [nome, conteudo] of Object.entries(arquivos)) {
    writeFileSync(join(pasta, nome), conteudo);
  }
  return pasta;
}

const ler = (pasta: string, extra: Partial<Parameters<typeof criarFonteFinancas>[0]> = {}) =>
  criarFonteFinancas({ pasta, segredo: SEGREDO, ...extra }).extratos();

afterEach(() => {
  for (const pasta of pastas.splice(0)) {
    rmSync(pasta, { recursive: true, force: true });
  }
});

describe('a pasta dos extratos (E1 e E2)', () => {
  it('lê só os .ofx comuns, sem diferença de maiúscula, na ordem do sort() padrão', async () => {
    // No Windows, b.ofx e B.OFX seriam o mesmo arquivo; o Z.OFX testa a maiúscula e a ordem.
    const pasta = pastaCom({
      'b.ofx': ofx([{ data: '20261005', valor: '1', fitid: 'b', memo: 'b' }]),
      'Z.OFX': ofx([{ data: '20261005', valor: '1', fitid: 'Z', memo: 'Z' }]),
      'a.ofx': ofx([{ data: '20261005', valor: '1', fitid: 'a', memo: 'a' }]),
      'notas.txt': UM,
    });
    mkdirSync(join(pasta, 'pasta.ofx'));
    const { lancamentos, avisos } = await ler(pasta);
    expect(lancamentos.map((item) => item.descricao)).toEqual(['Z', 'a', 'b']);
    expect(avisos).toEqual([]);
  });

  it('um link simbólico ou uma pasta não é arquivo comum', () => {
    expect(ehArquivoDeExtrato({ name: 'link.ofx', isFile: () => false })).toBe(false);
    expect(ehArquivoDeExtrato({ name: 'a.OfX', isFile: () => true })).toBe(true);
    expect(ehArquivoDeExtrato({ name: 'a.ofx.zip', isFile: () => true })).toBe(false);
  });

  it('um link para um arquivo, com nome .ofx, fica de fora sem aviso e nunca é seguido', async ({
    skip,
  }) => {
    const pasta = pastaCom({ 'a.ofx': UM, 'alvo.txt': UM });
    try {
      symlinkSync(join(pasta, 'alvo.txt'), join(pasta, 'link.ofx'), 'file');
    } catch (erro) {
      // No Windows sem o modo de desenvolvedor, o link de arquivo pede a permissão de administrador.
      if ((erro as NodeJS.ErrnoException).code === 'EPERM') {
        skip('o sistema não deixou criar o link de arquivo');
      }
      throw erro;
    }
    const { lancamentos, avisos } = await ler(pasta);
    expect(lancamentos).toHaveLength(1);
    expect(avisos).toEqual([]);
  });

  it('uma junção com nome .ofx fica de fora sem aviso e nunca é seguida', async () => {
    const pasta = pastaCom({ 'a.ofx': UM });
    mkdirSync(join(pasta, 'sub'));
    writeFileSync(join(pasta, 'sub', 'b.ofx'), UM);
    // A junção do Windows não pede permissão de administrador; nos outros sistemas, é um link comum.
    symlinkSync(join(pasta, 'sub'), join(pasta, 'link.ofx'), 'junction');
    const { lancamentos, avisos } = await ler(pasta);
    expect(lancamentos).toHaveLength(1);
    expect(avisos).toEqual([]);
  });

  it('lê 200 arquivos sem aviso e, passando disso, avisa quantos ficaram de fora', async () => {
    const arquivos: Record<string, string> = {};
    for (let i = 0; i <= LIMITE_DE_ARQUIVOS; i += 1) {
      arquivos[`e${String(i).padStart(3, '0')}.ofx`] = ofx([
        { data: '20261005', valor: '1', memo: `COMPRA ${i}` },
      ]);
    }
    const pasta = pastaCom(arquivos);
    const cheia = await ler(pasta);
    expect(cheia.lancamentos).toHaveLength(200);
    expect(cheia.avisos).toEqual([
      { nome: null, texto: 'O limite é de 200 arquivos; ficaram de fora: 1.' },
    ]);
    rmSync(join(pasta, 'e200.ofx'));
    expect((await ler(pasta)).avisos).toEqual([]);
  });

  it('o arquivo grande demais fica de fora sem ser lido, e o do tamanho exato entra', async () => {
    const pasta = pastaCom({ 'exata.ofx': UM, 'grande.ofx': `${UM} ` });
    vi.mocked(readFileSync).mockClear();
    const { lancamentos, avisos } = await ler(pasta, { limiteDeBytes: UM.length });
    expect(lancamentos).toHaveLength(1);
    expect(avisos).toEqual([
      { nome: 'grande.ofx', texto: 'o arquivo passa de 5 MB e ficou de fora.' },
    ]);
    const lidos = vi.mocked(readFileSync).mock.calls.map(([caminho]) => String(caminho));
    expect(lidos.filter((caminho) => caminho.endsWith('grande.ofx'))).toEqual([]);
    expect(lidos.filter((caminho) => caminho.endsWith('exata.ofx'))).toHaveLength(1);
  });

  it('sem o limite dos testes, o arquivo com 1 byte além de 5 MB fica de fora', async () => {
    const pasta = pastaCom({ 'a.ofx': UM });
    writeFileSync(join(pasta, 'grande.ofx'), Buffer.alloc(5 * 1024 * 1024 + 1, 'a'));
    expect((await ler(pasta)).avisos).toEqual([
      { nome: 'grande.ofx', texto: 'o arquivo passa de 5 MB e ficou de fora.' },
    ]);
  });

  it('um arquivo que falha na leitura fica de fora, com um aviso fixo, e os outros são lidos', async () => {
    const pasta = pastaCom({ 'a.ofx': UM, 'b.ofx': UM, 'c.ofx': UM, 'd.ofx': UM });
    // Entre a listagem e a leitura, o b some (ENOENT), e o c vira uma pasta (EISDIR).
    let trocou = false;
    const saidas = [
      vi.spyOn(process.stderr, 'write').mockImplementation(() => true),
      vi.spyOn(console, 'error').mockImplementation(() => undefined),
      vi.spyOn(console, 'warn').mockImplementation(() => undefined),
      vi.spyOn(console, 'log').mockImplementation(() => undefined),
    ];
    try {
      const { avisos } = await ler(pasta, {
        preparar: (texto) => {
          if (!trocou) {
            rmSync(join(pasta, 'b.ofx'));
            rmSync(join(pasta, 'c.ofx'));
            mkdirSync(join(pasta, 'c.ofx'));
            trocou = true;
          }
          return texto;
        },
      });
      expect(avisos).toEqual([
        { nome: 'b.ofx', texto: 'o arquivo não pôde ser lido e ficou de fora.' },
        { nome: 'c.ofx', texto: 'o arquivo não pôde ser lido e ficou de fora.' },
      ]);
      for (const saida of saidas) {
        expect(saida).not.toHaveBeenCalled();
      }
    } finally {
      for (const saida of saidas) {
        saida.mockRestore();
      }
    }
  });

  it('a pasta que não existe dá a mensagem fixa, sem o caminho (E1)', async () => {
    const leitura = ler(join(pastaCom({}), 'nao-existe'));
    await expect(leitura).rejects.toBeInstanceOf(ErroDaPastaDasFinancas);
    await expect(leitura).rejects.toHaveProperty('message', PASTA_DAS_FINANCAS_SEM_LEITURA);
    expect(PASTA_DAS_FINANCAS_SEM_LEITURA).toBe(
      'A pasta de COWORKIA_FINANCAS_PASTA não pôde ser lida; confira se ela existe.',
    );
  });
});

describe('os avisos da leitura (E4, E5, O3 e O4)', () => {
  it('o formato não reconhecido, a outra moeda e os lançamentos descartados', async () => {
    const pasta = pastaCom({
      'a.ofx': 'sem extrato',
      'b.ofx': ofx([{ data: '20261005', valor: '1', fitid: 'u' }], { moeda: 'USD' }),
      'c.ofx': ofx([
        { data: '20261005', valor: '1', fitid: 'c1' },
        { data: '20261005', valor: '1,234.50', fitid: 'c2' },
      ]),
    });
    const { lancamentos, avisos } = await ler(pasta);
    expect(lancamentos.map((item) => item.centavos)).toEqual([100]);
    expect(avisos).toEqual([
      { nome: 'a.ofx', texto: 'formato não reconhecido.' },
      { nome: 'b.ofx', texto: 'extrato em outra moeda, que não é lida.' },
      { nome: 'c.ofx', texto: 'lançamentos descartados: 1.' },
    ]);
  });

  it('um erro do leitor deixa só aquele arquivo de fora, sem a mensagem do erro (E5)', async () => {
    const pasta = pastaCom({ 'a.ofx': 'QUEBRA', 'b.ofx': UM });
    const { lancamentos, avisos } = await ler(pasta, {
      lerOfx: (texto) => {
        if (texto === 'QUEBRA') {
          throw new RangeError('Invalid code point 1114112');
        }
        return [
          {
            tipo: 'conta',
            banco: '1',
            numero: '2',
            tipoDaConta: 'CHECKING',
            moeda: 'BRL',
            lancamentos: [{ data: '2026-10-05', centavos: 100, descricao: 'b' }],
            descartados: 0,
            saldo: null,
            fim: null,
          },
        ];
      },
    });
    expect(lancamentos.map((item) => item.descricao)).toEqual(['b']);
    expect(avisos).toEqual([{ nome: 'a.ofx', texto: 'formato não reconhecido.' }]);
  });
});

describe('as contas (O9, O10 e O12)', () => {
  const rotulo = (tipo: 'conta' | 'cartao', numero: string, tipoDaConta = '') =>
    rotuloDaConta({ tipo, numero, tipoDaConta });

  it('o id é o HMAC da chave da conta com a chave secreta, e outra chave dá outro id', async () => {
    const pasta = pastaCom({ 'a.ofx': UM });
    const [conta] = (await ler(pasta)).contas;
    expect(conta?.id).toBe('168c7abad2c4');
    expect(idDaConta('conta|0341|12345-6', SEGREDO)).toBe('168c7abad2c4');
    expect(idDaConta('conta|0341|12345-6', Buffer.alloc(32, 8))).toBe('2c99926eeeb3');
    expect(conta?.rotulo).toBe('Conta corrente final 3456');
  });

  it('o rótulo traz só os 4 últimos dígitos de um número de conta, pelo tipo da conta', () => {
    expect(rotulo('conta', '0001-123456789', 'CHECKING')).toBe('Conta corrente final 6789');
    expect(rotulo('conta', '99887766', 'SAVINGS')).toBe('Poupança final 7766');
    expect(rotulo('conta', '1234', 'MONEYMRKT')).toBe('Conta final 1234');
    expect(rotulo('cartao', '5555 4444 3333 2222')).toBe('Cartão final 2222');
    expect(rotulo('conta', '1234.5678-X', 'CHECKING')).toBe('Conta corrente final 5678');
    expect(rotulo('conta', '12/3x', 'CHECKING')).toBe('Conta corrente final 123');
    expect(rotulo('cartao', '12')).toBe('Cartão final 12');
  });

  it('o número mascarado com X ou com asterisco dá o final (F-D12)', () => {
    expect(rotulo('cartao', '5555 XXXX XXXX 1234')).toBe('Cartão final 1234');
    expect(rotulo('cartao', '************1234')).toBe('Cartão final 1234');
    expect(rotulo('cartao', 'xxxx-xxxx-xxxx-9876')).toBe('Cartão final 9876');
  });

  it('um ACCTID enorme, feito para travar, dá o rótulo em menos de meio segundo (#124)', () => {
    const inicio = performance.now();
    expect(rotulo('cartao', `${'1'.repeat(100_000)}a`)).toBe('Cartão final sem número');
    expect(rotulo('cartao', '1'.repeat(100_000))).toBe('Cartão final 1111');
    expect(performance.now() - inicio).toBeLessThan(500);
  });

  it('um ACCTID que não é número de conta dá "sem número" (F-D11)', () => {
    expect(rotulo('cartao', '0f3c9a2e-5b7d-4c1e-8a6f-2d9b4e7c1a35')).toBe(
      'Cartão final sem número',
    );
    expect(rotulo('cartao', 'A-12')).toBe('Cartão final sem número');
    expect(rotulo('cartao', '1234 5678 #')).toBe('Cartão final sem número');
    expect(rotulo('conta', 'X', 'SAVINGS')).toBe('Poupança final sem número');
    expect(rotulo('cartao', '****')).toBe('Cartão final sem número');
    expect(rotulo('cartao', 'ABC')).toBe('Cartão final sem número');
    expect(rotulo('cartao', '')).toBe('Cartão final sem número');
  });

  it('junta os extratos da mesma conta: o saldo mais novo, o empate pelo último e o fim mais novo', async () => {
    const pasta = pastaCom({
      'a.ofx': ofx([{ data: '20261005', valor: '1', fitid: 'a' }], {
        saldo: ['100', '20261031'],
        fim: '20261031',
      }),
      'b.ofx': ofx([{ data: '20261105', valor: '1', fitid: 'b' }], {
        saldo: ['200', '20261031'],
        fim: '20261110',
      }),
      'c.ofx': ofx([{ data: '20261001', valor: '1', fitid: 'c' }], {
        saldo: ['300', '20261015'],
        fim: '20261015',
      }),
      'd.ofx': ofx([{ data: '20261001', valor: '1', fitid: 'd' }], { conta: '999' }),
    });
    const { contas } = await ler(pasta);
    expect(contas.map((conta) => [conta.rotulo, conta.saldo, conta.dadosAte])).toEqual([
      ['Conta corrente final 3456', { centavos: 20000, data: '2026-10-31' }, '2026-11-10'],
      ['Conta corrente final 999', null, '2026-10-01'],
    ]);
  });
});

describe('os repetidos pelo conteúdo (O11)', () => {
  const descricoes = async (arquivos: Record<string, string>) =>
    (await ler(pastaCom(arquivos))).lancamentos.map((item) => item.descricao);

  it('entre arquivos, o mesmo lançamento com o FITID diferente conta uma vez, sem aviso; ficam os primeiros', async () => {
    // Como no Santander da medição: o FITID muda a cada exportação.
    const pasta = pastaCom({
      'a.ofx': ofx([
        { data: '20261005', valor: '-10', fitid: '00032709', memo: 'PADARIA' },
        { data: '20261006', valor: '-20', fitid: '00042709', memo: 'MERCADO' },
      ]),
      'b.ofx': ofx([
        { data: '20261005', valor: '-10.00', fitid: '00031011', memo: 'PADARIA' },
        { data: '20261007', valor: '-30', fitid: '00041011', memo: 'POSTO' },
      ]),
    });
    const { lancamentos, avisos } = await ler(pasta);
    expect(lancamentos.map((item) => [item.data, item.centavos, item.descricao])).toEqual([
      ['2026-10-05', -1000, 'PADARIA'],
      ['2026-10-06', -2000, 'MERCADO'],
      ['2026-10-07', -3000, 'POSTO'],
    ]);
    expect(avisos).toEqual([]);
  });

  it('no mesmo arquivo, os iguais contam todos, sem aviso', async () => {
    const pasta = pastaCom({
      'a.ofx': ofx([
        { data: '20261005', valor: '-8.50', fitid: 'C1', memo: 'CAFE' },
        { data: '20261005', valor: '-8.50', fitid: 'C2', memo: 'CAFE' },
      ]),
    });
    const { lancamentos, avisos } = await ler(pasta);
    expect(lancamentos).toHaveLength(2);
    expect(avisos).toEqual([]);
  });

  it('a chave conta tantas vezes quanto no arquivo que mais a tem, em qualquer ordem', async () => {
    const cafe = { data: '20261005', valor: '-8.50', memo: 'CAFE' };
    const tres = ofx([cafe, cafe, cafe, { data: '20261006', valor: '-1', memo: 'TRES' }]);
    const dois = ofx([cafe, cafe, { data: '20261006', valor: '-1', memo: 'DOIS' }]);
    expect(await descricoes({ 'a.ofx': tres, 'b.ofx': dois })).toEqual([
      'CAFE',
      'CAFE',
      'CAFE',
      'TRES',
      'DOIS',
    ]);
    expect(await descricoes({ 'a.ofx': dois, 'b.ofx': tres })).toEqual([
      'CAFE',
      'CAFE',
      'DOIS',
      'CAFE',
      'TRES',
    ]);
  });

  it('com três arquivos, vale o máximo, e não a soma nem o último arquivo', async () => {
    const cafes = (n: number) =>
      ofx(Array.from({ length: n }, () => ({ data: '20261005', valor: '-8.50', memo: 'CAFE' })));
    const quantos = async (a: number, b: number, c: number) =>
      (await descricoes({ 'a.ofx': cafes(a), 'b.ofx': cafes(b), 'c.ofx': cafes(c) })).length;
    expect(await quantos(3, 1, 2)).toBe(3);
    expect(await quantos(2, 2, 3)).toBe(3);
  });

  it('o mesmo FITID com a data, o valor ou a descrição diferente conta todos', async () => {
    // Como no banco que repete o FITID do débito automático todo mês.
    const pasta = pastaCom({
      'a.ofx': ofx([{ data: '20261005', valor: '-10', fitid: '0', memo: 'IOF' }]),
      'b.ofx': ofx([
        { data: '20261105', valor: '-10', fitid: '0', memo: 'IOF' },
        { data: '20261005', valor: '-11', fitid: '0', memo: 'IOF' },
        { data: '20261005', valor: '-10', fitid: '0', memo: 'JUROS' },
      ]),
    });
    expect((await ler(pasta)).lancamentos).toHaveLength(4);
  });

  it('a chave não depende da posição do extrato no arquivo', async () => {
    // O b.ofx tem dois extratos da mesma conta, e o café dele vem no segundo.
    const cafe = { data: '20261005', valor: '-8.50', memo: 'CAFE' };
    const doisExtratos = arquivo(
      extrato([{ data: '20261006', valor: '-1', memo: 'PAO' }]),
      extrato([cafe]),
    );
    expect(await descricoes({ 'a.ofx': ofx([cafe]), 'b.ofx': doisExtratos })).toEqual([
      'CAFE',
      'PAO',
    ]);
  });

  it('o mesmo lançamento em contas diferentes conta nas duas', async () => {
    const pasta = pastaCom({
      'a.ofx': ofx([{ data: '20261005', valor: '-10', fitid: 'F1' }]),
      'b.ofx': ofx([{ data: '20261005', valor: '-10', fitid: 'F1' }], { conta: '777' }),
    });
    expect((await ler(pasta)).lancamentos).toHaveLength(2);
  });
});
