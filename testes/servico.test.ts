import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import type { Evento } from '../src/dominio.js';
import { carregarDadosDemo } from '../src/fontes/demo/dados.js';
import { criarFontesDemo } from '../src/fontes/demo/fonte-demo.js';
import type { Fontes } from '../src/fontes/tipos.js';
import {
  criticarRascunho,
  type Dependencias,
  disponibilidade,
  lerEmail,
  listarEmails,
  listarEventos,
  resumoDoDia,
  triagem,
} from '../src/servico.js';
import { relogioFixo } from '../src/tempo.js';

const SP = 'America/Sao_Paulo';
const PASTA = fileURLToPath(new URL('../dados-demo', import.meta.url));

function dependencias(agora = '2026-11-04T10:30'): Dependencias {
  const relogio = relogioFixo(agora, SP);
  return {
    fontes: criarFontesDemo(carregarDadosDemo(PASTA, relogio()), SP),
    relogio,
    fuso: SP,
    importantes: ['diretoria@example.com'],
  };
}

const dep = dependencias();

function eventoDeHoje(id: string, parcial: Partial<Evento>): Evento {
  return {
    id,
    titulo: id,
    descricao: '',
    local: '',
    organizador: null,
    status: 'confirmed',
    inicio: { dataHora: '2026-11-04T11:00' },
    fim: { dataHora: '2026-11-04T12:00' },
    transparencia: 'opaque',
    minhaResposta: null,
    ...parcial,
  };
}
const idsDe = (itens: Array<{ email: { id: string } }>) => itens.map((item) => item.email.id);
const idsDosEventos = (itens: Array<{ id: string }>) => itens.map((item) => item.id);

describe('listar_emails (7.1)', () => {
  it('traz 20 por padrão, do mais novo para o mais velho, com a categoria', async () => {
    const itens = await listarEmails(dep, {});
    expect(itens).toHaveLength(20);
    expect(itens[0]?.email.id).toBe('vence-amanha');
    expect(itens[0]?.classificacao.categoria).toBe('urgente');
  });

  it('aplica os filtros', async () => {
    expect(await listarEmails(dep, { naoLidos: true })).toHaveLength(18);
    expect(idsDe(await listarEmails(dep, { busca: 'orçamento' }))).toEqual(['pedido-aguardo']);
    expect(idsDe(await listarEmails(dep, { remetente: 'carlos', limite: 50 }))).toEqual([
      'prazo-2-dias',
      'citado-texto',
    ]);
  });

  it('um ate sem hora inclui o dia inteiro (H9)', async () => {
    expect(await listarEmails(dep, { ate: '2026-11-03', limite: 50 })).toHaveLength(9);
    expect(await listarEmails(dep, { ate: '2026-11-03T23:00', limite: 50 })).toHaveLength(8);
  });
});

describe('ler_email (7.2)', () => {
  it('lê pelo id, com a categoria', async () => {
    expect((await lerEmail(dep, 'malicioso')).classificacao.categoria).toBe('urgente');
  });

  it('um id que não existe dá erro', async () => {
    await expect(lerEmail(dep, 'nao-existe')).rejects.toThrow('e-mail não encontrado');
  });
});

describe('triagem_emails (7.3)', () => {
  it('as últimas 24 horas da demonstração', async () => {
    const resultado = await triagem(dep);
    expect({ analisados: resultado.analisados, completo: resultado.completo }).toEqual({
      analisados: 20,
      completo: true,
    });
    expect({
      urgente: resultado.grupos.urgente.length,
      pede_resposta: resultado.grupos.pede_resposta.length,
      informativo: resultado.grupos.informativo.length,
      propaganda: resultado.grupos.propaganda.length,
    }).toEqual({ urgente: 6, pede_resposta: 3, informativo: 9, propaganda: 2 });
  });

  it('aceita outro começo da janela', async () => {
    expect((await triagem(dep, '2026-11-04T05:00')).analisados).toBe(7);
  });

  it('leva o completo da fonte, para o aviso de parcial', async () => {
    const fontes: Fontes = {
      ...dep.fontes,
      email: { ...dep.fontes.email, listar: async () => ({ emails: [], completo: false }) },
    };
    expect((await triagem({ ...dep, fontes })).completo).toBe(false);
  });
});

describe('listar_eventos (7.4)', () => {
  it('hoje, amanhã e a semana', async () => {
    expect(idsDosEventos(await listarEventos(dep, 'hoje'))).toEqual([
      'aniversario',
      'daily',
      'reuniao-cliente',
      'revisao-sobreposta',
      'encosta',
      'cancelado',
      'livre',
      'recusado',
    ]);
    expect(idsDosEventos(await listarEventos(dep, 'amanha'))).toEqual([
      'dia-inteiro-amanha',
      'amanha-cedo',
    ]);
    expect(await listarEventos(dep, 'semana')).toHaveLength(11);
  });
});

describe('verificar_disponibilidade (7.5)', () => {
  it('acha os conflitos e ignora o cancelado e o livre', async () => {
    const ocupado = await disponibilidade(dep, '2026-11-04T14:30', '2026-11-04T15:00');
    expect(ocupado.livre).toBe(false);
    expect(idsDosEventos(ocupado.conflitos)).toEqual(['reuniao-cliente', 'revisao-sobreposta']);
    expect((await disponibilidade(dep, '2026-11-04T16:00', '2026-11-04T17:00')).livre).toBe(true);
    expect((await disponibilidade(dep, '2026-11-04T17:30', '2026-11-04T18:00')).livre).toBe(true);
  });

  it('um fim sem hora inclui o dia inteiro (H9)', async () => {
    const resultado = await disponibilidade(dep, '2026-11-05', '2026-11-05');
    expect(idsDosEventos(resultado.conflitos)).toEqual(['dia-inteiro-amanha', 'amanha-cedo']);
  });

  it('recusa o fim antes do início', async () => {
    await expect(disponibilidade(dep, '2026-11-04T15:00', '2026-11-04T14:00')).rejects.toThrow(
      'o fim precisa ser depois do início',
    );
  });
});

describe('criticar_rascunho (7.6)', () => {
  it('devolve os apontamentos e o roteiro', () => {
    const resultado = criticarRascunho({ texto: 'Preciso do relatório.' });
    expect(resultado.apontamentos.map((apontamento) => apontamento.regra)).toEqual(['C1', 'C2']);
    expect(resultado.roteiro).toHaveLength(5);
  });
});

describe('resumo_do_dia (7.7)', () => {
  it('junta a triagem, a agenda, os conflitos e o próximo compromisso', async () => {
    const resumo = await resumoDoDia(dep);
    expect(resumo.triagem.analisados).toBe(20);
    expect(resumo.eventosDeHoje).toHaveLength(8);
    expect(resumo.conflitos.map(([a, b]) => [a.id, b.id])).toEqual([
      ['reuniao-cliente', 'revisao-sobreposta'],
    ]);
    expect(resumo.proximoCompromisso?.id).toBe('reuniao-cliente');
  });

  it('o próximo compromisso ignora o dia inteiro, o cancelado, o livre e o recusado', async () => {
    const base = dependencias('2026-11-04T00:00');
    const eventos = [
      eventoDeHoje('dia-inteiro', { inicio: { data: '2026-11-04' }, fim: { data: '2026-11-05' } }),
      eventoDeHoje('cancelado', { status: 'cancelled', inicio: { dataHora: '2026-11-04T08:00' } }),
      eventoDeHoje('livre', {
        transparencia: 'transparent',
        inicio: { dataHora: '2026-11-04T09:00' },
      }),
      eventoDeHoje('recusado', {
        minhaResposta: 'declined',
        inicio: { dataHora: '2026-11-04T10:00' },
      }),
      eventoDeHoje('valido', {}),
    ];
    const fontes: Fontes = { ...base.fontes, agenda: { listar: async () => eventos } };
    expect((await resumoDoDia({ ...base, fontes })).proximoCompromisso?.id).toBe('valido');
  });

  it('sem compromisso pela frente, o próximo é nulo', async () => {
    expect((await resumoDoDia(dependencias('2026-11-04T20:00'))).proximoCompromisso).toBeNull();
  });
});
