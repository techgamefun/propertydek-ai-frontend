"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import WorkspaceShell from "../components/WorkspaceShell";
import { getInvoices, type Invoice, type InvoiceStatus } from "../lib/invoices";

const filters: Array<{ value: InvoiceStatus | "ALL"; label: string }> = [
  { value: "ALL", label: "All" },
  { value: "DRAFT", label: "Draft" },
  { value: "OPEN", label: "Open" },
  { value: "PARTIALLY_PAID", label: "Partial" },
  { value: "OVERDUE", label: "Overdue" },
  { value: "PAID", label: "Paid" },
  { value: "VOID", label: "Void" },
];

export default function InvoicesPage() {
  const [status, setStatus] = useState<InvoiceStatus | "ALL">("ALL");
  const invoicesQuery = useQuery({
    queryKey: ["invoices", status],
    queryFn: () => getInvoices(status),
  });

  if (invoicesQuery.isLoading) {
    return (
      <WorkspaceShell>
        <main className="flex min-h-screen items-center justify-center text-sm text-[#68756f]">
          Loading invoices...
        </main>
      </WorkspaceShell>
    );
  }
  if (invoicesQuery.isError || !invoicesQuery.data) {
    return (
      <WorkspaceShell>
        <main className="flex min-h-screen items-center justify-center px-6 text-[#17231f]">
          <section className="max-w-lg rounded-3xl border border-[#e1e7e1] bg-white p-8">
            <h1 className="text-2xl font-semibold">Invoices could not be loaded</h1>
            <p className="mt-3 text-sm leading-6 text-[#68756f]" role="alert">
              {invoicesQuery.error instanceof Error
                ? invoicesQuery.error.message
                : "Please try again."}
            </p>
          </section>
        </main>
      </WorkspaceShell>
    );
  }

  const invoices = invoicesQuery.data.invoices;
  const outstanding = invoices.reduce((balances, invoice) => {
    if (!["PAID", "VOID", "DRAFT"].includes(invoice.status)) {
      balances.set(
        invoice.currency,
        (balances.get(invoice.currency) ?? 0) + Number(invoice.balanceDue),
      );
    }
    return balances;
  }, new Map<string, number>());
  const outstandingSummary = [...outstanding.entries()]
    .map(([currency, amount]) => formatCurrency(amount, currency))
    .join(" · ") || formatCurrency(0, "USD");

  return (
    <WorkspaceShell>
      <main className="min-h-screen px-5 py-8 text-[#17231f] sm:px-8 sm:py-12">
        <div className="mx-auto max-w-6xl">
          <header className="flex flex-col gap-5 border-b border-[#e2e8e2] pb-7 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.17em] text-[#65806e]">
                Finance
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">Invoices</h1>
              <p className="mt-2 text-sm text-[#738078]">
                Issue rent invoices, track balances, and record payments.
              </p>
            </div>
            <Link
              className="inline-flex h-11 items-center justify-center rounded-full bg-[#1d5745] px-5 text-sm font-semibold text-white transition hover:bg-[#174737]"
              href="/invoices/new"
            >
              Create invoice
            </Link>
          </header>

          <section aria-label="Invoice summary" className="mt-6 grid gap-3 sm:grid-cols-3">
            <Summary label="Invoices shown" value={invoices.length.toString()} />
            <Summary
              label="Outstanding shown"
              value={outstandingSummary}
            />
            <Summary
              label="Overdue"
              value={invoices
                .filter((invoice) => invoice.status === "OVERDUE").length.toString()}
            />
          </section>

          <div className="mt-6 flex flex-wrap gap-2" aria-label="Filter invoices">
            {filters.map((filter) => (
              <button
                aria-pressed={status === filter.value}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  status === filter.value
                    ? "bg-[#1d5745] text-white"
                    : "border border-[#dce3de] bg-white text-[#52645a] hover:bg-[#f4f7f3]"
                }`}
                key={filter.value}
                onClick={() => setStatus(filter.value)}
                type="button"
              >
                {filter.label}
              </button>
            ))}
          </div>

          {invoices.length ? (
            <ul className="mt-4 space-y-3">
              {invoices.map((invoice) => (
                <li key={invoice.id}>
                  <InvoiceCard invoice={invoice} />
                </li>
              ))}
            </ul>
          ) : (
            <section className="mt-4 rounded-2xl border border-dashed border-[#cad8ce] bg-white p-8 text-center">
              <h2 className="text-lg font-semibold">No invoices to show</h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#738078]">
                Create a draft invoice for an active lease, then issue it when it’s ready.
              </p>
              <Link
                className="mt-5 inline-flex h-11 items-center justify-center rounded-full bg-[#1d5745] px-5 text-sm font-semibold text-white"
                href="/invoices/new"
              >
                Create your first invoice
              </Link>
            </section>
          )}
        </div>
      </main>
    </WorkspaceShell>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#e2e8e2] bg-white p-5">
      <p className="text-sm text-[#738078]">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-[#25342e]">{value}</p>
    </div>
  );
}

function InvoiceCard({ invoice }: { invoice: Invoice }) {
  return (
    <Link
      className="block rounded-2xl border border-[#e2e8e2] bg-white p-5 transition hover:border-[#b8c9bc] hover:shadow-sm sm:flex sm:items-center sm:justify-between sm:gap-6"
      href={`/invoices/${encodeURIComponent(invoice.id)}`}
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="font-semibold text-[#25342e]">{invoice.invoiceNumber}</h2>
          <StatusBadge status={invoice.status} />
        </div>
        <p className="mt-1 truncate text-sm text-[#738078]">
          {invoice.lease.tenant.fullName} · {invoice.lease.unit.property.name} · Unit{" "}
          {invoice.lease.unit.unitNumber}
        </p>
        <p className="mt-1 text-xs text-[#738078]">Due {formatDate(invoice.dueAt)}</p>
      </div>
      <div className="mt-4 flex gap-6 text-left sm:mt-0 sm:text-right">
        <div>
          <p className="text-xs text-[#738078]">Invoice total</p>
          <p className="mt-1 font-semibold text-[#25342e]">
            {formatCurrency(invoice.total, invoice.currency)}
          </p>
        </div>
        <div>
          <p className="text-xs text-[#738078]">Balance</p>
          <p className="mt-1 font-semibold text-[#1d5745]">
            {formatCurrency(invoice.balanceDue, invoice.currency)}
          </p>
        </div>
      </div>
    </Link>
  );
}

function StatusBadge({ status }: { status: InvoiceStatus }) {
  const color =
    status === "PAID"
      ? "bg-[#e9f4eb] text-[#326440]"
      : status === "OVERDUE"
        ? "bg-[#fff0ee] text-[#a12a21]"
        : status === "PARTIALLY_PAID"
          ? "bg-[#fff4dc] text-[#87610d]"
          : status === "OPEN"
            ? "bg-[#eaf2f8] text-[#315d7a]"
            : "bg-[#f0f2f0] text-[#68756f]";
  return (
    <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${color}`}>
      {status.toLowerCase().replace("_", " ")}
    </span>
  );
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
