import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import { Loader } from './components/ui';
import { useAuth } from './context/AuthContext';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import PostLoad from './pages/PostLoad';
import PostTruck from './pages/PostTruck';
import SearchTrucks from './pages/SearchTrucks';
import BrowseLoads from './pages/BrowseLoads';
import Pricing from './pages/Pricing';
import Admin from './pages/Admin';

function Protected({ roles, children }) {
  const { user, loading } = useAuth();

  if (loading) return <Loader label="Checking your session…" />;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/pricing" element={<Pricing />} />

        <Route
          path="/dashboard"
          element={
            <Protected>
              <Dashboard />
            </Protected>
          }
        />
        <Route
          path="/loads/new"
          element={
            <Protected roles={['shipper']}>
              <PostLoad />
            </Protected>
          }
        />
        <Route
          path="/trucks/new"
          element={
            <Protected roles={['carrier']}>
              <PostTruck />
            </Protected>
          }
        />
        <Route
          path="/search/:loadId"
          element={
            <Protected roles={['shipper']}>
              <SearchTrucks />
            </Protected>
          }
        />
        <Route
          path="/loads"
          element={
            <Protected roles={['carrier']}>
              <BrowseLoads />
            </Protected>
          }
        />
        <Route
          path="/admin"
          element={
            <Protected roles={['admin']}>
              <Admin />
            </Protected>
          }
        />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
}
