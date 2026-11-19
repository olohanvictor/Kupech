import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { api, Grupo, Sim } from '../api';
import { Card, brl } from '../ui';

const soma = (g: Grupo) => g.linhas.reduce((s, l) => s + l.valor, 0);

export default function Comparar() {
  const [sims, setSims] = useState<Sim[] | null>(null);
  const [ids, setIds] = useState<number[]>([]);
  useEffect(() => { api<Sim[]>('/api/simulacoes').then(setSims).catch(() => setSims([])); }, []);
  const cs = (sims ?? []).filter((s) => ids.includes(s.id));
  // menor custo unitário; em caso de empate, o menor prazo de entrega
  const prazo = (s: Sim) => Number(s.dados.prazo) || Infinity;
  const melhor = cs.length ? cs.reduce((a, b) => (b.resultado.unitario < a.resultado.unitario || (b.resultado.unitario === a.resultado.unitario && prazo(b) < prazo(a)) ? b : a)) : null;
  const linhas: [string, (s: Sim) => string][] = [
    ['Landed Cost', (s) => brl(s.resultado.total)], ['Custo unitário', (s) => brl(s.resultado.unitario)], ['Valor aduaneiro', (s) => brl(s.resultado.valorAduaneiro)],
    ...(cs[0]?.resultado.grupos.map((g, i): [string, (s: Sim) => string] => [g.titulo, (s) => brl(soma(s.resultado.grupos[i]))]) ?? []),
    ['Prazo de entrega', (s) => (s.dados.prazo ? `${s.dados.prazo} dias` : '—')], ['Fornecedor', (s) => s.dados.exportador], ['Incoterm · modalidade', (s) => `${s.dados.incoterm} · ${s.dados.modal}`],
  ];
  return (
    <>
      <h1>Comparar cenários</h1><p className="sub">Escolha duas ou mais simulações salvas para ver lado a lado.</p>
      {sims && sims.length < 2 && <Card><p className="vazio">Salve pelo menos duas simulações para poder compará-las.</p></Card>}
      <div className="row" style={{ gap: 8, marginBottom: 22 }}>
        {sims?.map((s) => <button key={s.id} className={`chip ${ids.includes(s.id) ? 'on' : ''}`} onClick={() => setIds(ids.includes(s.id) ? ids.filter((x) => x !== s.id) : [...ids, s.id])}>{ids.includes(s.id) && <Check size={14} />}{s.nome}</button>)}
      </div>
      {cs.length >= 2 && melhor && (
        <Card className="enter" >
          <div style={{ overflowX: 'auto' }}>
            <table className="tbl">
              <thead><tr><th />{cs.map((s) => <th key={s.id} className={s === melhor ? 'melhor' : ''}>{s.nome}{s === melhor && <><br /><span className="badge">Menor custo unitário</span></>}</th>)}</tr></thead>
              <tbody>{linhas.map(([t, f]) => <tr key={t}><td style={{ color: 'var(--suave)' }}>{t}</td>{cs.map((s) => <td key={s.id} className={s === melhor ? 'melhor' : ''}>{f(s)}</td>)}</tr>)}</tbody>
            </table>
          </div>
        </Card>
      )}
    </>
  );
}
