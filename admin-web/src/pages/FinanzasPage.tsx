import { useEffect, useMemo, useState } from 'react';
import { collection, onSnapshot, orderBy, query, Timestamp, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Order } from '../types';
import { buildWeeks, WeekFinance } from '../finance';
import { startOfWeek } from '../utils';
import BankDetailsCard from '../components/BankDetailsCard';

const WEEKS = 8;

// Pedidos de las últimas 8 semanas con su propia consulta: la lista de
// Pedidos solo trae los 100 más recientes y acá no puede faltar ninguno.
function useOrdersSince(since: Date) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loaded, setLoaded] = useState(false);
  const sinceMs = since.getTime();

  useEffect(() => {
    return onSnapshot(
      query(
        collection(db, 'orders'),
        where('createdAt', '>=', Timestamp.fromMillis(sinceMs)),
        orderBy('createdAt', 'desc'),
      ),
      (snap) => {
        setOrders(snap.docs.map((d) => {
          const data = d.data();
          return {
            ...data,
            id: d.id,
            createdAt: (data.createdAt as Timestamp | undefined)?.toMillis() ?? Date.now(),
          } as Order;
        }));
        setLoaded(true);
      },
    );
  }, [sinceMs]);

  return { orders, loaded };
}

function money(n: number) {
  return `$${n.toFixed(2)}`;
}

function nextFriday(): Date {
  const d = new Date();
  d.setDate(d.getDate() + ((5 - d.getDay() + 7) % 7));
  return d;
}

export default function FinanzasPage() {
  const since = useMemo(() => {
    const d = startOfWeek(new Date());
    d.setDate(d.getDate() - 7 * (WEEKS - 1));
    return d;
  }, []);
  const { orders, loaded } = useOrdersSince(since);
  const weeks = useMemo(() => buildWeeks(orders, WEEKS), [orders]);
  const [open, setOpen] = useState<string | null>(null);

  const current = weeks[0];
  const history = weeks.slice(1);
  const aPagar = current.toComerciantes + current.toCocheros + current.toTransportistas;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Finanzas</h1>
        <span style={{ color: 'var(--text-soft)', fontSize: 13 }}>
          Próximo pago: viernes {nextFriday().toLocaleDateString('es-EC', { day: 'numeric', month: 'short' })}
        </span>
      </div>

      {!loaded ? (
        <p style={{ color: 'var(--text-faint)' }}>Cargando…</p>
      ) : (
        <>
          <div className="stats-row">
            <div className="stat-card">
              <div className="stat-num">{money(current.totalIncome)}</div>
              <div className="stat-label">Cobrado esta semana</div>
            </div>
            <div className="stat-card">
              <div className="stat-num">{money(aPagar)}</div>
              <div className="stat-label">A pagar el viernes</div>
            </div>
            <div className="stat-card">
              <div className="stat-num" style={{ color: current.higoNet >= 0 ? undefined : 'var(--danger-text)' }}>
                {money(current.higoNet)}
              </div>
              <div className="stat-label">Ganancia HiGo</div>
            </div>
          </div>

          <h2 style={{ fontSize: 16, margin: '20px 0 10px' }}>Semana actual · {current.weekLabel}</h2>
          <WeekDetail week={current} />

          <h2 style={{ fontSize: 16, margin: '24px 0 10px' }}>Semanas anteriores</h2>
          <div className="list">
            {history.map((w) => (
              <div key={w.id}>
                <div className="row-card" style={{ cursor: 'pointer' }} onClick={() => setOpen(open === w.id ? null : w.id)}>
                  <div className="row-info">
                    <p className="row-title">{w.weekLabel}</p>
                    <p className="row-sub">{w.ordersCount} pedido{w.ordersCount !== 1 ? 's' : ''} entregado{w.ordersCount !== 1 ? 's' : ''}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p className="row-title">{money(w.totalIncome)}</p>
                    <p className="row-sub">HiGo {money(w.higoNet)}</p>
                  </div>
                </div>
                {open === w.id && <div style={{ marginTop: 8 }}><WeekDetail week={w} /></div>}
              </div>
            ))}
          </div>

          <div style={{ marginTop: 24 }}>
            <BankDetailsCard />
          </div>

          <div className="card" style={{ color: 'var(--text-soft)', marginTop: 20, fontSize: 13 }}>
            Solo cuentan los pedidos entregados. El cliente paga productos + 7 % de gestión + envío: los productos
            van a cada comerciante, el envío completo al transportista, y del 7 % se le paga al cochero ($1 a $6
            según el valor de los productos); lo que sobra es de HiGo.
          </div>
        </>
      )}
    </div>
  );
}

function WeekDetail({ week }: { week: WeekFinance }) {
  const rows: [string, number][] = [
    ['Comerciantes (productos)', week.toComerciantes],
    ['Transportistas (envío)', week.toTransportistas],
    ['Cocheros (del 7 %)', week.toCocheros],
  ];
  return (
    <div className="card">
      <p style={{ margin: '0 0 10px', color: 'var(--text-soft)', fontSize: 13 }}>
        {week.ordersCount} entregados
        {week.inProgressCount > 0 && ` · ${week.inProgressCount} en curso (todavía no cuentan)`}
        {week.legacyCount > 0 && ` · ${week.legacyCount} sin desglose (pedidos de antes del cambio: todo contado como productos)`}
      </p>
      <Row label="Cobrado a clientes" value={week.totalIncome} bold />
      <hr style={{ border: 0, borderTop: '1px solid var(--border)', margin: '10px 0' }} />
      {rows.map(([l, v]) => <Row key={l} label={l} value={v} />)}
      {week.cashCollected > 0 && (
        <>
          <hr style={{ border: 0, borderTop: '1px solid var(--border)', margin: '10px 0' }} />
          <Row label="Efectivo que ya tienen los transportistas" value={week.cashCollected} />
          <p style={{ margin: '2px 0 0', color: 'var(--text-faint)', fontSize: 12 }}>
            Lo cobraron al entregar: se descuenta de lo que se les paga el viernes.
          </p>
        </>
      )}
      <hr style={{ border: 0, borderTop: '1px solid var(--border)', margin: '10px 0' }} />
      <Row label="Gestión 7 %" value={week.higoGross} />
      <Row label="− Pago a cocheros" value={-week.toCocheros} />
      <Row label="Ganancia HiGo" value={week.higoNet} bold />
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: number; bold?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontWeight: bold ? 700 : 400 }}>
      <span>{label}</span>
      <span>{money(value)}</span>
    </div>
  );
}
