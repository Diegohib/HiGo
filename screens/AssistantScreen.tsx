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
  Animated,
  Easing,
} from 'react-native';
import Text from '../components/Text';
import TextInput from '../components/TextInput';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';
import { useFaqStore, findFaqAnswer, findFaqSuggestions, Faq } from '../store/faqStore';
import { useThemeColors } from '../theme/useThemeColors';
import { ThemeColors } from '../theme/colors';
import { RADIUS, SPACING, cardShadow, floatingShadow } from '../theme/elevation';

type Nav = StackNavigationProp<RootStackParamList, 'Assistant'>;

interface BubbleMsg {
  id: string;
  from: 'user' | 'bot';
  text: string;
  showEscalate?: boolean;
  suggestions?: Faq[];
}

const WELCOME: BubbleMsg = {
  id: 'welcome',
  from: 'bot',
  text: '¡Hola! Soy el asistente de HiGo. Preguntame lo que necesites saber sobre la app — pedidos, pagos, entregas, cuenta, y más.',
};

const NO_MATCH_TEXT = 'No encontré una respuesta clara para eso.';
const NO_MATCH_TEXT_WITH_SUGGESTIONS = 'No encontré una respuesta exacta, pero esto puede ayudarte:';

// Simula el tiempo que tardaría en "pensar" una respuesta — sin esto el bot
// contesta en cero milisegundos, lo cual se siente más a búsqueda instantánea
// que a una conversación real.
const TYPING_DELAY_MS = 550;

// Tres puntitos con un rebote suave y escalonado — el "está escribiendo" que
// ya se espera de cualquier chat, en vez de que la respuesta aparezca de la
// nada.
function TypingDots({ color }: { color: string }) {
  const values = useRef([0, 1, 2].map(() => new Animated.Value(0))).current;

  useEffect(() => {
    const loops = values.map((v, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 140),
          Animated.timing(v, { toValue: 1, duration: 320, easing: Easing.out(Easing.ease), useNativeDriver: true }),
          Animated.timing(v, { toValue: 0, duration: 320, easing: Easing.in(Easing.ease), useNativeDriver: true }),
          Animated.delay((2 - i) * 140),
        ])
      )
    );
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
  }, []);

  return (
    <View style={{ flexDirection: 'row', gap: 4 }}>
      {values.map((v, i) => (
        <Animated.View
          key={i}
          style={{
            width: 6, height: 6, borderRadius: 3, backgroundColor: color,
            opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }),
            transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, -3] }) }],
          }}
        />
      ))}
    </View>
  );
}

export default function AssistantScreen() {
  const C = useThemeColors();
  const styles = makeStyles(C);
  const navigation = useNavigation<Nav>();

  const faqs = useFaqStore((s) => s.faqs);
  const [msgs, setMsgs] = useState<BubbleMsg[]>([WELCOME]);
  const [text, setText] = useState('');
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [msgs.length, typing]);

  function ask(question: string) {
    const trimmed = question.trim();
    if (!trimmed) return;
    const userMsg: BubbleMsg = { id: `u-${Date.now()}`, from: 'user', text: trimmed };

    const match = findFaqAnswer(faqs, trimmed);
    let botMsg: BubbleMsg;
    if (match) {
      botMsg = { id: `b-${Date.now()}`, from: 'bot', text: match.answer };
    } else {
      const suggestions = findFaqSuggestions(faqs, trimmed);
      botMsg = suggestions.length > 0
        ? { id: `b-${Date.now()}`, from: 'bot', text: NO_MATCH_TEXT_WITH_SUGGESTIONS, suggestions, showEscalate: true }
        : { id: `b-${Date.now()}`, from: 'bot', text: NO_MATCH_TEXT, showEscalate: true };
    }

    setMsgs((prev) => [...prev, userMsg]);
    setText('');
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setMsgs((prev) => [...prev, botMsg]);
    }, TYPING_DELAY_MS);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle={C.statusBarStyle} backgroundColor={C.primary} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <LinearGradient
          colors={C.headerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.headerBlob} pointerEvents="none" />
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={C.white} />
          </TouchableOpacity>
          <View style={styles.botAvatarWrap}>
            <View style={styles.botAvatar}>
              <Ionicons name="sparkles" size={17} color="#FFFFFF" />
            </View>
            <View style={styles.onlineDot} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Asistente HiGo</Text>
            <Text style={styles.headerSubtitle}>Preguntas frecuentes · en línea</Text>
          </View>
          <View style={{ width: 40 }} />
        </LinearGradient>

        <ScrollView
          ref={scrollRef}
          style={styles.body}
          contentContainerStyle={styles.bodyContent}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
        >
          {msgs.map((m) => {
            const isMine = m.from === 'user';
            const bubbleInner = (
              <>
                {!isMine && <Text style={styles.bubbleSender}>Asistente</Text>}
                <Text style={[styles.bubbleText, isMine && styles.bubbleTextMine]}>{m.text}</Text>

                {m.suggestions && m.suggestions.length > 0 && (
                  <View style={styles.inlineSuggestions}>
                    {m.suggestions.map((f) => (
                      <TouchableOpacity
                        key={f.id}
                        style={styles.inlineSuggestionChip}
                        activeOpacity={0.8}
                        onPress={() => ask(f.question)}
                      >
                        <Ionicons name="return-down-forward" size={13} color={C.primary} />
                        <Text style={styles.inlineSuggestionText} numberOfLines={2}>{f.question}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {m.showEscalate && (
                  <TouchableOpacity
                    style={styles.escalateBtn}
                    activeOpacity={0.8}
                    onPress={() => navigation.navigate('Chat')}
                  >
                    <Ionicons name="person-circle-outline" size={16} color={C.primary} />
                    <Text style={styles.escalateBtnText}>Hablar con un administrador</Text>
                  </TouchableOpacity>
                )}
              </>
            );

            return (
              <View
                key={m.id}
                style={[styles.bubbleRow, isMine ? styles.bubbleRowMine : styles.bubbleRowTheirs]}
              >
                {!isMine && (
                  <View style={styles.bubbleAvatar}>
                    <Ionicons name="sparkles" size={13} color="#FFFFFF" />
                  </View>
                )}
                {isMine ? (
                  <LinearGradient
                    colors={[C.headerGradient[1], C.headerGradient[0]]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[styles.bubble, styles.bubbleMine]}
                  >
                    {bubbleInner}
                  </LinearGradient>
                ) : (
                  <View style={[styles.bubble, styles.bubbleTheirs]}>{bubbleInner}</View>
                )}
              </View>
            );
          })}

          {typing && (
            <View style={[styles.bubbleRow, styles.bubbleRowTheirs]}>
              <View style={styles.bubbleAvatar}>
                <Ionicons name="sparkles" size={13} color="#FFFFFF" />
              </View>
              <View style={[styles.bubble, styles.bubbleTheirs, styles.typingBubble]}>
                <TypingDots color={C.textFaint} />
              </View>
            </View>
          )}

          {msgs.length === 1 && faqs.length > 0 && (
            <View>
              <Text style={styles.suggestionsLabel}>PREGUNTAS POPULARES</Text>
              <View style={styles.suggestionsWrap}>
                {faqs.slice(0, 4).map((f) => (
                  <TouchableOpacity
                    key={f.id}
                    style={styles.suggestionChip}
                    activeOpacity={0.8}
                    onPress={() => ask(f.question)}
                  >
                    <Text style={styles.suggestionChipText} numberOfLines={1}>{f.question}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </ScrollView>

        <View style={styles.inputRow}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              value={text}
              onChangeText={setText}
              placeholder="Escribe tu pregunta…"
              placeholderTextColor={C.textFaint}
              multiline
              onSubmitEditing={() => ask(text)}
            />
          </View>
          <TouchableOpacity
            style={styles.sendBtnShadowWrap}
            onPress={() => ask(text)}
            disabled={!text.trim()}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={text.trim() ? [C.headerGradient[1], C.headerGradient[0]] : [C.border, C.border]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.sendBtn}
            >
              <Ionicons name="send" size={17} color={text.trim() ? '#FFFFFF' : C.textFaint} />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.footerLink}
          activeOpacity={0.7}
          onPress={() => navigation.navigate('Chat')}
        >
          <Ionicons name="person-circle-outline" size={14} color={C.textFaint} />
          <Text style={styles.footerLinkText}>¿Prefieres hablar directo con un administrador?</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const makeStyles = (C: ThemeColors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.primary },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    overflow: 'hidden',
  },
  headerBlob: {
    position: 'absolute',
    top: -50, right: -30,
    width: 140, height: 140, borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  botAvatarWrap: { marginRight: 10 },
  botAvatar: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#FFFFFF', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 4,
  },
  onlineDot: {
    position: 'absolute', right: -1, bottom: -1,
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: '#4ADE80', borderWidth: 1.5, borderColor: C.headerGradient[0],
  },
  headerTitle: { color: C.white, fontSize: 17, fontWeight: '700' },
  headerSubtitle: { color: 'rgba(255,255,255,0.75)', fontSize: 12, marginTop: 1 },

  body: {
    flex: 1,
    backgroundColor: C.background,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
  },
  bodyContent: { padding: 16, gap: 10, flexGrow: 1 },

  bubbleRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  bubbleRowMine: { justifyContent: 'flex-end' },
  bubbleRowTheirs: { justifyContent: 'flex-start' },
  bubbleAvatar: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: C.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  bubble: { maxWidth: '85%', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleMine: { borderBottomRightRadius: 4, ...floatingShadow(C, C.primary) },
  bubbleTheirs: { backgroundColor: C.surface, borderBottomLeftRadius: 4, ...cardShadow(C) },
  bubbleSender: { fontSize: 11, fontWeight: '700', color: C.primary, marginBottom: 2 },
  bubbleText: { fontSize: 14, color: C.text, lineHeight: 20 },
  bubbleTextMine: { color: C.white },

  escalateBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: 10, alignSelf: 'flex-start',
    backgroundColor: C.primaryFaint, borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 7,
  },
  escalateBtnText: { fontSize: 12.5, fontWeight: '700', color: C.primary },

  // Sugerencias "¿quisiste decir...?" dentro de la burbuja de respuesta
  inlineSuggestions: { gap: 6, marginTop: 10 },
  inlineSuggestionChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: C.primaryFaint, borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 8,
  },
  inlineSuggestionText: { flex: 1, fontSize: 12.5, color: C.primary, fontWeight: '600', lineHeight: 17 },

  // Indicador de "escribiendo"
  typingBubble: { paddingVertical: 13 },

  suggestionsLabel: {
    fontSize: 11, fontWeight: '800', color: C.textFaint,
    textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8, marginLeft: 2,
  },
  suggestionsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  suggestionChip: {
    backgroundColor: C.surface, borderWidth: 1.5, borderColor: C.border,
    borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8, maxWidth: '100%',
    ...cardShadow(C),
  },
  suggestionChipText: { fontSize: 12.5, color: C.text, fontWeight: '600' },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    padding: 12,
    backgroundColor: C.surface,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: C.background,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderColor: C.border,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  input: {
    maxHeight: 100,
    paddingVertical: 10,
    fontSize: 14,
    color: C.text,
  },
  sendBtnShadowWrap: {
    borderRadius: 21,
    ...floatingShadow(C, C.primary),
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },

  footerLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    backgroundColor: C.surface,
  },
  footerLinkText: { fontSize: 12.5, color: C.textSoft, fontWeight: '600' },
});
