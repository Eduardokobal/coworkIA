import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Conversa } from '../../../src/dominio.js';
import {
  type AvisoDaPasta,
  criarFonteWhatsapp,
  ErroDaPasta,
  ehArquivoDeConversa,
  idDoArquivo,
  LIMITE_DE_ARQUIVOS,
  nomeDaConversa,
  PASTA_SEM_LEITURA,
  semIdsRepetidos,
} from '../../../src/fontes/whatsapp/fonte-whatsapp.js';

// O readFileSync passa a ser observado, para os testes saberem que arquivo foi lido.
vi.mock('node:fs', async (original) => {
  const fs = await original<typeof import('node:fs')>();
  return { ...fs, readFileSync: vi.fn(fs.readFileSync) };
});

const SP = 'America/Sao_Paulo';
const LINHA = '05/11/2026 14:32 - Ana: oi\n';
const pastas: string[] = [];

/** Uma pasta temporária, apagada depois de cada teste. */
function pastaCom(arquivos: Record<string, string>): string {
  const pasta = mkdtempSync(join(tmpdir(), 'coworkia-whatsapp-'));
  pastas.push(pasta);
  for (const [nome, conteudo] of Object.entries(arquivos)) {
    writeFileSync(join(pasta, nome), conteudo);
  }
  return pasta;
}

afterEach(() => {
  for (const pasta of pastas.splice(0)) {
    rmSync(pasta, { recursive: true, force: true });
  }
});

describe('a pasta das conversas (F2 e F4)', () => {
  it('lê só os .txt comuns, em ordem, com o nome sem o prefixo e o id opaco', async () => {
    const pasta = pastaCom({
      'Obra.txt': LINHA,
      'Conversa do WhatsApp com Ana Ribeiro.txt': LINHA,
      'notas.md': LINHA,
    });
    mkdirSync(join(pasta, 'pasta.txt'));
    const { conversas, avisos } = await criarFonteWhatsapp({ pasta, fuso: SP }).conversas();
    expect(conversas.map((conversa) => conversa.nome)).toEqual(['Ana Ribeiro', 'Obra']);
    expect(conversas[0]?.id).toBe(idDoArquivo('Conversa do WhatsApp com Ana Ribeiro.txt'));
    expect(conversas[0]?.id).toMatch(/^[0-9a-f]{12}$/);
    expect(conversas[0]?.mensagens).toHaveLength(1);
    expect(avisos).toEqual([]);
  });

  it('o id são os 12 primeiros caracteres hexadecimais do sha256 do nome do arquivo', () => {
    expect(idDoArquivo('Conversa do WhatsApp com Ana Ribeiro.txt')).toBe('ef32feda1128');
  });

  it('um link simbólico ou uma pasta não é arquivo comum, e o nome tem de terminar em .txt', () => {
    expect(ehArquivoDeConversa({ name: 'link.txt', isFile: () => false })).toBe(false);
    expect(ehArquivoDeConversa({ name: 'a.txt', isFile: () => true })).toBe(true);
    expect(ehArquivoDeConversa({ name: 'a.txt.zip', isFile: () => true })).toBe(false);
  });

  it('um link para um arquivo, com nome .txt, fica de fora sem aviso e nunca é seguido', async ({
    skip,
  }) => {
    const pasta = pastaCom({ 'A.txt': LINHA, 'alvo.md': LINHA });
    try {
      symlinkSync(join(pasta, 'alvo.md'), join(pasta, 'link.txt'), 'file');
    } catch (erro) {
      // No Windows sem o modo de desenvolvedor, o link de arquivo pede a permissão de administrador.
      if ((erro as NodeJS.ErrnoException).code === 'EPERM') {
        skip('o sistema não deixou criar o link de arquivo');
      }
      throw erro;
    }
    const { conversas, avisos } = await criarFonteWhatsapp({ pasta, fuso: SP }).conversas();
    expect(conversas.map((conversa) => conversa.nome)).toEqual(['A']);
    expect(avisos).toEqual([]);
  });

  it('um link com nome .txt fica de fora sem aviso e nunca é seguido', async () => {
    const pasta = pastaCom({ 'A.txt': LINHA });
    mkdirSync(join(pasta, 'sub'));
    writeFileSync(join(pasta, 'sub', 'B.txt'), LINHA);
    // A junção do Windows não pede permissão de administrador; nos outros sistemas, é um link comum.
    symlinkSync(join(pasta, 'sub'), join(pasta, 'link.txt'), 'junction');
    const { conversas, avisos } = await criarFonteWhatsapp({ pasta, fuso: SP }).conversas();
    expect(conversas.map((conversa) => conversa.nome)).toEqual(['A']);
    expect(avisos).toEqual([]);
  });

  it('o nome fica sem o .txt e sem o prefixo da exportação', () => {
    expect(nomeDaConversa('Conversa do WhatsApp com Bia.txt')).toBe('Bia');
    expect(nomeDaConversa('_chat.txt')).toBe('_chat');
  });

  it('lê 200 arquivos sem aviso', async () => {
    const arquivos: Record<string, string> = {};
    for (let i = 0; i < 200; i += 1) {
      arquivos[`c${String(i).padStart(3, '0')}.txt`] = LINHA;
    }
    const { conversas, avisos } = await criarFonteWhatsapp({
      pasta: pastaCom(arquivos),
      fuso: SP,
    }).conversas();
    expect(conversas).toHaveLength(200);
    expect(avisos).toEqual([]);
  });

  it('passando de 200 arquivos, lê os 200 primeiros e avisa quantos ficaram de fora', async () => {
    const arquivos: Record<string, string> = {};
    for (let i = 0; i <= LIMITE_DE_ARQUIVOS; i += 1) {
      arquivos[`c${String(i).padStart(3, '0')}.txt`] = LINHA;
    }
    const pasta = pastaCom(arquivos);
    const { conversas, avisos } = await criarFonteWhatsapp({ pasta, fuso: SP }).conversas();
    expect(conversas).toHaveLength(200);
    expect(conversas.at(-1)?.nome).toBe('c199');
    expect(avisos).toEqual([
      { nome: null, texto: 'O limite é de 200 arquivos; ficaram de fora: 1.' },
    ]);
  });

  it('o arquivo grande demais fica de fora sem ser lido, com um aviso, e o do tamanho exato entra', async () => {
    const pasta = pastaCom({
      'Exata.txt': LINHA.repeat(2),
      'Grande.txt': LINHA.repeat(3),
      'Pequena.txt': LINHA,
    });
    const fonte = criarFonteWhatsapp({ pasta, fuso: SP, limiteDeBytes: LINHA.length * 2 });
    vi.mocked(readFileSync).mockClear();
    const { conversas, avisos } = await fonte.conversas();
    expect(conversas.map((conversa) => conversa.nome)).toEqual(['Exata', 'Pequena']);
    expect(avisos).toEqual([
      { nome: 'Grande', texto: 'o arquivo passa de 20 MB e ficou de fora.' },
    ]);
    const lidos = vi.mocked(readFileSync).mock.calls.map(([caminho]) => String(caminho));
    expect(lidos.filter((caminho) => caminho.endsWith('Grande.txt'))).toEqual([]);
    expect(lidos.filter((caminho) => caminho.endsWith('Exata.txt'))).toHaveLength(1);
  });

  it('sem o limite dos testes, o arquivo com 1 byte além de 20 MB fica de fora', async () => {
    const pasta = pastaCom({ 'Pequena.txt': LINHA });
    writeFileSync(join(pasta, 'Grande.txt'), Buffer.alloc(20 * 1024 * 1024 + 1, 'a'));
    const { conversas, avisos } = await criarFonteWhatsapp({ pasta, fuso: SP }).conversas();
    expect(conversas.map((conversa) => conversa.nome)).toEqual(['Pequena']);
    expect(avisos).toEqual([
      { nome: 'Grande', texto: 'o arquivo passa de 20 MB e ficou de fora.' },
    ]);
  });

  it('um arquivo que falha na leitura fica de fora, com um aviso fixo, e os outros são lidos', async () => {
    const pasta = pastaCom({ 'A.txt': LINHA, 'B.txt': LINHA, 'C.txt': LINHA, 'D.txt': LINHA });
    // Entre a listagem da pasta e a leitura (achado 109), o B some, e dá ENOENT; o C vira uma
    // pasta, e dá outro erro (EISDIR).
    let trocou = false;
    const fonte = criarFonteWhatsapp({
      pasta,
      fuso: SP,
      preparar: (texto) => {
        if (!trocou) {
          rmSync(join(pasta, 'B.txt'));
          rmSync(join(pasta, 'C.txt'));
          mkdirSync(join(pasta, 'C.txt'));
          trocou = true;
        }
        return texto;
      },
    });
    const saidas = [
      vi.spyOn(process.stderr, 'write').mockImplementation(() => true),
      vi.spyOn(console, 'error').mockImplementation(() => undefined),
      vi.spyOn(console, 'warn').mockImplementation(() => undefined),
      vi.spyOn(console, 'log').mockImplementation(() => undefined),
    ];
    try {
      const { conversas, avisos } = await fonte.conversas();
      expect(conversas.map((conversa) => conversa.nome)).toEqual(['A', 'D']);
      expect(avisos).toEqual([
        { nome: 'B', texto: 'o arquivo não pôde ser lido e ficou de fora.' },
        { nome: 'C', texto: 'o arquivo não pôde ser lido e ficou de fora.' },
      ]);
      // RW3: nada vai para o terminal, nem o erro do sistema, que traz o nome do arquivo.
      for (const saida of saidas) {
        expect(saida).not.toHaveBeenCalled();
      }
    } finally {
      for (const saida of saidas) {
        saida.mockRestore();
      }
    }
  });

  it('a pasta que não existe dá a mensagem fixa, sem o caminho (F1, achado 114)', async () => {
    const pasta = join(pastaCom({}), 'nao-existe');
    const leitura = criarFonteWhatsapp({ pasta, fuso: SP }).conversas();
    await expect(leitura).rejects.toBeInstanceOf(ErroDaPasta);
    await expect(leitura).rejects.toHaveProperty('message', PASTA_SEM_LEITURA);
    expect(PASTA_SEM_LEITURA).toBe(
      'A pasta de COWORKIA_WHATSAPP_PASTA não pôde ser lida; confira se ela existe.',
    );
  });

  it('o formato não reconhecido e as linhas descartadas viram avisos, com o nome', async () => {
    const pasta = pastaCom({ 'A.txt': 'sem data\noutra\n', 'B.txt': `antes\n${LINHA}` });
    const { conversas, avisos } = await criarFonteWhatsapp({ pasta, fuso: SP }).conversas();
    expect(conversas.map((conversa) => conversa.formato)).toEqual([null, 'android']);
    expect(avisos).toEqual([
      { nome: 'A', texto: 'formato não reconhecido.' },
      { nome: 'B', texto: 'linhas descartadas antes da primeira mensagem: 1.' },
    ]);
  });

  it('a demonstração troca o texto antes da leitura', async () => {
    const pasta = pastaCom({ 'Demo.txt': '{{data}} - Ana: oi\n' });
    const fonte = criarFonteWhatsapp({
      pasta,
      fuso: SP,
      preparar: (texto) => texto.replace('{{data}}', '05/11/2026 14:32'),
    });
    expect((await fonte.conversas()).conversas[0]?.mensagens[0]?.texto).toBe('oi');
  });
});

describe('semIdsRepetidos (F4)', () => {
  it('tira as duas conversas com o mesmo id e avisa cada uma', () => {
    const conversa = (id: string, nome: string): Conversa => ({
      id,
      nome,
      formato: 'android',
      mensagens: [],
      linhasDescartadas: 0,
    });
    const avisos: AvisoDaPasta[] = [];
    const restantes = semIdsRepetidos(
      [conversa('aaa', 'Um'), conversa('bbb', 'Dois'), conversa('aaa', 'Três')],
      avisos,
    );
    expect(restantes.map((item) => item.nome)).toEqual(['Dois']);
    expect(avisos.map((aviso) => aviso.nome)).toEqual(['Um', 'Três']);
  });
});
