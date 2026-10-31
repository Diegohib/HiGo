import { useNavigate } from 'react-router-dom';
import { ClipboardList, Package, MessageCircle, CreditCard, ArrowUpRight, Sparkles, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useSolicitudesStore } from '../store/solicitudesStore';
import { useOrdersStore } from '../store/ordersStore';
import { useChatStore } from '../store/chatStore';
import { formatFullDate, greetingPrefix, isSameDay, startOfWeek } from '../utils';

type StatCard = {
  icon: typeof ClipboardList;
  tone: 'primary' | 'danger' | 'info' | 'teal' | 'warning' | 'success';
  value: string;
  label: string;
  to: string;
  needsAttention: boolean;
};

// Inicio se limita a lo que necesita atención hoy (solicitudes, chats,
// pedidos, ingresos) — el catálogo y las preguntas frecuentes ya tienen su
// propio link en el menú y no son cosas que cambien día a día, así que
// mostrarlas acá solo repetía el menú sin agregar nada nuevo.

export default function InicioPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const solicitudes = useSolicitudesStore((s) => s.solicitudes);
  const orders = useOrdersStore((s) => s.orders);
  const threads = useChatStore((s) => s.threads);

  const pendientes = solicitudes.filter((s) => s.status === 'pendiente');
  const pedidosHoy = orders.filter((o) => isSameDay(new Date(o.createdAt), new Date()));
  const chatsSinResponder = threads.filter((t) => t.unreadByAdmin);

  const weekStart = startOfWeek(new Date()).getTime();
  const ingresosSemana = orders
    .filter((o) => o.createdAt >= weekStart)
    .reduce((sum, o) => sum + o.total, 0);

  const cards: StatCard[] = [
    { icon: ClipboardList, tone: 'danger',  value: String(pendientes.length),        label: 'Solicitudes por revisar', to: '/solicitudes', needsAttention: pendientes.length > 0 },
    { icon: MessageCircle, tone: 'teal',    value: String(chatsSinResponder.length), label: 'Chats sin responder',     to: '/chats',        needsAttention: chatsSinResponder.length > 0 },
    { icon: Package,       tone: 'info',    value: String(pedidosHoy.length),        label: 'Pedidos entrantes hoy',   to: '/pedidos',      needsAttention: false },
    { icon: CreditCard,    tone: 'success', value: `$${ingresosSemana.toFixed(2)}`,  label: 'Ingresos esta semana',    to: '/finanzas',     needsAttention: false },
  ];

  const pendingCount = cards.filter((c) => c.needsAttention).length;

  const firstName = user?.name?.split(' ')[0] ?? '';

  return (
    <div>
      <div className="hero-banner">
        <div className="hero-blob" />
        <div className="hero-ring" />
        <div className="hero-eyebrow">
          {pendingCount > 0
            ? <><Sparkles size={13} /> {pendingCount} {pendingCount === 1 ? 'cosa necesita' : 'cosas necesitan'} tu atención</>
            : <><CheckCircle2 size={13} /> Todo al día</>}
        </div>
        <h1 className="hero-title">{greetingPrefix()}{firstName ? `, ${firstName}` : ''}</h1>
        <p className="hero-sub">
          {formatFullDate(new Date())} — esto es lo que está pasando en HiGo.
        </p>
      </div>

      <div className="stat-grid stat-grid-4">
        {cards.map((c) => (
          <button
            key={c.label}
            className={`stat-tile tone-${c.tone}${c.needsAttention ? ' is-attention' : ''}`}
            onClick={() => navigate(c.to)}
          >
            <div className="stat-tile-top">
              <div className={`stat-tile-icon tone-${c.tone}`}>
                <c.icon size={19} strokeWidth={2.25} />
              </div>
              {c.needsAttention ? (
                <span className="stat-tile-pill">Pendiente</span>
              ) : (
                <ArrowUpRight size={16} className="stat-tile-arrow" />
              )}
            </div>
            <div className="stat-tile-value">{c.value}</div>
            <div className="stat-tile-label">{c.label}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
