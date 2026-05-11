import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'

import { useTryOn } from '../components/tryon/useTryOn'
import TryOnCanvas from '../components/tryon/TryOnCanvas'
import NecklaceGrid from '../components/tryon/NecklaceGrid'
import ControlSliders from '../components/tryon/ControlSliders'
import UploadSection from '../components/tryon/UploadSection'
import { useAuth } from '../context/AuthContext'
import { uploadCustomNecklace, getMyUploads, deleteCustomNecklace, fetchNecklaces } from '../api'

const dbNecklaceToEntry = (n) => ({
  id:          n._id,
  name:        n.name,
  type:        n.category.charAt(0).toUpperCase() + n.category.slice(1),
  price:       `$${n.price}`,
  yOffset:     n.tryOnSettings?.offsetY    ?? 0.04,
  widthRatio:  n.tryOnSettings?.widthRatio ?? 1.0,
  scale:       n.tryOnSettings?.scale      ?? 1.0,
  src:         n.tryOnImage || n.image,
  description: n.description,
})

export default function TryOn() {
  const [catalogue, setCatalogue] = useState([])
  const [searchParams] = useSearchParams()

  // passes catalogue array into useTryOn which stores it as a ref
  const tryon = useTryOn(catalogue)

  // pre-select necklace when arriving from the Collection page (?id=choker etc.)
  const { activeId, setActiveId, addCustomNecklace } = tryon
  useEffect(() => {
    const id = searchParams.get('id')
    if (id && catalogue.some(n => n.id === id)) {
      setActiveId(id)
    }
  }, [searchParams, setActiveId, catalogue])


  // runs after component renders and used to handle keyboard input globally
  useEffect(() => {
    const handler = (e) => {

      // ignore inputs
     if (e.target.tagName === 'INPUT') return

      const ids = catalogue.map(n => n.id)

      // get index of currently active necklace
      const idx = ids.indexOf(activeId)


      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        // to prevent scrolling
        e.preventDefault()

        setActiveId(ids[(idx + 1) % ids.length])


      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault()
        setActiveId(ids[(idx - 1 + ids.length) % ids.length])
      }
    }

    window.addEventListener('keydown', handler)

    // clean up
    return () => window.removeEventListener('keydown', handler)

  }, [catalogue, activeId, setActiveId])
  

  // Load all catalogue necklaces from DB — single source of truth.
  useEffect(() => {
    let cancelled = false
    fetchNecklaces().then(res => {
      if (cancelled) return
      setCatalogue(res.data.necklaces.map(dbNecklaceToEntry))
    }).catch(() => {})
    return () => { cancelled = true }
  }, [])

  // add new necklace entry to catalogue state after successful upload, which will trigger a re-render and display the new piece in the sidebar grid.
  const handleAdded = (entry) => {
    setCatalogue(prev => [...prev, entry])
  }

  const { user } = useAuth()
  const [prevUser, setPrevUser] = useState(user)
  if (prevUser !== user) {
    setPrevUser(user)
    if (!user) setCatalogue(prev => prev.filter(item => !item.isCustom))
  }

  // On mount, load any custom necklaces the user previously uploaded so they survive refresh.
  useEffect(() => {
    if (!user) return
    let cancelled = false
    getMyUploads()
      .then(res => {
        const entries = res.data.necklaces.map(n => ({
          id:          n._id,
          name:        n.name,
          type:        'Custom upload',
          price:       '—',
          yOffset:     n.tryOnSettings?.offsetY ?? 0.04,
          widthRatio:  1.0,
          scale:       n.tryOnSettings?.scale ?? 1.0,
          src:         n.tryOnImage || n.image,
          isCustom:    true,
          description: n.description || 'Your custom uploaded necklace.',
        }))
        if (!cancelled && entries.length > 0) {
          setCatalogue(prev => {
            const base = prev.filter(item => !item.isCustom)
            const existingIds = new Set(base.map(item => item.id))
            const uniqueEntries = entries.filter(item => !existingIds.has(item.id))
            return [...base, ...uniqueEntries]
          })
        }
      })
      .catch(() => {}) // silently ignore — standard catalogue still works
    return () => { cancelled = true }
  }, [user])

  // Try to persist the upload to the backend so it survives page refresh.
  // Falls back to a local blob URL silently if the user is not logged in or the request fails.
  const handleCustomUpload = useCallback(async (file) => {
    let opts = {}
    if (user) {
      try {
        const formData = new FormData()
        formData.append('image', file)
        const result = await uploadCustomNecklace(formData)
        opts = { src: result.data.necklace.image, id: result.data.necklace._id }
      } catch {
        // not logged in or network error — blob URL fallback below
      }
    }
    return addCustomNecklace(file, opts)
  }, [user, addCustomNecklace])

  const handleDelete = useCallback((id) => {
    setCatalogue(prev => {
      const next = prev.filter(n => n.id !== id)
      // If we deleted the active necklace, fall back to the first remaining one
      if (activeId === id && next.length > 0) setActiveId(next[0].id)
      return next
    })
    // Only call the backend for persisted necklaces (blob-only uploads have 'custom_...' ids)
    if (!id.startsWith('custom_')) {
      deleteCustomNecklace(id).catch(() => {})
    }
  }, [activeId, setActiveId])


  return (
    // Main page container
    <main className="pt-[72px] min-h-screen bg-[radial-gradient(ellipse_at_0%_0%,rgba(201,168,76,0.05)_0%,transparent_60%)]">
      <div className="max-w-[1300px] mx-auto px-6 py-8">
        <div className="mb-8 text-center">
          <p className="font-body text-[0.58rem] tracking-[0.32em] uppercase text-gold mb-1">
            Virtual Try-On Atelier
          </p>

          <h1 className="font-display text-4xl text-ink">
            Find Your <em>Perfect Piece</em>
          </h1>

          <div className="gold-rule max-w-[80px] mx-auto mt-3" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">



          <div className="flex flex-col gap-4">
            
            <TryOnCanvas
            // render webcam
              videoRef={tryon.videoRef}     // reference to webcam video
              canvasRef={tryon.canvasRef}   // reference to overlay canvas
              status={tryon.status}         // camera / tracking status
              cameraOn={tryon.cameraOn}     // whether camera is active
              showDebug={tryon.showDebug}   // toggle debugging visuals
              toggleDebug={tryon.toggleDebug}
              startCamera={tryon.startCamera}
            />

            <ControlSliders
            // read current values
              yOffset={tryon.yOffset}   
              scale={tryon.scale}   
              opacity={tryon.opacity} 

              // update values based on user input
              setYOffset={tryon.setYOffset}
              setScale={tryon.setScale}
              setOpacity={tryon.setOpacity}
            />
          </div>
          <aside className="flex flex-col gap-5 lg:sticky lg:top-24">
            <div className="text-center px-2">
              <p className="font-body text-[0.55rem] tracking-[0.3em] uppercase text-gold mb-1">
                The Collection
              </p>
              <h2 className="font-display italic text-2xl text-ink">
                Select a Piece
              </h2>
              <div className="gold-rule max-w-[40px] mx-auto mt-2" />
            </div>

            <NecklaceGrid
              catalogue={catalogue}           // list of necklaces to display
              activeId={tryon.activeId}       // currently selected necklace
              setActiveId={tryon.setActiveId} // function to change necklace
              onDelete={handleDelete}         // removes custom uploads
            />


            <UploadSection
              addCustomNecklace={handleCustomUpload} // persists to backend then adds to AR system
              onAdded={handleAdded}                  // updates catalogue UI
            />


          </aside>
        </div>
      </div>
    </main>
  )
}
