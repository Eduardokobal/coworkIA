import { DateTime } from 'luxon';
import { normalizar, primeiroTermo } from './normalizar.js';

export interface DataNoTexto {
  dia: number;
  mes: number;
  ano: number | null;
  /** Posição da data no texto em que foi achada. */
  indice: number;
}

/** DT1: d/m, dd/mm, com ano opcional de 2 ou 4 dígitos, sem dígito nem barra colados. */
const DATA_NUMERICA = /(?<![\d/])(\d{1,2})\/(\d{1,2})(?:\/(\d{4}|\d{2}))?(?![\d/])/g;

const PALAVRAS_DE_DATA = [
  'hoje',
  'amanhã',
  'segunda',
  'segunda-feira',
  'terça',
  'terça-feira',
  'quarta',
  'quarta-feira',
  'quinta',
  'quinta-feira',
  'sexta',
  'sexta-feira',
  'sábado',
  'domingo',
] as const;

function lerAno(bruto: string | undefined): number | null {
  if (bruto === undefined) {
    return null;
  }
  return bruto.length === 2 ? 2000 + Number(bruto) : Number(bruto);
}

function existe(dia: number, mes: number, ano: number): boolean {
  // A zona UTC é fixa, para nenhuma conta ler o fuso da máquina.
  return DateTime.fromObject({ year: ano, month: mes, day: dia }, { zone: 'UTC' }).isValid;
}

export function datasNumericas(texto: string): DataNoTexto[] {
  const achadas: DataNoTexto[] = [];
  for (const achado of texto.matchAll(DATA_NUMERICA)) {
    const dia = Number(achado[1]);
    const mes = Number(achado[2]);
    const ano = lerAno(achado[3]);
    // Sem ano, 2000 (bissexto) deixa o 29/02 passar; o DT2 escolhe o ano depois.
    if (existe(dia, mes, ano ?? 2000)) {
      achadas.push({ dia, mes, ano, indice: achado.index ?? 0 });
    }
  }
  return achadas;
}

/** DT2: sem ano, a primeira ocorrência na data de referência ou depois dela. */
export function resolverData(data: DataNoTexto, referencia: DateTime): DateTime | null {
  const zona = referencia.zone;
  if (data.ano !== null) {
    const exata = DateTime.fromObject(
      { year: data.ano, month: data.mes, day: data.dia },
      { zone: zona },
    );
    return exata.isValid ? exata : null;
  }
  const inicioDaReferencia = referencia.startOf('day');
  for (let ano = inicioDaReferencia.year; ano <= inicioDaReferencia.year + 8; ano += 1) {
    const candidata = DateTime.fromObject(
      { year: ano, month: data.mes, day: data.dia },
      { zone: zona },
    );
    if (candidata.isValid && candidata.toMillis() >= inicioDaReferencia.toMillis()) {
      return candidata;
    }
  }
  return null;
}

/** DT3: data numérica, "hoje", "amanhã" ou um dia da semana. */
export function temDataExplicita(texto: string): boolean {
  const normalizado = normalizar(texto);
  return (
    datasNumericas(normalizado).length > 0 || primeiroTermo(normalizado, PALAVRAS_DE_DATA) !== null
  );
}
