// Costa Rican IBANs are 22 characters: "CR" + 2 check digits + 18 digits.
const CR_IBAN_REGEX = /^CR\d{20}$/;

// Standard IBAN mod-97 check — catches typos before they reach an admin
// sending real money to the wrong account.
export function isValidIban(iban) {
  if (!CR_IBAN_REGEX.test(iban)) return false;
  const rearranged = iban.slice(4) + iban.slice(0, 4);
  const numeric = rearranged.replace(/[A-Z]/g, (c) => String(c.charCodeAt(0) - 55));
  let remainder = 0;
  for (const digit of numeric) {
    remainder = (remainder * 10 + Number(digit)) % 97;
  }
  return remainder === 1;
}

// Returns { value } on success or { error } with a stable code the client
// can translate.
export function parsePayoutAccount(body) {
  const method = body.method === 'sinpe' ? 'sinpe' : body.method === 'bank' ? 'bank' : null;
  if (!method) return { error: 'INVALID_METHOD' };

  const holderName = typeof body.holderName === 'string' ? body.holderName.trim().slice(0, 100) : '';
  if (holderName.length < 3) return { error: 'INVALID_HOLDER_NAME' };

  if (method === 'bank') {
    const bankName = typeof body.bankName === 'string' ? body.bankName.trim().slice(0, 80) : '';
    if (!bankName) return { error: 'INVALID_BANK_NAME' };
    const iban = typeof body.iban === 'string' ? body.iban.replace(/[\s-]/g, '').toUpperCase() : '';
    if (!isValidIban(iban)) return { error: 'INVALID_IBAN' };
    return { value: { method, holderName, bankName, iban, sinpePhone: null } };
  }

  const digits = typeof body.sinpePhone === 'string' ? body.sinpePhone.replace(/\D/g, '') : '';
  const sinpePhone = digits.length === 11 && digits.startsWith('506') ? digits.slice(3) : digits;
  if (!/^\d{8}$/.test(sinpePhone)) return { error: 'INVALID_SINPE_PHONE' };
  return { value: { method, holderName, bankName: null, iban: null, sinpePhone } };
}

export function toPublicPayoutAccount(row) {
  if (!row) return null;
  return {
    method: row.method,
    holderName: row.holder_name,
    bankName: row.bank_name || '',
    iban: row.iban || '',
    sinpePhone: row.sinpe_phone || '',
    updatedAt: row.updated_at ? new Date(row.updated_at).getTime() : null,
  };
}
