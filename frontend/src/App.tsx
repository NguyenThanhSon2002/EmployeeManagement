import React, { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AppRoutes } from './routes/AppRoutes';
import { useAuthStore } from './shared/auth/useAuthStore';
import { useDirectoryStore } from './shared/directory/useDirectoryStore';
import { useSettingsStore } from './features/settings/store/useSettingsStore';

export default function App(): React.JSX.Element {
  useEffect(() => {
    const bootstrap = async () => {
      await useAuthStore.getState().initAuth();
      if (useAuthStore.getState().isAuthenticated) {
        await Promise.all([
          useDirectoryStore.getState().fetchDirectory(),
          useSettingsStore.getState().fetchSettings(),
        ]).catch((err) => console.warn('Directory/settings bootstrap warning:', err));
      }
    };
    bootstrap();
  }, []);

  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
