import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList, StaffRole } from '../navigation/types';

type Props = {
  navigation: StackNavigationProp<RootStackParamList, 'StaffRegister'>;
  route: RouteProp<RootStackParamList, 'StaffRegister'>;
};

// ─── Tipos ────────────────────────────────────────────────────────────────────

type PhotoUploadKey = 'cedula' | 'matricula' | 'selfie';

type TextField = {
  type: 'text';
  key: string;
  placeholder: string;
  keyboardType?: 'default' | 'phone-pad' | 'number-pad';
  maxLength?: number;
  autoCapitalize?: 'none' | 'words' | 'sentences';
};

type PickerField = {
  type: 'picker';
  key: string;
  label: string;
  subtitle: string;
  options: string[];
};

type ExtraField = TextField | PickerField;

interface RoleConfig {
  label: string;
  icon: string;
  color: string;
  accentColor: string;
  extraFields: ExtraField[];
  photoUploads: { key: PhotoUploadKey; label: string; icon: 'card-outline' | 'car-outline' | 'camera-outline' }[];
}

// ─── Configuración por rol ────────────────────────────────────────────────────

const GIRO_OPTIONS = ['Frutas', 'Verduras', 'Tubérculos', 'Arroz', 'Azúcar', 'Huevos'];

const ROLE_CONFIG: Record<StaffRole, RoleConfig> = {
  cochero: {
    label: 'Cochero',
    icon: '🚲',
    color: '#2D7A3A',
    accentColor: '#6FCF97',
    extraFields: [
      { type: 'text', key: 'cedula',   placeholder: 'Número de cédula (10 dígitos)', keyboardType: 'number-pad', maxLength: 10 },
      { type: 'text', key: 'numCoche', placeholder: 'Número de coche',               keyboardType: 'number-pad' },
    ],
    photoUploads: [
      { key: 'cedula', label: 'Subir foto de cédula', icon: 'card-outline'   },
      { key: 'selfie', label: 'Subir tu foto',        icon: 'camera-outline' },
    ],
  },
  transportista: {
    label: 'Transportista',
    icon: '🚚',
    color: '#8B6914',
    accentColor: '#F2C94C',
    extraFields: [
      { type: 'text', key: 'cedula', placeholder: 'Número de cédula (10 dígitos)', keyboardType: 'number-pad', maxLength: 10 },
    ],
    photoUploads: [
      { key: 'cedula',    label: 'Subir foto de cédula',    icon: 'card-outline'   },
      { key: 'matricula', label: 'Subir foto de matrícula', icon: 'car-outline'    },
      { key: 'selfie',    label: 'Subir tu foto',           icon: 'camera-outline' },
    ],
  },
  comerciante: {
    label: 'Comerciante',
    icon: '🏪',
    color: '#C4623A',
    accentColor: '#F2994A',
    extraFields: [
      { type: 'text',   key: 'cedula',      placeholder: 'Número de cédula (10 dígitos)',  keyboardType: 'number-pad', maxLength: 10 },
      {
        type: 'picker',
        key: 'giro',
        label: '¿Qué productos vendes?',
        subtitle: 'Recibirás notificaciones solo de tus productos',
        options: GIRO_OPTIONS,
      },
      { type: 'text',   key: 'stallNumber', placeholder: 'Número de puesto en el mercado', keyboardType: 'number-pad' },
    ],
    photoUploads: [
      { key: 'cedula', label: 'Subir foto de cédula', icon: 'card-outline'   },
      { key: 'selfie', label: 'Subir tu foto',        icon: 'camera-outline' },
    ],
  },
};

// ─── Componente: botón de carga de foto ───────────────────────────────────────

function PhotoUploadButton({
  label,
  icon,
  color,
  uploaded,
  onPress,
}: {
  label: string;
  icon: 'card-outline' | 'car-outline' | 'camera-outline';
  color: string;
  uploaded: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.photoButton, uploaded && { borderColor: color, borderStyle: 'solid' }]}
      activeOpacity={0.75}
      onPress={onPress}
    >
      <View style={[styles.photoIconCircle, { backgroundColor: uploaded ? color : 'rgba(255,255,255,0.15)' }]}>
        <Ionicons name={uploaded ? 'checkmark' : icon} size={24} color="#FFFFFF" />
      </View>
      <Text style={styles.photoLabel}>{uploaded ? 'Foto cargada' : label}</Text>
      {!uploaded && (
        <Ionicons name="cloud-upload-outline" size={18} color="rgba(255,255,255,0.5)" />
      )}
    </TouchableOpacity>
  );
}

// ─── Componente: selector de giro ─────────────────────────────────────────────

function GiroPicker({
  field,
  selected,
  color,
  accentColor,
  onSelect,
}: {
  field: PickerField;
  selected: string | null;
  color: string;
  accentColor: string;
  onSelect: (option: string) => void;
}) {
  return (
    <View style={styles.pickerWrapper}>
      <Text style={styles.pickerLabel}>{field.label}</Text>
      <Text style={styles.pickerSubtitle}>{field.subtitle}</Text>
      <View style={styles.pillsGrid}>
        {field.options.map(option => {
          const active = selected === option;
          return (
            <TouchableOpacity
              key={option}
              style={[
                styles.giroPill,
                active
                  ? { backgroundColor: color, borderColor: color }
                  : { backgroundColor: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.25)' },
              ]}
              activeOpacity={0.75}
              onPress={() => onSelect(option)}
            >
              {active && (
                <Ionicons name="checkmark-circle" size={14} color="#FFFFFF" style={styles.pillCheck} />
              )}
              <Text style={[styles.giroPillText, active && { fontWeight: '700' }]}>
                {option}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ─── Pantalla principal ───────────────────────────────────────────────────────

export default function StaffRegisterScreen({ navigation, route }: Props) {
  const { role } = route.params;
  const config = ROLE_CONFIG[role];

  const [uploaded, setUploaded] = useState<Partial<Record<PhotoUploadKey, boolean>>>({});
  const [selectedGiro, setSelectedGiro] = useState<string | null>(null);

  function toggleUpload(key: PhotoUploadKey) {
    setUploaded(prev => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {/* ── Encabezado de rol ── */}
      <View style={styles.header}>
        <View style={[styles.iconCircle, { backgroundColor: config.color }]}>
          <Text style={styles.roleEmoji}>{config.icon}</Text>
        </View>
        <Text style={styles.title}>Registrarme como</Text>
        <Text style={[styles.roleLabel, { color: config.accentColor }]}>{config.label}</Text>
      </View>

      <View style={styles.form}>
        {/* ── Campos comunes ── */}
        <Text style={styles.sectionLabel}>Datos personales</Text>

        <TextInput
          style={styles.input}
          placeholder="Nombre completo"
          placeholderTextColor="#9B8EC4"
          autoCapitalize="words"
        />
        <TextInput
          style={styles.input}
          placeholder="Teléfono de contacto"
          placeholderTextColor="#9B8EC4"
          keyboardType="phone-pad"
        />

        {/* ── Campos específicos del rol ── */}
        {config.extraFields.map(field => {
          if (field.type === 'picker') {
            return (
              <GiroPicker
                key={field.key}
                field={field}
                selected={selectedGiro}
                color={config.color}
                accentColor={config.accentColor}
                onSelect={setSelectedGiro}
              />
            );
          }
          return (
            <TextInput
              key={field.key}
              style={styles.input}
              placeholder={field.placeholder}
              placeholderTextColor="#9B8EC4"
              keyboardType={field.keyboardType ?? 'default'}
              maxLength={field.maxLength}
              autoCapitalize={field.autoCapitalize ?? 'none'}
            />
          );
        })}

        {/* ── Carga de fotos ── */}
        <Text style={[styles.sectionLabel, { marginTop: 8 }]}>Documentos y verificación</Text>

        {config.photoUploads.map(photo => (
          <PhotoUploadButton
            key={photo.key}
            label={photo.label}
            icon={photo.icon}
            color={config.color}
            uploaded={!!uploaded[photo.key]}
            onPress={() => toggleUpload(photo.key)}
          />
        ))}

        {/* ── Botón enviar ── */}
        <TouchableOpacity
          style={[styles.submitButton, { backgroundColor: config.color }]}
          activeOpacity={0.85}
        >
          <Ionicons name="paper-plane-outline" size={20} color="#FFFFFF" />
          <Text style={styles.submitButtonText}>Enviar solicitud</Text>
        </TouchableOpacity>

        {/* ── Mensaje de espera ── */}
        <View style={styles.pendingNote}>
          <Ionicons name="time-outline" size={16} color="rgba(255,255,255,0.6)" />
          <Text style={styles.pendingText}>
            Tu solicitud será revisada en menos de 24 horas
          </Text>
        </View>

        <TouchableOpacity
          style={styles.backLinkWrapper}
          activeOpacity={0.6}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backLink}>← Elegir otro rol</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#3D1F8B',
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 48,
  },

  // Encabezado
  header: {
    alignItems: 'center',
    marginBottom: 28,
    gap: 6,
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  roleEmoji: { fontSize: 32 },
  title: {
    fontSize: 15,
    color: '#FFFFFF',
    opacity: 0.75,
  },
  roleLabel: {
    fontSize: 22,
    fontWeight: '800',
  },

  // Formulario
  form: { gap: 12 },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.55)',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 16,
    fontSize: 15,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },

  // Picker de giro
  pickerWrapper: {
    gap: 10,
  },
  pickerLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  pickerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.55)',
    marginTop: -4,
  },
  pillsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  giroPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 22,
    borderWidth: 1.5,
    gap: 5,
  },
  pillCheck: {
    marginRight: 1,
  },
  giroPillText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },

  // Foto upload
  photoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.35)',
    borderStyle: 'dashed',
    borderRadius: 14,
    padding: 16,
  },
  photoIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Botón enviar
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderRadius: 14,
    paddingVertical: 18,
    marginTop: 8,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },

  // Nota de revisión
  pendingNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 4,
  },
  pendingText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
  },

  // Link volver
  backLinkWrapper: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  backLink: {
    color: '#FFFFFF',
    fontSize: 14,
    opacity: 0.6,
  },
});
