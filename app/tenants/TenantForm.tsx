"use client";

import { useEffect, useState, type FormEvent } from "react";
import Image from "next/image";
import type { TenantValues } from "../lib/tenants";

export default function TenantForm({
  values,
  avatarUrl,
  avatarFile,
  removeAvatar = false,
  busy,
  submitLabel,
  onChange,
  onAvatarChange,
  onRemoveAvatar,
  onCancelRemove,
  onSubmit,
}: {
  values: TenantValues;
  avatarUrl?: string | null;
  avatarFile: File | null;
  removeAvatar?: boolean;
  busy: boolean;
  submitLabel: string;
  onChange: (field: keyof TenantValues, value: string) => void;
  onAvatarChange: (file: File | null) => void;
  onRemoveAvatar?: () => void;
  onCancelRemove?: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const inputClass =
    "mt-2 h-11 w-full rounded-xl border border-[#dce3de] bg-white px-3 text-sm outline-none focus:border-[#527e69] focus:ring-4 focus:ring-[#527e69]/10";
  return (
    <form className="mt-7 space-y-5" onSubmit={onSubmit}>
      <TenantAvatarField
        avatarFile={avatarFile}
        avatarUrl={avatarUrl}
        busy={busy}
        fullName={values.fullName}
        onChange={onAvatarChange}
        onCancelRemove={onCancelRemove}
        onRemove={onRemoveAvatar}
        removeAvatar={removeAvatar}
      />
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

function TenantAvatarField({
  avatarUrl,
  avatarFile,
  busy,
  fullName,
  onChange,
  onCancelRemove,
  onRemove,
  removeAvatar,
}: {
  avatarUrl?: string | null;
  avatarFile: File | null;
  removeAvatar: boolean;
  busy: boolean;
  fullName: string;
  onChange: (file: File | null) => void;
  onCancelRemove?: () => void;
  onRemove?: () => void;
}) {
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  useEffect(() => {
    return () => {
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  function changeAvatarFile(file: File | null) {
    setAvatarPreview(file ? URL.createObjectURL(file) : null);
    onChange(file);
  }

  return (
    <section aria-label="Tenant profile photo" className="flex flex-col gap-4 rounded-2xl border border-[#e1e7e1] bg-[#fbfcfa] p-4 sm:flex-row sm:items-center">
      <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#e7efe8] text-lg font-semibold text-[#52735c]">
        {avatarPreview ? (
          <Image
            alt="Selected tenant photo preview"
            className="h-full w-full object-cover"
            height={64}
            src={avatarPreview}
            unoptimized
            width={64}
          />
        ) : avatarUrl && !removeAvatar ? (
          <Image
            alt={`${fullName || "Tenant"} profile photo`}
            className="h-full w-full object-cover"
            height={64}
            src={avatarUrl}
            unoptimized
            width={64}
          />
        ) : (
          getInitials(fullName)
        )}
      </div>
      <div>
        <h2 className="text-sm font-semibold text-[#25342e]">Profile photo</h2>
        <p className="mt-1 text-xs text-[#738078]">JPG, PNG, or WebP. Maximum file size: 5 MB.</p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <label className="inline-flex h-10 cursor-pointer items-center rounded-xl border border-[#dce3de] bg-white px-4 text-sm font-semibold text-[#25342e] hover:bg-[#f7f8f6]">
            {avatarFile
              ? "Choose another photo"
              : avatarUrl && !removeAvatar
                ? "Edit photo"
                : "Choose photo"}
            <input
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              disabled={busy}
              onChange={(event) => {
                changeAvatarFile(event.target.files?.[0] ?? null);
                event.currentTarget.value = "";
              }}
              type="file"
            />
          </label>
          {avatarFile && (
            <button
              className="text-sm font-medium text-[#68756f] hover:underline"
              disabled={busy}
              onClick={() => changeAvatarFile(null)}
              type="button"
            >
              Cancel selection
            </button>
          )}
          {avatarUrl && removeAvatar && onCancelRemove && (
            <button
              className="text-sm font-semibold text-[#1d5745] hover:underline disabled:opacity-60"
              disabled={busy}
              onClick={onCancelRemove}
              type="button"
            >
              Keep current photo
            </button>
          )}
          {avatarUrl && !removeAvatar && onRemove && (
            <button
              className="text-sm font-semibold text-[#a12a21] hover:underline disabled:opacity-60"
              disabled={busy}
              onClick={onRemove}
              type="button"
            >
              Remove photo
            </button>
          )}
        </div>
      </div>
    </section>
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

function getInitials(fullName: string) {
  return fullName
    .trim()
    .split(/\s+/u)
    .slice(0, 2)
    .map((part) => part[0] ?? "")
    .join("")
    .toUpperCase();
}
