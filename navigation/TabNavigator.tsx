import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { TabParamList } from './types';

import HomeStack from './HomeStack';
import CatalogStack from './CatalogStack';
import ListScreen from '../screens/ListScreen';
import AccountScreen from '../screens/AccountScreen';

const Tab = createBottomTabNavigator<TabParamList>();

const ACTIVE   = '#3D1F8B';
const INACTIVE = '#9B8EC4';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const TAB_ICONS: Record<keyof TabParamList, { outline: IoniconName; filled: IoniconName }> = {
  Inicio:    { outline: 'home-outline',   filled: 'home' },
  Catalogo:  { outline: 'grid-outline',   filled: 'grid' },
  Lista:     { outline: 'list-outline',   filled: 'list' },
  Cuenta:    { outline: 'person-outline', filled: 'person' },
};

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: ACTIVE,
        tabBarInactiveTintColor: INACTIVE,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E0D9F5',
          height: 64,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        tabBarIcon: ({ focused, color, size }) => {
          const icons = TAB_ICONS[route.name as keyof TabParamList];
          const iconName = focused ? icons.filled : icons.outline;
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="Inicio"
        component={HomeStack}
        options={{ tabBarLabel: 'Inicio' }}
      />
      <Tab.Screen
        name="Catalogo"
        component={CatalogStack}
        options={{ tabBarLabel: 'Categorías' }}
      />
      <Tab.Screen
        name="Lista"
        component={ListScreen}
        options={{ tabBarLabel: 'Lista' }}
      />
      <Tab.Screen
        name="Cuenta"
        component={AccountScreen}
        options={{ tabBarLabel: 'Cuenta' }}
      />
    </Tab.Navigator>
  );
}
