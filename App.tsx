import { View } from 'react-native';
import {
  useFonts,
  Poppins_300Light,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  Poppins_800ExtraBold,
  Poppins_900Black,
} from '@expo-google-fonts/poppins';
import AppNavigator from './navigation/AppNavigator';

export default function App() {
  // Se cargan acá, una sola vez, todos los pesos de Poppins que usa la app
  // (components/Text.tsx y components/TextInput.tsx eligen cuál según el
  // fontWeight de cada estilo). Mientras cargan, se muestra un fondo simple
  // en vez de dejar parpadear texto con la fuente del sistema.
  const [fontsLoaded] = useFonts({
    Poppins_300Light,
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Poppins_800ExtraBold,
    Poppins_900Black,
  });

  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: '#301566' }} />;
  }

  return <AppNavigator />;
}
