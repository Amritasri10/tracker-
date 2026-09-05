
const API_ENDPOINTS = {
  // Auth
  LOGIN:                  '/auth/login',
  LOGOUT:                 '/auth/logout',
  ME:                     '/auth/me',
  FORGOT_PASSWORD:        '/auth/forgot-password',
  RESET_PASSWORD:         '/auth/reset-password',
  SECONDARY_CHECK_EMAIL:  '/auth/secondary/check-email',
  SECONDARY_INIT:         '/auth/secondary/init',
  SECONDARY_VERIFY_OTP:   '/auth/secondary/verify-otp',
  SECONDARY_RESEND_OTP:   '/auth/secondary/resend-otp',

  // Credentials
  CREDENTIALS:            '/credentials',
  CREDENTIAL_BY_ID:       (id) => `/credentials/${encodeURIComponent(id)}`,
  CREDENTIAL_REVEAL:      (id) => `/credentials/${encodeURIComponent(id)}/reveal`,
  CREDENTIALS_EXPORT:     '/credentials/export/all',
  CREDENTIALS_RESTORE:    '/credentials/restore',

  // Audit
  AUDIT:                  '/audit',
};
