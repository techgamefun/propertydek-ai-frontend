"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ApiRequestError } from "../../lib/onboarding";
import { createTenant, type TenantValues } from "../../lib/tenants";
import WorkspaceShell from "../../components/WorkspaceShell";
import TenantForm from "../TenantForm";

const EMPTY_VALUES: TenantValues = {
  fullName: "",
  email: "",
  phone: "",
  emergencyContact: "",
  emergencyPhone: "",
  notes: "",
};

export default function NewTenantPage() {
  const router = useRouter();
  const [values, setValues] = useState(EMPTY_VALUES);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = await createTenant(values);
      router.push(`/tenants/${encodeURIComponent(result.tenant.id)}`);
    } catch (actionError) {
      setError(
        actionError instanceof ApiRequestError
          ? actionError.message
          : "The tenant could not be created.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <WorkspaceShell>
      <main className="min-h-screen bg-[#f7f8f6] px-5 py-10 text-[#17231f] sm:px-8">
        <div className="mx-auto max-w-3xl">
          <Link className="text-sm font-semibold text-[#52735c] hover:underline" href="/tenants">
            ← Tenants
          </Link>
          <section className="mt-6 rounded-3xl border border-[#e1e7e1] bg-white p-6 shadow-sm sm:p-9">
            <p className="text-xs font-semibold uppercase tracking-[0.17em] text-[#65806e]">
              Tenant directory
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">Add a tenant</h1>
            <p className="mt-3 text-sm leading-6 text-[#68756f]">
              Save contact and emergency details for future leases and maintenance requests.
            </p>
            {error && <ErrorBanner message={error} />}
            <TenantForm
              busy={busy}
              onChange={(field, value) => setValues({ ...values, [field]: value })}
              onSubmit={submit}
              submitLabel="Create tenant"
              values={values}
            />
          </section>
        </div>
      </main>
    </WorkspaceShell>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <p className="mt-5 rounded-xl border border-[#f1c7c4] bg-[#fff5f4] px-4 py-3 text-sm text-[#a12a21]" role="alert">
      {message}
    </p>
  );
}
