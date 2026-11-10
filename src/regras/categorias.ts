import type { TipoDeConta } from '../dominio.js';
import { contemTermo, semAcentos } from '../texto/normalizar.js';

export const PAGAMENTO_DA_FATURA = 'pagamento da fatura';
export const INVESTIMENTOS = 'investimentos';
export const RENDA = 'renda';
export const OUTROS = 'outros';

/** G2.1: os termos do pagamento da fatura, numa saída da conta e numa entrada do cartão. */
const FATURA_NA_CONTA = [
  'pagamento fatura',
  'pagamento de fatura',
  'pagamento da fatura',
  'pagto fatura',
  'pgto fatura',
  'pag fatura',
  'pagamento cartao',
  'pagto cartao',
  'pgto cartao',
  'pag cartao',
  'fatura cartao',
  'fatura do cartao',
] as const;
const FATURA_NO_CARTAO = ['pagamento', 'pagto', 'pgto'] as const;

interface CategoriaFixa {
  nome: string;
  termos: readonly string[];
}

/** G2, da 2 à 13, na ordem. A renda só casa com uma entrada. */
export const CATEGORIAS_FIXAS: readonly CategoriaFixa[] = [
  {
    nome: 'tarifas',
    termos: ['tarifa', 'tar', 'anuidade', 'iof', 'juros', 'encargos', 'multa', 'cesta de servicos'],
  },
  {
    nome: INVESTIMENTOS,
    termos: [
      'aplicacao',
      'aplic',
      'resgate',
      'resg',
      'investimento',
      'invest',
      'cdb',
      'rdb',
      'lci',
      'lca',
      'tesouro direto',
    ],
  },
  { nome: RENDA, termos: ['salario', 'proventos', 'folha', 'remuneracao', 'pro labore'] },
  {
    nome: 'assinaturas',
    termos: [
      'netflix',
      'spotify',
      'amazon prime',
      'prime video',
      'disney',
      'hbo',
      'youtube premium',
      'google one',
      'icloud',
      'apple com',
      'globoplay',
      'deezer',
      'paramount',
    ],
  },
  {
    nome: 'transporte',
    termos: [
      'uber',
      '99app',
      '99 pop',
      'cabify',
      'posto',
      'combustivel',
      'shell',
      'ipiranga',
      'estacionamento',
      'sem parar',
      'conectcar',
      'veloe',
      'metro',
      'bilhete unico',
      'pedagio',
    ],
  },
  {
    nome: 'alimentação',
    termos: [
      'ifood',
      'rappi',
      'restaurante',
      'lanchonete',
      'padaria',
      'pizzaria',
      'burger',
      'mcdonalds',
      'mc donalds',
      'cafeteria',
    ],
  },
  {
    nome: 'mercado',
    termos: [
      'mercado',
      'supermercado',
      'carrefour',
      'pao de acucar',
      'assai',
      'atacadao',
      'hortifruti',
      'sacolao',
      'atacarejo',
    ],
  },
  {
    nome: 'moradia',
    termos: [
      'aluguel',
      'condominio',
      'enel',
      'light',
      'sabesp',
      'copasa',
      'cemig',
      'comgas',
      'copel',
      'celesc',
      'energia',
      'agua',
      'internet',
      'vivo',
      'claro',
      'tim',
    ],
  },
  {
    nome: 'saúde',
    termos: [
      'farmacia',
      'drogaria',
      'drogasil',
      'droga raia',
      'pague menos',
      'unimed',
      'amil',
      'hapvida',
      'sulamerica',
      'hospital',
      'clinica',
      'laboratorio',
      'odonto',
    ],
  },
  {
    nome: 'educação',
    termos: [
      'escola',
      'colegio',
      'faculdade',
      'universidade',
      'curso',
      'alura',
      'udemy',
      'livraria',
    ],
  },
  {
    nome: 'lazer',
    termos: [
      'cinema',
      'ingresso',
      'ingressos',
      'teatro',
      'steam',
      'playstation',
      'xbox',
      'nintendo',
      'show',
    ],
  },
  { nome: 'transferências', termos: ['pix', 'ted', 'doc', 'transferencia', 'transf'] },
];

/** G3: uma categoria da COWORKIA_FINANCAS_CATEGORIAS. */
export interface CategoriaDoUsuario {
  nome: string;
  termos: string[];
}

export interface CategoriasDoUsuario {
  categorias: CategoriaDoUsuario[];
  /** G3: o número de cada item ignorado, a partir de 1. */
  ignoradas: number[];
}

/** O que a G2 olha num lançamento. */
export interface ParaCategorizar {
  descricao: string;
  centavos: number;
  tipo: TipoDeConta;
}

/** G3: os nomes são comparados sem os espaços das pontas, depois da N1 e da N2. */
function comparavel(nome: string): string {
  return semAcentos(nome.trim().toLowerCase());
}

/** G3: o nome do usuário igual ao de uma categoria fixa, ou ao "outros" da G1, é essa categoria. */
const NOMES_FIXOS = new Map(
  [PAGAMENTO_DA_FATURA, ...CATEGORIAS_FIXAS.map((categoria) => categoria.nome), OUTROS].map(
    (nome) => [comparavel(nome), nome],
  ),
);

export function mesmaCategoria(a: string, b: string): boolean {
  return comparavel(a) === comparavel(b);
}

/** G1: a descrição pela N1, pela N2 e pela N4, sem a N3, que apagaria "WWW.NETFLIX.COM". */
export function textoDaCategoria(descricao: string): string {
  return semAcentos(descricao.toLowerCase());
}

/** G3: lê a variável; um item sem "=", sem nome ou sem nenhum termo é ignorado. */
export function lerCategoriasDoUsuario(valor: string): CategoriasDoUsuario {
  const categorias: CategoriaDoUsuario[] = [];
  const ignoradas: number[] = [];
  if (valor.trim() === '') {
    return { categorias, ignoradas };
  }
  // G3 e #126: os nomes iguais pela N1 e pela N2 são a mesma categoria, com a grafia da fixa ou,
  // sem ela, a do primeiro item que usou o nome.
  const grafias = new Map(NOMES_FIXOS);
  for (const [indice, item] of valor.split(';').entries()) {
    const igual = item.indexOf('=');
    const nome = igual < 0 ? '' : item.slice(0, igual).trim();
    const termos =
      igual < 0
        ? []
        : item
            .slice(igual + 1)
            .split(',')
            .map((termo) => termo.trim())
            .filter((termo) => termo !== '');
    if (nome === '' || termos.length === 0) {
      ignoradas.push(indice + 1);
    } else {
      const grafia = grafias.get(comparavel(nome)) ?? nome;
      grafias.set(comparavel(nome), grafia);
      categorias.push({ nome: grafia, termos });
    }
  }
  return { categorias, ignoradas };
}

/** G2.1: uma saída na conta ou uma entrada no cartão. */
function podeSerFatura(lancamento: ParaCategorizar): boolean {
  return (
    (lancamento.tipo === 'conta' && lancamento.centavos < 0) ||
    (lancamento.tipo === 'cartao' && lancamento.centavos > 0)
  );
}

/** G1 a G3: a primeira que casar decide; as do usuário vêm antes das fixas. */
export function categoriaDe(
  lancamento: ParaCategorizar,
  doUsuario: readonly CategoriaDoUsuario[],
): string {
  const texto = textoDaCategoria(lancamento.descricao);
  // G1, G3 e #126: o termo passa pela mesma normalização da descrição, sem a N3.
  const casa = (termos: readonly string[]) =>
    termos.some((termo) => contemTermo(texto, termo, textoDaCategoria));
  for (const doUsuarioAgora of doUsuario) {
    if (doUsuarioAgora.nome === PAGAMENTO_DA_FATURA && !podeSerFatura(lancamento)) {
      continue;
    }
    if (doUsuarioAgora.nome === RENDA && lancamento.centavos <= 0) {
      continue;
    }
    if (casa(doUsuarioAgora.termos)) {
      return doUsuarioAgora.nome;
    }
  }
  if (podeSerFatura(lancamento)) {
    const termos = lancamento.tipo === 'conta' ? FATURA_NA_CONTA : FATURA_NO_CARTAO;
    if (casa(termos)) {
      return PAGAMENTO_DA_FATURA;
    }
  }
  for (const fixa of CATEGORIAS_FIXAS) {
    if (fixa.nome === RENDA && lancamento.centavos <= 0) {
      continue;
    }
    if (casa(fixa.termos)) {
      return fixa.nome;
    }
  }
  return OUTROS;
}
