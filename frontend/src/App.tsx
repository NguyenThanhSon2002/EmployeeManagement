import React, { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AppRoutes } from './routes/AppRoutes';
import { useAuthStore } from './shared/auth/useAuthStore';

export default function App(): React.JSX.Element {
  useEffect(() => {
    useAuthStore.getState().initAuth();
  }, []);

  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
