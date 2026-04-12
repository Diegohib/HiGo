import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { TabParamList } from './types';

import HomeStack from './HomeStack';
import CatalogScreen from '../screens/CatalogScreen';
import ListScreen from '../screens/ListScreen';
import AccountScreen from '../screens/AccountScreen';

const Tab = createBottomTabNavigator<TabParamList>();

const ACTIVE   = '#3D1F8B';
const INACTIVE = '#9B8EC4';

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: ACTIVE,
        tabBarInactiveTintColor: INACTIVE,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E8E8E8',
          height: 64,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="Inicio"
        component={HomeStack}
        options={{ tabBarLabel: '🏠 Inicio' }}
      />
      <Tab.Screen
        name="Catalogo"
        component={CatalogScreen}
        options={{ tabBarLabel: '⊞ Catálogo' }}
      />
      <Tab.Screen
        name="Lista"
        component={ListScreen}
        options={{ tabBarLabel: '☰ Lista' }}
      />
      <Tab.Screen
        name="Cuenta"
        component={AccountScreen}
        options={{ tabBarLabel: '👤 Cuenta' }}
      />
    </Tab.Navigator>
  );
}
