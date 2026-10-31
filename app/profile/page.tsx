"use client";

import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import {
  ApiRequestError,
  getCurrentUser,
  updateCurrentUser,
  type UserProfile,
} from "../lib/onboarding";
import WorkspaceShell from "../components/WorkspaceShell";

export default function ProfilePage() {
  const profile = useQuery({
    queryKey: ["current-user"],
    queryFn: getCurrentUser,
  });

  if (profile.isLoading) {
    return (
      <WorkspaceShell>
        <Loading />
      </WorkspaceShell>
    );
  }
  if (profile.isError || !profile.data) {
    return (
      <WorkspaceShell>
        <main className="flex min-h-screen items-center justify-center bg-[#f7f8f6] px-6 text-[#17231f]">
          <section className="max-w-lg rounded-3xl border border-[#e1e7e1] bg-white p-8">
            <h1 className="text-2xl font-semibold">Profile unavailable</h1>
            <p className="mt-3 text-sm text-[#68756f]" role="alert">
              {profile.error instanceof Error
                ? profile.error.message
                : "Please sign in and try again."}
            </p>
          </section>
        </main>
      </WorkspaceShell>
    );
  }

  return (
    <WorkspaceShell>
      <ProfileForm user={profile.data.user} />
    </WorkspaceShell>
  );
}

function ProfileForm({ user }: { user: UserProfile }) {
  const queryClient = useQueryClient();
  const [values, setValues] = useState({
    fullName: user.fullName,
    phone: user.phone ?? "",
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
      const result = await updateCurrentUser(values);
      queryClient.setQueryData(["current-user"], result);
      setValues({
        fullName: result.user.fullName,
        phone: result.user.phone ?? "",
      });
      setSaved(true);
    } catch (actionError) {
      setError(
        actionError instanceof ApiRequestError
          ? actionError.message
          : "Profile details could not be saved.",
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
            Account settings
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">
            My profile
          </h1>
          <p className="mt-3 text-sm leading-6 text-[#68756f]">
            View your account details and keep your contact information up to date.
          </p>
          {error && <Notice message={error} success={false} />}
          {saved && <Notice message="Profile details saved." success />}
          <form className="mt-7 space-y-5" onSubmit={submit}>
            <label className="block text-sm font-medium text-[#25342e]">
              Full name
              <input
                autoComplete="name"
                className={inputClass}
                maxLength={160}
                onChange={(event) =>
                  setValues({ ...values, fullName: event.target.value })
                }
                required
                value={values.fullName}
              />
            </label>
            <label className="block text-sm font-medium text-[#25342e]">
              Email address
              <input
                autoComplete="email"
                className={`${inputClass} cursor-not-allowed bg-[#f7f8f6] text-[#68756f]`}
                readOnly
                type="email"
                value={user.email}
              />
              <span className="mt-1 block text-xs font-normal text-[#738078]">
                Email changes are not available from profile settings.
              </span>
            </label>
            <label className="block text-sm font-medium text-[#25342e]">
              Phone number
              <input
                autoComplete="tel"
                className={inputClass}
                maxLength={40}
                onChange={(event) =>
                  setValues({ ...values, phone: event.target.value })
                }
                type="tel"
                value={values.phone}
              />
            </label>
            <button
              className="h-12 rounded-xl bg-[#1d5745] px-6 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
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
      Loading profile...
    </main>
  );
}
