(function () {
  var menuButton = document.querySelector('[data-menu-toggle]');
  var mobileNav = document.querySelector('[data-mobile-nav]');

  if (menuButton && mobileNav) {
    menuButton.addEventListener('click', function () {
      var open = mobileNav.classList.toggle('is-open');
      menuButton.setAttribute('aria-expanded', open ? 'true' : 'false');
      menuButton.textContent = open ? '×' : '☰';
    });
  }

  document.querySelectorAll('[data-hero-carousel]').forEach(function (carousel) {
    var slides = Array.prototype.slice.call(carousel.querySelectorAll('[data-hero-slide]'));
    var dots = Array.prototype.slice.call(carousel.querySelectorAll('[data-hero-dot]'));
    var index = 0;
    var timer = null;

    function show(next) {
      if (!slides.length) {
        return;
      }

      index = (next + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle('is-active', slideIndex === index);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle('is-active', dotIndex === index);
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
        timer = null;
      }
    }

    dots.forEach(function (dot, dotIndex) {
      dot.addEventListener('click', function () {
        show(dotIndex);
        start();
      });
    });

    carousel.addEventListener('mouseenter', stop);
    carousel.addEventListener('mouseleave', start);
    show(0);
    start();
  });

  document.querySelectorAll('[data-filter-area]').forEach(function (panel) {
    var scope = panel.closest('section') || document;
    var cards = Array.prototype.slice.call(scope.querySelectorAll('[data-filter-card]'));
    var input = panel.querySelector('[data-filter-input]');
    var typeSelect = panel.querySelector('[data-filter-type]');
    var yearSelect = panel.querySelector('[data-filter-year]');
    var emptyState = panel.querySelector('[data-empty-state]');

    function normalize(value) {
      return String(value || '').toLowerCase().trim();
    }

    function applyFilter() {
      var query = normalize(input ? input.value : '');
      var type = typeSelect ? typeSelect.value : '';
      var year = yearSelect ? yearSelect.value : '';
      var visible = 0;

      cards.forEach(function (card) {
        var search = normalize(card.getAttribute('data-search'));
        var cardType = card.getAttribute('data-type') || '';
        var cardYear = card.getAttribute('data-year') || '';
        var matched = true;

        if (query && search.indexOf(query) === -1) {
          matched = false;
        }

        if (type && cardType !== type) {
          matched = false;
        }

        if (year && cardYear !== year) {
          matched = false;
        }

        card.hidden = !matched;

        if (matched) {
          visible += 1;
        }
      });

      if (emptyState) {
        emptyState.hidden = visible !== 0;
      }
    }

    [input, typeSelect, yearSelect].forEach(function (field) {
      if (field) {
        field.addEventListener('input', applyFilter);
        field.addEventListener('change', applyFilter);
      }
    });
  });

  document.querySelectorAll('[data-like]').forEach(function (button) {
    button.addEventListener('click', function () {
      button.classList.toggle('is-active');
      button.textContent = button.classList.contains('is-active') ? '已点赞' : '点赞';
    });
  });

  document.querySelectorAll('[data-share]').forEach(function (button) {
    button.addEventListener('click', function () {
      var link = window.location.href;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(link).then(function () {
          button.textContent = '已复制';
          window.setTimeout(function () {
            button.textContent = '分享';
          }, 1600);
        });
      } else {
        button.textContent = '已准备';
        window.setTimeout(function () {
          button.textContent = '分享';
        }, 1600);
      }
    });
  });

  window.initVideoPlayer = function (videoId, source, poster) {
    var video = document.getElementById(videoId);

    if (!video || !source) {
      return;
    }

    var box = video.closest('.player-box');
    var overlay = box ? box.querySelector('.player-overlay') : null;
    var hlsInstance = null;
    var loaded = false;

    function bindSource() {
      if (loaded) {
        return;
      }

      loaded = true;

      if (poster) {
        video.setAttribute('poster', poster);
      }

      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = source;
      } else if (window.Hls && window.Hls.isSupported()) {
        hlsInstance = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true
        });
        hlsInstance.loadSource(source);
        hlsInstance.attachMedia(video);
      } else {
        video.src = source;
      }
    }

    function playVideo() {
      bindSource();
      video.setAttribute('controls', 'controls');

      if (overlay) {
        overlay.classList.add('is-hidden');
      }

      var playAction = video.play();

      if (playAction && typeof playAction.catch === 'function') {
        playAction.catch(function () {
          if (overlay) {
            overlay.classList.remove('is-hidden');
          }
        });
      }
    }

    if (overlay) {
      overlay.addEventListener('click', playVideo);
    }

    video.addEventListener('click', function () {
      if (video.paused) {
        playVideo();
      }
    });

    video.addEventListener('play', function () {
      if (overlay) {
        overlay.classList.add('is-hidden');
      }
    });

    video.addEventListener('pause', function () {
      if (video.currentTime === 0 && overlay) {
        overlay.classList.remove('is-hidden');
      }
    });

    window.addEventListener('pagehide', function () {
      if (hlsInstance && typeof hlsInstance.destroy === 'function') {
        hlsInstance.destroy();
      }
    });
  };
})();
