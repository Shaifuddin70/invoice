import { Document, Font, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { BusinessProfile } from "@/db/schema";
import type { FullInvoice } from "@/lib/invoices";
import { formatMoneyPlain } from "@/lib/money";
import { formatAmount, invoiceSummary, paymentTerms, slashDate, splitDescription } from "@/lib/invoice-layout";

Font.registerHyphenationCallback((word) => [word]);

const TEXT = "#222222";
const GREY = "#666666";
const RULE = "#e3e3e3";
const SHADE = "#f2f2f2";

const s = StyleSheet.create({
  page: { paddingTop: 40, paddingBottom: 48, paddingHorizontal: 40, fontSize: 9, fontFamily: "Helvetica", color: TEXT },
  between: { flexDirection: "row", justifyContent: "space-between" },

  from: { maxWidth: 260 },
  logo: { maxWidth: 110, maxHeight: 54, objectFit: "contain", marginBottom: 10 },
  logoFallback: { width: 46, height: 46, borderRadius: 23, backgroundColor: "#111111", alignItems: "center", justifyContent: "center", marginBottom: 10 },
  logoInitial: { color: "#ffffff", fontSize: 22, fontFamily: "Helvetica-Bold" },
  bizName: { fontSize: 10, fontFamily: "Helvetica-Bold", marginBottom: 2 },
  muted: { color: GREY, marginBottom: 2.5 },

  head: { alignItems: "flex-end" },
  title: { fontSize: 28, letterSpacing: 0.5 },
  invNo: { fontSize: 9, fontFamily: "Helvetica-Bold", marginTop: 4 },
  balanceLabel: { fontSize: 8, marginTop: 18 },
  balanceValue: { fontSize: 12.5, fontFamily: "Helvetica-Bold", marginTop: 2 },

  billRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginTop: 26 },
  billTo: { maxWidth: 260 },
  label: { color: GREY, marginBottom: 4 },
  clientName: { fontSize: 9.5, fontFamily: "Helvetica-Bold", marginBottom: 2 },
  meta: { width: 230 },
  metaRow: { flexDirection: "row", marginBottom: 7 },
  metaLabel: { flex: 1, textAlign: "right", color: GREY, paddingRight: 14 },
  metaValue: { width: 95, textAlign: "right" },

  table: { marginTop: 26 },
  th: { flexDirection: "row", backgroundColor: "#111111", paddingVertical: 7 },
  thText: { color: "#ffffff", fontSize: 8.5 },
  tr: { flexDirection: "row", paddingVertical: 9, borderBottomWidth: 0.6, borderBottomColor: RULE },
  cNo: { width: 30, paddingLeft: 10 },
  cDesc: { flex: 1, paddingRight: 10 },
  cQty: { width: 60, textAlign: "right" },
  cRate: { width: 85, textAlign: "right" },
  cAmt: { width: 95, textAlign: "right", paddingRight: 10 },
  itemTitle: { fontSize: 9 },
  itemDetail: { color: GREY, fontSize: 8.5, marginTop: 3 },

  totals: { alignSelf: "flex-end", width: 270, marginTop: 6 },
  totalRow: { flexDirection: "row", paddingVertical: 7, paddingHorizontal: 10 },
  totalLabel: { flex: 1, textAlign: "right", paddingRight: 14 },
  totalValue: { width: 95, textAlign: "right" },
  bold: { fontFamily: "Helvetica-Bold" },

  footerRow: { flexDirection: "row", marginTop: 34, alignItems: "flex-start" },
  footCol: { width: 180, paddingRight: 16 },
  footTitle: { fontSize: 9, marginBottom: 5 },
  terms: { marginTop: 22 },

  signature: { width: 160, marginLeft: "auto", alignItems: "flex-end" },
  sigImage: { height: 40, maxWidth: 150, objectFit: "contain", objectPosition: "right", marginBottom: 4 },
  sigBlank: { width: 150, height: 40, borderBottomWidth: 0.6, borderBottomColor: "#999999", marginBottom: 5 },
  sigName: { fontFamily: "Helvetica-Bold" },
});

function Lines({ text, prefix = "" }: { text: string; prefix?: string }) {
  return (
    <>
      {`${prefix}${text}`
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line, i) => (
          <Text key={i} style={s.muted}>
            {line}
          </Text>
        ))}
    </>
  );
}

export function InvoicePdf({
  invoice,
  profile,
  signatoryName,
}: {
  invoice: FullInvoice;
  profile: BusinessProfile;
  signatoryName: string;
}) {
  const money = (n: number) => formatMoneyPlain(n, invoice.currency);
  const c = invoice.client;
  const { paid, balanceDue } = invoiceSummary(invoice);
  const name = profile.businessName || signatoryName;

  const meta = [
    ["Invoice Date :", slashDate(invoice.issueDate)],
    ["Terms :", paymentTerms(invoice.issueDate, invoice.dueDate)],
    ["Due Date :", slashDate(invoice.dueDate)],
    invoice.status === "cancelled" && ["Status :", "Cancelled"],
  ].filter(Boolean) as [string, string][];

  return (
    <Document title={`Invoice ${invoice.number}`} author={name} creator={name}>
      <Page size="A4" style={s.page}>
        <View style={s.between}>
          <View style={s.from}>
            {profile.logoDataUrl ? (
              // eslint-disable-next-line jsx-a11y/alt-text
              <Image src={profile.logoDataUrl} style={s.logo} />
            ) : (
              <View style={s.logoFallback}>
                <Text style={s.logoInitial}>{name.trim().charAt(0).toUpperCase()}</Text>
              </View>
            )}
            <Text style={s.bizName}>{name}</Text>
            {profile.tagline && <Lines text={profile.tagline} />}
            {profile.address && <Lines text={profile.address} />}
            {profile.phone && <Lines text={profile.phone} />}
            {profile.email && <Lines text={profile.email} />}
            {profile.website && <Lines text={profile.website} />}
            {profile.taxId && <Lines text={profile.taxId} prefix="Tax ID: " />}
          </View>
          <View style={s.head}>
            <Text style={s.title}>INVOICE</Text>
            <Text style={s.invNo}>Invoice# {invoice.number}</Text>
            <Text style={s.balanceLabel}>Balance Due</Text>
            <Text style={s.balanceValue}>{money(balanceDue)}</Text>
          </View>
        </View>

        <View style={s.billRow}>
          <View style={s.billTo}>
            <Text style={s.label}>Bill To</Text>
            <Text style={s.clientName}>{c.name}</Text>
            {c.company && <Lines text={c.company} />}
            {c.address && <Lines text={c.address} />}
            {c.phone && <Lines text={c.phone} />}
            {c.email && <Lines text={c.email} />}
            {c.taxId && <Lines text={c.taxId} prefix="Tax ID: " />}
          </View>
          <View style={s.meta}>
            {meta.map(([label, value]) => (
              <View key={label} style={s.metaRow}>
                <Text style={s.metaLabel}>{label}</Text>
                <Text style={s.metaValue}>{value}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={s.table}>
          <View style={s.th} fixed>
            <Text style={[s.thText, s.cNo]}>#</Text>
            <Text style={[s.thText, s.cDesc]}>Item & Description</Text>
            <Text style={[s.thText, s.cQty]}>Qty</Text>
            <Text style={[s.thText, s.cRate]}>Rate</Text>
            <Text style={[s.thText, s.cAmt]}>Amount</Text>
          </View>
          {invoice.items.map((item, idx) => {
            const { title, detail } = splitDescription(item.description);
            return (
              <View key={item.id} style={s.tr} wrap={false}>
                <Text style={s.cNo}>{idx + 1}</Text>
                <View style={s.cDesc}>
                  <Text style={s.itemTitle}>{title}</Text>
                  {detail && <Text style={s.itemDetail}>{detail}</Text>}
                </View>
                <Text style={s.cQty}>{formatAmount(item.quantity)}</Text>
                <Text style={s.cRate}>{formatAmount(item.unitPrice)}</Text>
                <Text style={s.cAmt}>{formatAmount(item.amount)}</Text>
              </View>
            );
          })}
        </View>

        <View style={s.totals} wrap={false}>
          <View style={s.totalRow}>
            <Text style={s.totalLabel}>Sub Total</Text>
            <Text style={s.totalValue}>{formatAmount(invoice.subtotal)}</Text>
          </View>
          {invoice.discountAmount > 0 && (
            <View style={s.totalRow}>
              <Text style={s.totalLabel}>
                Discount{invoice.discountType === "percent" ? ` (${invoice.discountValue}%)` : ""}
              </Text>
              <Text style={s.totalValue}>(-) {formatAmount(invoice.discountAmount)}</Text>
            </View>
          )}
          {invoice.taxRate > 0 && (
            <View style={s.totalRow}>
              <Text style={s.totalLabel}>Tax ({invoice.taxRate}%)</Text>
              <Text style={s.totalValue}>{formatAmount(invoice.taxAmount)}</Text>
            </View>
          )}
          <View style={s.totalRow}>
            <Text style={[s.totalLabel, s.bold]}>Total</Text>
            <Text style={[s.totalValue, s.bold]}>{money(invoice.total)}</Text>
          </View>
          {paid > 0 && (
            <View style={s.totalRow}>
              <Text style={s.totalLabel}>Payment Made</Text>
              <Text style={[s.totalValue, { color: "#c0392b" }]}>(-) {formatAmount(paid)}</Text>
            </View>
          )}
          <View style={[s.totalRow, { backgroundColor: SHADE }]}>
            <Text style={[s.totalLabel, s.bold]}>Balance Due</Text>
            <Text style={[s.totalValue, s.bold]}>{money(balanceDue)}</Text>
          </View>
        </View>

        {(invoice.notes || profile.paymentDetails || profile.showSignature) && (
          <View style={s.footerRow} wrap={false}>
            {invoice.notes && (
              <View style={s.footCol}>
                <Text style={s.footTitle}>Notes</Text>
                <Lines text={invoice.notes} />
              </View>
            )}
            {profile.paymentDetails && (
              <View style={s.footCol}>
                <Text style={s.footTitle}>Payment Options</Text>
                <Lines text={profile.paymentDetails} />
              </View>
            )}
            {profile.showSignature && (
              <View style={s.signature}>
                {profile.signatureDataUrl ? (
                  // eslint-disable-next-line jsx-a11y/alt-text
                  <Image src={profile.signatureDataUrl} style={s.sigImage} />
                ) : (
                  <View style={s.sigBlank} />
                )}
                <Text style={s.sigName}>{signatoryName}</Text>
                <Text style={s.muted}>Authorized Signature</Text>
              </View>
            )}
          </View>
        )}

        {invoice.terms && (
          <View style={s.terms} wrap={false}>
            <Text style={s.footTitle}>Terms & Conditions</Text>
            <Lines text={invoice.terms} />
          </View>
        )}
      </Page>
    </Document>
  );
}
