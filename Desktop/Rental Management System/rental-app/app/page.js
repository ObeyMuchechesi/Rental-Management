import Link from "next/link";
import Image from "next/image";

const features = [
  {
    title: "Properties & Units",
    body: "Track every building and unit, with rent and occupancy status.",
    icon: (
      <path d="M3 10.5 12 3l9 7.5M5.5 9.5V21h13V9.5M10 21v-6h4v6" />
    ),
  },
  {
    title: "Tenants & Leases",
    body: "Create leases in seconds; units flip to occupied automatically.",
    icon: <path d="M7 4h7l4 4v12H7zM14 4v4h4M10 13h5M10 16.5h5" />,
  },
  {
    title: "Rent Payments",
    body: "Monthly invoices generated on lease creation, paid or pending at a glance.",
    icon: <path d="M4 7h16v10H4zM4 10.5h16M7.5 14h3" />,
  },
  {
    title: "Maintenance",
    body: "Tenants file requests; you track them from open to resolved.",
    icon: <path d="M14.7 6.3a3.5 3.5 0 0 0 4.6 4.6L21 13l-8 8-2.1-2.1a3.5 3.5 0 0 1-6.2-3.5L3 13l8-8z" />,
  },
];

const steps = [
  ["Landlords", "Add a property, then its units and tenants."],
  ["Leases", "Create a lease — rent invoices are generated automatically."],
  ["Tenants", "Sign in to see the lease, pay rent and raise requests."],
];

export default function Home() {
  return (
    <div className="-mx-6 space-y-16 px-6 pb-16">
      {/* ---------- hero ---------- */}
      <section className="grid items-center gap-8 pt-10 lg:grid-cols-[1.05fr_1fr] lg:gap-12 lg:pt-16">
        <div className="glass rounded-[2rem] p-8 md:p-10">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/60 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-700 ring-1 ring-white/80">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
            Rental Management
          </span>

          <h1 className="mt-5 text-4xl font-bold tracking-tight text-slate-900 md:text-5xl md:leading-[1.08]">
            Run your rentals from <span className="text-gradient">one clean dashboard</span>
          </h1>

          <p className="mt-5 max-w-xl text-base text-slate-600 md:text-lg">
            Manage properties, units, tenants, leases and rent — while tenants get their own portal for payments and
            maintenance requests.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/register"
              className="rounded-xl bg-blue-600 px-6 py-3 font-medium text-white shadow-lg shadow-blue-600/25 transition hover:-translate-y-0.5 hover:bg-blue-700"
            >
              Create an account
            </Link>
            <Link
              href="/login"
              className="glass-soft rounded-xl px-6 py-3 font-medium text-slate-800 transition hover:bg-white/70"
            >
              Sign in
            </Link>
          </div>

          <dl className="mt-8 grid grid-cols-3 gap-3 border-t border-white/60 pt-6">
            {[
              ["One place", "for every door"],
              ["Auto", "rent invoices"],
              ["Live", "occupancy"],
            ].map(([big, small]) => (
              <div key={big}>
                <dt className="text-sm font-semibold text-slate-900">{big}</dt>
                <dd className="text-xs text-slate-500">{small}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="relative">
          <div className="absolute -inset-5 rounded-[2.5rem] bg-gradient-to-tr from-blue-500/30 via-purple-500/25 to-cyan-400/30 blur-2xl" />
          <div className="glass relative overflow-hidden rounded-[2rem] p-2.5">
            <Image
              src="/house.jpg"
              alt="Modern rental home at dusk"
              width={1400}
              height={933}
              priority
              sizes="(max-width: 1024px) 100vw, 560px"
              className="h-[320px] w-full rounded-[1.6rem] object-cover md:h-[440px]"
            />

            <div className="glass-chip absolute left-5 top-5 rounded-2xl px-4 py-2.5">
              <p className="text-[11px] uppercase tracking-wider text-slate-500">Occupancy</p>
              <p className="text-lg font-bold text-green-600">100%</p>
            </div>

            <div className="glass-chip absolute bottom-5 left-5 right-5 flex items-center justify-between rounded-2xl px-4 py-3">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-slate-500">Collected this month</p>
                <p className="text-lg font-bold text-slate-900">$2,700</p>
              </div>
              <span className="rounded-full bg-green-500/15 px-3 py-1 text-xs font-semibold text-green-700">
                On track
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- features ---------- */}
      <section className="grid gap-4 sm:grid-cols-2">
        {features.map((f) => (
          <div key={f.title} className="glass-card lift rounded-2xl p-6">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md shadow-blue-600/25">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5"
              >
                {f.icon}
              </svg>
            </span>
            <h2 className="mt-4 font-semibold text-slate-900">{f.title}</h2>
            <p className="mt-1 text-sm text-slate-600">{f.body}</p>
          </div>
        ))}
      </section>

      {/* ---------- how it works ---------- */}
      <section className="glass rounded-[2rem] p-8 md:p-10">
        <h2 className="text-xl font-semibold text-slate-900">How it works</h2>
        <p className="mt-1 text-sm text-slate-600">From first property to first payment in three steps.</p>

        <ol className="mt-6 grid gap-6 sm:grid-cols-3">
          {steps.map(([title, body], i) => (
            <li key={title} className="glass-soft rounded-2xl p-5">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-sm font-semibold text-blue-700 ring-1 ring-white">
                {i + 1}
              </span>
              <p className="mt-3 font-medium text-slate-900">{title}</p>
              <p className="mt-1 text-sm text-slate-600">{body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ---------- portal CTA ---------- */}
      <section className="glass grid overflow-hidden rounded-[2rem] md:grid-cols-[1.1fr_0.9fr]">
        <div className="p-8 md:p-10">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-700">Two portals, one system</p>
          <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
            Landlord or tenant, everything is where you expect it
          </h2>
          <p className="mt-3 text-sm text-slate-600 md:text-base">
            Landlords manage the portfolio; tenants see their lease, rent due and maintenance requests the moment they
            sign in.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/register"
              className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:-translate-y-0.5 hover:bg-slate-800"
            >
              Get started
            </Link>
            <Link
              href="/login"
              className="glass-soft rounded-xl px-5 py-2.5 text-sm font-medium text-slate-800 transition hover:bg-white/70"
            >
              I already have an account
            </Link>
          </div>
        </div>

        <div className="relative min-h-[220px]">
          <Image
            src="/home.jpg"
            alt="White house with a pool"
            width={1000}
            height={667}
            sizes="(max-width: 768px) 100vw, 420px"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-white/70 via-white/20 to-transparent md:from-white/60" />
        </div>
      </section>
    </div>
  );
}
