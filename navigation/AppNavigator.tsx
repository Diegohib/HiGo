import 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { RootStackParamList } from './types';

import SplashScreen from '../screens/SplashScreen';
import TabNavigator from './TabNavigator';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import RoleSelectionScreen from '../screens/RoleSelectionScreen';
import StaffRegisterScreen from '../screens/StaffRegisterScreen';
import CocheroPayScreen         from '../screens/CocheroPayScreen';
import TransportistaPayScreen   from '../screens/TransportistaPayScreen';
import AdminPayScreen           from '../screens/AdminPayScreen';

const Stack = createStackNavigator<RootStackParamList>();

const HEADER_OPTS = {
  headerStyle: { backgroundColor: '#3D1F8B' },
  headerTintColor: '#FFFFFF',
  headerTitleStyle: { fontWeight: '700' as const, fontSize: 18 },
  headerBackTitleVisible: false,
};

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Splash" screenOptions={{ headerShown: false }}>
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
          name="CocheroDashboard"
          component={CocheroPayScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="TransportistaDashboard"
          component={TransportistaPayScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="AdminDashboard"
          component={AdminPayScreen}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
