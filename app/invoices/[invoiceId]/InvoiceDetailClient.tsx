"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import WorkspaceShell from "../../components/WorkspaceShell";
import { ApiRequestError } from "../../lib/onboarding";
import {
  getInvoice,
  recordInvoicePayment,
  refundInvoicePayment,
  updateInvoice,
  type Invoice,
  type PaymentMethod,
} from "../../lib/invoices";

export default function InvoiceDetailClient() {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const queryClient = useQueryClient();
  const invoiceQuery = useQuery({
    queryKey: ["invoice", invoiceId],
    queryFn: () => getInvoice(invoiceId),
    enabled: Boolean(invoiceId),
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function refreshInvoice() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["invoice", invoiceId] }),
      queryClient.invalidateQueries({ queryKey: ["invoices"] }),
      queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
    ]);
  }

  async function changeStatus(status: "OPEN" | "VOID") {
    const confirmation =
      status === "VOID"
        ? "Void this invoice? It cannot be reopened."
        : "Issue this invoice to the tenant?";
    if (!window.confirm(confirmation)) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await updateInvoice(invoiceId, { status });
      await refreshInvoice();
      setNotice(status === "OPEN" ? "Invoice issued." : "Invoice voided.");
    } catch (actionError) {
      setError(errorMessage(actionError, "The invoice status could not be changed."));
    } finally {
      setBusy(false);
    }
  }

  async function submitPayment(
    event: FormEvent<HTMLFormElement>,
    values: { amount: number; method: PaymentMethod; notes: string },
  ) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await recordInvoicePayment(invoiceId, values);
      await refreshInvoice();
      setNotice("Payment recorded.");
    } catch (actionError) {
      setError(errorMessage(actionError, "The payment could not be recorded."));
    } finally {
      setBusy(false);
    }
  }

  async function saveDraft(values: {
    description: string;
    periodStart: string | null;
    periodEnd: string | null;
    dueAt: string;
    subtotal: number;
    tax: number;
    total: number;
    currency: string;
  }) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await updateInvoice(invoiceId, values);
      await refreshInvoice();
      setNotice("Draft invoice saved.");
    } catch (actionError) {
      setError(errorMessage(actionError, "The invoice could not be updated."));
    } finally {
      setBusy(false);
    }
  }

  async function refundPayment(paymentId: string, reason: string) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await refundInvoicePayment(invoiceId, paymentId, reason);
      await refreshInvoice();
      setNotice("Refund recorded. Complete the refund outside PropertyDek if you have not already.");
    } catch (actionError) {
      setError(errorMessage(actionError, "The refund could not be recorded."));
    } finally {
      setBusy(false);
    }
  }

  if (invoiceQuery.isLoading || !invoiceQuery.data) {
    if (invoiceQuery.isError) {
      return (
        <WorkspaceShell>
          <main className="flex min-h-screen items-center justify-center px-6 text-[#17231f]">
            <section className="max-w-lg rounded-3xl border border-[#e1e7e1] bg-white p-8">
              <h1 className="text-2xl font-semibold">Invoice could not be loaded</h1>
              <p className="mt-3 text-sm leading-6 text-[#68756f]" role="alert">
                {invoiceQuery.error instanceof Error
                  ? invoiceQuery.error.message
                  : "Please try again."}
              </p>
            </section>
          </main>
        </WorkspaceShell>
      );
    }
    return (
      <WorkspaceShell>
        <main className="flex min-h-screen items-center justify-center text-sm text-[#68756f]">
          Loading invoice...
        </main>
      </WorkspaceShell>
    );
  }

  const invoice = invoiceQuery.data.invoice;
  return (
    <WorkspaceShell>
      <InvoiceDetail
        busy={busy}
        error={error}
        invoice={invoice}
        invoiceId={invoiceId}
        notice={notice}
        onChangeStatus={changeStatus}
        onRefundPayment={refundPayment}
        onSaveDraft={saveDraft}
        onSubmitPayment={submitPayment}
      />
    </WorkspaceShell>
  );
}

function InvoiceDetail({
  busy,
  error,
  invoice,
  invoiceId,
  notice,
  onChangeStatus,
  onRefundPayment,
  onSaveDraft,
  onSubmitPayment,
}: {
  busy: boolean;
  error: string;
  invoice: Invoice;
  invoiceId: string;
  notice: string;
  onChangeStatus: (status: "OPEN" | "VOID") => Promise<void>;
  onRefundPayment: (paymentId: string, reason: string) => Promise<void>;
  onSaveDraft: (values: {
    description: string;
    periodStart: string | null;
    periodEnd: string | null;
    dueAt: string;
    subtotal: number;
    tax: number;
    total: number;
    currency: string;
  }) => Promise<void>;
  onSubmitPayment: (
    event: FormEvent<HTMLFormElement>,
    values: { amount: number; method: PaymentMethod; notes: string },
  ) => Promise<void>;
}) {
  const canRecordPayment = ["OPEN", "PARTIALLY_PAID", "OVERDUE"].includes(invoice.status);
  const canVoid = ["DRAFT", "OPEN", "OVERDUE"].includes(invoice.status) && invoice.amountPaid === "0.00";

  return (
    <main className="min-h-screen bg-[#f7f8f6] px-5 py-8 text-[#17231f] sm:px-8 sm:py-12">
      <div className="mx-auto max-w-5xl">
        <Link className="text-sm font-semibold text-[#52735c] hover:underline" href="/invoices">
          ← Invoices
        </Link>
        <header className="mt-6 flex flex-col gap-5 border-b border-[#e2e8e2] pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.17em] text-[#65806e]">
              Invoice · {invoice.invoiceNumber}
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">
              {invoice.lease.tenant.fullName}
            </h1>
            <p className="mt-2 text-sm text-[#738078]">
              {invoice.lease.unit.property.name} · Unit {invoice.lease.unit.unitNumber}
            </p>
          </div>
          <Link
            className="inline-flex h-10 items-center justify-center rounded-full border border-[#dce3de] bg-white px-4 text-sm font-semibold text-[#1d5745]"
            href={`/invoices/${encodeURIComponent(invoiceId)}/print`}
            target="_blank"
          >
            Print invoice
          </Link>
        </header>

        {(error || notice) && (
          <p
            className={`mt-5 rounded-xl border px-4 py-3 text-sm ${
              error
                ? "border-[#f1c7c4] bg-[#fff5f4] text-[#a12a21]"
                : "border-[#cfe0d1] bg-[#eff7ef] text-[#326440]"
            }`}
            role={error ? "alert" : "status"}
          >
            {error || notice}
          </p>
        )}

        <div className="mt-6 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-2xl border border-[#e2e8e2] bg-white p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">Invoice details</h2>
                <p className="mt-1 text-sm text-[#738078]">{invoice.description || "Invoice"}</p>
              </div>
              <StatusBadge status={invoice.status} />
            </div>
            <dl className="mt-5 grid gap-4 border-t border-[#edf0ec] pt-5 sm:grid-cols-2">
              <Info label="Billing period">
                {invoice.periodStart
                  ? `${formatDate(invoice.periodStart)} – ${invoice.periodEnd ? formatDate(invoice.periodEnd) : "No end date"}`
                  : "Not specified"}
              </Info>
              <Info label="Issue date">
                {invoice.issuedAt ? formatDate(invoice.issuedAt) : "Not issued"}
              </Info>
              <Info label="Due date">{formatDate(invoice.dueAt)}</Info>
              <Info label="Currency">{invoice.currency}</Info>
            </dl>
            <div className="mt-5 space-y-3 border-t border-[#edf0ec] pt-5 text-sm">
              <AmountRow label="Subtotal" amount={invoice.subtotal} currency={invoice.currency} />
              <AmountRow label="Tax" amount={invoice.tax} currency={invoice.currency} />
              <AmountRow label="Total" amount={invoice.total} currency={invoice.currency} strong />
              <AmountRow label="Amount paid" amount={invoice.amountPaid} currency={invoice.currency} />
              <AmountRow label="Balance due" amount={invoice.balanceDue} currency={invoice.currency} strong />
            </div>
            {invoice.status === "DRAFT" && (
              <div className="mt-6 border-t border-[#edf0ec] pt-5">
                <DraftInvoiceEditor
                  busy={busy}
                  invoice={invoice}
                  key={`${invoice.id}-${invoice.dueAt}-${invoice.total}-${invoice.currency}`}
                  onSave={onSaveDraft}
                />
                <div className="mt-5 flex flex-wrap justify-end gap-3">
                  <button
                    className="inline-flex h-10 items-center justify-center rounded-full border border-[#dce3de] px-4 text-sm font-semibold text-[#a12a21] disabled:opacity-50"
                    disabled={busy}
                    onClick={() => void onChangeStatus("VOID")}
                    type="button"
                  >
                    Void draft
                  </button>
                  <button
                    className="inline-flex h-10 items-center justify-center rounded-full bg-[#1d5745] px-4 text-sm font-semibold text-white disabled:opacity-50"
                    disabled={busy}
                    onClick={() => void onChangeStatus("OPEN")}
                    type="button"
                  >
                    Issue invoice
                  </button>
                </div>
              </div>
            )}
            {canVoid && invoice.status !== "DRAFT" && (
              <div className="mt-6 flex justify-end border-t border-[#edf0ec] pt-5">
                <button
                  className="text-sm font-semibold text-[#a12a21] hover:underline disabled:opacity-50"
                  disabled={busy}
                  onClick={() => void onChangeStatus("VOID")}
                  type="button"
                >
                  Void unpaid invoice
                </button>
              </div>
            )}
          </section>

          <div className="space-y-5">
            {canRecordPayment && (
              <PaymentForm
                busy={busy}
                invoice={invoice}
                key={`${invoice.id}-${invoice.balanceDue}`}
                onSubmit={onSubmitPayment}
              />
            )}

            <section className="rounded-2xl border border-[#e2e8e2] bg-white p-6">
              <h2 className="text-lg font-semibold">Payment history</h2>
              {invoice.payments.length ? (
                <ul className="mt-3 divide-y divide-[#edf0ec]">
                  {invoice.payments.map((payment) => (
                    <li className="py-3" key={payment.id}>
                      <div className="flex justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-[#25342e]">
                            {formatMethod(payment.method)}
                          </p>
                          <p className="mt-1 text-xs text-[#738078]">
                            {payment.paidAt ? formatDate(payment.paidAt) : "Pending"} ·{" "}
                            {payment.status.toLowerCase()}
                          </p>
                          {payment.notes && (
                            <p className="mt-1 text-xs text-[#68756f]">{payment.notes}</p>
                          )}
                        </div>
                        <p className="shrink-0 text-sm font-semibold text-[#1d5745]">
                          {formatCurrency(payment.amount, payment.currency)}
                        </p>
                      </div>
                      {payment.provider === "MANUAL" && payment.status === "SUCCEEDED" && (
                        <button
                          className="mt-2 text-xs font-medium text-[#a12a21] hover:underline disabled:opacity-50"
                          disabled={busy}
                          onClick={() => {
                            const reason = window.prompt(
                              "Record a refund that has already been completed externally. Enter the reason:",
                            );
                            if (reason?.trim()) {
                              void onRefundPayment(payment.id, reason.trim());
                            }
                          }}
                          type="button"
                        >
                          Record external refund
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 rounded-xl bg-[#f7f8f6] p-3 text-sm text-[#68756f]">
                  No payments recorded.
                </p>
              )}
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}

function Info({ label, children }: { label: string; children: string }) {
  return (
    <div>
      <dt className="text-xs font-medium text-[#738078]">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-[#25342e]">{children}</dd>
    </div>
  );
}

function PaymentForm({
  busy,
  invoice,
  onSubmit,
}: {
  busy: boolean;
  invoice: Invoice;
  onSubmit: (
    event: FormEvent<HTMLFormElement>,
    values: { amount: number; method: PaymentMethod; notes: string },
  ) => Promise<void>;
}) {
  const [amount, setAmount] = useState(String(invoice.balanceDue));
  const [method, setMethod] = useState<PaymentMethod>("BANK_TRANSFER");
  const [notes, setNotes] = useState("");
  const inputClass =
    "mt-2 h-11 w-full rounded-xl border border-[#dce3de] bg-white px-3 text-sm outline-none focus:border-[#527e69] focus:ring-4 focus:ring-[#527e69]/10";
  return (
    <form
      className="rounded-2xl border border-[#e2e8e2] bg-white p-6"
      onSubmit={(event) =>
        void onSubmit(event, { amount: Number(amount), method, notes })
      }
    >
      <h2 className="text-lg font-semibold">Record a payment</h2>
      <p className="mt-1 text-sm leading-5 text-[#738078]">
        Record an already received payment. This does not charge a payment method.
      </p>
      <label className="mt-4 block text-sm font-medium text-[#42534a]">
        Amount ({invoice.currency})
        <input
          className={inputClass}
          max={Number(invoice.balanceDue)}
          min="0.01"
          onChange={(event) => setAmount(event.target.value)}
          required
          step="0.01"
          type="number"
          value={amount}
        />
      </label>
      <label className="mt-4 block text-sm font-medium text-[#42534a]">
        Payment method
        <select
          className={inputClass}
          onChange={(event) => setMethod(event.target.value as PaymentMethod)}
          value={method}
        >
          <option value="BANK_TRANSFER">Bank transfer</option>
          <option value="CASH">Cash</option>
          <option value="CHECK">Cheque / check</option>
          <option value="CARD">Card (received outside PropertyDek)</option>
          <option value="OTHER">Other</option>
        </select>
      </label>
      <label className="mt-4 block text-sm font-medium text-[#42534a]">
        Reference / notes (optional)
        <textarea
          className="mt-2 min-h-20 w-full rounded-xl border border-[#dce3de] bg-white px-3 py-3 text-sm outline-none focus:border-[#527e69] focus:ring-4 focus:ring-[#527e69]/10"
          maxLength={2000}
          onChange={(event) => setNotes(event.target.value)}
          value={notes}
        />
      </label>
      <button
        className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-full bg-[#1d5745] px-5 text-sm font-semibold text-white disabled:opacity-50"
        disabled={busy || Number(invoice.balanceDue) <= 0}
        type="submit"
      >
        {busy ? "Recording..." : "Record payment"}
      </button>
    </form>
  );
}

function DraftInvoiceEditor({
  busy,
  invoice,
  onSave,
}: {
  busy: boolean;
  invoice: Invoice;
  onSave: (values: {
    description: string;
    periodStart: string | null;
    periodEnd: string | null;
    dueAt: string;
    subtotal: number;
    tax: number;
    total: number;
    currency: string;
  }) => Promise<void>;
}) {
  const [values, setValues] = useState({
    description: invoice.description ?? "",
    periodStart: invoice.periodStart?.slice(0, 10) ?? "",
    periodEnd: invoice.periodEnd?.slice(0, 10) ?? "",
    dueAt: invoice.dueAt.slice(0, 10),
    subtotal: String(invoice.subtotal),
    tax: String(invoice.tax),
    currency: invoice.currency,
  });
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const subtotal = Number(values.subtotal);
    const tax = Number(values.tax);
    await onSave({
      description: values.description,
      periodStart: values.periodStart || null,
      periodEnd: values.periodEnd || null,
      dueAt: values.dueAt,
      subtotal,
      tax,
      total: Math.round((subtotal + tax + Number.EPSILON) * 100) / 100,
      currency: values.currency.toUpperCase(),
    });
  }

  return (
    <form className="space-y-4" onSubmit={(event) => void submit(event)}>
      <h3 className="text-sm font-semibold text-[#25342e]">Edit draft</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field
          label="Description"
          onChange={(description) => setValues({ ...values, description })}
          required
          value={values.description}
        />
        <Field
          label="Currency"
          maxLength={3}
          minLength={3}
          onChange={(currency) => setValues({ ...values, currency: currency.toUpperCase() })}
          required
          value={values.currency}
        />
        <Field
          label="Period start"
          onChange={(periodStart) => setValues({ ...values, periodStart })}
          type="date"
          value={values.periodStart}
        />
        <Field
          label="Period end"
          onChange={(periodEnd) => setValues({ ...values, periodEnd })}
          type="date"
          value={values.periodEnd}
        />
        <Field
          label="Due date"
          onChange={(dueAt) => setValues({ ...values, dueAt })}
          required
          type="date"
          value={values.dueAt}
        />
        <Field
          label="Subtotal"
          min="0.01"
          onChange={(subtotal) => setValues({ ...values, subtotal })}
          required
          step="0.01"
          type="number"
          value={values.subtotal}
        />
        <Field
          label="Tax"
          min="0"
          onChange={(tax) => setValues({ ...values, tax })}
          required
          step="0.01"
          type="number"
          value={values.tax}
        />
      </div>
      <div className="flex justify-end">
        <button
          className="inline-flex h-10 items-center justify-center rounded-full border border-[#cbd8cf] px-4 text-sm font-semibold text-[#1d5745] disabled:opacity-50"
          disabled={busy}
          type="submit"
        >
          {busy ? "Saving..." : "Save draft"}
        </button>
      </div>
    </form>
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
        className="mt-2 h-10 w-full rounded-xl border border-[#dce3de] bg-white px-3 text-sm outline-none focus:border-[#527e69] focus:ring-4 focus:ring-[#527e69]/10"
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

function StatusBadge({ status }: { status: Invoice["status"] }) {
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

function formatMethod(value: PaymentMethod) {
  return {
    CASH: "Cash",
    BANK_TRANSFER: "Bank transfer",
    CARD: "Card",
    CHECK: "Cheque / check",
    OTHER: "Other",
  }[value];
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof ApiRequestError || error instanceof Error
    ? error.message
    : fallback;
}
