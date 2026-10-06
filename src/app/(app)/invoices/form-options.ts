import "server-only";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { clients, services } from "@/db/schema";

export async function getFormOptions(userId: string) {
  const [clientRows, serviceRows] = await Promise.all([
    db
      .select({ id: clients.id, name: clients.name, company: clients.company })
      .from(clients)
      .where(eq(clients.userId, userId))
      .orderBy(asc(clients.name)),
    db
      .select({
        id: services.id,
        name: services.name,
        description: services.description,
        unitPrice: services.unitPrice,
        unit: services.unit,
      })
      .from(services)
      .where(and(eq(services.userId, userId), eq(services.active, true)))
      .orderBy(asc(services.name)),
  ]);
  return { clients: clientRows, services: serviceRows };
}
