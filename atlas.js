/* THE LAW OF FAMILY & PARENTHOOD: one shared engine for every composition.
   All content is already in the HTML; this script only arranges it into
   interactive views. Without it, every panel simply shows in order. */
(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };

  /* ---------- jurisdiction: one choice, shared by every selector on the page ---------- */
  var NAMES = { qld: "Queensland", nsw: "New South Wales", vic: "Victoria", other: "Other jurisdictions" };
  var jur = "qld";
  function applyJur(code) {
    jur = code;
    $$(".jur-set button").forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-jur") === code)); });
    $$("[data-jur-name]").forEach(function (el) { el.textContent = NAMES[code]; });
    $$("[data-jur-panel]").forEach(function (p) {
      var list = p.getAttribute("data-jur-panel").split(/\s+/);
      p.classList.toggle("on", list.indexOf(code) > -1 || list.indexOf("all") > -1);
    });
  }
  $$(".jur-set button").forEach(function (b) {
    b.addEventListener("click", function () { applyJur(b.getAttribute("data-jur")); });
  });

  /* ---------- explorers: a sequence (steps with progress) or a selection (topics) ---------- */
  $$("[data-explorer]").forEach(function (ex) {
    ex.classList.add("enhanced");
    var seq = ex.getAttribute("data-explorer") === "sequence";
    var btns = $$("[data-go]", ex).filter(function (b) { return b.tagName === "BUTTON"; });
    var svgGo = $$("[data-go]", ex).filter(function (b) { return b.tagName !== "BUTTON"; });
    var panels = $$("[data-panel]", ex);
    var n = panels.length, cur = -1;
    var art = $("[data-art]", ex);
    var prog = $(".jy-prog", ex), base = $(".jy-base", ex), strip = $(".strip", ex);
    var prev = $("[data-dir='-1']", ex), next = $("[data-dir='1']", ex), count = $("[data-count]", ex);
    var stops = null;

    /* where each journey node sits along the line, as a share of its length */
    if (prog && base) {
      var total = base.getTotalLength();
      stops = $$(".jy-node", ex).map(function (g) {
        var cx = +g.getAttribute("data-x"), cy = +g.getAttribute("data-y"), best = 0, bd = 1e9;
        for (var i = 0; i <= 400; i++) {
          var p = base.getPointAtLength(total * i / 400), d = (p.x - cx) * (p.x - cx) + (p.y - cy) * (p.y - cy);
          if (d < bd) { bd = d; best = i / 400; }
        }
        return best;
      });
    }

    function select(k, focus) {
      if (k === cur) return;
      cur = k;
      panels.forEach(function (p, i) { p.classList.toggle("on", i === k); });
      btns.forEach(function (b) {
        var i = +b.getAttribute("data-go");
        if (seq) {
          if (i === k) b.setAttribute("aria-current", "step"); else b.removeAttribute("aria-current");
          b.classList.toggle("done", i < k);
        } else {
          b.setAttribute("aria-current", String(i === k));
        }
      });
      svgGo.forEach(function (g) {
        var i = +g.getAttribute("data-go");
        g.classList.toggle("on", i === k); g.classList.toggle("done", i < k);
      });
      if (prog && stops) prog.style.strokeDashoffset = String(1 - stops[k]);
      if (strip) strip.style.setProperty("--p", n > 1 ? (k / (n - 1)).toFixed(3) : "1");
      if (prev) prev.disabled = k <= 0;
      if (next) next.disabled = k >= n - 1;
      if (count) count.textContent = (k + 1) + " of " + n;
      /* light up the parts of the drawing this panel talks about */
      if (art) {
        var parts = (panels[k].getAttribute("data-parts") || "").split(/\s+/).filter(Boolean), any = false;
        $$("[data-part]", art).forEach(function (el) {
          var on = parts.indexOf(el.getAttribute("data-part")) > -1;
          el.classList.toggle("hl", on); if (on) any = true;
        });
        art.classList.toggle("dim", any);
        if (art.classList.contains("homes")) travel(art, parts.indexOf("time") > -1);
      }
      if (focus) {
        var fb = btns.filter(function (b) { return +b.getAttribute("data-go") === k; })[0];
        if (fb) fb.focus();
      }
    }

    btns.forEach(function (b) {
      b.addEventListener("click", function () { select(+b.getAttribute("data-go")); });
      b.addEventListener("keydown", function (e) {
        var k = null;
        if (e.key === "ArrowRight" || e.key === "ArrowDown") k = clamp(cur + 1, 0, n - 1);
        else if (e.key === "ArrowLeft" || e.key === "ArrowUp") k = clamp(cur - 1, 0, n - 1);
        else if (e.key === "Home") k = 0;
        else if (e.key === "End") k = n - 1;
        if (k !== null) { e.preventDefault(); select(k, true); }
      });
    });
    svgGo.forEach(function (g) { g.addEventListener("click", function () { select(+g.getAttribute("data-go")); }); });
    [prev, next].forEach(function (b) {
      if (b) b.addEventListener("click", function () { select(clamp(cur + (+b.getAttribute("data-dir")), 0, n - 1)); });
    });
    if (n) select(0);
  });

  /* the child travels between the two homes while "time" is the subject */
  function travel(art, on) {
    var path = $("[data-route]", art), dot = $(".child", art);
    if (!path || !dot) return;
    cancelAnimationFrame(art._raf);
    var L = path.getTotalLength();
    var place = function (t) { var p = path.getPointAtLength(L * t); dot.setAttribute("cx", p.x.toFixed(1)); dot.setAttribute("cy", p.y.toFixed(1)); };
    if (!on || reduce) { place(0.5); return; }
    var t0 = null;
    var step = function (ts) {
      if (t0 === null) t0 = ts;
      var s = ((ts - t0) / 4200) % 2, t = s < 1 ? s : 2 - s;
      place(0.08 + 0.84 * (0.5 - Math.cos(Math.PI * t) / 2));
      art._raf = requestAnimationFrame(step);
    };
    art._raf = requestAnimationFrame(step);
  }

  /* ---------- compositions draw themselves once, when first seen ---------- */
  function draw(el) {
    if (reduce) return;
    var parts = $$(".ln, .edge, .jy-base, circle.o, .node circle", el);
    parts.forEach(function (p, i) { p.setAttribute("pathLength", "1"); p.style.setProperty("--d", i % 24); });
    el.classList.add("drawing");
    setTimeout(function () {
      el.classList.remove("drawing");
      parts.forEach(function (p) { p.removeAttribute("pathLength"); });
    }, 1900);
  }
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (e) { if (e.isIntersecting) { draw(e.target); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -20% 0px" });
    $$(".draw-on").forEach(function (el) { io.observe(el); });
  }

  /* ---------- simpler topics: cards that open in place ---------- */
  $$(".card").forEach(function (card) {
    var t = $(".card-toggle", card), motif = $(".motif", card), lbl = $(".lbl", t);
    if (!t) return;
    t.addEventListener("click", function () {
      var open = !card.classList.contains("open");
      card.classList.toggle("open", open);
      t.setAttribute("aria-expanded", String(open));
      if (lbl) lbl.textContent = open ? "Close" : "Explore";
      if (open && motif && !reduce) {
        $$("*", motif).forEach(function (p) { if (p.getTotalLength) p.setAttribute("pathLength", "1"); });
        motif.classList.remove("drawn"); void motif.getBoundingClientRect(); motif.classList.add("drawn");
        setTimeout(function () { motif.classList.remove("drawn"); $$("*", motif).forEach(function (p) { p.removeAttribute("pathLength"); }); }, 900);
      }
      if (open) {
        var r = card.getBoundingClientRect();
        if (r.top < 70 || r.top > window.innerHeight * 0.6) card.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
      }
    });
  });
  if (location.hash) {
    var target = document.getElementById(location.hash.slice(1));
    if (target && target.classList.contains("card")) { var tg = $(".card-toggle", target); if (tg) tg.click(); }
  }

  /* ---------- leave quickly: replaces this page in the history ---------- */
  $$(".quick-exit").forEach(function (b) {
    b.addEventListener("click", function () { window.location.replace("https://www.google.com/search?q=weather+brisbane"); });
  });

  applyJur("qld");
})();
