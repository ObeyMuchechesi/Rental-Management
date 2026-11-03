"use client";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

export default function Nav() {
  const { data: session } = useSession();
  const role = session?.user?.role;

  const landlordLinks = (
    <>
      <Link href="/dashboard">Dashboard</Link>
      <Link href="/properties">Properties</Link>
      <Link href="/units">Units</Link>
      <Link href="/leases">Leases</Link>
      <Link href="/payments">Payments</Link>
      <Link href="/maintenance">Maintenance</Link>
      <Link href="/tenants">Tenants</Link>
    </>
  );

  const tenantLinks = (
    <>
      <Link href="/my-lease">My Lease</Link>
      <Link href="/payments">My Payments</Link>
      <Link href="/maintenance">Requests</Link>
    </>
  );

  return (
    <nav className="bg-white border-b">
      <div className="max-w-6xl mx-auto flex items-center gap-6 p-4">
        <Link href="/" className="font-bold">Rental</Link>
        <div className="flex gap-4 text-sm flex-1">
          {session ? (role === "landlord" ? landlordLinks : tenantLinks) : null}
        </div>
        {session ? (
          <button onClick={() => signOut({ callbackUrl: "/login" })} className="text-sm text-gray-600">
            Sign out
          </button>
        ) : (
          <div className="flex gap-3 text-sm">
            <Link href="/login">Login</Link>
            <Link href="/register">Register</Link>
          </div>
        )}
      </div>
    </nav>
  );
}