"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";

const landlordLinks = [
  ["/dashboard", "Dashboard"],
  ["/properties", "Properties"],
  ["/units", "Units"],
  ["/leases", "Leases"],
  ["/payments", "Payments"],
  ["/maintenance", "Maintenance"],
  ["/tenants", "Tenants"],
];

const tenantLinks = [
  ["/my-lease", "My Lease"],
  ["/payments", "Payments"],
  ["/maintenance", "Requests"],
];

export default function Nav() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const role = session?.user?.role;
  const links = status === "authenticated" ? (role === "landlord" ? landlordLinks : tenantLinks) : [];

  return (
    <nav className="glass-nav sticky top-0 z-50">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-5 gap-y-2 px-6 py-3.5">
        <Link
          href={status !== "authenticated" ? "/" : role === "tenant" ? "/my-lease" : "/dashboard"}
          className="flex items-center gap-2 font-bold tracking-tight text-slate-900"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-sm">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
              <path d="M3 10.5 12 3l9 7.5" />
              <path d="M5.5 9.5V21h13V9.5" />
              <path d="M10 21v-6h4v6" />
            </svg>
          </span>
          Rental
        </Link>

        <div className="no-scrollbar order-3 -mx-1 flex w-full items-center gap-1 overflow-x-auto pb-1 text-sm md:order-none md:mx-0 md:w-auto md:flex-1 md:overflow-visible md:pb-0">
          {links.map(([href, label]) => (
            <Link
              key={href}
              href={href}
              className={
                pathname === href
                  ? "whitespace-nowrap rounded-full bg-white/70 px-3 py-1.5 font-semibold text-blue-700 shadow-sm ring-1 ring-white/80"
                  : "whitespace-nowrap rounded-full px-3 py-1.5 text-slate-600 transition hover:bg-white/50 hover:text-slate-900"
              }
            >
              {label}
            </Link>
          ))}
        </div>

        {status === "authenticated" ? (
          <div className="flex items-center gap-3 text-sm">
            <span className="text-slate-500">{session.user.name || session.user.email}</span>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="rounded-full px-3 py-1.5 text-slate-600 transition hover:bg-white/60 hover:text-slate-900"
            >
              Sign out
            </button>
          </div>
        ) : status === "unauthenticated" ? (
          <div className="flex items-center gap-2 text-sm">
            <Link href="/login" className="rounded-full px-3 py-1.5 text-slate-600 transition hover:bg-white/60 hover:text-slate-900">
              Login
            </Link>
            <Link
              href="/register"
              className="rounded-full bg-blue-600 px-4 py-1.5 font-medium text-white shadow-md shadow-blue-600/25 transition hover:bg-blue-700"
            >
              Register
            </Link>
          </div>
        ) : null}
      </div>
    </nav>
  );
}
