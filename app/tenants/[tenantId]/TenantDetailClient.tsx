"use client";

import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Children, useState, type ReactNode } from "react";
import { ApiRequestError } from "../../lib/onboarding";
import {
  deleteTenant,
  getTenant,
  updateTenant,
  type TenantValues,
} from "../../lib/tenants";
import TenantFormFields from "../TenantForm";

export default function TenantDetailClient() {
  const { tenantId } = useParams<{ tenantId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const tenantQuery = useQuery({
    queryKey: ["tenant", tenantId],
    queryFn: () => getTenant(tenantId),
    enabled: Boolean(tenantId),
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (tenantQuery.isLoading) {
    return <main className="flex min-h-screen items-center justify-center text-sm text-[#68756f]">Loading tenant...</main>;
  }
  if (tenantQuery.isError || !tenantQuery.data) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6 text-[#17231f]">
        <section className="max-w-lg rounded-3xl border border-[#e1e7e1] bg-white p-8">
          <h1 className="text-2xl font-semibold">Tenant could not be loaded</h1>
          <p className="mt-3 text-sm leading-6 text-[#68756f]" role="alert">
            {tenantQuery.error instanceof Error ? tenantQuery.error.message : "Please try again."}
          </p>
          <Link className="mt-5 inline-flex text-sm font-semibold text-[#1d5745]" href="/tenants">
            Return to tenants
          </Link>
        </section>
      </main>
    );
  }

  const tenant = tenantQuery.data.tenant;
  async function submit(
    values: TenantValues,
    avatarFile: File | null,
    removeAvatar: boolean,
  ) {
    setBusy(true);
    setError("");
    try {
      await updateTenant(tenantId, values, avatarFile, removeAvatar);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["tenant", tenantId] }),
        queryClient.invalidateQueries({ queryKey: ["tenants"] }),
        queryClient.invalidateQueries({ queryKey: ["leases"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
      ]);
    } catch (actionError) {
      setError(
        actionError instanceof ApiRequestError
          ? actionError.message
          : "The tenant could not be updated.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function removeTenant() {
    if (!window.confirm(`Delete ${tenant.fullName}? This cannot be undone.`)) {
      return;
    }
    setBusy(true);
    setError("");
    try {
      await deleteTenant(tenantId);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["tenants"] }),
        queryClient.invalidateQueries({ queryKey: ["leases"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
      ]);
      router.push("/tenants");
    } catch (actionError) {
      setError(
        actionError instanceof ApiRequestError
          ? actionError.message
          : "The tenant could not be deleted.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
      <main className="min-h-screen bg-[#f7f8f6] px-5 py-8 text-[#17231f] sm:px-8 sm:py-12">
        <div className="mx-auto max-w-5xl">
          <Link className="text-sm font-semibold text-[#52735c] hover:underline" href="/tenants">
            ← Tenants
          </Link>
          <header className="mt-6 border-b border-[#e2e8e2] pb-6">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#e7efe8] text-lg font-semibold text-[#52735c]">
                {tenant.avatarUrl ? (
                  <Image
                    alt={`${tenant.fullName} profile photo`}
                    className="h-full w-full object-cover"
                    height={64}
                    src={tenant.avatarUrl}
                    unoptimized
                    width={64}
                  />
                ) : (
                  getInitials(tenant.fullName)
                )}
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.17em] text-[#65806e]">
                  Tenant profile
                </p>
                <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">{tenant.fullName}</h1>
                <p className="mt-2 text-sm text-[#738078]">
                  {tenant.email ?? "No email"}{tenant.phone ? ` · ${tenant.phone}` : ""}
                </p>
              </div>
            </div>
          </header>

          <section className="mt-6 rounded-2xl border border-[#e2e8e2] bg-white p-6">
            <h2 className="text-lg font-semibold">Contact details</h2>
            <p className="mt-1 text-sm text-[#738078]">
              Update the tenant profile used by leases and maintenance records.
            </p>
            {error && (
              <p className="mt-5 rounded-xl border border-[#f1c7c4] bg-[#fff5f4] px-4 py-3 text-sm text-[#a12a21]" role="alert">
                {error}
              </p>
            )}
            <TenantEditForm
              key={tenant.updatedAt}
              tenant={tenant}
              busy={busy}
              onSubmit={submit}
            />
            <div className="mt-6 border-t border-[#edf0ec] pt-5">
              {tenant.leases.length > 0 ? (
                <p className="text-sm text-[#738078]">
                  This tenant has lease history and cannot be deleted.
                </p>
              ) : (
                <button
                  className="text-sm font-semibold text-[#a12a21] hover:underline disabled:opacity-60"
                  disabled={busy}
                  onClick={() => void removeTenant()}
                  type="button"
                >
                  Delete tenant
                </button>
              )}
            </div>
          </section>

          <section className="mt-6 grid gap-6 lg:grid-cols-2">
            <HistorySection title="Lease history" empty="No leases are associated with this tenant.">
              {tenant.leases.map((lease) => (
                <li className="py-4" key={lease.id}>
                  <Link className="font-semibold text-[#1d5745] hover:underline" href={`/leases/${encodeURIComponent(lease.id)}`}>
                    {lease.unit.property.name} · Unit {lease.unit.unitNumber}
                  </Link>
                  <p className="mt-1 text-xs text-[#738078]">
                    {lease.status.toLowerCase()} · {formatDate(lease.startDate)} – {lease.endDate ? formatDate(lease.endDate) : "Ongoing"}
                  </p>
                </li>
              ))}
            </HistorySection>
            <HistorySection title="Maintenance history" empty="No maintenance requests are associated with this tenant.">
              {tenant.maintenanceRequests.map((request) => (
                <li className="py-4" key={request.id}>
                  <Link className="font-semibold text-[#1d5745] hover:underline" href={`/maintenance/${encodeURIComponent(request.id)}`}>
                    {request.title}
                  </Link>
                  <p className="mt-1 text-xs text-[#738078]">
                    {request.property.name}{request.unit ? ` · Unit ${request.unit.unitNumber}` : ""} · {request.status.toLowerCase()}
                  </p>
                </li>
              ))}
            </HistorySection>
          </section>
        </div>
      </main>
  );
}

function HistorySection({
  title,
  empty,
  children,
}: {
  title: string;
  empty: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-[#e2e8e2] bg-white p-6">
      <h2 className="text-lg font-semibold">{title}</h2>
      {Children.count(children) > 0 ? (
        <ul className="mt-2 divide-y divide-[#edf0ec]">{children}</ul>
      ) : (
        <p className="mt-4 rounded-xl bg-[#f7f8f6] p-4 text-sm text-[#68756f]">{empty}</p>
      )}
    </section>
  );
}

function valuesForTenant(tenant: {
  fullName: string;
  email: string | null;
  phone: string | null;
  emergencyContact: string | null;
  emergencyPhone: string | null;
  notes: string | null;
}): TenantValues {
  return {
    fullName: tenant.fullName,
    email: tenant.email ?? "",
    phone: tenant.phone ?? "",
    emergencyContact: tenant.emergencyContact ?? "",
    emergencyPhone: tenant.emergencyPhone ?? "",
    notes: tenant.notes ?? "",
  };
}

function TenantEditForm({
  tenant,
  busy,
  onSubmit,
}: {
  tenant: {
    fullName: string;
    avatarUrl: string | null;
    email: string | null;
    phone: string | null;
    emergencyContact: string | null;
    emergencyPhone: string | null;
    notes: string | null;
  };
  busy: boolean;
  onSubmit: (
    values: TenantValues,
    avatarFile: File | null,
    removeAvatar: boolean,
  ) => void;
}) {
  const [values, setValues] = useState(() => valuesForTenant(tenant));
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [removeAvatar, setRemoveAvatar] = useState(false);
  return (
    <TenantFormFields
      avatarFile={avatarFile}
      avatarUrl={tenant.avatarUrl}
      busy={busy}
      onAvatarChange={(file) => {
        setAvatarFile(file);
        setRemoveAvatar(false);
      }}
      onChange={(field, value) => setValues((current) => ({ ...current, [field]: value }))}
      onCancelRemove={() => setRemoveAvatar(false)}
      onRemoveAvatar={() => {
        setAvatarFile(null);
        setRemoveAvatar(true);
      }}
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(values, avatarFile, removeAvatar);
      }}
      removeAvatar={removeAvatar}
      submitLabel="Save changes"
      values={values}
    />
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeZone: "UTC" }).format(
    new Date(value),
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
