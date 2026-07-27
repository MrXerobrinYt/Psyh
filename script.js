import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getDatabase, ref, onValue } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';

const firebaseConfig = {
  apiKey: "AIzaSyB6sLxlDP40r3H5i6zTFFvf_AzX6IVU4H8",
  authDomain: "rpm-psihiatrie-north.firebaseapp.com",
  databaseURL: "https://rpm-psihiatrie-north-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "rpm-psihiatrie-north"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

let chapters = [];
let activeChapter = null;
let isRetroMode = false;

// Загрузка глав
onValue(ref(db, 'chapters'), (snapshot) => {
  const data = snapshot.val();
  chapters = Object.entries(data || {}).map(([id, chapter]) => ({
    id: parseInt(id),
    ...chapter
  })).sort((a, b) => a.id - b.id);
  
  renderChaptersList();
  if (chapters.length > 0 && !activeChapter) {
    selectChapter(chapters[0]);
  }
});

function renderChaptersList() {
  const list = document.getElementById('chaptersList');
  
  list.innerHTML = chapters.map((ch, index) => `
    <button class="chapter-item ${activeChapter?.id === ch.id ? 'active' : ''}" data-id="${ch.id}">
      <span class="chapter-num">${String(index + 1).padStart(2, '0')}</span>
      <span class="chapter-title">${ch.title}</span>
    </button>
  `).join('');

  list.querySelectorAll('.chapter-item').forEach((btn, index) => {
    btn.style.animation = `fadeIn 0.3s ease ${index * 0.05}s both`;
    btn.addEventListener('click', () => {
      const id = parseInt(btn.dataset.id);
      selectChapter(chapters.find(c => c.id === id));
    });
  });
}

function selectChapter(chapter) {
  activeChapter = chapter;
  const content = document.getElementById('chapterContent');
  const chapterIndex = chapters.findIndex(c => c.id === chapter.id);
  
  content.style.opacity = '0';
  content.style.transform = 'translateY(20px)';
  
  setTimeout(() => {
    const hasPrev = chapterIndex > 0;
    const hasNext = chapterIndex < chapters.length - 1;

    content.innerHTML = `
      <nav class="chapter-nav">
        <button class="nav-btn ${hasPrev ? '' : 'disabled'}" id="prevChapter" ${hasPrev ? '' : 'disabled'}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          <span>Предыдущая</span>
        </button>
        <button class="nav-btn nav-btn-random" id="randomChapter" title="Случайная глава">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="16 3 21 3 21 8"></polyline>
            <line x1="4" y1="20" x2="21" y2="3"></line>
            <polyline points="21 16 21 21 16 21"></polyline>
            <line x1="15" y1="15" x2="21" y2="21"></line>
            <line x1="4" y1="4" x2="9" y2="9"></line>
          </svg>
          <span>Случайная</span>
        </button>
        <button class="nav-btn ${hasNext ? '' : 'disabled'}" id="nextChapter" ${hasNext ? '' : 'disabled'}>
          <span>Следующая</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="5" y1="12" x2="19" y2="12"></line>
            <polyline points="12 5 19 12 12 19"></polyline>
          </svg>
        </button>
      </nav>
      <div class="chapter-number">
        <span class="chapter-number-badge">ГЛАВА ${String(chapterIndex + 1).padStart(2, '0')}</span>
        <div class="chapter-number-line"></div>
      </div>
      <div class="chapter-header">
        <h2>${chapter.title}</h2>
      </div>
      <div class="content-body">${chapter.content}</div>
    `;

    content.style.opacity = '1';
    content.style.transform = 'translateY(0)';
    content.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
    
    // Обработчики навигации
    const prevBtn = document.getElementById('prevChapter');
    const nextBtn = document.getElementById('nextChapter');
    const randomBtn = document.getElementById('randomChapter');

    if (hasPrev) {
      prevBtn.addEventListener('click', () => {
        selectChapter(chapters[chapterIndex - 1]);
      });
    }
    if (hasNext) {
      nextBtn.addEventListener('click', () => {
        selectChapter(chapters[chapterIndex + 1]);
      });
    }
    randomBtn.addEventListener('click', () => {
      if (chapters.length === 0) return;
      let randomIndex;
      do {
        randomIndex = Math.floor(Math.random() * chapters.length);
      } while (randomIndex === chapterIndex && chapters.length > 1);
      selectChapter(chapters[randomIndex]);
      showToast('🎲 Случайная глава!');
    });
    
    document.getElementById('content').scrollTo({ top: 0, behavior: 'smooth' });
  }, 200);
  
  renderChaptersList();
  document.getElementById('sidebar').classList.remove('open');
}

// Мобильное меню
document.getElementById('menuToggle').addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('open');
});

// Прогресс-бар чтения
const contentEl = document.getElementById('content');
const progressBar = document.getElementById('readingProgress');
const scrollTopBtn = document.getElementById('scrollTop');

contentEl.addEventListener('scroll', () => {
  const scrollTop = contentEl.scrollTop;
  const scrollHeight = contentEl.scrollHeight - contentEl.clientHeight;
  const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
  progressBar.style.width = progress + '%';
  
  if (scrollTop > 300) {
    scrollTopBtn.classList.add('visible');
  } else {
    scrollTopBtn.classList.remove('visible');
  }
});

scrollTopBtn.addEventListener('click', () => {
  contentEl.scrollTo({ top: 0, behavior: 'smooth' });
});

// ============================================
// ТЕМА
// ============================================

const themeToggle = document.getElementById('themeToggle');
const iconMoon = themeToggle.querySelector('.icon-moon');
const iconSun = themeToggle.querySelector('.icon-sun');

let savedTheme = localStorage.getItem('theme') || 'dark';
if (savedTheme === 'retro') {
  savedTheme = 'dark';
  localStorage.setItem('theme', 'dark');
}

document.documentElement.setAttribute('data-theme', savedTheme);
updateThemeIcon(savedTheme);

themeToggle.addEventListener('click', () => {
  if (isRetroMode) disableRetroMode();
  const current = document.documentElement.getAttribute('data-theme');
  const newTheme = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
  updateThemeIcon(newTheme);
});

function updateThemeIcon(theme) {
  if (theme === 'dark' || theme === 'retro') {
    iconMoon.style.display = 'none';
    iconSun.style.display = 'block';
  } else {
    iconMoon.style.display = 'block';
    iconSun.style.display = 'none';
  }
}

// ============================================
// ПАСХАЛКИ
// ============================================

// 1. Konami Code
const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'KeyB', 'KeyA'];
let konamiIndex = 0;

document.addEventListener('keydown', (e) => {
  if (e.code === konamiCode[konamiIndex]) {
    konamiIndex++;
    if (konamiIndex === konamiCode.length) {
      activateRetroMode();
      konamiIndex = 0;
    }
  } else {
    konamiIndex = 0;
  }
});

function activateRetroMode() {
  isRetroMode = true;
  document.documentElement.setAttribute('data-theme', 'retro');
  updateThemeIcon('retro');
  showToast('🎮 Ретро-режим! (сбросится при перезагрузке)');
}

function disableRetroMode() {
  isRetroMode = false;
  const baseTheme = localStorage.getItem('theme') || 'dark';
  document.documentElement.setAttribute('data-theme', baseTheme);
  updateThemeIcon(baseTheme);
}

// Toast уведомления
function showToast(message) {
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed; bottom: 2rem; right: 2rem;
    padding: 1rem 1.5rem;
    background: linear-gradient(135deg, #6366f1 0%, #ec4899 100%);
    color: white; border-radius: 0.75rem; font-weight: 600;
    box-shadow: 0 10px 30px rgba(99, 102, 241, 0.4);
    z-index: 10000; animation: slideIn 0.3s ease;
    font-family: 'Inter', sans-serif;
  `;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
  @keyframes slideOut { from { transform: translateX(0); opacity: 1; } to { transform: translateX(100%); opacity: 0; } }
`;
document.head.appendChild(style);

// 2. 5 кликов по логотипу
let logoClicks = 0;
let logoClickTimer;
document.getElementById('logo').addEventListener('click', () => {
  logoClicks++;
  clearTimeout(logoClickTimer);
  logoClickTimer = setTimeout(() => { logoClicks = 0; }, 1000);
  if (logoClicks === 5) {
    document.getElementById('secretMessage').classList.add('show');
    logoClicks = 0;
  }
});

document.getElementById('closeSecret').addEventListener('click', () => {
  document.getElementById('secretMessage').classList.remove('show');
});

// 3. Снегопад
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.shiftKey && e.key === 'S') {
    e.preventDefault();
    toggleSnow();
  }
});

let snowActive = false;
function toggleSnow() {
  const snowflakes = document.getElementById('snowflakes');
  snowActive = !snowActive;
  if (snowActive) {
    snowflakes.classList.add('active');
    createSnowflakes();
    showToast('❄️ Снегопад!');
  } else {
    snowflakes.classList.remove('active');
    snowflakes.innerHTML = '';
  }
}

function createSnowflakes() {
  const snowflakes = document.getElementById('snowflakes');
  snowflakes.innerHTML = '';
  for (let i = 0; i < 50; i++) {
    const sf = document.createElement('div');
    sf.className = 'snowflake';
    sf.textContent = '❄';
    sf.style.left = Math.random() * 100 + '%';
    sf.style.animationDuration = (Math.random() * 3 + 2) + 's';
    sf.style.animationDelay = Math.random() * 5 + 's';
    snowflakes.appendChild(sf);
  }
}

// 4. Matrix
window.matrix = function() {
  const canvas = document.getElementById('matrixCanvas');
  canvas.classList.add('active');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const ctx = canvas.getContext('2d');
  const letters = 'АБВГДЕЖЗИКЛМНОПРСТУФХЦЧШЩЭЮЯ0123456789';
  const fontSize = 16;
  const columns = canvas.width / fontSize;
  const drops = Array(Math.floor(columns)).fill(1);
  function draw() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#0f0';
    ctx.font = fontSize + 'px monospace';
    for (let i = 0; i < drops.length; i++) {
      const text = letters[Math.floor(Math.random() * letters.length)];
      ctx.fillText(text, i * fontSize, drops[i] * fontSize);
      if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) drops[i] = 0;
      drops[i]++;
    }
  }
  const interval = setInterval(draw, 33);
  showToast('🟢 Матрица!');
  setTimeout(() => { clearInterval(interval); canvas.classList.remove('active'); }, 10000);
};

// Приветствие в консоли
console.log('%c🎮 Пасхалки:', 'font-size: 20px; font-weight: bold; background: linear-gradient(135deg, #6366f1, #ec4899); color: white; padding: 10px 20px; border-radius: 8px;');
console.log('%c1. Konami Code: ↑↑↓↓←→←→BA', 'color: #10b981; font-size: 14px;');
console.log('%c2. 5 кликов по логотипу', 'color: #10b981; font-size: 14px;');
console.log('%c3. Ctrl+Shift+S - Снегопад', 'color: #10b981; font-size: 14px;');
console.log('%c4. matrix() в консоли', 'color: #10b981; font-size: 14px;');
console.log('%c5. /secret.html', 'color: #10b981; font-size: 14px;');