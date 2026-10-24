// Turns Supabase Auth errors into fixed, non-revealing messages (AUTH-05). Raw provider text is never shown.
export type AuthErrorLike = { code?: string; status?: number } | null | undefined;
type Context = "sign-in" | "sign-up" | "reset-request" | "reset-update";

export const MESSAGES = {
  signInFailed: "Email or password is incorrect.",
  signInUnconfirmed: "Confirm your email address first: open the link we sent you, then sign in.",
  rateLimited: "Too many attempts. Wait a few minutes and try again.",
  weakPassword: "Choose a stronger password (at least 8 characters).",
  emailNotAllowed:
    "This project cannot send email to that address: the free built-in email service only delivers to project team members. Use a team member's address, or ask the project owner to set up custom email.",
  signUpClosed: "New accounts can't be created right now.",
  linkExpired: "This reset link has expired or was already used. Request a new one.",
  samePassword: "Choose a password different from your current one.",
  generic: "Something went wrong on our side. Please try again.",
  // Shown whether or not the address already has an account.
  signUpCheckEmail: "Check your email. If this address can be used for a new account, a confirmation link is on its way.",
  resetCheckEmail: "If an account exists for that email, a reset link is on its way. It can take a few minutes.",
} as const;

const rateLimit = (e: NonNullable<AuthErrorLike>) =>
  e.status === 429 || e.code === "over_request_rate_limit" || e.code === "over_email_send_rate_limit";

/** Returns the message to show, or "treat-as-success" when the error would reveal that an account exists. */
export function authErrorMessage(error: AuthErrorLike, context: Context): string | "treat-as-success" {
  if (!error) return MESSAGES.generic;
  if (rateLimit(error)) return MESSAGES.rateLimited;
  switch (context) {
    case "sign-in":
      if (error.code === "email_not_confirmed") return MESSAGES.signInUnconfirmed; // only returned after a correct password
      if (error.code === "invalid_credentials" || error.status === 400) return MESSAGES.signInFailed;
      return MESSAGES.generic;
    case "sign-up":
      if (error.code === "user_already_exists" || error.code === "email_exists") return "treat-as-success";
      if (error.code === "weak_password") return MESSAGES.weakPassword;
      if (error.code === "email_address_not_authorized") return MESSAGES.emailNotAllowed; // provider restriction, not an app fault
      if (error.code === "signup_disabled") return MESSAGES.signUpClosed;
      return MESSAGES.generic;
    case "reset-request":
      return "treat-as-success"; // never reveal anything about the address
    case "reset-update":
      if (error.code === "same_password") return MESSAGES.samePassword;
      if (error.code === "weak_password") return MESSAGES.weakPassword;
      if (error.code === "session_not_found" || error.code === "reauthentication_needed" || error.status === 401 || error.status === 403)
        return MESSAGES.linkExpired;
      return MESSAGES.generic;
  }
}
