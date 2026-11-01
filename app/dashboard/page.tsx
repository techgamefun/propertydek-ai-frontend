"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ApiRequestError, getDashboardOverview } from "../lib/onboarding";
import WorkspaceShell from "../components/WorkspaceShell";

const MONTH_COUNT = 6;

export default function DashboardPage() {
  const [selectedCurrency, setSelectedCurrency] = useState("");
  const dashboard = useQuery({
    queryKey: ["dashboard"],
    queryFn: getDashboardOverview,
    retry: (failureCount, error) =>
      failureCount < 1 &&
      (!(error instanceof ApiRequestError) ||
        error.statusCode === undefined ||
        error.statusCode >= 500),
    retryDelay: 1000,
    refetchOnWindowFocus: false,
  });

  if (dashboard.isLoading) {
    return (
      <WorkspaceShell>
        <DashboardLoading />
      </WorkspaceShell>
    );
  }

  if (dashboard.isError || !dashboard.data) {
    return (
      <WorkspaceShell>
        <main className="min-h-screen px-5 py-10 text-ink sm:px-8">
          <div className="mx-auto max-w-3xl rounded-3xl border border-border bg-surface p-8 shadow-card">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand">
              Portfolio overview
            </p>
            <h1 className="mt-3 text-2xl font-semibold">We couldn’t load your dashboard</h1>
            <p className="mt-3 text-sm leading-6 text-muted" role="alert">
              {dashboard.error instanceof ApiRequestError
                ? dashboard.error.message
                : dashboard.error instanceof Error
                  ? dashboard.error.message
                  : "Please check your connection and try again."}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                className="rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-strong"
                onClick={() => void dashboard.refetch()}
                type="button"
              >
                Try again
              </button>
              <Link
                className="rounded-xl border border-border px-5 py-3 text-sm font-semibold text-ink hover:bg-background"
                href="/login"
              >
                Sign in
              </Link>
            </div>
          </div>
        </main>
      </WorkspaceShell>
    );
  }

  const { workspace, properties, tasks, metrics } = dashboard.data;
  const currencies = Array.from(
    new Set([
      ...metrics.collectedPayments.map((item) => item.currency),
      ...metrics.paymentTrend.map((item) => item.currency),
    ]),
  ).sort();
  const currency =
    currencies.find((item) => item === selectedCurrency) ?? currencies[0] ?? "USD";
  const monthlyPayments = getMonthlyPayments(metrics.paymentTrend, currency);
  const totalCollected = metrics.collectedPayments.find(
    (item) => item.currency === currency,
  )?.amount;
  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  });

  return (
    <WorkspaceShell>
      <main className="min-h-screen px-5 py-7 text-ink sm:px-8 sm:py-10">
        <div className="mx-auto max-w-[1440px]">
          <header className="flex flex-col justify-between gap-5 border-b border-border pb-7 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-medium text-muted">Your workspace at a glance</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-[-0.045em] sm:text-[2.1rem]">
                Portfolio overview
              </h1>
              <p className="mt-2 text-sm text-muted">
                Welcome to {workspace.name}. Here’s how your portfolio is doing.
              </p>
            </div>
            <Link
              className="inline-flex h-11 w-fit items-center justify-center gap-2 rounded-xl bg-brand px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-strong"
              href="/properties/new"
            >
              <span aria-hidden="true" className="text-lg leading-none">+</span>
              Add property
            </Link>
          </header>

          <section
            aria-label="Portfolio metrics"
            className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
          >
            <MetricCard
              label="Properties"
              value={metrics.properties.toLocaleString()}
              detail="Across your portfolio"
              icon="building"
              tone="green"
              href="/properties"
            />
            <MetricCard
              label="Total units"
              value={metrics.units.toLocaleString()}
              detail={`${metrics.occupiedUnits} currently occupied`}
              icon="units"
              tone="blue"
              href="/properties"
            />
            <MetricCard
              label="Occupancy rate"
              value={`${Math.round(metrics.occupancyRate * 100)}%`}
              detail={
                metrics.units
                  ? `${metrics.units - metrics.occupiedUnits} units available`
                  : "Add units to track occupancy"
              }
              icon="occupancy"
              tone="amber"
              href="/properties"
            />
            <MetricCard
              label="Rent collected"
              value={
                totalCollected === undefined ? "—" : formatter.format(Number(totalCollected))
              }
              detail="Successful payments to date"
              icon="payments"
              tone="violet"
              href="/invoices"
            />
          </section>

          <section className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1.8fr)_minmax(280px,0.8fr)]">
            <article className="overflow-hidden rounded-2xl border border-border bg-surface p-5 shadow-card sm:p-7">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                    Cash flow
                  </p>
                  <h2 className="mt-2 text-xl font-semibold tracking-tight">
                    Rent collected
                  </h2>
                  <p className="mt-1 text-sm text-muted">Monthly payments · last 6 months</p>
                </div>
                {currencies.length > 1 && (
                  <label className="text-xs font-medium text-muted">
                    Currency
                    <select
                      className="ml-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-brand"
                      onChange={(event) => setSelectedCurrency(event.target.value)}
                      value={currency}
                    >
                      {currencies.map((item) => (
                        <option key={item} value={item}>{item}</option>
                      ))}
                    </select>
                  </label>
                )}
              </div>
              <PaymentChart
                currency={currency}
                formatter={formatter}
                values={monthlyPayments}
              />
            </article>

            <article className="rounded-2xl border border-border bg-surface p-5 shadow-card sm:p-7">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                Portfolio health
              </p>
              <h2 className="mt-2 text-xl font-semibold tracking-tight">
                Occupancy
              </h2>
              <p className="mt-1 text-sm text-muted">Occupied units across your portfolio</p>
              <div className="mt-7 flex items-center justify-center">
                <OccupancyChart
                  occupied={metrics.occupiedUnits}
                  rate={metrics.occupancyRate}
                  total={metrics.units}
                />
              </div>
              <div className="mt-6 grid grid-cols-2 gap-3">
                <LegendItem
                  color="bg-brand"
                  label="Occupied"
                  value={metrics.occupiedUnits}
                />
                <LegendItem
                  color="bg-border-strong"
                  label="Available"
                  value={Math.max(metrics.units - metrics.occupiedUnits, 0)}
                />
              </div>
              <p className="mt-5 border-t border-border pt-4 text-xs leading-5 text-muted">
                Occupancy reflects units currently marked as occupied.
              </p>
            </article>
          </section>

          <section className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(300px,0.65fr)]">
            <article className="rounded-2xl border border-border bg-surface p-5 shadow-card sm:p-7">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                    Your portfolio
                  </p>
                  <h2 className="mt-2 text-xl font-semibold tracking-tight">Properties</h2>
                </div>
                <Link
                  className="text-sm font-semibold text-brand hover:text-brand-strong"
                  href="/properties"
                >
                  View all
                </Link>
              </div>
              {properties.length > 0 ? (
                <ul className="mt-5 divide-y divide-border">
                  {properties.slice(0, 5).map((property) => (
                    <li key={property.id}>
                      <Link
                        className="flex items-center justify-between gap-4 py-4 transition hover:bg-background/70"
                        href={`/properties/${encodeURIComponent(property.id)}`}
                      >
                        <span className="flex min-w-0 items-center gap-3">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
                            <BuildingIcon />
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-semibold text-ink">
                              {property.name}
                            </span>
                            <span className="mt-1 block truncate text-xs text-muted">
                              {property.addressLine1}, {property.city}
                            </span>
                          </span>
                        </span>
                        <span className="shrink-0 text-right">
                          <span className="block text-sm font-semibold text-ink">
                            {property._count?.units ?? 0}
                          </span>
                          <span className="text-xs text-muted">units</span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="mt-5 rounded-xl border border-dashed border-border-strong bg-background p-6 text-center">
                  <p className="text-sm font-semibold">Your portfolio starts here</p>
                  <p className="mt-1 text-sm text-muted">
                    Add a property to start tracking units and occupancy.
                  </p>
                  <Link
                    className="mt-4 inline-flex rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-strong"
                    href="/properties/new"
                  >
                    Add your first property
                  </Link>
                </div>
              )}
            </article>

            <article className="rounded-2xl border border-border bg-surface p-5 shadow-card sm:p-7">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                    Next steps
                  </p>
                  <h2 className="mt-2 text-xl font-semibold tracking-tight">
                    Getting started
                  </h2>
                </div>
                <span className="rounded-full bg-accent-soft px-2.5 py-1 text-xs font-semibold text-accent-strong">
                  {tasks.length} left
                </span>
              </div>
              {tasks.length > 0 ? (
                <ul className="mt-5 space-y-3">
                  {tasks.map((task, index) => (
                    <li className="flex items-start gap-3 rounded-xl bg-background p-3" key={task.id}>
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface text-xs font-semibold text-muted">
                        {index + 1}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium leading-5 text-ink">
                          {task.title}
                        </span>
                        <Link
                          className="mt-1 inline-block text-xs font-semibold text-brand hover:text-brand-strong"
                          href={task.id === "property" ? "/properties/new" : "/onboarding"}
                        >
                          Continue <span aria-hidden="true">→</span>
                        </Link>
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="mt-5 rounded-xl bg-brand-soft p-4">
                  <p className="text-sm font-semibold text-brand-strong">
                    You’re all set
                  </p>
                  <p className="mt-1 text-sm leading-5 text-muted">
                    Your workspace is ready. Keep an eye on your portfolio here.
                  </p>
                </div>
              )}
              <div className="mt-5 grid grid-cols-2 gap-3 border-t border-border pt-5">
                <MiniMetric href="/leases" label="Active leases" value={metrics.activeLeases} />
                <MiniMetric href="/maintenance" label="Open maintenance" value={metrics.openMaintenance} />
              </div>
            </article>
          </section>
        </div>
      </main>
    </WorkspaceShell>
  );
}

function getMonthlyPayments(
  trend: Array<{ month: string; currency: string; amount: number | string }>,
  currency: string,
) {
  const now = new Date();
  const months = Array.from({ length: MONTH_COUNT }, (_, index) => {
    const monthDate = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (MONTH_COUNT - 1 - index), 1),
    );
    const key = `${monthDate.getUTCFullYear()}-${String(monthDate.getUTCMonth() + 1).padStart(2, "0")}`;
    return {
      key,
      label: new Intl.DateTimeFormat("en-US", {
        month: "short",
        timeZone: "UTC",
      }).format(monthDate),
      amount: 0,
    };
  });

  for (const payment of trend) {
    if (payment.currency !== currency) {
      continue;
    }
    const month = months.find((item) => item.key === payment.month);
    if (month) {
      month.amount += Number(payment.amount);
    }
  }
  return months;
}

function MetricCard({
  label,
  value,
  detail,
  icon,
  tone,
  href,
}: {
  label: string;
  value: string;
  detail: string;
  icon: "building" | "units" | "occupancy" | "payments";
  tone: "green" | "blue" | "amber" | "violet";
  href: string;
}) {
  const toneStyles = {
    green: "bg-brand-soft text-brand",
    blue: "bg-info-soft text-info-strong",
    amber: "bg-accent-soft text-accent-strong",
    violet: "bg-violet-soft text-violet",
  }[tone];

  return (
    <Link
      className="block rounded-2xl border border-border bg-surface p-5 shadow-card transition hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      href={href}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-muted">{label}</p>
          <p className="mt-3 text-[1.8rem] font-semibold tracking-[-0.04em] text-ink">
            {value}
          </p>
        </div>
        <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${toneStyles}`}>
          <MetricIcon name={icon} />
        </span>
      </div>
      <p className="mt-3 text-xs text-muted">{detail}</p>
    </Link>
  );
}

function PaymentChart({
  currency,
  formatter,
  values,
}: {
  currency: string;
  formatter: Intl.NumberFormat;
  values: Array<{ key: string; label: string; amount: number }>;
}) {
  const width = 720;
  const height = 220;
  const left = 54;
  const right = 18;
  const top = 14;
  const bottom = 32;
  const chartWidth = width - left - right;
  const chartHeight = height - top - bottom;
  const maxAmount = Math.max(...values.map((item) => item.amount), 1);
  const gridMax = Math.ceil(maxAmount / 4) * 4 || 4;
  const points = values.map((item, index) => ({
    ...item,
    x: left + (chartWidth * index) / Math.max(values.length - 1, 1),
    y: top + chartHeight - (item.amount / gridMax) * chartHeight,
  }));
  const linePath = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");
  const areaPath = `${linePath} L ${points.at(-1)?.x ?? left} ${top + chartHeight} L ${left} ${top + chartHeight} Z`;
  const hasData = values.some((item) => item.amount > 0);

  return (
    <div className="mt-5">
      <div className="mb-1 flex items-baseline gap-2">
        <span className="text-2xl font-semibold tracking-tight text-ink">
          {formatter.format(values.reduce((sum, item) => sum + item.amount, 0))}
        </span>
        <span className="text-xs text-muted">{currency} · six months</span>
      </div>
      <div className="relative">
        <svg
          aria-label={`Monthly rent collected in ${currency} over the last six months`}
          className="h-auto w-full overflow-visible"
          role="img"
          viewBox={`0 0 ${width} ${height}`}
        >
          <defs>
            <linearGradient id="cashflow-fill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="var(--color-brand)" stopOpacity="0.22" />
              <stop offset="100%" stopColor="var(--color-brand)" stopOpacity="0.01" />
            </linearGradient>
          </defs>
          {[0, 1, 2, 3, 4].map((line) => {
            const y = top + (chartHeight * line) / 4;
            const amount = gridMax * (1 - line / 4);
            return (
              <g key={line}>
                <line
                  stroke="var(--color-border)"
                  strokeDasharray={line === 4 ? undefined : "3 5"}
                  x1={left}
                  x2={width - right}
                  y1={y}
                  y2={y}
                />
                <text
                  fill="var(--color-muted)"
                  fontSize="10"
                  textAnchor="end"
                  x={left - 10}
                  y={y + 3}
                >
                  {compactCurrency(amount, currency)}
                </text>
              </g>
            );
          })}
          {hasData && <path d={areaPath} fill="url(#cashflow-fill)" />}
          {hasData && (
            <path
              d={linePath}
              fill="none"
              stroke="var(--color-brand)"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="3"
            />
          )}
          {points.map((point) => (
            <g key={point.key}>
              {hasData && point.amount > 0 && (
                <>
                  <circle cx={point.x} cy={point.y} fill="var(--color-surface)" r="5" stroke="var(--color-brand)" strokeWidth="3" />
                  <title>{`${point.label}: ${formatter.format(point.amount)}`}</title>
                </>
              )}
              <text
                fill="var(--color-muted)"
                fontSize="11"
                textAnchor="middle"
                x={point.x}
                y={height - 7}
              >
                {point.label}
              </text>
            </g>
          ))}
        </svg>
        {!hasData && (
          <p className="pointer-events-none absolute inset-x-0 top-[42%] text-center text-sm text-muted">
            No successful payments recorded in this period yet.
          </p>
        )}
      </div>
    </div>
  );
}

function OccupancyChart({
  occupied,
  rate,
  total,
}: {
  occupied: number;
  rate: number;
  total: number;
}) {
  const radius = 62;
  const circumference = 2 * Math.PI * radius;
  const progress = circumference * Math.min(Math.max(rate, 0), 1);

  return (
    <div className="relative h-40 w-40">
      <svg aria-hidden="true" className="h-full w-full -rotate-90" viewBox="0 0 160 160">
        <circle
          cx="80"
          cy="80"
          fill="none"
          r={radius}
          stroke="var(--color-border-strong)"
          strokeWidth="14"
        />
        <circle
          cx="80"
          cy="80"
          fill="none"
          r={radius}
          stroke="var(--color-brand)"
          strokeDasharray={`${progress} ${circumference}`}
          strokeLinecap="round"
          strokeWidth="14"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-semibold tracking-tight text-ink">
          {Math.round(rate * 100)}%
        </span>
        <span className="mt-1 text-xs text-muted">
          {occupied} of {total} units
        </span>
      </div>
    </div>
  );
}

function LegendItem({
  color,
  label,
  value,
}: {
  color: string;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
      <span className="min-w-0 flex-1 truncate text-xs text-muted">{label}</span>
      <span className="text-sm font-semibold text-ink">{value}</span>
    </div>
  );
}

function MiniMetric({ href, label, value }: { href: string; label: string; value: number }) {
  return (
    <Link
      className="block rounded-lg p-2 transition hover:bg-background focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      href={href}
    >
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 text-lg font-semibold text-ink">{value}</p>
    </Link>
  );
}

function MetricIcon({ name }: { name: "building" | "units" | "occupancy" | "payments" }) {
  const paths = {
    building: "M4 20V7l8-4 8 4v13M3 20h18M8 9h.01M12 9h.01M16 9h.01M8 13h.01M12 13h.01M16 13h.01",
    units: "M4 6h16M4 12h16M4 18h16M8 4v4M16 10v4M8 16v4",
    occupancy: "M12 3v9l6.4 6.4M20.5 12a8.5 8.5 0 1 1-8.5-8.5",
    payments: "M3 7h18v13H3zM3 10h18M7 16h4M7 4h10",
  }[name];

  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
      <path
        d={paths}
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
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

function compactCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    notation: "compact",
    maximumFractionDigits: 0,
  }).format(amount);
}

function DashboardLoading() {
  return (
    <main
      aria-label="Loading portfolio dashboard"
      aria-live="polite"
      className="min-h-screen px-5 py-7 sm:px-8 sm:py-10"
    >
      <div className="mx-auto max-w-[1440px] animate-pulse">
        <div className="h-4 w-36 rounded bg-border" />
        <div className="mt-3 h-9 w-72 rounded bg-border" />
        <div className="mt-3 h-4 w-96 max-w-full rounded bg-border" />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <div className="h-32 rounded-2xl border border-border bg-surface" key={index} />
          ))}
        </div>
        <div className="mt-6 grid gap-5 xl:grid-cols-[1.8fr_0.8fr]">
          <div className="h-[390px] rounded-2xl border border-border bg-surface" />
          <div className="h-[390px] rounded-2xl border border-border bg-surface" />
        </div>
      </div>
    </main>
  );
}
