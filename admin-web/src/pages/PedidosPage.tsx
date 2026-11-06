import { useState } from 'react';
import { useOrdersStore } from '../store/ordersStore';
import { Order, ORDER_STATUS_LABEL, OrderStatus, PAYMENT_STATUS_LABEL, needsRefund } from '../types';

// 'pagos' = transferencias esperando que el admin revise el comprobante.
// 'devolver' = cancelados con la transferencia ya confirmada.
type FilterTab = 'todos' | 'pagos' | 'devolver' | OrderStatus;

const TABS: FilterTab[] = ['todos', 'pagos', 'devolver', 'recibido', 'en_mercado', 'consolidado', 'en_camino', 'entregado', 'cancelado'];

export default function PedidosPage() {
  const { orders, loaded, hasMore, clientNames, loadMore, confirmarPago, rechazarPago, cancelarPedido, marcarReembolsado } = useOrdersStore();
  const [filter, setFilter] = useState<FilterTab>('todos');
  const [busy, setBusy] = useState<string | null>(null);

  const porVerificar = orders.filter((o) => o.paymentStatus === 'por_verificar' && o.status !== 'cancelado');
  const porDevolver  = orders.filter(needsRefund);
  const visible =
    filter === 'todos' ? orders :
    filter === 'pagos' ? porVerificar :
    filter === 'devolver' ? porDevolver :
    orders.filter((o) => o.status === filter);

  async function handleCancelar(o: Order) {
    const msg = o.paymentStatus === 'verificado'
      ? `¿Cancelar este pedido? Ya pagó ${o.total.toFixed(2)} por transferencia: queda en "Por devolver".`
      : '¿Cancelar este pedido? Los puestos, el cochero y el transportista dejan de verlo.';
    if (!confirm(msg)) return;
    setBusy(o.id);
    try {
      await cancelarPedido(o.id);
    } catch (err) {
      console.error('[PedidosPage] cancelar:', err);
      alert('No se pudo cancelar el pedido. Intenta de nuevo.');
    } finally {
      setBusy(null);
    }
  }

  async function handleReembolso(o: Order) {
    if (!confirm(`¿Ya le devolviste ${o.total.toFixed(2)} al cliente?`)) return;
    setBusy(o.id);
    try {
      await marcarReembolsado(o.id);
    } catch (err) {
      console.error('[PedidosPage] reembolso:', err);
      alert('No se pudo guardar. Intenta de nuevo.');
    } finally {
      setBusy(null);
    }
  }

  async function handlePago(o: Order, accion: 'confirmar' | 'rechazar') {
    const msg = accion === 'confirmar'
      ? `¿Confirmas que recibiste $${o.total.toFixed(2)}? El pedido pasa a los comerciantes y al cochero.`
      : '¿Rechazar este pago? El pedido queda detenido y el cliente ve que no se pudo confirmar.';
    if (!confirm(msg)) return;
    setBusy(o.id);
    try {
      if (accion === 'confirmar') await confirmarPago(o.id);
      else await rechazarPago(o.id);
    } catch (err) {
      console.error('[PedidosPage] pago:', err);
      alert('No se pudo actualizar el pago. Intenta de nuevo.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Pedidos ({orders.length}{hasMore ? '+' : ''})</h1>
      </div>

      <div className="tabs">
        {TABS.map((t) => (
          <button key={t} className={`tab-btn${filter === t ? ' active' : ''}`} onClick={() => setFilter(t)}>
            {t === 'todos' ? 'Todos'
              : t === 'pagos' ? `Pagos por verificar (${porVerificar.length})`
              : t === 'devolver' ? `Por devolver (${porDevolver.length})`
              : ORDER_STATUS_LABEL[t]}
          </button>
        ))}
      </div>

      {loaded && visible.length === 0 ? (
        <div className="empty-box">
          <p className="empty-title">
            {filter === 'pagos' ? 'No hay pagos por verificar' : filter === 'devolver' ? 'No hay dinero por devolver' : 'Sin pedidos'}
          </p>
          <p>Todavía no hay pedidos que coincidan con este filtro.</p>
        </div>
      ) : (
        <div className="list">
          {visible.map((o) => (
            <div className="card" key={o.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <div>
                  <p className="row-title">{clientNames[o.uid] ?? 'Cliente'}</p>
                  <p className="row-sub" style={{ whiteSpace: 'normal' }}>{o.address}</p>
                  <p className="row-sub" style={{ whiteSpace: 'normal', marginTop: 4 }}>
                    {o.items.length} producto{o.items.length !== 1 ? 's' : ''}
                    {' · '}
                    {o.operatorRole === 'transportista'
                      ? 'Entrega directa'
                      : o.deliveryType === 'directa' ? 'Lo antes posible' : 'Programada'}
                  </p>
                  <p className="row-sub" style={{ whiteSpace: 'normal', marginTop: 4 }}>
                    {o.operatorRole === 'cochero' && `Cochero: ${o.operatorName || 'sin asignar'}`}
                    {o.operatorRole === 'cochero' && ' · '}
                    {`Transportista: ${o.transportistaName || 'sin asignar'}`}
                  </p>
                  <p className="row-sub" style={{ marginTop: 4 }}>
                    {new Date(o.createdAt).toLocaleString('es-EC', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p className="row-title">${o.total.toFixed(2)}</p>
                  <span className={`badge badge-${
                    o.status === 'cancelado' ? 'rechazada' : o.status === 'recibido' ? 'pendiente' : 'aprobada'
                  }`}>
                    {ORDER_STATUS_LABEL[o.status]}
                    {o.status === 'cancelado' && o.cancelledBy && ` por ${o.cancelledBy === 'cliente' ? 'el cliente' : 'admin'}`}
                  </span>
                  {o.paymentStatus && (
                    <div style={{ marginTop: 6 }}>
                      <span className={`badge badge-${
                        o.paymentStatus === 'rechazado' ? 'rechazada' :
                        o.paymentStatus === 'por_verificar' || o.paymentStatus === 'contra_entrega' || needsRefund(o) ? 'pendiente' : 'aprobada'
                      }`}>
                        {needsRefund(o) ? 'Por devolver' : PAYMENT_STATUS_LABEL[o.paymentStatus]}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {o.status !== 'cancelado' && o.paymentMethod === 'transferencia' && (o.paymentStatus === 'por_verificar' || o.paymentStatus === 'rechazado') && (
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                  <span className="row-sub">
                    Comprobante N° <strong>{o.paymentRef || '—'}</strong>
                  </span>
                  {o.receiptUrl ? (
                    <a className="btn btn-ghost btn-sm" href={o.receiptUrl} target="_blank" rel="noreferrer">
                      Ver foto
                    </a>
                  ) : (
                    <span className="row-sub">(sin foto)</span>
                  )}
                  <div style={{ flex: 1 }} />
                  {o.paymentStatus === 'por_verificar' && (
                    <button className="btn btn-ghost btn-sm" disabled={busy === o.id} onClick={() => handlePago(o, 'rechazar')}>
                      Rechazar
                    </button>
                  )}
                  <button className="btn btn-success btn-sm" disabled={busy === o.id} onClick={() => handlePago(o, 'confirmar')}>
                    {busy === o.id ? 'Guardando…' : 'Confirmar pago'}
                  </button>
                </div>
              )}

              {needsRefund(o) && (
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                  <span className="row-sub">
                    Devolver <strong>${o.total.toFixed(2)}</strong> · comprobante N° {o.paymentRef || '—'}
                  </span>
                  <div style={{ flex: 1 }} />
                  <button className="btn btn-success btn-sm" disabled={busy === o.id} onClick={() => handleReembolso(o)}>
                    {busy === o.id ? 'Guardando…' : 'Marcar devuelto'}
                  </button>
                </div>
              )}

              {o.status !== 'cancelado' && o.status !== 'entregado' && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
                  <button className="btn btn-ghost btn-sm" disabled={busy === o.id} onClick={() => handleCancelar(o)}>
                    Cancelar pedido
                  </button>
                </div>
              )}
            </div>
          ))}

          {hasMore && filter === 'todos' && (
            <button className="btn btn-ghost btn-block" onClick={loadMore}>
              Cargar más pedidos
            </button>
          )}
        </div>
      )}
    </div>
  );
}
