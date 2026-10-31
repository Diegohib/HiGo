import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

// Datos de la cuenta bancaria de HiGo para pagar por transferencia. Los carga
// y edita el admin desde el panel web (documento config/payment); la app solo
// los muestra en el checkout.

export interface BankDetails {
  bankName:      string;
  accountType:   string;   // Ahorros / Corriente
  accountNumber: string;
  holderName:    string;
  holderId:      string;   // RUC o cédula del titular
}

export function usePaymentConfig() {
  const [bank, setBank] = useState<BankDetails | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    return onSnapshot(
      doc(db, 'config', 'payment'),
      (snap) => {
        const data = snap.data() as Partial<BankDetails> | undefined;
        setBank(data?.accountNumber ? (data as BankDetails) : null);
        setLoaded(true);
      },
      () => setLoaded(true),
    );
  }, []);

  return { bank, loaded };
}
