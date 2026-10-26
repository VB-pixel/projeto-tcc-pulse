import db from '../database.js';

export const salvarHumor = (req, res) => {
  const { mood, note, date } = req.body;
  try {
    const stmt = db.prepare('INSERT INTO moods (user_id, mood, note, date) VALUES (?, ?, ?, ?)');
    stmt.run(req.userId, mood, note, date);
    res.json({ ok: true, message: 'Humor salvo!' });
  } catch (err) {
    console.error("🚨 ERRO NO BANCO (Humor):", err.message);
    res.status(500).json({ error: 'Erro ao salvar humor.' });
  }
};

export const listarHumores = (req, res) => {
  try {
    const moods = db.prepare('SELECT * FROM moods WHERE user_id = ? ORDER BY id DESC LIMIT 7').all(req.userId);
    res.json(moods);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar histórico.' });
  }
};

export const deletarHumor = (req, res) => {
  const { id } = req.params;
  try {
    const stmt = db.prepare('DELETE FROM moods WHERE id = ? AND user_id = ?');
    const info = stmt.run(id, req.userId);
    if (info.changes === 0) return res.status(404).json({ error: 'Registro não encontrado.' });
    res.json({ ok: true, message: 'Registro removido!' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao deletar.' });
  }
};
// (Você pode mover as rotas de exercício, gratidão e água para cá depois seguindo o mesmo padrão)