import 'react-native-gesture-handler';
import { useEffect, useRef } from 'react';
import { Linking } from 'react-native';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { RootStackParamList } from './types';
import { resolveRoute } from './resolveRoute';

import { useAuthStore } from '../store/authStore';
import SplashScreen from '../screens/SplashScreen';
import TabNavigator from './TabNavigator';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import VerifyEmailScreen from '../screens/VerifyEmailScreen';
import RoleSelectionScreen from '../screens/RoleSelectionScreen';
import StaffRegisterScreen from '../screens/StaffRegisterScreen';
import CocheroDashboardScreen         from '../screens/CocheroDashboardScreen';
import TransportistaDashboardScreen  from '../screens/TransportistaDashboardScreen';
import AdminPayScreen                from '../screens/AdminPayScreen';
import AdminSolicitudesScreen       from '../screens/AdminSolicitudesScreen';
import AdminFinanzasScreen          from '../screens/AdminFinanzasScreen';
import AdminProductosScreen         from '../screens/AdminProductosScreen';
import ComercianteDashboardScreen    from '../screens/ComercianteDashboardScreen';
import SolicitudPendienteScreen      from '../screens/SolicitudPendienteScreen';
import ChatScreen                    from '../screens/ChatScreen';
import AssistantScreen               from '../screens/AssistantScreen';
import OrderChatScreen                from '../screens/OrderChatScreen';

const Stack = createStackNavigator<RootStackParamList>();

const HEADER_OPTS = {
  headerStyle: { backgroundColor: '#3D1F8B' },
  headerTintColor: '#FFFFFF',
  headerTitleStyle: { fontFamily: 'Poppins_700Bold', fontSize: 18 },
  headerBackTitleVisible: false,
};

export default function AppNavigator() {
  const user               = useAuthStore((s) => s.user);
  const initializing       = useAuthStore((s) => s.initializing);
  const emailVerified      = useAuthStore((s) => s.emailVerified);
  const refreshEmailVerified = useAuthStore((s) => s.refreshEmailVerified);

  const navigationRef = useNavigationContainerRef<RootStackParamList>();
  const prevGateRef = useRef<string | null>(null);

  // Al abrir la app desde el link "higo://verified" del correo de
  // confirmación, se vuelve a chequear el estado de verificación al toque.
  useEffect(() => {
    function onUrl({ url }: { url: string }) {
      if (url.startsWith('higo://verified')) refreshEmailVerified();
    }
    Linking.getInitialURL().then((url) => { if (url) onUrl({ url }); });
    const sub = Linking.addEventListener('url', onUrl);
    return () => sub.remove();
  }, []);

  // Cuando cambia de verdad el estado de sesión (login, logout, correo
  // verificado, aprobación/rechazo de una solicitud) se resetea la
  // navegación a la pantalla que corresponde con un reset imperativo — así
  // nunca queda "atascado" en Login/VerifyEmail/etc. esperando que la
  // persona navegue a mano. Se ignoran cambios de `user` que no afecten al
  // rol/estado/verificación (por ej. actualizar la foto de perfil).
  useEffect(() => {
    if (initializing) return;
    const gateKey = user ? `authed-${user.role}-${user.status}-${emailVerified}` : 'guest';
    if (prevGateRef.current === gateKey) return;
    const isFirstRun = prevGateRef.current === null;
    prevGateRef.current = gateKey;
    if (isFirstRun) return; // la cortina (Splash) resuelve la primera transición sola
    if (navigationRef.isReady()) {
      navigationRef.reset({ index: 0, routes: [{ name: resolveRoute(user, emailVerified) }] });
    }
  }, [user, initializing, emailVerified]);

  if (initializing) return null;

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{ headerShown: false }}
      >
        {/* Pantalla de entrada */}
        <Stack.Screen name="Splash" component={SplashScreen} />

        {/* Flujo cliente */}
        <Stack.Screen name="MainTabs" component={TabNavigator} />
        <Stack.Screen
          name="Register"
          component={RegisterScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="VerifyEmail"
          component={VerifyEmailScreen}
          options={{ headerShown: false }}
        />

        {/* Flujo personal operativo */}
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="RoleSelection"
          component={RoleSelectionScreen}
          options={{ ...HEADER_OPTS, headerShown: true, title: 'Elegir rol' }}
        />
        <Stack.Screen
          name="StaffRegister"
          component={StaffRegisterScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="SolicitudPendiente"
          component={SolicitudPendienteScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="CocheroDashboard"
          component={CocheroDashboardScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="TransportistaDashboard"
          component={TransportistaDashboardScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="AdminDashboard"
          component={AdminPayScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="AdminSolicitudes"
          component={AdminSolicitudesScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="AdminFinanzas"
          component={AdminFinanzasScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="AdminProductos"
          component={AdminProductosScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ComercianteDashboard"
          component={ComercianteDashboardScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Chat"
          component={ChatScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Assistant"
          component={AssistantScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="OrderChat"
          component={OrderChatScreen}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
