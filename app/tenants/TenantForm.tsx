"use client";

import type { FormEvent } from "react";
import type { TenantValues } from "../lib/tenants";

export default function TenantForm({
  values,
  busy,
  submitLabel,
  onChange,
  onSubmit,
}: {
  values: TenantValues;
  busy: boolean;
  submitLabel: string;
  onChange: (field: keyof TenantValues, value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const inputClass =
    "mt-2 h-11 w-full rounded-xl border border-[#dce3de] bg-white px-3 text-sm outline-none focus:border-[#527e69] focus:ring-4 focus:ring-[#527e69]/10";
  return (
    <form className="mt-7 space-y-5" onSubmit={onSubmit}>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Full name" maxLength={160} required value={values.fullName} onChange={(value) => onChange("fullName", value)} className={inputClass} />
        <Field label="Email" maxLength={320} type="email" value={values.email} onChange={(value) => onChange("email", value)} className={inputClass} />
        <Field label="Phone" maxLength={40} type="tel" value={values.phone} onChange={(value) => onChange("phone", value)} className={inputClass} />
        <Field label="Emergency contact" maxLength={160} value={values.emergencyContact} onChange={(value) => onChange("emergencyContact", value)} className={inputClass} />
        <Field label="Emergency phone" maxLength={40} type="tel" value={values.emergencyPhone} onChange={(value) => onChange("emergencyPhone", value)} className={inputClass} />
      </div>
      <label className="block text-sm font-medium text-[#25342e]">
        Notes
        <textarea
          className={`${inputClass} h-28 py-3`}
          maxLength={10000}
          onChange={(event) => onChange("notes", event.target.value)}
          value={values.notes}
        />
      </label>
      <button
        className="h-12 rounded-xl bg-[#1d5745] px-6 text-sm font-semibold text-white transition hover:bg-[#174737] disabled:opacity-60"
        disabled={busy}
        type="submit"
      >
        {busy ? "Saving..." : submitLabel}
      </button>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  className,
  maxLength,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  className: string;
  maxLength: number;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block text-sm font-medium text-[#25342e]">
      {label}
      <input
        className={className}
        maxLength={maxLength}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        type={type}
        value={value}
      />
    </label>
  );
}
