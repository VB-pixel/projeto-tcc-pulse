// ═══════════════════════════════════════════════════════════════════
// P.U.L.S.E — JavaScript Principal (Profissional - Backend)
// ═══════════════════════════════════════════════════════════════════

const API_URL = 'http://localhost:3000';

// ─── 00. PROTEÇÃO DE ROTAS ───
function protegerRotas() {
  const token = localStorage.getItem('pulse_token'); // O token JWT precisa ficar no local
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
          showToast('🔒 Faça login para acessar esta área!');
        });
      }
    });
  }
}

// ─── 01. UTILITÁRIOS ───
function showToast(msg, duration = 3000) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), duration);
}

// Função profissional para requisições autenticadas
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
    showToast('❌ ' + error.message);
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
  showToast('🎨 Tema alterado');
}
function toggleThemeMenu(e) { if (e) e.stopPropagation(); document.getElementById('themeSelector')?.classList.toggle('open'); }
function closeThemeMenu() { document.getElementById('themeSelector')?.classList.remove('open'); }
function initTheme() { applyTheme(localStorage.getItem('pulse_theme') || 'system'); }


// ─── 03. SISTEMA DE AUTENTICAÇÃO ───
function openAuthModal(tab = 'login') {
  document.getElementById('authModal')?.classList.add('open');
  document.getElementById('userDropdown')?.classList.remove('open');
  switchModalTab(tab);
}
function closeAuthModal() { document.getElementById('authModal')?.classList.remove('open'); }

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

  if (!name || !email || !password) return showToast('⚠️ Preencha todos os campos!');

  try {
    const data = await apiRequest('/api/auth/register', 'POST', { name, email, password, course });
    localStorage.setItem('pulse_token', data.token);
    localStorage.setItem('pulse_session', JSON.stringify({ name: data.user.name, email: data.user.email, loggedIn: true }));
    showToast('🎉 Conta criada!');
    closeAuthModal();
    setTimeout(() => window.location.reload(), 1000);
  } catch (err) {}
}

async function handleModalLogin(e) {
  e.preventDefault();
  const email = document.getElementById('modalLoginEmail').value.trim().toLowerCase();
  const password = document.getElementById('modalLoginPassword').value;

  if (!email || !password) return showToast('⚠️ Preencha todos os campos!');

  try {
    const data = await apiRequest('/api/auth/login', 'POST', { email, password });
    localStorage.setItem('pulse_token', data.token);
    localStorage.setItem('pulse_session', JSON.stringify({ name: data.user.name, email: data.user.email, loggedIn: true }));
    showToast('✅ Bem-vindo(a), ' + data.user.name + '!');
    closeAuthModal();
    setTimeout(() => window.location.reload(), 1000);
  } catch (err) {}
}

function handleLogout() {
  localStorage.removeItem('pulse_token');
  localStorage.removeItem('pulse_session');
  document.getElementById('userDropdown')?.classList.remove('open');
  showToast('👋 Até logo!');
  setTimeout(() => window.location.reload(), 1000);
}

// ─── 04. NAVEGAÇÃO ───
function toggleUserDropdown() { document.getElementById('userDropdown')?.classList.toggle('open'); }

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
      if (document.getElementById('welcomeName') && session.name) document.getElementById('welcomeName').textContent = session.name;
    } else {
      homeVisitante.style.display = 'block';
      homeLogado.style.display = 'none';
    }
  }
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

// ─── 05. HUMOR (Salvando no Backend) ───
function initHumor() {
  const btns = document.querySelectorAll('.humor-btn');
  if (!btns.length) return;
  let selectedMood = null;

  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      btns.forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      selectedMood = btn.dataset.mood;
    });
  });

  document.getElementById('saveHumor')?.addEventListener('click', async () => {
    if (!selectedMood) return showToast('⚠️ Selecione um humor primeiro!');
    const note = document.getElementById('humorNote')?.value || '';
    
    try {
      // Envia pro Backend (API)
      await apiRequest('/api/data/mood', 'POST', { mood: selectedMood, note, date: new Date().toISOString() });
      
      showToast('✅ Humor salvo no banco de dados!');
      document.getElementById('humorNote').value = '';
      btns.forEach(b => b.classList.remove('selected'));
      selectedMood = null;
    } catch (err) {
      console.error(err);
    }
  });
}

// ─── 06. RESPIRAÇÃO ───
// ─── 06. RESPIRAÇÃO ───
function initRespiracao() {
  const circle = document.getElementById('breathCircle');
  if (!circle) return;
  
  let running = false;
  let cycle = 0;
  let timer = null;
  
  // Fases da técnica 4-7-8
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

    // Atualiza a contagem de ciclos (a cada 3 fases = 1 ciclo)
    if (index % 3 === 0 && index > 0) cycle++;
    
    const countEl = document.getElementById('breathCount');
    if (countEl) countEl.textContent = `Ciclo ${cycle + 1} de 4`;

    if (cycle >= 4) {
      stop();
      return;
    }

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

  // Evento de clique no círculo
  circle.addEventListener('click', () => {
    if (running) {
      stop();
      return;
    }
    running = true;
    cycle = 0;
    circle.textContent = '●';
    nextPhase(0);
  });
}

// ─── 07. POMODORO ───
function initPomodoro() {
  const display = document.getElementById('pomodoroTime');
  if (!display) return;
  let seconds = 25 * 60, running = false, interval = null, isBreak = false;

  function update() {
    display.textContent = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  }

  async function tick() {
    seconds--; update();
    if (seconds <= 0) {
      clearInterval(interval); running = false;
      if (!isBreak) {
        // Salva no Banco
        try { await apiRequest('/api/data/pomodoro', 'POST', { date: new Date().toISOString() }); } catch(e) {}
        
        showToast('🍅 Sessão completa! Hora de pausar.');
        isBreak = true; seconds = 5 * 60;
        document.getElementById('pomodoroStatus').textContent = 'Pausa curta ☕';
        document.getElementById('pomodoroStart').textContent = '▶ Iniciar pausa';
      } else {
        showToast('✅ Pausa terminada!');
        isBreak = false; seconds = 25 * 60;
        document.getElementById('pomodoroStatus').textContent = 'Sessão de foco';
        document.getElementById('pomodoroStart').textContent = '▶ Iniciar';
      }
      update();
    }
  } // <--- ESTA CHAVE ESTAVA FALTANDO

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

// ─── 08. GRATIDÃO ───
function initGratidao() {
  document.getElementById('saveGratidao')?.addEventListener('click', async () => {
    const g1 = document.getElementById('gratidao1')?.value;
    const g2 = document.getElementById('gratidao2')?.value;
    const g3 = document.getElementById('gratidao3')?.value;
    
    if (!g1 && !g2 && !g3) return showToast('⚠️ Escreva pelo menos uma gratidão!');
    
    try {
      await apiRequest('/api/data/gratitude', 'POST', { g1, g2, g3, date: new Date().toISOString() });
      
      showToast('💛 Gratidões salvas no banco de dados!');
      ['gratidao1', 'gratidao2', 'gratidao3'].forEach(id => { 
        const el = document.getElementById(id); 
        if (el) el.value = ''; 
      });
    } catch (err) {
      console.error(err);
    }
  });
}

// ─── 09. FÓRUM ───
function initForum() {
  const modal = document.getElementById('newPostModal');
  if (modal) {
    document.getElementById('openNewPost')?.addEventListener('click', () => modal.classList.add('open'));
    document.getElementById('closeModal')?.addEventListener('click', () => modal.classList.remove('open'));
    document.getElementById('cancelPost')?.addEventListener('click', () => modal.classList.remove('open'));
    document.getElementById('submitPost')?.addEventListener('click', () => {
      const title = document.getElementById('postTitle')?.value;
      if (!title) return showToast('Adicione um título!');
      showToast('✅ Pergunta enviada!');
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

window.likePost = function(btn) {
  const span = btn.querySelector('span');
  if (span) {
    span.textContent = parseInt(span.textContent) + 1;
    btn.style.borderColor = 'var(--coral)';
    btn.style.color = 'var(--coral)';
    btn.disabled = true;
    showToast('👍 Curtido!');
  }
};

// ─── 10. NUTRIÇÃO ───
window.calcIMC = function() {
  const peso = parseFloat(document.getElementById('imcPeso').value);
  const alturaCm = parseFloat(document.getElementById('imcAltura').value);
  const out = document.getElementById('imcResult');
  if (!peso || !alturaCm) return showToast('⚠️ Preencha peso e altura!');
  
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

// ─── 16. EXERCÍCIOS ───
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
    if (!selectedType || !duracao) return showToast('⚠️ Selecione o tipo e a duração!');
    
    const intensidade = document.getElementById('exIntensidade').value;
    const nota = document.getElementById('exNota').value;
    
    try {
      await apiRequest('/api/data/exercise', 'POST', { tipo: selectedType, duracao, intensidade, nota, date: new Date().toISOString() });
      
      showToast('💪 Treino salvo no banco de dados!');
      document.getElementById('exDuracao').value = '';
      document.getElementById('exNota').value = '';
      container.querySelectorAll('.emocao-btn').forEach(b => b.classList.remove('selected'));
      selectedType = null;
    } catch (err) {
      console.error(err);
    }
  });
}

// ─── 17. INICIALIZADOR ───
document.addEventListener('DOMContentLoaded', function () {
  protegerRotas();
  
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('acesso') === 'negado') {
    setTimeout(() => {
      openAuthModal('login');
      showToast('🔒 Faça login para acessar esta área!');
      window.history.replaceState({}, document.title, window.location.pathname);
    }, 100);
  }

  markActiveNav();
  if (document.getElementById('themeSelector')) initTheme();
  if (document.getElementById('avatarIcon')) updateAuthUI();
  alternarHome();
  bloquearLinksVisitante();

  initHumor();
  initRespiracao();
  initPomodoro();
  initGratidao();
  initForum();
  initExercicios();

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