import { Dados, Metodologia, Resultado } from '../api';
import { Card, Dinheiro, brl } from '../ui';

export function ResultadoView({ d, r, met }: { d: Dados; r: Resultado; met: Metodologia }) {
  const soma = (l: { valor: number }[]) => l.reduce((s, x) => s + x.valor, 0);
  const resumo: [string, string][] = [
    ['Produto', `${d.descricao} (${d.categoria})`], ['NCM', d.ncm], ['Fornecedor', d.exportador], ['País de origem', d.pais], ['Valor FOB', `${d.valorFob} ${d.moeda}`], ['Quantidade', d.quantidade],
    ['Incoterm', d.incoterm], ['Modalidade', d.modal], ['Prazo de entrega', d.prazo ? `${d.prazo} dias` : '—'], ['Câmbio', `R$ ${d.cambio}`], ['UF de destino', d.uf],
  ];
  return (
    <div className="stagger">
      <div className="kpis">
        <div className="kpi hero"><span>Landed Cost (custo total)</span><b><Dinheiro v={r.total} /></b></div>
        <div className="kpi"><span>Custo unitário</span><b><Dinheiro v={r.unitario} /></b></div>
        <div className="kpi"><span>Valor aduaneiro</span><b>{brl(r.valorAduaneiro)}</b></div>
      </div>
      <Card>
        <h2>Composição do custo</h2>
        <div className="pilha">{r.grupos.map((g, i) => <span key={g.titulo} title={g.titulo} style={{ width: `${(soma(g.linhas) / r.total) * 100}%`, background: `var(--c${i + 1})`, animationDelay: `${i * 70}ms` }} />)}</div>
        <div className="leg">{r.grupos.map((g, i) => <span key={g.titulo}><i style={{ background: `var(--c${i + 1})` }} />{g.titulo} · {((soma(g.linhas) / r.total) * 100).toFixed(1)}%</span>)}</div>
      </Card>
      <div className="grid" style={{ marginBottom: 20, gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', alignItems: 'stretch' }}>
        {r.grupos.map((g, i) => (
          <Card key={g.titulo} className="" >
            <div className="row entre" style={{ marginBottom: 6 }}><h2 style={{ margin: 0, fontSize: 16 }}><i className="dot" style={{ background: `var(--c${i + 1})` }} />{g.titulo}</h2><span className="badge">Etapa {g.etapa}</span></div>
            {g.linhas.map((l) => {
              const p = (l.valor / r.total) * 100;
              return <div className="linha" key={l.rotulo}><span>{l.rotulo}</span><b>{brl(l.valor)}</b><em>{p.toFixed(1)}%</em><div className="barra"><span style={{ width: `${p}%`, background: `var(--c${i + 1})` }} /></div></div>;
            })}
          </Card>
        ))}
      </div>
      <Card><h2>Resumo da operação</h2><div className="grid">{resumo.map(([k, v]) => <div key={k} className="campo"><span className="rot">{k}</span><b>{v}</b></div>)}</div></Card>
      <Card><h2>Obrigações e órgãos envolvidos</h2><ul style={{ margin: 0, paddingLeft: 18 }}>{r.obrigacoes.map((o) => <li key={o}>{o}</li>)}</ul></Card>
      <Card><details><summary>Premissas de cálculo a validar</summary><ul>{met.premissas.map((p) => <li key={p}>{p}</li>)}</ul></details></Card>
    </div>
  );
}
