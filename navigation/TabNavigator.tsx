import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { RootStackParamList, TabParamList } from './types';

import HomeStack from './HomeStack';
import ListScreen from '../screens/ListScreen';
import AccountScreen from '../screens/AccountScreen';
import { useCartStore } from '../store/cartStore';
import { useThemeColors } from '../theme/useThemeColors';
import { RADIUS, floatingShadow } from '../theme/elevation';

const Tab = createBottomTabNavigator<TabParamList>();

const ACTIVE   = '#5B2BD9';
const INACTIVE = '#9B8EC4';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const TAB_ICONS: Record<keyof TabParamList, { outline: IoniconName; filled: IoniconName }> = {
  Inicio:    { outline: 'home-outline',   filled: 'home' },
  Lista:     { outline: 'list-outline',   filled: 'list' },
  Cuenta:    { outline: 'person-outline', filled: 'person' },
};

// Burbuja flotante del asistente — vive por encima del Tab.Navigator (no
// dentro de un Tab.Screen) para no reiniciarse al cambiar de pestaña. Se
// levanta un poco cuando la barra fija del carrito está visible en Inicio,
// para no taparla.
function AssistantFab() {
  const C = useThemeColors();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const totalItems = useCartStore(s => s.totalItems);
  const styles = makeFabStyles();

  const bottom = totalItems > 0 ? 158 : 88;

  return (
    <View style={[styles.fabWrap, { bottom }]} pointerEvents="box-none">
      <View style={styles.fabHalo} pointerEvents="none" />
      <TouchableOpacity
        style={[styles.fab, floatingShadow(C, C.primary)]}
        activeOpacity={0.85}
        onPress={() => navigation.navigate('Assistant')}
      >
        <LinearGradient
          colors={C.headerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.fabGradient}
        >
          <View style={styles.fabInner}>
            <Ionicons name="chatbubble-ellipses" size={20} color={C.primary} />
          </View>
        </LinearGradient>
        <View style={styles.fabDot} />
      </TouchableOpacity>
    </View>
  );
}

export default function TabNavigator() {
  return (
    <View style={{ flex: 1 }}>
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
            fontFamily: 'Poppins_600SemiBold',
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

      <AssistantFab />
    </View>
  );
}

const makeFabStyles = () => StyleSheet.create({
  fabWrap: {
    position: 'absolute',
    right: 16,
    width: 68,
    height: 68,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabHalo: {
    position: 'absolute',
    width: 68,
    height: 68,
    borderRadius: RADIUS.pill,
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.pill,
  },
  fabGradient: {
    width: '100%',
    height: '100%',
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 3,
  },
  fabInner: {
    width: '100%',
    height: '100%',
    borderRadius: RADIUS.pill,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#2ECC71',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
});
