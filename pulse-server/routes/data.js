import 'dotenv/config';
import express from 'express';
import jwt from 'jsonwebtoken';
import { salvarHumor, listarHumores, deletarHumor } from '../controllers/dataController.js';

const router = express.Router();

// ⚠️ SEGURANÇA: Removemos o fallback (|| 'senha'). 
// Se o .env falhar, o servidor nem sobe, protegendo os dados.
const JWT_SECRET = process.env.JWT_SECRET; 

const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Acesso negado.' });
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.id; 
    next();
  } catch (err) {
    res.status(401).json({ error: 'Token inválido ou expirado.' });
  }
};

// ─── ROTAS DE HUMOR ───
router.post('/mood', auth, salvarHumor);
router.get('/mood', auth, listarHumores);
router.delete('/mood/:id', auth, deletarHumor);

// (As outras rotas de exercícios, gratidão, etc., continuam aqui, mas chamando os controllers depois)

export default router;