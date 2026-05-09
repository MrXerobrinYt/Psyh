(function() {
    const firebaseConfig = {
        apiKey: "AIzaSyB6sLxlDP40r3H5i6zTFFvf_AzX6IVU4H8",
        authDomain: "rpm-psihiatrie-north.firebaseapp.com",
        databaseURL: "https://rpm-psihiatrie-north-default-rtdb.europe-west1.firebasedatabase.app",
        projectId: "rpm-psihiatrie-north",
        storageBucket: "rpm-psihiatrie-north.firebasestorage.app",
        messagingSenderId: "563535287717",
        appId: "1:563535287717:web:839c60f821591f12b6444c"
    };

    if (typeof firebase === 'undefined') {
        console.error('Firebase SDK не загружен!');
        return;
    }
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
    const database = firebase.database();

    // Глобальная переменная для хранения IP (после получения)
    let visitorKey = null;

    // Проверяем, нет ли уже сохранённого IP в localStorage
    const storedIP = localStorage.getItem('visitor_ip');
    if (storedIP) {
        visitorKey = storedIP;
        console.log('✅ Используем сохранённый IP:', visitorKey);
        startTracking(visitorKey);
    } else {
        // Запрашиваем IP через ipify
        console.log('🔄 Запрашиваем IP...');
        fetch('https://api64.ipify.org?format=json')
            .then(response => response.json())
            .then(data => {
                const ip = data.ip;
                localStorage.setItem('visitor_ip', ip);
                visitorKey = ip;
                console.log('🌐 Получен IP:', visitorKey);
                startTracking(visitorKey);
            })
            .catch(err => {
                console.error('❌ Ошибка получения IP, используем fallback ID', err);
                visitorKey = 'unknown_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
                startTracking(visitorKey);
            });
    }

    // Переменные для текущей активности
    let currentChapterId = null;
    let currentChapterTitle = '';
    let userRef = null;

    function startTracking(key) {
        // Используем IP как ключ в базе данных (один IP = один пользователь)
        userRef = database.ref(`active_users/${key}`);
        // При закрытии всех вкладок с этим IP – удаляем запись
        window.addEventListener('beforeunload', () => {
            if (userRef) userRef.remove();
        });

        function updateActivity() {
            if (currentChapterId === null || !userRef) return;
            const data = {
                chapterId: currentChapterId,
                chapterTitle: currentChapterTitle || 'Глава',
                timestamp: Date.now()
            };
            userRef.set(data);
            userRef.onDisconnect().remove();
            console.log('📤 Активность отправлена (IP =', key, '):', data);
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

        // Определяем начальную главу
        function initTracking() {
            const activeItem = document.querySelector('.chapter-list li.active');
            if (activeItem && activeItem.dataset.id) {
                const title = activeItem.innerText.trim();
                window.setVisitorActivity(parseInt(activeItem.dataset.id), title);
            } else {
                const firstItem = document.querySelector('.chapter-list li');
                if (firstItem && firstItem.dataset.id) {
                    const title = firstItem.innerText.trim();
                    window.setVisitorActivity(parseInt(firstItem.dataset.id), title);
                } else {
                    currentChapterId = 0;
                    currentChapterTitle = 'Загрузка...';
                    updateActivity();
                }
            }
        }

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initTracking);
        } else {
            initTracking();
        }
    }
})();
