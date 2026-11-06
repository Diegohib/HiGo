import { useState } from 'react';
import { Linking } from 'react-native';
import { AuthScreen, AuthPrimaryButton, AuthSecondaryButton, AuthNotice } from '../components/AuthLayout';
import { useAuthStore } from '../store/authStore';

// La administración (pagos, solicitudes, catálogo, finanzas) vive solo en el
// panel web. Si una cuenta admin entra a la app, se la manda ahí.
const ADMIN_WEB_URL = 'https://higo--app.web.app';

export default function AdminWebScreen() {
  const logout = useAuthStore((s) => s.logout);
  const [leaving, setLeaving] = useState(false);

  async function handleLogout() {
    setLeaving(true);
    try {
      await logout();
    } finally {
      setLeaving(false);
    }
  }

  return (
    <AuthScreen
      eyebrow="Administración"
      title="Usa el panel web"
      subtitle="Pagos, solicitudes, catálogo y finanzas se manejan desde la computadora."
    >
      <AuthNotice text={`Abre ${ADMIN_WEB_URL} e inicia sesión con esta misma cuenta.`} />
      <AuthPrimaryButton label="Abrir panel web" loading={false} onPress={() => Linking.openURL(ADMIN_WEB_URL)} />
      <AuthSecondaryButton label={leaving ? 'Cerrando…' : 'Cerrar sesión'} icon="log-out-outline" onPress={handleLogout} />
    </AuthScreen>
  );
}
