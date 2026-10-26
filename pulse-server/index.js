import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
import authRoutes from './routes/auth.js';

// Carrega as variáveis de ambiente
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Middlewares ───
app.use(cors());
app.use(express.json({ limit: '10kb' }));

// ─── Rotas de Autenticação (Login e Registro) ───
// Tudo que estiver em routes/auth.js vai responder em /api/auth/...
app.use('/api/auth', authRoutes);

// ─── Rota de Teste (Health Check) ───
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'P.U.L.S.E backend está vivo! 🚀',
    timestamp: new Date().toISOString()
  });
});

// ─── Rota Principal do Chat (heart.ia) ───
app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Mensagem vazia.' });
    }

    const SYSTEM_PROMPT = `Você é a heart.ia, assistente virtual do P.U.L.S.E. 
Responda sempre em português do Brasil. Seja acolhedora e objetiva. 
NUNCA prescreva remédios. Em casos de crise, recomende ligar para o CVV (188).`;

    let reply = '';

    // ═══ 1. TENTATIVA PRINCIPAL: Google Gemini ═══
    if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim() !== '') {
      try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        
        // O modelo que funcionou para você
        const model = genAI.getGenerativeModel({ model: "gemini-3.8-flash" });

        const promptCompleto = `${SYSTEM_PROMPT}\n\nUsuário: ${message}`;
        const result = await model.generateContent(promptCompleto);
        const response = await result.response;
        
        reply = response.text();
        console.log('✅ Resposta gerada pelo Gemini.');
        
      } catch (err) {
        console.error('❌ Erro no Gemini:', err.message);
      }
    }

    // ═══ 2. FALLBACK: DeepSeek (só roda se o Gemini falhar) ═══
    if (!reply && process.env.DEEPSEEK_API_KEY && process.env.DEEPSEEK_API_KEY.trim() !== '') {
      try {
        console.log('⚠️ Tentando DeepSeek como reserva...');
        
        const response = await fetch('https://api.deepseek.com/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
          },
          body: JSON.stringify({
            model: 'deepseek-chat',
            messages: [
              { role: 'system', content: SYSTEM_PROMPT },
              { role: 'user', content: message }
            ],
            temperature: 0.7,
            max_tokens: 500
          })
        });

        const data = await response.json();
        
        if (response.ok && data.choices && data.choices[0]) {
          reply = data.choices[0].message.content;
          console.log('✅ Resposta gerada pela DeepSeek.');
        } else {
          console.log('⚠️ DeepSeek também falhou.');
        }
      } catch (err) {
        console.error('❌ Erro na DeepSeek:', err.message);
      }
    }

    // ═══ RESPOSTA FINAL ═══
    if (!reply) {
      return res.status(500).json({ 
        error: 'Nenhuma IA conseguiu responder. Verifique as chaves e o saldo.' 
      });
    }

    res.json({ reply });

  } catch (error) {
    console.error('Erro interno no servidor:', error);
    res.status(500).json({ error: 'Erro interno no servidor.' });
  }
});

// ─── Inicia o Servidor ───
app.listen(PORT, () => {
  console.log(`✅ P.U.L.S.E backend rodando em http://localhost:${PORT}`);
  console.log(`📡 Teste em: http://localhost:${PORT}/api/health`);
});