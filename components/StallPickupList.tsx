import { ReactNode, useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Text from './Text';
import { useThemeColors } from '../theme/useThemeColors';
import { ThemeColors } from '../theme/colors';
import {
  useOrderStallTickets,
  marcarRetirado,
  StallTicket,
  StallTicketStatus,
} from '../store/stallTicketsStore';

// Recorrido por los puestos del mercado de un pedido: qué retirar en cada uno
// y en qué estado está. Lo usan cochero (ruta programada) y transportista
// (ruta directa). Con `canPick`, cada puesto trae su botón "Retirado".
// `renderEmpty` se muestra si el pedido no tiene tickets (pedidos viejos).

const ACCENT = '#3D1F8B';

const STATUS_META: Record<StallTicketStatus, { label: string; icon: keyof typeof Ionicons.glyphMap }> = {
  pendiente: { label: 'Preparando', icon: 'time-outline' },
  listo:     { label: 'Listo',      icon: 'checkmark-circle-outline' },
  retirado:  { label: 'Retirado',   icon: 'checkmark-done' },
  cancelado: { label: 'Cancelado',  icon: 'close-circle-outline' },
};

export default function StallPickupList({
  orderId,
  canPick,
  renderEmpty,
}: {
  orderId:      string;
  canPick:      boolean;
  renderEmpty?: () => ReactNode;
}) {
  const T = useThemeColors();
  const s = makeStyles(T);
  const { tickets, loaded } = useOrderStallTickets(orderId);

  if (!loaded) return <ActivityIndicator color={ACCENT} style={{ marginVertical: 12 }} />;
  if (tickets.length === 0) return <>{renderEmpty?.()}</>;

  const retirados = tickets.filter((t) => t.status === 'retirado').length;

  return (
    <View>
      <View style={s.headerRow}>
        <Text style={s.title}>Puestos a recorrer</Text>
        <Text style={s.progress}>{retirados}/{tickets.length} retirados</Text>
      </View>
      {tickets.map((t) => (
        <StallRow key={t.id} ticket={t} canPick={canPick} />
      ))}
    </View>
  );
}

function StallRow({ ticket, canPick }: { ticket: StallTicket; canPick: boolean }) {
  const T = useThemeColors();
  const s = makeStyles(T);
  const [busy, setBusy] = useState(false);

  const meta = STATUS_META[ticket.status];
  const color =
    ticket.status === 'retirado' ? T.success :
    ticket.status === 'listo'    ? ACCENT    : T.warning;

  const place = ticket.comercianteUid
    ? `Puesto ${ticket.stallNumber || '—'} · ${ticket.comercianteName}`
    : 'Sin puesto asignado';

  function handleRetirar() {
    Alert.alert(
      'Confirmar retiro',
      `¿Ya retiraste los productos de ${place}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sí, retirado',
          onPress: async () => {
            setBusy(true);
            try {
              await marcarRetirado(ticket);
            } catch (err) {
              console.error('[StallPickupList] retirar:', err);
              Alert.alert('Error', 'No se pudo marcar como retirado. Intentá de nuevo.');
            } finally {
              setBusy(false);
            }
          },
        },
      ],
    );
  }

  return (
    <View style={[s.stall, ticket.status === 'retirado' && s.stallDone]}>
      <View style={s.stallTop}>
        <Ionicons
          name={ticket.comercianteUid ? 'storefront-outline' : 'help-circle-outline'}
          size={16}
          color={ACCENT}
        />
        <Text style={s.stallName} numberOfLines={1}>{place}</Text>
        <View style={[s.pill, { borderColor: color, backgroundColor: color + '1A' }]}>
          <Ionicons name={meta.icon} size={11} color={color} />
          <Text style={[s.pillText, { color }]}>{meta.label}</Text>
        </View>
      </View>

      {ticket.items.map((it, i) => (
        <View key={i} style={s.itemRow}>
          <Text style={s.itemEmoji}>{it.emoji}</Text>
          <Text style={s.itemName} numberOfLines={1}>{it.productName}</Text>
          <Text style={s.itemQty}>{it.quantity} {it.presentationLabel}</Text>
        </View>
      ))}

      {!ticket.comercianteUid && ticket.status !== 'retirado' && (
        <Text style={s.hint}>Estos productos no tienen puesto: conseguilos en el mercado.</Text>
      )}

      {canPick && ticket.status !== 'retirado' && (
        <TouchableOpacity style={s.btn} activeOpacity={0.85} onPress={handleRetirar} disabled={busy}>
          {busy
            ? <ActivityIndicator color="#FFFFFF" size="small" />
            : <>
                <Ionicons name="bag-check-outline" size={16} color="#FFFFFF" />
                <Text style={s.btnText}>Marcar retirado</Text>
              </>}
        </TouchableOpacity>
      )}
    </View>
  );
}

const makeStyles = (T: ThemeColors) => StyleSheet.create({
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  title:     { fontSize: 13, fontWeight: '700', color: T.text },
  progress:  { fontSize: 12, fontWeight: '600', color: T.textSoft },
  stall: {
    borderWidth: 1, borderColor: T.border, borderRadius: 12,
    padding: 10, marginBottom: 8, backgroundColor: T.surface,
  },
  stallDone: { opacity: 0.6 },
  stallTop:  { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  stallName: { flex: 1, fontSize: 13.5, fontWeight: '700', color: T.text },
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    borderWidth: 1, borderRadius: 20, paddingHorizontal: 7, paddingVertical: 2,
  },
  pillText: { fontSize: 11, fontWeight: '700' },
  itemRow:  { flexDirection: 'row', alignItems: 'center', paddingVertical: 2 },
  itemEmoji:{ fontSize: 14, width: 22 },
  itemName: { flex: 1, fontSize: 13, color: T.textSoft },
  itemQty:  { fontSize: 12.5, fontWeight: '700', color: T.text },
  hint:     { fontSize: 11.5, color: T.warning, marginTop: 6 },
  btn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: ACCENT, borderRadius: 10, paddingVertical: 9, marginTop: 8,
  },
  btnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
});
