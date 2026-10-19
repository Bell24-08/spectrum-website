// Spectrum Executive Search site behaviour: language switch, starfield, logo draw-on, scroll reveals,
// the client logos, the search steps and the globe. No framework; d3-geo and topojson draw the globe.
(() => {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* ---------- language ---------- */
  const store = {
    get: (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} },
  };
  let lang = store.get("spectrum-lang") || ((navigator.language || "").toLowerCase().startsWith("id") ? "id" : "en");
  const t = (k) => (I18N[lang] && I18N[lang][k]) || I18N.en[k] || k;
  const langHooks = [];
  function applyLang() {
    document.documentElement.lang = lang;
    $$("[data-i18n]").forEach((el) => (el.textContent = t(el.dataset.i18n)));
    $$("[data-i18n-ph]").forEach((el) => (el.placeholder = t(el.dataset.i18nPh)));
    $$("[data-i18n-aria]").forEach((el) => el.setAttribute("aria-label", t(el.dataset.i18nAria)));
    $$(".lang button").forEach((b) => b.setAttribute("aria-pressed", b.dataset.lang === lang));
    langHooks.forEach((f) => f());
  }
  $$(".lang button").forEach((b) =>
    b.addEventListener("click", () => { lang = b.dataset.lang; store.set("spectrum-lang", lang); applyLang(); })
  );

  /* ---------- header and menu ---------- */
  const header = $(".site-header");
  const onScroll = () => header && header.classList.toggle("solid", scrollY > 40 || document.body.dataset.solid === "1");
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  const menuBtn = $(".menu-btn"), links = $(".nav-links");
  if (menuBtn && links) {
    menuBtn.addEventListener("click", () => {
      const open = links.classList.toggle("open");
      menuBtn.setAttribute("aria-expanded", open);
    });
    $$("a", links).forEach((a) => a.addEventListener("click", () => { links.classList.remove("open"); menuBtn.setAttribute("aria-expanded", false); }));
  }

  /* ---------- starfield ---------- */
  const sky = $("#stars");
  if (sky) {
    const ctx = sky.getContext("2d");
    let stars = [], w = 0, h = 0, dpr = 1;
    const seed = (n) => { const x = Math.sin(n * 12.9898) * 43758.5453; return x - Math.floor(x); };
    function size() {
      dpr = Math.min(devicePixelRatio || 1, 2);
      w = innerWidth; h = innerHeight;
      sky.width = w * dpr; sky.height = h * dpr;
      const n = Math.round((w * h) / 4200);
      stars = Array.from({ length: n }, (_, i) => ({
        x: seed(i + 1) * w, y: seed(i + 101) * h * 1.6,
        r: 0.3 + Math.pow(seed(i + 201), 3) * 1.3,
        a: 0.25 + seed(i + 301) * 0.65,
        tw: 0.15 + seed(i + 401) * 0.35, ph: seed(i + 501) * 6.28,
        depth: 0.04 + seed(i + 601) * 0.12,
      }));
    }
    size();
    addEventListener("resize", size);
    const draw = (now) => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      const s = now / 1000;
      for (const st of stars) {
        const y = (((st.y - scrollY * st.depth) % (h * 1.6)) + h * 1.6) % (h * 1.6);
        if (y > h) continue;
        // a slow, shallow shimmer; no pulsing
        const a = st.a * (1 - 0.18 + 0.18 * Math.sin(s * st.tw + st.ph));
        ctx.globalAlpha = a;
        ctx.fillStyle = st.r > 1.1 ? "#f3e6cc" : "#dfe6f2";
        ctx.beginPath(); ctx.arc(st.x, y, st.r, 0, 6.283); ctx.fill();
      }
      if (!reduce) requestAnimationFrame(draw);
    };
    requestAnimationFrame(draw);
  }

  /* ---------- logo draw-on (same outlines and timing as the video end card) ---------- */
  const logo = $(".hero-logo");
  if (logo && window.LOGO_PATHS) {
    const NS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("viewBox", "0 0 1120 380");
    svg.setAttribute("aria-hidden", "true");
    const dur = 3.2;
    LOGO_PATHS.forEach((p) => {
      const el = document.createElementNS(NS, "path");
      el.setAttribute("d", p.d);
      el.setAttribute("pathLength", "1");
      const start = p.mono ? 0 : 0.1 + 0.42 * (p.x / 1120);
      const span = p.mono ? 0.5 : 0.26;
      el.style.setProperty("--delay", (start * dur).toFixed(2) + "s");
      el.style.setProperty("--d", (span * dur).toFixed(2) + "s");
      svg.appendChild(el);
    });
    logo.appendChild(svg);
    const text = $(".hero-text");
    if (reduce) { logo.classList.add("filled"); text && text.classList.add("on"); }
    else {
      requestAnimationFrame(() => logo.classList.add("drawing"));
      setTimeout(() => logo.classList.add("filled"), dur * 760);
      setTimeout(() => text && text.classList.add("on"), dur * 900);
    }
  }

  /* ---------- reveal on scroll ---------- */
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
  }), { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });
  $$(".reveal").forEach((el) => io.observe(el));

  /* ---------- past clients: two slow rows of logos moving in opposite directions ---------- */
  const rows = $("#client-rows");
  if (rows) {
    const CLIENTS = [
      ["merck", "Merck"], ["kobe", "Kobe"], ["forisa", "Forisa"], ["fresenius-kabi", "Fresenius Kabi"], ["gm", "General Motors"],
      ["amway", "Amway"], ["dhl", "DHL"], ["goodyear", "Goodyear"], ["sap", "SAP"], ["kimberly-clark", "Kimberly-Clark"],
      ["multi-bintang", "Multi Bintang Indonesia"], ["kalbe", "Kalbe"], ["cigna", "Cigna"], ["cma-cgm", "CMA CGM"], ["arnotts", "Arnott's"],
      ["abc-kraft-heinz", "ABC Kraft Heinz"], ["emtek", "Emtek"], ["tvs", "TVS"], ["kone", "KONE"], ["banpu", "Banpu"],
    ];
    [CLIENTS.slice(0, 10), CLIENTS.slice(10)].forEach((set, r) => {
      const row = document.createElement("div");
      row.className = "mrow" + (r ? " rev" : "");
      const track = document.createElement("div");
      track.className = "track";
      // the set twice, so the loop is seamless
      [...set, ...set].forEach(([file, name], i) => {
        const tile = document.createElement("div");
        tile.className = "tile";
        if (i >= set.length) tile.setAttribute("aria-hidden", "true");
        const img = document.createElement("img");
        img.src = `assets/img/clients/${file}.jpg`; img.alt = i < set.length ? name : ""; img.loading = "lazy";
        tile.append(img); track.append(tile);
      });
      row.append(track); rows.append(row);
    });
  }

  /* ---------- how a search works: each step plays its picture in turn ---------- */
  const flow = $(".flow");
  if (flow) {
    const steps = $$(".fstep", flow);
    const show = (n) => steps.forEach((s, i) => s.classList.toggle("on", i <= n));
    const fio = new IntersectionObserver((es) => {
      if (!es[0].isIntersecting) return;
      fio.disconnect();
      if (reduce) return show(steps.length - 1);
      steps.forEach((_, i) => setTimeout(() => show(i), i * 2000));
    }, { threshold: 0.3 });
    fio.observe(flow);
  }

  /* ---------- the globe ---------- */
  const gc = $("#globe");
  if (gc && window.d3 && window.topojson && window.WORLD) {
    const ctx = gc.getContext("2d");
    const countries = topojson.feature(WORLD, WORLD.objects.countries);
    const borders = topojson.mesh(WORLD, WORLD.objects.countries, (a, b) => a !== b);
    const graticule = d3.geoGraticule10();
    const DE = countries.features.find((f) => f.id === "276");
    const BR = countries.features.find((f) => f.id === "076");
    const from = [10.4, 51.2], to = [-51.9, -12.5];
    const cities = [[-0.13, 51.5], [-74, 40.7], [55.3, 25.2], [103.8, 1.35], [139.7, 35.7], [151.2, -33.9], [28, -26.2], [-99.1, 19.4], [72.9, 19.1], [-79.4, 43.7], [2.35, 48.86], [114.2, 22.3], [-58.4, -34.6], [37.6, 55.8], [31.2, 30], [-122.4, 37.8], [126.98, 37.57], [100.5, 13.75], [3.4, 6.45], [18.07, 59.33]];
    const interp = d3.geoInterpolate(from, to);
    let W = 0, dpr = 1, visible = false;
    const size = () => { dpr = Math.min(devicePixelRatio || 1, 2); W = gc.clientWidth; gc.width = W * dpr; gc.height = W * dpr; };
    size();
    new ResizeObserver(size).observe(gc);
    new IntersectionObserver((es) => { visible = es[0].isIntersecting; if (visible) requestAnimationFrame(frame); }).observe(gc);
    const proj = d3.geoOrthographic().clipAngle(90);
    const path = d3.geoPath(proj, ctx);
    const t0 = performance.now();
    function frame(now) {
      const s = reduce ? 6 : (now - t0) / 1000;
      const R = W * 0.42, cx = W / 2, cy = W / 2;
      // a slow swing between Europe and South America so the example stays in view; no spinning
      const lon = -20 + 20 * Math.sin((s / 26) * 6.283);
      proj.scale(R).translate([cx, cy]).rotate([-lon, -14]);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, W);
      // atmosphere
      const atmo = ctx.createRadialGradient(cx, cy, R * 0.92, cx, cy, R * 1.14);
      atmo.addColorStop(0, "rgba(120,160,215,0.22)"); atmo.addColorStop(1, "rgba(120,160,215,0)");
      ctx.fillStyle = atmo; ctx.beginPath(); ctx.arc(cx, cy, R * 1.14, 0, 6.283); ctx.fill();
      // sea
      const lx = cx - R * 0.45, ly = cy - R * 0.55;
      const sea = ctx.createRadialGradient(lx, ly, 0, lx, ly, R * 1.9);
      sea.addColorStop(0, "#16396a"); sea.addColorStop(0.55, "#0a2244"); sea.addColorStop(1, "#041124");
      ctx.beginPath(); path({ type: "Sphere" }); ctx.fillStyle = sea; ctx.fill();
      ctx.beginPath(); path(graticule); ctx.strokeStyle = "rgba(255,255,255,0.05)"; ctx.lineWidth = 0.7; ctx.stroke();
      // land
      const land = ctx.createRadialGradient(lx, ly, 0, lx, ly, R * 1.9);
      land.addColorStop(0, "#b3bfcc"); land.addColorStop(0.45, "#5b6b7a"); land.addColorStop(1, "#14263f");
      ctx.beginPath(); path(countries); ctx.fillStyle = land; ctx.fill();
      ctx.beginPath(); path(borders); ctx.strokeStyle = "rgba(1,2,6,0.45)"; ctx.lineWidth = 0.5; ctx.stroke();
      // the example countries in gold
      ctx.shadowColor = "rgba(212,176,122,0.8)"; ctx.shadowBlur = 14;
      [DE, BR].forEach((f) => { ctx.beginPath(); path(f); ctx.fillStyle = "rgba(176,141,87,0.92)"; ctx.fill(); });
      ctx.shadowBlur = 0;
      // city dots
      const centre = [lon, 14];
      ctx.fillStyle = "#d4b07a";
      cities.forEach((c) => {
        if (d3.geoDistance(c, centre) > 1.5) return;
        const p = proj(c); ctx.globalAlpha = 0.85; ctx.beginPath(); ctx.arc(p[0], p[1], 2.2, 0, 6.283); ctx.fill();
      });
      ctx.globalAlpha = 1;
      // the search line from Germany to Brazil, drawn on, held, then faded, on a 9 s loop
      const cyc = s % 9;
      const k = Math.min(1, cyc / 2.6), ease = 1 - Math.pow(1 - k, 3);
      const fade = cyc > 7.4 ? Math.max(0, 1 - (cyc - 7.4) / 1.2) : 1;
      ctx.strokeStyle = `rgba(212,176,122,${0.95 * fade})`; ctx.lineWidth = 2; ctx.lineCap = "round";
      ctx.beginPath();
      const n = 60; let pen = false;
      for (let i = 0; i <= Math.round(n * ease); i++) {
        const g = interp(i / n);
        if (d3.geoDistance(g, centre) > 1.55) { pen = false; continue; }
        const p = proj(g);
        // lift the arc off the surface a little toward its middle
        const lift = 1 + 0.12 * Math.sin((i / n) * Math.PI);
        const x = cx + (p[0] - cx) * lift, y = cy + (p[1] - cy) * lift;
        pen ? ctx.lineTo(x, y) : ctx.moveTo(x, y); pen = true;
      }
      ctx.stroke();
      [from, to].forEach((c, i) => {
        if (i === 1 && k < 1) return;
        if (d3.geoDistance(c, centre) > 1.55) return;
        const p = proj(c);
        ctx.globalAlpha = fade; ctx.fillStyle = "#f3e6cc";
        ctx.beginPath(); ctx.arc(p[0], p[1], 4, 0, 6.283); ctx.fill();
        ctx.globalAlpha = 0.35 * fade; ctx.strokeStyle = "#d4b07a"; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(p[0], p[1], 9, 0, 6.283); ctx.stroke();
      });
      ctx.globalAlpha = 1;
      if (visible && !reduce) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  /* ---------- numbers ---------- */
  $$("[data-count]").forEach((el) => {
    const end = +el.dataset.count, startAt = +(el.dataset.from || 0), suffix = el.dataset.suffix || "";
    el.textContent = (reduce ? end : startAt) + suffix;
    if (reduce) return;
    const cio = new IntersectionObserver((es) => {
      if (!es[0].isIntersecting) return;
      cio.disconnect();
      const t1 = performance.now(), D = 2200;
      const tick = (now) => {
        const k = Math.min(1, (now - t1) / D), e = 1 - Math.pow(1 - k, 3);
        el.textContent = Math.round(startAt + (end - startAt) * e) + suffix;
        if (k < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, { threshold: 0.5 });
    cio.observe(el);
  });

  /* ---------- insights cards and articles ---------- */
  const text = (a) => (lang === "id" ? a.id_ : a.en);
  const cardsBox = $("#insight-cards");
  if (cardsBox) langHooks.push(() => {
    cardsBox.innerHTML = "";
    ARTICLES.slice(0, 3).forEach((a) => {
      const c = document.createElement("a");
      c.className = "card"; c.href = "insights.html#" + a.id;
      const tag = document.createElement("span"); tag.className = "tag"; tag.textContent = t(a.kind === "employers" ? "insp.employers" : "insp.careers");
      const h = document.createElement("h3"); h.textContent = text(a).title;
      const p = document.createElement("p"); p.textContent = text(a).summary;
      const go = document.createElement("span"); go.className = "go"; go.textContent = t("ins.read") + " →";
      c.append(tag, h, p, go); cardsBox.append(c);
    });
  });
  const list = $("#articles");
  if (list) {
    let filter = "all";
    const render = () => {
      list.innerHTML = "";
      ARTICLES.filter((a) => filter === "all" || a.kind === filter).forEach((a) => {
        const x = text(a);
        const art = document.createElement("article"); art.className = "article"; art.id = a.id;
        const meta = document.createElement("div"); meta.className = "meta";
        meta.textContent = t(a.kind === "employers" ? "insp.employers" : "insp.careers");
        const mins = document.createElement("span"); mins.textContent = lang === "id" ? `${a.mins} menit baca` : `${a.mins} min read`;
        meta.append(mins);
        const body = document.createElement("div"); body.className = "body";
        const h = document.createElement("h2"); h.textContent = x.title; body.append(h);
        x.body.forEach((b) => {
          if (Array.isArray(b)) { const ul = document.createElement("ul"); b.forEach((li) => { const l = document.createElement("li"); l.textContent = li; ul.append(l); }); body.append(ul); }
          else { const p = document.createElement("p"); p.textContent = b; body.append(p); }
        });
        const ig = document.createElement("a"); ig.className = "ig"; ig.href = "https://www.instagram.com/spectrumexecutive/"; ig.target = "_blank"; ig.rel = "noopener";
        ig.textContent = t("insp.ig") + " →"; body.append(ig);
        art.append(meta, body); list.append(art);
      });
    };
    $$(".filters button").forEach((b) => b.addEventListener("click", () => {
      filter = b.dataset.filter;
      $$(".filters button").forEach((x) => x.setAttribute("aria-pressed", x === b));
      render();
    }));
    langHooks.push(render);
  }

  $$("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));
  applyLang();
})();
