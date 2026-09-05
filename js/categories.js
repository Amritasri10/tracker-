/**
 * AucTech Vault — Categories view.
 * Shows each category as a card (same style as Renewals table).
 * Static fallback data is used until the API returns real values.
 * Depends on: shared state (D), helpers (esc, toast), API functions
 * (apiFetchCategories, apiCreateCategory, apiUpdateCategory, apiDeleteCategory),
 * PEN / TRASH icons (vault.js).
 */

/* ------------------------------------------------------------------ */
/*  Static fallback (same list shown in the vault "Add credential"      */
/*  category dropdown). Removed automatically once API data loads.      */
/* ------------------------------------------------------------------ */
const STATIC_CATEGORIES = [
  'Domain Registrar',
  'Hosting / cPanel',
  'VPS / SSH',
  'FTP',
  'Cloudflare / DNS',
  'Webmail',
  'Social / Business Account',
  'Payment Gateway / DLT',
  'JKS / Keystore',
  'Support Contact',
  'Note',
];

/* In-memory category list — filled by loadCategories() */
if (typeof D !== 'undefined' && !D.categories) D.categories = [];

/* ------------------------------------------------------------------ */
/*  Load categories from API (called after login, alongside loadCreds)  */
/* ------------------------------------------------------------------ */
async function loadCategories() {
  try {
    const data = await apiFetchCategories();
    D.categories = Array.isArray(data.categories) ? data.categories : [];
  } catch (e) {
    // API not available yet — build static fallback rows
    D.categories = STATIC_CATEGORIES.map((name, i) => ({
      id:           'static-' + i,
      categoryName: name,
      status:       'active',
      _static:      true,   // flag so we know it's placeholder data
    }));
  }
}

/* ------------------------------------------------------------------ */
/*  Category page HTML                                                   */
/* ------------------------------------------------------------------ */
function rCategories() {
  const cats = D.categories || [];

  const pageHeader = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px;flex-wrap:wrap;gap:10px">
      <h2 style="font-size:1.1rem">Categories</h2>
      <button class="btn btn-primary" onclick="openCategoryEdit()">＋ Add Category</button>
    </div>`;

  if (!cats.length)
    return pageHeader + `<div class="card empty"><div class="big">🗂️</div><p>No categories yet. Add your first one.</p></div>`;

  const tableHtml = `
    <div class="card" style="overflow-x:auto">
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Category Name</th>
            <th>Status</th>
            <th style="text-align:right">Action</th>
          </tr>
        </thead>
        <tbody>
          ${cats.map((c, i) => categoryRow(c, i + 1)).join('')}
        </tbody>
      </table>
    </div>
    ${cats.some(c => c._static) ? `<p style="margin-top:10px;font-size:.78rem;color:var(--faint)">⚠ Showing default categories — connect the API to manage them.</p>` : ''}`;

  return pageHeader + tableHtml;
}

function categoryRow(c, idx) {
  const isActive  = String(c.status).toLowerCase() === 'active';
  const badgeCls  = isActive ? 'b-ok' : 'b-danger';
  const badgeTxt  = isActive ? 'Active' : 'Inactive';
  const isStatic  = c._static;

  return `<tr>
    <td style="color:var(--faint);font-size:.82rem">${idx}</td>
    <td style="font-weight:700">${esc(c.categoryName)}</td>
    <td>
      <span class="badge ${badgeCls}">${badgeTxt}</span>
    </td>
    <td style="text-align:right;white-space:nowrap">
      ${isStatic ? `<span style="font-size:.75rem;color:var(--faint)">read-only</span>` : `
        <button class="icon-btn" title="Edit" onclick="openCategoryEdit('${esc(c.id)}')">${PEN}</button>
        <button class="icon-btn" title="Delete" onclick="deleteCategoryConfirm('${esc(c.id)}')">${TRASH}</button>
      `}
    </td>
  </tr>`;
}

/* ------------------------------------------------------------------ */
/*  Add / Edit drawer                                                    */
/* ------------------------------------------------------------------ */
function openCategoryEdit(id) {
  const c   = id ? (D.categories || []).find(x => x.id === id) : null;
  const g   = f => c ? esc(c[f] ?? '') : '';
  const isActive = !c || String(c.status).toLowerCase() === 'active';

  document.getElementById('drawer').innerHTML = `
    <h3>${c ? 'Edit Category' : 'Add Category'}</h3>
    <form id="catForm" onsubmit="return saveCategory(event, ${c ? JSON.stringify(id) : 'null'})">
      <div class="field">
        <label>Category Name</label>
        <input name="categoryName" value="${g('categoryName')}" placeholder="e.g. Domain Registrar" required>
      </div>
      <div class="field">
        <label>Status</label>
        <select name="status">
          <option value="active"   ${isActive   ? 'selected' : ''}>Active</option>
          <option value="inactive" ${!isActive  ? 'selected' : ''}>Inactive</option>
        </select>
      </div>
      <div class="foot">
        <button type="button" class="btn" onclick="closeDrawer()">Cancel</button>
        <button class="btn btn-primary" type="submit">${c ? 'Save changes' : 'Add category'}</button>
      </div>
    </form>`;

  document.getElementById('overlay').classList.add('on');
  document.getElementById('drawer').classList.add('on');
}

async function saveCategory(e, id) {
  e.preventDefault();
  const f   = new FormData(e.target);
  const rec = {
    categoryName: (f.get('categoryName') || '').trim(),
    status:       f.get('status') || 'active',
  };
  if (!rec.categoryName) { toast('Category name is required', 'err'); return false; }

  try {
    if (id) {
      await apiUpdateCategory(id, rec);
      const idx = (D.categories || []).findIndex(c => c.id === id);
      if (idx !== -1) D.categories[idx] = { ...D.categories[idx], ...rec };
      toast('Category updated', 'ok');
    } else {
      const created = await apiCreateCategory(rec);
      D.categories = D.categories || [];
      D.categories.push({ id: created.id || uid(), ...rec });
      toast('Category added', 'ok');
    }
    closeDrawer();
    render();
  } catch (err) {
    toast('Could not save — backend error', 'err');
  }
  return false;
}

async function deleteCategoryConfirm(id) {
  const c = (D.categories || []).find(x => x.id === id);
  if (!c) return;
  if (!confirm(`Delete category "${c.categoryName}"? This cannot be undone.`)) return;
  try {
    await apiDeleteCategory(id);
    D.categories = D.categories.filter(x => x.id !== id);
    toast('Category deleted', 'ok');
    render();
  } catch (err) {
    toast('Could not delete — backend error', 'err');
  }
}
