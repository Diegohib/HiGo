import { StyleSheet, View, TouchableOpacity, Alert, Image } from 'react-native';
import Text from '../components/Text';
import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList, StaffRole } from '../navigation/types';
import { useAuthStore } from '../store/authStore';
import { useAdminSolicitudesStore } from '../store/adminSolicitudesStore';
import { useThemeColors } from '../theme/useThemeColors';
import { ThemeColors } from '../theme/colors';
import { RADIUS, SPACING } from '../theme/elevation';
import { storage } from '../lib/firebase';
import { AuthScreen, AuthField, AuthPrimaryButton, AuthTextLink } from '../components/AuthLayout';

// Más estricta que la del cliente (MIN_PASSWORD_LENGTH=6): quien maneja un rol
// operativo confirma identidad con documentos, así que pedimos algo no trivial.
const MIN_STAFF_PASSWORD_LENGTH = 8;
const STAFF_PASSWORD_RE = /^(?=.*[A-Za-z])(?=.*\d).+$/; // al menos una letra y un número

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
  icon: keyof typeof Ionicons.glyphMap;
  keyboardType?: 'default' | 'phone-pad' | 'number-pad';
  maxLength?: number;
  autoCapitalize?: 'none' | 'words' | 'sentences' | 'characters';
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
  ionIcon?: keyof typeof Ionicons.glyphMap;
  gradient?: [string, string];
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
    ionIcon: 'bicycle',
    gradient: ['#7B4BF5', '#5B2BD9'],
    color: '#5B2BD9',
    accentColor: '#B8A6E8',
    extraFields: [
      { type: 'text', key: 'cedula',   placeholder: 'Número de cédula (10 dígitos)', icon: 'card-outline',    keyboardType: 'number-pad', maxLength: 10 },
      { type: 'text', key: 'numCoche', placeholder: 'Número de coche',               icon: 'bicycle-outline', keyboardType: 'number-pad' },
    ],
    photoUploads: [
      { key: 'cedula', label: 'Subir foto de cédula', icon: 'card-outline'   },
      { key: 'selfie', label: 'Subir tu foto',        icon: 'camera-outline' },
    ],
  },
  transportista: {
    label: 'Transportista',
    icon: '🚚',
    ionIcon: 'car',
    gradient: ['#7B4BF5', '#5B2BD9'],
    color: '#5B2BD9',
    accentColor: '#B8A6E8',
    extraFields: [
      { type: 'text', key: 'cedula',   placeholder: 'Número de cédula (10 dígitos)', icon: 'card-outline', keyboardType: 'number-pad', maxLength: 10 },
      { type: 'text', key: 'vehiculo', placeholder: 'Ej: Camioneta Chevrolet D-MAX',  icon: 'car-outline',  autoCapitalize: 'words', maxLength: 40 },
      { type: 'text', key: 'placa',    placeholder: 'Ej: PBA-1234',                   icon: 'document-text-outline', autoCapitalize: 'characters', maxLength: 10 },
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
    ionIcon: 'storefront',
    gradient: ['#7B4BF5', '#5B2BD9'],
    color: '#5B2BD9',
    accentColor: '#B8A6E8',
    extraFields: [
      { type: 'text',   key: 'cedula',      placeholder: 'Número de cédula (10 dígitos)',  icon: 'card-outline',       keyboardType: 'number-pad', maxLength: 10 },
      {
        type: 'picker',
        key: 'giro',
        label: '¿Qué productos vendes?',
        subtitle: 'Recibirás notificaciones solo de tus productos',
        options: GIRO_OPTIONS,
      },
      { type: 'text',   key: 'stallNumber', placeholder: 'Número de puesto en el mercado', icon: 'storefront-outline', keyboardType: 'number-pad' },
    ],
    photoUploads: [
      { key: 'cedula', label: 'Subir foto de cédula', icon: 'card-outline'   },
      { key: 'selfie', label: 'Subir tu foto',        icon: 'camera-outline' },
    ],
  },
};


// Etiqueta corta de cada campo extra (el placeholder queda como ejemplo).
const FIELD_LABELS: Record<string, string> = {
  cedula:      'Número de cédula',
  numCoche:    'Número de coche',
  stallNumber: 'Número de puesto',
  vehiculo:    'Vehículo',
  placa:       'Placa',
};

// Bajada del encabezado según el rol.
const ROLE_TAGLINE: Record<StaffRole, string> = {
  cochero:       'Recoge los pedidos en los puestos del mercado.',
  transportista: 'Lleva los pedidos del mercado a cada cliente.',
  comerciante:   'Recibe pedidos para tu puesto del mercado.',
};

// ─── Componente: título de sección ────────────────────────────────────────────

function SectionLabel({ text, step }: { text: string; step: number }) {
  const C = useThemeColors();
  const styles = makeStyles(C);
  return (
    <View style={styles.sectionRow}>
      <View style={styles.sectionStep}>
        <Text style={styles.sectionStepText}>{step}</Text>
      </View>
      <Text style={styles.sectionLabel}>{text}</Text>
    </View>
  );
}

// ─── Componente: carga de foto ────────────────────────────────────────────────

function PhotoUploadButton({
  label,
  icon,
  uri,
  onPress,
}: {
  label: string;
  icon: 'card-outline' | 'car-outline' | 'camera-outline';
  uri?: string;
  onPress: () => void;
}) {
  const C = useThemeColors();
  const styles = makeStyles(C);
  const uploaded = !!uri;
  return (
    <TouchableOpacity
      style={[styles.photoButton, uploaded && styles.photoButtonDone]}
      activeOpacity={0.75}
      onPress={onPress}
    >
      {uploaded ? (
        <Image source={{ uri }} style={styles.photoThumbnail} />
      ) : (
        <View style={styles.photoIconBox}>
          <Ionicons name={icon} size={22} color={C.primary} />
        </View>
      )}
      <View style={{ flex: 1 }}>
        <Text style={styles.photoLabel}>{label.replace('Subir ', '').replace(/^./, (c) => c.toUpperCase())}</Text>
        <Text style={[styles.photoStatus, uploaded && { color: C.success }]}>
          {uploaded ? 'Cargada · toca para cambiar' : 'Toca para subir'}
        </Text>
      </View>
      <Ionicons
        name={uploaded ? 'checkmark-circle' : 'cloud-upload-outline'}
        size={22}
        color={uploaded ? C.success : C.textFaint}
      />
    </TouchableOpacity>
  );
}

// ─── Componente: selector de giro ─────────────────────────────────────────────

function GiroPicker({
  field,
  selected,
  onSelect,
}: {
  field: PickerField;
  selected: string | null;
  onSelect: (option: string) => void;
}) {
  const C = useThemeColors();
  const styles = makeStyles(C);
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
              style={[styles.giroPill, active && styles.giroPillActive]}
              activeOpacity={0.75}
              onPress={() => onSelect(option)}
            >
              {active && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
              <Text style={[styles.giroPillText, active && styles.giroPillTextActive]}>{option}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}


// ─── Pantalla principal ───────────────────────────────────────────────────────

const PHOTO_LABELS: Record<PhotoUploadKey, string> = {
  cedula:   'Foto de cédula',
  matricula:'Foto de matrícula',
  selfie:   'Foto de perfil',
};

export default function StaffRegisterScreen({ navigation, route }: Props) {
  const C = useThemeColors();
  const styles = makeStyles(C);
  const { role } = route.params;
  const config = ROLE_CONFIG[role];
  const user = useAuthStore((s) => s.user);
  const agregarSolicitud = useAdminSolicitudesStore((s) => s.agregarSolicitud);

  const registerStaff = useAuthStore((s) => s.registerStaff);

  // Si ya hay sesión (p.ej. un cliente que se está registrando también como
  // operador), se separa su nombre guardado en dos partes como punto de
  // partida editable — no hay forma confiable de saber dónde corta de verdad.
  const [namePart1, ...nameRest] = (user?.name ?? '').trim().split(/\s+/);
  const [firstName,       setFirstName]       = useState(namePart1 ?? '');
  const [lastName,        setLastName]        = useState(nameRest.join(' '));
  const [edad,            setEdad]            = useState('');
  const [phone,           setPhone]           = useState(user?.phone ?? '');
  const [email,           setEmail]           = useState('');
  const [password,        setPassword]        = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [extraValues,     setExtraValues]     = useState<Record<string, string>>({});
  const [photos,          setPhotos]          = useState<Partial<Record<PhotoUploadKey, string>>>({});
  const [selectedGiro,    setSelectedGiro]    = useState<string | null>(null);
  const [submitting,      setSubmitting]      = useState(false);

  async function pickFromCamera(key: PhotoUploadKey) {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permiso necesario', 'Activa el acceso a la cámara para tomar la foto.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.6, allowsEditing: true });
    if (!result.canceled && result.assets[0]) {
      setPhotos(prev => ({ ...prev, [key]: result.assets[0].uri }));
    }
  }

  async function pickFromLibrary(key: PhotoUploadKey) {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permiso necesario', 'Activa el acceso a tus fotos para elegir la imagen.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.6, allowsEditing: true });
    if (!result.canceled && result.assets[0]) {
      setPhotos(prev => ({ ...prev, [key]: result.assets[0].uri }));
    }
  }

  function pickPhoto(key: PhotoUploadKey) {
    Alert.alert('Subir foto', '¿Cómo quieres agregar la imagen?', [
      { text: 'Tomar foto', onPress: () => pickFromCamera(key) },
      { text: 'Elegir de galería', onPress: () => pickFromLibrary(key) },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  }

  async function uploadDocumentPhoto(uid: string, key: PhotoUploadKey, localUri: string): Promise<string> {
    const response = await fetch(localUri);
    const blob = await response.blob();
    const fileRef = ref(storage, `solicitudes/${uid}/${key}.jpg`);
    await uploadBytes(fileRef, blob, { contentType: 'image/jpeg' });
    return getDownloadURL(fileRef);
  }

  async function handleSubmit() {
    if (!firstName.trim() || !lastName.trim() || !edad.trim() || !phone.trim() || !email.trim() || !password || !confirmPassword) {
      Alert.alert('Campos incompletos', 'Por favor completa todos los campos, incluyendo correo y contraseña.');
      return;
    }
    const edadNum = parseInt(edad, 10);
    if (!Number.isInteger(edadNum) || edadNum < 18 || edadNum > 90) {
      Alert.alert('Edad inválida', 'Ingresa una edad entre 18 y 90 años.');
      return;
    }
    if (password.length < MIN_STAFF_PASSWORD_LENGTH || !STAFF_PASSWORD_RE.test(password)) {
      Alert.alert(
        'Contraseña insegura',
        `La contraseña debe tener al menos ${MIN_STAFF_PASSWORD_LENGTH} caracteres, con letras y números.`
      );
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Contraseñas distintas', 'Las contraseñas no coinciden.');
      return;
    }
    for (const field of config.extraFields) {
      if (field.type === 'text' && !extraValues[field.key]?.trim()) {
        Alert.alert('Campos incompletos', `Por favor completa: ${field.placeholder}`);
        return;
      }
      if (field.type === 'picker' && !selectedGiro) {
        Alert.alert('Campos incompletos', `Por favor selecciona ${field.label}`);
        return;
      }
    }
    const uploadedKeys = (Object.keys(photos) as PhotoUploadKey[]).filter((k) => photos[k]);
    if (uploadedKeys.length < config.photoUploads.length) {
      Alert.alert('Documentos incompletos', 'Sube todos los documentos solicitados antes de enviar.');
      return;
    }

    const name = `${firstName.trim()} ${lastName.trim()}`;
    const extraData: Record<string, string> = { ...extraValues, edad: edad.trim() };
    if (selectedGiro) extraData.giro = selectedGiro;

    setSubmitting(true);
    try {
      const uid = await registerStaff({
        name,
        firstName: firstName.trim(),
        lastName:  lastName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        password,
        role,
        edad:        edad.trim(),
        cedula:      extraValues.cedula,
        numCoche:    extraValues.numCoche,
        stallNumber: extraValues.stallNumber,
        vehiculo:    extraValues.vehiculo?.trim(),
        placa:       extraValues.placa?.trim().toUpperCase(),
        giro:        selectedGiro ?? undefined,
      });

      // Se suben recién acá porque necesitan la sesión ya autenticada (recién
      // creada arriba) para pasar las reglas de Storage. Cada foto se sube por
      // separado: si Storage no está disponible (todavía no se activó en el
      // proyecto) o falla una sola, no se bloquea el registro completo — la
      // solicitud igual se crea, solo sin esa foto en particular.
      const documents = uploadedKeys.map((k) => PHOTO_LABELS[k]);
      const photoUris: Record<string, string> = {};
      await Promise.all(
        uploadedKeys.map(async (k) => {
          try {
            photoUris[PHOTO_LABELS[k]] = await uploadDocumentPhoto(uid, k, photos[k]!);
          } catch (uploadError) {
            console.error('[StaffRegister] upload error:', PHOTO_LABELS[k], uploadError);
          }
        })
      );

      const solicitudId = await agregarSolicitud({
        uid,
        name,
        phone: phone.trim(),
        email: email.trim(),
        role,
        avatar: config.icon,
        documents,
        photoUris,
        extraData,
      });

      navigation.navigate('SolicitudPendiente', { solicitudId });
      // Queda arriba de esa pantalla como confirmación explícita de que se
      // creó la cuenta y se envió el correo de verificación.
      Alert.alert(
        '¡Solicitud enviada! 🎉',
        `Creamos tu cuenta y te enviamos un correo de verificación a ${email.trim()}. Confírmalo y espera la aprobación del administrador (menos de 24 horas).`
      );
    } catch (error: any) {
      const message =
        error?.code === 'auth/email-already-in-use' ? 'Ese correo ya está registrado.' :
        error?.code === 'auth/weak-password'         ? 'La contraseña debe tener al menos 6 caracteres.' :
        error?.code === 'auth/invalid-email'          ? 'El correo ingresado no es válido.' :
        'No se pudo enviar la solicitud. Intenta de nuevo.';
      Alert.alert('Error', message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthScreen
      eyebrow="Registro de personal"
      title={`Registrarme como ${config.label.toLowerCase()}`}
      subtitle={ROLE_TAGLINE[role]}
      onBack={navigation.canGoBack() ? () => navigation.goBack() : undefined}
    >
      {/* ── Datos personales ── */}
      <SectionLabel step={1} text="Datos personales" />

      <View style={styles.fieldRow}>
        <View style={{ flex: 1 }}>
          <AuthField
            label="Nombres"
            icon="person-outline"
            placeholder="Juan"
            autoCapitalize="words"
            value={firstName}
            onChangeText={setFirstName}
          />
        </View>
        <View style={{ flex: 1 }}>
          <AuthField
            label="Apellidos"
            icon="person-outline"
            placeholder="Pérez"
            autoCapitalize="words"
            value={lastName}
            onChangeText={setLastName}
          />
        </View>
      </View>
      <View style={styles.fieldRow}>
        <View style={{ flex: 0.38 }}>
          <AuthField
            label="Edad"
            icon="calendar-outline"
            placeholder="25"
            keyboardType="number-pad"
            maxLength={2}
            value={edad}
            onChangeText={setEdad}
          />
        </View>
        <View style={{ flex: 0.62 }}>
          <AuthField
            label="Teléfono"
            icon="call-outline"
            placeholder="09xxxxxxxx"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />
        </View>
      </View>

      {/* ── Datos del rol ── */}
      <SectionLabel step={2} text={`Datos de ${config.label.toLowerCase()}`} />

      {config.extraFields.map(field => {
        if (field.type === 'picker') {
          return (
            <GiroPicker
              key={field.key}
              field={field}
              selected={selectedGiro}
              onSelect={setSelectedGiro}
            />
          );
        }
        return (
          <AuthField
            key={field.key}
            label={FIELD_LABELS[field.key] ?? field.placeholder}
            icon={field.icon}
            placeholder={field.placeholder}
            keyboardType={field.keyboardType ?? 'default'}
            maxLength={field.maxLength}
            autoCapitalize={field.autoCapitalize ?? 'none'}
            value={extraValues[field.key] ?? ''}
            onChangeText={(v) => setExtraValues(prev => ({ ...prev, [field.key]: v }))}
          />
        );
      })}

      {/* ── Documentos ── */}
      <SectionLabel step={3} text="Documentos" />
      <Text style={styles.sectionHint}>Los revisa el administrador para aprobar tu cuenta.</Text>
      {config.photoUploads.map(photo => (
        <PhotoUploadButton
          key={photo.key}
          label={photo.label}
          icon={photo.icon}
          uri={photos[photo.key]}
          onPress={() => pickPhoto(photo.key)}
        />
      ))}

      {/* ── Acceso ── */}
      <SectionLabel step={4} text="Tu acceso" />
      <AuthField
        label="Correo electrónico"
        icon="mail-outline"
        placeholder="tu@correo.com"
        keyboardType="email-address"
        autoCapitalize="none"
        textContentType="emailAddress"
        autoComplete="email"
        value={email}
        onChangeText={setEmail}
      />
      <AuthField
        label="Contraseña"
        icon="lock-closed-outline"
        placeholder="••••••••"
        secure
        maxLength={128}
        textContentType="newPassword"
        autoComplete="password-new"
        hint={`Mínimo ${MIN_STAFF_PASSWORD_LENGTH} caracteres, con letras y números.`}
        value={password}
        onChangeText={setPassword}
      />
      <AuthField
        label="Confirmar contraseña"
        icon="lock-closed-outline"
        placeholder="••••••••"
        secure
        maxLength={128}
        textContentType="newPassword"
        autoComplete="password-new"
        hint={confirmPassword.length > 0 && confirmPassword !== password ? 'Las contraseñas no coinciden.' : undefined}
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />

      <AuthPrimaryButton
        label="Enviar solicitud"
        loading={submitting}
        onPress={handleSubmit}
      />

      <View style={styles.pendingNote}>
        <Ionicons name="time-outline" size={15} color={C.textSoft} />
        <Text style={styles.pendingText}>Tu solicitud se revisa en menos de 24 horas.</Text>
      </View>

      <AuthTextLink label="Elegir otro rol" icon="arrow-back" onPress={() => navigation.goBack()} />
    </AuthScreen>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const makeStyles = (C: ThemeColors) => StyleSheet.create({
  fieldRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },

  // Secciones
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm + 2,
    marginTop: SPACING.sm,
  },
  sectionStep: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: C.primaryFaint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionStepText: {
    fontSize: 12,
    fontWeight: '700',
    color: C.primary,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: C.text,
  },
  sectionHint: {
    fontSize: 13,
    color: C.textSoft,
    marginTop: -SPACING.sm,
  },

  // Giro
  pickerWrapper: {
    gap: 4,
  },
  pickerLabel: {
    fontSize: 13.5,
    fontWeight: '600',
    color: C.text,
  },
  pickerSubtitle: {
    fontSize: 12,
    color: C.textSoft,
    marginBottom: 6,
  },
  pillsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  giroPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: RADIUS.pill,
    borderWidth: 1.5,
    borderColor: C.border,
    backgroundColor: C.surface,
  },
  giroPillActive: {
    backgroundColor: C.primary,
    borderColor: C.primary,
  },
  giroPillText: {
    fontSize: 14,
    fontWeight: '500',
    color: C.text,
  },
  giroPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // Fotos
  photoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: C.border,
    backgroundColor: C.surface,
  },
  photoButtonDone: {
    borderStyle: 'solid',
    borderColor: C.success,
  },
  photoIconBox: {
    width: 46,
    height: 46,
    borderRadius: RADIUS.sm,
    backgroundColor: C.primaryFaint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoThumbnail: {
    width: 46,
    height: 46,
    borderRadius: RADIUS.sm,
  },
  photoLabel: {
    fontSize: 14.5,
    fontWeight: '600',
    color: C.text,
  },
  photoStatus: {
    fontSize: 12,
    color: C.textSoft,
    marginTop: 1,
  },

  pendingNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: -SPACING.xs,
  },
  pendingText: {
    fontSize: 13,
    color: C.textSoft,
  },
});
