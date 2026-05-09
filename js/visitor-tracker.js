(function() {
    // Уникальный идентификатор посетителя (сохраняется в localStorage)
    const VISITOR_ID_KEY = 'visitor_id';
    let visitorId = localStorage.getItem(VISITOR_ID_KEY);
    if (!visitorId) {
        visitorId = 'user_' + Date.now() + '_' + Math.random().toString(36).substring(2, 10);
        localStorage.setItem(VISITOR_ID_KEY, visitorId);
    }

    const ACTIVE_KEY = 'active_visitors';

    // Получить список активных посетителей, удалить старые (старше 40 секунд)
    function getActiveVisitors() {
        const data = localStorage.getItem(ACTIVE_KEY);
        if (!data) return {};
        try {
            const parsed = JSON.parse(data);
            const now = Date.now();
            // Удаляем записи старше 40 секунд
            Object.keys(parsed).forEach(id => {
                if (now - parsed[id].timestamp > 40000) delete parsed[id];
            });
            return parsed;
        } catch(e) {
            return {};
        }
    }

    // Сохранить список активных посетителей и уведомить админ-панель
    function saveActiveVisitors(visitors) {
        localStorage.setItem(ACTIVE_KEY, JSON.stringify(visitors));
        window.dispatchEvent(new CustomEvent('visitors-updated'));
    }

    // Обновить активность текущего пользователя
    function updateMyActivity(chapterId, chapterTitle) {
        const visitors = getActiveVisitors();
        visitors[visitorId] = {
            chapterId: chapterId || 0,
            chapterTitle: chapterTitle || 'Главная страница',
            timestamp: Date.now()
        };
        saveActiveVisitors(visitors);
    }

    // Функция, которую вызывает главная страница при смене главы
    window.setVisitorActivity = function(chapterId, chapterTitle) {
        currentChapterId = chapterId;
        currentChapterTitle = chapterTitle;
        updateMyActivity(chapterId, chapterTitle);
    };

    let currentChapterId = null;
    let currentChapterTitle = '';

    // При загрузке страницы – пытаемся определить текущую главу из DOM
    function initTracking() {
        // Ищем активный пункт меню (главу)
        const activeItem = document.querySelector('.chapter-list li.active');
        if (activeItem && activeItem.dataset.id) {
            const title = activeItem.innerText.trim();
            window.setVisitorActivity(parseInt(activeItem.dataset.id), title);
        } else {
            // Если активной главы нет, отправляем активность «Загрузка»
            updateMyActivity(0, 'Загрузка...');
        }
    }

    // Запускаем отслеживание после загрузки DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initTracking);
    } else {
        initTracking();
    }

    // Регулярное обновление (каждые 10 секунд) – поддерживает активность
    setInterval(() => {
        if (currentChapterId !== null) {
            updateMyActivity(currentChapterId, currentChapterTitle);
        } else {
            // Если глава ещё не установлена, пробуем ещё раз
            initTracking();
        }
    }, 10000);

    // При закрытии вкладки – удаляем себя из списка активных
    window.addEventListener('beforeunload', () => {
        const visitors = getActiveVisitors();
        delete visitors[visitorId];
        saveActiveVisitors(visitors);
    });
})();
