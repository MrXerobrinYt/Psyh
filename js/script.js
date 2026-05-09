(async function initMainPage() {
    try {
        await loadChapters();
    } catch(e) {
        console.error('Ошибка инициализации:', e);
    }
})();