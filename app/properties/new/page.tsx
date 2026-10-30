"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ApiRequestError, createProperty } from "../../lib/onboarding";
import WorkspaceShell from "../../components/WorkspaceShell";

export default function NewPropertyPage() {
  const router = useRouter();
  const [values, setValues] = useState({
    name: "",
    type: "APARTMENT",
    addressLine1: "",
    city: "",
    region: "",
    postalCode: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = await createProperty(values);
      router.push(`/properties/${encodeURIComponent(result.property.id)}`);
    } catch (actionError) {
      setError(
        actionError instanceof ApiRequestError
          ? actionError.message
          : "The property could not be created.",
      );
    } finally {
      setBusy(false);
    }
  }

  const inputClass =
    "mt-2 h-12 w-full rounded-xl border border-[#dce3de] bg-white px-4 text-[15px] outline-none transition focus:border-[#527e69] focus:ring-4 focus:ring-[#527e69]/10";

  return (
    <WorkspaceShell>
    <main className="min-h-screen bg-[#f7f8f6] px-5 py-10 text-[#17231f] sm:px-8">
      <div className="mx-auto max-w-3xl">
        <Link className="text-lg font-semibold tracking-tight text-[#153d32]" href="/dashboard">
          PropertyDek
        </Link>
        <section className="mt-8 rounded-3xl border border-[#e1e7e1] bg-white p-6 shadow-sm sm:p-9">
          <p className="text-xs font-semibold uppercase tracking-[0.17em] text-[#65806e]">
            Portfolio
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">
            Add a property
          </h1>
          <p className="mt-3 text-sm leading-6 text-[#68756f]">
            Add the property address and type. You can add units on the next screen.
          </p>
          {error && <ErrorBanner message={error} />}
          <form className="mt-7 space-y-5" onSubmit={submit}>
            <div className="grid gap-5 sm:grid-cols-[1fr_190px]">
              <label className="block text-sm font-medium text-[#25342e]">
                Property name
                <input
                  className={inputClass}
                  maxLength={160}
                  onChange={(event) =>
                    setValues({ ...values, name: event.target.value })
                  }
                  placeholder="Cedar Grove Apartments"
                  required
                  value={values.name}
                />
              </label>
              <label className="block text-sm font-medium text-[#25342e]">
                Type
                <select
                  className={inputClass}
                  onChange={(event) =>
                    setValues({ ...values, type: event.target.value })
                  }
                  value={values.type}
                >
                  <option value="APARTMENT">Apartment</option>
                  <option value="HOUSE">House</option>
                  <option value="CONDO">Condo</option>
                  <option value="COMMERCIAL">Commercial</option>
                  <option value="OTHER">Other</option>
                </select>
              </label>
            </div>
            <label className="block text-sm font-medium text-[#25342e]">
              Street address
              <input
                className={inputClass}
                maxLength={200}
                onChange={(event) =>
                  setValues({ ...values, addressLine1: event.target.value })
                }
                required
                value={values.addressLine1}
              />
            </label>
            <div className="grid gap-5 sm:grid-cols-3">
              {(["city", "region", "postalCode"] as const).map((field) => (
                <label className="block text-sm font-medium capitalize text-[#25342e]" key={field}>
                  {field === "region" ? "State / region" : field === "postalCode" ? "Postal code" : "City"}
                  <input
                    className={inputClass}
                    maxLength={field === "city" ? 100 : field === "region" ? 100 : 30}
                    onChange={(event) =>
                      setValues({ ...values, [field]: event.target.value })
                    }
                    required={field === "city"}
                    value={values[field]}
                  />
                </label>
              ))}
            </div>
            <button
              className="h-12 rounded-xl bg-[#1d5745] px-6 text-sm font-semibold text-white transition hover:bg-[#174737] disabled:opacity-60"
              disabled={busy}
              type="submit"
            >
              {busy ? "Creating property..." : "Create property"}
            </button>
          </form>
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
