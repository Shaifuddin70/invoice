import type { Metadata } from "next";
import Link from "next/link";
import { asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { services } from "@/db/schema";
import { requireUser } from "@/lib/dal";
import { EmptyState, PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "Services" };

export default async function ServicesPage() {
  const user = await requireUser();
  const rows = await db
    .select()
    .from(services)
    .where(eq(services.userId, user.id))
    .orderBy(desc(services.active), asc(services.name));

  return (
    <>
      <PageHeader
        title="Services"
        description="Your catalog of products and services, ready to drop into invoices."
        actions={<Link href="/services/new" className="btn-primary">+ New service</Link>}
      />
      {rows.length === 0 ? (
        <EmptyState
          title="No services yet"
          description="Save the services you offer with a default price to fill invoices faster."
          action={<Link href="/services/new" className="btn-primary">Add service</Link>}
        />
      ) : (
        <div className="card overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50/60">
              <tr>
                <th className="table-th">Service</th>
                <th className="table-th">Unit</th>
                <th className="table-th text-right">Default price</th>
                <th className="table-th text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="table-td">
                    <Link href={`/services/${s.id}`} className="font-medium text-slate-900 hover:text-indigo-600">
                      {s.name}
                    </Link>
                    {s.description && <div className="line-clamp-1 text-xs text-slate-500">{s.description}</div>}
                  </td>
                  <td className="table-td capitalize">{s.unit}</td>
                  <td className="table-td text-right tabular-nums">{s.unitPrice.toFixed(2)}</td>
                  <td className="table-td text-right">
                    <span className={`text-xs font-medium ${s.active ? "text-emerald-600" : "text-slate-400"}`}>
                      {s.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
