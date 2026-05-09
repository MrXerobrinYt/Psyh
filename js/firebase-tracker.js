// Глобальный трекер Firebase (без type="module")
(function() {
    // Ваш firebaseConfig
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

    // Инициализация Firebase (глобальная, если скрипт уже загружен)
    if (!window.firebase) {
        console.error('Firebase SDK не загружен! Убедитесь, что подключен script из CDN.');
        return;
    }
    const app = window.firebase.initializeApp(firebaseConfig);
    const database = window.firebase.database();

    // Генерируем уникальный идентификатор сессии (sessionStorage)
    const SESSION_KEY = 'firebase_session_id';
    let sessionId = sessionStorage.getItem(SESSION_KEY);
    if (!sessionId) {
        sessionId = 'sid_' + Date.now() + '_' + Math.random().toString(36).substr(2, 8);
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
        // При разрыве соединения удалить запись
        userRef.onDisconnect().remove();
    }

    window.setVisitorActivity = function(chapterId, chapterTitle) {
        currentChapterId = chapterId;
        currentChapterTitle = chapterTitle;
        updateActivity();
    };

    setInterval(() => {
        if (currentChapterId !== null) updateActivity();
    }, 15000);

    function initTracking() {
        const activeItem = document.querySelector('.chapter-list li.active');
        if (activeItem && activeItem.dataset.id) {
            const title = activeItem.innerText.trim();
            window.setVisitorActivity(parseInt(activeItem.dataset.id), title);
        } else {
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
})();
