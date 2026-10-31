import { lazy, Suspense, useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import Splash from './components/Splash';

const InicioPage = lazy(() => import('./pages/InicioPage'));
const SolicitudesPage = lazy(() => import('./pages/SolicitudesPage'));
const CatalogoPage = lazy(() => import('./pages/CatalogoPage'));
const PreguntasPage = lazy(() => import('./pages/PreguntasPage'));
const PedidosPage = lazy(() => import('./pages/PedidosPage'));
const ChatsPage = lazy(() => import('./pages/ChatsPage'));
const FinanzasPage = lazy(() => import('./pages/FinanzasPage'));

export default function App() {
  const user = useAuthStore((s) => s.user);
  const initializing = useAuthStore((s) => s.initializing);
  // Firebase suele resolver la sesión casi al instante, así que el splash de
  // arranque pasaba desapercibido — se fuerza un mínimo de tiempo en pantalla.
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setMinTimeElapsed(true), 1200);
    return () => clearTimeout(timer);
  }, []);

  if (initializing || !minTimeElapsed) return <Splash />;

  return (
    <BrowserRouter>
      <Suspense fallback={<Splash />}>
        <Routes>
          <Route path="/login" element={user ? <Navigate to="/inicio" replace /> : <LoginPage />} />
          <Route element={user ? <Layout /> : <Navigate to="/login" replace />}>
            <Route path="/inicio" element={<InicioPage />} />
            <Route path="/solicitudes" element={<SolicitudesPage />} />
            <Route path="/catalogo" element={<CatalogoPage />} />
            <Route path="/pedidos" element={<PedidosPage />} />
            <Route path="/chats" element={<ChatsPage />} />
            <Route path="/preguntas" element={<PreguntasPage />} />
            <Route path="/finanzas" element={<FinanzasPage />} />
            <Route path="*" element={<Navigate to="/inicio" replace />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
