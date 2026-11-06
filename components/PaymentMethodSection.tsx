import { View, TouchableOpacity, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Text from './Text';
import TextInput from './TextInput';
import { useThemeColors } from '../theme/useThemeColors';
import { ThemeColors } from '../theme/colors';
import { RADIUS, SPACING } from '../theme/elevation';
import { BankDetails } from '../store/paymentConfigStore';
import { PaymentMethod, CASH_LIMIT } from '../store/ordersStore';

// Sección "Forma de pago" del checkout: transferencia (con los datos de la
// cuenta de HiGo y el comprobante) o efectivo contra entrega (hasta
// CASH_LIMIT). Pensada para sumar más métodos (tarjeta) agregando opciones.

export default function PaymentMethodSection({
  total,
  method,
  onMethodChange,
  bank,
  bankLoaded,
  receiptUri,
  onPickReceipt,
  paymentRef,
  onPaymentRef,
}: {
  total:          number;
  method:         PaymentMethod;
  onMethodChange: (m: PaymentMethod) => void;
  bank:           BankDetails | null;
  bankLoaded:     boolean;
  receiptUri:     string | null;
  onPickReceipt:  () => void;
  paymentRef:     string;
  onPaymentRef:   (v: string) => void;
}) {
  const C = useThemeColors();
  const s = makeStyles(C);
  const cashAllowed = total <= CASH_LIMIT;

  return (
    <View style={s.wrap}>
      <Option
        C={C}
        active={method === 'transferencia'}
        icon="swap-horizontal-outline"
        title="Transferencia bancaria"
        subtitle="Subes el comprobante y lo confirmamos"
        onPress={() => onMethodChange('transferencia')}
      />

      {method === 'transferencia' && (
        <View style={s.transferBox}>
          {!bankLoaded ? (
            <ActivityIndicator color={C.primary} />
          ) : bank ? (
            <>
              <Text style={s.transferHint}>Transfiere el total a esta cuenta:</Text>
              <BankRow C={C} label="Banco" value={bank.bankName} />
              <BankRow C={C} label="Tipo" value={bank.accountType} />
              <BankRow C={C} label="Número" value={bank.accountNumber} strong />
              <BankRow C={C} label="Titular" value={bank.holderName} />
              <BankRow C={C} label="RUC / Cédula" value={bank.holderId} />
              <BankRow C={C} label="Monto" value={`$${total.toFixed(2)}`} strong />

              {/* El número de comprobante es obligatorio: con él se verifica
                  contra el estado de cuenta aunque la foto no se pueda subir. */}
              <Text style={s.refLabel}>Número de comprobante</Text>
              <TextInput
                style={s.refInput}
                placeholder="Ej: 123456789"
                placeholderTextColor={C.textFaint}
                value={paymentRef}
                onChangeText={onPaymentRef}
                autoCapitalize="characters"
                maxLength={40}
              />

              <TouchableOpacity
                style={[s.receiptBtn, receiptUri && s.receiptBtnDone]}
                activeOpacity={0.8}
                onPress={onPickReceipt}
              >
                {receiptUri ? (
                  <Image source={{ uri: receiptUri }} style={s.receiptThumb} />
                ) : (
                  <View style={s.receiptIcon}>
                    <Ionicons name="receipt-outline" size={20} color={C.primary} />
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={s.receiptTitle}>Foto del comprobante (opcional)</Text>
                  <Text style={[s.receiptSub, receiptUri && { color: C.success }]}>
                    {receiptUri ? 'Cargada · toca para cambiar' : 'Ayuda a confirmarlo más rápido'}
                  </Text>
                </View>
                <Ionicons
                  name={receiptUri ? 'checkmark-circle' : 'cloud-upload-outline'}
                  size={22}
                  color={receiptUri ? C.success : C.textFaint}
                />
              </TouchableOpacity>

              <View style={s.infoRow}>
                <Ionicons name="time-outline" size={14} color={C.textSoft} />
                <Text style={s.infoText}>
                  Tu pedido empieza a prepararse cuando confirmemos el pago.
                </Text>
              </View>
            </>
          ) : (
            <View style={s.infoRow}>
              <Ionicons name="alert-circle-outline" size={16} color={C.danger} />
              <Text style={s.infoText}>
                Todavía no hay una cuenta bancaria configurada. Elige otra forma de pago o escríbenos por el chat.
              </Text>
            </View>
          )}
        </View>
      )}

      <Option
        C={C}
        active={method === 'efectivo'}
        disabled={!cashAllowed}
        icon="cash-outline"
        title="Efectivo contra entrega"
        subtitle={cashAllowed
          ? 'Pagas al transportista cuando recibes'
          : `Solo para pedidos de hasta $${CASH_LIMIT}`}
        onPress={() => cashAllowed && onMethodChange('efectivo')}
      />

      {method === 'efectivo' && cashAllowed && (
        <View style={s.infoRow}>
          <Ionicons name="information-circle-outline" size={14} color={C.textSoft} />
          <Text style={s.infoText}>
            Ten listos ${total.toFixed(2)}. Si puedes, con el monto justo.
          </Text>
        </View>
      )}
    </View>
  );
}

function Option({
  C, active, disabled, icon, title, subtitle, onPress,
}: {
  C: ThemeColors;
  active: boolean;
  disabled?: boolean;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  const s = makeStyles(C);
  return (
    <TouchableOpacity
      style={[s.option, active && s.optionActive, disabled && { opacity: 0.5 }]}
      activeOpacity={0.85}
      onPress={onPress}
      disabled={disabled}
    >
      <View style={[s.radio, active && s.radioActive]}>
        {active && <View style={s.radioDot} />}
      </View>
      <View style={[s.optionIcon, active && { backgroundColor: C.primary }]}>
        <Ionicons name={icon} size={18} color={active ? '#FFFFFF' : C.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[s.optionTitle, active && { color: C.primary }]}>{title}</Text>
        <Text style={s.optionSub}>{subtitle}</Text>
      </View>
    </TouchableOpacity>
  );
}

function BankRow({ C, label, value, strong }: { C: ThemeColors; label: string; value: string; strong?: boolean }) {
  const s = makeStyles(C);
  return (
    <View style={s.bankRow}>
      <Text style={s.bankLabel}>{label}</Text>
      <Text style={[s.bankValue, strong && s.bankValueStrong]} selectable>{value || '—'}</Text>
    </View>
  );
}

const makeStyles = (C: ThemeColors) => StyleSheet.create({
  wrap: { gap: SPACING.md },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    padding: SPACING.md + 2,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: C.border,
    backgroundColor: C.surface,
  },
  optionActive: {
    borderColor: C.primary,
    backgroundColor: C.primaryFaint,
  },
  radio: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 2, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center',
  },
  radioActive: { borderColor: C.primary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: C.primary },
  optionIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: C.primaryFaint,
    alignItems: 'center', justifyContent: 'center',
  },
  optionTitle: { fontSize: 15, fontWeight: '700', color: C.text },
  optionSub:   { fontSize: 12.5, color: C.textSoft, marginTop: 1 },

  transferBox: {
    gap: 6,
    padding: SPACING.md + 2,
    borderRadius: RADIUS.md,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
  },
  transferHint: { fontSize: 13, color: C.textSoft, marginBottom: 4 },
  bankRow: { flexDirection: 'row', justifyContent: 'space-between', gap: SPACING.md },
  bankLabel: { fontSize: 13, color: C.textSoft },
  bankValue: { fontSize: 13.5, color: C.text, fontWeight: '500', flexShrink: 1, textAlign: 'right' },
  bankValueStrong: { fontWeight: '800', color: C.primary },

  refLabel: { fontSize: 13, fontWeight: '600', color: C.text, marginTop: SPACING.sm },
  refInput: {
    height: 48,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.sm,
    borderWidth: 1.5,
    borderColor: C.border,
    backgroundColor: C.background,
    fontSize: 15,
    color: C.text,
  },
  receiptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginTop: SPACING.sm,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: C.border,
  },
  receiptBtnDone: { borderStyle: 'solid', borderColor: C.success },
  receiptIcon: {
    width: 42, height: 42, borderRadius: RADIUS.sm,
    backgroundColor: C.primaryFaint,
    alignItems: 'center', justifyContent: 'center',
  },
  receiptThumb: { width: 42, height: 42, borderRadius: RADIUS.sm },
  receiptTitle: { fontSize: 14, fontWeight: '600', color: C.text },
  receiptSub:   { fontSize: 12, color: C.textSoft, marginTop: 1 },

  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginTop: 4 },
  infoText: { flex: 1, fontSize: 12.5, lineHeight: 18, color: C.textSoft },
});
