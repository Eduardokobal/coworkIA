import type { DateTime } from 'luxon';
import { paraIso } from '../../tempo.js';

/**
 * Grupos: 1 dia, 2 hora, 3 minuto, 4 formato (o ofx é o da versão 2, parte 2, seção 8),
 * 5 deslocamento do agora, 6 unidade, 7 formato do WhatsApp (versão 2, seção 9) e 8 código.
 */
const MODELO =
  /\{\{(?:dia([+-]\d+)(?: (\d{2}):(\d{2})|:(dd\/mm\/aaaa|dd\/mm|ofx))?|agora([+-]\d+)(h|min)(?::(android|iphone))?|U\+([0-9A-F]{4,6}))\}\}/g;
const QUALQUER_MODELO = /\{\{[^}]*\}\}/;

function resolverUm(agora: DateTime, grupos: Array<string | undefined>): string {
  const [dia, hora, minuto, formato, deslocamento, unidade, whatsapp, codigo] = grupos;
  if (codigo !== undefined) {
    return String.fromCodePoint(Number.parseInt(codigo, 16));
  }
  if (deslocamento !== undefined) {
    const quantidade = Number(deslocamento);
    const momento =
      unidade === 'h' ? agora.plus({ hours: quantidade }) : agora.plus({ minutes: quantidade });
    if (whatsapp === 'android') {
      return momento.toFormat('dd/MM/yyyy HH:mm');
    }
    if (whatsapp === 'iphone') {
      return momento.toFormat('dd/MM/yyyy, HH:mm:ss');
    }
    return paraIso(momento);
  }
  const data = agora.startOf('day').plus({ days: Number(dia) });
  if (hora !== undefined && minuto !== undefined) {
    return paraIso(data.set({ hour: Number(hora), minute: Number(minuto) }));
  }
  if (formato === 'dd/mm') {
    return data.toFormat('dd/MM');
  }
  if (formato === 'dd/mm/aaaa') {
    return data.toFormat('dd/MM/yyyy');
  }
  if (formato === 'ofx') {
    return data.toFormat('yyyyMMdd');
  }
  return data.toFormat('yyyy-MM-dd');
}

/** Seção 10 e AD2: troca os modelos de um texto; um modelo desconhecido é erro. */
export function resolverModelos(texto: string, agora: DateTime): string {
  const resolvido = texto.replace(MODELO, (...achado: unknown[]) =>
    resolverUm(agora, achado.slice(1, 9) as Array<string | undefined>),
  );
  if (QUALQUER_MODELO.test(resolvido)) {
    throw new Error(`modelo desconhecido em: ${texto}`);
  }
  return resolvido;
}

/** Troca os modelos em todos os textos de um valor lido de JSON. */
export function resolverObjeto(valor: unknown, agora: DateTime): unknown {
  if (typeof valor === 'string') {
    return resolverModelos(valor, agora);
  }
  if (Array.isArray(valor)) {
    return valor.map((item) => resolverObjeto(item, agora));
  }
  if (valor !== null && typeof valor === 'object') {
    return Object.fromEntries(
      Object.entries(valor).map(([chave, item]) => [chave, resolverObjeto(item, agora)]),
    );
  }
  return valor;
}
