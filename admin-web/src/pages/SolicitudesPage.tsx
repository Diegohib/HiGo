import { useMemo, useState } from 'react';
import { useSolicitudesStore } from '../store/solicitudesStore';
import { REJECTION_REASONS, RejectionReason, Solicitud, SolicitudRole } from '../types';

const ROLE_LABEL: Record<SolicitudRole, string> = {
  cochero: 'Cochero',
  transportista: 'Transportista',
  comerciante: 'Comerciante',
};

// Mismas etiquetas que usa StaffRegisterScreen.tsx del lado móvil para estos
// campos — así se leen igual en vez de mostrar la clave cruda del objeto.
const EXTRA_FIELD_LABEL: Record<string, string> = {
  cedula: 'Cédula',
  numCoche: 'N° de coche',
  giro: 'Giro',
  stallNumber: 'N° de puesto',
  edad: 'Edad',
};

type FilterTab = 'todos' | SolicitudRole;

export default function SolicitudesPage() {
  const { solicitudes, aprobar, rechazar, hasMore, loadMore } = useSolicitudesStore();
  const [filter, setFilter] = useState<FilterTab>('todos');
  const [rejectTarget, setRejectTarget] = useState<Solicitud | null>(null);
  const [reason, setReason] = useState<RejectionReason | null>(null);
  const [viewingPhoto, setViewingPhoto] = useState<{ label: string; url: string } | null>(null);

  const pendientes = solicitudes.filter((s) => s.status === 'pendiente').length;
  const aprobadas = solicitudes.filter((s) => s.status === 'aprobada').length;
  const rechazadas = solicitudes.filter((s) => s.status === 'rechazada').length;

  const visible = useMemo(
    () => solicitudes.filter((s) => (filter === 'todos' ? true : s.role === filter)),
    [solicitudes, filter]
  );

  async function handleAprobar(sol: Solicitud) {
    if (!confirm(`¿Aprobar a ${sol.name} como ${ROLE_LABEL[sol.role]}?`)) return;
    await aprobar(sol.id);
  }

  async function handleConfirmRechazo() {
    if (!rejectTarget || !reason) return;
    await rechazar(rejectTarget.id, reason);
    setRejectTarget(null);
    setReason(null);
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Solicitudes de personal</h1>
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-num">{pendientes}</div>
          <div className="stat-label">Pendientes</div>
        </div>
        <div className="stat-card">
          <div className="stat-num">{aprobadas}</div>
          <div className="stat-label">Aprobadas</div>
        </div>
        <div className="stat-card">
          <div className="stat-num">{rechazadas}</div>
          <div className="stat-label">Rechazadas</div>
        </div>
      </div>

      <div className="tabs">
        {(['todos', 'cochero', 'transportista', 'comerciante'] as FilterTab[]).map((f) => (
          <button
            key={f}
            className={`tab-btn${filter === f ? ' active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f === 'todos' ? 'Todos' : ROLE_LABEL[f]}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="empty-box">
          <p className="empty-title">Sin solicitudes</p>
          <p>No hay solicitudes que coincidan con este filtro.</p>
        </div>
      ) : (
        <div className="list">
          {visible.map((sol) => (
            <div className="card" key={sol.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                <div>
                  <p className="row-title">{sol.name} · {ROLE_LABEL[sol.role]}</p>
                  <p className="row-sub" style={{ whiteSpace: 'normal' }}>
                    {sol.phone}{sol.email ? ` · ${sol.email}` : ''}
                  </p>
                  {Object.entries(sol.extraData || {}).length > 0 && (
                    <p className="row-sub" style={{ whiteSpace: 'normal', marginTop: 4 }}>
                      {Object.entries(sol.extraData)
                        .map(([k, v]) => `${EXTRA_FIELD_LABEL[k] ?? k}: ${v}`)
                        .join(' · ')}
                    </p>
                  )}
                  <p className="row-sub" style={{ marginTop: 4 }}>
                    Solicitado el {sol.requestedAt.toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <span className={`badge badge-${sol.status}`}>
                  {sol.status === 'pendiente' ? 'Pendiente' : sol.status === 'aprobada' ? 'Aprobada' : 'Rechazada'}
                </span>
              </div>

              {sol.photoUris && Object.keys(sol.photoUris).length > 0 && (
                <div className="doc-thumb-row">
                  {Object.entries(sol.photoUris).map(([label, url]) => (
                    <button
                      key={label}
                      type="button"
                      className="doc-thumb"
                      onClick={() => setViewingPhoto({ label, url })}
                      title={`Ver ${label}`}
                    >
                      <img src={url} alt={label} />
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
              )}

              {sol.status === 'rechazada' && sol.rejectionReason && (
                <p className="error-text" style={{ marginTop: 10 }}>Motivo: {sol.rejectionReason}</p>
              )}

              {sol.status === 'pendiente' && (
                <div className="actions-row">
                  <button className="btn btn-success btn-sm" onClick={() => handleAprobar(sol)}>Aprobar</button>
                  <button className="btn btn-danger btn-sm" onClick={() => { setRejectTarget(sol); setReason(null); }}>
                    Rechazar
                  </button>
                </div>
              )}
            </div>
          ))}

          {hasMore && filter === 'todos' && (
            <button className="btn btn-ghost btn-block" onClick={loadMore}>
              Cargar más solicitudes
            </button>
          )}
        </div>
      )}

      {rejectTarget && (
        <div className="modal-overlay" onClick={() => setRejectTarget(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Rechazar a {rejectTarget.name}</h2>
              <button className="close-btn" onClick={() => setRejectTarget(null)} aria-label="Cerrar">×</button>
            </div>
            <p className="label">Motivo</p>
            <div className="chip-row" style={{ marginBottom: 20 }}>
              {REJECTION_REASONS.map((r) => (
                <button
                  key={r}
                  className={`chip${reason === r ? ' active' : ''}`}
                  onClick={() => setReason(r)}
                  type="button"
                >
                  {r}
                </button>
              ))}
            </div>
            <div className="actions-row">
              <button className="btn btn-ghost" onClick={() => setRejectTarget(null)}>Cancelar</button>
              <button className="btn btn-danger" disabled={!reason} onClick={handleConfirmRechazo}>
                Confirmar rechazo
              </button>
            </div>
          </div>
        </div>
      )}

      {viewingPhoto && (
        <div className="modal-overlay" onClick={() => setViewingPhoto(null)}>
          <div className="modal-card doc-viewer-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{viewingPhoto.label}</h2>
              <button className="close-btn" onClick={() => setViewingPhoto(null)} aria-label="Cerrar">×</button>
            </div>
            <img src={viewingPhoto.url} alt={viewingPhoto.label} className="doc-viewer-img" />
          </div>
        </div>
      )}
    </div>
  );
}
