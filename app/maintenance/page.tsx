"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import WorkspaceShell from "../components/WorkspaceShell";
import {
  getMaintenanceOptions,
  getMaintenanceRequests,
  type MaintenancePriority,
  type MaintenanceStatus,
} from "../lib/maintenance";

const statuses: Array<{ value: MaintenanceStatus | "ALL"; label: string }> = [
  { value: "ALL", label: "All requests" },
  { value: "OPEN", label: "Open" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "ON_HOLD", label: "On hold" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
];

export default function MaintenancePage() {
  const [status, setStatus] = useState<MaintenanceStatus | "ALL">("ALL");
  const [priority, setPriority] = useState<MaintenancePriority | "ALL">("ALL");
  const [propertyId, setPropertyId] = useState("ALL");
  const requestsQuery = useQuery({
    queryKey: ["maintenance", status, priority, propertyId],
    queryFn: () => getMaintenanceRequests({ status, priority, propertyId }),
  });
  const optionsQuery = useQuery({
    queryKey: ["maintenance-options"],
    queryFn: getMaintenanceOptions,
  });

  if (requestsQuery.isLoading || optionsQuery.isLoading) {
    return (
      <WorkspaceShell>
        <main className="flex min-h-screen items-center justify-center text-sm text-[#68756f]">
          Loading maintenance...
        </main>
      </WorkspaceShell>
    );
  }
  if (requestsQuery.isError || optionsQuery.isError || !requestsQuery.data || !optionsQuery.data) {
    const error = requestsQuery.error ?? optionsQuery.error;
    return (
      <WorkspaceShell>
        <main className="flex min-h-screen items-center justify-center px-6 text-[#17231f]">
          <section className="max-w-lg rounded-3xl border border-[#e1e7e1] bg-white p-8">
            <h1 className="text-2xl font-semibold">Maintenance could not be loaded</h1>
            <p className="mt-3 text-sm leading-6 text-[#68756f]" role="alert">
              {error instanceof Error ? error.message : "Please try again."}
            </p>
          </section>
        </main>
      </WorkspaceShell>
    );
  }

  const requests = requestsQuery.data.requests;
  const urgentCount = requests.filter(
    (request) => request.priority === "URGENT" && !["COMPLETED", "CANCELLED"].includes(request.status),
  ).length;
  const activeCount = requests.filter(
    (request) => ["OPEN", "IN_PROGRESS", "ON_HOLD"].includes(request.status),
  ).length;

  return (
    <WorkspaceShell>
      <main className="min-h-screen px-5 py-8 text-[#17231f] sm:px-8 sm:py-12">
        <div className="mx-auto max-w-6xl">
          <header className="flex flex-col gap-5 border-b border-[#e2e8e2] pb-7 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.17em] text-[#65806e]">
                Operations
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">Maintenance</h1>
              <p className="mt-2 text-sm text-[#738078]">
                Track repairs, coordinate technicians, and keep every request moving.
              </p>
            </div>
            <Link
              className="inline-flex h-11 items-center justify-center rounded-full bg-[#1d5745] px-5 text-sm font-semibold text-white transition hover:bg-[#174737]"
              href="/maintenance/new"
            >
              New request
            </Link>
          </header>

          <section aria-label="Maintenance summary" className="mt-6 grid gap-3 sm:grid-cols-3">
            <Summary label="Requests shown" value={requests.length} />
            <Summary label="Active" value={activeCount} />
            <Summary label="Urgent" value={urgentCount} />
          </section>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <div aria-label="Filter by status" className="flex flex-wrap gap-2">
              {statuses.map((item) => (
                <button
                  aria-pressed={status === item.value}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    status === item.value
                      ? "bg-[#1d5745] text-white"
                      : "border border-[#dce3de] bg-white text-[#52645a] hover:bg-[#f4f7f3]"
                  }`}
                  key={item.value}
                  onClick={() => setStatus(item.value)}
                  type="button"
                >
                  {item.label}
                </button>
              ))}
            </div>
            <div className="flex gap-3 sm:ml-auto">
              <label className="sr-only" htmlFor="maintenance-priority">Filter by priority</label>
              <select
                className="h-10 rounded-xl border border-[#dce3de] bg-white px-3 text-sm"
                id="maintenance-priority"
                onChange={(event) => setPriority(event.target.value as MaintenancePriority | "ALL")}
                value={priority}
              >
                <option value="ALL">Every priority</option>
                <option value="URGENT">Urgent</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
              <label className="sr-only" htmlFor="maintenance-property">Filter by property</label>
              <select
                className="h-10 max-w-48 rounded-xl border border-[#dce3de] bg-white px-3 text-sm"
                id="maintenance-property"
                onChange={(event) => setPropertyId(event.target.value)}
                value={propertyId}
              >
                <option value="ALL">Every property</option>
                {optionsQuery.data.properties.map((property) => (
                  <option key={property.id} value={property.id}>{property.name}</option>
                ))}
              </select>
            </div>
          </div>

          {requests.length ? (
            <ul className="mt-5 space-y-3">
              {requests.map((request) => (
                <li key={request.id}>
                  <Link
                    className="block rounded-2xl border border-[#e2e8e2] bg-white p-5 transition hover:border-[#b8c9bc] hover:shadow-sm sm:flex sm:items-center sm:justify-between sm:gap-6"
                    href={`/maintenance/${encodeURIComponent(request.id)}`}
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-semibold text-[#25342e]">{request.title}</h2>
                        <Badge value={request.status} />
                        <Badge value={request.priority} />
                      </div>
                      <p className="mt-1 truncate text-sm text-[#738078]">
                        {request.property.name}
                        {request.unit ? ` · Unit ${request.unit.unitNumber}` : ""}
                        {request.tenant ? ` · ${request.tenant.fullName}` : ""}
                      </p>
                      <p className="mt-2 line-clamp-2 text-sm text-[#52645a]">{request.description}</p>
                    </div>
                    <div className="mt-4 shrink-0 text-left sm:mt-0 sm:text-right">
                      <p className="text-xs text-[#738078]">Reported {formatDate(request.requestedAt)}</p>
                      <p className="mt-1 text-sm font-medium text-[#1d5745]">
                        {request.assignments.map((assignment) => assignment.technician.fullName).join(", ") ||
                          (request._count?.comments ? `${request._count.comments} updates` : "Unassigned")}
                        {" →"}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <section className="mt-5 rounded-2xl border border-dashed border-[#cad8ce] bg-white p-8 text-center">
              <h2 className="text-lg font-semibold">No maintenance requests found</h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#738078]">
                Create a request to document a repair, schedule work, and assign a technician.
              </p>
              <Link
                className="mt-5 inline-flex h-11 items-center justify-center rounded-full bg-[#1d5745] px-5 text-sm font-semibold text-white"
                href="/maintenance/new"
              >
                Create a request
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

function Badge({ value }: { value: string }) {
  const color =
    value === "URGENT" || value === "CANCELLED"
      ? "bg-[#fff0ee] text-[#a12a21]"
      : value === "HIGH" || value === "IN_PROGRESS"
        ? "bg-[#fff4dc] text-[#87610d]"
        : value === "COMPLETED" || value === "LOW"
          ? "bg-[#e9f4eb] text-[#326440]"
          : value === "ON_HOLD"
            ? "bg-[#f0effa] text-[#59518c]"
            : "bg-[#eaf2f8] text-[#315d7a]";
  return (
    <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${color}`}>
      {value.toLowerCase().replaceAll("_", " ")}
    </span>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(value));
}
