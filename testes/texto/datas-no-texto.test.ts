import { describe, expect, it } from 'vitest';
import {
  type DataNoTexto,
  datasNumericas,
  resolverData,
  temDataExplicita,
} from '../../src/texto/datas-no-texto.js';
import { lerDataHora } from '../../src/tempo.js';

const SP = 'America/Sao_Paulo';

function primeira(texto: string): DataNoTexto {
  const [data] = datasNumericas(texto);
  if (data === undefined) {
    throw new Error(`nenhuma data em: ${texto}`);
  }
  return data;
}

describe('datasNumericas (DT1)', () => {
  it('aceita d/m e dd/mm, com ano de 2 ou de 4 dígitos', () => {
    const achadas = datasNumericas('até 5/11, 05/11/26 e 5/11/2027');
    expect(achadas.map(({ dia, mes, ano }) => [dia, mes, ano])).toEqual([
      [5, 11, null],
      [5, 11, 2026],
      [5, 11, 2027],
    ]);
  });

  it('recusa data que não existe no calendário', () => {
    expect(datasNumericas('31/02, 00/05 e 15/13')).toEqual([]);
  });

  it('recusa número colado com dígito ou barra', () => {
    expect(datasNumericas('1/2/3/4 e 123/45')).toEqual([]);
  });

  it('aceita 29/02 sem ano', () => {
    expect(datasNumericas('29/02')).toHaveLength(1);
  });
});

describe('resolverData (DT2)', () => {
  it('sem ano, vale a primeira ocorrência na data de referência ou depois dela', () => {
    expect(resolverData(primeira('02/01'), lerDataHora('2026-12-30T10:00', SP))?.toISODate()).toBe(
      '2027-01-02',
    );
  });

  it('a própria data de referência conta', () => {
    expect(resolverData(primeira('05/11'), lerDataHora('2026-11-05T22:00', SP))?.toISODate()).toBe(
      '2026-11-05',
    );
  });

  it('29/02 sem ano vai para o próximo ano bissexto', () => {
    expect(resolverData(primeira('29/02'), lerDataHora('2026-11-04T10:00', SP))?.toISODate()).toBe(
      '2028-02-29',
    );
  });

  it('com ano, vale o ano escrito, mesmo no passado', () => {
    expect(resolverData(primeira('05/11/25'), lerDataHora('2026-11-04T10:00', SP))?.toISODate()).toBe(
      '2025-11-05',
    );
  });
});

describe('temDataExplicita (DT3)', () => {
  it('reconhece data numérica, hoje, amanhã e dia da semana', () => {
    expect(temDataExplicita('até 10/11')).toBe(true);
    expect(temDataExplicita('amanhã cedo')).toBe(true);
    expect(temDataExplicita('na sexta-feira')).toBe(true);
    expect(temDataExplicita('Quinta')).toBe(true);
    expect(temDataExplicita('Sábado')).toBe(true);
  });

  it('não vê data onde não há', () => {
    expect(temDataExplicita('Envio em breve.')).toBe(false);
  });
});
