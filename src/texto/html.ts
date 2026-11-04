import { decodeHTML } from 'entities';

export interface OpcoesHtml {
  /** Na triagem, sim; no ler_email, não. */
  cortarCitacao: boolean;
}

const INICIO_DE_CITACAO = /<blockquote\b|<[a-z][^>]*\bclass\s*=\s*["'][^"']*gmail_quote/i;

export function htmlParaTexto(html: string, opcoes: OpcoesHtml): string {
  let texto = html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<(script|style|head)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, '');
  if (opcoes.cortarCitacao) {
    const inicio = texto.search(INICIO_DE_CITACAO);
    if (inicio >= 0) {
      texto = texto.slice(0, inicio);
    }
  }
  texto = texto
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(?:p|div|li|tr|h[1-6])\s*>/gi, '\n')
    .replace(/<[^>]*>/g, '');
  texto = decodeHTML(texto);
  return texto
    .split('\n')
    .map((linha) => linha.trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
