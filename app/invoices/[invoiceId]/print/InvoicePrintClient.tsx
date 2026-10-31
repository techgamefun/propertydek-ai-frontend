"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getInvoice } from "../../../lib/invoices";

export default function InvoicePrintClient() {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const invoiceQuery = useQuery({
    queryKey: ["invoice", invoiceId],
    queryFn: () => getInvoice(invoiceId),
    enabled: Boolean(invoiceId),
  });

  if (invoiceQuery.isLoading) {
    return <main className="p-8 text-sm text-[#68756f]">Preparing invoice...</main>;
  }
  if (invoiceQuery.isError || !invoiceQuery.data) {
    return (
      <main className="mx-auto max-w-3xl p-8 text-[#17231f]">
        <h1 className="text-2xl font-semibold">Invoice unavailable</h1>
        <p className="mt-3 text-sm text-[#68756f]" role="alert">
          {invoiceQuery.error instanceof Error
            ? invoiceQuery.error.message
            : "Please try again."}
        </p>
      </main>
    );
  }

  const invoice = invoiceQuery.data.invoice;
  return (
    <main className="min-h-screen bg-white px-6 py-10 text-[#17231f] print:px-0 print:py-0">
      <article className="mx-auto max-w-3xl">
        <div className="mb-8 flex items-center justify-between print:hidden">
          <p className="text-sm text-[#68756f]">Invoice preview</p>
          <button
            className="rounded-full bg-[#1d5745] px-5 py-2.5 text-sm font-semibold text-white"
            onClick={() => window.print()}
            type="button"
          >
            Print / save as PDF
          </button>
        </div>
        <header className="flex items-start justify-between gap-6 border-b-2 border-[#1d5745] pb-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.17em] text-[#65806e]">
              {invoice.lease.unit.property.name}
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">Invoice</h1>
            <p className="mt-2 text-sm text-[#68756f]">{invoice.invoiceNumber}</p>
          </div>
          <div className="text-right text-sm">
            <p className="font-semibold">{titleCase(invoice.status)}</p>
            <p className="mt-1 text-[#68756f]">
              {invoice.issuedAt ? `Issued ${formatDate(invoice.issuedAt)}` : "Draft · Not issued"}
            </p>
            <p className="text-[#68756f]">Due {formatDate(invoice.dueAt)}</p>
          </div>
        </header>

        <section className="grid gap-8 border-b border-[#e2e8e2] py-7 sm:grid-cols-2">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wide text-[#52735c]">
              Bill to
            </h2>
            <p className="mt-2 font-semibold">{invoice.lease.tenant.fullName}</p>
            {invoice.lease.tenant.email && (
              <p className="mt-1 text-sm text-[#68756f]">{invoice.lease.tenant.email}</p>
            )}
            <p className="mt-1 text-sm text-[#68756f]">
              {invoice.lease.unit.property.name} · Unit {invoice.lease.unit.unitNumber}
            </p>
          </div>
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wide text-[#52735c]">
              Billing period
            </h2>
            <p className="mt-2 text-sm">
              {invoice.periodStart
                ? `${formatDate(invoice.periodStart)} – ${invoice.periodEnd ? formatDate(invoice.periodEnd) : "Not specified"}`
                : "Not specified"}
            </p>
            {invoice.description && (
              <p className="mt-2 text-sm text-[#68756f]">{invoice.description}</p>
            )}
          </div>
        </section>

        <section className="py-7">
          <div className="grid grid-cols-[1fr_auto] gap-x-6 gap-y-3 border-b border-[#e2e8e2] pb-4 text-sm">
            <span className="font-semibold">Description</span>
            <span className="text-right font-semibold">Amount</span>
            <span>{invoice.description || "Charges"}</span>
            <span className="text-right">{formatCurrency(invoice.subtotal, invoice.currency)}</span>
          </div>
          <div className="ml-auto mt-5 max-w-xs space-y-3 text-sm">
            <AmountRow label="Subtotal" amount={invoice.subtotal} currency={invoice.currency} />
            <AmountRow label="Tax" amount={invoice.tax} currency={invoice.currency} />
            <AmountRow label="Total" amount={invoice.total} currency={invoice.currency} strong />
            <AmountRow label="Paid" amount={invoice.amountPaid} currency={invoice.currency} />
            <AmountRow label="Balance due" amount={invoice.balanceDue} currency={invoice.currency} strong />
          </div>
        </section>

        <footer className="border-t border-[#e2e8e2] pt-5 text-xs text-[#738078]">
          Payment method: contact the property manager. This invoice was generated from the
          PropertyDek lease record.
        </footer>
      </article>
    </main>
  );
}

function AmountRow({
  label,
  amount,
  currency,
  strong = false,
}: {
  label: string;
  amount: string | number;
  currency: string;
  strong?: boolean;
}) {
  return (
    <div className={`flex justify-between gap-4 ${strong ? "font-semibold text-[#25342e]" : "text-[#68756f]"}`}>
      <span>{label}</span>
      <span>{formatCurrency(amount, currency)}</span>
    </div>
  );
}

function titleCase(value: string) {
  return value.charAt(0) + value.slice(1).toLowerCase().replace("_", " ");
}

function formatCurrency(value: string | number, currency: string) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(Number(value));
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(new Date(value));
}
