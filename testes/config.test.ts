import { describe, expect, it } from 'vitest';
import { lerConfig } from '../src/config.js';

describe('lerConfig (seção 8, AD1 e versão 2, F1, V1 e W3)', () => {
  it('sem variáveis, usa o modo demo, o fuso de São Paulo, nenhum importante e o relógio do sistema', () => {
    expect(lerConfig({})).toEqual({
      modo: 'demo',
      fuso: 'America/Sao_Paulo',
      importantes: [],
      agora: null,
      whatsappPasta: null,
      whatsappEu: [],
      whatsappImportantes: [],
    });
  });

  it('lê o modo, o fuso, os importantes, o agora e as variáveis do WhatsApp', () => {
    expect(
      lerConfig({
        COWORKIA_MODO: 'google',
        COWORKIA_FUSO: 'Asia/Tokyo',
        COWORKIA_IMPORTANTES: ' chefe@example.com, ,diretoria@example.org ',
        COWORKIA_AGORA: '2026-11-04T10:30',
        COWORKIA_WHATSAPP_PASTA: ' C:/conversas ',
        COWORKIA_WHATSAPP_EU: 'Lúcia Prado, Lúcia',
        COWORKIA_WHATSAPP_IMPORTANTES: 'Marta Souza',
      }),
    ).toEqual({
      modo: 'google',
      fuso: 'Asia/Tokyo',
      importantes: ['chefe@example.com', 'diretoria@example.org'],
      agora: '2026-11-04T10:30',
      whatsappPasta: 'C:/conversas',
      whatsappEu: ['Lúcia Prado', 'Lúcia'],
      whatsappImportantes: ['Marta Souza'],
    });
  });

  it('recusa um modo desconhecido', () => {
    expect(() => lerConfig({ COWORKIA_MODO: 'outlook' })).toThrow('COWORKIA_MODO inválido');
  });

  it('recusa um fuso que não existe', () => {
    expect(() => lerConfig({ COWORKIA_FUSO: 'Brasil/Centro' })).toThrow('COWORKIA_FUSO inválido');
  });
});
