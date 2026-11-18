export async function getCommissionRate(sql) {
  const rows = await sql`SELECT value FROM platform_settings WHERE key = 'commission_rate'`;
  const rate = rows[0] ? Number(rows[0].value) : 0;
  return Number.isFinite(rate) ? rate : 0;
}

export async function setCommissionRate(sql, rate) {
  await sql`
    INSERT INTO platform_settings (key, value) VALUES ('commission_rate', ${String(rate)})
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
  `;
}

// Subasti's own SINPE Móvil number — the one buyers transfer to. Stored as 8
// digits; null until an admin sets it, which keeps SINPE checkout switched off.
export async function getSinpeNumber(sql) {
  const rows = await sql`SELECT value FROM platform_settings WHERE key = 'sinpe_number'`;
  const value = rows[0]?.value || '';
  return /^\d{8}$/.test(value) ? value : null;
}

export async function setSinpeNumber(sql, digits) {
  await sql`
    INSERT INTO platform_settings (key, value) VALUES ('sinpe_number', ${digits})
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
  `;
}
