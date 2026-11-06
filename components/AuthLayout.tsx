import { ReactNode, Ref, useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Animated,
  ScrollView,
  ActivityIndicator,
  StatusBar,
  TextInput as RNTextInput,
  TextInputProps,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Text from './Text';
import TextInput from './TextInput';
import HiGoLogo, { HiGoMark } from './HiGoLogo';
import { useThemeColors } from '../theme/useThemeColors';
import { ThemeColors, darkColors } from '../theme/colors';
import { RADIUS, SPACING, floatingShadow } from '../theme/elevation';

// ─── Pantallas de acceso (inicio de sesión, crear cuenta) ─────────────────────
// Arriba, la parte de marca: morado fijo en ambos temas, el higo como marca de
// agua y un título sobrio (etiqueta en mayúsculas + título + bajada). Abajo,
// una hoja que sigue el tema activo con el formulario.

// Morados con luz (no el morado plano y oscuro): el degradado va de un
// violeta vivo a uno profundo, y dos brillos suaves (lila y rosado) le dan
// profundidad sin salirse del tono de marca.
export const HERO_GRADIENT: [string, string, string] = ['#7B4BF5', '#5A2BD6', '#3D1F8B'];
const BUTTON_GRADIENT: [string, string] = ['#8A5CFF', '#5B2BD9'];
const BRAND      = '#5B2BD9';
// En modo oscuro la hoja usa un morado muy profundo en vez del casi negro
// del fondo general, para que siga el tono del encabezado.
const DARK_SHEET = '#1A1330';

export function AuthScreen({
  eyebrow, title, subtitle, onBack, children,
}: {
  eyebrow:  string;
  title:    string;
  subtitle: string;
  onBack?:  () => void;
  children: ReactNode;
}) {
  const C = useThemeColors();
  const s = makeStyles(C);
  const insets = useSafeAreaInsets();

  const fade = useRef(new Animated.Value(0)).current;
  const rise = useRef(new Animated.Value(28)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(rise, { toValue: 0, friction: 9, tension: 45, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <LinearGradient
          colors={HERO_GRADIENT}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={[s.hero, { paddingTop: insets.top + SPACING.sm }]}
        >
          <View style={s.glowLilac} pointerEvents="none" />
          <View style={s.glowPink} pointerEvents="none" />
          {/* Marca de agua: el higo grande, cortado por el borde derecho */}
          <View style={s.watermark} pointerEvents="none">
            <HiGoMark size={300} color="#FFFFFF" />
          </View>

          <View style={s.topBar}>
            {onBack && (
              <TouchableOpacity
                style={s.backBtn}
                activeOpacity={0.7}
                onPress={onBack}
                hitSlop={8}
                accessibilityLabel="Volver"
              >
                <Ionicons name="chevron-back" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            )}
          </View>

          <Animated.View style={[s.heroText, { opacity: fade, transform: [{ translateY: rise }] }]}>
            {/* El logo firma la pantalla, alineado con el texto (no centrado arriba) */}
            <View style={s.brand}>
              <HiGoLogo size={34} color="#FFFFFF" />
            </View>
            <View style={s.eyebrowRow}>
              <View style={s.eyebrowLine} />
              <Text style={s.eyebrow}>{eyebrow}</Text>
            </View>
            <Text style={s.heroTitle}>{title}</Text>
            <Text style={s.heroSubtitle}>{subtitle}</Text>
          </Animated.View>
        </LinearGradient>

        <Animated.View
          style={[
            s.sheet,
            { paddingBottom: insets.bottom + SPACING.xl, opacity: fade, transform: [{ translateY: rise }] },
          ]}
        >
          <View style={s.sheetHandle} />
          {children}
          <View style={{ flex: 1 }} />
          <View style={s.footer}>
            <Ionicons name="storefront-outline" size={13} color={C.textFaint} />
            <Text style={s.footerText}>Mercado Mayorista del Sur · Quito</Text>
          </View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── Campo con etiqueta ───────────────────────────────────────────────────────
// Etiqueta arriba (no solo placeholder: no desaparece al escribir) y borde de
// marca mientras el campo tiene el foco. `secure` agrega el botón del ojo.

type AuthFieldProps = TextInputProps & {
  label:        string;
  icon:         keyof typeof Ionicons.glyphMap;
  labelAction?: { text: string; onPress: () => void };
  secure?:      boolean;
  hint?:        string;
  ref?:         Ref<RNTextInput>;
};

export function AuthField({ label, icon, labelAction, secure, hint, ref, ...inputProps }: AuthFieldProps) {
  const C = useThemeColors();
  const s = makeStyles(C);
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(false);

  return (
    <View style={s.field}>
      <View style={s.fieldLabelRow}>
        <Text style={s.fieldLabel}>{label}</Text>
        {labelAction && (
          <Pressable hitSlop={8} onPress={labelAction.onPress} style={({ pressed }) => pressed && { opacity: 0.6 }}>
            <Text style={s.fieldLabelAction}>{labelAction.text}</Text>
          </Pressable>
        )}
      </View>
      <View style={[s.inputBox, focused && s.inputBoxFocused]}>
        <Ionicons name={icon} size={19} color={focused ? C.primary : C.textFaint} />
        <TextInput
          ref={ref}
          style={s.input}
          placeholderTextColor={C.textFaint}
          secureTextEntry={secure && !visible}
          {...inputProps}
          onFocus={(e) => { setFocused(true); inputProps.onFocus?.(e); }}
          onBlur={(e) => { setFocused(false); inputProps.onBlur?.(e); }}
        />
        {secure && (
          <TouchableOpacity
            style={s.eyeBtn}
            activeOpacity={0.7}
            onPress={() => setVisible((v) => !v)}
            accessibilityLabel={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          >
            <Ionicons name={visible ? 'eye-off-outline' : 'eye-outline'} size={20} color={C.textFaint} />
          </TouchableOpacity>
        )}
      </View>
      {hint && <Text style={s.hint}>{hint}</Text>}
    </View>
  );
}

// ─── Botones y separador ──────────────────────────────────────────────────────

export function AuthPrimaryButton({
  label, loading, onPress,
}: {
  label: string; loading: boolean; onPress: () => void;
}) {
  const C = useThemeColors();
  const s = makeStyles(C);
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      disabled={loading}
      style={[s.primaryBtnShadow, loading && { opacity: 0.75 }]}
    >
      <LinearGradient colors={BUTTON_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.primaryBtn}>
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <>
            <Text style={s.primaryBtnText}>{label}</Text>
            <View style={s.primaryBtnArrow}>
              <Ionicons name="arrow-forward" size={16} color={BRAND} />
            </View>
          </>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}

export function AuthSecondaryButton({
  label, icon, onPress,
}: {
  label: string; icon: keyof typeof Ionicons.glyphMap; onPress: () => void;
}) {
  const C = useThemeColors();
  const s = makeStyles(C);
  return (
    <TouchableOpacity style={s.secondaryBtn} activeOpacity={0.8} onPress={onPress}>
      <Ionicons name={icon} size={18} color={C.primary} />
      <Text style={s.secondaryBtnText}>{label}</Text>
    </TouchableOpacity>
  );
}

export function AuthDivider({ text }: { text: string }) {
  const C = useThemeColors();
  const s = makeStyles(C);
  return (
    <View style={s.dividerRow}>
      <View style={s.dividerLine} />
      <Text style={s.dividerText}>{text}</Text>
      <View style={s.dividerLine} />
    </View>
  );
}

export function AuthTextLink({
  label, icon, onPress,
}: {
  label: string; icon?: keyof typeof Ionicons.glyphMap; onPress: () => void;
}) {
  const C = useThemeColors();
  const s = makeStyles(C);
  return (
    <Pressable style={({ pressed }) => [s.textLink, pressed && { opacity: 0.6 }]} onPress={onPress}>
      {icon && <Ionicons name={icon} size={16} color={C.primary} />}
      <Text style={s.textLinkLabel}>{label}</Text>
    </Pressable>
  );
}

export function AuthNotice({ text }: { text: string }) {
  const C = useThemeColors();
  const s = makeStyles(C);
  return (
    <View style={s.notice}>
      <Ionicons name="checkmark-circle" size={18} color={C.success} />
      <Text style={s.noticeText}>{text}</Text>
    </View>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const makeStyles = (C: ThemeColors) => StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: HERO_GRADIENT[0],
  },

  // Parte de marca
  hero: {
    paddingHorizontal: SPACING.xl + 4,
    paddingBottom: 60,
    overflow: 'hidden',
  },
  glowLilac: {
    position: 'absolute',
    top: -80,
    right: -60,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(196,165,255,0.28)',
  },
  glowPink: {
    position: 'absolute',
    bottom: -90,
    left: -70,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(244,114,182,0.16)',
  },
  watermark: {
    position: 'absolute',
    right: -120,
    top: 40,
    opacity: 0.05,
    transform: [{ rotate: '-12deg' }],
  },
  topBar: {
    height: 36,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 28,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  heroText: {
    gap: 10,
  },
  brand: {
    alignSelf: 'flex-start',
    marginBottom: 18,
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  eyebrowLine: {
    width: 22,
    height: 1.5,
    borderRadius: 1,
    backgroundColor: '#E9D5FF',
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 2.4,
    textTransform: 'uppercase',
    color: '#E9D5FF',
  },
  heroTitle: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  heroSubtitle: {
    fontSize: 14.5,
    lineHeight: 21,
    color: 'rgba(255,255,255,0.8)',
  },

  // Hoja
  sheet: {
    flex: 1,
    marginTop: -28,
    backgroundColor: C === darkColors ? DARK_SHEET : C.background,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: SPACING.xl + 4,
    paddingTop: SPACING.md,
    gap: SPACING.lg,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: C.border,
    marginBottom: SPACING.sm,
  },

  // Campo
  field: {
    gap: 7,
  },
  fieldLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fieldLabel: {
    fontSize: 13.5,
    fontWeight: '600',
    color: C.text,
  },
  fieldLabelAction: {
    fontSize: 13,
    fontWeight: '600',
    color: C.primary,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm + 2,
    height: 56,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: C.border,
    backgroundColor: C.surface,
  },
  inputBoxFocused: {
    borderColor: C.primary,
    backgroundColor: C.primaryFaint,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    color: C.text,
  },
  eyeBtn: {
    paddingLeft: SPACING.xs,
    paddingVertical: 8,
  },
  hint: {
    fontSize: 12,
    color: C.textSoft,
  },

  // Botones
  primaryBtnShadow: {
    marginTop: SPACING.xs,
    borderRadius: RADIUS.md,
    ...floatingShadow(C, BRAND),
  },
  primaryBtn: {
    height: 56,
    borderRadius: RADIUS.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 16.5,
    fontWeight: '700',
  },
  primaryBtnArrow: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtn: {
    height: 52,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: C.border,
    backgroundColor: C.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  secondaryBtnText: {
    color: C.primary,
    fontSize: 15.5,
    fontWeight: '700',
  },
  textLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: SPACING.sm,
  },
  textLinkLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: C.primary,
  },

  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginTop: SPACING.sm,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: C.border,
  },
  dividerText: {
    fontSize: 13,
    color: C.textSoft,
  },

  notice: {
    flexDirection: 'row',
    gap: SPACING.sm,
    padding: SPACING.md,
    borderRadius: RADIUS.sm,
    backgroundColor: C.successFaint,
  },
  noticeText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    color: C.text,
  },

  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingTop: SPACING.lg,
  },
  footerText: {
    fontSize: 12,
    color: C.textFaint,
  },
});
