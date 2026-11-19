import { useEffect, useState } from 'react';
import { BarChart3, Calculator, FolderOpen, Home as Casa, Settings, SlidersHorizontal } from 'lucide-react';
import { api, Dados, Metodologia, Usuario, setToken } from './api';
import Login from './pages/Login';
import Home from './pages/Home';
import Nova from './pages/Nova';
import Salvas from './pages/Salvas';
import Comparar from './pages/Comparar';
import Parametros from './pages/Parametros';
import Opcoes from './pages/Opcoes';

// Mapa de navegação: Login → Home → Nova Simulação | Simulações Salvas | Comparar cenários | Parâmetros e Valores | Opções
const MENU = [
  { id: 'home', nome: 'Home', Icone: Casa }, { id: 'nova', nome: 'Nova Simulação', Icone: Calculator }, { id: 'salvas', nome: 'Simulações Salvas', Icone: FolderOpen },
  { id: 'comparar', nome: 'Comparar cenários', Icone: BarChart3 }, { id: 'parametros', nome: 'Parâmetros e Valores', Icone: SlidersHorizontal }, { id: 'opcoes', nome: 'Opções', Icone: Settings },
];

export default function App() {
  const [user, setUser] = useState<Usuario | null>(() => JSON.parse(localStorage.getItem('kupech_user') ?? 'null'));
  const [met, setMet] = useState<Metodologia | null>(null);
  const [pag, setPag] = useState('home');
  const [base, setBase] = useState<{ n: number; d?: Dados }>({ n: 0 });
  const [tema, setTema] = useState(() => localStorage.getItem('kupech_tema') ?? (matchMedia('(prefers-color-scheme: dark)').matches ? 'escuro' : 'claro'));

  useEffect(() => { document.documentElement.dataset.tema = tema; localStorage.setItem('kupech_tema', tema); }, [tema]);
  useEffect(() => { if (user) api<Metodologia>('/api/metodologia').then(setMet).catch(() => {}); }, [user]);

  const entrar = (t: string, u: Usuario) => { setToken(t); localStorage.setItem('kupech_user', JSON.stringify(u)); setUser(u); setPag('home'); };
  const sair = () => { setToken(''); localStorage.removeItem('kupech_user'); setUser(null); setMet(null); };
  const nova = (d?: Dados) => { setBase({ n: base.n + 1, d }); setPag('nova'); };
  const ir = (p: string) => (p === 'nova' ? nova() : setPag(p));

  if (!user) return <Login onEntrar={entrar} />;
  return (
    <div className="app">
      <aside>
        <div className="logo"><i>K</i>Kupech</div>
        {MENU.map(({ id, nome, Icone }) => <button key={id} className={`nav ${pag === id ? 'on' : ''}`} onClick={() => ir(id)}><Icone size={19} />{nome}</button>)}
      </aside>
      <main key={pag + base.n} className="enter">
        {pag === 'home' && <Home user={user} go={ir} />}
        {!met && (pag === 'nova' || pag === 'salvas') && <p className="sub">Carregando…</p>}
        {met && pag === 'nova' && <Nova met={met} base={base.d} onNova={nova} go={setPag} />}
        {met && pag === 'salvas' && <Salvas met={met} onNova={nova} />}
        {pag === 'comparar' && <Comparar />}
        {met && pag === 'parametros' && <Parametros met={met} />}
        {pag === 'opcoes' && <Opcoes user={user} tema={tema} setTema={setTema} onSair={sair} />}
      </main>
    </div>
  );
}
