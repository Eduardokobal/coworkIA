import { describe, expect, it } from 'vitest';
import type { Conta } from '../../src/fontes/financas/fonte-financas.js';
import { type LancamentoClassificado, resumirMes } from '../../src/regras/resumo-financeiro.js';

const CORRENTE: Conta = {
  id: 'aaaaaaaaaaaa',
  rotulo: 'Conta corrente final 3456',
  tipo: 'conta',
  saldo: { centavos: -20000, data: '2026-11-03' },
  dadosAte: '2026-11-03',
};
const CARTAO: Conta = {
  id: 'bbbbbbbbbbbb',
  rotulo: 'Cartão final 2222',
  tipo: 'cartao',
  saldo: null,
  dadosAte: '2026-10-31',
};
const VAZIA: Conta = { ...CARTAO, id: 'cccccccccccc', rotulo: 'Conta final 1111' };

function lanc(
  data: string,
  centavos: number,
  categoria: string,
  conta: Conta = CORRENTE,
): LancamentoClassificado {
  return { data, centavos, descricao: categoria, conta, categoria };
}

describe('resumirMes (7.12 e G4)', () => {
  it('soma só o mês pedido, por categoria, da maior saída para a menor', () => {
    const resumo = resumirMes(
      '2026-11',
      [
        lanc('2026-10-31', -99999, 'mercado'),
        lanc('2026-11-01', 500000, 'renda'),
        lanc('2026-11-02', -15000, 'mercado'),
        lanc('2026-11-02', -4990, 'alimentação'),
        lanc('2026-11-03', 3990, 'alimentação', CARTAO),
        lanc('2026-11-03', -12000, 'mercado', CARTAO),
        lanc('2026-11-03', 0, 'outros'),
      ],
      [CORRENTE, CARTAO, VAZIA],
    );
    expect(resumo.mes).toBe('2026-11');
    expect(resumo.lancamentos).toBe(6);
    expect([resumo.entradas, resumo.saidas]).toEqual([503990n, 31990n]);
    expect(resumo.categorias).toEqual([
      { categoria: 'mercado', entradas: 0n, saidas: 27000n },
      { categoria: 'alimentação', entradas: 3990n, saidas: 4990n },
      { categoria: 'outros', entradas: 0n, saidas: 0n },
      { categoria: 'renda', entradas: 500000n, saidas: 0n },
    ]);
    expect(resumo.contas.map((item) => [item.conta.id, item.entradas, item.saidas])).toEqual([
      ['aaaaaaaaaaaa', 500000n, 19990n],
      ['bbbbbbbbbbbb', 3990n, 12000n],
      ['cccccccccccc', 0n, 0n],
    ]);
  });

  it('o pagamento da fatura e os investimentos ficam fora do total, cada um à parte', () => {
    const resumo = resumirMes(
      '2026-11',
      [
        lanc('2026-11-05', -150000, 'pagamento da fatura'),
        lanc('2026-11-05', 150000, 'pagamento da fatura', CARTAO),
        lanc('2026-11-06', -100000, 'investimentos'),
        lanc('2026-11-07', 30000, 'investimentos'),
        lanc('2026-11-07', -1000, 'tarifas'),
      ],
      [CORRENTE, CARTAO],
    );
    expect([resumo.entradas, resumo.saidas]).toEqual([0n, 1000n]);
    expect(resumo.pagamentoDaFatura).toEqual({ entradas: 150000n, saidas: 150000n });
    expect(resumo.investimentos).toEqual({ entradas: 30000n, saidas: 100000n });
    expect(resumo.categorias.map((item) => item.categoria)).toEqual(['tarifas']);
    expect(resumo.contas.map((item) => [item.entradas, item.saidas])).toEqual([
      [0n, 1000n],
      [0n, 0n],
    ]);
    expect(resumo.lancamentos).toBe(5);
  });

  it('o empate nas saídas vai pelo nome da categoria, na ordem do sort() padrão', () => {
    const resumo = resumirMes(
      '2026-11',
      [
        lanc('2026-11-01', -100, 'lazer'),
        lanc('2026-11-01', -100, 'Academia'),
        lanc('2026-11-01', -100, 'alimentação'),
        lanc('2026-11-01', -100, 'Zeta'),
      ],
      [CORRENTE],
    );
    // Pelas unidades de código, a maiúscula vem antes da minúscula: "Zeta" antes de "alimentação".
    expect(resumo.categorias.map((item) => item.categoria)).toEqual([
      'Academia',
      'Zeta',
      'alimentação',
      'lazer',
    ]);
  });

  it('as somas passam do maior inteiro exato do JavaScript sem perder centavos (RF4)', () => {
    const grande = 9_999_999_999_999;
    const resumo = resumirMes(
      '2026-11',
      Array.from({ length: 1000 }, () => lanc('2026-11-01', -grande, 'outros')),
      [CORRENTE],
    );
    expect(resumo.saidas).toBe(9_999_999_999_999_000n);
    expect(resumo.saidas > BigInt(Number.MAX_SAFE_INTEGER)).toBe(true);
  });

  it('um mês sem lançamentos dá zero, com as contas', () => {
    const resumo = resumirMes('2026-09', [lanc('2026-11-01', -100, 'outros')], [CORRENTE]);
    expect([resumo.entradas, resumo.saidas, resumo.lancamentos]).toEqual([0n, 0n, 0]);
    expect(resumo.categorias).toEqual([]);
    expect(resumo.contas).toHaveLength(1);
  });
});
