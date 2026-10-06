import type { Metadata } from "next";
import Link from "next/link";
import { and, desc, eq, gte, sql } from "drizzle-orm";
import { db } from "@/db";
import { clients, invoices } from "@/db/schema";
import { getProfile, requireUser } from "@/lib/dal";
import { formatMoney } from "@/lib/money";
import { displayStatus, formatDate, today } from "@/lib/status";
import { EmptyState, PageHeader, StatusBadge } from "@/components/ui";

export const metadata: Metadata = { title: "Dashboard" };

type Bucket = Record<string, number>;

function addTo(bucket: Bucket, currency: string, amount: number) {
  bucket[currency] = (bucket[currency] ?? 0) + amount;
}

function Amounts({ bucket, fallbackCurrency }: { bucket: Bucket; fallbackCurrency: string }) {
  const entries = Object.entries(bucket).sort((a, b) => b[1] - a[1]);
  if (!entries.length) return <p className="text-2xl font-semibold tabular-nums text-slate-900">{formatMoney(0, fallbackCurrency)}</p>;
  return (
    <div>
      <p className="text-2xl font-semibold tabular-nums text-slate-900">{formatMoney(entries[0][1], entries[0][0])}</p>
      {entries.slice(1).map(([cur, amt]) => (
        <p key={cur} className="text-sm tabular-nums text-slate-500">+ {formatMoney(amt, cur)}</p>
      ))}
    </div>
  );
}

function StatCard({ label, hint, accent, children }: { label: string; hint: string; accent: string; children: React.ReactNode }) {
  return (
    <div className="card p-5">
      <div className="flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${accent}`} />
        <p className="text-sm font-medium text-slate-500">{label}</p>
      </div>
      <div className="mt-3">{children}</div>
      <p className="mt-2 text-xs text-slate-400">{hint}</p>
    </div>
  );
}

export default async function DashboardPage() {
  const user = await requireUser();
  const profile = await getProfile(user.id);
  const now = today();
  const monthStart = `${now.slice(0, 7)}-01`;
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setUTCDate(1);
  sixMonthsAgo.setUTCMonth(sixMonthsAgo.getUTCMonth() - 5);
  sixMonthsAgo.setUTCHours(0, 0, 0, 0);

  const [summary, monthly, recent] = await Promise.all([
    db
      .select({
        status: invoices.status,
        currency: invoices.currency,
        overdue: sql<boolean>`${invoices.dueDate} < ${now}`,
        paidThisMonth: sql<boolean>`coalesce(${invoices.paidAt} >= ${monthStart}::date, false)`,
        count: sql<number>`count(*)::int`,
        total: sql<number>`coalesce(sum(${invoices.total}), 0)::float8`,
      })
      .from(invoices)
      .where(eq(invoices.userId, user.id))
      .groupBy(invoices.status, invoices.currency, sql`3`, sql`4`),
    db
      .select({
        month: sql<string>`to_char(date_trunc('month', ${invoices.paidAt}), 'YYYY-MM')`,
        currency: invoices.currency,
        total: sql<number>`sum(${invoices.total})::float8`,
      })
      .from(invoices)
      .where(and(eq(invoices.userId, user.id), eq(invoices.status, "paid"), gte(invoices.paidAt, sixMonthsAgo)))
      .groupBy(sql`1`, invoices.currency),
    db
      .select({
        id: invoices.id,
        number: invoices.number,
        status: invoices.status,
        dueDate: invoices.dueDate,
        issueDate: invoices.issueDate,
        total: invoices.total,
        currency: invoices.currency,
        clientName: clients.name,
      })
      .from(invoices)
      .innerJoin(clients, eq(clients.id, invoices.clientId))
      .where(eq(invoices.userId, user.id))
      .orderBy(desc(invoices.createdAt))
      .limit(6),
  ]);

  const outstanding: Bucket = {};
  const overdue: Bucket = {};
  const paidMonth: Bucket = {};
  const paidAll: Bucket = {};
  let overdueCount = 0;
  let draftCount = 0;
  let outstandingCount = 0;
  for (const r of summary) {
    if (r.status === "sent") {
      addTo(outstanding, r.currency, r.total);
      outstandingCount += r.count;
      if (r.overdue) {
        addTo(overdue, r.currency, r.total);
        overdueCount += r.count;
      }
    } else if (r.status === "paid") {
      addTo(paidAll, r.currency, r.total);
      if (r.paidThisMonth) addTo(paidMonth, r.currency, r.total);
    } else if (r.status === "draft") {
      draftCount += r.count;
    }
  }

  const chartCurrency =
    Object.entries(
      monthly.reduce<Bucket>((acc, m) => ((acc[m.currency] = (acc[m.currency] ?? 0) + m.total), acc), {}),
    ).sort((a, b) => b[1] - a[1])[0]?.[0] ?? profile.defaultCurrency;
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(sixMonthsAgo);
    d.setUTCMonth(d.getUTCMonth() + i);
    const key = d.toISOString().slice(0, 7);
    const total = monthly.find((m) => m.month === key && m.currency === chartCurrency)?.total ?? 0;
    return { key, label: d.toLocaleDateString("en-US", { month: "short", timeZone: "UTC" }), total };
  });
  const maxMonth = Math.max(...months.map((m) => m.total), 1);
  const hasInvoices = summary.length > 0;

  return (
    <>
      <PageHeader
        title={`Hello, ${user.name.split(" ")[0]}`}
        description="Here's how your business is doing."
        actions={<Link href="/invoices/new" className="btn-primary">+ New invoice</Link>}
      />

      {!profile.businessName && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
          <p className="text-sm text-amber-800">Add your business name, logo and payment details so they appear on invoices.</p>
          <Link href="/settings" className="btn-secondary">Complete profile</Link>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Outstanding" hint={`${outstandingCount} unpaid invoice${outstandingCount === 1 ? "" : "s"}`} accent="bg-blue-500">
          <Amounts bucket={outstanding} fallbackCurrency={profile.defaultCurrency} />
        </StatCard>
        <StatCard label="Overdue" hint={`${overdueCount} past due date`} accent="bg-red-500">
          <Amounts bucket={overdue} fallbackCurrency={profile.defaultCurrency} />
        </StatCard>
        <StatCard label="Paid this month" hint="Based on payment date" accent="bg-emerald-500">
          <Amounts bucket={paidMonth} fallbackCurrency={profile.defaultCurrency} />
        </StatCard>
        <StatCard label="Total collected" hint={`${draftCount} draft${draftCount === 1 ? "" : "s"} not yet sent`} accent="bg-indigo-500">
          <Amounts bucket={paidAll} fallbackCurrency={profile.defaultCurrency} />
        </StatCard>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <div className="card p-6 lg:col-span-3">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-semibold text-slate-900">Revenue collected</h2>
            <span className="text-xs text-slate-400">Last 6 months · {chartCurrency}</span>
          </div>
          <div className="mt-6 flex h-48 items-end gap-3">
            {months.map((m) => (
              <div key={m.key} className="group flex flex-1 flex-col items-center gap-2">
                <div className="relative flex w-full flex-1 items-end">
                  <div
                    className="w-full rounded-t-md bg-indigo-500/80 transition-colors group-hover:bg-indigo-600"
                    style={{ height: `${Math.max((m.total / maxMonth) * 100, m.total > 0 ? 4 : 1)}%` }}
                    title={formatMoney(m.total, chartCurrency)}
                  />
                </div>
                <span className="text-xs text-slate-500">{m.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <h2 className="text-sm font-semibold text-slate-900">Recent invoices</h2>
            <Link href="/invoices" className="text-xs font-medium text-indigo-600 hover:text-indigo-500">View all</Link>
          </div>
          {recent.length === 0 ? (
            <p className="px-6 py-10 text-center text-sm text-slate-500">No invoices yet.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {recent.map((r) => (
                <li key={r.id}>
                  <Link href={`/invoices/${r.id}`} className="flex items-center justify-between gap-3 px-6 py-3 hover:bg-slate-50">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900">{r.clientName}</p>
                      <p className="text-xs text-slate-500">{r.number} · {formatDate(r.issueDate)}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-sm font-medium tabular-nums text-slate-900">{formatMoney(r.total, r.currency)}</span>
                      <StatusBadge status={displayStatus(r.status, r.dueDate)} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {!hasInvoices && (
        <div className="mt-6">
          <EmptyState
            title="Let's get you set up"
            description="1. Fill in your business settings  2. Add your services  3. Add a client  4. Create your first invoice"
            action={
              <div className="flex flex-wrap justify-center gap-2">
                <Link href="/settings" className="btn-secondary">Business settings</Link>
                <Link href="/services/new" className="btn-secondary">Add service</Link>
                <Link href="/clients/new" className="btn-primary">Add client</Link>
              </div>
            }
          />
        </div>
      )}
    </>
  );
}
