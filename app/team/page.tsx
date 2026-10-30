"use client";

import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import {
  ApiRequestError,
  cancelInvitation,
  createInvitations,
  getCurrentOrganization,
  listInvitations,
  type Invitation,
  type MembershipRole,
} from "../lib/onboarding";
import WorkspaceShell from "../components/WorkspaceShell";

type IssuedInvitation = Invitation & { token: string };

export default function TeamPage() {
  const queryClient = useQueryClient();
  const team = useQuery({
    queryKey: ["team-invitations"],
    queryFn: async () => {
      const current = await getCurrentOrganization();
      const result = await listInvitations(current.organization.id);
      return {
        organization: current.organization,
        role: current.role,
        invitations: result.invitations,
      };
    },
  });
  const [emails, setEmails] = useState("");
  const [role, setRole] = useState<MembershipRole>("PROPERTY_MANAGER");
  const [issued, setIssued] = useState<IssuedInvitation[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const canInvite =
    team.data?.role === "OWNER" || team.data?.role === "ADMIN";

  async function sendInvitations(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!team.data) {
      return;
    }
    const addresses = emails
      .split(/[,\n]/u)
      .map((email) => email.trim())
      .filter(Boolean);
    if (addresses.length < 1 || addresses.length > 20) {
      setError("Enter between 1 and 20 email addresses.");
      return;
    }

    setBusy(true);
    setError("");
    setNotice("");
    try {
      const result = await createInvitations(
        team.data.organization.id,
        addresses.map((email) => ({ email, role })),
      );
      setIssued(
        result.invitations.map((invitation) => ({
          ...invitation,
          status: "PENDING",
        })),
      );
      setEmails("");
      setNotice("Invitations created. Share each one-time link securely.");
      await queryClient.invalidateQueries({ queryKey: ["team-invitations"] });
    } catch (actionError) {
      setError(
        actionError instanceof ApiRequestError
          ? actionError.message
          : "Invitations could not be created.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function revoke(invitationId: string) {
    if (!team.data) {
      return;
    }
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await cancelInvitation(team.data.organization.id, invitationId);
      setNotice("Pending invitation canceled.");
      await queryClient.invalidateQueries({ queryKey: ["team-invitations"] });
    } catch (actionError) {
      setError(
        actionError instanceof ApiRequestError
          ? actionError.message
          : "The invitation could not be canceled.",
      );
    } finally {
      setBusy(false);
    }
  }

  if (team.isLoading) {
    return (
      <WorkspaceShell>
        <Loading />
      </WorkspaceShell>
    );
  }
  if (team.isError || !team.data) {
    return (
      <WorkspaceShell>
      <main className="flex min-h-screen items-center justify-center bg-[#f7f8f6] px-6 text-[#17231f]">
        <section className="max-w-lg rounded-3xl border border-[#e1e7e1] bg-white p-8">
          <h1 className="text-2xl font-semibold">Team details unavailable</h1>
          <p className="mt-3 text-sm text-[#68756f]" role="alert">
            {team.error instanceof Error
              ? team.error.message
              : "Please sign in and try again."}
          </p>
        </section>
      </main>
      </WorkspaceShell>
    );
  }

  return (
    <WorkspaceShell>
    <main className="min-h-screen bg-[#f7f8f6] px-5 py-8 text-[#17231f] sm:px-8 sm:py-12">
      <div className="mx-auto max-w-5xl">
        <Link className="text-sm font-semibold text-[#52735c] hover:underline" href="/dashboard">
          ← Dashboard
        </Link>
        <header className="mt-6">
          <p className="text-xs font-semibold uppercase tracking-[0.17em] text-[#65806e]">
            {team.data.organization.name}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">
            Team invitations
          </h1>
          <p className="mt-2 text-sm text-[#738078]">
            Invite colleagues and manage their workspace access.
          </p>
        </header>

        {(error || notice) && (
          <p
            className={`mt-6 rounded-xl border px-4 py-3 text-sm ${
              error
                ? "border-[#f1c7c4] bg-[#fff5f4] text-[#a12a21]"
                : "border-[#b7d9c3] bg-[#f0f8f2] text-[#28583b]"
            }`}
            role={error ? "alert" : "status"}
          >
            {error || notice}
          </p>
        )}

        {canInvite ? (
          <form
            className="mt-7 rounded-2xl border border-[#e2e8e2] bg-white p-6 sm:p-7"
            onSubmit={sendInvitations}
          >
            <h2 className="text-lg font-semibold">Invite teammates</h2>
            <label className="mt-5 block text-sm font-medium text-[#25342e]">
              Email addresses
              <textarea
                className="mt-2 min-h-24 w-full rounded-xl border border-[#dce3de] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#527e69] focus:ring-4 focus:ring-[#527e69]/10"
                onChange={(event) => setEmails(event.target.value)}
                placeholder={"alex@example.com\njordan@example.com"}
                required
                value={emails}
              />
              <span className="mt-1 block text-xs font-normal text-[#738078]">
                Separate addresses with a comma or a new line. Up to 20 invites per request.
              </span>
            </label>
            <label className="mt-4 block max-w-sm text-sm font-medium text-[#25342e]">
              Role for invitees
              <select
                className="mt-2 h-11 w-full rounded-xl border border-[#dce3de] bg-white px-3 text-sm outline-none focus:border-[#527e69] focus:ring-4 focus:ring-[#527e69]/10"
                onChange={(event) => setRole(event.target.value as MembershipRole)}
                value={role}
              >
                <option value="PROPERTY_MANAGER">Property manager</option>
                <option value="ADMIN">Admin</option>
                <option value="ACCOUNTANT">Accountant</option>
                <option value="MAINTENANCE">Maintenance</option>
                <option value="VIEWER">Viewer</option>
              </select>
            </label>
            <button
              className="mt-5 h-11 rounded-xl bg-[#1d5745] px-5 text-sm font-semibold text-white disabled:opacity-60"
              disabled={busy}
              type="submit"
            >
              {busy ? "Working..." : "Create invitations"}
            </button>
          </form>
        ) : (
          <p className="mt-7 rounded-2xl border border-[#e2e8e2] bg-white p-6 text-sm leading-6 text-[#68756f]">
            Only workspace owners and admins can create or cancel invitations.
          </p>
        )}

        {issued.length > 0 && (
          <section className="mt-6 rounded-2xl border border-[#cfe0d1] bg-[#f4f8f3] p-6">
            <h2 className="font-semibold text-[#28583b]">One-time invitation links</h2>
            <ul className="mt-4 space-y-4">
              {issued.map((invitation) => (
                <li key={invitation.id}>
                  <p className="text-sm font-medium text-[#365842]">
                    {invitation.email}
                  </p>
                  <a
                    className="mt-1 block break-all text-xs leading-5 text-[#1d5745] underline"
                    href={`${window.location.origin}/invitations/accept?token=${encodeURIComponent(invitation.token)}`}
                  >
                    {`${window.location.origin}/invitations/accept?token=${encodeURIComponent(invitation.token)}`}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="mt-7 rounded-2xl border border-[#e2e8e2] bg-white p-6 sm:p-7">
          <h2 className="text-lg font-semibold">Invitations</h2>
          {team.data.invitations.length > 0 ? (
            <ul className="mt-4 divide-y divide-[#edf0ec]">
              {team.data.invitations.map((invitation) => (
                <li
                  className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
                  key={invitation.id}
                >
                  <div>
                    <p className="font-medium text-[#25342e]">{invitation.email}</p>
                    <p className="mt-1 text-xs text-[#738078]">
                      {invitation.role.replace("_", " ")} · {invitation.status.toLowerCase()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-[#738078]">
                      {invitation.status === "PENDING"
                        ? `Expires ${new Date(invitation.expiresAt).toLocaleDateString()}`
                        : `Accepted ${invitation.acceptedAt ? new Date(invitation.acceptedAt).toLocaleDateString() : ""}`}
                    </span>
                    {canInvite && invitation.status === "PENDING" && (
                      <button
                        className="rounded-full border border-[#e3c9c6] px-3 py-1.5 text-xs font-semibold text-[#a12a21] disabled:opacity-60"
                        disabled={busy}
                        onClick={() => void revoke(invitation.id)}
                        type="button"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-[#738078]">
              No pending or accepted invitations yet.
            </p>
          )}
        </section>
      </div>
    </main>
    </WorkspaceShell>
  );
}

function Loading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f8f6] text-sm text-[#68756f]">
      Loading team...
    </main>
  );
}
