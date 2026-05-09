// Firebase SDK (используем импорт через CDN)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getDatabase, ref, set, onDisconnect, remove } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-database.js";

// Ваш конфиг Firebase (скопирован из вашего сообщения)
const firebaseConfig = {
    apiKey: "AIzaSyB6sLxlDP40r3H5i6zTFFvf_AzX6IVU4H8",
    authDomain: "rpm-psihiatrie-north.firebaseapp.com",
    databaseURL: "https://rpm-psihiatrie-north-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "rpm-psihiatrie-north",
    storageBucket: "rpm-psihiatrie-north.firebasestorage.app",
    messagingSenderId: "563535287717",
    appId: "1:563535287717:web:839c60f821591f12b6444c",
    measurementId: "G-67B8DK5RPR"
};

// Инициализация
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// Генерируем уникальный идентификатор сессии (сохраняем в sessionStorage)
const SESSION_KEY = 'firebase_session_id';
let sessionId = sessionStorage.getItem(SESSION_KEY);
if (!sessionId) {
    sessionId = 'sid_' + Date.now() + '_' + Math.random().toString(36).substr(2, 8);
    sessionStorage.setItem(SESSION_KEY, sessionId);
}

let currentChapterId = null;
let currentChapterTitle = '';

// Путь в базе данных для этого пользователя
const userRef = ref(database, `active_users/${sessionId}`);

// При закрытии вкладки – удаляем запись
window.addEventListener('beforeunload', () => {
    remove(userRef);
});

// Обновление активности в Firebase
function updateActivity() {
    if (currentChapterId === null) return;
    const data = {
        chapterId: currentChapterId,
        chapterTitle: currentChapterTitle || 'Глава',
        timestamp: Date.now()
    };
    set(userRef, data);
    // Если соединение разорвано (закрытие вкладки или потеря сети), удалить запись
    onDisconnect(userRef).remove();
}

// Функция, которую вызывает common.js при смене главы
window.setVisitorActivity = function(chapterId, chapterTitle) {
    currentChapterId = chapterId;
    currentChapterTitle = chapterTitle;
    updateActivity();
};

// Периодическое обновление (каждые 15 секунд) – поддерживает активность
setInterval(() => {
    if (currentChapterId !== null) updateActivity();
}, 15000);

// Инициализация при загрузке страницы: определить текущую главу из DOM
function initTracking() {
    const activeItem = document.querySelector('.chapter-list li.active');
    if (activeItem && activeItem.dataset.id) {
        const title = activeItem.innerText.trim();
        window.setVisitorActivity(parseInt(activeItem.dataset.id), title);
    } else {
        // Если активной главы нет – отправляем заглушку
        currentChapterId = 0;
        currentChapterTitle = 'Загрузка...';
        updateActivity();
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTracking);
} else {
    initTracking();
}
