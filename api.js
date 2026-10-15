/* Live Directory API page
   One spec (ENDPOINTS) drives the reference docs, the code samples and the playground.
   Responses in this prototype are built from data.js (the Q4 2026 baseline sample). */
(() => {
  const D = window.ABE;

  /* ---- Values to confirm with the API team before launch ---- */
  const CONFIG = {
    base: "https://api.bitcoiners.africa/v1",
    ratePerMin: 60
  };

  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  function toast(msg) {
    const t = $("#toast"); t.querySelector("span").textContent = msg; t.classList.add("on");
    clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove("on"), 1800);
  }
  async function copy(text, msg = "Copied") {
    try { await navigator.clipboard.writeText(text); toast(msg); } catch { toast("Couldn’t copy. Select the text instead."); }
  }

  /* ---------- sample database built from the ledger ---------- */
  const MONTHS = { Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6, Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12 };
  const isoDate = s => { if (!s) return null; const m = s.match(/(\w{3}) (\d{1,2}), (\d{4})/); return m ? `${m[3]}-${String(MONTHS[m[1]]).padStart(2, "0")}-${m[2].padStart(2, "0")}` : null; };
  const slug = s => s.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const qKey = i => D.quarters[i].replace(/Q(\d) (\d{4})/, "$2-Q$1");          // "Q4 2026" -> "2026-Q4"
  const hKey = q => q.replace(/Q(\d) (\d{4})/, "$2-Q$1");
  const QUARTERS = D.quarters.map((_, i) => qKey(i));
  const HIST = D.history.map(h => hKey(h.q));
  const byName = Object.fromEntries(D.countries.map(c => [c.name, c]));
  const countryOf = name => {
    if (name === "Africa Wide") return { country: "Africa Wide", country_code: null, region: null, pan_african: true };
    const c = byName[name];
    return { country: name, country_code: c ? c.code : null, region: c ? c.region : null, pan_african: false };
  };

  const PROJECTS = [
    ...D.joined.map(j => ({
      id: slug(j.name), name: j.name, ...countryOf(j.country),
      category: j.cat ? slug(j.cat) : null, status: "active",
      date_added: isoDate(j.date), source: slug(j.source).replace(/-/g, "_"),
      first_listed: qKey(j.q), removed_in: null
    })),
    ...D.removed.map(r => ({
      id: slug(r.name), name: r.name, ...countryOf(r.country),
      category: null, status: "removed", date_added: null, source: null,
      first_listed: null, removed_in: qKey(r.q)
    }))
  ];
  const CATS_IN_SAMPLE = [...new Set(PROJECTS.map(p => p.category).filter(Boolean))].sort();

  /* ---------- handlers: what each endpoint returns ---------- */
  const err = (status, code, message) => ({ status, body: { error: { code, message } } });
  const qIndex = q => QUARTERS.indexOf(q);

  const HANDLERS = {
    projects(p) {
      let rows = PROJECTS.slice();
      if (p.country) rows = rows.filter(r => p.country === "pan-african" ? r.pan_african : r.country_code === p.country);
      if (p.category) rows = rows.filter(r => r.category === p.category);
      if (p.status) rows = rows.filter(r => r.status === p.status);
      if (p.added_after) rows = rows.filter(r => r.date_added && r.date_added >= p.added_after);
      if (p.q) rows = rows.filter(r => r.name.toLowerCase().includes(p.q.toLowerCase()));
      const limit = Math.min(100, +p.limit || 20);
      const page = rows.slice(0, limit);
      return { status: 200, body: { data: page, meta: { total: rows.length, limit, next_cursor: rows.length > limit ? "c_" + btoa(String(limit)).replace(/=/g, "") : null } } };
    },
    project(p) {
      const r = PROJECTS.find(x => x.id === p.id);
      return r ? { status: 200, body: { data: r } } : err(404, "not_found", `No project with id "${p.id}".`);
    },
    countries(p) {
      const i = qIndex(p.quarter || QUARTERS[3]);
      if (i < 0) return err(400, "invalid_parameter", "quarter must look like 2026-Q4.");
      const data = D.countries.map(c => ({ code: c.code, name: c.name, region: c.region, listings: c.v[i], change: i ? c.v[i] - c.v[i - 1] : null }))
        .sort((a, b) => b.listings - a.listings || a.name.localeCompare(b.name));
      return { status: 200, body: { data, meta: { quarter: QUARTERS[i], countries: data.filter(d => d.listings > 0).length, pan_african_listings: D.africaWide[i], total_listings: D.history.find(h => hKey(h.q) === QUARTERS[i]).total } } };
    },
    categories(p) {
      const i = qIndex(p.quarter || QUARTERS[3]);
      if (i < 0) return err(400, "invalid_parameter", "quarter must look like 2026-Q4.");
      const data = D.categories.map(c => ({ slug: c.key, name: c.name, listings: c.v[i], change: i ? c.v[i] - c.v[i - 1] : null, top_country: c.top[i] }));
      return { status: 200, body: { data, meta: { quarter: QUARTERS[i] } } };
    },
    growth(p) {
      const a = HIST.indexOf(p.from || HIST[0]), b = HIST.indexOf(p.to || HIST[HIST.length - 1]);
      if (a < 0 || b < 0 || a > b) return err(400, "invalid_parameter", "from and to must be quarters like 2024-Q3, with from before to.");
      const data = D.history.slice(a, b + 1).map(h => ({ quarter: hKey(h.q), listings: h.total, countries: h.countries, new: h.added, removed: h.removed, net: h.net ?? null, growth_rate: h.rate, basis: h.basis.toLowerCase() }));
      return { status: 200, body: { data, meta: { from: HIST[a], to: HIST[b], note: "null means the figure was not recorded for that quarter" } } };
    },
    changes(p) {
      const i = qIndex(p.quarter || QUARTERS[3]);
      if (i < 1) return err(400, "invalid_parameter", "Changes are available from 2026-Q2 onwards.");
      const type = p.type || "added";
      let data;
      if (type === "added") data = PROJECTS.filter(r => r.first_listed === QUARTERS[i]).map(r => ({ id: r.id, name: r.name, country: r.country, category: r.category, date_added: r.date_added }));
      else if (type === "removed") data = PROJECTS.filter(r => r.removed_in === QUARTERS[i]).map(r => ({ id: r.id, name: r.name, country: r.country, last_seen: QUARTERS[i - 1] }));
      else data = D.moves.filter(m => m.q === i).map(m => ({ name: m.name, change: m.change, treatment: m.treatment }));
      return { status: 200, body: { data, meta: { quarter: QUARTERS[i], type, total: data.length } } };
    }
  };

  /* ---------- the spec ---------- */
  const countryOptions = [["", "Any country"], ...D.countries.filter(c => c.v[3] > 0).map(c => [c.code, `${c.name} (${c.code})`]), ["pan-african", "Africa Wide (pan-african)"]];
  const ENDPOINTS = [
    { id: "projects", path: "/projects", title: "List projects", nav: "List projects",
      desc: "Every project in the directory, newest first. Combine filters to narrow it down.",
      params: [
        { name: "country", type: "string", desc: "Two-letter country code, e.g. NG. Use pan-african for Africa Wide projects.", options: countryOptions, example: "NG" },
        { name: "category", type: "string", desc: "Directory category slug, e.g. education or wallet.", options: [["", "Any category"], ...CATS_IN_SAMPLE.map(c => [c, c])], example: "education" },
        { name: "status", type: "string", desc: "active, inactive or removed.", options: [["", "Any status"], ["active", "active"], ["inactive", "inactive"], ["removed", "removed"]], example: "active" },
        { name: "added_after", type: "date", desc: "Only projects added on or after this date (YYYY-MM-DD).", input: "date" },
        { name: "q", type: "string", desc: "Search project names.", input: "text", placeholder: "e.g. bitdevs" },
        { name: "limit", type: "integer", desc: "Results per page, 1 to 100. Default 20.", options: [["5", "5"], ["20", "20"], ["50", "50"]] },
        { name: "cursor", type: "string", desc: "Value of meta.next_cursor from the previous page.", hideInPlayground: true }
      ],
      sample: { country: "NG", status: "active" } },
    { id: "project", path: "/projects/{id}", title: "Get a project", nav: "Get a project",
      desc: "One project by its id.",
      params: [{ name: "id", type: "string", required: true, inPath: true, desc: "The project id from a list response.", options: PROJECTS.filter(p => p.status === "active").map(p => [p.id, p.name]) }],
      sample: { id: "sabi-wallet" } },
    { id: "countries", path: "/countries", title: "Countries", nav: "Countries",
      desc: "Listings per country for a quarter, with the change since the quarter before.",
      params: [{ name: "quarter", type: "string", desc: "A quarter like 2026-Q4. Defaults to the latest.", options: QUARTERS.map(q => [q, q]).reverse() }],
      sample: { quarter: "2026-Q4" } },
    { id: "categories", path: "/categories", title: "Categories", nav: "Categories",
      desc: "Listings per category for a quarter, and which country leads each one.",
      params: [{ name: "quarter", type: "string", desc: "A quarter like 2026-Q4. Defaults to the latest.", options: QUARTERS.map(q => [q, q]).reverse() }],
      sample: { quarter: "2026-Q4" } },
    { id: "growth", path: "/growth", title: "Growth over time", nav: "Growth",
      desc: "Quarterly totals, new and removed projects and growth rate. The same numbers as the growth tracker.",
      params: [
        { name: "from", type: "string", desc: "First quarter, e.g. 2024-Q3.", options: HIST.map(q => [q, q]) },
        { name: "to", type: "string", desc: "Last quarter, e.g. 2026-Q4.", options: HIST.map(q => [q, q]).reverse() }
      ],
      sample: { from: "2026-Q1", to: "2026-Q4" } },
    { id: "changes", path: "/changes", title: "Changes in a quarter", nav: "Changes",
      desc: "Which projects joined, left or moved in a given quarter.",
      params: [
        { name: "quarter", type: "string", desc: "A quarter from 2026-Q2 onwards.", options: QUARTERS.slice(1).map(q => [q, q]).reverse() },
        { name: "type", type: "string", desc: "added, removed or moved. Default added.", options: [["added", "added"], ["removed", "removed"], ["moved", "moved"]] }
      ],
      sample: { quarter: "2026-Q4", type: "added" } }
  ];
  const EP = Object.fromEntries(ENDPOINTS.map(e => [e.id, e]));

  /* ---------- request building & code samples ---------- */
  function urlFor(ep, params) {
    let path = ep.path;
    const qs = [];
    ep.params.forEach(p => {
      const v = params[p.name];
      if (v == null || v === "") return;
      if (p.inPath) path = path.replace(`{${p.name}}`, encodeURIComponent(v));
      else qs.push(`${p.name}=${encodeURIComponent(v)}`);
    });
    return CONFIG.base + path + (qs.length ? "?" + qs.join("&") : "");
  }
  function respond(ep, params) { return HANDLERS[ep.id](params); }

  const LANGS = [["curl", "cURL"], ["js", "JavaScript"], ["python", "Python"]];
  let lang = "curl";

  function snippet(l, ep, params) {
    const url = urlFor(ep, params);
    if (l === "curl") return `curl "${url}"`;
    if (l === "js") return `const res = await fetch("${url}");\nconst { data, meta } = await res.json();\n\nconsole.log(data);`;
    const base = CONFIG.base + ep.path.replace(/\{(\w+)\}/, (_, k) => params[k] || `{${k}}`);
    const q = ep.params.filter(p => !p.inPath && params[p.name] != null && params[p.name] !== "");
    return `import requests\n\nres = requests.get(\n    "${base}",${q.length ? `\n    params={${q.map(p => `"${p.name}": "${params[p.name]}"`).join(", ")}},` : ""}\n)\nprint(res.json()["data"])`;
  }

  // Tiny highlighter: strings, keywords, comments, numbers
  function hl(code) {
    const re = /(\/\/[^\n]*|#[^\n]*)|("(?:[^"\\]|\\.)*")|\b(const|await|import|print|curl|console|from|return|for|while|let|async|function|if|break)\b|\b(\d+)\b/g;
    let out = "", last = 0, m;
    while ((m = re.exec(code))) {
      out += esc(code.slice(last, m.index));
      const cls = m[1] ? "c" : m[2] ? "s" : m[3] ? "k" : "n";
      out += `<span class="${cls}">${esc(m[0])}</span>`;
      last = re.lastIndex;
    }
    return out + esc(code.slice(last));
  }
  function hlJSON(obj) {
    const json = JSON.stringify(obj, null, 2);
    return json.replace(/("(?:\\u[a-fA-F0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(?:true|false|null)\b|-?\d+(?:\.\d+)?)/g, m => {
      let cls = "n";
      if (m[0] === '"') cls = /:$/.test(m) ? "key" : "s";
      else if (m === "null") cls = "c";
      else if (m === "true" || m === "false") cls = "b";
      return `<span class="${cls}">${esc(m)}</span>`;
    });
  }
  const statusText = s => ({ 200: "200 OK", 400: "400 Bad Request", 404: "404 Not Found" }[s] || s);

  /* ---------- code cards (all share one language choice) ---------- */
  const cards = [];
  function codeCard(el, { ep, params, custom, title = "request", response = true }) {
    const card = { el, ep, params, custom, title, response };
    cards.push(card);
    renderCard(card);
    el.addEventListener("click", e => {
      const t = e.target.closest("[data-lang]");
      if (t) { setLang(t.dataset.lang); return; }
      if (e.target.closest(".cc-copy")) copy(card.custom ? card.custom : snippet(lang, card.ep, card.params), "Code copied");
    });
    return card;
  }
  function renderCard(c) {
    const code = c.custom ?? snippet(lang, c.ep, c.params);
    const res = c.response && c.ep ? respond(c.ep, c.params) : null;
    c.el.innerHTML = `
      <div class="cc-bar">
        <span class="cc-dots" aria-hidden="true"><i></i><i></i><i></i></span>
        <span class="cc-title">${esc(c.title)}</span>
        <span class="cc-spacer"></span>
        ${c.custom ? "" : `<div class="cc-tabs" role="tablist" aria-label="Language">${LANGS.map(([k, l]) => `<button role="tab" data-lang="${k}" aria-selected="${k === lang}">${l}</button>`).join("")}</div>`}
        <button class="cc-copy" aria-label="Copy code" title="Copy"><svg><use href="#i-copy"/></svg></button>
      </div>
      <pre class="cc-pre req">${hl(code)}</pre>
      ${res ? `<div class="cc-label"><span>Response</span><span class="ok">${statusText(res.status)}</span></div><pre class="cc-pre res">${hlJSON(res.body)}</pre>` : ""}`;
  }
  function setLang(l) {
    if (l === lang) return;
    lang = l;
    cards.forEach(renderCard);
    if (pg.view !== "response") { pg.view = l; renderPgOut(); }
  }

  /* ---------- hero ---------- */
  codeCard($("#heroCode"), { ep: EP.projects, params: { country: "NG", category: "education", status: "active" }, title: "projects.http" });

  /* ---------- use cases ---------- */
  const USES = [
    { icon: "u-map", title: "Map the ecosystem", text: "Listings per country for any quarter, ready for a map or chart.", who: "For researchers and data teams", ep: "countries", params: { quarter: "2026-Q4" } },
    { icon: "u-chart", title: "Track growth over time", text: "New, removed and growth rate, quarter by quarter, since Q3 2024.", who: "For journalists and reports", ep: "growth", params: { from: "2026-Q1", to: "2026-Q4" } },
    { icon: "u-pin", title: "Find projects near you", text: "Every active project in a country, filtered by category.", who: "For apps and local directories", ep: "projects", params: { country: "KE", status: "active" } },
    { icon: "u-bell", title: "Follow what’s new", text: "The projects that joined in a quarter, for newsletters and bots.", who: "For community managers", ep: "changes", params: { quarter: "2026-Q4", type: "added" } }
  ];
  let useCard;
  function renderUses(active = 0) {
    $("#useList").innerHTML = USES.map((u, i) => `
      <button class="use" role="tab" aria-selected="${i === active}" data-i="${i}">
        <span class="u-ic"><svg><use href="#${u.icon}"/></svg></span>
        <span><h3>${u.title}</h3><p>${u.text}</p><span class="u-who">${u.who}</span></span>
      </button>`).join("");
    const u = USES[active];
    if (!useCard) useCard = codeCard($("#useCode"), { ep: EP[u.ep], params: u.params, title: EP[u.ep].path });
    else { Object.assign(useCard, { ep: EP[u.ep], params: u.params, title: EP[u.ep].path }); renderCard(useCard); }
    if (!reduceMotion) $("#useCode").animate([{ opacity: .4, transform: "translateY(6px)" }, { opacity: 1, transform: "none" }], { duration: 320, easing: "cubic-bezier(.22,1,.36,1)" });
  }
  $("#useList").addEventListener("click", e => { const b = e.target.closest(".use"); if (b) renderUses(+b.dataset.i); });
  renderUses(0);

  /* ---------- playground ---------- */
  const pg = { ep: "projects", params: { ...EP.projects.sample }, view: "response", last: null };

  function renderPgEndpoints() {
    $("#pgEndpoints").innerHTML = ENDPOINTS.map(e => `<button class="pg-ep" role="tab" data-ep="${e.id}" aria-selected="${e.id === pg.ep}">${e.title}<code>${e.path}</code></button>`).join("");
  }
  function renderPgParams() {
    const ep = EP[pg.ep];
    $("#pgParams").innerHTML = ep.params.filter(p => !p.hideInPlayground).map(p => {
      const v = pg.params[p.name] ?? "";
      const label = `<label for="pp-${p.name}">${p.name}${p.required ? "" : ""}<span>${p.type}</span></label>`;
      if (p.options) return `<div class="field">${label}<select id="pp-${p.name}" data-p="${p.name}">${p.options.map(([val, l]) => `<option value="${esc(val)}" ${String(val) === String(v) ? "selected" : ""}>${esc(l)}</option>`).join("")}</select></div>`;
      return `<div class="field">${label}<input id="pp-${p.name}" data-p="${p.name}" type="${p.input || "text"}" value="${esc(v)}" placeholder="${esc(p.placeholder || "")}"></div>`;
    }).join("");
    // reflect defaults chosen by the selects
    $$("#pgParams [data-p]").forEach(f => { if (f.tagName === "SELECT") pg.params[f.dataset.p] = f.value; });
    renderPgUrl();
  }
  function renderPgUrl() {
    const url = urlFor(EP[pg.ep], pg.params);
    const [base, qs] = url.split("?");
    $("#pgUrl").innerHTML = esc(base) + (qs ? `<span class="q">?${esc(qs)}</span>` : "");
  }
  function renderPgTabs() {
    const tabs = [["response", "Response"], ...LANGS];
    $("#pgLangs").innerHTML = tabs.map(([k, l]) => `<button role="tab" data-view="${k}" aria-selected="${k === pg.view}">${l}</button>`).join("") +
      `<button class="cc-copy" id="pgCopy" aria-label="Copy" title="Copy" style="margin-left:4px"><svg><use href="#i-copy"/></svg></button>`;
  }
  function renderPgOut() {
    renderPgTabs();
    const ep = EP[pg.ep], out = $("#pgOut");
    if (pg.view === "response") {
      out.innerHTML = pg.last ? hlJSON(pg.last.body) : `<span class="c">// Press “Send request” to see the response</span>`;
    } else out.innerHTML = hl(snippet(pg.view, ep, pg.params));
  }
  async function send() {
    const box = $(".pg-resp"), st = $("#pgStatus");
    box.classList.add("loading"); st.className = "status"; st.textContent = "Sending…";
    const t0 = performance.now();
    await new Promise(r => setTimeout(r, reduceMotion ? 0 : 220 + Math.random() * 200));
    pg.last = respond(EP[pg.ep], pg.params);
    const ms = Math.round(performance.now() - t0);
    box.classList.remove("loading");
    st.className = "status" + (pg.last.status === 200 ? " ok" : "");
    st.textContent = `${statusText(pg.last.status)} · ${ms} ms · preview`;
    pg.view = "response"; renderPgOut();
  }
  function selectEndpoint(id, params) {
    pg.ep = id; pg.params = { ...(params || EP[id].sample) }; pg.view = "response";
    renderPgEndpoints(); renderPgParams();
    send(); // show a real response straight away instead of an empty panel
  }
  $("#pgEndpoints").addEventListener("click", e => { const b = e.target.closest(".pg-ep"); if (b) selectEndpoint(b.dataset.ep); });
  $("#pgParams").addEventListener("input", e => {
    const f = e.target.closest("[data-p]"); if (!f) return;
    pg.params[f.dataset.p] = f.value; renderPgUrl();
    if (pg.view !== "response") renderPgOut();
  });
  $("#pgSend").addEventListener("click", send);
  $("#pgLangs").addEventListener("click", e => {
    if (e.target.closest("#pgCopy")) {
      const txt = pg.view === "response" ? (pg.last ? JSON.stringify(pg.last.body, null, 2) : "") : snippet(pg.view, EP[pg.ep], pg.params);
      if (txt) copy(txt, pg.view === "response" ? "Response copied" : "Code copied");
      return;
    }
    const b = e.target.closest("[data-view]"); if (!b) return;
    pg.view = b.dataset.view; renderPgOut();
  });
  $("#pgCopyUrl").addEventListener("click", () => copy(urlFor(EP[pg.ep], pg.params), "URL copied"));
  selectEndpoint("projects");

  /* ---------- docs: basics, quickstart, errors ---------- */
  $("#baseUrl").textContent = CONFIG.base;
  $("#rateTitle").textContent = `${CONFIG.ratePerMin} requests a minute`;

  const STEPS = [
    { h: "Make your first request", p: "Ask for two projects. Every list response has <code>data</code> (the results) and <code>meta</code> (the total and how to get more).", ep: "projects", params: { limit: "2" } },
    { h: "Filter it down", p: "Add filters to narrow the list. Here: every active project in Nigeria. Filters can be combined freely.", ep: "projects", params: { country: "NG", status: "active", limit: "5" } },
    { h: "Ask for the big picture", p: "<code>/growth</code> returns the same quarterly numbers as the growth tracker, so your charts match ours.", ep: "growth", params: { from: "2026-Q1", to: "2026-Q4" } },
    { h: "Page through everything", p: "Lists return up to 100 results at a time. Keep passing <code>meta.next_cursor</code> back as <code>cursor</code> until it comes back <code>null</code>.",
      custom: `let cursor = null;\nconst all = [];\n\ndo {\n  const url = new URL("${CONFIG.base}/projects");\n  url.searchParams.set("limit", "100");\n  if (cursor) url.searchParams.set("cursor", cursor);\n\n  const { data, meta } = await (await fetch(url)).json();\n  all.push(...data);\n  cursor = meta.next_cursor;\n} while (cursor);\n\nconsole.log(all.length, "projects");`, title: "paginate.js" }
  ];
  $("#steps").innerHTML = STEPS.map((s, i) => `<li class="step"><div><h4>${s.h}</h4><p>${s.p}</p></div><div class="codecard" id="step${i}"></div></li>`).join("");
  STEPS.forEach((s, i) => codeCard($(`#step${i}`), s.custom ? { custom: s.custom, title: s.title, response: false } : { ep: EP[s.ep], params: s.params, title: EP[s.ep].path }));

  $("#errorCode").innerHTML = `<div class="cc-bar"><span class="cc-dots" aria-hidden="true"><i></i><i></i><i></i></span><span class="cc-title">400 Bad Request</span></div><pre class="cc-pre res">${hlJSON(respond(EP.countries, { quarter: "Q4" }).body)}</pre>`;

  /* ---------- docs: endpoint reference ---------- */
  $("#reference").innerHTML = ENDPOINTS.map(ep => `
    <article class="doc reveal" id="ep-${ep.id}">
      <div class="ep">
        <div>
          <h3>${ep.title}</h3>
          <div class="ep-path"><span class="verb">GET</span><code>${esc(ep.path).replace(/\{(\w+)\}/, '<span class="v">{$1}</span>')}</code></div>
          <p>${ep.desc}</p>
          <h4>Parameters</h4>
          <div class="table-wrap"><table class="data fields"><tbody>
            ${ep.params.map(p => `<tr><td><code>${p.name}</code>${p.required ? '<span class="t-req">required</span>' : ""}<div class="t-type">${p.type}</div></td><td>${p.desc}</td></tr>`).join("")}
          </tbody></table></div>
          <button class="btn btn-ghost btn-sm ep-try" data-try="${ep.id}">Try it in the playground <svg class="arrow"><use href="#i-arrow"/></svg></button>
        </div>
        <div class="ep-code"><div class="codecard" id="code-${ep.id}"></div></div>
      </div>
    </article>`).join("");
  ENDPOINTS.forEach(ep => codeCard($(`#code-${ep.id}`), { ep, params: ep.sample, title: ep.path }));
  $("#reference").addEventListener("click", e => {
    const b = e.target.closest("[data-try]"); if (!b) return;
    selectEndpoint(b.dataset.try);
    $("#playground").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
  });
  $("#dnEndpoints").innerHTML = ENDPOINTS.map(ep => `<a href="#ep-${ep.id}"><span class="m">GET</span>${ep.nav}</a>`).join("");

  /* ---------- docs: data model ---------- */
  const FIELDS = [
    ["id", "string", "Stable id, e.g. sabi-wallet."],
    ["name", "string", "Project name as listed in the directory."],
    ["country", "string", "Country name, or Africa Wide for pan-African projects."],
    ["country_code", "string | null", "Two-letter code. null for pan-African projects."],
    ["region", "string | null", "East, West, Southern, Central or North (UN sub-regions)."],
    ["pan_african", "boolean", "true when the project serves the whole continent."],
    ["category", "string | null", "Directory category slug."],
    ["status", "string", "active, inactive or removed. See Statuses."],
    ["date_added", "date | null", "When it was added to the directory."],
    ["source", "string | null", "How we found it: directory_submission, infographic_comparison or directory_import."],
    ["first_listed", "quarter | null", "First quarter it appeared on the infographic."],
    ["removed_in", "quarter | null", "Quarter it dropped off, for removed projects."]
  ];
  $("#modelTable").innerHTML = `<thead><tr><th>Field</th><th>Type</th><th>Description</th></tr></thead><tbody>${FIELDS.map(([f, t, d]) => `<tr><td><code>${f}</code></td><td class="t-type">${t}</td><td>${d}</td></tr>`).join("")}</tbody>`;

  /* ---------- chrome: reveal, nav, docs scrollspy ---------- */
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { rootMargin: "0px 0px -6% 0px" });
  $$(".reveal").forEach(el => io.observe(el));
  const nav = $(".nav");
  const onScroll = () => nav.classList.toggle("stuck", scrollY > 8);
  addEventListener("scroll", onScroll, { passive: true }); onScroll();

  const docLinks = $$(".docs-nav a");
  const spy = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) docLinks.forEach(a => a.classList.toggle("active", a.getAttribute("href") === "#" + e.target.id));
  }), { rootMargin: "-30% 0px -60% 0px" });
  $$(".docs-body > .doc, #reference > .doc").forEach(el => spy.observe(el));

  const navLinks = $$(".nav-links a[href^='#']");
  const spy2 = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) navLinks.forEach(a => a.classList.toggle("active", a.getAttribute("href") === "#" + (e.target.id === "docs" ? "quickstart" : e.target.id)));
  }), { rootMargin: "-45% 0px -50% 0px" });
  ["build", "playground", "docs"].forEach(id => spy2.observe(document.getElementById(id)));

  /* ---------- hero panel illustration: dotted Africa ---------- */
  d3.json("assets/africa.geo.json").then(fc => {
    const W = 420, H = 448, step = 12;
    const proj = d3.geoMercator().fitExtent([[6, 6], [W - 6, H - 6]], { type: "MultiPoint", coordinates: [[-17.6, 37.4], [51.5, -34.9]] });
    const canvas = Object.assign(document.createElement("canvas"), { width: W, height: H });
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.beginPath(); d3.geoPath(proj, ctx)(fc); ctx.fill();
    const img = ctx.getImageData(0, 0, W, H).data;
    let s = `<svg viewBox="0 0 ${W} ${H}">`, row = 0;
    for (let y = step / 2; y < H; y += step * .88, row++)
      for (let x = step / 2 + (row % 2) * step / 2; x < W; x += step)
        if (img[((y | 0) * W + (x | 0)) * 4 + 3] > 200) s += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3.6" fill="#B85A04"/>`;
    $("#panelDots").innerHTML = s + "</svg>";
  }).catch(() => {});
})();
