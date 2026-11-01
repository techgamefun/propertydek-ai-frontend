"use client";

import Link from "next/link";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import WorkspaceShell from "../components/WorkspaceShell";
import { getTenants } from "../lib/tenants";

export default function TenantsPage() {
  const [search, setSearch] = useState("");
  const tenantsQuery = useQuery({
    queryKey: ["tenants", search],
    queryFn: () => getTenants(search.trim()),
  });

  if (tenantsQuery.isLoading) {
    return (
      <WorkspaceShell>
        <main className="flex min-h-screen items-center justify-center text-sm text-[#68756f]">
          Loading tenants...
        </main>
      </WorkspaceShell>
    );
  }

  if (tenantsQuery.isError || !tenantsQuery.data) {
    return (
      <WorkspaceShell>
        <main className="flex min-h-screen items-center justify-center px-6 text-[#17231f]">
          <section className="max-w-lg rounded-3xl border border-[#e1e7e1] bg-white p-8">
            <h1 className="text-2xl font-semibold">Tenants could not be loaded</h1>
            <p className="mt-3 text-sm leading-6 text-[#68756f]" role="alert">
              {tenantsQuery.error instanceof Error
                ? tenantsQuery.error.message
                : "Please try again."}
            </p>
          </section>
        </main>
      </WorkspaceShell>
    );
  }

  const tenants = tenantsQuery.data.tenants;
  return (
    <WorkspaceShell>
      <main className="min-h-screen px-5 py-8 text-[#17231f] sm:px-8 sm:py-12">
        <div className="mx-auto max-w-6xl">
          <header className="flex flex-col gap-5 border-b border-[#e2e8e2] pb-7 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.17em] text-[#65806e]">
                Portfolio
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">Tenants</h1>
              <p className="mt-2 text-sm text-[#738078]">
                Manage tenant contact details, emergency contacts, and tenancy history.
              </p>
            </div>
            <Link
              className="inline-flex h-11 items-center justify-center rounded-full bg-[#1d5745] px-5 text-sm font-semibold text-white transition hover:bg-[#174737]"
              href="/tenants/new"
            >
              Add tenant
            </Link>
          </header>

          <section aria-label="Tenant summary" className="mt-6 grid gap-3 sm:grid-cols-3">
            <Summary label="Total tenants" value={tenants.length} />
            <Summary
              label="With leases"
              value={tenants.filter((tenant) => tenant._count.leases > 0).length}
            />
            <Summary
              label="Maintenance requests"
              value={tenants.reduce(
                (total, tenant) => total + tenant._count.maintenanceRequests,
                0,
              )}
            />
          </section>

          <label className="mt-6 block max-w-xl text-sm font-medium text-[#25342e]">
            Search tenants
            <input
              className="mt-2 h-11 w-full rounded-xl border border-[#dce3de] bg-white px-4 text-sm outline-none focus:border-[#527e69] focus:ring-4 focus:ring-[#527e69]/10"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Name, email, or phone"
              type="search"
              value={search}
            />
          </label>

          {tenants.length ? (
            <ul className="mt-6 grid gap-3 md:grid-cols-2">
              {tenants.map((tenant) => (
                <li key={tenant.id}>
                  <Link
                    className="block h-full rounded-2xl border border-[#e2e8e2] bg-white p-5 transition hover:border-[#b8c9bc] hover:shadow-sm"
                    href={`/tenants/${encodeURIComponent(tenant.id)}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#e7efe8] text-sm font-semibold text-[#52735c]">
                          {tenant.avatarUrl ? (
                            <Image
                              alt={`${tenant.fullName} profile photo`}
                              className="h-full w-full object-cover"
                              height={48}
                              src={tenant.avatarUrl}
                              unoptimized
                              width={48}
                            />
                          ) : (
                            getInitials(tenant.fullName)
                          )}
                        </div>
                        <div className="min-w-0">
                          <h2 className="truncate font-semibold text-[#25342e]">{tenant.fullName}</h2>
                          <p className="mt-1 text-sm text-[#738078]">
                            {tenant.email ?? tenant.phone ?? "No contact details"}
                          </p>
                        </div>
                      </div>
                      <span className="rounded-full bg-[#f0f5ef] px-2.5 py-1 text-[11px] font-medium text-[#52735c]">
                        {tenant._count.leases} {tenant._count.leases === 1 ? "lease" : "leases"}
                      </span>
                    </div>
                    <p className="mt-4 text-sm font-semibold text-[#1d5745]">
                      View tenant <span aria-hidden="true">→</span>
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          ) : search.trim() ? (
            <section className="mt-7 rounded-2xl border border-dashed border-[#cad8ce] bg-white p-8 text-center">
              <h2 className="text-lg font-semibold">No matching tenants</h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#738078]">
                Try another name, email address, or phone number.
              </p>
            </section>
          ) : (
            <section className="mt-7 rounded-2xl border border-dashed border-[#cad8ce] bg-white p-8 text-center">
              <h2 className="text-lg font-semibold">No tenants yet</h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#738078]">
                Add a tenant to keep their contact details and tenancy history in one place.
              </p>
              <Link
                className="mt-5 inline-flex h-11 items-center justify-center rounded-full bg-[#1d5745] px-5 text-sm font-semibold text-white"
                href="/tenants/new"
              >
                Add your first tenant
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

function getInitials(fullName: string) {
  return fullName
    .trim()
    .split(/\s+/u)
    .slice(0, 2)
    .map((part) => part[0] ?? "")
    .join("")
    .toUpperCase();
}
