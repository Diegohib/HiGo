import { useState } from 'react';
import { useFaqStore } from '../store/faqStore';

export default function PreguntasPage() {
  const { faqs, loaded, seedFaqs, deleteFaq } = useFaqStore();
  const [seeding, setSeeding] = useState(false);

  async function handleSeed() {
    setSeeding(true);
    try {
      await seedFaqs();
    } catch (err) {
      console.error('[PreguntasPage] seed error:', err);
      alert('No se pudieron importar las preguntas frecuentes.');
    } finally {
      setSeeding(false);
    }
  }

  async function handleDelete(id: string, question: string) {
    if (!confirm(`¿Eliminar "${question}"?`)) return;
    await deleteFaq(id);
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Preguntas frecuentes ({faqs.length})</h1>
      </div>

      {loaded && faqs.length === 0 ? (
        <div className="empty-box">
          <p className="empty-title">Todavía no hay preguntas frecuentes</p>
          <p>Importa las preguntas iniciales para que el Asistente HiGo pueda responderlas.</p>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={handleSeed} disabled={seeding}>
            {seeding ? 'Importando…' : 'Importar preguntas frecuentes'}
          </button>
        </div>
      ) : (
        <div className="list">
          <button
            className="btn btn-ghost btn-sm"
            style={{ alignSelf: 'flex-start', borderStyle: 'dashed' }}
            onClick={handleSeed}
            disabled={seeding}
          >
            {seeding ? 'Actualizando…' : 'Actualizar con las preguntas por defecto'}
          </button>

          {faqs.map((f) => (
            <div className="row-card" key={f.id}>
              <div className="row-icon">?</div>
              <div className="row-info">
                <p className="row-title">{f.question}</p>
                <p className="row-sub" style={{ whiteSpace: 'normal' }}>{f.answer}</p>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(f.id, f.question)}>
                Eliminar
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
