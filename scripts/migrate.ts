import "dotenv/config";

async function main() {
  const url = process.env.DATABASE_URL;
  const migrationsFolder = "./drizzle";

  if (url) {
    const { drizzle } = await import("drizzle-orm/postgres-js");
    const { migrate } = await import("drizzle-orm/postgres-js/migrator");
    const postgres = (await import("postgres")).default;
    const client = postgres(url, { max: 1 });
    await migrate(drizzle(client), { migrationsFolder });
    await client.end();
  } else {
    const { drizzle } = await import("drizzle-orm/pglite");
    const { migrate } = await import("drizzle-orm/pglite/migrator");
    const db = drizzle(process.env.PGLITE_DIR ?? "./.pglite");
    await migrate(db, { migrationsFolder });
    await db.$client.close();
  }
  console.log("Migrations applied");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
