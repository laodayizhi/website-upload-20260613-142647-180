(function () {
  var toggle = document.querySelector('[data-menu-toggle]');
  var mobileNav = document.querySelector('[data-mobile-nav]');

  if (toggle && mobileNav) {
    toggle.addEventListener('click', function () {
      mobileNav.classList.toggle('is-open');
    });
  }

  var slides = Array.prototype.slice.call(document.querySelectorAll('[data-hero-slide]'));
  var dots = Array.prototype.slice.call(document.querySelectorAll('[data-hero-dot]'));
  var current = 0;
  var timer = null;

  function showHero(index) {
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

  function startHero() {
    if (slides.length < 2) {
      return;
    }
    timer = setInterval(function () {
      showHero(current + 1);
    }, 5000);
  }

  dots.forEach(function (dot, index) {
    dot.addEventListener('click', function () {
      if (timer) {
        clearInterval(timer);
      }
      showHero(index);
      startHero();
    });
  });

  showHero(0);
  startHero();

  var searchInput = document.querySelector('[data-search-input]');
  var filterButtons = Array.prototype.slice.call(document.querySelectorAll('[data-filter]'));
  var cards = Array.prototype.slice.call(document.querySelectorAll('.movie-card, .rank-card'));
  var activeFilter = 'all';

  function normalize(value) {
    return String(value || '').toLowerCase().trim();
  }

  function applyFilters() {
    var query = normalize(searchInput ? searchInput.value : '');

    cards.forEach(function (card) {
      var haystack = normalize(card.getAttribute('data-search'));
      var category = normalize(card.getAttribute('data-category'));
      var bodyText = normalize(card.textContent);
      var matchQuery = !query || haystack.indexOf(query) >= 0 || bodyText.indexOf(query) >= 0;
      var matchFilter = activeFilter === 'all' || category === normalize(activeFilter) || bodyText.indexOf(normalize(activeFilter)) >= 0;
      card.classList.toggle('is-hidden-by-filter', !(matchQuery && matchFilter));
    });
  }

  if (searchInput) {
    searchInput.addEventListener('input', applyFilters);
  }

  filterButtons.forEach(function (button) {
    button.addEventListener('click', function () {
      activeFilter = button.getAttribute('data-filter') || 'all';
      filterButtons.forEach(function (item) {
        item.classList.toggle('is-active', item === button);
      });
      applyFilters();
    });
  });
})();

function initMoviePlayer(source) {
  var video = document.getElementById('movieVideo');
  var cover = document.querySelector('[data-player-cover]');
  var button = document.querySelector('[data-player-button]');
  var attached = false;
  var hls = null;

  if (!video || !source) {
    return;
  }

  function attach() {
    if (attached) {
      return;
    }

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = source;
    } else if (window.Hls && window.Hls.isSupported()) {
      hls = new Hls({
        maxBufferLength: 30,
        enableWorker: true
      });
      hls.loadSource(source);
      hls.attachMedia(video);
    } else {
      video.src = source;
    }

    attached = true;
  }

  function start() {
    attach();
    video.controls = true;

    if (cover) {
      cover.classList.add('is-hidden');
    }

    var playTask = video.play();
    if (playTask && typeof playTask.catch === 'function') {
      playTask.catch(function () {});
    }
  }

  if (cover) {
    cover.addEventListener('click', start);
  }

  if (button) {
    button.addEventListener('click', function (event) {
      event.stopPropagation();
      start();
    });
  }

  video.addEventListener('click', function () {
    if (video.paused) {
      start();
    }
  });

  window.addEventListener('pagehide', function () {
    if (hls) {
      hls.destroy();
      hls = null;
    }
  });
}
