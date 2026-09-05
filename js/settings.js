/**
 * AucTech Vault — Settings view (session info, backup/restore, audit log).
 * Depends on: shared state (D, userRole), helpers (esc), apiExportCredentials,
 * apiRestoreCredentials, apiFetchCredentials, apiFetchAudit, toast, render,
 * manualLogout, loadCreds, loadAudit.
 */

/* ------------------------------------------------------------------ */
/*  Action meta map (for audit log colors)                             */
/* ------------------------------------------------------------------ */

const ACTION_META = {
  view:             { label: 'viewed',      cls: 'a-viewed'  },
  reveal:           { label: 'viewed',      cls: 'a-viewed'  },
  copied:           { label: 'copied',      cls: 'a-copied'  },
  created:          { label: 'added',       cls: 'a-added'   },
  edited:           { label: 'edited',      cls: 'a-edited'  },
  deleted:          { label: 'deleted',     cls: 'a-deleted' },
  export:           { label: 'exported',    cls: 'a-edited'  },
  restore:          { label: 'restored',    cls: 'a-added'   },
  login:            { label: 'login',       cls: 'a-unlock'  },
  logout:           { label: 'logout',      cls: 'a-unlock'  },
  auto_logout_idle: { label: 'auto logout', cls: 'a-unlock'  },
};

function actionMeta(action) {
  return ACTION_META[action] || { label: action, cls: '' };
}

/* ------------------------------------------------------------------ */
/*  Settings page HTML                                                  */
/* ------------------------------------------------------------------ */

function rSettings() {
  return `
  <div class="card set-block">
    <h3>Session</h3>
    <div class="d">You're logged in via your AucTech account. Sessions auto-lock after 5 minutes of inactivity, and secondary (guest) logins are always reported to the vault owner.</div>
    <button class="btn btn-danger" onclick="manualLogout()">Log out now</button>
  </div>` +

  (userRole === 'main' ? `
  <div class="card set-block">
    <h3>Encrypted backup</h3>
    <div class="d">Download the vault as an encrypted file (opens only with your master password), or restore one. Restoring replaces the current vault.</div>
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      <button class="btn" onclick="downloadEncryptedBackup()">Download encrypted backup</button>
      <button class="btn" onclick="document.getElementById('restoreFileInput').click()">Restore backup</button>
      <input type="file" id="restoreFileInput" accept=".auctechbackup,.json" style="display:none" onchange="restoreBackupFile(event)">
      <button class="btn btn-danger" onclick="exportDecryptedJson()">Export decrypted JSON…</button>
    </div>
  </div>` : '') +

  `<div class="card set-block">
    <h3>Recent activity</h3>
    <div class="d">Every reveal, copy, edit and delete is logged on the server.</div>
    <div style="max-height:320px;overflow-y:auto;border:1px solid var(--line);border-radius:10px">` +
    (D.audit.length
      ? D.audit.slice(0, 120).map(a => {
          const dt   = new Date(a.createdAt || a.t);
          const when = isNaN(dt) ? '—' : `${dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} ${dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;
          const meta = actionMeta(a.action);
          return `<div class="audit-row"><span class="when">${when}</span>
            <span class="act ${meta.cls}">${esc(meta.label)}</span>
            <span>${esc(a.item || '')}${a.detail ? ' — ' + esc(a.detail) : ''}</span></div>`;
        }).join('')
      : `<div class="empty"><p>No activity yet.</p></div>`) +
  `</div></div>`;
}

/* ------------------------------------------------------------------ */
/*  Encrypted backup — AES-256-GCM (Web Crypto)                        */
/* ------------------------------------------------------------------ */

const BACKUP_FILE_MAGIC = 'AUCTECHVAULTBACKUP1';

async function deriveBackupKey(password, saltBytes) {
  const enc         = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: saltBytes, iterations: 210000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

function downloadBlob(filename, text) {
  const blob = new Blob([text], { type: 'application/json' });
  const a    = document.createElement('a');
  a.href     = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

// btoa(String.fromCharCode(...bytes)) blows the call stack on large buffers.
// Build the binary string in 32 KB chunks to avoid that.
function bufToB64(buf) {
  const bytes     = new Uint8Array(buf);
  let binary      = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

async function downloadEncryptedBackup() {
  const password = prompt('Set a master password for this backup file.\nYou will need this exact password to restore it — it does NOT have to match your login password.');
  if (!password) return;
  if (password.length < 8) return toast('Backup password must be at least 8 characters', 'err');
  const confirmPw = prompt('Confirm the backup password:');
  if (confirmPw !== password) return toast('Passwords did not match — try again', 'err');

  try {
    toast('Preparing backup…');
    const data      = await apiExportCredentials();
    const salt      = crypto.getRandomValues(new Uint8Array(16));
    const iv        = crypto.getRandomValues(new Uint8Array(12));
    const key       = await deriveBackupKey(password, salt);
    const enc       = new TextEncoder();
    const cipherBuf = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(JSON.stringify(data)));
    const file = {
      magic:     BACKUP_FILE_MAGIC,
      salt:      bufToB64(salt),
      iv:        bufToB64(iv),
      ciphertext:bufToB64(cipherBuf),
      createdAt: new Date().toISOString(),
    };
    downloadBlob(`auctech-vault-backup-${new Date().toISOString().slice(0, 10)}.auctechbackup`, JSON.stringify(file));
    toast('Encrypted backup downloaded', 'ok');
  } catch (e) {
    console.error('[Backup] download failed:', e);
    toast('Could not create backup: ' + (e && e.message ? e.message : 'unknown error'), 'err');
  }
}

async function restoreBackupFile(ev) {
  const file = ev.target.files && ev.target.files[0];
  ev.target.value = ''; // reset so picking the same file again still fires onchange
  if (!file) return;

  try {
    const raw = JSON.parse(await file.text());
    if (raw.magic !== BACKUP_FILE_MAGIC) return toast('Not a valid AucTech Vault backup file', 'err');

    const password = prompt('Enter the master password for this backup file:');
    if (!password) return;

    const fromB64  = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
    const salt      = fromB64(raw.salt);
    const iv        = fromB64(raw.iv);
    const ciphertext= fromB64(raw.ciphertext);
    const key       = await deriveBackupKey(password, salt);

    let plainBuf;
    try {
      plainBuf = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
    } catch (e) {
      return toast('Wrong password, or the file is corrupted', 'err');
    }

    const data  = JSON.parse(new TextDecoder().decode(plainBuf));
    const items = Array.isArray(data.credentials) ? data.credentials : [];

    if (!confirm(`Restore this backup? This REPLACES your current vault with ${items.length} credential(s) from the backup. This cannot be undone.`)) return;

    toast('Restoring…');
    await apiRestoreCredentials(items);
    await Promise.all([loadCreds(), loadAudit()]);
    render();
    toast('Vault restored from backup', 'ok');
  } catch (e) {
    console.error('[Backup] restore failed:', e);
    toast('Could not restore backup: ' + (e && e.message ? e.message : 'unknown error'), 'err');
  }
}

async function exportDecryptedJson() {
  if (!confirm('This downloads every saved password in PLAIN TEXT, unencrypted. Anyone with this file can read them. Continue?')) return;
  try {
    toast('Preparing export…');
    const data = await apiExportCredentials();
    downloadBlob(`auctech-vault-export-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(data, null, 2));
    toast('Decrypted JSON exported', 'ok');
  } catch (e) {
    console.error('[Backup] export failed:', e);
    toast('Could not export: ' + (e && e.message ? e.message : 'unknown error'), 'err');
  }
}
