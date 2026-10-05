import { useEffect, useState } from 'react';
import { NavLink, Outlet, Navigate, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Inbox, Briefcase, Settings, Clapperboard, BarChart3, LogOut, ExternalLink, Menu, X, KeyRound, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { api, getToken, setToken } from '../api';
import logoMark from '../assets/logo-mark.png';

function loadSidebarPref() {
  try {
    return localStorage.getItem('pa_admin_sidebar') === 'collapsed';
  } catch {
    return false;
  }
}

const NAV = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/inquiries', label: 'Inquiries', icon: Inbox },
  { to: '/admin/services', label: 'Services', icon: Briefcase },
  { to: '/admin/media', label: 'Media & Videos', icon: Clapperboard },
  { to: '/admin/settings', label: 'Site Settings', icon: Settings },
  { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
];

export default function AdminLayout() {
  const [authed, setAuthed] = useState(null); // null = checking
  const [open, setOpen] = useState(false);
  const [admin, setAdmin] = useState(null);
  const [collapsed, setCollapsed] = useState(loadSidebarPref);
  const navigate = useNavigate();

  function toggleSidebar() {
    setCollapsed((c) => {
      const next = !c;
      try {
        localStorage.setItem('pa_admin_sidebar', next ? 'collapsed' : 'expanded');
      } catch {}
      return next;
    });
  }

  useEffect(() => {
    if (!getToken()) return setAuthed(false);
    api('/auth/me')
      .then((d) => { setAdmin(d.admin); setAuthed(true); })
      .catch(() => { setToken(null); setAuthed(false); });
  }, []);

  if (authed === null) {
    return <div className="flex min-h-screen items-center justify-center bg-brand-950 text-brand-300">Checking session...</div>;
  }
  if (authed === false) return <Navigate to="/admin/login" replace />;

  function logout() {
    api('/auth/logout').catch(() => {});
    setToken(null);
    navigate('/admin/login');
  }

  const Sidebar = ({ rail = false }) => (
    <div className="flex h-full flex-col">
      <div className={`flex items-center gap-3 py-5 ${rail ? 'justify-center px-0' : 'px-5'}`}>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-950 p-1 ring-1 ring-gold-500/40">
          <img src={logoMark} alt="" aria-hidden="true" className="h-full w-full object-contain" />
        </span>
        {!rail && (
          <div className="min-w-0 leading-tight">
            <p className="truncate font-display text-base font-bold text-white">Prime Access</p>
            <p className="truncate text-[10px] font-semibold uppercase tracking-[0.2em] text-gold-400">Admin Dashboard</p>
          </div>
        )}
      </div>

      <nav className={`mt-2 flex-1 space-y-1 ${rail ? 'px-2' : 'px-3'}`}>
        {NAV.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.end}
            onClick={() => setOpen(false)}
            title={rail ? n.label : undefined}
            className={({ isActive }) =>
              `flex items-center rounded-lg py-2.5 text-sm font-medium transition ${
                rail ? 'justify-center px-0' : 'gap-3 px-3.5'
              } ${isActive ? 'bg-gold-500 text-brand-950' : 'text-brand-200 hover:bg-white/10 hover:text-white'}`
            }
          >
            <n.icon size={17} className="shrink-0" />
            {!rail && n.label}
          </NavLink>
        ))}
      </nav>

      <div className={`space-y-1 border-t border-white/10 py-4 ${rail ? 'px-2' : 'px-3'}`}>
        <NavLink
          to="/admin/settings"
          title={rail ? 'Change Password' : undefined}
          className={`flex items-center rounded-lg py-2.5 text-sm font-medium text-brand-200 hover:bg-white/10 hover:text-white ${rail ? 'justify-center px-0' : 'gap-3 px-3.5'}`}
        >
          <KeyRound size={17} className="shrink-0" />
          {!rail && 'Change Password'}
        </NavLink>
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          title={rail ? 'View Website' : undefined}
          className={`flex items-center rounded-lg py-2.5 text-sm font-medium text-brand-200 hover:bg-white/10 hover:text-white ${rail ? 'justify-center px-0' : 'gap-3 px-3.5'}`}
        >
          <ExternalLink size={17} className="shrink-0" />
          {!rail && 'View Website'}
        </a>
        <button
          onClick={logout}
          title={rail ? 'Logout' : undefined}
          className={`flex w-full items-center rounded-lg py-2.5 text-sm font-medium text-red-300 hover:bg-red-500/10 ${rail ? 'justify-center px-0' : 'gap-3 px-3.5'}`}
        >
          <LogOut size={17} className="shrink-0" />
          {!rail && 'Logout'}
        </button>
        {admin && !rail && (
          <p className="mt-2 truncate px-3.5 text-[11px] text-brand-400">Signed in as {admin.email}</p>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-brand-50/50">
      {/* Desktop sidebar - collapsible to an icon rail */}
      <aside className={`fixed inset-y-0 left-0 z-30 hidden bg-brand-950 transition-[width] duration-200 ease-in-out lg:block ${collapsed ? 'w-[76px]' : 'w-64'}`}>
        <Sidebar rail={collapsed} />
        <button
          onClick={toggleSidebar}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="absolute -right-3 top-10 z-40 hidden h-7 w-7 items-center justify-center rounded-full border border-brand-100 bg-white text-brand-700 shadow-card transition hover:text-brand-950 lg:flex"
        >
          {collapsed ? <PanelLeftOpen size={14} /> : <PanelLeftClose size={14} />}
        </button>
      </aside>

      {/* Mobile top bar + drawer */}
      <div className="fixed inset-x-0 top-0 z-30 flex h-14 items-center justify-between bg-brand-950 px-4 lg:hidden">
        <span className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 p-0.5 ring-1 ring-gold-500/40">
            <img src={logoMark} alt="" aria-hidden="true" className="h-full w-full object-contain" />
          </span>
          <span className="font-display text-base font-bold text-white">Prime Access Admin</span>
        </span>
        <button onClick={() => setOpen(!open)} className="rounded-md p-2 text-white" aria-label="Toggle menu">
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
      {open && (
        <div className="fixed inset-0 z-20 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 bg-brand-950"><Sidebar /></aside>
        </div>
      )}

      <main className={`min-w-0 flex-1 px-4 pb-12 pt-20 transition-[margin] duration-200 ease-in-out sm:px-6 lg:px-10 lg:pt-10 ${collapsed ? 'lg:ml-[76px]' : 'lg:ml-64'}`}>
        <Outlet />
      </main>
    </div>
  );
}