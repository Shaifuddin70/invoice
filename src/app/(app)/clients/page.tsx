import type { Metadata } from "next";
import Link from "next/link";
import { asc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { clients, invoices } from "@/db/schema";
import { requireUser } from "@/lib/dal";
import { EmptyState, PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "Clients" };

export default async function ClientsPage() {
  const user = await requireUser();
  const rows = await db
    .select({
      id: clients.id,
      name: clients.name,
      company: clients.company,
      email: clients.email,
      phone: clients.phone,
      invoiceCount: sql<number>`count(${invoices.id})::int`,
    })
    .from(clients)
    .leftJoin(invoices, eq(invoices.clientId, clients.id))
    .where(eq(clients.userId, user.id))
    .groupBy(clients.id)
    .orderBy(asc(clients.name));

  return (
    <>
      <PageHeader
        title="Clients"
        description="People and companies you bill."
        actions={<Link href="/clients/new" className="btn-primary">+ New client</Link>}
      />
      {rows.length === 0 ? (
        <EmptyState
          title="No clients yet"
          description="Add your first client so you can start sending invoices."
          action={<Link href="/clients/new" className="btn-primary">Add client</Link>}
        />
      ) : (
        <div className="card overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50/60">
              <tr>
                <th className="table-th">Name</th>
                <th className="table-th">Email</th>
                <th className="table-th">Phone</th>
                <th className="table-th text-right">Invoices</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="table-td">
                    <Link href={`/clients/${c.id}`} className="font-medium text-slate-900 hover:text-indigo-600">
                      {c.name}
                    </Link>
                    {c.company && <div className="text-xs text-slate-500">{c.company}</div>}
                  </td>
                  <td className="table-td">{c.email || "—"}</td>
                  <td className="table-td">{c.phone || "—"}</td>
                  <td className="table-td text-right">{c.invoiceCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
