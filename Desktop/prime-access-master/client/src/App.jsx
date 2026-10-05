import { Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { trackPageView } from './api';
import { useSettings } from './SettingsContext';

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import WhatsAppFloat from './components/WhatsAppFloat';
import AnnouncementBar from './components/AnnouncementBar';

import Home from './pages/Home';
import About from './pages/About';
import Services from './pages/Services';
import ServiceDetail from './pages/ServiceDetail';
import FlightBooking from './pages/FlightBooking';
import Contact from './pages/Contact';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';

import AdminLogin from './admin/Login';
import AdminLayout from './admin/AdminLayout';
import Dashboard from './admin/Dashboard';
import Inquiries from './admin/Inquiries';
import ServicesAdmin from './admin/ServicesAdmin';
import SettingsAdmin from './admin/SettingsAdmin';
import MediaAdmin from './admin/MediaAdmin';
import AnalyticsAdmin from './admin/AnalyticsAdmin';

function PublicShell({ children }) {
  const { settings } = useSettings();
  const location = useLocation();

  useEffect(() => {
    trackPageView();
  }, [location.pathname]);

  useEffect(() => {
    if (settings?.seoTitle) document.title = settings.seoTitle;
    if (settings?.seoDescription) {
      let meta = document.querySelector('meta[name="description"]');
      if (!meta) {
        meta = document.createElement('meta');
        meta.name = 'description';
        document.head.appendChild(meta);
      }
      meta.content = settings.seoDescription;
    }
  }, [settings]);

  return (
    <div className="flex min-h-screen flex-col">
      <AnnouncementBar />
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      <WhatsAppFloat />
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="inquiries" element={<Inquiries />} />
        <Route path="services" element={<ServicesAdmin />} />
        <Route path="settings" element={<SettingsAdmin />} />
        <Route path="media" element={<MediaAdmin />} />
        <Route path="analytics" element={<AnalyticsAdmin />} />
      </Route>

      <Route path="*" element={<PublicShell><Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/services" element={<Services />} />
        <Route path="/services/:slug" element={<ServiceDetail />} />
        <Route path="/flight-booking" element={<FlightBooking />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
      </Routes></PublicShell>} />
    </Routes>
  );
}