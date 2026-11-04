const CABECALHO_DE_CITACAO = /^(?:em .+,.+ escreveu:|on .+,.+ wrote:)$/i;

/** Tira as linhas que começam com ">" e tudo o que vem depois do "Em …, … escreveu:". */
export function semCitacao(texto: string): string {
  const mantidas: string[] = [];
  for (const linha of texto.split(/\r?\n/)) {
    const aparada = linha.trim();
    if (CABECALHO_DE_CITACAO.test(aparada)) {
      break;
    }
    if (!aparada.startsWith('>')) {
      mantidas.push(linha);
    }
  }
  return mantidas.join('\n');
}
