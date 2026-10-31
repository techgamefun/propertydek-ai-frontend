"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import WorkspaceShell from "../../components/WorkspaceShell";
import { ApiRequestError } from "../../lib/onboarding";
import { createLease, getLeaseOptions, type LeaseStatus } from "../../lib/leases";

export default function NewLeasePage() {
  const router = useRouter();
  const optionsQuery = useQuery({
    queryKey: ["lease-options"],
    queryFn: getLeaseOptions,
  });
  const [tenantChoice, setTenantChoice] = useState("new");
  const [values, setValues] = useState({
    unitId: "",
    tenantId: "",
    fullName: "",
    email: "",
    phone: "",
    startDate: "",
    endDate: "",
    monthlyRent: "",
    securityDeposit: "0",
    rentDueDay: "1",
    lateFee: "",
    terms: "",
    status: "DRAFT" as LeaseStatus,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const tenant =
        tenantChoice === "new"
          ? {
              fullName: values.fullName,
              email: values.email,
              phone: values.phone,
            }
          : undefined;
      const result = await createLease({
        unitId: values.unitId,
        ...(tenant ? { tenant } : { tenantId: values.tenantId }),
        startDate: values.startDate,
        endDate: values.endDate || null,
        monthlyRent: Number(values.monthlyRent),
        securityDeposit: Number(values.securityDeposit),
        rentDueDay: Number(values.rentDueDay),
        lateFee: values.lateFee ? Number(values.lateFee) : null,
        terms: values.terms,
        status: values.status,
      });
      router.push(`/leases/${encodeURIComponent(result.lease.id)}`);
    } catch (actionError) {
      setError(
        actionError instanceof ApiRequestError
          ? actionError.message
          : actionError instanceof Error
            ? actionError.message
            : "The lease could not be created.",
      );
    } finally {
      setBusy(false);
    }
  }

  if (optionsQuery.isLoading) {
    return (
      <WorkspaceShell>
        <Loading />
      </WorkspaceShell>
    );
  }
  if (optionsQuery.isError || !optionsQuery.data) {
    return (
      <WorkspaceShell>
        <main className="mx-auto max-w-3xl px-5 py-10 text-[#17231f]">
          <h1 className="text-2xl font-semibold">Lease options could not be loaded</h1>
          <p className="mt-3 text-sm text-[#68756f]" role="alert">
            {optionsQuery.error instanceof Error
              ? optionsQuery.error.message
              : "Please try again."}
          </p>
        </main>
      </WorkspaceShell>
    );
  }

  const inputClass =
    "mt-2 h-11 w-full rounded-xl border border-[#dce3de] bg-white px-3 text-sm outline-none focus:border-[#527e69] focus:ring-4 focus:ring-[#527e69]/10";
  const units = optionsQuery.data.units;
  const tenants = optionsQuery.data.tenants;

  return (
    <WorkspaceShell>
      <main className="min-h-screen bg-[#f7f8f6] px-5 py-8 text-[#17231f] sm:px-8 sm:py-12">
        <div className="mx-auto max-w-3xl">
          <Link className="text-sm font-semibold text-[#52735c] hover:underline" href="/leases">
            ← Leases
          </Link>
          <header className="mt-6 border-b border-[#e2e8e2] pb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.17em] text-[#65806e]">
              Lease management
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">Create a lease</h1>
            <p className="mt-2 text-sm text-[#738078]">
              Add the tenant, unit, dates, rent, and agreement notes.
            </p>
          </header>

          {!units.length ? (
            <section className="mt-6 rounded-2xl border border-[#e2e8e2] bg-white p-6">
              <h2 className="font-semibold">Add a rentable unit first</h2>
              <p className="mt-2 text-sm leading-6 text-[#738078]">
                Leases need a unit in a property. Units in maintenance or inactive status are not
                available for leasing.
              </p>
              <Link className="mt-4 inline-flex text-sm font-semibold text-[#1d5745]" href="/properties">
                Manage properties →
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
                <h2 className="text-lg font-semibold">Tenant and unit</h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <label className="text-sm font-medium text-[#42534a] sm:col-span-2">
                    Unit
                    <select
                      className={inputClass}
                      onChange={(event) => setValues({ ...values, unitId: event.target.value })}
                      required
                      value={values.unitId}
                    >
                      <option value="">Select a unit</option>
                      {units.map((unit) => (
                        <option key={unit.id} value={unit.id}>
                          {unit.property.name} · Unit {unit.unitNumber} · {formatCurrency(unit.monthlyRent)}/mo
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="text-sm font-medium text-[#42534a] sm:col-span-2">
                    Tenant
                    <select
                      className={inputClass}
                      onChange={(event) => {
                        setTenantChoice(event.target.value);
                        setValues({ ...values, tenantId: event.target.value === "new" ? "" : event.target.value });
                      }}
                      value={tenantChoice === "new" ? "new" : values.tenantId}
                    >
                      <option value="new">Create a new tenant</option>
                      {tenants.map((tenant) => (
                        <option key={tenant.id} value={tenant.id}>
                          {tenant.fullName}{tenant.email ? ` · ${tenant.email}` : ""}
                        </option>
                      ))}
                    </select>
                  </label>
                  {tenantChoice === "new" ? (
                    <>
                      <Field label="Full name" required value={values.fullName} onChange={(fullName) => setValues({ ...values, fullName })} />
                      <Field label="Email" type="email" value={values.email} onChange={(email) => setValues({ ...values, email })} />
                      <Field label="Phone" type="tel" value={values.phone} onChange={(phone) => setValues({ ...values, phone })} />
                    </>
                  ) : (
                    <p className="text-sm text-[#68756f] sm:col-span-2">
                      The selected tenant’s existing contact details will be used.
                    </p>
                  )}
                </div>
              </section>

              <section className="rounded-2xl border border-[#e2e8e2] bg-white p-6">
                <h2 className="text-lg font-semibold">Dates and rent</h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <Field label="Start date" required type="date" value={values.startDate} onChange={(startDate) => setValues({ ...values, startDate })} />
                  <Field label="End date (optional)" type="date" value={values.endDate} onChange={(endDate) => setValues({ ...values, endDate })} />
                  <Field label="Monthly rent (USD)" min="0.01" required step="0.01" type="number" value={values.monthlyRent} onChange={(monthlyRent) => setValues({ ...values, monthlyRent })} />
                  <Field label="Security deposit (USD)" min="0" step="0.01" type="number" value={values.securityDeposit} onChange={(securityDeposit) => setValues({ ...values, securityDeposit })} />
                  <Field label="Rent due day" max="31" min="1" required type="number" value={values.rentDueDay} onChange={(rentDueDay) => setValues({ ...values, rentDueDay })} />
                  <Field label="Late fee (USD, optional)" min="0" step="0.01" type="number" value={values.lateFee} onChange={(lateFee) => setValues({ ...values, lateFee })} />
                  <label className="text-sm font-medium text-[#42534a] sm:col-span-2">
                    Lease status
                    <select
                      className={inputClass}
                      onChange={(event) => setValues({ ...values, status: event.target.value as LeaseStatus })}
                      value={values.status}
                    >
                      <option value="DRAFT">Draft</option>
                      <option value="PENDING">Pending</option>
                      <option value="ACTIVE">Active</option>
                    </select>
                    <span className="mt-1 block text-xs font-normal text-[#738078]">
                      Use Pending for a future lease. An Active lease must include today’s date.
                    </span>
                  </label>
                  <label className="text-sm font-medium text-[#42534a] sm:col-span-2">
                    Agreement terms / notes
                    <textarea
                      className="mt-2 min-h-28 w-full rounded-xl border border-[#dce3de] bg-white px-3 py-3 text-sm outline-none focus:border-[#527e69] focus:ring-4 focus:ring-[#527e69]/10"
                      maxLength={20000}
                      onChange={(event) => setValues({ ...values, terms: event.target.value })}
                      value={values.terms}
                    />
                  </label>
                </div>
              </section>

              <div className="flex flex-wrap justify-end gap-3">
                <Link className="inline-flex h-11 items-center justify-center rounded-full border border-[#dce3de] bg-white px-5 text-sm font-semibold text-[#42534a]" href="/leases">
                  Cancel
                </Link>
                <button
                  className="inline-flex h-11 items-center justify-center rounded-full bg-[#1d5745] px-5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={busy}
                  type="submit"
                >
                  {busy ? "Creating..." : "Create lease"}
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

function Loading() {
  return (
    <main className="flex min-h-screen items-center justify-center text-sm text-[#68756f]">
      Loading lease options...
    </main>
  );
}

function formatCurrency(value: string | number | null) {
  if (value === null) return "—";
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(Number(value));
}
