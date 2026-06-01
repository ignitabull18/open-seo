export const DEFAULT_HOSTED_ALLOWED_EMAIL = "jeremy@ignitabull.com";

export const HOSTED_SIGNUP_FORBIDDEN_MESSAGE =
  "This OpenSEO deployment only allows jeremy@ignitabull.com to create an account.";

export function normalizeHostedEmail(email: string) {
  return email.trim().toLowerCase();
}

export function getHostedAllowedEmails(rawAllowlist: string | undefined) {
  const emails = (rawAllowlist?.trim() || DEFAULT_HOSTED_ALLOWED_EMAIL)
    .split(",")
    .map(normalizeHostedEmail)
    .filter(Boolean);

  return new Set(emails.length > 0 ? emails : [DEFAULT_HOSTED_ALLOWED_EMAIL]);
}

export function isHostedEmailAllowed(
  email: string | null | undefined,
  rawAllowlist: string | undefined,
) {
  if (!email) {
    return false;
  }

  return getHostedAllowedEmails(rawAllowlist).has(normalizeHostedEmail(email));
}
