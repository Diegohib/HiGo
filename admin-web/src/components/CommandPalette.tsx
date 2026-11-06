import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Tags, Package, ClipboardList, CornerDownLeft } from 'lucide-react';
import { useProductsStore } from '../store/productsStore';
import { useOrdersStore } from '../store/ordersStore';
import { useSolicitudesStore } from '../store/solicitudesStore';
import { ORDER_STATUS_LABEL } from '../types';

type ResultGroup = {
  key: string;
  label: string;
  icon: typeof Tags;
  items: { id: string; title: string; subtitle: string }[];
};

const ROLE_LABEL: Record<string, string> = { cochero: 'Cochero', transportista: 'Transportista', comerciante: 'Comerciante' };

export default function CommandPalette() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const products = useProductsStore((s) => s.products);
  const orders = useOrdersStore((s) => s.orders);
  const clientNames = useOrdersStore((s) => s.clientNames);
  const solicitudes = useSolicitudesStore((s) => s.solicitudes);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
      } else if (e.key === 'Escape') {
        setOpen(false);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    if (open) {
      setQuery('');
      // Espera al frame siguiente: recién montado el input todavía no está listo.
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const groups: ResultGroup[] = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const productMatches = products
      .filter((p) => p.name.toLowerCase().includes(q) || p.subcategory.toLowerCase().includes(q))
      .slice(0, 5)
      .map((p) => ({ id: p.id, title: `${p.emoji} ${p.name}`, subtitle: p.subcategory }));

    const orderMatches = orders
      .filter((o) => {
        const client = (clientNames[o.uid] ?? '').toLowerCase();
        return o.id.toLowerCase().includes(q) || client.includes(q) || o.address.toLowerCase().includes(q);
      })
      .slice(0, 5)
      .map((o) => ({
        id: o.id,
        title: clientNames[o.uid] ?? 'Cliente',
        subtitle: `${ORDER_STATUS_LABEL[o.status]} · ${o.address}`,
      }));

    const solicitudMatches = solicitudes
      .filter((s) =>
        s.name.toLowerCase().includes(q) ||
        s.role.toLowerCase().includes(q) ||
        s.phone.includes(q) ||
        (s.email ?? '').toLowerCase().includes(q)
      )
      .slice(0, 5)
      .map((s) => ({ id: s.id, title: s.name, subtitle: ROLE_LABEL[s.role] ?? s.role }));

    const result: ResultGroup[] = [];
    if (productMatches.length) result.push({ key: 'productos', label: 'Catálogo', icon: Tags, items: productMatches });
    if (orderMatches.length) result.push({ key: 'pedidos', label: 'Pedidos', icon: Package, items: orderMatches });
    if (solicitudMatches.length) result.push({ key: 'solicitudes', label: 'Solicitudes', icon: ClipboardList, items: solicitudMatches });
    return result;
  }, [query, products, orders, clientNames, solicitudes]);

  const hasQuery = query.trim().length > 0;
  const hasResults = groups.length > 0;

  function goTo(path: string) {
    setOpen(false);
    navigate(path);
  }

  return (
    <>
      <button className="cmdk-trigger" onClick={() => setOpen(true)} aria-label="Buscar">
        <Search size={16} />
        <span>Buscar productos, pedidos, solicitudes…</span>
        <span className="cmdk-kbd">Ctrl K</span>
      </button>

      {open && (
        <div className="cmdk-overlay" onClick={() => setOpen(false)}>
          <div className="cmdk-panel" onClick={(e) => e.stopPropagation()}>
            <div className="cmdk-input-row">
              <Search size={18} className="cmdk-input-icon" />
              <input
                ref={inputRef}
                className="cmdk-input"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar productos, pedidos, solicitudes…"
              />
              <span className="cmdk-kbd">Esc</span>
            </div>

            <div className="cmdk-results">
              {!hasQuery && (
                <p className="cmdk-empty">Empieza a escribir para buscar en todo HiGo.</p>
              )}
              {hasQuery && !hasResults && (
                <p className="cmdk-empty">Sin resultados para "{query}".</p>
              )}
              {groups.map((g) => (
                <div key={g.key} className="cmdk-group">
                  <p className="cmdk-group-label"><g.icon size={12} /> {g.label}</p>
                  {g.items.map((item) => (
                    <button
                      key={item.id}
                      className="cmdk-item"
                      onClick={() => goTo(`/${g.key}`)}
                    >
                      <span className="cmdk-item-title">{item.title}</span>
                      <span className="cmdk-item-sub">{item.subtitle}</span>
                      <CornerDownLeft size={13} className="cmdk-item-go" />
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
