import test from 'node:test';
import assert from 'node:assert/strict';
import { calcular, validar, Dados } from './landed';

const base: Dados = {
  categoria: 'Máquinas', descricao: 'Motor', exportador: 'ACME', ncm: '8501.52.10', pais: 'China', valorFob: '10000', moeda: 'USD', quantidade: '10',
  incoterm: 'FOB', cambio: '5', prazo: '30', exigeLpco: 'Sim', lpco: '300', modal: 'Marítimo', frete: '1000', seguroTipo: 'Percentual (%)',
  seguro: '2', aAFRMM: '25', uf: 'SP', aII: '10', aIPI: '5', aPIS: '2.1', aCOFINS: '9.65', aICMS: '18', siscomex: '214.5', thc: '1000',
  armazenagemModo: 'Valor fixo', armazenagem: '500', despachanteModo: '% sobre o valor CIF', despachante: '1', freteNacional: '600',
};
const perto = (a: number, b: number) => assert.ok(Math.abs(a - b) < 0.01, `${a} != ${b}`);

test('FOB marítimo com tudo preenchido (conta feita à mão)', () => {
  assert.deepEqual(validar(base), []);
  const r = calcular(base);
  // VA = 50000 + 5000 + 1000 = 56000 | II 5600 | IPI 3080 | PIS 1176 | COFINS 5404 | AFRMM 1250 | LPCO 300 | Siscomex 214,5
  // base ICMS = 73024,5 / 0,82 | locais = 1000 + 500 + 560 + 600
  perto(r.valorAduaneiro, 56000);
  perto(r.total, 73024.5 / 0.82 + 2660);
  perto(r.unitario, r.total / 10);
});
test('CIF: frete e seguro não são somados de novo; AFRMM continua sobre o frete', () => {
  const r = calcular({ ...base, incoterm: 'CIF' });
  perto(r.valorAduaneiro, 50000);
  assert.equal(r.grupos[3].linhas[0].valor, 1250);
});
test('Aéreo: sem AFRMM', () => {
  assert.equal(calcular({ ...base, modal: 'Aéreo', aAFRMM: '' }).grupos[3].linhas[0].valor, 0);
});
test('Armazenagem em tabela progressiva', () => {
  const t = JSON.stringify([{ dias: 10, pct: 1 }, { dias: 10, pct: 2 }]);
  const a = (dias: string) => calcular({ ...base, armazenagemModo: 'Tabela progressiva (%)', armazenagemDias: dias, armazenagemTabela: t }).grupos[6].linhas[1].valor;
  perto(a('15'), 560 + 1120);
  perto(a('25'), 560 + 1120 + 1120);
});
test('Validação bloqueia dados faltando', () => {
  assert.ok(validar({ ...base, ncm: '123' }).length > 0);
  assert.ok(validar({ ...base, quantidade: '0' }).length > 0);
  assert.ok(validar({ ...base, modal: 'Marítimo', aAFRMM: '' }).length > 0);
  assert.equal(validar({ ...base, modal: 'Aéreo', aAFRMM: '' }).length, 0);
});
