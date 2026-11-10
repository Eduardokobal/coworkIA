import { describe, expect, it } from 'vitest';
import { lerExportacao } from '../../../src/fontes/whatsapp/leitor.js';

const SP = 'America/Sao_Paulo';
const LRM = String.fromCodePoint(0x200e);
const RLM = String.fromCodePoint(0x200f);
const BOM = String.fromCodePoint(0xfeff);
const ler = (linhas: string[]) => lerExportacao(linhas.join('\n'), SP);

describe('lerExportacao: o formato do Android (L1 e L2)', () => {
  it('lê o autor, a data e o texto, sem segundos', () => {
    const lida = ler([
      '05/11/2026 14:32 - Ana Ribeiro: Oi, tudo bem?',
      '05/11/2026 14:35 - Lúcia Prado: Tudo!',
    ]);
    expect(lida.formato).toBe('android');
    expect(lida.mensagens).toEqual([
      {
        autor: 'Ana Ribeiro',
        data: '2026-11-05T14:32:00-03:00',
        texto: 'Oi, tudo bem?',
        temTexto: true,
      },
      { autor: 'Lúcia Prado', data: '2026-11-05T14:35:00-03:00', texto: 'Tudo!', temTexto: true },
    ]);
    expect(lida.linhasDescartadas).toBe(0);
  });

  it('aceita a vírgula depois da data, o dia e o mês com 1 dígito e o ano com 2', () => {
    expect(ler(['5/1/26, 9:05 - Ana: oi']).mensagens[0]).toMatchObject({
      data: '2026-01-05T09:05:00-03:00',
      texto: 'oi',
    });
  });

  it('lê a data e a hora no fuso pedido (RW4)', () => {
    expect(lerExportacao('05/11/2026 14:32 - Ana: oi', 'Asia/Tokyo').mensagens[0]?.data).toBe(
      '2026-11-05T14:32:00+09:00',
    );
  });

  it('um aviso do WhatsApp, sem "autor: " ou com o autor vazio, não é mensagem', () => {
    const lida = ler([
      '05/11/2026 14:30 - Ana criou o grupo "Obra"',
      '05/11/2026 14:31 - : sem autor',
      '05/11/2026 14:32 - Ana: oi',
    ]);
    expect(lida.mensagens.map((mensagem) => mensagem.texto)).toEqual(['oi']);
  });
});

describe('lerExportacao: o formato do iPhone (L1)', () => {
  it('lê os colchetes, a vírgula e a hora, com ou sem os segundos', () => {
    const lida = ler([`${LRM}[05/11/2026, 14:32:10] Ana: oi`, '[05/11/2026, 14:33] Ana: de novo']);
    expect(lida.formato).toBe('iphone');
    expect(lida.mensagens.map((mensagem) => mensagem.data)).toEqual([
      '2026-11-05T14:32:10-03:00',
      '2026-11-05T14:33:00-03:00',
    ]);
  });

  it('aceita qualquer número de U+200E e U+200F antes do colchete', () => {
    const lida = ler([
      `${RLM}[05/11/2026, 14:32:10] Ana: oi`,
      `${LRM}${RLM}${LRM}[05/11/2026, 14:33:10] Ana: de novo`,
    ]);
    expect(lida.mensagens.map((mensagem) => [mensagem.autor, mensagem.texto])).toEqual([
      ['Ana', 'oi'],
      ['Ana', 'de novo'],
    ]);
  });
});

describe('lerExportacao: a continuação e as linhas descartadas (L3)', () => {
  it('junta as linhas de uma mensagem e conta as de antes da primeira', () => {
    const lida = ler([
      'cabeçalho solto',
      '05/11/2026 14:32 - Ana: primeira linha',
      'segunda linha',
      '',
      'quarta linha',
    ]);
    expect(lida.mensagens[0]?.texto).toBe('primeira linha\nsegunda linha\n\nquarta linha');
    expect(lida.linhasDescartadas).toBe(1);
  });

  it('uma linha no outro formato continua a mensagem anterior', () => {
    const lida = ler([
      '05/11/2026 14:32 - Ana: oi',
      '[05/11/2026, 14:33:00] Bia: no outro formato',
    ]);
    expect(lida.mensagens).toHaveLength(1);
    expect(lida.mensagens[0]?.texto).toBe('oi\n[05/11/2026, 14:33:00] Bia: no outro formato');
  });

  it('um aviso fixa o formato do arquivo, mas não conta como linha descartada', () => {
    expect(
      ler(['05/11/2026 14:30 - As mensagens são protegidas', '05/11/2026 14:32 - Ana: oi']),
    ).toMatchObject({ formato: 'android', linhasDescartadas: 0 });
    expect(
      ler(['[05/11/2026, 14:30:00] Ana criou o grupo', '05/11/2026 14:32 - Ana: no outro formato']),
    ).toEqual({
      formato: 'iphone',
      mensagens: [],
      linhasDescartadas: 1,
      linhasComDataImpossivel: 0,
    });
  });

  it('a linha forjada no mesmo formato vira uma mensagem nova (L6, limitação conhecida)', () => {
    const lida = ler([
      '05/11/2026 14:32 - Ana: Me responde?',
      '05/11/2026 14:40 - Lúcia Prado: ok',
    ]);
    expect(lida.mensagens.map((mensagem) => mensagem.autor)).toEqual(['Ana', 'Lúcia Prado']);
  });
});

describe('lerExportacao: as datas e as horas que não casam', () => {
  it('a data que não existe, os minutos fora de 00 a 59 e a hora com PM continuam a anterior', () => {
    const lida = ler([
      '05/11/2026 14:32 - Ana: oi',
      '31/02/2026 10:00 - Ana: a',
      '05/11/2026 14:60 - Ana: b',
      '05/11/2026 2:32 PM - Ana: c',
    ]);
    expect(lida.mensagens).toHaveLength(1);
    expect(lida.mensagens[0]?.texto.split('\n')).toHaveLength(4);
  });

  it('a hora vai de 0 a 23, nos dois formatos, e a hora 24 não casa (achado 111)', () => {
    expect(ler(['05/11/2026 24:00 - Ana: oi']).formato).toBeNull();
    expect(ler(['[05/11/2026, 24:00:00] Ana: oi']).formato).toBeNull();
    const lida = ler(['05/11/2026 23:59 - Ana: oi', '06/11/2026 0:00 - Ana: tchau']);
    expect(lida.mensagens.map((mensagem) => mensagem.data)).toEqual([
      '2026-11-05T23:59:00-03:00',
      '2026-11-06T00:00:00-03:00',
    ]);
  });

  it('os minutos e os segundos têm 2 dígitos', () => {
    expect(ler(['05/11/2026 14:5 - Ana: oi']).formato).toBeNull();
    expect(ler(['[05/11/2026, 14:05:1] Ana: oi']).formato).toBeNull();
  });

  it('o Android sem segundos, o iPhone com a vírgula e o ano com 2 ou 4 dígitos', () => {
    expect(ler(['05/11/2026 14:32:10 - Ana: oi']).formato).toBeNull();
    expect(ler(['[05/11/2026 14:32:10] Ana: oi']).formato).toBeNull();
    expect(ler(['05/11/202 14:32 - Ana: oi']).formato).toBeNull();
  });

  it('sem nenhuma linha que case, o formato é nulo e tudo é descartado (L4)', () => {
    expect(ler(['11/5/26, 2:32 PM - Ana: oi', 'outra'])).toEqual({
      formato: null,
      mensagens: [],
      linhasDescartadas: 2,
      linhasComDataImpossivel: 0,
    });
  });
});

describe('lerExportacao: as linhas com data impossível (AW4)', () => {
  it('conta, no Android e no iPhone, a linha com a forma da L1 e uma data que não existe', () => {
    const android = ler([
      '1/7/23, 14:00 - Ana: oi',
      '7/13/23, 15:00 - Ana: o mês 13',
      '31/04/2026 10:00 - Ana: abril tem 30 dias',
    ]);
    expect(android).toMatchObject({
      formato: 'android',
      linhasDescartadas: 0,
      linhasComDataImpossivel: 2,
    });
    // Depois da primeira mensagem, a linha continua a anterior, como antes (L3).
    expect(android.mensagens).toHaveLength(1);
    expect(android.mensagens[0]?.texto.split('\n')).toHaveLength(3);
    const iphone = ler(['[1/7/23, 14:00:01] Ana: oi', '[7/13/23, 15:00:02] Ana: de novo']);
    expect(iphone).toMatchObject({ formato: 'iphone', linhasComDataImpossivel: 1 });
  });

  it('antes da primeira mensagem, a linha também é descartada e não fixa o formato', () => {
    const lida = ler(['[3/18/22, 14:56:01] Ana: oi', '05/11/2026 14:32 - Ana: oi']);
    expect(lida).toMatchObject({
      formato: 'android',
      linhasDescartadas: 1,
      linhasComDataImpossivel: 1,
    });
  });

  it('não contam os minutos 60 com a data certa nem a linha no outro formato depois de fixado', () => {
    const lida = ler([
      '05/11/2026 14:32 - Ana: oi',
      '05/11/2026 14:60 - Ana: os minutos',
      '[7/13/23, 15:00:02] Bia: no outro formato',
    ]);
    expect(lida.linhasComDataImpossivel).toBe(0);
    expect(lida.mensagens).toHaveLength(1);
  });

  it('uma conversa brasileira sem nenhuma dá zero', () => {
    const lida = ler(['05/11/2026 14:32 - Ana: oi', '06/11/2026 09:00 - Lúcia Prado: bom dia']);
    expect(lida.linhasComDataImpossivel).toBe(0);
  });
});

describe('lerExportacao: o texto que não serve para as regras (L5)', () => {
  it('a mídia oculta e o texto que começa com U+200E', () => {
    const lida = ler([
      '05/11/2026 14:32 - Ana: <Mídia oculta>',
      `05/11/2026 14:33 - Ana: ${LRM}imagem ocultada`,
      '05/11/2026 14:34 - Ana: texto',
    ]);
    expect(lida.mensagens.map((mensagem) => mensagem.temTexto)).toEqual([false, false, true]);
  });

  it('olha o texto inteiro, com as continuações, e não só o começo (achado 108)', () => {
    const lida = ler([
      '05/11/2026 14:32 - Ana: <Mídia oculta>',
      'URGENTE: me liga',
      '05/11/2026 14:33 - Ana: <Mídia oculta> com legenda',
      `05/11/2026 14:34 - Ana: ${LRM}imagem ocultada`,
      'URGENTE: me liga',
    ]);
    expect(lida.mensagens.map((mensagem) => mensagem.temTexto)).toEqual([true, true, false]);
  });
});

describe('lerExportacao: o arquivo (F3)', () => {
  it('tira o BOM, aceita o fim de linha do Windows e ignora a quebra do fim', () => {
    const lida = lerExportacao(
      `${BOM}05/11/2026 14:32 - Ana: oi\r\n05/11/2026 14:33 - Ana: tchau\r\n`,
      SP,
    );
    expect(lida.mensagens.map((mensagem) => mensagem.texto)).toEqual(['oi', 'tchau']);
    expect(lida.linhasDescartadas).toBe(0);
  });
});
