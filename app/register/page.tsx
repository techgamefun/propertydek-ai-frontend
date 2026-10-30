"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useState, type FormEvent } from "react";
import {
  registerUser,
  RegistrationError,
  type RegistrationField,
  type RegistrationValues,
} from "../lib/auth";

const initialValues: RegistrationValues = {
  fullName: "",
  email: "",
  password: "",
  phone: "",
  avatar: null,
};

export default function Home() {
  const router = useRouter();
  const [values, setValues] = useState(initialValues);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const registration = useMutation({
    mutationFn: registerUser,
    onSuccess: () => setValues(initialValues),
  });
  const fieldErrors =
    registration.error instanceof RegistrationError
      ? registration.error.fields
      : {};
  const errorMessage = registration.error?.message;

  useEffect(() => {
    if (!values.avatar) {
      return;
    }

    let active = true;
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      if (active && typeof reader.result === "string") {
        setAvatarPreview(reader.result);
      }
    });
    reader.readAsDataURL(values.avatar);

    return () => {
      active = false;
      reader.abort();
    };
  }, [values.avatar]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    registration.reset();
    registration.mutate(values, {
      onSuccess: () => router.push("/onboarding"),
    });
  }

  function updateField(field: RegistrationField, value: string) {
    registration.reset();
    setValues((current) => ({ ...current, [field]: value }));
  }

  function updateAvatar(file: File | null) {
    registration.reset();
    setValues((current) => ({ ...current, avatar: file }));
  }

  return (
    <main className="min-h-screen bg-[#f7f8f6] text-[#17231f]">
      <div className="mx-auto grid min-h-screen max-w-7xl grid-cols-1 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="relative hidden overflow-hidden bg-[#153d32] px-12 py-10 text-white lg:flex lg:flex-col lg:justify-between xl:px-20">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-36 top-36 h-[34rem] w-[34rem] rounded-full border border-white/10"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-20 top-52 h-[25rem] w-[25rem] rounded-full border border-white/10"
          />

          <Link
            className="relative z-10 inline-flex w-fit items-center gap-3 text-lg font-semibold tracking-tight"
            href="/"
            aria-label="PropertyDek home"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#c4e7a5] text-[#153d32]">
              <BuildingIcon />
            </span>
            PropertyDek
          </Link>

          <div className="relative z-10 max-w-xl py-16">
            <p className="mb-5 text-sm font-medium uppercase tracking-[0.2em] text-[#c4e7a5]">
              Property management, made clearer
            </p>
            <h1 className="text-5xl font-semibold leading-[1.12] tracking-[-0.04em] xl:text-6xl">
              A better way to care for your properties.
            </h1>
            <p className="mt-6 max-w-md text-lg leading-8 text-white/70">
              Bring your property operations together and make room for what
              matters most.
            </p>
          </div>

          <p className="relative z-10 text-sm text-white/50">
            One thoughtful place for your property portfolio.
          </p>
        </section>

        <section className="flex min-h-screen items-center justify-center px-6 py-12 sm:px-10 lg:px-12">
          <div className="w-full max-w-md">
            <Link
              className="mb-12 inline-flex items-center gap-2 text-base font-semibold tracking-tight text-[#153d32] lg:hidden"
              href="/"
              aria-label="PropertyDek home"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#153d32] text-[#c4e7a5]">
                <BuildingIcon />
              </span>
              PropertyDek
            </Link>

            <div className="mb-9">
              <p className="mb-3 text-sm font-medium text-[#557368]">
                CREATE YOUR ACCOUNT
              </p>
              <h2 className="text-3xl font-semibold tracking-[-0.035em] text-[#17231f] sm:text-4xl">
                Create your account
              </h2>
              <p className="mt-3 text-base leading-7 text-[#68756f]">
                Set up your PropertyDek account to get started.
              </p>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit} noValidate>
              <div>
                <label
                  className="mb-2 block text-sm font-medium text-[#25342e]"
                  htmlFor="fullName"
                >
                  Full name
                </label>
                <input
                  autoComplete="name"
                  className="h-12 w-full rounded-xl border border-[#dce3de] bg-white px-4 text-[15px] outline-none transition placeholder:text-[#9aa59f] focus:border-[#527e69] focus:ring-4 focus:ring-[#527e69]/10"
                  id="fullName"
                  maxLength={160}
                  name="fullName"
                  onChange={(event) =>
                    updateField("fullName", event.target.value)
                  }
                  placeholder="Your full name"
                  required
                  value={values.fullName}
                  aria-invalid={Boolean(fieldErrors.fullName)}
                  aria-describedby={
                    fieldErrors.fullName ? "fullName-error" : undefined
                  }
                />
                {fieldErrors.fullName && (
                  <p
                    className="mt-2 text-sm text-[#b42318]"
                    id="fullName-error"
                  >
                    {fieldErrors.fullName}
                  </p>
                )}
              </div>

              <div>
                <label
                  className="mb-2 block text-sm font-medium text-[#25342e]"
                  htmlFor="phone"
                >
                  Phone number{" "}
                  <span className="font-normal text-[#849089]">(optional)</span>
                </label>
                <input
                  autoComplete="tel"
                  className="h-12 w-full rounded-xl border border-[#dce3de] bg-white px-4 text-[15px] outline-none transition placeholder:text-[#9aa59f] focus:border-[#527e69] focus:ring-4 focus:ring-[#527e69]/10"
                  id="phone"
                  maxLength={40}
                  name="phone"
                  onChange={(event) => updateField("phone", event.target.value)}
                  placeholder="+1 555 123 4567"
                  type="tel"
                  value={values.phone}
                  aria-invalid={Boolean(fieldErrors.phone)}
                  aria-describedby={
                    fieldErrors.phone ? "phone-error" : undefined
                  }
                />
                {fieldErrors.phone && (
                  <p className="mt-2 text-sm text-[#b42318]" id="phone-error">
                    {fieldErrors.phone}
                  </p>
                )}
              </div>

              <div>
                <span className="mb-2 block text-sm font-medium text-[#25342e]">
                  Profile photo{" "}
                  <span className="font-normal text-[#849089]">(optional)</span>
                </span>
                <div className="flex items-center gap-4 rounded-xl border border-[#dce3de] bg-white p-3">
                  {avatarPreview ? (
                    <Image
                      alt="Selected profile photo preview"
                      className="h-14 w-14 rounded-full object-cover"
                      height={56}
                      src={avatarPreview}
                      unoptimized
                      width={56}
                    />
                  ) : (
                    <span
                      aria-hidden="true"
                      className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#edf3ee] text-[#557368]"
                    >
                      <PersonIcon />
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <label
                      className="block cursor-pointer text-sm font-semibold text-[#1d5745] hover:underline"
                      htmlFor="avatar"
                    >
                      {values.avatar ? "Choose a different photo" : "Choose a photo"}
                    </label>
                    <input
                      accept="image/jpeg,image/png,image/webp"
                      className="sr-only"
                      id="avatar"
                      name="avatar"
                      onChange={(event) =>
                        updateAvatar(event.target.files?.[0] ?? null)
                      }
                      type="file"
                      aria-invalid={Boolean(fieldErrors.avatar)}
                      aria-describedby={
                        fieldErrors.avatar ? "avatar-error" : "avatar-hint"
                      }
                    />
                    <p className="mt-1 text-xs text-[#7b8781]" id="avatar-hint">
                      JPG, PNG, or WebP; up to 5 MB.
                    </p>
                    {fieldErrors.avatar && (
                      <p
                        className="mt-1 text-sm text-[#b42318]"
                        id="avatar-error"
                      >
                        {fieldErrors.avatar}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label
                  className="mb-2 block text-sm font-medium text-[#25342e]"
                  htmlFor="email"
                >
                  Email address
                </label>
                <input
                  autoComplete="email"
                  className="h-12 w-full rounded-xl border border-[#dce3de] bg-white px-4 text-[15px] outline-none transition placeholder:text-[#9aa59f] focus:border-[#527e69] focus:ring-4 focus:ring-[#527e69]/10"
                  id="email"
                  maxLength={320}
                  name="email"
                  onChange={(event) => updateField("email", event.target.value)}
                  placeholder="you@company.com"
                  required
                  type="email"
                  value={values.email}
                  aria-invalid={Boolean(fieldErrors.email)}
                  aria-describedby={
                    fieldErrors.email ? "email-error" : undefined
                  }
                />
                {fieldErrors.email && (
                  <p className="mt-2 text-sm text-[#b42318]" id="email-error">
                    {fieldErrors.email}
                  </p>
                )}
              </div>

              <div>
                <label
                  className="mb-2 block text-sm font-medium text-[#25342e]"
                  htmlFor="password"
                >
                  Password
                </label>
                <input
                  autoComplete="new-password"
                  className="h-12 w-full rounded-xl border border-[#dce3de] bg-white px-4 text-[15px] outline-none transition placeholder:text-[#9aa59f] focus:border-[#527e69] focus:ring-4 focus:ring-[#527e69]/10"
                  id="password"
                  name="password"
                  onChange={(event) =>
                    updateField("password", event.target.value)
                  }
                  placeholder="At least 12 characters"
                  required
                  type="password"
                  value={values.password}
                  aria-invalid={Boolean(fieldErrors.password)}
                  aria-describedby={
                    fieldErrors.password
                      ? "password-error"
                      : "password-hint"
                  }
                />
                {fieldErrors.password ? (
                  <p
                    className="mt-2 text-sm text-[#b42318]"
                    id="password-error"
                  >
                    {fieldErrors.password}
                  </p>
                ) : (
                  <p className="mt-2 text-sm text-[#7b8781]" id="password-hint">
                    Use at least 12 characters.
                  </p>
                )}
              </div>

              {errorMessage && (
                <p
                  className="rounded-xl border border-[#f1c7c4] bg-[#fff5f4] px-4 py-3 text-sm leading-6 text-[#a12a21]"
                  role="alert"
                >
                  {errorMessage}
                </p>
              )}

              {registration.isSuccess && (
                <p
                  className="rounded-xl border border-[#b7d9c3] bg-[#f0f8f2] px-4 py-3 text-sm leading-6 text-[#28583b]"
                  role="status"
                >
                  Your account has been created
                  {registration.data.email
                    ? ` for ${registration.data.email}`
                    : ""}
                  .
                </p>
              )}

              <button
                className="flex h-12 w-full items-center justify-center rounded-xl bg-[#1d5745] px-5 text-[15px] font-semibold text-white transition hover:bg-[#174737] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1d5745] disabled:cursor-not-allowed disabled:opacity-60"
                disabled={registration.isPending}
                type="submit"
              >
                {registration.isPending ? "Creating account..." : "Create account"}
              </button>
            </form>

            <p className="mt-8 text-center text-xs leading-5 text-[#849089]">
              Already have an account?{" "}
              <Link
                className="font-semibold text-[#1d5745] hover:underline"
                href="/login"
              >
                Sign in
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

function BuildingIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="M4.75 20.25V7.5L12 3.75l7.25 3.75v12.75M3.5 20.25h17M8.25 9.5h.01M12 9.5h.01M15.75 9.5h.01M8.25 13h.01M12 13h.01M15.75 13h.01M10 20.25v-3.5h4v3.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function PersonIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-7 w-7"
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm7 8a7 7 0 0 0-14 0"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}
