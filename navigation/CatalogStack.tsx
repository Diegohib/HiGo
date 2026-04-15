import { createStackNavigator } from '@react-navigation/stack';
import { CatalogStackParamList } from './types';
import CatalogScreen from '../screens/CatalogScreen';
import ProductScreen from '../screens/ProductScreen';
import CarritoScreen from '../screens/CarritoScreen';

const Stack = createStackNavigator<CatalogStackParamList>();

export default function CatalogStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Catalog" component={CatalogScreen} />
      <Stack.Screen name="Product" component={ProductScreen} />
      <Stack.Screen name="Carrito" component={CarritoScreen} />
    </Stack.Navigator>
  );
}
