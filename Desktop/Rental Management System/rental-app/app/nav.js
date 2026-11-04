"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Building2,
  DoorOpen,
  ScrollText,
  Wallet,
  Wrench,
  Users,
  UserCheck,
  Settings,
  LogOut,
  Menu,
  X,
  Home,
} from "lucide-react";

const landlordLinks = [
  ["/dashboard", "Dashboard", LayoutDashboard],
  ["/properties", "Properties", Building2],
  ["/units", "Units", DoorOpen],
  ["/leases", "Leases", ScrollText],
  ["/payments", "Payments", Wallet],
  ["/maintenance", "Maintenance", Wrench],
  ["/tenants", "Tenants", Users],
  ["/approvals", "Approvals", UserCheck],
];

const tenantLinks = [
  ["/my-lease", "My lease", ScrollText],
  ["/payments", "Payments", Wallet],
  ["/maintenance", "Requests", Wrench],
];

export default function Nav() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(0);

  const role = session?.user?.role;
  const authed = status === "authenticated";
  const links = authed ? (role === "landlord" ? landlordLinks : tenantLinks) : [];

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!authed || role !== "landlord") return;
    let live = true;
    fetch("/api/approvals")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => live && d && setPending(d.counts?.pending || 0))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [authed, role, pathname]);

  const active = (href) => pathname === href;

  return (
    <nav className="glass-nav sticky top-0 z-50">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
        <Link
          href={!authed ? "/" : role === "tenant" ? "/my-lease" : "/dashboard"}
          className="flex shrink-0 items-center gap-2 font-bold tracking-tight text-slate-900"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/30">
            <Home className="h-[18px] w-[18px]" strokeWidth={2.2} />
          </span>
          <span className="text-base">Rental</span>
        </Link>

        {/* desktop links */}
        {authed && (
          <div className="ml-2 hidden flex-1 items-center gap-0.5 md:flex">
            {links.map(([href, label, Icon]) => (
              <Link
                key={href}
                href={href}
                className={
                  active(href)
                    ? "flex items-center gap-2 whitespace-nowrap rounded-full bg-white/75 px-3 py-2 text-sm font-semibold text-blue-700 shadow-sm ring-1 ring-white/80"
                    : "flex items-center gap-2 whitespace-nowrap rounded-full px-3 py-2 text-sm text-slate-600 transition hover:bg-white/55 hover:text-slate-900"
                }
              >
                <Icon className="h-4 w-4" strokeWidth={2} />
                {label}
                {href === "/approvals" && pending > 0 ? (
                  <span className="ml-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-600 px-1.5 text-[10px] font-bold text-white">
                    {pending}
                  </span>
                ) : null}
              </Link>
            ))}
          </div>
        )}

        {!authed && <div className="flex-1" />}

        {authed ? (
          <div className="ml-auto hidden items-center gap-1 md:flex">
            <Link
              href="/account"
              className="flex items-center gap-2 rounded-full px-2.5 py-2 text-sm text-slate-600 transition hover:bg-white/55 hover:text-slate-900"
              title="Account settings"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-slate-700 to-slate-900 text-xs font-bold uppercase text-white">
                {(session.user.name || session.user.email || "?").slice(0, 1)}
              </span>
              <span className="max-w-[10rem] truncate">{session.user.name || session.user.email}</span>
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="rounded-full p-2 text-slate-500 transition hover:bg-white/60 hover:text-slate-900"
              title="Sign out"
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : status === "unauthenticated" ? (
          <div className="ml-auto flex items-center gap-2 text-sm">
            <Link href="/login" className="rounded-full px-3 py-2 text-slate-600 transition hover:bg-white/60 hover:text-slate-900">
              Sign in
            </Link>
            <Link
              href="/register"
              className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-blue-600/25 transition hover:bg-blue-700"
            >
              Tenant sign up
            </Link>
          </div>
        ) : null}

        {authed && (
          <button
            onClick={() => setOpen((v) => !v)}
            className="ml-auto flex h-10 w-10 items-center justify-center rounded-xl bg-white/60 text-slate-700 shadow-sm md:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        )}
      </div>

      {/* mobile sheet */}
      {authed && open && (
        <div className="border-t border-white/60 px-4 pb-4 pt-2 md:hidden">
          <div className="grid grid-cols-2 gap-2">
            {links.map(([href, label, Icon]) => (
              <Link
                key={href}
                href={href}
                className={
                  active(href)
                    ? "flex items-center gap-2 rounded-xl bg-white/80 px-3 py-3 text-sm font-semibold text-blue-700 shadow-sm"
                    : "flex items-center gap-2 rounded-xl bg-white/45 px-3 py-3 text-sm font-medium text-slate-700"
                }
              >
                <Icon className="h-4 w-4" strokeWidth={2} />
                {label}
                {href === "/approvals" && pending > 0 ? (
                  <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-600 px-1.5 text-[10px] font-bold text-white">
                    {pending}
                  </span>
                ) : null}
              </Link>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between rounded-xl bg-white/55 px-3 py-2.5">
            <span className="flex min-w-0 items-center gap-2 text-sm text-slate-700">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-slate-700 to-slate-900 text-xs font-bold uppercase text-white">
                {(session.user.name || session.user.email || "?").slice(0, 1)}
              </span>
              <span className="truncate">{session.user.name || session.user.email}</span>
            </span>
            <div className="flex items-center gap-1">
              <Link href="/account" className="rounded-lg p-2 text-slate-600" aria-label="Account settings">
                <Settings className="h-4 w-4" />
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="rounded-lg p-2 text-slate-600"
                aria-label="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
