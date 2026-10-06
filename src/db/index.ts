import "server-only";
import { drizzle as drizzlePostgres, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import postgres from "postgres";
import * as schema from "./schema";

export type DB = PostgresJsDatabase<typeof schema>;

declare global {
  var __invoiceDb: DB | undefined;
}

function createDb(): DB {
  const url = process.env.DATABASE_URL;
  if (url) {
    return drizzlePostgres(postgres(url, { max: 10, prepare: false }), { schema });
  }
  // Without DATABASE_URL we fall back to an embedded Postgres for local development.
  // Both drivers share the same query API, so the cast is safe for app code.
  return drizzlePglite(process.env.PGLITE_DIR ?? "./.pglite", { schema }) as unknown as DB;
}

function getDb(): DB {
  globalThis.__invoiceDb ??= createDb();
  return globalThis.__invoiceDb;
}

// Connect lazily so importing this module (e.g. during `next build`) never opens the database.
export const db = new Proxy({} as DB, {
  get(_, prop) {
    const real = getDb();
    const value = Reflect.get(real, prop);
    return typeof value === "function" ? value.bind(real) : value;
  },
});
