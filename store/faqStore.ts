import { create } from 'zustand';
import { collection, doc, deleteDoc, onSnapshot, writeBatch } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { FAQS as SEED_FAQS } from '../data/faqs';

export interface Faq {
  id: string;
  question: string;
  answer: string;
  keywords: string[];
}

interface FaqState {
  faqs: Faq[];
  loaded: boolean;
  seedFaqs: () => Promise<void>;
  deleteFaq: (id: string) => Promise<void>;
}

function toFaq(id: string, data: any): Faq {
  return {
    id,
    question: data.question ?? '',
    answer: data.answer ?? '',
    keywords: Array.isArray(data.keywords) ? data.keywords : [],
  };
}

export const useFaqStore = create<FaqState>()(() => ({
  faqs: [],
  loaded: false,

  // Carga única de las preguntas frecuentes de arranque (data/faqs.ts) a
  // Firestore — se usa desde la pantalla de administración. Mantiene los
  // mismos ids (fq1, fq2, ...) así que reimportar actualiza en vez de
  // duplicar.
  seedFaqs: async () => {
    const batch = writeBatch(db);
    SEED_FAQS.forEach(({ id, ...rest }) => {
      batch.set(doc(db, 'faqs', id), rest);
    });
    await batch.commit();
  },

  deleteFaq: async (id) => {
    await deleteDoc(doc(db, 'faqs', id));
  },
}));

onSnapshot(
  collection(db, 'faqs'),
  (snap) => useFaqStore.setState({ faqs: snap.docs.map((d) => toFaq(d.id, d.data())), loaded: true }),
  (error) => {
    console.error('[faqStore] faqs listener error:', error.code, error.message);
    useFaqStore.setState({ loaded: true });
  },
);

// Normaliza (minúsculas, sin tildes, sin puntuación) para que "¿Cómo...?" y
// "como" matcheen igual. Sin la limpieza de puntuación, "¿como" (pegado al
// signo de apertura) nunca calzaba con la palabra clave "como" — eso hacía
// fallar hasta las preguntas sugeridas tal cual, y de rebote otra FAQ con esa
// misma palabra suelta en varias de sus keywords podía ganar por error.
// Filtra acentos por código de carácter (en vez de una regex con el rango
// Unicode de acentos combinados escrito literal) para evitar cualquier
// problema de codificación del archivo fuente.
function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .split('')
    .filter((ch) => {
      const code = ch.charCodeAt(0);
      return !(code >= 0x0300 && code <= 0x036f);
    })
    .join('')
    .replace(/[¿?¡!.,;:()"'«»…]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Compara dos palabras "a lo bruto" (sin diccionario de conjugaciones): si
// comparten un prefijo largo se consideran la misma palabra — así "pedido"
// matchea "pedidos", "entrega" matchea "entregar"/"entregas", etc. Solo para
// palabras de 4+ letras (si no, cualquier prefijo corto pega con demasiado —
// "como" contra "comercio" no debería matchear, y con este piso no matchea).
function wordsMatch(a: string, b: string): boolean {
  if (a === b) return true;
  if (a.length < 4 || b.length < 4) return false;
  const shorter = a.length < b.length ? a : b;
  const longer  = a.length < b.length ? b : a;
  if (!longer.startsWith(shorter.slice(0, 4))) return false;
  let shared = 0;
  while (shared < shorter.length && shorter[shared] === longer[shared]) shared++;
  return shared >= 4 && shared / shorter.length >= 0.75;
}

function keywordCoverage(kwWords: string[], queryWords: string[]): number {
  if (kwWords.length === 0) return 0;
  const matched = kwWords.filter((w) => queryWords.some((qw) => wordsMatch(w, qw))).length;
  return matched / kwWords.length;
}

// Puntúa cada FAQ por su mejor keyword contra la pregunta: no exige que
// aparezcan las palabras EXACTAS ni la frase completa — con que la mayoría de
// las palabras de una keyword estén presentes (en su forma parecida) alcanza,
// así "necesito pagar mi pedido" matchea la keyword "como pago" igual.
function scoreFaqs(faqs: Faq[], queryWords: string[]): { faq: Faq; score: number; words: number }[] {
  const results: { faq: Faq; score: number; words: number }[] = [];
  for (const faq of faqs) {
    let bestCoverage = 0;
    let bestWords = 0;
    for (const kw of faq.keywords) {
      const kwWords = normalize(kw).split(' ').filter(Boolean);
      if (kwWords.length === 0) continue;
      const coverage = keywordCoverage(kwWords, queryWords);
      // Ante empate de cobertura, gana la keyword con más palabras (más
      // específica) — evita que una keyword corta y genérica tape a una más
      // precisa con la misma cobertura relativa.
      if (coverage > bestCoverage || (coverage === bestCoverage && kwWords.length > bestWords)) {
        bestCoverage = coverage;
        bestWords = kwWords.length;
      }
    }
    if (bestCoverage > 0) results.push({ faq, score: bestCoverage, words: bestWords });
  }
  return results.sort((a, b) => b.score - a.score || b.words - a.words);
}

const MATCH_THRESHOLD = 0.6;

export function findFaqAnswer(faqs: Faq[], query: string): Faq | null {
  const queryNorm = normalize(query);
  if (!queryNorm) return null;

  // Tocar una de las preguntas sugeridas manda el texto tal cual — las
  // keywords están pensadas para captar formas de preguntar parecidas, no
  // necesariamente un subconjunto exacto de la pregunta formal, así que se
  // chequea la coincidencia exacta primero para que las sugerencias nunca
  // fallen.
  const exact = faqs.find((f) => normalize(f.question) === queryNorm);
  if (exact) return exact;

  const queryWords = queryNorm.split(' ').filter(Boolean);
  const [top] = scoreFaqs(faqs, queryWords);
  return top && top.score >= MATCH_THRESHOLD ? top.faq : null;
}

// Para cuando no hay una respuesta clara: devuelve las FAQs más cercanas
// (aunque no lleguen al umbral) para ofrecerlas como "¿quisiste decir...?" en
// vez de dejar a la persona sin ninguna pista.
export function findFaqSuggestions(faqs: Faq[], query: string, limit = 3): Faq[] {
  const queryWords = normalize(query).split(' ').filter(Boolean);
  return scoreFaqs(faqs, queryWords).slice(0, limit).map((r) => r.faq);
}
