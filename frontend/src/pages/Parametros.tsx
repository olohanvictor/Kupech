import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { api, Metodologia, Parametros as P } from '../api';
import { Btn, Campo, Card, Erros, brl, formatNcm } from '../ui';

const UFS = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];
const NCM0 = { ncm: '', ii: '', ipi: '', pis: '', cofins: '', exigeLpco: false };

export default function Parametros({ met }: { met: Metodologia }) {
  const [aba, setAba] = useState('aliquotas');
  const [p, setP] = useState<P>({ ncms: [], ufs: [], taxas: [], cambios: [] });
  const [erros, setErros] = useState<string[]>([]);
  const [n, setN] = useState(NCM0);
  const [u, setU] = useState({ uf: '', icms: '' });
  const [t, setT] = useState({ nome: '', campo: '', valor: '' });
  const [c, setC] = useState({ moeda: '', valor: '' });

  const recarregar = () => api<P>('/api/parametros').then(setP).catch((e) => setErros([e.message]));
  useEffect(() => { recarregar(); }, []);
  const enviar = (url: string, body: unknown, limpar: () => void) => { setErros([]); api(url, 'PUT', body).then(() => { limpar(); recarregar(); }).catch((e) => setErros([e.message])); };
  const apagar = (url: string) => api(url, 'DELETE').then(recarregar).catch((e) => setErros([e.message]));
  const campos = met.campos.filter((x) => x.taxa);
  const rotulo = (k: string) => campos.find((x) => x.k === k)?.label ?? k;
  const ent = (set: (v: any) => void, o: any, k: string) => (e: { target: { value: string } }) => set({ ...o, [k]: e.target.value });
  const Del = ({ url }: { url: string }) => <Btn v="danger mini" onClick={() => apagar(url)} aria-label="Excluir"><Trash2 size={15} /></Btn>;

  return (
    <>
      <h1>Parâmetros e Valores</h1><p className="sub">Cadastre alíquotas, taxas e câmbio para escolher na hora de preencher a simulação.</p>
      <div className="row" style={{ gap: 8, marginBottom: 22 }}>
        {[['aliquotas', 'Alíquotas'], ['taxas', 'Taxas portuárias e de câmbio']].map(([id, nome]) => <button key={id} className={`chip ${aba === id ? 'on' : ''}`} onClick={() => { setAba(id); setErros([]); }}>{nome}</button>)}
      </div>
      <Erros lista={erros} />
      <div className="stagger" key={aba}>
        {aba === 'aliquotas' && (
          <>
            <Card>
              <h2>Alíquotas por NCM</h2>
              <table className="tbl"><thead><tr><th>NCM</th><th className="n">II %</th><th className="n">IPI %</th><th className="n">PIS %</th><th className="n">COFINS %</th><th>Anuência</th><th /></tr></thead>
                <tbody>{p.ncms.map((x) => <tr key={x.ncm}><td><b>{formatNcm(x.ncm)}</b></td><td className="n">{x.ii}</td><td className="n">{x.ipi}</td><td className="n">{x.pis}</td><td className="n">{x.cofins}</td><td>{x.exigeLpco ? 'LPCO' : '—'}</td><td className="n"><Del url={`/api/parametros/ncm/${x.ncm}`} /></td></tr>)}</tbody></table>
              {!p.ncms.length && <p className="vazio">Nenhum NCM cadastrado.</p>}
              <div className="row" style={{ marginTop: 20, alignItems: 'flex-end' }}>
                <Campo label="NCM"><input inputMode="numeric" placeholder="0000.00.00" maxLength={10} value={n.ncm} onChange={(e) => setN({ ...n, ncm: formatNcm(e.target.value) })} /></Campo>
                {(['ii', 'ipi', 'pis', 'cofins'] as const).map((k) => <Campo key={k} label={`${k.toUpperCase()} (%)`}><input type="number" min="0" step="any" value={n[k]} onChange={ent(setN, n, k)} /></Campo>)}
                <Campo label="Anuência (LPCO)"><select value={n.exigeLpco ? 'Sim' : 'Não'} onChange={(e) => setN({ ...n, exigeLpco: e.target.value === 'Sim' })}><option>Não</option><option>Sim</option></select></Campo>
                <Btn onClick={() => enviar('/api/parametros/ncm', n, () => setN(NCM0))}><Plus size={18} /> Salvar NCM</Btn>
              </div>
            </Card>
            <Card>
              <h2>ICMS por UF</h2>
              <table className="tbl"><thead><tr><th>UF</th><th className="n">ICMS %</th><th /></tr></thead><tbody>{p.ufs.map((x) => <tr key={x.uf}><td><b>{x.uf}</b></td><td className="n">{x.icms}</td><td className="n"><Del url={`/api/parametros/uf/${x.uf}`} /></td></tr>)}</tbody></table>
              {!p.ufs.length && <p className="vazio">Nenhuma UF cadastrada.</p>}
              <div className="row" style={{ marginTop: 20, alignItems: 'flex-end' }}>
                <Campo label="UF"><select value={u.uf} onChange={ent(setU, u, 'uf')}><option value="">Selecione</option>{UFS.map((x) => <option key={x}>{x}</option>)}</select></Campo>
                <Campo label="ICMS (%)"><input type="number" min="0" step="any" value={u.icms} onChange={ent(setU, u, 'icms')} /></Campo>
                <Btn onClick={() => enviar('/api/parametros/uf', u, () => setU({ uf: '', icms: '' }))}><Plus size={18} /> Salvar UF</Btn>
              </div>
            </Card>
          </>
        )}
        {aba === 'taxas' && (
          <>
            <Card>
              <h2>Taxas portuárias e governamentais</h2>
              <table className="tbl"><thead><tr><th>Nome</th><th>Usada em</th><th className="n">Valor</th><th /></tr></thead>
                <tbody>{p.taxas.map((x) => <tr key={x.id}><td><b>{x.nome}</b></td><td>{rotulo(x.campo)}</td><td className="n">{x.campo === 'aAFRMM' ? `${x.valor}%` : brl(x.valor)}</td><td className="n"><Del url={`/api/parametros/taxa/${x.id}`} /></td></tr>)}</tbody></table>
              {!p.taxas.length && <p className="vazio">Nenhuma taxa cadastrada.</p>}
              <div className="row" style={{ marginTop: 20, alignItems: 'flex-end' }}>
                <Campo label="Nome da taxa"><input placeholder="Ex.: THC Porto de Santos" value={t.nome} onChange={ent(setT, t, 'nome')} /></Campo>
                <Campo label="Usada em"><select value={t.campo} onChange={ent(setT, t, 'campo')}><option value="">Selecione</option>{campos.map((x) => <option key={x.k} value={x.k}>{x.label}</option>)}</select></Campo>
                <Campo label="Valor"><input type="number" min="0" step="any" value={t.valor} onChange={ent(setT, t, 'valor')} /></Campo>
                <Btn onClick={() => enviar('/api/parametros/taxa', t, () => setT({ nome: '', campo: '', valor: '' }))}><Plus size={18} /> Salvar taxa</Btn>
              </div>
            </Card>
            <Card>
              <h2>Câmbio por moeda</h2>
              <table className="tbl"><thead><tr><th>Moeda</th><th className="n">Cotação</th><th /></tr></thead><tbody>{p.cambios.map((x) => <tr key={x.moeda}><td><b>{x.moeda}</b></td><td className="n">{brl(x.valor)}</td><td className="n"><Del url={`/api/parametros/cambio/${x.moeda}`} /></td></tr>)}</tbody></table>
              {!p.cambios.length && <p className="vazio">Nenhuma moeda cadastrada. Ela só aparece na simulação depois de cadastrada aqui.</p>}
              <div className="row" style={{ marginTop: 20, alignItems: 'flex-end' }}>
                <Campo label="Moeda"><input placeholder="USD" maxLength={3} value={c.moeda} onChange={(e) => setC({ ...c, moeda: e.target.value.toUpperCase() })} /></Campo>
                <Campo label="Cotação (R$)"><input type="number" min="0" step="any" value={c.valor} onChange={ent(setC, c, 'valor')} /></Campo>
                <Btn onClick={() => enviar('/api/parametros/cambio', c, () => setC({ moeda: '', valor: '' }))}><Plus size={18} /> Salvar moeda</Btn>
              </div>
            </Card>
          </>
        )}
      </div>
    </>
  );
}
