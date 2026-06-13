(function () {
  function qs(selector, root) {
    return (root || document).querySelector(selector);
  }

  function qsa(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function initMobileNav() {
    var toggle = qs('[data-mobile-nav-toggle]');
    var nav = qs('[data-mobile-nav]');
    if (!toggle || !nav) {
      return;
    }
    toggle.addEventListener('click', function () {
      nav.classList.toggle('open');
      toggle.textContent = nav.classList.contains('open') ? '×' : '☰';
    });
  }

  function initHero() {
    var hero = qs('[data-hero]');
    if (!hero) {
      return;
    }
    var slides = qsa('[data-hero-slide]', hero);
    var dots = qsa('[data-hero-dot]', hero);
    if (slides.length <= 1) {
      return;
    }
    var index = 0;
    var timer = null;

    function show(nextIndex) {
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle('active', slideIndex === index);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle('active', dotIndex === index);
      });
    }

    function start() {
      stop();
      timer = window.setInterval(function () {
        show(index + 1);
      }, 5200);
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
      }
    }

    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        show(Number(dot.getAttribute('data-hero-dot')) || 0);
        start();
      });
    });
    hero.addEventListener('mouseenter', stop);
    hero.addEventListener('mouseleave', start);
    start();
  }

  function initFilters() {
    qsa('[data-filter-scope]').forEach(function (scope) {
      var searchInput = qs('[data-card-search]', scope);
      var count = qs('[data-visible-count]', scope);
      var grid = scope.parentElement ? qs('[data-card-grid]', scope.parentElement) : null;
      var cards = grid ? qsa('[data-card]', grid) : qsa('[data-card]');
      var activeYear = 'all';
      var activeType = 'all';

      function update() {
        var term = searchInput ? searchInput.value.trim().toLowerCase() : '';
        var visible = 0;
        cards.forEach(function (card) {
          var text = (card.getAttribute('data-search') || '').toLowerCase();
          var year = (card.getAttribute('data-year') || '').toString();
          var type = (card.getAttribute('data-type') || '').toString();
          var okTerm = !term || text.indexOf(term) !== -1;
          var okYear = activeYear === 'all' || year.indexOf(activeYear) !== -1;
          var okType = activeType === 'all' || type.indexOf(activeType) !== -1;
          var visibleNow = okTerm && okYear && okType;
          card.classList.toggle('is-hidden', !visibleNow);
          if (visibleNow) {
            visible += 1;
          }
        });
        if (count) {
          count.textContent = String(visible);
        }
      }

      if (searchInput) {
        var param = searchInput.getAttribute('data-query-param');
        if (param) {
          var query = new URLSearchParams(window.location.search).get(param);
          if (query) {
            searchInput.value = query;
          }
        }
        searchInput.addEventListener('input', update);
      }

      qsa('[data-year-filter]', scope).forEach(function (button) {
        button.addEventListener('click', function () {
          activeYear = button.getAttribute('data-year-filter') || 'all';
          qsa('[data-year-filter]', scope).forEach(function (other) {
            other.classList.toggle('active', other === button);
          });
          update();
        });
      });

      qsa('[data-type-filter]', scope).forEach(function (button) {
        button.addEventListener('click', function () {
          activeType = button.getAttribute('data-type-filter') || 'all';
          qsa('[data-type-filter]', scope).forEach(function (other) {
            other.classList.toggle('active', other === button);
          });
          update();
        });
      });

      update();
    });
  }

  function initPlayers() {
    qsa('[data-player]').forEach(function (player) {
      var video = qs('video', player);
      var trigger = qs('[data-player-trigger]', player);
      var message = qs('[data-player-message]', player);
      if (!video || !trigger) {
        return;
      }
      var hlsInstance = null;

      function setMessage(text) {
        if (message) {
          message.textContent = text;
        }
      }

      function loadSource(src) {
        if (!src) {
          setMessage('当前页面没有可用播放源。');
          return;
        }
        player.classList.add('playing');
        setMessage('正在加载视频，请稍候。');

        if (hlsInstance && typeof hlsInstance.destroy === 'function') {
          hlsInstance.destroy();
          hlsInstance = null;
        }

        if (window.Hls && window.Hls.isSupported()) {
          hlsInstance = new window.Hls({
            enableWorker: true,
            lowLatencyMode: false
          });
          hlsInstance.loadSource(src);
          hlsInstance.attachMedia(video);
          hlsInstance.on(window.Hls.Events.MANIFEST_PARSED, function () {
            video.play().then(function () {
              setMessage('');
            }).catch(function () {
              setMessage('视频已加载，请点击播放器上的播放按钮。');
            });
          });
          hlsInstance.on(window.Hls.Events.ERROR, function () {
            setMessage('播放源暂时无法加载，请稍后重试或切换网络。');
          });
          return;
        }

        if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = src;
          video.addEventListener('loadedmetadata', function () {
            video.play().catch(function () {
              setMessage('视频已加载，请点击播放器上的播放按钮。');
            });
          }, { once: true });
          return;
        }

        video.src = src;
        video.play().catch(function () {
          setMessage('当前浏览器不支持此播放源，请使用支持 HLS 的浏览器。');
        });
      }

      trigger.addEventListener('click', function () {
        loadSource(video.getAttribute('data-src'));
      });

      qsa('[data-source]').forEach(function (button) {
        button.addEventListener('click', function () {
          qsa('[data-source]').forEach(function (other) {
            other.classList.remove('active');
          });
          button.classList.add('active');
          var src = button.getAttribute('data-source');
          video.setAttribute('data-src', src || '');
          loadSource(src || '');
        });
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initMobileNav();
    initHero();
    initFilters();
    initPlayers();
  });
}());
