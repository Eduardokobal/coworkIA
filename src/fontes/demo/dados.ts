import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { DateTime } from 'luxon';
import { z } from 'zod';
import { esquemaEventoDaApi, eventoDaApi } from '../calendar-api.js';
import type { DadosDemo } from './fonte-demo.js';
import { resolverObjeto } from './modelos.js';

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
