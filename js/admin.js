let editingChapters = [], selectedChapterId = null, adminsList = [];

function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

async function loadAdmins() {
    try {
        const res = await fetch('data/admins.json');
        if (res.ok) {
            adminsList = await res.json();
            if (!Array.isArray(adminsList)) adminsList = [];
        } else {
            adminsList = [{ username: 'MaGdI', password: 'BlackWell1' }];
        }
    } catch(e) {
        adminsList = [{ username: 'MaGdI', password: 'BlackWell1' }];
    }
}

function showToast(msg, type='error') {
    const old = document.querySelector('.toast-notification');
    if(old) old.remove();
    const toast = document.createElement('div');
    toast.className = `toast-notification toast-${type}`;
    toast.innerHTML = `<div class="toast-content"><i class="fas ${type==='error'?'fa-exclamation-triangle':type==='success'?'fa-check-circle':'fa-info-circle'}"></i><span>${escapeHtml(msg)}</span></div><div class="toast-progress"></div>`;
    document.body.appendChild(toast);
    setTimeout(()=>toast.classList.add('show'),10);
    setTimeout(()=>{toast.classList.remove('show');setTimeout(()=>toast.remove(),300);},3000);
}

function updateLastEditedTime() {
    const now = new Date();
    const formatted = now.toLocaleString('ru-RU', { hour:'2-digit', minute:'2-digit', day:'2-digit', month:'2-digit' });
    localStorage.setItem('last_edit_time', formatted);
    const el = document.getElementById('lastEdited');
    if(el) el.innerText = formatted;
}
function loadLastEditedTime() {
    const saved = localStorage.getItem('last_edit_time');
    if(saved) { const el = document.getElementById('lastEdited'); if(el) el.innerText = saved; }
    else updateLastEditedTime();
}

function checkAuth() {
    const logged = localStorage.getItem('adminLoggedIn') === 'true';
    const loginDiv = document.getElementById('loginOverlay');
    const adminDiv = document.getElementById('adminContent');
    if (!logged) {
        loginDiv.style.display = 'flex';
        adminDiv.style.display = 'none';
    } else {
        loginDiv.style.display = 'none';
        adminDiv.style.display = 'block';
        loadData();
    }
}

async function login() {
    const user = document.getElementById('loginUsername').value;
    const pass = document.getElementById('loginPassword').value;
    const err = document.getElementById('loginError');
    if (adminsList.length === 0) await loadAdmins();
    const valid = adminsList.find(a => a.username === user && a.password === pass);
    if (valid) {
        localStorage.setItem('adminLoggedIn', 'true');
        if (err) err.classList.remove('show');
        showToast('Вход выполнен', 'success');
        checkAuth();
    } else {
        if (err) {
            err.innerText = 'Неверный логин или пароль';
            err.classList.add('show');
        }
        showToast('Неверный логин или пароль', 'error');
    }
}
function logout() { localStorage.removeItem('adminLoggedIn'); showToast('Выход', 'warning'); checkAuth(); }

function loadData() {
    const saved = localStorage.getItem('chapters_data');
    if (saved) {
        try {
            editingChapters = JSON.parse(saved);
            if (!Array.isArray(editingChapters)) editingChapters = [];
        } catch(e) { editingChapters = []; }
    }
    if (!editingChapters.length) {
        editingChapters = getDefaultChapters();
        localStorage.setItem('chapters_data', JSON.stringify(editingChapters));
    }
    updateStats();
    updateSidebarList();
    if (editingChapters.length) selectChapter(editingChapters[0].id);
    else clearEditor();
    loadLastEditedTime();
}

function getDefaultChapters() {
    return [
        { id:1, title:"Статья 1. Общие положения", category:"Общие положения", content:"<h1>Статья 1</h1><p>...</p>" },
        { id:2, title:"Статья 2. Права и обязанности", category:"Права и обязанности", content:"<h2>Статья 2</h2><p>...</p>" }
    ];
}

function updateStats() {
    const el = document.getElementById('totalChapters');
    if (el) el.innerText = editingChapters.length;
}

function updateSidebarList() {
    const list = document.getElementById('chapterSidebarList');
    if (!list) return;
    list.innerHTML = '';
    editingChapters.sort((a,b)=>a.id-b.id).forEach(ch => {
        const li = document.createElement('li');
        li.textContent = ch.title;
        li.dataset.id = ch.id;
        li.addEventListener('click', () => selectChapter(ch.id));
        if (selectedChapterId === ch.id) li.classList.add('active');
        list.appendChild(li);
    });
}

function selectChapter(id) {
    const ch = editingChapters.find(c => c.id === id);
    if (!ch) return;
    selectedChapterId = id;
    document.getElementById('editorTitle').innerText = ch.title;
    document.getElementById('chapterTitleInput').value = ch.title;
    document.getElementById('chapterCategoryInput').value = ch.category;
    document.getElementById('chapterContentInput').value = ch.content;
    updateSidebarList();
}

function clearEditor() {
    selectedChapterId = null;
    document.getElementById('editorTitle').innerText = 'Выберите статью';
    document.getElementById('chapterTitleInput').value = '';
    document.getElementById('chapterCategoryInput').value = 'Общие положения';
    document.getElementById('chapterContentInput').value = '';
    updateSidebarList();
}

function saveCurrent() {
    if (!selectedChapterId) { showToast('Сначала выберите статью', 'warning'); return; }
    const newTitle = document.getElementById('chapterTitleInput').value;
    const newCat = document.getElementById('chapterCategoryInput').value;
    const newContent = document.getElementById('chapterContentInput').value;
    const idx = editingChapters.findIndex(c => c.id === selectedChapterId);
    if (idx !== -1) {
        editingChapters[idx].title = newTitle;
        editingChapters[idx].category = newCat;
        editingChapters[idx].content = newContent;
        localStorage.setItem('chapters_data', JSON.stringify(editingChapters));
        updateStats();
        updateSidebarList();
        updateLastEditedTime();
        showToast(`Статья "${escapeHtml(newTitle)}" сохранена`, 'success');
        if (typeof window.loadChapters === 'function') window.loadChapters();
    }
}

function deleteCurrent() {
    if (!selectedChapterId) { showToast('Нет выбранной статьи', 'warning'); return; }
    if (editingChapters.length <= 1) { showToast('Нельзя удалить последнюю статью', 'error'); return; }
    const title = editingChapters.find(c => c.id === selectedChapterId)?.title;
    editingChapters = editingChapters.filter(c => c.id !== selectedChapterId);
    editingChapters.forEach((c,i) => c.id = i+1);
    localStorage.setItem('chapters_data', JSON.stringify(editingChapters));
    updateStats();
    updateSidebarList();
    if (editingChapters.length) selectChapter(editingChapters[0].id);
    else clearEditor();
    updateLastEditedTime();
    showToast(`"${escapeHtml(title)}" удалена`, 'warning');
    if (typeof window.loadChapters === 'function') window.loadChapters();
}

function addNewChapter() {
    const newId = editingChapters.length + 1;
    editingChapters.push({
        id: newId,
        title: 'Новая статья',
        category: 'Общие положения',
        content: '<h1>Новая статья</h1><p>Введите текст...</p>'
    });
    localStorage.setItem('chapters_data', JSON.stringify(editingChapters));
    updateStats();
    updateSidebarList();
    selectChapter(newId);
    updateLastEditedTime();
    showToast('Статья добавлена', 'success');
    if (typeof window.loadChapters === 'function') window.loadChapters();
}

document.addEventListener('DOMContentLoaded', async () => {
    await loadAdmins();
    document.getElementById('loginBtn')?.addEventListener('click', login);
    document.getElementById('logoutBtn')?.addEventListener('click', logout);
    document.getElementById('addChapterBtn')?.addEventListener('click', addNewChapter);
    document.getElementById('saveCurrentBtn')?.addEventListener('click', saveCurrent);
    document.getElementById('deleteCurrentBtn')?.addEventListener('click', deleteCurrent);
    document.getElementById('loginPassword')?.addEventListener('keypress', e => { if(e.key === 'Enter') login(); });
    document.getElementById('loginUsername')?.addEventListener('keypress', e => { if(e.key === 'Enter') login(); });
    checkAuth();
});