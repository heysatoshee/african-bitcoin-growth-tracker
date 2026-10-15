/* Ecosystem Growth Tracker: page logic */
(() => {
  const D = window.ABE;
  const Q = D.quarters;
  const HI0 = D.history.findIndex(h => h.q === Q[0]); // history index of Q1 2026
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const state = {
    qi: 3,               // selected quarter (Q4 2026)
    kpi: "total",        // selected KPI tile
    mapMode: "count",
    country: "NG",
    cat: "education",
    logTab: "joined",
    search: ""
  };

  /* ---------- helpers ---------- */
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const signed = (n, d = 0) => (n > 0 ? "+" : n < 0 ? "−" : "") + Math.abs(n).toFixed(d);
  const short = q => q.replace(" 20", " ’");
  const qShort = i => Q[i].split(" ")[0];
  const hist = i => D.history[HI0 + i];
  const byCode = Object.fromEntries(D.countries.map(c => [c.code, c]));
  const byName = Object.fromEntries(D.countries.map(c => [c.name, c]));
  const catSum = i => D.categories.reduce((s, c) => s + c.v[i], 0);

  function deltaChip(d, suffix = "") {
    if (d == null) return `<span class="chip chip-flat">—</span>`;
    const cls = d > 0 ? "chip-up" : d < 0 ? "chip-down" : "chip-flat";
    const arrow = d > 0 ? "↑" : d < 0 ? "↓" : "→";
    return `<span class="chip ${cls}">${arrow} ${d === 0 ? "0" : signed(d)}${suffix}</span>`;
  }

  function animateNumber(el, to, { from = null, decimals = 0, prefix = "", suffix = "", dur = 700 } = {}) {
    const start = from ?? parseFloat(el.dataset.v ?? "0");
    el.dataset.v = to;
    if (reduceMotion || start === to) { el.textContent = prefix + fmt(to) + suffix; return; }
    const t0 = performance.now();
    function fmt(v) { const s = Math.abs(v).toFixed(decimals); return (v < 0 ? "−" : "") + s; }
    (function tick(t) {
      const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 4);
      el.textContent = prefix + fmt(start + (to - start) * e) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    })(t0);
  }

  /* ---------- tooltip ---------- */
  const tip = $("#tip");
  tip.style.position = "fixed";
  function showTip(html, x, y) {
    tip.innerHTML = html; tip.classList.add("on");
    const r = tip.getBoundingClientRect();
    let left = x + 16, top = y + 16;
    if (left + r.width > innerWidth - 12) left = x - r.width - 16;
    if (top + r.height > innerHeight - 12) top = y - r.height - 16;
    tip.style.left = Math.max(8, left) + "px"; tip.style.top = Math.max(8, top) + "px";
  }
  const hideTip = () => tip.classList.remove("on");

  function toast(msg) {
    const t = $("#toast"); t.querySelector("span").textContent = msg; t.classList.add("on");
    clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove("on"), 1800);
  }

  /* ---------- segmented control ---------- */
  function segThumb(seg) {
    let thumb = seg.querySelector(".thumb");
    if (!thumb) { thumb = document.createElement("span"); thumb.className = "thumb"; seg.prepend(thumb); }
    const on = seg.querySelector('button[aria-pressed="true"], button[aria-selected="true"]');
    if (!on) return;
    thumb.style.width = on.offsetWidth + "px";
    thumb.style.transform = `translateX(${on.offsetLeft}px)`;
  }

  function buildQuarterSeg() {
    const seg = $("#qSeg");
    seg.innerHTML = Q.map((q, i) => `<button aria-pressed="${i === state.qi}" data-i="${i}" aria-label="${q}" title="${q}">${qShort(i)}</button>`).join("");
    seg.addEventListener("click", e => {
      const b = e.target.closest("button"); if (!b) return;
      setQuarter(+b.dataset.i);
    });
    segThumb(seg);
  }

  function setQuarter(i) {
    if (i === state.qi) return;
    state.qi = i;
    $$("#qSeg button").forEach(b => b.setAttribute("aria-pressed", +b.dataset.i === i));
    segThumb($("#qSeg"));
    if (i === 0 && state.mapMode === "change") setMapMode("count", true);
    renderAll();
  }

  /* ---------- overview ---------- */
  const KPIS = [
    { key: "total", label: "Total listings", metric: "total" },
    { key: "added", label: "New projects", metric: "flow" },
    { key: "removed", label: "Removed", metric: "flow" },
    { key: "rate", label: "Growth rate", metric: "rate" },
    { key: "countries", label: "Countries", metric: "countries" }
  ];

  function renderOverview() {
    const h = hist(state.qi), prev = D.history[HI0 + state.qi - 1];
    const verb = h.rate >= 0 ? "grew" : "shrank";
    $("#ovTitle").innerHTML = `The ecosystem <em>${verb} ${Math.abs(h.rate)}%</em> in ${h.q}`;

    const box = $("#kpis");
    if (!box.children.length) {
      box.innerHTML = KPIS.map(k => `
        <button class="kpi" role="tab" data-k="${k.key}" aria-selected="${k.key === state.kpi}">
          <div class="k-label">${k.label}</div>
          <div class="k-val" data-v="0">–</div>
          <div class="k-sub"></div>
        </button>`).join("");
      box.addEventListener("click", e => {
        const b = e.target.closest(".kpi"); if (!b) return;
        state.kpi = b.dataset.k;
        $$(".kpi").forEach(x => x.setAttribute("aria-selected", x === b));
        renderHistory(true);
      });
    }

    const vals = {
      total: { v: h.total, sub: `${deltaChip(h.net)} <span style="font-size:13px;color:var(--muted)">vs ${prev.q}</span>` },
      added: { v: h.added, sub: h.added == null ? `<span class="chip chip-flat">Not recorded</span>` : `<span style="font-size:13px;color:var(--muted)">${prev.added != null ? `vs ${prev.added} in ${prev.q.split(" ")[0]}` : "joined this quarter"}</span>` },
      removed: { v: h.removed, sub: h.removed == null ? `<span class="chip chip-flat">Not recorded</span>` : `<span style="font-size:13px;color:var(--muted)">${prev.removed != null ? `vs ${prev.removed} in ${prev.q.split(" ")[0]}` : "left this quarter"}</span>` },
      rate: { v: h.rate, dec: 1, suf: "%", sub: `<span class="chip ${h.rate >= 0 ? "chip-up" : "chip-down"}">${h.rate >= 0 ? "Growing" : "Shrinking"}</span>` },
      countries: { v: h.countries, sub: `${deltaChip(h.countries - prev.countries)} <span style="font-size:13px;color:var(--muted)">${h.q === "Q2 2026" ? "Mauritius" : `vs ${prev.q}`}</span>` }
    };
    $$(".kpi").forEach(b => {
      const k = vals[b.dataset.k], el = b.querySelector(".k-val");
      if (k.v == null) { el.textContent = "—"; el.classList.add("na"); el.dataset.v = 0; }
      else {
        el.classList.remove("na");
        animateNumber(el, k.v, { decimals: k.dec || 0, prefix: b.dataset.k === "rate" && k.v > 0 ? "+" : "", suffix: k.suf || "" });
      }
      b.querySelector(".k-sub").innerHTML = k.sub;
    });
  }

  /* ---------- history chart ---------- */
  function barPath(x, w, y0, y1, r = 4) {
    const h = Math.abs(y1 - y0); if (h < 0.5) return "";
    r = Math.min(r, h, w / 2);
    return y1 < y0
      ? `M${x},${y0}V${y1 + r}Q${x},${y1} ${x + r},${y1}H${x + w - r}Q${x + w},${y1} ${x + w},${y1 + r}V${y0}Z`
      : `M${x},${y0}V${y1 - r}Q${x},${y1} ${x + r},${y1}H${x + w - r}Q${x + w},${y1} ${x + w},${y1 - r}V${y0}Z`;
  }

  function renderHistory(animate = false) {
    const box = $("#history");
    const metric = KPIS.find(k => k.key === state.kpi).metric;
    const H = D.history, W = box.clientWidth || 800, mobile = W < 560;
    const HT = mobile ? 250 : 320;
    const m = { t: 28, r: 8, b: 34, l: 36 };
    const x = d3.scaleBand().domain(H.map(d => d.q)).range([m.l, W - m.r]).paddingInner(.3).paddingOuter(.15);
    const cx = q => x(q) + x.bandwidth() / 2;
    const selQ = Q[state.qi];

    const cfg = {
      total: { title: "Total listings", sub: "Projects listed in each quarter's infographic, from the first one to today.", get: d => d.total, dom: [0, 200] },
      countries: { title: "Countries with listings", sub: "How many African countries have at least one listed project.", get: d => d.countries, dom: [0, 30] },
      flow: { title: "Projects joining and leaving", sub: "New listings above the line, removed listings below. Removals were only tracked from Q2 2026.", dom: [-14, 22] },
      rate: { title: "Quarterly growth rate", sub: "(New − removed) ÷ listings at the start of the quarter. Annual figures from older posts are left out.", get: d => d.rate, dom: [-8, 18] }
    }[metric];
    $("#chartTitle").textContent = cfg.title;
    $("#chartSub").textContent = cfg.sub;

    const legend = {
      total: `<span><i class="line" style="background:var(--orange)"></i>Listings</span><span><i class="dotted"></i>Not recorded</span>`,
      countries: `<span><i class="line" style="background:var(--orange)"></i>Countries</span><span><i class="dotted"></i>Not recorded</span>`,
      flow: `<span><i style="background:var(--orange)"></i>New</span><span><i style="background:var(--slate)"></i>Removed</span>`,
      rate: `<span><i style="background:var(--orange)"></i>Growth</span><span><i style="background:var(--slate)"></i>Decline</span><span><i style="background:var(--s2)"></i>Stated / mixed basis</span>`
    }[metric];
    $("#chartLegend").innerHTML = legend;

    const y = d3.scaleLinear().domain(cfg.dom).range([HT - m.b, m.t]).nice();
    const ticks = y.ticks(metric === "flow" || metric === "rate" ? 5 : 4);
    const missing = d => metric === "flow" ? d.added == null && d.removed == null : cfg.get(d) == null;

    let s = `<svg viewBox="0 0 ${W} ${HT}" height="${HT}" role="img" aria-label="${cfg.title} by quarter">
      <defs>
        <pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="6" stroke="#E4D6BE" stroke-width="2"/></pattern>
        <linearGradient id="areaG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F7931A" stop-opacity=".22"/><stop offset="1" stop-color="#F7931A" stop-opacity="0"/></linearGradient>
      </defs>`;

    // selected quarter band + missing-data hatching
    s += `<rect class="sel-band" x="${x(selQ) - 4}" y="${m.t - 16}" width="${x.bandwidth() + 8}" height="${HT - m.b - m.t + 16}" rx="10"/>`;
    H.forEach(d => { if (missing(d)) s += `<rect x="${x(d.q)}" y="${m.t}" width="${x.bandwidth()}" height="${HT - m.b - m.t}" fill="url(#hatch)" rx="6" opacity=".7"/>`; });

    // grid
    s += `<g class="grid">${ticks.map(t => `<line x1="${m.l}" x2="${W - m.r}" y1="${y(t)}" y2="${y(t)}" ${t === 0 && (metric === "flow" || metric === "rate") ? 'style="stroke:var(--ink-2);stroke-opacity:.5"' : ""}/>`).join("")}</g>`;
    s += `<g class="axis">${ticks.map(t => `<text x="${m.l - 10}" y="${y(t) + 4}" text-anchor="end">${t}${metric === "rate" ? "%" : ""}</text>`).join("")}</g>`;
    s += `<g class="x">${H.map(d => `<text x="${cx(d.q)}" y="${HT - 10}" text-anchor="middle" class="${d.q === selQ ? "sel" : ""}">${mobile ? d.q.split(" ")[0] : short(d.q)}</text>`).join("")}</g>`;
    if (mobile) s += `<g class="x"><text x="${cx("Q3 2024")}" y="${HT + 6}" text-anchor="start" style="font-size:11px">’24</text><text x="${cx("Q1 2025")}" y="${HT + 6}" text-anchor="start" style="font-size:11px">’25</text><text x="${cx("Q1 2026")}" y="${HT + 6}" text-anchor="start" style="font-size:11px">’26</text></g>`;

    if (metric === "total" || metric === "countries") {
      const pts = H.map(d => ({ d, v: cfg.get(d) }));
      const line = d3.line().defined(p => p.v != null).x(p => cx(p.d.q)).y(p => y(p.v)).curve(d3.curveMonotoneX);
      const area = d3.area().defined(p => p.v != null).x(p => cx(p.d.q)).y0(y(0)).y1(p => y(p.v)).curve(d3.curveMonotoneX);
      // bridge across gaps
      const def = pts.filter(p => p.v != null);
      for (let i = 1; i < def.length; i++) {
        const a = def[i - 1], b = def[i];
        if (H.indexOf(b.d) - H.indexOf(a.d) > 1)
          s += `<path d="M${cx(a.d.q)},${y(a.v)}L${cx(b.d.q)},${y(b.v)}" stroke="var(--line-2)" stroke-width="2.5" stroke-dasharray="1 6" stroke-linecap="round" fill="none"/>`;
      }
      s += `<path d="${area(pts)}" fill="url(#areaG)" class="area"/>`;
      s += `<path d="${line(pts)}" stroke="var(--orange)" stroke-width="2.5" fill="none" stroke-linecap="round" class="ln"/>`;
      def.forEach(p => {
        const sel = p.d.q === selQ;
        s += `<circle cx="${cx(p.d.q)}" cy="${y(p.v)}" r="${sel ? 6.5 : 4.5}" fill="${sel ? "var(--orange)" : "var(--paper)"}" stroke="${sel ? "var(--paper)" : "var(--orange)"}" stroke-width="${sel ? 2.5 : 2}"/>`;
      });
      // selective direct labels: first, last, selected
      const lab = new Set([def[0], def[def.length - 1], def.find(p => p.d.q === selQ)].filter(Boolean));
      lab.forEach(p => s += `<text x="${cx(p.d.q)}" y="${y(p.v) - 14}" text-anchor="middle" style="font:700 13px var(--font);fill:var(--ink)">${p.v}</text>`);
    }

    if (metric === "flow") {
      const bw = Math.min(28, x.bandwidth() * .62);
      H.forEach(d => {
        const x0 = cx(d.q) - bw / 2;
        if (d.added != null) {
          s += `<path class="bar up" d="${barPath(x0, bw, y(0), y(d.added))}" fill="var(--orange)"/>`;
          s += `<text x="${cx(d.q)}" y="${y(d.added) - 8}" text-anchor="middle" style="font:600 12px var(--font);fill:var(--ink)">+${d.added}</text>`;
        }
        if (d.removed != null) {
          if (d.removed > 0) s += `<path class="bar down" d="${barPath(x0, bw, y(0), y(-d.removed))}" fill="var(--slate)"/>`;
          s += `<text x="${cx(d.q)}" y="${y(-d.removed) + 18}" text-anchor="middle" style="font:600 12px var(--font);fill:var(--ink-2)">${d.removed ? "−" + d.removed : "0"}</text>`;
        }
      });
    }

    if (metric === "rate") {
      const bw = Math.min(30, x.bandwidth() * .62);
      H.forEach(d => {
        if (d.rate == null) return;
        const x0 = cx(d.q) - bw / 2, soft = !!d.rateNote;
        const fill = d.rate < 0 ? "var(--slate)" : soft ? "var(--s2)" : "var(--orange)";
        s += `<path class="bar ${d.rate < 0 ? "down" : "up"}" d="${barPath(x0, bw, y(0), y(d.rate))}" fill="${fill}"/>`;
        const ly = d.rate < 0 ? y(d.rate) + 18 : y(d.rate) - 8;
        s += `<text x="${cx(d.q)}" y="${ly}" text-anchor="middle" style="font:600 12px var(--font);fill:var(--ink)">${signed(d.rate, 1)}%</text>`;
      });
    }

    // hover targets
    H.forEach((d, i) => s += `<rect class="hover-band" data-i="${i}" x="${x(d.q) - x.step() * x.paddingInner() / 2}" y="${m.t - 16}" width="${x.step()}" height="${HT - m.b - m.t + 16}" tabindex="0" aria-label="${d.q}"/>`);
    s += `</svg>`;
    box.innerHTML = s;

    if (animate || !renderHistory._drawn) {
      renderHistory._drawn = true;
      if (!reduceMotion) {
        const ln = box.querySelector(".ln");
        if (ln) {
          const L = ln.getTotalLength();
          ln.style.strokeDasharray = L; ln.style.strokeDashoffset = L;
          ln.getBoundingClientRect();
          ln.style.transition = "stroke-dashoffset 1.1s cubic-bezier(.22,1,.36,1)"; ln.style.strokeDashoffset = 0;
          const ar = box.querySelector(".area"); ar.style.opacity = 0; ar.style.transition = "opacity .8s .3s"; requestAnimationFrame(() => ar.style.opacity = 1);
        }
        box.querySelectorAll(".bar").forEach((b, i) => b.animate(
          [{ transform: "scaleY(0)" }, { transform: "scaleY(1)" }],
          { duration: 650, delay: i * 40, easing: "cubic-bezier(.22,1,.36,1)", fill: "backwards" }
        ));
        box.querySelectorAll(".bar").forEach(b => { b.style.transformBox = "fill-box"; b.style.transformOrigin = b.classList.contains("up") ? "50% 100%" : "50% 0%"; });
      }
    }

    const tipHtml = d => {
      const b = d.basis.toLowerCase();
      const rows = metric === "flow"
        ? `<div class="t-row"><span>New</span><b>${d.added ?? "—"}</b></div><div class="t-row"><span>Removed</span><b>${d.removed ?? "—"}</b></div>`
        : `<div class="t-v">${cfg.get(d) == null ? "Not recorded" : cfg.get(d) + (metric === "rate" ? "%" : "")}</div>`;
      return `<div class="t-q"><span>${d.q}</span><span class="badge badge-${b}">${d.basis}</span></div>${rows}${d.rateNote && metric === "rate" ? `<div class="t-row"><span>Basis</span><span>${d.rateNote}</span></div>` : ""}<div class="t-note">${esc(d.note)}</div>`;
    };
    box.querySelectorAll(".hover-band").forEach(r => {
      const d = H[+r.dataset.i];
      r.addEventListener("pointermove", e => { r.style.opacity = .035; showTip(tipHtml(d), e.clientX, e.clientY); });
      r.addEventListener("pointerleave", () => { r.style.opacity = 0; hideTip(); });
      r.addEventListener("focus", () => { const bb = r.getBoundingClientRect(); r.style.opacity = .035; showTip(tipHtml(d), bb.right, bb.top + 40); });
      r.addEventListener("blur", () => { r.style.opacity = 0; hideTip(); });
      r.addEventListener("click", () => { const qi = Q.indexOf(d.q); if (qi >= 0) setQuarter(qi); });
    });
  }

  function renderHistoryTable() {
    const rows = D.history.map(d => `<tr><td>${d.q}</td><td class="r">${d.total ?? "—"}</td><td class="r">${d.countries ?? "—"}</td><td class="r">${d.added ?? "—"}</td><td class="r">${d.removed ?? "—"}</td><td class="r">${d.rate != null ? signed(d.rate, 1) + "%" : "—"}</td><td><span class="badge badge-${d.basis.toLowerCase()}">${d.basis}</span></td></tr>`).join("");
    $("#historyTable").innerHTML = `<table class="data"><thead><tr><th>Quarter</th><th class="r">Listings</th><th class="r">Countries</th><th class="r">New</th><th class="r">Removed</th><th class="r">Growth rate</th><th>Basis</th></tr></thead><tbody>${rows}</tbody></table>`;
  }

  /* ---------- map ---------- */
  const AFRICA = new Set(["012","024","204","072","854","108","120","140","148","174","178","180","262","818","226","232","748","231","266","270","288","324","624","384","404","426","430","434","450","454","466","478","480","504","508","516","562","566","646","678","686","694","706","710","728","729","834","768","788","800","732","894","716"]);
  const byId = Object.fromEntries(D.countries.map(c => [c.id, c]));
  let geo = null; // { features, proj, path }

  const RAMP = ["var(--s0)", "var(--s1)", "var(--s2)", "var(--s3)", "var(--s4)", "var(--s5)"];
  const RAMP_HEX = ["#EFE6D6", "#FDE6C6", "#FBCB86", "#F7A443", "#E2770F", "#A64905"];
  const bin = v => v <= 0 ? 0 : v === 1 ? 1 : v <= 3 ? 2 : v <= 9 ? 3 : v <= 19 ? 4 : 5;
  const DIV = { "-3": "#5F7387", "-2": "#8496A8", "-1": "#BAC6D2", "0": "#E6DCCB", "1": "#FBCB86", "2": "#E2770F" };
  const divKey = d => String(Math.max(-3, Math.min(2, d)));

  function fillFor(c) {
    if (!c) return "#F4EDE0";
    const v = c.v[state.qi];
    if (state.mapMode === "change" && state.qi > 0) return DIV[divKey(v - c.v[state.qi - 1])];
    return RAMP_HEX[bin(v)];
  }

  async function loadGeo() {
    try {
      // Local file: Africa's outlines from world-atlas 50m, pre-extracted (no CDN needed)
      const fc = await d3.json("assets/africa.geo.json");
      geo = { features: fc.features.filter(f => AFRICA.has(f.id) || f.properties.name === "Somaliland") };
      buildMap();
      buildHero();
      buildFactArt();
    } catch (err) {
      $("#mapWrap").innerHTML = `<div class="map-fallback">The map couldn’t load. Check your connection. The country list below has every figure.</div>`;
      $("#heroArt .skeleton")?.remove();
    }
  }

  function fitProj(w, h, pad) {
    // fit to the mainland + Mauritius, ignoring far-off islands (e.g. South Africa's Prince Edward Islands)
    return d3.geoMercator().fitExtent([[pad, pad], [w - pad, h - pad]], { type: "MultiPoint", coordinates: [[-17.6, 37.4], [58.2, -34.9]] });
  }

  function buildMap() {
    const W = 600, H = 640;
    const proj = fitProj(W, H, 14), path = d3.geoPath(proj);
    geo.proj = proj;
    const mu = proj([57.55, -20.25]);
    let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Map of Africa shaded by number of listed Bitcoin projects">`;
    geo.features.forEach(f => {
      const c = byId[f.id];
      if (f.id === "480") return; // Mauritius drawn as a marker
      s += `<path class="c ${c ? "on" : ""}" data-id="${f.id ?? ""}" data-name="${esc(f.properties.name)}" d="${path(f)}" fill="${fillFor(c)}"/>`;
    });
    s += `<g class="mu" data-id="480"><circle cx="${mu[0]}" cy="${mu[1]}" r="16" fill="transparent"/><circle class="mu-dot" cx="${mu[0]}" cy="${mu[1]}" r="6.5" stroke="var(--paper)" stroke-width="2" fill="${fillFor(byId["480"])}"/>
      <text x="${mu[0] - 12}" y="${mu[1] + 4}" text-anchor="end" style="font:500 11px var(--font);fill:var(--muted)">Mauritius</text></g>`;
    s += `</svg>`;
    $("#mapWrap").innerHTML = s;

    const svg = $("#mapWrap svg");
    const target = e => e.target.closest("[data-id]");
    svg.addEventListener("pointermove", e => {
      const t = target(e); if (!t) return hideTip();
      const c = byId[t.dataset.id];
      if (!c) return showTip(`<div class="t-q"><span>${esc(t.dataset.name)}</span></div><div class="t-v" style="font-size:16px">No listings yet</div><div class="t-note">Know a Bitcoin project here? Submit it to the Live Directory.</div>`, e.clientX, e.clientY);
      const v = c.v[state.qi], p = state.qi > 0 ? c.v[state.qi - 1] : null;
      showTip(`<div class="t-q"><span>${c.name}</span><span>#${rankOf(c)} of 25</span></div><div class="t-v">${v} listing${v === 1 ? "" : "s"}</div>${p != null ? `<div class="t-row"><span>vs ${qShort(state.qi - 1)}</span><b>${v - p === 0 ? "No change" : signed(v - p)}</b></div>` : ""}<div class="t-row"><span>Region</span><span>${c.region} Africa</span></div>`, e.clientX, e.clientY);
    });
    svg.addEventListener("pointerleave", hideTip);
    svg.addEventListener("click", e => { const t = target(e); if (t && byId[t.dataset.id]) selectCountry(byId[t.dataset.id].code); });
    paintMap();
  }

  function paintMap() {
    if (!geo || !$("#mapWrap svg")) return;
    $$("#mapWrap path.c").forEach(p => {
      const c = byId[p.dataset.id];
      p.setAttribute("fill", fillFor(c));
      p.classList.toggle("sel", !!c && c.code === state.country);
    });
    const mu = $("#mapWrap .mu-dot");
    mu.setAttribute("fill", fillFor(byId["480"]));
    mu.setAttribute("stroke", state.country === "MU" ? "var(--ink)" : "var(--paper)");
    // keep selected outline on top
    const sel = $("#mapWrap path.sel"); if (sel) sel.parentNode.insertBefore(sel, $("#mapWrap .mu"));
  }

  function renderMapChrome() {
    const change = state.mapMode === "change" && state.qi > 0;
    $("#mapTitle").textContent = change ? `Change since ${Q[state.qi - 1]}` : `Listings by country · ${Q[state.qi]}`;
    $("#mapLegend").innerHTML = change
      ? `<span>Fewer</span><div><div class="ramp">${["-3", "-2", "-1", "0", "1", "2"].map(k => `<span style="background:${DIV[k]}"></span>`).join("")}</div><div class="ramp-labels"><span>≤−3</span><span>−2</span><span>−1</span><span>0</span><span>+1</span><span>≥+2</span></div></div><span>More</span>`
      : `<span>Fewer</span><div><div class="ramp">${RAMP.map(c => `<span style="background:${c}"></span>`).join("")}</div><div class="ramp-labels"><span>0</span><span>1</span><span>2–3</span><span>4–9</span><span>10–19</span><span>20+</span></div></div><span>More</span>`;
    const aw = D.africaWide, i = state.qi;
    $("#awCard").innerHTML = `<div class="k">Africa Wide</div><div class="v">${aw[i]}</div><p>Pan-African projects, not on the map. ${i > 0 ? (aw[i] - aw[i - 1] > 0 ? `Up ${aw[i] - aw[i - 1]} vs ${qShort(i - 1)}.` : "No change.") : "Grew every quarter of 2026."}</p>`;
    $$("#mapSeg button").forEach(b => {
      const dis = b.dataset.mode === "change" && state.qi === 0;
      b.disabled = dis; b.style.opacity = dis ? .4 : 1;
      b.title = dis ? "Country figures for Q4 2025 weren’t supplied" : "";
    });
  }

  function setMapMode(mode, silent) {
    state.mapMode = mode;
    $$("#mapSeg button").forEach(b => b.setAttribute("aria-pressed", b.dataset.mode === mode));
    segThumb($("#mapSeg"));
    if (!silent) { renderMapChrome(); paintMap(); }
  }

  /* ---------- hero: dotted Africa ---------- */
  function dotGrid(W, H, step, pad) {
    const proj = fitProj(W, H, pad);
    const canvas = document.createElement("canvas"); canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    const path = d3.geoPath(proj, ctx);
    geo.features.forEach((f, i) => { ctx.beginPath(); path(f); ctx.fillStyle = `rgb(${(i + 1) * 4},0,0)`; ctx.fill(); });
    const img = ctx.getImageData(0, 0, W, H).data;
    const dots = [];
    let row = 0;
    for (let y = step / 2; y < H; y += step * .88, row++) {
      for (let x = step / 2 + (row % 2) * step / 2; x < W; x += step) {
        const k = ((y | 0) * W + (x | 0)) * 4;
        if (img[k + 3] < 250 || img[k] % 4) continue;
        const f = geo.features[img[k] / 4 - 1];
        if (f) dots.push({ x, y, f });
      }
    }
    // Mauritius: one dot on the main island (its outline also covers far-off Rodrigues and Agaléga)
    for (let k = dots.length - 1; k >= 0; k--) if (dots[k].f.id === "480") dots.splice(k, 1);
    // make sure every listed country gets at least one dot
    D.countries.forEach(c => {
      if (dots.some(d => d.f.id === c.id)) return;
      const f = geo.features.find(f => f.id === c.id); if (!f) return;
      const [x, y] = proj(c.id === "480" ? [57.55, -20.25] : d3.geoCentroid(f));
      dots.push({ x, y, f });
    });
    return { dots, proj };
  }

  function buildHero() {
    const W = 600, H = 640;
    const { dots, proj } = dotGrid(W, H, 13, 30);
    const PIN = { ZA: [24.5, -29.5], KE: [37.9, 0.3], NG: [8.2, 9.6], MU: [57.55, -20.25] }; // MU: main island, not the centroid of its outlying islands
    const at = c => proj(PIN[c.code] || d3.geoCentroid(geo.features.find(f => f.id === c.id)));
    let s = `<svg class="dots" viewBox="0 0 ${W} ${H}">`;
    dots.forEach(d => {
      const c = byId[d.f.id];
      const fill = c ? RAMP_HEX[Math.max(1, bin(c.v[3]))] : "#E6D9C3";
      const delay = reduceMotion ? 0 : Math.round(d.y * 1.3 + Math.random() * 220);
      s += `<circle class="dot-i" cx="${d.x.toFixed(1)}" cy="${d.y.toFixed(1)}" r="4.4" fill="${fill}" style="animation-delay:${delay}ms"/>`;
    });
    const call = [
      { c: byCode.NG, dx: -150, dy: -54, label: "Nigeria", val: "29 listings" },
      { c: byCode.KE, dx: 70, dy: -70, label: "Kenya", val: "19 listings" },
      { c: byCode.ZA, dx: -170, dy: 30, label: "South Africa", val: "25 listings" },
      { c: byCode.MU, below: true, dy: 46, label: "Mauritius", val: "Newest country" }
    ];
    call.forEach((o, i) => {
      const [px, py] = at(o.c);
      const bw = o.label.length > 9 || o.val.length > 12 ? 132 : 112, bh = 48;
      // "below" callouts hang straight under their point, kept inside the artboard
      const bx = o.below ? Math.min(W - bw - 4, px - bw / 2) : px + o.dx, by = py + o.dy;
      const ax = o.below ? px : o.dx < 0 ? bx + bw : bx, ay = o.below ? by : by + bh / 2;
      s += `<circle class="pulse" cx="${px}" cy="${py}" r="9" fill="#F7931A" style="animation-delay:${i * .6}s"/>`;
      s += `<g class="callout" style="animation-delay:${1.1 + i * .18}s">
        <path d="M${px},${py} L${ax},${ay}" stroke="#24170D" stroke-opacity=".35" stroke-width="1.2" fill="none"/>
        ${o.c.code === "MU"
          ? `<circle cx="${px}" cy="${py}" r="11" fill="none" stroke="#24170D" stroke-width="1.5"/><circle cx="${px}" cy="${py}" r="5.5" fill="#F7931A"/>`
          : `<circle cx="${px}" cy="${py}" r="5" fill="#24170D" stroke="#FFFDF8" stroke-width="2"/>`}
        <rect x="${bx}" y="${by}" width="${bw}" height="${bh}" rx="14" fill="#FFFDF8" stroke="#EADFCB"/>
        <text x="${bx + 14}" y="${by + 20}" style="font:600 12.5px Inter, sans-serif;fill:#8B7562">${o.label}</text>
        <text x="${bx + 14}" y="${by + 38}" style="font:400 18px 'Instrument Serif', serif;fill:#24170D;stroke:#24170D;stroke-width:.3px">${o.val}</text>
      </g>`;
    });
    s += `</svg>`;
    const art = $("#heroArt");
    art.querySelector(".skeleton")?.remove();
    art.insertAdjacentHTML("afterbegin", s);
  }

  /* ---------- country profile ---------- */
  function rankOf(c, i = state.qi) { return 1 + D.countries.filter(o => o.v[i] > c.v[i]).length; }

  function selectCountry(code, scroll) {
    state.country = code;
    renderProfile(true); renderBoard(); paintMap();
    if (scroll && innerWidth < 960) $("#profile").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
  }

  function renderProfile(anim) {
    const c = byCode[state.country], i = state.qi, v = c.v[i];
    const p = i > 0 ? c.v[i - 1] : null;
    const total = hist(i).total;
    const share = (v / total * 100);
    const leads = D.categories.filter(k => k.lead[i].includes(c.code));
    const joined = D.joined.filter(j => j.country === c.name && j.q <= i);
    const left = D.removed.filter(r => r.country === c.name && r.q <= i);
    const max = Math.max(...c.v, 1);
    const since = c.v[i] - c.v[0];
    const spot = D.spotlights[c.code] ||
      `${c.name} has ${v} listing${v === 1 ? "" : "s"}, #${rankOf(c)} of 25 countries. ${i === 0 ? "" : since === 0 ? "Holding steady through 2026." : since > 0 ? `Up ${since} since Q1.` : `Down ${-since} since Q1.`}`;

    $("#profile").innerHTML = `<div class="${anim ? "fade-swap" : ""}" style="display:flex;flex-direction:column;gap:18px">
      <div class="p-head">
        <div class="p-flag">${c.code}</div>
        <div><h3>${c.name}</h3><div class="p-sub">${c.region} Africa · ${Q[i]}</div></div>
        <div style="margin-left:auto">${p != null ? deltaChip(v - p) : ""}</div>
      </div>
      <div class="p-stats">
        <div class="p-stat"><div class="k">Listings</div><div class="v">${v}</div></div>
        <div class="p-stat"><div class="k">Rank</div><div class="v">#${rankOf(c)}<span style="font-size:14px;color:var(--muted);font-weight:500"> / 25</span></div></div>
        <div class="p-stat"><div class="k">Share</div><div class="v">${share < 1 && share > 0 ? share.toFixed(1) : Math.round(share)}%</div></div>
      </div>
      <div class="p-spot"><svg><use href="#i-spark"/></svg>${esc(spot)}</div>
      <div class="p-sec"><h4>2026 trend</h4>
        <div class="p-trend"><div class="bars">${c.v.map((x, k) => `<div class="bar ${k === i ? "cur" : ""}"><b>${x}</b><span class="b" style="height:${Math.max(4, x / max * 46)}px"></span><small>${qShort(k)}</small></div>`).join("")}</div></div>
      </div>
      <div class="p-sec"><h4>Leads Africa in</h4>
        ${leads.length ? `<div class="p-chips">${leads.map(k => `<span class="chip chip-up"><svg width="14" height="14"><use href="#c-${k.key}"/></svg>${k.name}${k.lead[i].length > 1 ? " (shared)" : ""}</span>`).join("")}</div>` : `<div class="p-empty">No category lead in ${Q[i]}.</div>`}
      </div>
      <div class="p-sec"><h4>Joined &amp; left in 2026</h4>
        ${joined.length || left.length ? `<ul class="p-list">${joined.map(j => `<li><span>＋ ${esc(j.name)}</span><span>${j.cat ? esc(j.cat) + " · " : ""}${qShort(j.q)}</span></li>`).join("")}${left.map(r => `<li style="background:var(--slate-100)"><span>− ${esc(r.name)}</span><span>left in ${qShort(r.q)}</span></li>`).join("")}</ul>` : `<div class="p-empty">No changes recorded up to ${Q[i]}.</div>`}
      </div>
    </div>`;
  }

  /* ---------- leaderboard ---------- */
  function renderBoard() {
    const i = state.qi, max = 37;
    const list = [...D.countries].sort((a, b) => b.v[i] - a.v[i] || a.name.localeCompare(b.name));
    const half = Math.ceil((list.length + 1) / 2);
    const rows = list.map(c => {
      const d = i > 0 ? c.v[i] - c.v[i - 1] : null;
      return `<button class="row ${c.code === state.country ? "sel" : ""}" data-code="${c.code}">
        <span class="rk">${rankOf(c)}</span><span class="nm">${c.name}</span>
        <span class="track"><span class="fill" style="width:${c.v[i] / max * 100}%"></span></span>
        <span class="vv">${c.v[i]}</span><span class="dd">${d == null ? "" : deltaChip(d)}</span></button>`;
    });
    const aw = D.africaWide, ad = i > 0 ? aw[i] - aw[i - 1] : null;
    rows.push(`<div class="row aw" style="cursor:default"><span class="rk">—</span><span class="nm">Africa Wide</span><span class="track"><span class="fill" style="width:${aw[i] / max * 100}%"></span></span><span class="vv">${aw[i]}</span><span class="dd">${ad == null ? "" : deltaChip(ad)}</span></div>`);
    const box = $("#rows");
    box.innerHTML = rows.join("");
    box.style.gridTemplateRows = innerWidth > 760 ? `repeat(${half}, auto)` : "";
    box.style.gridAutoFlow = innerWidth > 760 ? "column" : "row";
    $("#boardChip").textContent = `${hist(i).total} listings · ${Q[i]}`;
  }

  /* ---------- regions ---------- */
  function regionTotals(i) {
    const t = Object.fromEntries(D.regions.map(r => [r.key, 0]));
    D.countries.forEach(c => t[c.region] += c.v[i]);
    return t;
  }
  function renderRegions() {
    const i = state.qi, t = regionTotals(i), p = i > 0 ? regionTotals(i - 1) : null;
    const max = 66;
    $("#regRows").innerHTML = D.regions.map(r => `
      <div class="reg"><span class="nm">${r.name}</span>
        <span class="track"><span class="fill" style="width:${t[r.key] / max * 100}%"></span>${p ? `<span class="ghost" style="left:${p[r.key] / max * 100}%" title="${Q[i - 1]}: ${p[r.key]}"></span>` : ""}</span>
        <span class="vv">${t[r.key]}</span><span style="justify-self:end">${p ? deltaChip(t[r.key] - p[r.key]) : ""}</span></div>`).join("");
    const nEast = D.countries.filter(c => c.region === "East" && c.v[i] > 0).length;
    $("#regText").innerHTML = `East Africa has <b>${t.East}</b> listings across ${nEast} countries, more than West Africa (<b>${t.West}</b>), even though Nigeria is the largest single country. North Africa has just one, in Sudan.${p ? ` The dark tick marks ${Q[i - 1]}.` : ""}`;
  }

  /* ---------- categories ---------- */
  function sparkline(v, i) {
    const w = 120, h = 36, lo = Math.min(...v), hi = Math.max(...v);
    const y = x => hi === lo ? h / 2 : h - 4 - (x - lo) / (hi - lo) * (h - 8);
    const xs = k => 4 + k * (w - 8) / (v.length - 1);
    const d = v.map((x, k) => `${k ? "L" : "M"}${xs(k)},${y(x)}`).join("");
    return `<svg viewBox="0 0 ${w} ${h}" aria-hidden="true"><path d="${d}" fill="none" stroke="var(--orange)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>${v.map((x, k) => `<circle cx="${xs(k)}" cy="${y(x)}" r="${k === i ? 4.5 : 2.5}" fill="${k === i ? "var(--orange)" : "var(--paper)"}" stroke="var(--orange)" stroke-width="${k === i ? 2 : 1.5}"/>`).join("")}</svg>`;
  }

  function renderCategories() {
    const i = state.qi;
    $("#catList").innerHTML = D.categories.map(c => {
      const d = i > 0 ? c.v[i] - c.v[i - 1] : null;
      return `<button class="cat ${c.key === state.cat ? "on" : ""}" role="option" aria-selected="${c.key === state.cat}" data-k="${c.key}">
        <span class="ic"><svg><use href="#c-${c.key}"/></svg></span>
        <span><div class="nm">${c.name}</div><div class="tp">Top: ${c.top[i]}</div></span>
        <span class="spark">${sparkline(c.v, i)}</span>
        <span class="vv">${c.v[i]}</span>
        <span class="dd">${d == null ? `<span class="chip chip-flat">Q1</span>` : deltaChip(d)}</span>
      </button>`;
    }).join("");
    renderWaffle();
  }

  function setCat(k) {
    if (state.cat === k) return;
    state.cat = k;
    $$(".cat").forEach(b => { const on = b.dataset.k === k; b.classList.toggle("on", on); b.setAttribute("aria-selected", on); });
    renderWaffle();
  }

  function renderWaffle() {
    const i = state.qi, total = catSum(i), box = $("#waffle");
    const cat = D.categories.find(c => c.key === state.cat);
    if (box.children.length !== total) {
      box.innerHTML = Array.from({ length: total }, () => "<i></i>").join("");
    }
    let n = 0;
    const dots = box.children;
    D.categories.forEach(c => {
      for (let k = 0; k < c.v[i]; k++, n++) {
        const on = c.key === state.cat;
        dots[n].classList.toggle("on", on);
        dots[n].style.transitionDelay = on && !reduceMotion ? `${(k % 40) * 8}ms` : "0ms";
      }
    });
    const pct = Math.round(cat.v[i] / total * 100);
    $("#wK").textContent = cat.name;
    animateNumber($("#wV"), cat.v[i], { dur: 450 });
    $("#wS").textContent = `${pct}% of all listings in ${Q[i]}. ${cat.lead[i].length > 1 ? "Lead shared: " : "Led by "}${cat.top[i]}.`;
    box.setAttribute("aria-label", `${cat.v[i]} of ${total} listings are ${cat.name}`);
    $("#wFoot").textContent = `${total} dots, one per listing in ${Q[i]}.${i === 2 ? " Q3 category totals follow the posted 189." : ""}`;
  }

  /* ---------- insights: one featured story + three themed columns ---------- */
  const THEMES = [
    { title: "Where it’s happening", icon: "community", facts: [
      { v: "2 in 5", text: "listings are in Nigeria, South Africa or Kenya (73 of 180)." },
      { v: "0 → 2", text: "Mauritius, the newest country on the map, with Bitdevs Mauritius and OS Guild." },
      { v: "1", text: "listing in all of North Africa, in Sudan. Plenty of room to grow." }
    ] },
    { title: "What’s being built", icon: "education", facts: [
      { v: "1 in 4", text: "listings is an education project: 46 of 180." },
      { v: "+45%", text: "Tech meetups grew from 11 to 16 in 2026, faster than any other category." },
      { v: "6 of 9", text: "categories where Nigeria leads or shares the lead." }
    ] },
    { title: "How it’s changing", icon: "circular", facts: [
      { v: "29 → 37", text: "Africa Wide projects grew in every quarter of 2026." },
      { v: "5 of 12", text: "Q4 removals were South African projects." },
      { v: "−26%", text: "Circular economies had the steepest fall, from 27 to 20 listings." }
    ] }
  ];
  const FEATURE = { v: "60 vs 50", text: "East Africa has more Bitcoin listings than West Africa, even though Nigeria is the single largest country." };
  const FACT_LIST = [FEATURE, ...THEMES.flatMap(t => t.facts)];
  const shareIcon = `<svg aria-hidden="true"><use href="#i-share"/></svg>`;

  function renderFacts() {
    const t = regionTotals(3), max = Math.max(t.East, t.West, t.Southern);
    let k = 1;
    $("#facts").innerHTML = `
      <article class="feature reveal">
        <div class="feature-copy">
          <span class="f-tag">The headline · Q4 2026</span>
          <div class="feature-v">60 <em>vs</em> 50</div>
          <p class="feature-p">${FEATURE.text}</p>
          <div class="feature-bars" role="img" aria-label="Listings by region: East Africa ${t.East}, West Africa ${t.West}, Southern Africa ${t.Southern}">
            ${[["East Africa", t.East, "east"], ["West Africa", t.West, "west"], ["Southern Africa", t.Southern, "south"]].map(([n, v, c]) => `
              <div class="fb"><span class="fb-n">${n}</span><span class="fb-t"><span class="fb-f ${c}" style="width:${v / max * 100}%"></span></span><span class="fb-v">${v}</span></div>`).join("")}
          </div>
          <button class="share-pill" data-k="0">${shareIcon}Share this</button>
        </div>
        <div class="feature-art" data-art="map" aria-hidden="true"></div>
      </article>
      <div class="themes">
        ${THEMES.map((th, i) => `
          <section class="theme reveal" style="transition-delay:${i * 90}ms">
            <header class="theme-h"><span class="theme-ic"><svg><use href="#c-${th.icon}"/></svg></span><span class="theme-i">0${i + 1}</span><h3>${th.title}</h3></header>
            <ul>${th.facts.map(f => `
              <li class="fi">
                <div class="fi-v">${f.v}</div>
                <p>${f.text}</p>
                <button class="fi-share" data-k="${k++}" aria-label="Copy this fact to share" title="Copy to share">${shareIcon}</button>
              </li>`).join("")}
            </ul>
          </section>`).join("")}
      </div>`;
    $("#facts").addEventListener("click", async e => {
      const b = e.target.closest("[data-k]"); if (!b) return;
      const f = FACT_LIST[+b.dataset.k];
      const txt = `Did you know? ${f.v}: ${f.text} (African Bitcoin Ecosystem Growth Tracker, Q4 2026)`;
      try { await navigator.clipboard.writeText(txt); toast("Copied. Ready to share."); }
      catch { toast("Couldn’t copy. Select the text instead."); }
    });
  }

  function buildFactArt() {
    const el = $('[data-art="map"]'); if (!el) return;
    const { dots } = dotGrid(360, 384, 11, 6);
    const fill = c => !c ? "#EADFCB" : c.region === "East" ? "#F7931A" : c.region === "West" ? "#F8C766" : "#EADFCB";
    el.innerHTML = `<svg viewBox="0 0 360 384">${dots.map(d => `<circle cx="${d.x.toFixed(1)}" cy="${d.y.toFixed(1)}" r="3.7" fill="${fill(byId[d.f.id])}"/>`).join("")}</svg>`;
  }

  /* ---------- changes log ---------- */
  function buildLogSeg() {
    const tabs = [["joined", `Joined (${D.joined.length})`], ["removed", `Left (${D.removed.length})`], ["moves", `Renamed & moved (${D.moves.length})`]];
    $("#logSeg").innerHTML = tabs.map(([k, l]) => `<button role="tab" aria-selected="${k === state.logTab}" data-k="${k}">${l}</button>`).join("");
    $("#logSeg").addEventListener("click", e => {
      const b = e.target.closest("button"); if (!b) return;
      state.logTab = b.dataset.k;
      $$("#logSeg button").forEach(x => x.setAttribute("aria-selected", x === b));
      segThumb($("#logSeg")); renderLog();
    });
    segThumb($("#logSeg"));
    $("#logSearch").addEventListener("input", e => { state.search = e.target.value.trim().toLowerCase(); renderLog(); });
  }

  const initials = n => n.replace(/[^A-Za-z0-9 ]/g, "").split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase();

  function renderLog() {
    const src = D[state.logTab];
    const qy = state.search;
    const items = src.filter(x => !qy || [x.name, x.country, x.cat, x.change].filter(Boolean).join(" ").toLowerCase().includes(qy));
    if (!items.length) { $("#logBody").innerHTML = `<div class="empty">No projects match “${esc(state.search)}”.</div>`; return; }
    const groups = [3, 2, 1].map(q => [q, items.filter(x => x.q === q)]).filter(([, l]) => l.length);
    $("#logBody").innerHTML = groups.map(([q, l]) => `
      <div class="log-group"><h4>${state.logTab === "removed" ? `Missing from ${Q[q]}` : state.logTab === "moves" ? Q[q] : `First listed in ${Q[q]}`} · ${l.length}${q === state.qi ? ' <span class="chip chip-up" style="height:20px;font-size:11px">Selected quarter</span>' : ""}</h4>
      <div class="log-items">${l.map(x => {
        if (state.logTab === "joined") return `<div class="li"><span class="av">${initials(x.name)}</span><span><div class="nm">${esc(x.name)}</div><div class="meta">${esc(x.country)} · ${x.cat ? esc(x.cat) : "Category not recorded"}${x.note ? " · " + esc(x.note) : ""}</div></span><span class="tag">${x.date ? esc(x.date) : esc(x.source)}</span></div>`;
        if (state.logTab === "removed") return `<div class="li out"><span class="av">${initials(x.name)}</span><span><div class="nm">${esc(x.name)}</div><div class="meta">${esc(x.country)} · last seen ${Q[q - 1]}</div></span><span class="tag">Not on next infographic</span></div>`;
        return `<div class="li"><span class="av" style="background:var(--gold-100);color:#8A5A00">${initials(x.name)}</span><span><div class="nm">${esc(x.name)}</div><div class="meta">${esc(x.change)}</div></span><span class="tag">${esc(x.treatment.split(".")[0])}</span></div>`;
      }).join("")}</div></div>`).join("");
  }

  /* ---------- CSV ---------- */
  function downloadCSV(e) {
    e.preventDefault();
    const lines = ["section,quarter,name,value,basis"];
    D.history.forEach(h => {
      ["total", "countries", "added", "removed", "rate"].forEach(k => lines.push(`history,${h.q},${k},${h[k] ?? ""},${h.basis}`));
    });
    D.countries.forEach(c => c.v.forEach((v, i) => lines.push(`country,${Q[i]},"${c.name}",${v},COUNTED`)));
    D.africaWide.forEach((v, i) => lines.push(`country,${Q[i]},Africa Wide,${v},COUNTED`));
    D.categories.forEach(c => c.v.forEach((v, i) => lines.push(`category,${Q[i]},"${c.name}",${v},COUNTED`)));
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: "africa-bitcoin-ecosystem-growth.csv" });
    a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    toast("CSV downloaded");
  }

  /* ---------- page chrome ---------- */
  function setupChrome() {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { rootMargin: "0px 0px -8% 0px" });
    $$(".reveal").forEach(el => io.observe(el));

    const nav = $(".nav"), dock = $("#qdock"), hero = $(".hero");
    const onScroll = () => {
      nav.classList.toggle("stuck", scrollY > 8);
      // show the quarter picker once the hero is mostly behind us
      dock.classList.toggle("on", hero.getBoundingClientRect().bottom < innerHeight * .35);
    };
    addEventListener("scroll", onScroll, { passive: true }); onScroll();

    const links = $$(".nav-links a");
    const so = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) links.forEach(a => a.classList.toggle("active", a.getAttribute("href") === "#" + e.target.id));
    }), { rootMargin: "-45% 0px -50% 0px" });
    ["overview", "map", "categories", "insights", "changes", "method"].forEach(id => so.observe(document.getElementById(id)));

    $("#tableToggle").addEventListener("click", e => {
      const t = $("#historyTable"), open = t.hidden;
      t.hidden = !open; e.currentTarget.setAttribute("aria-expanded", open);
      e.currentTarget.querySelector("span").textContent = open ? "Hide table" : "Show table";
    });
    $("#csvBtn").addEventListener("click", downloadCSV);
    $("#csvBtn2").addEventListener("click", downloadCSV);
    $("#updated").textContent = D.updated;

    $("#mapSeg").addEventListener("click", e => { const b = e.target.closest("button"); if (b && !b.disabled) setMapMode(b.dataset.mode); });
    $("#rows").addEventListener("click", e => { const b = e.target.closest("[data-code]"); if (b) selectCountry(b.dataset.code, true); });
    const cl = $("#catList");
    cl.addEventListener("click", e => { const b = e.target.closest(".cat"); if (b) setCat(b.dataset.k); });
    cl.addEventListener("pointerover", e => { const b = e.target.closest(".cat"); if (b && matchMedia("(hover: hover)").matches) setCat(b.dataset.k); });
    cl.addEventListener("focusin", e => { const b = e.target.closest(".cat"); if (b) setCat(b.dataset.k); });

    let rt;
    addEventListener("resize", () => {
      clearTimeout(rt);
      rt = setTimeout(() => { renderHistory(); renderBoard(); $$(".seg").forEach(segThumb); }, 120);
    });
    document.fonts?.ready.then(() => $$(".seg").forEach(segThumb));

  }

  function renderAll() {
    renderOverview();
    renderHistory();
    renderMapChrome();
    paintMap();
    renderProfile(true);
    renderBoard();
    renderRegions();
    renderCategories();
    renderLog();
  }

  /* ---------- boot ---------- */
  buildQuarterSeg();
  buildLogSeg();
  segThumb($("#mapSeg"));
  renderFacts();
  renderHistoryTable();
  renderAll();
  setupChrome();
  loadGeo();
})();
