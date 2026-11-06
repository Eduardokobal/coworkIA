import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import type { Conversa } from '../../dominio.js';
import { lerExportacao } from './leitor.js';

/** F2: os limites da pasta. */
export const LIMITE_DE_ARQUIVOS = 200;
export const LIMITE_DE_BYTES = 20 * 1024 * 1024;

const EXTENSAO = '.txt';
const PREFIXO = 'Conversa do WhatsApp com ';

/** F1: a mensagem da pasta que não existe ou não pode ser lida, sem o erro do sistema. */
export const PASTA_SEM_LEITURA =
  'A pasta de COWORKIA_WHATSAPP_PASTA não pôde ser lida; confira se ela existe.';

/** F1: as ferramentas mostram a mensagem, e o resumo do dia a põe no lugar da seção do WhatsApp. */
export class ErroDaPasta extends Error {
  constructor(causa: unknown) {
    super(PASTA_SEM_LEITURA, { cause: causa });
    this.name = 'ErroDaPasta';
  }
}

/** Um aviso sobre a pasta. O nome, quando há, é de terceiros e passa pela S2 na saída. */
export interface AvisoDaPasta {
  nome: string | null;
  texto: string;
}

export interface ResultadoDaPasta {
  conversas: Conversa[];
  avisos: AvisoDaPasta[];
}

export interface FonteWhatsapp {
  conversas(): Promise<ResultadoDaPasta>;
}

export interface OpcoesDaFonte {
  pasta: string;
  fuso: string;
  /** Na demonstração, troca os modelos de data antes da leitura. */
  preparar?: (texto: string) => string;
  /** Só para os testes; o padrão é o LIMITE_DE_BYTES. */
  limiteDeBytes?: number;
}

/** F2: só arquivo comum terminado em .txt. Um link simbólico não é arquivo comum e nunca é seguido. */
export function ehArquivoDeConversa(entrada: { name: string; isFile(): boolean }): boolean {
  return entrada.isFile() && entrada.name.endsWith(EXTENSAO);
}

/** F4: os 12 primeiros caracteres hexadecimais do sha256 do nome do arquivo. */
export function idDoArquivo(nomeDoArquivo: string): string {
  return createHash('sha256').update(nomeDoArquivo).digest('hex').slice(0, 12);
}

/** F4: o nome do arquivo sem o .txt e sem o prefixo da exportação. */
export function nomeDaConversa(nomeDoArquivo: string): string {
  const semExtensao = nomeDoArquivo.slice(0, -EXTENSAO.length);
  return semExtensao.startsWith(PREFIXO) ? semExtensao.slice(PREFIXO.length) : semExtensao;
}

/** F4: duas conversas com o mesmo id ficam de fora, com um aviso. */
export function semIdsRepetidos(
  conversas: readonly Conversa[],
  avisos: AvisoDaPasta[],
): Conversa[] {
  const vezes = new Map<string, number>();
  for (const conversa of conversas) {
    vezes.set(conversa.id, (vezes.get(conversa.id) ?? 0) + 1);
  }
  return conversas.filter((conversa) => {
    if ((vezes.get(conversa.id) ?? 0) === 1) {
      return true;
    }
    avisos.push({ nome: conversa.nome, texto: 'o id se repete, e a conversa ficou de fora.' });
    return false;
  });
}

/** F1 (achado 114): a pasta que não existe ou não pode ser lida vira o ErroDaPasta. */
function entradasDa(pasta: string) {
  try {
    return readdirSync(pasta, { withFileTypes: true });
  } catch (erro) {
    throw new ErroDaPasta(erro);
  }
}

function lerPasta(opcoes: OpcoesDaFonte): ResultadoDaPasta {
  const avisos: AvisoDaPasta[] = [];
  const arquivos = entradasDa(opcoes.pasta)
    .filter(ehArquivoDeConversa)
    .map((entrada) => entrada.name)
    .sort();
  if (arquivos.length > LIMITE_DE_ARQUIVOS) {
    avisos.push({
      nome: null,
      texto: `O limite é de ${LIMITE_DE_ARQUIVOS} arquivos; ficaram de fora: ${arquivos.length - LIMITE_DE_ARQUIVOS}.`,
    });
  }
  const lidas: Conversa[] = [];
  for (const arquivo of arquivos.slice(0, LIMITE_DE_ARQUIVOS)) {
    const caminho = join(opcoes.pasta, arquivo);
    const nome = nomeDaConversa(arquivo);
    let bruto: string;
    try {
      if (statSync(caminho).size > (opcoes.limiteDeBytes ?? LIMITE_DE_BYTES)) {
        avisos.push({ nome, texto: 'o arquivo passa de 20 MB e ficou de fora.' });
        continue;
      }
      bruto = readFileSync(caminho, 'utf8');
    } catch {
      // Achado 109: o erro do sistema traz o caminho, com o nome do contato, e fica de fora (S2).
      avisos.push({ nome, texto: 'o arquivo não pôde ser lido e ficou de fora.' });
      continue;
    }
    const leitura = lerExportacao(opcoes.preparar?.(bruto) ?? bruto, opcoes.fuso);
    if (leitura.formato === null) {
      avisos.push({ nome, texto: 'formato não reconhecido.' });
    } else if (leitura.linhasDescartadas > 0) {
      avisos.push({
        nome,
        texto: `linhas descartadas antes da primeira mensagem: ${leitura.linhasDescartadas}.`,
      });
    }
    lidas.push({ id: idDoArquivo(arquivo), nome, ...leitura });
  }
  return { conversas: semIdsRepetidos(lidas, avisos), avisos };
}

/** Seção 4: lê a pasta a cada chamada, sem gravar nada nela (RW1). */
export function criarFonteWhatsapp(opcoes: OpcoesDaFonte): FonteWhatsapp {
  return { conversas: async () => lerPasta(opcoes) };
}
