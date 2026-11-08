export function formatNumberPhone(phone: string): string {
  let cleaned = phone.replace(/\D/g, '');

  if (cleaned.startsWith('8') && cleaned.length === 11) {
    cleaned = `7${cleaned.substring(1)}`;
  }

  return cleaned;
}
