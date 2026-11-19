import { useEffect, useState } from 'react';
import { ArrowLeft, Copy, Search, Trash2 } from 'lucide-react';
import { api, Categoria, Dados, Metodologia, Sim } from '../api';
import { Btn, Card, Erros, brl } from '../ui';
import { ResultadoView } from './Resultado';

export default function Salvas({ met, onNova }: { met: Metodologia; onNova: (d?: Dados) => void }) {
  const [sims, setSims] = useState<Sim[] | null>(null);
  const [cats, setCats] = useState<Categoria[]>([]);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('');
  const [sel, setSel] = useState<Sim | null>(null);
  const [erro, setErro] = useState<string[]>([]);
  const carregar = () => api<Sim[]>('/api/simulacoes').then(setSims).catch((e) => { setSims([]); setErro([e.message]); });
  useEffect(() => { carregar(); api<Categoria[]>('/api/categorias').then(setCats).catch(() => {}); }, []);

  const excluir = async (s: Sim) => {
    if (!confirm(`Excluir a simulação "${s.nome}"?`)) return;
    try { await api(`/api/simulacoes/${s.id}`, 'DELETE'); setSel(null); carregar(); } catch (e) { setErro([(e as Error).message]); }
  };
  const lista = (sims ?? []).filter((s) => (!cat || s.dados.categoria === cat) && [s.nome, s.dados.descricao, s.dados.exportador, s.dados.ncm, s.dados.categoria].join(' ').toLowerCase().includes(q.toLowerCase()));
  const valor = (k: string, d: Dados) => {
    if (k !== 'armazenagemTabela') return d[k] || '—';
    try { return (JSON.parse(d[k]) as { dias: string; pct: string }[]).map((p) => `${p.dias} dias: ${p.pct}%`).join(' · '); } catch { return '—'; }
  };

  if (sel) {
    return (
      <>
        <div className="row entre" style={{ marginBottom: 24 }}>
          <div><h1>Detalhes da Simulação</h1><p className="sub" style={{ margin: '6px 0 0' }}>{sel.nome} · salva em {new Date(sel.criadaEm).toLocaleString('pt-BR')} por {sel.usuario?.nome}</p></div>
          <div className="row"><Btn v="ghost" onClick={() => setSel(null)}><ArrowLeft size={18} /> Voltar</Btn><Btn v="ghost" onClick={() => onNova(sel.dados)}><Copy size={16} /> Nova a partir desta</Btn><Btn v="danger" onClick={() => excluir(sel)}><Trash2 size={16} /> Excluir</Btn></div>
        </div>
        <Erros lista={erro} />
        <ResultadoView d={sel.dados} r={sel.resultado} met={met} />
        <Card><h2>Parâmetros utilizados</h2><div className="grid">{met.campos.filter((c) => !c.quando || sel.dados[c.quando.k] === c.quando.valor).map((c) => <div key={c.k} className="campo"><span className="rot">{c.label}</span><b>{valor(c.k, sel.dados)}</b></div>)}</div></Card>
      </>
    );
  }
  return (
    <>
      <h1>Simulações Salvas</h1><p className="sub">Pesquise e filtre por categoria. Clique para ver os detalhes.</p>
      <div className="row" style={{ marginBottom: 14 }}>
        <div className="busca"><Search size={18} /><input placeholder="Pesquisar por nome, produto, fornecedor ou NCM" value={q} onChange={(e) => setQ(e.target.value)} /></div>
      </div>
      <div className="row" style={{ marginBottom: 22, gap: 8 }}>
        <button className={`chip ${cat === '' ? 'on' : ''}`} onClick={() => setCat('')}>Todas</button>
        {cats.map((c) => <button key={c.id} className={`chip ${cat === c.nome ? 'on' : ''}`} onClick={() => setCat(c.nome)}>{c.nome}</button>)}
      </div>
      <Erros lista={erro} />
      {sims && !lista.length && <Card><p className="vazio">{sims.length ? 'Nenhuma simulação encontrada com esse filtro.' : 'Nenhuma simulação salva ainda.'}</p></Card>}
      <div className="stagger">
        {lista.map((s) => (
          <Card key={s.id} className="row entre" onClick={() => setSel(s)}>
            <div><b>{s.nome}</b><br /><small>{new Date(s.criadaEm).toLocaleDateString('pt-BR')} · {s.usuario?.nome} · {s.dados.incoterm} · {s.dados.modal}</small></div>
            <div className="row"><span className="badge">{s.dados.categoria}</span><div style={{ textAlign: 'right' }}><b>{brl(s.resultado.total)}</b><br /><small>{brl(s.resultado.unitario)} por unidade</small></div></div>
          </Card>
        ))}
      </div>
    </>
  );
}
