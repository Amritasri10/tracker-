/**
 * AucTech Vault — Vault view (credential list + add/edit drawer).
 * Depends on: shared state (D, filt), helpers (esc, daysUntil, renClass,
 * fmtDate), API functions (apiRevealPassword, apiCreateCredential,
 * apiUpdateCredential, apiDeleteCredential), logAudit, copySecret,
 * toast, render, closeDrawer.
 */

const CATEGORIES = [
  'Domain Registrar', 'Hosting / cPanel', 'VPS / SSH', 'FTP',
  'Cloudflare / DNS', 'Webmail', 'Social / Business Account',
  'Payment Gateway / DLT', 'JKS / Keystore', 'Support Contact', 'Note'
];

const CAT_ICONS = {
  'Domain Registrar':         '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.5 3 14.5 0 18-3-3.5-3-14.5 0-18Z"/></svg>',
  'Hosting / cPanel':         '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="7" rx="2"/><rect x="3" y="13" width="18" height="7" rx="2"/><path d="M7 7.5h.01M7 16.5h.01"/></svg>',
  'VPS / SSH':                '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="14" rx="2"/><path d="M7 9l3 3-3 3M13 15h4"/></svg>',
  'FTP':                      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 8a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8Z"/><path d="M12 12v4M10 14l2-2 2 2"/></svg>',
  'Cloudflare / DNS':         '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.5 18a4.5 4.5 0 0 0 .4-9A6.5 6.5 0 0 0 5.3 10.7 4 4 0 0 0 6 18h11.5Z"/></svg>',
  'Webmail':                  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>',
  'Social / Business Account':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="8" r="3.5"/><path d="M3 20a6 6 0 0 1 12 0M16 4a3.5 3.5 0 0 1 0 7M17 14a6 6 0 0 1 4 6"/></svg>',
  'Payment Gateway / DLT':    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18M7 15h4"/></svg>',
  'JKS / Keystore':           '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="8" cy="15" r="4.5"/><path d="M11.5 11.5 20 3M16 7l3 3M13 10l2 2"/></svg>',
  'Support Contact':          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 17v2a2 2 0 0 1-2.2 2A19 19 0 0 1 3 4.2 2 2 0 0 1 5 2h2a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.6a2 2 0 0 1-.5 2.1L8 9.5a16 16 0 0 0 6.5 6.5l1.1-1.1a2 2 0 0 1 2.1-.5c.8.3 1.7.5 2.6.6A2 2 0 0 1 22 17Z"/></svg>',
  'Note':                     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 3h9l5 5v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z"/><path d="M14 3v6h6M9 13h6M9 17h6"/></svg>'
};

const EYE   = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>';
const EYEOFF = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3l18 18M10.6 5.1A10.8 10.8 0 0 1 12 5c6.5 0 10 7 10 7a17.6 17.6 0 0 1-3.2 4.1M6.6 6.6C4 8.5 2 12 2 12s3.5 7 10 7a10 10 0 0 0 4.4-1M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg>';
const COPY  = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>';
const PEN   = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.8 2.8 0 0 1 4 4L8 20l-5 1 1-5Z"/></svg>';
const TRASH = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M6 6l1 15a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-15"/></svg>';

/* ------------------------------------------------------------------ */
/*  Vault HTML render                                                   */
/* ------------------------------------------------------------------ */

function rVault() {
  const cats    = CATEGORIES.filter(cat => D.creds.some(x => x.category === cat));
  const clients = [...new Set(D.creds.map(x => x.client_project).filter(Boolean))].sort();
  return `
    <div class="chiprow">
      <button class="chip ${!filt.cat ? 'on' : ''}" onclick="filt.cat=null;render()">All</button>` +
      cats.map(cat => `<button class="chip ${filt.cat === cat ? 'on' : ''}" onclick='filt.cat=${JSON.stringify(cat)};render()'>${esc(cat)}</button>`).join('') +
    `</div>
    <div class="chiprow">
      <button class="chip ${!filt.client ? 'on' : ''}" onclick="filt.client=null;render()">All clients</button>` +
      clients.map(cl => `<button class="chip ${filt.client === cl ? 'on' : ''}" onclick='filt.client=${JSON.stringify(cl)};render()'>${esc(cl)}</button>`).join('') +
    `</div>
    <div class="count-line" id="countLine"></div>
    <div class="cred-list" id="credList"></div>`;
}

function filteredCreds() {
  const q = filt.q.trim().toLowerCase();
  return D.creds.filter(x =>
    (!filt.cat    || x.category       === filt.cat)    &&
    (!filt.client || x.client_project === filt.client) &&
    (!q || [x.client_project, x.service_provider, x.url_or_host, x.username, x.category, x.notes, (x.tags || []).join(' ')]
      .join(' ').toLowerCase().includes(q))
  ).sort((a, b) => (a.client_project || '').localeCompare(b.client_project || ''));
}

function renderList() {
  const el = document.getElementById('credList');
  if (!el) return;
  const list = filteredCreds();
  const cl   = document.getElementById('countLine');
  if (cl) cl.textContent = list.length + ' of ' + D.creds.length + ' credentials' + (filt.q ? ' · search: "' + filt.q + '"' : '');
  el.innerHTML = list.length
    ? list.map(credRow).join('')
    : `<div class="card empty"><p>Nothing matches. Try a different search or clear the filters.</p></div>`;
}

function credRow(x) {
  const ic         = CAT_ICONS[x.category] || CAT_ICONS['Note'];
  const maskedUser = x.username
    ? esc(x.username).replace(/(?<=^.{2}).(?=.{2})/g, '•')
    : '<span style="color:var(--faint)">no username</span>';
  const d   = daysUntil(x.renewal_date);
  const ren = x.renewal_date
    ? `<span class="badge b-${renClass(d) === 'green' ? 'ok' : renClass(d) === 'amber' ? 'warn' : 'danger'}">${d < 0 ? 'overdue' : 'renews ' + fmtDate(x.renewal_date)}</span>`
    : '';
  return `<div class="card cred" id="cred-${x.id}">
    <div class="cat-ic">${ic}</div>
    <div class="info">
      <div class="t">${esc(x.client_project || '—')} <span class="prov">${esc(x.service_provider || x.category)}</span> ${ren}
        ${(x.tags || []).map(t => `<span class="tag">${esc(t)}</span>`).join('')}</div>
      <div class="s">${maskedUser}${x.url_or_host ? ' · ' + esc(x.url_or_host) : ''}</div>
      <div class="s secret-row" id="sec-${x.id}" style="display:none"></div>
    </div>
    <div class="acts">
      ${x.hasPassword ? `<button class="icon-btn" title="Reveal password" onclick="reveal('${x.id}')" id="eye-${x.id}">${EYE}</button>
      <button class="icon-btn" title="Copy password" onclick="copyPw('${x.id}')">${COPY}</button>` : ''}
      <button class="icon-btn" title="Edit" onclick="openEdit('${x.id}')">${PEN}</button>
      <button class="icon-btn" title="Delete" onclick="delCred('${x.id}')">${TRASH}</button>
    </div></div>`;
}

/* ------------------------------------------------------------------ */
/*  Reveal / copy password                                              */
/* ------------------------------------------------------------------ */

async function reveal(id) {
  const x   = D.creds.find(c => c.id === id); if (!x) return;
  const row = document.getElementById('sec-' + id);
  const eye = document.getElementById('eye-' + id);
  if (row.style.display === 'none') {
    try {
      row.textContent = await apiRevealPassword(id);
    } catch (e) { toast('Could not fetch password — backend error', 'err'); return; }
    row.style.display = '';
    eye.innerHTML = EYEOFF;
    setTimeout(() => {
      if (row) { row.style.display = 'none'; row.textContent = ''; }
      if (eye) eye.innerHTML = EYE;
    }, 30000);
  } else {
    row.style.display = 'none';
    row.textContent = '';
    eye.innerHTML = EYE;
  }
}

async function copyPw(id) {
  const x = D.creds.find(c => c.id === id); if (!x) return;
  try {
    const pw = await apiRevealPassword(id);
    await copySecret(pw, 'Password', label(x));
  } catch (e) { toast('Could not fetch password — backend error', 'err'); }
}

/* ------------------------------------------------------------------ */
/*  Delete credential                                                   */
/* ------------------------------------------------------------------ */

async function delCred(id) {
  const x = D.creds.find(c => c.id === id); if (!x) return;
  if (!confirm('Delete "' + label(x) + '"? This cannot be undone.')) return;
  try {
    await apiDeleteCredential(id);
    D.creds = D.creds.filter(c => c.id !== id);
    toast('Deleted', 'ok');
    render();
  } catch (e) {
    toast('Could not delete — backend error', 'err');
  }
}

/* ------------------------------------------------------------------ */
/*  Add / Edit drawer                                                   */
/* ------------------------------------------------------------------ */

function openEdit(id, presetClient, presetCat) {
  const x       = id ? D.creds.find(c => c.id === id) : null;
  const g       = f => x ? esc(x[f] ?? '') : '';
  const gDate   = f => { if (!x || !x[f]) return ''; const d = new Date(x[f]); return isNaN(d) ? '' : d.toISOString().slice(0, 10); };
  const cat     = x ? x.category : (presetCat || 'Domain Registrar');
  const presetCl = (!x && presetClient) ? esc(presetClient) : '';

  document.getElementById('drawer').innerHTML = `
    <h3>${x ? 'Edit credential' : 'Add credential'}</h3>
    <form id="credForm" onsubmit="return saveCred(event, ${x ? JSON.stringify(id) : 'null'})">
      <div class="row2">
        <div class="field"><label>Client / Project</label><input name="client_project" value="${g('client_project') || presetCl}" placeholder="e.g. Sibook" required></div>
        <div class="field"><label>Category</label><select name="category" onchange="catFields(this.value)">${CATEGORIES.map(c => `<option ${c === cat ? 'selected' : ''}>${c}</option>`).join('')}</select></div>
      </div>
      <div class="field"><label>Platform / Service provider</label><input name="service_provider" value="${g('service_provider')}" placeholder="${cat === 'Social / Business Account' ? 'e.g. Facebook, Instagram, YouTube, LinkedIn' : 'e.g. GoDaddy, Hostinger'}"></div>
      <div class="field"><label>URL / Host / Domain</label><input name="url_or_host" value="${g('url_or_host')}"></div>
      <div class="field" id="f_port" style="display:none"><label>Port</label><input name="port" value="${g('port')}" placeholder="22 / 3306 / 21"></div>
      <div class="field"><label>Username</label><input name="username" value="${g('username')}" autocomplete="off"></div>
      <div class="field"><label>Password / Secret</label>
        <div class="pw-wrap"><input name="password" id="pwInput" type="password" value="${g('password')}" autocomplete="new-password">
        <button type="button" class="icon-btn" onclick="const p=document.getElementById('pwInput');p.type=p.type==='password'?'text':'password'">${EYE}</button></div></div>
      <div id="f_renewal" style="display:none">
        <div class="row2">
          <div class="field"><label>Renewal date</label><input type="date" name="renewal_date" value="${gDate('renewal_date')}"></div>
          <div class="field"><label>Amount (INR / yr)</label><input type="number" step="0.01" name="renewal_amount" value="${g('renewal_amount')}"></div>
        </div>
        <div class="field"><label>Renewal status</label><select name="renewal_status">
          ${['', 'Confirmed', 'Estimate-Verify', 'Expired', 'Renewed'].map(s => `<option ${x && x.renewal_status === s ? 'selected' : ''}>${s}</option>`).join('')}</select></div>
      </div>
      <div class="field"><label>Tags (comma-separated)</label><input name="tags" value="${x ? esc((x.tags || []).join(', ')) : ''}"></div>
      <div class="field"><label>Notes</label><textarea name="notes" rows="3">${g('notes')}</textarea></div>
      <div class="foot">
        <button type="button" class="btn" onclick="closeDrawer()">Cancel</button>
        <button class="btn btn-primary" type="submit">${x ? 'Save changes' : 'Add to vault'}</button>
      </div>
    </form>`;

  document.getElementById('overlay').classList.add('on');
  document.getElementById('drawer').classList.add('on');
  catFields(cat);
}

function catFields(cat) {
  document.getElementById('f_port').style.display    = (cat === 'VPS / SSH' || cat === 'FTP') ? '' : 'none';
  document.getElementById('f_renewal').style.display = (cat === 'Domain Registrar' || cat === 'Hosting / cPanel') ? '' : 'none';
}

function closeDrawer() {
  document.getElementById('overlay').classList.remove('on');
  document.getElementById('drawer').classList.remove('on');
}

async function saveCred(e, id) {
  e.preventDefault();
  const f   = new FormData(e.target);
  const v   = k => (f.get(k) || '').toString().trim();
  const rec = {
    client_project:  v('client_project'),
    category:        v('category'),
    service_provider:v('service_provider'),
    url_or_host:     v('url_or_host'),
    port:            v('port'),
    username:        v('username'),
    password:        v('password'),
    notes:           v('notes'),
    tags:            v('tags') ? v('tags').split(',').map(t => t.trim()).filter(Boolean) : [],
    renewal_date:    v('renewal_date')   || null,
    renewal_amount:  v('renewal_amount') || null,
    renewal_status:  v('renewal_status') || null,
    last_updated:    now(),
  };
  try {
    if (id) {
      await apiUpdateCredential(id, rec);
      const i = D.creds.findIndex(c => c.id === id);
      D.creds[i] = { ...D.creds[i], ...rec };
    } else {
      const created = await apiCreateCredential(rec);
      rec.id      = created.id      || uid();
      rec.created = created.created || now();
      D.creds.push(rec);
    }
    closeDrawer();
    toast('Saved', 'ok');
    render();
  } catch (err) {
    toast('Could not save — backend error', 'err');
  }
  return false;
}
