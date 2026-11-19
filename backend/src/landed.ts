// METODOLOGIA KUPECH DE IMPORTAÇÃO: 3 etapas. Este arquivo define os campos de cada etapa, a validação e o cálculo do Landed Cost.
export type Dados = Record<string, string>;
export interface Linha { rotulo: string; valor: number }
export interface Grupo { etapa: 1 | 2 | 3; titulo: string; linhas: Linha[] }
export interface Resultado { total: number; unitario: number; valorAduaneiro: number; grupos: Grupo[]; obrigacoes: string[] }
export interface Campo {
  k: string; grupo: 'entrada' | 'fixos' | 'cond'; label: string; etapa: 1 | 2 | 3; tipo: 'texto' | 'num' | 'sel' | 'tabela' | 'categoria' | 'moeda';
  op?: string[]; obrig?: boolean; pos?: boolean; quando?: { k: string; valor: string }; dica?: string; taxa?: boolean;
}

export const UFS = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];
export const FRETE_INCLUSO = ['CFR', 'CIF', 'CPT', 'CIP', 'DAP'];
export const SEGURO_INCLUSO = ['CIF', 'CIP'];

export const CAMPOS: Campo[] = [
  // ETAPA 1: PRODUTO E ORIGEM (pré-embarque)
  { k: 'categoria', grupo: 'entrada', label: 'Categoria', etapa: 1, tipo: 'categoria' },
  { k: 'descricao', grupo: 'entrada', label: 'Produto', etapa: 1, tipo: 'texto' },
  { k: 'exportador', grupo: 'entrada', label: 'Fornecedor', etapa: 1, tipo: 'texto' },
  { k: 'ncm', grupo: 'entrada', label: 'NCM', etapa: 1, tipo: 'texto' },
  { k: 'pais', grupo: 'entrada', label: 'País de origem', etapa: 1, tipo: 'texto' },
  { k: 'valorFob', grupo: 'entrada', label: 'Valor FOB (moeda estrangeira)', etapa: 1, tipo: 'num', pos: true },
  { k: 'moeda', grupo: 'entrada', label: 'Moeda', etapa: 1, tipo: 'moeda' },
  { k: 'quantidade', grupo: 'entrada', label: 'Quantidade', etapa: 1, tipo: 'num', pos: true },
  { k: 'incoterm', grupo: 'entrada', label: 'Incoterm', etapa: 1, tipo: 'sel', op: ['EXW', 'FCA', 'FOB', 'CFR', 'CIF', 'CPT', 'CIP', 'DAP'] },
  { k: 'cambio', grupo: 'entrada', label: 'Cotação cambial (R$)', etapa: 1, tipo: 'num', pos: true, dica: 'Preenchida pela moeda escolhida; você pode alterar.' },
  { k: 'prazo', grupo: 'entrada', label: 'Prazo de entrega (dias)', etapa: 1, tipo: 'num', obrig: false },
  { k: 'exigeLpco', grupo: 'cond', label: 'NCM com anuência prévia (LPCO)?', etapa: 1, tipo: 'sel', op: ['Sim', 'Não'] },
  { k: 'lpco', grupo: 'cond', label: 'Taxa de emissão de LPCO (R$)', etapa: 1, tipo: 'num', taxa: true, quando: { k: 'exigeLpco', valor: 'Sim' } },
  // ETAPA 2: FRETE E LOGÍSTICA INTERNACIONAL (trânsito)
  { k: 'modal', grupo: 'entrada', label: 'Modalidade de transporte', etapa: 2, tipo: 'sel', op: ['Marítimo', 'Aéreo'] },
  { k: 'frete', grupo: 'fixos', label: 'Frete internacional', etapa: 2, tipo: 'num', dica: 'Na moeda da operação.' },
  { k: 'seguroTipo', grupo: 'fixos', label: 'Seguro: forma de informar', etapa: 2, tipo: 'sel', op: ['Valor fixo', 'Percentual (%)'] },
  { k: 'seguro', grupo: 'fixos', label: 'Seguro internacional', etapa: 2, tipo: 'num', dica: 'Valor na moeda da operação ou % sobre o FOB.' },
  { k: 'aAFRMM', grupo: 'cond', label: 'AFRMM (% sobre o frete)', etapa: 2, tipo: 'num', taxa: true, quando: { k: 'modal', valor: 'Marítimo' }, dica: 'Obrigatório no modal marítimo; isento no aéreo.' },
  // ETAPA 3: NACIONALIZAÇÃO E DESPACHO ADUANEIRO (chegada e destino)
  { k: 'uf', grupo: 'entrada', label: 'UF de destino', etapa: 3, tipo: 'sel', op: UFS },
  { k: 'aII', grupo: 'fixos', label: 'II (%)', etapa: 3, tipo: 'num' },
  { k: 'aIPI', grupo: 'fixos', label: 'IPI (%)', etapa: 3, tipo: 'num' },
  { k: 'aPIS', grupo: 'fixos', label: 'PIS (%)', etapa: 3, tipo: 'num' },
  { k: 'aCOFINS', grupo: 'fixos', label: 'COFINS (%)', etapa: 3, tipo: 'num' },
  { k: 'aICMS', grupo: 'fixos', label: 'ICMS (%)', etapa: 3, tipo: 'num' },
  { k: 'siscomex', grupo: 'fixos', label: 'Taxa Siscomex (R$)', etapa: 3, tipo: 'num', taxa: true },
  { k: 'thc', grupo: 'cond', label: 'THC / capatazia (R$)', etapa: 3, tipo: 'num', taxa: true },
  { k: 'armazenagemModo', grupo: 'cond', label: 'Armazenagem: forma de informar', etapa: 3, tipo: 'sel', op: ['Valor fixo', 'Tabela progressiva (%)'] },
  { k: 'armazenagem', grupo: 'cond', label: 'Armazenagem (R$)', etapa: 3, tipo: 'num', taxa: true, quando: { k: 'armazenagemModo', valor: 'Valor fixo' } },
  { k: 'armazenagemDias', grupo: 'cond', label: 'Dias de armazenagem', etapa: 3, tipo: 'num', pos: true, quando: { k: 'armazenagemModo', valor: 'Tabela progressiva (%)' } },
  { k: 'armazenagemTabela', grupo: 'cond', label: 'Tabela progressiva (dias e % sobre o CIF)', etapa: 3, tipo: 'tabela', quando: { k: 'armazenagemModo', valor: 'Tabela progressiva (%)' } },
  { k: 'despachanteModo', grupo: 'cond', label: 'Despachante: forma de informar', etapa: 3, tipo: 'sel', op: ['Valor fixo', '% sobre o valor CIF'] },
  { k: 'despachante', grupo: 'cond', label: 'Honorários do despachante', etapa: 3, tipo: 'num' },
  { k: 'freteNacional', grupo: 'cond', label: 'Frete interno (R$)', etapa: 3, tipo: 'num' },
];

export const PREMISSAS = [
  'PIS e COFINS incidem sobre o valor aduaneiro (validar a base de cálculo federal).',
  'ICMS "por dentro": base = (valor aduaneiro + II + IPI + PIS + COFINS + Siscomex + AFRMM + LPCO) ÷ (1 − alíquota). Validar a composição da base na legislação da UF.',
  'Frete (CFR, CIF, CPT, CIP, DAP) e seguro (CIF, CIP) já incluídos no Incoterm não são somados de novo ao valor aduaneiro (validar).',
  'AFRMM: alíquota sobre o frete internacional informado, somente no modal marítimo.',
  'Seguro em percentual incide sobre o valor FOB; seguro, frete e FOB estão na mesma moeda e são convertidos pela taxa de câmbio informada.',
  'Valor CIF = valor aduaneiro. Armazenagem em tabela progressiva: cobra-se cada período iniciado; se os dias passarem da tabela, repete-se o último período.',
];

const aplica = (c: Campo, d: Dados) => !c.quando || d[c.quando.k] === c.quando.valor;

function tabela(d: Dados): { dias: number; pct: number }[] {
  try { const t = JSON.parse(d.armazenagemTabela || '[]'); return Array.isArray(t) ? t.map((p) => ({ dias: Number(p.dias), pct: Number(p.pct) })) : []; } catch { return []; }
}

export function validar(d: Dados, etapa?: number): string[] {
  return CAMPOS.filter((c) => (!etapa || c.etapa === etapa) && c.obrig !== false && aplica(c, d)).flatMap((c) => {
    const v = String(d[c.k] ?? '').trim();
    if (c.tipo === 'tabela') {
      const t = tabela(d);
      return t.length && t.every((p) => p.dias > 0 && p.pct >= 0) ? [] : [`${c.label}: informe ao menos um período com dias > 0 e % ≥ 0`];
    }
    if (!v) return [`${c.label}: obrigatório`];
    if (c.k === 'ncm' && !/^\d{8}$/.test(v.replace(/\D/g, ''))) return ['NCM: informe os 8 dígitos'];
    if (c.op && !c.op.includes(v)) return [`${c.label}: opção inválida`];
    if (c.tipo === 'num' && (isNaN(+v) || +v < 0)) return [`${c.label}: valor inválido`];
    if (c.pos && +v <= 0) return [`${c.label}: deve ser maior que zero`];
    if (c.k === 'aICMS' && +v >= 100) return ['ICMS: deve ser menor que 100%'];
    return [];
  });
}

const n = (x?: string) => Number(x) || 0;

export function calcular(d: Dados): Resultado {
  const c = n(d.cambio), q = n(d.quantidade);
  // ETAPA 1
  const fob = n(d.valorFob) * c;
  const lpco = d.exigeLpco === 'Sim' ? n(d.lpco) : 0;
  // ETAPA 2
  const frete = n(d.frete) * c;
  const seguro = d.seguroTipo === 'Percentual (%)' ? (fob * n(d.seguro)) / 100 : n(d.seguro) * c;
  const freteSoma = FRETE_INCLUSO.includes(d.incoterm) ? 0 : frete;
  const seguroSoma = SEGURO_INCLUSO.includes(d.incoterm) ? 0 : seguro;
  const afrmm = d.modal === 'Marítimo' ? (frete * n(d.aAFRMM)) / 100 : 0;
  // ETAPA 3
  const va = fob + freteSoma + seguroSoma; // valor aduaneiro
  const ii = (va * n(d.aII)) / 100;
  const ipi = ((va + ii) * n(d.aIPI)) / 100;
  const pis = (va * n(d.aPIS)) / 100;
  const cofins = (va * n(d.aCOFINS)) / 100;
  const siscomex = n(d.siscomex);
  const aIcms = Math.min(n(d.aICMS) / 100, 0.99);
  const baseIcms = (va + ii + ipi + pis + cofins + afrmm + lpco + siscomex) / (1 - aIcms);
  const icms = baseIcms * aIcms;
  let armazenagem = n(d.armazenagem);
  if (d.armazenagemModo === 'Tabela progressiva (%)') {
    const t = tabela(d);
    armazenagem = 0;
    for (let i = 0, rest = n(d.armazenagemDias); rest > 0 && t.length; i++) {
      const p = t[Math.min(i, t.length - 1)];
      armazenagem += (va * p.pct) / 100;
      rest -= Math.max(p.dias, 1);
    }
  }
  const despachante = d.despachanteModo === '% sobre o valor CIF' ? (va * n(d.despachante)) / 100 : n(d.despachante);

  const L = (rotulo: string, valor: number): Linha => ({ rotulo, valor });
  const grupos: Grupo[] = [
    { etapa: 1, titulo: 'Mercadoria', linhas: [L('Valor FOB em reais', fob)] },
    { etapa: 1, titulo: 'Custos administrativos', linhas: [L('Taxa de anuência / LPCO', lpco)] },
    { etapa: 2, titulo: 'Frete e seguro internacionais', linhas: [L('Frete internacional', freteSoma), L('Seguro internacional', seguroSoma)] },
    { etapa: 2, titulo: 'Taxas governamentais condicionais', linhas: [L('AFRMM', afrmm)] },
    { etapa: 3, titulo: 'Tributos incidentes', linhas: [L('II', ii), L('IPI', ipi), L('PIS', pis), L('COFINS', cofins), L('ICMS', icms)] },
    { etapa: 3, titulo: 'Taxas governamentais', linhas: [L('Taxa Siscomex (DUIMP)', siscomex)] },
    { etapa: 3, titulo: 'Despesas operacionais locais', linhas: [L('THC / capatazia', n(d.thc)), L('Armazenagem', armazenagem), L('Despachante aduaneiro', despachante), L('Frete rodoviário nacional', n(d.freteNacional))] },
  ];
  const total = grupos.reduce((s, g) => s + g.linhas.reduce((x, l) => x + l.valor, 0), 0);

  const obrigacoes = [
    ...(d.exigeLpco === 'Sim' ? ['Anuência / LPCO do órgão anuente (ex.: Inmetro): obter antes do embarque.'] : []),
    ...(d.modal === 'Marítimo' ? ['Recolhimento do AFRMM (Marinha Mercante).'] : []),
    'Registro da DUIMP no Siscomex (taxa de utilização do Siscomex).',
    'Recolhimento de II, IPI, PIS e COFINS na importação.',
    `Recolhimento do ICMS na UF de destino (${d.uf}).`,
  ];
  return { total, unitario: total / (q || 1), valorAduaneiro: va, grupos, obrigacoes };
}
