"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import WorkspaceShell from "../components/WorkspaceShell";
import { getLeases, type Lease } from "../lib/leases";

export default function LeasesPage() {
  const leasesQuery = useQuery({ queryKey: ["leases"], queryFn: getLeases });

  if (leasesQuery.isLoading) {
    return (
      <WorkspaceShell>
        <main className="flex min-h-screen items-center justify-center text-sm text-[#68756f]">
          Loading leases...
        </main>
      </WorkspaceShell>
    );
  }

  if (leasesQuery.isError || !leasesQuery.data) {
    return (
      <WorkspaceShell>
        <main className="flex min-h-screen items-center justify-center px-6 text-[#17231f]">
          <section className="max-w-lg rounded-3xl border border-[#e1e7e1] bg-white p-8">
            <h1 className="text-2xl font-semibold">Leases could not be loaded</h1>
            <p className="mt-3 text-sm leading-6 text-[#68756f]" role="alert">
              {leasesQuery.error instanceof Error
                ? leasesQuery.error.message
                : "Please try again."}
            </p>
          </section>
        </main>
      </WorkspaceShell>
    );
  }

  const leases = leasesQuery.data.leases;
  const activeCount = leases.filter((lease) => lease.status === "ACTIVE").length;
  const pendingCount = leases.filter((lease) => lease.status === "PENDING").length;

  return (
    <WorkspaceShell>
      <main className="min-h-screen px-5 py-8 text-[#17231f] sm:px-8 sm:py-12">
        <div className="mx-auto max-w-6xl">
          <header className="flex flex-col gap-5 border-b border-[#e2e8e2] pb-7 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.17em] text-[#65806e]">
                Portfolio
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">Leases</h1>
              <p className="mt-2 text-sm text-[#738078]">
                Create and track tenant agreements, dates, rent, and documents.
              </p>
            </div>
            <Link
              className="inline-flex h-11 items-center justify-center rounded-full bg-[#1d5745] px-5 text-sm font-semibold text-white transition hover:bg-[#174737]"
              href="/leases/new"
            >
              Create lease
            </Link>
          </header>

          <section aria-label="Lease summary" className="mt-6 grid gap-3 sm:grid-cols-3">
            <Summary label="Total leases" value={leases.length} />
            <Summary label="Active" value={activeCount} />
            <Summary label="Pending" value={pendingCount} />
          </section>

          {leases.length ? (
            <ul className="mt-6 space-y-3">
              {leases.map((lease) => (
                <li key={lease.id}>
                  <LeaseCard lease={lease} />
                </li>
              ))}
            </ul>
          ) : (
            <section className="mt-7 rounded-2xl border border-dashed border-[#cad8ce] bg-white p-8 text-center">
              <h2 className="text-lg font-semibold">No leases yet</h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#738078]">
                Create a lease to connect a tenant with a unit and record the agreement details.
              </p>
              <Link
                className="mt-5 inline-flex h-11 items-center justify-center rounded-full bg-[#1d5745] px-5 text-sm font-semibold text-white"
                href="/leases/new"
              >
                Create your first lease
              </Link>
            </section>
          )}
        </div>
      </main>
    </WorkspaceShell>
  );
}

function Summary({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-[#e2e8e2] bg-white p-5">
      <p className="text-sm text-[#738078]">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-[#25342e]">{value}</p>
    </div>
  );
}

function LeaseCard({ lease }: { lease: Lease }) {
  return (
    <Link
      className="block rounded-2xl border border-[#e2e8e2] bg-white p-5 transition hover:border-[#b8c9bc] hover:shadow-sm sm:flex sm:items-center sm:justify-between sm:gap-6"
      href={`/leases/${encodeURIComponent(lease.id)}`}
    >
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="font-semibold text-[#25342e]">{lease.tenant.fullName}</h2>
          <StatusBadge status={lease.status} />
        </div>
        <p className="mt-1 text-sm text-[#738078]">
          {lease.unit.property.name} · Unit {lease.unit.unitNumber}
        </p>
        <p className="mt-1 text-xs text-[#738078]">
          {formatDate(lease.startDate)} – {lease.endDate ? formatDate(lease.endDate) : "Ongoing"}
        </p>
      </div>
      <div className="mt-4 text-left sm:mt-0 sm:text-right">
        <p className="font-semibold text-[#1d5745]">{formatCurrency(lease.monthlyRent)}/mo</p>
        <p className="mt-1 text-xs font-medium text-[#52735c]">View lease →</p>
      </div>
    </Link>
  );
}

function StatusBadge({ status }: { status: Lease["status"] }) {
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
      {status.toLowerCase()}
    </span>
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

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeZone: "UTC" }).format(
    new Date(value),
  );
}
