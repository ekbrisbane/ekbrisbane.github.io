(function () {
  "use strict";
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  var IST = { lat: 41.01, lon: 28.98 };
  var BNE = { lat: -27.47, lon: 153.03 };
  function fmt(lat, lon) {
    return Math.abs(lat).toFixed(2) + "° " + (lat >= 0 ? "N" : "S") + "  " +
           Math.abs(lon).toFixed(2) + "° " + (lon >= 0 ? "E" : "W");
  }

  /* Brisbane studio clock */
  var clock = $("#clock");
  function tick() {
    if (!clock) return;
    try {
      var t = new Intl.DateTimeFormat("en-AU", { timeZone: "Australia/Brisbane", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date());
      clock.textContent = "Brisbane " + t + " AEST";
    } catch (e) { /* keep static text */ }
  }
  tick(); setInterval(tick, 20000);

  /* Mobile index */
  var menuBtn = $(".menu-btn"), overlay = $("#overlay"), closeBtn = $("#overlay-close");
  function setMenu(open) {
    if (!overlay) return;
    overlay.hidden = !open;
    if (menuBtn) menuBtn.setAttribute("aria-expanded", String(open));
    document.documentElement.style.overflow = open ? "hidden" : "";
    if (open && closeBtn) closeBtn.focus();
  }
  if (menuBtn) menuBtn.addEventListener("click", function () { setMenu(true); });
  if (closeBtn) closeBtn.addEventListener("click", function () { setMenu(false); menuBtn && menuBtn.focus(); });
  if (overlay) overlay.addEventListener("click", function (e) { if (e.target.closest("a")) setMenu(false); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && overlay && !overlay.hidden) setMenu(false); });

  /* Coordinates plot from Istanbul to Brisbane on load */
  var coord = $("#coord");
  if (coord && !reduce) {
    var t0 = null, dur = 2400, delay = 900;
    var ease = function (x) { return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
    coord.textContent = fmt(IST.lat, IST.lon);
    var step = function (ts) {
      if (t0 === null) t0 = ts + delay;
      var p = Math.min(1, Math.max(0, (ts - t0) / dur)), k = ease(p);
      coord.textContent = fmt(IST.lat + (BNE.lat - IST.lat) * k, IST.lon + (BNE.lon - IST.lon) * k);
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  /* Crosshair: pointer position read as a point over greater Brisbane */
  var hero = $(".hero"), cross = $(".cross");
  if (hero && cross && window.matchMedia("(hover: hover) and (pointer: fine)").matches && !reduce) {
    var v = $(".v", cross), h = $(".h", cross), tag = $(".tag", cross), raf = 0, px = 0, py = 0;
    var paint = function () {
      raf = 0;
      var r = hero.getBoundingClientRect(), x = px - r.left, y = py - r.top;
      var fx = Math.min(1, Math.max(0, x / r.width)), fy = Math.min(1, Math.max(0, y / r.height));
      v.style.transform = "translateX(" + x + "px)";
      h.style.transform = "translateY(" + y + "px)";
      var tx = x + 14, ty = y + 14;
      if (tx > r.width - 190) tx = x - 190;
      if (ty > r.height - 40) ty = y - 34;
      tag.style.transform = "translate(" + tx + "px," + ty + "px)";
      tag.textContent = fmt(-27.38 - 0.18 * fy, 152.92 + 0.22 * fx);
    };
    hero.addEventListener("pointermove", function (e) {
      px = e.clientX; py = e.clientY;
      hero.classList.add("cursor-on");
      if (!raf) raf = requestAnimationFrame(paint);
    });
    hero.addEventListener("pointerleave", function () { hero.classList.remove("cursor-on"); });
  }

  /* Draw-on-view: only arms elements that start below the fold, so the first frame is always complete */
  var drawables = $$("[data-draw]");
  if ("IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("drawn"); io.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -15% 0px" });
    drawables.forEach(function (el) {
      if (el.getBoundingClientRect().top > window.innerHeight) {
        el.classList.add("armed");
        void el.offsetWidth;
        io.observe(el);
      }
    });
  }

  /* Section numerals fill with ink as the reader moves through each section */
  var blocks = $$(".blk").map(function (b) { return { el: b, num: $(".num", b) }; }).filter(function (o) { return o.num; });
  function fillNums() {
    var vh = window.innerHeight;
    blocks.forEach(function (o) {
      var r = o.el.getBoundingClientRect();
      var p = (vh * 0.75 - r.top) / (r.height * 0.8);
      p = Math.min(1, Math.max(0, p));
      o.num.style.setProperty("--fill", (p * 100).toFixed(1) + "%");
    });
  }

  /* Career scale: the "now" line, and hover links between bars and the ledger */
  var scale = $(".scale"), nowline = $(".nowline");
  if (scale && nowline) {
    var d = new Date(), y = d.getFullYear() + (d.getMonth() + d.getDate() / 31) / 12;
    y = Math.min(2027, Math.max(2026.5, y));
    nowline.style.left = "calc(34% + " + ((y - 2021) / 6 * 66).toFixed(3) + "%)";
    $$(".bar.now").forEach(function (b) { b.style.setProperty("--e", y.toFixed(3)); });
  }
  $$(".bar-row[data-key]").forEach(function (row) {
    var key = row.getAttribute("data-key"), item = document.getElementById("l-" + key);
    if (!item) return;
    row.addEventListener("mouseenter", function () { item.classList.add("hl"); });
    row.addEventListener("mouseleave", function () { item.classList.remove("hl"); });
    row.addEventListener("click", function () {
      item.open = true; item.classList.add("hl");
      item.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
      setTimeout(function () { item.classList.remove("hl"); }, 1600);
    });
    item.addEventListener("mouseenter", function () { row.classList.add("hl"); });
    item.addEventListener("mouseleave", function () { row.classList.remove("hl"); });
  });

  /* Grid overlay: press G, or use the footer button */
  var gbtn = $(".gridbtn");
  function toggleGrid() {
    var on = document.body.classList.toggle("show-grid");
    if (gbtn) gbtn.setAttribute("aria-pressed", String(on));
  }
  if (gbtn) gbtn.addEventListener("click", toggleGrid);
  document.addEventListener("keydown", function (e) {
    if ((e.key === "g" || e.key === "G") && !e.metaKey && !e.ctrlKey && !e.altKey && !/input|textarea|select/i.test(e.target.tagName)) toggleGrid();
  });

  /* Active section in the index */
  var links = $$(".idx a[href^='#']");
  if ("IntersectionObserver" in window && links.length) {
    var map = {};
    links.forEach(function (a) { map[a.getAttribute("href").slice(1)] = a; });
    var so = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting && map[en.target.id]) {
          links.forEach(function (a) { a.removeAttribute("aria-current"); });
          map[en.target.id].setAttribute("aria-current", "true");
        }
      });
    }, { rootMargin: "-40% 0px -55% 0px" });
    Object.keys(map).forEach(function (id) { var el = document.getElementById(id); if (el) so.observe(el); });
  }

  var yr = $("#year"); if (yr) yr.textContent = new Date().getFullYear();

  var ticking = false;
  window.addEventListener("scroll", function () {
    if (!ticking) { ticking = true; requestAnimationFrame(function () { fillNums(); ticking = false; }); }
  }, { passive: true });
  window.addEventListener("resize", fillNums);
  fillNums();
})();
