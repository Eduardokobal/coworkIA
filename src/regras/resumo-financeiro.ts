import type { Conta, LancamentoDaConta } from '../fontes/financas/fonte-financas.js';
import { INVESTIMENTOS, PAGAMENTO_DA_FATURA } from './categorias.js';

export interface LancamentoClassificado extends LancamentoDaConta {
  categoria: string;
}

/** RF4: somas em BigInt; as saídas sem o sinal. */
export interface Totais {
  entradas: bigint;
  saidas: bigint;
}

export interface TotalDaCategoria extends Totais {
  categoria: string;
}

export interface TotalDaConta extends Totais {
  conta: Conta;
}

/** 7.12 */
export interface ResumoDoMes {
  mes: string;
  /** G4: sem o pagamento da fatura e sem os investimentos. */
  entradas: bigint;
  saidas: bigint;
  /** Da maior saída para a menor; num empate, pelo nome, na ordem do sort() padrão. */
  categorias: TotalDaCategoria[];
  pagamentoDaFatura: Totais;
  investimentos: Totais;
  /** Todas as contas, mesmo sem lançamentos no mês. */
  contas: TotalDaConta[];
  /** Todos os lançamentos do mês, com os de fora do total. */
  lancamentos: number;
}

function zero(): Totais {
  return { entradas: 0n, saidas: 0n };
}

function somar(totais: Totais, centavos: number): void {
  if (centavos > 0) {
    totais.entradas += BigInt(centavos);
  } else if (centavos < 0) {
    totais.saidas += BigInt(-centavos);
  }
}

function porSaida(a: TotalDaCategoria, b: TotalDaCategoria): number {
  if (a.saidas !== b.saidas) {
    return a.saidas > b.saidas ? -1 : 1;
  }
  if (a.categoria === b.categoria) {
    return 0;
  }
  return a.categoria < b.categoria ? -1 : 1;
}

/** 7.12 e G4: o resumo de um mês (AAAA-MM), como função pura. */
export function resumirMes(
  mes: string,
  lancamentos: readonly LancamentoClassificado[],
  contas: readonly Conta[],
): ResumoDoMes {
  const doMes = lancamentos.filter((lancamento) => lancamento.data.startsWith(`${mes}-`));
  const total = zero();
  const pagamentoDaFatura = zero();
  const investimentos = zero();
  const porCategoria = new Map<string, Totais>();
  const porConta = new Map<Conta, Totais>(contas.map((conta) => [conta, zero()]));
  for (const lancamento of doMes) {
    if (lancamento.categoria === PAGAMENTO_DA_FATURA) {
      somar(pagamentoDaFatura, lancamento.centavos);
      continue;
    }
    if (lancamento.categoria === INVESTIMENTOS) {
      somar(investimentos, lancamento.centavos);
      continue;
    }
    somar(total, lancamento.centavos);
    const daCategoria = porCategoria.get(lancamento.categoria) ?? zero();
    porCategoria.set(lancamento.categoria, daCategoria);
    somar(daCategoria, lancamento.centavos);
    const daConta = porConta.get(lancamento.conta) ?? zero();
    porConta.set(lancamento.conta, daConta);
    somar(daConta, lancamento.centavos);
  }
  return {
    mes,
    entradas: total.entradas,
    saidas: total.saidas,
    categorias: [...porCategoria.entries()]
      .map(([categoria, totais]) => ({ categoria, ...totais }))
      .sort(porSaida),
    pagamentoDaFatura,
    investimentos,
    contas: [...porConta.entries()].map(([conta, totais]) => ({ conta, ...totais })),
    lancamentos: doMes.length,
  };
}
