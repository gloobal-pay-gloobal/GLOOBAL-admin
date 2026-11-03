// Passkeys: the server speaks base64url JSON, the browser wants ArrayBuffers.
// The same conversion the GLOOBAL app does in frontend/hooks/useBiometric.js.
(function () {
  const toBuf = (v) => { const b = String(v || "").replace(/-/g, "+").replace(/_/g, "/"); const p = b.padEnd(b.length + (4 - (b.length % 4 || 4)) % 4, "="); const s = atob(p); const u = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); return u.buffer; };
  const toB64 = (buf) => { const u = new Uint8Array(buf); let s = ""; for (let i = 0; i < u.length; i++) s += String.fromCharCode(u[i]); return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); };
  const supported = () => typeof window.PublicKeyCredential !== "undefined" && window.isSecureContext && !!navigator.credentials;
  async function create(options) {
    const publicKey = Object.assign({}, options, {
      challenge: toBuf(options.challenge),
      user: Object.assign({}, options.user, { id: toBuf(options.user.id) }),
      excludeCredentials: (options.excludeCredentials || []).map((c) => Object.assign({}, c, { id: toBuf(c.id) })),
    });
    const cred = await navigator.credentials.create({ publicKey });
    return { id: cred.id, rawId: toB64(cred.rawId), type: cred.type, clientExtensionResults: cred.getClientExtensionResults ? cred.getClientExtensionResults() : {}, response: { clientDataJSON: toB64(cred.response.clientDataJSON), attestationObject: toB64(cred.response.attestationObject), transports: cred.response.getTransports ? cred.response.getTransports() : [] } };
  }
  async function get(options) {
    const publicKey = Object.assign({}, options, { challenge: toBuf(options.challenge), allowCredentials: (options.allowCredentials || []).map((c) => Object.assign({}, c, { id: toBuf(c.id) })) });
    const cred = await navigator.credentials.get({ publicKey });
    return { id: cred.id, rawId: toB64(cred.rawId), type: cred.type, clientExtensionResults: cred.getClientExtensionResults ? cred.getClientExtensionResults() : {}, response: { clientDataJSON: toB64(cred.response.clientDataJSON), authenticatorData: toB64(cred.response.authenticatorData), signature: toB64(cred.response.signature), userHandle: cred.response.userHandle ? toB64(cred.response.userHandle) : null } };
  }
  function explain(err) {
    const n = err && err.name;
    if (n === "NotAllowedError") return "The passkey was cancelled or timed out. Try again.";
    if (n === "InvalidStateError") return "This device already has an admin passkey. Use it instead.";
    if (n === "SecurityError") return "Passkeys only work on the admin site's own address (https).";
    return (err && err.message) || "The passkey did not work.";
  }
  window.AdminPasskey = { supported, create, get, explain };
})();
