import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  carregarDadosDemo,
  EU_DA_DEMONSTRACAO,
  fonteWhatsappDemo,
} from '../src/fontes/demo/dados.js';
import { criarFontesDemo } from '../src/fontes/demo/fonte-demo.js';
import { EMAIL_E_AGENDA_DESLIGADOS, fontesDesligadas } from '../src/fontes/desligadas.js';
import type { Fontes } from '../src/fontes/tipos.js';
import { resumoParaSaida, resumoParaTexto } from '../src/saida/formatar.js';
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
const MARCADA = { marcar: true, chave: 'K' };
const relogio = relogioFixo('2026-11-04T10:30', SP);

/** As fontes do modo arquivos, com o WhatsApp da demonstração no lugar de uma pasta de verdade. */
function dependencias(fontes: Fontes = fontesDesligadas()): Dependencias {
  return {
    fontes,
    relogio,
    fuso: SP,
    importantes: [],
    whatsapp: {
      fonte: fonteWhatsappDemo(PASTA, relogio(), SP),
      eu: EU_DA_DEMONSTRACAO,
      importantes: [],
    },
  };
}

describe('o e-mail e a agenda no modo arquivos (MA3)', () => {
  it('as 5 ferramentas de e-mail e agenda dão a mensagem fixa', async () => {
    const dep = dependencias();
    const chamadas = [
      () => listarEmails(dep, {}),
      () => lerEmail(dep, 'qualquer'),
      () => triagem(dep),
      () => listarEventos(dep, 'hoje'),
      () => disponibilidade(dep, '2026-11-04T14:00', '2026-11-04T15:00'),
    ];
    for (const chamar of chamadas) {
      await expect(chamar()).rejects.toThrow(EMAIL_E_AGENDA_DESLIGADOS);
    }
    expect(EMAIL_E_AGENDA_DESLIGADOS).toBe(
      'O e-mail e a agenda não estão ligados no modo arquivos. Use o modo google para lê-los.',
    );
  });

  it('o criticar_rascunho, que não lê nenhuma fonte, funciona', () => {
    expect(
      criticarRascunho({ texto: 'Segue em anexo o contrato.' }).roteiro.length,
    ).toBeGreaterThan(0);
  });
});

describe('o resumo do dia no modo arquivos (MA4)', () => {
  it('na ferramenta, traz o aviso no lugar dos campos do e-mail e da agenda, com o WhatsApp', async () => {
    const resumo = await resumoDoDia(dependencias());
    expect(resumo.emailEAgenda).toBe(EMAIL_E_AGENDA_DESLIGADOS);
    const saida = resumoParaSaida(resumo, SP, MARCADA);
    expect(Object.keys(saida)).toEqual(['data', 'email_e_agenda', 'whatsapp']);
    expect(saida).toMatchObject({
      data: '2026-11-04',
      email_e_agenda: { aviso: EMAIL_E_AGENDA_DESLIGADOS },
      whatsapp: { contagem: { urgente: 2, pede_resposta: 4, informativo: 1 }, analisadas: 8 },
    });
  });

  it('no terminal, a linha do aviso vem depois do título, e a seção do WhatsApp, depois dela', async () => {
    const texto = resumoParaTexto(await resumoDoDia(dependencias()), SP);
    expect(texto.split('\n').slice(0, 5)).toEqual([
      'Resumo do dia 04/11/2026',
      '',
      `E-mail e agenda: ${EMAIL_E_AGENDA_DESLIGADOS}`,
      '',
      'WhatsApp das últimas 24 horas: 2 urgentes, 4 pedem resposta e 1 informativos (8 conversas analisadas).',
    ]);
    expect(texto).not.toContain('Triagem das últimas 24 horas');
    expect(texto).not.toContain('Agenda de hoje:');
  });

  it('nos outros modos, o resumo não traz o aviso', async () => {
    const resumo = await resumoDoDia(
      dependencias(criarFontesDemo(carregarDadosDemo(PASTA, relogio()), SP)),
    );
    expect(resumo.emailEAgenda).toBeNull();
    expect(resumoParaSaida(resumo, SP, MARCADA)).not.toHaveProperty('email_e_agenda');
    expect(resumoParaTexto(resumo, SP)).not.toContain('E-mail e agenda:');
  });

  it('um erro que não é o do modo arquivos continua derrubando o resumo', async () => {
    const falha = async (): Promise<never> => {
      throw new Error('falha inesperada');
    };
    const quebradas: Fontes = {
      email: { enderecoDoUsuario: falha, listar: falha, ler: falha },
      agenda: { listar: falha },
    };
    await expect(resumoDoDia(dependencias(quebradas))).rejects.toThrow('falha inesperada');
  });
});
