import { describe, expect, it } from 'vitest';
import { resolverModelos, resolverObjeto } from '../../src/fontes/demo/modelos.js';
import { relogioFixo } from '../../src/tempo.js';

// Com segundos, para provar que o dia com hora começa do zero, e não do agora.
const agora = relogioFixo('2026-11-04T10:30:15', 'America/Sao_Paulo')();

describe('resolverModelos (seção 10 e AD2)', () => {
  it('troca o dia com hora pela data e hora ISO no fuso', () => {
    expect(resolverModelos('{{dia-1 09:00}}', agora)).toBe('2026-11-03T09:00:00-03:00');
    expect(resolverModelos('{{dia+0 14:30}}', agora)).toBe('2026-11-04T14:30:00-03:00');
  });

  it('troca o dia sem hora pela data, para o dia inteiro', () => {
    expect(resolverModelos('{{dia+2}}', agora)).toBe('2026-11-06');
  });

  it('troca o dia com formato dentro de um texto', () => {
    expect(resolverModelos('até {{dia+2:dd/mm}} ou {{dia-1:dd/mm/aaaa}}.', agora)).toBe(
      'até 06/11 ou 03/11/2026.',
    );
  });

  it('troca o agora com horas ou minutos', () => {
    expect(resolverModelos('{{agora-3h}}', agora)).toBe('2026-11-04T07:30:15-03:00');
    expect(resolverModelos('{{agora-90min}}', agora)).toBe('2026-11-04T09:00:15-03:00');
    expect(resolverModelos('{{agora+1h}}', agora)).toBe('2026-11-04T11:30:15-03:00');
  });

  it('troca o código pelo caractere, sem guardar invisível no arquivo', () => {
    expect(resolverModelos('<{{U+200B}}<<', agora)).toBe(`<${String.fromCodePoint(0x200b)}<<`);
    expect(resolverModelos('{{U+FF1C}}{{U+001B}}', agora)).toBe(String.fromCodePoint(0xff1c, 0x1b));
  });

  it('troca o agora pelo formato da exportação do WhatsApp (versão 2, seção 9)', () => {
    expect(resolverModelos('{{agora-90min:android}} - Ana: oi', agora)).toBe(
      '04/11/2026 09:00 - Ana: oi',
    );
    expect(resolverModelos('[{{agora-2h:iphone}}] Ana: oi', agora)).toBe(
      '[04/11/2026, 08:30:15] Ana: oi',
    );
    expect(() => resolverModelos('{{agora-2h:windows}}', agora)).toThrow('modelo desconhecido');
  });

  it('troca o dia pelo formato do OFX (versão 2, parte 2, seção 8)', () => {
    expect(resolverModelos('<DTPOSTED>{{dia-3:ofx}}120000[-3:BRT]', agora)).toBe(
      '<DTPOSTED>20261101120000[-3:BRT]',
    );
    expect(resolverModelos('{{dia+0:ofx}}', agora)).toBe('20261104');
    expect(() => resolverModelos('{{dia-3:OFX}}', agora)).toThrow('modelo desconhecido');
  });

  it('recusa um modelo desconhecido', () => {
    expect(() => resolverModelos('{{amanha}}', agora)).toThrow('modelo desconhecido');
  });
});

describe('resolverObjeto', () => {
  it('troca os modelos em todos os textos, sem mexer no resto', () => {
    expect(
      resolverObjeto({ a: '{{dia+1}}', b: [1, '{{agora+1h}}'], c: null, d: true }, agora),
    ).toEqual({ a: '2026-11-05', b: [1, '2026-11-04T11:30:15-03:00'], c: null, d: true });
  });
});
