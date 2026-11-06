import { AppUser } from '../store/authStore';
import { RootStackParamList } from './types';

// TEMPORAL — mientras se prueba el funcionamiento, no se exige verificar el
// correo para entrar (así el registro de cliente entra directo, sin frenar
// en "Confirma tu correo"). Para volver a exigirlo, poné esto en `true`.
const REQUIRE_EMAIL_VERIFICATION = false;

// A dónde va la app una vez resuelto el estado de sesión — lo usan tanto la
// cortina de arranque (screens/SplashScreen.tsx, siempre se ve primero, sin
// importar si ya hay sesión) como AppNavigator (para redirigir en caliente si
// la sesión cambia después: login, logout, verificación de correo, o
// aprobación/rechazo de una solicitud).
export function resolveRoute(
  user: AppUser | null,
  emailVerified: boolean
): keyof RootStackParamList {
  if (!user) return 'MainTabs'; // invitado: navega el catálogo sin cuenta
  if (REQUIRE_EMAIL_VERIFICATION && !emailVerified) return 'VerifyEmail';
  if (user.role !== 'cliente' && user.status !== 'approved') return 'SolicitudPendiente';
  switch (user.role) {
    case 'cochero':       return 'CocheroDashboard';
    case 'transportista': return 'TransportistaDashboard';
    case 'comerciante':   return 'ComercianteDashboard';
    case 'admin':         return 'AdminDashboard';
    default:              return 'MainTabs';
  }
}
