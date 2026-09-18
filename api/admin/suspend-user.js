import { getSql } from '../_lib/db.js';
import { getRequestingAdmin } from '../_lib/admin.js';
import { toPublicUser } from '../_lib/users.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const admin = await getRequestingAdmin(req);
  if (!admin) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const body = typeof req.body === 'object' && req.body ? req.body : {};
  const targetId = String(body.userId || '');
  const suspended = Boolean(body.suspended);
  if (!targetId) {
    return res.status(400).json({ error: 'userId is required' });
  }
  if (targetId === String(admin.id)) {
    return res.status(400).json({ error: 'CANNOT_SUSPEND_SELF' });
  }

  const sql = getSql();
  // is_admin = FALSE guards against suspending another admin even if the
  // client-side disabled button is bypassed.
  const rows = await sql`
    UPDATE users SET is_suspended = ${suspended}
    WHERE id = ${targetId} AND is_admin = FALSE
    RETURNING *
  `;
  if (!rows[0]) {
    return res.status(404).json({ error: 'User not found' });
  }
  return res.status(200).json(toPublicUser(rows[0]));
}
