"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { Suspense, useState, type FormEvent } from "react";
import {
  loginUser,
  LoginError,
  type LoginField,
  type LoginValues,
} from "../lib/auth";

const initialValues: LoginValues = {
  email: "",
  password: "",
};

export default function LoginPage() {
  const router = useRouter();
  const [values, setValues] = useState(initialValues);
  const login = useMutation({
    mutationFn: loginUser,
    onSuccess: () => setValues(initialValues),
  });
  const fieldErrors =
    login.error instanceof LoginError ? login.error.fields : {};

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    login.reset();
    login.mutate(values, {
      onSuccess: () => router.push("/onboarding"),
    });
  }

  function updateField(field: LoginField, value: string) {
    login.reset();
    setValues((current) => ({ ...current, [field]: value }));
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

          <BrandLink />

          <div className="relative z-10 max-w-xl py-16">
            <p className="mb-5 text-sm font-medium uppercase tracking-[0.2em] text-[#c4e7a5]">
              Welcome back
            </p>
            <h1 className="text-5xl font-semibold leading-[1.12] tracking-[-0.04em] xl:text-6xl">
              Your properties, all in one place.
            </h1>
            <p className="mt-6 max-w-md text-lg leading-8 text-white/70">
              Sign in to pick up right where you left off.
            </p>
          </div>

          <p className="relative z-10 text-sm text-white/50">
            One thoughtful place for your property portfolio.
          </p>
        </section>

        <section className="flex min-h-screen items-center justify-center px-6 py-12 sm:px-10 lg:px-12">
          <div className="w-full max-w-md">
            <div className="mb-12 lg:hidden">
              <BrandLink />
            </div>

            <div className="mb-9">
              <p className="mb-3 text-sm font-medium text-[#557368]">
                WELCOME BACK
              </p>
              <h2 className="text-3xl font-semibold tracking-[-0.035em] text-[#17231f] sm:text-4xl">
                Sign in to PropertyDek
              </h2>
              <p className="mt-3 text-base leading-7 text-[#68756f]">
                Enter your email and password to access your account.
              </p>
            </div>

            <Suspense fallback={null}>
              <GoogleOAuthError />
            </Suspense>

            <form className="space-y-5" onSubmit={handleSubmit} noValidate>
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
                  autoComplete="current-password"
                  className="h-12 w-full rounded-xl border border-[#dce3de] bg-white px-4 text-[15px] outline-none transition placeholder:text-[#9aa59f] focus:border-[#527e69] focus:ring-4 focus:ring-[#527e69]/10"
                  id="password"
                  name="password"
                  onChange={(event) =>
                    updateField("password", event.target.value)
                  }
                  placeholder="Your password"
                  required
                  type="password"
                  value={values.password}
                  aria-invalid={Boolean(fieldErrors.password)}
                  aria-describedby={
                    fieldErrors.password ? "password-error" : undefined
                  }
                />
                {fieldErrors.password && (
                  <p
                    className="mt-2 text-sm text-[#b42318]"
                    id="password-error"
                  >
                    {fieldErrors.password}
                  </p>
                )}
              </div>

              {login.error && (
                <p
                  className="rounded-xl border border-[#f1c7c4] bg-[#fff5f4] px-4 py-3 text-sm leading-6 text-[#a12a21]"
                  role="alert"
                >
                  {login.error.message}
                </p>
              )}

              {login.isSuccess && (
                <p
                  className="rounded-xl border border-[#b7d9c3] bg-[#f0f8f2] px-4 py-3 text-sm leading-6 text-[#28583b]"
                  role="status"
                >
                  You are signed in
                  {login.data.fullName ? ` as ${login.data.fullName}` : ""}.
                </p>
              )}

              <button
                className="flex h-12 w-full items-center justify-center rounded-xl bg-[#1d5745] px-5 text-[15px] font-semibold text-white transition hover:bg-[#174737] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1d5745] disabled:cursor-not-allowed disabled:opacity-60"
                disabled={login.isPending}
                type="submit"
              >
                {login.isPending ? "Signing in..." : "Sign in"}
              </button>
            </form>

            <div className="my-6 flex items-center gap-4">
              <span className="h-px flex-1 bg-[#e1e6e2]" />
              <span className="text-sm text-[#7b8781]">or</span>
              <span className="h-px flex-1 bg-[#e1e6e2]" />
            </div>

            <a
              className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-[#dce3de] bg-white px-5 text-[15px] font-semibold text-[#25342e] transition hover:bg-[#f8faf8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1d5745]"
              href="/api/auth/google"
            >
              <GoogleIcon />
              Continue with Google
            </a>

            <p className="mt-8 text-center text-sm text-[#68756f]">
              New to PropertyDek?{" "}
              <Link
                className="font-semibold text-[#1d5745] hover:underline"
                href="/register"
              >
                Create an account
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

function GoogleOAuthError() {
  const searchParams = useSearchParams();
  const error = searchParams.get("oauthError");
  const message =
    error === "google-unavailable"
      ? "Google sign-in is not configured for this environment."
      : error === "google"
        ? "Google sign-in couldn't be completed. Please try again."
        : null;

  if (!message) {
    return null;
  }

  return (
    <p
      className="mb-5 rounded-xl border border-[#f1c7c4] bg-[#fff5f4] px-4 py-3 text-sm leading-6 text-[#a12a21]"
      role="alert"
    >
      {message}
    </p>
  );
}

function BrandLink() {
  return (
    <Link
      className="relative z-10 inline-flex w-fit items-center gap-3 text-lg font-semibold tracking-tight text-[#153d32] lg:text-white"
      href="/"
      aria-label="PropertyDek home"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#c4e7a5] text-[#153d32]">
        <BuildingIcon />
      </span>
      PropertyDek
    </Link>
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

function GoogleIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 48 48">
      <path
        fill="#4285F4"
        d="M43.6 24.5c0-1.4-.1-2.8-.4-4.1H24v7.8h11a9.4 9.4 0 0 1-4.1 6.2v5.1h6.6c3.9-3.6 6.1-8.8 6.1-15Z"
      />
      <path
        fill="#34A853"
        d="M24 44c5.5 0 10.1-1.8 13.5-4.9l-6.6-5.1c-1.8 1.2-4.1 2-6.9 2-5.3 0-9.8-3.6-11.4-8.5H5.8v5.3A20 20 0 0 0 24 44Z"
      />
      <path
        fill="#FBBC05"
        d="M12.6 27.5a12 12 0 0 1 0-7v-5.3H5.8a20 20 0 0 0 0 17.6l6.8-5.3Z"
      />
      <path
        fill="#EA4335"
        d="M24 12c3 0 5.7 1 7.8 3.1l5.8-5.8A19.4 19.4 0 0 0 24 4 20 20 0 0 0 5.8 15.2l6.8 5.3C14.2 15.6 18.7 12 24 12Z"
      />
    </svg>
  );
}
