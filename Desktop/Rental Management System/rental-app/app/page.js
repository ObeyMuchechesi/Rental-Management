import Link from "next/link";

const features = [
  { title: "Properties & Units", body: "Track every building and unit, with rent and occupancy status." },
  { title: "Tenants & Leases", body: "Create leases in seconds; units flip to occupied automatically." },
  { title: "Rent Payments", body: "Monthly invoices generated on lease creation, paid or pending at a glance." },
  { title: "Maintenance", body: "Tenants file requests; you track them from open to resolved." },
];

export default function Home() {
  return (
    <div className="space-y-16 py-10">
      <section className="text-center space-y-5">
        <p className="text-sm font-semibold uppercase tracking-widest text-blue-600">Rental Management</p>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900">
          Run your rentals from one clean dashboard
        </h1>
        <p className="max-w-2xl mx-auto text-lg text-gray-600">
          Manage properties, units, tenants, leases and rent — while tenants get their own portal for payments
          and maintenance requests.
        </p>
        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <Link href="/register" className="rounded-lg bg-blue-600 px-6 py-3 text-white font-medium hover:bg-blue-700">
            Create an account
          </Link>
          <Link href="/login" className="rounded-lg border border-gray-300 bg-white px-6 py-3 font-medium text-gray-800 hover:bg-gray-50">
            Sign in
          </Link>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        {features.map((f) => (
          <div key={f.title} className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="font-semibold text-gray-900">{f.title}</h2>
            <p className="mt-1 text-sm text-gray-600">{f.body}</p>
          </div>
        ))}
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-8">
        <h2 className="text-xl font-semibold text-gray-900">How it works</h2>
        <ol className="mt-4 grid gap-6 sm:grid-cols-3">
          {[
            ["Landlords", "Add a property, then its units and tenants."],
            ["Leases", "Create a lease — rent invoices are generated automatically."],
            ["Tenants", "Sign in to see the lease, pay rent and raise requests."],
          ].map(([title, body], i) => (
            <li key={title}>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-700">
                {i + 1}
              </span>
              <p className="mt-2 font-medium text-gray-900">{title}</p>
              <p className="text-sm text-gray-600">{body}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
