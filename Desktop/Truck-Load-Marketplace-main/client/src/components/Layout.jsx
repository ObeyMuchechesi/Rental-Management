import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { initials, planLabel } from '../lib/format';

const navFor = (role) => {
  if (role === 'carrier') {
    return [
      { to: '/dashboard', label: 'Dashboard' },
      { to: '/trucks/new', label: 'Add truck' },
      { to: '/loads', label: 'Find loads' },
      { to: '/pricing', label: 'Plans & billing' },
    ];
  }
  if (role === 'shipper') {
    return [
      { to: '/dashboard', label: 'Dashboard' },
      { to: '/loads/new', label: 'Post a load' },
      { to: '/pricing', label: 'Plans & billing' },
    ];
  }
  if (role === 'admin') {
    return [
      { to: '/dashboard', label: 'Dashboard' },
      { to: '/admin', label: 'Console' },
    ];
  }
  return [];
};

export default function Layout() {
  const { user, subscription, logout } = useAuth();
  const navigate = useNavigate();
  const links = navFor(user?.role);

  const planBadge = planLabel(subscription);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 overflow-hidden border-b border-slate-200 bg-white/85 backdrop-blur">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <img
            src="/photos/scania-lineup-bw.jpg"
            alt=""
            className="h-full w-full object-cover object-center opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/70 to-white/90" />
        </div>
        <div className="relative mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link to={user ? '/dashboard' : '/'} className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-sm font-bold text-white">
              TL
            </span>
            <span className="text-lg font-bold tracking-tight text-slate-900">
              Truck<span className="text-indigo-600">Link</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-2 text-sm font-medium transition ${
                    isActive
                      ? 'bg-slate-100 text-slate-900'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            {user ? (
              <>
                {user.role !== 'admin' && (
                  <span className="hidden rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 sm:inline">
                    {planBadge}
                  </span>
                )}
                <div className="flex items-center gap-2">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
                    {initials(user.name)}
                  </span>
                  <div className="hidden leading-tight sm:block">
                    <p className="text-sm font-semibold text-slate-900">{user.name}</p>
                    <p className="text-xs capitalize text-slate-500">{user.role}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    logout();
                    navigate('/login');
                  }}
                  className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900">
                  Sign in
                </Link>
                <Link to="/register" className="btn-primary">
                  Get started
                </Link>
              </>
            )}
          </div>
        </div>

        {links.length > 0 && (
          <nav className="relative flex gap-1 overflow-x-auto border-t border-slate-200 px-4 py-2 md:hidden">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium ${
                    isActive ? 'bg-slate-100 text-slate-900' : 'text-slate-600'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
        )}
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Outlet />
      </main>

      <footer className="mt-12 border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>© {new Date().getFullYear()} TruckLink. Freight matching for carriers and shippers.</p>
          <p>Carriers pay to be listed · Shippers pay to connect.</p>
        </div>
      </footer>
    </div>
  );
}
