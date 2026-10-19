(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var root = document.documentElement;
  var mq = function (q) { return window.matchMedia && window.matchMedia(q).matches; };
  var reduce = mq("(prefers-reduced-motion: reduce)");
  var fine = mq("(hover: hover) and (pointer: fine)");
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var vh = window.innerHeight;

  /* ---------------- opening titles ---------------- */
  var veil = $(".intro-veil");
  function endIntro() {
    if (!root.classList.contains("intro")) return;
    try { sessionStorage.setItem("ek-intro", "1"); } catch (e) {}
    veil.classList.add("lift");
    setTimeout(function () { root.classList.remove("intro"); }, 520);
  }
  if (veil && root.classList.contains("intro")) {
    var started = false;
    var start = function () {
      if (started) return; started = true;
      veil.classList.add("go");
      setTimeout(endIntro, 1900);
    };
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(start);
      setTimeout(start, 900);
    } else { start(); }
    veil.addEventListener("click", endIntro);
    document.addEventListener("keydown", endIntro, { once: true });
  }

  /* ---------------- header and navigation ---------------- */
  var header = $(".site-header");
  var btn = $(".menu-btn"), nav = $("#site-nav");
  function setNav(open) {
    if (!nav || !btn) return;
    nav.classList.toggle("open", open);
    btn.setAttribute("aria-expanded", String(open));
    btn.querySelector(".lbl").textContent = open ? "Close" : "Menu";
    root.style.overflow = open ? "hidden" : "";
  }
  if (btn) btn.addEventListener("click", function () { setNav(!nav.classList.contains("open")); });
  if (nav) nav.addEventListener("click", function (e) { if (e.target.closest("a")) setNav(false); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") setNav(false); });

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

  /* ---------------- timeline ---------------- */
  $$(".tl-toggle").forEach(function (t) {
    t.addEventListener("click", function () {
      t.setAttribute("aria-expanded", String(t.getAttribute("aria-expanded") !== "true"));
    });
  });
  var chips = $$(".chip"), items = $$(".tl-item");
  chips.forEach(function (c) {
    c.addEventListener("click", function () {
      var on = c.getAttribute("aria-pressed") !== "true";
      var f = on ? c.getAttribute("data-filter") : null;
      chips.forEach(function (x) { x.setAttribute("aria-pressed", String(on && x === c)); });
      items.forEach(function (it) { it.hidden = !(f === null || it.getAttribute("data-type") === f); });
      paintTimeline();
    });
  });
  function paintTimeline() {
    var mark = vh * 0.62;
    items.forEach(function (it) { if (!it.hidden) it.classList.toggle("lit", it.getBoundingClientRect().top + 24 < mark); });
  }

  /* ---------------- photographs: colour in view on touch screens ---------------- */
  var figs = $$(".portrait, .about-photo, .contact-photo");
  if ("IntersectionObserver" in window && mq("(hover: none)")) {
    var fo = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { en.target.classList.toggle("color", en.intersectionRatio > 0.55); });
    }, { threshold: [0, 0.55, 1] });
    figs.forEach(function (f) { fo.observe(f); });
  }

  /* ---------------- manifesto: split into words ---------------- */
  var mf = $(".mf-text"), mWords = [];
  if (mf && !reduce) {
    var txt = mf.textContent.trim();
    mf.setAttribute("aria-label", txt);
    mf.innerHTML = "";
    txt.split(/\s+/).forEach(function (w, i, arr) {
      var s = document.createElement("span");
      s.className = "mw" + (/families|formed|recognised/.test(w) ? " em" : "");
      s.setAttribute("aria-hidden", "true");
      s.textContent = w;
      mf.appendChild(s);
      if (i < arr.length - 1) mf.appendChild(document.createTextNode(" "));
      mWords.push(s);
    });
    mf.classList.add("armed");
  }

  /* ---------------- journey: graticule and route ---------------- */
  var jr = $(".journey"), arc = $(".j-arc"), plane = $(".j-plane"), km = $(".j-km"), jStats = $$(".j-stats > div");
  var arcLen = 0;
  if (jr) {
    var g = $(".j-grid"), ns = "http://www.w3.org/2000/svg", h = "";
    for (var x = 0; x <= 1000; x += 1000 / 18) h += '<line x1="' + x.toFixed(1) + '" y1="0" x2="' + x.toFixed(1) + '" y2="470"/>';
    for (var y = 0; y <= 470; y += 46) h += '<line x1="0" y1="' + y + '" x2="1000" y2="' + y + '"/>';
    for (var gx = 27.8; gx < 1000; gx += 55.6) for (var gy = 23; gy < 470; gy += 46) h += '<circle cx="' + gx.toFixed(1) + '" cy="' + gy + '" r="1"/>';
    g.innerHTML = h;
    arcLen = arc.getTotalLength();
    if (!reduce) {
      jr.classList.add("live");
      arc.style.strokeDasharray = arcLen;
      arc.style.strokeDashoffset = arcLen;
    }
  }
  /* pin each city label beside its marker, whatever size the map is drawn */
  var jStage = $(".j-stage"), l1 = $(".j-l1"), l2 = $(".j-l2");
  function placeLabels() {
    if (!jStage) return;
    var sb = jStage.getBoundingClientRect(), small = window.innerWidth <= 760;
    var a = $(".j-ist circle:last-child").getBoundingClientRect(), b = $(".j-bne circle:last-child").getBoundingClientRect();
    l1.style.left = (a.left - sb.left - (small ? 4 : 10)).toFixed(0) + "px";
    l1.style.top = (a.bottom - sb.top + (small ? 8 : 16)).toFixed(0) + "px";
    l2.style.left = "auto";
    l2.style.right = (sb.right - b.left + (small ? 12 : 26)).toFixed(0) + "px";
    l2.style.top = (b.top - sb.top - l2.offsetHeight + (small ? 10 : 18)).toFixed(0) + "px";
  }
  placeLabels();
  window.addEventListener("resize", placeLabels);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(placeLabels);
  function paintJourney() {
    if (!jr || reduce) return;
    var r = jr.getBoundingClientRect();
    var p = clamp(-r.top / Math.max(1, r.height - vh), 0, 1);
    var d = clamp((p - 0.06) / 0.62, 0, 1);
    var e = d < 0.5 ? 2 * d * d : 1 - Math.pow(-2 * d + 2, 2) / 2;
    arc.style.strokeDashoffset = (arcLen * (1 - e)).toFixed(1);
    var pt = arc.getPointAtLength(arcLen * e);
    plane.setAttribute("cx", pt.x.toFixed(1)); plane.setAttribute("cy", pt.y.toFixed(1));
    plane.style.opacity = d > 0 && d < 1 ? 1 : 0;
    jr.style.setProperty("--bne", d >= 1 ? 1 : 0.25);
    jr.classList.toggle("arrived", d >= 1);
    if (km) km.textContent = Math.round(14750 * e).toLocaleString("en-AU");
    jStats.forEach(function (s, i) { s.classList.toggle("on", p > 0.12 + i * 0.12); });
  }

  /* ---------------- marquee ---------------- */
  var track = $(".mq-track"), mqX = 0, setW = 0, vel = 0, lastY = window.scrollY;
  if (track) {
    var set = $(".mq-set", track);
    track.appendChild(set.cloneNode(true));
    track.appendChild(set.cloneNode(true));
    var measure = function () { setW = set.getBoundingClientRect().width; };
    measure(); window.addEventListener("resize", measure);
  }

  /* ---------------- practice themes light up as you read ---------------- */
  var themes = $(".themes"), thItems = themes ? $$("li", themes) : [];
  if (themes && !reduce) themes.classList.add("armed");
  function paintThemes() {
    if (!thItems.length || reduce) return;
    var r = themes.getBoundingClientRect();
    var p = clamp((vh * 0.82 - r.top) / Math.max(1, r.height * 0.95), 0, 1);
    var n = Math.ceil(p * thItems.length);
    thItems.forEach(function (li, i) { li.classList.toggle("on", i < n); });
  }

  /* ---------------- the architecture of family ---------------- */
  var aof = $(".aof");
  if (aof) {
    var tabs = $$(".aof-tab", aof), panels = $$(".aof-panel", aof), ink = $(".aof-ink", aof);
    aof.classList.add("tabbed");
    var drawArt = function (panel) {
      if (reduce || !panel) return;
      var art = $(".aof-art", panel); if (!art) return;
      $$(".ln", art).forEach(function (el, i) { el.setAttribute("pathLength", "1"); el.style.setProperty("--d", i); });
      art.classList.remove("drawing"); void art.getBoundingClientRect(); art.classList.add("drawing");
      clearTimeout(art._t);
      art._t = setTimeout(function () {
        art.classList.remove("drawing");
        $$(".ln", art).forEach(function (el) { el.removeAttribute("pathLength"); });
      }, 2700);
    };
    var moveInk = function (i) {
      if (!ink || !tabs[i]) return;
      ink.style.setProperty("--x", tabs[i].offsetLeft + "px");
      ink.style.setProperty("--w", (tabs[i].offsetWidth - 16) + "px");
    };
    var active = 0;
    var select = function (i, focus, draw) {
      active = i;
      tabs.forEach(function (t, k) {
        var on = k === i;
        t.setAttribute("aria-selected", String(on));
        t.tabIndex = on ? 0 : -1;
        panels[k].hidden = !on;
      });
      if (focus) tabs[i].focus();
      moveInk(i);
      if (draw) drawArt(panels[i]);
    };
    tabs.forEach(function (t, i) {
      t.addEventListener("click", function () { if (i !== active) select(i, false, true); });
      t.addEventListener("keydown", function (e) {
        var n = tabs.length, k = null;
        if (e.key === "ArrowRight" || e.key === "ArrowDown") k = (i + 1) % n;
        else if (e.key === "ArrowLeft" || e.key === "ArrowUp") k = (i - 1 + n) % n;
        else if (e.key === "Home") k = 0;
        else if (e.key === "End") k = n - 1;
        if (k !== null) { e.preventDefault(); select(k, true, true); }
      });
    });
    select(0, false, false);
    window.addEventListener("resize", function () { moveInk(active); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { moveInk(active); });
    if ("IntersectionObserver" in window && !reduce) {
      var drawn = false;
      var io = new IntersectionObserver(function (en) {
        if (en[0].isIntersecting && !drawn) { drawn = true; drawArt(panels[active]); io.disconnect(); }
      }, { rootMargin: "0px 0px -25% 0px" });
      io.observe($(".aof-grid", panels[0]));
    }

    /* topics: open several, and the drawing shows where each sits */
    var highlight = function (panel, extra) {
      var art = $(".aof-art", panel); if (!art) return;
      var parts = {}, any = false;
      $$(".topic.open", panel).forEach(function (t) { parts[t.getAttribute("data-part")] = 1; });
      if (extra) parts[extra] = 1;
      $$("[data-part]", art).forEach(function (g) {
        var on = !!parts[g.getAttribute("data-part")];
        g.classList.toggle("hl", on); if (on) any = true;
      });
      art.classList.toggle("dim", any);
    };
    $$(".topic", aof).forEach(function (tp) {
      var b = $(".topic-btn", tp), panel = tp.closest(".aof-panel");
      b.setAttribute("aria-expanded", "false");
      b.addEventListener("click", function () {
        var open = b.getAttribute("aria-expanded") !== "true";
        b.setAttribute("aria-expanded", String(open));
        tp.classList.toggle("open", open);
        highlight(panel);
      });
      var preview = function () { highlight(panel, tp.getAttribute("data-part")); };
      var clear = function () { highlight(panel); };
      tp.addEventListener("mouseenter", preview); tp.addEventListener("mouseleave", clear);
      b.addEventListener("focus", preview); b.addEventListener("blur", clear);
    });

    /* surrogacy: one step at a time, with previous and next */
    var steps = $$(".step", aof), sNav = $(".step-nav", aof), sArt = $("#panel-surrogacy .aof-art"), sCur = -1;
    var prevB = sNav ? $("[data-dir='-1']", sNav) : null, nextB = sNav ? $("[data-dir='1']", sNav) : null, cnt = sNav ? $(".sn-count", sNav) : null;
    var openStep = function (i, focusBtn) {
      sCur = i;
      steps.forEach(function (s, k) {
        var on = k === i;
        s.classList.toggle("open", on);
        $(".step-btn", s).setAttribute("aria-expanded", String(on));
      });
      if (sArt) $$("[data-step]", sArt).forEach(function (g) {
        var n = +g.getAttribute("data-step") - 1;
        g.classList.toggle("hl", n === i);
        g.classList.toggle("done", i >= 0 && n < i);
      });
      if (sNav) {
        sNav.hidden = false;
        prevB.disabled = i <= 0;
        nextB.disabled = i >= steps.length - 1;
        cnt.textContent = i >= 0 ? "Step " + (i + 1) + " of " + steps.length : steps.length + " steps";
      }
      if (focusBtn && i >= 0) $(".step-btn", steps[i]).focus();
    };
    steps.forEach(function (s, k) {
      $(".step-btn", s).addEventListener("click", function () { openStep(sCur === k ? -1 : k); });
    });
    if (sNav) $$(".sn-btn", sNav).forEach(function (b) {
      b.addEventListener("click", function () { openStep(clamp(sCur + (+b.getAttribute("data-dir")), 0, steps.length - 1), true); });
    });
    if (steps.length) openStep(0);
  }

  /* ---------------- full professional record ---------------- */
  var rt = $(".record-toggle");
  if (rt) {
    rt.setAttribute("aria-expanded", "false");
    rt.addEventListener("click", function () {
      var o = rt.getAttribute("aria-expanded") !== "true";
      rt.setAttribute("aria-expanded", String(o));
      $(".rt-l", rt).textContent = o ? "Hide the full professional record" : "View the full professional record";
    });
    if (location.hash === "#career" || location.hash === "#record") rt.click();
  }

  /* ---------------- scroll-driven scene ---------------- */
  var darks = $$(".journey, .spread-olive, .spread-dark, .safety, .site-footer");
  var heroText = $(".hero-text"), portrait = $(".portrait"), heroImg = $(".portrait img");
  function onFrame() {
    var y = window.scrollY;
    vel += ((y - lastY) - vel) * 0.2; lastY = y;
    var max = Math.max(1, document.documentElement.scrollHeight - vh);
    if (header) {
      header.classList.toggle("scrolled", y > 8);
      header.style.setProperty("--sp", (y / max).toFixed(4));
      var hb = header.offsetHeight / 2, dark = false;
      darks.forEach(function (s) { var r = s.getBoundingClientRect(); if (r.top <= hb && r.bottom >= hb) dark = true; });
      header.classList.toggle("on-dark", dark);
    }
    paintTimeline();
    if (!reduce) {
      if (y < vh * 1.2) {
        if (heroText) heroText.style.transform = "translate3d(0," + (y * -0.12).toFixed(1) + "px,0)";
        if (heroImg) heroImg.style.setProperty("--py", (y * 0.09).toFixed(1) + "px");
      }
      if (mWords.length) {
        var r = mf.getBoundingClientRect();
        var p = clamp((vh * 0.88 - r.top) / (r.height + vh * 0.4), 0, 1);
        var n = Math.round(p * mWords.length * 1.15);
        mWords.forEach(function (w, i) { w.classList.toggle("on", i < n); });
      }
      paintJourney();
      paintThemes();
      if (track && setW) {
        mqX -= 0.6 + Math.min(18, Math.abs(vel) * 0.35);
        if (mqX <= -setW) mqX += setW;
        track.style.transform = "translate3d(" + mqX.toFixed(2) + "px,0,0)";
      }
    }
    requestAnimationFrame(onFrame);
  }
  window.addEventListener("resize", function () { vh = window.innerHeight; paintJourney(); });
  if (reduce && track) track.style.transform = "none";
  requestAnimationFrame(onFrame);

  /* ---------------- entrance animations (below the fold only) ---------------- */
  if (!reduce) {
    $$(".sec-head h2").forEach(function (hd) {
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
      })(hd);
      hd.classList.add("split");
      hd.setAttribute("aria-label", hd.textContent.replace(/\s+/g, " ").trim());
    });
    var anim = $$(".sec-head h2.split, .stagger, .about-photo .frame, .contact-photo .frame, .sec-head");
    if ("IntersectionObserver" in window) {
      var ao = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) {
            en.target.classList.add(en.target.classList.contains("sec-head") ? "drawn" : "shown");
            ao.unobserve(en.target);
          }
        });
      }, { rootMargin: "0px 0px -12% 0px" });
      anim.forEach(function (el) {
        if (el.getBoundingClientRect().top > vh) {
          el.classList.add(el.classList.contains("frame") ? "wipe" : el.classList.contains("sec-head") ? "lab-armed" : "armed");
          void el.offsetWidth;
          ao.observe(el);
        }
      });
    }
  }

  /* ---------------- pointer effects (mouse and trackpad only) ---------------- */
  if (fine && !reduce) {
    /* custom cursor */
    var cur = document.createElement("div");
    cur.className = "cursor hide"; cur.setAttribute("aria-hidden", "true");
    cur.innerHTML = '<span class="c-ring"><em>Colour</em></span><span class="c-dot"></span>';
    document.body.appendChild(cur);
    var ring = $(".c-ring", cur), dot = $(".c-dot", cur);
    var mx = -100, my = -100, rx = -100, ry = -100;
    document.addEventListener("mousemove", function (e) {
      mx = e.clientX; my = e.clientY;
      dot.style.transform = "translate3d(" + mx + "px," + my + "px,0)";
      cur.classList.remove("hide");
      var t = e.target;
      var isPhoto = !!(t.closest && t.closest(".portrait .frame, .about-photo .frame, .contact-photo .frame"));
      var isLink = !isPhoto && !!(t.closest && t.closest("a, button, .chip, [role=button]"));
      cur.classList.toggle("photo", isPhoto);
      cur.classList.toggle("link", isLink);
    });
    document.addEventListener("mouseleave", function () { cur.classList.add("hide"); });
    document.addEventListener("mousedown", function () { cur.classList.add("down"); });
    document.addEventListener("mouseup", function () { cur.classList.remove("down"); });
    (function follow() {
      rx += (mx - rx) * 0.16; ry += (my - ry) * 0.16;
      ring.style.transform = "translate3d(" + rx.toFixed(1) + "px," + ry.toFixed(1) + "px,0)";
      requestAnimationFrame(follow);
    })();

    /* magnetic controls */
    $$(".btn, .chip, .site-header .wordmark, .menu-btn, .contact-links .ar, .hero-cta .ulink").forEach(function (el) {
      el.setAttribute("data-mag", "");
      var k = el.classList.contains("ar") ? 0.35 : 0.16;
      el.addEventListener("mousemove", function (e) {
        var b = el.getBoundingClientRect();
        el.classList.add("pull");
        el.style.translate = ((e.clientX - b.left - b.width / 2) * k).toFixed(1) + "px " + ((e.clientY - b.top - b.height / 2) * k * 1.2).toFixed(1) + "px";
      });
      el.addEventListener("mouseleave", function () { el.classList.remove("pull"); el.style.translate = ""; });
    });

    /* hero portrait follows the pointer with depth */
    var hero = $(".hero");
    if (hero && portrait) {
      hero.addEventListener("mousemove", function (e) {
        var b = hero.getBoundingClientRect();
        portrait.style.setProperty("--mx", (((e.clientX - b.left) / b.width - 0.5) * 14).toFixed(1) + "px");
        portrait.style.setProperty("--my", (((e.clientY - b.top) / b.height - 0.5) * 10).toFixed(1) + "px");
      });
      hero.addEventListener("mouseleave", function () { portrait.style.setProperty("--mx", "0px"); portrait.style.setProperty("--my", "0px"); });
    }

    /* focus cards tilt towards the pointer */
    $$(".focus").forEach(function (card) {
      card.addEventListener("mousemove", function (e) {
        var b = card.getBoundingClientRect(), px = (e.clientX - b.left) / b.width, py = (e.clientY - b.top) / b.height;
        card.style.setProperty("--ry", ((px - 0.5) * 5).toFixed(2) + "deg");
        card.style.setProperty("--rx", ((0.5 - py) * 4).toFixed(2) + "deg");
        card.style.setProperty("--gx", (px * 100).toFixed(1) + "%");
        card.style.setProperty("--gy", (py * 100).toFixed(1) + "%");
        card.style.setProperty("--ga", "0.13");
      });
      card.addEventListener("mouseleave", function () {
        ["--rx", "--ry"].forEach(function (p) { card.style.setProperty(p, "0deg"); });
        card.style.setProperty("--ga", "0");
      });
    });

    /* weighted scrolling for wheels and trackpads */
    root.classList.add("ss");
    var target = window.scrollY, pos = window.scrollY, running = false;
    var maxScroll = function () { return document.documentElement.scrollHeight - window.innerHeight; };
    var glide = function () {
      running = true;
      pos += (target - pos) * 0.12;
      if (Math.abs(target - pos) < 0.5) { pos = target; running = false; }
      window.scrollTo(0, pos);
      if (running) requestAnimationFrame(glide);
    };
    window.addEventListener("wheel", function (e) {
      if (e.ctrlKey || root.classList.contains("intro") || (nav && nav.classList.contains("open"))) return;
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      e.preventDefault();
      var d = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? window.innerHeight : 1);
      target = clamp(target + d, 0, maxScroll());
      if (!running) { pos = window.scrollY; glide(); }
    }, { passive: false });
    window.addEventListener("scroll", function () { if (!running) { target = pos = window.scrollY; } }, { passive: true });
    document.addEventListener("click", function (e) {
      var a = e.target.closest && e.target.closest("a[href^='#']");
      if (!a || a.classList.contains("skip")) return;
      var id = a.getAttribute("href").slice(1), el = id ? document.getElementById(id) : null;
      if (!el && id !== "top" && id !== "") return;
      e.preventDefault();
      var top = id === "top" || !el ? 0 : el.getBoundingClientRect().top + window.scrollY - 88;
      target = clamp(top, 0, maxScroll());
      if (!running) { pos = window.scrollY; glide(); }
      if (el && id !== "main") history.replaceState(null, "", "#" + id);
    });
  }

  var yr = $("#year"); if (yr) yr.textContent = new Date().getFullYear();
})();
