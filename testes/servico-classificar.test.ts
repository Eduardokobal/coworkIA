import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import type { Email } from '../src/dominio.js';
import { carregarDadosDemo } from '../src/fontes/demo/dados.js';
import { criarFontesDemo } from '../src/fontes/demo/fonte-demo.js';
import type { Grupos } from '../src/regras/triagem.js';
import {
  classificarEmails,
  type Dependencias,
  type EmailDaIa,
  emailDaIa,
  triagem,
} from '../src/servico.js';
import { relogioFixo } from '../src/tempo.js';
import { htmlParaTexto } from '../src/texto/html.js';

const SP = 'America/Sao_Paulo';
const PASTA = fileURLToPath(new URL('../dados-demo', import.meta.url));
const relogio = relogioFixo('2026-11-04T10:30', SP);
const dep: Dependencias = {
  fontes: criarFontesDemo(carregarDadosDemo(PASTA, relogio()), SP),
  relogio,
  fuso: SP,
  importantes: ['diretoria@example.com'],
};
const SEU = 'lucia@example.com';
const T6 = { categoria: 'informativo', motivos: ['T6: nenhuma outra regra casou'] };

/** Um e-mail da IA para o usuário, sem pergunta nem pedido, que cai na T6. */
function daIa(parcial: Partial<EmailDaIa> = {}): EmailDaIa {
  return {
    id: 'msg-1',
    de: { endereco: 'ana@example.com', nome: 'Ana' },
    para: [{ endereco: SEU }],
    assunto: 'Ata da reunião',
    data: '2026-11-04T09:00:00-03:00',
    corpo: 'Segue a ata.',
    ...parcial,
  };
}

/** A categoria, pelo grupo em que o e-mail caiu, e os motivos. */
interface Visto {
  categoria: string;
  motivos: string[];
}

/** O que cada e-mail recebeu, pelo id. */
function porId(grupos: Grupos): Record<string, Visto> {
  return Object.fromEntries(
    Object.entries(grupos).flatMap(([categoria, itens]) =>
      itens.map(({ email, classificacao }) => [
        email.id,
        { categoria, motivos: classificacao.motivos },
      ]),
    ),
  );
}

function classificar(...emails: EmailDaIa[]): Record<string, Visto> {
  return porId(classificarEmails(dep, { seuEndereco: SEU, emails }).grupos);
}

/** Achado 142: o e-mail da demonstração como a IA o mandaria, em texto e com ou sem os cabeçalhos. */
function trazido(email: Email, comCabecalhos: boolean): EmailDaIa {
  return {
    id: email.id,
    de: email.de,
    para: email.para,
    cc: email.cc,
    assunto: email.assunto,
    data: email.data,
    corpo: email.corpoTexto ?? htmlParaTexto(email.corpoHtml ?? '', { cortarCitacao: true }),
    cabecalhos: comCabecalhos
      ? {
          list_unsubscribe: email.cabecalhos['list-unsubscribe'],
          precedence: email.cabecalhos.precedence,
        }
      : undefined,
  };
}

describe('o e-mail trazido pela IA vira o e-mail do domínio (CE4)', () => {
  it('com o nome vazio, o cc vazio, o corpo em texto, sem HTML, não lido e sem anexo', () => {
    expect(emailDaIa(daIa())).toEqual({
      id: 'msg-1',
      de: { nome: 'Ana', endereco: 'ana@example.com' },
      para: [{ nome: '', endereco: SEU }],
      cc: [],
      assunto: 'Ata da reunião',
      data: '2026-11-04T09:00:00-03:00',
      corpoTexto: 'Segue a ata.',
      corpoHtml: null,
      cabecalhos: {},
      lido: false,
      temAnexo: false,
    });
    const completo = emailDaIa(
      daIa({
        cc: [{ endereco: 'bia@example.com', nome: 'Bia' }],
        cabecalhos: { list_unsubscribe: '<mailto:sair@example.org>', precedence: 'bulk' },
      }),
    );
    expect(completo.cc).toEqual([{ nome: 'Bia', endereco: 'bia@example.com' }]);
    expect(completo.cabecalhos).toEqual({
      'list-unsubscribe': '<mailto:sair@example.org>',
      precedence: 'bulk',
    });
  });

  it('um cabeçalho vazio ou só com espaços conta como ausente (achado 143)', () => {
    for (const cabecalhos of [
      { list_unsubscribe: '', precedence: '' },
      { list_unsubscribe: '   ', precedence: '  ' },
    ]) {
      const email = daIa({ corpo: 'Você pode revisar o texto?', cabecalhos });
      expect(emailDaIa(email).cabecalhos).toEqual({});
      expect(classificar(email)).toEqual({
        'msg-1': { categoria: 'pede_resposta', motivos: ['T5: pergunta direta'] },
      });
    }
  });
});

describe('as regras da triagem nos e-mails trazidos pela IA (CE4 e CE10)', () => {
  it('os 21 e-mails da demonstração dão a categoria e os motivos da triagem_emails (achado 142)', async () => {
    const { emails } = carregarDadosDemo(PASTA, relogio());
    const daTriagem = porId((await triagem(dep, '2026-11-01')).grupos);
    expect(Object.keys(daTriagem)).toHaveLength(21);
    expect(new Set(Object.values(daTriagem).map((item) => item.categoria)).size).toBe(4);
    const resultado = classificarEmails(dep, {
      seuEndereco: await dep.fontes.email.enderecoDoUsuario(),
      emails: emails.map((email) => trazido(email, true)),
    });
    expect(resultado.analisados).toBe(21);
    expect(porId(resultado.grupos)).toEqual(daTriagem);
  });

  it('sem os cabeçalhos, a propaganda cai na primeira outra regra que casar (achados 142 e 146)', async () => {
    const { emails } = carregarDadosDemo(PASTA, relogio());
    const daDemo = emails
      .filter((email) => email.id === 'propaganda-urgente' || email.id === 'newsletter')
      .map((email) => trazido(email, false));
    expect(
      porId(
        classificarEmails(dep, {
          seuEndereco: await dep.fontes.email.enderecoDoUsuario(),
          emails: daDemo,
        }).grupos,
      ),
    ).toEqual({
      'propaganda-urgente': { categoria: 'urgente', motivos: ['T2: termo "urgente" no assunto'] },
      newsletter: T6,
    });
    const lista = (id: string, corpo: string) =>
      daIa({ id, de: { endereco: 'novidades@lista.example.org' }, assunto: 'Novidades', corpo });
    expect(
      classificar(
        lista('sem-pergunta', 'As novidades da semana estão no site.'),
        lista('por-favor', 'Responda a pesquisa, por favor.'),
        lista('pergunta', 'Já conhece o plano novo?'),
        lista('fim-do-dia', 'A oferta vale até o fim do dia.'),
      ),
    ).toEqual({
      'sem-pergunta': T6,
      'por-favor': { categoria: 'pede_resposta', motivos: ['T5: pedido "por favor"'] },
      pergunta: { categoria: 'pede_resposta', motivos: ['T5: pergunta direta'] },
      'fim-do-dia': {
        categoria: 'urgente',
        motivos: ['T3: prazo "até o fim do dia" (04/11/2026), que vence hoje'],
      },
    });
  });

  it('um caso para cada regra, de T1 a T6, montado na entrada da ferramenta', () => {
    expect(
      classificar(
        daIa({ id: 't1-lista', cabecalhos: { list_unsubscribe: '<mailto:sair@example.org>' } }),
        daIa({ id: 't1-precedence', cabecalhos: { precedence: 'Bulk' } }),
        daIa({ id: 't2', assunto: 'Contrato urgente' }),
        daIa({ id: 't3', corpo: 'O boleto vence amanhã.' }),
        daIa({ id: 't4', de: { endereco: 'diretoria@example.com' }, corpo: 'Confirma a data?' }),
        daIa({ id: 't5', corpo: 'Aguardo o retorno.' }),
        daIa({ id: 't6' }),
      ),
    ).toEqual({
      't1-lista': { categoria: 'propaganda', motivos: ['T1: cabeçalho List-Unsubscribe'] },
      't1-precedence': { categoria: 'propaganda', motivos: ['T1: Precedence bulk'] },
      t2: { categoria: 'urgente', motivos: ['T2: termo "urgente" no assunto'] },
      t3: {
        categoria: 'urgente',
        motivos: ['T3: prazo "vence amanhã" (05/11/2026), que vence em 1 dia'],
      },
      t4: { categoria: 'urgente', motivos: ['T4: remetente importante e T5: pergunta direta'] },
      t5: { categoria: 'pede_resposta', motivos: ['T5: pedido "aguardo"'] },
      t6: T6,
    });
  });
});

describe('o contexto da classificação (CE5)', () => {
  const pergunta = daIa({ corpo: 'Você pode revisar o texto?' });
  const pedeResposta = {
    'msg-1': { categoria: 'pede_resposta', motivos: ['T5: pergunta direta'] },
  };

  it('o endereço do usuário é o seu_endereco da chamada, só no Para', () => {
    const comEndereco = (seuEndereco: string, email: EmailDaIa) =>
      porId(classificarEmails(dep, { seuEndereco, emails: [email] }).grupos);
    expect(comEndereco('LUCIA@example.com', pergunta)).toEqual(pedeResposta);
    expect(comEndereco('outra@example.com', pergunta)).toEqual({ 'msg-1': T6 });
    expect(
      comEndereco(
        SEU,
        daIa({
          para: [{ endereco: 'time@example.com' }],
          cc: [{ endereco: SEU }],
          corpo: pergunta.corpo,
        }),
      ),
    ).toEqual({ 'msg-1': T6 });
  });

  it('os importantes, o relógio e o fuso são os do servidor', () => {
    const doServidor = (outro: Dependencias, email: EmailDaIa) =>
      porId(classificarEmails(outro, { seuEndereco: SEU, emails: [email] }).grupos);
    const importante = daIa({ de: { endereco: 'diretoria@example.com' }, corpo: pergunta.corpo });
    expect(doServidor(dep, importante)['msg-1']?.categoria).toBe('urgente');
    expect(doServidor({ ...dep, importantes: [] }, importante)).toEqual(pedeResposta);
    const venceAmanha = daIa({ corpo: 'O boleto vence amanhã.' });
    expect(doServidor(dep, venceAmanha)['msg-1']?.categoria).toBe('urgente');
    const depois = { ...dep, relogio: relogioFixo('2026-11-08T10:00', SP) };
    expect(doServidor(depois, venceAmanha)).toEqual({ 'msg-1': T6 });
    // Sem o deslocamento, a data é lida no fuso do servidor: 23:30 em São Paulo ainda é dia 4.
    expect(
      doServidor(dep, daIa({ data: '2026-11-04T23:30', corpo: 'O boleto vence hoje.' })),
    ).toEqual({
      'msg-1': {
        categoria: 'urgente',
        motivos: ['T3: prazo "vence hoje" (04/11/2026), que vence hoje'],
      },
    });
  });
});
