(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Header rule after scrolling */
  var header = $(".site-header");

  /* Mobile navigation */
  var btn = $(".menu-btn"), nav = $("#site-nav");
  function setNav(open) {
    if (!nav || !btn) return;
    nav.classList.toggle("open", open);
    btn.setAttribute("aria-expanded", String(open));
    btn.querySelector(".lbl").textContent = open ? "Close" : "Menu";
    document.documentElement.style.overflow = open ? "hidden" : "";
  }
  if (btn) btn.addEventListener("click", function () { setNav(!nav.classList.contains("open")); });
  if (nav) nav.addEventListener("click", function (e) { if (e.target.closest("a")) setNav(false); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") setNav(false); });

  /* Active section in navigation */
  var links = $$(".nav a[href^='#']");
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
    }, { rootMargin: "-42% 0px -55% 0px" });
    Object.keys(map).forEach(function (id) { var el = document.getElementById(id); if (el) so.observe(el); });
  }

  /* Timeline: expand and collapse */
  $$(".tl-toggle").forEach(function (t) {
    t.addEventListener("click", function () {
      var open = t.getAttribute("aria-expanded") === "true";
      t.setAttribute("aria-expanded", String(!open));
    });
  });

  /* Timeline: filters */
  var chips = $$(".chip"), items = $$(".tl-item");
  chips.forEach(function (c) {
    c.addEventListener("click", function () {
      /* clicking an active filter again clears it and shows everything */
      var on = c.getAttribute("aria-pressed") !== "true";
      var f = on ? c.getAttribute("data-filter") : null;
      chips.forEach(function (x) { x.setAttribute("aria-pressed", String(on && x === c)); });
      items.forEach(function (it) {
        it.hidden = !(f === null || it.getAttribute("data-type") === f);
      });
      paintTimeline();
    });
  });

  /* Timeline: brass line follows the reader */
  var tl = $(".timeline"), prog = $(".timeline .progress");
  function paintTimeline() {
    if (!tl || !prog) return;
    var r = tl.getBoundingClientRect(), mark = window.innerHeight * 0.62;
    var p = Math.min(1, Math.max(0, (mark - r.top) / Math.max(1, r.height)));
    prog.style.setProperty("--p", (p * 100).toFixed(2) + "%");
    items.forEach(function (it) {
      if (it.hidden) return;
      it.classList.toggle("lit", it.getBoundingClientRect().top + 24 < mark);
    });
  }

  var ticking = false;
  function onScroll() {
    if (header) header.classList.toggle("scrolled", window.scrollY > 8);
    if (!ticking) { ticking = true; requestAnimationFrame(function () { paintTimeline(); ticking = false; }); }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", paintTimeline);
  onScroll(); paintTimeline();


  /* Photographs: colour on hover (CSS); on touch screens, colour while the photo sits in view */
  var figs = $$(".portrait, .about-photo, .contact-photo");
  if ("IntersectionObserver" in window && window.matchMedia("(hover: none)").matches) {
    var fo = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { en.target.classList.toggle("color", en.intersectionRatio > 0.55); });
    }, { threshold: [0, 0.55, 1] });
    figs.forEach(function (f) { fo.observe(f); });
  }

  /* Entrance animations: only for elements that start below the fold, so the first view is always complete */
  if (!reduce) {
    $$(".sec-head h2").forEach(function (h) {
      var i = 0;
      (function walk(node) {
        Array.prototype.slice.call(node.childNodes).forEach(function (n) {
          if (n.nodeType === 3) {
            var frag = document.createDocumentFragment();
            n.textContent.split(/(\s+)/).forEach(function (part) {
              if (!part) return;
              if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
              var w = document.createElement("span"); w.className = "w";
              var inner = document.createElement("span"); inner.textContent = part; inner.style.setProperty("--i", i++);
              w.appendChild(inner); frag.appendChild(w);
            });
            n.parentNode.replaceChild(frag, n);
          } else if (n.nodeType === 1) { walk(n); }
        });
      })(h);
      h.classList.add("split");
      h.setAttribute("aria-label", h.textContent.replace(/\s+/g, " ").trim());
    });
    var anim = $$(".sec-head h2.split, .stagger, .about-photo .frame, .contact-photo .frame");
    if ("IntersectionObserver" in window) {
      var ao = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add("shown"); ao.unobserve(en.target); }
        });
      }, { rootMargin: "0px 0px -12% 0px" });
      anim.forEach(function (el) {
        if (el.getBoundingClientRect().top > window.innerHeight) {
          el.classList.add(el.classList.contains("frame") ? "wipe" : "armed");
          void el.offsetWidth;
          ao.observe(el);
        }
      });
    }
  }

  var yr = $("#year"); if (yr) yr.textContent = new Date().getFullYear();
})();
