/**
 * AucTech Vault — Social Media view.
 * Depends on: shared state (D), helpers (esc), EYE / EYEOFF / COPY / PEN /
 * TRASH icons (vault.js), reveal, copyPw, openEdit, delCred, toast.
 */

function rSocial() {
  const socials = D.creds
    .filter(x => x.category === 'Social / Business Account')
    .sort((a, b) => (a.service_provider || '').localeCompare(b.service_provider || ''));

  let h = `<div class="quickrow">
    <button class="btn btn-primary" onclick="openEdit(null, null, 'Social / Business Account')">＋ Add social account</button>
  </div>`;

  if (!socials.length)
    return h + `<div class="card empty"><div class="big">💬</div><p>No social media accounts yet. Add one — every handle you save for the same client will automatically group together here.</p></div>`;

  const byClient = {};
  socials.forEach(x => {
    const k = x.client_project || 'Other';
    (byClient[k] = byClient[k] || []).push(x);
  });
  const clients = Object.keys(byClient).sort();

  h += clients.map(cl => {
    const hs = byClient[cl];
    return `<div class="card soc-card">
      <div class="soc-head">
        <h3>${esc(cl)}</h3>
        <span class="tag">${hs.length} handle${hs.length > 1 ? 's' : ''}</span>
        <button class="btn btn-ghost" style="font-size:.78rem;padding:5px 12px"
          onclick='openEdit(null, ${JSON.stringify(cl).replace(/'/g, "&#39;")}, "Social / Business Account")'>＋ Add handle</button>
      </div>` + hs.map(handleRow).join('') + `</div>`;
  }).join('');

  return h;
}

function handleRow(x) {
  const plat       = x.service_provider || 'Account';
  const maskedUser = x.username
    ? esc(x.username).replace(/(?<=^.{2}).(?=.{2})/g, '•')
    : '<span style="color:var(--faint)">no username</span>';
  return `<div class="handle">
    <span class="plat">${esc(plat)}</span>
    <span class="u">${maskedUser}${x.url_or_host ? ' · ' + esc(x.url_or_host) : ''}
      <span class="secret-row" id="sec-${x.id}" style="display:none"></span></span>
    <span class="hacts">
      ${x.hasPassword ? `<button class="icon-btn" title="Reveal password" onclick="reveal('${x.id}')" id="eye-${x.id}">${EYE}</button>
      <button class="icon-btn" title="Copy password" onclick="copyPw('${x.id}')">${COPY}</button>` : ''}
      <button class="icon-btn" title="Edit" onclick="openEdit('${x.id}')">${PEN}</button>
      <button class="icon-btn" title="Delete" onclick="delCred('${x.id}')">${TRASH}</button>
    </span></div>`;
}
