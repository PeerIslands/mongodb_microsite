/** Must stay in sync with backend `UserService.INTERNAL_DOMAIN` */
export const INTERNAL_EMAIL_DOMAIN = '@peerislands.io';

export function isInternalEmail(email: string): boolean {
  const e = email.trim().toLowerCase();
  return e.endsWith(INTERNAL_EMAIL_DOMAIN);
}
