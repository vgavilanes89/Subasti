export function toPublicUser(row) {
  return {
    id: String(row.id),
    accountNumber: row.account_number,
    cedula: row.cedula,
    realName: row.real_name,
    profileName: row.profile_name,
    email: row.email,
    countryCode: row.country_code,
    phone: row.phone,
    province: row.province,
    city: row.city,
    isAdmin: row.is_admin,
    isSuspended: row.is_suspended,
    createdAt: row.created_at ? new Date(row.created_at).getTime() : null,
    savedAddresses: [],
    savedPayments: [],
    reviews: [],
  };
}

// Unlike toPublicUser (returned only to the account's own owner via
// login/me/signup), this is served to ANY visitor looking at a seller's item
// or profile page — so it excludes cedula, email, phone and account number.
export function toPublicProfile(row) {
  return {
    id: String(row.id),
    profileName: row.profile_name,
    city: row.city,
    province: row.province,
    isAdmin: row.is_admin,
    reviews: [],
  };
}

export function generateAccountNumber() {
  const digits = Math.floor(10000000 + Math.random() * 90000000);
  return `SUB-${digits}`;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PROFILE_NAME_REGEX = /^[a-zA-Z0-9]{3,30}$/;

// Trims/normalizes raw signup fields into the shape stored in the DB.
export function parseSignupInput(body) {
  return {
    cedula: typeof body.cedula === 'string' ? body.cedula.replace(/[\s-]/g, '') : '',
    realName: typeof body.realName === 'string' ? body.realName.trim() : '',
    profileName: typeof body.profileName === 'string' ? body.profileName.trim() : '',
    email: typeof body.email === 'string' ? body.email.trim().toLowerCase() : '',
    password: typeof body.password === 'string' ? body.password : '',
    countryCode: typeof body.countryCode === 'string' ? body.countryCode.trim() : '',
    phone: typeof body.phone === 'string' ? body.phone.trim() : '',
    province: typeof body.province === 'string' ? body.province.trim() : '',
    city: typeof body.city === 'string' ? body.city.trim() : '',
  };
}

export function validateSignupInput(fields) {
  if (!/^\d{9,12}$/.test(fields.cedula)) return 'Invalid cédula format';
  if (!fields.realName || fields.realName.length > 200) return 'Invalid full name';
  if (!PROFILE_NAME_REGEX.test(fields.profileName)) return 'Invalid profile name';
  if (!EMAIL_REGEX.test(fields.email) || fields.email.length > 200) return 'Invalid email';
  if (fields.password.length < 8 || fields.password.length > 200) return 'Password must be at least 8 characters';
  if (!/^\+\d{1,4}$/.test(fields.countryCode)) return 'Invalid country code';
  if (!fields.phone || fields.phone.length > 30) return 'Invalid phone number';
  if (!fields.province || fields.province.length > 100) return 'Invalid province';
  if (!fields.city || fields.city.length > 100) return 'Invalid city';
  return null;
}
