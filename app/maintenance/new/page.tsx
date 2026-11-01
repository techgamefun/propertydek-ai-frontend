"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import WorkspaceShell from "../../components/WorkspaceShell";
import {
  createMaintenanceRequest,
  getMaintenanceOptions,
  type MaintenancePriority,
} from "../../lib/maintenance";

export default function NewMaintenanceRequestPage() {
  const router = useRouter();
  const optionsQuery = useQuery({
    queryKey: ["maintenance-options"],
    queryFn: getMaintenanceOptions,
  });
  const [propertyId, setPropertyId] = useState("");
  const [unitId, setUnitId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState<MaintenancePriority>("MEDIUM");
  const [scheduledAt, setScheduledAt] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const properties = optionsQuery.data?.properties ?? [];
  const selectedProperty = properties.find((property) => property.id === propertyId);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const { request } = await createMaintenanceRequest({
        propertyId,
        unitId: unitId || null,
        title,
        description,
        category,
        priority,
        scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : null,
      });
      router.push(`/maintenance/${encodeURIComponent(request.id)}`);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "The request could not be created.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <WorkspaceShell>
      <main className="min-h-screen px-5 py-8 text-[#17231f] sm:px-8 sm:py-12">
        <div className="mx-auto max-w-3xl">
          <Link className="text-sm font-semibold text-[#52735c] hover:underline" href="/maintenance">
            ← Maintenance
          </Link>
          <header className="mt-5 border-b border-[#e2e8e2] pb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.17em] text-[#65806e]">Operations</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">New maintenance request</h1>
            <p className="mt-2 text-sm text-[#738078]">
              Capture the issue and location. You can assign a technician and add updates after saving.
            </p>
          </header>

          {optionsQuery.isLoading ? (
            <p className="py-10 text-sm text-[#68756f]">Loading properties...</p>
          ) : optionsQuery.isError ? (
            <p className="mt-6 rounded-xl bg-[#fff0ee] p-4 text-sm text-[#a12a21]" role="alert">
              {optionsQuery.error instanceof Error ? optionsQuery.error.message : "Properties could not be loaded."}
            </p>
          ) : properties.length === 0 ? (
            <section className="mt-6 rounded-2xl border border-dashed border-[#cad8ce] bg-white p-8 text-center">
              <h2 className="text-lg font-semibold">Add a property first</h2>
              <p className="mt-2 text-sm text-[#738078]">A maintenance request must be linked to one of your properties.</p>
              <Link className="mt-5 inline-flex rounded-full bg-[#1d5745] px-5 py-3 text-sm font-semibold text-white" href="/properties/new">
                Add property
              </Link>
            </section>
          ) : (
            <form className="mt-7 space-y-5 rounded-2xl border border-[#e2e8e2] bg-white p-5 sm:p-7" onSubmit={(event) => void submit(event)}>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Property">
                  <select
                    className={inputClass}
                    onChange={(event) => {
                      setPropertyId(event.target.value);
                      setUnitId("");
                    }}
                    required
                    value={propertyId}
                  >
                    <option value="">Select a property</option>
                    {properties.map((property) => <option key={property.id} value={property.id}>{property.name}</option>)}
                  </select>
                </Field>
                <Field label="Unit (optional)">
                  <select
                    className={inputClass}
                    disabled={!propertyId || !selectedProperty?.units.length}
                    onChange={(event) => setUnitId(event.target.value)}
                    value={unitId}
                  >
                    <option value="">Property-wide / no specific unit</option>
                    {selectedProperty?.units.map((unit) => (
                      <option key={unit.id} value={unit.id}>Unit {unit.unitNumber}</option>
                    ))}
                  </select>
                </Field>
              </div>
              <Field label="Request title">
                <input className={inputClass} maxLength={200} onChange={(event) => setTitle(event.target.value)} required value={title} />
              </Field>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Category (optional)">
                  <input className={inputClass} maxLength={80} onChange={(event) => setCategory(event.target.value)} placeholder="Plumbing, electrical..." value={category} />
                </Field>
                <Field label="Priority">
                  <select className={inputClass} onChange={(event) => setPriority(event.target.value as MaintenancePriority)} value={priority}>
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </Field>
              </div>
              <Field label="Describe the issue">
                <textarea className={`${inputClass} min-h-32`} maxLength={10000} onChange={(event) => setDescription(event.target.value)} required value={description} />
              </Field>
              <Field label="Schedule for (optional)">
                <input className={inputClass} onChange={(event) => setScheduledAt(event.target.value)} type="datetime-local" value={scheduledAt} />
              </Field>
              {error && <p className="rounded-xl bg-[#fff0ee] p-3 text-sm text-[#a12a21]" role="alert">{error}</p>}
              <div className="flex flex-col-reverse gap-3 border-t border-[#e2e8e2] pt-5 sm:flex-row sm:justify-end">
                <Link className="inline-flex h-11 items-center justify-center rounded-full border border-[#dce3de] px-5 text-sm font-semibold text-[#52645a]" href="/maintenance">
                  Cancel
                </Link>
                <button className="h-11 rounded-full bg-[#1d5745] px-5 text-sm font-semibold text-white disabled:opacity-60" disabled={busy} type="submit">
                  {busy ? "Creating..." : "Create request"}
                </button>
              </div>
            </form>
          )}
        </div>
      </main>
    </WorkspaceShell>
  );
}

const inputClass = "w-full rounded-xl border border-[#dce3de] bg-white px-3 py-2.5 text-sm text-[#25342e] outline-none focus:border-[#52735c]";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-2 text-sm font-medium text-[#52645a]">
      {label}
      {children}
    </label>
  );
}
