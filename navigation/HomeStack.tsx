import { createStackNavigator } from '@react-navigation/stack';
import { HomeStackParamList } from './types';
import HomeScreen from '../screens/HomeScreen';
import CatalogScreen from '../screens/CatalogScreen';
import ProductScreen from '../screens/ProductScreen';
import CarritoScreen from '../screens/CarritoScreen';

const Stack = createStackNavigator<HomeStackParamList>();

export default function HomeStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#3D1F8B' },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: { fontWeight: '700', fontSize: 18 },
        headerBackTitleVisible: false,
      }}
    >
      <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
      <Stack.Screen
        name="Catalog"
        component={CatalogScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Product"
        component={ProductScreen}
        options={{ title: '' }}
      />
      <Stack.Screen
        name="Carrito"
        component={CarritoScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}
