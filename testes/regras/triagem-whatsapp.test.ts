import { describe, expect, it } from 'vitest';
import type { Conversa, MensagemWhatsapp } from '../../src/dominio.js';
import {
  blocoEsperando,
  type ContextoWhatsapp,
  citaUsuario,
  classificarConversa,
  ehDoUsuario,
  ehGrupo,
  triarConversas,
} from '../../src/regras/triagem-whatsapp.js';
import { lerDataHora } from '../../src/tempo.js';

const SP = 'America/Sao_Paulo';
const EU = ['Lúcia Prado', 'Lúcia'];
const agora = lerDataHora('2026-11-05T10:00', SP);
const desde = agora.minus({ hours: 24 });
const CONTEXTO: ContextoWhatsapp = { agora, fuso: SP, eu: EU, importantes: [] };
const LRM = String.fromCodePoint(0x200e);

function msg(autor: string, hora: string, texto: string, temTexto = true): MensagemWhatsapp {
  return { autor, data: `2026-11-05T${hora}:00-03:00`, texto, temTexto };
}

/** Uma mensagem de ontem, ainda dentro da janela de 24 horas. */
function ontem(autor: string, hora: string, texto: string): MensagemWhatsapp {
  return { autor, data: `2026-11-04T${hora}:00-03:00`, texto, temTexto: true };
}

function conversa(mensagens: MensagemWhatsapp[], id = 'c1'): Conversa {
  return {
    id,
    nome: id,
    formato: 'android',
    mensagens,
    linhasDescartadas: 0,
    linhasComDataImpossivel: 0,
  };
}

const classificar = (mensagens: MensagemWhatsapp[], contexto = CONTEXTO) =>
  classificarConversa(conversa(mensagens), contexto, desde);

describe('o usuário e os grupos (V1, V3 e V4)', () => {
  it('V1: o autor é do usuário sem diferença de maiúscula, de acento nem de espaço nas pontas', () => {
    expect(ehDoUsuario('  LUCIA prado ', EU)).toBe(true);
    expect(ehDoUsuario('Ana', EU)).toBe(false);
  });

  it('V3: é grupo com mais de um autor além do usuário, e o contato que muda de nome conta como dois', () => {
    expect(ehGrupo(conversa([msg('Ana', '09:00', 'a'), msg('Lúcia', '09:01', 'b')]), EU)).toBe(
      false,
    );
    expect(ehGrupo(conversa([msg('Ana', '09:00', 'a'), msg('Bia', '09:01', 'b')]), EU)).toBe(true);
    expect(ehGrupo(conversa([msg('Ana', '09:00', 'a'), msg('Ana R.', '09:01', 'b')]), EU)).toBe(
      true,
    );
  });

  it('V4: a citação é o nome como termo, com ou sem o @, e "Luciana" não cita a Lúcia', () => {
    expect(citaUsuario('@Lúcia pode ver?', EU)).toBe(true);
    expect(citaUsuario('falei com a lucia prado', EU)).toBe(true);
    expect(citaUsuario('a Luciana vem?', EU)).toBe(false);
  });
});

describe('o bloco que espera o usuário (seção 8)', () => {
  it('são as recebidas depois da última do usuário, a partir de desde', () => {
    const mensagens = [
      msg('Ana', '08:00', 'antes'),
      msg('Lúcia Prado', '08:30', 'respondi'),
      msg('Ana', '09:00', 'depois'),
    ];
    expect(blocoEsperando(conversa(mensagens), EU, desde, SP).map((m) => m.texto)).toEqual([
      'depois',
    ]);
    expect(blocoEsperando(conversa(mensagens), EU, agora, SP)).toEqual([]);
  });

  it('o bloco começa depois da última mensagem do usuário, e não da primeira', () => {
    const mensagens = [
      msg('Ana', '08:00', 'a'),
      msg('Lúcia', '08:10', 'b'),
      msg('Ana', '08:20', 'c'),
      msg('Lúcia Prado', '08:30', 'd'),
      msg('Ana', '09:00', 'e'),
    ];
    expect(blocoEsperando(conversa(mensagens), EU, desde, SP).map((m) => m.texto)).toEqual(['e']);
  });

  it('a conversa que o usuário já respondeu fica fora da triagem', () => {
    expect(classificar([msg('Ana', '09:00', 'Urgente?'), msg('Lúcia', '09:05', 'ok')])).toBeNull();
  });

  it('a linha forjada com o nome do usuário apaga o bloco (L6, limitação conhecida)', () => {
    expect(
      classificar([msg('Ana', '09:00', 'Pode me ligar?'), msg('Lúcia Prado', '09:01', 'ok')]),
    ).toBeNull();
  });
});

describe('as regras W1 a W5 numa conversa individual', () => {
  it('W1: termo de urgência', () => {
    expect(classificar([msg('Ana', '09:00', 'É urgente, me liga')])).toMatchObject({
      categoria: 'urgente',
      motivos: ['W1: termo "urgente"'],
      grupo: false,
    });
  });

  it('W2: prazo que vence em até 2 dias, pela data da mensagem', () => {
    expect(classificar([msg('Ana', '09:00', 'Manda até 06/11, por favor')])).toMatchObject({
      categoria: 'urgente',
      motivos: ['W2: prazo até 06/11/2026, que vence em 1 dia'],
    });
    expect(classificar([msg('Ana', '09:00', 'Manda até 09/11.')])?.categoria).toBe('informativo');
  });

  it('W2: as pontas, hoje e daqui a 2 dias, valem; ontem e daqui a 3 dias, não', () => {
    expect(classificar([msg('Ana', '09:00', 'Manda até 05/11.')])?.motivos).toEqual([
      'W2: prazo até 05/11/2026, que vence hoje',
    ]);
    expect(classificar([msg('Ana', '09:00', 'Manda até 07/11.')])?.motivos).toEqual([
      'W2: prazo até 07/11/2026, que vence em 2 dias',
    ]);
    expect(classificar([msg('Ana', '09:00', 'Manda até 08/11.')])?.categoria).toBe('informativo');
    expect(classificar([ontem('Ana', '20:00', 'O boleto vence hoje.')])?.categoria).toBe(
      'informativo',
    );
  });

  it('W2: a referência do prazo é a data da mensagem, e não a de agora', () => {
    expect(classificar([ontem('Ana', '20:00', 'O boleto vence amanhã.')])?.motivos).toEqual([
      'W2: prazo "vence amanhã" (05/11/2026), que vence hoje',
    ]);
  });

  it('W1 vem antes da W2', () => {
    expect(classificar([msg('Ana', '09:00', 'Urgente: manda até 06/11.')])?.motivos).toEqual([
      'W1: termo "urgente"',
    ]);
  });

  it('W3: contato importante que pergunta ou pede', () => {
    const contexto = { ...CONTEXTO, importantes: ['  ana '] };
    expect(classificar([msg('Ana', '09:00', 'Você vem?')], contexto)).toMatchObject({
      categoria: 'urgente',
      motivos: ['W3: contato importante e W4: pergunta direta'],
    });
    expect(classificar([msg('Ana', '09:00', 'Cheguei.')], contexto)?.categoria).toBe('informativo');
  });

  it('W4: pergunta ou pedido', () => {
    expect(classificar([msg('Ana', '09:00', 'Tudo certo para amanhã?')])).toMatchObject({
      categoria: 'pede_resposta',
      motivos: ['W4: pergunta direta'],
    });
    expect(classificar([msg('Ana', '09:00', 'Me avisa quando sair')])?.motivos).toEqual([
      'W4: pedido "me avisa"',
    ]);
  });

  it('W4: o "?" de um endereço web não é pergunta, porque a N3 tira o endereço', () => {
    expect(
      classificar([msg('Ana', '09:00', 'Veja https://exemplo.org/relatorio?id=1')])?.motivos,
    ).toEqual(['W5: nenhuma outra regra casou']);
  });

  it('W5: o resto', () => {
    expect(classificar([msg('Ana', '09:00', 'Bom dia!')])).toMatchObject({
      categoria: 'informativo',
      motivos: ['W5: nenhuma outra regra casou'],
    });
  });
});

describe('os grupos e as mensagens sem texto', () => {
  it('um grupo sem citação fica informativo, mesmo com "urgente"', () => {
    expect(
      classificar([msg('Ana', '09:00', 'Urgente: reunião'), msg('Bia', '09:01', 'Alguém vem?')]),
    ).toMatchObject({
      categoria: 'informativo',
      motivos: ['W5: grupo sem citação a você'],
      grupo: true,
    });
  });

  it('num grupo, só a mensagem que cita o usuário conta', () => {
    expect(
      classificar([
        msg('Ana', '09:00', 'Urgente: reunião'),
        msg('Bia', '09:01', '@Lúcia pode ir?'),
      ]),
    ).toMatchObject({ categoria: 'pede_resposta', motivos: ['W4: pergunta direta'] });
  });

  it('num grupo, a W3 olha só o autor das mensagens que citam o usuário', () => {
    const contexto = { ...CONTEXTO, importantes: ['Ana'] };
    expect(
      classificar(
        [msg('Ana', '09:00', 'Alguém viu o relatório?'), msg('Bia', '09:01', '@Lúcia pode olhar?')],
        contexto,
      ),
    ).toMatchObject({ categoria: 'pede_resposta', motivos: ['W4: pergunta direta'] });
  });

  it('num grupo, a mensagem sem texto (L5) não conta como citação', () => {
    expect(
      classificar([msg('Ana', '09:00', 'oi'), msg('Bia', '09:01', `${LRM}Lúcia, urgente`, false)]),
    ).toMatchObject({ categoria: 'informativo', motivos: ['W5: grupo sem citação a você'] });
  });

  it('a mídia e o aviso (L5) não entram nas regras nem no trecho', () => {
    const resultado = classificar([
      msg('Ana', '09:00', 'Você viu?'),
      msg('Ana', '09:01', '<Mídia oculta>', false),
    ]);
    expect(resultado?.categoria).toBe('pede_resposta');
    expect(resultado?.trecho?.texto).toBe('Você viu?');
    expect(resultado?.bloco).toHaveLength(2);
    const soMidia = classificar([msg('Ana', '09:00', 'urgente', false)]);
    expect(soMidia).toMatchObject({ categoria: 'informativo', trecho: null });
  });
});

describe('triarConversas (7.10)', () => {
  it('agrupa as conversas com bloco pela categoria', () => {
    const grupos = triarConversas(
      [
        conversa([msg('Ana', '09:00', 'urgente')], 'a'),
        conversa([msg('Bia', '09:00', 'Vem?')], 'b'),
        conversa([msg('Caio', '09:00', 'oi'), msg('Lúcia', '09:10', 'oi')], 'c'),
      ],
      CONTEXTO,
      desde,
    );
    expect(grupos.urgente.map((item) => item.conversa.id)).toEqual(['a']);
    expect(grupos.pede_resposta.map((item) => item.conversa.id)).toEqual(['b']);
    expect(grupos.informativo).toEqual([]);
  });
});
