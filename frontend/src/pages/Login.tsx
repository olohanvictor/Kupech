import { FormEvent, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { api, Usuario } from '../api';
import { Btn, Campo, Card, Erros } from '../ui';

export default function Login({ onEntrar }: { onEntrar: (t: string, u: Usuario) => void }) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState<string[]>([]);
  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    try { const j = await api<{ token: string; usuario: Usuario }>('/api/login', 'POST', { email, senha }); onEntrar(j.token, j.usuario); }
    catch (x) { setErro([(x as Error).message]); }
  };
  return (
    <div className="login">
      <div className="arte"><h1>Kupech</h1><p>Descubra o custo real da sua importação antes de fechar o pedido.</p></div>
      <div className="form-login">
        <Card className="enter"><form onSubmit={enviar} style={{ display: 'contents' }}>
          <div><h2 style={{ fontSize: 26, marginBottom: 4 }}>Bem-vindo de volta</h2><small>Entre para simular o seu Landed Cost.</small></div>
          <Campo label="E-mail"><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></Campo>
          <Campo label="Senha"><input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} required /></Campo>
          <Erros lista={erro} />
          <Btn>Entrar <ArrowRight size={18} /></Btn>
        </form></Card>
      </div>
    </div>
  );
}
