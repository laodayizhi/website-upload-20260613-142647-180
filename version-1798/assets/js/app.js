(function () {
  function ready(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback);
    } else {
      callback();
    }
  }

  ready(function () {
    setupMenu();
    setupSlider();
    setupSearchAndFilters();
    setupPlayers();
  });

  function setupMenu() {
    var toggle = document.querySelector(".mobile-toggle");
    var nav = document.querySelector(".mobile-nav");
    if (!toggle || !nav) {
      return;
    }

    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  function setupSlider() {
    var slider = document.querySelector("[data-slider]");
    if (!slider) {
      return;
    }

    var slides = Array.prototype.slice.call(slider.querySelectorAll(".focus-slide"));
    var dots = Array.prototype.slice.call(slider.querySelectorAll(".focus-dot"));
    var prev = slider.querySelector(".slider-prev");
    var next = slider.querySelector(".slider-next");
    var current = 0;
    var timer = null;

    function show(index) {
      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, idx) {
        slide.classList.toggle("active", idx === current);
      });
      dots.forEach(function (dot, idx) {
        dot.classList.toggle("active", idx === current);
      });
    }

    function restart() {
      window.clearInterval(timer);
      timer = window.setInterval(function () {
        show(current + 1);
      }, 5000);
    }

    if (prev) {
      prev.addEventListener("click", function () {
        show(current - 1);
        restart();
      });
    }

    if (next) {
      next.addEventListener("click", function () {
        show(current + 1);
        restart();
      });
    }

    dots.forEach(function (dot) {
      dot.addEventListener("click", function () {
        show(Number(dot.getAttribute("data-slide")) || 0);
        restart();
      });
    });

    show(0);
    restart();
  }

  function setupSearchAndFilters() {
    var inputs = Array.prototype.slice.call(document.querySelectorAll(".site-search"));
    var buttons = Array.prototype.slice.call(document.querySelectorAll(".filter-pill"));
    if (!inputs.length && !buttons.length) {
      return;
    }

    function getCards() {
      return Array.prototype.slice.call(document.querySelectorAll(".movie-card, .category-card, .ranking-row"));
    }

    function activeFilter() {
      var active = document.querySelector(".filter-pill.active");
      return active ? active.getAttribute("data-filter") : "all";
    }

    function queryText() {
      var input = document.querySelector(".site-search");
      return input ? input.value.trim().toLowerCase() : "";
    }

    function cardText(card) {
      return [
        card.getAttribute("data-title"),
        card.getAttribute("data-meta"),
        card.getAttribute("data-type"),
        card.getAttribute("data-tags"),
        card.textContent
      ].join(" ").toLowerCase();
    }

    function apply() {
      var filter = activeFilter();
      var query = queryText();
      getCards().forEach(function (card) {
        var text = cardText(card);
        var matchQuery = !query || text.indexOf(query) !== -1;
        var matchFilter = filter === "all" || text.indexOf(filter.toLowerCase()) !== -1;
        card.classList.toggle("is-hidden", !(matchQuery && matchFilter));
      });
    }

    inputs.forEach(function (input) {
      input.addEventListener("input", apply);
    });

    buttons.forEach(function (button) {
      button.addEventListener("click", function () {
        buttons.forEach(function (item) {
          item.classList.remove("active");
        });
        button.classList.add("active");
        apply();
      });
    });
  }

  function setupPlayers() {
    var blocks = Array.prototype.slice.call(document.querySelectorAll(".player-shell"));
    blocks.forEach(function (block) {
      var video = block.querySelector(".watch-player");
      var overlay = block.querySelector(".play-overlay");
      if (!video) {
        return;
      }

      function start() {
        var stream = video.getAttribute("data-stream");
        if (!stream) {
          return;
        }

        if (overlay) {
          overlay.classList.add("is-hidden");
        }

        if (video.canPlayType("application/vnd.apple.mpegurl")) {
          if (!video.src) {
            video.src = stream;
          }
          video.play().catch(function () {});
          return;
        }

        if (window.Hls && window.Hls.isSupported()) {
          if (!video.hlsInstance) {
            var hls = new window.Hls({
              enableWorker: true,
              lowLatencyMode: true,
              backBufferLength: 90
            });
            hls.loadSource(stream);
            hls.attachMedia(video);
            hls.on(window.Hls.Events.MANIFEST_PARSED, function () {
              video.play().catch(function () {});
            });
            video.hlsInstance = hls;
          } else {
            video.play().catch(function () {});
          }
          return;
        }

        if (!video.src) {
          video.src = stream;
        }
        video.play().catch(function () {});
      }

      if (overlay) {
        overlay.addEventListener("click", start);
      }

      Array.prototype.slice.call(document.querySelectorAll(".start-play")).forEach(function (button) {
        button.addEventListener("click", function () {
          block.scrollIntoView({ behavior: "smooth", block: "center" });
          start();
        });
      });

      video.addEventListener("click", function () {
        if (video.paused) {
          start();
        }
      });

      video.addEventListener("play", function () {
        if (overlay) {
          overlay.classList.add("is-hidden");
        }
      });
    });
  }
})();
