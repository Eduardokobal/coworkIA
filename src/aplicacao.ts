import type { Config } from './config.js';
import { carregarDadosDemo } from './fontes/demo/dados.js';
import { criarFontesDemo } from './fontes/demo/fonte-demo.js';
import type { Dependencias } from './servico.js';
import { relogioDoSistema, relogioFixo } from './tempo.js';

/** RQ2, AD1 e AD4: liga a configuração ao relógio e às fontes. */
export function criarDependencias(config: Config, pastaDemo: string): Dependencias {
  if (config.modo === 'google') {
    throw new Error(
      'O modo google ainda não está disponível nesta versão. Use COWORKIA_MODO=demo.',
    );
  }
  const relogio =
    config.agora === null ? relogioDoSistema(config.fuso) : relogioFixo(config.agora, config.fuso);
  const fontes = criarFontesDemo(carregarDadosDemo(pastaDemo, relogio()), config.fuso);
  return { fontes, relogio, fuso: config.fuso, importantes: config.importantes };
}
