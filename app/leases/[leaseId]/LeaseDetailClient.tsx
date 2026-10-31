"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import WorkspaceShell from "../../components/WorkspaceShell";
import { ApiRequestError } from "../../lib/onboarding";
import {
  deleteLeaseDocument,
  getLease,
  getLeaseDocumentDownloadUrl,
  updateLease,
  uploadLeaseDocument,
  type Lease,
  type LeaseStatus,
} from "../../lib/leases";

export default function LeaseDetailPage() {
  const { leaseId } = useParams<{ leaseId: string }>();
  const queryClient = useQueryClient();
  const leaseQuery = useQuery({
    queryKey: ["lease", leaseId],
    queryFn: () => getLease(leaseId),
    enabled: Boolean(leaseId),
  });
  const lease = leaseQuery.data?.lease;
  async function refreshLease() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["lease", leaseId] }),
      queryClient.invalidateQueries({ queryKey: ["leases"] }),
      queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
    ]);
  }

  if (leaseQuery.isLoading || !lease) {
    if (leaseQuery.isError) {
      return (
        <WorkspaceShell>
          <main className="flex min-h-screen items-center justify-center px-6 text-[#17231f]">
            <section className="max-w-lg rounded-3xl border border-[#e1e7e1] bg-white p-8">
              <h1 className="text-2xl font-semibold">Lease could not be loaded</h1>
              <p className="mt-3 text-sm leading-6 text-[#68756f]" role="alert">
                {leaseQuery.error instanceof Error
                  ? leaseQuery.error.message
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
          Loading lease...
        </main>
      </WorkspaceShell>
    );
  }

  return (
    <WorkspaceShell>
      <LeaseEditor key={lease.id} leaseId={leaseId} lease={lease} onRefresh={refreshLease} />
    </WorkspaceShell>
  );
}

function LeaseEditor({
  leaseId,
  lease,
  onRefresh,
}: {
  leaseId: string;
  lease: Lease;
  onRefresh: () => Promise<void>;
}) {
  const [values, setValues] = useState({
    startDate: lease.startDate.slice(0, 10),
    endDate: lease.endDate?.slice(0, 10) ?? "",
    monthlyRent: String(lease.monthlyRent),
    securityDeposit: String(lease.securityDeposit),
    rentDueDay: String(lease.rentDueDay),
    lateFee: lease.lateFee === null ? "" : String(lease.lateFee),
    terms: lease.terms ?? "",
    status: lease.status,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const allowedStatuses = nextStatuses(lease.status);
  const inputClass =
    "mt-2 h-11 w-full rounded-xl border border-[#dce3de] bg-white px-3 text-sm outline-none focus:border-[#527e69] focus:ring-4 focus:ring-[#527e69]/10";

  async function saveLease(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await updateLease(leaseId, {
        startDate: values.startDate,
        endDate: values.endDate || null,
        monthlyRent: Number(values.monthlyRent),
        securityDeposit: Number(values.securityDeposit),
        rentDueDay: Number(values.rentDueDay),
        lateFee: values.lateFee ? Number(values.lateFee) : null,
        terms: values.terms || null,
        status: values.status,
      });
      await onRefresh();
      setNotice("Lease details saved.");
    } catch (actionError) {
      setError(getErrorMessage(actionError, "The lease could not be updated."));
    } finally {
      setBusy(false);
    }
  }

  async function uploadDocument(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await uploadLeaseDocument(leaseId, file);
      await onRefresh();
      setNotice("Document uploaded.");
    } catch (actionError) {
      setError(getErrorMessage(actionError, "The document could not be uploaded."));
    } finally {
      setBusy(false);
    }
  }

  async function openDocument(documentId: string) {
    setError("");
    try {
      const { downloadUrl } = await getLeaseDocumentDownloadUrl(leaseId, documentId);
      window.location.assign(downloadUrl);
    } catch (actionError) {
      setError(getErrorMessage(actionError, "The document could not be opened."));
    }
  }

  async function removeDocument(documentId: string) {
    if (!window.confirm("Delete this lease document? This cannot be undone.")) return;
    setBusy(true);
    setError("");
    try {
      await deleteLeaseDocument(leaseId, documentId);
      await onRefresh();
      setNotice("Document deleted.");
    } catch (actionError) {
      setError(getErrorMessage(actionError, "The document could not be deleted."));
    } finally {
      setBusy(false);
    }
  }

  return (
      <main className="min-h-screen bg-[#f7f8f6] px-5 py-8 text-[#17231f] sm:px-8 sm:py-12">
        <div className="mx-auto max-w-5xl">
          <Link className="text-sm font-semibold text-[#52735c] hover:underline" href="/leases">
            ← Leases
          </Link>
          <header className="mt-6 flex flex-col gap-5 border-b border-[#e2e8e2] pb-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.17em] text-[#65806e]">
                {lease.unit.property.name} · Unit {lease.unit.unitNumber}
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">
                {lease.tenant.fullName}
              </h1>
              <p className="mt-2 text-sm text-[#738078]">
                {lease.tenant.email || "No email recorded"}
                {lease.tenant.phone ? ` · ${lease.tenant.phone}` : ""}
              </p>
            </div>
            <Link
              className="inline-flex h-10 items-center justify-center rounded-full border border-[#dce3de] bg-white px-4 text-sm font-semibold text-[#1d5745]"
              href={`/leases/${encodeURIComponent(lease.id)}/print`}
              target="_blank"
            >
              Print lease summary
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

          <div className="mt-6 grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
            <form className="rounded-2xl border border-[#e2e8e2] bg-white p-6" onSubmit={saveLease}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold">Lease terms</h2>
                  <p className="mt-1 text-sm text-[#738078]">
                    Update the dates, payment details, notes, or lifecycle status.
                  </p>
                </div>
                <StatusBadge status={lease.status} />
              </div>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <Field label="Start date" required type="date" value={values.startDate} onChange={(startDate) => setValues({ ...values, startDate })} />
                <Field label="End date (optional)" type="date" value={values.endDate} onChange={(endDate) => setValues({ ...values, endDate })} />
                <Field label="Monthly rent (USD)" min="0.01" required step="0.01" type="number" value={values.monthlyRent} onChange={(monthlyRent) => setValues({ ...values, monthlyRent })} />
                <Field label="Security deposit (USD)" min="0" step="0.01" type="number" value={values.securityDeposit} onChange={(securityDeposit) => setValues({ ...values, securityDeposit })} />
                <Field label="Rent due day" max="31" min="1" required type="number" value={values.rentDueDay} onChange={(rentDueDay) => setValues({ ...values, rentDueDay })} />
                <Field label="Late fee (USD, optional)" min="0" step="0.01" type="number" value={values.lateFee} onChange={(lateFee) => setValues({ ...values, lateFee })} />
                <label className="text-sm font-medium text-[#42534a] sm:col-span-2">
                  Status
                  <select
                    className={inputClass}
                    onChange={(event) => setValues({ ...values, status: event.target.value as LeaseStatus })}
                    value={values.status}
                  >
                    <option value={lease.status}>{titleCase(lease.status)} (current)</option>
                    {allowedStatuses.map((status) => (
                      <option key={status} value={status}>{titleCase(status)}</option>
                    ))}
                  </select>
                </label>
                <label className="text-sm font-medium text-[#42534a] sm:col-span-2">
                  Agreement terms / notes
                  <textarea
                    className="mt-2 min-h-32 w-full rounded-xl border border-[#dce3de] bg-white px-3 py-3 text-sm outline-none focus:border-[#527e69] focus:ring-4 focus:ring-[#527e69]/10"
                    maxLength={20000}
                    onChange={(event) => setValues({ ...values, terms: event.target.value })}
                    value={values.terms}
                  />
                </label>
              </div>
              <div className="mt-5 flex justify-end">
                <button
                  className="inline-flex h-11 items-center justify-center rounded-full bg-[#1d5745] px-5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={busy}
                  type="submit"
                >
                  {busy ? "Saving..." : "Save changes"}
                </button>
              </div>
            </form>

            <div className="space-y-5">
              <section className="rounded-2xl border border-[#e2e8e2] bg-white p-6">
                <h2 className="text-lg font-semibold">Documents</h2>
                <p className="mt-1 text-sm leading-5 text-[#738078]">
                  Attach private lease files (PDF, DOC, DOCX, JPG, or PNG; up to 15 MB).
                </p>
                <label className="mt-4 flex min-h-11 cursor-pointer items-center justify-center rounded-full border border-[#cbd8cf] px-4 text-sm font-semibold text-[#1d5745] hover:bg-[#f4f7f3]">
                  {busy ? "Please wait..." : "Upload a document"}
                  <input
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/jpeg,image/png"
                    className="sr-only"
                    disabled={busy}
                    onChange={(event) => {
                      void uploadDocument(event.currentTarget.files?.[0]);
                      event.currentTarget.value = "";
                    }}
                    type="file"
                  />
                </label>
                {lease.documents.length ? (
                  <ul className="mt-4 divide-y divide-[#edf0ec]">
                    {lease.documents.map((document) => (
                      <li className="flex items-center justify-between gap-3 py-3" key={document.id}>
                        <div className="min-w-0">
                          <button
                            className="max-w-full truncate text-left text-sm font-semibold text-[#1d5745] hover:underline"
                            onClick={() => void openDocument(document.id)}
                            type="button"
                          >
                            {document.name}
                          </button>
                          <p className="mt-1 text-xs text-[#738078]">
                            {formatBytes(document.sizeBytes)} · {formatDate(document.createdAt)}
                          </p>
                        </div>
                        <button
                          className="shrink-0 text-xs font-medium text-[#a12a21] hover:underline disabled:opacity-50"
                          disabled={busy}
                          onClick={() => void removeDocument(document.id)}
                          type="button"
                        >
                          Delete
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-4 rounded-xl bg-[#f7f8f6] p-3 text-sm text-[#68756f]">
                    No documents attached.
                  </p>
                )}
              </section>

              <section className="rounded-2xl border border-[#e2e8e2] bg-white p-6">
                <h2 className="text-lg font-semibold">Electronic signing</h2>
                <p className="mt-2 text-sm leading-6 text-[#68756f]">
                  Signing is not active. Connect and configure an e-signature provider before
                  sending this lease for signature. The printable summary is not a legal template
                  or an electronic signature.
                </p>
              </section>
            </div>
          </div>
        </div>
      </main>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required = false,
  min,
  max,
  step,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  min?: string;
  max?: string;
  step?: string;
}) {
  return (
    <label className="text-sm font-medium text-[#42534a]">
      {label}
      <input
        className="mt-2 h-11 w-full rounded-xl border border-[#dce3de] bg-white px-3 text-sm outline-none focus:border-[#527e69] focus:ring-4 focus:ring-[#527e69]/10"
        max={max}
        min={min}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        step={step}
        type={type}
        value={value}
      />
    </label>
  );
}

function StatusBadge({ status }: { status: LeaseStatus }) {
  const color =
    status === "ACTIVE"
      ? "bg-[#e9f4eb] text-[#326440]"
      : status === "PENDING"
        ? "bg-[#fff4dc] text-[#87610d]"
        : status === "TERMINATED"
          ? "bg-[#fff0ee] text-[#a12a21]"
          : "bg-[#f0f2f0] text-[#68756f]";
  return (
    <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${color}`}>
      {titleCase(status)}
    </span>
  );
}

function nextStatuses(status: LeaseStatus): LeaseStatus[] {
  if (status === "DRAFT") return ["PENDING", "ACTIVE", "TERMINATED"];
  if (status === "PENDING") return ["ACTIVE", "TERMINATED"];
  if (status === "ACTIVE") return ["ENDED", "TERMINATED"];
  return [];
}

function titleCase(value: string) {
  return value.charAt(0) + value.slice(1).toLowerCase();
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeZone: "UTC" }).format(
    new Date(value),
  );
}

function formatBytes(value: string | null) {
  if (value === null) return "Size unavailable";
  const bytes = Number(value);
  return bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} KB`
    : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof ApiRequestError || error instanceof Error
    ? error.message
    : fallback;
}
