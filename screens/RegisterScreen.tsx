import { StyleSheet, Text, View, TextInput, TouchableOpacity, Pressable, ScrollView } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Register'>;
};

export default function RegisterScreen({ navigation }: Props) {
  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <Text style={styles.logo}>HiGo</Text>
        <Text style={styles.subtitle}>Creá tu cuenta</Text>
      </View>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Nombre completo"
          placeholderTextColor="#999"
          autoCapitalize="words"
        />
        <TextInput
          style={styles.input}
          placeholder="Correo electrónico"
          placeholderTextColor="#999"
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Teléfono"
          placeholderTextColor="#999"
          keyboardType="phone-pad"
        />
        <TextInput
          style={styles.input}
          placeholder="Contraseña"
          placeholderTextColor="#999"
          secureTextEntry
        />
        <TextInput
          style={styles.input}
          placeholder="Confirmar contraseña"
          placeholderTextColor="#999"
          secureTextEntry
        />

        <TouchableOpacity
          style={styles.registerButton}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('RoleSelection')}
        >
          <Text style={styles.registerButtonText}>Crear Cuenta</Text>
        </TouchableOpacity>

        <Pressable
          style={({ pressed }) => [styles.loginLinkWrapper, pressed && { opacity: 0.6 }]}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.loginLink}>¿Ya tenés cuenta? <Text style={styles.loginLinkBold}>Iniciá sesión</Text></Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#3D1F8B',
    paddingHorizontal: 32,
    paddingTop: 80,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    fontSize: 48,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 2,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  form: {
    gap: 16,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 16,
    fontSize: 16,
    color: '#1A1A1A',
  },
  registerButton: {
    backgroundColor: '#2ECC71',
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 8,
  },
  registerButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  loginLinkWrapper: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  loginLink: {
    color: '#FFFFFF',
    fontSize: 14,
    opacity: 0.8,
  },
  loginLinkBold: {
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});
