import { ButtonHTMLAttributes, ReactNode, useEffect, useState } from 'react';

export const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

// 6109.10.00: só números, no máximo 8, já no formato do NCM
export const formatNcm = (v: string) => {
  const d = v.replace(/\D/g, '').slice(0, 8);
  return d.length <= 4 ? d : d.length <= 6 ? `${d.slice(0, 4)}.${d.slice(4)}` : `${d.slice(0, 4)}.${d.slice(4, 6)}.${d.slice(6)}`;
};

// número que "sobe" até o valor final
function useContar(alvo: number, ms = 800) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf = 0;
    const t0 = performance.now();
    const passo = (t: number) => { const p = Math.min((t - t0) / ms, 1); setV(alvo * (1 - Math.pow(1 - p, 3))); if (p < 1) raf = requestAnimationFrame(passo); };
    raf = requestAnimationFrame(passo);
    return () => cancelAnimationFrame(raf);
  }, [alvo, ms]);
  return v;
}
export const Dinheiro = ({ v }: { v: number }) => <>{brl(useContar(v))}</>;

export const Card = ({ children, className = '', onClick }: { children: ReactNode; className?: string; onClick?: () => void }) => (
  <div className={`card ${onClick ? 'clicavel' : ''} ${className}`} onClick={onClick}>{children}</div>
);
export const Campo = ({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) => (
  <div className="campo"><span className="rot">{label}</span>{children}{hint && <small>{hint}</small>}</div>
);
export const Btn = ({ v = '', className = '', ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { v?: string }) => <button {...p} className={`btn ${v} ${className}`} />;
export const Erros = ({ lista }: { lista: string[] }) => (lista.length ? <ul className="err">{lista.map((m) => <li key={m}>{m}</li>)}</ul> : null);
