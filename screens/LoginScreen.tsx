import { useRef, useState } from 'react';
import { Alert, TextInput as RNTextInput } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';
import { useAuthStore } from '../store/authStore';
import {
  AuthScreen,
  AuthField,
  AuthPrimaryButton,
  AuthSecondaryButton,
  AuthDivider,
  AuthTextLink,
  AuthNotice,
} from '../components/AuthLayout';

type Props = {
  navigation: StackNavigationProp<RootStackParamList, 'Login'>;
};

// ─── Componente ───────────────────────────────────────────────────────────────

export default function LoginScreen({ navigation }: Props) {
  const [email,        setEmail]        = useState('');
  const [password,     setPassword]     = useState('');
  const [loggingIn,    setLoggingIn]    = useState(false);
  const [resetMode,      setResetMode]      = useState(false);
  const [resetSubmitting,setResetSubmitting]= useState(false);
  const [resetMsg,       setResetMsg]       = useState<string | null>(null);
  const login = useAuthStore((s) => s.login);
  const resetPassword = useAuthStore((s) => s.resetPassword);

  const passwordRef = useRef<RNTextInput>(null);

  async function handleLogin() {
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail || !password) {
      Alert.alert('Campos incompletos', 'Ingresa tu correo y contraseña.');
      return;
    }

    setLoggingIn(true);
    try {
      await login(trimmedEmail, password);
      // AppNavigator escucha la sesión y redirige solo al dashboard correcto;
      // esta alerta queda arriba de esa pantalla como confirmación explícita.
      Alert.alert('¡Bienvenido de nuevo!', 'Sesión iniciada correctamente.');
    } catch (error: any) {
      const message =
        error?.code === 'auth/invalid-credential' || error?.code === 'auth/wrong-password' || error?.code === 'auth/user-not-found'
          ? 'El correo o la contraseña no coinciden.'
          : error?.code === 'auth/too-many-requests'
          ? 'Demasiados intentos. Prueba de nuevo en unos minutos.'
          : 'No se pudo iniciar sesión. Intenta de nuevo.';
      Alert.alert('Error al iniciar sesión', message);
    } finally {
      setLoggingIn(false);
    }
  }

  async function handleReset() {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      Alert.alert('Falta el correo', 'Ingresa tu correo para enviarte el enlace.');
      return;
    }
    setResetSubmitting(true);
    setResetMsg(null);
    try {
      await resetPassword(trimmedEmail);
    } catch {
      // Firebase no revela si el correo existe o no — se muestra el mismo
      // mensaje siempre, así no se puede usar esto para buscar cuentas.
    } finally {
      setResetSubmitting(false);
      setResetMsg('Si ese correo tiene una cuenta, te enviamos un enlace para restablecer la contraseña.');
    }
  }

  function enterResetMode(on: boolean) {
    setResetMode(on);
    setResetMsg(null);
  }

  return (
    <AuthScreen
      eyebrow={resetMode ? 'Recuperar acceso' : 'Bienvenido'}
      title={resetMode ? 'Restablece tu contraseña' : 'Inicia sesión'}
      subtitle={resetMode ? 'Te enviamos un enlace a tu correo.' : 'Lo mejor del Mercado Mayorista, a un toque.'}
      onBack={navigation.canGoBack() ? () => navigation.goBack() : undefined}
    >
      {resetMode ? (
        <>
          <AuthField
            label="Correo electrónico"
            icon="mail-outline"
            placeholder="tu@correo.com"
            keyboardType="email-address"
            autoCapitalize="none"
            textContentType="emailAddress"
            autoComplete="email"
            returnKeyType="send"
            onSubmitEditing={handleReset}
            value={email}
            onChangeText={setEmail}
          />
          {resetMsg && <AuthNotice text={resetMsg} />}
          <AuthPrimaryButton label="Enviar enlace" loading={resetSubmitting} onPress={handleReset} />
          <AuthTextLink label="Volver a iniciar sesión" icon="arrow-back" onPress={() => enterResetMode(false)} />
        </>
      ) : (
        <>
          <AuthField
            label="Correo electrónico"
            icon="mail-outline"
            placeholder="tu@correo.com"
            keyboardType="email-address"
            autoCapitalize="none"
            textContentType="emailAddress"
            autoComplete="email"
            returnKeyType="next"
            onSubmitEditing={() => passwordRef.current?.focus()}
            value={email}
            onChangeText={setEmail}
          />
          <AuthField
            ref={passwordRef}
            label="Contraseña"
            labelAction={{ text: '¿La olvidaste?', onPress: () => enterResetMode(true) }}
            icon="lock-closed-outline"
            placeholder="••••••••"
            secure
            textContentType="password"
            autoComplete="password"
            returnKeyType="go"
            onSubmitEditing={handleLogin}
            value={password}
            onChangeText={setPassword}
          />
          <AuthPrimaryButton label="Iniciar sesión" loading={loggingIn} onPress={handleLogin} />
          <AuthDivider text="¿Primera vez en HiGo?" />
          <AuthSecondaryButton
            label="Crear una cuenta"
            icon="person-add-outline"
            onPress={() => navigation.navigate('RoleSelection')}
          />
        </>
      )}
    </AuthScreen>
  );
}
