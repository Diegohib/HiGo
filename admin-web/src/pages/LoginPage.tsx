import { FormEvent, useState } from 'react';
import { ArrowLeft, Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export default function LoginPage() {
  const login = useAuthStore((s) => s.login);
  const resetPassword = useAuthStore((s) => s.resetPassword);
  const error = useAuthStore((s) => s.error);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [resetMode, setResetMode] = useState(false);
  const [resetSubmitting, setResetSubmitting] = useState(false);
  const [resetMsg, setResetMsg] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await login(email.trim().toLowerCase(), password);
    } catch {
      // el mensaje ya queda en authStore.error
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReset(e: FormEvent) {
    e.preventDefault();
    setResetSubmitting(true);
    setResetMsg(null);
    try {
      await resetPassword(email.trim().toLowerCase());
      setResetMsg('Si ese correo tiene una cuenta, te enviamos un enlace para restablecer la contraseña.');
    } catch {
      setResetMsg('Si ese correo tiene una cuenta, te enviamos un enlace para restablecer la contraseña.');
    } finally {
      setResetSubmitting(false);
    }
  }

  return (
    <div className="auth-screen">
    <div className="auth-card">
      <div className="auth-brand">
        <div className="auth-blob auth-blob-1" />
        <div className="auth-blob auth-blob-2" />
        <div className="auth-brand-content">
          <div className="auth-badge">
            <img src="/logo.png" alt="HiGo" className="auth-badge-img" />
          </div>
          <p className="auth-wordmark">HiGo <span>Admin</span></p>
          <p className="auth-tagline">
            Todo lo que pasa en el mercado, en un solo lugar: catálogo, solicitudes,
            pedidos y soporte a tus clientes.
          </p>
        </div>
      </div>

      <div className="auth-form-panel">
        {resetMode ? (
          <form className="auth-form" onSubmit={handleReset}>
            <button type="button" className="auth-back" onClick={() => { setResetMode(false); setResetMsg(null); }}>
              <ArrowLeft size={15} /> Volver al login
            </button>

            <h1 className="auth-title">Recuperar acceso</h1>
            <p className="auth-sub">Ingresa tu correo y te mandamos un enlace para restablecer la contraseña.</p>

            <div className="field">
              <label className="label" htmlFor="reset-email">Correo electrónico</label>
              <div className="input-icon-wrap">
                <Mail size={16} />
                <input
                  id="reset-email"
                  className="input-plain"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            {resetMsg && <p className="error-text" style={{ color: 'var(--success)' }}>{resetMsg}</p>}

            <button className="btn btn-primary btn-block" type="submit" disabled={resetSubmitting}>
              {resetSubmitting ? 'Enviando…' : 'Enviar enlace'}
            </button>
          </form>
        ) : (
          <form className="auth-form" onSubmit={handleSubmit}>
            <h1 className="auth-title">Bienvenido de nuevo</h1>
            <p className="auth-sub">Inicia sesión con tu cuenta de administrador</p>

            <div className="field">
              <label className="label" htmlFor="email">Correo electrónico</label>
              <div className="input-icon-wrap">
                <Mail size={16} />
                <input
                  id="email"
                  className="input-plain"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="field">
              <label className="label" htmlFor="password">Contraseña</label>
              <div className="input-icon-wrap">
                <Lock size={16} />
                <input
                  id="password"
                  className="input-plain"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="input-icon-btn"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && <p className="error-text">{error}</p>}

            <button className="btn btn-primary btn-block" type="submit" disabled={submitting}>
              {submitting ? 'Ingresando…' : 'Iniciar sesión'}
            </button>

            <button type="button" className="auth-link" onClick={() => setResetMode(true)}>
              ¿Olvidaste tu contraseña?
            </button>
          </form>
        )}
      </div>
    </div>
    </div>
  );
}
