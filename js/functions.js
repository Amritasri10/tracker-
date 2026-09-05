/**
 * AucTech Vault — API functions.
 * All functions use window.authFetch() (exposed by login.js) to make
 * authenticated requests. API paths come from js/api.js (API_ENDPOINTS).
 */

/* ------------------------------------------------------------------ */
/*  Credentials                                                         */
/* ------------------------------------------------------------------ */

async function apiFetchCredentials() {
  const res = await window.authFetch(API_ENDPOINTS.CREDENTIALS);
  if (!res.ok) throw new Error('bad status ' + res.status);
  return res.json(); // { credentials: [...] }
}

async function apiCreateCredential(rec) {
  const res = await window.authFetch(API_ENDPOINTS.CREDENTIALS, {
    method: 'POST',
    body: JSON.stringify(rec),
  });
  if (!res.ok) throw new Error('bad status ' + res.status);
  return res.json(); // { id, created, ... }
}

async function apiUpdateCredential(id, rec) {
  const res = await window.authFetch(API_ENDPOINTS.CREDENTIAL_BY_ID(id), {
    method: 'PUT',
    body: JSON.stringify(rec),
  });
  if (!res.ok) throw new Error('bad status ' + res.status);
  return res.json();
}

async function apiDeleteCredential(id) {
  const res = await window.authFetch(API_ENDPOINTS.CREDENTIAL_BY_ID(id), {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('bad status ' + res.status);
  return res.json();
}

async function apiRevealPassword(id) {
  const res = await window.authFetch(API_ENDPOINTS.CREDENTIAL_REVEAL(id));
  if (!res.ok) throw new Error('bad status ' + res.status);
  const data = await res.json();
  return data.password || '';
}

async function apiExportCredentials() {
  const res = await window.authFetch(API_ENDPOINTS.CREDENTIALS_EXPORT);
  if (!res.ok) throw new Error('bad status ' + res.status);
  return res.json(); // { credentials, exportedAt }
}

async function apiRestoreCredentials(credentials) {
  const res = await window.authFetch(API_ENDPOINTS.CREDENTIALS_RESTORE, {
    method: 'POST',
    body: JSON.stringify({ credentials }),
  });
  if (!res.ok) throw new Error('bad status ' + res.status);
  return res.json();
}

/* ------------------------------------------------------------------ */
/*  Audit                                                               */
/* ------------------------------------------------------------------ */

async function apiFetchAudit() {
  const res = await window.authFetch(API_ENDPOINTS.AUDIT);
  if (!res.ok) throw new Error('bad status ' + res.status);
  return res.json(); // { entries: [...] }
}

async function apiLogAudit(action, item, detail) {
  const res = await window.authFetch(API_ENDPOINTS.AUDIT, {
    method: 'POST',
    body: JSON.stringify({ action, item, detail: detail || '' }),
  });
  return res; // best-effort — caller ignores errors
}

/* ------------------------------------------------------------------ */
/*  Categories                                                          */
/* ------------------------------------------------------------------ */

async function apiFetchCategories() {
  const res = await window.authFetch(API_ENDPOINTS.CATEGORIES);
  if (!res.ok) throw new Error('bad status ' + res.status);
  return res.json(); // { categories: [{id, categoryName, status}, ...] }
}

async function apiCreateCategory(rec) {
  const res = await window.authFetch(API_ENDPOINTS.CATEGORIES, {
    method: 'POST',
    body: JSON.stringify(rec),
  });
  if (!res.ok) throw new Error('bad status ' + res.status);
  return res.json();
}

async function apiUpdateCategory(id, rec) {
  const res = await window.authFetch(API_ENDPOINTS.CATEGORY_BY_ID(id), {
    method: 'PUT',
    body: JSON.stringify(rec),
  });
  if (!res.ok) throw new Error('bad status ' + res.status);
  return res.json();
}

async function apiDeleteCategory(id) {
  const res = await window.authFetch(API_ENDPOINTS.CATEGORY_BY_ID(id), {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('bad status ' + res.status);
  return res.json();
}

/* ------------------------------------------------------------------ */
/*  Clients                                                             */
/* ------------------------------------------------------------------ */

async function apiFetchClients() {
  const res = await window.authFetch(API_ENDPOINTS.CLIENTS);
  if (!res.ok) throw new Error('bad status ' + res.status);
  return res.json(); // { clients: [{id, name, mobile, email, status}, ...] }
}

async function apiCreateClient(rec) {
  const res = await window.authFetch(API_ENDPOINTS.CLIENTS, {
    method: 'POST',
    body: JSON.stringify(rec),
  });
  if (!res.ok) throw new Error('bad status ' + res.status);
  return res.json();
}

async function apiUpdateClient(id, rec) {
  const res = await window.authFetch(API_ENDPOINTS.CLIENT_BY_ID(id), {
    method: 'PUT',
    body: JSON.stringify(rec),
  });
  if (!res.ok) throw new Error('bad status ' + res.status);
  return res.json();
}

async function apiDeleteClient(id) {
  const res = await window.authFetch(API_ENDPOINTS.CLIENT_BY_ID(id), {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('bad status ' + res.status);
  return res.json();
}
