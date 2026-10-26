// pulse-server/routes/data.js
import express from 'express';
import db from '../database.js';
import jwt from 'jsonwebtoken';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'pulse-tcc-secret-2026';

// Middleware para verificar se o usuário está logado (Token JWT)
const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Acesso negado. Faça login.' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Token inválido ou expirado.' });
  }
};

// ─── ROTAS DE SALVAR (POST) ───

router.post('/mood', auth, (req, res) => {
  const { mood, note, date } = req.body;
  try {
    const stmt = db.prepare('INSERT INTO moods (user_id, mood, note, date) VALUES (?, ?, ?, ?)');
    stmt.run(req.userId, mood, note, date);
    res.json({ ok: true, message: 'Humor salvo no banco!' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao salvar humor.' });
  }
});

router.post('/exercise', auth, (req, res) => {
  const { tipo, duracao, intensidade, nota, date } = req.body;
  try {
    const stmt = db.prepare('INSERT INTO exercises (user_id, type, duration, intensity, note, date) VALUES (?, ?, ?, ?, ?, ?)');
    stmt.run(req.userId, tipo, duracao, intensidade, nota, date);
    res.json({ ok: true, message: 'Exercício salvo!' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao salvar exercício.' });
  }
});

router.post('/gratitude', auth, (req, res) => {
  const { g1, g2, g3, date } = req.body;
  try {
    const stmt = db.prepare('INSERT INTO gratitude (user_id, item1, item2, item3, date) VALUES (?, ?, ?, ?, ?)');
    stmt.run(req.userId, g1, g2, g3, date);
    res.json({ ok: true, message: 'Gratidão salva!' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao salvar gratidão.' });
  }
});

router.post('/water', auth, (req, res) => {
  const { cups, date } = req.body;
  try {
    const stmt = db.prepare('INSERT INTO water (user_id, cups, date) VALUES (?, ?, ?)');
    stmt.run(req.userId, cups, date);
    res.json({ ok: true, message: 'Água salva!' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao salvar água.' });
  }
});

router.post('/pomodoro', auth, (req, res) => {
  const { date } = req.body;
  try {
    const stmt = db.prepare('INSERT INTO pomodoro (user_id, date) VALUES (?, ?)');
    stmt.run(req.userId, date);
    res.json({ ok: true, message: 'Pomodoro salvo!' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao salvar pomodoro.' });
  }
});

// ─── ROTAS DE LER (GET) ───

router.get('/stats', auth, (req, res) => {
  try {
    const moodCount = db.prepare('SELECT COUNT(*) as count FROM moods WHERE user_id = ?').get(req.userId).count;
    const waterSum = db.prepare('SELECT SUM(cups) as total FROM water WHERE user_id = ?').get(req.userId).total || 0;
    const pomodoroCount = db.prepare('SELECT COUNT(*) as count FROM pomodoro WHERE user_id = ?').get(req.userId).count;

    res.json({ moodCount, waterSum, pomodoroCount });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar estatísticas.' });
  }
});

export default router;