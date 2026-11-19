import { useEffect, useState } from 'react';
import { Calculator } from 'lucide-react';
import { api, Sim, Usuario } from '../api';
import { Btn, Card, Dinheiro, brl } from '../ui';

export default function Home({ user, go }: { user: Usuario; go: (p: string) => void }) {
  const [sims, setSims] = useState<Sim[] | null>(null);
  useEffect(() => { api<Sim[]>('/api/simulacoes').then(setSims).catch(() => setSims([])); }, []);
  const menor = sims?.length ? sims.reduce((a, b) => (b.resultado.unitario < a.resultado.unitario ? b : a)) : null;
  const ultima = sims?.[0];
  return (
    <div className="stagger">
      <div className="row entre" style={{ marginBottom: 28 }}>
        <div><h1>Olá, {user.nome.split(' ')[0]}</h1><p className="sub" style={{ margin: '6px 0 0' }}>Acompanhe suas simulações de importação.</p></div>
        <Btn v="acento" onClick={() => go('nova')}><Calculator size={18} /> Nova Simulação</Btn>
      </div>
      <div className="kpis">
        <div className="kpi hero"><span>Última simulação</span><b>{ultima ? <Dinheiro v={ultima.resultado.total} /> : '—'}</b><small style={{ color: 'rgba(255,255,255,.75)' }}>{ultima?.nome ?? 'Nenhuma simulação salva ainda'}</small></div>
        <div className="kpi"><span>Simulações salvas</span><b>{sims?.length ?? '—'}</b></div>
        <div className="kpi"><span>Menor custo unitário</span><b>{menor ? brl(menor.resultado.unitario) : '—'}</b><small>{menor?.nome}</small></div>
      </div>
      <Card>
        <div className="row entre"><h2 style={{ margin: 0 }}>Simulações recentes</h2><Btn v="ghost mini" onClick={() => go('salvas')}>Ver todas</Btn></div>
        {!sims?.length ? <p className="vazio">Quando você salvar uma simulação, ela aparece aqui.</p> : (
          <table className="tbl" style={{ marginTop: 10 }}>
            <thead><tr><th>Simulação</th><th>Categoria</th><th className="n">Landed Cost</th><th className="n">Por unidade</th></tr></thead>
            <tbody>{sims.slice(0, 5).map((s) => <tr key={s.id}><td><b>{s.nome}</b><br /><small>{new Date(s.criadaEm).toLocaleDateString('pt-BR')}</small></td><td>{s.dados.categoria}</td><td className="n">{brl(s.resultado.total)}</td><td className="n">{brl(s.resultado.unitario)}</td></tr>)}</tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
