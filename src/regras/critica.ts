import { temDataExplicita } from '../texto/datas-no-texto.js';
import { comecaComTermo, normalizar, palavras, primeiroTermo } from '../texto/normalizar.js';

export type RegraDaCritica = 'C1' | 'C2' | 'C3' | 'C4' | 'C5' | 'C6' | 'C7' | 'C8';

export type Nivel = 'atencao' | 'sugestao';

export interface Apontamento {
  regra: RegraDaCritica;
  nivel: Nivel;
  trecho: string;
  sugestao: string;
}

export interface Rascunho {
  texto: string;
  assunto?: string | undefined;
  temAnexo?: boolean | undefined;
}

export const SAUDACOES = [
  'olá',
  'oi',
  'bom dia',
  'boa tarde',
  'boa noite',
  'prezado',
  'prezada',
  'prezados',
  'prezadas',
  'caro',
  'cara',
  'caros',
  'caras',
  'querido',
  'querida',
  'senhor',
  'senhora',
  'senhores',
  'senhoras',
  'sr',
  'sra',
  'srs',
  'sras',
] as const;

export const DESPEDIDAS = [
  'att',
  'atenciosamente',
  'abraço',
  'abraços',
  'abs',
  'obrigado',
  'obrigada',
  'obrigados',
  'obrigadas',
  'cordialmente',
  'grato',
  'grata',
  'gratos',
  'gratas',
  'até mais',
  'saudações',
  'sds',
] as const;

export const PALAVRAS_DE_ANEXO = [
  'anexo',
  'anexos',
  'anexa',
  'anexas',
  'anexado',
  'anexados',
  'anexada',
  'anexadas',
  'anexei',
  'anexamos',
  'anexando',
  'anexar',
] as const;

export const PRAZOS_VAGOS = [
  'em breve',
  'assim que possível',
  'o quanto antes',
  'o mais rápido possível',
  'asap',
  'quando puder',
] as const;

export const LIMITE_DE_PALAVRAS = 250;

export const ROTEIRO_DA_CRITICA = [
  'Tom: o texto soa adequado para quem vai receber?',
  'Clareza: dá para entender na primeira leitura o que aconteceu e o que se quer?',
  'Risco com o cliente: alguma frase pode soar como cobrança, desculpa demais, promessa ou ataque?',
  'Pedido: o que se pede está claro, com responsável e data?',
  'Próximo passo: quem faz o quê depois desta mensagem?',
] as const;

function linhasNaoVazias(texto: string): string[] {
  return texto
    .split(/\r?\n/)
    .map((linha) => linha.trim())
    .filter((linha) => linha !== '');
}

function regraC1(linhas: readonly string[]): Apontamento | null {
  const primeira = linhas[0] ?? '';
  const normalizada = normalizar(primeira);
  if (SAUDACOES.some((saudacao) => comecaComTermo(normalizada, saudacao))) {
    return null;
  }
  return {
    regra: 'C1',
    nivel: 'sugestao',
    trecho: primeira,
    sugestao: 'Comece com uma saudação, como "Olá, Ana," ou "Bom dia,".',
  };
}

function regraC2(linhas: readonly string[]): Apontamento | null {
  const finais = linhas.slice(-6);
  if (primeiroTermo(normalizar(finais.join('\n')), DESPEDIDAS) !== null) {
    return null;
  }
  return {
    regra: 'C2',
    nivel: 'sugestao',
    trecho: finais.at(-1) ?? '',
    sugestao: 'Termine com uma despedida, como "Atenciosamente," ou "Abraços,".',
  };
}

function regraC3(texto: string): Apontamento | null {
  const total = palavras(normalizar(texto)).length;
  if (total <= LIMITE_DE_PALAVRAS) {
    return null;
  }
  return {
    regra: 'C3',
    nivel: 'sugestao',
    trecho: `${total} palavras`,
    sugestao: `Encurte o texto para até ${LIMITE_DE_PALAVRAS} palavras ou separe em tópicos.`,
  };
}

function quantidadeDeLetras(palavra: string): number {
  return (palavra.match(/\p{L}/gu) ?? []).length;
}

function todaEmMaiuscula(palavra: string): boolean {
  return (
    quantidadeDeLetras(palavra) > 0 &&
    palavra === palavra.toUpperCase() &&
    palavra !== palavra.toLowerCase()
  );
}

function sequenciaGritada(sequencia: readonly string[]): Apontamento | null {
  if (sequencia.length < 3 || !sequencia.some((palavra) => quantidadeDeLetras(palavra) >= 4)) {
    return null;
  }
  return {
    regra: 'C4',
    nivel: 'atencao',
    trecho: sequencia.join(' '),
    sugestao: 'Evite frases inteiras em maiúscula: elas soam como grito.',
  };
}

/** C4 usa o texto original, porque precisa saber o que está em maiúscula. */
function regraC4(texto: string): Apontamento | null {
  let sequencia: string[] = [];
  for (const palavra of palavras(texto)) {
    if (todaEmMaiuscula(palavra)) {
      sequencia.push(palavra);
      continue;
    }
    const achado = sequenciaGritada(sequencia);
    if (achado !== null) {
      return achado;
    }
    sequencia = [];
  }
  return sequenciaGritada(sequencia);
}

function regraC5(texto: string, temAnexo: boolean | undefined): Apontamento | null {
  const palavra = primeiroTermo(normalizar(texto), PALAVRAS_DE_ANEXO);
  if (palavra === null || temAnexo === true) {
    return null;
  }
  return {
    regra: 'C5',
    nivel: 'atencao',
    trecho: palavra,
    sugestao:
      temAnexo === false
        ? 'O texto cita um anexo que não foi incluído.'
        : 'Confira se o anexo foi incluído.',
  };
}

function regraC6(texto: string): Apontamento | null {
  const vago = primeiroTermo(normalizar(texto), PRAZOS_VAGOS);
  if (vago === null || temDataExplicita(texto)) {
    return null;
  }
  return {
    regra: 'C6',
    nivel: 'atencao',
    trecho: vago,
    sugestao: 'Troque o prazo vago por uma data, como "até 10/11".',
  };
}

function regraC7(texto: string): Apontamento | null {
  const exclamacoes = (texto.match(/!/g) ?? []).length;
  if (!texto.includes('!!') && exclamacoes <= 3) {
    return null;
  }
  return {
    regra: 'C7',
    nivel: 'sugestao',
    trecho: `${exclamacoes} pontos de exclamação`,
    sugestao: 'Use poucos pontos de exclamação, e nunca dois seguidos.',
  };
}

function regraC8(assunto: string | undefined): Apontamento | null {
  if (assunto === undefined || assunto.trim() !== '') {
    return null;
  }
  return {
    regra: 'C8',
    nivel: 'atencao',
    trecho: '',
    sugestao: 'Escreva um assunto que diga do que se trata o e-mail.',
  };
}

export function criticar(rascunho: Rascunho): Apontamento[] {
  const linhas = linhasNaoVazias(rascunho.texto);
  const resultados = [
    regraC1(linhas),
    regraC2(linhas),
    regraC3(rascunho.texto),
    regraC4(rascunho.texto),
    regraC5(rascunho.texto, rascunho.temAnexo),
    regraC6(rascunho.texto),
    regraC7(rascunho.texto),
    regraC8(rascunho.assunto),
  ];
  return resultados.filter((apontamento): apontamento is Apontamento => apontamento !== null);
}
