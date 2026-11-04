import { describe, expect, it } from 'vitest';
import { htmlParaTexto } from '../../src/texto/html.js';

const SEM_CORTE = { cortarCitacao: false };
const COM_CORTE = { cortarCitacao: true };

describe('htmlParaTexto (seção 9)', () => {
  it('passo 1: tira comentário, script, style e head, com o conteúdo', () => {
    const html =
      '<head><title>t</title></head><!-- oculto --><style>p{}</style><script>alert(1)</script><p>ok</p>';
    expect(htmlParaTexto(html, SEM_CORTE)).toBe('ok');
  });

  it('passo 2: com o corte pedido, descarta a partir do primeiro blockquote', () => {
    const html = '<p>Resposta</p><blockquote>URGENTE até 05/11</blockquote>';
    expect(htmlParaTexto(html, COM_CORTE)).toBe('Resposta');
    expect(htmlParaTexto(html, SEM_CORTE)).toBe('Resposta\nURGENTE até 05/11');
  });

  it('passo 2: com o corte pedido, descarta a partir do gmail_quote', () => {
    const html = '<div>Oi</div><div class="gmail_quote gmail_quote_container">urgente</div>';
    expect(htmlParaTexto(html, COM_CORTE)).toBe('Oi');
  });

  it('passo 3: fechamento de tr e de h1 a h6 vira quebra de linha', () => {
    const html = '<table><tr><td>a</td></tr><tr><td>b</td></tr></table><h1>t</h1><h6>u</h6>';
    expect(htmlParaTexto(html, SEM_CORTE)).toBe('a\nb\nt\nu');
  });

  it('passo 3: br e fechamento de bloco viram quebra de linha', () => {
    expect(htmlParaTexto('<div>a<br>b<br/>c</div><p>d</p><ul><li>e</li></ul>', SEM_CORTE)).toBe(
      'a\nb\nc\nd\ne',
    );
  });

  it('passo 5: decodifica entidades nomeadas e numéricas', () => {
    expect(htmlParaTexto('&aacute;&#233;&#xE9; &amp; &lt;b&gt;', SEM_CORTE)).toBe('áéé & <b>');
  });

  it('passo 6: tira os espaços das pontas e junta 3 ou mais quebras em 2', () => {
    expect(htmlParaTexto('<p>  a  </p><br><br><br><p>b</p>', SEM_CORTE)).toBe('a\n\nb');
  });
});
