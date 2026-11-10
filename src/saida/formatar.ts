import type { Categoria, Evento, MensagemWhatsapp, Pessoa } from '../dominio.js';
import type { AvisoDoExtrato } from '../fontes/financas/fonte-financas.js';
import { bloqueiaAgenda, ehDiaInteiro, intervaloDoEvento } from '../regras/disponibilidade.js';
import type { Totais } from '../regras/resumo-financeiro.js';
import type { EmailClassificado } from '../regras/triagem.js';
import type { CategoriaWhatsapp, ConversaClassificada } from '../regras/triagem-whatsapp.js';
import type {
  ConversaLida,
  ListaDeConversas,
  ListaDeLancamentos,
  ResultadoTriagem,
  ResultadoTriagemWhatsapp,
  ResumoDoDia,
  ResumoFinanceiro,
} from '../servico.js';
import { lerDataHora, paraIso } from '../tempo.js';
import { type Campo, marcar, type Origem, prepararTexto } from './terceiros.js';

/** Nas ferramentas, os campos de terceiros saem marcados; no terminal, só preparados (S2). */
export interface Saida {
  marcar: boolean;
  chave: string;
}

export const SAIDA_DO_TERMINAL: Saida = { marcar: false, chave: '' };
export const AVISO_DE_PARCIAL = 'parcial: analisados os 200 mais recentes da janela';
export const SEM_COMPROMISSOS = 'sem compromissos pela frente hoje';

const MINHA_RESPOSTA = {
  accepted: 'aceito',
  declined: 'recusado',
  tentative: 'talvez',
  needsAction: 'sem resposta',
} as const;

function campo(
  valor: string,
  tipo: Campo,
  origem: Origem,
  id: string,
  saida: Saida,
  html = false,
): string {
  const { texto } = prepararTexto(valor, tipo, { html });
  if (!saida.marcar || texto === '') {
    return texto;
  }
  return marcar(texto, origem, id, saida.chave);
}

function pessoa(dados: Pessoa, origem: Origem, id: string, saida: Saida) {
  return {
    nome: campo(dados.nome, 'nome', origem, id, saida),
    endereco: campo(dados.endereco, 'endereco', origem, id, saida),
  };
}

function contar(resultado: ResultadoTriagem): Record<Categoria, number> {
  return {
    urgente: resultado.grupos.urgente.length,
    pede_resposta: resultado.grupos.pede_resposta.length,
    informativo: resultado.grupos.informativo.length,
    propaganda: resultado.grupos.propaganda.length,
  };
}

/** 7.1 */
export function emailResumido(item: EmailClassificado, fuso: string, saida: Saida) {
  const { email, classificacao } = item;
  const corpo = email.corpoTexto ?? email.corpoHtml ?? '';
  return {
    id: email.id,
    remetente: pessoa(email.de, 'email', email.id, saida),
    assunto: campo(email.assunto, 'assunto', 'email', email.id, saida),
    data: paraIso(lerDataHora(email.data, fuso)),
    trecho: campo(corpo, 'trecho', 'email', email.id, saida, email.corpoTexto === null),
    lido: email.lido,
    tem_anexo: email.temAnexo,
    categoria: classificacao.categoria,
    motivos: classificacao.motivos,
  };
}

/** 7.2: o HTML vira texto sem cortar a citação, e o corte de 20.000 é avisado. */
export function emailCompleto(item: EmailClassificado, fuso: string, saida: Saida) {
  const { email } = item;
  const corpo = prepararTexto(email.corpoTexto ?? email.corpoHtml ?? '', 'corpo', {
    html: email.corpoTexto === null,
  });
  return {
    ...emailResumido(item, fuso, saida),
    para: email.para.map((dados) => pessoa(dados, 'email', email.id, saida)),
    cc: email.cc.map((dados) => pessoa(dados, 'email', email.id, saida)),
    corpo:
      saida.marcar && corpo.texto !== ''
        ? marcar(corpo.texto, 'email', email.id, saida.chave)
        : corpo.texto,
    corpo_cortado: corpo.cortado,
    aviso: corpo.cortado ? 'O corpo foi cortado em 20.000 caracteres.' : null,
  };
}

/** 7.3 */
export function triagemParaSaida(resultado: ResultadoTriagem, fuso: string, saida: Saida) {
  const lista = (itens: EmailClassificado[]) =>
    itens.map((item) => emailResumido(item, fuso, saida));
  return {
    contagem: contar(resultado),
    analisados: resultado.analisados,
    completo: resultado.completo,
    aviso: resultado.completo ? null : AVISO_DE_PARCIAL,
    grupos: {
      urgente: lista(resultado.grupos.urgente),
      pede_resposta: lista(resultado.grupos.pede_resposta),
      informativo: lista(resultado.grupos.informativo),
      propaganda: lista(resultado.grupos.propaganda),
    },
  };
}

/** 7.4, AD8 e AD18 */
export function eventoParaSaida(evento: Evento, fuso: string, saida: Saida) {
  const { inicio, fim } = intervaloDoEvento(evento, fuso);
  return {
    id: evento.id,
    titulo: campo(evento.titulo, 'titulo', 'agenda', evento.id, saida),
    inicio: paraIso(inicio),
    fim: paraIso(fim),
    dia_inteiro: ehDiaInteiro(evento),
    local: campo(evento.local, 'local', 'agenda', evento.id, saida),
    descricao: campo(evento.descricao, 'descricao', 'agenda', evento.id, saida),
    organizador:
      evento.organizador === null ? null : pessoa(evento.organizador, 'agenda', evento.id, saida),
    status: evento.status,
    minha_resposta: evento.minhaResposta === null ? null : MINHA_RESPOSTA[evento.minhaResposta],
    ocupado: bloqueiaAgenda(evento),
  };
}

/** 7.7, nas ferramentas */
export function resumoParaSaida(resumo: ResumoDoDia, fuso: string, saida: Saida) {
  const itens = (lista: EmailClassificado[]) =>
    lista.map(({ email, classificacao }) => ({
      id: email.id,
      assunto: campo(email.assunto, 'assunto', 'email', email.id, saida),
      remetente: pessoa(email.de, 'email', email.id, saida),
      motivo: classificacao.motivos.join('; '),
    }));
  const proximo = resumo.proximoCompromisso;
  return {
    data: resumo.hoje.toISODate(),
    triagem: {
      contagem: contar(resumo.triagem),
      analisados: resumo.triagem.analisados,
      completo: resumo.triagem.completo,
      aviso: resumo.triagem.completo ? null : AVISO_DE_PARCIAL,
    },
    urgentes: itens(resumo.triagem.grupos.urgente),
    pede_resposta: itens(resumo.triagem.grupos.pede_resposta),
    eventos_de_hoje: resumo.eventosDeHoje.map((evento) => eventoParaSaida(evento, fuso, saida)),
    conflitos: resumo.conflitos.map(([a, b]) => [a.id, b.id]),
    proximo_compromisso: proximo === null ? null : eventoParaSaida(proximo, fuso, saida),
    aviso_proximo: proximo === null ? SEM_COMPROMISSOS : null,
    whatsapp: whatsappDoResumo(resumo.whatsapp, saida),
  };
}

function horario(evento: Evento, fuso: string): string {
  if (ehDiaInteiro(evento)) {
    return 'dia inteiro';
  }
  const { inicio, fim } = intervaloDoEvento(evento, fuso);
  return `${inicio.toFormat('HH:mm')}-${fim.toFormat('HH:mm')}`;
}

function situacao(evento: Evento): string {
  if (evento.status === 'cancelled') {
    return ' (cancelado)';
  }
  if (evento.minhaResposta === 'declined') {
    return ' (recusado)';
  }
  return evento.transparencia === 'transparent' ? ' (livre)' : '';
}

/** 7.7 no terminal: os passos 1 a 5 da S2, sem a marcação. */
export function resumoParaTexto(resumo: ResumoDoDia, fuso: string): string {
  const texto = (valor: string, tipo: Campo) => prepararTexto(valor, tipo).texto;
  const contagem = contar(resumo.triagem);
  const linhas = [
    `Resumo do dia ${resumo.hoje.toFormat('dd/MM/yyyy')}`,
    '',
    `Triagem das últimas 24 horas: ${contagem.urgente} urgentes, ${contagem.pede_resposta} pedem resposta, ${contagem.informativo} informativos e ${contagem.propaganda} propagandas (${resumo.triagem.analisados} analisados).`,
  ];
  if (!resumo.triagem.completo) {
    linhas.push(AVISO_DE_PARCIAL);
  }
  const listar = (titulo: string, itens: EmailClassificado[]) => {
    linhas.push('', titulo);
    if (itens.length === 0) {
      linhas.push('- nenhum');
    }
    for (const { email, classificacao } of itens) {
      linhas.push(
        `- ${texto(email.assunto, 'assunto')} (${texto(email.de.nome, 'nome')} <${texto(email.de.endereco, 'endereco')}>): ${classificacao.motivos.join('; ')}`,
      );
    }
  };
  listar('Urgentes:', resumo.triagem.grupos.urgente);
  listar('Pedem resposta:', resumo.triagem.grupos.pede_resposta);
  linhas.push('', 'Agenda de hoje:');
  if (resumo.eventosDeHoje.length === 0) {
    linhas.push('- nenhum evento');
  }
  for (const evento of resumo.eventosDeHoje) {
    linhas.push(`- ${horario(evento, fuso)} ${texto(evento.titulo, 'titulo')}${situacao(evento)}`);
  }
  linhas.push('', 'Conflitos:');
  if (resumo.conflitos.length === 0) {
    linhas.push('- nenhum');
  }
  for (const [a, b] of resumo.conflitos) {
    linhas.push(`- ${texto(a.titulo, 'titulo')} e ${texto(b.titulo, 'titulo')}`);
  }
  const proximo = resumo.proximoCompromisso;
  linhas.push(
    '',
    proximo === null
      ? `Próximo compromisso: ${SEM_COMPROMISSOS}`
      : `Próximo compromisso: ${intervaloDoEvento(proximo, fuso).inicio.toFormat('HH:mm')} ${texto(proximo.titulo, 'titulo')}`,
  );
  linhas.push(...linhasDoWhatsapp(resumo.whatsapp));
  return linhas.join('\n');
}

/** Versão 2: uma mensagem, com o autor e o texto de terceiros (RW2 e SW1). */
function mensagemParaSaida(mensagem: MensagemWhatsapp, id: string, saida: Saida, tipo: Campo) {
  return {
    autor: campo(mensagem.autor, 'nome', 'whatsapp', id, saida),
    data: mensagem.data,
    texto: campo(mensagem.texto, tipo, 'whatsapp', id, saida),
  };
}

function contarWhatsapp(resultado: ResultadoTriagemWhatsapp): Record<CategoriaWhatsapp, number> {
  return {
    urgente: resultado.grupos.urgente.length,
    pede_resposta: resultado.grupos.pede_resposta.length,
    informativo: resultado.grupos.informativo.length,
  };
}

/** Versão 2, 7.10: os motivos não têm texto de terceiros; o autor e a data vão no trecho. */
function conversaClassificadaParaSaida(item: ConversaClassificada, saida: Saida) {
  const id = item.conversa.id;
  return {
    id,
    nome: campo(item.conversa.nome, 'nome', 'whatsapp', id, saida),
    grupo: item.grupo,
    esperando_voce: item.bloco.length,
    motivos: item.motivos,
    trecho: item.trecho === null ? null : mensagemParaSaida(item.trecho, id, saida, 'trecho'),
  };
}

/** Versão 2, 7.8 */
export function conversasParaSaida(lista: ListaDeConversas, saida: Saida) {
  return {
    conversas: lista.conversas.map((item) => ({
      id: item.conversa.id,
      nome: campo(item.conversa.nome, 'nome', 'whatsapp', item.conversa.id, saida),
      grupo: item.grupo,
      ultima_mensagem: item.ultima?.data ?? null,
      mensagens: item.conversa.mensagens.length,
      esperando_voce: item.esperandoVoce,
    })),
    avisos: lista.avisos.map((aviso) => ({
      conversa: aviso.nome === null ? null : campo(aviso.nome, 'nome', 'whatsapp', 'pasta', saida),
      aviso: aviso.texto,
    })),
  };
}

/** Versão 2, 7.9 */
export function conversaLidaParaSaida(lida: ConversaLida, saida: Saida) {
  const id = lida.conversa.id;
  return {
    id,
    nome: campo(lida.conversa.nome, 'nome', 'whatsapp', id, saida),
    mensagens: lida.mensagens.map((mensagem) => ({
      ...mensagemParaSaida(mensagem, id, saida, 'corpo'),
      sua: mensagem.sua,
    })),
    completo: lida.completo,
  };
}

/** Versão 2, 7.10 */
export function triagemWhatsappParaSaida(resultado: ResultadoTriagemWhatsapp, saida: Saida) {
  const itens = (lista: ConversaClassificada[]) =>
    lista.map((item) => conversaClassificadaParaSaida(item, saida));
  return {
    contagem: contarWhatsapp(resultado),
    analisadas: resultado.analisadas,
    urgente: itens(resultado.grupos.urgente),
    pede_resposta: itens(resultado.grupos.pede_resposta),
    informativo: itens(resultado.grupos.informativo),
  };
}

/** Versão 2, 7.7: a seção do WhatsApp, ou o aviso do que falta configurar (F1). */
function whatsappDoResumo(whatsapp: ResultadoTriagemWhatsapp | string, saida: Saida) {
  if (typeof whatsapp === 'string') {
    return { aviso: whatsapp };
  }
  const itens = (lista: ConversaClassificada[]) =>
    lista.map((item) => conversaClassificadaParaSaida(item, saida));
  return {
    contagem: contarWhatsapp(whatsapp),
    analisadas: whatsapp.analisadas,
    urgentes: itens(whatsapp.grupos.urgente),
    pede_resposta: itens(whatsapp.grupos.pede_resposta),
  };
}

/** Versão 2, 7.7 no terminal: os passos 1 a 5 da S2, sem a marcação, com o trecho numa linha só. */
function linhasDoWhatsapp(whatsapp: ResultadoTriagemWhatsapp | string): string[] {
  if (typeof whatsapp === 'string') {
    return ['', `WhatsApp: ${whatsapp}`];
  }
  const texto = (valor: string, tipo: Campo) => prepararTexto(valor, tipo).texto;
  const contagem = contarWhatsapp(whatsapp);
  const linhas = [
    '',
    `WhatsApp das últimas 24 horas: ${contagem.urgente} urgentes, ${contagem.pede_resposta} pedem resposta e ${contagem.informativo} informativos (${whatsapp.analisadas} conversas analisadas).`,
  ];
  const listar = (titulo: string, itens: ConversaClassificada[]) => {
    linhas.push('', titulo);
    if (itens.length === 0) {
      linhas.push('- nenhuma');
    }
    for (const item of itens) {
      const trecho =
        item.trecho === null
          ? ''
          : ` (${texto(item.trecho.autor, 'nome')}: ${texto(item.trecho.texto, 'trecho').replace(/\s+/g, ' ')})`;
      linhas.push(`- ${texto(item.conversa.nome, 'nome')}: ${item.motivos.join('; ')}${trecho}`);
    }
  };
  listar('Urgentes no WhatsApp:', whatsapp.grupos.urgente);
  listar('Pedem resposta no WhatsApp:', whatsapp.grupos.pede_resposta);
  return linhas;
}

/** Versão 2, parte 2, 7.11: reais, com o sinal, sem separador de milhar, com vírgula e 2 casas. */
export function emReais(centavos: number | bigint): string {
  const valor = BigInt(centavos);
  const absoluto = valor < 0n ? -valor : valor;
  const resto = String(absoluto % 100n).padStart(2, '0');
  return `${valor < 0n ? '-' : ''}${absoluto / 100n},${resto}`;
}

/** Versão 2, parte 2, E4: o nome do arquivo passa pela S2, com o id "pasta". */
function avisosDoExtrato(avisos: readonly AvisoDoExtrato[], saida: Saida) {
  return avisos.map((aviso) => ({
    arquivo: aviso.nome === null ? null : campo(aviso.nome, 'nome', 'extrato', 'pasta', saida),
    aviso: aviso.texto,
  }));
}

/** Versão 2, parte 2, 7.11: a descrição como um assunto, marcada com o id da conta. */
export function lancamentosParaSaida(lista: ListaDeLancamentos, saida: Saida) {
  return {
    lancamentos: lista.lancamentos.map((lancamento) => ({
      conta: { id: lancamento.conta.id, rotulo: lancamento.conta.rotulo },
      data: lancamento.data,
      valor: emReais(lancamento.centavos),
      descricao: campo(lancamento.descricao, 'assunto', 'extrato', lancamento.conta.id, saida),
      categoria: lancamento.categoria,
    })),
    completo: lista.completo,
    avisos: avisosDoExtrato(lista.avisos, saida),
  };
}

function totaisEmReais(totais: Totais) {
  return { entradas: emReais(totais.entradas), saidas: emReais(totais.saidas) };
}

/** Versão 2, parte 2, 7.12: as saídas sem o sinal, e o saldo com o sinal. */
export function resumoFinanceiroParaSaida(resumo: ResumoFinanceiro, saida: Saida) {
  return {
    mes: resumo.mes,
    entradas: emReais(resumo.entradas),
    saidas: emReais(resumo.saidas),
    categorias: resumo.categorias.map((item) => ({
      categoria: item.categoria,
      ...totaisEmReais(item),
    })),
    pagamento_da_fatura: totaisEmReais(resumo.pagamentoDaFatura),
    investimentos: totaisEmReais(resumo.investimentos),
    contas: resumo.contas.map((item) => ({
      id: item.conta.id,
      rotulo: item.conta.rotulo,
      ...totaisEmReais(item),
      saldo: item.conta.saldo === null ? null : emReais(item.conta.saldo.centavos),
      data_do_saldo: item.conta.saldo?.data ?? null,
      dados_ate: item.conta.dadosAte,
    })),
    lancamentos: resumo.lancamentos,
    avisos: avisosDoExtrato(resumo.avisos, saida),
  };
}
