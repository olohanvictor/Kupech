export type Dados = Record<string, string>;
export interface Campo { k: string; grupo: 'entrada' | 'fixos' | 'cond'; label: string; etapa: 1 | 2 | 3; tipo: 'texto' | 'num' | 'sel' | 'tabela' | 'categoria' | 'moeda'; taxa?: boolean; op?: string[]; quando?: { k: string; valor: string }; dica?: string; obrig?: boolean }
export interface Linha { rotulo: string; valor: number }
export interface Grupo { etapa: number; titulo: string; linhas: Linha[] }
export interface Resultado { total: number; unitario: number; valorAduaneiro: number; grupos: Grupo[]; obrigacoes: string[] }
export interface Metodologia { campos: Campo[]; freteIncluso: string[]; seguroIncluso: string[]; premissas: string[] }
export interface Usuario { id: number; nome: string; email: string }
export interface Sim { id: number; nome: string; criadaEm: string; dados: Dados; resultado: Resultado; usuario?: { nome: string } }
export interface Parametros {
  ncms: { ncm: string; ii: number; ipi: number; pis: number; cofins: number; exigeLpco: boolean; lpco: number | null }[];
  ufs: { uf: string; icms: number }[];
  taxas: { id: number; nome: string; campo: string; valor: number }[];
  cambios: { moeda: string; valor: number }[];
}
export interface Categoria { id: number; nome: string }

const BASE = import.meta.env.VITE_API_URL ?? '';
let token = localStorage.getItem('kupech_token') ?? '';
export const setToken = (t: string) => { token = t; if (t) localStorage.setItem('kupech_token', t); else localStorage.removeItem('kupech_token'); };

export async function api<T = any>(url: string, method = 'GET', body?: unknown): Promise<T> {
  const r = await fetch(BASE + url, { method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: body === undefined ? undefined : JSON.stringify(body) });
  if (r.status === 401 && token) { setToken(''); localStorage.removeItem('kupech_user'); location.reload(); }
  const j = r.status === 204 ? null : await r.json().catch(() => null);
  if (!r.ok) throw new Error(j?.erro ?? 'Não foi possível falar com o servidor.');
  return j;
}
