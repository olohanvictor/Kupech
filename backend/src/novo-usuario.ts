// Uso: npm run usuario -- "Nome" email@empresa.com senha
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const [nome, email, senha] = process.argv.slice(2);
if (!nome || !email || !senha || senha.length < 8) { console.error('Uso: npm run usuario -- "Nome" email senha (mín. 8 caracteres)'); process.exit(1); }
new PrismaClient().usuario.create({ data: { nome, email: email.toLowerCase(), senha: bcrypt.hashSync(senha, 10) } })
  .then(() => { console.log('Usuário criado.'); process.exit(0); })
  .catch((e: Error) => { console.error(e.message); process.exit(1); });
