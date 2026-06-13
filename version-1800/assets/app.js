(function () {
  function selectAll(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function initNavigation() {
    var toggle = document.querySelector('[data-nav-toggle]');
    var menu = document.querySelector('[data-nav-menu]');
    if (!toggle || !menu) {
      return;
    }
    toggle.addEventListener('click', function () {
      menu.classList.toggle('is-open');
    });
  }

  function initHero() {
    var hero = document.querySelector('[data-hero]');
    if (!hero) {
      return;
    }
    var slides = selectAll('[data-hero-slide]', hero);
    var dots = selectAll('[data-hero-dot]', hero);
    var prev = hero.querySelector('[data-hero-prev]');
    var next = hero.querySelector('[data-hero-next]');
    var index = 0;
    var timer = null;

    function show(nextIndex) {
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach(function (slide, currentIndex) {
        slide.classList.toggle('is-active', currentIndex === index);
      });
      dots.forEach(function (dot, currentIndex) {
        dot.classList.toggle('is-active', currentIndex === index);
      });
    }

    function start() {
      timer = window.setInterval(function () {
        show(index + 1);
      }, 5200);
    }

    function restart() {
      if (timer) {
        window.clearInterval(timer);
      }
      start();
    }

    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        show(Number(dot.getAttribute('data-hero-dot')) || 0);
        restart();
      });
    });

    if (prev) {
      prev.addEventListener('click', function () {
        show(index - 1);
        restart();
      });
    }

    if (next) {
      next.addEventListener('click', function () {
        show(index + 1);
        restart();
      });
    }

    show(0);
    start();
  }

  function initLocalFilters() {
    var panels = selectAll('[data-filter-panel]');
    panels.forEach(function (panel) {
      var section = panel.closest('.content-section') || document;
      var input = panel.querySelector('[data-filter-input]');
      var year = panel.querySelector('[data-filter-year]');
      var region = panel.querySelector('[data-filter-region]');
      var cards = selectAll('[data-movie-card]', section);

      function apply() {
        var query = input ? input.value.trim().toLowerCase() : '';
        var yearValue = year ? year.value : '';
        var regionValue = region ? region.value : '';
        var visible = 0;
        cards.forEach(function (card) {
          var text = card.getAttribute('data-text') || '';
          var cardYear = card.getAttribute('data-year') || '';
          var cardRegion = card.getAttribute('data-region') || '';
          var matched = (!query || text.indexOf(query) !== -1) && (!yearValue || cardYear === yearValue) && (!regionValue || cardRegion === regionValue);
          card.classList.toggle('is-hidden', !matched);
          if (matched) {
            visible += 1;
          }
        });
        var empty = section.querySelector('[data-empty-state]');
        if (!empty) {
          empty = document.createElement('div');
          empty.className = 'empty-state';
          empty.setAttribute('data-empty-state', '');
          empty.textContent = '没有找到匹配影片';
          var grid = section.querySelector('[data-filter-results]');
          if (grid) {
            grid.appendChild(empty);
          }
        }
        empty.style.display = visible ? 'none' : 'block';
      }

      [input, year, region].forEach(function (control) {
        if (control) {
          control.addEventListener('input', apply);
          control.addEventListener('change', apply);
        }
      });

      apply();
    });
  }

  function escapeHtml(value) {
    return String(value || '').replace(/[&<>"]/g, function (character) {
      return {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;'
      }[character];
    });
  }

  function cardTemplate(movie) {
    var tags = (movie.tags || []).slice(0, 3).map(function (tag) {
      return '<span>' + escapeHtml(tag) + '</span>';
    }).join('');
    return '<article class="movie-card" data-movie-card>' +
      '<a href="./' + escapeHtml(movie.file) + '" class="card-link">' +
      '<div class="poster-wrap"><img src="' + escapeHtml(movie.cover) + '" alt="' + escapeHtml(movie.title) + '" loading="lazy"><span class="poster-year">' + escapeHtml(movie.year) + '</span></div>' +
      '<div class="card-body"><h2>' + escapeHtml(movie.title) + '</h2><p class="card-meta">' + escapeHtml(movie.region) + ' · ' + escapeHtml(movie.type) + ' · ' + escapeHtml(movie.genre) + '</p><p class="card-desc">' + escapeHtml(movie.oneLine) + '</p><div class="tag-row">' + tags + '</div></div>' +
      '</a></article>';
  }

  function initGlobalSearch() {
    var input = document.getElementById('global-search');
    var year = document.getElementById('global-year');
    var region = document.getElementById('global-region');
    var results = document.getElementById('search-results');
    if (!input || !results || typeof searchMovies === 'undefined') {
      return;
    }

    var params = new URLSearchParams(window.location.search);
    var firstQuery = params.get('q') || '';
    input.value = firstQuery;

    function render() {
      var query = input.value.trim().toLowerCase();
      var yearValue = year ? year.value : '';
      var regionValue = region ? region.value : '';
      var matched = searchMovies.filter(function (movie) {
        var text = movie.searchText || '';
        return (!query || text.indexOf(query) !== -1) && (!yearValue || movie.year === yearValue) && (!regionValue || movie.region === regionValue);
      }).slice(0, 96);
      if (!matched.length) {
        results.innerHTML = '<div class="empty-state">没有找到匹配影片</div>';
        return;
      }
      results.innerHTML = matched.map(cardTemplate).join('');
    }

    [input, year, region].forEach(function (control) {
      if (control) {
        control.addEventListener('input', render);
        control.addEventListener('change', render);
      }
    });

    render();
  }

  function initPlayer() {
    var video = document.querySelector('[data-player-video]');
    var button = document.querySelector('[data-player-start]');
    var shell = document.querySelector('[data-player-shell]');
    if (!video || !button || !shell || typeof currentStreamUrl === 'undefined') {
      return;
    }
    var started = false;
    var hlsInstance = null;

    function playVideo() {
      var playback = video.play();
      if (playback && typeof playback.catch === 'function') {
        playback.catch(function () {});
      }
    }

    function startPlayback() {
      if (!started) {
        if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = currentStreamUrl;
          video.addEventListener('loadedmetadata', playVideo, { once: true });
        } else if (window.Hls && window.Hls.isSupported()) {
          hlsInstance = new Hls({ enableWorker: true, lowLatencyMode: true });
          hlsInstance.loadSource(currentStreamUrl);
          hlsInstance.attachMedia(video);
          hlsInstance.on(Hls.Events.MANIFEST_PARSED, playVideo);
        } else {
          video.src = currentStreamUrl;
          video.addEventListener('loadedmetadata', playVideo, { once: true });
        }
        video.controls = true;
        started = true;
      }
      button.classList.add('hidden');
      shell.classList.add('is-playing');
      playVideo();
    }

    button.addEventListener('click', startPlayback);
    video.addEventListener('click', function () {
      if (!started) {
        startPlayback();
      }
    });

    window.addEventListener('pagehide', function () {
      if (hlsInstance) {
        hlsInstance.destroy();
      }
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initNavigation();
    initHero();
    initLocalFilters();
    initGlobalSearch();
    initPlayer();
  });
}());
