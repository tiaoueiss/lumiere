import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'

import { useTryOn } from '../components/tryon/useTryOn'
import TryOnCanvas from '../components/tryon/TryOnCanvas'
import NecklaceGrid from '../components/tryon/NecklaceGrid'
import ControlSliders from '../components/tryon/ControlSliders'
import UploadSection from '../components/tryon/UploadSection'
import { NECKLACE_CATALOGUE } from '../data/necklaces'

export default function TryOn() {
  const [catalogue, setCatalogue] = useState(NECKLACE_CATALOGUE)
  const [searchParams] = useSearchParams()

  // passes catalogue array into useTryOn which stores it as a ref
  const tryon = useTryOn(catalogue)

  // pre-select necklace when arriving from the Collection page (?id=choker etc.)
  const { setActiveId } = tryon
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
      const idx = ids.indexOf(tryon.activeId)

      
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        // to prevent scrolling
        e.preventDefault()

        tryon.setActiveId(ids[(idx + 1) % ids.length])

      
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault()
        tryon.setActiveId(ids[(idx - 1 + ids.length) % ids.length])
      }
    }

    window.addEventListener('keydown', handler)

    // clean up
    return () => window.removeEventListener('keydown', handler)

  }, [catalogue, tryon.activeId, tryon.setActiveId])
  

  // add new necklace entry to catalogue state after successful upload, which will trigger a re-render and display the new piece in the sidebar grid.
  const handleAdded = (entry) => {
    setCatalogue(prev => [...prev, entry])
  }



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
              catalogue={catalogue}          // list of necklaces to display
              activeId={tryon.activeId}      // currently selected necklace
              setActiveId={tryon.setActiveId} // function to change necklace
            />


            <UploadSection
              addCustomNecklace={tryon.addCustomNecklace} // adds necklace to AR system
              onAdded={handleAdded}                       // updates catalogue UI
            />


          </aside>
        </div>
      </div>
    </main>
  )
}