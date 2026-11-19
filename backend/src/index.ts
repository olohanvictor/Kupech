import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { CAMPOS, FRETE_INCLUSO, PREMISSAS, SEGURO_INCLUSO, UFS, calcular, validar } from './landed';

const db = new PrismaClient();
const SECRET = process.env.JWT_SECRET;
if (!SECRET) throw new Error('Defina JWT_SECRET no arquivo .env');

const app = express();
app.use(cors({ origin: process.env.FRONTEND_URL ?? true }));
app.use(express.json());

const bad = (msg: string) => Object.assign(new Error(msg), { status: 400 });
const num = (v: unknown) => { const x = Number(v); if (v === '' || v == null || isNaN(x) || x < 0) throw bad('Informe valores numéricos válidos (maiores ou iguais a zero).'); return x; };

const auth = (req: Request, res: Response, next: NextFunction) => {
  try {
    res.locals.u = jwt.verify((req.headers.authorization ?? '').replace('Bearer ', ''), SECRET) as { id: number };
    next();
  } catch { res.status(401).json({ erro: 'Faça login novamente.' }); }
};

// ---- Login (com registro de acessos)
app.post('/api/login', async (req, res) => {
  const u = await db.usuario.findUnique({ where: { email: String(req.body.email ?? '').trim().toLowerCase() } });
  if (!u || !bcrypt.compareSync(String(req.body.senha ?? ''), u.senha)) return res.status(401).json({ erro: 'E-mail ou senha inválidos.' });
  await db.acesso.create({ data: { usuarioId: u.id } });
  res.json({ token: jwt.sign({ id: u.id }, SECRET, { expiresIn: '8h' }), usuario: { id: u.id, nome: u.nome, email: u.email } });
});

// ---- Metodologia Kupech (campos das 3 etapas) e cálculo: o servidor é a única fonte das regras
app.get('/api/metodologia', auth, (_q, res) => res.json({ campos: CAMPOS, freteIncluso: FRETE_INCLUSO, seguroIncluso: SEGURO_INCLUSO, premissas: PREMISSAS }));

app.post('/api/calcular', auth, (req, res) => {
  const { dados, etapa } = req.body;
  const erros = validar(dados ?? {}, etapa);
  res.json(erros.length || etapa ? { erros } : { erros: [], resultado: calcular(dados) });
});

// ---- Simulações Salvas (só gravam quando o usuário clica em Salvar Simulação)
app.get('/api/simulacoes', auth, async (_q, res) => {
  res.json(await db.simulacao.findMany({ include: { usuario: { select: { nome: true } } }, orderBy: { criadaEm: 'desc' } }));
});

app.post('/api/simulacoes', auth, async (req, res) => {
  const { nome, dados } = req.body;
  if (!String(nome ?? '').trim()) throw bad('Dê um nome à simulação.');
  const erros = validar(dados ?? {});
  if (erros.length) throw bad(erros.join('; '));
  res.status(201).json(await db.simulacao.create({ data: { nome: nome.trim(), dados, resultado: calcular(dados) as any, usuarioId: res.locals.u.id } }));
});

app.delete('/api/simulacoes/:id', auth, async (req, res) => {
  const r = await db.simulacao.deleteMany({ where: { id: Number(req.params.id), usuarioId: res.locals.u.id } });
  if (!r.count) throw bad('Simulação não encontrada (só é possível excluir as suas).');
  res.status(204).end();
});

// ---- Parâmetros/Valores: Alíquotas e Taxas portuárias e de câmbio
app.get('/api/parametros', auth, async (_q, res) => {
  res.json({ ncms: await db.aliquotaNcm.findMany({ orderBy: { ncm: 'asc' } }), ufs: await db.aliquotaUf.findMany({ orderBy: { uf: 'asc' } }), taxas: await db.taxa.findMany({ orderBy: { nome: 'asc' } }), cambios: await db.cambio.findMany({ orderBy: { moeda: 'asc' } }) });
});

app.put('/api/parametros/ncm', auth, async (req, res) => {
  const b = req.body, ncm = String(b.ncm ?? '').replace(/\D/g, '');
  if (ncm.length !== 8) throw bad('O NCM deve ter 8 dígitos.');
  const data = { ii: num(b.ii), ipi: num(b.ipi), pis: num(b.pis), cofins: num(b.cofins), exigeLpco: !!b.exigeLpco, lpco: b.exigeLpco && b.lpco !== '' && b.lpco != null ? num(b.lpco) : null };
  res.json(await db.aliquotaNcm.upsert({ where: { ncm }, update: data, create: { ncm, ...data } }));
});
app.delete('/api/parametros/ncm/:ncm', auth, async (req, res) => { await db.aliquotaNcm.deleteMany({ where: { ncm: req.params.ncm } }); res.status(204).end(); });

app.put('/api/parametros/uf', auth, async (req, res) => {
  const uf = String(req.body.uf ?? '').toUpperCase(), icms = num(req.body.icms);
  if (!UFS.includes(uf)) throw bad('UF inválida.');
  if (icms >= 100) throw bad('O ICMS deve ser menor que 100%.');
  res.json(await db.aliquotaUf.upsert({ where: { uf }, update: { icms }, create: { uf, icms } }));
});
app.delete('/api/parametros/uf/:uf', auth, async (req, res) => { await db.aliquotaUf.deleteMany({ where: { uf: req.params.uf } }); res.status(204).end(); });

app.put('/api/parametros/taxa', auth, async (req, res) => {
  const { nome, campo } = req.body;
  if (!String(nome ?? '').trim()) throw bad('Dê um nome à taxa.');
  if (!CAMPOS.some((c) => c.taxa && c.k === campo)) throw bad('Escolha onde a taxa será usada.');
  res.status(201).json(await db.taxa.create({ data: { nome: nome.trim(), campo, valor: num(req.body.valor) } }));
});
app.delete('/api/parametros/taxa/:id', auth, async (req, res) => { await db.taxa.deleteMany({ where: { id: Number(req.params.id) } }); res.status(204).end(); });

app.put('/api/parametros/cambio', auth, async (req, res) => {
  const moeda = String(req.body.moeda ?? '').trim().toUpperCase(), valor = num(req.body.valor);
  if (!/^[A-Z]{3}$/.test(moeda) || valor <= 0) throw bad('Informe a moeda (3 letras, ex.: USD) e uma cotação maior que zero.');
  res.json(await db.cambio.upsert({ where: { moeda }, update: { valor }, create: { moeda, valor } }));
});
app.delete('/api/parametros/cambio/:moeda', auth, async (req, res) => { await db.cambio.deleteMany({ where: { moeda: req.params.moeda } }); res.status(204).end(); });

// ---- Categorias (criadas na hora de preencher a simulação)
app.get('/api/categorias', auth, async (_q, res) => res.json(await db.categoria.findMany({ orderBy: { nome: 'asc' } })));
app.post('/api/categorias', auth, async (req, res) => {
  const nome = String(req.body.nome ?? '').trim().slice(0, 40);
  if (!nome) throw bad('Informe o nome da categoria.');
  res.status(201).json(await db.categoria.upsert({ where: { nome }, update: {}, create: { nome } }));
});

app.use((e: Error & { status?: number }, _q: Request, res: Response, _n: NextFunction) => res.status(e.status ?? 500).json({ erro: e.message }));

// Cria o primeiro usuário (dados do .env) quando ainda não existe nenhum
async function iniciar() {
  if (!(await db.usuario.count())) {
    const { USUARIO_NOME: nome, USUARIO_EMAIL: email, USUARIO_SENHA: senha } = process.env;
    if (nome && email && senha) await db.usuario.create({ data: { nome, email: email.toLowerCase(), senha: bcrypt.hashSync(senha, 10) } });
    else console.warn('Nenhum usuário cadastrado: defina USUARIO_NOME, USUARIO_EMAIL e USUARIO_SENHA no .env.');
  }
  app.listen(3001, () => console.log('Kupech API em http://localhost:3001'));
}
iniciar();
