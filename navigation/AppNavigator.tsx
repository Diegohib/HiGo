import 'react-native-gesture-handler';
import { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { RootStackParamList } from './types';

import { useAuthStore } from '../store/authStore';
import SplashScreen from '../screens/SplashScreen';
import TabNavigator from './TabNavigator';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import RoleSelectionScreen from '../screens/RoleSelectionScreen';
import StaffRegisterScreen from '../screens/StaffRegisterScreen';
import CocheroDashboardScreen         from '../screens/CocheroDashboardScreen';
import CocheroPayScreen              from '../screens/CocheroPayScreen';
import TransportistaDashboardScreen  from '../screens/TransportistaDashboardScreen';
import TransportistaPayScreen        from '../screens/TransportistaPayScreen';
import AdminPayScreen                from '../screens/AdminPayScreen';
import AdminSolicitudesScreen       from '../screens/AdminSolicitudesScreen';
import AdminFinanzasScreen          from '../screens/AdminFinanzasScreen';
import ComercianteDashboardScreen    from '../screens/ComercianteDashboardScreen';
import SolicitudPendienteScreen      from '../screens/SolicitudPendienteScreen';

const Stack = createStackNavigator<RootStackParamList>();

const HEADER_OPTS = {
  headerStyle: { backgroundColor: '#3D1F8B' },
  headerTintColor: '#FFFFFF',
  headerTitleStyle: { fontWeight: '700' as const, fontSize: 18 },
  headerBackTitleVisible: false,
};

export default function AppNavigator() {
  const user = useAuthStore((s) => s.user);
  const [hydrated, setHydrated] = useState(false);

  function getInitialRoute(): keyof RootStackParamList {
    if (!user) return 'Splash';
    switch (user.role) {
      case 'cochero':       return 'CocheroDashboard';
      case 'transportista': return 'TransportistaDashboard';
      case 'comerciante':   return 'ComercianteDashboard';
      default:              return 'MainTabs';
    }
  }

  useEffect(() => {
    if (useAuthStore.persist.hasHydrated()) {
      setHydrated(true);
    } else {
      const unsub = useAuthStore.persist.onFinishHydration(() => setHydrated(true));
      return unsub;
    }
  }, []);

  if (!hydrated) return null;

  return (
    <NavigationContainer>
      <Stack.Navigator
        key={user ? `authed-${user.role}` : 'guest'}
        initialRouteName={getInitialRoute()}
        screenOptions={{ headerShown: false }}
      >
        {/* Pantalla de entrada */}
        <Stack.Screen name="Splash" component={SplashScreen} />

        {/* Flujo cliente */}
        <Stack.Screen name="MainTabs" component={TabNavigator} />
        <Stack.Screen
          name="Register"
          component={RegisterScreen}
          options={{ ...HEADER_OPTS, headerShown: true, title: 'Crear cuenta' }}
        />

        {/* Flujo personal operativo */}
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ ...HEADER_OPTS, headerShown: true, title: 'Acceso operativo' }}
        />
        <Stack.Screen
          name="RoleSelection"
          component={RoleSelectionScreen}
          options={{ ...HEADER_OPTS, headerShown: true, title: 'Elegir rol' }}
        />
        <Stack.Screen
          name="StaffRegister"
          component={StaffRegisterScreen}
          options={{ ...HEADER_OPTS, headerShown: true, title: 'Registro' }}
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
          name="ComercianteDashboard"
          component={ComercianteDashboardScreen}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
