"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import {
  ApiRequestError,
  completeOnboarding,
  completeTeamStep,
  createDemoData,
  createImport,
  createInvitations,
  createOrganization,
  createProperty,
  getOnboardingStatus,
  saveSetupMethod,
  type MembershipRole,
  type SetupMethod,
} from "../lib/onboarding";

const steps = [
  { id: "workspace", label: "Workspace" },
  { id: "setup", label: "Setup method" },
  { id: "property", label: "First property" },
  { id: "team", label: "Team" },
] as const;

export default function OnboardingPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const status = useQuery({
    queryKey: ["onboarding-status"],
    queryFn: getOnboardingStatus,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [workspace, setWorkspace] = useState({
    name: "",
    countryCode: "US",
    timezone: "America/Los_Angeles",
  });
  const [setupMethod, setSetupMethod] = useState<SetupMethod>("fresh");
  const [fileName, setFileName] = useState("");
  const [importNotice, setImportNotice] = useState("");
  const [property, setProperty] = useState({
    name: "",
    type: "APARTMENT",
    addressLine1: "",
    city: "",
    region: "",
    postalCode: "",
  });
  const [invite, setInvite] = useState({
    email: "",
    role: "PROPERTY_MANAGER" as MembershipRole,
  });
  const [invitationLink, setInvitationLink] = useState("");

  const currentStep = status.data?.currentStep ?? "workspace";
  const visibleStep = currentStep === "complete" ? "team" : currentStep;

  async function runAction(action: () => Promise<unknown>) {
    setBusy(true);
    setError("");
    try {
      await action();
      await queryClient.invalidateQueries({ queryKey: ["onboarding-status"] });
    } catch (actionError) {
      setError(
        actionError instanceof ApiRequestError
          ? actionError.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  function submitWorkspace(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void runAction(() => createOrganization(workspace));
  }

  async function submitSetupMethod() {
    await runAction(async () => {
      await saveSetupMethod(setupMethod);
      if (setupMethod === "demo") {
        await createDemoData();
      }
      if (setupMethod === "import" && fileName.trim()) {
        const result = await createImport(fileName.trim());
        setImportNotice(
          `Import ${result.import.fileName} was recorded (${result.import.status}). Upload and processing are not enabled yet.`,
        );
      }
    });
  }

  function submitProperty(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void runAction(() => createProperty(property));
  }

  async function sendInvitation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const organizationId = status.data?.organization?.id;
    if (!organizationId) {
      setError("Create a workspace before inviting teammates.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const result = await createInvitations(organizationId, [
        { email: invite.email, role: invite.role },
      ]);
      const created = result.invitations[0];
      setInvitationLink(
        `${window.location.origin}/invitations/accept?token=${encodeURIComponent(created.token)}`,
      );
      await queryClient.invalidateQueries({ queryKey: ["onboarding-status"] });
    } catch (actionError) {
      setError(
        actionError instanceof ApiRequestError
          ? actionError.message
          : "The invitation could not be created.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function finishTeam(action: "completed" | "skipped") {
    setBusy(true);
    setError("");
    try {
      await completeTeamStep(action);
      await completeOnboarding();
      await queryClient.invalidateQueries({ queryKey: ["onboarding-status"] });
      router.push("/dashboard");
    } catch (actionError) {
      setError(
        actionError instanceof ApiRequestError
          ? actionError.message
          : "Onboarding could not be completed.",
      );
    } finally {
      setBusy(false);
    }
  }

  if (status.isLoading) {
    return <LoadingPage />;
  }

  if (status.isError) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f8f6] px-6 text-[#17231f]">
        <section className="w-full max-w-lg rounded-3xl border border-[#e1e7e1] bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#557368]">
            Get started
          </p>
          <h1 className="mt-3 text-2xl font-semibold">Sign in to continue</h1>
          <p className="mt-3 text-sm leading-6 text-[#68756f]">
            {status.error instanceof Error
              ? status.error.message
              : "Your session could not be verified."}
          </p>
          <Link
            className="mt-6 inline-flex rounded-full bg-[#1d5745] px-5 py-3 text-sm font-semibold text-white"
            href="/login"
          >
            Go to sign in
          </Link>
        </section>
      </main>
    );
  }

  if (status.data?.completed) {
    router.replace("/dashboard");
    return <LoadingPage />;
  }

  return (
    <main className="min-h-screen bg-[#f7f8f6] px-5 py-8 text-[#17231f] sm:px-8 sm:py-12">
      <div className="mx-auto max-w-5xl">
        <header className="flex items-center justify-between">
          <Link className="text-lg font-semibold tracking-tight text-[#153d32]" href="/">
            PropertyDek
          </Link>
          <span className="text-sm text-[#738078]">A few quick steps</span>
        </header>

        <div className="mt-10 grid gap-8 lg:grid-cols-[250px_1fr] lg:gap-14">
          <aside>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#65806e]">
              Workspace setup
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">
              Let’s make this yours.
            </h1>
            <ol className="mt-8 space-y-3">
              {steps.map((step, index) => {
                const active = step.id === visibleStep;
                const stepKey =
                  step.id === "setup" ? "setupMethod" : step.id;
                const completed = Boolean(status.data?.steps[stepKey]);
                return (
                  <li
                    className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm ${
                      active
                        ? "bg-[#e7efe4] font-semibold text-[#1d5745]"
                        : "text-[#7b8781]"
                    }`}
                    key={step.id}
                  >
                    <span
                      className={`flex h-7 w-7 items-center justify-center rounded-full text-xs ${
                        completed
                          ? "bg-[#1d5745] text-white"
                          : active
                            ? "border border-[#8eaa96] bg-white"
                            : "border border-[#dce3de]"
                      }`}
                    >
                      {completed ? "✓" : index + 1}
                    </span>
                    {step.label}
                  </li>
                );
              })}
            </ol>
          </aside>

          <section className="rounded-3xl border border-[#e1e7e1] bg-white p-6 shadow-[0_14px_45px_rgba(27,54,39,0.05)] sm:p-9">
            {error && <ErrorBanner message={error} />}

            {currentStep === "workspace" && (
              <>
                <StepHeading
                  eyebrow="Step 1 of 4"
                  title="Create your workspace"
                  description="Start with the name and location your team will recognize."
                />
                <form className="mt-8 space-y-5" onSubmit={submitWorkspace}>
                  <TextField
                    label="Workspace name"
                    value={workspace.name}
                    onChange={(name) => setWorkspace({ ...workspace, name })}
                    placeholder="e.g. Northstar Properties"
                    required
                  />
                  <div className="grid gap-5 sm:grid-cols-2">
                    <TextField
                      label="Country code"
                      value={workspace.countryCode}
                      onChange={(countryCode) =>
                        setWorkspace({ ...workspace, countryCode: countryCode.toUpperCase() })
                      }
                      placeholder="US"
                      maxLength={2}
                      required
                    />
                    <TextField
                      label="Timezone"
                      value={workspace.timezone}
                      onChange={(timezone) => setWorkspace({ ...workspace, timezone })}
                      placeholder="America/Los_Angeles"
                      required
                    />
                  </div>
                  <PrimaryButton busy={busy} text="Create workspace" />
                </form>
              </>
            )}

            {currentStep === "setup" && (
              <>
                <StepHeading
                  eyebrow="Step 2 of 4"
                  title="Choose how to get started"
                  description="Pick the option that best matches where your portfolio is today."
                />
                <div className="mt-7 space-y-3">
                  <SetupOption
                    value="fresh"
                    selected={setupMethod === "fresh"}
                    onSelect={setSetupMethod}
                    title="Start fresh"
                    detail="Add your properties and units one at a time."
                  />
                  <SetupOption
                    value="import"
                    selected={setupMethod === "import"}
                    onSelect={setSetupMethod}
                    title="Import existing data"
                    detail="Save an import request for a future CSV upload."
                  />
                  <SetupOption
                    value="demo"
                    selected={setupMethod === "demo"}
                    onSelect={setSetupMethod}
                    title="Explore with demo data"
                    detail="Create a sample property, unit, lease, and maintenance record."
                  />
                </div>
                {setupMethod === "import" && (
                  <div className="mt-5">
                    <TextField
                      label="CSV filename (optional)"
                      value={fileName}
                      onChange={setFileName}
                      placeholder="portfolio.csv"
                    />
                    <p className="mt-2 text-xs leading-5 text-[#738078]">
                      This records the import request only. File upload and CSV processing are not available yet.
                    </p>
                  </div>
                )}
                {importNotice && (
                  <p className="mt-4 rounded-xl bg-[#f2f6ef] px-4 py-3 text-sm text-[#365842]" role="status">
                    {importNotice}
                  </p>
                )}
                <div className="mt-7">
                  <PrimaryButton
                    busy={busy}
                    text={setupMethod === "demo" ? "Create sample data" : "Continue"}
                    onClick={() => void submitSetupMethod()}
                  />
                </div>
              </>
            )}

            {currentStep === "property" && (
              <>
                <StepHeading
                  eyebrow="Step 3 of 4"
                  title="Add your first property"
                  description="You can add units and more property details any time."
                />
                <form className="mt-8 space-y-5" onSubmit={submitProperty}>
                  <div className="grid gap-5 sm:grid-cols-[1fr_180px]">
                    <TextField
                      label="Property name"
                      value={property.name}
                      onChange={(name) => setProperty({ ...property, name })}
                      placeholder="e.g. Cedar Grove Apartments"
                      required
                    />
                    <label className="block text-sm font-medium text-[#25342e]">
                      Property type
                      <select
                        className={inputClass}
                        value={property.type}
                        onChange={(event) =>
                          setProperty({ ...property, type: event.target.value })
                        }
                      >
                        <option value="APARTMENT">Apartment</option>
                        <option value="HOUSE">House</option>
                        <option value="CONDO">Condo</option>
                        <option value="COMMERCIAL">Commercial</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </label>
                  </div>
                  <TextField
                    label="Street address"
                    value={property.addressLine1}
                    onChange={(addressLine1) => setProperty({ ...property, addressLine1 })}
                    placeholder="123 Main Street"
                    required
                  />
                  <div className="grid gap-5 sm:grid-cols-3">
                    <TextField
                      label="City"
                      value={property.city}
                      onChange={(city) => setProperty({ ...property, city })}
                      required
                    />
                    <TextField
                      label="State / region"
                      value={property.region}
                      onChange={(region) => setProperty({ ...property, region })}
                    />
                    <TextField
                      label="Postal code"
                      value={property.postalCode}
                      onChange={(postalCode) => setProperty({ ...property, postalCode })}
                    />
                  </div>
                  <PrimaryButton busy={busy} text="Add property" />
                </form>
              </>
            )}

            {(currentStep === "team" || currentStep === "complete") && (
              <>
                <StepHeading
                  eyebrow="Step 4 of 4"
                  title="Bring your team along"
                  description="Invite a teammate now, or skip this step and do it later."
                />
                <form className="mt-8 space-y-5" onSubmit={sendInvitation}>
                  <TextField
                    label="Teammate email"
                    value={invite.email}
                    onChange={(email) => setInvite({ ...invite, email })}
                    placeholder="teammate@company.com"
                    type="email"
                    required
                  />
                  <label className="block text-sm font-medium text-[#25342e]">
                    Role
                    <select
                      className={inputClass}
                      value={invite.role}
                      onChange={(event) =>
                        setInvite({ ...invite, role: event.target.value as MembershipRole })
                      }
                    >
                      <option value="PROPERTY_MANAGER">Property manager</option>
                      <option value="ADMIN">Admin</option>
                      <option value="ACCOUNTANT">Accountant</option>
                      <option value="MAINTENANCE">Maintenance</option>
                      <option value="VIEWER">Viewer</option>
                    </select>
                  </label>
                  <button
                    className="inline-flex h-11 items-center justify-center rounded-xl border border-[#cad8ce] px-5 text-sm font-semibold text-[#28583b] transition hover:bg-[#f4f8f3] disabled:opacity-60"
                    disabled={busy}
                    type="submit"
                  >
                    {busy ? "Creating invite..." : "Create invitation"}
                  </button>
                </form>
                {invitationLink && (
                  <div className="mt-5 rounded-xl border border-[#cfe0d1] bg-[#f4f8f3] p-4">
                    <p className="text-sm font-semibold text-[#28583b]">
                      Invitation created
                    </p>
                    <p className="mt-2 break-all text-xs leading-5 text-[#53665a]">
                      Share this one-time link securely. Email delivery is not configured.
                    </p>
                    <a
                      className="mt-2 block break-all text-sm text-[#1d5745] underline"
                      href={invitationLink}
                    >
                      {invitationLink}
                    </a>
                  </div>
                )}
                <div className="mt-8 flex flex-col gap-3 border-t border-[#edf0ec] pt-6 sm:flex-row">
                  <PrimaryButton
                    busy={busy}
                    text="Finish setup"
                    onClick={() => void finishTeam("completed")}
                  />
                  <button
                    className="h-12 rounded-xl px-5 text-sm font-semibold text-[#68756f] transition hover:bg-[#f5f7f4] disabled:opacity-60"
                    disabled={busy}
                    onClick={() => void finishTeam("skipped")}
                    type="button"
                  >
                    Skip for now
                  </button>
                </div>
              </>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

const inputClass =
  "mt-2 h-12 w-full rounded-xl border border-[#dce3de] bg-white px-4 text-[15px] outline-none transition focus:border-[#527e69] focus:ring-4 focus:ring-[#527e69]/10";

function TextField({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required = false,
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  maxLength?: number;
}) {
  return (
    <label className="block text-sm font-medium text-[#25342e]">
      {label}
      <input
        className={inputClass}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
        maxLength={maxLength}
      />
    </label>
  );
}

function StepHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.17em] text-[#65806e]">
        {eyebrow}
      </p>
      <h2 className="mt-3 text-2xl font-semibold tracking-[-0.035em] sm:text-3xl">
        {title}
      </h2>
      <p className="mt-3 max-w-xl text-sm leading-6 text-[#68756f]">
        {description}
      </p>
    </div>
  );
}

function SetupOption({
  value,
  selected,
  onSelect,
  title,
  detail,
}: {
  value: SetupMethod;
  selected: boolean;
  onSelect: (value: SetupMethod) => void;
  title: string;
  detail: string;
}) {
  return (
    <button
      className={`flex w-full items-start gap-4 rounded-2xl border p-4 text-left transition ${
        selected
          ? "border-[#7a9c83] bg-[#f5f8f3]"
          : "border-[#e1e7e1] hover:border-[#b8c9bc]"
      }`}
      onClick={() => onSelect(value)}
      type="button"
    >
      <span
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
          selected ? "border-[#1d5745]" : "border-[#bdc8c0]"
        }`}
      >
        {selected && <span className="h-2.5 w-2.5 rounded-full bg-[#1d5745]" />}
      </span>
      <span>
        <span className="block text-sm font-semibold text-[#25342e]">{title}</span>
        <span className="mt-1 block text-sm leading-5 text-[#738078]">{detail}</span>
      </span>
    </button>
  );
}

function PrimaryButton({
  text,
  busy = false,
  onClick,
}: {
  text: string;
  busy?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-[#1d5745] px-5 text-sm font-semibold text-white transition hover:bg-[#174737] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1d5745] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      disabled={busy}
      onClick={onClick}
      type={onClick ? "button" : "submit"}
    >
      {busy ? "Please wait..." : text}
    </button>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <p
      className="mb-6 rounded-xl border border-[#f1c7c4] bg-[#fff5f4] px-4 py-3 text-sm leading-6 text-[#a12a21]"
      role="alert"
    >
      {message}
    </p>
  );
}

function LoadingPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f8f6] text-sm text-[#68756f]">
      Loading your workspace...
    </main>
  );
}
