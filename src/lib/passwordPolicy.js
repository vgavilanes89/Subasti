// One password policy for the whole site. Shared by the browser (live checklist)
// and the server (the real enforcement: signup, reset, admin-created accounts
// and "change password") so the two can never disagree. Existing passwords keep
// working; the policy only applies when someone sets a new one.
//
// Rules:
//   - 10 to 200 characters
//   - at least one letter and one number
//   - not a commonly used password (or one with digits/symbols stuck on the end)
//   - not built from the person's own email, profile name, name or cédula
export const PASSWORD_MIN = 10;
export const PASSWORD_MAX = 200;

// Words people reach for first. The check is on the password lowercased, and
// again with trailing digits/symbols removed (so "Password123!" is caught too).
const COMMON_BASES = new Set([
    'password', 'passw0rd', 'pass', 'contrasena', 'contrasenia', 'clave', 'secreto', 'admin', 'administrator', 'root', 'login', 'welcome', 'bienvenido',
    'letmein', 'iloveyou', 'tequiero', 'teamo', 'amor', 'princess', 'princesa', 'sunshine', 'dragon', 'monkey', 'master', 'superman', 'batman',
    'football', 'futbol', 'baseball', 'basketball', 'soccer', 'liverpool', 'barcelona', 'realmadrid', 'saprissa', 'herediano', 'alajuelense',
    'qwerty', 'qwertyuiop', 'qwertyuiopasdfghjkl', 'asdfgh', 'asdfghjkl', 'zxcvbnm', 'zxcvbn', 'abcdef', 'abcdefgh', 'abcdefghij', 'abc',
    'azerty', 'trustno', 'shadow', 'michael', 'jordan', 'hunter', 'ranger', 'killer', 'starwars', 'pokemon', 'whatever', 'freedom', 'computer',
    'internet', 'cheese', 'summer', 'winter', 'flower', 'jessica', 'daniel', 'andrea', 'maria', 'carlos', 'jose', 'mariposa', 'estrella', 'chocolate',
    'costarica', 'costa', 'rica', 'pura', 'puravida', 'puravida2024', 'sanjose', 'subasti', 'subasta', 'remate', 'cartago', 'heredia', 'alajuela',
    'test', 'testing', 'demo', 'guest', 'user', 'changeme', 'default', 'temp', 'temporal', 'secret', 'private', 'access', 'mypassword', 'micontrasena',
]);

const COMMON_FULL = new Set([
    '1234567890', '0987654321', '12345678910', '1234567891', '123456789012', '1q2w3e4r5t', '1q2w3e4r', 'qwerty123', 'qwerty1234',
    '1111111111', '0000000000', '1212121212', '1234512345', '123123123', '1234554321', 'abc1234567', 'abcd123456', 'a1b2c3d4e5',
    'password1234', 'password12345', 'contrasena123', 'iloveyou123', 'welcome123', 'admin12345', 'admin123456',
]);

// A run like 1234567890 / abcdefghij / 9876543210.
const isSequential = (value) => {
    if (value.length < 4) return false;
    let up = true;
    let down = true;
    for (let i = 1; i < value.length; i += 1) {
        const diff = value.charCodeAt(i) - value.charCodeAt(i - 1);
        if (diff !== 1) up = false;
        if (diff !== -1) down = false;
    }
    return up || down;
};

const stripTail = (value) => value.replace(/[0-9!@#$%^&*()_+\-=.,?]+$/u, '');

export const isCommonPassword = (password) => {
    const lower = String(password).toLowerCase();
    if (COMMON_FULL.has(lower) || COMMON_BASES.has(lower)) return true;
    // Too little variety: aaaaaaaaaa1, abababab12 …
    if (new Set(Array.from(lower)).size < 5) return true;
    if (isSequential(lower)) return true;
    // short repeating unit: abababababab, 123123123123
    const unit = lower.match(/^(.{1,4}?)\1{2,}$/u);
    if (unit) return true;
    const base = stripTail(lower);
    return base.length >= 4 && (COMMON_BASES.has(base) || isSequential(base));
};

const emailLocalPart = (email) => String(email || '').split('@')[0].toLowerCase();

// True if the password is made out of the person's own details.
export const containsPersonalInfo = (password, context = {}) => {
    const lower = String(password).toLowerCase();
    const digitsOnly = lower.replace(/\D/g, '');
    const pieces = [
        emailLocalPart(context.email),
        String(context.profileName || '').toLowerCase(),
        ...String(context.realName || '').toLowerCase().split(/\s+/),
    ].filter((p) => p.length >= 4);
    if (pieces.some((p) => lower.includes(p))) return true;
    const cedula = String(context.cedula || '').replace(/\D/g, '');
    return cedula.length >= 6 && digitsOnly.includes(cedula);
};

// Returns { ok, checks, problems }. `checks` drives the live checklist;
// `problems` are stable codes the server returns and the UI translates:
// LENGTH, NEEDS_LETTER_AND_NUMBER, TOO_COMMON, PERSONAL.
export function checkPassword(password, context = {}) {
    const value = typeof password === 'string' ? password : '';
    const checks = {
        length: value.length >= PASSWORD_MIN && value.length <= PASSWORD_MAX,
        mix: /\p{L}/u.test(value) && /\d/.test(value),
        notCommon: value.length === 0 ? true : !isCommonPassword(value),
        notPersonal: value.length === 0 ? true : !containsPersonalInfo(value, context),
    };
    const problems = [];
    if (!checks.length) problems.push('LENGTH');
    if (!checks.mix) problems.push('NEEDS_LETTER_AND_NUMBER');
    if (!checks.notCommon) problems.push('TOO_COMMON');
    if (!checks.notPersonal) problems.push('PERSONAL');
    return { ok: problems.length === 0, checks, problems };
}
