import { useRef, useState } from 'react';
import { Alert, TextInput as RNTextInput } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';
import { useAuthStore, MIN_PASSWORD_LENGTH } from '../store/authStore';
import {
  AuthScreen,
  AuthField,
  AuthPrimaryButton,
  AuthDivider,
  AuthSecondaryButton,
} from '../components/AuthLayout';

type Props = {
  navigation: StackNavigationProp<RootStackParamList, 'Register'>;
};

export default function RegisterScreen({ navigation }: Props) {
  const register = useAuthStore((s) => s.register);

  const [name,            setName]            = useState('');
  const [email,           setEmail]           = useState('');
  const [phone,           setPhone]           = useState('');
  const [password,        setPassword]        = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting,      setSubmitting]      = useState(false);

  // Para saltar de un campo al siguiente con la tecla "siguiente" del teclado.
  const emailRef    = useRef<RNTextInput>(null);
  const phoneRef    = useRef<RNTextInput>(null);
  const passwordRef = useRef<RNTextInput>(null);
  const confirmRef  = useRef<RNTextInput>(null);

  async function handleRegister() {
    if (!name.trim() || !email.trim() || !phone.trim() || !password || !confirmPassword) {
      Alert.alert('Campos incompletos', 'Por favor completá todos los campos.');
      return;
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      Alert.alert('Contraseña muy corta', `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`);
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Contraseñas distintas', 'Las contraseñas no coinciden.');
      return;
    }

    setSubmitting(true);
    try {
      const trimmedEmail = email.trim().toLowerCase();
      await register({ name: name.trim(), email: trimmedEmail, phone: phone.trim(), password });
      // AppNavigator escucha la sesión nueva y navega solo a VerifyEmail/MainTabs;
      // esta alerta queda arriba de esa pantalla como confirmación explícita.
      Alert.alert(
        '¡Cuenta creada! 🎉',
        `Te enviamos un correo de verificación a ${trimmedEmail}. Abrilo y confirmá tu cuenta para poder ingresar a HiGo.`
      );
    } catch (error: any) {
      console.error('[register]', error?.code, error?.message, error);
      const message =
        error?.code === 'auth/email-already-in-use' ? 'Ese correo ya está registrado.' :
        error?.code === 'auth/weak-password'         ? 'La contraseña debe tener al menos 6 caracteres.' :
        error?.code === 'auth/invalid-email'          ? 'El correo ingresado no es válido.' :
        `No se pudo crear la cuenta (${error?.code ?? 'error desconocido'}).`;
      Alert.alert('Error', message);
    } finally {
      setSubmitting(false);
    }
  }

  const mismatch = confirmPassword.length > 0 && confirmPassword !== password;

  return (
    <AuthScreen
      eyebrow="Nueva cuenta"
      title="Creá tu cuenta"
      subtitle="Pedí del Mercado Mayorista y recibí en tu puerta."
      onBack={navigation.canGoBack() ? () => navigation.goBack() : undefined}
    >
      <AuthField
        label="Nombre completo"
        icon="person-outline"
        placeholder="Tu nombre y apellido"
        autoCapitalize="words"
        textContentType="name"
        autoComplete="name"
        returnKeyType="next"
        onSubmitEditing={() => emailRef.current?.focus()}
        value={name}
        onChangeText={setName}
      />
      <AuthField
        ref={emailRef}
        label="Correo electrónico"
        icon="mail-outline"
        placeholder="tu@correo.com"
        keyboardType="email-address"
        autoCapitalize="none"
        textContentType="emailAddress"
        autoComplete="email"
        returnKeyType="next"
        onSubmitEditing={() => phoneRef.current?.focus()}
        value={email}
        onChangeText={setEmail}
      />
      <AuthField
        ref={phoneRef}
        label="Teléfono"
        icon="call-outline"
        placeholder="09xxxxxxxx"
        keyboardType="phone-pad"
        textContentType="telephoneNumber"
        autoComplete="tel"
        value={phone}
        onChangeText={setPhone}
      />
      <AuthField
        ref={passwordRef}
        label="Contraseña"
        icon="lock-closed-outline"
        placeholder="••••••••"
        secure
        maxLength={128}
        textContentType="newPassword"
        autoComplete="password-new"
        returnKeyType="next"
        onSubmitEditing={() => confirmRef.current?.focus()}
        hint={`Mínimo ${MIN_PASSWORD_LENGTH} caracteres.`}
        value={password}
        onChangeText={setPassword}
      />
      <AuthField
        ref={confirmRef}
        label="Confirmar contraseña"
        icon="lock-closed-outline"
        placeholder="••••••••"
        secure
        maxLength={128}
        textContentType="newPassword"
        autoComplete="password-new"
        returnKeyType="go"
        onSubmitEditing={handleRegister}
        hint={mismatch ? 'Las contraseñas no coinciden.' : undefined}
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />

      <AuthPrimaryButton label="Crear cuenta" loading={submitting} onPress={handleRegister} />

      <AuthDivider text="¿Ya tenés cuenta?" />
      <AuthSecondaryButton
        label="Iniciar sesión"
        icon="log-in-outline"
        onPress={() => navigation.navigate('Login')}
      />
    </AuthScreen>
  );
}
