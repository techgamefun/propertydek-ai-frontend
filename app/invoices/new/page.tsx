"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import WorkspaceShell from "../../components/WorkspaceShell";
import { ApiRequestError } from "../../lib/onboarding";
import { createInvoice, getInvoiceOptions } from "../../lib/invoices";

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function monthStart(date: Date) {
  return isoDate(new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1)));
}

function monthEnd(date: Date) {
  return isoDate(new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)));
}

function defaultDueDate(today: Date) {
  const date = new Date(today);
  date.setUTCDate(date.getUTCDate() + 30);
  return isoDate(date);
}

export default function NewInvoicePage() {
  const router = useRouter();
  const optionsQuery = useQuery({
    queryKey: ["invoice-options"],
    queryFn: getInvoiceOptions,
  });
  const [values, setValues] = useState({
    leaseId: "",
    description: "Monthly rent",
    periodStart: "",
    periodEnd: "",
    dueAt: "",
    subtotal: "",
    tax: "0",
    currency: "USD",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const invoice = await createInvoice({
        ...values,
        periodStart: values.periodStart,
        periodEnd: values.periodEnd,
        subtotal: Number(values.subtotal),
        tax: Number(values.tax),
        total: roundMoney(Number(values.subtotal) + Number(values.tax)),
        currency: values.currency.toUpperCase(),
      });
      router.push(`/invoices/${encodeURIComponent(invoice.invoice.id)}`);
    } catch (actionError) {
      setError(
        actionError instanceof ApiRequestError || actionError instanceof Error
          ? actionError.message
          : "The invoice could not be created.",
      );
    } finally {
      setBusy(false);
    }
  }

  if (optionsQuery.isLoading) {
    return (
      <WorkspaceShell>
        <main className="flex min-h-screen items-center justify-center text-sm text-[#68756f]">
          Loading active leases...
        </main>
      </WorkspaceShell>
    );
  }
  if (optionsQuery.isError || !optionsQuery.data) {
    return (
      <WorkspaceShell>
        <main className="mx-auto max-w-3xl px-5 py-10 text-[#17231f]">
          <h1 className="text-2xl font-semibold">Invoice options could not be loaded</h1>
          <p className="mt-3 text-sm text-[#68756f]" role="alert">
            {optionsQuery.error instanceof Error
              ? optionsQuery.error.message
              : "Please try again."}
          </p>
        </main>
      </WorkspaceShell>
    );
  }

  const leases = optionsQuery.data.leases;
  const lease = leases.find((item) => item.id === values.leaseId);
  const total = roundMoney((Number(values.subtotal) || 0) + (Number(values.tax) || 0));
  const inputClass =
    "mt-2 h-11 w-full rounded-xl border border-[#dce3de] bg-white px-3 text-sm outline-none focus:border-[#527e69] focus:ring-4 focus:ring-[#527e69]/10";

  return (
    <WorkspaceShell>
      <main className="min-h-screen bg-[#f7f8f6] px-5 py-8 text-[#17231f] sm:px-8 sm:py-12">
        <div className="mx-auto max-w-3xl">
          <Link className="text-sm font-semibold text-[#52735c] hover:underline" href="/invoices">
            ← Invoices
          </Link>
          <header className="mt-6 border-b border-[#e2e8e2] pb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.17em] text-[#65806e]">
              Finance
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">
              Create an invoice
            </h1>
            <p className="mt-2 text-sm text-[#738078]">
              Invoices are saved as drafts. Review them and issue when ready.
            </p>
          </header>

          {!leases.length ? (
            <section className="mt-6 rounded-2xl border border-[#e2e8e2] bg-white p-6">
              <h2 className="font-semibold">An active lease is required</h2>
              <p className="mt-2 text-sm leading-6 text-[#738078]">
                Create or activate a lease before invoicing rent.
              </p>
              <Link className="mt-4 inline-flex text-sm font-semibold text-[#1d5745]" href="/leases">
                Manage leases →
              </Link>
            </section>
          ) : (
            <form className="mt-6 space-y-5" onSubmit={submit}>
              {error && (
                <p className="rounded-xl border border-[#f1c7c4] bg-[#fff5f4] px-4 py-3 text-sm text-[#a12a21]" role="alert">
                  {error}
                </p>
              )}
              <section className="rounded-2xl border border-[#e2e8e2] bg-white p-6">
                <h2 className="text-lg font-semibold">Invoice details</h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <label className="text-sm font-medium text-[#42534a] sm:col-span-2">
                    Active lease
                    <select
                      className={inputClass}
                      onChange={(event) => {
                        const selected = leases.find((item) => item.id === event.target.value);
                        const today = new Date();
                        setValues({
                          ...values,
                          leaseId: event.target.value,
                          subtotal: selected ? Number(selected.monthlyRent).toFixed(2) : "",
                          periodStart: selected ? monthStart(today) : "",
                          periodEnd: selected ? monthEnd(today) : "",
                          dueAt: selected ? defaultDueDate(today) : "",
                        });
                      }}
                      required
                      value={values.leaseId}
                    >
                      <option value="">Select a lease</option>
                      {leases.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.tenant.fullName} · {item.unit.property.name} · Unit{" "}
                          {item.unit.unitNumber}
                        </option>
                      ))}
                    </select>
                  </label>
                  {lease && (
                    <p className="text-sm text-[#68756f] sm:col-span-2">
                      Lease rent: {formatCurrency(lease.monthlyRent, values.currency)} per month.
                      Amount is editable for adjustments or additional charges.
                    </p>
                  )}
                  <Field label="Description" required value={values.description} onChange={(description) => setValues({ ...values, description })} />
                  <Field label="Currency (ISO 4217)" maxLength={3} minLength={3} required value={values.currency} onChange={(currency) => setValues({ ...values, currency: currency.toUpperCase() })} />
                  <Field label="Billing period start" type="date" value={values.periodStart} onChange={(periodStart) => setValues({ ...values, periodStart })} />
                  <Field label="Billing period end" type="date" value={values.periodEnd} onChange={(periodEnd) => setValues({ ...values, periodEnd })} />
                  <Field label="Due date" required type="date" value={values.dueAt} onChange={(dueAt) => setValues({ ...values, dueAt })} />
                </div>
              </section>

              <section className="rounded-2xl border border-[#e2e8e2] bg-white p-6">
                <h2 className="text-lg font-semibold">Amounts</h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <Field label="Subtotal" min="0.01" required step="0.01" type="number" value={values.subtotal} onChange={(subtotal) => setValues({ ...values, subtotal })} />
                  <Field label="Tax" min="0" required step="0.01" type="number" value={values.tax} onChange={(tax) => setValues({ ...values, tax })} />
                </div>
                <div className="mt-5 flex items-center justify-between border-t border-[#edf0ec] pt-4">
                  <span className="text-sm font-semibold text-[#52645a]">Invoice total</span>
                  <span className="text-xl font-semibold text-[#1d5745]">
                    {formatCurrency(total, values.currency || "USD")}
                  </span>
                </div>
                <p className="mt-2 text-xs text-[#738078]">
                  Total is calculated as subtotal plus tax. The currency is saved with the invoice.
                </p>
              </section>

              <div className="flex flex-wrap justify-end gap-3">
                <Link className="inline-flex h-11 items-center justify-center rounded-full border border-[#dce3de] bg-white px-5 text-sm font-semibold text-[#42534a]" href="/invoices">
                  Cancel
                </Link>
                <button
                  className="inline-flex h-11 items-center justify-center rounded-full bg-[#1d5745] px-5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={busy}
                  type="submit"
                >
                  {busy ? "Creating..." : "Save draft"}
                </button>
              </div>
            </form>
          )}
        </div>
      </main>
    </WorkspaceShell>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required = false,
  min,
  maxLength,
  minLength,
  step,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  min?: string;
  maxLength?: number;
  minLength?: number;
  step?: string;
}) {
  return (
    <label className="text-sm font-medium text-[#42534a]">
      {label}
      <input
        className="mt-2 h-11 w-full rounded-xl border border-[#dce3de] bg-white px-3 text-sm outline-none focus:border-[#527e69] focus:ring-4 focus:ring-[#527e69]/10"
        maxLength={maxLength}
        min={min}
        minLength={minLength}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        step={step}
        type={type}
        value={value}
      />
    </label>
  );
}

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function formatCurrency(value: string | number, currency: string) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(Number(value));
}
