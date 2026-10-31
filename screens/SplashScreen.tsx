import { useEffect, useRef } from 'react';
import { StyleSheet, View, Animated, Easing } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';
import { resolveRoute } from '../navigation/resolveRoute';
import { useAuthStore } from '../store/authStore';
import { HiGoMark } from '../components/HiGoLogo';

type Props = {
  navigation: StackNavigationProp<RootStackParamList, 'Splash'>;
};

// Cortina de arranque: solo el logo, un instante, siempre — haya o no sesión
// iniciada — y después pasa al destino que corresponda (catálogo si es
// invitado, o directo al dashboard de su rol si ya inició sesión). No es una
// pantalla de decisión con botones — eso ya vive en la pestaña Cuenta para
// quien busca acceso operativo.

const MIN_VISIBLE_MS = 1400;

export default function SplashScreen({ navigation }: Props) {
  const pulse = useRef(new Animated.Value(1)).current;
  const user = useAuthStore((s) => s.user);
  const emailVerified = useAuthStore((s) => s.emailVerified);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.92, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1,    duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    loop.start();

    const timer = setTimeout(() => {
      navigation.reset({ index: 0, routes: [{ name: resolveRoute(user, emailVerified) }] });
    }, MIN_VISIBLE_MS);

    return () => { loop.stop(); clearTimeout(timer); };
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={{ transform: [{ scale: pulse }] }}>
        <HiGoMark size={148} color="#FFFFFF" />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#301566',
  },
});
