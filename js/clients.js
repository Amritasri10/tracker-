/**
 * AucTech Vault — Clients view.
 * Fields: name (required), mobile (optional), email (optional), status.
 * Same table card format as Categories / Renewals.
 * Depends on: shared state (D), helpers (esc, toast, uid),
 * API functions (apiFetchClients, apiCreateClient, apiUpdateClient,
 * apiDeleteClient), PEN / TRASH icons (vault.js), closeDrawer, render.
 */

/* ------------------------------------------------------------------ */
/*  Load clients from API                                               */
/* ------------------------------------------------------------------ */
async function loadClients() {
  try {
    const data = await apiFetchClients();
    D.clients = Array.isArray(data.clients) ? data.clients : [];
  } catch (e) {
    D.clients = [];
  }
}

/* ------------------------------------------------------------------ */
/*  Clients page HTML                                                    */
/* ------------------------------------------------------------------ */
function rClients() {
  const list = D.clients || [];

  const pageHeader = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px;flex-wrap:wrap;gap:10px">
      <h2 style="font-size:1.1rem">Clients</h2>
      <button class="btn btn-primary" onclick="openClientEdit()">＋ Add Client</button>
    </div>`;

  if (!list.length)
    return pageHeader + `<div class="card empty"><div class="big">🏢</div><p>No clients yet. Add your first one.</p></div>`;

  return pageHeader + `
    <div class="card" style="overflow-x:auto">
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Name</th>
            <th>Mobile</th>
            <th>Email</th>
            <th>Status</th>
            <th style="text-align:right">Action</th>
          </tr>
        </thead>
        <tbody>
          ${list.map((c, i) => clientRow(c, i + 1)).join('')}
        </tbody>
      </table>
    </div>`;
}

function clientRow(c, idx) {
  const isActive = String(c.status || 'active').toLowerCase() === 'active';
  const badgeCls = isActive ? 'b-ok' : 'b-danger';
  const badgeTxt = isActive ? 'Active' : 'Inactive';

  return `<tr>
    <td style="color:var(--faint);font-size:.82rem">${idx}</td>
    <td style="font-weight:700">${esc(c.name || '—')}</td>
    <td style="color:var(--muted)">${c.mobile ? esc(c.mobile) : '<span style="color:var(--faint)">—</span>'}</td>
    <td style="color:var(--muted)">${c.email  ? esc(c.email)  : '<span style="color:var(--faint)">—</span>'}</td>
    <td><span class="badge ${badgeCls}">${badgeTxt}</span></td>
    <td style="text-align:right;white-space:nowrap">
      <button class="icon-btn" title="Edit"   onclick="openClientEdit('${esc(c.id)}')">${PEN}</button>
      <button class="icon-btn" title="Delete" onclick="deleteClientConfirm('${esc(c.id)}')">${TRASH}</button>
    </td>
  </tr>`;
}

/* ------------------------------------------------------------------ */
/*  Add / Edit drawer                                                    */
/* ------------------------------------------------------------------ */
function openClientEdit(id) {
  const c        = id ? (D.clients || []).find(x => x.id === id) : null;
  const g        = f => c ? esc(c[f] ?? '') : '';
  const isActive = !c || String(c.status || 'active').toLowerCase() === 'active';

  document.getElementById('drawer').innerHTML = `
    <h3>${c ? 'Edit Client' : 'Add Client'}</h3>
    <form id="clientForm" onsubmit="return saveClient(event, ${c ? JSON.stringify(id) : 'null'})">

      <div class="field">
        <label>Name <span style="color:var(--cherry)">*</span></label>
        <input name="name" value="${g('name')}" placeholder="e.g. Sibook" required>
      </div>

      <div class="field">
        <label>Mobile <span style="color:var(--faint);font-weight:400;text-transform:none;letter-spacing:0">(optional)</span></label>
        <input name="mobile" type="tel" value="${g('mobile')}" placeholder="e.g. 9876543210">
      </div>

      <div class="field">
        <label>Email <span style="color:var(--faint);font-weight:400;text-transform:none;letter-spacing:0">(optional)</span></label>
        <input name="email" type="email" value="${g('email')}" placeholder="e.g. client@example.com">
      </div>

      <div class="field">
        <label>Status</label>
        <select name="status">
          <option value="active"   ${isActive  ? 'selected' : ''}>Active</option>
          <option value="inactive" ${!isActive ? 'selected' : ''}>Inactive</option>
        </select>
      </div>

      <div class="foot">
        <button type="button" class="btn" onclick="closeDrawer()">Cancel</button>
        <button class="btn btn-primary" type="submit">${c ? 'Save changes' : 'Add client'}</button>
      </div>
    </form>`;

  document.getElementById('overlay').classList.add('on');
  document.getElementById('drawer').classList.add('on');
}

/* ------------------------------------------------------------------ */
/*  Save (create / update)                                              */
/* ------------------------------------------------------------------ */
async function saveClient(e, id) {
  e.preventDefault();
  const f   = new FormData(e.target);
  const v   = k => (f.get(k) || '').trim();
  const rec = {
    name:   v('name'),
    mobile: v('mobile') || null,   // optional — send null if empty
    email:  v('email')  || null,   // optional — send null if empty
    status: v('status') || 'active',
  };
  if (!rec.name) { toast('Name is required', 'err'); return false; }

  try {
    if (id) {
      await apiUpdateClient(id, rec);
      const idx = (D.clients || []).findIndex(c => c.id === id);
      if (idx !== -1) D.clients[idx] = { ...D.clients[idx], ...rec };
      toast('Client updated', 'ok');
    } else {
      const created = await apiCreateClient(rec);
      D.clients = D.clients || [];
      D.clients.push({ id: created.id || uid(), ...rec });
      toast('Client added', 'ok');
    }
    closeDrawer();
    render();
  } catch (err) {
    toast('Could not save — backend error', 'err');
  }
  return false;
}

/* ------------------------------------------------------------------ */
/*  Delete                                                              */
/* ------------------------------------------------------------------ */
async function deleteClientConfirm(id) {
  const c = (D.clients || []).find(x => x.id === id);
  if (!c) return;
  if (!confirm(`Delete client "${c.name}"? This cannot be undone.`)) return;
  try {
    await apiDeleteClient(id);
    D.clients = D.clients.filter(x => x.id !== id);
    toast('Client deleted', 'ok');
    render();
  } catch (err) {
    toast('Could not delete — backend error', 'err');
  }
}
