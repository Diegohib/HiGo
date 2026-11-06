import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { useProductsStore } from '../store/productsStore';
import { useComerciantesStore, Comerciante } from '../store/comerciantesStore';
import { Category, Presentation, Product } from '../types';

type Tab = 'productos' | 'categorias';

export default function CatalogoPage() {
  const {
    products, categories, loaded, seedInitialCatalog,
    addProduct, updateProduct, deleteProduct,
    addCategory, updateCategory, deleteCategory,
  } = useProductsStore();

  const [tab, setTab] = useState<Tab>('productos');
  const [search, setSearch] = useState('');
  const [editingProduct, setEditingProduct] = useState<Product | 'new' | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | 'new' | null>(null);
  const [seeding, setSeeding] = useState(false);
  const comerciantes = useComerciantesStore((s) => s.comerciantes);
  const sinPuesto = products.filter((p) => !p.comercianteUid).length;
  const agotados = products.filter((p) => p.agotado);

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => p.name.toLowerCase().includes(q) || p.subcategory.toLowerCase().includes(q));
  }, [products, search]);

  const filteredCategories = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter((c) => c.name.toLowerCase().includes(q));
  }, [categories, search]);

  async function handleSeed() {
    setSeeding(true);
    try {
      await seedInitialCatalog();
    } catch (err) {
      console.error('[CatalogoPage] seed error:', err);
      alert('No se pudo importar el catálogo inicial.');
    } finally {
      setSeeding(false);
    }
  }

  async function toggleAgotado(p: Product) {
    try {
      await updateProduct(p.id, { agotado: !p.agotado });
    } catch (err) {
      console.error('[CatalogoPage] agotado:', err);
      alert('No se pudo actualizar el producto.');
    }
  }

  // Para empezar el día: todo vuelve a estar disponible.
  async function reponerTodos() {
    if (!confirm(`¿Marcar los ${agotados.length} productos agotados como disponibles?`)) return;
    try {
      await Promise.all(agotados.map((p) => updateProduct(p.id, { agotado: false })));
    } catch (err) {
      console.error('[CatalogoPage] reponer:', err);
      alert('No se pudieron actualizar todos los productos.');
    }
  }

  async function handleDeleteProduct(p: Product) {
    if (!confirm(`¿Eliminar "${p.name}"? Esta acción no se puede deshacer.`)) return;
    await deleteProduct(p.id);
  }

  async function handleDeleteCategory(c: Category) {
    if (products.some((p) => p.categoryId === c.id)) {
      alert('Hay productos usando esta categoría. Cámbialos de categoría o elimínalos primero.');
      return;
    }
    if (!confirm(`¿Eliminar "${c.name}"?`)) return;
    await deleteCategory(c.id);
  }

  const empty = loaded && products.length === 0 && categories.length === 0;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Catálogo</h1>
        {!empty && (
          <button
            className="btn btn-primary btn-sm"
            onClick={() => (tab === 'productos' ? setEditingProduct('new') : setEditingCategory('new'))}
          >
            + Nuevo
          </button>
        )}
      </div>

      <div className="tabs">
        <button className={`tab-btn${tab === 'productos' ? ' active' : ''}`} onClick={() => setTab('productos')}>
          Productos ({products.length})
        </button>
        <button className={`tab-btn${tab === 'categorias' ? ' active' : ''}`} onClick={() => setTab('categorias')}>
          Categorías ({categories.length})
        </button>
      </div>

      {!empty && (
        <div className="catalog-search">
          <Search size={15} />
          <input
            aria-label="Buscar"
            placeholder={tab === 'productos' ? 'Buscar producto o subcategoría…' : 'Buscar categoría…'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      )}

      {!empty && tab === 'productos' && sinPuesto > 0 && (
        <p style={{ color: 'var(--text-soft)', margin: '0 0 12px' }}>
          {sinPuesto} producto{sinPuesto !== 1 ? 's' : ''} sin puesto asignado: al pedirlos, quien recoge el pedido tendrá que conseguirlos por su cuenta en el mercado.
        </p>
      )}

      {!empty && tab === 'productos' && agotados.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '0 0 12px' }}>
          <p style={{ color: 'var(--text-soft)', margin: 0, flex: 1 }}>
            {agotados.length} producto{agotados.length !== 1 ? 's' : ''} agotado{agotados.length !== 1 ? 's' : ''} hoy: los clientes los ven pero no los pueden pedir.
          </p>
          <button className="btn btn-ghost btn-sm" onClick={reponerTodos}>Todo disponible</button>
        </div>
      )}

      {empty ? (
        <div className="empty-box">
          <p className="empty-title">Todavía no hay catálogo cargado</p>
          <p>Importa el catálogo inicial para empezar — después vas a poder editar, agregar y borrar productos desde acá.</p>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={handleSeed} disabled={seeding}>
            {seeding ? 'Importando…' : 'Importar catálogo inicial'}
          </button>
        </div>
      ) : tab === 'productos' ? (
        <div className="list">
          {filteredProducts.length === 0 && (
            <p style={{ color: 'var(--text-faint)' }}>
              {search ? 'Ningún producto coincide con la búsqueda.' : 'Sin productos todavía.'}
            </p>
          )}
          {filteredProducts.map((p) => (
            <div className="row-card" key={p.id} style={{ cursor: 'pointer' }} onClick={() => setEditingProduct(p)}>
              <img className="row-thumb" src={p.image} alt="" />
              <div className="row-info">
                <p className="row-title">
                  {p.name}
                  {p.agotado && <span className="badge badge-rechazada" style={{ marginLeft: 8 }}>Agotado</span>}
                </p>
                <p className="row-sub">
                  {categories.find((c) => c.id === p.categoryId)?.name ?? p.categoryId}
                  {p.presentations[0] ? ` · ${p.presentations[0].price.toFixed(2)} / ${p.presentations[0].label}` : ''}
                </p>
                <p className="row-sub" style={p.comercianteUid ? undefined : { color: 'var(--danger, #c0392b)' }}>
                  {p.comercianteUid ? `Puesto ${p.stallNumber || '—'} · ${p.comercianteName}` : 'Sin puesto asignado'}
                </p>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); toggleAgotado(p); }}>
                {p.agotado ? 'Hay stock' : 'Agotado'}
              </button>
              <button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); handleDeleteProduct(p); }}>
                Eliminar
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="list">
          {filteredCategories.length === 0 && (
            <p style={{ color: 'var(--text-faint)' }}>
              {search ? 'Ninguna categoría coincide con la búsqueda.' : 'Sin categorías todavía.'}
            </p>
          )}
          {filteredCategories.map((c) => {
            const count = products.filter((p) => p.categoryId === c.id).length;
            return (
              <div className="row-card" key={c.id} style={{ cursor: 'pointer' }} onClick={() => setEditingCategory(c)}>
                <img className="row-thumb" src={c.image} alt="" />
                <div className="row-info">
                  <p className="row-title">{c.name}</p>
                  <p className="row-sub">{count} producto{count !== 1 ? 's' : ''}</p>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); handleDeleteCategory(c); }}>
                  Eliminar
                </button>
              </div>
            );
          })}
        </div>
      )}

      {editingProduct !== null && (
        <ProductModal
          initial={editingProduct === 'new' ? null : editingProduct}
          categories={categories}
          comerciantes={comerciantes}
          onClose={() => setEditingProduct(null)}
          onSave={async (data) => {
            if (editingProduct === 'new') await addProduct(data);
            else await updateProduct(editingProduct.id, data);
            setEditingProduct(null);
          }}
        />
      )}

      {editingCategory !== null && (
        <CategoryModal
          initial={editingCategory === 'new' ? null : editingCategory}
          onClose={() => setEditingCategory(null)}
          onSave={async (data) => {
            if (editingCategory === 'new') await addCategory(data);
            else await updateCategory(editingCategory.id, data);
            setEditingCategory(null);
          }}
        />
      )}
    </div>
  );
}

// ─── Formulario de producto ─────────────────────────────────────────────────

function ProductModal({
  initial, categories, comerciantes, onClose, onSave,
}: {
  initial: Product | null;
  categories: Category[];
  comerciantes: Comerciante[];
  onClose: () => void;
  onSave: (data: Omit<Product, 'id'>) => Promise<void>;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? categories[0]?.id ?? '');
  const [subcategory, setSubcategory] = useState(initial?.subcategory ?? '');
  const [image, setImage] = useState(initial?.image ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [presentations, setPresentations] = useState<Presentation[]>(
    initial?.presentations ?? [{ label: 'Libra', price: 0, weightLbs: 1 }]
  );
  const [comercianteUid, setComercianteUid] = useState(initial?.comercianteUid ?? '');
  const [saving, setSaving] = useState(false);

  function updatePresentation(i: number, field: keyof Presentation, value: string) {
    setPresentations((prev) => prev.map((p, idx) =>
      idx === i ? { ...p, [field]: field === 'label' ? value : Number(value) || 0 } : p
    ));
  }
  function addPresentation() {
    setPresentations((prev) => [...prev, { label: '', price: 0, weightLbs: 0 }]);
  }
  function removePresentation(i: number) {
    setPresentations((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function handleSave() {
    if (!name.trim() || !categoryId || !image.trim() || presentations.length === 0 || presentations.some((p) => !p.label.trim())) {
      alert('Completa nombre, categoría, foto y al menos una presentación con su unidad.');
      return;
    }
    setSaving(true);
    try {
      const cat = categories.find((c) => c.id === categoryId);
      // Se copian nombre y número del puesto al producto (la app no puede leer
      // perfiles de usuario). '' = sin puesto: Firestore no acepta undefined.
      const com = comerciantes.find((c) => c.uid === comercianteUid) ??
        (comercianteUid && comercianteUid === initial?.comercianteUid
          ? { uid: comercianteUid, name: initial.comercianteName ?? '', stallNumber: initial.stallNumber ?? '' }
          : undefined);
      await onSave({
        name: name.trim(),
        categoryId,
        subcategory: subcategory.trim() || cat?.name || '',
        emoji: initial?.emoji ?? cat?.emoji ?? '🛒',
        emojiColor: initial?.emojiColor ?? cat?.color ?? '#3D1F8B',
        image: image.trim(),
        description: description.trim(),
        presentations,
        comercianteUid:  com?.uid ?? '',
        comercianteName: com?.name ?? '',
        stallNumber:     com?.stallNumber ?? '',
      });
    } catch (err) {
      console.error('[ProductModal] save error:', err);
      alert('No se pudo guardar el producto.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{initial ? 'Editar producto' : 'Nuevo producto'}</h2>
          <button className="close-btn" onClick={onClose} aria-label="Cerrar">×</button>
        </div>

        <div className="field">
          <label className="label">Nombre</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Papa Chola" />
        </div>

        <div className="field">
          <label className="label">Categoría</label>
          <div className="chip-row">
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                className={`chip${categoryId === c.id ? ' active' : ''}`}
                onClick={() => setCategoryId(c.id)}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <label className="label">Puesto que lo vende</label>
          <select className="input" value={comercianteUid} onChange={(e) => setComercianteUid(e.target.value)}>
            <option value="">Sin puesto asignado</option>
            {comerciantes.map((c) => (
              <option key={c.uid} value={c.uid}>
                Puesto {c.stallNumber || '—'} · {c.name}{c.giro ? ` (${c.giro})` : ''}
              </option>
            ))}
            {initial?.comercianteUid && !comerciantes.some((c) => c.uid === initial.comercianteUid) && (
              <option value={initial.comercianteUid}>
                Puesto {initial.stallNumber || '—'} · {initial.comercianteName} (ya no está aprobado)
              </option>
            )}
          </select>
          {comerciantes.length === 0 && (
            <p style={{ color: 'var(--text-faint)', fontSize: 12.5, marginTop: 6 }}>
              Todavía no hay comerciantes aprobados. Apruébalos en Solicitudes para poder asignarles productos.
            </p>
          )}
        </div>

        <div className="field">
          <label className="label">Subcategoría</label>
          <input className="input" value={subcategory} onChange={(e) => setSubcategory(e.target.value)} placeholder="Ej: Arroz, Huevos..." />
        </div>

        <div className="field">
          <label className="label">Foto (URL)</label>
          <input className="input" value={image} onChange={(e) => setImage(e.target.value)} placeholder="https://..." />
        </div>

        <div className="field">
          <label className="label">Descripción</label>
          <textarea className="input" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>

        <label className="label">Presentaciones</label>
        {presentations.map((p, i) => (
          <div className="pres-row" key={i}>
            <input className="input" value={p.label} onChange={(e) => updatePresentation(i, 'label', e.target.value)} placeholder="Libra" />
            <input className="input" type="number" step="0.01" value={p.price} onChange={(e) => updatePresentation(i, 'price', e.target.value)} placeholder="Precio $" />
            <input className="input" type="number" step="0.1" value={p.weightLbs} onChange={(e) => updatePresentation(i, 'weightLbs', e.target.value)} placeholder="Libras" />
            {presentations.length > 1 && (
              <button className="close-btn" type="button" onClick={() => removePresentation(i)} aria-label="Quitar presentación">×</button>
            )}
          </div>
        ))}
        <button className="btn btn-ghost btn-sm" type="button" onClick={addPresentation} style={{ marginBottom: 16 }}>
          + Agregar presentación
        </button>

        <button className="btn btn-primary btn-block" onClick={handleSave} disabled={saving}>
          {saving ? 'Guardando…' : 'Guardar'}
        </button>
      </div>
    </div>
  );
}

// ─── Formulario de categoría ─────────────────────────────────────────────────

function CategoryModal({
  initial, onClose, onSave,
}: {
  initial: Category | null;
  onClose: () => void;
  onSave: (data: Omit<Category, 'id'>) => Promise<void>;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [image, setImage] = useState(initial?.image ?? '');
  const [color, setColor] = useState(initial?.color ?? '#3D1F8B');
  const [emoji, setEmoji] = useState(initial?.emoji ?? '🛒');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!name.trim() || !image.trim()) {
      alert('Completa nombre y foto.');
      return;
    }
    setSaving(true);
    try {
      await onSave({ name: name.trim(), image: image.trim(), color: color.trim(), emoji: emoji.trim() });
    } catch (err) {
      console.error('[CategoryModal] save error:', err);
      alert('No se pudo guardar la categoría.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{initial ? 'Editar categoría' : 'Nueva categoría'}</h2>
          <button className="close-btn" onClick={onClose} aria-label="Cerrar">×</button>
        </div>

        <div className="field">
          <label className="label">Nombre</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Frutas" />
        </div>
        <div className="field">
          <label className="label">Foto (URL)</label>
          <input className="input" value={image} onChange={(e) => setImage(e.target.value)} placeholder="https://..." />
        </div>
        <div className="field">
          <label className="label">Color de marca (hex)</label>
          <input className="input" value={color} onChange={(e) => setColor(e.target.value)} placeholder="#3D1F8B" />
        </div>
        <div className="field">
          <label className="label">Emoji de respaldo</label>
          <input className="input" value={emoji} onChange={(e) => setEmoji(e.target.value)} placeholder="🛒" />
        </div>

        <button className="btn btn-primary btn-block" onClick={handleSave} disabled={saving}>
          {saving ? 'Guardando…' : 'Guardar'}
        </button>
      </div>
    </div>
  );
}
