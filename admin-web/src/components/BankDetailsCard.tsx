import { useEffect, useState } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { BankDetails } from '../types';

// Datos de la cuenta bancaria de HiGo que el cliente ve en el checkout para
// pagar por transferencia (documento config/payment).

const EMPTY: BankDetails = { bankName: '', accountType: 'Ahorros', accountNumber: '', holderName: '', holderId: '' };

const FIELDS: { key: keyof BankDetails; label: string; placeholder: string }[] = [
  { key: 'bankName',      label: 'Banco',               placeholder: 'Banco Pichincha' },
  { key: 'accountNumber', label: 'Número de cuenta',    placeholder: '2200000000' },
  { key: 'holderName',    label: 'Titular',             placeholder: 'HiGo S.A.S.' },
  { key: 'holderId',      label: 'RUC o cédula',        placeholder: '1790000000001' },
];

export default function BankDetailsCard() {
  const [form, setForm] = useState<BankDetails>(EMPTY);
  const [saved, setSaved] = useState<BankDetails | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    return onSnapshot(doc(db, 'config', 'payment'), (snap) => {
      const data = snap.exists() ? { ...EMPTY, ...(snap.data() as Partial<BankDetails>) } : null;
      setSaved(data);
      if (data) setForm(data);
    });
  }, []);

  const dirty = JSON.stringify(form) !== JSON.stringify(saved ?? EMPTY);

  async function handleSave() {
    if (FIELDS.some((f) => !form[f.key].trim())) {
      alert('Completá todos los datos de la cuenta.');
      return;
    }
    setSaving(true);
    try {
      await setDoc(doc(db, 'config', 'payment'), {
        bankName: form.bankName.trim(),
        accountType: form.accountType,
        accountNumber: form.accountNumber.trim(),
        holderName: form.holderName.trim(),
        holderId: form.holderId.trim(),
      });
    } catch (err) {
      console.error('[BankDetailsCard] save:', err);
      alert('No se pudieron guardar los datos.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card">
      <h2 style={{ fontSize: 16, margin: '0 0 4px' }}>Cuenta para transferencias</h2>
      <p style={{ margin: '0 0 14px', color: 'var(--text-soft)', fontSize: 13 }}>
        {saved
          ? 'Esto es lo que ven los clientes al pagar por transferencia.'
          : 'Todavía no hay cuenta cargada: los clientes no pueden pagar por transferencia hasta que la completes.'}
      </p>

      {FIELDS.slice(0, 1).map((f) => <Field key={f.key} f={f} form={form} setForm={setForm} />)}

      <div className="field">
        <label className="label">Tipo de cuenta</label>
        <div className="chip-row">
          {['Ahorros', 'Corriente'].map((t) => (
            <button
              key={t}
              type="button"
              className={`chip${form.accountType === t ? ' active' : ''}`}
              onClick={() => setForm({ ...form, accountType: t })}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {FIELDS.slice(1).map((f) => <Field key={f.key} f={f} form={form} setForm={setForm} />)}

      <button className="btn btn-primary" onClick={handleSave} disabled={saving || !dirty}>
        {saving ? 'Guardando…' : dirty ? 'Guardar cuenta' : 'Guardado'}
      </button>
    </div>
  );
}

function Field({
  f, form, setForm,
}: {
  f: { key: keyof BankDetails; label: string; placeholder: string };
  form: BankDetails;
  setForm: (b: BankDetails) => void;
}) {
  return (
    <div className="field">
      <label className="label">{f.label}</label>
      <input
        className="input"
        value={form[f.key]}
        placeholder={f.placeholder}
        onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
      />
    </div>
  );
}
