import React, { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AppRoutes } from './routes/AppRoutes';
import { useAuthStore } from './shared/auth/useAuthStore';
import { useDirectoryStore } from './shared/directory/useDirectoryStore';

export default function App(): React.JSX.Element {
  useEffect(() => {
    const bootstrap = async () => {
      await useAuthStore.getState().initAuth();
      await useDirectoryStore.getState().fetchDirectory();
    };
    bootstrap();
  }, []);

  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
