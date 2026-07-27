import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getDatabase, ref, onValue, set, remove, update } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

const firebaseConfig = {
  apiKey: "AIzaSyB6sLxlDP40r3H5i6zTFFvf_AzX6IVU4H8",
  authDomain: "rpm-psihiatrie-north.firebaseapp.com",
  databaseURL: "https://rpm-psihiatrie-north-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "rpm-psihiatrie-north"
};
 
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

let chapters = [];
let admins = {};
let editingChapter = null;
let confirmCallback = null;

// ============================================
// TOAST УВЕДОМЛЕНИЯ
// ============================================

function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  const colors = {
    success: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    error: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    info: 'linear-gradient(135deg, #6366f1 0%, #ec4899 100%)'
  };
  toast.style.cssText = `
    position: fixed; bottom: 2rem; right: 2rem;
    padding: 1rem 1.5rem;
    background: ${colors[type] || colors.info};
    color: white; border-radius: 0.75rem; font-weight: 600;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    z-index: 10000; animation: slideIn 0.3s ease;
    font-family: 'Inter', sans-serif;
    display: flex; align-items: center; gap: 0.5rem;
    max-width: 400px;
  `;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

const toastStyle = document.createElement('style');
toastStyle.textContent = `
  @keyframes slideIn { from { transform: translateX(120%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
  @keyframes slideOut { from { transform: translateX(0); opacity: 1; } to { transform: translateX(120%); opacity: 0; } }
`;
document.head.appendChild(toastStyle);

// ============================================
// МОДАЛЬНЫЕ ОКНА
// ============================================

function openModal(id) {
  document.getElementById(id).classList.add('show');
  document.body.style.overflow = 'hidden';
}

function closeModal(id) {
  document.getElementById(id).classList.remove('show');
  document.body.style.overflow = '';
}

// Подтверждение удаления
function showConfirm(title, message, onConfirm) {
  document.getElementById('confirmTitle').textContent = title;
  document.getElementById('confirmMessage').textContent = message;
  confirmCallback = onConfirm;
  openModal('confirmModal');
}

document.getElementById('confirmCancel').addEventListener('click', () => {
  closeModal('confirmModal');
  confirmCallback = null;
});

document.getElementById('confirmOk').addEventListener('click', () => {
  if (confirmCallback) confirmCallback();
  closeModal('confirmModal');
  confirmCallback = null;
});

document.querySelector('#confirmModal .modal-overlay').addEventListener('click', () => {
  closeModal('confirmModal');
  confirmCallback = null;
});

// ============================================
// АВТОРИЗАЦИЯ
// ============================================

onAuthStateChanged(auth, (user) => {
  if (user) {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('adminPanel').style.display = 'block';
    document.getElementById('adminEmail').textContent = user.email;
    document.getElementById('dashCurrentUser').textContent = user.email;
    loadChapters();
    loadAdmins();
  } else {
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('adminPanel').style.display = 'none';
  }
});

document.getElementById('loginBtn').addEventListener('click', async () => {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  try {
    await signInWithEmailAndPassword(auth, email, password);
    showToast('✅ Добро пожаловать!', 'success');
  } catch (error) {
    showToast('❌ ' + error.message, 'error');
  }
});

document.getElementById('logoutBtn').addEventListener('click', () => {
  showConfirm('Выход', 'Вы уверены, что хотите выйти?', async () => {
    await signOut(auth);
    showToast('👋 До встречи!', 'info');
  });
});

// ============================================
// ТАБЫ
// ============================================

document.querySelectorAll('.admin-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.admin-tab-content').forEach(c => c.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById('tab' + capitalize(tab.dataset.tab)).classList.add('active');
  });
});

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ============================================
// ГЛАВЫ
// ============================================

function loadChapters() {
  onValue(ref(db, 'chapters'), (snapshot) => {
    const data = snapshot.val();
    chapters = Object.entries(data || {}).map(([id, chapter]) => ({
      id: parseInt(id),
      ...chapter
    })).sort((a, b) => a.id - b.id);
    renderChaptersAdmin();
    updateDashboard();
  });
}

function renderChaptersAdmin() {
  const container = document.getElementById('chaptersAdmin');
  const searchQuery = document.getElementById('chaptersSearch').value.toLowerCase();
  
  const filtered = chapters.filter(ch => 
    ch.title.toLowerCase().includes(searchQuery)
  );

  if (filtered.length === 0) {
    container.innerHTML = `<div class="empty-state">${chapters.length === 0 ? 'Нет глав. Добавьте первую!' : 'Ничего не найдено'}</div>`;
    return;
  }

  container.innerHTML = filtered.map((ch, idx) => `
    <div class="chapter-admin-item">
      <div class="chapter-admin-info">
        <span class="chapter-admin-num">${String(chapters.indexOf(ch) + 1).padStart(2, '0')}</span>
        <div class="chapter-admin-details">
          <span class="chapter-admin-title">${ch.title}</span>
          <span class="chapter-admin-meta">${ch.lastEdited ? 'Изменено: ' + ch.lastEdited : 'Без изменений'}</span>
        </div>
      </div>
      <div class="actions">
        <button class="icon-btn edit-btn" data-id="${ch.id}" title="Редактировать">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
          </svg>
        </button>
        <button class="icon-btn delete-btn" data-id="${ch.id}" title="Удалить">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </button>
      </div>
    </div>
  `).join('');

  container.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      editingChapter = chapters.find(c => c.id === parseInt(btn.dataset.id));
      openEditor();
    });
  });

  container.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.dataset.id);
      const ch = chapters.find(c => c.id === id);
      showConfirm('Удалить главу?', `Глава "${ch.title}" будет удалена безвозвратно.`, async () => {
        await remove(ref(db, `chapters/${id}`));
        showToast('🗑️ Глава удалена', 'success');
      });
    });
  });
}

// Поиск
document.getElementById('chaptersSearch').addEventListener('input', renderChaptersAdmin);

// Открытие редактора
function openEditor() {
  const isNew = !editingChapter.id || !chapters.find(c => c.id === editingChapter.id);
  document.getElementById('editorModalTitle').textContent = isNew ? 'Новая глава' : 'Редактирование главы';
  document.getElementById('chapterTitle').value = editingChapter.title || '';
  document.getElementById('chapterContent').value = editingChapter.content || '';
  updatePreview();
  openModal('editorModal');
}

document.getElementById('addChapterBtn').addEventListener('click', () => {
  editingChapter = { id: Date.now(), title: '', content: '' };
  openEditor();
});

// Быстрое действие с Dashboard
document.getElementById('qaAddChapter').addEventListener('click', () => {
  editingChapter = { id: Date.now(), title: '', content: '' };
  openEditor();
});

// Предпросмотр
function updatePreview() {
  const title = document.getElementById('chapterTitle').value;
  const content = document.getElementById('chapterContent').value;
  const preview = document.getElementById('previewContent');
  
  if (!title && !content) {
    preview.innerHTML = '<p class="preview-placeholder">Начните вводить текст...</p>';
    return;
  }
  
  preview.innerHTML = `
    ${title ? `<h2 style="font-size: 1.5rem; margin-bottom: 1rem; font-weight: 700;">${title}</h2>` : ''}
    <div>${content || '<p class="preview-placeholder">Пустое содержимое</p>'}</div>
  `;
}

document.getElementById('chapterTitle').addEventListener('input', updatePreview);
document.getElementById('chapterContent').addEventListener('input', updatePreview);

// Сохранение
document.getElementById('saveBtn').addEventListener('click', async () => {
  const title = document.getElementById('chapterTitle').value.trim();
  const content = document.getElementById('chapterContent').value;
  
  if (!title) {
    showToast('❌ Введите название главы', 'error');
    return;
  }
  
  try {
    await set(ref(db, `chapters/${editingChapter.id}`), {
      title,
      content,
      lastEdited: new Date().toLocaleString('ru-RU')
    });
    showToast('✅ Глава сохранена', 'success');
    closeModal('editorModal');
    editingChapter = null;
  } catch (error) {
    showToast('❌ Ошибка: ' + error.message, 'error');
  }
});

document.getElementById('cancelBtn').addEventListener('click', () => {
  closeModal('editorModal');
  editingChapter = null;
});

document.getElementById('editorModalClose').addEventListener('click', () => {
  closeModal('editorModal');
  editingChapter = null;
});

document.querySelector('#editorModal .modal-overlay').addEventListener('click', () => {
  closeModal('editorModal');
  editingChapter = null;
});

// ============================================
// АДМИНИСТРАТОРЫ
// ============================================

function loadAdmins() {
  onValue(ref(db, 'admins'), (snapshot) => {
    admins = snapshot.val() || {};
    renderAdminsList();
    updateDashboard();
  });
}

function renderAdminsList() {
  const container = document.getElementById('adminsList');
  const entries = Object.entries(admins);
  
  document.getElementById('dashAdminsCount').textContent = entries.length;
  
  if (entries.length === 0) {
    container.innerHTML = '<div class="empty-state">Список администраторов пуст</div>';
    return;
  }

  container.innerHTML = `
    <h3 class="admins-title">Активные администраторы (${entries.length})</h3>
    ${entries.map(([uid, admin]) => `
      <div class="admin-item">
        <div class="admin-item-info">
          <div class="admin-avatar">${admin.email.charAt(0).toUpperCase()}</div>
          <div class="admin-item-details">
            <span class="admin-item-email">${admin.email}</span>
            <span class="admin-item-date">Добавлен: ${admin.createdAt || '—'}</span>
          </div>
        </div>
        <button class="delete-admin-btn" data-uid="${uid}" data-email="${admin.email}">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
          <span>Удалить</span>
        </button>
      </div>
    `).join('')}
  `;

  container.querySelectorAll('.delete-admin-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const uid = btn.dataset.uid;
      const email = btn.dataset.email;
      if (uid === auth.currentUser.uid) {
        showToast('❌ Нельзя удалить самого себя!', 'error');
        return;
      }
      showConfirm('Удалить администратора?', `${email} потеряет доступ к админ-панели.`, async () => {
        await remove(ref(db, `admins/${uid}`));
        showToast('🗑️ Администратор удалён', 'success');
      });
    });
  });
}

document.getElementById('addAdminBtn').addEventListener('click', async () => {
  const email = document.getElementById('newAdminEmail').value.trim();
  const password = document.getElementById('newAdminPassword').value;

  if (!email) { showToast('❌ Введите email', 'error'); return; }
  if (password.length < 6) { showToast('❌ Пароль минимум 6 символов', 'error'); return; }

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const newUser = userCredential.user;

    await set(ref(db, `admins/${newUser.uid}`), {
      email: email,
      createdAt: new Date().toLocaleDateString('ru-RU')
    });

    showToast(`✅ Админ ${email} добавлен! Войдите заново.`, 'success');
    
    document.getElementById('newAdminEmail').value = '';
    document.getElementById('newAdminPassword').value = '';

    // Перелогиниваемся обратно (createUser автоматически логинит нового)
    setTimeout(async () => {
      await signOut(auth);
    }, 1500);

  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      showToast('❌ Email уже зарегистрирован', 'error');
    } else if (error.code === 'auth/weak-password') {
      showToast('❌ Слишком слабый пароль', 'error');
    } else {
      showToast('❌ ' + error.message, 'error');
    }
  }
});

// Быстрое действие — перейти к добавлению админа
document.getElementById('qaAddAdmin').addEventListener('click', () => {
  document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.admin-tab-content').forEach(c => c.classList.remove('active'));
  document.querySelector('[data-tab="admins"]').classList.add('active');
  document.getElementById('tabAdmins').classList.add('active');
  document.getElementById('newAdminEmail').focus();
});

// ============================================
// DASHBOARD
// ============================================

function updateDashboard() {
  document.getElementById('dashChaptersCount').textContent = chapters.length;
  document.getElementById('dashAdminsCount').textContent = Object.keys(admins).length;
  
  // Последнее изменение
  const lastEdited = chapters
    .filter(ch => ch.lastEdited)
    .sort((a, b) => new Date(b.lastEdited.split(', ').reverse().join(' ')) - new Date(a.lastEdited.split(', ').reverse().join(' ')))[0];
  
  document.getElementById('dashLastUpdate').textContent = lastEdited 
    ? lastEdited.lastEdited.split(', ')[0] 
    : '—';
  
  // Последние главы
  const recentList = document.getElementById('recentChaptersList');
  const recent = chapters.slice(-5).reverse();
  
  if (recent.length === 0) {
    recentList.innerHTML = '<div class="empty-state">Нет глав</div>';
    return;
  }
  
  recentList.innerHTML = recent.map(ch => `
    <div class="recent-item">
      <div class="recent-item-info">
        <span class="recent-item-title">${ch.title}</span>
        <span class="recent-item-date">${ch.lastEdited || 'Без изменений'}</span>
      </div>
      <button class="icon-btn edit-btn" data-id="${ch.id}" title="Редактировать">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
        </svg>
      </button>
    </div>
  `).join('');
  
  recentList.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      editingChapter = chapters.find(c => c.id === parseInt(btn.dataset.id));
      openEditor();
    });
  });
}

// Быстрые действия
document.getElementById('qaOpenSite').addEventListener('click', () => {
  window.open('index.html', '_blank');
});

document.getElementById('qaRefresh').addEventListener('click', () => {
  showToast('🔄 Обновление...', 'info');
  setTimeout(() => location.reload(), 500);
});

// Закрытие модалок по Escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeModal('editorModal');
    closeModal('confirmModal');
    editingChapter = null;
  }
});