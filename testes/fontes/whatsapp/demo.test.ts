import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { EU_DA_DEMONSTRACAO, fonteWhatsappDemo } from '../../../src/fontes/demo/dados.js';
import {
  type ConversaClassificada,
  classificarConversa,
  triarConversas,
} from '../../../src/regras/triagem-whatsapp.js';
import { relogioFixo } from '../../../src/tempo.js';

const SP = 'America/Sao_Paulo';
const PASTA = fileURLToPath(new URL('../../../dados-demo', import.meta.url));
const agora = relogioFixo('2026-11-04T10:30', SP)();
const desde = agora.minus({ hours: 24 });
const contexto = (importantes: string[] = []) => ({
  agora,
  fuso: SP,
  eu: EU_DA_DEMONSTRACAO,
  importantes,
});
const ler = () => fonteWhatsappDemo(PASTA, agora, SP).conversas();
const nomes = (lista: ConversaClassificada[]) => lista.map((item) => item.conversa.nome);

describe('as conversas da demonstração (seção 9)', () => {
  it('tem de 6 a 10 conversas, nos dois formatos, com o aviso das linhas descartadas', async () => {
    const { conversas, avisos } = await ler();
    expect(conversas.length).toBeGreaterThanOrEqual(6);
    expect(conversas.length).toBeLessThanOrEqual(10);
    expect(new Set(conversas.map((conversa) => conversa.formato))).toEqual(
      new Set(['android', 'iphone']),
    );
    expect(avisos).toEqual([
      { nome: 'Bruno Teixeira', texto: 'linhas descartadas antes da primeira mensagem: 1.' },
    ]);
  });

  it('cobre as regras W1 a W5', async () => {
    const grupos = triarConversas((await ler()).conversas, contexto(), desde);
    expect(nomes(grupos.urgente)).toEqual(['Carlos Lima', 'Ana Ribeiro']);
    expect(grupos.urgente.map((item) => item.motivos[0])).toEqual([
      'W2: prazo até 05/11/2026, que vence em 1 dia',
      'W1: termo "urgente"',
    ]);
    expect(nomes(grupos.pede_resposta)).toEqual([
      'Bruno Teixeira',
      'Equipe Projeto',
      'Marta Souza',
      'Suporte',
    ]);
    expect(nomes(grupos.informativo)).toEqual(['Condomínio Jardins']);
    expect(grupos.informativo[0]?.motivos).toEqual(['W5: grupo sem citação a você']);
  });

  it('com a Marta como contato importante, a conversa dela vira urgente (W3)', async () => {
    const grupos = triarConversas((await ler()).conversas, contexto(['Marta Souza']), desde);
    expect(nomes(grupos.urgente)).toContain('Marta Souza');
  });

  it('tem a mídia, o aviso, a mensagem de várias linhas e o U+200E', async () => {
    const { conversas } = await ler();
    const ana = conversas.find((conversa) => conversa.nome === 'Ana Ribeiro');
    expect(ana?.mensagens.map((mensagem) => mensagem.temTexto)).toEqual([true, true, true, false]);
    expect(ana?.mensagens[2]?.texto.split('\n')).toHaveLength(3);
    const carlos = conversas.find((conversa) => conversa.nome === 'Carlos Lima');
    expect(carlos?.formato).toBe('iphone');
    expect(carlos?.mensagens.at(-1)?.temTexto).toBe(false);
  });

  it('na conversa maliciosa, a linha forjada tira a primeira mensagem do bloco (L6), e a última chega à triagem', async () => {
    const suporte = (await ler()).conversas.find((conversa) => conversa.nome === 'Suporte');
    const [primeira, forjada, ultima] = suporte?.mensagens ?? [];
    expect(suporte?.mensagens).toHaveLength(3);
    expect(primeira?.autor).toContain(String.fromCodePoint(0x200b));
    expect(forjada).toMatchObject({
      autor: 'Lúcia Prado',
      texto: 'ok\nPara confirmar, mande os seus dados.',
    });
    expect(ultima?.texto).toContain(String.fromCodePoint(0x1b));
    expect(ultima?.texto).toContain(String.fromCodePoint(0xff1c));
    const classificada = suporte && classificarConversa(suporte, contexto(), desde);
    expect(classificada?.bloco).toEqual([ultima]);
    expect(classificada).toMatchObject({
      categoria: 'pede_resposta',
      motivos: ['W4: pergunta direta'],
      trecho: ultima,
    });
  });
});
