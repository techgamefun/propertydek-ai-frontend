"use client";

import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { use, useState, type FormEvent } from "react";
import WorkspaceShell from "../../components/WorkspaceShell";
import {
  addMaintenanceComment,
  assignMaintenanceTechnician,
  createMaintenanceTechnician,
  deleteMaintenanceDocument,
  getMaintenanceDocumentDownloadUrl,
  getMaintenanceOptions,
  getMaintenanceRequest,
  unassignMaintenanceTechnician,
  updateMaintenanceRequest,
  uploadMaintenanceDocument,
  type MaintenancePriority,
  type MaintenanceStatus,
} from "../../lib/maintenance";

const fieldClass = "w-full rounded-xl border border-[#dce3de] bg-white px-3 py-2.5 text-sm text-[#25342e] outline-none focus:border-[#52735c]";

export default function MaintenanceDetailClient({
  params,
}: {
  params: Promise<{ requestId: string }>;
}) {
  const { requestId } = use(params);
  const queryClient = useQueryClient();
  const requestQuery = useQuery({
    queryKey: ["maintenance-request", requestId],
    queryFn: () => getMaintenanceRequest(requestId),
    enabled: Boolean(requestId),
  });
  const optionsQuery = useQuery({
    queryKey: ["maintenance-options"],
    queryFn: getMaintenanceOptions,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function refresh() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["maintenance-request", requestId] }),
      queryClient.invalidateQueries({ queryKey: ["maintenance"] }),
      queryClient.invalidateQueries({ queryKey: ["maintenance-options"] }),
      queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
    ]);
  }

  async function runAction(action: () => Promise<unknown>, successMessage: string) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await action();
      await refresh();
      setNotice(successMessage);
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "The action could not be completed.");
    } finally {
      setBusy(false);
    }
  }

  async function saveRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const scheduled = String(form.get("scheduledAt") ?? "");
    await runAction(
      () => updateMaintenanceRequest(requestId, {
        title: String(form.get("title") ?? ""),
        description: String(form.get("description") ?? ""),
        category: String(form.get("category") ?? "") || null,
        priority: String(form.get("priority")) as MaintenancePriority,
        status: String(form.get("status")) as MaintenanceStatus,
        scheduledAt: scheduled ? new Date(scheduled).toISOString() : null,
      }),
      "Maintenance request updated.",
    );
  }

  async function submitComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const body = String(new FormData(form).get("body") ?? "");
    await runAction(async () => {
      await addMaintenanceComment(requestId, body);
      form.reset();
    }, "Update added.");
  }

  async function addTechnician(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    await runAction(async () => {
      await createMaintenanceTechnician({
        fullName: String(values.get("fullName") ?? ""),
        email: String(values.get("email") ?? ""),
        phone: String(values.get("phone") ?? ""),
        specialties: String(values.get("specialties") ?? "")
          .split(",")
          .map((specialty) => specialty.trim())
          .filter(Boolean),
      });
      form.reset();
    }, "Technician added to your workspace.");
  }

  async function attachDocument(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const selectedFile = new FormData(form).get("document");
    if (!(selectedFile instanceof File) || selectedFile.size === 0) {
      setError("Choose a document to upload.");
      return;
    }
    await runAction(async () => {
      await uploadMaintenanceDocument(requestId, selectedFile);
      form.reset();
    }, "Document uploaded.");
  }

  async function downloadDocument(documentId: string) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const { downloadUrl } = await getMaintenanceDocumentDownloadUrl(requestId, documentId);
      window.location.assign(downloadUrl);
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "The document could not be downloaded.");
    } finally {
      setBusy(false);
    }
  }

  if (requestQuery.isLoading || optionsQuery.isLoading) {
    return (
      <WorkspaceShell>
        <main className="flex min-h-screen items-center justify-center text-sm text-[#68756f]">
          Loading maintenance request...
        </main>
      </WorkspaceShell>
    );
  }
  if (requestQuery.isError || optionsQuery.isError || !requestQuery.data || !optionsQuery.data) {
    const loadError = requestQuery.error ?? optionsQuery.error;
    return (
      <WorkspaceShell>
        <main className="flex min-h-screen items-center justify-center px-6 text-[#17231f]">
          <section className="max-w-lg rounded-3xl border border-[#e1e7e1] bg-white p-8">
            <h1 className="text-2xl font-semibold">Request could not be loaded</h1>
            <p className="mt-3 text-sm leading-6 text-[#68756f]" role="alert">
              {loadError instanceof Error ? loadError.message : "Please try again."}
            </p>
            <Link className="mt-5 inline-block text-sm font-semibold text-[#1d5745]" href="/maintenance">
              Back to maintenance
            </Link>
          </section>
        </main>
      </WorkspaceShell>
    );
  }

  const request = requestQuery.data.request;
  const assignments = request.assignments.filter((assignment) => assignment.status !== "CANCELLED");
  const assignedTechnicianIds = new Set(assignments.map((assignment) => assignment.technician.id));
  const availableTechnicians = optionsQuery.data.technicians.filter(
    (technician) => !assignedTechnicianIds.has(technician.id),
  );

  return (
    <WorkspaceShell>
      <main className="min-h-screen bg-[#f7f8f6] px-5 py-8 text-[#17231f] sm:px-8 sm:py-12">
        <div className="mx-auto max-w-5xl">
          <Link className="text-sm font-semibold text-[#52735c] hover:underline" href="/maintenance">
            ← Maintenance
          </Link>
          <header className="mt-5 flex flex-col gap-4 border-b border-[#e2e8e2] pb-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.17em] text-[#65806e]">
                {request.property.name}{request.unit ? ` · Unit ${request.unit.unitNumber}` : ""}
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">{request.title}</h1>
              <p className="mt-2 text-sm text-[#738078]">
                Reported {formatDate(request.requestedAt)}
                {request.tenant ? ` by ${request.tenant.fullName}` : ""}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge value={request.status} />
              <Badge value={request.priority} />
            </div>
          </header>

          {(error || notice) && (
            <p className={`mt-5 rounded-xl p-3 text-sm ${error ? "bg-[#fff0ee] text-[#a12a21]" : "bg-[#e9f4eb] text-[#326440]"}`} role={error ? "alert" : "status"}>
              {error || notice}
            </p>
          )}

          <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(280px,0.8fr)]">
            <div className="space-y-5">
              <section className="rounded-2xl border border-[#e2e8e2] bg-white p-5 sm:p-7">
                <h2 className="text-lg font-semibold">Request details</h2>
                <form className="mt-5 space-y-4" onSubmit={(event) => void saveRequest(event)}>
                  <Field label="Title">
                    <input className={fieldClass} defaultValue={request.title} maxLength={200} name="title" required />
                  </Field>
                  <Field label="Description">
                    <textarea className={`${fieldClass} min-h-32`} defaultValue={request.description} maxLength={10000} name="description" required />
                  </Field>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Category">
                      <input className={fieldClass} defaultValue={request.category ?? ""} maxLength={80} name="category" />
                    </Field>
                    <Field label="Priority">
                      <select className={fieldClass} defaultValue={request.priority} name="priority">
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                        <option value="URGENT">Urgent</option>
                      </select>
                    </Field>
                    <Field label="Status">
                      <select className={fieldClass} defaultValue={request.status} name="status">
                        <option value="OPEN">Open</option>
                        <option value="IN_PROGRESS">In progress</option>
                        <option value="ON_HOLD">On hold</option>
                        <option value="COMPLETED">Completed</option>
                        <option value="CANCELLED">Cancelled</option>
                      </select>
                    </Field>
                    <Field label="Scheduled for">
                      <input
                        className={fieldClass}
                        defaultValue={toLocalInputValue(request.scheduledAt)}
                        name="scheduledAt"
                        type="datetime-local"
                      />
                    </Field>
                  </div>
                  <button className="h-10 rounded-full bg-[#1d5745] px-5 text-sm font-semibold text-white disabled:opacity-60" disabled={busy} type="submit">
                    {busy ? "Saving..." : "Save request"}
                  </button>
                </form>
              </section>

              <section className="rounded-2xl border border-[#e2e8e2] bg-white p-5 sm:p-7">
                <h2 className="text-lg font-semibold">Updates</h2>
                <form className="mt-4" onSubmit={(event) => void submitComment(event)}>
                  <label className="block space-y-2 text-sm font-medium text-[#52645a]">
                    Add an update
                    <textarea className={`${fieldClass} mt-2 min-h-24`} maxLength={5000} name="body" placeholder="Share progress or details..." required />
                  </label>
                  <button className="mt-3 h-10 rounded-full border border-[#dce3de] px-5 text-sm font-semibold text-[#1d5745] disabled:opacity-60" disabled={busy} type="submit">
                    Post update
                  </button>
                </form>
                <ol className="mt-6 space-y-4 border-t border-[#e2e8e2] pt-5">
                  {request.comments?.length ? request.comments.map((comment) => (
                    <li className="border-b border-[#edf0ed] pb-4 last:border-0" key={comment.id}>
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-[#25342e]">
                          {comment.authorUser?.fullName ?? comment.authorTenant?.fullName ?? "Workspace user"}
                          {comment.isInternal && <span className="ml-2 text-xs font-medium text-[#87610d]">Internal note</span>}
                        </p>
                        <time className="text-xs text-[#738078]" dateTime={comment.createdAt}>{formatDateTime(comment.createdAt)}</time>
                      </div>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#52645a]">{comment.body}</p>
                    </li>
                  )) : (
                    <li className="text-sm text-[#738078]">No updates yet. Add the first note above.</li>
                  )}
                </ol>
              </section>

              <section className="rounded-2xl border border-[#e2e8e2] bg-white p-5 sm:p-7">
                <h2 className="text-lg font-semibold">Documents</h2>
                <form className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center" onSubmit={(event) => void attachDocument(event)}>
                  <label className="min-w-0 flex-1 text-sm text-[#52645a]">
                    Attach a file
                    <input
                      className="mt-2 block w-full text-sm file:mr-3 file:rounded-full file:border-0 file:bg-[#e9f4eb] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-[#1d5745]"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      name="document"
                      required
                      type="file"
                    />
                    <span className="mt-1 block text-xs text-[#738078]">PDF, DOC, DOCX, JPG, or PNG · up to 15 MB</span>
                  </label>
                  <button className="h-10 shrink-0 rounded-full bg-[#1d5745] px-5 text-sm font-semibold text-white disabled:opacity-60" disabled={busy} type="submit">
                    Upload
                  </button>
                </form>
                {request.documents?.length ? (
                  <ul className="mt-5 divide-y divide-[#edf0ed] border-t border-[#e2e8e2]">
                    {request.documents.map((document) => (
                      <li className="flex items-center justify-between gap-3 py-3" key={document.id}>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-[#25342e]">{document.name}</p>
                          <p className="mt-1 text-xs text-[#738078]">
                            {document.uploadedBy?.fullName ?? "Workspace user"} · {formatDate(document.createdAt)}
                            {document.sizeBytes ? ` · ${formatBytes(Number(document.sizeBytes))}` : ""}
                          </p>
                        </div>
                        <div className="flex shrink-0 gap-3">
                          <button className="text-xs font-semibold text-[#1d5745] disabled:opacity-50" disabled={busy} onClick={() => void downloadDocument(document.id)} type="button">
                            Download
                          </button>
                          <button
                            className="text-xs font-semibold text-[#a12a21] disabled:opacity-50"
                            disabled={busy}
                            onClick={() => {
                              if (window.confirm(`Delete ${document.name}?`)) {
                                void runAction(
                                  () => deleteMaintenanceDocument(requestId, document.id),
                                  "Document deleted.",
                                );
                              }
                            }}
                            type="button"
                          >
                            Delete
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-4 text-sm text-[#738078]">No documents attached.</p>
                )}
              </section>
            </div>

            <aside className="space-y-5">
              <section className="rounded-2xl border border-[#e2e8e2] bg-white p-5">
                <h2 className="text-lg font-semibold">Technicians</h2>
                {assignments.length ? (
                  <ul className="mt-4 space-y-3">
                    {assignments.map((assignment) => (
                      <li className="flex items-start justify-between gap-3 rounded-xl bg-[#f7f8f6] p-3" key={assignment.id}>
                        <div>
                          <p className="text-sm font-semibold text-[#25342e]">{assignment.technician.fullName}</p>
                          <p className="mt-1 text-xs text-[#738078]">
                            {assignment.technician.specialties.join(", ") || assignment.technician.email || "Assigned"}
                          </p>
                        </div>
                        <button
                          className="text-xs font-semibold text-[#a12a21] disabled:opacity-50"
                          disabled={busy}
                          onClick={() => void runAction(
                            () => unassignMaintenanceTechnician(requestId, assignment.id),
                            "Technician unassigned.",
                          )}
                          type="button"
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-sm text-[#738078]">No technicians assigned yet.</p>
                )}
                {availableTechnicians.length > 0 && (
                  <form
                    className="mt-4 flex gap-2"
                    onSubmit={(event) => {
                      event.preventDefault();
                      const technicianId = String(new FormData(event.currentTarget).get("technicianId") ?? "");
                      void runAction(
                        () => assignMaintenanceTechnician(requestId, technicianId),
                        "Technician assigned.",
                      );
                    }}
                  >
                    <label className="sr-only" htmlFor="assign-technician">Assign technician</label>
                    <select className={`${fieldClass} min-w-0`} id="assign-technician" name="technicianId" required>
                      <option value="">Select technician</option>
                      {availableTechnicians.map((technician) => (
                        <option key={technician.id} value={technician.id}>{technician.fullName}</option>
                      ))}
                    </select>
                    <button className="shrink-0 rounded-full bg-[#1d5745] px-4 text-sm font-semibold text-white disabled:opacity-60" disabled={busy} type="submit">
                      Assign
                    </button>
                  </form>
                )}
                {availableTechnicians.length === 0 && (
                  <p className="mt-4 text-xs leading-5 text-[#738078]">
                    Add a technician below to enable assignments.
                  </p>
                )}
              </section>

              <TechnicianForm busy={busy} onSubmit={addTechnician} />

              <section className="rounded-2xl border border-[#e2e8e2] bg-white p-5">
                <h2 className="text-sm font-semibold text-[#25342e]">Schedule</h2>
                <p className="mt-2 text-sm text-[#738078]">
                  {request.scheduledAt ? formatDateTime(request.scheduledAt) : "Not scheduled"}
                </p>
                {request.completedAt && (
                  <p className="mt-2 text-xs text-[#326440]">Completed {formatDateTime(request.completedAt)}</p>
                )}
              </section>
            </aside>
          </div>
        </div>
      </main>
    </WorkspaceShell>
  );
}

function TechnicianForm({
  busy,
  onSubmit,
}: {
  busy: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
}) {
  return (
    <details className="rounded-2xl border border-[#e2e8e2] bg-white p-5">
      <summary className="cursor-pointer text-sm font-semibold text-[#25342e]">Add a technician</summary>
      <form className="mt-4 space-y-3" onSubmit={(event) => void onSubmit(event)}>
        <label className="block space-y-1 text-xs font-medium text-[#52645a]">
          Name
          <input className={fieldClass} maxLength={160} name="fullName" required />
        </label>
        <label className="block space-y-1 text-xs font-medium text-[#52645a]">
          Email (optional)
          <input className={fieldClass} maxLength={320} name="email" type="email" />
        </label>
        <label className="block space-y-1 text-xs font-medium text-[#52645a]">
          Phone (optional)
          <input className={fieldClass} maxLength={40} name="phone" type="tel" />
        </label>
        <label className="block space-y-1 text-xs font-medium text-[#52645a]">
          Specialties (comma-separated)
          <input className={fieldClass} maxLength={500} name="specialties" placeholder="Plumbing, electrical" />
        </label>
        <button className="h-10 rounded-full border border-[#dce3de] px-4 text-sm font-semibold text-[#1d5745] disabled:opacity-60" disabled={busy} type="submit">
          Save technician
        </button>
      </form>
    </details>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-2 text-sm font-medium text-[#52645a]">
      {label}
      {children}
    </label>
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
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${color}`}>
      {value.toLowerCase().replaceAll("_", " ")}
    </span>
  );
}

function toLocalInputValue(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(value));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
