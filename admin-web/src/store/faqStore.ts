import { create } from 'zustand';
import { collection, doc, deleteDoc, onSnapshot, writeBatch } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { FAQS as SEED_FAQS } from '../data/faqs';
import { Faq } from '../types';

interface FaqState {
  faqs: Faq[];
  loaded: boolean;
  seedFaqs: () => Promise<void>;
  deleteFaq: (id: string) => Promise<void>;
}

export const useFaqStore = create<FaqState>()(() => ({
  faqs: [],
  loaded: false,

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

onSnapshot(collection(db, 'faqs'), (snap) => {
  useFaqStore.setState({
    faqs: snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Faq, 'id'>) })),
    loaded: true,
  });
});
