/**
 * AucTech Vault — shared helpers.
 * Depends on: shared state (D, now), apiLogAudit (functions.js).
 */

/* ---------------- helpers ---------------- */
function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function toast(msg, cls) {
  const t = document.createElement('div');
  t.className   = 'toast ' + (cls || '');
  t.textContent = msg;
  document.getElementById('toasts').appendChild(t);
  setTimeout(() => t.remove(), 2600);
}
function daysUntil(dateStr) {
  if (!dateStr) return null;
  const s = String(dateStr);
  const d = s.includes('T') ? new Date(s) : new Date(s + 'T00:00:00');
  if (isNaN(d)) return null;
  return Math.ceil((d - new Date()) / 86400000);
}
function renClass(days) { return days == null ? '' : days < 14 ? 'red' : days <= 60 ? 'amber' : 'green'; }
function fmtDate(s) {
  if (!s) return '—';
  const str = String(s);
  const d   = str.includes('T') ? new Date(str) : new Date(str + 'T00:00:00');
  return isNaN(d) ? esc(s) : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}
function fmtINR(n) { return (n == null || n === '') ? '—' : '₹' + Number(n).toLocaleString('en-IN'); }
function label(x)  { return (x.client_project || '') + ' / ' + (x.service_provider || x.category); }

/* ---------------- audit helper ---------------- */
async function logAudit(action, item, detail) {
  D.audit.unshift({ t: now(), action, item, detail: detail || '' });
  if (D.audit.length > 800) D.audit.length = 800;
  try { await apiLogAudit(action, item, detail); } catch (e) { /* best-effort */ }
}

/* ---------------- copy secret helper ---------------- */
async function copySecret(text, lbl, credName) {
  try {
    await navigator.clipboard.writeText(text);
    toast(lbl + ' copied — clears in 20s', 'ok');
    setTimeout(async () => { try { await navigator.clipboard.writeText(''); } catch (_) {} }, 20000);
  } catch (e) { toast('Clipboard blocked by browser', 'err'); return; }
  await logAudit('copied', credName, lbl.toLowerCase());
}
