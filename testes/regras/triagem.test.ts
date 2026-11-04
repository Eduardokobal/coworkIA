import { describe, expect, it } from 'vitest';
import type { Email } from '../../src/dominio.js';
import { agrupar, type ContextoTriagem, classificar } from '../../src/regras/triagem.js';
import { relogioFixo } from '../../src/tempo.js';

const SP = 'America/Sao_Paulo';
const VOCE = { nome: 'Você', endereco: 'voce@example.com' };
const OUTRA = { nome: 'Bia', endereco: 'bia@example.com' };

function contexto(agora = '2026-11-04T10:00', importantes: string[] = []): ContextoTriagem {
  return { agora: relogioFixo(agora, SP)(), fuso: SP, enderecoUsuario: VOCE.endereco, importantes };
}

function email(parcial: Partial<Email>): Email {
  return {
    id: 'e1',
    de: { nome: 'Ana', endereco: 'ana@example.com' },
    para: [VOCE],
    cc: [],
    assunto: 'Assunto',
    data: '2026-11-04T09:00',
    corpoTexto: 'Texto sem nada.',
    corpoHtml: null,
    cabecalhos: {},
    lido: false,
    temAnexo: false,
    ...parcial,
  };
}

const triar = (parcial: Partial<Email>, ctx = contexto()) => classificar(email(parcial), ctx);

describe('T1, propaganda', () => {
  it('vem antes da urgência: "URGENTE" de uma lista é propaganda', () => {
    const resultado = triar({
      assunto: 'URGENTE: última chance',
      cabecalhos: { 'list-unsubscribe': '<mailto:sair@example.org>' },
    });
    expect(resultado).toEqual({
      categoria: 'propaganda',
      motivos: ['T1: cabeçalho List-Unsubscribe'],
    });
  });

  it.each([
    ['Bulk', 'bulk'],
    ['list', 'list'],
    [' JUNK ', 'junk'],
  ])('reconhece o Precedence %s', (valor, esperado) => {
    expect(triar({ cabecalhos: { precedence: valor } }).motivos).toEqual([
      `T1: Precedence ${esperado}`,
    ]);
  });
});

describe('T2, urgência no assunto', () => {
  it('casa o termo inteiro, com ou sem acento', () => {
    expect(triar({ assunto: 'URGENTE: contrato' }).motivos).toEqual([
      'T2: termo "urgente" no assunto',
    ]);
    expect(triar({ assunto: 'Urgência na entrega' }).categoria).toBe('urgente');
  });

  it('não casa parte de palavra', () => {
    expect(triar({ assunto: 'Responder urgentemente' }).categoria).toBe('informativo');
  });

  it('só olha o assunto: o termo no corpo não aciona a T2', () => {
    expect(triar({ corpoTexto: 'Isso é urgente.' }).categoria).toBe('informativo');
  });
});

describe('T3, prazo', () => {
  it('é urgente com prazo em até 2 dias', () => {
    expect(triar({ corpoTexto: 'Preciso do relatório até 06/11.' }).motivos).toEqual([
      'T3: prazo até 06/11/2026, que vence em 2 dias',
    ]);
    expect(triar({ corpoTexto: 'Entregue até o dia 5/11.' }).motivos).toEqual([
      'T3: prazo até 05/11/2026, que vence em 1 dia',
    ]);
  });

  it('não é urgente com prazo em 3 dias', () => {
    expect(triar({ corpoTexto: 'Envie até 07/11.' }).categoria).toBe('informativo');
  });

  it('não é urgente com prazo vencido', () => {
    expect(triar({ corpoTexto: 'O prazo era até 03/11/2026.' }).categoria).toBe('informativo');
    expect(triar({ data: '2026-11-02T09:00', corpoTexto: 'O boleto vence hoje.' }).categoria).toBe(
      'informativo',
    );
  });

  it('uma data sem "até" antes não é prazo', () => {
    expect(triar({ corpoTexto: 'Reunião em 05/11.' }).categoria).toBe('informativo');
  });

  it.each([
    ['vence hoje', '04/11/2026', 'vence hoje'],
    ['vence amanhã', '05/11/2026', 'vence em 1 dia'],
    ['vencimento hoje', '04/11/2026', 'vence hoje'],
    ['vencimento amanhã', '05/11/2026', 'vence em 1 dia'],
    ['prazo é hoje', '04/11/2026', 'vence hoje'],
    ['prazo é amanhã', '05/11/2026', 'vence em 1 dia'],
    ['até o fim do dia', '04/11/2026', 'vence hoje'],
    ['até o final do dia', '04/11/2026', 'vence hoje'],
  ])('reconhece a expressão fixa "%s" num e-mail de 04/11', (termo, data, quando) => {
    expect(triar({ corpoTexto: `Atenção: ${termo}.` }).motivos).toEqual([
      `T3: prazo "${termo}" (${data}), que ${quando}`,
    ]);
  });

  it('conta "hoje" e "amanhã" a partir da data do e-mail', () => {
    expect(triar({ corpoTexto: 'O boleto vence amanhã.' }).motivos).toEqual([
      'T3: prazo "vence amanhã" (05/11/2026), que vence em 1 dia',
    ]);
  });

  it('não trata "até hoje" sozinho como prazo', () => {
    expect(triar({ corpoTexto: 'Até hoje não recebi o boleto.' }).categoria).toBe('informativo');
  });

  it('ignora o prazo que só aparece na citação do texto puro', () => {
    const corpoTexto =
      'Ok, obrigado.\n\nEm ter., 3 de nov. de 2026 às 09:00, Ana <ana@example.com> escreveu:\n> Preciso disso até 05/11.';
    expect(triar({ corpoTexto }).categoria).toBe('informativo');
  });

  it('ignora o prazo que só aparece no blockquote do HTML', () => {
    expect(
      triar({
        corpoTexto: null,
        corpoHtml: '<p>Ok, obrigado.</p><blockquote>Preciso disso até 05/11.</blockquote>',
      }).categoria,
    ).toBe('informativo');
    expect(
      triar({ corpoTexto: null, corpoHtml: '<p>Preciso disso até 05/11.</p>' }).categoria,
    ).toBe('urgente');
  });

  it('resolve o ano ausente pela data do e-mail, na virada do ano', () => {
    const fimDoAno = contexto('2026-12-30T10:00');
    const base = { data: '2026-12-30T08:00' };
    expect(triar({ ...base, corpoTexto: 'Entregue até 01/01.' }, fimDoAno).categoria).toBe(
      'urgente',
    );
    expect(triar({ ...base, corpoTexto: 'Entregue até 02/01.' }, fimDoAno).categoria).toBe(
      'informativo',
    );
  });
});

describe('T4, remetente importante', () => {
  it('é urgente quando o remetente importante pede resposta', () => {
    expect(
      triar({ corpoTexto: 'Pode me ligar?' }, contexto(undefined, ['ANA@example.com'])).motivos,
    ).toEqual(['T4: remetente importante e T5: pergunta direta']);
  });

  it('não basta ser importante', () => {
    expect(triar({}, contexto(undefined, ['ana@example.com'])).categoria).toBe('informativo');
  });
});

describe('T5, pede resposta', () => {
  it('reconhece pergunta e pedido', () => {
    expect(triar({ corpoTexto: 'Pode me enviar o arquivo?' }).motivos).toEqual([
      'T5: pergunta direta',
    ]);
    expect(triar({ corpoTexto: 'Aguardo o retorno.' }).motivos).toEqual(['T5: pedido "aguardo"']);
  });

  it('exige o usuário em "para", e não só em "cc"', () => {
    expect(
      triar({ para: [OUTRA], cc: [VOCE], corpoTexto: 'Pode me enviar o arquivo?' }).categoria,
    ).toBe('informativo');
  });

  it('não conta o "?" de um endereço web', () => {
    expect(triar({ corpoTexto: 'Veja https://exemplo.com/?id=1' }).categoria).toBe('informativo');
  });
});

describe('T6 e agrupar', () => {
  it('o resto é informativo', () => {
    expect(triar({}).motivos).toEqual(['T6: nenhuma outra regra casou']);
  });

  it('agrupa os e-mails pela categoria', () => {
    const grupos = agrupar(
      [
        email({ id: 'a', assunto: 'URGENTE' }),
        email({ id: 'b', corpoTexto: 'Pode confirmar?' }),
        email({ id: 'c' }),
        email({ id: 'd', cabecalhos: { 'list-unsubscribe': 'x' } }),
      ],
      contexto(),
    );
    expect({
      urgente: grupos.urgente.map((item) => item.email.id),
      pede_resposta: grupos.pede_resposta.map((item) => item.email.id),
      informativo: grupos.informativo.map((item) => item.email.id),
      propaganda: grupos.propaganda.map((item) => item.email.id),
    }).toEqual({ urgente: ['a'], pede_resposta: ['b'], informativo: ['c'], propaganda: ['d'] });
  });
});
