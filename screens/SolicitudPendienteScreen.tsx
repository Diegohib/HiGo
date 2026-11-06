import {
  useRef,
  useEffect,
  useState } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Animated,
} from 'react-native';
import Text from '../components/Text';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { collection, query, where, orderBy, limit, onSnapshot, Timestamp } from 'firebase/firestore';
import { RootStackParamList } from '../navigation/types';
import { Solicitud } from '../store/adminSolicitudesStore';
import { useAuthStore } from '../store/authStore';
import { db } from '../lib/firebase';
import { useThemeColors } from '../theme/useThemeColors';

type Props = {
  navigation: StackNavigationProp<RootStackParamList, 'SolicitudPendiente'>;
  route:      RouteProp<RootStackParamList, 'SolicitudPendiente'>;
};

// ─── Paleta ───────────────────────────────────────────────────────────────────
// El fondo de esta pantalla es siempre el morado de marca (C.primary del tema);
// el resto de colores son indicadores de estado fijos sobre ese fondo.

function useScreenColors() {
  const T = useThemeColors();
  return {
    bg:          T.primary,
    headerGradient: T.headerGradient,
    statusBar:   T.statusBarStyle,
    card:        'rgba(255,255,255,0.10)',
    white:       '#FFFFFF',
    soft:        'rgba(255,255,255,0.60)',
    green:       '#27AE60',
    greenFaint:  'rgba(39,174,96,0.18)',
    red:         '#FF8A80',
    redFaint:    'rgba(231,76,60,0.20)',
    redBorder:   'rgba(231,76,60,0.40)',
    amber:       '#F2C94C',
    amberFaint:  'rgba(242,201,76,0.18)',
  };
}
type ScreenColors = ReturnType<typeof useScreenColors>;

// ─── Ruta de dashboard por rol ────────────────────────────────────────────────

const DASHBOARD_ROUTE: Record<string, keyof RootStackParamList> = {
  cochero:       'CocheroDashboard',
  transportista: 'TransportistaDashboard',
  comerciante:   'ComercianteDashboard',
};

// ─── Pantalla ─────────────────────────────────────────────────────────────────

export default function SolicitudPendienteScreen({ navigation, route }: Props) {
  const C = useScreenColors();
  const styles = makeStyles(C);
  const authUser = useAuthStore((s) => s.user);
  const [sol, setSol]         = useState<Solicitud | null>(null);
  const [loading, setLoading] = useState(true);

  // Se busca por uid del usuario autenticado (no por el store de admin, al que
  // un usuario no-admin no tiene permiso de leer completo) — así también
  // funciona si se reabre la app estando todavía pendiente, sin depender de
  // que se haya pasado solicitudId por parámetro.
  useEffect(() => {
    if (!authUser) return;
    const q = query(
      collection(db, 'solicitudes'),
      where('uid', '==', authUser.uid),
      orderBy('requestedAt', 'desc'),
      limit(1)
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        const d = snap.docs[0];
        if (!d) { setSol(null); setLoading(false); return; }
        const data = d.data();
        setSol({
          ...data,
          id: d.id,
          requestedAt: (data.requestedAt as Timestamp | undefined)?.toDate() ?? new Date(),
        } as Solicitud);
        setLoading(false);
      },
      (error) => {
        console.error('[SolicitudPendiente] solicitudes listener error:', error.code, error.message);
        setLoading(false);
      }
    );
    return unsub;
  }, [authUser?.uid]);

  // Animación de pulso para el estado pendiente
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.18, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1,    duration: 900, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);

  function handleVolver() {
    navigation.reset({ index: 0, routes: [{ name: 'Splash' }] });
  }

  function handleEntrar() {
    // La sesión ya está activa desde el registro — AppNavigator redirige solo
    // apenas el status pasa a "approved". Este reset es un respaldo manual
    // por si esa actualización todavía no llegó a este dispositivo.
    navigation.reset({
      index: 0,
      routes: [{ name: DASHBOARD_ROUTE[sol!.role] }],
    });
  }

  function handleReintentar() {
    navigation.navigate('StaffRegister', { role: sol!.role });
  }

  const roleLabel = sol
    ? sol.role.charAt(0).toUpperCase() + sol.role.slice(1)
    : '';

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle={C.statusBar} backgroundColor={C.bg} />
      <LinearGradient colors={C.headerGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1 }}>

      {/* ── Botón atrás — visible en los 3 estados ── */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} activeOpacity={0.7} onPress={handleVolver}>
          <Ionicons name="arrow-back" size={22} color={C.white} />
        </TouchableOpacity>
      </View>

      <View style={styles.center}>

        {/* ── Cargando ── */}
        {loading && (
          <Text style={styles.softText}>Buscando tu solicitud…</Text>
        )}

        {/* ── Solicitud no encontrada ── */}
        {!loading && !sol && (
          <>
            <Text style={styles.softText}>No se encontró la solicitud.</Text>
          </>
        )}

        {/* ── Pendiente ── */}
        {sol?.status === 'pendiente' && (
          <>
            <Animated.View
              style={[styles.iconCircle, styles.amberCircle, { transform: [{ scale: pulse }] }]}
            >
              <Ionicons name="time-outline" size={52} color={C.amber} />
            </Animated.View>

            <Text style={styles.title}>Solicitud enviada</Text>
            <Text style={styles.subtitle}>Tu solicitud está siendo revisada</Text>

            <View style={styles.infoCard}>
              <Text style={styles.infoName}>{sol.name}</Text>
              <Text style={styles.infoRole}>{roleLabel}</Text>
            </View>

            <Text style={styles.hint}>
              El administrador te responderá en menos de 24 horas
            </Text>
          </>
        )}

        {/* ── Aprobada ── */}
        {sol?.status === 'aprobada' && (
          <>
            <View style={[styles.iconCircle, styles.greenCircle]}>
              <Ionicons name="checkmark-circle" size={60} color={C.green} />
            </View>

            <Text style={styles.title}>¡Fuiste aprobado!</Text>
            <Text style={styles.subtitle}>Ya puedes ingresar a tu dashboard</Text>

            <View style={styles.infoCard}>
              <Text style={styles.infoName}>{sol.name}</Text>
              <Text style={styles.infoRole}>{roleLabel}</Text>
            </View>

            <TouchableOpacity
              style={styles.primaryBtn}
              activeOpacity={0.85}
              onPress={handleEntrar}
            >
              <Ionicons name="enter-outline" size={22} color={C.white} />
              <Text style={styles.primaryBtnText}>Entrar al dashboard</Text>
            </TouchableOpacity>
          </>
        )}

        {/* ── Rechazada ── */}
        {sol?.status === 'rechazada' && (
          <>
            <View style={[styles.iconCircle, styles.redCircle]}>
              <Ionicons name="close-circle" size={60} color={C.red} />
            </View>

            <Text style={styles.title}>Solicitud rechazada</Text>
            <Text style={styles.subtitle}>Tu solicitud no fue aprobada</Text>

            {sol.rejectionReason ? (
              <View style={styles.rejectionCard}>
                <Ionicons name="alert-circle-outline" size={18} color={C.red} />
                <Text style={styles.rejectionText}>{sol.rejectionReason}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={styles.secondaryBtn}
              activeOpacity={0.85}
              onPress={handleReintentar}
            >
              <Ionicons name="refresh-outline" size={20} color={C.white} />
              <Text style={styles.secondaryBtnText}>Volver a enviar solicitud</Text>
            </TouchableOpacity>
          </>
        )}

      </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const makeStyles = (C: ScreenColors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },

  // Barra superior con botón atrás
  topBar: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Área central de contenido
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    gap: 20,
  },

  // Círculo de ícono
  iconCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  amberCircle: { backgroundColor: C.amberFaint },
  greenCircle: { backgroundColor: C.greenFaint },
  redCircle:   { backgroundColor: C.redFaint   },

  // Textos principales
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: C.white,
    textAlign: 'center',
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 15,
    color: C.soft,
    textAlign: 'center',
    marginTop: -8,
  },
  hint: {
    fontSize: 13,
    color: C.soft,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Card de info del usuario
  infoCard: {
    backgroundColor: C.card,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 28,
    alignItems: 'center',
    gap: 4,
    width: '100%',
  },
  infoName: {
    fontSize: 17,
    fontWeight: '700',
    color: C.white,
  },
  infoRole: {
    fontSize: 13,
    color: C.soft,
  },

  // Card de motivo de rechazo
  rejectionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: C.redFaint,
    borderWidth: 1,
    borderColor: C.redBorder,
    borderRadius: 14,
    padding: 16,
    width: '100%',
  },
  rejectionText: {
    fontSize: 14,
    fontWeight: '600',
    color: C.red,
    flex: 1,
  },

  // Botón principal (aprobada)
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: C.green,
    borderRadius: 18,
    paddingVertical: 18,
    width: '100%',
    marginTop: 4,
    shadowColor: C.green,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryBtnText: {
    fontSize: 17,
    fontWeight: '700',
    color: C.white,
  },

  // Botón secundario (rechazada)
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.30)',
    borderRadius: 18,
    paddingVertical: 18,
    width: '100%',
    marginTop: 4,
  },
  secondaryBtnText: {
    fontSize: 17,
    fontWeight: '700',
    color: C.white,
  },

  // Fallback (solicitud no encontrada)
  softText: {
    fontSize: 15,
    color: C.soft,
    textAlign: 'center',
  },
});
