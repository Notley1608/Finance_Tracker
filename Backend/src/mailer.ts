const APP_BASE_URL = process.env.FRONTEND_URL ?? "http://localhost:5173";

function logResetUrl(email: string, token: string): void {
  console.log(
    `[password-reset] ${email} -> ${APP_BASE_URL}/reset-password?token=${encodeURIComponent(token)}`,
  );
}

/**
 * Emails a password reset link. In development this logs the reset URL to the
 * console. Swap this function for a real email provider in production.
 */
export function sendPasswordResetEmail(email: string, token: string): void {
  logResetUrl(email, token);
}