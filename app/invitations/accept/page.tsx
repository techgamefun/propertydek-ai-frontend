"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { acceptInvitation, ApiRequestError } from "../../lib/onboarding";

export default function AcceptInvitationPage() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [accepted, setAccepted] = useState(false);

  async function accept() {
    setBusy(true);
    setMessage("");
    try {
      const token = new URLSearchParams(window.location.search).get("token") ?? "";
      if (!token) {
        setMessage("This invitation link is missing its token.");
        return;
      }
      await acceptInvitation(token);
      setAccepted(true);
      setMessage("Invitation accepted. You now have access to the workspace.");
      router.push("/dashboard");
    } catch (error) {
      setMessage(
        error instanceof ApiRequestError
          ? error.message
          : "The invitation could not be accepted.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f8f6] px-5 py-10 text-[#17231f]">
      <section className="w-full max-w-lg rounded-3xl border border-[#e1e7e1] bg-white p-7 shadow-sm sm:p-9">
        <Link className="text-lg font-semibold tracking-tight text-[#153d32]" href="/">
          PropertyDek
        </Link>
        <p className="mt-8 text-xs font-semibold uppercase tracking-[0.17em] text-[#65806e]">
          Workspace invitation
        </p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">
          Join your team
        </h1>
        <p className="mt-3 text-sm leading-6 text-[#68756f]">
          Accept this invitation using the account associated with the invited email address.
        </p>
        {message && (
          <p
            className={`mt-5 rounded-xl px-4 py-3 text-sm leading-6 ${
              accepted
                ? "border border-[#b7d9c3] bg-[#f0f8f2] text-[#28583b]"
                : "border border-[#f1c7c4] bg-[#fff5f4] text-[#a12a21]"
            }`}
            role={accepted ? "status" : "alert"}
          >
            {message}
          </p>
        )}
        {!accepted && (
          <>
            <button
              className="mt-7 h-12 w-full rounded-xl bg-[#1d5745] px-5 text-sm font-semibold text-white transition hover:bg-[#174737] disabled:cursor-not-allowed disabled:opacity-60"
              disabled={busy}
              onClick={() => void accept()}
              type="button"
            >
              {busy ? "Accepting invitation..." : "Accept invitation"}
            </button>
            <p className="mt-5 text-center text-sm text-[#738078]">
              Need to sign in first?{" "}
              <Link className="font-semibold text-[#1d5745] hover:underline" href="/login">
                Sign in
              </Link>
              , then return to this invitation link.
            </p>
          </>
        )}
      </section>
    </main>
  );
}
