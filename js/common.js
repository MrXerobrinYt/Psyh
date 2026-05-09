let chaptersData = [];
let currentFilter = 'all';

function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

async function loadChapters() {
    try {
        if (!window.firebaseDb) {
            console.warn('Firebase not initialized, using localStorage fallback');
            const saved = localStorage.getItem('chapters_data');
            if (saved) {
                chaptersData = JSON.parse(saved);
            } else {
                const res = await fetch('data/chapters.json');
                chaptersData = await res.json();
            }
        } else {
            const snapshot = await window.firebaseDb.ref('chapters').once('value');
            let data = snapshot.val();
            if (data && Array.isArray(data)) {
                chaptersData = data;
            } else {
                const res = await fetch('data/chapters.json');
                chaptersData = await res.json();
                await window.firebaseDb.ref('chapters').set(chaptersData);
            }
        }
    } catch(e) {
        console.warn(e);
        chaptersData = getDefaultChapters();
    }
    if (!Array.isArray(chaptersData)) chaptersData = [];
    applyFilter();
    return chaptersData;
}

function getDefaultChapters() {
    return [
        { id:1, title:"Статья 1. Общие положения", category:"Общие положения", content:"<h1>Статья 1</h1><p>Текст...</p>" },
        { id:2, title:"Статья 2. Права и обязанности", category:"Права и обязанности", content:"<h2>Статья 2</h2><p>Текст...</p>" }
    ];
}

function applyFilter() {
    const data = Array.isArray(chaptersData) ? chaptersData : [];
    const filtered = currentFilter === 'all' ? data : data.filter(ch => ch.category === currentFilter);
    buildSidebar(filtered);
    if (filtered.length > 0) renderChapter(filtered[0].id);
}

function renderChapter(id) {
    const chapter = chaptersData.find(ch => ch.id === id);
    if (!chapter) return;
    const titleSpan = document.querySelector('#displayTitle span');
    if (titleSpan) titleSpan.innerText = chapter.title;
    document.getElementById('displayContent').innerHTML = chapter.content;
    document.querySelectorAll('.chapter-list li').forEach(li => {
        if (parseInt(li.dataset.id) === id) li.classList.add('active');
        else li.classList.remove('active');
    });
    if (typeof window.setReaderActivity === 'function') {
        window.setReaderActivity(id, chapter.title);
    }
}

function buildSidebar(data) {
    const list = document.getElementById('chapterList');
    if (!list) return;
    list.innerHTML = '';
    if (!Array.isArray(data) || data.length === 0) {
        const emptyLi = document.createElement('li');
        emptyLi.innerText = 'Нет статей';
        emptyLi.style.cursor = 'default';
        emptyLi.style.opacity = '0.6';
        list.appendChild(emptyLi);
        return;
    }
    data.forEach(ch => {
        const li = document.createElement('li');
        li.dataset.id = ch.id;
        li.innerText = ch.title;
        li.addEventListener('click', () => renderChapter(ch.id));
        list.appendChild(li);
    });
}

function initFilters() {
    const btns = document.querySelectorAll('.filter-btn');
    btns.forEach(btn => {
        btn.addEventListener('click', () => {
            btns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.category;
            applyFilter();
        });
    });
}
document.addEventListener('DOMContentLoaded', initFilters);