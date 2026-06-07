import pool from "@/lib/db";

export async function getVisitCount(): Promise<number> {
  try {
    const { rows } = await pool.query(
      `SELECT COUNT(DISTINCT ip_hash) AS total FROM visits`
    );
    return Number(rows[0]?.total ?? 0);
  } catch {
    return 0;
  }
}
