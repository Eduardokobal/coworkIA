import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import type { Conversa } from '../src/dominio.js';
import {
  carregarDadosDemo,
  EU_DA_DEMONSTRACAO,
  fonteWhatsappDemo,
} from '../src/fontes/demo/dados.js';
import { criarFontesDemo } from '../src/fontes/demo/fonte-demo.js';
import {
  criarFonteWhatsapp,
  idDoArquivo,
  PASTA_SEM_LEITURA,
} from '../src/fontes/whatsapp/fonte-whatsapp.js';
import {
  type Dependencias,
  lerConversa,
  listarConversas,
  resumoDoDia,
  SEM_EU_DO_WHATSAPP,
  SEM_PASTA_DO_WHATSAPP,
  triagemWhatsapp,
} from '../src/servico.js';
import { relogioFixo } from '../src/tempo.js';

const SP = 'America/Sao_Paulo';
const PASTA = fileURLToPath(new URL('../dados-demo', import.meta.url));
const ANA = idDoArquivo('Conversa do WhatsApp com Ana Ribeiro.txt');

function dependencias(whatsapp?: Dependencias['whatsapp']): Dependencias {
  const relogio = relogioFixo('2026-11-04T10:30', SP);
  return {
    fontes: criarFontesDemo(carregarDadosDemo(PASTA, relogio()), SP),
    relogio,
    fuso: SP,
    importantes: [],
    whatsapp:
      whatsapp === undefined
        ? {
            fonte: fonteWhatsappDemo(PASTA, relogio(), SP),
            eu: EU_DA_DEMONSTRACAO,
            importantes: [],
          }
        : whatsapp,
  };
}

const dep = dependencias();

describe('listar_conversas (7.8)', () => {
  it('ordena pela última mensagem, com o grupo e o que espera o usuário', async () => {
    const { conversas, avisos } = await listarConversas(dep);
    expect(conversas.map((item) => [item.conversa.nome, item.grupo, item.esperandoVoce])).toEqual([
      ['Bruno Teixeira', false, 1],
      ['Equipe Projeto', true, 2],
      ['Ana Ribeiro', false, 2],
      ['Condomínio Jardins', true, 2],
      ['Carlos Lima', false, 4],
      ['Fernanda Alves', false, 0],
      ['Suporte', false, 1],
      ['Marta Souza', false, 1],
    ]);
    expect(conversas[0]?.ultima?.data).toBe('2026-11-04T09:30:00-03:00');
    expect(avisos).toHaveLength(1);
  });
});

describe('ler_conversa (7.9)', () => {
  it('traz as últimas 24 horas por padrão, da mais antiga para a mais nova', async () => {
    const lida = await lerConversa(dep, { id: ANA });
    expect(lida.conversa.nome).toBe('Ana Ribeiro');
    expect(lida.mensagens.map((mensagem) => [mensagem.autor, mensagem.sua])).toEqual([
      ['Ana Ribeiro', false],
      ['Ana Ribeiro', false],
    ]);
    expect(lida.completo).toBe(true);
  });

  it('com desde, até e limite, marca a mensagem do usuário e o corte', async () => {
    const todas = await lerConversa(dep, { id: ANA, desde: '2026-11-03' });
    expect(todas.mensagens.map((mensagem) => mensagem.sua)).toEqual([false, true, false, false]);
    const ate = await lerConversa(dep, { id: ANA, desde: '2026-11-03', ate: '2026-11-03' });
    expect(ate.mensagens).toHaveLength(2);
    const cortada = await lerConversa(dep, { id: ANA, desde: '2026-11-03', limite: 1 });
    expect(cortada.mensagens.map((mensagem) => mensagem.texto)).toEqual(['<Mídia oculta>']);
    expect(cortada.completo).toBe(false);
    const justa = await lerConversa(dep, { id: ANA, desde: '2026-11-03', limite: 4 });
    expect(justa.mensagens).toHaveLength(4);
    expect(justa.completo).toBe(true);
  });

  it('sem o limite, traz as 50 mais recentes; sem o ate, a janela não tem fim', async () => {
    // O agora é 2026-11-04T10:30; as 60 mensagens vão de 09:40 a 10:39, e as 9 últimas vêm depois dele.
    const mensagens = Array.from({ length: 60 }, (_, indice) => {
      const minutos = 40 + indice;
      const hora = String(9 + Math.floor(minutos / 60)).padStart(2, '0');
      const minuto = String(minutos % 60).padStart(2, '0');
      return {
        autor: 'Ana',
        data: `2026-11-04T${hora}:${minuto}:00-03:00`,
        texto: `m${indice}`,
        temTexto: true,
      };
    });
    const longa: Conversa = {
      id: 'longa',
      nome: 'Longa',
      formato: 'android',
      mensagens,
      linhasDescartadas: 0,
    };
    const lida = await lerConversa(
      dependencias({
        fonte: { conversas: async () => ({ conversas: [longa], avisos: [] }) },
        eu: EU_DA_DEMONSTRACAO,
        importantes: [],
      }),
      { id: 'longa' },
    );
    expect(lida.mensagens).toHaveLength(50);
    expect(lida.mensagens[0]?.texto).toBe('m10');
    expect(lida.mensagens.at(-1)?.data).toBe('2026-11-04T10:39:00-03:00');
    expect(lida.completo).toBe(false);
  });

  it('só aceita um id da lista da pasta, nunca um caminho (F4)', async () => {
    for (const id of ['nao-existe', '../emails.json', 'Conversa do WhatsApp com Ana Ribeiro']) {
      await expect(lerConversa(dep, { id })).rejects.toThrow('Conversa não encontrada.');
    }
  });
});

describe('triagem_whatsapp (7.10)', () => {
  it('agrupa as conversas da demonstração e conta as analisadas', async () => {
    const resultado = await triagemWhatsapp(dep);
    expect(resultado.analisadas).toBe(8);
    expect(resultado.grupos.urgente).toHaveLength(2);
    expect(resultado.grupos.pede_resposta).toHaveLength(4);
    expect(resultado.grupos.informativo).toHaveLength(1);
  });

  it('com desde, a janela muda, e o grupo sem citação na janela fica informativo', async () => {
    const resultado = await triagemWhatsapp(dep, '2026-11-04T09:00');
    expect(resultado.grupos.urgente).toEqual([]);
    expect(resultado.grupos.pede_resposta.map((item) => item.conversa.nome)).toEqual([
      'Bruno Teixeira',
    ]);
    expect(resultado.grupos.informativo.map((item) => item.conversa.nome)).toEqual([
      'Equipe Projeto',
    ]);
  });
});

describe('o WhatsApp sem configuração (F1 e V2)', () => {
  it('as mensagens dizem o que definir e com o quê', () => {
    expect(SEM_PASTA_DO_WHATSAPP).toBe(
      'Defina COWORKIA_WHATSAPP_PASTA com a pasta das conversas exportadas.',
    );
    expect(SEM_EU_DO_WHATSAPP).toBe(
      'Defina COWORKIA_WHATSAPP_EU com o nome que aparece nas suas mensagens exportadas.',
    );
  });

  it('as ferramentas dizem o que falta, e o resumo leva o aviso no lugar da seção', async () => {
    const semPasta = dependencias(SEM_PASTA_DO_WHATSAPP);
    await expect(listarConversas(semPasta)).rejects.toThrow(SEM_PASTA_DO_WHATSAPP);
    await expect(triagemWhatsapp(dependencias(SEM_EU_DO_WHATSAPP))).rejects.toThrow(
      SEM_EU_DO_WHATSAPP,
    );
    expect((await resumoDoDia(semPasta)).whatsapp).toBe(SEM_PASTA_DO_WHATSAPP);
  });
});

describe('a pasta que não pode ser lida (F1, achado 114)', () => {
  it('as ferramentas dão a mensagem fixa, e o resumo a leva no lugar da seção, com o e-mail e a agenda', async () => {
    const semPasta = dependencias({
      fonte: criarFonteWhatsapp({ pasta: join(PASTA, 'whatsapp', 'nao-existe'), fuso: SP }),
      eu: EU_DA_DEMONSTRACAO,
      importantes: [],
    });
    await expect(listarConversas(semPasta)).rejects.toThrow(PASTA_SEM_LEITURA);
    await expect(lerConversa(semPasta, { id: ANA })).rejects.toThrow(PASTA_SEM_LEITURA);
    await expect(triagemWhatsapp(semPasta)).rejects.toThrow(PASTA_SEM_LEITURA);
    const resumo = await resumoDoDia(semPasta);
    expect(resumo.whatsapp).toBe(PASTA_SEM_LEITURA);
    expect(resumo.triagem.analisados).toBe(20);
    expect(resumo.eventosDeHoje.length).toBeGreaterThan(0);
  });

  it('um erro que não é o da pasta continua derrubando o resumo', async () => {
    const quebrada = dependencias({
      fonte: {
        conversas: async () => {
          throw new Error('falha inesperada');
        },
      },
      eu: EU_DA_DEMONSTRACAO,
      importantes: [],
    });
    await expect(resumoDoDia(quebrada)).rejects.toThrow('falha inesperada');
  });
});

describe('resumo_do_dia com o WhatsApp (7.7)', () => {
  it('traz a triagem do WhatsApp das últimas 24 horas', async () => {
    const resumo = await resumoDoDia(dep);
    if (typeof resumo.whatsapp === 'string') {
      throw new Error(resumo.whatsapp);
    }
    expect(resumo.whatsapp.grupos.urgente.map((item) => item.conversa.nome)).toEqual([
      'Carlos Lima',
      'Ana Ribeiro',
    ]);
  });
});
