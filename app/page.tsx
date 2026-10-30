import Link from "next/link";

const features = [
  {
    number: "01",
    title: "See the whole picture",
    description:
      "Keep properties, people, and day-to-day operations together in one clear workspace.",
    icon: "overview",
  },
  {
    number: "02",
    title: "Stay ahead of the details",
    description:
      "Bring maintenance, rent, and important dates into focus before they become a scramble.",
    icon: "calendar",
  },
  {
    number: "03",
    title: "Make better decisions",
    description:
      "Turn a busy portfolio into useful insights, so your next move feels more considered.",
    icon: "insight",
  },
];

export default function Home() {
  return (
    <main className="overflow-hidden bg-[#f7f8f6] text-[#17231f]">
      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-5 sm:px-10 lg:px-12">
        <Brand />
        <nav aria-label="Main navigation" className="flex items-center gap-3">
          <Link
            className="hidden rounded-full px-5 py-2.5 text-sm font-semibold text-[#40564c] transition hover:bg-[#e9eee9] sm:inline-flex"
            href="/login"
          >
            Log in
          </Link>
          <Link
            className="inline-flex items-center gap-2 rounded-full bg-[#1d5745] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#174737] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1d5745]"
            href="/register"
          >
            Get started
            <ArrowIcon />
          </Link>
        </nav>
      </header>

      <section className="relative mx-auto grid max-w-7xl items-center gap-14 px-6 pb-20 pt-10 sm:px-10 sm:pb-24 sm:pt-14 lg:grid-cols-[0.94fr_1.06fr] lg:gap-10 lg:px-12 lg:pb-32 lg:pt-16">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-72 top-10 h-[34rem] w-[34rem] rounded-full bg-[#e7efe4] blur-3xl"
        />
        <div className="relative z-10 max-w-xl">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#dce6dc] bg-white/80 px-3.5 py-2 text-xs font-semibold tracking-wide text-[#426954] shadow-sm">
            <span className="h-2 w-2 rounded-full bg-[#77a66f]" />
            A clearer way to manage property
          </div>
          <h1 className="text-[3.25rem] font-semibold leading-[1.04] tracking-[-0.06em] text-[#17231f] sm:text-6xl lg:text-[4.35rem]">
            Make room for
            <span className="block text-[#47785d]">better property</span>
            management.
          </h1>
          <p className="mt-7 max-w-lg text-base leading-7 text-[#66736d] sm:text-lg sm:leading-8">
            PropertyDek brings your properties, tasks, and important details
            into one thoughtful workspace—so you can spend less time chasing
            information and more time moving things forward.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#1d5745] px-6 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(29,87,69,0.16)] transition hover:-translate-y-0.5 hover:bg-[#174737] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1d5745]"
              href="/register"
            >
              Create your free account
              <ArrowIcon />
            </Link>
            <Link
              className="inline-flex h-12 items-center justify-center rounded-full border border-[#d9e1da] bg-white/70 px-6 text-sm font-semibold text-[#344a3f] transition hover:border-[#aabdaf] hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1d5745]"
              href="/login"
            >
              I already have an account
            </Link>
          </div>
          <div className="mt-8 flex items-center gap-3 text-sm text-[#738078]">
            <div aria-hidden="true" className="flex -space-x-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#f7f8f6] bg-[#dce8d8] text-[10px] font-bold text-[#3d684d]">
                P
              </span>
              <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#f7f8f6] bg-[#f2ddc7] text-[10px] font-bold text-[#8a6242]">
                D
              </span>
              <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#f7f8f6] bg-[#dce4ef] text-[10px] font-bold text-[#4c6484]">
                K
              </span>
            </div>
            <span>One calm place for your property portfolio.</span>
          </div>
        </div>

        <DashboardPreview />
      </section>

      <section className="border-y border-[#e5e9e4] bg-white/65">
        <div className="mx-auto max-w-7xl px-6 py-16 sm:px-10 sm:py-20 lg:px-12">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#65806e]">
              The essentials, in sync
            </p>
            <h2 className="mt-4 text-3xl font-semibold leading-tight tracking-[-0.045em] sm:text-4xl">
              Less juggling. More clarity.
            </h2>
            <p className="mt-4 text-base leading-7 text-[#6b7771]">
              The work behind a well-run property portfolio deserves a home
              that feels just as considered.
            </p>
          </div>

          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {features.map((feature) => (
              <article
                className="rounded-2xl border border-[#e5e9e4] bg-[#fbfcfa] p-6 sm:p-7"
                key={feature.number}
              >
                <div className="flex items-center justify-between">
                  <FeatureIcon name={feature.icon} />
                  <span className="text-xs font-semibold tracking-[0.16em] text-[#99a49d]">
                    {feature.number}
                  </span>
                </div>
                <h3 className="mt-8 text-lg font-semibold tracking-tight text-[#23332b]">
                  {feature.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-[#6b7771]">
                  {feature.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16 sm:px-10 sm:py-20 lg:px-12">
        <div className="relative overflow-hidden rounded-[2rem] bg-[#153d32] px-7 py-12 text-white sm:px-12 sm:py-14 lg:flex lg:items-center lg:justify-between lg:px-16">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-20 -top-48 h-[26rem] w-[26rem] rounded-full border border-white/10"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-5 -top-32 h-[19rem] w-[19rem] rounded-full border border-white/10"
          />
          <div className="relative max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#c4e7a5]">
              Start with a clearer view
            </p>
            <h2 className="mt-4 text-3xl font-semibold leading-tight tracking-[-0.045em] sm:text-4xl">
              Your properties deserve a little more breathing room.
            </h2>
          </div>
          <Link
            className="relative mt-8 inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-[#c4e7a5] px-6 text-sm font-semibold text-[#153d32] transition hover:bg-[#d2efb9] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white lg:ml-10 lg:mt-0"
            href="/register"
          >
            Get started
            <ArrowIcon />
          </Link>
        </div>
      </section>

      <footer className="border-t border-[#e5e9e4]">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-6 text-sm text-[#78837c] sm:flex-row sm:items-center sm:justify-between sm:px-10 lg:px-12">
          <Brand />
          <p>Property management, made clearer.</p>
          <div className="flex gap-5">
            <Link className="transition hover:text-[#1d5745]" href="/login">
              Log in
            </Link>
            <Link className="transition hover:text-[#1d5745]" href="/register">
              Create account
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}

function Brand() {
  return (
    <Link
      aria-label="PropertyDek home"
      className="inline-flex w-fit items-center gap-2.5 text-base font-semibold tracking-tight text-[#153d32]"
      href="/"
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-[0.65rem] bg-[#153d32] text-[#c4e7a5]">
        <BuildingIcon />
      </span>
      PropertyDek
    </Link>
  );
}

function DashboardPreview() {
  return (
    <div className="relative mx-auto w-full max-w-[36rem] lg:ml-auto">
      <div
        aria-hidden="true"
        className="absolute -right-8 -top-8 h-36 w-36 rounded-full bg-[#dce9d5] blur-2xl"
      />
      <div className="relative rotate-[1deg] rounded-[1.7rem] border border-white/80 bg-white p-3 shadow-[0_28px_90px_rgba(35,67,48,0.16)] sm:p-4">
        <div className="overflow-hidden rounded-[1.2rem] border border-[#edf0eb] bg-[#f8faf7]">
          <div className="flex items-center justify-between border-b border-[#e9eee8] bg-white px-5 py-4">
            <div>
              <p className="text-xs font-medium text-[#89958d]">
                Tuesday, October 14
              </p>
              <p className="mt-1 text-sm font-semibold text-[#26372e]">
                Good morning, Alex
              </p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e5eee2] text-xs font-bold text-[#47785d]">
              A
            </div>
          </div>

          <div className="p-4 sm:p-5">
            <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
              <SummaryCard label="Properties" value="12" detail="+2 this year" />
              <SummaryCard label="Occupied" value="94%" detail="Portfolio-wide" />
              <SummaryCard label="To review" value="03" detail="This week" />
            </div>

            <div className="mt-4 rounded-xl border border-[#e9eee8] bg-white p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-[#2c3b33]">
                    Portfolio overview
                  </p>
                  <p className="mt-1 text-xs text-[#8a958e]">
                    Rental income · last 6 months
                  </p>
                </div>
                <span className="rounded-full bg-[#eff5eb] px-2.5 py-1 text-[10px] font-semibold text-[#557d5b]">
                  +8.2%
                </span>
              </div>
              <div aria-label="Rental income trending upward" className="mt-5 h-24">
                <svg
                  aria-hidden="true"
                  className="h-full w-full"
                  fill="none"
                  preserveAspectRatio="none"
                  viewBox="0 0 480 96"
                >
                  <path
                    d="M0 76H480M0 48H480M0 20H480"
                    stroke="#edf1ec"
                    strokeDasharray="3 5"
                  />
                  <path
                    d="M0 76C38 72 43 63 80 66S126 55 160 60 213 45 240 50 284 47 320 37 365 43 400 28 448 22 480 12V96H0V76Z"
                    fill="url(#chart-fill)"
                  />
                  <path
                    d="M0 76C38 72 43 63 80 66S126 55 160 60 213 45 240 50 284 47 320 37 365 43 400 28 448 22 480 12"
                    stroke="#62966e"
                    strokeLinecap="round"
                    strokeWidth="3"
                  />
                  <defs>
                    <linearGradient
                      id="chart-fill"
                      x1="240"
                      x2="240"
                      y1="12"
                      y2="96"
                      gradientUnits="userSpaceOnUse"
                    >
                      <stop stopColor="#bdd8b8" stopOpacity=".45" />
                      <stop offset="1" stopColor="#bdd8b8" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
              <div className="mt-2 flex justify-between text-[10px] text-[#9ba49e]">
                <span>May</span>
                <span>Jun</span>
                <span>Jul</span>
                <span>Aug</span>
                <span>Sep</span>
                <span>Oct</span>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-[#e9eee8] bg-white p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-[#2c3b33]">
                  Coming up
                </p>
                <span className="text-xs font-medium text-[#66836e]">
                  View calendar
                </span>
              </div>
              <div className="mt-3 flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-lg bg-[#f0f4ed] text-[#51775c]">
                  <span className="text-[9px] font-semibold uppercase">Oct</span>
                  <span className="text-sm font-bold leading-4">18</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-[#35463c]">
                    Quarterly maintenance check
                  </p>
                  <p className="mt-1 text-[10px] text-[#929c95]">
                    24 Willow Lane · 10:30 AM
                  </p>
                </div>
                <span className="h-2 w-2 rounded-full bg-[#e9b875]" />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="absolute -bottom-5 -left-4 hidden items-center gap-3 rounded-2xl border border-[#e7ece5] bg-white px-4 py-3 shadow-lg sm:flex">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#edf5e9] text-[#56805d]">
          <CheckIcon />
        </span>
        <div>
          <p className="text-xs font-semibold text-[#34463b]">
            You&apos;re up to date
          </p>
          <p className="mt-0.5 text-[10px] text-[#87938b]">
            Nothing urgent needs your attention
          </p>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="min-w-0 rounded-xl border border-[#e9eee8] bg-white p-3 sm:p-4">
      <p className="truncate text-[10px] font-medium text-[#8c9890] sm:text-xs">
        {label}
      </p>
      <p className="mt-2 text-xl font-semibold tracking-tight text-[#26372e] sm:text-2xl">
        {value}
      </p>
      <p className="mt-1 truncate text-[9px] text-[#8c9890] sm:text-[10px]">
        {detail}
      </p>
    </div>
  );
}

function FeatureIcon({ name }: { name: string }) {
  return (
    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#edf4ea] text-[#47785d]">
      {name === "overview" ? (
        <BuildingIcon />
      ) : name === "calendar" ? (
        <CalendarIcon />
      ) : (
        <InsightIcon />
      )}
    </span>
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

function ArrowIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 20 20">
      <path
        d="M4.5 10h11m-4.5-4.5L15.5 10 11 14.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.6"
      />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
      <path
        d="M7.5 3.75v3m9-3v3m-12 2.5h15m-15-4h15a1.5 1.5 0 0 1 1.5 1.5v13.5a1.5 1.5 0 0 1-1.5 1.5h-15a1.5 1.5 0 0 1-1.5-1.5V6.75a1.5 1.5 0 0 1 1.5-1.5Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.6"
      />
      <path d="M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
    </svg>
  );
}

function InsightIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
      <path
        d="M4 19.25h16M6.75 16.25v-4m5.25 4v-8m5.25 8v-6m-10.5-2 4.5-3 5.25 2.25 2.75-2"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
      <path
        d="m5 12.5 4.5 4.25L19 7.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}
