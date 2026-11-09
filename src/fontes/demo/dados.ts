import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { DateTime } from 'luxon';
import { z } from 'zod';
import { esquemaEventoDaApi, eventoDaApi } from '../calendar-api.js';
import { criarFonteWhatsapp, type FonteWhatsapp } from '../whatsapp/fonte-whatsapp.js';
import type { DadosDemo } from './fonte-demo.js';
import { resolverModelos, resolverObjeto } from './modelos.js';

const esquemaPessoa = z.object({ nome: z.string(), endereco: z.string() });

const esquemaEmail = z.object({
  id: z.string(),
  de: esquemaPessoa,
  para: z.array(esquemaPessoa),
  cc: z.array(esquemaPessoa),
  assunto: z.string(),
  data: z.string(),
  corpoTexto: z.string().nullable(),
  corpoHtml: z.string().nullable(),
  cabecalhos: z.record(z.string(), z.string()),
  lido: z.boolean(),
  temAnexo: z.boolean(),
});

/**
 * Seção 10: lê os JSON, troca os modelos pelo relógio e valida.
 * Os eventos vêm no formato da Calendar API, pela mesma conversão que o modo google vai usar.
 */
export function carregarDadosDemo(pasta: string, agora: DateTime): DadosDemo {
  const ler = (arquivo: string): unknown =>
    resolverObjeto(JSON.parse(readFileSync(join(pasta, arquivo), 'utf8')), agora);
  return {
    emails: z.array(esquemaEmail).parse(ler('emails.json')),
    eventos: z.array(esquemaEventoDaApi).parse(ler('eventos.json')).map(eventoDaApi),
  };
}

/** Versão 2, V2: o usuário da demonstração é fixo, e a COWORKIA_WHATSAPP_EU não é lida. */
export const EU_DA_DEMONSTRACAO: readonly string[] = ['Lúcia Prado', 'Lúcia'];

/** Versão 2, F1 e seção 9: as conversas da demonstração, com os modelos trocados pelo relógio. */
export function fonteWhatsappDemo(pasta: string, agora: DateTime, fuso: string): FonteWhatsapp {
  return criarFonteWhatsapp({
    pasta: join(pasta, 'whatsapp'),
    fuso,
    preparar: (texto) => resolverModelos(texto, agora),
  });
}
