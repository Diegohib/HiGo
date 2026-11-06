import {
  useEffect,
  useRef,
  useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Text from '../components/Text';
import TextInput from '../components/TextInput';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';
import { useOrderChatStore } from '../store/orderChatStore';
import { useAuthStore } from '../store/authStore';
import { useThemeColors } from '../theme/useThemeColors';
import { ThemeColors } from '../theme/colors';

type Nav = StackNavigationProp<RootStackParamList, 'OrderChat'>;
type Route = RouteProp<RootStackParamList, 'OrderChat'>;

function formatTime(ms: number) {
  return new Date(ms).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' });
}

export default function OrderChatScreen() {
  const C = useThemeColors();
  const styles = makeStyles(C);
  const navigation = useNavigation<Nav>();
  const { orderId } = useRoute<Route>().params;

  const uid = useAuthStore((s) => s.user?.uid);
  const isCochero = useAuthStore((s) => s.user?.role === 'cochero');
  const messages = useOrderChatStore((s) => s.messages);
  const subscribe = useOrderChatStore((s) => s.subscribe);
  const sendMessage = useOrderChatStore((s) => s.sendMessage);

  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    const unsub = subscribe(orderId);
    return unsub;
  }, [orderId]);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages.length]);

  async function handleSend() {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setSending(true);
    setText('');
    try {
      await sendMessage(orderId, trimmed);
    } catch (error) {
      console.error('[OrderChatScreen] sendMessage error:', error);
    } finally {
      setSending(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle={C.statusBarStyle} backgroundColor={C.primary} />

      <LinearGradient colors={C.headerGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={C.white} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>{isCochero ? 'Chat con el cliente' : 'Chat con tu cochero'}</Text>
          <Text style={styles.headerSubtitle}>Pedido #{orderId}</Text>
        </View>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView
          ref={scrollRef}
          style={styles.body}
          contentContainerStyle={styles.bodyContent}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
        >
          {messages.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="chatbubbles-outline" size={40} color={C.textFaint} />
              <Text style={styles.emptyText}>
                {isCochero
                  ? 'Escríbele al cliente si necesitas coordinar algo de su pedido.'
                  : 'Escríbele a tu cochero si necesitas coordinar algo de tu pedido.'}
              </Text>
            </View>
          ) : (
            messages.map((m) => {
              const mine = m.senderId === uid;
              const senderLabel = m.senderRole === 'cochero' ? 'Cochero' : 'Cliente';
              return (
                <View
                  key={m.id}
                  style={[styles.bubbleRow, mine ? styles.bubbleRowMine : styles.bubbleRowTheirs]}
                >
                  <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
                    {!mine && <Text style={styles.bubbleSender}>{senderLabel}</Text>}
                    <Text style={[styles.bubbleText, mine && styles.bubbleTextMine]}>{m.text}</Text>
                    <Text style={[styles.bubbleTime, mine && styles.bubbleTimeMine]}>
                      {formatTime(m.createdAt)}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder="Escribe tu mensaje…"
            placeholderTextColor={C.textFaint}
            multiline
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!text.trim() || sending) && { opacity: 0.5 }]}
            onPress={handleSend}
            disabled={!text.trim() || sending}
            activeOpacity={0.8}
          >
            <Ionicons name="send" size={18} color={C.white} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const makeStyles = (C: ThemeColors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.headerGradient[0] },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { color: C.white, fontSize: 17, fontWeight: '700', textAlign: 'center' },
  headerSubtitle: { color: 'rgba(255,255,255,0.75)', fontSize: 12, textAlign: 'center', marginTop: 1 },

  body: {
    flex: 1,
    backgroundColor: C.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  bodyContent: { padding: 16, gap: 10, flexGrow: 1 },

  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingVertical: 60, paddingHorizontal: 24 },
  emptyText: { color: C.textFaint, fontSize: 13, textAlign: 'center', lineHeight: 19 },

  bubbleRow: { flexDirection: 'row' },
  bubbleRowMine: { justifyContent: 'flex-end' },
  bubbleRowTheirs: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '80%', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleMine: { backgroundColor: C.primary, borderBottomRightRadius: 4 },
  bubbleTheirs: { backgroundColor: C.surface, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: C.border },
  bubbleSender: { fontSize: 11, fontWeight: '700', color: C.primary, marginBottom: 2 },
  bubbleText: { fontSize: 14, color: C.text, lineHeight: 20 },
  bubbleTextMine: { color: C.white },
  bubbleTime: { fontSize: 10, color: C.textFaint, marginTop: 4, alignSelf: 'flex-end' },
  bubbleTimeMine: { color: 'rgba(255,255,255,0.65)' },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    padding: 12,
    backgroundColor: C.surface,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  input: {
    flex: 1,
    maxHeight: 100,
    backgroundColor: C.background,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: C.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: C.text,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
