import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../database.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'chave_secreta_pulse_tcc';

// ─── Rota de REGISTRO ───
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, course } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Preencha todos os campos obrigatórios.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'A senha precisa ter no mínimo 6 caracteres.' });
    }

    // Verifica se o e-mail já existe
    const userExists = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (userExists) {
      return res.status(400).json({ error: 'Este e-mail já está cadastrado.' });
    }

    // Criptografa a senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // Salva no banco
    const insert = db.prepare('INSERT INTO users (name, email, password, course) VALUES (?, ?, ?, ?)');
    const result = insert.run(name, email, hashedPassword, course || '');

    // Cria o token JWT
    const token = jwt.sign({ id: result.lastInsertRowid }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      message: 'Conta criada com sucesso!',
      token,
      user: { id: result.lastInsertRowid, name, email, course }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao criar conta.' });
  }
});

// ─── Rota de LOGIN ───
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Preencha e-mail e senha.' });
    }

    // Busca o usuário no banco
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) {
      return res.status(401).json({ error: 'E-mail ou senha incorretos.' });
    }

    // Compara a senha digitada com a criptografada no banco
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'E-mail ou senha incorretos.' });
    }

    // Cria o token JWT
    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      message: 'Login realizado com sucesso!',
      token,
      user: { id: user.id, name: user.name, email: user.email, course: user.course }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao fazer login.' });
  }
});

export default router;