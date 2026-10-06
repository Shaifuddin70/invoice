import { renderToBuffer } from "@react-pdf/renderer";
import { getProfile, requireUser } from "@/lib/dal";
import { getInvoice } from "@/lib/invoices";
import { InvoicePdf } from "@/lib/pdf/invoice-pdf";

export async function GET(req: Request, ctx: RouteContext<"/api/invoices/[id]/pdf">) {
  const { id } = await ctx.params;
  const user = await requireUser();
  const [invoice, profile] = await Promise.all([getInvoice(user.id, id), getProfile(user.id)]);
  if (!invoice) return new Response("Not found", { status: 404 });

  const buffer = await renderToBuffer(InvoicePdf({ invoice, profile, signatoryName: user.name }));
  const filename = `${invoice.number.replace(/[^\w.-]+/g, "_")}.pdf`;
  const inline = new URL(req.url).searchParams.get("inline") === "1";

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${inline ? "inline" : "attachment"}; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
