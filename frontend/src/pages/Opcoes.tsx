import { LogOut, Moon, Sun } from 'lucide-react';
import { Usuario } from '../api';
import { Btn, Card } from '../ui';

export default function Opcoes({ user, tema, setTema, onSair }: { user: Usuario; tema: string; setTema: (t: string) => void; onSair: () => void }) {
  return (
    <div className="stagger" style={{ maxWidth: 640 }}>
      <h1>Opções</h1><p className="sub">Preferências da sua conta.</p>
      <Card><h2>Conta</h2><div className="grid"><div className="campo"><span className="rot">Nome</span><b>{user.nome}</b></div><div className="campo"><span className="rot">E-mail</span><b>{user.email}</b></div></div></Card>
      <Card>
        <h2>Aparência</h2>
        <div className="seg">
          <button className={tema === 'claro' ? 'on' : ''} onClick={() => setTema('claro')}><Sun size={16} /> Claro</button>
          <button className={tema === 'escuro' ? 'on' : ''} onClick={() => setTema('escuro')}><Moon size={16} /> Escuro</button>
        </div>
      </Card>
      <Card><h2>Sessão</h2><Btn v="danger" onClick={onSair}><LogOut size={18} /> Sair da conta</Btn></Card>
    </div>
  );
}
