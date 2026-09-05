/**
 * AucTech Vault — Renewals view.
 * Depends on: shared state (D), helpers (esc, daysUntil, renClass, fmtDate,
 * fmtINR), PEN icon (vault.js), openEdit (vault.js), apiUpdateCredential,
 * toast, render, now.
 */

function rRenewals() {
  const rows = D.creds
    .filter(x => x.renewal_date)
    .map(x => ({ ...x, d: daysUntil(x.renewal_date) }))
    .sort((a, b) => (a.d ?? 9e9) - (b.d ?? 9e9));

  if (!rows.length)
    return `<div class="card empty"><p>No renewal dates yet. Add a Domain Registrar or Hosting credential with a renewal date.</p></div>`;

  const total = rows.reduce((s, x) => s + (Number(x.renewal_amount) || 0), 0);

  return `<div class="card" style="overflow-x:auto"><table><thead><tr>
      <th>Domain / Host</th><th>Provider</th><th>Renewal</th><th>Due</th><th>Amount</th><th>Status</th><th></th>
    </tr></thead><tbody>` +
    rows.map(x => {
      const cl    = renClass(x.d);
      const badge = x.renewal_status === 'Estimate-Verify' ? `<span class="badge b-warn">Verify date</span>`
        : x.renewal_status === 'Expired'   ? `<span class="badge b-danger">Expired</span>`
        : x.renewal_status === 'Renewed'   ? `<span class="badge b-ok">Renewed</span>`
        : x.renewal_status === 'Confirmed' ? `<span class="badge b-ok">Confirmed</span>`
        : `<span class="badge b-mut">—</span>`;
      return `<tr>
        <td style="font-weight:700">${esc(x.url_or_host || x.client_project)}</td>
        <td style="color:var(--muted)">${esc(x.service_provider || '—')}</td>
        <td>${fmtDate(x.renewal_date)}</td>
        <td><span class="badge b-${cl === 'green' ? 'ok' : cl === 'amber' ? 'warn' : 'danger'}">${x.d < 0 ? Math.abs(x.d) + 'd overdue' : x.d + 'd'}</span></td>
        <td>${fmtINR(x.renewal_amount)}</td>
        <td>${badge}</td>
        <td style="text-align:right;white-space:nowrap">
          ${x.renewal_status === 'Estimate-Verify'
            ? `<button class="btn btn-ghost" style="font-size:.75rem;padding:5px 10px" onclick="verifyRen('${x.id}')">Verified ✓</button>`
            : ''}
          <button class="icon-btn" onclick="openEdit('${x.id}')">${PEN}</button>
        </td></tr>`;
    }).join('') +
    `</tbody></table></div>
    <p style="margin-top:12px;color:var(--muted);font-size:.85rem">Tracked yearly renewal spend: <b style="color:var(--text)">${fmtINR(total)}</b> across ${rows.length} items.</p>`;
}

async function verifyRen(id) {
  const x = D.creds.find(c => c.id === id); if (!x) return;
  const rec = { ...x, renewal_status: 'Confirmed', last_updated: now() };
  try {
    await apiUpdateCredential(id, rec);
    x.renewal_status = 'Confirmed';
    x.last_updated   = now();
    toast('Marked as confirmed', 'ok');
    render();
  } catch (e) {
    toast('Could not update — backend error', 'err');
  }
}
