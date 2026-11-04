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
    <nav className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 p-4">
        <Link
          href={status !== "authenticated" ? "/" : role === "tenant" ? "/my-lease" : "/dashboard"}
          className="font-bold text-gray-900"
        >
          Rental
        </Link>

        <div className="flex flex-1 flex-wrap gap-4 text-sm">
          {links.map(([href, label]) => (
            <Link
              key={href}
              href={href}
              className={pathname === href ? "font-semibold text-blue-600" : "text-gray-600 hover:text-gray-900"}
            >
              {label}
            </Link>
          ))}
        </div>

        {status === "authenticated" ? (
          <div className="flex items-center gap-3 text-sm">
            <span className="text-gray-500">{session.user.name || session.user.email}</span>
            <button onClick={() => signOut({ callbackUrl: "/login" })} className="text-gray-600 hover:text-gray-900">
              Sign out
            </button>
          </div>
        ) : status === "unauthenticated" ? (
          <div className="flex gap-3 text-sm">
            <Link href="/login" className="text-gray-600 hover:text-gray-900">
              Login
            </Link>
            <Link href="/register" className="text-blue-600 hover:text-blue-700">
              Register
            </Link>
          </div>
        ) : null}
      </div>
    </nav>
  );
}
