import { describe, expect, it } from 'vitest';
import {
  decodificar,
  decodificarEntidades,
  lerData,
  lerOfx,
  lerValor,
} from '../../../src/fontes/financas/leitor-ofx.js';

const SUBSTITUTO = String.fromCodePoint(0xfffd);
const BOM = String.fromCodePoint(0xfeff);

const CABECALHO_1X = [
  'OFXHEADER:100',
  'DATA:OFXSGML',
  'VERSION:102',
  'SECURITY:NONE',
  'ENCODING:USASCII',
  'CHARSET:1252',
  'COMPRESSION:NONE',
  'OLDFILEUID:NONE',
  'NEWFILEUID:NONE',
  '',
].join('\n');

/** Uma transação no OFX 1.x, com os elementos sem fechamento. */
function trn(campos: Record<string, string>): string {
  const linhas = Object.entries(campos).map(([nome, valor]) => `<${nome}>${valor}`);
  return ['<STMTTRN>', '<TRNTYPE>OTHER', ...linhas, '</STMTTRN>'].join('\n');
}

/** Um extrato da conta no OFX 1.x, dentro do STMTTRNRS, como a especificação mostra. */
function conta(transacoes: string[], extra = ''): string {
  return [
    '<STMTTRNRS>',
    '<TRNUID>1',
    '<STATUS><CODE>0<SEVERITY>INFO</STATUS>',
    '<STMTRS>',
    '<CURDEF>BRL',
    '<BANKACCTFROM>',
    '<BANKID>0341',
    '<ACCTID>12345-6',
    '<ACCTTYPE>CHECKING',
    '</BANKACCTFROM>',
    '<BANKTRANLIST>',
    '<DTSTART>20261001',
    '<DTEND>20261031120000[-3:BRT]',
    ...transacoes,
    '</BANKTRANLIST>',
    extra,
    '</STMTRS>',
    '</STMTTRNRS>',
  ].join('\n');
}

function arquivo1x(...extratos: string[]): string {
  return `${CABECALHO_1X}<OFX>\n<BANKMSGSRSV1>\n${extratos.join('\n')}\n</BANKMSGSRSV1>\n</OFX>\n`;
}

const CARTAO_2X = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<?OFX OFXHEADER="200" VERSION="211" SECURITY="NONE" OLDFILEUID="NONE" NEWFILEUID="NONE"?>',
  '<OFX><CREDITCARDMSGSRSV1><CCSTMTTRNRS><TRNUID>1</TRNUID><CCSTMTRS><CURDEF>BRL</CURDEF>',
  '<CCACCTFROM><ACCTID>5555444433332222</ACCTID></CCACCTFROM>',
  '<BANKTRANLIST><DTSTART>20261001</DTSTART><DTEND>20261031</DTEND>',
  '<STMTTRN><TRNTYPE>DEBIT</TRNTYPE><DTPOSTED>20261010</DTPOSTED><TRNAMT>-89.90</TRNAMT><FITID>C1</FITID><NAME>IFOOD</NAME><MEMO>IFOOD *PEDIDO</MEMO></STMTTRN>',
  '<STMTTRN><TRNTYPE>CREDIT</TRNTYPE><DTPOSTED>20261020</DTPOSTED><TRNAMT>1500.00</TRNAMT><FITID>C2</FITID><MEMO>PAGTO RECEBIDO</MEMO></STMTTRN>',
  '</BANKTRANLIST><LEDGERBAL><BALAMT>-1500.00</BALAMT><DTASOF>20261031</DTASOF></LEDGERBAL>',
  '</CCSTMTRS></CCSTMTTRNRS></CREDITCARDMSGSRSV1></OFX>',
].join('\n');

describe('lerOfx: os dois formatos (O1 a O3)', () => {
  it('lê o OFX 1.x, com as marcas sem fechamento, a conta, o saldo e o fim do período', () => {
    const [extrato, ...resto] = lerOfx(
      arquivo1x(
        conta(
          [
            trn({
              DTPOSTED: '20261005120000[-3:BRT]',
              TRNAMT: '-50.00',
              FITID: 'A1',
              MEMO: 'MERCADO SAO JOAO',
            }),
          ],
          '<LEDGERBAL>\n<BALAMT>1234,56\n<DTASOF>20261031\n</LEDGERBAL>',
        ),
      ),
    );
    expect(resto).toEqual([]);
    expect(extrato).toEqual({
      tipo: 'conta',
      banco: '0341',
      numero: '12345-6',
      tipoDaConta: 'CHECKING',
      moeda: 'BRL',
      lancamentos: [{ data: '2026-10-05', centavos: -5000, descricao: 'MERCADO SAO JOAO' }],
      descartados: 0,
      saldo: { centavos: 123456, data: '2026-10-31' },
      fim: '2026-10-31',
    });
  });

  it('lê o OFX 2.x do cartão, com a compra negativa e o pagamento positivo (O8)', () => {
    const [cartao] = lerOfx(CARTAO_2X);
    expect(cartao).toMatchObject({
      tipo: 'cartao',
      banco: '',
      numero: '5555444433332222',
      tipoDaConta: '',
      moeda: 'BRL',
      saldo: { centavos: -150000, data: '2026-10-31' },
      fim: '2026-10-31',
    });
    expect(cartao?.lancamentos.map((item) => [item.centavos, item.descricao])).toEqual([
      [-8990, 'IFOOD / IFOOD *PEDIDO'],
      [150000, 'PAGTO RECEBIDO'],
    ]);
  });

  it('a marca casa pelo nome inteiro e sem diferença de maiúscula', () => {
    const texto = arquivo1x(
      conta([trn({ DTPOSTED: '20261005', TRNAMT: '1' })]).replace('<STMTRS>', '<stmtrs>'),
      '<STMTRSX><CURDEF>BRL</STMTRSX>',
    );
    const extratos = lerOfx(texto);
    expect(extratos).toHaveLength(1);
    expect(extratos[0]?.tipo).toBe('conta');
    expect(extratos[0]?.lancamentos).toHaveLength(1);
  });

  it('lê mais de um extrato no arquivo, na ordem, e a moeda como vem', () => {
    const usd = conta([trn({ DTPOSTED: '20261005', TRNAMT: '1' })]).replace(
      '<CURDEF>BRL',
      '<CURDEF>usd',
    );
    const texto = `${arquivo1x(usd)}${CARTAO_2X}`;
    expect(lerOfx(texto).map((extrato) => [extrato.tipo, extrato.moeda])).toEqual([
      ['conta', 'USD'],
      ['cartao', 'BRL'],
    ]);
  });

  it('sem nenhum extrato, a lista é vazia', () => {
    expect(lerOfx(`${CABECALHO_1X}<OFX></OFX>`)).toEqual([]);
    expect(lerOfx('qualquer coisa')).toEqual([]);
  });

  it('sem o DTEND, o fim é o lançamento mais novo; sem lançamentos, é nulo; sem saldo, é nulo', () => {
    const semFim = conta([
      trn({ DTPOSTED: '20261003', TRNAMT: '1' }),
      trn({ DTPOSTED: '20261009', TRNAMT: '1' }),
    ]).replace('<DTEND>20261031120000[-3:BRT]', '');
    expect(lerOfx(arquivo1x(semFim))[0]).toMatchObject({ fim: '2026-10-09', saldo: null });
    const vazio = conta([]).replace('<DTEND>20261031120000[-3:BRT]', '');
    expect(lerOfx(arquivo1x(vazio))[0]?.fim).toBeNull();
    const saldoRuim = conta([], '<LEDGERBAL><BALAMT>1.234,56<DTASOF>20261031</LEDGERBAL>');
    expect(lerOfx(arquivo1x(saldoRuim))[0]?.saldo).toBeNull();
  });
});

describe('lerOfx: os lançamentos (O4, O7 e O11)', () => {
  it('a descrição junta o NAME e o MEMO, ou usa o que existir', () => {
    const [extrato] = lerOfx(
      arquivo1x(
        conta([
          trn({ DTPOSTED: '20261001', TRNAMT: '1', NAME: 'UBER', MEMO: 'UBER *TRIP' }),
          trn({ DTPOSTED: '20261001', TRNAMT: '1', NAME: 'NETFLIX', MEMO: 'NETFLIX' }),
          trn({ DTPOSTED: '20261001', TRNAMT: '1', NAME: '  PADARIA  ' }),
          trn({ DTPOSTED: '20261001', TRNAMT: '1', MEMO: 'TARIFA' }),
          trn({ DTPOSTED: '20261001', TRNAMT: '1' }),
        ]),
      ),
    );
    expect(extrato?.lancamentos.map((item) => item.descricao)).toEqual([
      'UBER / UBER *TRIP',
      'NETFLIX',
      'PADARIA',
      'TARIFA',
      '(sem descrição)',
    ]);
  });

  it('sem um TRNAMT ou um DTPOSTED válido, o lançamento é descartado e contado', () => {
    const [extrato] = lerOfx(
      arquivo1x(
        conta([
          trn({ DTPOSTED: '20261001', TRNAMT: '10' }),
          trn({ DTPOSTED: '20261001' }),
          trn({ TRNAMT: '10' }),
          trn({ DTPOSTED: '20260230', TRNAMT: '10' }),
          trn({ DTPOSTED: '20261001', TRNAMT: '1.234,56' }),
        ]),
      ),
    );
    expect(extrato?.lancamentos).toHaveLength(1);
    expect(extrato?.descartados).toBe(4);
  });

  it('o FITID não é lido: o lançamento só tem a data, o valor e a descrição', () => {
    const [extrato] = lerOfx(
      arquivo1x(conta([trn({ DTPOSTED: '20261001', TRNAMT: '1', FITID: 'F1', MEMO: 'IOF' })])),
    );
    expect(extrato?.lancamentos).toEqual([{ data: '2026-10-01', centavos: 100, descricao: 'IOF' }]);
  });
});

describe('lerValor (O5)', () => {
  it('aceita o ponto, a vírgula, sem centavos, o sinal e 1 ou 2 casas', () => {
    expect(['-50.00', '350,00', '7', '+12.3', ' -0,05 ', '-0,5', '-0,50'].map(lerValor)).toEqual([
      -5000, 35000, 700, 1230, -5, -50, -50,
    ]);
  });

  it('o zero é válido, e o "-0" vira 0', () => {
    expect(lerValor('0.00')).toBe(0);
    expect(Object.is(lerValor('-0'), 0)).toBe(true);
  });

  it('aceita até 11 dígitos inteiros e recusa as outras formas', () => {
    expect(lerValor('99999999999,99')).toBe(9_999_999_999_999);
    for (const ruim of ['999999999999', '1.234,56', '1,234.56', '10.505', '.50', '1e3', '', null]) {
      expect(lerValor(ruim)).toBeNull();
    }
  });
});

describe('lerData (O6)', () => {
  it('usa os 8 primeiros dígitos, sem converter o fuso', () => {
    expect(
      ['20261105', '20261105235959.999', '20261105000000[-3:BRT]', '20261105210000[0:GMT]'].map(
        lerData,
      ),
    ).toEqual(['2026-11-05', '2026-11-05', '2026-11-05', '2026-11-05']);
  });

  it('a data que não existe e a forma errada dão nulo', () => {
    for (const ruim of ['20260230', '20261301', '2026-11-05', '2026110', '', null]) {
      expect(lerData(ruim)).toBeNull();
    }
  });
});

describe('decodificarEntidades (O1)', () => {
  it('troca as entidades nomeadas e as numéricas, numa passada só', () => {
    expect(decodificarEntidades('&lt;&gt;&amp;&quot;&apos; &#233; &#xE9; &#XE9; &#xe9;')).toBe(
      `<>&"' é é é é`,
    );
    expect(decodificarEntidades('&amp;lt;')).toBe('&lt;');
  });

  it('a numérica inválida vira U+FFFD, e o nome fora da lista fica como está', () => {
    expect(decodificarEntidades('&#0; &#x110000; &#xD800; &#xDFFF; &#99999999999999999999;')).toBe(
      [SUBSTITUTO, SUBSTITUTO, SUBSTITUTO, SUBSTITUTO, SUBSTITUTO].join(' '),
    );
    expect(decodificarEntidades('&nbsp; &LT; &;')).toBe('&nbsp; &LT; &;');
  });

  it('a entidade na descrição do lançamento vira o caractere, numa passada só', () => {
    const [extrato] = lerOfx(
      arquivo1x(
        conta([trn({ DTPOSTED: '20261001', TRNAMT: '1', MEMO: 'A &amp; B &lt;3 &amp;lt;' })]),
      ),
    );
    expect(extrato?.lancamentos[0]?.descricao).toBe('A & B <3 &lt;');
  });
});

describe('lerOfx: um arquivo feito para travar o leitor (#124)', () => {
  it('as aberturas sem fechamento, num arquivo de 1 MB, são lidas em menos de 1 segundo', () => {
    const MEGA = 1024 * 1024;
    const extratosSemFechamento = '<STMTRS>'.repeat(MEGA / 8);
    const lancamentosSemFechamento = arquivo1x(conta(['<STMTTRN>'.repeat(MEGA / 9)]));
    const inicio = performance.now();
    expect(lerOfx(extratosSemFechamento)).toEqual([]);
    expect(lerOfx(lancamentosSemFechamento)[0]?.lancamentos).toEqual([]);
    expect(performance.now() - inicio).toBeLessThan(1000);
  });
});

describe('decodificar (E3)', () => {
  it('lê o UTF-8 válido como UTF-8 e tira o BOM', () => {
    const bytes = new TextEncoder().encode(`${BOM}PÃO DE AÇÚCAR`);
    expect(decodificar(bytes)).toBe('PÃO DE AÇÚCAR');
  });

  it('lê como Windows-1252 o que não é UTF-8 válido, qualquer que seja o cabeçalho', () => {
    const bytes = Uint8Array.from([
      0x43, 0x48, 0x41, 0x52, 0x53, 0x45, 0x54, 0x3a, 0x31, 0x32, 0x35, 0x32, 0x20, 0x50, 0xc3,
      0x4f, 0x20, 0x44, 0x45, 0x20, 0x41, 0xc7, 0xda, 0x43, 0x41, 0x52,
    ]);
    expect(decodificar(bytes)).toBe('CHARSET:1252 PÃO DE AÇÚCAR');
  });
});
