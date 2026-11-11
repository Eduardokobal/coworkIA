import { DateTime } from 'luxon';
import type { MensagemWhatsapp } from '../../dominio.js';
import { paraIso } from '../../tempo.js';

const LRM = String.fromCodePoint(0x200e);
const RLM = String.fromCodePoint(0x200f);
const BOM = String.fromCodePoint(0xfeff);
const MARCAS = `[${LRM}${RLM}]*`;
const DATA = '(\\d{1,2})/(\\d{1,2})/(\\d{4}|\\d{2})';
const MIDIA_OCULTA = '<Mídia oculta>';
/** AW10: no formato do computador, a mídia vem inteira entre < e >, numa linha só. */
const MIDIA_DO_COMPUTADOR = /^<[^<>\n]*>$/;
const APAGADA_NO_COMPUTADOR = 'Mensagem apagada';
/** AW9: o autor com que o WhatsApp do computador escreve as mensagens do usuário. */
const VOCE = 'Você';

/**
 * L1: os formatos, inteiros. Os grupos 1 a 3 são a data, e os 4 a 6, a hora, que vai de 0 a 23
 * (o Luxon aceitaria 24, achado 111). AW8: no formato do computador, a data tem o mês antes do dia,
 * a hora vai de 1 a 12, o grupo 7 é o AM ou o PM, e o 8 é o traço dos avisos ou o espaço.
 */
const FORMATOS = {
  android: new RegExp(`^${MARCAS}${DATA},? ([01]?\\d|2[0-3]):(\\d{2}) - `),
  iphone: new RegExp(`^${MARCAS}\\[${DATA}, ([01]?\\d|2[0-3]):(\\d{2})(?::(\\d{2}))?\\] `),
  computador: new RegExp(
    `^${MARCAS}\\[${DATA}, (0?[1-9]|1[0-2]):(\\d{2})(?::(\\d{2}))? (AM|PM)\\]( - | )`,
  ),
} as const;

export type Formato = keyof typeof FORMATOS;

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
  /** AW8: a linha do computador com o traço é um aviso, mesmo com ": " no texto. */
  aviso: boolean;
}

/** A data, a hora e o traço de uma linha que casou com um dos formatos. */
interface Partes {
  dia: string | undefined;
  mes: string | undefined;
  ano: string | undefined;
  hora: number;
  minuto: string | undefined;
  segundo: string | undefined;
  aviso: boolean;
}

function partesDa(formato: Formato, achado: RegExpExecArray): Partes {
  if (formato === 'computador') {
    const [, mes, dia, ano, hora, minuto, segundo, periodo, separador] = achado;
    // AW8: 12 AM é 0 h, 12 PM é 12 h, e de 1 PM a 11 PM somam 12 horas.
    const ateOnze = Number(hora) % 12;
    const horaDoDia = periodo === 'PM' ? ateOnze + 12 : ateOnze;
    return { dia, mes, ano, hora: horaDoDia, minuto, segundo, aviso: separador === ' - ' };
  }
  const [, dia, mes, ano, hora, minuto, segundo] = achado;
  return { dia, mes, ano, hora: Number(hora), minuto, segundo, aviso: false };
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
    const { dia, mes, ano, hora, minuto, segundo, aviso } = partesDa(formato, achado);
    const doDia = {
      year: ano?.length === 2 ? 2000 + Number(ano) : Number(ano),
      month: Number(mes),
      day: Number(dia),
    };
    const data = DateTime.fromObject(
      { ...doDia, hour: hora, minute: Number(minuto), second: Number(segundo ?? 0) },
      { zone: fuso },
    );
    if (data.isValid) {
      return { formato, data, resto: linha.slice(achado[0].length), aviso };
    }
    if (!DateTime.fromObject(doDia, { zone: fuso }).isValid) {
      impossivel = true;
    }
  }
  return impossivel ? DATA_IMPOSSIVEL : null;
}

/**
 * L5: o texto inteiro da mensagem, já com as continuações da L3, serve para as regras. AW10: no
 * formato do computador, a mensagem inteira entre < e > e a "Mensagem apagada" também não servem.
 */
function serveParaAsRegras(texto: string, formato: Formato | null): boolean {
  if (
    formato === 'computador' &&
    (MIDIA_DO_COMPUTADOR.test(texto) || texto === APAGADA_NO_COMPUTADOR)
  ) {
    return false;
  }
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
  let primeiraDescartada = false;
  for (const [indice, linha] of linhas.entries()) {
    const inicio = inicioDaLinha(
      linha,
      formato === null ? ['android', 'iphone', 'computador'] : [formato],
      fuso,
    );
    if (inicio === DATA_IMPOSSIVEL) {
      linhasComDataImpossivel += 1;
    }
    if (inicio === null || inicio === DATA_IMPOSSIVEL) {
      const anterior = lidas.at(-1);
      if (anterior === undefined) {
        linhasDescartadas += 1;
        if (indice === 0) {
          primeiraDescartada = true;
        }
      } else {
        anterior.texto += `\n${linha}`;
      }
      continue;
    }
    formato ??= inicio.formato;
    // AW8: a linha do computador com o traço é um aviso, mesmo com ": " no texto (L2).
    const separador = inicio.aviso ? -1 : inicio.resto.indexOf(': ');
    if (separador <= 0) {
      continue;
    }
    const lida: Omit<MensagemWhatsapp, 'temTexto'> = {
      autor: inicio.resto.slice(0, separador),
      data: paraIso(inicio.data),
      texto: inicio.resto.slice(separador + 2),
    };
    // AW9: o "Você" do computador é do usuário, mesmo fora da COWORKIA_WHATSAPP_EU.
    if (inicio.formato === 'computador' && lida.autor === VOCE) {
      lida.doUsuario = true;
    }
    lidas.push(lida);
  }
  // AW8: a primeira linha do arquivo do computador é o aviso da criptografia repetido sem a data.
  if (formato === 'computador' && primeiraDescartada) {
    linhasDescartadas -= 1;
  }
  // Achado 108: o L5 olha o texto depois de juntar as continuações, e não só a primeira linha.
  const mensagens = lidas.map((mensagem) => ({
    ...mensagem,
    temTexto: serveParaAsRegras(mensagem.texto, formato),
  }));
  return { formato, mensagens, linhasDescartadas, linhasComDataImpossivel };
}
