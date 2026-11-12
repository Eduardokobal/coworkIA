import type { DateTime } from 'luxon';
import { describe, expect, it } from 'vitest';
import type { Email } from '../../src/dominio.js';
import {
  type ContextoTriagem,
  classificar,
  type Prazo,
  primeiroPrazoProximo,
  quandoVence,
} from '../../src/regras/triagem.js';
import { diasDeCalendario, lerDataHora } from '../../src/tempo.js';
import { datasNumericas, resolverData } from '../../src/texto/datas-no-texto.js';
import { contemTermo, normalizar } from '../../src/texto/normalizar.js';

const SP = 'America/Sao_Paulo';
const TAB = String.fromCodePoint(0x9);
const CR = String.fromCodePoint(0xd);
const NBSP = String.fromCodePoint(0xa0);
const EM_SPACE = String.fromCodePoint(0x2003);
const SEPARADOR_DE_LINHA = String.fromCodePoint(0x2028);
const ESPACO_IDEOGRAFICO = String.fromCodePoint(0x3000);
const LARGURA_ZERO = String.fromCodePoint(0x200b);
const LETRA_FORA_DO_BASICO = String.fromCodePoint(0x1d41a);
const DIGITO_FORA_DO_BASICO = String.fromCodePoint(0x1d7ce);
const EMOJI = String.fromCodePoint(0x1f600);

// A forma de antes do adendo (AD24), copiada da main 5b0ed03, só para a comparação.
const ATE_ANTES_DA_DATA = /(?:^|[^\p{L}\p{N}])ate(?:\s+o)?(?:\s+dia)?\s*$/u;
const EXPRESSOES_DE_ANTES: ReadonlyArray<{ termo: string; diasDepoisDoEmail: number }> = [
  { termo: 'vence hoje', diasDepoisDoEmail: 0 },
  { termo: 'vence amanhã', diasDepoisDoEmail: 1 },
  { termo: 'vencimento hoje', diasDepoisDoEmail: 0 },
  { termo: 'vencimento amanhã', diasDepoisDoEmail: 1 },
  { termo: 'prazo é hoje', diasDepoisDoEmail: 0 },
  { termo: 'prazo é amanhã', diasDepoisDoEmail: 1 },
  { termo: 'até o fim do dia', diasDepoisDoEmail: 0 },
  { termo: 'até o final do dia', diasDepoisDoEmail: 0 },
];

function prazosDeAntes(texto: string, dataDoEmail: DateTime): Prazo[] {
  const normalizado = normalizar(texto);
  const prazos: Prazo[] = [];
  for (const achada of datasNumericas(normalizado)) {
    if (!ATE_ANTES_DA_DATA.test(normalizado.slice(0, achada.indice))) {
      continue;
    }
    const data = resolverData(achada, dataDoEmail);
    if (data !== null) {
      prazos.push({ data, descricao: `até ${data.toFormat('dd/MM/yyyy')}` });
    }
  }
  for (const { termo, diasDepoisDoEmail } of EXPRESSOES_DE_ANTES) {
    if (contemTermo(normalizado, termo)) {
      const data = dataDoEmail.startOf('day').plus({ days: diasDepoisDoEmail });
      prazos.push({ data, descricao: `"${termo}" (${data.toFormat('dd/MM/yyyy')})` });
    }
  }
  return prazos;
}

/** O motivo de antes: o primeiro prazo, na ordem da lista, que vence de 0 a 2 dias. */
function motivoDeAntes(texto: string, referencia: DateTime, agora: DateTime): string | null {
  for (const prazo of prazosDeAntes(texto, referencia)) {
    const dias = diasDeCalendario(agora, prazo.data);
    if (dias >= 0 && dias <= 2) {
      return `${prazo.descricao}, que ${quandoVence(dias)}`;
    }
  }
  return null;
}

function motivoDeAgora(texto: string, referencia: DateTime, agora: DateTime): string | null {
  const proximo = primeiroPrazoProximo(texto, referencia, agora);
  return proximo === null ? null : `${proximo.prazo.descricao}, que ${quandoVence(proximo.dias)}`;
}

/** O motivo de antes e o de agora, com o agora e a referência em São Paulo. */
function nosDois(texto: string, agora = '2026-11-04T12:00', referencia = '2026-11-04T09:00') {
  const [quando, base] = [lerDataHora(agora, SP), lerDataHora(referencia, SP)];
  return [motivoDeAntes(texto, base, quando), motivoDeAgora(texto, base, quando)];
}

const EM_1_DIA = 'até 05/11/2026, que vence em 1 dia';

describe('o primeiro prazo próximo dá o motivo de antes (AD19 e AD24)', () => {
  it('em 20.000 textos sorteados, com semente fixa', () => {
    let semente = 987654;
    const sortear = (limite: number) => {
      semente = (semente * 1103515245 + 12345) % 2147483648;
      return semente % limite;
    };
    const fusos = ['America/Sao_Paulo', 'Asia/Tokyo', 'Pacific/Kiritimati', 'Etc/GMT+12', 'UTC'];
    const palavras = [
      'ate',
      'até',
      'ate o dia',
      'Até o',
      'bate',
      'ateo',
      'o',
      'dia',
      'dias',
      'vence hoje',
      'vence amanhã',
      'até o fim do dia',
      'prazo é amanhã',
      'x',
      '.',
      LETRA_FORA_DO_BASICO,
      `${LETRA_FORA_DO_BASICO}ate`,
      `${DIGITO_FORA_DO_BASICO}ate o dia`,
    ];
    // Os espaços do \s da AD20, o U+200B, que não é espaço, e nada.
    const separadores = [
      ' ',
      '  ',
      '\n',
      TAB,
      CR,
      NBSP,
      EM_SPACE,
      SEPARADOR_DE_LINHA,
      ESPACO_IDEOGRAFICO,
      LARGURA_ZERO,
      '',
    ];
    const diasDePonta = [
      '01-01',
      '01-02',
      '01-31',
      '02-01',
      '02-27',
      '02-28',
      '02-29',
      '03-01',
      '03-02',
      '04-30',
      '05-01',
      '11-04',
      '12-29',
      '12-30',
      '12-31',
    ];
    const sortearDe = <T>(lista: readonly T[]): T => lista[sortear(lista.length)] as T;
    const sortearAgora = (fuso: string): DateTime => {
      const ano = sortearDe([2026, 2027, 2028]);
      const hora = `T${String(sortear(24)).padStart(2, '0')}:30`;
      if (sortear(2) === 0) {
        const dia = sortearDe(diasDePonta);
        if (dia !== '02-29' || ano === 2028) {
          return lerDataHora(`${ano}-${dia}${hora}`, fuso);
        }
      }
      return lerDataHora(`${ano}-01-01${hora}`, fuso).plus({ days: sortear(366) });
    };
    const curto = (ano: number) => String(ano).slice(2);
    let comPrazo = 0;
    const diferentes: string[] = [];
    for (let caso = 0; caso < 20_000; caso += 1) {
      const fusoDoTexto = sortearDe(fusos);
      const fusoDeAgora = sortear(3) === 0 ? sortearDe(fusos) : fusoDoTexto;
      const agora = sortearAgora(fusoDeAgora);
      const referencia = lerDataHora(
        String(agora.plus({ hours: sortear(240) - 120 }).toISO()),
        fusoDoTexto,
      );
      const partes: string[] = [];
      let anterior: string | null = null;
      for (let indice = 0; indice < 1 + sortear(6); indice += 1) {
        partes.push(sortearDe(palavras));
        if (sortear(2) === 0) {
          // Às vezes, a mesma data de antes, para a data repetida com e sem o "até".
          if (anterior !== null && sortear(3) === 0) {
            partes.push(anterior);
          } else {
            const dia = agora.plus({ days: sortear(9) - 4 });
            const anos = [
              '',
              `/${dia.year}`,
              `/${curto(dia.year)}`,
              `/${dia.year + 1}`,
              `/${dia.year - 1}`,
              `/${curto(dia.year + 1)}`,
              `/${curto(dia.year - 1)}`,
            ];
            anterior = `${dia.day}/${dia.month}${sortearDe(anos)}`;
            partes.push(anterior);
          }
        }
      }
      const texto = partes.map((parte) => parte + sortearDe(separadores)).join('');
      const antes = motivoDeAntes(texto, referencia, agora);
      if (antes !== null) {
        comPrazo += 1;
      }
      if (antes !== motivoDeAgora(texto, referencia, agora)) {
        diferentes.push(JSON.stringify(texto));
      }
    }
    expect(diferentes).toEqual([]);
    expect(comPrazo).toBe(3359);
  }, 60_000);
});

describe('o "até" na ponta (AD20)', () => {
  it('no começo do texto, depois de uma pontuação e com "o dia", "dia" ou "o"', () => {
    for (const texto of [
      'até 05/11',
      'Entrega:até 05/11',
      'até o dia 05/11',
      'até dia 05/11',
      'até o 05/11',
      'até\n\n\n05/11',
    ]) {
      expect(nosDois(texto), texto).toEqual([EM_1_DIA, EM_1_DIA]);
    }
  });

  it('os espaços do \\s contam, e o U+200B não', () => {
    for (const espaco of [TAB, CR, NBSP, EM_SPACE, SEPARADOR_DE_LINHA, ESPACO_IDEOGRAFICO]) {
      expect(nosDois(`até${espaco}05/11`), espaco).toEqual([EM_1_DIA, EM_1_DIA]);
      expect(nosDois(`até o${espaco}dia 05/11`), espaco).toEqual([EM_1_DIA, EM_1_DIA]);
    }
    expect(nosDois(`até${LARGURA_ZERO}05/11`)).toEqual([null, null]);
  });

  it('"bate", "ateo" e uma letra ou um dígito de fora do plano básico colados no "ate" não são prazo', () => {
    for (const texto of [
      'bate 05/11',
      'ateo 05/11',
      `${LETRA_FORA_DO_BASICO}ate 05/11`,
      `${DIGITO_FORA_DO_BASICO}ate 05/11`,
    ]) {
      expect(nosDois(texto), texto).toEqual([null, null]);
    }
    expect(nosDois(`${EMOJI}ate 05/11`)).toEqual([EM_1_DIA, EM_1_DIA]);
  });
});

describe('a virada e a data repetida (AD21)', () => {
  it('na virada do ano, com o agora e a data do e-mail em 31/12/2026', () => {
    const virada = (texto: string) => nosDois(texto, '2026-12-31T12:00', '2026-12-31T09:00');
    const emDoisDias = 'até 02/01/2027, que vence em 2 dias';
    for (const texto of ['até 2/1', 'até 2/1/27', 'até 2/1/2027']) {
      expect(virada(texto), texto).toEqual([emDoisDias, emDoisDias]);
    }
    expect(virada('até 2/1/2026')).toEqual([null, null]);
    // O mesmo dia e mês com outro ano, ou sem ele, é outra data, e não fica de fora por ela.
    expect(virada('até 2/1/2026 ou até 2/1')).toEqual([emDoisDias, emDoisDias]);
  });

  it('em fevereiro, num ano bissexto e num comum', () => {
    expect(nosDois('até 1/3', '2028-02-28T12:00', '2028-02-28T09:00')).toEqual([
      'até 01/03/2028, que vence em 2 dias',
      'até 01/03/2028, que vence em 2 dias',
    ]);
    expect(nosDois('até 2/3', '2027-02-28T12:00', '2027-02-28T09:00')).toEqual([
      'até 02/03/2027, que vence em 2 dias',
      'até 02/03/2027, que vence em 2 dias',
    ]);
  });

  it('a mesma data primeiro sem o "até" e depois com ele, e com o "até" duas vezes', () => {
    expect(nosDois('Vence 05/11. Entregue até 05/11.')).toEqual([EM_1_DIA, EM_1_DIA]);
    expect(nosDois('Até 05/11, repito: até 05/11.')).toEqual([EM_1_DIA, EM_1_DIA]);
  });
});

describe('o tempo (AD22)', () => {
  const contexto: ContextoTriagem = {
    agora: lerDataHora('2026-11-04T10:30', SP),
    fuso: SP,
    enderecoUsuario: 'lucia@example.com',
    importantes: [],
  };
  const comCorpo = (corpo: string): Email => ({
    id: 'tempo',
    de: { nome: '', endereco: 'ana@example.com' },
    para: [{ nome: '', endereco: 'lucia@example.com' }],
    cc: [],
    assunto: 'Ata',
    data: '2026-11-04T09:00:00-03:00',
    corpoTexto: corpo,
    corpoHtml: null,
    cabecalhos: {},
    lido: false,
    temAnexo: false,
  });

  /** A primeira classificação é o aquecimento; a medida é a da segunda. */
  function medir(corpo: string) {
    classificar(comCorpo(corpo), contexto);
    const inicio = performance.now();
    const resultado = classificar(comCorpo(corpo), contexto);
    return { resultado, tempo: performance.now() - inicio };
  }
  const T6 = { categoria: 'informativo', motivos: ['T6: nenhuma outra regra casou'] };

  it.each([
    { repeticoes: 1562, caracteres: 12_496 },
    { repeticoes: 3125, caracteres: 25_000 },
    { repeticoes: 6250, caracteres: 50_000 },
    { repeticoes: 12_500, caracteres: 100_000 },
  ])(
    'com "ate 1/1 " repetido em $caracteres caracteres, a classificação leva menos de 500 ms',
    ({ repeticoes, caracteres }) => {
      const corpo = 'ate 1/1 '.repeat(repeticoes);
      expect(corpo).toHaveLength(caracteres);
      const { resultado, tempo } = medir(corpo);
      expect(resultado).toEqual(T6);
      expect(tempo).toBeLessThan(500);
    },
    30_000,
  );

  it('com uma data perto de hoje que não vence, "ate 2/11 " repetido em 99.999 caracteres, também (AD21)', () => {
    // Em 04/11, o 2/11 está na janela, mas a DT2 o leva a 02/11/2027: só a lembrança evita a conta repetida.
    const corpo = 'ate 2/11 '.repeat(11_111);
    expect(corpo).toHaveLength(99_999);
    const { resultado, tempo } = medir(corpo);
    expect(resultado).toEqual(T6);
    expect(tempo).toBeLessThan(500);
  }, 30_000);
});
