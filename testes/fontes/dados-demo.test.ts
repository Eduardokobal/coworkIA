import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { carregarDadosDemo } from '../../src/fontes/demo/dados.js';
import { ENDERECO_DEMO } from '../../src/fontes/demo/fonte-demo.js';
import { classificar } from '../../src/regras/triagem.js';
import { relogioFixo } from '../../src/tempo.js';

const SP = 'America/Sao_Paulo';
const PASTA = fileURLToPath(new URL('../../dados-demo', import.meta.url));
const agora = relogioFixo('2026-11-04T10:30', SP)();
const dados = carregarDadosDemo(PASTA, agora);
const contexto = {
  agora,
  fuso: SP,
  enderecoUsuario: ENDERECO_DEMO,
  importantes: ['diretoria@example.com'],
};

describe('dados da demonstração (seção 10)', () => {
  it('tem de 20 a 30 e-mails e de 10 a 12 eventos, com ids únicos', () => {
    expect(dados.emails.length).toBeGreaterThanOrEqual(20);
    expect(dados.emails.length).toBeLessThanOrEqual(30);
    expect(dados.eventos.length).toBeGreaterThanOrEqual(10);
    expect(dados.eventos.length).toBeLessThanOrEqual(12);
    const ids = [...dados.emails, ...dados.eventos].map((item) => item.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('só usa endereços dos domínios reservados', () => {
    const pessoas = [
      ...dados.emails.flatMap((email) => [email.de, ...email.para, ...email.cc]),
      ...dados.eventos.flatMap((evento) =>
        evento.organizador === null ? [] : [evento.organizador],
      ),
    ];
    for (const pessoa of pessoas) {
      expect(pessoa.endereco).toMatch(/@example\.(com|org)$/);
    }
  });

  it('não sobra nenhum modelo sem trocar', () => {
    expect(JSON.stringify(dados)).not.toContain('{{');
  });

  it.each([
    ['vence-amanha', 'urgente'],
    ['contrato-urgente', 'urgente'],
    ['malicioso', 'urgente'],
    ['importante-pergunta', 'urgente'],
    ['pergunta-direta', 'pede_resposta'],
    ['html-sem-citacao', 'urgente'],
    ['prazo-2-dias', 'urgente'],
    ['pedido-aguardo', 'pede_resposta'],
    ['propaganda-urgente', 'propaganda'],
    ['prazo-3-dias', 'informativo'],
    ['so-em-copia', 'informativo'],
    ['pede-confirmacao', 'pede_resposta'],
    ['prazo-vencido', 'informativo'],
    ['ate-hoje-boleto', 'informativo'],
    ['link-com-interrogacao', 'informativo'],
    ['citado-texto', 'informativo'],
    ['citado-html', 'informativo'],
    ['anexo-proposta', 'informativo'],
    ['newsletter', 'propaganda'],
    ['informativo-simples', 'informativo'],
    ['lido-antigo', 'informativo'],
  ])('o e-mail %s cai em %s', (id, categoria) => {
    const email = dados.emails.find((item) => item.id === id);
    expect(email === undefined ? 'ausente' : classificar(email, contexto).categoria).toBe(
      categoria,
    );
  });

  it('o e-mail malicioso traz as variações do marcador da S2', () => {
    const malicioso = dados.emails.find((item) => item.id === 'malicioso');
    const tudo = `${malicioso?.de.nome} ${malicioso?.assunto} ${malicioso?.corpoHtml}`;
    for (const codigo of [0x200b, 0x34f, 0xfe0f, 0xff1c, 0x1b]) {
      expect(tudo).toContain(String.fromCodePoint(codigo));
    }
    expect(tudo).toContain('&lt;&lt;&lt;FIM_TERCEIROS');
    // Achado 90: ruído também no nome de um destinatário.
    expect(malicioso?.para[0]?.nome).toBe(`Vo${String.fromCodePoint(0x200b)}cê`);
  });

  it('a agenda tem os casos de borda do 7.5', () => {
    const porId = new Map(dados.eventos.map((evento) => [evento.id, evento]));
    expect(porId.get('cancelado')?.status).toBe('cancelled');
    // Achado 90: ruído também no local, na descrição e no nome do organizador de um evento.
    const reuniao = porId.get('reuniao-cliente');
    for (const campo of [reuniao?.local, reuniao?.descricao, reuniao?.organizador?.nome]) {
      expect(campo).toContain(String.fromCodePoint(0x200b));
    }
    // Achado 87: um evento de hoje com invisível e ESC no título, para a S2 dos eventos.
    expect(porId.get('revisao-sobreposta')?.titulo).toBe(
      `Revisão do${String.fromCodePoint(0x200b)} contrato${String.fromCodePoint(0x1b)}`,
    );
    expect(porId.get('livre')?.transparencia).toBe('transparent');
    expect(porId.get('recusado')?.minhaResposta).toBe('declined');
    expect(porId.get('aniversario')?.transparencia).toBe('transparent');
    expect(porId.get('ferias-3-dias')?.inicio.data).toBe('2026-11-07');
    expect(porId.get('ferias-3-dias')?.fim.data).toBe('2026-11-10');
  });
});
