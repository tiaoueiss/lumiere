import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { fetchNecklaces, createCatalogueNecklace, deleteCatalogueNecklace } from '../api'

const CATEGORIES = ['choker', 'pendant', 'layered', 'chain', 'statement', 'pearl']
const STYLES     = ['minimalist', 'vintage', 'bold', 'classic', 'modern', 'bohemian', 'luxury']
const METALS     = ['gold', 'silver', 'rose-gold', 'platinum', 'mixed', 'other']

const EMPTY_FORM = {
  name: '', category: 'pendant', style: 'modern', metal: 'gold',
  price: '', description: '', scale: '1.0', offsetY: '0.04',
}

export default function AdminPage() {
  const { user } = useAuth()
  const navigate  = useNavigate()

  // Redirect non-admins immediately
  useEffect(() => {
    if (user === null) navigate('/', { replace: true })
    else if (user && user.role !== 'admin') navigate('/', { replace: true })
  }, [user, navigate])

  const [necklaces,  setNecklaces]  = useState([])
  const [form,       setForm]       = useState(EMPTY_FORM)
  const [file,       setFile]       = useState(null)
  const [preview,    setPreview]    = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [toast,      setToast]      = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null) // { id, name }
  const fileRef = useRef(null)

  useEffect(() => {
    fetchNecklaces()
      .then(res => setNecklaces(res.data.necklaces))
      .catch(() => {})
  }, [])

  function showToast(type, msg) {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 3500)
  }

  function handleFileChange(e) {
    const f = e.target.files[0]
    if (!f) return
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  function handleField(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!file) { showToast('error', 'Please select an image file'); return }
    if (!form.name.trim()) { showToast('error', 'Name is required'); return }
    if (!form.price || isNaN(form.price)) { showToast('error', 'Valid price is required'); return }

    setSubmitting(true)
    try {
      const fd = new FormData()
      fd.append('image', file)
      Object.entries(form).forEach(([k, v]) => fd.append(k, v))

      const res = await createCatalogueNecklace(fd)
      setNecklaces(prev => [res.data.necklace, ...prev])
      setForm(EMPTY_FORM)
      setFile(null)
      setPreview(null)
      if (fileRef.current) fileRef.current.value = ''
      showToast('success', `"${res.data.necklace.name}" added to catalogue`)
    } catch (err) {
      showToast('error', err.message || 'Upload failed')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete() {
    if (!confirmDelete) return
    const { id, name } = confirmDelete
    setConfirmDelete(null)
    try {
      await deleteCatalogueNecklace(id)
      setNecklaces(prev => prev.filter(n => n._id !== id))
      showToast('success', `"${name}" removed`)
    } catch (err) {
      showToast('error', err.message || 'Delete failed')
    }
  }

  if (!user || user.role !== 'admin') return null

  return (
    <main className="pt-[72px] min-h-screen bg-cream">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded shadow-lg text-sm font-body
          ${toast.type === 'success' ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-800'}`}>
          {toast.msg}
        </div>
      )}

      <section className="py-12 px-6 bg-cream-2 border-b border-gold/15 text-center">
        <p className="font-body text-[0.58rem] tracking-[0.32em] uppercase text-gold mb-1">Admin Panel</p>
        <h1 className="font-display text-4xl text-ink">Catalogue <em>Manager</em></h1>
        <div className="gold-rule max-w-[80px] mx-auto mt-3" />
      </section>

      <div className="max-w-5xl mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-10 items-start">

        {/* ── Add necklace form ── */}
        <div className="bg-white border border-gold/15 rounded-xl p-6 lg:sticky lg:top-24">
          <h2 className="font-display italic text-xl text-ink mb-5">Add to Catalogue</h2>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            {/* Image upload */}
            <div>
              <label className="block font-body text-[0.65rem] tracking-[0.18em] uppercase text-ink-3 mb-1.5">
                Product Image (PNG / WebP) *
              </label>
              <div
                onClick={() => fileRef.current?.click()}
                className="aspect-[4/3] rounded-lg border-2 border-dashed border-gold/30 flex items-center justify-center cursor-pointer hover:border-gold transition-colors overflow-hidden bg-cream"
              >
                {preview
                  ? <img src={preview} alt="preview" className="w-full h-full object-contain p-2" />
                  : <span className="font-body text-xs text-muted">Click to upload</span>
                }
              </div>
              <input ref={fileRef} type="file" accept="image/png,image/webp" onChange={handleFileChange} className="hidden" />
            </div>

            {/* Name */}
            <Field label="Name *" name="name" value={form.name} onChange={handleField} placeholder="e.g. Aurora Pendant" />

            {/* Category / Style / Metal row */}
            <div className="grid grid-cols-3 gap-3">
              <Select label="Category" name="category" value={form.category} onChange={handleField} options={CATEGORIES} />
              <Select label="Style"    name="style"    value={form.style}    onChange={handleField} options={STYLES} />
              <Select label="Metal"    name="metal"    value={form.metal}    onChange={handleField} options={METALS} />
            </div>

            {/* Price */}
            <Field label="Price ($) *" name="price" value={form.price} onChange={handleField} placeholder="e.g. 350" type="number" min="0" />

            {/* Description */}
            <div>
              <label className="block font-body text-[0.65rem] tracking-[0.18em] uppercase text-ink-3 mb-1.5">Description</label>
              <textarea
                name="description" value={form.description} onChange={handleField}
                rows={3} placeholder="Describe the necklace…"
                className="w-full border border-gold/20 rounded-lg px-3 py-2 font-body text-sm text-ink focus:outline-none focus:border-gold resize-none"
              />
            </div>

            {/* Try-on settings */}
            <div className="grid grid-cols-2 gap-3">
              <Field label="Try-on Scale" name="scale"   value={form.scale}   onChange={handleField} type="number" step="0.05" min="0.3" max="2.0" />
              <Field label="Y Offset"     name="offsetY" value={form.offsetY} onChange={handleField} type="number" step="0.01" min="-0.3" max="0.5" />
            </div>

            <button
              type="submit" disabled={submitting}
              className="mt-1 bg-gold text-white font-body text-xs tracking-[0.18em] uppercase px-6 py-3 rounded-sm
                hover:bg-gold-dark transition-colors disabled:opacity-60 cursor-pointer"
            >
              {submitting ? 'Uploading…' : 'Add to Catalogue'}
            </button>
          </form>
        </div>

        {/* ── Existing catalogue necklaces ── */}
        <div>
          <h2 className="font-display italic text-xl text-ink mb-5">
            Current Catalogue <span className="font-body text-sm text-muted not-italic">({necklaces.length})</span>
          </h2>
          {necklaces.length === 0
            ? <p className="font-body text-sm text-muted">No catalogue necklaces yet.</p>
            : (
              <div className="flex flex-col gap-3">
                {necklaces.map(n => (
                  <div key={n._id} className="flex items-center gap-4 bg-white border border-gold/15 rounded-xl p-3 hover:border-gold/40 transition-colors">
                    <img
                      src={n.image} alt={n.name}
                      className="w-14 h-14 object-contain rounded-lg bg-cream flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-ui text-sm text-ink-2 truncate">{n.name}</p>
                      <p className="font-body text-xs text-muted capitalize">{n.category} · ${n.price}</p>
                    </div>
                    <button
                      onClick={() => setConfirmDelete({ id: n._id, name: n.name })}
                      title="Delete from catalogue"
                      className="flex-shrink-0 w-8 h-8 rounded-full border border-red-200 text-red-400
                        flex items-center justify-center hover:bg-red-50 transition-colors cursor-pointer"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )
          }
        </div>
      </div>
      {/* ── Delete confirmation modal ── */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-sm px-6">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round">
                <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" />
              </svg>
            </div>
            <h3 className="font-display text-xl text-ink mb-2">Remove from Catalogue</h3>
            <p className="font-body text-sm text-ink-2 mb-1">
              Are you sure you want to delete
            </p>
            <p className="font-ui text-sm text-ink font-semibold mb-5">"{confirmDelete.name}"?</p>
            <p className="font-body text-xs text-muted mb-6">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 font-body text-sm px-4 py-2.5 rounded-full border border-gold/30 text-ink-2 hover:border-gold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 font-body text-sm px-4 py-2.5 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

function Field({ label, name, value, onChange, ...rest }) {
  return (
    <div>
      <label className="block font-body text-[0.65rem] tracking-[0.18em] uppercase text-ink-3 mb-1.5">{label}</label>
      <input
        name={name} value={value} onChange={onChange}
        className="w-full border border-gold/20 rounded-lg px-3 py-2 font-body text-sm text-ink focus:outline-none focus:border-gold"
        {...rest}
      />
    </div>
  )
}

function Select({ label, name, value, onChange, options }) {
  return (
    <div>
      <label className="block font-body text-[0.65rem] tracking-[0.18em] uppercase text-ink-3 mb-1.5">{label}</label>
      <select
        name={name} value={value} onChange={onChange}
        className="w-full border border-gold/20 rounded-lg px-3 py-2 font-body text-sm text-ink focus:outline-none focus:border-gold bg-white capitalize"
      >
        {options.map(o => <option key={o} value={o} className="capitalize">{o}</option>)}
      </select>
    </div>
  )
}
