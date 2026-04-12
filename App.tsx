import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity, Pressable } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.content}>
        <Text style={styles.logo}>HiGo</Text>
        <Text style={styles.tagline}>El mercado mayorista para toda la ciudad</Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.enterButton} activeOpacity={0.85}>
          <Text style={styles.enterButtonText}>Entrar al Mercado</Text>
          <Text style={styles.arrow}>→</Text>
        </TouchableOpacity>

        <Pressable style={({ pressed }) => [styles.operativeLinkWrapper, pressed && { opacity: 0.6 }]}>
          <Text style={styles.operativeLink}>Acceso para personal operativo</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#3D1F8B',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    fontSize: 72,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 2,
    marginBottom: 16,
  },
  tagline: {
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
    opacity: 0.9,
    lineHeight: 26,
  },
  actions: {
    width: '100%',
    alignItems: 'center',
    gap: 20,
  },
  enterButton: {
    backgroundColor: '#2ECC71',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: 18,
    borderRadius: 14,
    gap: 10,
  },
  enterButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  arrow: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  operativeLinkWrapper: {
    paddingVertical: 8,
  },
  operativeLink: {
    color: '#FFFFFF',
    fontSize: 14,
    opacity: 0.75,
    textDecorationLine: 'underline',
  },
});
