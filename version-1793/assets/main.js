(function () {
    var button = document.querySelector('[data-menu-button]');
    var menu = document.querySelector('[data-mobile-nav]');
    if (button && menu) {
        button.addEventListener('click', function () {
            menu.classList.toggle('open');
        });
    }

    var slides = Array.prototype.slice.call(document.querySelectorAll('[data-hero-slide]'));
    var dots = Array.prototype.slice.call(document.querySelectorAll('[data-hero-dot]'));
    if (slides.length > 0) {
        var current = 0;
        var showSlide = function (index) {
            current = index;
            slides.forEach(function (slide, slideIndex) {
                slide.classList.toggle('active', slideIndex === current);
            });
            dots.forEach(function (dot, dotIndex) {
                dot.classList.toggle('active', dotIndex === current);
            });
        };
        dots.forEach(function (dot, index) {
            dot.addEventListener('click', function () {
                showSlide(index);
            });
        });
        window.setInterval(function () {
            showSlide((current + 1) % slides.length);
        }, 5000);
        showSlide(0);
    }

    var searchInput = document.querySelector('[data-search-input]');
    var yearSelect = document.querySelector('[data-year-filter]');
    var categorySelect = document.querySelector('[data-category-filter]');
    var cards = Array.prototype.slice.call(document.querySelectorAll('[data-search-card]'));
    var empty = document.querySelector('[data-empty-state]');

    var filterCards = function () {
        if (cards.length === 0) {
            return;
        }
        var query = searchInput ? searchInput.value.trim().toLowerCase() : '';
        var year = yearSelect ? yearSelect.value : '';
        var category = categorySelect ? categorySelect.value : '';
        var visible = 0;
        cards.forEach(function (card) {
            var haystack = [card.dataset.title, card.dataset.year, card.dataset.category, card.dataset.keywords].join(' ').toLowerCase();
            var matched = true;
            if (query && haystack.indexOf(query) === -1) {
                matched = false;
            }
            if (year && card.dataset.year !== year) {
                matched = false;
            }
            if (category && card.dataset.category !== category) {
                matched = false;
            }
            card.style.display = matched ? '' : 'none';
            if (matched) {
                visible += 1;
            }
        });
        if (empty) {
            empty.classList.toggle('show', visible === 0);
        }
    };

    if (searchInput) {
        searchInput.addEventListener('input', filterCards);
    }
    if (yearSelect) {
        yearSelect.addEventListener('change', filterCards);
    }
    if (categorySelect) {
        categorySelect.addEventListener('change', filterCards);
    }
})();

function initPlayer(videoUrl) {
    var video = document.getElementById('movie-player');
    var overlay = document.getElementById('player-overlay');
    var trigger = document.getElementById('play-trigger');
    if (!video || !videoUrl) {
        return;
    }

    var bindVideo = function () {
        if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = videoUrl;
            return;
        }
        if (window.Hls && window.Hls.isSupported()) {
            var hls = new window.Hls({ enableWorker: true });
            hls.loadSource(videoUrl);
            hls.attachMedia(video);
            return;
        }
        video.src = videoUrl;
    };

    var start = function () {
        bindVideo();
        if (overlay) {
            overlay.classList.add('hidden');
        }
        var playResult = video.play();
        if (playResult && typeof playResult.catch === 'function') {
            playResult.catch(function () {});
        }
    };

    if (trigger) {
        trigger.addEventListener('click', start);
    }
    if (overlay) {
        overlay.addEventListener('click', start);
    }
    video.addEventListener('click', function () {
        if (video.paused) {
            start();
        } else {
            video.pause();
        }
    });
}
