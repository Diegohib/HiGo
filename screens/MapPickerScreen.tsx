import { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Platform,
  StatusBar,
} from 'react-native';
import MapView, { Region, UrlTile } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { HomeStackParamList } from '../navigation/types';

// ─── Centro inicial ───────────────────────────────────────────────────────────

const QUITO: Region = {
  latitude:      -0.1807,
  longitude:     -78.4678,
  latitudeDelta:  0.005,
  longitudeDelta: 0.005,
};

// ─── Componente ───────────────────────────────────────────────────────────────

export default function MapPickerScreen() {
  const navigation = useNavigation<StackNavigationProp<HomeStackParamList, 'MapPicker'>>();
  const mapRef     = useRef<MapView>(null);

  // Región central actual (se actualiza en onRegionChangeComplete)
  const regionRef  = useRef<Region>(QUITO);

  const [isDragging,   setIsDragging]   = useState(false);
  const [isGeocoding,  setIsGeocoding]  = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [address,      setAddress]      = useState('Obteniendo ubicación…');

  // ── GPS al montar: animar desde Quito hasta la posición real ─────────────────

  useEffect(() => {
    async function goToGPS() {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;              // queda en Quito

        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        const gpsRegion: Region = {
          latitude:      pos.coords.latitude,
          longitude:     pos.coords.longitude,
          latitudeDelta:  0.005,
          longitudeDelta: 0.005,
        };
        regionRef.current = gpsRegion;
        mapRef.current?.animateToRegion(gpsRegion, 900);
        // Geocodificar la posición GPS inicial
        geocodeRegion(gpsRegion);
      } catch {
        geocodeRegion(QUITO);
      }
    }
    goToGPS();
  }, []);

  // ── Reverse geocoding ────────────────────────────────────────────────────────

  async function geocodeRegion(region: Region) {
    setIsGeocoding(true);
    try {
      const results = await Location.reverseGeocodeAsync({
        latitude:  region.latitude,
        longitude: region.longitude,
      });
      setAddress(formatAddress(results[0]));
    } catch {
      setAddress(`${region.latitude.toFixed(5)}, ${region.longitude.toFixed(5)}`);
    } finally {
      setIsGeocoding(false);
    }
  }

  // ── Confirmar y volver a Checkout ────────────────────────────────────────────

  async function handleConfirm() {
    setIsConfirming(true);
    const { latitude, longitude } = regionRef.current;
    try {
      const results  = await Location.reverseGeocodeAsync({ latitude, longitude });
      const resolved = formatAddress(results[0]);
      navigation.navigate('Checkout', {
        pickedAddress: resolved,
        pickedLat:     latitude,
        pickedLng:     longitude,
      });
    } catch {
      navigation.navigate('Checkout', {
        pickedAddress: address,
        pickedLat:     latitude,
        pickedLng:     longitude,
      });
    } finally {
      setIsConfirming(false);
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* ── Mapa fullscreen ── */}
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        mapType="none"
        initialRegion={QUITO}
        onRegionChange={() => {
          if (!isDragging) setIsDragging(true);
          setAddress('Buscando dirección…');
        }}
        onRegionChangeComplete={(region) => {
          regionRef.current = region;
          setIsDragging(false);
          geocodeRegion(region);
        }}
        showsUserLocation
        showsMyLocationButton={false}
        showsCompass={false}
        showsScale={false}
        toolbarEnabled={false}
        rotateEnabled={false}
        pitchEnabled={false}
      >
        {/*
          CartoDB Positron: estilo minimalista estándar de la industria.
          Calles gris claro, manzanas blancas, nombres de calles en gris oscuro.
          Sin íconos de POI, negocios, restaurantes ni tiendas.
          (customMapStyle solo aplica a PROVIDER_GOOGLE y requiere API key;
           cambiar el tile URL logra el mismo resultado sin dependencias extra.)
        */}
        <UrlTile
          urlTemplate="https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png"
          maximumZ={19}
          flipY={false}
          opacity={1}
        />
      </MapView>

      {/* ── Pin fijo en el centro ── */}
      {/* La punta del pin apunta al centro exacto de la pantalla */}
      <View style={styles.pinAnchor} pointerEvents="none">
        <View style={[styles.pinIcon, isDragging && styles.pinIconLifted]}>
          <Ionicons name="location" size={46} color="#3D1F8B" />
        </View>
        <View style={[styles.pinDot, isDragging && styles.pinDotSmall]} />
      </View>

      {/* ── Barra superior ── */}
      <SafeAreaView style={styles.topSafe}>
        <View style={styles.topBar}>
          {/* Botón atrás */}
          <TouchableOpacity
            style={styles.backBtn}
            activeOpacity={0.7}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={20} color="#1A1A1A" />
          </TouchableOpacity>

          {/* Dirección + hint */}
          <View style={styles.addressBlock}>
            <Text style={styles.hintText}>Mueve el mapa para ajustar tu ubicación</Text>

            <View style={styles.addressRow}>
              {isGeocoding || isDragging ? (
                <>
                  <ActivityIndicator size="small" color="#9B8EC4" style={{ marginRight: 6 }} />
                  <Text style={styles.addressSearching}>Buscando dirección…</Text>
                </>
              ) : (
                <Text style={styles.addressText} numberOfLines={2}>{address}</Text>
              )}
            </View>
          </View>
        </View>
      </SafeAreaView>

      {/* ── Botón confirmar ── */}
      <SafeAreaView style={styles.bottomSafe}>
        <TouchableOpacity
          style={[styles.confirmBtn, isConfirming && styles.confirmBtnBusy]}
          activeOpacity={0.88}
          onPress={isConfirming ? undefined : handleConfirm}
        >
          {isConfirming ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Ionicons name="checkmark-circle" size={22} color="#FFFFFF" />
          )}
          <Text style={styles.confirmText}>
            {isConfirming ? 'Confirmando…' : 'Confirmar esta ubicación'}
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
}

// ─── Formateador ─────────────────────────────────────────────────────────────

function formatAddress(place: Location.LocationGeocodedAddress | undefined): string {
  if (!place) return 'Ubicación seleccionada';
  const parts: string[] = [];
  if (place.street)        parts.push(place.street);
  if (place.streetNumber)  parts.push(place.streetNumber);
  if (place.district)      parts.push(place.district);
  else if (place.subregion) parts.push(place.subregion);
  if (place.city)          parts.push(place.city);
  return parts.length > 0 ? parts.join(', ') : (place.name ?? 'Ubicación seleccionada');
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F5F5F5', // coincide con el fondo claro de CartoDB Positron
  },

  // ── Pin ─────────────────────────────────────────────────────────────────────
  // Centrado absoluto. translateY: -23 mueve la punta del ícono (46px alto,
  // punta en la mitad inferior) al punto central exacto de la pantalla.
  pinAnchor: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    alignItems: 'center',
    // La "punta" del ícono location mide ~23px desde el fondo del viewbox
    transform: [{ translateX: -23 }, { translateY: -46 }],
  },
  pinIcon: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 6,
  },
  pinIconLifted: {
    transform: [{ translateY: -6 }],
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 8,
  },
  pinDot: {
    width: 8,
    height: 4,
    borderRadius: 4,
    backgroundColor: 'rgba(0,0,0,0.22)',
    marginTop: -2,
  },
  pinDotSmall: {
    width: 12,
    height: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(0,0,0,0.12)',
    transform: [{ translateY: 6 }],
  },

  // ── Barra superior ───────────────────────────────────────────────────────────
  topSafe: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 12,
    marginTop: Platform.OS === 'android' ? 36 : 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.14,
    shadowRadius: 8,
    elevation: 6,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addressBlock: {
    flex: 1,
    gap: 2,
  },
  hintText: {
    fontSize: 11,
    color: '#9B8EC4',
    fontWeight: '500',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 20,
  },
  addressText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A1A',
    lineHeight: 20,
    flex: 1,
  },
  addressSearching: {
    fontSize: 13,
    color: '#BEB3E0',
    fontStyle: 'italic',
  },

  // ── Botón inferior ───────────────────────────────────────────────────────────
  bottomSafe: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#2ECC71',
    marginHorizontal: 16,
    marginBottom: Platform.OS === 'android' ? 24 : 16,
    paddingVertical: 18,
    borderRadius: 18,
    shadowColor: '#2ECC71',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  confirmBtnBusy: {
    backgroundColor: '#27AE60',
    shadowOpacity: 0.2,
  },
  confirmText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
});
