/** Mirrors backend/src/common/phone.ts. MTN (078, 079) and Airtel (072, 073) only. */
const RWANDA_PHONE = /^\+2507[2389]\d{7}$/;

/** Accepts 0788 123 456, 788123456, 250788123456 or +250 788-123-456 and returns +250788123456. */
export function normalizePhone(value: string): string {
  const compact = value.replace(/[\s\-().]/g, "");
  const local = compact.replace(/^\+?250/, "").replace(/^0/, "");
  return /^\d{9}$/.test(local) ? `+250${local}` : compact;
}

export function isValidPhone(value: string): boolean {
  return RWANDA_PHONE.test(normalizePhone(value));
}

/** +250788123456 becomes +250 788 123 456. */
export function formatPhone(e164: string): string {
  return e164.replace(/^\+250(\d{3})(\d{3})(\d{3})$/, "+250 $1 $2 $3");
}
