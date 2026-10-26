// ═══════════════════════════════════════════════════════════
// heart.ia — Integração com o Backend (Node.js)
// ═══════════════════════════════════════════════════════════

// URL do nosso servidor Node.js
const API_URL = 'http://localhost:3000';

function appendMsg(text, who = 'user') {
  const chat = document.getElementById('iaChat');
  if (!chat) return;
  const div = document.createElement('div');
  div.className = `ia-msg ia-${who}`;
  div.innerHTML = `<div class="ia-bubble">${text}</div>`;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}

function showTyping() {
  const chat = document.getElementById('iaChat');
  const div = document.createElement('div');
  div.className = 'ia-msg ia-bot ia-typing';
  div.id = 'iaTyping';
  div.innerHTML = `<div class="ia-bubble"><span class="dot"></span><span class="dot"></span><span class="dot"></span></div>`;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}

function removeTyping() {
  document.getElementById('iaTyping')?.remove();
}

async function sendIAMessage(e) {
  if (e) e.preventDefault();
  
  const input = document.getElementById('iaInput');
  const msg = input.value.trim();
  if (!msg) return;

  // Mostra a mensagem do usuário na tela
  appendMsg(msg, 'user');
  input.value = '';
  showTyping();

  try {
    // Faz a chamada para o nosso backend
    const response = await fetch(`${API_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message: msg })
    });

    if (!response.ok) {
  const errData = await response.json();
  throw new Error(errData.error || 'Erro na resposta do servidor');
}

    const data = await response.json();
    
    // Remove os pontinhos de "digitando" e mostra a resposta real
    removeTyping();
    appendMsg(data.reply, 'bot');

  } catch (err) {
    removeTyping();
    console.error('Erro heart.ia:', err);
    appendMsg('Desculpe, tive um problema para me conectar ao servidor. O backend está rodando? 💚', 'bot');
  }
}

function quickAsk(text) {
  document.getElementById('iaInput').value = text;
  sendIAMessage();
}