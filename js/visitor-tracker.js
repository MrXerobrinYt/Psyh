(function() {
    const VISITOR_ID_KEY = 'visitor_id';
    let visitorId = localStorage.getItem(VISITOR_ID_KEY);
    if (!visitorId) {
        visitorId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 8);
        localStorage.setItem(VISITOR_ID_KEY, visitorId);
    }
    const ACTIVE_KEY = 'active_visitors';

    function getActiveVisitors() {
        const data = localStorage.getItem(ACTIVE_KEY);
        if (!data) return {};
        try {
            const parsed = JSON.parse(data);
            const now = Date.now();
            // Удаляем записи старше 40 секунд (было 15)
            Object.keys(parsed).forEach(id => {
                if (now - parsed[id].timestamp > 40000) delete parsed[id];
            });
            return parsed;
        } catch(e) { return {}; }
    }

    function saveActiveVisitors(visitors) {
        localStorage.setItem(ACTIVE_KEY, JSON.stringify(visitors));
        window.dispatchEvent(new CustomEvent('visitors-updated'));
    }

    function updateMyActivity(chapterId, chapterTitle) {
        const visitors = getActiveVisitors();
        visitors[visitorId] = {
            chapterId: chapterId,
            chapterTitle: chapterTitle || 'Неизвестная глава',
            timestamp: Date.now()
        };
        saveActiveVisitors(visitors);
    }

    let currentChapterId = null, currentChapterTitle = '';

    window.setVisitorActivity = function(chapterId, chapterTitle) {
        currentChapterId = chapterId;
        currentChapterTitle = chapterTitle;
        updateMyActivity(chapterId, chapterTitle);
    };

    // Отправляем heartbeat каждые 15 секунд (было 10)
    setInterval(() => {
        if (currentChapterId !== null) {
            updateMyActivity(currentChapterId, currentChapterTitle);
        }
    }, 15000);

    // При закрытии вкладки – удаляем сразу
    window.addEventListener('beforeunload', () => {
        const visitors = getActiveVisitors();
        delete visitors[visitorId];
        saveActiveVisitors(visitors);
    });
})();
