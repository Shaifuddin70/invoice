import { Document, Font, Image, Page, Path, StyleSheet, Svg, Text, View } from "@react-pdf/renderer";
import type { BusinessProfile } from "@/db/schema";
import type { FullInvoice } from "@/lib/invoices";
import { formatMoneyPlain } from "@/lib/money";

Font.registerHyphenationCallback((word) => [word]);

const BLUE = "#3a6fc4";
const LIGHT_BLUE = "#c5dff3";
const ACCENT = "#4aa3df";
const LINE = "#b5b5b5";
const TEXT = "#1f1f1f";
const GREY = "#555555";

const s = StyleSheet.create({
  page: { paddingTop: 40, paddingBottom: 100, paddingHorizontal: 50, fontSize: 9.5, fontFamily: "Helvetica", color: TEXT },
  row: { flexDirection: "row" },
  between: { flexDirection: "row", justifyContent: "space-between" },

  brand: { flexDirection: "row", alignItems: "center", maxWidth: 300 },
  logo: { maxWidth: 46, maxHeight: 46, objectFit: "contain", marginRight: 8 },
  bizName: { fontSize: 15, fontFamily: "Helvetica-Bold", textTransform: "uppercase", letterSpacing: 0.3 },
  tagline: { fontSize: 8.5, textTransform: "uppercase", letterSpacing: 0.4, marginTop: 2 },
  title: { fontSize: 30, fontFamily: "Helvetica-Bold", color: BLUE, letterSpacing: 2.5 },

  dividerRow: { flexDirection: "row", alignItems: "center", marginTop: 12 },
  dividerTrack: { flex: 1, height: 3, justifyContent: "center" },
  dividerLine: { height: 0.8, backgroundColor: LINE },
  dividerAccent: { position: "absolute", top: 0, width: 46, height: 3, backgroundColor: ACCENT },
  website: { marginLeft: 10, fontSize: 8.5, textTransform: "uppercase", letterSpacing: 0.4 },

  billBlock: { flexDirection: "row", justifyContent: "space-between", marginTop: 36 },
  smallLabel: { fontSize: 9.5, marginBottom: 4 },
  clientName: { fontSize: 14, fontFamily: "Helvetica-Bold", marginBottom: 8 },
  clientLine: { fontSize: 9, color: GREY, marginBottom: 5 },
  invNo: { fontSize: 10.5, fontFamily: "Helvetica-Bold", textAlign: "right", marginBottom: 6 },
  invDate: { fontSize: 10, textAlign: "right", marginBottom: 4 },
  invMeta: { fontSize: 9, color: GREY, textAlign: "right", marginBottom: 3 },

  table: { marginTop: 30 },
  th: { flexDirection: "row", backgroundColor: BLUE, paddingVertical: 4 },
  thText: { color: "#ffffff", fontFamily: "Helvetica-Bold", fontSize: 9, textTransform: "uppercase", textAlign: "center" },
  tr: { flexDirection: "row", gap: 2 },
  cell: { paddingVertical: 4, paddingHorizontal: 6, fontSize: 9 },
  cNo: { width: 34, textAlign: "center" },
  cDesc: { flex: 1 },
  cQty: { width: 74, textAlign: "center" },
  cPrice: { width: 96, textAlign: "right" },
  cTotal: { width: 96, textAlign: "right" },

  sums: { marginTop: 10, alignSelf: "flex-end", width: 260 },
  sumRow: { flexDirection: "row", justifyContent: "flex-end", marginBottom: 8 },
  sumLabel: { flex: 1, textAlign: "right", fontSize: 10 },
  sumValue: { width: 100, textAlign: "right", fontSize: 10 },

  barRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginTop: 6 },
  payBar: { width: 160, backgroundColor: BLUE, paddingVertical: 4, paddingHorizontal: 6 },
  totalBar: { width: 260, backgroundColor: BLUE, paddingVertical: 4, paddingHorizontal: 8, flexDirection: "row", justifyContent: "space-between" },
  barText: { color: "#ffffff", fontFamily: "Helvetica-Bold", fontSize: 10, textTransform: "uppercase" },
  payDetails: { marginTop: 12, fontSize: 10, lineHeight: 1.6, maxWidth: 260 },

  shortLine: { width: 215, height: 0.8, backgroundColor: LINE, marginTop: 18 },
  thanks: { marginTop: 14, fontSize: 10, fontFamily: "Helvetica-Bold", maxWidth: 300 },

  bottom: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginTop: 26 },
  termsTitle: { fontSize: 10, fontFamily: "Helvetica-Bold", marginBottom: 6 },
  terms: { fontSize: 9, color: GREY, lineHeight: 1.5, maxWidth: 230 },
  signature: { alignItems: "flex-end", minWidth: 160 },
  sigImage: { height: 44, maxWidth: 160, objectFit: "contain", objectPosition: "right", marginBottom: 4 },
  sigBlank: { width: 160, height: 44, borderBottomWidth: 0.8, borderBottomColor: LINE, marginBottom: 6 },
  sigName: { fontSize: 12, fontFamily: "Helvetica-Bold", marginBottom: 4 },
  sigTitle: { fontSize: 10, fontFamily: "Helvetica-Bold" },

  footer: { position: "absolute", left: 50, right: 50, bottom: 34 },
  footerTrack: { height: 3, justifyContent: "center" },
  footerAccentRight: { position: "absolute", top: 0, right: 0, width: 46, height: 3, backgroundColor: ACCENT },
  contacts: { flexDirection: "row", justifyContent: "space-between", marginTop: 14, paddingHorizontal: 2 },
  contact: { flexDirection: "row", alignItems: "center", maxWidth: 180 },
  contactText: { fontSize: 9, color: GREY, marginLeft: 6 },
});

function Divider({ accentRight = false }: { accentRight?: boolean }) {
  return (
    <View style={s.dividerTrack}>
      <View style={s.dividerLine} />
      <View style={[s.dividerAccent, { left: 0 }]} />
      {accentRight && <View style={s.footerAccentRight} />}
    </View>
  );
}

const ICONS = {
  phone:
    "M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z",
  mail: "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zM22 6l-10 7L2 6",
  pin: "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0zM12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
};

function Icon({ d }: { d: string }) {
  return (
    <Svg width={15} height={15} viewBox="0 0 24 24">
      <Path d={d} stroke={ACCENT} strokeWidth={1.6} fill="none" />
    </Svg>
  );
}

function longDate(iso: string) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
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
  const fmt = (n: number) => formatMoneyPlain(n, invoice.currency);
  const c = invoice.client;
  const oneLine = (v: string) => v.replace(/\s*\n\s*/g, ", ");
  const contacts = [
    profile.phone && { icon: ICONS.phone, text: profile.phone },
    profile.email && { icon: ICONS.mail, text: profile.email },
    profile.address && { icon: ICONS.pin, text: oneLine(profile.address) },
  ].filter(Boolean) as { icon: string; text: string }[];

  return (
    <Document title={`Invoice ${invoice.number}`} author={profile.businessName} creator={profile.businessName || undefined}>
      <Page size="A4" style={s.page}>
        <View style={s.between}>
          <View style={s.brand}>
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            {profile.logoDataUrl && <Image src={profile.logoDataUrl} style={s.logo} />}
            <View>
              <Text style={s.bizName}>{profile.businessName}</Text>
              {profile.tagline && <Text style={s.tagline}>{profile.tagline}</Text>}
            </View>
          </View>
          <Text style={s.title}>INVOICE</Text>
        </View>

        <View style={s.dividerRow}>
          <Divider />
          {profile.website && <Text style={s.website}>{profile.website}</Text>}
        </View>

        <View style={s.billBlock}>
          <View style={{ maxWidth: 290 }}>
            <Text style={[s.smallLabel, { fontFamily: "Helvetica-Bold" }]}>Invoice to :</Text>
            <Text style={s.clientName}>{c.name}</Text>
            {c.company && <Text style={s.clientLine}>{c.company}</Text>}
            {c.phone && <Text style={s.clientLine}>{c.phone}</Text>}
            {c.email && <Text style={s.clientLine}>{c.email}</Text>}
            {c.address && <Text style={s.clientLine}>{oneLine(c.address)}</Text>}
            {c.taxId && <Text style={s.clientLine}>Tax ID: {c.taxId}</Text>}
          </View>
          <View>
            <Text style={s.invNo}>Invoice no : {invoice.number}</Text>
            <Text style={s.invDate}>{longDate(invoice.issueDate)}</Text>
            <Text style={s.invMeta}>Due : {longDate(invoice.dueDate)}</Text>
            {profile.taxId && <Text style={s.invMeta}>Tax ID : {profile.taxId}</Text>}
            {(invoice.status === "paid" || invoice.status === "cancelled") && (
              <Text style={[s.invMeta, { fontFamily: "Helvetica-Bold", color: invoice.status === "paid" ? "#1f8a4c" : "#b91c1c" }]}>
                {invoice.status.toUpperCase()}
              </Text>
            )}
          </View>
        </View>

        <View style={s.table}>
          <View style={s.th} fixed>
            <Text style={[s.thText, s.cNo]}>No</Text>
            <Text style={[s.thText, s.cDesc]}>Description</Text>
            <Text style={[s.thText, s.cQty]}>Qty</Text>
            <Text style={[s.thText, s.cPrice, { textAlign: "center" }]}>Price</Text>
            <Text style={[s.thText, s.cTotal, { textAlign: "center" }]}>Total</Text>
          </View>
          {invoice.items.map((item, idx) => {
            const shaded = idx % 2 === 1;
            const cellBg = { backgroundColor: shaded ? LIGHT_BLUE : "#ffffff" };
            return (
              <View key={item.id} style={[s.tr, { backgroundColor: shaded ? "#ffffff" : LIGHT_BLUE }]} wrap={false}>
                <Text style={[s.cell, s.cNo, cellBg]}>{idx + 1}</Text>
                <Text style={[s.cell, s.cDesc, cellBg]}>{item.description}</Text>
                <Text style={[s.cell, s.cQty, cellBg]}>{item.quantity}</Text>
                <Text style={[s.cell, s.cPrice, cellBg]}>{fmt(item.unitPrice)}</Text>
                <Text style={[s.cell, s.cTotal, cellBg]}>{fmt(item.amount)}</Text>
              </View>
            );
          })}
        </View>

        <View style={s.sums} wrap={false}>
          <View style={s.sumRow}>
            <Text style={s.sumLabel}>Sub Total :</Text>
            <Text style={s.sumValue}>{fmt(invoice.subtotal)}</Text>
          </View>
          {invoice.discountAmount > 0 && (
            <View style={s.sumRow}>
              <Text style={s.sumLabel}>
                Discount{invoice.discountType === "percent" ? ` ${invoice.discountValue}%` : ""} :
              </Text>
              <Text style={s.sumValue}>-{fmt(invoice.discountAmount)}</Text>
            </View>
          )}
          {invoice.taxRate > 0 && (
            <View style={s.sumRow}>
              <Text style={s.sumLabel}>Tax {invoice.taxRate}% :</Text>
              <Text style={s.sumValue}>{fmt(invoice.taxAmount)}</Text>
            </View>
          )}
        </View>

        <View wrap={false}>
          <View style={s.barRow}>
            {profile.paymentDetails ? (
              <View style={s.payBar}>
                <Text style={s.barText}>Payment method :</Text>
              </View>
            ) : (
              <View />
            )}
            <View style={s.totalBar}>
              <Text style={s.barText}>Grand total :</Text>
              <Text style={s.barText}>{fmt(invoice.total)}</Text>
            </View>
          </View>
          {profile.paymentDetails && <Text style={s.payDetails}>{profile.paymentDetails}</Text>}
        </View>

        {invoice.notes && (
          <View wrap={false}>
            <View style={s.shortLine} />
            <Text style={s.thanks}>{invoice.notes}</Text>
          </View>
        )}

        <View style={s.bottom} wrap={false}>
          <View>
            {invoice.terms && (
              <>
                <Text style={s.termsTitle}>Term and Conditions :</Text>
                <Text style={s.terms}>{invoice.terms}</Text>
              </>
            )}
          </View>
          <View style={s.signature}>
            {profile.signatureDataUrl ? (
              // eslint-disable-next-line jsx-a11y/alt-text
              <Image src={profile.signatureDataUrl} style={s.sigImage} />
            ) : (
              <View style={s.sigBlank} />
            )}
            <Text style={s.sigName}>{signatoryName}</Text>
            <Text style={s.sigTitle}>Authorized Signatory</Text>
          </View>
        </View>

        <View style={s.footer} fixed>
          <Divider accentRight />
          {contacts.length > 0 && (
            <View style={s.contacts}>
              {contacts.map((ct) => (
                <View key={ct.icon} style={s.contact}>
                  <Icon d={ct.icon} />
                  <Text style={s.contactText}>{ct.text}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </Page>
    </Document>
  );
}
