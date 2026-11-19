import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Plus, Sparkles, X } from 'lucide-react';
import { api, Campo as C, Categoria, Dados, Metodologia, Parametros, Resultado } from '../api';
import { Btn, Campo, Card, Erros, brl, formatNcm } from '../ui';
import { ResultadoView } from './Resultado';

const ETAPAS = [
  { titulo: 'Produto e origem', fase: 'Pré-embarque' },
  { titulo: 'Frete e logística internacional', fase: 'Trânsito' },
  { titulo: 'Nacionalização e despacho aduaneiro', fase: 'Chegada e destino' },
];
const BLOCOS: ['entrada' | 'fixos' | 'cond', string][] = [['entrada', 'Dados de entrada'], ['fixos', 'Custos fixos / obrigatórios'], ['cond', 'Taxas e custos condicionais']];

function Tabela({ valor, onChange }: { valor: string; onChange: (v: string) => void }) {
  let t: { dias: string; pct: string }[] = [];
  try { t = JSON.parse(valor || '[]'); } catch { t = []; }
  const set = (n: typeof t) => onChange(JSON.stringify(n));
  const mudar = (i: number, k: 'dias' | 'pct', v: string) => set(t.map((x, j) => (j === i ? { ...x, [k]: v } : x)));
  return (
    <div style={{ display: 'grid', gap: 8 }}>
      {t.map((p, i) => (
        <div className="jun" key={i}>
          <input type="number" min="1" placeholder="Dias do período" value={p.dias} onChange={(e) => mudar(i, 'dias', e.target.value)} />
          <input type="number" min="0" step="any" placeholder="% sobre o CIF" value={p.pct} onChange={(e) => mudar(i, 'pct', e.target.value)} />
          <Btn v="ghost" onClick={() => set(t.filter((_, j) => j !== i))} aria-label="Remover"><X size={16} /></Btn>
        </div>
      ))}
      <div><Btn v="ghost mini" onClick={() => set([...t, { dias: '', pct: '' }])}><Plus size={15} /> Período</Btn></div>
    </div>
  );
}

export default function Nova({ met, base, onNova, go }: { met: Metodologia; base?: Dados; onNova: (d?: Dados) => void; go: (p: string) => void }) {
  const [d, setD] = useState<Dados>(() => base ?? Object.fromEntries(met.campos.map((c) => [c.k, c.tipo === 'tabela' ? '[]' : ''])));
  const [etapa, setEtapa] = useState(1);
  const [erros, setErros] = useState<string[]>([]);
  const [r, setR] = useState<Resultado | null>(null);
  const [nome, setNome] = useState('');
  const [salvo, setSalvo] = useState(false);
  const [aviso, setAviso] = useState('');
  const [params, setParams] = useState<Parametros | null>(null);
  const [cats, setCats] = useState<Categoria[]>([]);
  const [novaCat, setNovaCat] = useState<string | null>(null);

  useEffect(() => {
    api<Parametros>('/api/parametros').then(setParams).catch(() => {});
    api<Categoria[]>('/api/categorias').then(setCats).catch(() => {});
  }, []);

  const set = (k: string, v: string) => setD((p) => ({ ...p, [k]: v }));
  const tenta = (f: () => Promise<void>) => f().catch((e) => setErros([e.message]));
  const visivel = (c: C) => !c.quando || d[c.quando.k] === c.quando.valor;

  const avancar = () => tenta(async () => {
    setErros([]); setAviso('');
    const j = await api<{ erros: string[]; resultado?: Resultado }>('/api/calcular', 'POST', { dados: d, etapa: etapa < 3 ? etapa : undefined });
    if (j.erros.length) return setErros(j.erros);
    if (etapa < 3) return setEtapa(etapa + 1);
    setR(j.resultado!); setNome(`${d.descricao} – ${d.exportador}`); setEtapa(4);
  });
  const salvar = () => tenta(async () => { setErros([]); await api('/api/simulacoes', 'POST', { nome, dados: d }); setSalvo(true); });
  const criarCat = () => tenta(async () => {
    const c = await api<Categoria>('/api/categorias', 'POST', { nome: novaCat });
    setCats((l) => [...l.filter((x) => x.id !== c.id), c].sort((a, b) => a.nome.localeCompare(b.nome))); set('categoria', c.nome); setNovaCat(null);
  });

  // preenche as alíquotas do NCM e o ICMS da UF a partir de Parâmetros e Valores
  const aplicar = () => {
    if (!params) return;
    const ncm = params.ncms.find((x) => x.ncm === d.ncm.replace(/\D/g, ''));
    const p: Dados = {}, usados: string[] = [];
    if (etapa === 1 && ncm) { p.exigeLpco = ncm.exigeLpco ? 'Sim' : 'Não'; usados.push('anuência (LPCO) do NCM'); }
    if (etapa === 3) {
      if (ncm) { Object.assign(p, { aII: String(ncm.ii), aIPI: String(ncm.ipi), aPIS: String(ncm.pis), aCOFINS: String(ncm.cofins) }); usados.push('II, IPI, PIS e COFINS do NCM'); }
      const u = params.ufs.find((x) => x.uf === d.uf); if (u) { p.aICMS = String(u.icms); usados.push('ICMS da UF'); }
    }
    setD((x) => ({ ...x, ...p }));
    setAviso(usados.length ? `Preenchido: ${usados.join(', ')}. Confira os valores.` : 'Nada cadastrado em Parâmetros e Valores para os dados informados.');
  };

  const controle = (c: C) => {
    const v = d[c.k];
    if (c.k === 'ncm') return <input inputMode="numeric" placeholder="0000.00.00" maxLength={10} value={v} onChange={(e) => set('ncm', formatNcm(e.target.value))} />;
    if (c.tipo === 'categoria') {
      return novaCat !== null ? (
        <div className="jun"><input autoFocus placeholder="Nome da nova categoria" value={novaCat} onChange={(e) => setNovaCat(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && criarCat()} /><Btn onClick={criarCat}>Criar</Btn><Btn v="ghost" onClick={() => setNovaCat(null)} aria-label="Cancelar"><X size={16} /></Btn></div>
      ) : (
        <div className="jun"><select value={v} onChange={(e) => set('categoria', e.target.value)}><option value="">Selecione</option>{cats.map((x) => <option key={x.id}>{x.nome}</option>)}</select><Btn v="ghost" onClick={() => setNovaCat('')} title="Nova categoria"><Plus size={18} /></Btn></div>
      );
    }
    if (c.tipo === 'moeda') {
      const escolher = (m: string) => setD((p) => ({ ...p, moeda: m, cambio: m ? String(params?.cambios.find((x) => x.moeda === m)?.valor ?? p.cambio) : p.cambio }));
      return <select value={v} onChange={(e) => escolher(e.target.value)}><option value="">Selecione</option>{params?.cambios.map((m) => <option key={m.moeda}>{m.moeda}</option>)}</select>;
    }
    if (c.tipo === 'sel') return <select value={v} onChange={(e) => set(c.k, e.target.value)}><option value="">Selecione</option>{c.op!.map((o) => <option key={o}>{o}</option>)}</select>;
    if (c.tipo === 'tabela') return <Tabela valor={v} onChange={(x) => set(c.k, x)} />;
    return <input type={c.tipo === 'num' ? 'number' : 'text'} min={c.tipo === 'num' ? 0 : undefined} step="any" value={v} onChange={(e) => set(c.k, e.target.value)} />;
  };

  const campo = (c: C) => {
    let dica = c.dica;
    if (c.k === 'frete' && met.freteIncluso.includes(d.incoterm)) dica = `${d.incoterm}: já incluso no preço, não soma ao valor aduaneiro (base do AFRMM).`;
    if (c.k === 'seguro' && met.seguroIncluso.includes(d.incoterm)) dica = `${d.incoterm}: já incluso no preço, não soma ao valor aduaneiro.`;
    if (c.tipo === 'moeda' && params && !params.cambios.length) dica = 'Cadastre moedas em Parâmetros e Valores.';
    const taxas = c.taxa ? params?.taxas.filter((t) => t.campo === c.k) ?? [] : [];
    return (
      <div key={c.k} style={c.tipo === 'tabela' ? { gridColumn: '1 / -1' } : undefined}>
        <Campo label={c.label} hint={dica}>
          {controle(c)}
          {taxas.length > 0 && (
            <select className="mini" value="" onChange={(e) => { const t = taxas.find((x) => x.id === +e.target.value); if (t) set(c.k, String(t.valor)); }}>
              <option value="">Usar taxa cadastrada…</option>{taxas.map((t) => <option key={t.id} value={t.id}>{t.nome} · {c.k === 'aAFRMM' ? `${t.valor}%` : brl(t.valor)}</option>)}
            </select>
          )}
        </Campo>
      </div>
    );
  };

  const bloco = ([g, titulo]: (typeof BLOCOS)[number]) => {
    const campos = met.campos.filter((c) => c.etapa === etapa && c.grupo === g && visivel(c));
    return (
      <div key={g} className="bloco">
        <h3>{titulo}</h3>
        {campos.length ? <div className="grid">{campos.map(campo)}</div> : <small>{g === 'fixos' ? 'N/A nesta etapa.' : 'Nenhuma taxa condicional se aplica aos dados informados.'}</small>}
      </div>
    );
  };

  return (
    <>
      <h1>Nova Simulação</h1>
      <p className="sub">Preencher os dados da operação, seguindo a metodologia Kupech de importação.</p>
      <div className="passos">
        {['Produto e origem', 'Frete e logística', 'Nacionalização', 'Resultado'].map((t, i) => (
          <div key={t} className={`passo ${etapa === i + 1 ? 'on' : etapa > i + 1 ? 'feito' : ''}`}><b>{etapa > i + 1 ? <Check size={15} /> : i + 1}</b>{t}</div>
        ))}
      </div>

      {etapa < 4 ? (
        <Card className="enter" key={etapa}>
          <div className="row entre">
            <div className="etapa-cab"><div className="num">{etapa}</div><div><h2>{ETAPAS[etapa - 1].titulo}</h2><small>{ETAPAS[etapa - 1].fase}</small></div></div>
            {etapa !== 2 && <Btn v="ghost mini" onClick={aplicar} disabled={!params}><Sparkles size={15} /> Preencher com Parâmetros e Valores</Btn>}
          </div>
          {aviso && <p className="ok" style={{ marginTop: 18, marginBottom: 0 }}><Check size={16} />{aviso}</p>}
          {BLOCOS.map(bloco)}
          <Erros lista={erros} />
          <div className="row entre" style={{ marginTop: 28 }}>
            {etapa > 1 ? <Btn v="ghost" onClick={() => { setEtapa(etapa - 1); setErros([]); setAviso(''); }}><ArrowLeft size={18} /> Voltar</Btn> : <span />}
            <Btn onClick={avancar}>{etapa === 3 ? 'Calcular Landed Cost' : 'Próximo'} <ArrowRight size={18} /></Btn>
          </div>
        </Card>
      ) : (
        r && (
          <>
            <ResultadoView d={d} r={r} met={met} />
            <Card>
              <h2>Salvar Simulação</h2>
              {salvo ? (
                <>
                  <p className="ok"><span className="pop"><Check size={18} /></span>Simulação salva.</p>
                  <div className="row"><Btn onClick={() => go('salvas')}>Ver Simulações Salvas</Btn><Btn v="ghost" onClick={() => onNova(d)}>Nova Simulação a partir desta</Btn></div>
                </>
              ) : (
                <>
                  <Campo label="Nome da simulação" hint="A simulação só é guardada quando você clica em Salvar Simulação."><input value={nome} onChange={(e) => setNome(e.target.value)} /></Campo>
                  <Erros lista={erros} />
                  <div className="row entre" style={{ marginTop: 20 }}><Btn v="ghost" onClick={() => setEtapa(3)}><ArrowLeft size={18} /> Voltar e editar</Btn><Btn v="acento" onClick={salvar}>Salvar Simulação</Btn></div>
                </>
              )}
            </Card>
          </>
        )
      )}
    </>
  );
}
