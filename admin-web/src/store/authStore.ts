import { create } from 'zustand';
import {
  EmailAuthProvider,
  onAuthStateChanged,
  reauthenticateWithCredential,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
  verifyBeforeUpdateEmail,
} from 'firebase/auth';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { AppUser } from '../types';

interface AuthState {
  user: AppUser | null;
  initializing: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (data: { name: string; phone: string }) => Promise<void>;
  changeEmail: (newEmail: string, currentPassword: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  initializing: true,
  error: null,

  login: async (email, password) => {
    set({ error: null });
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      const message =
        err?.code === 'auth/invalid-credential' || err?.code === 'auth/wrong-password' || err?.code === 'auth/user-not-found'
          ? 'El correo o la contraseña no coinciden.'
          : 'No se pudo iniciar sesión. Intenta de nuevo.';
      set({ error: message });
      throw err;
    }
  },

  logout: async () => {
    await signOut(auth);
  },

  // No exige que la cuenta sea admin de antemano — Firebase igual no revela
  // si el correo existe o no, así que es seguro dejarlo abierto desde login.
  resetPassword: async (email) => {
    await sendPasswordResetEmail(auth, email);
  },

  updateProfile: async ({ name, phone }) => {
    if (!auth.currentUser) return;
    await updateDoc(doc(db, 'users', auth.currentUser.uid), { name, phone });
  },

  // Requiere volver a confirmar la contraseña actual (lo exige Firebase por
  // seguridad). El correo solo cambia una vez que la persona confirma el
  // enlace que le llega al correo NUEVO — hasta entonces sigue entrando con
  // el de siempre. Mismo patrón que la app móvil (store/authStore.ts).
  changeEmail: async (newEmail, currentPassword) => {
    if (!auth.currentUser || !auth.currentUser.email) return;
    const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPassword);
    await reauthenticateWithCredential(auth.currentUser, credential);
    await verifyBeforeUpdateEmail(auth.currentUser, newEmail);
  },

  changePassword: async (currentPassword, newPassword) => {
    if (!auth.currentUser || !auth.currentUser.email) return;
    const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPassword);
    await reauthenticateWithCredential(auth.currentUser, credential);
    await updatePassword(auth.currentUser, newPassword);
  },
}));

// ─── Sincronización en vivo: sesión + perfil, con guardia de rol admin ─────────
// Igual que AppNavigator.tsx del lado móvil: si el perfil no es un admin
// aprobado, se cierra la sesión y se muestra un error en vez de dejarlo pasar.

let unsubProfile: (() => void) | null = null;

onAuthStateChanged(auth, (firebaseUser) => {
  unsubProfile?.();
  unsubProfile = null;

  if (!firebaseUser) {
    useAuthStore.setState({ user: null, initializing: false });
    return;
  }

  unsubProfile = onSnapshot(
    doc(db, 'users', firebaseUser.uid),
    (snap) => {
      const data = snap.data() as Omit<AppUser, 'uid'> | undefined;

      if (!data || data.role !== 'admin' || data.status !== 'approved') {
        useAuthStore.setState({
          user: null,
          initializing: false,
          error: 'Esta cuenta no tiene acceso de administrador.',
        });
        signOut(auth);
        return;
      }

      useAuthStore.setState({ user: { uid: firebaseUser.uid, ...data }, initializing: false });
    },
    (error) => {
      console.error('[authStore] users/{uid} listener error:', error.code, error.message);
      useAuthStore.setState({ user: null, initializing: false });
    }
  );
});
