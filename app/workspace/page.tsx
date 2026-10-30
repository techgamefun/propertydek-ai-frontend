"use client";

import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import {
  ApiRequestError,
  getCurrentOrganization,
  updateOrganization,
  type Organization,
} from "../lib/onboarding";
import WorkspaceShell from "../components/WorkspaceShell";

export default function WorkspaceSettingsPage() {
  const workspace = useQuery({
    queryKey: ["current-organization"],
    queryFn: getCurrentOrganization,
  });

  if (workspace.isLoading) {
    return (
      <WorkspaceShell>
        <Loading />
      </WorkspaceShell>
    );
  }
  if (workspace.isError || !workspace.data) {
    return (
      <WorkspaceShell>
      <main className="flex min-h-screen items-center justify-center bg-[#f7f8f6] px-6 text-[#17231f]">
        <section className="max-w-lg rounded-3xl border border-[#e1e7e1] bg-white p-8">
          <h1 className="text-2xl font-semibold">Workspace not available</h1>
          <p className="mt-3 text-sm text-[#68756f]" role="alert">
            {workspace.error instanceof Error
              ? workspace.error.message
              : "Please sign in and try again."}
          </p>
        </section>
      </main>
      </WorkspaceShell>
    );
  }

  return (
    <WorkspaceShell>
      <WorkspaceForm organization={workspace.data.organization} />
    </WorkspaceShell>
  );
}

function WorkspaceForm({ organization }: { organization: Organization }) {
  const queryClient = useQueryClient();
  const [values, setValues] = useState({
    name: organization.name,
    countryCode: organization.countryCode ?? "",
    timezone: organization.timezone ?? "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const inputClass =
    "mt-2 h-12 w-full rounded-xl border border-[#dce3de] bg-white px-4 text-[15px] outline-none focus:border-[#527e69] focus:ring-4 focus:ring-[#527e69]/10";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setSaved(false);
    try {
      await updateOrganization(organization.id, values);
      await queryClient.invalidateQueries({ queryKey: ["current-organization"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      setSaved(true);
    } catch (actionError) {
      setError(
        actionError instanceof ApiRequestError
          ? actionError.message
          : "Workspace details could not be saved.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f8f6] px-5 py-10 text-[#17231f] sm:px-8">
      <div className="mx-auto max-w-3xl">
        <Link className="text-sm font-semibold text-[#52735c] hover:underline" href="/dashboard">
          ← Dashboard
        </Link>
        <section className="mt-6 rounded-3xl border border-[#e1e7e1] bg-white p-6 shadow-sm sm:p-9">
          <p className="text-xs font-semibold uppercase tracking-[0.17em] text-[#65806e]">
            Workspace settings
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">
            Workspace details
          </h1>
          <p className="mt-3 text-sm leading-6 text-[#68756f]">
            Keep your workspace name and regional settings up to date.
          </p>
          {error && <Notice message={error} success={false} />}
          {saved && <Notice message="Workspace details saved." success />}
          <form className="mt-7 space-y-5" onSubmit={submit}>
            <label className="block text-sm font-medium text-[#25342e]">
              Workspace name
              <input
                className={inputClass}
                maxLength={160}
                onChange={(event) => setValues({ ...values, name: event.target.value })}
                required
                value={values.name}
              />
            </label>
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block text-sm font-medium text-[#25342e]">
                Country code
                <input
                  className={inputClass}
                  maxLength={2}
                  onChange={(event) =>
                    setValues({
                      ...values,
                      countryCode: event.target.value.toUpperCase(),
                    })
                  }
                  required
                  value={values.countryCode}
                />
              </label>
              <label className="block text-sm font-medium text-[#25342e]">
                Timezone
                <input
                  className={inputClass}
                  onChange={(event) =>
                    setValues({ ...values, timezone: event.target.value })
                  }
                  required
                  value={values.timezone}
                />
              </label>
            </div>
            <button
              className="h-12 rounded-xl bg-[#1d5745] px-6 text-sm font-semibold text-white disabled:opacity-60"
              disabled={busy}
              type="submit"
            >
              {busy ? "Saving..." : "Save changes"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}

function Notice({ message, success }: { message: string; success: boolean }) {
  return (
    <p
      className={`mt-5 rounded-xl border px-4 py-3 text-sm ${
        success
          ? "border-[#b7d9c3] bg-[#f0f8f2] text-[#28583b]"
          : "border-[#f1c7c4] bg-[#fff5f4] text-[#a12a21]"
      }`}
      role={success ? "status" : "alert"}
    >
      {message}
    </p>
  );
}

function Loading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f8f6] text-sm text-[#68756f]">
      Loading workspace...
    </main>
  );
}
