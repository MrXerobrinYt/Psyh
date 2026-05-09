(function() {
    // Ваш конфиг Firebase (уже готов)
    const firebaseConfig = {
        apiKey: "AIzaSyB6sLxlDP40r3H5i6zTFFvf_AzX6IVU4H8",
        authDomain: "rpm-psihiatrie-north.firebaseapp.com",
        databaseURL: "https://rpm-psihiatrie-north-default-rtdb.europe-west1.firebasedatabase.app",
        projectId: "rpm-psihiatrie-north",
        storageBucket: "rpm-psihiatrie-north.firebasestorage.app",
        messagingSenderId: "563535287717",
        appId: "1:563535287717:web:839c60f821591f12b6444c"
    };

    // Проверяем, что Firebase SDK загружен
    if (typeof firebase === 'undefined') {
        console.error('Firebase SDK не загружен! Подключите скрипты из CDN.');
        return;
    }

    // Инициализация (если ещё не инициализирована)
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
    const database = firebase.database();

    // Уникальный ID сессии (sessionStorage – разная вкладка = разный пользователь)
    const SESSION_KEY = 'firebase_session_id';
    let sessionId = sessionStorage.getItem(SESSION_KEY);
    if (!sessionId) {
        sessionId = 'sid_' + Date.now() + '_' + Math.random().toString(36).substring(2, 10);
        sessionStorage.setItem(SESSION_KEY, sessionId);
    }

    let currentChapterId = null;
    let currentChapterTitle = '';
    const userRef = database.ref(`active_users/${sessionId}`);

    // При закрытии вкладки – удаляем запись
    window.addEventListener('beforeunload', () => {
        userRef.remove();
    });

    function updateActivity() {
        if (currentChapterId === null) return;
        const data = {
            chapterId: currentChapterId,
            chapterTitle: currentChapterTitle || 'Глава',
            timestamp: Date.now()
        };
        userRef.set(data);
        userRef.onDisconnect().remove();
        console.log('Активность отправлена:', data);
    }

    window.setVisitorActivity = function(chapterId, chapterTitle) {
        currentChapterId = chapterId;
        currentChapterTitle = chapterTitle;
        updateActivity();
    };

    // Регулярное обновление (каждые 15 секунд)
    setInterval(() => {
        if (currentChapterId !== null) updateActivity();
    }, 15000);

    // Определяем активную главу при загрузке
    function initTracking() {
        const activeItem = document.querySelector('.chapter-list li.active');
        if (activeItem && activeItem.dataset.id) {
            const title = activeItem.innerText.trim();
            window.setVisitorActivity(parseInt(activeItem.dataset.id), title);
        } else {
            currentChapterId = 0;
            currentChapterTitle = 'Первая глава';
            updateActivity();
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initTracking);
    } else {
        initTracking();
    }
})();
