import { useEffect, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  Bell, CreditCard, HelpCircle, Home, LogOut, MessageCircle, Moon, Package, Sun, Tags, ClipboardList,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useChatStore } from '../store/chatStore';
import { useThemeStore } from '../store/themeStore';
import ProfileModal from './ProfileModal';
import CommandPalette from './CommandPalette';

const NAV_GROUPS = [
  {
    label: 'Principal',
    links: [{ to: '/inicio', label: 'Inicio', icon: Home }],
  },
  {
    label: 'Operaciones',
    links: [
      { to: '/catalogo', label: 'Catálogo', icon: Tags },
      { to: '/solicitudes', label: 'Solicitudes', icon: ClipboardList },
      { to: '/pedidos', label: 'Pedidos', icon: Package },
      { to: '/finanzas', label: 'Finanzas', icon: CreditCard },
    ],
  },
  {
    label: 'Soporte',
    links: [
      { to: '/chats', label: 'Chats', icon: MessageCircle },
      { to: '/preguntas', label: 'Preguntas frecuentes', icon: HelpCircle },
    ],
  },
];

export default function Layout() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const unreadChats = useChatStore((s) => s.threads.filter((t) => t.unreadByAdmin).length);
  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);
  const [now, setNow] = useState(new Date());
  const [showProfile, setShowProfile] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  const initial = (user?.name || user?.email || '?').charAt(0).toUpperCase();

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <img src="/logo.png" alt="" className="sidebar-logo-img" />
          <p>HiGo <span>ADMIN</span></p>
        </div>

        <nav className="sidebar-nav">
          {NAV_GROUPS.map((group) => (
            <div className="sidebar-group" key={group.label}>
              <p className="sidebar-group-label">{group.label}</p>
              {group.links.map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
                >
                  <l.icon size={17} strokeWidth={2} />
                  {l.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-profile">
            <div className="sidebar-avatar">{initial}</div>
            <div className="sidebar-profile-info">
              <p className="sidebar-name">{user?.name || 'Admin'}</p>
              <p className="sidebar-role">Administrador</p>
            </div>
          </div>
          <button className="btn btn-ghost btn-sm btn-block" onClick={() => logout()}>
            <LogOut size={15} /> Cerrar sesión
          </button>
        </div>
      </aside>

      <div className="main-col">
        <header className="topbar">
          <CommandPalette />
          <div className="topbar-right">
            <div className="topbar-clock">
              <span className="topbar-time">
                {now.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}
              </span>
              <span className="topbar-date">
                {now.toLocaleDateString('es-EC', { weekday: 'short', day: '2-digit', month: 'short' })}
              </span>
            </div>
            <button
              className="icon-btn"
              onClick={toggleTheme}
              aria-label={theme === 'light' ? 'Activar modo oscuro' : 'Activar modo claro'}
              title={theme === 'light' ? 'Modo oscuro' : 'Modo claro'}
            >
              {theme === 'light' ? <Moon size={17} /> : <Sun size={17} />}
            </button>
            <button className="icon-btn topbar-bell" aria-label={`Notificaciones${unreadChats > 0 ? ` (${unreadChats} sin leer)` : ''}`}>
              <Bell size={18} />
              {unreadChats > 0 && <span className="topbar-bell-dot" />}
            </button>
            <button className="topbar-avatar" onClick={() => setShowProfile(true)} title="Mi perfil" aria-label="Mi perfil">
              {initial}
            </button>
          </div>
        </header>

        <main className="content">
          <Outlet />
        </main>
      </div>

      {showProfile && <ProfileModal onClose={() => setShowProfile(false)} />}
    </div>
  );
}
