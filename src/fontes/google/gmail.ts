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
