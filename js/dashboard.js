/**
 * AucTech Vault — Dashboard view.
 * Depends on: shared state (D, userRole), helpers (esc, daysUntil, renClass,
 * fmtDate, fmtINR), credRow (vault.js), and navigation (go, goCat).
 */

function isSocialRole()    { return userRole === 'social'; }
function isDeveloperRole() { return userRole === 'developer'; }

function rDashboard() {
  const c = D.creds;
  const withRen  = c.filter(x => x.renewal_date);
  const dcount   = n => withRen.filter(x => { const d = daysUntil(x.renewal_date); return d != null && d >= 0 && d <= n; }).length;
  const overdue  = withRen.filter(x => { const d = daysUntil(x.renewal_date); return d != null && d < 0; }).length;
  const recent   = [...c].sort((a, b) => (b.last_updated || '').localeCompare(a.last_updated || '')).slice(0, 5);
  const upcoming = withRen
    .map(x => ({ ...x, d: daysUntil(x.renewal_date) }))
    .filter(x => x.d != null)
    .sort((a, b) => a.d - b.d)
    .slice(0, 12);

  const social    = isSocialRole();
  const developer = isDeveloperRole();

  let h = social
    ? `<div class="quickrow">
        <button class="btn" onclick="go('social')">💬 See Social Media</button>
      </div>`
    : `<div class="quickrow">
        <button class="btn" onclick="go('renewals')">📅 See Renewals</button>
        <button class="btn" onclick="goCat('FTP')">📁 See FTP</button>
        ${developer ? '' : `<button class="btn" onclick="go('social')">💬 See Social Media</button>`}
        <button class="btn" onclick="goCat('Hosting / cPanel')">🖥️ See Hosting</button>
        <button class="btn" onclick="goCat('Domain Registrar')">🌐 See Domains</button>
      </div>`;

  h += `<div class="cards">
    <div class="card stat"><div class="n">${c.length}</div><div class="l">Credentials stored</div></div>
    <div class="card stat warn"><div class="n">${dcount(30)}</div><div class="l">Renewals in 30 days</div></div>
    <div class="card stat"><div class="n">${dcount(90)}</div><div class="l">Renewals in 90 days</div></div>
    <div class="card stat ${overdue ? 'danger' : 'ok'}"><div class="n">${overdue}</div><div class="l">Overdue renewals</div></div>
  </div>`;

  if (!c.length)
    return h + `<div class="card empty"><div class="big">🌸</div><p>Your vault is empty. Add your first credential with the ＋ Add button.</p></div>`;

  if (!social) {
    h += `<h3 class="section-t">Upcoming renewals</h3>`;
    h += upcoming.length
      ? `<div class="card timeline">` + upcoming.map(x => {
          const cl = renClass(x.d);
          const dl = x.d < 0 ? Math.abs(x.d) + 'd overdue' : x.d === 0 ? 'Due today' : 'in ' + x.d + 'd';
          return `<div class="tl-item tl-${cl}"><div class="d">${dl}</div><div class="dom">${esc(x.url_or_host || x.client_project)}</div><div class="amt">${fmtDate(x.renewal_date)} · ${fmtINR(x.renewal_amount)}</div></div>`;
        }).join('') + `</div>`
      : `<div class="card empty"><p>No renewal dates tracked yet.</p></div>`;
  }

  h += `<h3 class="section-t">Recently updated</h3><div class="cred-list">` + recent.map(credRow).join('') + `</div>`;
  return h;
}
