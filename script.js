// ═══════════════════════════════════════════════════════════════════
// P.U.L.S.E — JavaScript Principal
// ═══════════════════════════════════════════════════════════════════

/* 
  ÍNDICE:
  01. Constantes e Utilitários
  02. Sistema de Tema (Dark/Light)
  03. Autenticação (Login/Registro/Logout)
  04. Navegação e Menus
  05. Módulo: Humor
  06. Módulo: Motivação
  07. Módulo: Respiração
  08. Módulo: Pomodoro
  09. Módulo: Gratidão
  10. Módulo: Fórum
  11. Módulo: Nutrição
  12. Módulo: Exercícios
  13. Módulo: Calendário e Lembretes
  14. Inicializador Global
*/

// ─── 01. CONSTANTES E UTILITÁRIOS ───
const API_URL = 'http://localhost:3000';

function showToast(msg, tipo = 'info', duration = 3000) {
  const t = document.getElementById('toast');
  if (!t) return;
  
  t.textContent = msg;
  t.className = 'toast show'; 
  if (tipo !== 'info') t.classList.add(`toast-${tipo}`);
  
  setTimeout(() => t.classList.remove('show'), duration);
}

async function apiRequest(endpoint, method = 'GET', body = null) {
  const token = localStorage.getItem('pulse_token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  
  const config = { method, headers };
  if (body) config.body = JSON.stringify(body);

  try {
    const response = await fetch(`${API_URL}${endpoint}`, config);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Erro no servidor');
    return data;
  } catch (error) {
    showToast('❌ ' + error.message, 'error');
    throw error;
  }
}

// ─── 02. SISTEMA DE TEMA ───
function getSystemTheme() {
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme) {
  const resolved = theme === 'system' ? getSystemTheme() : theme;
  document.body.setAttribute('data-theme', resolved);
  
  const icons = { system: '💻', light: '☀️', dark: '🌙' };
  const iconEl = document.getElementById('currentThemeIcon');
  if (iconEl) iconEl.textContent = icons[theme] || '💻';
  
  document.querySelectorAll('.theme-option').forEach(opt => {
    opt.classList.toggle('active', opt.dataset.theme === theme);
  });
}

function setTheme(theme) {
  localStorage.setItem('pulse_theme', theme);
  applyTheme(theme);
  closeThemeMenu();
  showToast('🎨 Tema alterado', 'success');
}

function toggleThemeMenu(e) { 
  if (e) e.stopPropagation(); 
  document.getElementById('themeSelector')?.classList.toggle('open'); 
}

function closeThemeMenu() { 
  document.getElementById('themeSelector')?.classList.remove('open'); 
}

function initTheme() { 
  applyTheme(localStorage.getItem('pulse_theme') || 'system'); 
}

// ─── 03. AUTENTICAÇÃO ───
function protegerRotas() {
  const token = localStorage.getItem('pulse_token');
  const path = window.location.pathname;
  const page = path.split('/').pop() || 'index.html';
  const paginasPublicas = ['index.html', '404.html', ''];

  if (!token && !paginasPublicas.includes(page)) {
    const isSubfolder = path.includes('/humor/') || path.includes('/autocuidado/') || 
                        path.includes('/rotina/') || path.includes('/forum/') || 
                        path.includes('/nutricao/');
    const redirectURL = isSubfolder ? '../index.html?acesso=negado' : 'index.html?acesso=negado';
    window.location.href = redirectURL;
  }
}

function bloquearLinksVisitante() {
  const token = localStorage.getItem('pulse_token');
  if (!token) {
    document.querySelectorAll('nav a').forEach(link => {
      const href = link.getAttribute('href');
      if (href && !href.includes('index.html') && !href.startsWith('http') && !href.startsWith('#')) {
        link.addEventListener('click', function(e) {
          e.preventDefault();
          openAuthModal('login');
          showToast('🔒 Faça login para acessar esta área!', 'warning');
        });
      }
    });
  }
}

function openAuthModal(tab = 'login') {
  document.getElementById('authModal')?.classList.add('open');
  document.getElementById('userDropdown')?.classList.remove('open');
  switchModalTab(tab);
}

function closeAuthModal() { 
  document.getElementById('authModal')?.classList.remove('open'); 
}

function switchModalTab(tab) {
  document.querySelectorAll('.auth-modal .auth-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.auth-modal .auth-panel').forEach(p => p.classList.remove('active'));
  
  if (tab === 'login') {
    document.querySelector('.auth-modal .auth-tab[data-tab="login"]')?.classList.add('active');
    document.getElementById('modalLoginPanel')?.classList.add('active');
  } else {
    document.querySelector('.auth-modal .auth-tab[data-tab="register"]')?.classList.add('active');
    document.getElementById('modalRegisterPanel')?.classList.add('active');
  }
}

async function handleModalRegister(e) {
  e.preventDefault();
  const name = document.getElementById('modalRegName').value.trim();
  const email = document.getElementById('modalRegEmail').value.trim().toLowerCase();
  const password = document.getElementById('modalRegPassword').value;
  const course = document.getElementById('modalRegCourse').value.trim();

  if (!name || !email || !password) return showToast('⚠️ Preencha todos os campos!', 'warning');

  try {
    const data = await apiRequest('/api/auth/register', 'POST', { name, email, password, course });
    localStorage.setItem('pulse_token', data.token);
    localStorage.setItem('pulse_session', JSON.stringify({ name: data.user.name, email: data.user.email, loggedIn: true }));
    
    showToast('🎉 Conta criada com sucesso!', 'success');
    closeAuthModal();
    
    // ─── A MÁGICA ACONTECE AQUI (Sem recarregar a página) ───
    updateAuthUI(); // Atualiza o ícone no topo
    alternarHome(); // Troca a tela de visitante para a tela de logado
    // ───────────────────────────────────────────────────────
    
  } catch (err) {}
}

async function handleModalLogin(e) {
  e.preventDefault();
  const email = document.getElementById('modalLoginEmail').value.trim().toLowerCase();
  const password = document.getElementById('modalLoginPassword').value;

  if (!email || !password) return showToast('⚠️ Preencha e-mail e senha!', 'warning');

  try {
    const data = await apiRequest('/api/auth/login', 'POST', { email, password });
    localStorage.setItem('pulse_token', data.token);
    localStorage.setItem('pulse_session', JSON.stringify({ name: data.user.name, email: data.user.email, loggedIn: true }));
    
    showToast('✅ Bem-vindo(a), ' + data.user.name + '!', 'success');
    closeAuthModal();
    
    // ─── A MÁGICA ACONTECE AQUI (Sem recarregar a página) ───
    updateAuthUI(); 
    alternarHome(); 
    // ───────────────────────────────────────────────────────
    
  } catch (err) {}
}

function handleLogout() {
  localStorage.removeItem('pulse_token');
  localStorage.removeItem('pulse_session');
  document.getElementById('userDropdown')?.classList.remove('open');
  showToast('👋 Até logo!', 'info');
  setTimeout(() => window.location.reload(), 1000);
}

function updateAuthUI() {
  const session = JSON.parse(localStorage.getItem('pulse_session') || '{}');
  const isLoggedIn = session.loggedIn === true;

  if (document.getElementById('avatarIcon')) document.getElementById('avatarIcon').textContent = isLoggedIn ? '😊' : '👤';
  if (document.getElementById('userStatus')) document.getElementById('userStatus').classList.toggle('logged-in', isLoggedIn);

  const loggedOut = document.getElementById('dropdownLoggedOut');
  const loggedIn = document.getElementById('dropdownLoggedIn');
  
  if (loggedOut) loggedOut.style.display = isLoggedIn ? 'none' : 'flex';
  if (loggedIn) loggedIn.style.display = isLoggedIn ? 'flex' : 'none';

  if (isLoggedIn) {
    if (document.getElementById('dropdownUserName')) document.getElementById('dropdownUserName').textContent = session.name;
    if (document.getElementById('dropdownUserEmail')) document.getElementById('dropdownUserEmail').textContent = session.email;
    if (document.getElementById('dropdownAvatar')) document.getElementById('dropdownAvatar').textContent = session.name.charAt(0).toUpperCase();
  }
}

function alternarHome() {
  const token = localStorage.getItem('pulse_token');
  const homeVisitante = document.getElementById('homeVisitante');
  const homeLogado = document.getElementById('homeLogado');

  if (homeVisitante && homeLogado) {
    if (token) {
      homeVisitante.style.display = 'none';
      homeLogado.style.display = 'block';
      const session = JSON.parse(localStorage.getItem('pulse_session') || '{}');
      if (document.getElementById('welcomeName') && session.name) {
        document.getElementById('welcomeName').textContent = session.name;
      }
    } else {
      homeVisitante.style.display = 'block';
      homeLogado.style.display = 'none';
    }
  }
}

// ─── 04. NAVEGAÇÃO ───
function toggleUserDropdown() { 
  document.getElementById('userDropdown')?.classList.toggle('open'); 
}

function markActiveNav() {
  const currentPage = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('nav a, .nav-link').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('nav a').forEach(link => {
    if (link.getAttribute('href') === currentPage) link.classList.add('active');
  });
}

function closeAllDropdowns(except = null) {
  document.querySelectorAll('.dropdown-menu').forEach(menu => {
    if (menu !== except) {
      menu.classList.remove('show');
      const link = menu.closest('.dropdown')?.querySelector('.nav-link');
      if (link) link.setAttribute('aria-expanded', 'false');
    }
  });
}

// ─── 05. HUMOR ───
function initHumor() {
  const btns = document.querySelectorAll('.humor-btn');
  if (!btns.length) return;
  let selectedMood = null;
  let selectedLabel = "Nenhum humor selecionado";

  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      btns.forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      selectedMood = btn.dataset.mood;
      selectedLabel = btn.dataset.label;
      
      const labelEl = document.getElementById('selectedLabel');
      if (labelEl) labelEl.textContent = `Selecionado: ${selectedLabel}`;
    });
  });

  document.getElementById('saveHumor')?.addEventListener('click', async () => {
    if (!selectedMood) return showToast('⚠️ Selecione um humor primeiro!', 'warning');
    
    const textoBoas = document.getElementById('coisaBoa')?.value || 'Nada relatado';
    const textoRuins = document.getElementById('coisaRuim')?.value || 'Nada relatado';
    const notaCompleta = `✨ Boas: ${textoBoas} | 💭 Ruins: ${textoRuins}`;

    try {
      await apiRequest('/api/data/mood', 'POST', { mood: selectedLabel, note: notaCompleta, date: new Date().toISOString() });
      
      showToast('✅ Humor salvo com sucesso!', 'success');
      
      if (document.getElementById('coisaBoa')) document.getElementById('coisaBoa').value = '';
      if (document.getElementById('coisaRuim')) document.getElementById('coisaRuim').value = '';
      
      btns.forEach(b => b.classList.remove('selected'));
      selectedMood = null;
      if (document.getElementById('selectedLabel')) document.getElementById('selectedLabel').textContent = 'Nenhum humor selecionado';
      
      // Atualiza o histórico na tela imediatamente após salvar
      carregarHistoricoHumor(); 
    } catch (err) { console.error(err); }
  });

  // Carrega o histórico assim que a página abre
  carregarHistoricoHumor();
}

// Função para traduzir o texto do humor para o emoji correto
function getEmojiHumor(mood) {
  const emojis = {
    'Ótimo': '😄',
    'Bem': '🙂',
    'Neutro': '😐',
    'Mal': '😔',
    'Muito mal': '😢'
  };
  return emojis[mood] || '📝'; // Se não achar, usa um ícone genérico
}

async function carregarHistoricoHumor() {
  const container = document.getElementById('humorHistory');
  if (!container) return;

  try {
    const historico = await apiRequest('/api/data/mood', 'GET');
    
    if (historico.length === 0) {
      container.innerHTML = '<p style="color:var(--texto-suave);font-size:0.88rem;">Nenhum registro ainda.</p>';
      return;
    }

    container.innerHTML = '';
    historico.forEach(item => {
      const dataFormatada = new Date(item.date).toLocaleDateString('pt-BR');
      const emojiCorreto = getEmojiHumor(item.mood); // 👈 AQUI: Busca o emoji certo
      
      const div = document.createElement('div');
      div.className = 'humor-log-item';
      
      div.innerHTML = `
        <span class="humor-log-emoji">${emojiCorreto}</span> 
        <div style="flex:1;">
          <div style="font-weight:700;color:var(--texto);">${item.mood}</div>
          <div style="font-size:0.8rem;color:var(--texto-suave);">${dataFormatada}</div>
          <div style="font-size:0.8rem;font-style:italic;margin-top:4px;">${item.note}</div>
        </div>
        <button class="btn-delete-mood" onclick="abrirModalDelete(${item.id})" title="Apagar registro">🗑️</button>
      `;
      container.appendChild(div);
    });
  } catch (err) {
    console.error("Erro ao carregar histórico", err);
  }
}

async function confirmarDelete() {
  if (!idParaDeletar) return;
  
  const btnConfirmar = document.getElementById('btnConfirmarDelete');
  if (btnConfirmar) {
    btnConfirmar.textContent = 'Apagando...';
    btnConfirmar.disabled = true; // Evita duplo clique
  }

  try {
    // Faz a chamada na API enviando o método DELETE
    await apiRequest(`/api/data/mood/${idParaDeletar}`, 'DELETE');
    
    showToast('🗑️ Registro apagado com sucesso!', 'success');
    
    fecharModalDelete();
    carregarHistoricoHumor(); // Atualiza a lista na hora
    
  } catch (err) {
    console.error("Erro ao deletar:", err);
  } finally {
    // Restaura o botão caso dê erro
    if (btnConfirmar) {
      btnConfirmar.textContent = 'Sim, apagar';
      btnConfirmar.disabled = false;
    }
  }
}
// ─── 06. MOTIVAÇÃO ───
function initMotivacao() {
  const elementoTexto = document.getElementById('motivacaoTexto'); 
  if (!elementoTexto) return;

  const frases = [
    "Você não precisa dar conta de tudo hoje. Um passo de cada vez já é progresso.",
    "O descanso também faz parte do processo de aprendizagem.",
    "Respire fundo. A sua saúde mental vale mais do que qualquer nota.",
    "Pequenas pausas durante os estudos aumentam a sua concentração.",
    "Seja gentil consigo mesmo(a). Você está fazendo o seu melhor.",
    "Lembre-se: pedir ajuda não é sinal de fraqueza, é sinal de sabedoria."
  ];

  const fraseAleatoria = frases[Math.floor(Math.random() * frases.length)];
  elementoTexto.textContent = `"${fraseAleatoria}"`;
}

// ─── 07. RESPIRAÇÃO ───
function initRespiracao() {
  const circle = document.getElementById('breathCircle');
  if (!circle) return;
  
  let running = false;
  let cycle = 0;
  let timer = null;
  
  const phases = [
    { label: 'Inspire... 🌬️', duration: 4000, cls: 'inhale' },
    { label: 'Segure... 🤫', duration: 7000, cls: '' },
    { label: 'Expire devagar... 😮‍💨', duration: 8000, cls: 'exhale' }
  ];

  function nextPhase(index) {
    if (!running) return;
    const phase = phases[index % 3];
    circle.className = 'breathing-circle ' + phase.cls;
    
    const phaseEl = document.getElementById('breathPhase');
    if (phaseEl) phaseEl.textContent = phase.label;

    if (index % 3 === 0 && index > 0) cycle++;
    
    const countEl = document.getElementById('breathCount');
    if (countEl) countEl.textContent = `Ciclo ${cycle + 1} de 4`;

    if (cycle >= 4) return stop();
    timer = setTimeout(() => nextPhase(index + 1), phase.duration);
  }

  function stop() {
    running = false;
    clearTimeout(timer);
    cycle = 0;
    circle.className = 'breathing-circle';
    circle.textContent = 'Toque para começar';
    
    const phaseEl = document.getElementById('breathPhase');
    const countEl = document.getElementById('breathCount');
    if (phaseEl) phaseEl.textContent = '✅ Exercício completo!';
    if (countEl) countEl.textContent = '';
  }

  circle.addEventListener('click', () => {
    if (running) return stop();
    running = true;
    cycle = 0;
    circle.textContent = '●';
    nextPhase(0);
  });
}

// ─── 08. POMODORO ───
function initPomodoro() {
  const display = document.getElementById('pomodoroTime');
  if (!display) return;
  let seconds = 25 * 60, running = false, interval = null, isBreak = false;

  function update() {
    display.textContent = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  }

  async function tick() {
    seconds--; 
    update();
    
    if (seconds <= 0) {
      clearInterval(interval); 
      running = false;
      
      if (!isBreak) {
        try { await apiRequest('/api/data/pomodoro', 'POST', { date: new Date().toISOString() }); } catch(e) {}
        showToast('🍅 Sessão completa! Hora de pausar.', 'success');
        isBreak = true; 
        seconds = 5 * 60;
        document.getElementById('pomodoroStatus').textContent = 'Pausa curta ☕';
        document.getElementById('pomodoroStart').textContent = '▶ Iniciar pausa';
      } else {
        showToast('✅ Pausa terminada! De volta ao foco.', 'success');
        isBreak = false; 
        seconds = 25 * 60;
        document.getElementById('pomodoroStatus').textContent = 'Sessão de foco';
        document.getElementById('pomodoroStart').textContent = '▶ Iniciar';
      }
      update();
    }
  }

  document.getElementById('pomodoroStart')?.addEventListener('click', function() {
    if (running) { clearInterval(interval); running = false; this.textContent = '▶ Continuar'; }
    else { running = true; interval = setInterval(tick, 1000); this.textContent = '⏸ Pausar'; }
  });

  document.getElementById('pomodoroReset')?.addEventListener('click', () => {
    clearInterval(interval); running = false; isBreak = false; seconds = 25 * 60;
    document.getElementById('pomodoroStatus').textContent = 'Sessão de foco';
    document.getElementById('pomodoroStart').textContent = '▶ Iniciar';
    update();
  });
  update();
}

// ─── 09. GRATIDÃO ───
function initGratidao() {
  document.getElementById('saveGratidao')?.addEventListener('click', async () => {
    const g1 = document.getElementById('gratidao1')?.value;
    const g2 = document.getElementById('gratidao2')?.value;
    const g3 = document.getElementById('gratidao3')?.value;
    
    if (!g1 && !g2 && !g3) return showToast('⚠️ Escreva pelo menos uma gratidão!', 'warning');
    
    try {
      await apiRequest('/api/data/gratitude', 'POST', { g1, g2, g3, date: new Date().toISOString() });
      showToast('💛 Gratidões salvas!', 'success');
      ['gratidao1', 'gratidao2', 'gratidao3'].forEach(id => { 
        const el = document.getElementById(id); 
        if (el) el.value = ''; 
      });
    } catch (err) { console.error(err); }
  });
}

// ─── 10. FÓRUM ───
window.likePost = function(btn) {
  const span = btn.querySelector('span');
  if (span) {
    span.textContent = parseInt(span.textContent) + 1;
    btn.style.borderColor = 'var(--coral)';
    btn.style.color = 'var(--coral)';
    btn.disabled = true;
    showToast('👍 Curtido!', 'info');
  }
};

function initForum() {
  const modal = document.getElementById('newPostModal');
  if (modal) {
    document.getElementById('openNewPost')?.addEventListener('click', () => modal.classList.add('open'));
    document.getElementById('closeModal')?.addEventListener('click', () => modal.classList.remove('open'));
    document.getElementById('cancelPost')?.addEventListener('click', () => modal.classList.remove('open'));
    document.getElementById('submitPost')?.addEventListener('click', () => {
      const title = document.getElementById('postTitle')?.value;
      if (!title) return showToast('Adicione um título!', 'warning');
      showToast('✅ Pergunta enviada!', 'success');
      modal.classList.remove('open');
      document.getElementById('postTitle').value = '';
      document.getElementById('postBody').value = '';
    });
  }

  document.querySelectorAll('[data-filter]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-filter]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const f = btn.dataset.filter;
      document.querySelectorAll('.forum-post').forEach(post => {
        post.style.display = (f === 'all' || post.dataset.category === f) ? '' : 'none';
      });
    });
  });
}

// ─── 11. NUTRIÇÃO ───
window.calcIMC = function() {
  const peso = parseFloat(document.getElementById('imcPeso').value);
  const alturaCm = parseFloat(document.getElementById('imcAltura').value);
  const out = document.getElementById('imcResult');
  if (!peso || !alturaCm) return showToast('⚠️ Preencha peso e altura!', 'warning');
  
  const altura = alturaCm / 100;
  const imc = peso / (altura * altura);
  let cls, cor;
  if (imc < 18.5) { cls = 'Abaixo do peso'; cor = '#FEF3C7'; }
  else if (imc < 25) { cls = 'Peso saudável ✅'; cor = '#D1FAE5'; }
  else if (imc < 30) { cls = 'Sobrepeso'; cor = '#FEF3C7'; }
  else { cls = 'Obesidade'; cor = '#FEE2E2'; }
  
  out.style.display = 'block';
  out.style.background = cor;
  out.innerHTML = `
    <strong>Seu IMC:</strong>
    <div style="font-family:'Nunito',sans-serif;font-weight:900;font-size:1.8rem;color:var(--menta-vibrante);margin:6px 0;">${imc.toFixed(1)} kg/m²</div>
    <div style="font-weight:700;font-size:0.95rem;">${cls}</div>
  `;
};

// ─── 12. EXERCÍCIOS ───
function initExercicios() {
  const container = document.getElementById('tipoExercicio');
  if (!container) return;
  let selectedType = null;

  container.querySelectorAll('.emocao-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.emocao-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      selectedType = btn.dataset.tipo;
    });
  });

  document.getElementById('saveExercicio')?.addEventListener('click', async () => {
    const duracao = parseInt(document.getElementById('exDuracao').value);
    if (!selectedType || !duracao) return showToast('⚠️ Selecione o tipo e a duração!', 'warning');
    
    const intensidade = document.getElementById('exIntensidade').value;
    const nota = document.getElementById('exNota').value;
    
    try {
      await apiRequest('/api/data/exercise', 'POST', { tipo: selectedType, duracao, intensidade, nota, date: new Date().toISOString() });
      showToast('💪 Treino salvo com sucesso!', 'success');
      
      document.getElementById('exDuracao').value = '';
      document.getElementById('exNota').value = '';
      container.querySelectorAll('.emocao-btn').forEach(b => b.classList.remove('selected'));
      selectedType = null;
    } catch (err) { console.error(err); }
  });
}

// ─── 13. CALENDÁRIO E LEMBRETES ───
let dataCalendario = new Date();
let diaSelecionado = null;
let lembretes = JSON.parse(localStorage.getItem('pulse_lembretes')) || {};

function getCorCategoria(cat) {
  const cores = { prova: '#FF7F6A', compromisso: '#5BC0BE', estudo: '#7EC9A8', pessoal: '#C8BEF0', outro: '#94A3B8' };
  return cores[cat] || cores.outro;
}

function renderizarCalendario() {
  const grid = document.getElementById('calGrid');
  const titulo = document.getElementById('calTitulo');
  if (!grid) return;
  
  grid.innerHTML = '';
  const ano = dataCalendario.getFullYear();
  const mes = dataCalendario.getMonth();
  const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  titulo.textContent = `${meses[mes]} de ${ano}`;

  const primeiroDia = new Date(ano, mes, 1).getDay();
  const diasNoMes = new Date(ano, mes + 1, 0).getDate();
  const hoje = new Date();

  for (let i = 0; i < primeiroDia; i++) {
    const divVazia = document.createElement('div');
    divVazia.className = 'cal-dia cal-dia-vazio';
    grid.appendChild(divVazia);
  }

  for (let dia = 1; dia <= diasNoMes; dia++) {
    const divDia = document.createElement('div');
    divDia.className = 'cal-dia';
    divDia.textContent = dia;
    divDia.addEventListener('click', () => abrirPainel(dia));

    if (dia === hoje.getDate() && mes === hoje.getMonth() && ano === hoje.getFullYear()) {
      divDia.classList.add('cal-hoje');
    }

    const dataStr = `${ano}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
    if (lembretes[dataStr] && lembretes[dataStr].length > 0) {
      const dotsContainer = document.createElement('div');
      dotsContainer.className = 'cal-dots';
      const dot = document.createElement('div');
      dot.className = 'cal-mini-dot';
      dot.style.backgroundColor = getCorCategoria(lembretes[dataStr][0].categoria);
      dotsContainer.appendChild(dot);
      divDia.appendChild(dotsContainer);
    }
    grid.appendChild(divDia);
  }
}

function mudarMes(delta) {
  dataCalendario.setMonth(dataCalendario.getMonth() + delta);
  renderizarCalendario();
}

function abrirPainel(dia) {
  diaSelecionado = dia;
  const painel = document.getElementById('calPainel');
  const tituloDia = document.getElementById('calDiaSelecionado');
  const lista = document.getElementById('calLembretesLista');

  painel.style.display = 'block';
  
  const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  tituloDia.textContent = `📌 ${dia} de ${meses[dataCalendario.getMonth()]}`;

  lista.innerHTML = '';
  const dataStr = `${dataCalendario.getFullYear()}-${String(dataCalendario.getMonth() + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
  
  if (lembretes[dataStr] && lembretes[dataStr].length > 0) {
    lembretes[dataStr].forEach(lembrete => {
      const item = document.createElement('div');
      item.className = 'lembrete-item';
      item.style.borderLeft = `4px solid ${getCorCategoria(lembrete.categoria)}`;
      
      const contentDiv = document.createElement('div');
      contentDiv.style.flex = '1';
      
      const titulo = document.createElement('div');
      titulo.style.fontWeight = '700';
      titulo.style.fontSize = '0.9rem';
      titulo.style.color = 'var(--texto)';
      titulo.textContent = lembrete.titulo;
      
      const hora = document.createElement('div');
      hora.style.fontSize = '0.8rem';
      hora.style.color = 'var(--texto-suave)';
      hora.textContent = lembrete.hora ? '🕐 ' + lembrete.hora : 'Sem hora definida';
      
      contentDiv.appendChild(titulo);
      contentDiv.appendChild(hora);
      
      const btnDel = document.createElement('button');
      btnDel.className = 'lembrete-del';
      btnDel.textContent = '🗑️';
      btnDel.addEventListener('click', () => excluirLembrete(dataStr, lembrete.id));
      
      item.appendChild(contentDiv);
      item.appendChild(btnDel);
      lista.appendChild(item);
    });
  } else {
    lista.innerHTML = '<p style="font-size:0.85rem;color:var(--texto-suave);margin-bottom:12px;">Nenhum lembrete para este dia.</p>';
  }
}

function fecharPainel() {
  document.getElementById('calPainel').style.display = 'none';
  diaSelecionado = null;
}

function excluirLembrete(dataStr, id) {
  lembretes[dataStr] = lembretes[dataStr].filter(l => l.id !== id);
  if (lembretes[dataStr].length === 0) delete lembretes[dataStr];
  
  localStorage.setItem('pulse_lembretes', JSON.stringify(lembretes));
  showToast('🗑️ Lembrete removido', 'info');
  
  if (diaSelecionado) abrirPainel(diaSelecionado);
  renderizarCalendario();
}

function initCalendario() {
  const grid = document.getElementById('calGrid');
  if (!grid) return;

  renderizarCalendario();

  document.getElementById('addLembrete')?.addEventListener('click', () => {
    const titulo = document.getElementById('lembreteTitulo').value.trim();
    const hora = document.getElementById('lembreteHora').value;
    const categoria = document.getElementById('lembreteCategoria').value;

    if (!titulo) return showToast('⚠️ Digite um título para o lembrete!', 'warning');

    const dataStr = `${dataCalendario.getFullYear()}-${String(dataCalendario.getMonth() + 1).padStart(2, '0')}-${String(diaSelecionado).padStart(2, '0')}`;

    if (!lembretes[dataStr]) lembretes[dataStr] = [];
    lembretes[dataStr].push({ id: Date.now(), titulo, hora, categoria });
    localStorage.setItem('pulse_lembretes', JSON.stringify(lembretes));

    document.getElementById('lembreteTitulo').value = '';
    document.getElementById('lembreteHora').value = '';

    showToast('✅ Lembrete salvo!', 'success');
    abrirPainel(diaSelecionado);
    renderizarCalendario();
  });
}

// ─── 14. INICIALIZADOR GLOBAL ───
document.addEventListener('DOMContentLoaded', function () {
  protegerRotas();
  
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('acesso') === 'negado') {
    setTimeout(() => {
      openAuthModal('login');
      showToast('🔒 Faça login para acessar esta área!', 'warning');
      window.history.replaceState({}, document.title, window.location.pathname);
    }, 100);
  }

  markActiveNav();
  if (document.getElementById('themeSelector')) initTheme();
  if (document.getElementById('avatarIcon')) updateAuthUI();
  alternarHome();
  bloquearLinksVisitante();

  // Inicializa todos os módulos
  initHumor();
  initMotivacao();
  initRespiracao();
  initPomodoro();
  initGratidao();
  initForum();
  initExercicios();
  initCalendario();

  // Configura os Dropdowns do Menu
  document.querySelectorAll('.dropdown').forEach(dropdown => {
    const link = dropdown.querySelector('.nav-link');
    const menu = dropdown.querySelector('.dropdown-menu');
    if (!link || !menu) return;

    link.addEventListener('click', function (e) {
      e.preventDefault();
      const isOpen = menu.classList.contains('show');
      closeAllDropdowns(isOpen ? null : menu);
      menu.classList.toggle('show', !isOpen);
    });
  });

  document.addEventListener('click', function (e) {
    if (!e.target.closest('.dropdown')) closeAllDropdowns();
    if (!e.target.closest('#themeSelector')) closeThemeMenu();
    const menu = document.getElementById('userMenu');
    if (menu && !menu.contains(e.target)) {
      document.getElementById('userDropdown')?.classList.remove('open');
    }
  });
});

// ═══════════════════════════════════════════════════════════════════
// CONTROLE DO MODAL DE EXCLUSÃO (Precisa ficar fora de outras funções)
// ═══════════════════════════════════════════════════════════════════
let idParaDeletar = null;

function abrirModalDelete(id) {
  idParaDeletar = id;
  const modal = document.getElementById('deleteModal');
  if (modal) modal.classList.add('open');
}

function fecharModalDelete() {
  idParaDeletar = null;
  const modal = document.getElementById('deleteModal');
  if (modal) modal.classList.remove('open');
}

async function confirmarDelete() {
  if (!idParaDeletar) return;
  
  const btnConfirmar = document.getElementById('btnConfirmarDelete');
  if (btnConfirmar) {
    btnConfirmar.textContent = 'Apagando...';
    btnConfirmar.disabled = true;
  }

  try {
    await apiRequest(`/api/data/mood/${idParaDeletar}`, 'DELETE');
    showToast('🗑️ Registro apagado com sucesso!', 'success');
    
    fecharModalDelete();
    carregarHistoricoHumor(); // Atualiza a lista na hora
    
  } catch (err) {
    console.error("Erro ao deletar:", err);
  } finally {
    if (btnConfirmar) {
      btnConfirmar.textContent = 'Sim, apagar';
      btnConfirmar.disabled = false;
    }
  }
}