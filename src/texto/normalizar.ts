const ENDERECO_WEB = /(?:https?:\/\/|www\.)\S+/giu;
const PALAVRA = /[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu;

/** N2: tira os acentos. */
export function semAcentos(texto: string): string {
  return texto.normalize('NFD').replace(/\p{M}/gu, '');
}

/** N1 a N3: tira os endereços web, passa para minúscula e tira os acentos. */
export function normalizar(texto: string): string {
  return semAcentos(texto.replace(ENDERECO_WEB, ' ').toLowerCase());
}

/** N4: letras ou dígitos, com hífen ou apóstrofo no meio. */
export function palavras(texto: string): string[] {
  return texto.match(PALAVRA) ?? [];
}

function sequenciaEm(lista: readonly string[], alvo: readonly string[], inicio: number): boolean {
  return alvo.every((palavra, deslocamento) => lista[inicio + deslocamento] === palavra);
}

/** N5: o termo casa quando as suas palavras aparecem em sequência, inteiras. */
export function contemTermo(textoNormalizado: string, termo: string): boolean {
  const alvo = palavras(normalizar(termo));
  if (alvo.length === 0) {
    return false;
  }
  const lista = palavras(textoNormalizado);
  for (let inicio = 0; inicio + alvo.length <= lista.length; inicio += 1) {
    if (sequenciaEm(lista, alvo, inicio)) {
      return true;
    }
  }
  return false;
}

export function comecaComTermo(textoNormalizado: string, termo: string): boolean {
  const alvo = palavras(normalizar(termo));
  return alvo.length > 0 && sequenciaEm(palavras(textoNormalizado), alvo, 0);
}

export function primeiroTermo(textoNormalizado: string, termos: readonly string[]): string | null {
  for (const termo of termos) {
    if (contemTermo(textoNormalizado, termo)) {
      return termo;
    }
  }
  return null;
}
