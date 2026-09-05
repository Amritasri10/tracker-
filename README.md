# AucTech Vault — Frontend

Admin panel style credential management system. No build step, no framework — plain HTML, CSS aur vanilla JS.

---

## Project Structure

```
auctech-vault-frontend/
├── index.html          → App shell (topbar + sidebar + main content area)
├── lockscreen.html     → Login screen HTML (fetch se inject hota hai)
├── login.js            → Login, session aur authFetch logic
├── css/
│   └── main.css        → Poora shared CSS (layout, sidebar, cards, badges, etc.)
└── js/
    ├── api.js          → Saare API endpoint constants (API_ENDPOINTS object)
    ├── functions.js    → Saare backend API call functions
    ├── helpers.js      → Utility functions (esc, toast, fmtDate, fmtINR, logAudit, copySecret)
    ├── dataloader.js   → Login ke baad data load karna (loadCreds, loadAudit, loadCategories, loadClients)
    ├── auth.js         → Login event handler + manualLogout
    ├── role.js         → Role ke hisaab se sidebar tabs show/hide karna
    ├── navigation.js   → go(), doSearch(), goCat(), render(), sidebar toggle, keyboard shortcuts
    ├── vault.js        → Vault page — credential list, filter bar, add/edit drawer, reveal/copy password
    ├── dashboard.js    → Dashboard page — stats cards, upcoming renewals timeline, recently updated
    ├── renewals.js     → Renewals page — renewal table, verify renewal action
    ├── socialmedia.js  → Social Media page — handles grouped by client
    ├── categories.js   → Categories page — CRUD table with static fallback data
    ├── clients.js      → Clients page — CRUD table (name required, mobile/email optional)
    └── settings.js     → Settings page — session info, encrypted backup/restore, audit log
```

---

## Backend URL Set Karna

`index.html` ke top mein ye line hai:

```html
<script>window.AUCTECH_API_BASE = "https://auctech-vault-backend-1.onrender.com/api";</script>
```

Isko apne backend ke URL se replace karo. `login.js` aur saare `js/functions.js` ke API calls yahi value use karte hain.

---

## Locally Kaise Chalayein

> ⚠️ **Important:** Seedha `file://` se open mat karo. `lockscreen.html` ko `fetch()` se load kiya jaata hai jo `file://` protocol pe CORS block ho jaata hai.

**VS Code Live Server:**
```
Right click index.html → Open with Live Server
```

**npx serve:**
```bash
npx serve .
```

**Python:**
```bash
python -m http.server 5500
```

Phir browser mein open karo: `http://localhost:5500`

Backend bhi chal raha hona chahiye aur uski CORS setting mein frontend ka origin allow hona chahiye.

---

## Pages aur Kya Karte Hain

### 🏠 Dashboard
- Total credentials, renewals in 30/90 days, overdue renewals — stat cards
- Upcoming renewals timeline (scroll karo)
- Recently updated credentials list

### 🔒 Vault
- Saare credentials ki list
- **Filter bar:** Category aur Client ke dropdown se filter karo → **Show** button se apply, **Reset** se clear
  - Category options: `GET /categories?isPagination=false` se aate hain
  - Client options: `GET /clients?isPagination=false` se aate hain
- Global search bar se bhi filter hota hai (Ctrl+K)
- Password reveal (30 sec auto-hide) aur clipboard copy (20 sec auto-clear)
- Add / Edit drawer se credential add ya update karo
- Delete confirmation ke baad delete hota hai

### 📅 Renewals
- Saare credentials jinki renewal date set hai — table format mein
- Due days badge (overdue/warn/ok color coded)
- "Estimate-Verify" status wale ke liye "Verified ✓" button — ek click mein Confirmed ho jaata hai
- Total yearly renewal spend calculate hota hai

### 💬 Social Media
- `Social / Business Account` category ke saare credentials
- Client ke naam se group hote hain
- Har client ke andar platform wise handles dikhte hain

### 🏢 Clients
- Client list table: **Name** (required), **Mobile** (optional), **Email** (optional), **Status**
- Add / Edit / Delete — drawer se
- API: `GET/POST /clients`, `PUT/DELETE /clients/:id`

### 🗂️ Categories
- Category list table: **Category Name**, **Status** (Active/Inactive)
- Static fallback data tab tak dikhta hai jab tak API connect na ho
- API connect hone ke baad real data manage hota hai
- API: `GET/POST /categories`, `PUT/DELETE /categories/:id`

### ⚙️ Settings
- Session info aur Log out
- **Encrypted Backup** (sirf `main` role ke liye):
  - Download: AES-256-GCM se encrypt hota hai, backup password se (login password se alag)
  - Restore: Backup file + password se decrypt karke vault replace karta hai
  - Export: Plain text JSON (warning ke saath)
- **Recent Activity:** Har reveal, copy, edit, delete ka audit log

---

## Login Roles

| Role | Kya Access Milta Hai |
|------|----------------------|
| `main` | Poora access — sab kuch dekh aur manage kar sakte hain |
| `social` | Sirf Social Media tab — Renewals tab hide hota hai, Add button bhi nahi |
| `developer` | Social Media tab hide hota hai, baki sab accessible |
| `secondary` | Guest login — OTP + geolocation required, 5 min idle pe auto-logout |

---

## Login Flows

### Main / Social / Developer
Email + Password → `POST /auth/login` → JWT milta hai → session start

### Forgot Password
1. Email daalo → `POST /auth/forgot-password` → OTP email pe aata hai
2. OTP + naya password → `POST /auth/reset-password` → login tile pe wapas

### Secondary (Guest)
1. Name + Email daalo
2. Email validate hota hai → `POST /auth/secondary/check-email`
3. Location permission maanga jaata hai (required)
4. OTP email pe jaata hai → `POST /auth/secondary/init`
5. OTP verify → `POST /auth/secondary/verify-otp` → session start

---

## Session Behaviour

- JWT `sessionStorage` mein save hota hai (tab band hone pe automatically clear)
- Page refresh pe `GET /auth/me` se session resume hota hai
- `secondary` role ke liye 5 min idle hone pe auto-logout
- Server se `440` response aane pe automatically logout

---

## API Endpoints (Frontend jo use karta hai)

```
POST   /auth/login
POST   /auth/logout
GET    /auth/me
POST   /auth/forgot-password
POST   /auth/reset-password
POST   /auth/secondary/check-email
POST   /auth/secondary/init
POST   /auth/secondary/verify-otp
POST   /auth/secondary/resend-otp

GET    /credentials                   → { credentials: [...] }
POST   /credentials                   → credential banao
PUT    /credentials/:id               → update karo
DELETE /credentials/:id               → delete karo
GET    /credentials/:id/reveal        → { password }  
GET    /credentials/export/all        → { credentials, exportedAt }
POST   /credentials/restore           → { credentials: [...] }

GET    /audit                         → { entries: [...] }
POST   /audit                         → ek entry log karo

GET    /categories?isPagination=false → { categories: [...] }
POST   /categories
PUT    /categories/:id
DELETE /categories/:id

GET    /clients?isPagination=false    → { clients: [...] }
POST   /clients
PUT    /clients/:id
DELETE /clients/:id
```

---

## Shared State (`D` object)

`index.html` ke inline script mein define hota hai, saari JS files isko global variable ki tarah use karti hain:

```js
let D = { creds: [], audit: [], categories: [], clients: [] };
```

Logout hone pe poora reset ho jaata hai.

---

## Notes

- Koi build tool, npm, ya framework nahi hai — seedha browser mein chalega
- Saari sensitive data (passwords) sirf API se aati hai — browser storage ya JS variables mein store nahi hoti
- Clipboard copy ke baad 20 seconds mein auto-clear hota hai
- Password reveal ke baad 30 seconds mein auto-hide hota hai
 