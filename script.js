// ═══════════════════════════════════════════════════════════════════
// P.U.L.S.E — JavaScript Principal
// ═══════════════════════════════════════════════════════════════════
// ÍNDICE:
// 00. Proteção de Rotas (Bloqueio de Visitante)
// 01. Utilitários (Toast)
// 02. Sistema de Tema
// 03. Sistema de Autenticação
// 04. Navegação
// 05. Humor
// 06. Respiração
// 07. Pomodoro
// 08. Gratidão
// 09. Fórum
// 10. Nutrição
// 11. Água
// 12. Motivação
// 13. Sono
// 14. Emoções
// 15. Calendário
// 16. Exercícios
// 17. Inicializador (único)
// ═══════════════════════════════════════════════════════════════════


// ─── 00. PROTEÇÃO DE ROTAS ───
// Verifica se o usuário tem login. Se não tiver, bloqueia o acesso.
function protegerRotas() {
  const token = localStorage.getItem('pulse_token');
  const path = window.location.pathname;
  const page = path.split('/').pop() || 'index.html';

  // Páginas que NÃO precisam de login
  const paginasPublicas = ['index.html', '404.html', ''];

  // Se não tem token E não está em uma página pública, redireciona
  if (!token && !paginasPublicas.includes(page)) {
    // Verifica se está em subpasta para voltar o caminho correto
    const isSubfolder = path.includes('/humor/') || path.includes('/autocuidado/') || 
                        path.includes('/rotina/') || path.includes('/forum/') || 
                        path.includes('/nutricao/');
    
    const redirectURL = isSubfolder ? '../index.html?acesso=negado' : 'index.html?acesso=negado';
    window.location.href = redirectURL;
  }
}

// Bloqueia os cliques nos links do menu para visitantes
function bloquearLinksVisitante() {
  const token = localStorage.getItem('pulse_token');
  
  if (!token) {
    document.querySelectorAll('nav a').forEach(link => {
      const href = link.getAttribute('href');
      // Se o link não for a página inicial ou externo, bloqueia o clique
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
  if (typeof showToast === 'function') {
    const labels = { system: 'do sistema', light: 'claro', dark: 'escuro' };
    showToast('🎨 Tema ' + labels[theme] + ' ativado');
  }
}

function toggleThemeMenu(e) {
  if (e) e.stopPropagation();
  document.getElementById('themeSelector')?.classList.toggle('open');
}

function closeThemeMenu() {
  document.getElementById('themeSelector')?.classList.remove('open');
}

function initTheme() {
  const saved = localStorage.getItem('pulse_theme') || 'system';
  applyTheme(saved);
}


// ─── 03. SISTEMA DE AUTENTICAÇÃO ───
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

function handleModalRegister(e) {
  e.preventDefault();
  const name = document.getElementById('modalRegName').value.trim();
  const email = document.getElementById('modalRegEmail').value.trim().toLowerCase();
  const password = document.getElementById('modalRegPassword').value;
  const course = document.getElementById('modalRegCourse').value.trim();

  if (!name || !email || !password) {
    showToast('⚠️ Preencha todos os campos obrigatórios!');
    return;
  }

  fetch('http://localhost:3000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password, course })
  })
  .then(res => res.json())
  .then(data => {
    if (data.error) {
      showToast('⚠️ ' + data.error);
    } else {
      localStorage.setItem('pulse_token', data.token);
      localStorage.setItem('pulse_session', JSON.stringify({
        name: data.user.name,
        email: data.user.email,
        loggedIn: true
      }));
      showToast('🎉 Conta criada com sucesso!');
      closeAuthModal();
      setTimeout(() => window.location.reload(), 1000);
    }
  })
  .catch(err => {
    console.error(err);
    showToast('❌ Erro ao conectar com o servidor.');
  });
}

function handleModalLogin(e) {
  e.preventDefault();
  const email = document.getElementById('modalLoginEmail').value.trim().toLowerCase();
  const password = document.getElementById('modalLoginPassword').value;

  if (!email || !password) {
    showToast('⚠️ Preencha todos os campos!');
    return;
  }

  fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  })
  .then(res => res.json())
  .then(data => {
    if (data.error) {
      showToast('⚠️ ' + data.error);
    } else {
      localStorage.setItem('pulse_token', data.token);
      localStorage.setItem('pulse_session', JSON.stringify({
        name: data.user.name,
        email: data.user.email,
        loggedIn: true
      }));
      showToast('✅ Bem-vindo(a) de volta, ' + data.user.name + '!');
      closeAuthModal();
      setTimeout(() => window.location.reload(), 1000);
    }
  })
  .catch(err => {
    console.error(err);
    showToast('❌ Erro ao conectar com o servidor.');
  });
}

function handleLogout() {
  localStorage.removeItem('pulse_token');
  localStorage.removeItem('pulse_session');
  document.getElementById('userDropdown')?.classList.remove('open');
  showToast('👋 Até logo!');
  setTimeout(() => window.location.reload(), 1000);
}


// ─── 04. NAVEGAÇÃO ───
function toggleUserDropdown() {
  document.getElementById('userDropdown')?.classList.toggle('open');
}

function updateAuthUI() {
  const session = JSON.parse(localStorage.getItem('pulse_session') || '{}');
  const isLoggedIn = session.loggedIn === true;

  const avatarIcon = document.getElementById('avatarIcon');
  if (avatarIcon) avatarIcon.textContent = isLoggedIn ? '😊' : '👤';

  const status = document.getElementById('userStatus');
  if (status) status.classList.toggle('logged-in', isLoggedIn);

  const loggedOut = document.getElementById('dropdownLoggedOut');
  const loggedIn = document.getElementById('dropdownLoggedIn');
  if (loggedOut) loggedOut.style.display = isLoggedIn ? 'none' : 'flex';
  if (loggedIn) loggedIn.style.display = isLoggedIn ? 'flex' : 'none';

  if (isLoggedIn) {
    const nameEl = document.getElementById('dropdownUserName');
    const emailEl = document.getElementById('dropdownUserEmail');
    const avatarLarge = document.getElementById('dropdownAvatar');

    if (nameEl) nameEl.textContent = session.name;
    if (emailEl) emailEl.textContent = session.email;
    if (avatarLarge) avatarLarge.textContent = session.name.charAt(0).toUpperCase();
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
      const welcomeName = document.getElementById('welcomeName');
      if (welcomeName && session.name) {
        welcomeName.textContent = session.name;
      }
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


// ─── 05. HUMOR ───
function initHumor() {
  if (!document.getElementById('humorEmojis')) return;
  // TODO: Lógica de monitoramento
}

// ─── 06. RESPIRAÇÃO ───
function initRespiracao() {
  if (!document.querySelector('.breathing-circle')) return;
  // TODO: Lógica de respiração
}

// ─── 07. POMODORO ───
function initPomodoro() {
  if (!document.getElementById('pomodoroTimer')) return;
  // TODO: Lógica do Pomodoro
}

// ─── 08. GRATIDÃO ───
function initGratidao() {
  if (!document.getElementById('gratidaoForm')) return;
  // TODO: Lógica de gratidão
}

// ─── 09. FÓRUM ───
function initForum() {
  if (!document.getElementById('forumPosts')) return;
  // TODO: Lógica do fórum
}

// ─── 10. NUTRIÇÃO ───
function initNutricao() {
  if (!document.getElementById('imcResult')) return;
  // TODO: Lógica das calculadoras
}

// ─── 11. ÁGUA ───
function initAgua() {
  if (!document.getElementById('aguaContador')) return;
  // TODO: Lógica de hidratação
}

// ─── 12. MOTIVAÇÃO ───
function initMotivacao() {
  if (!document.querySelector('.motivacao-card')) return;
  // TODO: Lógica de frases diárias
}

// ─── 13. SONO ───
function initSono() {
  if (!document.getElementById('sonoForm')) return;
  // TODO: Lógica de monitoramento de sono
}

// ─── 14. EMOÇÕES ───
function initEmocoes() {
  if (!document.querySelector('.emocoes-grid')) return;
  // TODO: Lógica de emoções
}

// ─── 15. CALENDÁRIO ───
function initCalendario() {
  if (!document.querySelector('.calendario-wrapper')) return;
  // TODO: Lógica do calendário
}

// ─── 16. EXERCÍCIOS ───
function initExercicios() {
  if (!document.getElementById('tipoExercicio')) return;
  // TODO: Lógica de exercícios
}


// ─── 17. INICIALIZADOR (ÚNICO) ───
document.addEventListener('DOMContentLoaded', function () {
  // 1. PROTEÇÃO DE ROTAS (Sempre a primeira coisa a rodar)
  protegerRotas();
  
  // 2. VERIFICA SE VEIO DE UM BLOQUEIO (Para abrir o modal na Home)
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('acesso') === 'negado') {
    setTimeout(() => {
      openAuthModal('login');
      showToast('🔒 Faça login para acessar esta área!');
      // Limpa o "?acesso=negado" da URL para não ficar feio
      window.history.replaceState({}, document.title, window.location.pathname);
    }, 100);
  }

  // 3. INICIALIZAÇÕES GERAIS
  markActiveNav();
  if (document.getElementById('themeSelector')) initTheme();
  if (document.getElementById('avatarIcon')) updateAuthUI();
  alternarHome();
  
  // 4. BLOQUEIA OS LINKS DO MENU PARA VISITANTES
  bloquearLinksVisitante();

  // 5. INICIALIZA AS FEATURES
  initHumor();
  initRespiracao();
  initPomodoro();
  initGratidao();
  initForum();
  initNutricao();
  initAgua();
  initMotivacao();
  initSono();
  initEmocoes();
  initCalendario();
  initExercicios();

  // 6. DROPDOWNS DO MENU
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