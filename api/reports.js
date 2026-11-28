import { randomUUID } from 'crypto';
import { getSql } from './_lib/db.js';
import { getUserIdFromRequest } from './_lib/session.js';
import { getRequestingAdmin } from './_lib/admin.js';
import { countHit } from './_lib/dbRateLimit.js';
import { createNotification, getUserContact } from './_lib/notify.js';
import { blockUnconfirmed } from './_lib/emailConfirm.js';
import { REPORT_REASONS, REPORT_DETAILS_MAX } from '../src/data/reports.js';

// Reports about listings and accounts.
//
//   POST {targetType:'item'|'user', targetId, reason, details}   signed-in user
//   GET  ?status=open|closed                                     admin
//   GET  ?count=1                                                admin, for the tab badge
//   POST {action, targetType, targetId}                          admin, where action is
//        'hide_item' | 'suspend_user' | 'resolve' | 'dismiss'; closes the open reports
const DAILY_LIMIT = 10;
const LIST_LIMIT = 300;
const UNDEFINED_TABLE = '42P01';

const notify = async (sql, userId, title, body, link) => {
  try {
    const contact = await getUserContact(sql, userId);
    await createNotification({ sql, userId, type: 'order_status', title, body, link, email: contact?.email, name: contact?.name });
  } catch (err) {
    console.error('Report notification failed:', err.message);
  }
};

// The thing being reported: its owner and a name for it, or null.
async function findTarget(sql, type, id) {
  if (type === 'item') {
    const row = (await sql`SELECT * FROM items WHERE id = ${id}`)[0];
    return row && !row.removed_at ? { ownerId: row.seller_id, label: row.title } : null;
  }
  const row = (await sql`SELECT id, profile_name FROM users WHERE id::text = ${id}`)[0];
  return row ? { ownerId: String(row.id), label: row.profile_name } : null;
}

async function listReports(sql, status) {
  const rows = status === 'closed'
    ? await sql`
        SELECT r.*, u.profile_name AS reporter_name FROM reports r
        LEFT JOIN users u ON u.id::text = r.reporter_id
        WHERE r.status <> 'open' ORDER BY r.closed_at DESC LIMIT ${LIST_LIMIT}`
    : await sql`
        SELECT r.*, u.profile_name AS reporter_name FROM reports r
        LEFT JOIN users u ON u.id::text = r.reporter_id
        WHERE r.status = 'open' ORDER BY r.created_at ASC LIMIT ${LIST_LIMIT}`;

  const itemIds = rows.filter((r) => r.target_type === 'item').map((r) => r.target_id);
  const ownerIds = rows.map((r) => r.owner_id);
  const items = itemIds.length ? await sql`SELECT id, removed_at FROM items WHERE id = ANY(${itemIds})` : [];
  const owners = ownerIds.length
    ? await sql`SELECT id::text AS id, profile_name, is_suspended, is_admin FROM users WHERE id::text = ANY(${ownerIds})`
    : [];

  // One entry per thing reported, with everything said about it.
  const groups = new Map();
  for (const r of rows) {
    const key = `${r.target_type}:${r.target_id}`;
    if (!groups.has(key)) {
      const item = items.find((i) => i.id === r.target_id);
      const owner = owners.find((o) => o.id === r.owner_id);
      groups.set(key, {
        targetType: r.target_type,
        targetId: r.target_id,
        label: r.target_label,
        ownerId: r.owner_id,
        ownerName: owner?.profile_name || '',
        ownerSuspended: Boolean(owner?.is_suspended),
        ownerIsAdmin: Boolean(owner?.is_admin),
        itemGone: r.target_type === 'item' && (!item || Boolean(item.removed_at)),
        reports: [],
      });
    }
    groups.get(key).reports.push({
      id: r.id,
      reason: r.reason,
      details: r.details,
      reporterId: r.reporter_id,
      reporterName: r.reporter_name || '',
      status: r.status,
      createdAt: new Date(r.created_at).getTime(),
    });
  }
  return [...groups.values()];
}

const closeReports = (sql, type, id, status, adminId) => sql`
  UPDATE reports SET status = ${status}, closed_at = now(), closed_by = ${adminId}
  WHERE target_type = ${type} AND target_id = ${id} AND status = 'open'
`;

export default async function handler(req, res) {
  const sql = getSql();
  try {
    if (req.method === 'GET') {
      if (!(await getRequestingAdmin(req))) return res.status(403).json({ error: 'Forbidden' });
      if (req.query.count) {
        const row = (await sql`SELECT COUNT(DISTINCT (target_type, target_id))::int AS n FROM reports WHERE status = 'open'`)[0];
        return res.status(200).json({ open: row.n });
      }
      return res.status(200).json({ groups: await listReports(sql, req.query.status === 'closed' ? 'closed' : 'open') });
    }

    if (req.method !== 'POST') {
      res.setHeader('Allow', 'GET, POST');
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const body = typeof req.body === 'object' && req.body ? req.body : {};
    const targetType = body.targetType === 'item' || body.targetType === 'user' ? body.targetType : null;
    const targetId = typeof body.targetId === 'string' || typeof body.targetId === 'number' ? String(body.targetId) : '';
    if (!targetType || !targetId) return res.status(400).json({ error: 'INVALID_REQUEST' });

    if (body.action) {
      const admin = await getRequestingAdmin(req);
      if (!admin) return res.status(403).json({ error: 'Forbidden' });
      const adminId = String(admin.id);
      const open = (await sql`
        SELECT owner_id, target_label FROM reports
        WHERE target_type = ${targetType} AND target_id = ${targetId} AND status = 'open' LIMIT 1
      `)[0];
      if (!open) return res.status(404).json({ error: 'No open reports' });

      if (body.action === 'hide_item') {
        if (targetType !== 'item') return res.status(400).json({ error: 'INVALID_REQUEST' });
        // Kept, not erased: bids, orders, chats and the report still point to it.
        await sql`UPDATE items SET removed_at = now() WHERE id = ${targetId} AND removed_at IS NULL`;
        await sql`UPDATE second_chance_offers SET status = 'withdrawn', responded_at = now() WHERE item_id = ${targetId} AND status = 'pending'`;
        await notify(sql, open.owner_id, 'Subasti retiró tu publicación',
          `"${open.target_label}" fue retirada tras una revisión. Si crees que es un error, escríbenos.`, '/contact');
        await closeReports(sql, targetType, targetId, 'resolved', adminId);
      } else if (body.action === 'suspend_user') {
        const suspended = await sql`
          UPDATE users SET is_suspended = TRUE WHERE id::text = ${open.owner_id} AND is_admin = FALSE RETURNING id
        `;
        if (!suspended[0]) return res.status(409).json({ error: 'CANNOT_SUSPEND' });
        await closeReports(sql, targetType, targetId, 'resolved', adminId);
      } else if (body.action === 'resolve' || body.action === 'dismiss') {
        await closeReports(sql, targetType, targetId, body.action === 'resolve' ? 'resolved' : 'dismissed', adminId);
      } else {
        return res.status(400).json({ error: 'INVALID_REQUEST' });
      }
      return res.status(200).json({ ok: true });
    }

    // A new report.
    const userId = getUserIdFromRequest(req);
    if (!userId) return res.status(401).json({ error: 'Not authenticated' });
    if (await blockUnconfirmed(sql, userId, res)) return undefined;

    const reason = typeof body.reason === 'string' ? body.reason : '';
    const details = typeof body.details === 'string' ? body.details.trim().slice(0, REPORT_DETAILS_MAX) : '';
    if (!REPORT_REASONS[targetType].some((r) => r.id === reason)) return res.status(400).json({ error: 'REASON_REQUIRED' });
    if (reason === 'other' && !details) return res.status(400).json({ error: 'DETAILS_REQUIRED' });

    const target = await findTarget(sql, targetType, targetId);
    if (!target) return res.status(404).json({ error: 'NOT_FOUND' });
    if (target.ownerId === userId) return res.status(400).json({ error: 'OWN_TARGET' });

    const hits = await countHit(sql, `report:${userId}`, 24 * 3600);
    if (hits !== null && hits > DAILY_LIMIT) return res.status(429).json({ error: 'TOO_MANY_REQUESTS' });

    const others = (await sql`
      SELECT COUNT(*)::int AS n FROM reports WHERE target_type = ${targetType} AND target_id = ${targetId} AND status = 'open'
    `)[0].n;
    const inserted = await sql`
      INSERT INTO reports (id, reporter_id, target_type, target_id, target_label, owner_id, reason, details)
      VALUES (${`report_${randomUUID()}`}, ${userId}, ${targetType}, ${targetId}, ${target.label}, ${target.ownerId}, ${reason}, ${details})
      ON CONFLICT (reporter_id, target_type, target_id) WHERE status = 'open' DO NOTHING
      RETURNING id
    `;
    if (!inserted[0]) return res.status(409).json({ error: 'ALREADY_REPORTED' });

    // Tell admins once per thing, not once per person who reports it.
    if (others === 0) {
      const admins = await sql`SELECT id FROM users WHERE is_admin = TRUE AND is_suspended = FALSE`;
      for (const admin of admins) {
        await notify(sql, String(admin.id), 'Nuevo reporte para revisar',
          `${targetType === 'item' ? 'Publicación' : 'Cuenta'}: "${target.label}".`, '/admin?tab=reports');
      }
    }
    return res.status(201).json({ ok: true });
  } catch (err) {
    // Before sql/027: the admin tab just shows nothing.
    if (err.code === UNDEFINED_TABLE && req.method === 'GET') {
      return res.status(200).json(req.query.count ? { open: 0 } : { groups: [] });
    }
    console.error('Reports request failed:', err.message);
    return res.status(500).json({ error: 'REQUEST_FAILED' });
  }
}
