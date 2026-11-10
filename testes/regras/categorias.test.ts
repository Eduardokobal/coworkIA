import { describe, expect, it } from 'vitest';
import type { TipoDeConta } from '../../src/dominio.js';
import {
  type CategoriaDoUsuario,
  categoriaDe,
  lerCategoriasDoUsuario,
  mesmaCategoria,
} from '../../src/regras/categorias.js';

const na = (
  descricao: string,
  centavos = -1000,
  tipo: TipoDeConta = 'conta',
  doUsuario: readonly CategoriaDoUsuario[] = [],
) => categoriaDe({ descricao, centavos, tipo }, doUsuario);

describe('as categorias fixas (G1 e G2)', () => {
  it('casa o termo inteiro, sem diferença de maiúscula e de acento', () => {
    expect(na('UBER *TRIP')).toBe('transporte');
    expect(na('UBERABA COMERCIO')).toBe('outros');
    expect(na('TAR MANUT CONTA')).toBe('tarifas');
    expect(na('TARDE DE CINEMA')).toBe('lazer');
    expect(na('Farmácia São João')).toBe('saúde');
    expect(na('PÃO DE AÇÚCAR')).toBe('mercado');
  });

  it('casa a descrição com endereço web, porque a G1 fica sem a N3', () => {
    expect(na('WWW.NETFLIX.COM')).toBe('assinaturas');
    expect(na('APPLE.COM/BILL')).toBe('assinaturas');
  });

  it('segue a ordem da G2: as tarifas antes dos investimentos e as transferências por último', () => {
    expect(na('IOF RESGATE CDB')).toBe('tarifas');
    expect(na('RESGATE CDB', 50000)).toBe('investimentos');
    expect(na('APLICACAO AUTOMATICA')).toBe('investimentos');
    expect(na('PIX IFOOD')).toBe('alimentação');
    expect(na('PIX ENVIADO JOAO')).toBe('transferências');
  });

  it('a renda só casa com uma entrada', () => {
    expect(na('SALARIO EMPRESA X', 500000)).toBe('renda');
    expect(na('SALARIO EMPRESA X', -500000)).toBe('outros');
  });

  it('o estorno é uma entrada na categoria do gasto', () => {
    expect(na('ESTORNO IFOOD', 3990, 'cartao')).toBe('alimentação');
  });

  it('o que não casa nada é outros', () => {
    expect(na('LOJA DO BAIRRO')).toBe('outros');
    expect(na('(sem descrição)')).toBe('outros');
  });
});

describe('o pagamento da fatura (G2.1)', () => {
  it('na conta, só uma saída com um termo de pagamento de fatura', () => {
    expect(na('PAGAMENTO DE FATURA')).toBe('pagamento da fatura');
    expect(na('PGTO FATURA NUBANK')).toBe('pagamento da fatura');
    expect(na('PAG CARTAO ITAUCARD')).toBe('pagamento da fatura');
    expect(na('PAGAMENTO DE FATURA', 1000)).toBe('outros');
    // O zero não é saída (O5).
    expect(na('PAGAMENTO DE FATURA', 0)).toBe('outros');
  });

  it('vem antes das outras fixas: o pagamento da fatura por PIX não é transferência', () => {
    expect(na('PAGAMENTO FATURA VIA PIX')).toBe('pagamento da fatura');
  });

  it('a anuidade e o seguro do cartão de crédito não são pagamento da fatura', () => {
    expect(na('ANUIDADE CARTAO DE CREDITO')).toBe('tarifas');
    expect(na('SEGURO CARTAO DE CREDITO')).toBe('outros');
  });

  it('no cartão, só uma entrada com pagamento, pagto ou pgto', () => {
    expect(na('PAGTO RECEBIDO', 150000, 'cartao')).toBe('pagamento da fatura');
    expect(na('PAGAMENTO RECEBIDO', 150000, 'cartao')).toBe('pagamento da fatura');
    expect(na('PGTO RECEBIDO', 150000, 'cartao')).toBe('pagamento da fatura');
    expect(na('PAGAMENTO LOJA X', -15000, 'cartao')).toBe('outros');
  });
});

describe('as categorias do usuário (G3)', () => {
  it('lê a variável e ignora o item sem "=", sem nome ou sem termo, pelo número', () => {
    expect(lerCategoriasDoUsuario('a=b;sem igual;=x;c=; ;d= e , f ,')).toEqual({
      categorias: [
        { nome: 'a', termos: ['b'] },
        { nome: 'd', termos: ['e', 'f'] },
      ],
      ignoradas: [2, 3, 4, 5],
    });
    expect(lerCategoriasDoUsuario('')).toEqual({ categorias: [], ignoradas: [] });
  });

  it('vêm antes das fixas, na ordem da variável', () => {
    const { categorias } = lerCategoriasDoUsuario(
      'academia=SMART FIT;outros=MERCADO PAGO;moradia=ENEL',
    );
    expect(na('SMART FIT MENSAL', -9990, 'conta', categorias)).toBe('academia');
    expect(na('MERCADO PAGO*LOJA', -5000, 'conta', categorias)).toBe('outros');
    expect(na('PAGAMENTO FATURA ENEL', -20000, 'conta', categorias)).toBe('moradia');
  });

  it('o nome igual ao de uma fixa é essa categoria, com o nome e as condições dela', () => {
    const { categorias } = lerCategoriasDoUsuario(
      ' Pagamento da Fatura =NUBANK;Saude=ACADEMIA X;RENDA=FREELA',
    );
    expect(categorias.map((categoria) => categoria.nome)).toEqual([
      'pagamento da fatura',
      'saúde',
      'renda',
    ]);
    expect(na('NUBANK', -100000, 'conta', categorias)).toBe('pagamento da fatura');
    expect(na('PIX RECEBIDO FULANO NUBANK', 50000, 'conta', categorias)).toBe('transferências');
    expect(na('ACADEMIA X', -10000, 'conta', categorias)).toBe('saúde');
    expect(na('FREELA SITE', 80000, 'conta', categorias)).toBe('renda');
    expect(na('FREELA SITE', -80000, 'conta', categorias)).toBe('outros');
  });

  it('compara os nomes sem acento, sem maiúscula e sem os espaços das pontas', () => {
    expect(mesmaCategoria(' Saúde ', 'saude')).toBe(true);
    expect(mesmaCategoria('mercado', 'moradia')).toBe(false);
  });

  it('o termo com endereço web casa, porque fica sem a N3, como a descrição', () => {
    const { categorias } = lerCategoriasDoUsuario('streaming=www.max.com');
    expect(na('WWW.MAX.COM', -3490, 'conta', categorias)).toBe('streaming');
  });

  it('junta os nomes iguais pela N1 e pela N2, com a grafia do primeiro; "Outros" é o outros', () => {
    const { categorias } = lerCategoriasDoUsuario(
      'Academia=SMART FIT;academia=BLUEFIT;Outros=MERCADO PAGO;ACADÊMIA=SELFIT',
    );
    expect(categorias.map((categoria) => categoria.nome)).toEqual([
      'Academia',
      'Academia',
      'outros',
      'Academia',
    ]);
  });
});
