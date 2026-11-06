import { FormEvent, useState } from 'react';
import { useAuthStore } from '../store/authStore';

type Tab = 'datos' | 'correo' | 'contrasena';

function errorMessage(err: any, fallback: string): string {
  if (err?.code === 'auth/wrong-password' || err?.code === 'auth/invalid-credential') {
    return 'La contraseña actual no es correcta.';
  }
  if (err?.code === 'auth/email-already-in-use') return 'Ese correo ya está en uso.';
  if (err?.code === 'auth/invalid-email') return 'El correo no es válido.';
  if (err?.code === 'auth/weak-password') return 'La contraseña debe tener al menos 6 caracteres.';
  if (err?.code === 'auth/requires-recent-login') return 'Por seguridad, vuelve a iniciar sesión e intenta de nuevo.';
  return fallback;
}

export default function ProfileModal({ onClose }: { onClose: () => void }) {
  const user = useAuthStore((s) => s.user);
  const updateProfile = useAuthStore((s) => s.updateProfile);
  const changeEmail = useAuthStore((s) => s.changeEmail);
  const changePassword = useAuthStore((s) => s.changePassword);

  const [tab, setTab] = useState<Tab>('datos');

  // Datos
  const [name, setName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<string | null>(null);

  // Correo
  const [newEmail, setNewEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [savingEmail, setSavingEmail] = useState(false);
  const [emailMsg, setEmailMsg] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);

  // Contraseña
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);

  async function handleSaveProfile(e: FormEvent) {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMsg(null);
    try {
      await updateProfile({ name: name.trim(), phone: phone.trim() });
      setProfileMsg('Datos guardados.');
    } catch (err) {
      console.error('[ProfileModal] updateProfile error:', err);
      setProfileMsg('No se pudieron guardar los datos.');
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleChangeEmail(e: FormEvent) {
    e.preventDefault();
    setSavingEmail(true);
    setEmailMsg(null);
    try {
      await changeEmail(newEmail.trim().toLowerCase(), emailPassword);
      setEmailMsg({
        type: 'ok',
        text: `Te enviamos un correo de confirmación a ${newEmail.trim()}. Tu correo de acceso cambia recién cuando lo confirmes.`,
      });
      setNewEmail('');
      setEmailPassword('');
    } catch (err: any) {
      setEmailMsg({ type: 'error', text: errorMessage(err, 'No se pudo cambiar el correo.') });
    } finally {
      setSavingEmail(false);
    }
  }

  async function handleChangePassword(e: FormEvent) {
    e.preventDefault();
    if (newPassword.length < 6) {
      setPasswordMsg({ type: 'error', text: 'La contraseña nueva debe tener al menos 6 caracteres.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'Las contraseñas nuevas no coinciden.' });
      return;
    }
    setSavingPassword(true);
    setPasswordMsg(null);
    try {
      await changePassword(currentPassword, newPassword);
      setPasswordMsg({ type: 'ok', text: 'Contraseña actualizada.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordMsg({ type: 'error', text: errorMessage(err, 'No se pudo cambiar la contraseña.') });
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Mi perfil</h2>
          <button className="close-btn" onClick={onClose} aria-label="Cerrar">×</button>
        </div>

        <div className="tabs" style={{ marginBottom: 18 }}>
          <button className={`tab-btn${tab === 'datos' ? ' active' : ''}`} onClick={() => setTab('datos')}>Datos</button>
          <button className={`tab-btn${tab === 'correo' ? ' active' : ''}`} onClick={() => setTab('correo')}>Correo</button>
          <button className={`tab-btn${tab === 'contrasena' ? ' active' : ''}`} onClick={() => setTab('contrasena')}>Contraseña</button>
        </div>

        {tab === 'datos' && (
          <form onSubmit={handleSaveProfile}>
            <div className="field">
              <label className="label">Nombre</label>
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="field">
              <label className="label">Teléfono</label>
              <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            {profileMsg && <p className="error-text" style={{ color: 'var(--success)' }}>{profileMsg}</p>}
            <button className="btn btn-primary btn-block" type="submit" disabled={savingProfile}>
              {savingProfile ? 'Guardando…' : 'Guardar'}
            </button>
          </form>
        )}

        {tab === 'correo' && (
          <form onSubmit={handleChangeEmail}>
            <p className="row-sub" style={{ whiteSpace: 'normal', marginBottom: 14 }}>
              Correo actual: <strong>{user?.email}</strong>
            </p>
            <div className="field">
              <label className="label">Correo nuevo</label>
              <input className="input" type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} required />
            </div>
            <div className="field">
              <label className="label">Confirma tu contraseña actual</label>
              <input className="input" type="password" value={emailPassword} onChange={(e) => setEmailPassword(e.target.value)} required />
            </div>
            {emailMsg && (
              <p className="error-text" style={emailMsg.type === 'ok' ? { color: 'var(--success)' } : undefined}>
                {emailMsg.text}
              </p>
            )}
            <button className="btn btn-primary btn-block" type="submit" disabled={savingEmail}>
              {savingEmail ? 'Enviando…' : 'Cambiar correo'}
            </button>
          </form>
        )}

        {tab === 'contrasena' && (
          <form onSubmit={handleChangePassword}>
            <div className="field">
              <label className="label">Contraseña actual</label>
              <input className="input" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
            </div>
            <div className="field">
              <label className="label">Contraseña nueva</label>
              <input className="input" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
            </div>
            <div className="field">
              <label className="label">Confirmar contraseña nueva</label>
              <input className="input" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
            </div>
            {passwordMsg && (
              <p className="error-text" style={passwordMsg.type === 'ok' ? { color: 'var(--success)' } : undefined}>
                {passwordMsg.text}
              </p>
            )}
            <button className="btn btn-primary btn-block" type="submit" disabled={savingPassword}>
              {savingPassword ? 'Guardando…' : 'Cambiar contraseña'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
