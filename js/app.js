/* GLOOBAL Admin — the staff site.
   Part 1: sign in, Today, the audit log.
   Part 2 (0216): a door for everyone, a desk for each role, the Support desk
   answering people and shops live, and Team & roles.
   Every number here comes from the GLOOBAL API, live; nothing is stored on
   this device. What a role may see is decided by the server; the menu here
   only follows it. */
(function () {
  const $ = (s, el = document) => el.querySelector(s);
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const INT = new Intl.NumberFormat("en-IN");
  const IN2 = new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  // (CEL, Circular Energy Loop, is the unit the app called GEU until Nov 2026.
  // Only the name people read changed: the saved switch value "geu", the
  // .geu style and the guide topic key keep their old spelling.)
  // ── CEL ON EVERY FIGURE (0219) ──────────────────────────────────────
  // The app's rule, kept here too: CEL is the second name of a figure,
  // never a conversion, and never written without the currency it is in.
  //   Local:   18.4L₹ │ CEL      $4.1K │ USD
  //   CEL:     18.4L CEL │ ₹     4.1K CEL │ USD
  // Your own money is named by its symbol, anyone else's by its code. The
  // name you are reading in is the bigger one; the other is 75% — smaller,
  // not fainter. One switch (Local · CEL) in every screen's header.
  const CMP_IN = new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 1 });
  const CMP_EN = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });
  const SYM = { INR: ["₹", "after"], USD: ["$", "before"], GBP: ["£", "before"], EUR: ["€", "before"], JPY: ["¥", "before"], AED: ["AED", "code"], CNY: ["CNY", "code"] };
  const LENS_KEY = "gloobal.staff.lens.v1";
  let lens = "local";
  try { lens = localStorage.getItem(LENS_KEY) === "geu" ? "geu" : "local"; } catch (e) { /* this tab only */ }
  const setLens = (l) => { lens = l; try { localStorage.setItem(LENS_KEY, l); } catch (e) { /* */ } };
  const own = () => { const s = window.AdminApi.session(); return (s && s.admin && s.admin.currency) || "INR"; };
  function body(n, ccy, compact) {
    const a = Math.abs(Number(n) || 0);
    if (compact && a >= 1000) return (ccy === "INR" ? CMP_IN : CMP_EN).format(a).replace(/(\d)T$/, "$1K");
    const d = ccy === "JPY" || ccy === "KRW" ? 0 : 2;
    return new Intl.NumberFormat(ccy === "INR" ? "en-IN" : "en-US", { minimumFractionDigits: d, maximumFractionDigits: d }).format(a).replace(/\.00$/, "");
  }
  // The figure as two parts: what you read it in, and its other name.
  // 0228: the other name sits on the number, dimmed; the name you read in
  // follows the bar, bright — the same size. Your own money by its sign,
  // anyone else's by its code, and CEL on every figure (the app's rule).
  //   Local:   18.4L CEL │ ₹     4.1K CEL │ USD
  //   CEL:     18.4L₹ │ CEL      4.1K USD │ CEL
  function moneyParts(v, ccy = "INR", compact = true) {
    const code = String(ccy || "").toUpperCase();
    const n = Number(v) || 0, sign = n < 0 ? "−" : "";
    const b = body(n, code, compact);
    const [sym, pos] = SYM[code] || [code, "code"];
    const name = code === own() && pos !== "code" ? sym : code;
    const lead = lens === "geu" ? name : "CEL", trail = lens === "geu" ? "CEL" : name;
    const glue = /[A-Za-z]/.test(lead) ? " " : "";
    return { num: `${sign}${b}`, unit: lead, glue, lead: `${sign}${b}${glue}${lead}`, trail };
  }
  function money(v, ccy = "INR", compact = true) {
    const p = moneyParts(v, ccy, compact);
    return `<span class="num money">${esc(p.num)}<span class="unit">${p.glue ? "&nbsp;" : ""}${esc(p.unit)}</span><span class="geu">│ ${esc(p.trail)}</span></span>`;
  }
  const moneyText = (v, ccy, compact = true) => { const p = moneyParts(v, ccy, compact); return `${p.lead} │ ${p.trail}`; };
  const lensBtn = () => `<button type="button" class="unit-btn" data-lens aria-label="Read money in ${lens === "geu" ? "local currency" : "CEL"}"><b class="${lens === "local" ? "on" : ""}">Local</b> · <b class="${lens === "geu" ? "on" : ""}">CEL</b></button>`;
  const plural = (n, word) => `${INT.format(Number(n) || 0)} ${word}${Number(n) === 1 ? "" : "s"}`;
  const count = (n) => `<span class="num">${INT.format(Math.round(Number(n) || 0))}</span>`;
  const ago = (d) => { const s = Math.max(0, (Date.now() - new Date(d)) / 1000); if (s < 60) return "just now"; if (s < 3600) return `${Math.floor(s / 60)} min ago`; if (s < 86400) return `${Math.floor(s / 3600)} h ago`; return new Date(d).toLocaleDateString([], { day: "numeric", month: "short" }); };
  const clock = (d) => new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const I = (p) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
  const ICON = {
    today: I('<path d="M3 12h4l3 8 4-16 3 8h4"/>'),
    countries: I('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z"/>'),
    money: I('<rect x="2" y="6" width="20" height="13" rx="3"/><path d="M2 10h20M6 15h4"/>'),
    growth: I('<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>'),
    liquidity: I('<path d="M12 3c3.5 4.2 6 7.4 6 10.5a6 6 0 0 1-12 0C6 10.4 8.5 7.2 12 3z"/><path d="M9.5 14a2.5 2.5 0 0 0 2.5 2.5"/>'),
    shops: I('<path d="M4 10v10h16V10M3 4h18l-1.5 6h-15z"/><path d="M10 20v-5h4v5"/>'),
    risk: I('<path d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6z"/><path d="M12 8v5M12 16h.01"/>'),
    problems: I('<path d="M12 3 2 20h20L12 3z"/><path d="M12 10v4M12 17h.01"/>'),
    live: I('<circle cx="12" cy="12" r="2.5"/><path d="M7.8 7.8a6 6 0 0 0 0 8.4M16.2 7.8a6 6 0 0 1 0 8.4"/>'),
    system: I('<rect x="3" y="4" width="18" height="7" rx="2"/><rect x="3" y="13" width="18" height="7" rx="2"/><path d="M7 7.5h.01M7 16.5h.01"/>'),
    lookup: I('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>'),
    alerts: I('<path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4z"/><path d="M10 21h4"/>'),
    audit: I('<path d="M6 3h9l4 4v14H6z"/><path d="M9 11h7M9 15h7M9 7h4"/>'),
    more: I('<circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>'),
    refresh: I('<path d="M21 12a9 9 0 1 1-2.6-6.4"/><path d="M21 4v5h-5"/>'),
    sun: I('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>'),
    pay: I('<path d="M5 12h14M13 6l6 6-6 6"/>'),
    join: I('<circle cx="10" cy="8" r="4"/><path d="M3 21c1-4 4-6 7-6M18 14v6M15 17h6"/>'),
    complaint: I('<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>'),
    desk: I('<path d="M4 5h16v11H8l-4 4z"/><path d="M8 9h8M8 12h5"/>'),
    guide: I('<path d="M12 21a9 9 0 1 0-8-4.9L3 21l4.9-1A9 9 0 0 0 12 21z"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.4 2.3c-.6.3-.9.8-.9 1.4V14M12 17h.01"/>'),
    team: I('<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.5 3.4-5.5 6.5-5.5s5.7 2 6.5 5.5"/><path d="M17 11l1.5 1.5L22 9"/>'),
    phone: I('<rect x="6" y="2" width="12" height="20" rx="3"/><path d="M11 18h2"/>'),
    back: I('<path d="M15 18l-6-6 6-6"/>'),
    copy: I('<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/>'),
    key: I('<path d="M12 3a5 5 0 0 0-5 5v3M17 11V8a5 5 0 0 0-2-4"/><path d="M8 12c0 4 1.5 7 4 9M12 8a2 2 0 0 1 2 2c0 4-1 7-2.5 9.5M16 12c0 3-.6 5.3-1.6 7.4"/>'),
  };
  // Part 1 is live; the rest arrive part by part, in this order.
  const NAV = [
    ["today", "Today", null], ["desk", "Support desk", null], ["countries", "Countries", null], ["money", "Money & books", null], ["liquidity", "Liquidity", null], ["lookup", "Look up", null],
    ["growth", "Growth", null], ["shops", "Shops", null], ["problems", "Problems", null], ["risk", "Risk", null],
    ["live", "Live feed", null], ["guide", "Ask GLOOBAL", null], ["system", "Server & deploys", null], ["alerts", "Alerts", null], ["team", "Team & roles", null], ["audit", "Audit log", null],
  ];
  // Each role lands on its own desk and sees only its own menu. The server
  // enforces the same fence on every call; this only keeps the menu honest.
  const ROLES = {
    admin: { name: "Admin", tone: "var(--accent)", home: "today", what: "Everything, every country, every action. Decides who is on the team.", nav: NAV.map((n) => n[0]) },
    support: { name: "Support", tone: "#0F9D8A", home: "desk", what: "Answers people and shops. Sees an account with its balance and full number hidden; passes money questions to Finance and fraud to Risk.", nav: ["desk", "problems", "lookup", "guide", "shops", "live", "alerts"] },
    finance: { name: "Finance", tone: "#D98A00", home: "desk", what: "The books, pools, settlements between countries, bank payouts — and the questions Support passes to Finance.", nav: ["desk", "problems", "money", "liquidity", "countries", "lookup", "alerts"] },
    risk: { name: "Risk", tone: "#E23F45", home: "desk", what: "Signals, holds, reviews — and the questions Support passes to Risk.", nav: ["desk", "problems", "risk", "lookup", "countries", "shops", "live", "alerts"] },
    tech: { name: "Tech", tone: "#3B6EF5", home: "system", what: "Server, deploys, errors, background jobs. Sees no one's money or numbers.", nav: ["system", "live", "alerts"] },
  };
  const CAN = [
    ["See Today, all countries", ["admin"]],
    ["Answer people and shops", ["admin", "support", "finance", "risk"]],
    ["See every chat on the desk", ["admin", "support"]],
    ["See chats passed to them", ["admin", "support", "finance", "risk"]],
    ["Look up an account", ["admin", "support", "finance", "risk"]],
    ["See balances and full phone numbers", ["admin", "finance", "risk"]],
    ["See Countries", ["admin", "finance", "risk"]],
    ["See Money & books", ["admin", "finance"]],
    ["See Liquidity: members' balances, largest first", ["admin", "finance"]],
    ["Set a books gap aside", ["admin"]],
    ["Answer escalated complaints and bank cases", ["admin", "support", "finance", "risk"]],
    ["Propose sending money back", ["admin", "support", "finance"]],
    ["Approve sending money back (not your own proposal)", ["admin", "finance"]],
    ["Pause payments, bank payouts or a shop page", ["admin", "risk"]],
    ["Pause or cap payments between two countries", ["admin", "finance", "risk"]],
    ["Refresh exchange rates now", ["admin", "finance"]],
    ["See Growth", ["admin"]],
    ["See Shops", ["admin", "support", "risk"]],
    ["See Risk signals", ["admin", "risk"]],
    ["See the Live feed", ["admin", "support", "risk", "tech"]],
    ["See what people ask Ask GLOOBAL; edit its answers", ["admin", "support"]],
    ["Send a change about money to the app (not your own)", ["admin", "support"]],
    ["Choose your own phone alerts", ["admin", "support", "finance", "risk", "tech"]],
    ["See server, deploys, errors", ["admin", "tech"]],
    ["Add or remove people on the team", ["admin"]],
    ["Read the audit log", ["admin"]],
  ];
  const SOON = {
    countries: "Each country on its own, or two together: where the money sits, PayLater pools, what is waiting to settle each way, banks, Essentials locked, Creator Share.",
    money: "What GLOOBAL holds by currency, what moved it today, the books check per currency, pools and how long they last, banks, exchange rates.",
    liquidity: "Where members' balances sit: the largest holders, how much the top ten hold, the split by country, and who hid from the app's board.",
    lookup: "Any account by GLOOBAL ID, shop name or phone: balance, Essentials, shops, activity, notes; and the logged actions (hold, hold payouts, hide a page).",
    growth: "Sign-ups, who keeps paying week by week, where sign-ups stop, countries, referrals.",
    shops: "Every shop by takings, growth and complaints; how fast each answers; the name market.",
    problems: "Complaints, bank transfer problems, failed payments, refused sign-ups, server errors — and answering them.",
    risk: "Signals worth a look, with a score: fast money, new accounts, shared phones, shops with many complaints.",
    live: "Everything as it happens.",
    system: "Which version is live on Render and Netlify, how fast the server is, background jobs.",
    alerts: "What reaches your phone: books, server down, refused sign-ups, failing payments.",
  };
  const realRole = () => { const s = window.AdminApi.session(); return (s && s.admin && s.admin.role) || "admin"; };
  // Admin can look at the site as another role would (menu and what is
  // hidden); the server still answers as Admin.
  const ROLE = () => (realRole() === "admin" && S.viewAs ? S.viewAs : realRole());
  const roleNav = () => NAV.filter((n) => ROLES[ROLE()].nav.includes(n[0]));
  // Four on the phone's tab bar; "More" always holds the rest, alerts and sign out.
  const roleTabs = () => roleNav().map((n) => n[0]).slice(0, 4);
  const allowed = (k) => ROLES[ROLE()].nav.includes(k) || (k === "ticket" && ROLES[ROLE()].nav.includes("desk")) || (k === "account" && ROLES[ROLE()].nav.includes("lookup")) || (["country", "pair"].includes(k) && ROLES[ROLE()].nav.includes("countries")) || (["books", "settlements", "rates"].includes(k) && ROLES[ROLE()].nav.includes("money")) || (["complaint", "tcase"].includes(k) && ROLES[ROLE()].nav.includes("problems"));
  const rolePill = (r) => `<span class="pill" style="background:color-mix(in srgb, ${ROLES[r].tone} 14%, var(--surface));color:${ROLES[r].tone}">${ROLES[r].name}</span>`;
  const hideMoney = () => ["support", "tech"].includes(ROLE());

  const S = { stage: "door", id: "", pin: "", pre: null, preRole: null, setupCode: "", busy: false, error: "", today: null, todayAt: null, audit: null, more: false, loading: false,
    welcome: false, viewAs: null, dtab: null, desk: null, ticketId: null, ticket: null, draft: "", sending: false, passing: null, passNote: "", team: null, add: { id: "", role: "support" }, issued: null, confirmRemove: null,
    q: "", found: null, searching: false, accountId: null, account: null, alerts: "unknown",
    period: "today", cdata: null, iso: null, country: null, pairA: null, pairB: null, pairData: null, mdata: null, moneyCcy: null, booksCcy: null, books: null, aside: null, setlTab: "settled", setl: null, rates: null, corr: null, corrForm: null, sys: null, grow: null, shopsD: null, liqD: null, riskD: null, liveD: null, liveAfter: null, alertsD: null, alertsDraft: null,
    gdata: null, gdays: 7, gtab: "questions", gedit: null, gfilter: "",
    ptab: "escalated", problems: null, complaintId: null, complaint: null, caseRef: null, tcase: null, pdraft: "", pform: null, holds: null, holdForm: null };
  const route = () => {
    const h = (location.hash || "").slice(1);
    if (h.startsWith("ticket/")) { S.ticketId = decodeURIComponent(h.slice(7)); return "ticket"; }
    if (h.startsWith("account/")) { S.accountId = decodeURIComponent(h.slice(8)); return "account"; }
    if (h.startsWith("country/")) { S.iso = decodeURIComponent(h.slice(8)); return "country"; }
    if (h.startsWith("pair/")) { [S.pairA, S.pairB] = h.slice(5).split("/").map(decodeURIComponent); return "pair"; }
    if (h.startsWith("books/")) { S.booksCcy = decodeURIComponent(h.slice(6)); return "books"; }
    if (h === "settlements" || h === "rates") return h;
    if (h.startsWith("complaint/")) { S.complaintId = decodeURIComponent(h.slice(10)); return "complaint"; }
    if (h.startsWith("tcase/")) { S.caseRef = decodeURIComponent(h.slice(6)); return "tcase"; }
    return NAV.some((n) => n[0] === h) ? h : ROLES[ROLE()].home;
  };
  const go = (r) => { S.more = false; if (location.hash.slice(1) === r) render(); else location.hash = r; };

  /* ── pieces ── */
  const card = (title, right, body, cls = "") => `<section class="card ${cls}"><h3>${title}${right ? `<span class="muted">${right}</span>` : ""}</h3>${body}</section>`;
  const rows = (items) => `<div class="rows">${items.join("")}</div>`;
  const kv = (k, v, meta = "") => `<div class="row"><div class="grow"><div class="name">${k}</div>${meta ? `<div class="meta">${meta}</div>` : ""}</div><div class="amt">${v}</div></div>`;
  function columns(vals, avg, labels, top) {
    const max = Math.max(1, ...vals, ...(avg || [0])) * 1.08;
    const cols = vals.map((v) => `<span style="height:${(v / max) * 100}%" title="${INT.format(v)}"></span>`).join("");
    let line = "";
    if (avg && avg.length > 1) {
      const pts = avg.map((v, i) => `${((i + 0.5) / avg.length) * 100},${100 - (v / max) * 100}`).join(" ");
      line = `<svg class="over" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><polyline points="${pts}" fill="none" stroke="var(--ink-soft)" stroke-width="1.6" stroke-dasharray="4 3" vector-effect="non-scaling-stroke"/></svg>`;
    }
    return `<div class="chart"><span class="top-label num">${top}</span><div class="cols">${cols}</div>${line}<div class="ticks">${labels.map((l) => `<span>${l}</span>`).join("")}</div></div>`;
  }
  function delta(cur, avg) {
    if (!avg) return `<span class="delta muted">no days to compare yet</span>`;
    const p = Math.round(((cur - avg) / avg) * 100);
    return `<span class="delta ${p >= 0 ? "up" : "down"}">${p >= 0 ? "▲" : "▼"} ${Math.abs(p)}% vs 7-day average</span>`;
  }
  const header = (title, sub, extra = "", back = "") => `<div class="top">${back ? `<button type="button" class="icon-btn" data-go="${back}" aria-label="Back">${ICON.back}</button>` : ""}<h1>${title}<span class="sub">${sub}</span></h1>${extra}${lensBtn()}<button type="button" class="icon-btn" data-theme-toggle aria-label="Light or dark">${ICON.sun}</button></div>`;

  /* ── sign in ── */
  const SYMBOLS = ["−", "+", "×", "=", "○", "□", "●", "■"];
  function viewDoor() {
    return `<div class="gate"><div class="door"><div class="door-brand"><span class="brand-mark">G</span><div><b>GLOOBAL</b><span>Each person comes in through their own door</span></div></div>
      <div class="doors">
        <a class="door-card" href="${esc(window.GLOOBAL_ADMIN.appUrl || "https://gloobalv3.netlify.app")}" rel="noopener"><span class="door-ic" style="background:var(--accent-soft);color:var(--accent)">${ICON.phone}</span><b>I use GLOOBAL</b><span>Pay, receive, GLOOBAL Bank, My Essentials. In the GLOOBAL app.</span><em>Open the app ›</em></a>
        <a class="door-card" href="${esc(window.GLOOBAL_ADMIN.appUrl || "https://gloobalv3.netlify.app")}" rel="noopener"><span class="door-ic" style="background:var(--warn-soft);color:var(--warn)">${ICON.shops}</span><b>I run a shop</b><span>Your shops, takings and codes. In the app, on the creator side.</span><em>Open the app ›</em></a>
        <div class="door-card help"><span class="door-ic" style="background:var(--good-soft);color:var(--good)">${ICON.desk}</span><b>I need help</b><span>In the app: Profile → Help &amp; Support. Answers first, then a chat with a person at GLOOBAL. A problem with one payment: Profile → Complaints &amp; reports.</span></div>
        <button type="button" class="door-card staff" data-gate="id"><span class="door-ic" style="background:rgba(255,255,255,.16);color:#fff">${ICON.key}</span><b>I work at GLOOBAL</b><span>Sign in with your GLOOBAL ID, PIN and passkey. You land on your own desk.</span><em>Sign in ›</em></button>
      </div></div></div>`;
  }
  function viewWelcome() {
    const s = window.AdminApi.session(), r = realRole(), R0 = ROLES[r];
    const first = String((s.admin && s.admin.name) || "").split(" ")[0];
    const ic = { admin: "today", support: "desk", finance: "money", risk: "risk", tech: "system" }[r];
    return `<div class="gate"><div class="gate-card"><div class="welcome"><span class="door-ic big" style="background:color-mix(in srgb, ${R0.tone} 14%, var(--surface));color:${R0.tone}">${ICON[ic]}</span><span class="eyebrow">Welcome${first ? `, ${esc(first)}` : ""}</span><h1>You're on ${R0.name}</h1><p>${R0.what}</p></div><div class="note"><b>Your desk</b><br>${R0.nav.map((k) => NAV.find((n) => n[0] === k)[1]).join(" · ")}</div><button type="button" class="btn" data-enter>Go to my desk</button></div></div>`;
  }
  function viewGate() {
    if (S.stage === "door") return viewDoor();
    const step = S.stage === "id" ? 1 : S.stage === "pin" ? 2 : 3;
    const pad = (attr) => `<div class="keypad">${["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"].map((d) => d ? `<button type="button" ${attr}="${d}" aria-label="${d === "⌫" ? "Delete" : d}">${d}</button>` : "<span></span>").join("")}</div>`;
    const ids = Array.from(S.id);
    let body = "";
    if (S.stage === "id") body = `<label class="eyebrow" for="gid">Your GLOOBAL ID</label><div class="symbols" aria-hidden="true">${Array.from({ length: 12 }, (_, i) => `<span>${esc(ids[i] || "")}</span>`).join("")}</div><input id="gid" class="id-input" value="${esc(S.id)}" placeholder="Paste it here, or tap the symbols below" autocomplete="username" spellcheck="false"><div class="sympad">${SYMBOLS.map((s) => `<button type="button" data-sym="${s}">${s}</button>`).join("")}<button type="button" data-sym="⌫" aria-label="Delete">⌫</button></div><button type="button" class="btn" data-next ${ids.length === 12 ? "" : "disabled"}>Continue</button>`;
    if (S.stage === "pin") body = `<div class="eyebrow" style="text-align:center">Enter your GLOOBAL PIN</div><div class="dots">${[0, 1, 2, 3, 4, 5].map((i) => `<i class="${i < S.pin.length ? "on" : ""}"></i>`).join("")}</div>${pad("data-key")}<button type="button" class="linkbtn" data-back-id>Use a different GLOOBAL ID</button>`;
    const codeFrom = S.preRole && S.preRole !== "admin" ? "the one-time code the founder gave you when you were added" : "the setup code from Render (ADMIN_SETUP_CODE)";
    if (S.stage === "setup") body = `<div class="passkey">${ICON.key}</div><h2 style="text-align:center;font-size:18px">Make your passkey</h2><p class="muted" style="margin:0;font-size:12.5px;font-weight:600;text-align:center;line-height:1.5">First time on this site: type ${codeFrom}. This device then keeps a passkey for the GLOOBAL staff site, unlocked by your fingerprint, face or screen lock.</p><input id="setup" class="id-input" type="password" value="${esc(S.setupCode)}" placeholder="Setup code" autocomplete="off"><button type="button" class="btn" data-setup ${S.setupCode ? "" : "disabled"}>Make the passkey</button>`;
    if (S.stage === "passkey") body = `<div class="passkey">${ICON.key}</div><h2 style="text-align:center;font-size:18px">Confirm it's you</h2><p class="muted" style="margin:0;font-size:12.5px;font-weight:600;text-align:center">With the admin passkey on this device.</p><button type="button" class="btn" data-passkey>Use passkey</button>`;
    return `<div class="gate"><div class="gate-card"><button type="button" class="linkbtn" data-gate="door" style="align-self:flex-start;padding:0">‹ All doors</button><div class="gate-head"><span class="eyebrow">GLOOBAL · Team</span><h1>Sign in to your desk</h1><p>Support, Finance, Risk, Tech and Admin each land on their own desk. Sessions last 8 hours, and every view and action is logged.</p></div><div class="steps">${[1, 2, 3].map((i) => `<i class="${i <= step ? "on" : ""}"></i>`).join("")}</div>${body}${S.busy ? '<p class="muted" role="status" style="text-align:center;font-weight:700;margin:0">One moment…</p>' : ""}${S.error ? `<div class="note err" role="alert">${esc(S.error)}</div>` : ""}</div></div>`;
  }

  /* ── Today ── */
  function viewToday() {
    const d = S.today;
    const refresh = `<button type="button" class="icon-btn" data-refresh aria-label="Refresh">${ICON.refresh}</button>`;
    const sub = S.todayAt ? `${new Date().toLocaleDateString([], { weekday: "long", day: "numeric", month: "long" })} · updated ${clock(S.todayAt)}` : "Loading…";
    if (!d) return header("Today", sub, refresh) + (S.error ? `<div class="note err">${esc(S.error)}</div>` : `<section class="card"><p class="muted" style="font-weight:700">Adding up today…</p></section>`);
    const k = d.kpis;
    const tiles = [
      ["Sign-ups", count(k.signups.today), delta(k.signups.today, k.signups.avg7)],
      ["Payments", count(k.payments.today), delta(k.payments.today, k.payments.avg7)],
      ["Paid in all", money(k.paidInr.today), delta(k.paidInr.today, k.paidInr.avg7)],
      ["People who paid", count(k.peoplePaid.today), `<span class="delta muted">${INT.format(k.accounts)} accounts in all</span>`],
      ["Shops", count(k.shops), `<span class="delta muted">with a name</span>`],
      ["Open problems", count(k.openProblems.total), `<span class="delta ${k.openProblems.total ? "down" : "muted"}">${k.openProblems.complaints} complaints · ${k.openProblems.transfers} bank</span>`],
    ];
    const hours = d.hourly.today.length;
    const labels = hours > 12 ? ["12 am", "6 am", "12 pm", hours > 18 ? "6 pm" : ""].filter(Boolean) : ["12 am", hours > 6 ? "6 am" : ""].filter(Boolean);
    const flagText = (f) => (f.kind === "books" && d.books && d.books.off ? { title: `The books are off by ${money(Math.abs(d.books.differenceInr), "INR")} at today's rates`, detail: d.books.off.slice(0, 6).map((o) => `${esc(o.currency)} ${moneyText(o.difference, o.currency)}`).join(" · "), raw: true } : f);
    const flags = d.flags.length ? `<div class="flags">${d.flags.map((f0) => flagText(f0)).map((f) => `<div class="flag" style="--sev:var(--${f.tone === "bad" ? "bad" : "warn"})"><span class="pill ${f.tone === "bad" ? "bad" : "warn"}">${esc(f.kind)}</span><span class="t">${f.raw ? f.title : esc(f.title)}<small>${f.raw ? f.detail : esc(f.detail || "")}</small></span></div>`).join("")}</div>` : `<div class="flags"><div class="flag" style="--sev:var(--good)"><span class="pill good">All clear</span><span class="t">Nothing needs you right now<small>books, complaints and bank transfers checked</small></span></div></div>`;
    const b = d.books;
    const books = b ? card("Does the money add up?", b.checkedAt ? `checked ${clock(b.checkedAt)}` : "", b.ok ? `<p style="font-weight:800;color:var(--good);margin:10px 0 0">Yes, exactly.</p>` : `${rows(b.off.slice(0, 6).map((o) => kv(esc(o.currency), `<span class="${o.difference < 0 ? "down" : "up"}">${o.difference > 0 ? "+" : ""}${money(o.difference, o.currency, false)}</span>`)))}<p class="muted" style="font-size:12px;font-weight:600;margin:10px 0 0">In all, ${money(Math.abs(b.differenceInr))} ${b.differenceInr < 0 ? "short" : "over"} at today's rates.</p>`) : card("Does the money add up?", "", `<p class="muted">The books check did not answer.</p>`);
    const ev = { pay: ["var(--accent-soft)", "var(--accent)"], join: ["var(--good-soft)", "var(--good)"], complaint: ["var(--bad-soft)", "var(--bad)"] };
    const recent = card("Latest", "", rows(d.recent.map((e) => `<div class="row"><span class="ev" style="background:${ev[e.kind][0]};color:${ev[e.kind][1]}">${ICON[e.kind] || ICON.pay}</span><div class="grow"><div class="name">${esc(e.title)}</div><div class="meta">${ago(e.at)}${e.status ? ` · ${esc(e.status)}` : ""}</div></div>${e.amount ? `<div class="amt">${money(e.amount, e.currency, false)}</div>` : ""}</div>`)) || '<p class="muted">Nothing yet.</p>');
    return header("Today", sub, refresh) + flags +
      `<div class="kpis">${tiles.map(([a, v, dd]) => `<div class="kpi" style="cursor:default"><span class="label">${a}</span><span class="val">${v}</span>${dd}</div>`).join("")}</div>` +
      `<div class="grid g2">` +
      card("Payments by hour", "today vs 7-day average", columns(d.hourly.today, d.hourly.avg7, labels, `peak ${Math.max(0, ...d.hourly.today)}`) + `<div class="legend"><span><i style="background:var(--accent)"></i>Today · ${INT.format(k.payments.today)}</span><span><i style="background:none;border-top:2px dashed var(--ink-soft);height:0;border-radius:0"></i>7-day average · ${INT.format(Math.round(k.payments.avg7))}</span></div>`, "span2") +
      books +
      card("Banks", "today, in rupees", rows([kv("Added from banks", money(k.bankInr.in)), kv("Sent to banks", money(k.bankInr.out)), kv("On the way", money(k.bankInr.onTheWay))])) +
      recent +
      card("Server", "", rows([kv("Version live on Render", d.server.commit ? `<span class="num">${esc(d.server.commit.slice(0, 7))}</span>` : '<span class="muted">not reported</span>'), kv("Running since", esc(new Date(d.server.startedAt).toLocaleString([], { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })))])) +
      `</div>`;
  }
  function viewAudit() {
    const r = S.audit;
    return header("Audit log", "Every view and action on the admin site. Nothing here can be edited.") +
      (r ? `<section class="card"><div class="table-wrap"><table><thead><tr><th>When</th><th>What</th><th>Result</th><th>Detail</th><th>From</th></tr></thead><tbody>${r.map((x) => `<tr><td class="muted">${esc(new Date(x.at).toLocaleString([], { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }))}</td><td><b>${esc(x.action)}</b></td><td><span class="pill ${x.status === "success" || x.status === "info" ? "good" : x.status === "blocked" ? "bad" : "warn"}">${esc(x.status)}</span></td><td>${esc(x.message)}</td><td class="muted">${esc(x.ip)}</td></tr>`).join("")}</tbody></table></div></section>` : `<section class="card"><p class="muted" style="font-weight:700">Loading…</p></section>`);
  }
  function viewSoon(key) {
    const [, label, part] = NAV.find((n) => n[0] === key);
    const liveNow = roleNav().filter((n) => !n[2]).map((n) => n[1]).join(", ");
    return header(label, `Coming in part ${part}`) + `<section class="card soon"><span class="pill info">Part ${part}</span><p>${esc(SOON[key])}</p><p class="muted">Live now on your desk: ${esc(liveNow)}.</p></section>`;
  }

  /* ── the Support desk (0216) ── */
  const TOPIC_TONE = { payment: "accent", bank: "accent", essentials: "good", shop: "warn", account: "accent", other: "accent" };
  const line = (k, v) => `<div class="line"><span>${k}</span><b>${v}</b></div>`;
  const deskTabs = () => (["finance", "risk"].includes(realRole())
    ? [["passed", "Passed to me"], ["mine", "Mine"], ["waiting", "Waiting on them"], ["done", "Done"]]
    : [["new", "New"], ["mine", "Mine"], ["waiting", "Waiting on them"], ["passed", "Passed on"], ["done", "Done"]]);
  function viewDesk() {
    const d = S.desk;
    const tabs = deskTabs();
    const tab = S.dtab || (d && d.tab) || tabs[0][0];
    const passedOnly = ["finance", "risk"].includes(realRole());
    const sub = passedOnly ? `What Support passed to ${ROLES[realRole()].name}, oldest first` : "People and shops who asked for help, oldest first";
    const refresh = `<button type="button" class="icon-btn" data-desk-refresh aria-label="Refresh">${ICON.refresh}</button>`;
    if (!d) return header("Support desk", sub, refresh) + (S.error ? `<div class="note err">${esc(S.error)}</div>` : `<section class="card"><p class="muted" style="font-weight:700">Loading the desk…</p></section>`);
    const late = d.conversations.filter((c) => c.late).length;
    const fr = d.stats.firstReplyMinutes;
    const tiles = passedOnly
      ? [["Passed to me", d.counts.passed, "not done yet"], ["Mine", d.counts.mine, "open"], ["Answered today", d.stats.answeredToday, "first replies"]]
      : [["New", d.counts.new, late ? `${late} waiting over an hour` : "none waiting long"], ["Mine", d.counts.mine, "open"], ["First reply", fr === null ? "—" : fr < 60 ? `${fr} min` : `${Math.round(fr / 6) / 10} h`, "average today · aim 30 min"], ["Answered today", d.stats.answeredToday, `${d.counts.passed} passed on`]];
    const pill = (c) => c.status === "done" ? '<span class="pill good">done</span>' : c.status === "waiting" ? '<span class="pill quiet">waiting on them</span>' : c.late ? '<span class="pill bad">over an hour</span>' : c.passedTo ? `<span class="pill warn">with ${esc(ROLES[c.passedTo] ? ROLES[c.passedTo].name : c.passedTo)}</span>` : c.status === "new" ? '<span class="pill info">new</span>' : '<span class="pill info">open</span>';
    const rowsHtml = d.conversations.map((c) => `<button type="button" class="ticket" data-ticket="${esc(c.id)}"><span class="av" style="background:${c.side === "shop" ? "var(--warn-soft)" : "var(--accent-soft)"};color:${c.side === "shop" ? "var(--warn)" : "var(--accent)"}">${esc(String(c.who || "?")[0])}</span><span class="grow"><span class="name">${esc(c.topicWords)}${c.mine ? ' <span class="muted" style="font-weight:700">· yours</span>' : ""}</span><span class="meta">${esc(c.who)} · ${c.side === "shop" ? "shop" : "person"} · ${esc(c.ref)} · ${ago(c.lastActivityAt)}</span><span class="preview">${c.lastFrom === "staff" ? "You: " : ""}${esc(c.preview)}</span></span>${pill(c)}</button>`).join("");
    return header("Support desk", sub, refresh) +
      `<div class="kpis" style="grid-template-columns:repeat(auto-fit,minmax(150px,1fr))">${tiles.map(([a, b, c]) => `<div class="kpi" style="cursor:default"><span class="label">${a}</span><span class="val num">${typeof b === "number" ? INT.format(b) : esc(b)}</span><span class="delta muted">${esc(c)}</span></div>`).join("")}</div>` +
      `<div class="tabs" role="group" aria-label="Which chats">${tabs.map(([k, l]) => `<button type="button" data-dtab="${k}" aria-pressed="${tab === k}">${l} <b>${INT.format(d.counts[k] || 0)}</b></button>`).join("")}</div>` +
      `<section class="card airy">${rowsHtml || `<p class="muted" style="font-weight:700;margin:0">${tab === "new" ? "Nobody is waiting. New questions from the app land here." : "Nothing here."}</p>`}</section>`;
  }
  const QUICK = ["Checking this now — I'll write back here.", "Can you tell me who you paid, how much, and when?", "Found it — it's coming back to your balance.", "Fixed — please try again."];
  function viewTicket() {
    const t = S.ticket;
    const back = `<button type="button" class="icon-btn" data-go="desk" aria-label="Back to the desk">${ICON.back}</button>`;
    if (!t || t.id !== S.ticketId) return `<div class="top">${back}<h1>Opening…<span class="sub">${esc(S.ticketId || "")}</span></h1></div>` + (S.error ? `<div class="note err">${esc(S.error)}</div>` : "");
    const cx = t.customer;
    const first = esc(String(cx.name || "").split(" ")[0] || "them");
    const bubbles = t.messages.map((m) => {
      if (m.from === "system") return `<div class="sysline">${esc(m.text)} · ${clock(m.at)}</div>`;
      if (m.internal) return `<div class="bub note-int"><p>${esc(m.text)}</p><em>${esc(m.name || "Team")} · note for the team · only staff see this · ${clock(m.at)}</em></div>`;
      const us = m.from === "staff";
      return `<div class="bub ${us ? "us" : ""}"><p>${esc(m.text)}</p><em>${us ? `${esc(m.name || "GLOOBAL")}, GLOOBAL Support` : first} · ${ago(m.at)}</em></div>`;
    }).join("");
    const hidden = hideMoney();
    const pays = cx.recentPayments.length ? cx.recentPayments.map((p) => `<div class="line"><span>${p.out ? "Paid" : "From"} ${esc(p.other)} · ${ago(p.at)}</span><b>${hidden && realRole() === "admin" ? '<span class="muted">hidden</span>' : money(p.amount, p.currency, false)}</b></div>`).join("") : '<p class="muted" style="font-weight:600;font-size:12.5px;margin:6px 0 0">No payments yet.</p>';
    const balance = hidden || cx.balance === null ? `<span class="muted">hidden for ${ROLES[ROLE()].name}</span>` : money(cx.balance, "INR", false);
    const phone = hidden && realRole() === "admin" ? '<span class="muted">hidden</span>' : esc(cx.phone || "—");
    const passTo = [["finance", "Refund or payout"], ["risk", "Looks like fraud"], ["admin", "Needs the founder"]].filter(([r]) => r !== realRole());
    const passing = S.passing ? `<div class="note" style="margin-top:10px"><b>Pass to ${ROLES[S.passing].name}</b><textarea id="passnote" placeholder="What they need to know (only staff see this)" style="width:100%;min-height:54px;border-radius:12px;border:1.5px solid var(--line);background:var(--surface);padding:8px 10px;font:inherit;color:var(--ink);margin-top:8px">${esc(S.passNote)}</textarea><div style="display:flex;gap:8px;margin-top:8px"><button type="button" class="btn" data-pass-confirm style="flex:1">Pass it on</button><button type="button" class="btn quiet" data-pass-cancel style="flex:1">Cancel</button></div></div>` : "";
    const done = t.status === "done";
    return `<div class="top">${back}<h1>${esc(t.topicWords)}<span class="sub">${esc(cx.shop || cx.name)} · ${t.side === "shop" ? "shop" : "person"} · ${esc(t.ref)}</span></h1>${t.status === "done" ? '<span class="pill good">done</span>' : t.status === "waiting" ? '<span class="pill quiet">waiting on them</span>' : t.passedTo ? `<span class="pill warn">with ${ROLES[t.passedTo].name}</span>` : ""}${lensBtn()}</div>` +
      `<div class="grid g2 tgrid"><section class="card airy chat" aria-label="The chat">${bubbles}
        ${done ? '<p class="muted" style="font-size:12.5px;font-weight:700;margin:4px 0 0">Marked done. If they write again it comes back to the desk.</p>' : ""}
        <div class="chips" style="margin-top:6px">${QUICK.map((q) => `<button type="button" class="chip" data-quick="${esc(q)}">${esc(q)}</button>`).join("")}</div>
        <label class="eyebrow" for="reply" style="margin-top:10px">Write to ${first}</label>
        <textarea id="reply" maxlength="1000" placeholder="They see this in the app, with a notice" style="width:100%;min-height:80px;border-radius:14px;border:1.5px solid var(--line);background:var(--surface);padding:10px 12px;font:inherit;color:var(--ink)">${esc(S.draft)}</textarea>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px"><button type="button" class="btn" data-send style="flex:2" ${S.sending ? "disabled" : ""}>Send</button><button type="button" class="btn quiet" data-send-wait style="flex:1" title="Send, then wait on them" ${S.sending ? "disabled" : ""}>Send &amp; wait</button><button type="button" class="btn quiet" data-note style="flex:1" title="Only staff see it" ${S.sending ? "disabled" : ""}>Team note</button></div></section>
      <section class="card airy">${cx.payment ? `<div class="aboutpay"><div class="eyebrow">About this payment</div>${payRow(cx.payment)}<div class="meta">${esc(cx.payment.referenceId || "")}${cx.payment.complaint ? ` · complaint ${esc(cx.payment.complaint.ref)} (${esc(cx.payment.complaint.status)})` : " · no complaint on it"}</div></div>` : ""}<h3>${esc(cx.name)}<span class="muted">${t.side === "shop" ? `shop${cx.shop ? ` · ${esc(cx.shop)}` : ""}` : "person"}</span></h3>${line("Country", esc(cx.country || "—"))}${line("With GLOOBAL since", cx.since ? esc(new Date(cx.since).toLocaleDateString([], { month: "short", year: "numeric" })) : "—")}${line("Phone", phone)}${line("Balance", balance)}
        ${cx.symbolId && allowed("lookup") ? `<button type="button" class="btn quiet" data-account="${esc(cx.symbolId)}" style="width:100%;margin-top:12px">Open their account</button>` : ""}
        <div class="eyebrow" style="margin-top:16px">Their last payments</div>${pays}
        ${hidden ? `<p class="muted" style="font-size:11.5px;font-weight:600;margin:10px 0 0">Hidden for ${ROLES[ROLE()].name}: the balance and the full phone number. Pass it to Finance when money needs checking.</p>` : ""}
        <div class="eyebrow" style="margin-top:16px">Pass it on</div><div class="chips" style="margin-top:8px">${passTo.map(([r, why]) => `<button type="button" class="chip" data-pass="${r}" aria-pressed="${S.passing === r}">${ROLES[r].name} · ${why}</button>`).join("")}</div>${passing}
        <div style="display:flex;gap:8px;margin-top:14px">${done ? '<button type="button" class="btn quiet" data-status="open" style="flex:1">Open it again</button>' : `<button type="button" class="btn quiet" data-status="waiting" style="flex:1">Waiting on them</button><button type="button" class="btn quiet" data-status="done" style="flex:1">Mark done</button>`}</div></section></div>`;
  }

  /* ── Look up (0218) ── */
  const STATUS_TONE = { success: "good", credited: "good", solved: "good", done: "good", processing: "warn", pending: "warn", open: "warn", replied: "info", new: "info", waiting: "quiet", returned: "bad", failed: "bad", escalated: "bad", cancelled: "quiet", refunded: "quiet", reversed: "quiet" };
  const statusPill = (st) => `<span class="pill ${STATUS_TONE[st] || "quiet"}">${esc(st)}</span>`;
  function payRow(p) {
    return `<div class="row"><span class="ev" style="background:${p.out ? "var(--accent-soft)" : "var(--good-soft)"};color:${p.out ? "var(--accent)" : "var(--good)"}">${p.out ? "↑" : "↓"}</span><div class="grow"><div class="name">${p.out ? "Paid" : "From"} ${esc(p.other)}</div><div class="meta">${ago(p.at)}${p.status !== "success" ? ` · ${esc(p.status)}` : ""}</div></div><div class="amt">${money(p.amount, p.currency, false)}</div></div>`;
  }
  function viewLookup() {
    const f = S.found;
    const results = !f ? `<p class="muted" style="font-weight:600;margin:0">Type a GLOOBAL ID (or its first symbols), a shop or a person's name, or at least 6 digits of a phone number.</p>`
      : f.length ? f.map((r) => `<button type="button" class="ticket" data-account="${esc(r.symbolId)}"><span class="av" style="background:${r.shop ? "var(--warn-soft)" : "var(--accent-soft)"};color:${r.shop ? "var(--warn)" : "var(--accent)"}">${esc((r.name || r.shop || "?")[0])}</span><span class="grow"><span class="name">${esc(r.shop || r.name || "—")}${r.shop && r.name ? ` <span class="muted" style="font-weight:700">· ${esc(r.name)}</span>` : ""}</span><span class="meta">${esc(r.symbolId)} · ${esc(r.country)} · since ${esc(new Date(r.since).toLocaleDateString([], { month: "short", year: "numeric" }))}${r.isShop ? " · a shop on another account" : ""}</span></span></button>`).join("")
      : `<p class="muted" style="font-weight:700;margin:0">Nobody matches "${esc(S.q)}".</p>`;
    return header("Look up", "Any account by GLOOBAL ID, shop, name or phone. Every search is logged.") +
      `<section class="card airy"><form class="searchbar" data-search><input id="q" class="id-input" type="search" value="${esc(S.q)}" placeholder="GLOOBAL ID, shop, name or phone" autocomplete="off" spellcheck="false" aria-label="Search accounts"><button type="submit" class="btn" ${S.searching ? "disabled" : ""}>${S.searching ? "Looking…" : "Search"}</button></form><div style="margin-top:12px">${results}</div></section>`;
  }
  function viewAccount() {
    const a = S.account;
    const back = `<button type="button" class="icon-btn" data-go="lookup" aria-label="Back to Look up">${ICON.back}</button>`;
    if (!a || a.symbolId !== S.accountId) return `<div class="top">${back}<h1>Opening…<span class="sub">${esc(S.accountId || "")}</span></h1></div>` + (S.error ? `<div class="note err">${esc(S.error)}</div>` : "");
    const hidden = hideMoney();
    const balance = hidden || a.balance === null ? `<span class="muted">hidden for ${ROLES[ROLE()].name}</span>` : money(a.balance, "INR", false);
    const phone = hidden && realRole() === "admin" ? '<span class="muted">hidden</span>' : esc(a.phone || "—");
    const list = (items, empty) => items.length ? `<div class="rows">${items.join("")}</div>` : `<p class="muted" style="font-weight:600;font-size:12.5px;margin:6px 0 0">${empty}</p>`;
    const canDesk = allowed("desk");
    return `<div class="top">${back}<h1>${esc(a.shop || a.name || "—")}<span class="sub">${a.shop && a.name ? `${esc(a.name)} · ` : ""}${esc(a.symbolId)}</span></h1>${lensBtn()}</div>` +
      `<div class="kpis" style="grid-template-columns:repeat(auto-fit,minmax(150px,1fr))">${[["Paid, 30 days", count(a.last30.paid), "payments sent"], ["Received, 30 days", count(a.last30.received), "payments in"], ["Chats with Support", count(a.chats.length), a.chats.filter((c) => c.status !== "done").length ? `${a.chats.filter((c) => c.status !== "done").length} open` : "none open"], ["Complaints", count(a.complaints.length), a.complaints.filter((c) => !["solved", "returned"].includes(c.status)).length ? "some open" : "none open"]].map(([l, v, d]) => `<div class="kpi" style="cursor:default"><span class="label">${l}</span><span class="val">${v}</span><span class="delta muted">${esc(d)}</span></div>`).join("")}</div>` +
      `<div class="grid g2 tgrid">` +
      `<section class="card airy"><h3>Who they are<span class="muted">${a.shop ? "creator" : "person"}</span></h3>${line("Country", esc(a.country || "—"))}${line("With GLOOBAL since", esc(new Date(a.since).toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" })))}${line("Phone", phone)}${line("Balance", balance)}${a.owner ? line("A shop of", `<button type="button" class="linkbtn" data-account="${esc(a.owner.symbolId)}" style="padding:0">${esc(a.owner.name)}</button>`) : ""}${a.referredBy ? line("Joined with", `<button type="button" class="linkbtn" data-account="${esc(a.referredBy.symbolId)}" style="padding:0">${esc(a.referredBy.name)}</button>`) : ""}${a.shops.length ? `<div class="eyebrow" style="margin-top:14px">Their shops</div><div class="chips" style="margin-top:6px">${a.shops.map((s) => `<button type="button" class="chip" data-account="${esc(s.symbolId)}">${esc(s.name)}</button>`).join("")}</div>` : ""}${hidden ? `<p class="muted" style="font-size:11.5px;font-weight:600;margin:10px 0 0">Hidden for ${ROLES[ROLE()].name}: the balance and the full phone number.</p>` : ""}</section>` +
      holdsCard() +
      `<section class="card airy"><h3>Last payments<span class="muted">${a.payments.length}</span></h3>${list(a.payments.map(payRow), "No payments yet.")}</section>` +
      `<section class="card airy"><h3>GLOOBAL Bank</h3>${list(a.bankTransfers.map((t) => `<div class="row"><div class="grow"><div class="name">${t.direction === "in" ? "Added from" : "Sent to"} ${esc(t.method.toUpperCase())}</div><div class="meta">${ago(t.at)}${t.returnReason ? ` · ${esc(t.returnReason)}` : ""}</div></div>${statusPill(t.status)}<div class="amt">${money(t.amount, t.currency, false)}</div></div>`), "No bank transfers.")}</section>` +
      `<section class="card airy"><h3>Chats and complaints</h3>${list([...a.chats.map((c) => `<${canDesk ? `button type="button" data-ticket="${esc(c.id)}"` : "div"} class="row" style="width:100%;border:none;background:none;text-align:left;font:inherit;color:inherit;${canDesk ? "cursor:pointer" : ""}"><div class="grow"><div class="name">Chat ${esc(c.ref)} · ${esc(c.topic)}</div><div class="meta">${ago(c.at)}${c.passedTo ? ` · with ${esc(ROLES[c.passedTo] ? ROLES[c.passedTo].name : c.passedTo)}` : ""}</div></div>${statusPill(c.status)}</${canDesk ? "button" : "div"}>`), ...a.complaints.map((c) => `<div class="row"><div class="grow"><div class="name">Complaint ${esc(c.ref)} · ${esc(String(c.reason).replace(/_/g, " "))}</div><div class="meta">${c.reported ? "they reported it" : "reported against them"} · ${ago(c.at)}</div></div>${statusPill(c.status)}</div>`)], "None.")}</section>` +
      `</div>`;
  }

  /* ── Countries and Money & books (0219) ── */
  const PERIODS = [["today", "Today"], ["7d", "7 days"], ["30d", "30 days"], ["all", "All time"]];
  const periodRow = (on = S.period) => `<div class="chiprow" role="group" aria-label="Period">${PERIODS.map(([k, l]) => `<button type="button" data-period="${k}" aria-pressed="${on === k}">${l}</button>`).join("")}</div>`;
  const isoChip = (iso) => `<span class="iso">${esc(iso)}</span>`;
  const loading = (title, sub, back) => header(title, sub, "", back) + (S.error ? `<div class="note err">${esc(S.error)}</div>` : `<section class="card"><p class="muted" style="font-weight:700;margin:0">Adding it up…</p></section>`);
  const splitBar = (parts) => { const t = parts.reduce((s, p) => s + Math.max(0, p[0]), 0) || 1; return `<div class="sbar">${parts.map(([v, c]) => (v > 0 ? `<i style="width:${Math.max(2, (v / t) * 100)}%;background:${c}"></i>` : "")).join("")}</div>`; };
  const C_FREE = "var(--accent)", C_LOCK = "#C98500";
  const signed = (v, ccy, compact = true) => `<span class="${v > 0 ? "up" : v < 0 ? "down" : ""}">${v > 0 ? "+" : ""}${money(v, ccy, compact)}</span>`;
  const agoText = (d) => (d ? ago(d) : "never");
  // A rate is two figures, each with its name: "$1 │ USD = 88.42₹ │ CEL".
  function rateMoney(v, ccy) {
    const p = moneyParts(1, ccy, false);
    const f = new Intl.NumberFormat("en-US", { maximumFractionDigits: 4, minimumFractionDigits: 2 }).format(v);
    const q = moneyParts(0, ccy, false);
    return `<span class="num money">${esc(f)}<span class="unit">${p.glue ? "&nbsp;" : ""}${esc(p.unit)}</span><span class="geu">│ ${esc(q.trail)}</span></span>`;
  }
  const rateLine = (one, equals, into) => `${money(1, one, false)} = ${rateMoney(equals, into)}`;

  function viewCountries() {
    const d = S.cdata;
    if (!d || d.period !== S.period) return loading("Countries", "Where the money sits");
    const tiles = d.countries.filter((c) => c.accounts + c.shops > 0).map((c) => `<button type="button" class="ctile" data-go="country/${esc(c.iso)}"><span class="nm">${isoChip(c.iso)}${esc(c.name)}</span><span class="big">${money(c.held, c.currency)}</span>${splitBar([[c.free, C_FREE], [c.locked, C_LOCK]])}<span class="mini">${plural(c.accounts, "account")}${c.shops ? ` · ${plural(c.shops, "shop")}` : ""} · ${INT.format(c.payments)} paid</span></button>`).join("");
    const maxN = Math.max(1, ...d.busiest.map((p) => p.ab + p.ba));
    const pairs = d.busiest.length ? d.busiest.map((p) => `<button type="button" class="row tap" data-go="pair/${esc(p.a)}/${esc(p.b)}" style="width:100%;border:none;background:none;text-align:left;font:inherit;color:inherit"><div class="grow"><div class="name">${esc(p.nameA)} ⇄ ${esc(p.nameB)}</div><div class="pbar"><i style="width:${(p.ab / maxN) * 100}%;background:#EB6834"></i><i style="width:${(p.ba / maxN) * 100}%;background:var(--accent-2)"></i></div><div class="meta">${INT.format(p.ab)} → · ${INT.format(p.ba)} ←</div></div><div class="amt">${money(p.value, p.valueCurrency)}</div></button>`).join("") : '<p class="muted" style="font-weight:600;margin:6px 0 0">No payments between countries in this period.</p>';
    const look = d.needsALook.length ? d.needsALook.map((l) => `<div class="row"><div class="grow"><div class="name" style="white-space:normal">${esc(l.text)}</div></div><span class="pill ${l.tone === "bad" ? "bad" : "warn"}">${l.kind}</span></div>`).join("") : '<div class="row"><div class="grow"><div class="name">Nothing needs a look.</div><div class="meta">Pools, payments between countries and rates checked.</div></div><span class="pill good">clear</span></div>';
    return header("Countries", "Tap one · then compare it with another") + periodRow() +
      `<div class="ctiles">${tiles}</div><div class="keyrow"><span><i style="background:${C_FREE}"></i>Free to use</span><span><i style="background:${C_LOCK}"></i>Essentials locked (can't leave GLOOBAL)</span></div>` +
      `<div class="grid g2 tgrid">${card("Busiest pairs", `${PERIODS.find((x) => x[0] === d.period)[1]} · both ways · sized in ${d.viewerCurrency}`, `<div class="rows">${pairs}</div>`)}${card("Needs a look", "", `<div class="rows">${look}</div>`)}</div>`;
  }
  function viewCountry() {
    const c = S.country;
    if (!c || c.iso !== S.iso || c.period !== S.period) return loading(S.iso || "Country", "Adding it up", "countries");
    const ccy = c.currency;
    const pools = c.pools.length ? c.pools.map((p) => `<${p.counterIso ? `button type="button" data-go="pair/${esc(c.iso)}/${esc(p.counterIso)}"` : "div"} class="row tap" style="width:100%;border:none;background:none;text-align:left;font:inherit;color:inherit"><div class="grow"><div class="name">For ${esc(p.counterName)} <span class="muted" style="font-weight:700">(${esc(p.counterCurrency)})</span></div><div class="meta">${p.position > 0 ? "collected for them" : p.position < 0 ? "paid out for them" : "even"}${p.borrowed ? ` · PayLater lent ${moneyText(p.borrowed, ccy)}` : ""}${p.usedShare ? ` · ${Math.round(p.usedShare * 100)}% spoken for` : ""}</div></div><div class="amt">${signed(p.position, ccy)}</div></${p.counterIso ? "button" : "div"}>`).join("") : '<p class="muted" style="font-weight:600;margin:6px 0 0">No pools opened yet — nobody here has paid abroad or been paid from abroad.</p>';
    const across = c.across.length ? c.across.map((o) => `<button type="button" class="row tap" data-go="pair/${esc(c.iso)}/${esc(o.iso)}" style="width:100%;border:none;background:none;text-align:left;font:inherit;color:inherit"><div class="grow"><div class="name">${isoChip(o.iso)} ${esc(o.name)}</div><div class="meta">${INT.format(o.out)} paid to · ${INT.format(o.in)} from</div></div><div class="amt" style="text-align:right">${o.sent ? `<div>${money(-o.sent, ccy)}</div>` : ""}${o.received ? `<div class="up">+${money(o.received, ccy)}</div>` : ""}</div></button>`).join("") : '<p class="muted" style="font-weight:600;margin:6px 0 0">No payments with other countries in this period.</p>';
    const pl = c.paylater;
    const canMoney = allowed("money");
    return header(esc(c.name), `${esc(c.iso)} · ${esc(ccy)} · ${plural(c.accounts, "account")}${c.shops ? ` · ${plural(c.shops, "shop")}` : ""}`, "", "countries") + periodRow() +
      `<div class="grid g2 tgrid"><div><section class="wallet"><span class="eb">Held in ${esc(c.name)} · now</span><div class="wbig">${money(c.held, ccy)}</div>${splitBar([[c.free, "rgba(255,255,255,.9)"], [c.locked, "#F5B83D"]])}<div class="wlines">${line("Free to use", money(c.free, ccy))}${line("Essentials locked", money(c.locked, ccy))}</div></section>` +
      `${card("With other countries", PERIODS.find((x) => x[0] === c.period)[1], `<div class="rows">${across}</div>`)}</div><div>` +
      card(`${esc(c.name)}'s pools, one per country`, "now", `<div class="rows">${pools}</div><p class="muted" style="font-size:11.5px;font-weight:600;margin:8px 0 0">A pool takes local money from people here paying abroad, and pays out for people abroad paying here. What builds up is squared between the countries' banks.</p>`) +
      card("PayLater", "this country's float", pl ? `${line("Country total", money(pl.total, ccy))}${line("Lent into pools now", money(pl.borrowed, ccy))}${line("Room left", `<span class="up">${money(pl.headroom, ccy)}</span>`)}` : '<p class="muted">Not answered.</p>') +
      card("GLOOBAL Bank", PERIODS.find((x) => x[0] === c.period)[1], `${line("Added from banks", signed(c.banks.added, ccy))}${line("Sent to banks", signed(-c.banks.sent, ccy))}${line("On the way", money(c.banks.onTheWay, ccy))}${c.banks.returned ? line("Returned", money(c.banks.returned, ccy)) : ""}`) +
      card("Essentials", PERIODS.find((x) => x[0] === c.period)[1], `${line("Drawn", money(c.essentials.drawn, ccy))}${line("People", count(c.essentials.people))}`) +
      (canMoney ? `<button type="button" class="btn quiet" data-go="books/${esc(ccy)}" style="width:100%">Books for ${esc(ccy)} ›</button>` : "") + `</div></div>`;
  }
  function viewPair() {
    const d = S.pairData;
    const key = `${S.pairA}/${S.pairB}`;
    if (!d || d.key !== key || d.periodAsked !== S.period) return loading(`${S.pairA} ⇄ ${S.pairB}`, "two countries together", `country/${S.pairA}`);
    const A = d.a, B = d.b;
    const pos = (x) => (x.pool && x.pool.opened ? signed(x.pool.position, x.currency) : '<span class="muted">not opened</span>');
    const maxD = Math.max(1, ...d.daily.map((x) => Math.max(x.ab, x.ba)));
    const chart = `<div class="duo">${d.daily.map((x) => `<div><i style="height:${(x.ab / maxD) * 100}%;background:#EB6834" title="${x.ab}"></i><i style="height:${(x.ba / maxD) * 100}%;background:var(--accent-2)" title="${x.ba}"></i></div>`).join("")}</div><div class="duo-days">${d.daily.map((x) => `<span>${esc(x.day.slice(8))}</span>`).join("")}</div><div class="keyrow"><span><i style="background:#EB6834"></i>${esc(A.name)} → ${esc(B.name)}</span><span><i style="background:var(--accent-2)"></i>${esc(B.name)} → ${esc(A.name)}</span></div>`;
    const sq = d.squareUp ? `<div class="square"><span><b>${esc(d.squareUp.fromName)}</b> owes <b>${esc(d.squareUp.toName)}</b></span><div class="wbig" style="font-size:26px">${money(d.squareUp.amount, d.squareUp.currency, false)}</div><span class="muted" style="font-weight:600;font-size:12px">what ${esc(d.squareUp.toName)}'s pool paid out beyond its float · squared between the two countries' banks</span></div>` : '<p class="muted" style="font-weight:700;margin:6px 0 0">Even — neither pool has paid out more than it took in.</p>';
    return header(`${esc(A.name)} ⇄ ${esc(B.name)}`, "two countries together", "", `country/${A.iso}`) + periodRow() +
      `<div class="grid g2 tgrid"><div><section class="wallet" style="text-align:center"><span class="eb">Rate used now</span><div class="wbig" style="font-size:22px">${d.rate ? rateLine(d.rate.one, d.rate.equals, d.rate.in) : "same currency"}</div>${d.rate ? `<span style="font-size:12px;opacity:.8;font-weight:700">${esc(d.rate.source)} · ${agoText(d.rate.fetchedAt)}</span>` : ""}</section>` +
      card("Side by side", PERIODS.find((x) => x[0] === d.period)[1], `<div class="vs"><div></div><div class="vh">${isoChip(A.iso)} ${esc(A.name)}</div><div class="vh">${isoChip(B.iso)} ${esc(B.name)}</div>
        <div class="vk">Paid across</div><div>${count(A.sent)}</div><div>${count(B.sent)}</div>
        <div class="vk">Amount sent</div><div>${money(A.sentAmount, A.currency)}</div><div>${money(B.sentAmount, B.currency)}</div>
        <div class="vk">Pool for the other</div><div>${pos(A)}</div><div>${pos(B)}</div>
        <div class="vk">Failed</div><div>${count(A.failed)}</div><div>${count(B.failed)}</div></div>`) + `</div><div>` +
      card("Squaring up", "now", sq) + controlsCard(A, B) + card("Each day", "last 7 days · payments", chart) + `</div></div>`;
  }

  function viewMoney() {
    const d = S.mdata;
    if (!d || d.period !== S.period) return loading("Money & books", "Does it add up · what moved it");
    const bad = d.currencies.filter((c) => !c.ok), good = d.currencies.filter((c) => c.ok);
    const crow = (c) => `<button type="button" class="row tap" data-go="books/${esc(c.currency)}" style="width:100%;border:none;background:none;text-align:left;font:inherit;color:inherit"><div class="grow"><div class="name">${esc(c.currency)}</div><div class="meta">${plural(c.accounts, "account")} · holds ${moneyText(c.held, c.currency)}${c.legacy ? " · a gap set aside" : ""}</div></div><div class="amt">${c.ok ? '<span class="muted">matches</span>' : `<span class="down">${c.difference > 0 ? "+" : ""}${money(c.difference, c.currency, false)}</span>`}</div><span class="pill ${c.ok ? "good" : "bad"}">${c.ok ? "ok" : c.difference > 0 ? "over" : "short"}</span></button>`;
    const m = d.moved;
    const maxL = Math.max(1, ...m.lines.map((l) => Math.abs(l.amount)));
    const lines = m.lines.map((l) => `<span>${esc(l.label)}</span><div class="trk"><i style="${l.amount >= 0 ? "left:0" : "right:0"};width:${(Math.abs(l.amount) / maxL) * 100}%;background:${l.amount >= 0 ? "var(--good)" : "var(--bad)"}"></i></div><b>${signed(l.amount, m.currency)}</b>`).join("");
    const ccys = d.choices.map((c) => `<button type="button" data-moneyccy="${esc(c)}" aria-pressed="${c === m.currency}">${esc(c)}</button>`).join("");
    return header("Money & books", "Does it add up · what moved it") + periodRow() +
      `<div class="grid g2 tgrid"><div>` + card(`${d.matching} of ${d.total} currencies match`, `checked ${clock(d.checkedAt)} · worst first`, `<div class="rows">${bad.map(crow).join("")}${good.map(crow).join("")}</div>`) + `</div><div>` +
      card(`What moved ${esc(m.currency)}`, PERIODS.find((x) => x[0] === d.period)[1], `<div class="chiprow small">${ccys}</div><div class="wf">${lines}<span style="color:var(--ink);font-weight:800">Held now</span><div></div><b>${money(m.heldNow, m.currency)}</b></div><p class="muted" style="font-size:11.5px;font-weight:600;margin:8px 0 0">Payments between people inside GLOOBAL move money around and don't change the total.</p>`) +
      `<div class="grid g2" style="margin-top:14px"><button type="button" class="btn quiet" data-go="settlements">Between countries ›</button><button type="button" class="btn quiet" data-go="rates">Exchange rates ›</button></div></div></div>`;
  }
  function viewBooks() {
    const b = S.books;
    if (!b || b.currency !== S.booksCcy) return loading(`Books for ${S.booksCcy || ""}`, "should be here vs is here", "money");
    const c = b.currency, sh = b.should, dz = b.does;
    const isAdmin = realRole() === "admin";
    const aside = S.aside && S.aside.ccy === c ? `<div class="note" style="margin-top:12px;background:rgba(255,255,255,.14);color:#fff"><b>Set ${moneyText(b.difference, c, false)} aside</b><br><span style="font-size:12px;opacity:.85">Write why it is explained. From now on only a new gap shows red. It goes in the audit log.</span><textarea id="aside-reason" placeholder="e.g. Accounts moved from India to other countries before 0214 kept their rupee history" style="width:100%;min-height:64px;border-radius:12px;border:none;padding:8px 10px;font:inherit;margin-top:8px;color:var(--ink)">${esc(S.aside.reason)}</textarea><div style="display:flex;gap:8px;margin-top:8px"><button type="button" class="btn" data-aside-confirm style="flex:1;background:#fff;color:var(--accent-deep)" ${S.aside.busy ? "disabled" : ""}>${S.aside.busy ? "Setting aside…" : "Set it aside"}</button><button type="button" class="btn quiet" data-aside-cancel style="flex:1">Cancel</button></div></div>` : "";
    const hist = b.history.map((h) => `<i class="${h.ok === true ? "ok" : h.ok === false ? "off" : "none"}" title="${esc(h.day)}: ${h.ok === null ? "not checked" : h.ok ? "matched" : `off by ${h.difference}`}"></i>`).join("");
    return header(`Books for ${esc(c)}`, `checked ${clock(b.checkedAt)} · ${plural(b.accounts, "account")}`, "", "money") +
      `<div class="grid g2 tgrid"><div><section class="wallet"><span class="eb">${b.ok ? "It adds up" : "Difference"}</span><div class="wbig">${b.ok ? "Matches" : `${b.difference > 0 ? "+" : ""}${money(b.difference, c, false)}`}</div><p style="margin:0;font-size:12.5px;font-weight:700;opacity:.85;line-height:1.45">${b.ok ? "What is here is what the records say should be." : b.difference > 0 ? "More is here than the records explain." : "Less is here than the records say should be."}${b.baseline ? ` A gap of ${esc(moneyText(b.baseline.amount, c, false))} was set aside ${esc(new Date(b.baseline.setAt).toLocaleDateString([], { day: "numeric", month: "short" }))}: ${esc(b.baseline.reason)}` : ""}</p>${!b.ok && isAdmin && !S.aside ? `<button type="button" class="btn" data-aside="${esc(c)}" style="width:100%;margin-top:12px;background:rgba(255,255,255,.18)">Set this gap aside…</button>` : ""}${aside}</section>` +
      card("Last checks", "one a day", `<div class="hist">${hist}</div>`) + `</div><div>` +
      card("Should be here", money(b.shouldExist, c), `${line("Opening balances", money(sh.opening, c))}${line("Pools opened", money(sh.pools, c))}${line("GLOOBAL payouts (Essentials and more)", signed(sh.payouts, c))}${line("PayLater lent into pools", signed(sh.poolFunding, c))}${line("Added from banks", signed(sh.bankIn, c))}${line("Sent to banks", signed(-sh.bankOut, c))}${sh.legacy ? line("Set aside (explained)", signed(sh.legacy, c)) : ""}`) +
      card("Is here", money(b.doesExist, c), `${line("In people's and shops' balances", money(dz.balances, c))}${line("In pools", money(dz.pools, c))}${line("Creator Share held", money(dz.custody, c))}`) + `</div></div>`;
  }
  function viewSettlements() {
    const d = S.setl;
    if (!d || d.status !== S.setlTab) return loading("Between countries", "squaring up · each payment that crossed", "money");
    const sq = d.squareUp.length ? d.squareUp.map((x) => `<div class="row"><div class="grow"><div class="name">${esc(x.fromName)} owes ${esc(x.toName)}</div><div class="meta">what ${esc(x.toName)}'s pool paid out beyond its float</div></div><div class="amt">${money(x.amount, x.currency, false)}</div></div>`).join("") : '<div class="row"><div class="grow"><div class="name">All square</div><div class="meta">No pool has paid out more than it took in.</div></div><span class="pill good">even</span></div>';
    const rowsH = d.rows.length ? d.rows.map((r) => `<div class="row"><div class="grow"><div class="name">${esc(r.fromName)} → ${esc(r.toName)}</div><div class="meta">${esc(r.payer)} paid ${esc(r.payee)} · ${ago(r.at)}${r.failureReason ? ` · ${esc(r.failureReason)}` : ""}</div></div><div class="amt" style="text-align:right"><div>${money(r.sent, r.sentCurrency, false)}</div><div class="muted" style="font-size:12px">→ ${money(r.got, r.gotCurrency, false)}</div></div></div>`).join("") : `<p class="muted" style="font-weight:600;margin:6px 0 0">None ${d.status === "failed" ? "failed" : "yet"}.</p>`;
    const tabs = [["settled", "Settled"], ["failed", "Failed"]];
    return header("Between countries", "Every payment across settles at once · what builds up is squared between banks", "", "money") +
      `<div class="grid g2 tgrid"><div>${card("Squaring up", "now, by pair", `<div class="rows">${sq}</div>`)}</div><div><div class="chiprow" role="group">${tabs.map(([k, l]) => `<button type="button" data-setl="${k}" aria-pressed="${S.setlTab === k}">${l} <b>${INT.format(d.counts[k] || 0)}</b></button>`).join("")}</div>${card("Payments that crossed", "latest first", `<div class="rows">${rowsH}</div>`)}</div></div>`;
  }
  function viewRates() {
    const d = S.rates;
    if (!d) return loading("Exchange rates", "what GLOOBAL converts at", "money");
    const tone = (h) => (h === null ? ["bad", "missing"] : h < 24 ? ["good", "fresh"] : h < 72 ? ["warn", `${Math.round(h)} h old`] : ["bad", `${Math.round(h / 24)} days old`]);
    const rowsH = d.rates.length ? d.rates.map((r) => { const [t, w] = tone(r.ageHours); return `<div class="row"><div class="grow"><div class="name">${r.rate === null ? `${money(1, r.currency, false)} = —` : rateLine(r.currency, r.rate, d.against)}</div><div class="meta">${r.fetchedAt ? `fetched ${agoText(r.fetchedAt)}` : "no rate stored"}</div></div><span class="pill ${t}">${esc(w)}</span></div>`; }).join("") : '<p class="muted">Only one currency in use.</p>';
    return header("Exchange rates", `against ${esc(d.against)} · oldest first`, "", "money") +
      `<div class="grid g2 tgrid">${card("Rates in use", "", `<div class="rows">${rowsH}</div>${["admin", "finance"].includes(realRole()) && d.rates.length ? `<button type="button" class="btn quiet" data-rates-refresh style="width:100%;margin-top:12px" ${S.refreshing ? "disabled" : ""}>${S.refreshing ? "Refreshing…" : "Refresh the old ones now"}</button>` : ""}`)}${card("Where they come from", "", `${line("Source", esc(d.source || "—"))}${line("Last fetched", d.lastFetched ? esc(agoText(d.lastFetched)) : "—")}${line("Currency pairs used so far", count(d.pairsInUse))}<p class="muted" style="font-size:12px;font-weight:600;margin:10px 0 0">A rate older than a day shows amber, older than three days red. Payments on that pair still go through at the last rate.</p>`)}</div>`;
  }

  /* ── Problems: escalated complaints, bank cases, sending money back (0220) ── */
  const PTABS = [["escalated", "Escalated complaints"], ["transfers", "Bank cases"], ["refunds", "Waiting approval"], ["done", "Done"]];
  const HOLD_KINDS = [["sending", "Pause payments", "Can't pay anyone or send to a bank. Can still receive and sign in."], ["payouts", "Pause bank payouts", "Can't send money to an outside bank."], ["shop", "Hide shop page", "Out of search; not found by name or ID, except by its owner."]];
  const statusPill2 = (st) => ({ escalated: '<span class="pill bad">escalated</span>', open: '<span class="pill warn">open</span>', checking: '<span class="pill warn">checking</span>', proposed: '<span class="pill warn">waiting approval</span>', returned: '<span class="pill good">money back</span>', solved: '<span class="pill good">closed</span>', resolved: '<span class="pill good">solved</span>', done: '<span class="pill good">sent back</span>', declined: '<span class="pill quiet">declined</span>', failed: '<span class="pill bad">failed</span>' }[st] || `<span class="pill quiet">${esc(st)}</span>`);
  function viewProblems() {
    const d = S.problems;
    const refresh = `<button type="button" class="icon-btn" data-prob-refresh aria-label="Refresh">${ICON.refresh}</button>`;
    if (!d || d.tab !== S.ptab) return header("Problems", "Escalated complaints, bank cases, money going back", refresh) + (S.error ? `<div class="note err">${esc(S.error)}</div>` : `<section class="card"><p class="muted" style="font-weight:700;margin:0">Loading…</p></section>`);
    const tabs = PTABS.filter(([k]) => k !== "refunds" || ["admin", "finance", "support"].includes(realRole()));
    const row = (it) => {
      const go = it.kind === "complaint" || it.kind === "refund" ? `complaint/${it.complaintId || it.id}` : `tcase/${it.ref}`;
      const tone = it.kind === "transfer" ? ["var(--accent-soft)", "var(--accent)"] : it.kind === "refund" ? ["var(--warn-soft)", "var(--warn)"] : ["var(--bad-soft)", "var(--bad)"];
      return `<button type="button" class="ticket" data-go="${esc(go)}"><span class="av" style="background:${tone[0]};color:${tone[1]}">${it.kind === "transfer" ? "B" : it.kind === "refund" ? "↩" : "!"}</span><span class="grow"><span class="name">${esc(it.title)}${it.refundWaiting ? ' <span class="muted" style="font-weight:700">· send-back waiting</span>' : ""}</span><span class="meta">${esc(it.who)} · ${esc(it.ref)} · ${ago(it.since)}${it.proposedBy ? ` · proposed by ${esc(it.proposedBy)}` : ""}</span>${it.reason ? `<span class="preview">${esc(it.reason)}</span>` : ""}</span><span style="display:flex;flex-direction:column;align-items:flex-end;gap:4px">${it.amount ? `<b>${money(it.amount, it.currency, false)}</b>` : ""}${it.late ? '<span class="pill bad">over a day</span>' : statusPill2(it.status)}</span></button>`;
    };
    const priv = d.privateOpen.count ? `<div class="note" style="margin-bottom:14px"><b>${plural(d.privateOpen.count, "complaint")} open between people</b> — oldest ${ago(d.privateOpen.oldest)}. A complaint is their private chat; GLOOBAL can read one once the payer escalates it (after 48 hours, in the app).</div>` : "";
    return header("Problems", "Escalated complaints, bank cases, money going back", refresh) + priv +
      `<div class="tabs" role="group" aria-label="Which problems">${tabs.map(([k, l]) => `<button type="button" data-ptab="${k}" aria-pressed="${S.ptab === k}">${l}${k !== "done" ? ` <b>${INT.format(d.counts[k] || 0)}</b>` : ""}</button>`).join("")}</div>` +
      `<section class="card airy">${d.items.map(row).join("") || `<p class="muted" style="font-weight:700;margin:0">${S.ptab === "refunds" ? "Nothing waiting for approval." : "Nothing here."}</p>`}</section>`;
  }
  function viewComplaint() {
    const c = S.complaint;
    if (!c || c.id !== S.complaintId) return header("Complaint", S.complaintId || "", "", "problems") + (S.error ? `<div class="note err">${esc(S.error)}</div>` : "");
    const open = c.status === "escalated";
    const bub = (m) => m.who === "system" ? (/^GLOOBAL Support|^Closed by GLOOBAL/.test(m.text) ? `<div class="bub gl"><p>${esc(m.text)}</p><em>GLOOBAL · ${ago(m.at)}</em></div>` : `<div class="sysline">${esc(m.text)} · ${ago(m.at)}</div>`) : `<div class="bub ${m.who === "payee" ? "payee" : ""}"><p>${esc(m.text)}</p><em>${m.who === "payer" ? esc(c.reporter.name) + " (paid)" : esc(c.receiver.name) + " (was paid)"} · ${ago(m.at)}</em></div>`;
    const party = (p, who) => { const hs = c.holds.filter((h) => h.on === who); return `<div class="row"><div class="grow"><div class="name">${esc(p.name)}</div><div class="meta">${who === "payer" ? "paid" : "was paid"}${p.balance !== null ? ` · holds ${moneyText(p.balance, c.payment ? (who === "payer" ? c.payment.paid.currency : c.payment.got.currency) : "INR")}` : ""}</div>${hs.map((h) => `<span class="pill bad" style="margin-top:4px">${esc(h.words)}</span>`).join(" ")}</div>${allowed("lookup") ? `<button type="button" class="chip" data-account="${esc(p.symbolId)}">Account ›</button>` : ""}</div>`; };
    const f = S.pform && S.pform.id === c.id ? S.pform : null;
    const r = c.refund;
    const hist = r.history.map((h) => `<div class="row"><div class="grow"><div class="name">${money(h.amount, h.currency, false)} back · proposed by ${esc(h.proposedBy)}${h.mine ? " (you)" : ""}</div><div class="meta">${esc(h.reason)}${h.decidedBy ? ` · ${h.status === "declined" ? "declined" : "approved"} by ${esc(h.decidedBy)}` : ""}${h.declineReason ? `: ${esc(h.declineReason)}` : ""}${h.failure ? ` · ${esc(h.failure)}` : ""}</div>
      ${h.canDecide ? `<div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap"><button type="button" class="btn" data-approve="${esc(h.id)}" style="flex:1">Approve — send it back</button><button type="button" class="btn quiet" data-decline-open="${esc(h.id)}" style="flex:1">Decline…</button></div>${f && f.kind === "decline" && f.rid === h.id ? `<textarea id="pform-text" placeholder="Why not — the person who proposed it reads this" style="width:100%;min-height:56px;border-radius:12px;border:1.5px solid var(--line);background:var(--surface);padding:8px 10px;font:inherit;color:var(--ink);margin-top:8px">${esc(f.text)}</textarea><button type="button" class="btn quiet" data-decline="${esc(h.id)}" style="width:100%;margin-top:6px">Decline it</button>` : ""}` : h.status === "proposed" && h.mine ? '<div class="meta" style="margin-top:4px">Someone on Finance, or the founder, approves it.</div>' : ""}</div>${statusPill2(h.status)}</div>`).join("");
    const canPropose = ["admin", "support", "finance"].includes(realRole());
    const refundCard = card("Send the money back", r.possible ? money(r.amount, r.currency, false) : "", `${hist ? `<div class="rows">${hist}</div>` : ""}${r.possible && canPropose ? (f && f.kind === "refund" ? `<textarea id="pform-text" placeholder="Why it should go back — the approver reads this" style="width:100%;min-height:64px;border-radius:12px;border:1.5px solid var(--line);background:var(--surface);padding:8px 10px;font:inherit;color:var(--ink);margin-top:10px">${esc(f.text)}</textarea><button type="button" class="btn" data-refund-send style="width:100%;margin-top:8px">Propose sending ${moneyText(r.amount, r.currency, false)} back</button>` : `<p class="muted" style="font-size:12px;font-weight:600;margin:8px 0 0">From ${esc(c.receiver.name)} back to ${esc(c.reporter.name)}: what they actually got. A second person on Finance, or the founder, approves it before anything moves.</p><button type="button" class="btn quiet" data-refund-open style="width:100%;margin-top:10px">Propose sending it back…</button>`) : r.why ? `<p class="muted" style="font-size:12px;font-weight:600;margin:8px 0 0">${esc(r.why)}</p>` : ""}`);
    const p = c.payment;
    return header(`${esc(c.reason)}`, `${esc(c.ref)} · raised ${ago(c.createdAt)}${c.escalatedAt ? ` · escalated ${ago(c.escalatedAt)}` : ""}`, statusPill2(c.status), "problems") +
      `<div class="grid g2 tgrid"><div><section class="card airy chat" aria-label="The complaint">${c.messages.map(bub).join("")}
        ${open ? `<label class="eyebrow" for="pdraft" style="margin-top:10px">Write to both of them, as GLOOBAL</label><textarea id="pdraft" maxlength="480" placeholder="Both of them see this in the complaint, with a notice" style="width:100%;min-height:72px;border-radius:14px;border:1.5px solid var(--line);background:var(--surface);padding:10px 12px;font:inherit;color:var(--ink)">${esc(S.pdraft)}</textarea>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px"><button type="button" class="btn" data-preply style="flex:2">Send</button><button type="button" class="btn quiet" data-close-open style="flex:1">Close it…</button></div>
        ${f && f.kind === "close" ? `<textarea id="pform-text" placeholder="How it was settled — both of them read this" style="width:100%;min-height:56px;border-radius:12px;border:1.5px solid var(--line);background:var(--surface);padding:8px 10px;font:inherit;color:var(--ink);margin-top:8px">${esc(f.text)}</textarea><button type="button" class="btn quiet" data-close style="width:100%;margin-top:6px">Close the complaint</button>` : ""}` : '<p class="muted" style="font-weight:700;margin:8px 0 0">Closed.</p>'}</section></div><div>` +
      card("The payment", p ? esc(new Date(p.at).toLocaleString([], { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })) : "", p ? `${line("Paid", money(p.paid.amount, p.paid.currency, false))}${line("They got", money(p.got.amount, p.got.currency, false))}${line("Reference", `<span style="font-size:11px">${esc(p.referenceId)}</span>`)}${c.note ? line("Their note", esc(c.note)) : ""}` : '<p class="muted">Missing.</p>') +
      card("Both sides", "", `<div class="rows">${party(c.reporter, "payer")}${party(c.receiver, "payee")}</div>`) + refundCard + `</div></div>`;
  }
  function viewCase() {
    const c = S.tcase;
    if (!c || c.ref !== S.caseRef) return header("Bank case", S.caseRef || "", "", "problems") + (S.error ? `<div class="note err">${esc(S.error)}</div>` : "");
    const t = c.transfer;
    const bub = (m) => `<div class="bub ${m.who === "gloobal" ? "us" : ""}"><p>${esc(m.text)}</p><em>${m.who === "gloobal" ? "GLOOBAL" : esc(c.person ? c.person.name : "They")} · ${ago(m.at)}</em></div>`;
    return header(`Bank: ${esc(c.reason)}`, `${esc(c.ref)} · opened ${ago(c.createdAt)}`, statusPill2(c.status), "problems") +
      `<div class="grid g2 tgrid"><div><section class="card airy chat">${c.messages.map(bub).join("")}
        <label class="eyebrow" for="pdraft" style="margin-top:10px">Answer as GLOOBAL</label><textarea id="pdraft" maxlength="600" placeholder="They see this on the transfer, with a notice" style="width:100%;min-height:72px;border-radius:14px;border:1.5px solid var(--line);background:var(--surface);padding:10px 12px;font:inherit;color:var(--ink)">${esc(S.pdraft)}</textarea>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px"><button type="button" class="btn" data-creply="checking" style="flex:2">Send</button><button type="button" class="btn quiet" data-creply="resolved" style="flex:1">Send &amp; mark solved</button></div></section></div><div>` +
      card("The transfer", t ? statusPill(t.status) : "", t ? `${line(t.direction === "in" ? "Added from" : "Sent to", esc(String(t.method).toUpperCase()))}${line("Amount", money(t.amount, t.currency, false))}${line("When", esc(new Date(t.at).toLocaleString([], { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })))}${t.returnReason ? line("Came back because", esc(t.returnReason)) : ""}${line("Reference", `<span style="font-size:11px">${esc(t.referenceId)}</span>`)}` : '<p class="muted">Missing.</p>') +
      (c.person ? card(esc(c.person.name), "", `${c.person.balance !== null ? line("Balance", money(c.person.balance, t ? t.currency : "INR")) : ""}${allowed("lookup") ? `<button type="button" class="btn quiet" data-account="${esc(c.person.symbolId)}" style="width:100%;margin-top:10px">Open their account</button>` : ""}`) : "") + `</div></div>`;
  }
  // Holds, on an account (Look up).
  function holdsCard() {
    const h = S.holds;
    if (!h) return card("Holds", "", '<p class="muted" style="font-weight:600;margin:6px 0 0">Loading…</p>');
    const active = h.holds.filter((x) => x.active), past = h.holds.filter((x) => !x.active).slice(0, 4);
    const f = S.holdForm;
    const activeRows = active.map((x) => `<div class="row"><div class="grow"><div class="name">${esc(x.words)}</div><div class="meta">${esc(x.reason)} · by ${esc(x.setBy)} · ${ago(x.at)}</div>${h.canHold ? (f && f.lift === x.id ? `<textarea id="hold-text" placeholder="Why it can be lifted" style="width:100%;min-height:50px;border-radius:12px;border:1.5px solid var(--line);background:var(--surface);padding:8px 10px;font:inherit;color:var(--ink);margin-top:8px">${esc(f.text)}</textarea><button type="button" class="btn quiet" data-hold-lift="${esc(x.id)}" style="width:100%;margin-top:6px">Lift it</button>` : `<button type="button" class="chip" data-hold-lift-open="${esc(x.id)}" style="margin-top:6px">Lift…</button>`) : ""}</div><span class="pill bad">on</span></div>`).join("");
    const pastRows = past.map((x) => `<div class="row"><div class="grow"><div class="name" style="color:var(--ink-soft)">${esc(x.words)}</div><div class="meta">lifted by ${esc(x.liftedBy)} ${ago(x.liftedAt)}: ${esc(x.liftReason)}</div></div><span class="pill quiet">lifted</span></div>`).join("");
    const free = HOLD_KINDS.filter(([k]) => !active.some((x) => x.kind === k));
    const form = h.canHold && free.length ? (f && f.kind ? `<div class="eyebrow" style="margin-top:12px">${esc(HOLD_KINDS.find((k) => k[0] === f.kind)[1])}</div><p class="muted" style="font-size:12px;font-weight:600;margin:4px 0 0">${esc(HOLD_KINDS.find((k) => k[0] === f.kind)[2])}</p><textarea id="hold-text" placeholder="Why — the team reads this; they don't" style="width:100%;min-height:56px;border-radius:12px;border:1.5px solid var(--line);background:var(--surface);padding:8px 10px;font:inherit;color:var(--ink);margin-top:8px">${esc(f.text)}</textarea><div style="display:flex;gap:8px;margin-top:6px"><button type="button" class="btn" data-hold-set style="flex:1;background:var(--bad)">Put it on</button><button type="button" class="btn quiet" data-hold-cancel style="flex:1">Cancel</button></div>` : `<div class="chips" style="margin-top:12px">${free.map(([k, l]) => `<button type="button" class="chip" data-hold-kind="${k}">${esc(l)}…</button>`).join("")}</div>`) : "";
    return card("Holds", active.length ? `${active.length} on` : "none on", `${activeRows || '<p class="muted" style="font-weight:600;margin:6px 0 0">Nothing is paused on this account.</p>'}${pastRows ? `<div class="rows" style="margin-top:6px">${pastRows}</div>` : ""}${form}`);
  }

  /* ── The rest (0221): controls, system, growth, shops, risk, live, alerts ── */
  const ta = (id, ph, val, h = 56) => `<textarea id="${id}" placeholder="${esc(ph)}" style="width:100%;min-height:${h}px;border-radius:12px;border:1.5px solid var(--line);background:var(--surface);padding:8px 10px;font:inherit;color:var(--ink);margin-top:8px">${esc(val || "")}</textarea>`;
  // Controls between two countries, on Two together.
  function controlsCard(A, B) {
    const rules = (S.corr && S.corr.rules || []).filter((r) => r.active && ((r.from === A.iso && r.to === B.iso) || (r.from === B.iso && r.to === A.iso)));
    const can = ["admin", "finance", "risk"].includes(realRole());
    const f = S.corrForm && S.corrForm.key === `${A.iso}/${B.iso}` ? S.corrForm : null;
    const rows = rules.map((r) => `<div class="row" style="flex-wrap:wrap"><div class="grow"><div class="name" style="white-space:normal">${esc(r.fromName)} → ${esc(r.toName)}: ${r.paused ? "paused" : `each payment up to ${moneyText(r.cap, r.capCurrency, false)}`}</div><div class="meta" style="white-space:normal">${esc(r.reason)} · by ${esc(r.setBy)} · ${ago(r.at)}</div></div>${can ? `<button type="button" class="chip" data-corr-lift="${esc(r.id)}">Lift</button>` : ""}<span class="pill ${r.paused ? "bad" : "warn"}">${r.paused ? "paused" : "capped"}</span></div>`).join("");
    const dir = f ? f.dir : `${A.iso}>${B.iso}`;
    const [fromIso] = dir.split(">");
    const fromSide = fromIso === A.iso ? A : B, toSide = fromIso === A.iso ? B : A;
    const form = !can ? "" : f ? `<div class="chips" style="margin-top:12px">${[[`${A.iso}>${B.iso}`, `${A.name} → ${B.name}`], [`${B.iso}>${A.iso}`, `${B.name} → ${A.name}`]].map(([k, l]) => `<button type="button" class="chip" data-corr-dir="${k}" aria-pressed="${dir === k}">${esc(l)}</button>`).join("")}</div>
      <div class="chips" style="margin-top:8px"><button type="button" class="chip" data-corr-mode="pause" aria-pressed="${f.mode === "pause"}">Pause</button><button type="button" class="chip" data-corr-mode="cap" aria-pressed="${f.mode === "cap"}">Cap each payment</button></div>
      ${f.mode === "cap" ? `<label class="eyebrow" for="corr-cap" style="margin-top:10px;display:block">Most per payment, in ${esc(fromSide.currency)} (what ${esc(fromSide.name)} pays)</label><input id="corr-cap" class="id-input" inputmode="decimal" value="${esc(f.cap || "")}" placeholder="e.g. 50000" style="margin-top:6px">` : ""}
      ${ta("corr-reason", `Why — the team reads this; people paying from ${fromSide.name} are told only that it is ${f.mode === "pause" ? "paused" : "limited"}`, f.reason)}
      <div style="display:flex;gap:8px;margin-top:8px"><button type="button" class="btn" data-corr-set style="flex:1;${f.mode === "pause" ? "background:var(--bad)" : ""}">${f.mode === "pause" ? `Pause ${esc(fromSide.name)} → ${esc(toSide.name)}` : "Set the cap"}</button><button type="button" class="btn quiet" data-corr-cancel style="flex:1">Cancel</button></div>`
      : `<button type="button" class="btn quiet" data-corr-open="${esc(A.iso)}/${esc(B.iso)}" style="width:100%;margin-top:12px">Pause or cap a direction…</button>`;
    return card("Controls", rules.length ? `${rules.length} on` : "none on", `${rows ? `<div class="rows">${rows}</div>` : '<p class="muted" style="font-weight:600;margin:6px 0 0">Payments both ways go through as normal.</p>'}${form}<p class="muted" style="font-size:11.5px;font-weight:600;margin:8px 0 0">The server checks these on every payment; the send screen shows the limit before anyone types.</p>`);
  }

  // Server errors (0222): every 5xx, by route.
  function errorsCard(e) {
    if (!e) return "";
    const tone = e.lastHour >= 10 ? "bad" : e.lastHour ? "warn" : "good";
    const rows = e.top.map((r) => `<div class="row"><div class="grow"><div class="name" style="font-family:var(--f-num);font-size:12.5px;white-space:normal;overflow-wrap:anywhere">${esc(r.route)}</div><div class="meta">last ${esc(ago(r.lastAt))} · ${esc(String(r.lastStatus))}</div></div><div class="amt">${INT.format(r.count)}</div></div>`).join("");
    return card("Server errors", `<span class="pill ${tone}">${INT.format(e.lastHour)} in the last hour</span>`, `${line("Last 24 hours", INT.format(e.lastDay))}${rows ? `<div class="rows" style="margin-top:4px">${rows}</div>` : '<p class="muted" style="font-weight:600;margin:6px 0 0">None — every request answered.</p>'}<p class="muted" style="font-size:11.5px;font-weight:600;margin:8px 0 0">Every request the server failed (5xx), by route. 10 or more in an hour alerts Admin and Tech.</p>`);
  }
  const alertsLine = (a) => (!a ? "" : line("Alert checks", !a.enabled ? '<span class="muted">turned off</span>' : a.lastRun ? `${esc(ago(a.lastRun))} · every ${a.every} min` : '<span class="muted">not yet since the server woke</span>'));
  function viewSystem() {
    const d = S.sys;
    const refresh = `<button type="button" class="icon-btn" data-sys-refresh aria-label="Refresh">${ICON.refresh}</button>`;
    if (!d) return loading("Server & deploys", "What is live, against GitHub");
    const behindPill = (b) => (b === null || b === undefined ? '<span class="pill quiet">unknown</span>' : b === 0 ? '<span class="pill good">latest</span>' : `<span class="pill warn">${plural(b.count, "commit")} behind</span>`);
    const commits = (b) => (b && b.commits && b.commits.length ? `<div class="rows" style="margin-top:6px">${b.commits.map((c) => `<div class="row"><div class="grow"><div class="name" style="white-space:normal">${esc(c.message)}</div><div class="meta">${esc(c.sha)} · ${c.at ? ago(c.at) : ""}</div></div><span class="pill quiet">not live</span></div>`).join("")}</div>` : "");
    const gh = d.github.error ? `<p class="muted" style="font-weight:600">GitHub did not answer: ${esc(d.github.error)}</p>` : `${line("Latest on main", `<span class="num">${esc(d.github.sha)}</span>`)}<p style="margin:6px 0 0;font-weight:700;font-size:13px">${esc(d.github.message)}</p><p class="muted" style="font-size:12px;font-weight:600;margin:2px 0 0">${d.github.at ? ago(d.github.at) : ""} · ${esc(d.repo)}</p>`;
    const up = (since) => { const h = (Date.now() - new Date(since)) / 3600000; return h < 1 ? `${Math.round(h * 60)} min` : h < 48 ? `${Math.round(h)} h` : `${Math.round(h / 24)} days`; };
    return header("Server & deploys", d.cached ? "What is live, against GitHub · a minute ago" : "What is live, against GitHub", refresh) +
      `<div class="grid g2 tgrid"><div>${card("GitHub", "", gh)}${card("Render — the API", behindPill(d.render.behind), `${line("Running", d.render.commit ? `<span class="num">${esc(d.render.commit)}</span>` : '<span class="muted">not reported</span>')}${line("Up for", esc(up(d.render.startedAt)))}${line("Database answers in", d.render.dbPingMs === null ? '<span class="down">no answer</span>' : `${d.render.dbPingMs} ms`)}${line("Memory", `${d.render.memoryMb} MB`)}${line("Node", esc(d.render.node))}${commits(d.render.behind)}${d.render.behind && d.render.behind.count ? '<p class="muted" style="font-size:12px;font-weight:600;margin:8px 0 0">Render → Manual Deploy → Deploy latest commit.</p>' : ""}`)}</div><div>` +
      card("Netlify — the app", d.netlify.error ? '<span class="pill quiet">unknown</span>' : behindPill(d.netlify.behind), d.netlify.error ? `<p class="muted" style="font-weight:600">${esc(d.netlify.error)}</p>` : `${line("Running", d.netlify.commit ? `<span class="num">${esc(d.netlify.commit)}</span>` : '<span class="muted">a local build</span>')}${line("Built", d.netlify.builtAt ? esc(ago(d.netlify.builtAt)) : "—")}${commits(d.netlify.behind)}${d.netlify.behind && d.netlify.behind.count ? '<p class="muted" style="font-size:12px;font-weight:600;margin:8px 0 0">Netlify → Deploys → Trigger deploy → Deploy site.</p>' : ""}`) +
      errorsCard(d.errors) +
      card("Background checks", "", `${alertsLine(d.alerts)}${line("Books checked", d.checks.booksAt ? `${esc(ago(d.checks.booksAt))} · ${d.checks.booksOk ? '<span class="up">add up</span>' : '<span class="down">off</span>'}` : "never")}${line("Rates fetched", d.checks.ratesAt ? esc(ago(d.checks.ratesAt)) : "never")}${d.alerts && d.alerts.lastRun && Date.now() - new Date(d.alerts.lastRun) > 15 * 60000 ? '<p class="muted" style="font-size:12px;font-weight:600;margin:8px 0 0">Alerts have not run for a while: the server was probably asleep. The keep-awake job on GitHub (Actions → Keep the API awake) stops that.</p>' : ""}`) + `</div></div>`;
  }
  function viewGrowth() {
    const d = S.grow;
    if (!d) return loading("Growth", "Who joins, who keeps paying");
    const t = d.totals;
    const labels = [d.days[0].day.slice(5), d.days[14].day.slice(5), d.days[29].day.slice(5)];
    const chart = columns(d.days.map((x) => x.n), null, labels, `peak ${Math.max(0, ...d.days.map((x) => x.n))}`);
    const maxF = Math.max(1, d.funnel[0].n);
    const funnel = d.funnel.map((f, i) => `<div class="row"><div class="grow"><div class="name">${esc(f.step)}</div><div class="pbar" style="max-width:none"><i style="width:${(f.n / maxF) * 100}%;background:var(--accent)"></i></div></div><div class="amt">${INT.format(f.n)}${i ? ` <span class="muted" style="font-weight:700">· ${d.funnel[0].n ? Math.round((f.n / d.funnel[0].n) * 100) : 0}%</span>` : ""}</div></div>`).join("");
    const coh = d.cohorts.length ? `<div class="table-wrap"><table><thead><tr><th>Joined</th><th class="r">People</th>${Array.from({ length: Math.max(...d.cohorts.map((c) => c.weeks.length)) }, (_, i) => `<th class="r">Week ${i + 1}</th>`).join("")}</tr></thead><tbody>${d.cohorts.map((c) => `<tr><td>${c.weeksAgo === 0 ? "This week" : c.weeksAgo === 1 ? "Last week" : `${c.weeksAgo} weeks ago`}</td><td class="r">${INT.format(c.joined)}</td>${c.weeks.map((p) => `<td class="r"><span class="heat" style="--p:${p}">${p}%</span></td>`).join("")}</tr>`).join("")}</tbody></table></div><p class="muted" style="font-size:12px;font-weight:600;margin:8px 0 0">Of the people who joined that week, how many made a payment in each week after.</p>` : '<p class="muted">No one joined in the last six weeks.</p>';
    return header("Growth", "Who joins, who keeps paying · last 30 days") +
      `<div class="kpis" style="grid-template-columns:repeat(auto-fit,minmax(150px,1fr))">${[["Accounts", t.accounts, "people, not shops"], ["Joined", t.joined30, "last 30 days"], ["Paid this week", t.paid7, "people who paid"], ["Paid this month", t.paid30, "people who paid"]].map(([l, v, x]) => `<div class="kpi" style="cursor:default"><span class="label">${l}</span><span class="val">${count(v)}</span><span class="delta muted">${x}</span></div>`).join("")}</div>` +
      `<div class="grid g2 tgrid"><div>${card("Joined each day", "last 30 days", chart)}${card("Where they stop", "people who joined in 30 days", `<div class="rows">${funnel}</div>`)}</div><div>${card("Who keeps paying", "week by week", coh)}${card("Countries", "joined in 30 days", `<div class="rows">${d.countries.map((c) => `<div class="row"><div class="grow"><div class="name">${isoChip(c.iso)} ${esc(c.name)}</div></div><div class="amt">${INT.format(c.n)}</div></div>`).join("") || '<p class="muted">None.</p>'}</div>`)}${card("Referrals", `${d.referrals.share}% joined with a referral`, `<div class="rows">${d.referrals.top.map((r) => `<button type="button" class="row tap" data-account="${esc(r.symbolId)}" style="width:100%;border:none;background:none;text-align:left;font:inherit;color:inherit"><div class="grow"><div class="name">${esc(r.name)}</div></div><div class="amt">${plural(r.n, "person")}</div></button>`).join("") || '<p class="muted" style="font-weight:600;margin:6px 0 0">No referrals in 30 days.</p>'}</div>`)}</div></div>`;
  }
  function viewShops() {
    const d = S.shopsD;
    if (!d || d.period !== S.period) return loading("Shops", "Every shop, by takings");
    const rows = d.shops.map((x) => `<button type="button" class="row tap" data-account="${esc(x.symbolId)}" style="width:100%;border:none;background:none;text-align:left;font:inherit;color:inherit;flex-wrap:wrap"><div class="grow"><div class="name">${esc(x.name)} <span class="muted" style="font-weight:700">· ${esc(x.owner || "")}${x.category ? ` · ${esc(x.category)}` : ""}</span></div><div class="meta">${plural(x.payments, "payment")} · ${plural(x.payers, "payer")}${x.complaints ? ` · ${plural(x.complaints, "complaint")} in 30 days${x.openComplaints ? ` (${x.openComplaints} open)` : ""}` : ""}${x.replyHours !== null ? ` · answers in ${x.replyHours < 1 ? `${Math.round(x.replyHours * 60)} min` : `${x.replyHours} h`}` : ""}</div>${x.hidden || x.holds.length ? `<div style="margin-top:4px">${x.hidden ? '<span class="pill bad">hidden</span> ' : ""}${x.holds.filter((h) => h !== "shop").map((h) => `<span class="pill bad">${h === "sending" ? "payments paused" : "payouts paused"}</span>`).join(" ")}</div>` : ""}</div><div class="amt">${money(x.takings, x.currency)}</div></button>`).join("");
    return header("Shops", `${plural(d.total, "shop")} · by takings, compared in ${esc(d.viewerCurrency)}`) + periodRow() + card("Takings", PERIODS.find((p) => p[0] === d.period)[1], `<div class="rows">${rows || '<p class="muted" style="font-weight:600;margin:6px 0 0">No shops yet.</p>'}</div>`);
  }
  // ── Liquidity: where members' balances sit, largest first ──
  // The app shows members a public board they can hide from. This is the
  // staff side of it: nobody is left out (a hidden member is marked), with
  // how concentrated the money is and how it splits by country.
  function viewLiquidity() {
    const d = S.liqD;
    if (!d) return loading("Liquidity", "Where members' balances sit");
    const c = d.currency, pct = (n) => `${Number(n).toLocaleString("en-US", { maximumFractionDigits: 2 })}%`;
    const kpi = (l, v, x) => `<div class="kpi" style="cursor:default"><span class="label">${l}</span><span class="val">${v}</span><span class="delta muted">${x}</span></div>`;
    const bar = (p) => `<div style="height:6px;border-radius:6px;background:var(--surface-alt);margin-top:6px;overflow:hidden"><div style="height:100%;width:${Math.max(0, Math.min(100, Number(p) || 0))}%;background:var(--accent);border-radius:6px"></div></div>`;
    const rows = d.rows.map((x) => `<button type="button" class="row tap" ${x.symbolId ? `data-account="${esc(x.symbolId)}"` : "disabled"} style="width:100%;border:none;background:none;text-align:left;font:inherit;color:inherit"><span class="num" style="width:34px;flex-shrink:0;font-weight:800;color:${x.rank <= 3 ? "var(--accent)" : "var(--ink-faint)"}">${x.rank}</span><div class="grow"><div class="name">${esc(x.name)} ${isoChip(x.countryIso)}</div><div class="meta">${pct(x.share)} of total${x.ownCurrency !== c ? ` · holds ${money(x.ownAmount, x.ownCurrency)}` : ""}</div>${x.hidden ? '<div style="margin-top:4px"><span class="pill quiet">hidden from the app\'s board</span></div>' : ""}</div><div class="amt">${money(x.amount, c)}</div></button>`).join("");
    const lands = d.countries.map((x) => `<div class="row"><div class="grow"><div class="name">${isoChip(x.iso)} ${plural(x.holders, "holder")}</div><div class="meta">${pct(x.share)} of total${x.currency !== c ? ` · ${money(x.ownAmount, x.currency)} there` : ""}</div>${bar(x.share)}</div><div class="amt">${money(x.amount, c)}</div></div>`).join("");
    const k = d.concentration;
    return header("Liquidity", `Where members' balances sit · every country counted in ${esc(c)} at today's rates`) +
      `<div class="kpis" style="grid-template-columns:repeat(auto-fit,minmax(150px,1fr))">${kpi("Total held by members", money(d.total, c), `${plural(d.holders, "member")} with a balance`)}${kpi("Largest holder", pct(k.top1), "of the total")}${kpi("Top 10 holders", pct(k.top10), "of the total")}${kpi("Hidden from the board", count(d.hiddenCount), d.hiddenCount ? `${money(d.hiddenAmount, c)} between them` : "nobody has hidden")}</div>` +
      (d.unconverted ? `<div class="note">${plural(d.unconverted, "member")} left out: no exchange rate for their currency today.</div>` : "") +
      `<div class="grid g2 tgrid"><div>${card("Largest balances", `top ${d.rows.length} of ${INT.format(d.members)}`, `<div class="rows">${rows || '<p class="muted" style="font-weight:600;margin:6px 0 0">No balances yet.</p>'}</div>`)}</div><div>${card("By country", "of the total", `<div class="rows">${lands || '<p class="muted" style="font-weight:600;margin:6px 0 0">None.</p>'}</div>`)}${card("How to read this", "", `<p class="muted" style="font-weight:600;margin:0;line-height:1.5">GLOOBAL balances only (not GLOOBAL Bank, Essentials or pools). ${plural(d.empty, "member")} hold nothing. A member who hid from the app's board is still counted and listed here; members never see each other's GLOOBAL ID there. Tap a row to open the account.</p>`)}</div></div>`;
  }
  function viewRisk() {
    const d = S.riskD;
    if (!d) return loading("Risk", "Signals worth a look");
    const KIND = { fast_money: "fast money", new_busy: "new and busy", failing: "failing payments", complaints: "complaints", pin: "wrong PINs" };
    const rows = d.signals.map((x) => `<button type="button" class="row tap" data-account="${esc(x.symbolId)}" style="width:100%;border:none;background:none;text-align:left;font:inherit;color:inherit"><span class="score" style="--s:${x.score}">${x.score}</span><div class="grow"><div class="name">${esc(x.name)}${x.holds.length ? ` <span class="pill bad">on hold</span>` : ""}</div>${x.reasons.map((r) => `<div class="meta" style="white-space:normal"><b style="color:var(--ink-soft)">${esc(KIND[r.kind] || r.kind)}</b> — ${esc(r.text)}</div>`).join("")}</div><span class="muted" style="font-weight:800">›</span></button>`).join("");
    const held = d.onHold.map((h) => `<button type="button" class="row tap" data-account="${esc(h.symbolId)}" style="width:100%;border:none;background:none;text-align:left;font:inherit;color:inherit"><div class="grow"><div class="name">${esc(h.name)}</div><div class="meta">${h.kinds.map((k) => ({ sending: "payments paused", payouts: "payouts paused", shop: "shop hidden" }[k])).join(" · ")}</div></div><span class="pill bad">on</span></button>`).join("");
    return header("Risk", "Signals worth a look · last 24 hours, complaints over 30 days") +
      `<div class="grid g2 tgrid"><div>${card("Signals", `${d.signals.length} accounts`, `<div class="rows">${rows || '<p class="muted" style="font-weight:600;margin:6px 0 0">Nothing stands out right now.</p>'}</div><p class="muted" style="font-size:11.5px;font-weight:600;margin:8px 0 0">A score adds up its reasons, out of 100. Open an account to look closer, or to put it on hold.</p>`)}</div><div>${card("On hold now", `${d.onHold.length}`, `<div class="rows">${held || '<p class="muted" style="font-weight:600;margin:6px 0 0">No holds.</p>'}</div>`)}</div></div>`;
  }
  const LIVE_ICON = { pay: ["var(--accent-soft)", "var(--accent)", "↑"], fail: ["var(--bad-soft)", "var(--bad)", "×"], join: ["var(--good-soft)", "var(--good)", "+"], complaint: ["var(--bad-soft)", "var(--bad)", "!"], bank: ["var(--accent-soft)", "var(--accent-2)", "B"], chat: ["var(--good-soft)", "var(--good)", "?"], staff: ["var(--surface-alt)", "var(--ink-soft)", "•"] };
  function viewLive() {
    const d = S.liveD;
    if (!d) return loading("Live feed", "Everything as it happens");
    const rows = d.events.map((e) => { const [bg, fg, ch] = LIVE_ICON[e.kind] || LIVE_ICON.staff; return `<div class="row${e.fresh ? " fresh" : ""}"><span class="ev" style="background:${bg};color:${fg};font-weight:900">${ch}</span><div class="grow"><div class="name">${esc(e.title)}</div><div class="meta">${clock(e.at)} · ${ago(e.at)}${e.detail ? ` · ${esc(String(e.detail).replace(/_/g, " "))}` : ""}${e.status && !["success", "info"].includes(e.status) ? ` · ${esc(e.status)}` : ""}</div></div>${e.amount !== null && e.amount !== undefined ? `<div class="amt">${money(e.amount, e.currency, false)}</div>` : ""}</div>`; }).join("");
    return header("Live feed", "Everything as it happens · checks every 10 seconds") + `<section class="card airy"><div class="rows">${rows || '<p class="muted" style="font-weight:600;margin:0">Quiet for the last six hours.</p>'}</div></section>`;
  }
  function viewAlerts() {
    const d = S.alertsD;
    if (!d) return loading("Alerts", "What reaches your phone");
    const dr = S.alertsDraft || { on: d.kinds.filter((k) => k.on).map((k) => k.kind), morningAt: d.morningAt };
    const toggles = d.kinds.map((k) => { const on = dr.on.includes(k.kind); return `<div class="row"><div class="grow"><div class="name" style="white-space:normal">${esc(k.words)}</div>${k.kind === "morning" && on ? `<div style="margin-top:6px;display:flex;align-items:center;gap:8px"><label class="meta" for="alert-at" style="margin:0">at</label><input id="alert-at" type="time" value="${esc(dr.morningAt)}" style="border:1.5px solid var(--line);border-radius:10px;padding:5px 8px;font:inherit;background:var(--surface);color:var(--ink)"></div>` : ""}</div><button type="button" class="switch" role="switch" aria-checked="${on}" data-alert-toggle="${k.kind}" aria-label="${esc(k.words)}"><i></i></button></div>`; }).join("");
    const recent = d.recent.map((r) => `<a class="row tap" href="${esc(r.url || "/")}" style="color:inherit;text-decoration:none"><div class="grow"><div class="name" style="white-space:normal">${esc(r.title)}</div><div class="meta" style="white-space:normal">${esc(r.body || "")} · ${ago(r.at)}${r.pushed ? " · reached your phone" : ""}</div></div></a>`).join("");
    const dirty = S.alertsDraft !== null;
    return header("Alerts", "What reaches your phone") + (d.pushEnabled ? "" : '<div class="note" style="margin-bottom:12px">Alerts are kept here, but the server has no push keys, so nothing reaches phones yet.</div>') +
      `<div class="grid g2 tgrid"><div>${card("Send me", "", `<div class="rows">${toggles}</div><div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap"><button type="button" class="btn" data-alerts-save style="flex:1" ${dirty ? "" : "disabled"}>Save</button><button type="button" class="btn quiet" data-alerts-test style="flex:1">Send me a test</button></div>${alertsBtn()}${realRole() === "admin" ? '<button type="button" class="btn quiet" data-alerts-check style="width:100%;margin-top:4px">Check everything now</button>' : ""}<p class="muted" style="font-size:11.5px;font-weight:600;margin:8px 0 0">Checked every five minutes. Each thing alerts once a day, however long it lasts.</p>`)}</div><div>${card("Sent to you", `${d.recent.length}`, `<div class="rows">${recent || '<p class="muted" style="font-weight:600;margin:6px 0 0">Nothing yet.</p>'}</div>`)}</div></div>`;
  }

  /* ── Ask GLOOBAL (0223) ──
     What people asked the app's question helper, which answers worked, and
     the cards themselves — in English, हिन्दी, Hinglish and தமிழ். A change is
     saved first and sent to the app after; a card about money is sent out
     by someone other than whoever wrote the change. */
  const G_LANGS = [["en", "English"], ["hi", "हिन्दी"], ["hl", "Hinglish"], ["ta", "தமிழ்"]];
  const G_LANG_NAME = Object.fromEntries(G_LANGS);
  const G_TOPICS = { send: "Sending", receive: "Receiving", bank: "GLOOBAL Bank", essentials: "My Essentials", shop: "My shop", geu: "CEL", account: "Account", help: "Help" };
  const G_SCREENS = { send: "Send", bank: "GLOOBAL Bank", essentials: "My Essentials", shop: "My shop" };
  const G_TARGETS = { send: "Send", bank: "GLOOBAL Bank", essentials: "My Essentials", myshop: "My shop", history: "History", receive: "Receive", scan: "Scanner", complaints: "Complaints & reports", security: "Security", referral: "Referrals", notifications: "Notifications", help: "Chat with us" };
  const gq = (c) => (c && c.t && c.t.en ? c.t.en.q : "");
  const gRich = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>");
  const gArea = (id, val, ph, rows = 4) => `<textarea id="${id}" rows="${rows}" placeholder="${esc(ph)}" style="width:100%;border-radius:12px;border:1.5px solid var(--line);background:var(--surface);padding:9px 11px;font:inherit;font-size:13.5px;line-height:1.5;color:var(--ink)">${esc(val)}</textarea>`;
  const gSelect = (id, val, opts) => `<select id="${id}" style="width:100%;border-radius:12px;border:1.5px solid var(--line);background:var(--surface);padding:9px 10px;font:inherit;font-size:13.5px;color:var(--ink)">${opts.map(([k, l]) => `<option value="${esc(k)}" ${k === val ? "selected" : ""}>${esc(l)}</option>`).join("")}</select>`;
  function gStatus(c) {
    if (c.draft) return `<span class="pill warn">change waiting${c.needsSecond ? " · 2nd person" : ""}</span>`;
    if (c.hidden) return '<span class="pill quiet">not in the app</span>';
    if (!c.live) return '<span class="pill quiet">not sent yet</span>';
    const s = c.stats || {};
    if (s.no > s.yes && s.no >= 2) return '<span class="pill bad">not helping</span>';
    return c.origin === "team" ? '<span class="pill info">written by the team</span>' : c.changed ? '<span class="pill info">changed</span>' : '<span class="pill good">in the app</span>';
  }
  function viewGuide() {
    const d = S.gdata;
    const days = `<div class="tabs" role="group" aria-label="Period" style="margin:0">${[7, 30, 90].map((n) => `<button type="button" data-gdays="${n}" aria-pressed="${S.gdays === n}">${n} days</button>`).join("")}</div>`;
    if (S.gedit) return viewGuideCard();
    if (!d) return loading("Ask GLOOBAL", "What people ask the app, and the answers it gives");
    const t = d.totals, asked = t.asked || 0;
    const pct = (n) => (asked ? `${Math.round((n / asked) * 100)}%` : "—");
    const tiles = [["Questions asked", INT.format(asked), `last ${d.days} days`], ["Answered straight away", pct(t.answer), `${INT.format(t.answer)} questions`], ["Offered a choice", pct(t.choices), `${INT.format(t.choices)} questions`], ["Found nothing", pct(t.none), `${INT.format(t.none)} — these need cards`], ["About their own money", INT.format(t.personal), "handed to a person; words not kept"], ["Said it helped", t.yes + t.no ? `${Math.round((t.yes / (t.yes + t.no)) * 100)}%` : "—", `${INT.format(t.yes)} yes · ${INT.format(t.no)} no`]];
    const kpis = `<div class="kpis" style="grid-template-columns:repeat(auto-fit,minmax(160px,1fr))">${tiles.map(([a, b, c]) => `<div class="kpi" style="cursor:default"><span class="label">${a}</span><span class="val num">${esc(b)}</span><span class="delta muted">${esc(c)}</span></div>`).join("")}</div>`;
    const waiting = d.cards.filter((c) => c.draft).length;
    const tabs = `<div class="tabs" role="group" aria-label="Show">${[["questions", "Questions people asked", d.questions.length], ["cards", "Cards", d.cards.length], ["waiting", "Changes waiting", waiting], ["feedback", "Feedback", (d.feedback || []).length]].map(([k, l, n]) => `<button type="button" data-gtab="${k}" aria-pressed="${S.gtab === k}">${l} <b>${INT.format(n)}</b></button>`).join("")}</div>`;
    const cardOpts = [["", "Add to which card…"], ["__new", "+ A new card"], ...d.cards.map((c) => [c.id, `${gq(c.draft || c.card) || c.id}`])];
    let body = "";
    if (S.gtab === "feedback") {
      // 0238: what people say about Ask GLOOBAL itself, from its "Give
      // feedback". Anonymous; numbers and emails were blanked on arrival.
      const moods = [["good", "Good", "good"], ["ok", "Okay", "warn"], ["bad", "Not good", "bad"]];
      const counts = `<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px">${moods.map(([k, l, tone]) => `<span class="pill ${tone}">${l} · ${INT.format(t[`mood_${k}`] || 0)}</span>`).join("")}</div>`;
      const rowsHtml = (d.feedback || []).map((f) => {
        const m = moods.find((x) => x[0] === f.mood) || ["", "—", "quiet"];
        return `<div class="row" style="align-items:flex-start"><span class="pill ${m[2]}" style="flex-shrink:0">${m[1]}</span><div class="grow" style="min-width:200px"><div class="name" style="white-space:normal;font-weight:${f.text ? 700 : 500}">${f.text ? esc(f.text) : '<span class="muted">No words, just the face.</span>'}</div><div class="meta">${esc(G_LANG_NAME[f.lang] || f.lang || "")} · ${esc(new Date(f.at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }))}</div></div></div>`;
      }).join("");
      body = `<section class="card airy">${counts}${rowsHtml || '<p class="muted" style="font-weight:700;margin:0">No feedback in this time yet. What people send from "Give feedback" in Ask GLOOBAL lands here.</p>'}</section>`;
    } else if (S.gtab === "questions") {
      const rowsHtml = d.questions.map((q, i) => {
        const card = q.cardId && d.cards.find((c) => c.id === q.cardId);
        const how = q.none ? `<span class="pill bad">nothing found ×${INT.format(q.none)}</span>` : q.choices && !q.answer ? '<span class="pill warn">offered a choice</span>' : '<span class="pill good">answered</span>';
        return `<div class="row prob" style="align-items:flex-start"><div class="grow" style="min-width:220px"><div class="name" style="white-space:normal">${esc(q.text)}</div><div class="meta" style="white-space:normal">${esc(G_LANG_NAME[q.lang] || "another language")} · ${ago(q.lastAt)}${card ? ` · answered with “${esc(gq(card.card || card.draft))}”` : ""}</div></div><span class="num" style="font-weight:800;min-width:34px;text-align:right">×${INT.format(q.count)}</span>${how}<div style="display:flex;gap:6px;flex-basis:100%;max-width:520px">${gSelect(`gq-${i}`, q.none ? "" : q.cardId || "", cardOpts)}<button type="button" class="btn quiet" data-gq-add="${i}" style="padding:8px 12px;white-space:nowrap">Add as a way of asking</button></div></div>`;
      }).join("");
      body = `<section class="card airy">${rowsHtml || '<p class="muted" style="font-weight:700;margin:0">Nobody has asked anything in this time yet. Questions typed in the app land here — the ones that found nothing first.</p>'}<p class="muted" style="font-size:11.5px;font-weight:600;margin:10px 0 0">Kept for 90 days, with no name, account or phone. Numbers are blanked (#) before they are stored. A question about someone's own money is counted, never written down.</p></section>`;
    } else {
      const f = S.gfilter.trim().toLowerCase();
      const list = d.cards.filter((c) => (S.gtab !== "waiting" || c.draft) && (!f || `${c.id} ${gq(c.card || c.draft)}`.toLowerCase().includes(f)));
      const rowsHtml = list.map((c) => { const k = c.draft || c.card || { t: {} }; const s = c.stats || {}; return `<button type="button" class="row tap" data-gcard="${esc(c.id)}" style="width:100%;background:none;border-left:none;border-right:none;border-bottom:none;text-align:left;font:inherit;color:inherit;align-items:flex-start"><div class="grow"><div class="name" style="white-space:normal">${esc(gq(k) || c.id)}</div><div class="meta" style="white-space:normal">${esc(c.id)} · ${esc(G_TOPICS[k.topic] || k.topic || "")}${k.money ? " · about money" : ""} · ${G_LANGS.map(([l, n]) => `<span style="${k.t && k.t[l] ? "" : "opacity:.35;text-decoration:line-through"}">${l.toUpperCase()}</span>`).join(" ")}${c.draft ? ` · change by ${esc(c.draftByName)} ${ago(c.draftAt)}` : ""}</div></div><span class="meta num" style="white-space:nowrap;margin-top:2px">shown ${INT.format(s.shown || 0)} · helped ${INT.format(s.yes || 0)} · didn’t ${INT.format(s.no || 0)}</span>${gStatus(c)}</button>`; }).join("");
      body = `<section class="card airy"><div style="display:flex;gap:8px;margin-bottom:8px;flex-wrap:wrap"><input id="g-filter" value="${esc(S.gfilter)}" placeholder="Find a card" style="flex:1;min-width:160px;border-radius:12px;border:1.5px solid var(--line);background:var(--surface);padding:9px 11px;font:inherit;color:var(--ink)"><button type="button" class="btn" data-gnew style="padding:9px 14px">New card</button></div>${rowsHtml || '<p class="muted" style="font-weight:700;margin:0">Nothing here.</p>'}</section>`;
    }
    return header("Ask GLOOBAL", "What people ask the app's question helper, and the answers it gives", days) + kpis + tabs + body;
  }
  function gStartEdit(id, extra) {
    const c = S.gdata.cards.find((x) => x.id === id);
    const base = JSON.parse(JSON.stringify((c && (c.draft || c.card)) || { id, topic: "send", screens: [], money: false, action: null, tour: null, t: { en: { q: "", asks: [], steps: [] } } }));
    let lang = "en";
    if (extra && extra.text) {
      lang = extra.lang && G_LANG_NAME[extra.lang] ? extra.lang : "en";
      base.t[lang] = base.t[lang] || { q: "", asks: [], steps: [] };
      if (!base.t[lang].asks.includes(extra.text)) base.t[lang].asks.push(extra.text);
      if (!c && !base.t[lang].q) base.t[lang].q = extra.text;
    }
    S.gedit = { id: c ? id : "", isNew: !c, work: base, lang, dirty: Boolean(extra) };
    render(); window.scrollTo(0, 0);
  }
  function viewGuideCard() {
    const e = S.gedit, w = e.work;
    const c = !e.isNew && S.gdata.cards.find((x) => x.id === e.id);
    const x = w.t[e.lang] || { q: "", asks: [], steps: [] };
    const tabs = `<div class="tabs" role="group" aria-label="Language" style="margin:4px 0 10px">${G_LANGS.map(([l, n]) => `<button type="button" data-glang="${l}" aria-pressed="${e.lang === l}">${n}${w.t[l] && w.t[l].q ? "" : " <b>—</b>"}</button>`).join("")}</div>`;
    const screens = Object.entries(G_SCREENS).map(([k, l]) => `<button type="button" class="chip" data-gscreen="${k}" aria-pressed="${(w.screens || []).includes(k)}">${esc(l)}</button>`).join("");
    const preview = `<div style="background:var(--bg);border-radius:22px;padding:14px;border:1px solid var(--line)"><div class="eyebrow" style="margin-bottom:8px">In the app · ${esc(G_LANG_NAME[e.lang])}</div><div style="background:var(--surface);border-radius:18px 18px 18px 6px;box-shadow:var(--shadow);padding:12px 14px"><div style="font-weight:800;font-size:14.5px;margin-bottom:6px">${esc(x.q || "The question")}</div>${(x.steps.length ? x.steps : ["The answer, one step per line."]).map((s, i) => `<div style="display:flex;gap:9px;padding:4px 0;font-size:13px;line-height:1.5;color:var(--ink-soft)">${x.steps.length > 1 ? `<span style="width:20px;height:20px;border-radius:50%;background:var(--accent-soft);color:var(--accent);font-size:10.5px;font-weight:900;display:grid;place-items:center;flex-shrink:0">${i + 1}</span>` : ""}<span>${gRich(s)}</span></div>`).join("")}${w.action ? `<div style="margin-top:8px"><span class="pill info">Open ${esc(G_TARGETS[w.action.target] || w.action.target)} →</span>${w.tour ? ' <span class="pill info">Show me</span>' : ""}</div>` : ""}</div></div>`;
    const second = c && c.draft && c.draftMine && c.needsSecond;
    const actions = `<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px"><button type="button" class="btn" data-gsave style="flex:1" ${S.acting ? "disabled" : ""}>${e.isNew ? "Save the new card" : "Save the change"}</button>${c && c.draft && !e.dirty ? `<button type="button" class="btn" data-gpublish style="flex:1" ${second || S.acting ? "disabled" : ""}>Send to the app</button><button type="button" class="btn quiet" data-gdiscard style="flex:1">Drop the change</button>` : ""}${c && c.live ? `<button type="button" class="btn quiet" data-ghide="${c.hidden ? "0" : "1"}" style="flex:1">${c.hidden ? "Put back in the app" : "Take out of the app"}</button>` : ""}</div>${second ? `<p class="muted" style="font-size:12px;font-weight:700;margin:8px 0 0">This card is about money, so someone else on Support or the founder sends your change out.</p>` : ""}${c && c.draft && !e.dirty ? `<p class="muted" style="font-size:12px;font-weight:600;margin:8px 0 0">Waiting: change by ${esc(c.draftByName)}, ${ago(c.draftAt)}. The app still shows the old version until it is sent.</p>` : ""}${e.dirty ? '<p class="muted" style="font-size:12px;font-weight:600;margin:8px 0 0">Not saved yet.</p>' : ""}`;
    const sub = e.isNew ? "A new card — English first, the others can follow" : `${esc(e.id)} · ${c && c.origin === "team" ? "written by the team" : "came with the app"} · shown ${INT.format((c && c.stats.shown) || 0)} · helped ${INT.format((c && c.stats.yes) || 0)} · didn’t ${INT.format((c && c.stats.no) || 0)}`;
    return `<div class="top"><button type="button" class="icon-btn" data-gback aria-label="Back to the guide">${ICON.back}</button><h1>${esc(gq(w) || "New card")}<span class="sub">${sub}</span></h1>${c ? gStatus(c) : ""}</div>` +
      `<div class="grid g2 tgrid"><section class="card airy">
        ${e.isNew ? `<label class="eyebrow" for="g-id">Card name</label><input id="g-id" value="${esc(e.id)}" placeholder="like shop-delivery" autocomplete="off" spellcheck="false" style="width:100%;border-radius:12px;border:1.5px solid var(--line);background:var(--surface);padding:9px 11px;font:inherit;color:var(--ink);margin:6px 0 12px">` : ""}
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px"><div><label class="eyebrow" for="g-topic">About</label><div style="margin-top:6px">${gSelect("g-topic", w.topic, Object.entries(G_TOPICS))}</div></div><div><label class="eyebrow" for="g-target">Its button opens</label><div style="margin-top:6px">${gSelect("g-target", w.action ? w.action.target : "", [["", "No button"], ...Object.entries(G_TARGETS)])}</div></div></div>
        <div class="eyebrow" style="margin-top:12px">The ? on these screens lists it</div><div class="chips" style="margin-top:6px">${screens}</div>
        <div class="row" style="margin-top:10px;border-top:none;padding-left:0"><div class="grow"><div class="name">About money</div><div class="meta" style="white-space:normal">Moving or holding money. A change then needs a second person to send it out.</div></div><button type="button" class="switch" role="switch" aria-checked="${Boolean(w.money)}" data-gmoney aria-label="About money"><i></i></button></div>
        ${tabs}
        <label class="eyebrow" for="g-q">The question</label><input id="g-q" value="${esc(x.q)}" placeholder="How people would ask it, short" style="width:100%;border-radius:12px;border:1.5px solid var(--line);background:var(--surface);padding:9px 11px;font:inherit;font-size:14px;color:var(--ink);margin:6px 0 12px">
        <label class="eyebrow" for="g-asks">Other ways people ask it — one per line</label><div style="margin-top:6px">${gArea("g-asks", x.asks.join("\n"), "Everyday words, short. Spellings people really use.", 5)}</div>
        <label class="eyebrow" for="g-steps" style="display:block;margin-top:12px">The answer — one step per line</label><div style="margin-top:6px">${gArea("g-steps", x.steps.join("\n"), "Plain words. Put a button's name in **two stars** to make it bold.", 5)}</div>
        ${actions}
      </section><section class="card airy">${preview}<p class="muted" style="font-size:11.5px;font-weight:600;margin:10px 0 0">The app finds this card from the question and its other ways of asking, in any of the four languages. More ways of asking = found more often. No AI writes or changes the answer: people see exactly these words.</p></section></div>`;
  }
  // Read what is typed in the editor into the working copy, without a redraw.
  function gRead(id, value) {
    const e = S.gedit; if (!e) return false;
    const w = e.work; const x = (w.t[e.lang] = w.t[e.lang] || { q: "", asks: [], steps: [] });
    if (id === "g-q") x.q = value;
    else if (id === "g-asks") x.asks = value.split("\n").map((s) => s.trim()).filter(Boolean);
    else if (id === "g-steps") x.steps = value.split("\n").map((s) => s.trim()).filter(Boolean);
    else if (id === "g-id") e.id = value.trim().toLowerCase();
    else return false;
    e.dirty = true;
    return true;
  }
  const loadGuide = () => grab(() => window.AdminApi.guide(S.gdays), (r) => { S.gdata = r; }, "guide");
  function gAfter(r) {
    if (!S.gdata) return;
    const i = S.gdata.cards.findIndex((c) => c.id === r.card.id);
    if (i >= 0) S.gdata.cards[i] = r.card; else S.gdata.cards.push(r.card);
    S.gedit = { id: r.card.id, isNew: false, work: JSON.parse(JSON.stringify(r.card.draft || r.card.card)), lang: S.gedit ? S.gedit.lang : "en", dirty: false };
  }

  /* ── Team & roles (0216) ── */
  function viewTeam() {
    const t = S.team;
    const roleKeys = Object.keys(ROLES);
    const seen = (d) => (d ? ago(d) : "never");
    const issued = S.issued ? `<div class="note" style="margin-top:14px;background:var(--good-soft)"><b>${esc(S.issued.name)} is on ${ROLES[S.issued.role].name}.</b> Give them this one-time code; they type it after their PIN, the first time, to make their passkey. It works for 7 days, once.<div class="codebox"><span class="num" data-code>${esc(S.issued.code)}</span><button type="button" class="icon-btn" data-copy aria-label="Copy the code">${ICON.copy}</button></div><small>It is shown only now. Lost it? Add them again for a new one.</small></div>` : "";
    const list = t ? t.team.map((m) => `<div class="pairrow" style="grid-template-columns:minmax(0,1fr) auto auto auto;cursor:default"><span class="pairname" style="flex-direction:column;align-items:flex-start;gap:2px">${esc(m.name || "—")}<span class="meta" style="font-weight:600;color:var(--ink-faint);font-size:11.5px">${esc(m.symbolId)} · ${m.role === "admin" ? "named on Render" : `added by ${esc(m.addedBy || "—")}`}${m.ready ? "" : " · no passkey yet"}</span></span><span class="meta" style="color:var(--ink-faint);font-size:12px;font-weight:700">${seen(m.lastSeen)}</span>${rolePill(m.role)}${m.role === "admin" ? "<span></span>" : `<button type="button" class="chip" data-remove="${esc(m.symbolId)}" style="${S.confirmRemove === m.symbolId ? "background:var(--bad);color:#fff" : ""}">${S.confirmRemove === m.symbolId ? "Tap again to remove" : "Remove"}</button>`}</div>`).join("") : '<p class="muted" style="font-weight:700">Loading…</p>';
    const ids = Array.from(S.add.id);
    const form = `<div class="eyebrow" style="margin-top:18px">Add someone</div><p class="muted" style="font-size:12.5px;font-weight:600;margin:4px 0 8px">They need a GLOOBAL account first. Paste their GLOOBAL ID and pick what they do.</p><input id="add-id" class="id-input" value="${esc(S.add.id)}" placeholder="Their GLOOBAL ID" autocomplete="off" spellcheck="false"><div class="chips" role="radiogroup" aria-label="Role" style="margin-top:10px">${roleKeys.filter((r) => r !== "admin").map((r) => `<button type="button" class="chip" role="radio" data-add-role="${r}" aria-pressed="${S.add.role === r}" aria-checked="${S.add.role === r}">${ROLES[r].name}</button>`).join("")}</div><p class="muted" style="font-size:12px;font-weight:600;margin:8px 0 0">${esc(ROLES[S.add.role].what)}</p><button type="button" class="btn" data-add ${ids.length === 12 && !S.busy ? "" : "disabled"} style="width:100%;margin-top:12px">Add to ${ROLES[S.add.role].name}</button>`;
    return header("Team & roles", "Who works on GLOOBAL, and what each role can see and do") +
      `<section class="card airy"><h3>The team<span class="muted">${t ? `${t.team.length} ${t.team.length === 1 ? "person" : "people"}` : ""}</span></h3>${list}${issued}${form}</section>` +
      `<section class="card airy" style="margin-top:16px"><h3>What each role can do</h3><div class="table-wrap"><table><thead><tr><th></th>${roleKeys.map((r) => `<th class="r">${ROLES[r].name}</th>`).join("")}</tr></thead><tbody>${CAN.map(([what, who]) => `<tr><td>${what}</td>${roleKeys.map((r) => `<td class="r">${who.includes(r) ? '<span class="up" style="font-weight:900">✓</span>' : '<span class="muted">—</span>'}</td>`).join("")}</tr>`).join("")}</tbody></table></div><p class="muted" style="font-size:12px;font-weight:600;margin:10px 0 0">Removing someone ends their sessions at once and deletes their passkeys.</p></section>`;
  }

  /* ── render ── */
  let toastTimer = null;
  function toast(msg) {
    let t = $(".toast");
    if (!t) { t = document.createElement("div"); t.className = "toast"; t.setAttribute("role", "status"); document.body.appendChild(t); }
    t.textContent = msg; t.hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(() => { t.hidden = true; }, 2600);
  }
  // The alerts switch: what this device will do when a chat needs someone.
  function alertsBtn() {
    const a = S.alerts;
    const words = { on: "Alerts on this device: on", off: "Turn on alerts on this device", blocked: "Alerts are blocked in this browser's settings", unsupported: "This browser cannot show alerts", "server-off": "Alerts are off on the server", unknown: "" }[a] || "";
    if (!words) return "";
    const can = a === "on" || a === "off";
    return `<button type="button" class="alerts-btn ${a === "on" ? "is-on" : ""}" ${can ? "data-alerts" : "disabled"} aria-pressed="${a === "on"}">${ICON.alerts}<span>${words}</span></button>`;
  }
  function render() {
    const root = $("#root");
    const session = window.AdminApi.session();
    if (!session) { root.innerHTML = viewGate(); const g = $("#gid"); if (g && S.focus === "gid") { g.focus(); g.setSelectionRange(g.value.length, g.value.length); } const su = $("#setup"); if (su && S.focus === "setup") su.focus(); return; }
    if (S.welcome) { root.innerHTML = viewWelcome(); return; }
    let r = route();
    if (!allowed(r)) { r = ROLES[ROLE()].home; }
    const live = { today: viewToday, audit: viewAudit, desk: viewDesk, ticket: viewTicket, team: viewTeam, lookup: viewLookup, account: viewAccount, countries: viewCountries, country: viewCountry, pair: viewPair, money: viewMoney, books: viewBooks, settlements: viewSettlements, rates: viewRates, problems: viewProblems, complaint: viewComplaint, tcase: viewCase, system: viewSystem, growth: viewGrowth, shops: viewShops, liquidity: viewLiquidity, risk: viewRisk, live: viewLive, alerts: viewAlerts, guide: viewGuide };
    const view = live[r] ? live[r]() : viewSoon(r);
    const navR = r === "ticket" ? "desk" : r === "account" ? "lookup" : ["country", "pair"].includes(r) ? "countries" : ["books", "settlements", "rates"].includes(r) ? "money" : ["complaint", "tcase"].includes(r) ? "problems" : r;
    const nav = roleNav(), tabsK = roleTabs();
    const deskCount = S.desk ? (["finance", "risk"].includes(realRole()) ? S.desk.counts.passed : S.desk.counts.new) : 0;
    const pc = S.problems ? S.problems.counts : null;
    const probCount = pc ? pc.escalated + pc.transfers + (["admin", "finance"].includes(realRole()) ? pc.refunds : 0) : 0;
    const badge = (k) => (k === "problems" && probCount ? `<span class="count">${probCount}</span>` : k === "desk" && deskCount ? `<span class="count">${deskCount}</span>` : "");
    const viewAs = realRole() === "admin" ? `<div class="viewas">View as ${Object.keys(ROLES).map((k) => `<button type="button" class="chip" data-viewas="${k}" aria-pressed="${ROLE() === k}">${ROLES[k].name}</button>`).join("")}</div>` : "";
    const more = nav.filter(([k]) => !tabsK.includes(k));
    // Keep the textarea's caret and the page's scroll across a re-render.
    const focusId = document.activeElement && document.activeElement.id;
    const caret = focusId && document.activeElement.selectionStart;
    const y = window.scrollY;
    root.innerHTML = `<div class="app"><nav class="side" aria-label="Staff"><div class="brand"><span class="brand-mark">G</span><span><b>GLOOBAL</b><small>${ROLES[realRole()].name}</small></span></div>${nav.map(([k, l, part]) => `<button type="button" class="nav-btn ${part ? "is-soon" : ""}" data-go="${k}" ${navR === k ? 'aria-current="page"' : ""}>${ICON[k]}${l}${badge(k)}${part ? `<span class="soon-tag">P${part}</span>` : ""}</button>`).join("")}<div class="side-foot"><b>${esc(session.admin.name || "")}</b> ${rolePill(realRole())}${viewAs}${alertsBtn()}Session ends ${clock(session.expiresAt)} · <button type="button" data-signout class="linkbtn" style="padding:0">Sign out</button></div></nav><main class="main">${S.viewAs && S.viewAs !== "admin" ? `<div class="note" style="margin-bottom:12px">Viewing as <b>${ROLES[S.viewAs].name}</b>: their menu, with what they cannot see hidden. <button type="button" class="linkbtn" data-viewas="admin" style="padding:0">Back to Admin</button></div>` : ""}${view}</main><nav class="tabbar" aria-label="Staff">${tabsK.map((k) => { const [, l] = NAV.find((n) => n[0] === k); return `<button type="button" data-go="${k}" ${navR === k ? 'aria-current="page"' : ""}>${ICON[k]}${l.split(" ")[0]}${badge(k)}</button>`; }).join("")}<button type="button" data-more ${tabsK.includes(navR) ? "" : 'aria-current="page"'}>${ICON.more}More</button></nav></div>${S.more ? `<div class="scrim" data-scrim><div class="sheet" role="dialog" aria-modal="true" aria-label="More"><h2>More</h2>${viewAs}${alertsBtn()}${more.length ? `<div class="more-grid">${more.map(([k, l]) => `<button type="button" data-go="${k}">${ICON[k]}${l}</button>`).join("")}</div>` : ""}<button type="button" class="btn quiet" data-signout>Sign out</button></div></div>` : ""}`;
    if (focusId) { const el = document.getElementById(focusId); if (el) { el.focus(); if (caret != null && el.setSelectionRange) el.setSelectionRange(caret, caret); } }
    window.scrollTo(0, y);
  }

  async function loadToday(quiet) {
    if (S.loading) return;
    S.loading = true; if (!quiet) S.error = "";
    try { S.today = await window.AdminApi.today(); S.todayAt = new Date(); S.error = ""; }
    catch (e) { if (!quiet) S.error = e.message; }
    finally { S.loading = false; if (route() === "today") render(); }
  }
  async function loadAudit() {
    try { const r = await window.AdminApi.audit(); S.audit = r.rows; } catch (e) { S.audit = []; toast(e.message); }
    if (route() === "audit") render();
  }
  async function loadDesk(quiet) {
    try { const d = await window.AdminApi.desk(S.dtab); S.desk = d; if (!S.dtab) S.dtab = d.tab; if (!quiet) S.error = ""; }
    catch (e) { if (!quiet) { S.error = e.message; if (e.status === 403) S.desk = null; } }
    const r = route(); if (r === "desk" || r === "today") render();
  }
  async function loadTicket(quiet) {
    const id = S.ticketId;
    try { const r = await window.AdminApi.ticket(id); if (id === S.ticketId) { S.ticket = r.conversation; if (!quiet) S.error = ""; } }
    catch (e) { if (!quiet) { S.error = e.message; } }
    if (route() === "ticket") render();
  }
  async function search() {
    const q = S.q.trim(); if (q.length < 2) { S.found = null; render(); return; }
    S.searching = true; render();
    try { const r = await window.AdminApi.lookup(q); if (S.q.trim() === q) S.found = r.results; }
    catch (e) { toast(e.message); }
    finally { S.searching = false; if (route() === "lookup") render(); const el = $("#q"); if (el) { el.focus(); el.setSelectionRange(el.value.length, el.value.length); } }
  }
  async function loadAccount() {
    const id = S.accountId;
    try { const r = await window.AdminApi.account(id); if (id === S.accountId) { S.account = r.account; S.error = ""; } }
    catch (e) { S.error = e.message; }
    if (route() === "account") render();
  }
  /* ── alerts on this device (0218) ── */
  const b64ToBytes = (b) => { const p = "=".repeat((4 - (b.length % 4)) % 4); const raw = atob((b + p).replace(/-/g, "+").replace(/_/g, "/")); return Uint8Array.from(raw, (c) => c.charCodeAt(0)); };
  async function swReg() { if (!("serviceWorker" in navigator)) return null; return navigator.serviceWorker.getRegistration().then((r) => r || null); }
  async function checkAlerts() {
    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) { S.alerts = "unsupported"; return; }
    if (Notification.permission === "denied") { S.alerts = "blocked"; return; }
    try {
      const k = await window.AdminApi.pushKey();
      if (!k.enabled) { S.alerts = "server-off"; return; }
      S.pushKey = k.publicKey;
      const reg = await swReg();
      const sub = reg && await reg.pushManager.getSubscription();
      S.alerts = sub ? "on" : "off";
      if (sub) window.AdminApi.pushOn(sub.toJSON()).catch(() => null); // keep it pointed at whoever is signed in
    } catch (e) { S.alerts = "unknown"; }
  }
  async function toggleAlerts() {
    try {
      const reg = await swReg();
      if (!reg) { toast("Open the staff site over https to use alerts."); return; }
      const cur = await reg.pushManager.getSubscription();
      if (cur) { await window.AdminApi.pushOff(cur.endpoint); await cur.unsubscribe(); S.alerts = "off"; toast("Alerts off on this device"); render(); return; }
      const perm = await Notification.requestPermission();
      if (perm !== "granted") { S.alerts = perm === "denied" ? "blocked" : "off"; render(); return; }
      const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToBytes(S.pushKey) });
      await window.AdminApi.pushOn(sub.toJSON());
      S.alerts = "on"; toast("Alerts on. New chats and answers reach this device."); render();
    } catch (e) { toast(e.message || "Could not turn alerts on."); }
  }
  // Countries and Money & books (0219): each screen loads its own figures.
  async function grab(fn, apply, routeName) {
    try { apply(await fn()); S.error = ""; } catch (e) { S.error = e.message; }
    if (route() === routeName) render();
  }
  const loadCountries = () => grab(() => window.AdminApi.countries(S.period), (r) => { S.cdata = r; }, "countries");
  const loadCountry = () => { const iso = S.iso, p = S.period; return grab(() => window.AdminApi.country(iso, p), (r) => { if (iso === S.iso) S.country = { ...r, period: p }; }, "country"); };
  const loadPair = () => { const a = S.pairA, b = S.pairB, p = S.period; return grab(() => window.AdminApi.pair(a, b, p), (r) => { S.pairData = { ...r, key: `${a}/${b}`, periodAsked: p }; }, "pair"); };
  const loadMoney = () => grab(() => window.AdminApi.money(S.period, S.moneyCcy), (r) => { S.mdata = r; }, "money");
  const loadBooks = () => { const c = S.booksCcy; return grab(() => window.AdminApi.books(c), (r) => { if (c === S.booksCcy) S.books = r; }, "books"); };
  const loadSettlements = () => grab(() => window.AdminApi.settlements(S.setlTab), (r) => { S.setl = r; }, "settlements");
  const loadRates = () => grab(() => window.AdminApi.rates(), (r) => { S.rates = r; }, "rates");
  async function setAside() {
    const b = S.books; if (!b || !S.aside) return;
    S.aside.busy = true; render();
    try { const r = await window.AdminApi.setAside(b.currency, S.aside.reason.trim(), b.difference); S.books = r.books; S.aside = null; S.mdata = null; toast(`${b.currency}: set aside. Only a new gap shows red now.`); }
    catch (e) { toast(e.message); if (S.aside) S.aside.busy = false; if (e.code === "moved") loadBooks(); }
    render();
  }
  const loadProblems = (quiet) => grab(() => window.AdminApi.problems(S.ptab), (r) => { S.problems = r; }, "problems");
  const loadComplaint = () => { const id = S.complaintId; return grab(() => window.AdminApi.complaint(id), (r) => { if (id === S.complaintId) S.complaint = r.complaint; }, "complaint"); };
  const loadCase = () => { const ref = S.caseRef; return grab(() => window.AdminApi.transferCase(ref), (r) => { if (ref === S.caseRef) S.tcase = r.case; }, "tcase"); };
  async function loadHolds() { const id = S.accountId; try { const r = await window.AdminApi.holds(id); if (id === S.accountId) S.holds = r; } catch (e) { S.holds = { holds: [], canHold: false }; } if (route() === "account") render(); }
  // One action, then the screen it changed: a toast with what happened.
  async function act(fn, ok, after) {
    if (S.acting) return; S.acting = true;
    try { const r = await fn(); toast(ok); if (after) after(r); S.pform = null; S.pdraft = ""; }
    catch (e) { toast(e.message); }
    finally { S.acting = false; render(); }
  }
  const formText = () => ((S.pform && S.pform.text) || "").trim();
  const loadCorr = () => grab(() => window.AdminApi.corridors(), (r) => { S.corr = r; }, "pair");
  const loadSys = () => grab(() => window.AdminApi.system(), (r) => { S.sys = r; }, "system");
  const loadGrowth = () => grab(() => window.AdminApi.growth(), (r) => { S.grow = r; }, "growth");
  const loadShops = () => { const p = S.period; return grab(() => window.AdminApi.shops(p), (r) => { S.shopsD = r; }, "shops"); };
  const loadLiquidity = () => { return grab(() => window.AdminApi.liquidity(), (r) => { S.liqD = r; }, "liquidity"); };
  const loadRisk = () => grab(() => window.AdminApi.risk(), (r) => { S.riskD = r; }, "risk");
  const loadAlerts = () => grab(() => window.AdminApi.alerts(), (r) => { S.alertsD = r; S.alertsDraft = null; }, "alerts");
  async function loadLive(more) {
    try {
      const r = await window.AdminApi.live(more && S.liveD && S.liveD.events[0] ? S.liveD.events[0].at : null);
      if (more && S.liveD) { const fresh = r.events.map((e) => ({ ...e, fresh: true })); S.liveD = { ...r, events: fresh.concat(S.liveD.events.map((e) => ({ ...e, fresh: false }))).slice(0, 150) }; }
      else S.liveD = r;
      S.error = "";
    } catch (e) { if (!more) S.error = e.message; }
    if (route() === "live") render();
  }
  async function loadTeam() {
    try { S.team = await window.AdminApi.team(); } catch (e) { S.team = { team: [] }; toast(e.message); }
    if (route() === "team") render();
  }
  // An older session, from before roles, learns its role here.
  async function refreshMe() {
    try { const r = await window.AdminApi.me(); const s = window.AdminApi.session(); if (s) { window.AdminApi.save({ ...s, admin: r.admin }); } } catch (e) { /* the 401 path signs out by itself */ }
  }
  function onRoute() {
    window.scrollTo(0, 0); S.error = ""; render();
    if (!window.AdminApi.session() || S.welcome) return;
    const r = route();
    if (!allowed(r)) return;
    if (r === "today") loadToday();
    if (r === "audit") { S.audit = null; loadAudit(); }
    if (r === "desk") loadDesk();
    if (r === "ticket") { if (!S.ticket || S.ticket.id !== S.ticketId) { S.ticket = null; S.draft = ""; S.passing = null; S.passNote = ""; } loadTicket(); }
    if (r === "team") { S.confirmRemove = null; loadTeam(); }
    if (r === "account") { if (!S.account || S.account.symbolId !== S.accountId) S.account = null; loadAccount(); }
    if (r === "countries") loadCountries();
    if (r === "country") loadCountry();
    if (r === "pair") loadPair();
    if (r === "money") loadMoney();
    if (r === "books") { if (!S.aside || S.aside.ccy !== S.booksCcy) S.aside = null; loadBooks(); }
    if (r === "settlements") loadSettlements();
    if (r === "rates") loadRates();
    if (r === "problems") loadProblems();
    if (r === "pair") loadCorr();
    if (r === "system") loadSys();
    if (r === "growth") loadGrowth();
    if (r === "shops") loadShops();
    if (r === "liquidity") loadLiquidity();
    if (r === "risk") loadRisk();
    if (r === "live") { S.liveD = null; loadLive(false); }
    if (r === "alerts") loadAlerts();
    if (r === "guide") { S.gedit = null; loadGuide(); }
    if (r === "complaint") { if (!S.complaint || S.complaint.id !== S.complaintId) { S.complaint = null; S.pform = null; S.pdraft = ""; } loadComplaint(); }
    if (r === "tcase") { if (!S.tcase || S.tcase.ref !== S.caseRef) { S.tcase = null; S.pdraft = ""; } loadCase(); }
    if (r === "account") { if (!S.holds || S.holdsFor !== S.accountId) { S.holds = null; S.holdForm = null; S.holdsFor = S.accountId; } loadHolds(); }
    if (window.AdminApi.session() && !S.problems && allowed("problems") && r !== "problems") window.AdminApi.problems("escalated").then((x) => { S.problems = x; render(); }).catch(() => {});
    if (S.alerts === "unknown") checkAlerts().then(render);
  }
  window.addEventListener("hashchange", onRoute);
  window.addEventListener("admin:signedout", () => { S.stage = "id"; S.welcome = false; S.viewAs = null; S.desk = null; S.ticket = null; S.team = null; S.pin = ""; S.error = "Your admin session ended. Sign in again."; render(); });
  setInterval(() => { if (window.AdminApi.session() && !S.welcome && route() === "today" && document.visibilityState === "visible") loadToday(true); }, 60000);
  // The desk looks for new questions every 20 seconds, an open chat for
  // their answer every 10 — never while someone is typing a reply.
  setInterval(() => { if (window.AdminApi.session() && !S.welcome && route() === "desk" && document.visibilityState === "visible") loadDesk(true); }, 20000);
  setInterval(() => { if (window.AdminApi.session() && !S.welcome && route() === "live" && document.visibilityState === "visible" && S.liveD) loadLive(true); }, 10000);
  setInterval(() => { const a = document.activeElement; if (window.AdminApi.session() && !S.welcome && route() === "ticket" && document.visibilityState === "visible" && !(a && a.tagName === "TEXTAREA" && a.value)) loadTicket(true); }, 10000);

  /* ── sign-in steps ── */
  const fail = (e) => { S.busy = false; S.error = e.message || String(e); render(); };
  async function submitPin() {
    S.busy = true; S.error = ""; render();
    try {
      const r = await window.AdminApi.login(S.id, S.pin);
      S.pre = r.preToken; S.preRole = r.role || null; S.pin = ""; S.busy = false; S.stage = r.step; S.focus = "setup"; render();
      if (r.step === "passkey") usePasskey();
    } catch (e) { S.pin = ""; fail(e); }
  }
  async function makePasskey() {
    if (!window.AdminPasskey.supported()) return fail(new Error("This browser cannot make passkeys. Use Chrome, Edge or Safari on https."));
    S.busy = true; S.error = ""; render();
    try {
      const { options } = await window.AdminApi.setupOptions(S.pre, S.setupCode);
      const response = await window.AdminPasskey.create(options);
      done(await window.AdminApi.setupVerify(S.pre, response));
    } catch (e) { if (e.code === "admin_pre_invalid") { S.stage = "pin"; } fail(e.name ? new Error(window.AdminPasskey.explain(e)) : e); }
  }
  async function usePasskey() {
    if (!window.AdminPasskey.supported()) return fail(new Error("This browser cannot use passkeys. Use Chrome, Edge or Safari on https."));
    S.busy = true; S.error = ""; render();
    try {
      const { options } = await window.AdminApi.passkeyOptions(S.pre);
      const response = await window.AdminPasskey.get(options);
      done(await window.AdminApi.passkeyVerify(S.pre, response));
    } catch (e) { if (e.code === "admin_pre_invalid") { S.stage = "pin"; } if (e.code === "no_passkey") { S.stage = "setup"; } fail(e.name ? new Error(window.AdminPasskey.explain(e)) : e); }
  }
  function done(r) {
    window.AdminApi.save({ token: r.token, expiresAt: r.expiresAt, admin: r.admin });
    S.busy = false; S.pre = null; S.preRole = null; S.setupCode = ""; S.stage = "id"; S.error = ""; S.viewAs = null;
    S.welcome = true; render(); refreshMe();
    toast(`Signed in until ${clock(r.expiresAt)}`);
  }

  async function sendReply(waiting) {
    const text = S.draft.trim(); if (!text || S.sending) return;
    S.sending = true; render();
    try { const r = await window.AdminApi.reply(S.ticketId, text, waiting); S.ticket = r.conversation; S.draft = ""; toast(waiting ? "Sent. Waiting on them." : "Sent. They get a notice."); }
    catch (e) { toast(e.message); }
    finally { S.sending = false; render(); }
  }
  async function addNote() {
    const text = S.draft.trim(); if (!text || S.sending) return;
    S.sending = true; render();
    try { const r = await window.AdminApi.note(S.ticketId, text); S.ticket = r.conversation; S.draft = ""; toast("Note saved. Only staff see it."); }
    catch (e) { toast(e.message); }
    finally { S.sending = false; render(); }
  }
  async function setStatus(st) {
    try { const r = await window.AdminApi.setStatus(S.ticketId, st); S.ticket = r.conversation; toast(st === "done" ? "Marked done" : st === "waiting" ? "Waiting on them" : "Open again"); if (st === "done") { go("desk"); return; } }
    catch (e) { toast(e.message); }
    render();
  }
  async function passOn() {
    const to = S.passing;
    try { const r = await window.AdminApi.pass(S.ticketId, to, S.passNote.trim()); S.ticket = r.conversation; S.passing = null; S.passNote = ""; toast(`Passed to ${ROLES[to].name}`); }
    catch (e) { toast(e.message); }
    render();
  }
  async function addMember() {
    S.busy = true; render();
    try { const r = await window.AdminApi.addMember(S.add.id, S.add.role); S.issued = { name: r.member.name, role: r.member.role, code: r.setupCode }; S.add = { id: "", role: S.add.role }; await loadTeam(); }
    catch (e) { toast(e.message); }
    finally { S.busy = false; render(); }
  }
  async function removeMember(id) {
    if (S.confirmRemove !== id) { S.confirmRemove = id; render(); return; }
    try { await window.AdminApi.removeMember(id); S.confirmRemove = null; S.issued = null; toast("Removed. Their sessions have ended."); await loadTeam(); }
    catch (e) { toast(e.message); }
  }

  document.addEventListener("submit", (e) => { if (e.target.matches("[data-search]")) { e.preventDefault(); search(); } });
  document.addEventListener("click", (e) => {
    const t = e.target.closest("button, [data-scrim]");
    if (!t) return;
    if (t.matches("[data-scrim]") && e.target === t) { S.more = false; render(); return; }
    if (t.dataset.sym) { const a = Array.from(S.id); if (t.dataset.sym === "⌫") a.pop(); else if (a.length < 12) a.push(t.dataset.sym); S.id = a.join(""); S.error = ""; S.focus = null; render(); return; }
    if (t.dataset.gate) { S.stage = t.dataset.gate === "door" ? "door" : "id"; S.error = ""; S.pin = ""; render(); return; }
    if (t.matches("[data-enter]")) { S.welcome = false; const home = ROLES[realRole()].home; if (location.hash.slice(1) !== home) location.hash = home; else onRoute(); return; }
    if (t.dataset.viewas) { S.viewAs = t.dataset.viewas === "admin" ? null : t.dataset.viewas; S.more = false; const r = route(); if (!allowed(r)) go(ROLES[ROLE()].home); else render(); return; }
    if (t.dataset.dtab) { S.dtab = t.dataset.dtab; S.desk = S.desk && { ...S.desk, conversations: [] }; render(); loadDesk(); return; }
    if (t.matches("[data-desk-refresh]")) { loadDesk(); toast("Refreshing"); return; }
    if (t.dataset.account) { location.hash = `account/${encodeURIComponent(t.dataset.account)}`; return; }
    if (t.matches("[data-alerts]")) { toggleAlerts(); return; }
    // Problems (0220)
    if (t.dataset.ptab) { S.ptab = t.dataset.ptab; S.problems = S.problems && { ...S.problems, tab: null }; render(); loadProblems(); return; }
    if (t.matches("[data-prob-refresh]")) { loadProblems(); toast("Refreshing"); return; }
    if (t.matches("[data-preply]")) { const text = S.pdraft.trim(); if (!text) { toast("Write the message first."); return; } act(() => window.AdminApi.complaintReply(S.complaintId, text), "Sent. Both of them get a notice.", (r) => { S.complaint = r.complaint; }); return; }
    if (t.matches("[data-close-open]")) { S.pform = { id: S.complaintId, kind: "close", text: "" }; render(); const x = $("#pform-text"); if (x) x.focus(); return; }
    if (t.matches("[data-close]")) { act(() => window.AdminApi.complaintClose(S.complaintId, formText()), "Closed. Both of them were told.", (r) => { S.complaint = r.complaint; S.problems = null; }); return; }
    if (t.matches("[data-refund-open]")) { S.pform = { id: S.complaintId, kind: "refund", text: "" }; render(); const x = $("#pform-text"); if (x) x.focus(); return; }
    if (t.matches("[data-refund-send]")) { act(() => window.AdminApi.refundPropose(S.complaintId, formText()), "Proposed. Finance is alerted to approve it.", (r) => { S.complaint = r.complaint; S.problems = null; }); return; }
    if (t.dataset.approve) { act(() => window.AdminApi.refundApprove(t.dataset.approve), "Sent back. Both of them see it in their history.", (r) => { S.complaint = r.complaint; S.problems = null; }); return; }
    if (t.dataset.declineOpen) { S.pform = { id: S.complaintId, kind: "decline", rid: t.dataset.declineOpen, text: "" }; render(); const x = $("#pform-text"); if (x) x.focus(); return; }
    if (t.dataset.decline) { act(() => window.AdminApi.refundDecline(t.dataset.decline, formText()), "Declined.", (r) => { if (r.complaint) S.complaint = r.complaint; S.problems = null; }); return; }
    if (t.dataset.creply) { const text = S.pdraft.trim(); if (!text) { toast("Write the answer first."); return; } act(() => window.AdminApi.transferReply(S.caseRef, text, t.dataset.creply), t.dataset.creply === "resolved" ? "Sent and marked solved." : "Sent. They get a notice.", (r) => { S.tcase = r.case; S.problems = null; }); return; }
    // Holds (0220)
    if (t.dataset.holdKind) { S.holdForm = { kind: t.dataset.holdKind, text: "" }; render(); const x = $("#hold-text"); if (x) x.focus(); return; }
    if (t.matches("[data-hold-cancel]")) { S.holdForm = null; render(); return; }
    if (t.matches("[data-hold-set]")) { const f = S.holdForm; act(() => window.AdminApi.holdSet(S.accountId, f.kind, (f.text || "").trim()), "On. The server refuses it from now on.", () => { S.holdForm = null; loadHolds(); }); return; }
    if (t.dataset.holdLiftOpen) { S.holdForm = { lift: t.dataset.holdLiftOpen, text: "" }; render(); const x = $("#hold-text"); if (x) x.focus(); return; }
    if (t.dataset.holdLift) { const f = S.holdForm; act(() => window.AdminApi.holdLift(t.dataset.holdLift, (f && f.text || "").trim()), "Lifted.", () => { S.holdForm = null; loadHolds(); }); return; }
    if (t.dataset.period) { S.period = t.dataset.period; render(); const r = route(); ({ countries: loadCountries, country: loadCountry, pair: loadPair, money: loadMoney, shops: loadShops })[r]?.(); return; }
    // Controls between countries (0221)
    if (t.dataset.corrOpen) { S.corrForm = { key: t.dataset.corrOpen, dir: t.dataset.corrOpen.replace("/", ">"), mode: "pause", cap: "", reason: "" }; render(); return; }
    if (t.dataset.corrDir && S.corrForm) { S.corrForm.dir = t.dataset.corrDir; render(); return; }
    if (t.dataset.corrMode && S.corrForm) { S.corrForm.mode = t.dataset.corrMode; render(); return; }
    if (t.matches("[data-corr-cancel]")) { S.corrForm = null; render(); return; }
    if (t.matches("[data-corr-set]")) { const f = S.corrForm; const [from, to] = f.dir.split(">"); act(() => window.AdminApi.corridorSet({ from, to, paused: f.mode === "pause", cap: f.mode === "cap" ? Number(String(f.cap).replace(/[^\d.]/g, "")) : null, reason: (f.reason || "").trim() }), f.mode === "pause" ? "Paused. The next payment that way is refused." : "Capped. The send screen shows the new limit.", (r) => { S.corr = r; S.corrForm = null; }); return; }
    if (t.dataset.corrLift) { act(() => window.AdminApi.corridorLift(t.dataset.corrLift), "Lifted. Payments go through as normal.", (r) => { S.corr = r; }); return; }
    if (t.matches("[data-rates-refresh]")) { const list = (S.rates && S.rates.rates || []).filter((r) => r.ageHours === null || r.ageHours >= 6).map((r) => r.currency); if (!list.length) { toast("All rates are under six hours old."); return; } S.refreshing = true; render(); window.AdminApi.ratesRefresh(list).then((r) => { toast(r.failed.length ? `Refreshed ${r.done.length}; ${r.failed.length} failed: ${r.failed.map((f) => f.currency).join(", ")}` : `Refreshed ${r.done.join(", ")}.`); }).catch((e) => toast(e.message)).finally(() => { S.refreshing = false; loadRates(); }); return; }
    if (t.matches("[data-sys-refresh]")) { S.sys = null; render(); loadSys(); return; }
    // Alerts (0221)
    if (t.dataset.alertToggle && S.alertsD) { const dr = S.alertsDraft || { on: S.alertsD.kinds.filter((k) => k.on).map((k) => k.kind), morningAt: S.alertsD.morningAt }; const k = t.dataset.alertToggle; dr.on = dr.on.includes(k) ? dr.on.filter((x) => x !== k) : dr.on.concat(k); S.alertsDraft = dr; render(); return; }
    if (t.matches("[data-alerts-save]") && S.alertsDraft) { const dr = S.alertsDraft; act(() => window.AdminApi.alertsPrefs(dr.on, dr.morningAt), "Saved.", (r) => { S.alertsD = r; S.alertsDraft = null; }); return; }
    if (t.matches("[data-alerts-test]")) { act(() => window.AdminApi.alertsTest(), "Sent. If alerts are on for this device, it arrives in a moment.", (r) => { S.alertsD = r; }); return; }
    if (t.matches("[data-alerts-check]")) { act(() => window.AdminApi.alertsCheck(), "Checked.", (r) => { toast(r.sent ? `Checked: ${plural(r.sent, "alert")} sent.` : "Checked: nothing new."); loadAlerts(); }); return; }
    if (t.dataset.moneyccy) { S.moneyCcy = t.dataset.moneyccy; S.mdata = null; render(); loadMoney(); return; }
    if (t.dataset.setl) { S.setlTab = t.dataset.setl; S.setl = null; render(); loadSettlements(); return; }
    if (t.dataset.aside) { S.aside = { ccy: t.dataset.aside, reason: "", busy: false }; render(); const ta = $("#aside-reason"); if (ta) ta.focus(); return; }
    if (t.matches("[data-aside-cancel]")) { S.aside = null; render(); return; }
    if (t.matches("[data-aside-confirm]")) { if ((S.aside?.reason || "").trim().length < 10) { toast("Write why this gap is explained (at least a sentence)."); return; } setAside(); return; }
    if (t.matches("[data-lens]")) { setLens(lens === "geu" ? "local" : "geu"); render(); return; }
    if (t.dataset.ticket) { location.hash = `ticket/${encodeURIComponent(t.dataset.ticket)}`; return; }
    if (t.dataset.quick) { S.draft = S.draft ? `${S.draft} ${t.dataset.quick}` : t.dataset.quick; S.focusReply = true; render(); const ta = $("#reply"); if (ta) { ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length); } return; }
    if (t.matches("[data-send]")) { sendReply(false); return; }
    if (t.matches("[data-send-wait]")) { sendReply(true); return; }
    if (t.matches("[data-note]")) { addNote(); return; }
    if (t.dataset.status) { setStatus(t.dataset.status); return; }
    if (t.dataset.pass) { S.passing = S.passing === t.dataset.pass ? null : t.dataset.pass; render(); return; }
    if (t.matches("[data-pass-confirm]")) { passOn(); return; }
    if (t.matches("[data-pass-cancel]")) { S.passing = null; S.passNote = ""; render(); return; }
    if (t.dataset.addRole) { S.add.role = t.dataset.addRole; render(); return; }
    if (t.matches("[data-add]")) { addMember(); return; }
    if (t.dataset.remove) { removeMember(t.dataset.remove); return; }
    if (t.matches("[data-copy]")) { const c = S.issued && S.issued.code; if (c && navigator.clipboard) navigator.clipboard.writeText(c).then(() => toast("Code copied"), () => toast("Copy it by hand")); return; }
    if (t.matches("[data-next]")) { S.stage = "pin"; S.error = ""; render(); return; }
    if (t.matches("[data-back-id]")) { S.stage = "id"; S.pin = ""; S.error = ""; render(); return; }
    if (t.dataset.key) { if (S.busy) return; if (t.dataset.key === "⌫") S.pin = S.pin.slice(0, -1); else if (S.pin.length < 6) S.pin += t.dataset.key; S.error = ""; render(); if (S.pin.length === 6) submitPin(); return; }
    if (t.matches("[data-setup]")) { makePasskey(); return; }
    if (t.matches("[data-passkey]")) { usePasskey(); return; }
    if (t.dataset.gdays) { S.gdays = Number(t.dataset.gdays); S.gdata = null; render(); loadGuide(); return; }
    if (t.dataset.gtab) { S.gtab = t.dataset.gtab; render(); return; }
    if (t.dataset.gcard) { gStartEdit(t.dataset.gcard); return; }
    if (t.hasAttribute("data-gnew")) { gStartEdit("", null); return; }
    if (t.hasAttribute("data-gback")) { S.gedit = null; render(); return; }
    if (t.dataset.gqAdd != null && S.gdata) { const q = S.gdata.questions[Number(t.dataset.gqAdd)]; const sel = $(`#gq-${t.dataset.gqAdd}`); const to = sel && sel.value; if (!to) { toast("Pick the card it belongs to first."); return; } gStartEdit(to === "__new" ? "" : to, { text: q.text, lang: q.lang }); return; }
    if (t.dataset.glang && S.gedit) { S.gedit.lang = t.dataset.glang; render(); return; }
    if (t.dataset.gscreen && S.gedit) { const w = S.gedit.work; w.screens = (w.screens || []).includes(t.dataset.gscreen) ? w.screens.filter((x) => x !== t.dataset.gscreen) : (w.screens || []).concat(t.dataset.gscreen); S.gedit.dirty = true; render(); return; }
    if (t.hasAttribute("data-gmoney") && S.gedit) { S.gedit.work.money = !S.gedit.work.money; S.gedit.dirty = true; render(); return; }
    if (t.hasAttribute("data-gsave") && S.gedit) { const e = S.gedit; if (!e.id) { toast("Give the card a name first, like shop-delivery."); return; } act(() => window.AdminApi.guideDraft(e.id, e.work, e.isNew), "Saved. It goes to the app when it is sent.", gAfter); return; }
    if (t.hasAttribute("data-gpublish") && S.gedit) { act(() => window.AdminApi.guidePublish(S.gedit.id), "Sent. The app shows it the next time someone opens Ask GLOOBAL.", gAfter); return; }
    if (t.hasAttribute("data-gdiscard") && S.gedit) { act(() => window.AdminApi.guideDiscard(S.gedit.id), "Dropped.", (r) => { gAfter(r); if (!r.card.live && !r.card.draft) { S.gedit = null; loadGuide(); } }); return; }
    if (t.dataset.ghide && S.gedit) { act(() => window.AdminApi.guideHide(S.gedit.id, t.dataset.ghide === "1"), t.dataset.ghide === "1" ? "Taken out of the app." : "Back in the app.", gAfter); return; }
    if (t.dataset.go) { go(t.dataset.go); return; }
    if (t.matches("[data-more]")) { S.more = true; render(); return; }
    if (t.matches("[data-refresh]")) { loadToday(); toast("Refreshing"); return; }
    if (t.matches("[data-theme-toggle]")) { const cur = document.documentElement.getAttribute("data-theme") || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"); document.documentElement.setAttribute("data-theme", cur === "dark" ? "light" : "dark"); return; }
    if (t.matches("[data-signout]")) { window.AdminApi.logout(); window.AdminApi.clear(); S.more = false; S.today = null; S.audit = null; S.desk = null; S.ticket = null; S.team = null; S.viewAs = null; S.welcome = false; S.issued = null; S.account = null; S.found = null; S.q = ""; S.sys = null; S.grow = null; S.shopsD = null; S.liqD = null; S.riskD = null; S.liveD = null; S.alertsD = null; S.alertsDraft = null; S.corr = null; S.problems = null; S.complaint = null; S.tcase = null; S.holds = null; S.cdata = null; S.country = null; S.pairData = null; S.mdata = null; S.books = null; S.setl = null; S.rates = null; S.aside = null; S.alerts = "unknown"; S.stage = "door"; S.error = ""; render(); return; }
  });
  document.addEventListener("input", (e) => {
    if (e.target.id === "gid") { S.id = Array.from(e.target.value.replace(/\s/g, "")).filter((c) => SYMBOLS.includes(c)).slice(0, 12).join(""); S.focus = "gid"; render(); }
    if (e.target.id === "reply") { S.draft = e.target.value; return; }
    if (gRead(e.target.id, e.target.value)) return;
    if (e.target.id === "g-filter") { S.gfilter = e.target.value; render(); return; }
    if (e.target.id === "q") { S.q = e.target.value; return; }
    if (e.target.id === "aside-reason" && S.aside) { S.aside.reason = e.target.value; return; }
    if (e.target.id === "pdraft") { S.pdraft = e.target.value; return; }
    if (e.target.id === "corr-cap" && S.corrForm) { S.corrForm.cap = e.target.value; return; }
    if (e.target.id === "corr-reason" && S.corrForm) { S.corrForm.reason = e.target.value; return; }
    if (e.target.id === "alert-at" && S.alertsD) { const dr = S.alertsDraft || { on: S.alertsD.kinds.filter((k) => k.on).map((k) => k.kind), morningAt: S.alertsD.morningAt }; dr.morningAt = e.target.value; S.alertsDraft = dr; const b = $("[data-alerts-save]"); if (b) b.disabled = false; return; }
    if (e.target.id === "pform-text" && S.pform) { S.pform.text = e.target.value; return; }
    if (e.target.id === "hold-text" && S.holdForm) { S.holdForm.text = e.target.value; return; }
    if (e.target.id === "passnote") { S.passNote = e.target.value; return; }
    if (e.target.id === "add-id") { S.add.id = Array.from(e.target.value.replace(/\s/g, "")).filter((c) => SYMBOLS.includes(c)).slice(0, 12).join(""); const b = $("[data-add]"); if (b) b.disabled = Array.from(S.add.id).length !== 12; if (e.target.value !== S.add.id) { e.target.value = S.add.id; } return; }
    if (e.target.id === "setup") { S.setupCode = e.target.value; S.focus = "setup"; const b = $("[data-setup]"); if (b) b.disabled = !S.setupCode; }
  });
  document.addEventListener("change", (e) => {
    if (!S.gedit) return;
    if (e.target.id === "g-topic") { S.gedit.work.topic = e.target.value; S.gedit.dirty = true; render(); }
    if (e.target.id === "g-target") { S.gedit.work.action = e.target.value ? { target: e.target.value } : null; S.gedit.dirty = true; render(); }
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && S.more) { S.more = false; render(); }
    if (!window.AdminApi.session() && S.stage === "pin" && /^[0-9]$/.test(e.key) && S.pin.length < 6 && !S.busy) { S.pin += e.key; render(); if (S.pin.length === 6) submitPin(); }
    if (!window.AdminApi.session() && S.stage === "pin" && e.key === "Backspace") { S.pin = S.pin.slice(0, -1); render(); }
    if (e.key === "Enter" && e.target.id === "setup" && S.setupCode) makePasskey();
    if (e.key === "Enter" && e.target.id === "gid" && Array.from(S.id).length === 12) { S.stage = "pin"; render(); }
  });

  if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")) navigator.serviceWorker.register("/sw.js").catch(() => {});
  if (window.AdminApi.session()) refreshMe().then(onRoute); else onRoute();
})();
