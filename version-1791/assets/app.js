(function () {
    function ready(callback) {
        if (document.readyState !== "loading") {
            callback();
        } else {
            document.addEventListener("DOMContentLoaded", callback);
        }
    }

    function setupMenu() {
        var button = document.querySelector(".menu-toggle");
        var panel = document.querySelector(".mobile-panel");
        if (!button || !panel) {
            return;
        }
        button.addEventListener("click", function () {
            var open = panel.classList.toggle("is-open");
            button.setAttribute("aria-expanded", open ? "true" : "false");
            button.textContent = open ? "×" : "☰";
        });
    }

    function setupHero() {
        var root = document.querySelector("[data-hero]");
        if (!root) {
            return;
        }
        var slides = Array.prototype.slice.call(root.querySelectorAll(".hero-slide"));
        var dots = Array.prototype.slice.call(root.querySelectorAll(".hero-dot"));
        if (!slides.length) {
            return;
        }
        var current = 0;
        var timer = null;

        function show(index) {
            current = (index + slides.length) % slides.length;
            slides.forEach(function (slide, slideIndex) {
                slide.classList.toggle("is-active", slideIndex === current);
            });
            dots.forEach(function (dot, dotIndex) {
                dot.classList.toggle("is-active", dotIndex === current);
            });
        }

        function start() {
            stop();
            timer = window.setInterval(function () {
                show(current + 1);
            }, 5200);
        }

        function stop() {
            if (timer) {
                window.clearInterval(timer);
                timer = null;
            }
        }

        dots.forEach(function (dot, index) {
            dot.addEventListener("click", function () {
                show(index);
                start();
            });
        });
        root.addEventListener("mouseenter", stop);
        root.addEventListener("mouseleave", start);
        show(0);
        start();
    }

    function normalized(value) {
        return (value || "").toString().trim().toLowerCase();
    }

    function setupFilters() {
        var scopes = Array.prototype.slice.call(document.querySelectorAll(".filter-scope"));
        scopes.forEach(function (scope) {
            var section = scope.closest("section") || document;
            var input = section.querySelector(".filter-input");
            var typeSelect = section.querySelector(".filter-type");
            var yearSelect = section.querySelector(".filter-year");
            var empty = section.querySelector(".empty-state");
            var cards = Array.prototype.slice.call(scope.querySelectorAll(".movie-card"));

            function apply() {
                var keyword = normalized(input && input.value);
                var typeValue = normalized(typeSelect && typeSelect.value);
                var yearValue = normalized(yearSelect && yearSelect.value);
                var shown = 0;
                cards.forEach(function (card) {
                    var haystack = normalized([
                        card.dataset.title,
                        card.dataset.genre,
                        card.dataset.region,
                        card.dataset.type,
                        card.dataset.year
                    ].join(" "));
                    var typeMatch = !typeValue || normalized(card.dataset.type).indexOf(typeValue) !== -1;
                    var yearMatch = !yearValue || normalized(card.dataset.year) === yearValue;
                    var keywordMatch = !keyword || haystack.indexOf(keyword) !== -1;
                    var visible = typeMatch && yearMatch && keywordMatch;
                    card.classList.toggle("is-filtered-out", !visible);
                    if (visible) {
                        shown += 1;
                    }
                });
                if (empty) {
                    empty.style.display = shown ? "none" : "block";
                }
            }

            [input, typeSelect, yearSelect].forEach(function (control) {
                if (control) {
                    control.addEventListener("input", apply);
                    control.addEventListener("change", apply);
                }
            });
            apply();
        });
    }

    function cardHtml(movie) {
        var tags = (movie.tags || []).slice(0, 3).map(function (tag) {
            return "<span>" + escapeHtml(tag) + "</span>";
        }).join("");
        return [
            "<article class=\"movie-card\">",
            "<a class=\"poster-link\" href=\"" + escapeHtml(movie.url) + "\">",
            "<img src=\"" + escapeHtml(movie.image) + "\" alt=\"" + escapeHtml(movie.title) + "\" loading=\"lazy\">",
            "<span class=\"play-badge\">▶</span>",
            "<span class=\"poster-gradient\"></span>",
            "</a>",
            "<div class=\"card-body\">",
            "<a class=\"card-title\" href=\"" + escapeHtml(movie.url) + "\">" + escapeHtml(movie.title) + "</a>",
            "<p>" + escapeHtml(movie.summary) + "</p>",
            "<div class=\"meta-line\"><span>" + escapeHtml(movie.year) + "</span><span>" + escapeHtml(movie.region) + "</span><span>" + escapeHtml(movie.type) + "</span></div>",
            "<div class=\"tag-row\">" + tags + "</div>",
            "</div>",
            "</article>"
        ].join("");
    }

    function escapeHtml(value) {
        return (value || "").toString()
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function setupSearchPage() {
        var index = window.SEARCH_INDEX;
        var resultRoot = document.getElementById("search-results");
        var input = document.getElementById("search-page-input");
        var title = document.querySelector(".search-result-title");
        var empty = document.getElementById("search-empty");
        if (!index || !resultRoot || !input) {
            return;
        }
        var params = new URLSearchParams(window.location.search);
        var keyword = params.get("q") || "";
        input.value = keyword;
        if (!keyword.trim()) {
            return;
        }
        var words = normalized(keyword).split(/\s+/).filter(Boolean);
        var results = index.filter(function (movie) {
            var haystack = normalized([
                movie.title,
                movie.year,
                movie.region,
                movie.type,
                movie.genre,
                movie.category,
                (movie.tags || []).join(" "),
                movie.summary
            ].join(" "));
            return words.every(function (word) {
                return haystack.indexOf(word) !== -1;
            });
        }).slice(0, 120);
        if (title) {
            title.textContent = results.length ? "搜索结果" : "没有匹配的影片";
        }
        resultRoot.innerHTML = results.map(cardHtml).join("");
        if (empty) {
            empty.style.display = results.length ? "none" : "block";
        }
    }

    window.bindMoviePlayer = function (id, source) {
        var video = document.getElementById(id);
        if (!video || !source) {
            return;
        }
        var shell = video.closest(".player-shell");
        var layer = shell ? shell.querySelector(".play-layer") : null;
        var loader = shell ? shell.querySelector(".player-loader") : null;
        var message = shell ? shell.querySelector(".player-message") : null;
        var attached = false;
        var hlsInstance = null;

        function showLoader(show) {
            if (loader) {
                loader.classList.toggle("is-visible", !!show);
            }
        }

        function showMessage(show) {
            if (message) {
                message.classList.toggle("is-visible", !!show);
            }
        }

        function attach() {
            if (attached) {
                return;
            }
            attached = true;
            showMessage(false);
            if (video.canPlayType("application/vnd.apple.mpegurl")) {
                video.src = source;
            } else if (window.Hls && window.Hls.isSupported()) {
                hlsInstance = new window.Hls({
                    enableWorker: true,
                    lowLatencyMode: true
                });
                hlsInstance.loadSource(source);
                hlsInstance.attachMedia(video);
                hlsInstance.on(window.Hls.Events.ERROR, function (event, data) {
                    if (data && data.fatal) {
                        showLoader(false);
                        showMessage(true);
                    }
                });
            } else {
                video.src = source;
            }
        }

        function play() {
            attach();
            showLoader(true);
            if (layer) {
                layer.classList.add("is-hidden");
            }
            video.setAttribute("controls", "controls");
            var promise = video.play();
            if (promise && promise.catch) {
                promise.catch(function () {
                    showLoader(false);
                    if (layer) {
                        layer.classList.remove("is-hidden");
                    }
                });
            }
        }

        if (layer) {
            layer.addEventListener("click", play);
        }
        video.addEventListener("click", function () {
            if (video.paused) {
                play();
            }
        });
        video.addEventListener("canplay", function () {
            showLoader(false);
        });
        video.addEventListener("playing", function () {
            showLoader(false);
            showMessage(false);
        });
        video.addEventListener("waiting", function () {
            showLoader(true);
        });
        video.addEventListener("error", function () {
            showLoader(false);
            showMessage(true);
        });
        window.addEventListener("beforeunload", function () {
            if (hlsInstance) {
                hlsInstance.destroy();
            }
        });
    };

    ready(function () {
        setupMenu();
        setupHero();
        setupFilters();
        setupSearchPage();
    });
}());
