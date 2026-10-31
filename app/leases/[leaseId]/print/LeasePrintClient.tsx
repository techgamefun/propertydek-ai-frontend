"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { getLease } from "../../../lib/leases";

export default function LeasePrintPage() {
  const { leaseId } = useParams<{ leaseId: string }>();
  const leaseQuery = useQuery({
    queryKey: ["lease", leaseId],
    queryFn: () => getLease(leaseId),
    enabled: Boolean(leaseId),
  });

  if (leaseQuery.isLoading) {
    return <main className="p-8 text-sm text-[#68756f]">Preparing lease summary...</main>;
  }
  if (leaseQuery.isError || !leaseQuery.data) {
    return (
      <main className="mx-auto max-w-3xl p-8 text-[#17231f]">
        <h1 className="text-2xl font-semibold">Lease summary unavailable</h1>
        <p className="mt-3 text-sm text-[#68756f]" role="alert">
          {leaseQuery.error instanceof Error
            ? leaseQuery.error.message
            : "Please try again."}
        </p>
      </main>
    );
  }

  const { lease } = leaseQuery.data;
  return (
    <main className="min-h-screen bg-white px-6 py-10 text-[#17231f] print:px-0 print:py-0">
      <article className="mx-auto max-w-3xl">
        <div className="mb-8 flex items-center justify-between print:hidden">
          <p className="text-sm text-[#68756f]">Printable lease summary</p>
          <button
            className="rounded-full bg-[#1d5745] px-5 py-2.5 text-sm font-semibold text-white"
            onClick={() => window.print()}
            type="button"
          >
            Print / save as PDF
          </button>
        </div>
        <header className="border-b-2 border-[#1d5745] pb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.17em] text-[#65806e]">
            PropertyDek · Lease record
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">Lease summary</h1>
          <p className="mt-2 text-sm text-[#68756f]">
            Status: {titleCase(lease.status)} · Prepared {new Date().toLocaleDateString()}
          </p>
        </header>

        <section className="grid gap-8 border-b border-[#e2e8e2] py-7 sm:grid-cols-2">
          <SummaryGroup title="Property and unit">
            <p className="font-semibold">{lease.unit.property.name}</p>
            <p>Unit {lease.unit.unitNumber}</p>
            {lease.unit.property.addressLine1 && <p>{lease.unit.property.addressLine1}</p>}
            {lease.unit.property.city && <p>{lease.unit.property.city}</p>}
          </SummaryGroup>
          <SummaryGroup title="Tenant">
            <p className="font-semibold">{lease.tenant.fullName}</p>
            {lease.tenant.email && <p>{lease.tenant.email}</p>}
            {lease.tenant.phone && <p>{lease.tenant.phone}</p>}
          </SummaryGroup>
        </section>

        <section className="grid gap-8 border-b border-[#e2e8e2] py-7 sm:grid-cols-2">
          <SummaryGroup title="Lease term">
            <p>Start: {formatDate(lease.startDate)}</p>
            <p>End: {lease.endDate ? formatDate(lease.endDate) : "Ongoing / not specified"}</p>
          </SummaryGroup>
          <SummaryGroup title="Payment details">
            <p>Monthly rent: {formatCurrency(lease.monthlyRent)}</p>
            <p>Security deposit: {formatCurrency(lease.securityDeposit)}</p>
            <p>Rent due day: {lease.rentDueDay} of each month</p>
            {lease.lateFee !== null && <p>Late fee: {formatCurrency(lease.lateFee)}</p>}
          </SummaryGroup>
        </section>

        <section className="border-b border-[#e2e8e2] py-7">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[#52735c]">
            Additional terms and notes
          </h2>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-7">
            {lease.terms || "No additional terms or notes recorded."}
          </p>
        </section>

        <section className="border-b border-[#e2e8e2] py-7">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[#52735c]">
            Important notice
          </h2>
          <p className="mt-3 text-sm leading-7 text-[#68756f]">
            This document is a summary of information entered in PropertyDek. It is not a
            jurisdiction-specific lease agreement, legal advice, proof of signature, or an
            electronically signed document. Have the terms reviewed and use a configured
            e-signature provider for execution.
          </p>
        </section>

        <footer className="pt-6 text-xs text-[#738078]">
          Lease record ID: {lease.id}
        </footer>
      </article>
    </main>
  );
}

function SummaryGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-[#52735c]">{title}</h2>
      <div className="space-y-1 text-sm leading-6">{children}</div>
    </div>
  );
}

function titleCase(value: string) {
  return value.charAt(0) + value.slice(1).toLowerCase();
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
  return new Intl.DateTimeFormat(undefined, { dateStyle: "long", timeZone: "UTC" }).format(
    new Date(value),
  );
}
