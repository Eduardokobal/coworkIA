import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { carregarDadosDemo, fonteFinancasDemo } from '../src/fontes/demo/dados.js';
import { criarFontesDemo } from '../src/fontes/demo/fonte-demo.js';
import {
  criarFonteFinancas,
  PASTA_DAS_FINANCAS_SEM_LEITURA,
} from '../src/fontes/financas/fonte-financas.js';
import {
  type Dependencias,
  listarLancamentos,
  resumoFinanceiro,
  SEM_PASTA_DAS_FINANCAS,
} from '../src/servico.js';
import { relogioFixo } from '../src/tempo.js';

const SP = 'America/Sao_Paulo';
const PASTA = fileURLToPath(new URL('../dados-demo', import.meta.url));
const SEGREDO = Buffer.alloc(32, 7);

function dependencias(financas?: Dependencias['financas'], categorias = ''): Dependencias {
  const relogio = relogioFixo('2026-11-04T10:30', SP);
  return {
    fontes: criarFontesDemo(carregarDadosDemo(PASTA, relogio()), SP),
    relogio,
    fuso: SP,
    importantes: [],
    financas: financas ?? { fonte: fonteFinancasDemo(PASTA, relogio(), SEGREDO), categorias },
  };
}

const dep = dependencias();
const descricoes = (lista: Awaited<ReturnType<typeof listarLancamentos>>) =>
  lista.lancamentos.map((item) => item.descricao);

describe('listar_lancamentos (7.11)', () => {
  it('sem o desde, traz 30 dias até hoje, do mais novo para o mais velho', async () => {
    const lista = await listarLancamentos(dep, {});
    expect(lista.lancamentos).toHaveLength(25);
    expect(lista.lancamentos.map((item) => item.data).at(-1)).toBe('2026-10-05');
    expect(descricoes(lista).slice(0, 3)).toEqual(['SPOTIFY', 'AMAZON PRIME', 'UBER *TRIP']);
    expect(lista.completo).toBe(true);
    expect(lista.avisos).toEqual([]);
  });

  it('o desde e o ate valem pela data no fuso, com as duas pontas incluídas', async () => {
    const umDia = await listarLancamentos(dep, { desde: '2026-10-05', ate: '2026-10-05' });
    expect(descricoes(umDia)).toEqual(['SUPERMERCADO BOM PREÇO']);
    const comHora = await listarLancamentos(dep, {
      desde: '2026-10-05T23:59',
      ate: '2026-10-05T00:00',
    });
    expect(descricoes(comHora)).toEqual(['SUPERMERCADO BOM PREÇO']);
  });

  it('sem o desde e com o ate, começa 30 dias antes do ate', async () => {
    const lista = await listarLancamentos(dep, { ate: '2026-10-07' });
    expect(lista.lancamentos.map((item) => item.data)).toEqual([
      '2026-10-07',
      '2026-10-05',
      '2026-09-30',
    ]);
  });

  it('um desde depois do ate é erro', async () => {
    await expect(
      listarLancamentos(dep, { desde: '2026-10-08', ate: '2026-10-07' }),
    ).rejects.toThrow('O desde vem depois do ate.');
  });

  it('a busca casa por parte do texto, sem acento, e junta as palavras por um espaço', async () => {
    const buscar = async (busca: string) =>
      descricoes(await listarLancamentos(dep, { desde: '2026-09-01', busca }));
    expect(await buscar('netflix.com')).toEqual(['WWW.NETFLIX.COM']);
    expect(await buscar('FLIX')).toEqual(['WWW.NETFLIX.COM']);
    expect(await buscar('preco')).toEqual(['SUPERMERCADO BOM PREÇO', 'SUPERMERCADO BOM PREÇO']);
    expect(await buscar('nada disso')).toEqual([]);
    // "ixco" só casaria se as palavras se juntassem sem o espaço ("netflixcom").
    expect(await buscar('ixco')).toEqual([]);
  });

  it('filtra pela conta e pela categoria, e a conta que não existe é erro', async () => {
    const todas = await listarLancamentos(dep, { desde: '2026-09-01' });
    const cartao = todas.lancamentos.find((item) => item.conta.rotulo === 'Cartão final 2222');
    const doCartao = await listarLancamentos(dep, { desde: '2026-09-01', conta: cartao?.conta.id });
    expect(doCartao.lancamentos).toHaveLength(7);
    const comida = await listarLancamentos(dep, {
      desde: '2026-09-01',
      categoria: ' Alimentação ',
    });
    expect(descricoes(comida)).toEqual([
      'ESTORNO IFOOD',
      'PADARIA PAO QUENTE',
      'PADARIA PAO QUENTE',
      'IFOOD / IFOOD *PEDIDO',
      'IFOOD / IFOOD *RESTAURANTE',
    ]);
    await expect(listarLancamentos(dep, { conta: '000000000000' })).rejects.toThrow(
      'Conta não encontrada.',
    );
  });

  it('o limite corta, do mais novo, e o completo diz que cortou; o padrão é 50', async () => {
    const cortada = await listarLancamentos(dep, { desde: '2026-09-01', limite: 2 });
    expect(descricoes(cortada)).toEqual(['SPOTIFY', 'AMAZON PRIME']);
    expect(cortada.completo).toBe(false);
    const justa = await listarLancamentos(dep, { desde: '2026-09-01', limite: 26 });
    expect(justa.completo).toBe(true);
    const conta = {
      id: 'aaaaaaaaaaaa',
      rotulo: 'Conta final 1',
      tipo: 'conta' as const,
      saldo: null,
      dadosAte: null,
    };
    const lancamentos = Array.from({ length: 60 }, (_, indice) => ({
      data: `2026-10-${String(1 + (indice % 30)).padStart(2, '0')}`,
      centavos: -100,
      descricao: `L${indice}`,
      conta,
    }));
    const longa = await listarLancamentos(
      dependencias({
        fonte: { extratos: async () => ({ contas: [conta], lancamentos, avisos: [] }) },
        categorias: '',
      }),
      { desde: '2026-10-01' },
    );
    expect(longa.lancamentos).toHaveLength(50);
    expect(longa.completo).toBe(false);
  });

  it('as categorias do usuário valem, e o item ignorado vira aviso (G3)', async () => {
    const lista = await listarLancamentos(dependencias(undefined, 'streaming=NETFLIX;sem igual'), {
      desde: '2026-09-01',
      busca: 'netflix',
    });
    expect(lista.lancamentos.map((item) => item.categoria)).toEqual(['streaming']);
    expect(lista.avisos).toEqual([
      { nome: null, texto: 'a categoria 2 da COWORKIA_FINANCAS_CATEGORIAS foi ignorada.' },
    ]);
  });
});

describe('resumo_financeiro (7.12)', () => {
  it('sem o mês, resume o mês de hoje', async () => {
    const resumo = await resumoFinanceiro(dep);
    expect(resumo.mes).toBe('2026-11');
    expect([resumo.entradas, resumo.saidas, resumo.lancamentos]).toEqual([0n, 24850n, 4]);
    expect(resumo.categorias.map((item) => [item.categoria, item.saidas])).toEqual([
      ['mercado', 12000n],
      ['assinaturas', 9980n],
      ['transporte', 2870n],
    ]);
  });

  it('o mês pedido, com o pagamento da fatura e os investimentos à parte', async () => {
    const resumo = await resumoFinanceiro(dep, '2026-10');
    expect([resumo.entradas, resumo.saidas, resumo.lancamentos]).toEqual([24990n, 131780n, 21]);
    expect(resumo.pagamentoDaFatura).toEqual({ entradas: 145000n, saidas: 145000n });
    expect(resumo.investimentos).toEqual({ entradas: 30000n, saidas: 100000n });
    expect(resumo.categorias.map((item) => item.categoria)).toEqual([
      'mercado',
      'saúde',
      'moradia',
      'alimentação',
      'transferências',
      'transporte',
      'lazer',
      'assinaturas',
      'tarifas',
    ]);
    expect(resumo.contas.map((item) => [item.conta.rotulo, item.entradas, item.saidas])).toEqual([
      ['Cartão final 2222', 3990n, 43390n],
      ['Conta corrente final 3456', 20000n, 88390n],
      ['Poupança final 8765', 1000n, 0n],
    ]);
  });
});

describe('as finanças sem configuração (E1)', () => {
  it('as ferramentas dizem o que falta, e a pasta que não existe dá a mensagem fixa', async () => {
    await expect(listarLancamentos(dependencias(SEM_PASTA_DAS_FINANCAS), {})).rejects.toThrow(
      SEM_PASTA_DAS_FINANCAS,
    );
    await expect(resumoFinanceiro(dependencias(SEM_PASTA_DAS_FINANCAS))).rejects.toThrow(
      SEM_PASTA_DAS_FINANCAS,
    );
    const semPasta = dependencias({
      fonte: criarFonteFinancas({ pasta: join(PASTA, 'financas', 'nao-existe'), segredo: SEGREDO }),
      categorias: '',
    });
    await expect(resumoFinanceiro(semPasta)).rejects.toThrow(PASTA_DAS_FINANCAS_SEM_LEITURA);
    expect(SEM_PASTA_DAS_FINANCAS).toBe(
      'Defina COWORKIA_FINANCAS_PASTA com a pasta dos extratos OFX.',
    );
  });
});

/** #125: uma fonte de mentira, com os lançamentos dados na ordem dos arquivos, e o relógio escolhido. */
function comLancamentos(itens: Array<[string, string]>, agora = '2026-11-04T10:30'): Dependencias {
  const conta = {
    id: 'bbbbbbbbbbbb',
    rotulo: 'Conta final 2',
    tipo: 'conta' as const,
    saldo: null,
    dadosAte: null,
  };
  const lancamentos = itens.map(([data, descricao]) => ({
    data,
    centavos: -100,
    descricao,
    conta,
  }));
  return {
    ...dependencias(),
    relogio: relogioFixo(agora, SP),
    financas: {
      fonte: { extratos: async () => ({ contas: [conta], lancamentos, avisos: [] }) },
      categorias: '',
    },
  };
}

describe('as datas no fuso, a ordem e a busca (#125)', () => {
  it('sem o desde, o período começa 30 dias antes de hoje, e não 31', async () => {
    const dep30 = comLancamentos([
      ['2026-10-05', 'DIA 30'],
      ['2026-10-04', 'DIA 31'],
    ]);
    expect(descricoes(await listarLancamentos(dep30, {}))).toEqual(['DIA 30']);
  });

  it('o hoje é o do fuso: às 22:30 de 04/11 em São Paulo, já 05/11 em UTC, o período começa em 05/10', async () => {
    const tarde = comLancamentos([['2026-10-05', 'DIA 30']], '2026-11-04T22:30');
    expect(descricoes(await listarLancamentos(tarde, {}))).toEqual(['DIA 30']);
  });

  it('o desde com deslocamento vale pela data no fuso: 05/10 à 01:00 em UTC é 04/10 em São Paulo', async () => {
    const dep = comLancamentos([
      ['2026-10-05', 'DIA 5'],
      ['2026-10-04', 'DIA 4'],
    ]);
    const lista = await listarLancamentos(dep, { desde: '2026-10-05T01:00:00Z' });
    expect(descricoes(lista)).toEqual(['DIA 5', 'DIA 4']);
  });

  it('no mesmo dia, fica a ordem dos arquivos, e não a alfabética', async () => {
    const dep = comLancamentos([
      ['2026-11-01', 'ZEBRA'],
      ['2026-11-01', 'ABELHA'],
    ]);
    expect(descricoes(await listarLancamentos(dep, {}))).toEqual(['ZEBRA', 'ABELHA']);
  });

  it('a busca separa as palavras pela N4: "uber trip" acha "UBER *TRIP"', async () => {
    const dep = comLancamentos([['2026-11-01', 'UBER *TRIP']]);
    expect(descricoes(await listarLancamentos(dep, { busca: 'uber trip' }))).toEqual([
      'UBER *TRIP',
    ]);
  });

  it('sem o mês, o resumo usa o mês do fuso: às 22:00 de 31/10 em São Paulo ainda é outubro', async () => {
    const resumo = await resumoFinanceiro(comLancamentos([], '2026-10-31T22:00'));
    expect(resumo.mes).toBe('2026-10');
  });
});
