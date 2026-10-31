import { create } from 'zustand';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  reauthenticateWithCredential,
  updatePassword,
  verifyBeforeUpdateEmail,
  EmailAuthProvider,
  ActionCodeSettings,
} from 'firebase/auth';
import { doc, setDoc, updateDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

export const MIN_PASSWORD_LENGTH = 6;

// Al tocar "Continuar" en la página de confirmación de Firebase, este link
// (esquema propio de la app) devuelve al usuario a HiGo. Solo funciona en un
// build real (EAS) — Expo Go no puede registrar este esquema.
const VERIFY_EMAIL_ACTION_SETTINGS: ActionCodeSettings = {
  url: 'higo://verified',
  handleCodeInApp: false,
};

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type UserRole = 'cliente' | 'cochero' | 'transportista' | 'comerciante' | 'admin';
export type UserStatus = 'approved' | 'pending' | 'rejected';

export type AddressLabel = 'Casa' | 'Trabajo' | 'Otro';
export type Gender = 'femenino' | 'masculino' | 'no_binario' | 'prefiero_no_decir';

export interface AppUser {
  uid: string;
  role: UserRole;
  status: UserStatus;
  name: string;
  firstName?: string;
  lastName?: string;
  phone: string;
  email?: string;
  edad?: string;
  cedula?: string;
  numCoche?: string;
  stallNumber?: string;
  giro?: string;
  rejectionReason?: string;
  photoUri?: string;
  nickname?: string;
  birthDate?: string;
  gender?: Gender;
  // Dirección de entrega guardada (solo clientes). `addressSkipped` evita
  // volver a pedirla en cada apertura de la app si la persona la saltó.
  address?: string;
  addressReference?: string;
  addressLat?: number;
  addressLng?: number;
  addressLabel?: AddressLabel;
  addressSkipped?: boolean;
}

export interface AddressData {
  address: string;
  addressReference?: string;
  addressLat: number;
  addressLng: number;
  addressLabel: AddressLabel;
}

interface RegisterClienteParams {
  name: string;
  email: string;
  phone: string;
  password: string;
}

interface RegisterStaffParams {
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  role: 'cochero' | 'transportista' | 'comerciante';
  edad?: string;
  cedula?: string;
  numCoche?: string;
  stallNumber?: string;
  giro?: string;
}

interface AuthState {
  user: AppUser | null;
  initializing: boolean;
  emailVerified: boolean;
  register: (params: RegisterClienteParams) => Promise<void>;
  registerStaff: (params: RegisterStaffParams) => Promise<string>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  refreshEmailVerified: () => Promise<void>;
  updatePhoto: (uri: string) => Promise<void>;
  updateAddress: (data: AddressData) => Promise<void>;
  skipAddress: () => Promise<void>;
  updateProfile: (data: {
    name: string;
    phone: string;
    nickname?: string;
    birthDate?: string;
    gender?: Gender;
  }) => Promise<void>;
  changeEmail: (newEmail: string, currentPassword: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  changePhone: (newPhone: string, currentPassword: string) => Promise<void>;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  initializing: true,
  emailVerified: false,

  register: async ({ name, email, phone, password }) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await setDoc(doc(db, 'users', cred.user.uid), {
      role: 'cliente',
      status: 'approved',
      name,
      phone,
      email,
      createdAt: serverTimestamp(),
    });
    await sendEmailVerification(cred.user);
  },

  registerStaff: async ({ name, firstName, lastName, email, phone, password, role, edad, cedula, numCoche, stallNumber, giro }) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await setDoc(doc(db, 'users', cred.user.uid), {
      role,
      status: 'pending',
      name,
      firstName,
      lastName,
      phone,
      email,
      ...(edad        ? { edad }        : {}),
      ...(cedula      ? { cedula }      : {}),
      ...(numCoche    ? { numCoche }    : {}),
      ...(stallNumber ? { stallNumber } : {}),
      ...(giro        ? { giro }        : {}),
      createdAt: serverTimestamp(),
    });
    await sendEmailVerification(cred.user);
    return cred.user.uid;
  },

  login: async (email, password) => {
    await signInWithEmailAndPassword(auth, email, password);
  },

  logout: async () => {
    await signOut(auth);
  },

  resetPassword: async (email) => {
    await sendPasswordResetEmail(auth, email);
  },

  resendVerificationEmail: async () => {
    if (auth.currentUser) await sendEmailVerification(auth.currentUser);
  },

  refreshEmailVerified: async () => {
    if (!auth.currentUser) return;
    await auth.currentUser.reload();
    useAuthStore.setState({ emailVerified: auth.currentUser.emailVerified });
  },

  updatePhoto: async (uri) => {
    if (!auth.currentUser) return;
    await updateDoc(doc(db, 'users', auth.currentUser.uid), { photoUri: uri });
  },

  updateAddress: async (data) => {
    if (!auth.currentUser) return;
    await updateDoc(doc(db, 'users', auth.currentUser.uid), { ...data, addressSkipped: false });
  },

  skipAddress: async () => {
    if (!auth.currentUser) return;
    await updateDoc(doc(db, 'users', auth.currentUser.uid), { addressSkipped: true });
  },

  updateProfile: async ({ name, phone, nickname, birthDate, gender }) => {
    if (!auth.currentUser) return;
    await updateDoc(doc(db, 'users', auth.currentUser.uid), {
      name,
      phone,
      nickname: nickname ?? '',
      birthDate: birthDate ?? '',
      ...(gender ? { gender } : {}),
    });
  },

  // Cambiar correo requiere volver a confirmar la contraseña actual (Firebase
  // lo exige por seguridad) y solo se aplica una vez que la persona confirma
  // el enlace que le llega al correo NUEVO — hasta entonces sigue entrando
  // con el correo de siempre.
  changeEmail: async (newEmail, currentPassword) => {
    if (!auth.currentUser || !auth.currentUser.email) return;
    const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPassword);
    await reauthenticateWithCredential(auth.currentUser, credential);
    await verifyBeforeUpdateEmail(auth.currentUser, newEmail);
  },

  // Igual que arriba: pide la contraseña actual antes de dejar poner una nueva.
  changePassword: async (currentPassword, newPassword) => {
    if (!auth.currentUser || !auth.currentUser.email) return;
    const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPassword);
    await reauthenticateWithCredential(auth.currentUser, credential);
    await updatePassword(auth.currentUser, newPassword);
  },

  // Mismo resguardo que cambiar correo/contraseña: pide la contraseña actual
  // antes de aceptar el número nuevo. No hay verificación por SMS todavía
  // (requeriría activar Firebase Phone Auth, con costo por mensaje).
  changePhone: async (newPhone, currentPassword) => {
    if (!auth.currentUser || !auth.currentUser.email) return;
    const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPassword);
    await reauthenticateWithCredential(auth.currentUser, credential);
    await updateDoc(doc(db, 'users', auth.currentUser.uid), { phone: newPhone });
  },
}));

// ─── Sincronización en vivo: sesión de Firebase Auth + perfil en Firestore ─────
// Se ejecuta una sola vez al cargar el módulo. Mantiene `user` actualizado
// automáticamente (por ejemplo cuando un admin aprueba una solicitud, el
// dispositivo del solicitante recibe el cambio sin ninguna acción local).

let unsubProfile: (() => void) | null = null;

onAuthStateChanged(auth, (firebaseUser) => {
  unsubProfile?.();
  unsubProfile = null;

  if (!firebaseUser) {
    useAuthStore.setState({ user: null, initializing: false, emailVerified: false });
    return;
  }

  useAuthStore.setState({ emailVerified: firebaseUser.emailVerified });

  unsubProfile = onSnapshot(
    doc(db, 'users', firebaseUser.uid),
    (snap) => {
      const data = snap.data() as Omit<AppUser, 'uid'> | undefined;
      useAuthStore.setState({
        user: data ? { uid: firebaseUser.uid, ...data } : null,
        initializing: false,
      });
    },
    (error) => {
      console.error('[authStore] users/{uid} listener error:', error.code, error.message);
    }
  );
});
