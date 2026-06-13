(function () {
    'use strict';

    function qs(selector, root) {
        return (root || document).querySelector(selector);
    }

    function qsa(selector, root) {
        return Array.prototype.slice.call((root || document).querySelectorAll(selector));
    }

    function normalizeText(value) {
        return String(value || '').trim().toLowerCase();
    }

    function escapeHTML(value) {
        return String(value || '').replace(/[&<>'"]/g, function (character) {
            return {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                "'": '&#39;',
                '"': '&quot;'
            }[character];
        });
    }

    function initMobileMenu() {
        var button = qs('[data-mobile-menu-toggle]');
        var menu = qs('[data-mobile-menu]');

        if (!button || !menu) {
            return;
        }

        button.addEventListener('click', function () {
            menu.classList.toggle('is-open');
        });
    }

    function initHeroCarousel() {
        var carousel = qs('[data-hero-carousel]');

        if (!carousel) {
            return;
        }

        var slides = qsa('[data-hero-slide]', carousel);
        var dots = qsa('[data-hero-dot]', carousel);
        var prev = qs('[data-hero-prev]', carousel);
        var next = qs('[data-hero-next]', carousel);
        var current = 0;
        var timer = null;

        function show(index) {
            if (!slides.length) {
                return;
            }

            current = (index + slides.length) % slides.length;

            slides.forEach(function (slide, slideIndex) {
                slide.classList.toggle('is-active', slideIndex === current);
            });

            dots.forEach(function (dot, dotIndex) {
                dot.classList.toggle('is-active', dotIndex === current);
            });
        }

        function start() {
            stop();
            timer = window.setInterval(function () {
                show(current + 1);
            }, 5000);
        }

        function stop() {
            if (timer) {
                window.clearInterval(timer);
                timer = null;
            }
        }

        dots.forEach(function (dot) {
            dot.addEventListener('click', function () {
                show(parseInt(dot.getAttribute('data-hero-dot'), 10));
                start();
            });
        });

        if (prev) {
            prev.addEventListener('click', function () {
                show(current - 1);
                start();
            });
        }

        if (next) {
            next.addEventListener('click', function () {
                show(current + 1);
                start();
            });
        }

        carousel.addEventListener('mouseenter', stop);
        carousel.addEventListener('mouseleave', start);
        show(0);
        start();
    }

    function initCardFilters() {
        var panel = qs('[data-card-filter-panel]');
        var list = qs('[data-card-filter-list]');

        if (!panel || !list) {
            return;
        }

        var input = qs('[data-card-filter-input]', panel);
        var year = qs('[data-card-filter-year]', panel);
        var type = qs('[data-card-filter-type]', panel);
        var counter = qs('[data-card-filter-count]');
        var cards = qsa('[data-movie-card]', list);

        function applyFilters() {
            var query = normalizeText(input ? input.value : '');
            var selectedYear = year ? year.value : '';
            var selectedType = type ? type.value : '';
            var visible = 0;

            cards.forEach(function (card) {
                var haystack = normalizeText([
                    card.getAttribute('data-title'),
                    card.getAttribute('data-tags'),
                    card.getAttribute('data-region'),
                    card.getAttribute('data-type'),
                    card.getAttribute('data-year')
                ].join(' '));
                var matchesQuery = !query || haystack.indexOf(query) !== -1;
                var matchesYear = !selectedYear || card.getAttribute('data-year') === selectedYear;
                var matchesType = !selectedType || card.getAttribute('data-type') === selectedType;
                var shouldShow = matchesQuery && matchesYear && matchesType;

                card.style.display = shouldShow ? '' : 'none';
                if (shouldShow) {
                    visible += 1;
                }
            });

            if (counter) {
                counter.textContent = '当前显示 ' + visible + ' 部影片';
            }
        }

        [input, year, type].forEach(function (control) {
            if (control) {
                control.addEventListener('input', applyFilters);
                control.addEventListener('change', applyFilters);
            }
        });
    }

    function createMovieCard(movie) {
        var tags = Array.isArray(movie.tags) ? movie.tags.join(',') : '';

        return '' +
            '<article class="movie-card" data-movie-card data-title="' + escapeHTML(movie.title) + '" data-tags="' + escapeHTML(tags) + '" data-year="' + escapeHTML(movie.year) + '" data-type="' + escapeHTML(movie.type) + '" data-region="' + escapeHTML(movie.region) + '">' +
                '<a class="movie-cover" href="' + escapeHTML(movie.url) + '" aria-label="观看 ' + escapeHTML(movie.title) + '">' +
                    '<img src="./' + escapeHTML(movie.cover) + '" alt="' + escapeHTML(movie.title) + '" loading="lazy">' +
                    '<span class="cover-shade"></span>' +
                    '<span class="play-badge">▶</span>' +
                    '<span class="category-badge">' + escapeHTML(movie.region) + '</span>' +
                    '<span class="duration-badge">' + escapeHTML(movie.duration) + '</span>' +
                '</a>' +
                '<div class="movie-card-body">' +
                    '<h3><a href="' + escapeHTML(movie.url) + '">' + escapeHTML(movie.title) + '</a></h3>' +
                    '<p>' + escapeHTML(movie.oneLine) + '</p>' +
                    '<div class="movie-meta-line">' +
                        '<span>' + escapeHTML(movie.year) + '</span>' +
                        '<span>' + escapeHTML(movie.type) + '</span>' +
                        '<span>' + escapeHTML(movie.genre) + '</span>' +
                    '</div>' +
                '</div>' +
            '</article>';
    }

    function initSearchPage() {
        var page = qs('[data-search-page]');

        if (!page || !window.MOVIE_INDEX) {
            return;
        }

        var input = qs('[data-search-input]', page);
        var region = qs('[data-search-region]', page);
        var type = qs('[data-search-type]', page);
        var reset = qs('[data-search-reset]', page);
        var results = qs('[data-search-results]');
        var count = qs('[data-search-count]');
        var params = new URLSearchParams(window.location.search);
        var regions = Array.from(new Set(window.MOVIE_INDEX.map(function (movie) { return movie.region; }))).sort();
        var types = Array.from(new Set(window.MOVIE_INDEX.map(function (movie) { return movie.type; }))).sort();

        regions.forEach(function (value) {
            region.insertAdjacentHTML('beforeend', '<option value="' + escapeHTML(value) + '">' + escapeHTML(value) + '</option>');
        });

        types.forEach(function (value) {
            type.insertAdjacentHTML('beforeend', '<option value="' + escapeHTML(value) + '">' + escapeHTML(value) + '</option>');
        });

        if (params.get('q')) {
            input.value = params.get('q');
        }

        function render() {
            var query = normalizeText(input.value);
            var selectedRegion = region.value;
            var selectedType = type.value;
            var matches = window.MOVIE_INDEX.filter(function (movie) {
                var haystack = normalizeText([
                    movie.title,
                    movie.region,
                    movie.type,
                    movie.year,
                    movie.genre,
                    movie.category,
                    Array.isArray(movie.tags) ? movie.tags.join(' ') : '',
                    movie.oneLine
                ].join(' '));
                return (!query || haystack.indexOf(query) !== -1) &&
                    (!selectedRegion || movie.region === selectedRegion) &&
                    (!selectedType || movie.type === selectedType);
            }).slice(0, 120);

            results.innerHTML = matches.map(createMovieCard).join('');
            count.textContent = '找到 ' + matches.length + ' 条结果' + (matches.length === 120 ? '（最多显示 120 条，请继续缩小条件）' : '');
        }

        [input, region, type].forEach(function (control) {
            control.addEventListener('input', render);
            control.addEventListener('change', render);
        });

        reset.addEventListener('click', function () {
            input.value = '';
            region.value = '';
            type.value = '';
            render();
        });

        render();
    }

    function prepareVideo(video) {
        var src = video.getAttribute('data-src');

        if (!src || video.getAttribute('data-hls-ready') === '1') {
            return;
        }

        video.setAttribute('data-hls-ready', '1');

        if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = src;
            return;
        }

        if (window.Hls && window.Hls.isSupported()) {
            var hls = new window.Hls({
                enableWorker: true,
                lowLatencyMode: true
            });

            hls.loadSource(src);
            hls.attachMedia(video);
            video._hlsInstance = hls;
            return;
        }

        video.src = src;
    }

    function initPlayers() {
        qsa('[data-player-shell]').forEach(function (shell) {
            var video = qs('.js-hls-video', shell);
            var button = qs('[data-play-button]', shell);

            if (!video) {
                return;
            }

            function play() {
                prepareVideo(video);
                if (button) {
                    button.classList.add('is-hidden');
                }
                var promise = video.play();
                if (promise && typeof promise.catch === 'function') {
                    promise.catch(function () {
                        if (button) {
                            button.classList.remove('is-hidden');
                        }
                    });
                }
            }

            if (button) {
                button.addEventListener('click', play);
            }

            video.addEventListener('click', function () {
                prepareVideo(video);
            }, { once: true });

            video.addEventListener('play', function () {
                if (button) {
                    button.classList.add('is-hidden');
                }
            });
        });
    }

    document.addEventListener('DOMContentLoaded', function () {
        initMobileMenu();
        initHeroCarousel();
        initCardFilters();
        initSearchPage();
        initPlayers();
    });
}());
