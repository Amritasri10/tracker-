/**
 * AucTech Vault — Data loading.
 * Depends on: shared state (D), helpers (toast),
 * API functions (apiFetchCredentials, apiFetchAudit, apiFetchCategories,
 * apiFetchClients).
 */

async function loadCreds() {
  try {
    const data = await apiFetchCredentials();
    D.creds = Array.isArray(data.credentials) ? data.credentials : [];
  } catch (e) {
    D.creds = [];
    toast('Could not reach the credentials API — showing an empty vault', 'err');
  }
}

async function loadAudit() {
  try {
    const data = await apiFetchAudit();
    D.audit = Array.isArray(data.entries) ? data.entries : [];
  } catch (e) { D.audit = []; }
}

async function loadClients() {
  try {
    const data = await apiFetchClients();
    D.clients = Array.isArray(data.clients) ? data.clients : [];
  } catch (e) { D.clients = []; }
}
