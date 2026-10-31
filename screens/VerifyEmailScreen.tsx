import {
  useState,
  useEffect,
  useRef } from 'react';
import { StyleSheet,
  View,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
  AppState,
} from 'react-native';
import Text from '../components/Text';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../store/authStore';
import { useThemeColors } from '../theme/useThemeColors';
import { ThemeColors } from '../theme/colors';
import { floatingShadow } from '../theme/elevation';

export default function VerifyEmailScreen() {
  const C = useThemeColors();
  const styles = makeStyles(C);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const resendVerificationEmail = useAuthStore((s) => s.resendVerificationEmail);
  const refreshEmailVerified = useAuthStore((s) => s.refreshEmailVerified);

  const [resending, setResending]   = useState(false);
  const [checking, setChecking]     = useState(false);

  // Si el correo se abre en el navegador (no dentro de la app todavía), al
  // volver a HiGo comprobamos solas si ya se verificó — sin que haya que
  // tocar "Ya verifiqué mi correo" a mano.
  const appState = useRef(AppState.currentState);
  useEffect(() => {
    const sub = AppState.addEventListener('change', async (nextState) => {
      if (appState.current.match(/inactive|background/) && nextState === 'active') {
        await refreshEmailVerified();
        if (useAuthStore.getState().emailVerified) {
          Alert.alert('¡Correo verificado! ✅', 'Ya podés empezar a usar HiGo.');
        }
      }
      appState.current = nextState;
    });
    return () => sub.remove();
  }, []);

  async function handleResend() {
    setResending(true);
    try {
      await resendVerificationEmail();
      Alert.alert('Correo reenviado', 'Revisá tu bandeja de entrada (y spam) por si acaso.');
    } catch (error: any) {
      console.error('[VerifyEmail] resend error:', error?.code, error?.message, error);
      Alert.alert('Error', `No se pudo reenviar el correo (${error?.code ?? 'error desconocido'}).`);
    } finally {
      setResending(false);
    }
  }

  async function handleCheck() {
    setChecking(true);
    try {
      await refreshEmailVerified();
      if (useAuthStore.getState().emailVerified) {
        Alert.alert('¡Correo verificado! ✅', 'Ya podés empezar a usar HiGo.');
      } else {
        Alert.alert(
          'Todavía no está verificado',
          'No detectamos que hayas confirmado el correo. Abrí el último enlace que te llegó y volvé a intentar.'
        );
      }
      // Si ya quedó verificado, AppNavigator te saca de esta pantalla solo;
      // la alerta de arriba queda como confirmación explícita.
    } catch (error: any) {
      console.error('[VerifyEmail] check error:', error?.code, error?.message, error);
      Alert.alert('Error', 'No se pudo comprobar el estado del correo.');
    } finally {
      setChecking(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle={C.statusBarStyle} />
      <LinearGradient colors={C.headerGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.center}>
        <View style={styles.iconCircle}>
          <Ionicons name="mail-unread-outline" size={52} color="#F2C94C" />
        </View>

        <Text style={styles.title}>Confirmá tu correo</Text>
        <Text style={styles.subtitle}>
          Te enviamos un enlace de verificación a{'\n'}
          <Text style={styles.email}>{user?.email ?? 'tu correo'}</Text>
        </Text>
        <Text style={styles.hint}>
          Abrilo y tocá el enlace, después volvé acá y tocá "Ya verifiqué mi correo".
        </Text>

        <TouchableOpacity
          style={[styles.primaryBtn, checking && { opacity: 0.6 }]}
          activeOpacity={0.85}
          onPress={handleCheck}
          disabled={checking}
        >
          <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" />
          <Text style={styles.primaryBtnText}>{checking ? 'Comprobando…' : 'Ya verifiqué mi correo'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryBtn}
          activeOpacity={0.7}
          onPress={handleResend}
          disabled={resending}
        >
          <Text style={styles.secondaryBtnText}>{resending ? 'Enviando…' : 'Reenviar correo'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutLink} activeOpacity={0.7} onPress={() => logout()}>
          <Text style={styles.logoutLinkText}>Cerrar sesión</Text>
        </TouchableOpacity>
      </LinearGradient>
    </SafeAreaView>
  );
}

const makeStyles = (C: ThemeColors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.headerGradient[0] },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28, gap: 16 },
  iconCircle: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: 'rgba(242,201,76,0.18)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  title: { fontSize: 24, fontWeight: '800', color: '#FFFFFF', textAlign: 'center', letterSpacing: -0.4 },
  subtitle: { fontSize: 15, color: 'rgba(255,255,255,0.75)', textAlign: 'center', lineHeight: 22 },
  email: { fontWeight: '700', color: '#FFFFFF' },
  hint: { fontSize: 13, color: 'rgba(255,255,255,0.55)', textAlign: 'center', lineHeight: 19, marginBottom: 8 },
  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: C.success, borderRadius: 18, paddingVertical: 18, width: '100%',
    ...floatingShadow(C, C.success),
  },
  primaryBtnText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  secondaryBtn: { paddingVertical: 10 },
  secondaryBtnText: { fontSize: 14, fontWeight: '600', color: '#FFFFFF', opacity: 0.85 },
  logoutLink: { paddingVertical: 10, marginTop: 8 },
  logoutLinkText: { fontSize: 13, color: 'rgba(255,255,255,0.5)' },
});
