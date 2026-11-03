// Calls to the GLOOBAL API. The admin token lives only for this tab
// (sessionStorage) and only 8 hours; a 401 means sign in again.
(function () {
  const KEY = "gloobal.admin.session.v1";
  const load = () => { try { const s = JSON.parse(sessionStorage.getItem(KEY) || "null"); return s && s.token && new Date(s.expiresAt) > new Date() ? s : null; } catch (e) { return null; } };
  const save = (s) => { try { sessionStorage.setItem(KEY, JSON.stringify(s)); } catch (e) { /* private window: this tab only */ } memory = s; };
  const clear = () => { try { sessionStorage.removeItem(KEY); } catch (e) { /* */ } memory = null; };
  let memory = load();
  const tz = () => { const off = -new Date().getTimezoneOffset(); const p = (n) => String(Math.floor(Math.abs(n))).padStart(2, "0"); return `${off < 0 ? "-" : "+"}${p(Math.abs(off) / 60)}:${p(Math.abs(off) % 60)}`; };
  async function call(method, path, { body, token } = {}) {
    const headers = {};
    if (body !== undefined) headers["Content-Type"] = "application/json";
    const t = token || (memory && memory.token);
    if (t) headers.Authorization = `Bearer ${t}`;
    let res;
    try {
      res = await fetch(window.GLOOBAL_ADMIN.apiUrl + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
    } catch (e) {
      const err = new Error("Can't reach the GLOOBAL server. If it was asleep, it takes up to a minute to wake — try again.");
      err.offline = true; throw err;
    }
    let data = null; try { data = await res.json(); } catch (e) { data = null; }
    if (!res.ok) {
      const err = new Error((data && data.message) || `The server said ${res.status}.`);
      err.status = res.status; err.code = data && data.code; err.data = data;
      if (res.status === 401 && !token && memory) { clear(); window.dispatchEvent(new Event("admin:signedout")); }
      throw err;
    }
    return data;
  }
  window.AdminApi = {
    session: () => memory, save, clear, tz,
    login: (symbolId, pin) => call("POST", "/api/admin/login", { body: { symbolId, pin } }),
    setupOptions: (pre, setupCode) => call("POST", "/api/admin/passkey/register/options", { token: pre, body: { setupCode } }),
    setupVerify: (pre, response) => call("POST", "/api/admin/passkey/register/verify", { token: pre, body: { response } }),
    passkeyOptions: (pre) => call("POST", "/api/admin/passkey/options", { token: pre, body: {} }),
    passkeyVerify: (pre, response) => call("POST", "/api/admin/passkey/verify", { token: pre, body: { response } }),
    today: () => call("GET", `/api/admin/today?tz=${encodeURIComponent(tz())}`),
    audit: () => call("GET", "/api/admin/audit?limit=150"),
    me: () => call("GET", "/api/admin/me"),
    // The Support desk (0216)
    desk: (tab) => call("GET", `/api/admin/support${tab ? `?tab=${encodeURIComponent(tab)}` : ""}`),
    ticket: (id) => call("GET", `/api/admin/support/${encodeURIComponent(id)}`),
    reply: (id, text, waiting) => call("POST", `/api/admin/support/${encodeURIComponent(id)}/reply`, { body: { text, waiting: Boolean(waiting) } }),
    note: (id, text) => call("POST", `/api/admin/support/${encodeURIComponent(id)}/note`, { body: { text } }),
    setStatus: (id, status) => call("POST", `/api/admin/support/${encodeURIComponent(id)}/status`, { body: { status } }),
    pass: (id, to, note) => call("POST", `/api/admin/support/${encodeURIComponent(id)}/pass`, { body: { to, note } }),
    // Team & roles (founder only)
    team: () => call("GET", "/api/admin/team"),
    addMember: (symbolId, role) => call("POST", "/api/admin/team", { body: { symbolId, role } }),
    removeMember: (symbolId) => call("DELETE", `/api/admin/team/${encodeURIComponent(symbolId)}`),
    // Look up (0218)
    lookup: (q) => call("GET", `/api/admin/lookup?q=${encodeURIComponent(q)}`),
    account: (symbolId) => call("GET", `/api/admin/account/${encodeURIComponent(symbolId)}`),
    // Alerts on this device (0218)
    pushKey: () => call("GET", "/api/admin/push/key"),
    pushOn: (sub) => call("POST", "/api/admin/push/subscribe", { body: sub }),
    pushOff: (endpoint) => call("POST", "/api/admin/push/unsubscribe", { body: { endpoint } }),
    // Countries and Money & books (0219)
    countries: (period) => call("GET", `/api/admin/countries?period=${encodeURIComponent(period)}&tz=${encodeURIComponent(tz())}`),
    country: (iso, period) => call("GET", `/api/admin/countries/${encodeURIComponent(iso)}?period=${encodeURIComponent(period)}&tz=${encodeURIComponent(tz())}`),
    pair: (a, b, period) => call("GET", `/api/admin/pair/${encodeURIComponent(a)}/${encodeURIComponent(b)}?period=${encodeURIComponent(period)}&tz=${encodeURIComponent(tz())}`),
    money: (period, currency) => call("GET", `/api/admin/money?period=${encodeURIComponent(period)}&tz=${encodeURIComponent(tz())}${currency ? `&currency=${encodeURIComponent(currency)}` : ""}`),
    books: (ccy) => call("GET", `/api/admin/books/${encodeURIComponent(ccy)}`),
    setAside: (ccy, reason, expected) => call("POST", `/api/admin/books/${encodeURIComponent(ccy)}/set-aside`, { body: { reason, expected } }),
    settlements: (status) => call("GET", `/api/admin/settlements?status=${encodeURIComponent(status)}`),
    rates: () => call("GET", "/api/admin/rates"),
    logout: () => call("POST", "/api/admin/logout", { body: {} }).catch(() => null),
  };
})();
