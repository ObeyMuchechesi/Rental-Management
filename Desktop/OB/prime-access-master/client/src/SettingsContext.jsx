import { createContext, useContext, useEffect, useState } from 'react';
import { api } from './api';

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api('/settings/public', { auth: false })
      .then((d) => setSettings(d.settings))
      .catch((e) => console.error('Failed to load settings', e))
      .finally(() => setLoading(false));
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, loading, setSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}