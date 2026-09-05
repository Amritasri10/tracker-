const API_BASE = window.AUCTECH_API_BASE || 'https://auctech-vault-backend-1.onrender.com/api';
const IDLE_MINUTES = 5;
const SESSION_TOKEN_KEY = 'auctech_token';

let authToken = sessionStorage.getItem(SESSION_TOKEN_KEY) || null;
let currentUser = null;
let idleTimer = null;

function setAuthToken(token) {
  authToken = token;
  if (token) sessionStorage.setItem(SESSION_TOKEN_KEY, token);
  else sessionStorage.removeItem(SESSION_TOKEN_KEY);
}

/* ---------------- idle auto-logout ---------------- */
function resetIdleTimer() {
  clearTimeout(idleTimer);
  if (!authToken) return;
  // Client-side auto-logout is a "secondary/guest" restriction only.
  if (!currentUser || currentUser.role !== 'secondary') return;
  idleTimer = setTimeout(handleIdleLogout, IDLE_MINUTES * 60 * 1000);
}
['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'].forEach((evt) =>
  document.addEventListener(evt, resetIdleTimer, { passive: true })
);

async function handleIdleLogout() {
  try {
    await fetch(`${API_BASE}/auth/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${authToken}` },
    });
  } catch (_) {}
  doClientLogout('You were logged out after 5 minutes of inactivity.');
}

function doClientLogout(message) {
  setAuthToken(null);
  currentUser = null;
  clearTimeout(idleTimer);
  sessionStorage.removeItem('auctech_view');
  document.getElementById('app')?.classList.remove('on');
  document.getElementById('lockScreen').style.display = 'flex';
  if (message) toastLogin(message, 'warn');
  showLoginTile('main');
}

/* ---------------- authenticated fetch wrapper ---------------- */
async function authFetch(path, opts = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(opts.headers || {}),
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    },
  });
  if (res.status === 440) {
    doClientLogout('Your session expired due to inactivity.');
    throw new Error('IDLE_TIMEOUT');
  }
  if (res.status === 401) {
    doClientLogout('Please log in again.');
    throw new Error('UNAUTHORIZED');
  }
  return res;
}
window.authFetch = authFetch; // exposed so the rest of the app (vault CRUD) can use it

/* ---------------- tile switching ---------------- */
function showLoginTile(which) {
  document.querySelectorAll('.login-tile').forEach((el) => (el.style.display = 'none'));
  document.querySelectorAll('.login-tab').forEach((el) => el.classList.remove('on'));
  document.getElementById(`tile-${which}`).style.display = 'block';
  document.querySelector(`.login-tab[data-tile="${which}"]`)?.classList.add('on');
  document.getElementById('loginErr').textContent = '';
}
window.showLoginTile = showLoginTile;

/* ---------------- password show/hide (eye icon) ---------------- */
const EYE_SVG =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>';
const EYEOFF_SVG =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3l18 18M10.6 5.1A10.8 10.8 0 0 1 12 5c6.5 0 10 7 10 7a17.6 17.6 0 0 1-3.2 4.1M6.6 6.6C4 8.5 2 12 2 12s3.5 7 10 7a10 10 0 0 0 4.4-1M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg>';

function initPasswordToggles() {
  document.querySelectorAll('.pw-toggle').forEach((btn) => {
    if (btn.dataset.wired) return; // avoid double-binding if called more than once
    btn.dataset.wired = '1';
    btn.innerHTML = EYE_SVG;
    btn.addEventListener('click', () => {
      const input = document.getElementById(btn.dataset.target);
      if (!input) return;
      const showing = input.type === 'text';
      input.type = showing ? 'password' : 'text';
      btn.innerHTML = showing ? EYE_SVG : EYEOFF_SVG;
      btn.title = showing ? 'Show password' : 'Hide password';
    });
  });
}
window.initPasswordToggles = initPasswordToggles;
// Toggles are wired after lockscreen HTML is injected (see index.html fetch callback)

/* ---------------- forgot password ---------------- */
const forgotPw = { loginType: null };

function openForgotPassword(loginType) {
  forgotPw.loginType = loginType;
  document.querySelectorAll('.login-tile').forEach((el) => (el.style.display = 'none'));
  document.querySelectorAll('.login-tab').forEach((el) => el.classList.remove('on'));
  document.getElementById('tile-forgot').style.display = 'block';
  document.getElementById('forgot-step-1').style.display = 'block';
  document.getElementById('forgot-step-2').style.display = 'none';
  document.getElementById('forgot-heading').textContent =
    `Reset your ${loginType.charAt(0).toUpperCase() + loginType.slice(1)} account password`;
  // carry over whatever email was already typed on that tile, if any
  const prefill = document.getElementById(`${loginType}-email`)?.value.trim();
  document.getElementById('forgot-email').value = prefill || '';
  document.getElementById('loginErr').textContent = '';
}
window.openForgotPassword = openForgotPassword;

function closeForgotPassword() {
  document.getElementById('forgot-otp').value = '';
  document.getElementById('forgot-new-password').value = '';
  document.getElementById('forgot-confirm-password').value = '';
  showLoginTile(forgotPw.loginType || 'main');
}
window.closeForgotPassword = closeForgotPassword;

async function requestPasswordReset() {
  const email = document.getElementById('forgot-email').value.trim();
  if (!email) return toastLogin('Enter your email', 'err');
  if (!forgotPw.loginType) return toastLogin('Something went wrong, please start over', 'err');

  toastLogin('Sending reset code…', 'ok');
  try {
    const res = await fetch(`${API_BASE}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, loginType: forgotPw.loginType }),
    });
    const data = await res.json();
    if (!res.ok) return toastLogin(data.error || 'Could not send reset code', 'err');
    forgotPw.email = email;
    document.getElementById('forgot-step-1').style.display = 'none';
    document.getElementById('forgot-step-2').style.display = 'block';
    toastLogin(data.message || 'If that account exists, a reset code has been sent.', 'ok');
  } catch (err) {
    toastLogin('Network error, please try again', 'err');
  }
}
window.requestPasswordReset = requestPasswordReset;

async function resendPasswordReset() {
  if (!forgotPw.email || !forgotPw.loginType) return toastLogin('Please start over', 'err');
  try {
    const res = await fetch(`${API_BASE}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: forgotPw.email, loginType: forgotPw.loginType }),
    });
    const data = await res.json();
    toastLogin(res.ok ? data.message || 'Code resent' : data.error || 'Could not resend code', res.ok ? 'ok' : 'err');
  } catch (err) {
    toastLogin('Network error, please try again', 'err');
  }
}
window.resendPasswordReset = resendPasswordReset;

async function submitPasswordReset() {
  const otp = document.getElementById('forgot-otp').value.trim();
  const newPassword = document.getElementById('forgot-new-password').value;
  const confirmPassword = document.getElementById('forgot-confirm-password').value;

  if (!otp) return toastLogin('Enter the reset code', 'err');
  if (!newPassword || newPassword.length < 8) return toastLogin('New password must be at least 8 characters', 'err');
  if (newPassword !== confirmPassword) return toastLogin('Passwords do not match', 'err');

  try {
    const res = await fetch(`${API_BASE}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: forgotPw.email, loginType: forgotPw.loginType, otp, newPassword }),
    });
    const data = await res.json();
    if (!res.ok) return toastLogin(data.error || 'Could not reset password', 'err');

    // success — drop back to the sign-in tile for that role with a fresh form
    const loginType = forgotPw.loginType;
    document.getElementById('forgot-otp').value = '';
    document.getElementById('forgot-new-password').value = '';
    document.getElementById('forgot-confirm-password').value = '';
    const emailField = document.getElementById(`${loginType}-email`);
    const passwordField = document.getElementById(`${loginType}-password`);
    if (emailField) emailField.value = forgotPw.email;
    if (passwordField) passwordField.value = '';
    showLoginTile(loginType);
    toastLogin(data.message || 'Password updated. Please sign in.', 'ok');
  } catch (err) {
    toastLogin('Network error, please try again', 'err');
  }
}
window.submitPasswordReset = submitPasswordReset;

function toastLogin(msg, kind) {
  const el = document.getElementById('loginErr');
  if (!el) return alert(msg);
  el.textContent = msg;
  el.style.color = kind === 'ok' ? 'var(--ok)' : kind === 'warn' ? 'var(--warn)' : 'var(--danger)';
}

/* ---------------- Main / Social / Developer (password) login ---------------- */
async function passwordLogin(loginType) {
  const email = document.getElementById(`${loginType}-email`).value.trim();
  const password = document.getElementById(`${loginType}-password`).value;
  if (!email || !password) return toastLogin('Enter email and password', 'err');

  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, loginType }),
    });
    const data = await res.json();
    if (!res.ok) return toastLogin(data.error || 'Login failed', 'err');

    onLoginSuccess(data.token, data.user);
  } catch (err) {
    toastLogin('Network error, please try again', 'err');
  }
}
window.passwordLogin = passwordLogin;

/* ---------------- Secondary login wizard ---------------- */
const secondary = { sessionId: null, location: null };

async function secondaryStep1() {
  const name = document.getElementById('sec-name').value.trim();
  const email = document.getElementById('sec-email').value.trim();
  if (!name) return toastLogin('Enter your name', 'err');
  if (!email) return toastLogin('Enter your email', 'err');

  // STEP A: check the email is registered for secondary access BEFORE
  // ever asking the browser for location permission.
  toastLogin('Checking email…', 'ok');
  let checkRes, checkData;
  try {
    checkRes = await fetch(`${API_BASE}/auth/secondary/check-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    checkData = await checkRes.json();
  } catch (_) {
    return toastLogin('Network error, please try again', 'err');
  }
  if (!checkRes.ok) {
    // e.g. "This email is not registered for secondary access."
    return toastLogin(checkData.error || 'This email is not registered.', 'err');
  }

  // STEP B: email is valid — NOW ask the browser for location permission.
  if (!navigator.geolocation) {
    return toastLogin('Your browser does not support location — cannot continue.', 'err');
  }

  toastLogin('Requesting location permission…', 'ok');
  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      secondary.location = {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
      };
      // STEP C: location granted — verify the email and email the OTP to it.
      toastLogin('Sending OTP to your email…', 'ok');
      try {
        const res = await fetch(`${API_BASE}/auth/secondary/init`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, ...secondary.location }),
        });
        const data = await res.json();
        if (!res.ok) return toastLogin(data.error || 'Could not continue', 'err');
        secondary.sessionId = data.sessionId;
        document.getElementById('sec-step-1').style.display = 'none';
        document.getElementById('sec-step-2').style.display = 'block';
        document.getElementById('loginErr').textContent = '';
      } catch (_) {
        toastLogin('Network error, please try again', 'err');
      }
    },
    () => {
      // Location denied or unavailable — flow is blocked per requirement.
      toastLogin('Location access is required to continue. Please enable it and try again.', 'err');
    },
    { enableHighAccuracy: true, timeout: 10000 }
  );
}
window.secondaryStep1 = secondaryStep1;

async function secondaryVerifyOtp() {
  const otp = document.getElementById('sec-otp').value.trim();
  if (!otp) return toastLogin('Enter the OTP', 'err');

  try {
    const res = await fetch(`${API_BASE}/auth/secondary/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: secondary.sessionId, otp }),
    });
    const data = await res.json();
    if (!res.ok) return toastLogin(data.error || 'Incorrect OTP', 'err');
    onLoginSuccess(data.token, data.user);
  } catch (_) {
    toastLogin('Network error, please try again', 'err');
  }
}
window.secondaryVerifyOtp = secondaryVerifyOtp;

async function secondaryResendOtp() {
  try {
    const res = await fetch(`${API_BASE}/auth/secondary/resend-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: secondary.sessionId }),
    });
    const data = await res.json();
    if (res.ok) {
      document.getElementById('loginErr').textContent = '';
    } else {
      toastLogin(data.error, 'err');
    }
  } catch (_) {
    toastLogin('Network error, please try again', 'err');
  }
}
window.secondaryResendOtp = secondaryResendOtp;

/* ---------------- shared success path ---------------- */
function onLoginSuccess(token, user) {
  setAuthToken(token);
  currentUser = user;
  document.getElementById('lockScreen').style.display = 'none';
  document.getElementById('app').classList.add('on');
  resetIdleTimer();
  window.dispatchEvent(new CustomEvent('auctech:login', { detail: { user } }));
}

/**
 * On page load (including a refresh), if a token is already sitting in
 * sessionStorage from earlier in this tab, verify it's still valid against
 * the server (GET /auth/me) and silently resume the session instead of
 * showing the login screen. An invalid/expired token just falls through to
 * the normal lock screen — same as any other 401.
 */
async function tryResumeSession() {
  if (!authToken) return;
  try {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    if (!res.ok) {
      setAuthToken(null);
      return;
    }
    const data = await res.json();
    onLoginSuccess(authToken, data.user);
  } catch (_) {
    setAuthToken(null);
  }
}
// tryResumeSession is called after lockscreen HTML is injected (see index.html fetch callback)

function currentAuthUser() {
  return currentUser;
}
window.currentAuthUser = currentAuthUser;

/* ---------------- manual logout (for a "log out" button in the UI) ---------------- */
async function logout() {
  try {
    if (authToken) {
      await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken}` },
      });
    }
  } catch (_) {}
  doClientLogout(null);
}
window.logout = logout;