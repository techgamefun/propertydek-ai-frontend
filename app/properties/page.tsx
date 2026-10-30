"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { getProperties } from "../lib/onboarding";
import WorkspaceShell from "../components/WorkspaceShell";

export default function PropertiesPage() {
  const properties = useQuery({
    queryKey: ["properties"],
    queryFn: getProperties,
  });

  if (properties.isLoading) {
    return (
      <WorkspaceShell>
        <Loading />
      </WorkspaceShell>
    );
  }

  if (properties.isError || !properties.data) {
    return (
      <WorkspaceShell>
        <main className="flex min-h-screen items-center justify-center px-6 text-[#17231f]">
          <section className="max-w-lg rounded-3xl border border-[#e1e7e1] bg-white p-8">
            <h1 className="text-2xl font-semibold">Properties could not be loaded</h1>
            <p className="mt-3 text-sm leading-6 text-[#68756f]" role="alert">
              {properties.error instanceof Error
                ? properties.error.message
                : "Please try again."}
            </p>
          </section>
        </main>
      </WorkspaceShell>
    );
  }

  return (
    <WorkspaceShell>
      <main className="min-h-screen px-5 py-8 text-[#17231f] sm:px-8 sm:py-12">
        <div className="mx-auto max-w-6xl">
          <header className="flex flex-col gap-5 border-b border-[#e2e8e2] pb-7 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.17em] text-[#65806e]">
                Portfolio
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">
                Properties
              </h1>
              <p className="mt-2 text-sm text-[#738078]">
                Manage your properties and their units.
              </p>
            </div>
            <Link
              className="inline-flex h-11 items-center justify-center rounded-full bg-[#1d5745] px-5 text-sm font-semibold text-white transition hover:bg-[#174737]"
              href="/properties/new"
            >
              Add property
            </Link>
          </header>

          {properties.data.properties.length ? (
            <ul className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {properties.data.properties.map((property) => (
                <li key={property.id}>
                  <Link
                    className="block h-full rounded-2xl border border-[#e2e8e2] bg-white p-6 transition hover:-translate-y-0.5 hover:border-[#b8c9bc] hover:shadow-sm"
                    href={`/properties/${encodeURIComponent(property.id)}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h2 className="font-semibold text-[#25342e]">{property.name}</h2>
                      <span className="rounded-full bg-[#f0f5ef] px-2.5 py-1 text-[11px] font-medium text-[#52735c]">
                        {property.type.toLowerCase().replace("_", " ")}
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-[#738078]">
                      {property.addressLine1}, {property.city}
                    </p>
                    <p className="mt-5 text-sm font-semibold text-[#1d5745]">
                      Manage property <span aria-hidden="true">→</span>
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <section className="mt-7 rounded-2xl border border-dashed border-[#cad8ce] bg-white p-8 text-center">
              <h2 className="text-lg font-semibold">Your portfolio starts here</h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#738078]">
                Add a property to start organizing addresses, units, and occupancy.
              </p>
              <Link
                className="mt-5 inline-flex h-11 items-center justify-center rounded-full bg-[#1d5745] px-5 text-sm font-semibold text-white"
                href="/properties/new"
              >
                Add your first property
              </Link>
            </section>
          )}
        </div>
      </main>
    </WorkspaceShell>
  );
}

function Loading() {
  return (
    <main className="flex min-h-screen items-center justify-center text-sm text-[#68756f]">
      Loading properties...
    </main>
  );
}
