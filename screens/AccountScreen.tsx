import {
  useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Text from '../components/Text';
import TextInput from '../components/TextInput';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';
import { useAuthStore, MIN_PASSWORD_LENGTH, Gender } from '../store/authStore';
import { useOrdersStore, OrderStatus, Order } from '../store/ordersStore';
import { useCartStore } from '../store/cartStore';
import { useThemeColors } from '../theme/useThemeColors';
import { cardShadow } from '../theme/elevation';
import { pickAvatarPhoto } from '../lib/pickAvatarPhoto';
import Avatar from '../components/Avatar';
import AppearanceSelector from '../components/AppearanceSelector';

// ─── Paleta ───────────────────────────────────────────────────────────────────

function useScreenColors() {
  const T = useThemeColors();
  return {
    primary:  T.primary,
    bg:       T.background,
    surface:  T.surface,
    text:     T.text,
    sub:      T.textFaint,
    white:    '#FFFFFF',
    divider:  T.border,
    chipBg:   T.primaryFaint,
    headerGradient: T.headerGradient,
  };
}
type ScreenColors = ReturnType<typeof useScreenColors>;

// ─── Estados de pedido ────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; bg: string; icon: keyof typeof Ionicons.glyphMap }> = {
  recibido:    { label: 'Recibido',    color: '#1565C0', bg: '#E3F2FD', icon: 'checkmark-circle' },
  en_mercado:  { label: 'En mercado',  color: '#E65100', bg: '#FFF3E0', icon: 'storefront'        },
  consolidado: { label: 'Consolidado', color: '#0277BD', bg: '#E1F5FE', icon: 'cube'              },
  en_camino:   { label: 'En camino',   color: '#F9A825', bg: '#FFF8E1', icon: 'bicycle'           },
  entregado:   { label: 'Entregado',   color: '#2E7D32', bg: '#EAFAF1', icon: 'checkmark-circle'  },
};

function formatOrderDate(timestamp: number) {
  return new Date(timestamp).toLocaleDateString('es-EC', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ─── Opciones de menú ─────────────────────────────────────────────────────────

interface MenuItem {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconBg: string;
  iconColor: string;
  onPress: () => void;
}

// ─── Componente ───────────────────────────────────────────────────────────────

export default function AccountScreen() {
  const C = useScreenColors();
  const styles = makeStyles(C);
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { logout } = useAuthStore();
  const user = useAuthStore((s) => s.user);
  const updatePhoto = useAuthStore((s) => s.updatePhoto);
  const orders = useOrdersStore((s) => s.orders);
  const addItem = useCartStore((s) => s.addItem);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showChangeEmail, setShowChangeEmail] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);

  function handleReorder(order: Order) {
    if (!order.items || order.items.length === 0) {
      Alert.alert('No disponible', 'Este pedido es de antes de que se guardaran los productos, no se puede repetir.');
      return;
    }
    order.items.forEach((item) => addItem(item));
    Alert.alert(
      '¡Agregado al carrito! 🛒',
      `Se agregaron ${order.items.length} producto${order.items.length !== 1 ? 's' : ''} de este pedido a tu carrito. Andá a la pestaña Inicio para verlo.`
    );
  }

  function handleLogout() {
    Alert.alert(
      'Cerrar sesión',
      '¿Estás seguro de que quieres cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Cerrar sesión', style: 'destructive', onPress: () => { logout(); navigation.reset({ index: 0, routes: [{ name: 'Splash' }] }); } },
      ],
      { cancelable: true }
    );
  }

  const MENU_ITEMS: MenuItem[] = [
    {
      id: 'editProfile',
      label: 'Editar datos personales',
      icon: 'create-outline',
      iconBg: C.chipBg,
      iconColor: C.primary,
      onPress: () => setShowEditProfile(true),
    },
    {
      id: 'changeEmail',
      label: 'Cambiar correo electrónico',
      icon: 'mail-outline',
      iconBg: '#E3F2FD',
      iconColor: '#1565C0',
      onPress: () => setShowChangeEmail(true),
    },
    {
      id: 'changePassword',
      label: 'Cambiar contraseña',
      icon: 'lock-closed-outline',
      iconBg: '#EDE7F6',
      iconColor: C.primary,
      onPress: () => setShowChangePassword(true),
    },
    {
      id: 'addresses',
      label: 'Mis direcciones',
      icon: 'location-outline',
      iconBg: '#EDE7F6',
      iconColor: C.primary,
      onPress: () => {},
    },
    {
      id: 'notifications',
      label: 'Notificaciones',
      icon: 'notifications-outline',
      iconBg: '#FFF3E0',
      iconColor: '#E65100',
      onPress: () => {},
    },
    {
      id: 'help',
      label: 'Ayuda / Soporte',
      icon: 'chatbubble-ellipses-outline',
      iconBg: '#E3F2FD',
      iconColor: '#1565C0',
      onPress: () => navigation.navigate('Assistant'),
    },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.primary} />

      {/* Header */}
      <LinearGradient colors={C.headerGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
        <Text style={styles.headerTitle}>Mi Cuenta</Text>
      </LinearGradient>

      {/* ── Vista invitado ── */}
      {!user ? (
        <View style={styles.guestContainer}>
          <LinearGradient colors={C.headerGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.guestIconWrapper}>
            <Ionicons name="person-outline" size={44} color={C.white} />
          </LinearGradient>
          <Text style={styles.guestTitle}>¡Bienvenido a HiGo!</Text>
          <Text style={styles.guestSubtitle}>
            Crea tu cuenta para ver tus pedidos y gestionar tu perfil
          </Text>
          <TouchableOpacity
            style={styles.guestPrimaryBtn}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('Register')}
          >
            <Text style={styles.guestPrimaryBtnText}>Crear cuenta</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.guestSecondaryBtn}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.guestSecondaryBtnText}>Ya tengo cuenta</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.operativeLink}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('RoleSelection')}
          >
            <Ionicons name="briefcase-outline" size={15} color={C.sub} />
            <Text style={styles.operativeLinkText}>Acceso para personal operativo</Text>
          </TouchableOpacity>
        </View>
      ) : (

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        {/* ── Perfil: flota sobre el borde del header ── */}
        <View style={styles.profileCard}>
          <TouchableOpacity activeOpacity={0.8} onPress={() => pickAvatarPhoto(updatePhoto)}>
            <View style={{ position: 'relative' }}>
              <View style={styles.avatarRing}>
                <Avatar name={user?.name} photoUri={user?.photoUri} size={64} bg={C.primary} textColor={C.white} />
              </View>
              <View style={styles.avatarEditBadge}>
                <Ionicons name="camera" size={12} color={C.white} />
              </View>
            </View>
          </TouchableOpacity>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.name ?? 'Invitado'}</Text>
            <View style={styles.profileEmailRow}>
              <Ionicons name="mail-outline" size={13} color={C.sub} />
              <Text style={styles.profileEmail} numberOfLines={1}>{user?.email ?? 'Sin sesión'}</Text>
            </View>
            <View style={styles.profileBadge}>
              <Ionicons name="shield-checkmark" size={12} color={C.primary} />
              <Text style={styles.profileBadgeText}>Cuenta verificada</Text>
            </View>
          </View>
        </View>

        {/* ── Pedidos recientes ── */}
        <Text style={styles.eyebrow}>Pedidos recientes</Text>

        {orders.length === 0 ? (
          <View style={styles.emptyOrders}>
            <Ionicons name="receipt-outline" size={32} color={C.sub} />
            <Text style={styles.emptyOrdersText}>Todavía no hiciste ningún pedido</Text>
          </View>
        ) : (
          orders.map((order) => {
            const cfg = STATUS_CONFIG[order.status];
            return (
              <View key={order.id} style={styles.orderCard}>
                <View style={styles.orderTop}>
                  <View style={styles.orderIdRow}>
                    <Text style={styles.orderIdLabel}>Pedido</Text>
                    <Text style={styles.orderId}>#{order.id}</Text>
                  </View>
                  <View style={[styles.statusChip, { backgroundColor: cfg.bg }]}>
                    <Ionicons name={cfg.icon} size={13} color={cfg.color} />
                    <Text style={[styles.statusChipText, { color: cfg.color }]}>{cfg.label}</Text>
                  </View>
                </View>

                <View style={styles.orderDivider} />

                <View style={styles.orderBottom}>
                  <View style={styles.orderDateRow}>
                    <Ionicons name="calendar-outline" size={14} color={C.sub} />
                    <Text style={styles.orderDate}>{formatOrderDate(order.createdAt)}</Text>
                  </View>
                  <Text style={styles.orderTotal}>${order.total.toFixed(2)}</Text>
                </View>

                <View style={styles.orderActionsRow}>
                  <TouchableOpacity
                    style={[styles.reorderBtn, { flex: 1 }]}
                    activeOpacity={0.8}
                    onPress={() => handleReorder(order)}
                  >
                    <Ionicons name="repeat-outline" size={16} color={C.primary} />
                    <Text style={styles.reorderBtnText}>Volver a pedir</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.chatBtn}
                    activeOpacity={0.8}
                    onPress={() => navigation.navigate('Assistant')}
                  >
                    <Ionicons name="chatbubble-ellipses-outline" size={18} color={C.primary} />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}

        {/* ── Apariencia ── */}
        <Text style={styles.eyebrow}>Apariencia</Text>
        <View style={styles.sectionCard}>
          <AppearanceSelector accentColor={C.primary} />
        </View>

        {/* ── Mi cuenta ── */}
        <Text style={styles.eyebrow}>Mi cuenta</Text>

        <View style={styles.menuCard}>
          {MENU_ITEMS.map((item, index) => (
            <View key={item.id}>
              <TouchableOpacity
                style={styles.menuItem}
                activeOpacity={0.7}
                onPress={item.onPress}
              >
                <View style={[styles.menuIconWrapper, { backgroundColor: item.iconBg }]}>
                  <Ionicons name={item.icon} size={20} color={item.iconColor} />
                </View>
                <Text style={styles.menuLabel}>{item.label}</Text>
                <Ionicons name="chevron-forward" size={18} color={C.sub} />
              </TouchableOpacity>
              {index < MENU_ITEMS.length - 1 && <View style={styles.menuDivider} />}
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.logoutCard} activeOpacity={0.8} onPress={handleLogout}>
          <View style={[styles.menuIconWrapper, { backgroundColor: '#FDECEA' }]}>
            <Ionicons name="log-out-outline" size={20} color="#C62828" />
          </View>
          <Text style={styles.logoutLabel}>Cerrar sesión</Text>
        </TouchableOpacity>

      </ScrollView>
      )}

      {showEditProfile && user && (
        <EditProfileModal
          initialName={user.name ?? ''}
          initialPhone={user.phone ?? ''}
          initialNickname={user.nickname ?? ''}
          initialBirthDate={user.birthDate ?? ''}
          initialGender={user.gender}
          onClose={() => setShowEditProfile(false)}
        />
      )}

      {showChangeEmail && user && (
        <ChangeEmailModal
          currentEmail={user.email ?? ''}
          onClose={() => setShowChangeEmail(false)}
        />
      )}

      {showChangePassword && (
        <ChangePasswordModal onClose={() => setShowChangePassword(false)} />
      )}
    </SafeAreaView>
  );
}

// ─── Editar datos personales ──────────────────────────────────────────────────

const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: 'femenino', label: 'Femenino' },
  { value: 'masculino', label: 'Masculino' },
  { value: 'no_binario', label: 'No binario' },
  { value: 'prefiero_no_decir', label: 'Prefiero no decir' },
];

// En Ecuador (y en general Hispanoamérica) una persona casi siempre tiene
// exactamente 2 apellidos, así que las últimas 2 palabras del nombre completo
// son el apellido y todo lo anterior son él o los nombres — no alcanza con
// separar solo por la primera palabra.
function splitFullName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return { firstName: parts[0] ?? '', lastName: '' };
  if (parts.length === 2) return { firstName: parts[0], lastName: parts[1] };
  return { firstName: parts.slice(0, -2).join(' '), lastName: parts.slice(-2).join(' ') };
}

function EditProfileModal({
  initialName, initialPhone, initialNickname, initialBirthDate, initialGender, onClose,
}: {
  initialName:      string;
  initialPhone:     string;
  initialNickname:  string;
  initialBirthDate: string;
  initialGender:    Gender | undefined;
  onClose:          () => void;
}) {
  const C = useScreenColors();
  const styles = makeStyles(C);
  const updateProfile = useAuthStore((s) => s.updateProfile);

  const { firstName: initialFirstName, lastName: initialLastName } = splitFullName(initialName);
  const [firstName, setFirstName] = useState(initialFirstName);
  const [lastName,  setLastName]  = useState(initialLastName);
  const [phone,     setPhone]     = useState(initialPhone);
  const [nickname,  setNickname]  = useState(initialNickname);
  const [birthDate, setBirthDate] = useState(initialBirthDate);
  const [gender,    setGender]    = useState<Gender | undefined>(initialGender);
  const [saving, setSaving] = useState(false);

  function handleSavePress() {
    if (!firstName.trim() || !phone.trim()) {
      Alert.alert('Faltan datos', 'Completá tu nombre y tu número de teléfono.');
      return;
    }
    Alert.alert('Confirmar cambios', '¿Guardar los cambios en tus datos personales?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Confirmar', onPress: doSave },
    ]);
  }

  async function doSave() {
    setSaving(true);
    try {
      const fullName = [firstName.trim(), lastName.trim()].filter(Boolean).join(' ');
      await updateProfile({
        name: fullName,
        phone: phone.trim(),
        nickname: nickname.trim(),
        birthDate: birthDate.trim(),
        gender,
      });
      onClose();
    } catch (error: any) {
      console.error('[AccountScreen] updateProfile error:', error?.code, error?.message);
      Alert.alert('Error', 'No se pudieron guardar los cambios. Intentá de nuevo.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.modalScrollCard}
          contentContainerStyle={styles.modalScrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Editar datos personales</Text>
            <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
              <Ionicons name="close" size={22} color={C.sub} />
            </TouchableOpacity>
          </View>

          <View style={styles.fieldRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.modalLabel}>Nombre</Text>
              <TextInput
                style={styles.modalInput}
                value={firstName}
                onChangeText={setFirstName}
                placeholder="Nombre"
                placeholderTextColor={C.sub}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.modalLabel}>Apellido</Text>
              <TextInput
                style={styles.modalInput}
                value={lastName}
                onChangeText={setLastName}
                placeholder="Apellido"
                placeholderTextColor={C.sub}
              />
            </View>
          </View>

          <Text style={styles.modalLabel}>Apodo</Text>
          <TextInput
            style={styles.modalInput}
            value={nickname}
            onChangeText={setNickname}
            placeholder="Cómo te gusta que te digan"
            placeholderTextColor={C.sub}
          />

          <Text style={styles.modalLabel}>Teléfono</Text>
          <TextInput
            style={styles.modalInput}
            value={phone}
            onChangeText={setPhone}
            placeholder="Tu número de teléfono"
            placeholderTextColor={C.sub}
            keyboardType="phone-pad"
          />

          <Text style={styles.modalLabel}>Fecha de nacimiento</Text>
          <TextInput
            style={styles.modalInput}
            value={birthDate}
            onChangeText={setBirthDate}
            placeholder="DD/MM/AAAA"
            placeholderTextColor={C.sub}
            keyboardType="numbers-and-punctuation"
          />

          <Text style={styles.modalLabel}>Género</Text>
          <View style={styles.chipRow}>
            {GENDER_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[styles.genderChip, gender === opt.value && styles.genderChipActive]}
                activeOpacity={0.8}
                onPress={() => setGender(opt.value)}
              >
                <Text style={[styles.genderChipText, gender === opt.value && styles.genderChipTextActive]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.modalSaveBtn, saving && { opacity: 0.6 }]}
            activeOpacity={0.85}
            onPress={handleSavePress}
            disabled={saving}
          >
            <Text style={styles.modalSaveBtnText}>{saving ? 'Guardando…' : 'Guardar'}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Cambiar correo electrónico ────────────────────────────────────────────────

function ChangeEmailModal({ currentEmail, onClose }: { currentEmail: string; onClose: () => void }) {
  const C = useScreenColors();
  const styles = makeStyles(C);
  const changeEmail = useAuthStore((s) => s.changeEmail);

  const [newEmail, setNewEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    const trimmedEmail = newEmail.trim();
    if (!trimmedEmail || !password) {
      Alert.alert('Faltan datos', 'Ingresá el nuevo correo y tu contraseña actual.');
      return;
    }
    if (trimmedEmail.toLowerCase() === currentEmail.toLowerCase()) {
      Alert.alert('Correo igual', 'Ese ya es tu correo actual.');
      return;
    }
    setSaving(true);
    try {
      await changeEmail(trimmedEmail, password);
      Alert.alert(
        'Revisá tu correo',
        `Te enviamos un enlace de confirmación a ${trimmedEmail}. Tu correo va a cambiar recién cuando lo confirmes.`
      );
      onClose();
    } catch (error: any) {
      const code = error?.code as string | undefined;
      const message =
        code === 'auth/wrong-password' || code === 'auth/invalid-credential'
          ? 'La contraseña actual no es correcta.'
          : code === 'auth/email-already-in-use'
          ? 'Ese correo ya está en uso por otra cuenta.'
          : code === 'auth/invalid-email'
          ? 'El correo ingresado no es válido.'
          : 'No se pudo actualizar el correo. Intentá de nuevo.';
      Alert.alert('Error', message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Cambiar correo electrónico</Text>
            <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
              <Ionicons name="close" size={22} color={C.sub} />
            </TouchableOpacity>
          </View>

          <Text style={styles.modalHelper}>Correo actual: {currentEmail}</Text>

          <Text style={styles.modalLabel}>Nuevo correo</Text>
          <TextInput
            style={styles.modalInput}
            value={newEmail}
            onChangeText={setNewEmail}
            placeholder="tunuevo@correo.com"
            placeholderTextColor={C.sub}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.modalLabel}>Contraseña actual</Text>
          <View style={styles.modalPasswordWrapper}>
            <TextInput
              style={styles.modalPasswordInput}
              value={password}
              onChangeText={setPassword}
              placeholder="Tu contraseña actual"
              placeholderTextColor={C.sub}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity style={styles.modalEyeBtn} activeOpacity={0.7} onPress={() => setShowPassword((v) => !v)}>
              <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={C.sub} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.modalSaveBtn, saving && { opacity: 0.6 }]}
            activeOpacity={0.85}
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={styles.modalSaveBtnText}>{saving ? 'Guardando…' : 'Guardar'}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Cambiar contraseña ─────────────────────────────────────────────────────────

function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const C = useScreenColors();
  const styles = makeStyles(C);
  const changePassword = useAuthStore((s) => s.changePassword);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword,     setNewPassword]     = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew,     setShowNew]     = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Faltan datos', 'Completá los tres campos.');
      return;
    }
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      Alert.alert('Contraseña muy corta', `La nueva contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`);
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('No coinciden', 'La nueva contraseña y su confirmación no son iguales.');
      return;
    }
    setSaving(true);
    try {
      await changePassword(currentPassword, newPassword);
      Alert.alert('Listo', 'Tu contraseña se actualizó correctamente.');
      onClose();
    } catch (error: any) {
      const code = error?.code as string | undefined;
      const message =
        code === 'auth/wrong-password' || code === 'auth/invalid-credential'
          ? 'La contraseña actual no es correcta.'
          : code === 'auth/weak-password'
          ? 'La nueva contraseña es muy débil.'
          : 'No se pudo actualizar la contraseña. Intentá de nuevo.';
      Alert.alert('Error', message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Cambiar contraseña</Text>
            <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
              <Ionicons name="close" size={22} color={C.sub} />
            </TouchableOpacity>
          </View>

          <Text style={styles.modalLabel}>Contraseña actual</Text>
          <View style={styles.modalPasswordWrapper}>
            <TextInput
              style={styles.modalPasswordInput}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="Tu contraseña actual"
              placeholderTextColor={C.sub}
              secureTextEntry={!showCurrent}
            />
            <TouchableOpacity style={styles.modalEyeBtn} activeOpacity={0.7} onPress={() => setShowCurrent((v) => !v)}>
              <Ionicons name={showCurrent ? 'eye-off-outline' : 'eye-outline'} size={20} color={C.sub} />
            </TouchableOpacity>
          </View>

          <Text style={styles.modalLabel}>Nueva contraseña</Text>
          <View style={styles.modalPasswordWrapper}>
            <TextInput
              style={styles.modalPasswordInput}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Mínimo 6 caracteres"
              placeholderTextColor={C.sub}
              secureTextEntry={!showNew}
            />
            <TouchableOpacity style={styles.modalEyeBtn} activeOpacity={0.7} onPress={() => setShowNew((v) => !v)}>
              <Ionicons name={showNew ? 'eye-off-outline' : 'eye-outline'} size={20} color={C.sub} />
            </TouchableOpacity>
          </View>

          <Text style={styles.modalLabel}>Confirmar nueva contraseña</Text>
          <TextInput
            style={styles.modalInput}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Repetí la nueva contraseña"
            placeholderTextColor={C.sub}
            secureTextEntry={!showNew}
          />

          <TouchableOpacity
            style={[styles.modalSaveBtn, saving && { opacity: 0.6 }]}
            activeOpacity={0.85}
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={styles.modalSaveBtnText}>{saving ? 'Guardando…' : 'Guardar'}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const makeStyles = (C: ScreenColors) => StyleSheet.create({
  // Coincide con el primer color del degradado del header, no con C.primary
  // a secas — si no, en oscuro queda una franja más clara detrás de la
  // barra de estado.
  safe: { flex: 1, backgroundColor: C.headerGradient[0] },

  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 56,
    backgroundColor: C.primary,
    alignItems: 'center',
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: C.white, letterSpacing: -0.3 },

  scroll: { backgroundColor: C.bg },
  scrollContent: { paddingHorizontal: 18, paddingBottom: 130, gap: 18 },

  // Perfil — flota sobre el borde inferior del header (mismo recurso que la
  // búsqueda de Inicio) en vez de quedar como una tarjeta más en la lista.
  profileCard: {
    backgroundColor: C.surface,
    borderRadius: 22,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: -40,
    ...cardShadow(C),
  },
  avatarRing: {
    borderRadius: 999,
    borderWidth: 2,
    borderColor: C.chipBg,
    padding: 3,
  },
  avatarEditBadge: {
    position: 'absolute', right: -2, bottom: -2, width: 22, height: 22, borderRadius: 11,
    backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: C.surface,
  },
  profileInfo: { flex: 1, gap: 5 },
  profileName: { fontSize: 18, fontWeight: '800', color: C.text, letterSpacing: -0.3 },
  profileEmailRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  profileEmail: { fontSize: 13, color: C.sub, flexShrink: 1 },
  profileBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    backgroundColor: C.chipBg,
    borderRadius: 10,
    paddingHorizontal: 9,
    paddingVertical: 4,
    marginTop: 2,
  },
  profileBadgeText: { fontSize: 11.5, fontWeight: '700', color: C.primary },

  // Sección — etiqueta discreta en mayúsculas, en vez de título + ícono
  // repetido en cada bloque.
  eyebrow: {
    fontSize: 12.5,
    fontWeight: '700',
    color: C.sub,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: -6,
  },
  sectionCard: {
    backgroundColor: C.surface,
    borderRadius: 18,
    padding: 14,
    ...cardShadow(C),
  },

  // Empty state pedidos
  emptyOrders: {
    backgroundColor: C.surface,
    borderRadius: 16,
    paddingVertical: 28,
    alignItems: 'center',
    gap: 10,
  },
  emptyOrdersText: {
    fontSize: 13,
    color: C.sub,
    textAlign: 'center',
  },

  // Tarjeta pedido
  orderCard: {
    backgroundColor: C.surface,
    borderRadius: 18,
    padding: 16,
    gap: 12,
    ...cardShadow(C),
  },
  orderTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  orderIdRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  orderIdLabel: { fontSize: 13, color: C.sub },
  orderId: { fontSize: 15, fontWeight: '700', color: C.text },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusChipText: { fontSize: 13, fontWeight: '600' },
  orderDivider: { height: 1, backgroundColor: C.divider },
  orderBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  orderDateRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  orderDate: { fontSize: 13, color: C.sub },
  orderTotal: { fontSize: 18, fontWeight: '800', color: C.primary },
  orderActionsRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  reorderBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 10, borderRadius: 10,
    backgroundColor: C.chipBg,
  },
  reorderBtnText: { fontSize: 13, fontWeight: '700', color: C.primary },
  chatBtn: {
    width: 40, alignItems: 'center', justifyContent: 'center',
    borderRadius: 10, backgroundColor: C.chipBg,
  },

  // Vista invitado
  guestContainer: {
    flex: 1,
    backgroundColor: C.bg,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  guestIconWrapper: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  guestTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: C.text,
    textAlign: 'center',
    letterSpacing: -0.4,
  },
  guestSubtitle: {
    fontSize: 14,
    color: C.sub,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 8,
  },
  guestPrimaryBtn: {
    backgroundColor: C.primary,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 48,
    alignItems: 'center',
    width: '100%',
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  guestPrimaryBtnText: {
    color: C.white,
    fontSize: 16,
    fontWeight: '700',
  },
  guestSecondaryBtn: {
    paddingVertical: 12,
    alignItems: 'center',
    width: '100%',
  },
  guestSecondaryBtnText: {
    fontSize: 15,
    color: C.primary,
    fontWeight: '600',
  },
  operativeLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
    paddingVertical: 8,
  },
  operativeLinkText: {
    fontSize: 13,
    color: C.sub,
    fontWeight: '600',
  },

  // Menú
  menuCard: {
    backgroundColor: C.surface,
    borderRadius: 18,
    overflow: 'hidden',
    ...cardShadow(C),
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 15,
    gap: 14,
  },
  menuIconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: C.text,
  },
  menuDivider: {
    height: 1,
    backgroundColor: C.divider,
    marginLeft: 68,
  },

  // Cerrar sesión — separado del resto, no es una opción más de la lista.
  logoutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: C.surface,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 15,
    borderWidth: 1,
    borderColor: '#F5C6C0',
  },
  logoutLabel: { fontSize: 15, fontWeight: '700', color: '#C62828' },

  // Modal editar datos personales
  modalOverlay: { flex: 1, backgroundColor: 'rgba(10,10,30,0.55)', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: C.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, paddingBottom: 36,
  },
  modalScrollCard: {
    backgroundColor: C.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    maxHeight: '85%',
  },
  modalScrollContent: { padding: 20, paddingBottom: 36 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  modalTitle: { fontSize: 17, fontWeight: '800', color: C.text },
  modalHelper: { fontSize: 13, color: C.sub, marginBottom: 4 },
  modalLabel: { fontSize: 12, fontWeight: '700', color: C.sub, marginBottom: 6, marginTop: 14, textTransform: 'uppercase', letterSpacing: 0.4 },
  modalInput: {
    backgroundColor: C.bg, borderRadius: 10, borderWidth: 1.5, borderColor: C.divider,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: C.text,
  },
  modalPasswordWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.bg, borderRadius: 10, borderWidth: 1.5, borderColor: C.divider,
    paddingHorizontal: 14,
  },
  modalPasswordInput: { flex: 1, paddingVertical: 12, fontSize: 14, color: C.text },
  modalEyeBtn: { paddingLeft: 10, paddingVertical: 6 },
  fieldRow: { flexDirection: 'row', gap: 12 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  genderChip: {
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999,
    backgroundColor: C.bg, borderWidth: 1.5, borderColor: C.divider,
  },
  genderChipActive: { backgroundColor: C.chipBg, borderColor: C.primary },
  genderChipText: { fontSize: 13, fontWeight: '600', color: C.sub },
  genderChipTextActive: { color: C.primary },
  modalSaveBtn: { marginTop: 24, backgroundColor: C.primary, borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
  modalSaveBtnText: { color: C.white, fontSize: 15, fontWeight: '700' },
});
