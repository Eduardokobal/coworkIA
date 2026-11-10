import { createHmac } from 'node:crypto';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import type { Lancamento, Saldo, TipoDeConta } from '../../dominio.js';
import { decodificar, type ExtratoLido, lerOfx } from './leitor-ofx.js';

/** E2: os limites da pasta. */
export const LIMITE_DE_ARQUIVOS = 200;
export const LIMITE_DE_BYTES = 5 * 1024 * 1024;

/** E1: a mensagem da pasta que não existe ou não pode ser lida, sem o erro do sistema. */
export const PASTA_DAS_FINANCAS_SEM_LEITURA =
  'A pasta de COWORKIA_FINANCAS_PASTA não pôde ser lida; confira se ela existe.';

/** E1: as ferramentas das finanças mostram a mensagem. */
export class ErroDaPastaDasFinancas extends Error {
  constructor(causa: unknown) {
    super(PASTA_DAS_FINANCAS_SEM_LEITURA, { cause: causa });
    this.name = 'ErroDaPastaDasFinancas';
  }
}

/** E4: um aviso sobre a pasta. O nome do arquivo, quando há, passa pela S2 na saída. */
export interface AvisoDoExtrato {
  nome: string | null;
  texto: string;
}

/** O10: uma conta, juntando os extratos com a mesma chave. */
export interface Conta {
  /** O10: os 12 primeiros hexadecimais do HMAC-SHA256 da chave, com a chave secreta da sessão. */
  id: string;
  rotulo: string;
  tipo: TipoDeConta;
  /** O9: o saldo do extrato com a DTASOF mais nova. */
  saldo: Saldo | null;
  /** O12: o fim do período mais novo da conta. */
  dadosAte: string | null;
}

export interface LancamentoDaConta extends Lancamento {
  conta: Conta;
}

export interface ResultadoDosExtratos {
  contas: Conta[];
  /** Na ordem dos arquivos (E2) e, no mesmo arquivo, na ordem em que aparecem, sem os repetidos. */
  lancamentos: LancamentoDaConta[];
  avisos: AvisoDoExtrato[];
}

export interface FonteFinancas {
  extratos(): Promise<ResultadoDosExtratos>;
}

export interface OpcoesDaFonteFinancas {
  pasta: string;
  /** O10: a chave secreta da sessão, criada quando o servidor sobe. */
  segredo: Uint8Array;
  /** Na demonstração, troca os modelos de data antes da leitura. */
  preparar?: (texto: string) => string;
  /** Só para os testes; o padrão é o LIMITE_DE_BYTES. */
  limiteDeBytes?: number;
  /** Só para os testes da E5; o padrão é o lerOfx. */
  lerOfx?: (texto: string) => ExtratoLido[];
}

/** E2: só arquivo comum terminado em .ofx, sem diferença de maiúscula. Um link nunca é seguido. */
export function ehArquivoDeExtrato(entrada: { name: string; isFile(): boolean }): boolean {
  return entrada.isFile() && entrada.name.toLowerCase().endsWith('.ofx');
}

/** O10: a chave que junta os extratos da mesma conta. Ela nunca sai. */
export function chaveDaConta(extrato: Pick<ExtratoLido, 'tipo' | 'banco' | 'numero'>): string {
  return `${extrato.tipo}|${extrato.banco}|${extrato.numero}`;
}

/** O10: o id opaco; sem a chave secreta, ele não leva ao número da conta. */
export function idDaConta(chave: string, segredo: Uint8Array): string {
  return createHmac('sha256', segredo).update(chave).digest('hex').slice(0, 12);
}

/**
 * O10: um número de conta, inteiro ou mascarado, tem só dígitos, espaços, pontos, traços, barras,
 * asteriscos e X. O X é o dígito verificador de alguns bancos e, como o asterisco, a máscara de um
 * cartão.
 */
const SO_CARACTERES_DE_CONTA = /^[\d .\-/*Xx]*$/;
/** O10: e tem pelo menos um dígito. São dois testes, e não um, para o tempo crescer com o tamanho (#124). */
const TEM_DIGITO = /\d/;

/** O10, F-D11 e F-D12: texto fixo do coworkIA, com os 4 últimos dígitos de um número de conta. */
export function rotuloDaConta(
  extrato: Pick<ExtratoLido, 'tipo' | 'numero' | 'tipoDaConta'>,
): string {
  const ehNumero = SO_CARACTERES_DE_CONTA.test(extrato.numero) && TEM_DIGITO.test(extrato.numero);
  const final = ehNumero ? extrato.numero.replace(/\D/g, '').slice(-4) : 'sem número';
  if (extrato.tipo === 'cartao') {
    return `Cartão final ${final}`;
  }
  if (extrato.tipoDaConta === 'CHECKING') {
    return `Conta corrente final ${final}`;
  }
  if (extrato.tipoDaConta === 'SAVINGS') {
    return `Poupança final ${final}`;
  }
  return `Conta final ${final}`;
}

/** E1: a pasta que não existe ou não pode ser lida vira o ErroDaPastaDasFinancas. */
function entradasDa(pasta: string) {
  try {
    return readdirSync(pasta, { withFileTypes: true });
  } catch (erro) {
    throw new ErroDaPastaDasFinancas(erro);
  }
}

/** O11 e F-D10: a chave de um lançamento é a conta, a data, o valor e a descrição. */
function chaveDoLancamento(chaveDaConta: string, lancamento: Lancamento): string {
  return JSON.stringify([chaveDaConta, lancamento.data, lancamento.centavos, lancamento.descricao]);
}

function lerPasta(opcoes: OpcoesDaFonteFinancas): ResultadoDosExtratos {
  const avisos: AvisoDoExtrato[] = [];
  const arquivos = entradasDa(opcoes.pasta)
    .filter(ehArquivoDeExtrato)
    .map((entrada) => entrada.name)
    .sort();
  if (arquivos.length > LIMITE_DE_ARQUIVOS) {
    avisos.push({
      nome: null,
      texto: `O limite é de ${LIMITE_DE_ARQUIVOS} arquivos; ficaram de fora: ${arquivos.length - LIMITE_DE_ARQUIVOS}.`,
    });
  }
  const ler = opcoes.lerOfx ?? lerOfx;
  const contas = new Map<string, Conta>();
  // O11: quantos lançamentos cada chave já deixou: o máximo entre os arquivos anteriores.
  const deixados = new Map<string, number>();
  const lancamentos: LancamentoDaConta[] = [];
  for (const arquivo of arquivos.slice(0, LIMITE_DE_ARQUIVOS)) {
    const caminho = join(opcoes.pasta, arquivo);
    let bytes: Buffer;
    try {
      if (statSync(caminho).size > (opcoes.limiteDeBytes ?? LIMITE_DE_BYTES)) {
        avisos.push({ nome: arquivo, texto: 'o arquivo passa de 5 MB e ficou de fora.' });
        continue;
      }
      bytes = readFileSync(caminho);
    } catch {
      avisos.push({ nome: arquivo, texto: 'o arquivo não pôde ser lido e ficou de fora.' });
      continue;
    }
    const texto = decodificar(bytes);
    const preparado = opcoes.preparar?.(texto) ?? texto;
    let extratos: ExtratoLido[];
    try {
      extratos = ler(preparado);
    } catch {
      // E5: o erro do leitor deixa só este arquivo de fora, sem a mensagem do erro.
      extratos = [];
    }
    if (extratos.length === 0) {
      avisos.push({ nome: arquivo, texto: 'formato não reconhecido.' });
      continue;
    }
    let descartados = 0;
    // O11: quantos lançamentos de cada chave este arquivo já trouxe.
    const noArquivo = new Map<string, number>();
    for (const extrato of extratos) {
      if (extrato.moeda !== 'BRL') {
        avisos.push({ nome: arquivo, texto: 'extrato em outra moeda, que não é lida.' });
        continue;
      }
      descartados += extrato.descartados;
      const chave = chaveDaConta(extrato);
      let conta = contas.get(chave);
      if (conta === undefined) {
        conta = {
          id: idDaConta(chave, opcoes.segredo),
          rotulo: rotuloDaConta(extrato),
          tipo: extrato.tipo,
          saldo: null,
          dadosAte: null,
        };
        contas.set(chave, conta);
      }
      if (
        extrato.saldo !== null &&
        (conta.saldo === null || extrato.saldo.data >= conta.saldo.data)
      ) {
        conta.saldo = extrato.saldo;
      }
      if (extrato.fim !== null && (conta.dadosAte === null || extrato.fim > conta.dadosAte)) {
        conta.dadosAte = extrato.fim;
      }
      for (const lancamento of extrato.lancamentos) {
        const chaveDele = chaveDoLancamento(chave, lancamento);
        const posicao = (noArquivo.get(chaveDele) ?? 0) + 1;
        noArquivo.set(chaveDele, posicao);
        // O11: o n-ésimo com a mesma chave é repetido quando os arquivos anteriores já deixaram n.
        if (posicao > (deixados.get(chaveDele) ?? 0)) {
          lancamentos.push({ ...lancamento, conta });
        }
      }
    }
    for (const [chaveDele, quantos] of noArquivo) {
      deixados.set(chaveDele, Math.max(deixados.get(chaveDele) ?? 0, quantos));
    }
    if (descartados > 0) {
      avisos.push({ nome: arquivo, texto: `lançamentos descartados: ${descartados}.` });
    }
  }
  return { contas: [...contas.values()], lancamentos, avisos };
}

/** Seção 4: lê a pasta a cada chamada, sem gravar nada nela (RF1). */
export function criarFonteFinancas(opcoes: OpcoesDaFonteFinancas): FonteFinancas {
  return { extratos: async () => lerPasta(opcoes) };
}
