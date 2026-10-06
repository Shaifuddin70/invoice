import type { Metadata } from "next";
import Link from "next/link";
import { and, desc, eq, gte, ilike, lt, or, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { clients, invoices } from "@/db/schema";
import { requireUser } from "@/lib/dal";
import { formatMoney } from "@/lib/money";
import { displayStatus, formatDate, today } from "@/lib/status";
import { EmptyState, PageHeader, StatusBadge } from "@/components/ui";

export const metadata: Metadata = { title: "Invoices" };

const TABS = [
  { key: "all", label: "All" },
  { key: "draft", label: "Draft" },
  { key: "sent", label: "Unpaid" },
  { key: "overdue", label: "Overdue" },
  { key: "paid", label: "Paid" },
  { key: "cancelled", label: "Cancelled" },
] as const;

export default async function InvoicesPage(props: PageProps<"/invoices">) {
  const sp = await props.searchParams;
  const tab = TABS.find((t) => t.key === sp.status)?.key ?? "all";
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const user = await requireUser();

  const filters: (SQL | undefined)[] = [eq(invoices.userId, user.id)];
  if (tab === "overdue") filters.push(eq(invoices.status, "sent"), lt(invoices.dueDate, today()));
  else if (tab === "sent") filters.push(eq(invoices.status, "sent"), gte(invoices.dueDate, today()));
  else if (tab !== "all") filters.push(eq(invoices.status, tab));
  if (q) {
    const like = `%${q.replace(/[%_\\]/g, "\\$&")}%`;
    filters.push(or(ilike(invoices.number, like), ilike(clients.name, like), ilike(clients.company, like)));
  }

  const rows = await db
    .select({
      id: invoices.id,
      number: invoices.number,
      status: invoices.status,
      issueDate: invoices.issueDate,
      dueDate: invoices.dueDate,
      total: invoices.total,
      currency: invoices.currency,
      clientName: clients.name,
      clientCompany: clients.company,
    })
    .from(invoices)
    .innerJoin(clients, eq(clients.id, invoices.clientId))
    .where(and(...filters))
    .orderBy(desc(invoices.issueDate), desc(invoices.createdAt));

  const hrefFor = (status: string) => {
    const params = new URLSearchParams();
    if (status !== "all") params.set("status", status);
    if (q) params.set("q", q);
    const s = params.toString();
    return s ? `/invoices?${s}` : "/invoices";
  };

  return (
    <>
      <PageHeader
        title="Invoices"
        description="Create, track and download your invoices."
        actions={<Link href="/invoices/new" className="btn-primary">+ New invoice</Link>}
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1 rounded-lg bg-slate-100 p-1">
          {TABS.map((t) => (
            <Link
              key={t.key}
              href={hrefFor(t.key)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                tab === t.key ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {t.label}
            </Link>
          ))}
        </div>
        <form className="w-full sm:w-64">
          {tab !== "all" && <input type="hidden" name="status" value={tab} />}
          <input className="input" name="q" defaultValue={q} placeholder="Search number or client…" />
        </form>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          title={q || tab !== "all" ? "No matching invoices" : "No invoices yet"}
          description={q || tab !== "all" ? "Try a different filter or search." : "Create your first invoice in under a minute."}
          action={!q && tab === "all" ? <Link href="/invoices/new" className="btn-primary">Create invoice</Link> : undefined}
        />
      ) : (
        <div className="card overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50/60">
              <tr>
                <th className="table-th">Number</th>
                <th className="table-th">Client</th>
                <th className="table-th">Issued</th>
                <th className="table-th">Due</th>
                <th className="table-th">Status</th>
                <th className="table-th text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="table-td">
                    <Link href={`/invoices/${r.id}`} className="whitespace-nowrap font-medium text-slate-900 hover:text-indigo-600">
                      {r.number}
                    </Link>
                  </td>
                  <td className="table-td">
                    {r.clientName}
                    {r.clientCompany && <div className="text-xs text-slate-500">{r.clientCompany}</div>}
                  </td>
                  <td className="table-td whitespace-nowrap">{formatDate(r.issueDate)}</td>
                  <td className="table-td whitespace-nowrap">{formatDate(r.dueDate)}</td>
                  <td className="table-td"><StatusBadge status={displayStatus(r.status, r.dueDate)} /></td>
                  <td className="table-td whitespace-nowrap text-right font-medium tabular-nums text-slate-900">
                    {formatMoney(r.total, r.currency)}
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
