export const CURRENCIES = [
  { code: "USD", name: "US Dollar" },
  { code: "BDT", name: "Bangladeshi Taka" },
  { code: "EUR", name: "Euro" },
  { code: "GBP", name: "British Pound" },
  { code: "INR", name: "Indian Rupee" },
  { code: "AUD", name: "Australian Dollar" },
  { code: "CAD", name: "Canadian Dollar" },
  { code: "SGD", name: "Singapore Dollar" },
  { code: "AED", name: "UAE Dirham" },
  { code: "SAR", name: "Saudi Riyal" },
  { code: "MYR", name: "Malaysian Ringgit" },
  { code: "JPY", name: "Japanese Yen" },
  { code: "CNY", name: "Chinese Yuan" },
] as const;

export const CURRENCY_CODES = CURRENCIES.map((c) => c.code) as unknown as [string, ...string[]];

export function round2(n: number) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function formatMoney(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

// The PDF's built-in Helvetica (WinAnsi) can only draw these symbols; ৳, ₹ etc. fall back to the code.
const PDF_SYMBOLS: Record<string, string> = { USD: "$", EUR: "€", GBP: "£", JPY: "¥" };

export function formatMoneyPlain(amount: number, currency: string) {
  const n = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Math.abs(amount));
  const sign = amount < 0 ? "-" : "";
  const symbol = PDF_SYMBOLS[currency];
  return symbol ? `${sign}${symbol}${n}` : `${sign}${currency} ${n}`;
}

export type LineInput = { quantity: number; unitPrice: number };

export function calcTotals(
  items: LineInput[],
  opts: { taxRate: number; discountType: "percent" | "fixed"; discountValue: number },
) {
  const subtotal = round2(items.reduce((sum, i) => sum + round2(i.quantity * i.unitPrice), 0));
  const rawDiscount =
    opts.discountType === "percent" ? (subtotal * opts.discountValue) / 100 : opts.discountValue;
  const discountAmount = round2(Math.min(Math.max(rawDiscount, 0), subtotal));
  const taxable = subtotal - discountAmount;
  const taxAmount = round2((taxable * Math.max(opts.taxRate, 0)) / 100);
  const total = round2(taxable + taxAmount);
  return { subtotal, discountAmount, taxAmount, total };
}
