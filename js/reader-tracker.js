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

    let currentNick = null;
    let currentChapterId = null;
    let currentChapterTitle = '';
    let userRef = null;

    // Принудительное обновление текущей главы (вызывается из common.js)
    window.updateCurrentChapter = function() {
        const activeItem = document.querySelector('.chapter-list li.active');
        let id = null, title = '';
        if (activeItem && activeItem.dataset.id) {
            id = parseInt(activeItem.dataset.id);
            title = activeItem.innerText.trim();
        } else {
            const firstItem = document.querySelector('.chapter-list li');
            if (firstItem && firstItem.dataset.id) {
                id = parseInt(firstItem.dataset.id);
                title = firstItem.innerText.trim();
            }
        }
        if (id !== null && currentNick) {
            currentChapterId = id;
            currentChapterTitle = title;
            updateActivity();
        }
    };

    window.setReaderNick = function(nick, callback) {
        if (!nick) return;
        if (currentNick === nick) return;
        currentNick = nick;
        userRef = database.ref(`active_readers/${currentNick}`);
        window.addEventListener('beforeunload', () => {
            if (userRef) userRef.remove();
        });
        if (userRef) userRef.remove();
        updateActivity();
        if (callback && typeof callback === 'function') callback();
    };

    function updateActivity() {
        if (!currentNick || !userRef) return;
        const data = {
            chapterId: currentChapterId !== null ? currentChapterId : 0,
            chapterTitle: currentChapterTitle || 'Загрузка...',
            timestamp: Date.now()
        };
        userRef.set(data);
        userRef.onDisconnect().remove();
        // Логи убраны – больше не пишут в консоль
    }

    window.setReaderActivity = function(chapterId, chapterTitle) {
        currentChapterId = chapterId;
        currentChapterTitle = chapterTitle;
        if (currentNick) updateActivity();
    };

    setInterval(() => {
        if (currentNick && currentChapterId !== null) updateActivity();
    }, 15000);

    const savedNick = localStorage.getItem('reader_nick');
    if (savedNick && !currentNick) {
        window.setReaderNick(savedNick, () => {
            setTimeout(() => window.updateCurrentChapter(), 500);
        });
    }
})();