import { describe, expect, it } from 'vitest';
import { criticar, type Rascunho } from '../../src/regras/critica.js';

const regras = (rascunho: Rascunho) => criticar(rascunho).map((a) => a.regra);
const achado = (rascunho: Rascunho, regra: string) =>
  criticar(rascunho).find((a) => a.regra === regra);

const BOM = 'Olá, Ana,\n\nSegue o relatório da semana.\n\nAbraços,\nEduardo';

describe('um rascunho sem problema', () => {
  it('não recebe apontamento', () => {
    expect(criticar({ texto: BOM, assunto: 'Relatório', temAnexo: false })).toEqual([]);
  });
});

describe('C1, saudação', () => {
  it('aponta a falta de saudação', () => {
    expect(regras({ texto: 'Preciso do relatório.\nAbraços,' })).toContain('C1');
  });

  it('aceita plural e abreviação', () => {
    expect(regras({ texto: 'Prezados,\nSegue.\nAbraços,' })).not.toContain('C1');
    expect(regras({ texto: 'Sr. João,\nSegue.\nAbraços,' })).not.toContain('C1');
    expect(regras({ texto: 'Bom dia!\nSegue.\nAbraços,' })).not.toContain('C1');
  });
});

describe('C2, despedida', () => {
  it('aponta a falta de despedida', () => {
    expect(regras({ texto: 'Olá,\nSegue.' })).toContain('C2');
  });

  it('acha a despedida antes de uma assinatura de 4 linhas', () => {
    const texto =
      'Olá,\nSegue.\nAtenciosamente,\nEduardo Kobal\nGerente\n(11) 99999-0000\nEmpresa Exemplo';
    expect(regras({ texto })).not.toContain('C2');
  });

  it('só olha as 6 últimas linhas não vazias', () => {
    expect(regras({ texto: 'Olá,\nAbraços,\n1\n2\n3\n4\n5\n6' })).toContain('C2');
  });
});

describe('C3, tamanho', () => {
  it('aponta só a partir de 251 palavras', () => {
    expect(regras({ texto: 'palavra '.repeat(250) })).not.toContain('C3');
    expect(regras({ texto: 'palavra '.repeat(251) })).toContain('C3');
  });
});

describe('C4, maiúsculas', () => {
  it('aponta 3 palavras seguidas em maiúscula com uma de 4 letras ou mais', () => {
    expect(achado({ texto: `${BOM}\nNÃO FAÇA ISSO agora.` }, 'C4')?.trecho).toBe('NÃO FAÇA ISSO');
    expect(regras({ texto: `${BOM}\nENVIAR O RELATÓRIO.` })).toContain('C4');
  });

  it('não aponta siglas curtas', () => {
    expect(regras({ texto: `${BOM}\nCPF RG CNH` })).not.toContain('C4');
  });

  it('uma palavra sem letra interrompe a sequência', () => {
    expect(regras({ texto: `${BOM}\nPAGUE 100 AGORA JÁ` })).not.toContain('C4');
  });
});

describe('C5, anexo', () => {
  const texto = `${BOM}\nSegue em anexo.`;

  it('aponta anexo citado e não incluído', () => {
    expect(achado({ texto, temAnexo: false }, 'C5')?.sugestao).toBe(
      'O texto cita um anexo que não foi incluído.',
    );
    expect(regras({ texto: `${BOM}\nAnexei o arquivo.`, temAnexo: false })).toContain('C5');
  });

  it('sem a informação do anexo, pede para conferir', () => {
    expect(achado({ texto }, 'C5')?.sugestao).toBe('Confira se o anexo foi incluído.');
  });

  it('com o anexo incluído, não aponta', () => {
    expect(regras({ texto, temAnexo: true })).not.toContain('C5');
  });
});

describe('C6, prazo vago', () => {
  it('aponta prazo vago sem data', () => {
    expect(regras({ texto: `${BOM}\nEnvio em breve.` })).toContain('C6');
  });

  it('não aponta quando há data explícita', () => {
    expect(regras({ texto: `${BOM}\nEnvio em breve, até 10/11.` })).not.toContain('C6');
    expect(regras({ texto: `${BOM}\nEnvio em breve, na sexta.` })).not.toContain('C6');
  });

  it('"logo" não é prazo vago', () => {
    expect(regras({ texto: `${BOM}\nMando o logo da empresa.` })).not.toContain('C6');
  });
});

describe('C7, exclamação', () => {
  it('aponta "!!" e mais de 3 pontos de exclamação', () => {
    expect(regras({ texto: `${BOM}\nÓtimo!!` })).toContain('C7');
    expect(regras({ texto: `${BOM}\na! b! c! d!` })).toContain('C7');
  });

  it('aceita até 3, separados', () => {
    expect(regras({ texto: `${BOM}\na! b! c!` })).not.toContain('C7');
  });
});

describe('C8, assunto', () => {
  it('aponta assunto informado e vazio', () => {
    expect(regras({ texto: BOM, assunto: '   ' })).toContain('C8');
  });

  it('não aponta assunto preenchido nem assunto não informado', () => {
    expect(regras({ texto: BOM, assunto: 'Relatório' })).not.toContain('C8');
    expect(regras({ texto: BOM })).not.toContain('C8');
  });
});
