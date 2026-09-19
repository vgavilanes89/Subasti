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
