import { neon } from "@neondatabase/serverless";
import { describe, expect, it } from "vitest";

const testDatabaseUrl = process.env.TEST_DATABASE_URL;

describe("Intégration Neon (optionnelle)", () => {
  it.skipIf(!testDatabaseUrl)("se connecte à la base de test configurée", async () => {
    const sql = neon(testDatabaseUrl!);
    const result = (await sql.query("select 1 as ok", [])) as { rows: { ok: number }[] };
    expect(Number(result.rows[0]?.ok)).toBe(1);
  });
});
