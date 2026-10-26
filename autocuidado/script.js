// ── TOAST ──────────────────────────────────────────
function showToast(msg, duration = 3000) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), duration);
}

// ── MONITORAMENTO DE HUMOR ───────────────────────────────────
const MOOD_EMOJIS = { 5: '😄', 4: '🙂', 3: '😐', 2: '😔', 1: '😢' };
let selectedMood = null;

function initHumor() {
  const btns = document.querySelectorAll('.humor-btn');
  if (!btns.length) return;

  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      btns.forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      selectedMood = parseInt(btn.dataset.mood);
      const label = document.getElementById('selectedLabel');
      if (label) label.textContent = `Selecionado: ${MOOD_EMOJIS[selectedMood]} ${btn.dataset.label}`;
    });
  });

  const saveBtn = document.getElementById('saveHumor');
  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      if (!selectedMood) { showToast('Selecione um humor primeiro!'); return; }
      const note = document.getElementById('humorNote')?.value || '';

      const moodData = {
        mood: selectedMood,
        emoji: MOOD_EMOJIS[selectedMood],
        label: document.querySelector('.humor-btn.selected')?.dataset.label || '',
        note,
        date: new Date().toISOString()
      };

      // Salvar no localStorage geral (para compatibilidade)
      const logs = JSON.parse(localStorage.getItem('pulse_humor') || '[]');
      logs.unshift({
        ...moodData,
        date: new Date().toLocaleString('pt-BR')
      });
      localStorage.setItem('pulse_humor', JSON.stringify(logs.slice(0, 30)));

      // Salvar no perfil do usuário
      saveUserData('mood', moodData);

      showToast('✅ Humor registrado!');
      selectedMood = null;
      btns.forEach(b => b.classList.remove('selected'));
      const label = document.getElementById('selectedLabel');
      if (label) label.textContent = 'Nenhum humor selecionado';
      if (document.getElementById('humorNote')) document.getElementById('humorNote').value = '';
      renderHistory();
      renderHumorChart();
      updateAuthUI(); // Atualiza perfil
    });
  }

  renderHistory();
  renderHumorChart();
}

function renderHistory() {
  const container = document.getElementById('humorHistory');
  if (!container) return;
  const logs = JSON.parse(localStorage.getItem('pulse_humor') || '[]');
  if (!logs.length) {
    container.innerHTML = '<p style="color:var(--texto-suave);font-size:0.88rem;">Nenhum registro ainda. Comece registrando seu humor acima!</p>';
    return;
  }
  container.innerHTML = logs.slice(0, 7).map(l => `
    <div class="humor-log-item">
      <span class="humor-log-emoji">${l.emoji}</span>
      <div style="flex:1">
        <strong style="font-size:0.88rem;">${l.label}</strong>
        ${l.note ? `<p style="font-size:0.8rem;color:var(--texto-suave);margin-top:2px;">${l.note}</p>` : ''}
      </div>
      <span style="font-size:0.75rem;color:var(--texto-suave);white-space:nowrap;">${l.date}</span>
    </div>
  `).join('');
}

function renderHumorChart() {
  const container = document.getElementById('humorChart');
  if (!container) return;
  const logs = JSON.parse(localStorage.getItem('pulse_humor') || '[]');
  if (!logs.length) return;
  const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  const labels = { 5: '😄 Ótimo', 4: '🙂 Bem', 3: '😐 Neutro', 2: '😔 Mal', 1: '😢 Muito mal' };
  logs.forEach(l => { if (counts[l.mood] !== undefined) counts[l.mood]++; });
  const max = Math.max(...Object.values(counts), 1);
  container.innerHTML = Object.entries(counts).reverse().map(([k, v]) => `
    <div class="chart-bar-wrap">
      <div class="chart-bar-label"><span>${labels[k]}</span><span>${v} registro(s)</span></div>
      <div class="chart-bar-track"><div class="chart-bar-fill" style="width:${(v / max) * 100}%"></div></div>
    </div>
  `).join('');
}

// ── BREATHING ──────────────────────────────────────
function initBreathing() {
  const circle = document.getElementById('breathCircle');
  const phase = document.getElementById('breathPhase');
  const count = document.getElementById('breathCount');
  if (!circle) return;

  let running = false, cycle = 0, timer = null;
  const phases = [
    { label: 'Inspire... 🌬️', duration: 4000, cls: 'inhale' },
    { label: 'Segure... 🤫', duration: 7000, cls: '' },
    { label: 'Expire devagar... 😮‍💨', duration: 8000, cls: 'exhale' }
  ];

  function nextPhase(i) {
    if (!running) return;
    const p = phases[i % phases.length];
    circle.className = 'breathing-circle ' + p.cls;
    if (phase) phase.textContent = p.label;
    if (i % phases.length === 0 && i > 0) cycle++;
    if (count) count.textContent = `Ciclo ${cycle + 1} de 4`;
    if (cycle >= 4) { stop(); return; }
    timer = setTimeout(() => nextPhase(i + 1), p.duration);
  }

  function stop() {
    running = false;
    clearTimeout(timer);
    circle.className = 'breathing-circle';
    circle.textContent = 'Toque para começar';
    if (phase) phase.textContent = cycle >= 4 ? '✅ Exercício completo!' : '';
    if (count) count.textContent = '';
    cycle = 0;
  }

  circle.addEventListener('click', () => {
    if (running) { stop(); return; }
    running = true;
    cycle = 0;
    circle.textContent = '●';
    nextPhase(0);
  });
}

// ── POMODORO ───────────────────────────────────────
function initPomodoro() {
  const display = document.getElementById('pomodoroTime');
  const status = document.getElementById('pomodoroStatus');
  const startBtn = document.getElementById('pomodoroStart');
  const resetBtn = document.getElementById('pomodoroReset');
  const countEl = document.getElementById('pomodoroCount');
  if (!display) return;

  let seconds = 25 * 60, running = false, interval = null;
  let isBreak = false, sessions = parseInt(localStorage.getItem('pulse_pomodoro') || '0');
  if (countEl) countEl.textContent = sessions;

  function update() {
    const m = Math.floor(seconds / 60), s = seconds % 60;
    display.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  function tick() {
    seconds--;
    update();
    if (seconds <= 0) {
      clearInterval(interval);
      running = false;
      if (!isBreak) {
        sessions++;
        localStorage.setItem('pulse_pomodoro', sessions);
        // Salvar no perfil do usuário
        saveUserData('pomodoro', { date: new Date().toISOString() });
        if (countEl) countEl.textContent = sessions;
        showToast('🍅 Sessão completa! Hora de pausar 5 minutos.');
        isBreak = true;
        seconds = 5 * 60;
        if (status) status.textContent = 'Pausa curta ☕';
        startBtn.textContent = '▶ Iniciar pausa';
        updateAuthUI(); // Atualiza perfil
      } else {
        showToast('✅ Pausa terminada! Pronto para estudar?');
        isBreak = false;
        seconds = 25 * 60;
        if (status) status.textContent = 'Sessão de foco';
        startBtn.textContent = '▶ Iniciar';
      }
      update();
    }
  }

  startBtn?.addEventListener('click', () => {
    if (running) {
      clearInterval(interval); running = false;
      startBtn.textContent = '▶ Continuar';
    } else {
      running = true;
      interval = setInterval(tick, 1000);
      startBtn.textContent = '⏸ Pausar';
    }
  });

  resetBtn?.addEventListener('click', () => {
    clearInterval(interval); running = false;
    isBreak = false; seconds = 25 * 60;
    if (status) status.textContent = 'Sessão de foco';
    startBtn.textContent = '▶ Iniciar';
    update();
  });
}

// ── GRATIDÃO ───────────────────────────────────────
function initGratidao() {
  const btn = document.getElementById('saveGratidao');
  if (!btn) return;
  btn.addEventListener('click', () => {
    const g1 = document.getElementById('gratidao1')?.value;
    const g2 = document.getElementById('gratidao2')?.value;
    const g3 = document.getElementById('gratidao3')?.value;
    if (!g1 && !g2 && !g3) { showToast('Escreva pelo menos uma gratidão!'); return; }

    const gratitudeData = { g1, g2, g3, date: new Date().toISOString() };

    // Salvar no localStorage geral
    const logs = JSON.parse(localStorage.getItem('pulse_gratidao') || '[]');
    logs.unshift({ g1, g2, g3, date: new Date().toLocaleDateString('pt-BR') });
    localStorage.setItem('pulse_gratidao', JSON.stringify(logs.slice(0, 30)));

    // Salvar no perfil do usuário
    saveUserData('gratitude', gratitudeData);

    showToast('💛 Gratidões salvas!');
    ['gratidao1', 'gratidao2', 'gratidao3'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
    updateAuthUI(); // Atualiza perfil
  });
}

// ── FÓRUM ──────────────────────────────────────────
function initForum() {
  const openBtn = document.getElementById('openNewPost');
  const closeBtn = document.getElementById('closeModal');
  const cancelBtn = document.getElementById('cancelPost');
  const submitBtn = document.getElementById('submitPost');
  const modal = document.getElementById('newPostModal');
  if (!modal) return;

  openBtn?.addEventListener('click', () => modal.classList.add('open'));
  closeBtn?.addEventListener('click', () => modal.classList.remove('open'));
  cancelBtn?.addEventListener('click', () => modal.classList.remove('open'));
  modal.addEventListener('click', e => { if (e.target === modal) modal.classList.remove('open'); });

  submitBtn?.addEventListener('click', () => {
    const title = document.getElementById('postTitle')?.value;
    if (!title) { showToast('Adicione um título!'); return; }
    showToast('✅ Pergunta enviada para revisão!');
    modal.classList.remove('open');
    document.getElementById('postTitle').value = '';
    document.getElementById('postBody').value = '';
  });

  // Filtros do fórum
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

// ── LIKES ──────────────────────────────────────────
function likePost(btn) {
  const span = btn.querySelector('span');
  const current = parseInt(span.textContent);
  span.textContent = current + 1;
  btn.style.borderColor = 'var(--coral)';
  btn.style.color = 'var(--coral)';
  btn.disabled = true;
  showToast('👍 Curtido!');
}

// ── NUTRIÇÃO TABS ──────────────────────────────────
function initNutriTabs() {
  const tabs = document.querySelectorAll('[data-tab]');
  if (!tabs.length) return;
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
      const target = document.getElementById('tab-' + tab.dataset.tab);
      if (target) target.style.display = '';
    });
  });
}

// ── WATER TRACKER ─────────────────────────────────
function initWater() {
  const container = document.getElementById('waterCups');
  const statusEl = document.getElementById('waterStatus');
  if (!container) return;

  const today = new Date().toDateString();
  let saved = JSON.parse(localStorage.getItem('pulse_water') || '{}');
  if (saved.date !== today) saved = { date: today, cups: 0 };
  let cups = saved.cups;

  function render() {
    container.innerHTML = '';
    for (let i = 1; i <= 8; i++) {
      const btn = document.createElement('button');
      btn.style.cssText = `font-size:1.6rem;background:${i <= cups ? 'var(--menta)' : 'var(--lavanda-claro)'};border:2px solid ${i <= cups ? 'var(--menta-vibrante)' : 'var(--borda)'};border-radius:12px;padding:10px;cursor:pointer;transition:all 0.2s;`;
      btn.textContent = i <= cups ? '💧' : '🫗';
      btn.addEventListener('click', () => {
        cups = (cups === i) ? i - 1 : i;
        localStorage.setItem('pulse_water', JSON.stringify({ date: today, cups }));
        // Salvar no perfil do usuário
        saveUserData('water', { date: new Date().toISOString(), cups });
        render();
        if (cups === 8) showToast('🎉 Meta de hidratação atingida!');
        updateAuthUI(); // Atualiza perfil
      });
      container.appendChild(btn);
    }
    if (statusEl) statusEl.textContent = `${cups} de 8 copos bebidos hoje ${cups >= 8 ? '✅' : ''}`;
  }
  render();
}

// ============================================================
// 🆕 NOVO CÓDIGO ADICIONADO: SISTEMA DE AUTENTICAÇÃO
// ============================================================

// ── TOGGLE DROPDOWN ──
function toggleUserDropdown() {
  const dropdown = document.getElementById('userDropdown');
  dropdown.classList.toggle('open');
}

// Fechar dropdown ao clicar fora
document.addEventListener('click', function (e) {
  const menu = document.getElementById('userMenu');
  if (menu && !menu.contains(e.target)) {
    document.getElementById('userDropdown')?.classList.remove('open');
  }
});

// ── ABRIR/FECHAR MODAL ──
function openAuthModal(tab = 'login') {
  document.getElementById('authModal').classList.add('open');
  document.getElementById('userDropdown')?.classList.remove('open');
  switchModalTab(tab);
}

function closeAuthModal() {
  document.getElementById('authModal').classList.remove('open');
}

// Fechar modal ao clicar fora
document.getElementById('authModal')?.addEventListener('click', function (e) {
  if (e.target === this) closeAuthModal();
});

// ── SWITCH TABS NO MODAL ──
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

// ── REGISTRO NO MODAL ──
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
  if (password.length < 6) {
    showToast('⚠️ A senha deve ter pelo menos 6 caracteres!');
    return;
  }

  let users = JSON.parse(localStorage.getItem('pulse_users') || '[]');

  if (users.some(u => u.email === email)) {
    showToast('⚠️ Este e-mail já está cadastrado!');
    return;
  }

  const user = {
    id: Date.now().toString(),
    name,
    email,
    password,
    course: course || '',
    createdAt: new Date().toISOString(),
    moodLogs: [],
    waterLogs: [],
    pomodoroSessions: 0,
    gratitudeLogs: []
  };

  users.push(user);
  localStorage.setItem('pulse_users', JSON.stringify(users));

  showToast('🎉 Conta criada com sucesso!');

  document.getElementById('modalRegName').value = '';
  document.getElementById('modalRegEmail').value = '';
  document.getElementById('modalRegPassword').value = '';
  document.getElementById('modalRegCourse').value = '';

  loginUser(email, password);
}

// ── LOGIN NO MODAL ──
function handleModalLogin(e) {
  e.preventDefault();

  const email = document.getElementById('modalLoginEmail').value.trim().toLowerCase();
  const password = document.getElementById('modalLoginPassword').value;

  if (!email || !password) {
    showToast('⚠️ Preencha todos os campos!');
    return;
  }

  loginUser(email, password);
}

// ── LOGIN ──
function loginUser(email, password) {
  const users = JSON.parse(localStorage.getItem('pulse_users') || '[]');
  const user = users.find(u => u.email === email && u.password === password);

  if (!user) {
    showToast('⚠️ E-mail ou senha incorretos!');
    return;
  }

  localStorage.setItem('pulse_session', JSON.stringify({
    userId: user.id,
    name: user.name,
    email: user.email,
    loggedIn: true
  }));

  showToast('✅ Bem-vindo(a) de volta, ' + user.name + '!');

  document.getElementById('modalLoginEmail').value = '';
  document.getElementById('modalLoginPassword').value = '';
  closeAuthModal();

  updateAuthUI();
}

// ── LOGOUT ──
function handleLogout() {
  localStorage.removeItem('pulse_session');
  document.getElementById('userDropdown')?.classList.remove('open');
  showToast('👋 Até logo!');
  updateAuthUI();
}

// ── SALVAR DADOS DO USUÁRIO ──
function saveUserData(dataType, data) {
  const session = JSON.parse(localStorage.getItem('pulse_session') || '{}');
  if (!session.loggedIn) return false;

  const users = JSON.parse(localStorage.getItem('pulse_users') || '[]');
  const userIndex = users.findIndex(u => u.id === session.userId);

  if (userIndex === -1) return false;

  if (dataType === 'mood') {
    users[userIndex].moodLogs = users[userIndex].moodLogs || [];
    users[userIndex].moodLogs.unshift(data);
    users[userIndex].moodLogs = users[userIndex].moodLogs.slice(0, 100);
  } else if (dataType === 'water') {
    users[userIndex].waterLogs = users[userIndex].waterLogs || [];
    users[userIndex].waterLogs.push(data);
  } else if (dataType === 'pomodoro') {
    users[userIndex].pomodoroSessions = (users[userIndex].pomodoroSessions || 0) + 1;
  } else if (dataType === 'gratitude') {
    users[userIndex].gratitudeLogs = users[userIndex].gratitudeLogs || [];
    users[userIndex].gratitudeLogs.unshift(data);
    users[userIndex].gratitudeLogs = users[userIndex].gratitudeLogs.slice(0, 50);
  }

  localStorage.setItem('pulse_users', JSON.stringify(users));
  return true;
}

// ── ATUALIZAR UI ──
function updateAuthUI() {
  const session = JSON.parse(localStorage.getItem('pulse_session') || '{}');
  const isLoggedIn = session.loggedIn === true;
  const users = JSON.parse(localStorage.getItem('pulse_users') || '[]');
  const user = users.find(u => u.id === session.userId);

  // Atualizar avatar
  const avatarIcon = document.getElementById('avatarIcon');
  if (avatarIcon) {
    avatarIcon.textContent = isLoggedIn ? '😊' : '👤';
  }

  // Atualizar status (bolinha verde/cinza)
  const status = document.getElementById('userStatus');
  if (status) {
    if (isLoggedIn) {
      status.classList.add('logged-in');
    } else {
      status.classList.remove('logged-in');
    }
  }

  // Atualizar dropdown
  const loggedOut = document.getElementById('dropdownLoggedOut');
  const loggedIn = document.getElementById('dropdownLoggedIn');
  if (loggedOut) loggedOut.style.display = isLoggedIn ? 'none' : 'flex';
  if (loggedIn) loggedIn.style.display = isLoggedIn ? 'flex' : 'none';

  if (isLoggedIn && user) {
    const userName = document.getElementById('dropdownUserName');
    const userEmail = document.getElementById('dropdownUserEmail');
    const userAvatar = document.getElementById('dropdownAvatar');

    if (userName) userName.textContent = user.name;
    if (userEmail) userEmail.textContent = user.email;
    if (userAvatar) userAvatar.textContent = user.name.charAt(0).toUpperCase();

    // Estatísticas
    const moodCount = document.getElementById('dropdownMoodCount');
    const waterCount = document.getElementById('dropdownWaterCount');
    const pomodoroCount = document.getElementById('dropdownPomodoroCount');

    if (moodCount) moodCount.textContent = user.moodLogs?.length || 0;

    const today = new Date().toDateString();
    const waterToday = user.waterLogs?.filter(w => new Date(w.date).toDateString() === today) || [];
    if (waterCount) waterCount.textContent = waterToday.length || 0;

    if (pomodoroCount) pomodoroCount.textContent = user.pomodoroSessions || 0;

    // Atualizar também o perfil antigo (se ainda existir)
    const profileName = document.getElementById('profileName');
    const profileEmail = document.getElementById('profileEmail');
    const profileMood = document.getElementById('profileMoodCount');
    const profileWater = document.getElementById('profileWaterCount');
    const profilePomodoro = document.getElementById('profilePomodoroCount');

    if (profileName) profileName.textContent = user.name;
    if (profileEmail) profileEmail.textContent = user.email;
    if (profileMood) profileMood.textContent = user.moodLogs?.length || 0;
    if (profileWater) profileWater.textContent = waterToday.length || 0;
    if (profilePomodoro) profilePomodoro.textContent = user.pomodoroSessions || 0;
  }
}

// ── INIT ───────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initHumor();
  initBreathing();
  initPomodoro();
  initGratidao();
  initForum();
  initNutriTabs();
  initWater();
  updateAuthUI(); // Inicializa a UI de autenticação
});

// Códigos para clicar e abrir o submenu/dropdown
document.addEventListener('DOMContentLoaded', function () {
  const dropdowns = document.querySelectorAll('.dropdown')

  
  dropdowns.forEach(dropdown => {
    const link = dropdown.querySelector('.nav-link');
    const menu = dropdown.querySelector('.dropdown-menu');

    // Função para abrir o dropdown
    function openDropdown() {
      menu.style.display = 'block';
    }

    // Função para fechar o dropdown 
    function closeDropdown() {
      menu.style.display = 'none';
    }

    // Função para abrir ao passar o mouse 
    dropdown.addEventListener('mouseenter', openDropdown);

    //Função para fechar ao tirar o mouse
    dropdown.addEventListener('mouseleave', closeDropdown);

    // Altera entre abrir/fechar ao clicar no link
    link.addEventListener('click', function (e) {
      e.preventDefault(); // Impede o redirecionamento do link
      if (menu.style.display === 'block') {
        closeDropdown();
      } else {
        openDropdown();
      }
    })

    // Fecha o dropdown se clicar fora
    document.addEventListener('click', function (e) {
      if (!dropdown.contains(e.target)) {
        // Usa um setTimeout para dar um pequeno atraso antes de fechar
        setTimeout(() => {
          closeDropdown();
        }, 200); //Atraso de 200ms (ajuste conforme necessário)
      }
    });
  });
});
