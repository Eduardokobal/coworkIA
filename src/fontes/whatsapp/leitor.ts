import { DateTime } from 'luxon';
import type { MensagemWhatsapp } from '../../dominio.js';
import { paraIso } from '../../tempo.js';

const LRM = String.fromCodePoint(0x200e);
const RLM = String.fromCodePoint(0x200f);
const BOM = String.fromCodePoint(0xfeff);
const MARCAS = `[${LRM}${RLM}]*`;
const DATA = '(\\d{1,2})/(\\d{1,2})/(\\d{4}|\\d{2})';
const MIDIA_OCULTA = '<Mídia oculta>';

/**
 * L1: os dois formatos, inteiros. Os grupos 1 a 3 são a data, e os 4 a 6, a hora, que vai de 0 a 23
 * (o Luxon aceitaria 24, achado 111).
 */
const FORMATOS = {
  android: new RegExp(`^${MARCAS}${DATA},? ([01]?\\d|2[0-3]):(\\d{2}) - `),
  iphone: new RegExp(`^${MARCAS}\\[${DATA}, ([01]?\\d|2[0-3]):(\\d{2})(?::(\\d{2}))?\\] `),
} as const;

type Formato = keyof typeof FORMATOS;

export interface LeituraDaExportacao {
  formato: Formato | null;
  mensagens: MensagemWhatsapp[];
  linhasDescartadas: number;
  /** AW4: as linhas com a forma da L1, mas com uma data ou uma hora que não existe. */
  linhasComDataImpossivel: number;
}

interface Inicio {
  formato: Formato;
  data: DateTime;
  resto: string;
}

/** AW4: a linha tem a forma da L1, mas a data não existe no calendário. */
const DATA_IMPOSSIVEL = 'data impossível';

/**
 * L1: a linha começa uma mensagem num dos formatos aceitos, com uma data e uma hora que existem.
 * AW4: com a forma de um dos formatos, mas com uma data que não existe, a linha não começa mensagem,
 * e o leitor a conta. Os minutos ou os segundos acima de 59, com a data certa, não contam, porque
 * não indicam o formato mês/dia.
 */
function inicioDaLinha(
  linha: string,
  formatos: readonly Formato[],
  fuso: string,
): Inicio | typeof DATA_IMPOSSIVEL | null {
  let impossivel = false;
  for (const formato of formatos) {
    const achado = FORMATOS[formato].exec(linha);
    if (achado === null) {
      continue;
    }
    const [, dia, mes, ano, hora, minuto, segundo] = achado;
    const doDia = {
      year: ano?.length === 2 ? 2000 + Number(ano) : Number(ano),
      month: Number(mes),
      day: Number(dia),
    };
    const data = DateTime.fromObject(
      { ...doDia, hour: Number(hora), minute: Number(minuto), second: Number(segundo ?? 0) },
      { zone: fuso },
    );
    if (data.isValid) {
      return { formato, data, resto: linha.slice(achado[0].length) };
    }
    if (!DateTime.fromObject(doDia, { zone: fuso }).isValid) {
      impossivel = true;
    }
  }
  return impossivel ? DATA_IMPOSSIVEL : null;
}

/** L5: o texto inteiro da mensagem, já com as continuações da L3, serve para as regras. */
function serveParaAsRegras(texto: string): boolean {
  return texto !== MIDIA_OCULTA && !texto.startsWith(LRM);
}

/**
 * Seção 5: o texto de um arquivo exportado vira a lista de mensagens. Um aviso (L2) fixa o formato,
 * porque casa com a L1, mas não é mensagem nem conta como linha descartada.
 */
export function lerExportacao(conteudo: string, fuso: string): LeituraDaExportacao {
  const linhas = (conteudo.startsWith(BOM) ? conteudo.slice(BOM.length) : conteudo).split(/\r?\n/);
  if (linhas.at(-1) === '') {
    linhas.pop();
  }
  let formato: Formato | null = null;
  const lidas: Array<Omit<MensagemWhatsapp, 'temTexto'>> = [];
  let linhasDescartadas = 0;
  let linhasComDataImpossivel = 0;
  for (const linha of linhas) {
    const inicio = inicioDaLinha(linha, formato === null ? ['android', 'iphone'] : [formato], fuso);
    if (inicio === DATA_IMPOSSIVEL) {
      linhasComDataImpossivel += 1;
    }
    if (inicio === null || inicio === DATA_IMPOSSIVEL) {
      const anterior = lidas.at(-1);
      if (anterior === undefined) {
        linhasDescartadas += 1;
      } else {
        anterior.texto += `\n${linha}`;
      }
      continue;
    }
    formato ??= inicio.formato;
    const separador = inicio.resto.indexOf(': ');
    if (separador <= 0) {
      continue;
    }
    lidas.push({
      autor: inicio.resto.slice(0, separador),
      data: paraIso(inicio.data),
      texto: inicio.resto.slice(separador + 2),
    });
  }
  // Achado 108: o L5 olha o texto depois de juntar as continuações, e não só a primeira linha.
  const mensagens = lidas.map((mensagem) => ({
    ...mensagem,
    temTexto: serveParaAsRegras(mensagem.texto),
  }));
  return { formato, mensagens, linhasDescartadas, linhasComDataImpossivel };
}
