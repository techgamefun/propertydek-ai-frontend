"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Suspense, useState, type ReactNode } from "react";
import { logoutUser, LoginError } from "../lib/auth";

const menuItems = [
  { href: "/dashboard", label: "Dashboard", icon: "grid" },
  { href: "/properties", label: "Properties", icon: "building" },
  { href: "/leases", label: "Leases", icon: "lease" },
  { href: "/invoices", label: "Invoices", icon: "invoice" },
  { href: "/team", label: "Team", icon: "people" },
  { href: "/profile", label: "My profile", icon: "user" },
  { href: "/workspace", label: "Workspace", icon: "settings" },
] as const;

export default function WorkspaceShell({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<div>{children}</div>}>
      <WorkspaceLayoutContent>{children}</WorkspaceLayoutContent>
    </Suspense>
  );
}

function WorkspaceLayoutContent({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [logoutPending, setLogoutPending] = useState(false);
  const [logoutError, setLogoutError] = useState("");

  async function handleLogout() {
    setLogoutPending(true);
    setLogoutError("");

    try {
      await logoutUser();
      router.replace("/login");
      router.refresh();
    } catch (error) {
      setLogoutError(
        error instanceof LoginError
          ? error.message
          : "We couldn't sign you out. Please try again.",
      );
    } finally {
      setLogoutPending(false);
    }
  }

  function isActive(href: string) {
    if (href === "/dashboard") {
      return pathname === href;
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <div className="min-h-screen bg-background md:flex">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-surface px-5 py-3 md:hidden">
        <Link className="text-base font-semibold tracking-tight text-brand-strong" href="/dashboard">
          PropertyDek
        </Link>
        <button
          aria-expanded={mobileMenuOpen}
          aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-border-strong text-brand-strong"
          onClick={() => setMobileMenuOpen((open) => !open)}
          type="button"
        >
          <MenuIcon open={mobileMenuOpen} />
        </button>
      </header>

      <aside
        className={`${
          mobileMenuOpen ? "block" : "hidden"
        } fixed inset-x-0 top-[65px] z-20 border-b border-border bg-surface px-4 pb-5 md:sticky md:top-0 md:block md:h-screen md:w-64 md:shrink-0 md:border-b-0 md:border-r md:px-5 md:py-7`}
      >
        <div className="hidden md:block">
          <Link className="inline-flex items-center gap-3 text-lg font-semibold tracking-tight text-brand-strong" href="/dashboard">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-accent-soft">
              <BuildingIcon />
            </span>
            PropertyDek
          </Link>
        </div>

        <div className="mb-3 mt-4 px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted md:mt-10">
          Menu
        </div>
        <nav aria-label="Workspace menu" className="space-y-1">
          {menuItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  active
                    ? "bg-brand-soft text-brand"
                    : "text-muted hover:bg-background hover:text-ink"
                }`}
                href={item.href}
                key={item.href}
                onClick={() => setMobileMenuOpen(false)}
              >
                <NavIcon name={item.icon} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-5 border-t border-border pt-4 md:absolute md:inset-x-5 md:bottom-6">
          <Link
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
              isActive("/onboarding")
                ? "bg-brand-soft text-brand"
                : "text-muted hover:bg-background"
            }`}
            href="/onboarding"
            onClick={() => setMobileMenuOpen(false)}
          >
            <span aria-hidden="true" className="flex h-5 w-5 items-center justify-center text-base leading-none">
              +
            </span>
            Setup guide
          </Link>
          {logoutError && (
            <p className="mt-2 px-3 text-xs text-red-700" role="alert">
              {logoutError}
            </p>
          )}
          <button
            className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-muted transition hover:bg-background hover:text-ink disabled:cursor-not-allowed disabled:opacity-60"
            disabled={logoutPending}
            onClick={() => {
              setMobileMenuOpen(false);
              void handleLogout();
            }}
            type="button"
          >
            <LogoutIcon />
            {logoutPending ? "Signing out…" : "Sign out"}
          </button>
        </div>
      </aside>

      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

function LogoutIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5 shrink-0"
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="M10 17l5-5-5-5m5 5H3m9-9h5a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.6"
      />
    </svg>
  );
}

function MenuIcon({ open }: { open: boolean }) {
  return open ? (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
      <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  ) : (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
      <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  );
}

function NavIcon({ name }: { name: (typeof menuItems)[number]["icon"] }) {
  const common = {
    "aria-hidden": true as const,
    className: "h-5 w-5 shrink-0",
    fill: "none",
    viewBox: "0 0 24 24",
  };
  const paths = {
    grid: "M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z",
    building: "M4 20V7l8-4 8 4v13M3 20h18M8 9h.01M12 9h.01M16 9h.01M8 13h.01M12 13h.01M16 13h.01M10 20v-4h4v4",
    lease: "M7 3.75h7l4 4v12.5H7a2 2 0 0 1-2-2v-12.5a2 2 0 0 1 2-2ZM14 3.75v4h4M8.5 12h7M8.5 15.5h7",
    invoice: "M5 4h14v16l-3.5-2-3.5 2-3.5-2L5 20V4ZM8 8h8M8 11.5h8M8 15h4",
    people: "M16 20v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 18.5V20M10 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM16 4.3a3.5 3.5 0 0 1 0 6.8M20 20v-1.5a3.5 3.5 0 0 0-2.5-3.35",
    user: "M20 21a8 8 0 0 0-16 0M12 13a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z",
    settings: "M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7ZM19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-1.7 2.94-.08-.02a1.7 1.7 0 0 0-1.78.54l-.05.07h-3.4l-.05-.07a1.7 1.7 0 0 0-1.78-.54l-.08.02-1.7-2.94.06-.06A1.7 1.7 0 0 0 9.6 15l-.08-.04v-3.4l.08-.04a1.7 1.7 0 0 0-.34-1.88L9.2 9.58l1.7-2.94.08.02a1.7 1.7 0 0 0 1.78-.54l.05-.07h3.4l.05.07a1.7 1.7 0 0 0 1.78.54l.08-.02 1.7 2.94-.06.06A1.7 1.7 0 0 0 19.4 11.5l.08.04v3.4l-.08.06Z",
  }[name];

  return (
    <svg {...common}>
      <path
        d={paths}
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.6"
      />
    </svg>
  );
}

function BuildingIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
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
