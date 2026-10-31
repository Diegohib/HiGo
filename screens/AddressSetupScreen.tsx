import {
  useState,
  useEffect } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import Text from '../components/Text';
import TextInput from '../components/TextInput';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { HomeStackParamList } from '../navigation/types';
import { useAuthStore, AddressLabel } from '../store/authStore';
import { useThemeColors } from '../theme/useThemeColors';
import { ThemeColors } from '../theme/colors';

type Nav   = StackNavigationProp<HomeStackParamList, 'AddressSetup'>;
type Rte   = RouteProp<HomeStackParamList, 'AddressSetup'>;

const LABELS: AddressLabel[] = ['Casa', 'Trabajo', 'Otro'];

export default function AddressSetupScreen() {
  const C = useThemeColors();
  const styles = makeStyles(C);
  const navigation = useNavigation<Nav>();
  const route      = useRoute<Rte>();
  const user           = useAuthStore(s => s.user);
  const updateAddress  = useAuthStore(s => s.updateAddress);
  const skipAddress    = useAuthStore(s => s.skipAddress);

  const [address,   setAddress]   = useState(user?.address ?? '');
  const [pinLat,    setPinLat]    = useState<number | null>(user?.addressLat ?? null);
  const [pinLng,    setPinLng]    = useState<number | null>(user?.addressLng ?? null);
  const [reference, setReference] = useState(user?.addressReference ?? '');
  const [label,     setLabel]     = useState<AddressLabel>(user?.addressLabel ?? 'Casa');
  const [saving,    setSaving]    = useState(false);

  const hasMapPin = pinLat != null && pinLng != null;

  useEffect(() => {
    const p = route.params;
    if (p?.pickedAddress && p.pickedLat != null && p.pickedLng != null) {
      setAddress(p.pickedAddress);
      setPinLat(p.pickedLat);
      setPinLng(p.pickedLng);
    }
  }, [route.params?.pickedAddress, route.params?.pickedLat, route.params?.pickedLng]);

  async function handleSave() {
    if (!hasMapPin) {
      Alert.alert('Falta la ubicación', 'Elegí tu ubicación en el mapa antes de guardar.');
      return;
    }
    setSaving(true);
    try {
      await updateAddress({
        address,
        addressReference: reference.trim(),
        addressLat: pinLat!,
        addressLng: pinLng!,
        addressLabel: label,
      });
      navigation.goBack();
    } catch (error: any) {
      console.error('[AddressSetup] save error:', error?.code, error?.message);
      Alert.alert('Error', 'No se pudo guardar la dirección. Intentá de nuevo.');
    } finally {
      setSaving(false);
    }
  }

  async function handleSkip() {
    try {
      await skipAddress();
    } catch (error: any) {
      console.error('[AddressSetup] skip error:', error?.code, error?.message);
    }
    navigation.goBack();
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle={C.statusBarStyle} />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Tu dirección de entrega</Text>
        <Text style={styles.headerSub}>
          Guardala una vez y la próxima vez que pidas ya va a estar lista — igual vas a poder elegir otra ubicación para un pedido puntual.
        </Text>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {/* ── Botón del mapa ── */}
          <TouchableOpacity
            style={[styles.mapBtn, hasMapPin && styles.mapBtnActive]}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('MapPicker', { returnTo: 'AddressSetup' })}
          >
            <View style={[styles.mapBtnIcon, hasMapPin && styles.mapBtnIconActive]}>
              <Ionicons
                name={hasMapPin ? 'location' : 'location-outline'}
                size={22}
                color={hasMapPin ? '#FFFFFF' : C.primary}
              />
            </View>
            <View style={styles.mapBtnContent}>
              {hasMapPin ? (
                <>
                  <Text style={styles.mapBtnLabel}>Ubicación seleccionada</Text>
                  <Text style={styles.mapBtnAddress} numberOfLines={2}>{address}</Text>
                </>
              ) : (
                <>
                  <Text style={styles.mapBtnLabel}>Elegir ubicación en el mapa</Text>
                  <Text style={styles.mapBtnSub}>Tocá para abrir el mapa</Text>
                </>
              )}
            </View>
            <Ionicons
              name={hasMapPin ? 'pencil-outline' : 'chevron-forward'}
              size={17}
              color={hasMapPin ? C.primary : C.textFaint}
            />
          </TouchableOpacity>

          {hasMapPin && (
            <>
              <Text style={styles.label}>Referencias / indicaciones</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={reference}
                onChangeText={setReference}
                placeholder="Ej: casa blanca con rejas, junto a la tienda..."
                placeholderTextColor={C.textFaint}
                multiline
              />

              <Text style={styles.label}>¿Qué nombre le damos a esta dirección?</Text>
              <View style={styles.chipRow}>
                {LABELS.map((l) => (
                  <TouchableOpacity
                    key={l}
                    style={[styles.chip, label === l && styles.chipActive]}
                    activeOpacity={0.8}
                    onPress={() => setLabel(l)}
                  >
                    <Text style={[styles.chipText, label === l && styles.chipTextActive]}>{l}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          <TouchableOpacity
            style={[styles.saveBtn, (!hasMapPin || saving) && { opacity: 0.5 }]}
            activeOpacity={0.85}
            onPress={handleSave}
            disabled={!hasMapPin || saving}
          >
            <Text style={styles.saveBtnText}>{saving ? 'Guardando…' : 'Guardar dirección'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.skipBtn} activeOpacity={0.7} onPress={handleSkip}>
            <Text style={styles.skipBtnText}>Ahora no</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const makeStyles = (C: ThemeColors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.background },

  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8, gap: 6 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: C.text },
  headerSub: { fontSize: 13, color: C.textFaint, lineHeight: 19 },

  scrollContent: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 },

  mapBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: C.surface, borderRadius: 16, padding: 14,
    borderWidth: 1.5, borderColor: C.border,
  },
  mapBtnActive: { borderColor: C.primary },
  mapBtnIcon: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: C.primaryFaint, alignItems: 'center', justifyContent: 'center',
  },
  mapBtnIconActive: { backgroundColor: C.primary },
  mapBtnContent: { flex: 1, gap: 2 },
  mapBtnLabel: { fontSize: 14, fontWeight: '700', color: C.text },
  mapBtnSub: { fontSize: 12, color: C.textFaint },
  mapBtnAddress: { fontSize: 13, color: C.textSoft, lineHeight: 18 },

  label: { fontSize: 12, fontWeight: '700', color: C.textSoft, marginTop: 22, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.4 },
  input: {
    backgroundColor: C.surface, borderRadius: 12, borderWidth: 1.5, borderColor: C.border,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: C.text,
  },
  textArea: { minHeight: 80, textAlignVertical: 'top' },

  chipRow: { flexDirection: 'row', gap: 10 },
  chip: {
    paddingHorizontal: 18, paddingVertical: 10, borderRadius: 20,
    backgroundColor: C.surface, borderWidth: 1.5, borderColor: C.border,
  },
  chipActive: { backgroundColor: C.primary, borderColor: C.primary },
  chipText: { fontSize: 13, fontWeight: '700', color: C.textSoft },
  chipTextActive: { color: '#FFFFFF' },

  saveBtn: { marginTop: 32, backgroundColor: C.primary, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  saveBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  skipBtn: { marginTop: 14, alignItems: 'center', paddingVertical: 8 },
  skipBtnText: { fontSize: 14, fontWeight: '600', color: C.textFaint },
});
