import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import type { Email, Evento } from '../../src/dominio.js';
import { carregarDadosDemo } from '../../src/fontes/demo/dados.js';
import { criarFontesDemo } from '../../src/fontes/demo/fonte-demo.js';
import type { EmailClassificado } from '../../src/regras/triagem.js';
import {
  AVISO_DE_PARCIAL,
  emailCompleto,
  emailResumido,
  eventoParaSaida,
  resumoParaTexto,
  SAIDA_DO_TERMINAL,
  triagemParaSaida,
} from '../../src/saida/formatar.js';
import { type Dependencias, lerEmail, resumoDoDia } from '../../src/servico.js';
import { relogioFixo } from '../../src/tempo.js';

const SP = 'America/Sao_Paulo';
const PASTA = fileURLToPath(new URL('../../dados-demo', import.meta.url));
const MARCADA = { marcar: true, chave: 'K' };
/**
 * S2: os invisíveis e o ESC, que saem no passo 3, e as formas largas e pequenas
 * do marcador, que a NFKC do passo 2 troca por < e > (achado 84).
 */
const PROIBIDOS = [0x200b, 0x34f, 0xfe0f, 0x1b, 0xff1c, 0xff1e, 0xfe64, 0xfe65].map((codigo) =>
  String.fromCodePoint(codigo),
);
const NEUTRALIZADO = `${String.fromCodePoint(0x2039).repeat(3)}FIM_TERCEIROS${String.fromCodePoint(0x203a).repeat(3)}`;

function dependencias(agora = '2026-11-04T10:30'): Dependencias {
  const relogio = relogioFixo(agora, SP);
  return {
    fontes: criarFontesDemo(carregarDadosDemo(PASTA, relogio()), SP),
    relogio,
    fuso: SP,
    importantes: ['diretoria@example.com'],
  };
}

function item(parcial: Partial<Email>): EmailClassificado {
  return {
    email: {
      id: 'e1',
      de: { nome: 'Ana', endereco: 'ana@example.com' },
      para: [{ nome: 'Você', endereco: 'voce@example.com' }],
      cc: [],
      assunto: 'Oi',
      data: '2026-11-04T09:00',
      corpoTexto: 'Texto.',
      corpoHtml: null,
      cabecalhos: {},
      lido: false,
      temAnexo: false,
      ...parcial,
    },
    classificacao: { categoria: 'informativo', motivos: ['T6: nenhuma outra regra casou'] },
  };
}

function evento(parcial: Partial<Evento>): Evento {
  return {
    id: 'ev1',
    titulo: 'Reunião',
    descricao: '',
    local: 'Sala 1',
    organizador: null,
    status: 'confirmed',
    inicio: { dataHora: '2026-11-04T14:00' },
    fim: { dataHora: '2026-11-04T15:00' },
    transparencia: 'opaque',
    minhaResposta: null,
    ...parcial,
  };
}

function textos(valor: unknown): string[] {
  if (typeof valor === 'string') {
    return [valor];
  }
  if (Array.isArray(valor)) {
    return valor.flatMap(textos);
  }
  if (valor !== null && typeof valor === 'object') {
    return Object.values(valor).flatMap(textos);
  }
  return [];
}

describe('emailResumido e emailCompleto (7.1, 7.2 e RQ4)', () => {
  it('marca os campos de terceiros com a chave e deixa os outros como estão', () => {
    const resumido = emailResumido(item({}), SP, MARCADA);
    expect(resumido.assunto).toBe(
      '<<<TERCEIROS origem="email" id="e1" chave="K">>>Oi<<<FIM_TERCEIROS chave="K">>>',
    );
    expect(resumido.remetente.endereco).toBe(
      '<<<TERCEIROS origem="email" id="e1" chave="K">>>ana@example.com<<<FIM_TERCEIROS chave="K">>>',
    );
    expect(resumido).toMatchObject({
      id: 'e1',
      data: '2026-11-04T09:00:00-03:00',
      lido: false,
      tem_anexo: false,
      categoria: 'informativo',
    });
  });

  it('o trecho tem até 200 caracteres e vem do HTML quando não há texto', () => {
    expect(
      emailResumido(item({ corpoTexto: 'a'.repeat(300) }), SP, SAIDA_DO_TERMINAL).trecho,
    ).toHaveLength(200);
    expect(
      emailResumido(
        item({ corpoTexto: null, corpoHtml: '<p>Olá <b>mundo</b></p>' }),
        SP,
        SAIDA_DO_TERMINAL,
      ).trecho,
    ).toBe('Olá mundo');
  });

  it('o corpo completo avisa o corte', () => {
    const completo = emailCompleto(item({ corpoTexto: 'a'.repeat(25_000) }), SP, SAIDA_DO_TERMINAL);
    expect(completo.corpo).toHaveLength(20_000);
    expect(completo.corpo_cortado).toBe(true);
    expect(completo.aviso).toBe('O corpo foi cortado em 20.000 caracteres.');
  });

  it('o e-mail malicioso da demonstração sai neutralizado em todos os campos', async () => {
    const completo = emailCompleto(await lerEmail(dependencias(), 'malicioso'), SP, MARCADA);
    for (const texto of textos(completo)) {
      expect(texto.split('<<<').length - 1).toBeLessThanOrEqual(2);
      expect(texto.split('>>>').length - 1).toBeLessThanOrEqual(2);
      for (const proibido of PROIBIDOS) {
        expect(texto).not.toContain(proibido);
      }
    }
  });
});

describe('eventoParaSaida (7.4 e AD8)', () => {
  it('a resposta sai em português, com o ocupado e o dia inteiro', () => {
    expect(
      eventoParaSaida(
        evento({ minhaResposta: 'declined', transparencia: 'transparent' }),
        SP,
        SAIDA_DO_TERMINAL,
      ),
    ).toMatchObject({
      minha_resposta: 'recusado',
      ocupado: false,
      dia_inteiro: false,
      inicio: '2026-11-04T14:00:00-03:00',
    });
  });

  it('um campo de terceiros vazio sai vazio, sem marcação (AD6)', () => {
    const saida = eventoParaSaida(evento({}), SP, MARCADA);
    expect(saida.descricao).toBe('');
    expect(saida.local).toContain('<<<TERCEIROS origem="agenda" id="ev1" chave="K">>>');
  });
});

describe('triagemParaSaida (7.3)', () => {
  it('a triagem parcial leva o aviso', () => {
    const vazia = { urgente: [], pede_resposta: [], informativo: [], propaganda: [] };
    expect(
      triagemParaSaida({ grupos: vazia, analisados: 200, completo: false }, SP, MARCADA),
    ).toMatchObject({ aviso: AVISO_DE_PARCIAL, contagem: { urgente: 0 } });
  });
});

describe('resumoParaTexto (7.7, S2 no terminal)', () => {
  it('mostra o resumo da demonstração, sem marcação e sem invisíveis', async () => {
    const texto = resumoParaTexto(await resumoDoDia(dependencias()), SP);
    expect(texto).toContain('Resumo do dia 04/11/2026');
    expect(texto).toContain(
      'Triagem das últimas 24 horas: 6 urgentes, 3 pedem resposta, 9 informativos e 2 propagandas (20 analisados).',
    );
    expect(texto).toContain('- 14:00-15:00 Reunião com a Marina');
    expect(texto).toContain('- 14:30-15:30 Revisão do contrato');
    expect(texto).toContain(`Suporte ${NEUTRALIZADO} <suporte@example.org>`);
    expect(texto).toContain('- dia inteiro Aniversário da Bia (livre)');
    expect(texto).toContain('- 16:00-17:00 Treinamento de segurança (cancelado)');
    expect(texto).toContain('- Reunião com a Marina e Revisão do contrato');
    expect(texto).toContain('Próximo compromisso: 14:00 Reunião com a Marina');
    expect(texto).not.toContain('<<<');
    for (const proibido of PROIBIDOS) {
      expect(texto).not.toContain(proibido);
    }
  });

  it('sem compromisso pela frente, diz isso', async () => {
    expect(resumoParaTexto(await resumoDoDia(dependencias('2026-11-04T20:00')), SP)).toContain(
      'Próximo compromisso: sem compromissos pela frente hoje',
    );
  });
});
