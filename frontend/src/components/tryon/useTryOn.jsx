import { useRef, useState, useCallback, useEffect } from 'react'

export function useTryOn(catalogue) {

  const videoRef  = useRef(null)
  const canvasRef = useRef(null)

  const imgCache    = useRef({})
  // MediaPipe instances
  const faceMeshRef = useRef(null)
  const cameraRef   = useRef(null)

  //  blend previous + current position to reduce jitter
  const smoothedChin = useRef(null)
  const smoothedJawL = useRef(null)
  const smoothedJawR = useRef(null)


  const activeIdRef  = useRef(catalogue[0]?.id ?? '')
  const yOffsetRef   = useRef(0.04)
  const scaleRef     = useRef(1.0)
  const opacityRef   = useRef(1.0)
  const showDebugRef = useRef(false)
  const catalogueRef = useRef(catalogue)

  const [activeId,  setActiveIdState]  = useState(catalogue[0]?.id ?? '')
  const [yOffset,   setYOffsetState]   = useState(0.04)
  const [scale,     setScaleState]     = useState(1.0)
  const [opacity,   setOpacityState]   = useState(1.0)
  const [showDebug, setShowDebugState] = useState(false)
  const [status,    setStatus]         = useState('')
  const [cameraOn,  setCameraOn]       = useState(false)

  const smooth = useCallback((prevRef, current, alpha = 0.6) => {
    if (!prevRef.current) {
      prevRef.current = { x: current.x, y: current.y }
      return prevRef.current
    }
    prevRef.current = {
      x: alpha * prevRef.current.x + (1 - alpha) * current.x,
      y: alpha * prevRef.current.y + (1 - alpha) * current.y,
    }
    return prevRef.current
  }, [])


  // setters: update ref + state
  const setActiveId = useCallback((id) => {
    activeIdRef.current = id
    setActiveIdState(id)
    // Restore this necklace's saved offset/scale so sliders match
    const item = catalogueRef.current.find(n => n.id === id)
    if (item) {
      yOffsetRef.current = item.yOffset
      scaleRef.current   = item.scale ?? 1.0
      setYOffsetState(item.yOffset)
      setScaleState(item.scale ?? 1.0)
    }
  }, [])

  const setYOffset = useCallback((v) => {
    const val = parseFloat(v)
    yOffsetRef.current = val
    setYOffsetState(val)
    // get the currently active necklace item from the catalogue and update its yOffset so that if we switch to another necklace and then back, it remembers our custom offset for this necklace.
    const item = catalogueRef.current.find(n => n.id === activeIdRef.current)
    if (item) item.yOffset = val
  }, [])

  const setScale = useCallback((v) => {
    const val = parseFloat(v)
    scaleRef.current = val
    setScaleState(val)
    // get the currently active necklace item from the catalogue and update its scale so that if we switch to another necklace and then back, it remembers our custom scale for this necklace.
    const item = catalogueRef.current.find(n => n.id === activeIdRef.current)
    if (item) item.scale = val
  }, [])

  const setOpacity = useCallback((v) => {
    const val = parseFloat(v)
    opacityRef.current = val
    setOpacityState(val)
  }, [])

  const toggleDebug = useCallback(() => {
    const next = !showDebugRef.current
    showDebugRef.current = next
    setShowDebugState(next)
  }, [])


  // generate a place holder image in case of missing/corrupted src
  const buildPlaceholderDataURL = useCallback((necklace) => {
    const canvas = document.createElement('canvas')
    canvas.width  = 400
    canvas.height = 200
    const ctx = canvas.getContext('2d')

    const gold = ctx.createLinearGradient(0, 0, 0, canvas.height)
    gold.addColorStop(0,   '#e8cc80')
    gold.addColorStop(0.5, '#c9a84c')
    gold.addColorStop(1,   '#9a7530')

    ctx.strokeStyle = gold
    ctx.lineWidth   = 5
    ctx.lineCap     = 'round'

    switch (necklace.id) {
      case 'choker':
        ctx.beginPath()
        ctx.ellipse(200, 80, 170, 28, 0, 0, Math.PI)
        ctx.stroke()
        ctx.fillStyle = gold
        ctx.beginPath()
        ctx.ellipse(200, 106, 14, 10, 0, 0, Math.PI * 2)
        ctx.fill()
        break

      case 'pendant':
        ctx.beginPath()
        ctx.moveTo(20, 40)
        ctx.quadraticCurveTo(200, 70, 380, 40)
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(200, 68)
        ctx.lineTo(200, 130)
        ctx.stroke()
        ctx.fillStyle = gold
        ctx.beginPath()
        ctx.moveTo(200, 132)
        ctx.lineTo(185, 152)
        ctx.lineTo(200, 172)
        ctx.lineTo(215, 152)
        ctx.closePath()
        ctx.fill()
        break

      case 'layered': {
        const layers = [
          { y: 40, rx: 170 },
          { y: 70, rx: 155 },
          { y: 100, rx: 140 },
        ]
        layers.forEach(({ y, rx }, i) => {
          ctx.globalAlpha = 1 - i * 0.15
          ctx.beginPath()
          ctx.ellipse(200, y, rx, 20, 0, 0, Math.PI)
          ctx.stroke()
        })
        ctx.globalAlpha = 1
        for (let i = 0; i < 9; i++) {
          const angle = Math.PI * (i / 8)
          const bx = 200 - 170 * Math.cos(angle)
          const by = 40 + 20 * Math.sin(angle)
          ctx.fillStyle = '#e8cc80'
          ctx.beginPath()
          ctx.arc(bx, by, 4, 0, Math.PI * 2)
          ctx.fill()
        }
        break
      }

      case 'statement': {
        ctx.beginPath()
        ctx.moveTo(30, 30)
        ctx.quadraticCurveTo(200, 55, 370, 30)
        ctx.stroke()
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.moveTo(80, 50)
        ctx.lineTo(70, 130)
        ctx.quadraticCurveTo(200, 175, 330, 130)
        ctx.lineTo(320, 50)
        ctx.stroke()
        const gems = [[140,130],[170,150],[200,158],[230,150],[260,130]]
        gems.forEach(([gx, gy]) => {
          ctx.fillStyle = gold
          ctx.beginPath()
          ctx.moveTo(gx, gy - 12)
          ctx.lineTo(gx - 10, gy)
          ctx.lineTo(gx, gy + 12)
          ctx.lineTo(gx + 10, gy)
          ctx.closePath()
          ctx.fill()
        })
        break
      }

      case 'tennis': {
        ctx.lineWidth = 4
        ctx.beginPath()
        ctx.moveTo(20, 60)
        ctx.quadraticCurveTo(200, 90, 380, 60)
        ctx.stroke()
        for (let i = 0; i <= 16; i++) {
          const t  = i / 16
          const bx = 20 + t * 360
          const by = 60 + Math.sin(t * Math.PI) * 30
          ctx.fillStyle = 'rgba(220,235,255,0.9)'
          ctx.strokeStyle = '#c9a84c'
          ctx.lineWidth = 1.5
          ctx.save()
          ctx.translate(bx, by)
          ctx.rotate(Math.PI / 4)
          ctx.fillRect(-5, -5, 10, 10)
          ctx.strokeRect(-5, -5, 10, 10)
          ctx.restore()
        }
        break
      }

      case 'opera':
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.moveTo(30, 30)
        ctx.quadraticCurveTo(200, 55, 370, 30)
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(50, 55)
        ctx.quadraticCurveTo(200, 90, 350, 55)
        ctx.stroke()
        for (let i = -3; i <= 3; i++) {
          ctx.beginPath()
          ctx.moveTo(200 + i * 6, 90)
          ctx.lineTo(200 + i * 5, 140 + Math.abs(i) * 5)
          ctx.stroke()
        }
        break

      default: {
        ctx.lineWidth = 8
        ctx.lineCap = 'round'
        ctx.beginPath()
        ctx.arc(200, 20, 165, 0.12 * Math.PI, 0.88 * Math.PI)
        ctx.stroke()
        ctx.fillStyle = gold
        const leftAngle  = 0.12 * Math.PI
        const rightAngle = 0.88 * Math.PI
        ctx.beginPath()
        ctx.arc(200 - 165 * Math.cos(leftAngle),  20 + 165 * Math.sin(leftAngle),  10, 0, Math.PI * 2)
        ctx.fill()
        ctx.beginPath()
        ctx.arc(200 + 165 * Math.cos(leftAngle), 20 + 165 * Math.sin(rightAngle), 10, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    return canvas.toDataURL('image/png')
  }, [])



  const preloadAllImages = useCallback(() => {
    const promises = catalogueRef.current.map(necklace => new Promise(resolve => {
      if (imgCache.current[necklace.id]) { resolve(); return }
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload  = () => { imgCache.current[necklace.id] = img; resolve() }
      img.onerror = () => { console.warn('Image load failed:', necklace.id); resolve() }
      img.src = necklace.src || buildPlaceholderDataURL(necklace)
    }))
    return Promise.all(promises)
  }, 
  // buildPlaceholderDataURL is a dependency because it's used to generate fallback images for necklaces without valid src. If buildPlaceholderDataURL changes, we want to regenerate the placeholder images, so we include it in the dependency array to ensure the effect runs again when it changes.
  [buildPlaceholderDataURL])

  // Keep catalogue ref in sync when the prop changes.
  // If the camera is already running, also preload images for any newly added necklaces.
  useEffect(() => {
    catalogueRef.current = catalogue
    if (cameraOn) preloadAllImages()
  }, [catalogue, cameraOn, preloadAllImages])

  // Stop the camera and release the webcam when the component unmounts.
  useEffect(() => {
    return () => {
      cameraRef.current?.stop()
      faceMeshRef.current?.close()
      const stream = videoRef.current?.srcObject
      if (stream) stream.getTracks().forEach(t => t.stop())
    }
  }, [])


  const renderFrame = useCallback((results) => {
    const canvas = canvasRef.current
    const video  = videoRef.current
    if (!canvas || !video) return

    canvas.width  = video.videoWidth  || 640
    canvas.height = video.videoHeight || 480
    const W = canvas.width
    const H = canvas.height

    // the context allows us to render the video frame and necklace overlay on the canvas for each new frame from the webcam.
    const ctx = canvas.getContext('2d')

    // mirror video
    ctx.save()
    ctx.scale(-1, 1)
    ctx.translate(-W, 0)
    ctx.drawImage(results.image, 0, 0, W, H)
    ctx.restore()

    // FaceMesh landmarks used:
    //   152 -> chin tip (vertical anchor for necklace)
    //   234 -> right jaw edge in camera space
    //   454 -> left jaw edge in camera space
    const landmarks = results.multiFaceLandmarks?.[0]
    if (!landmarks) {
      setStatus('Position your face in frame…')
      return
    }

    // MEDIAPIPE NOTE: landmarks are in the original camera space (not mirrored).
    const rawChin = landmarks[152]
    const rawJawL = landmarks[454]
    const rawJawR = landmarks[234]

    // smooth landmarks to reduce jitter
    const chin = smooth(smoothedChin, { x: rawChin.x, y: rawChin.y })
    const jawL = smooth(smoothedJawL, { x: rawJawL.x, y: rawJawL.y })
    const jawR = smooth(smoothedJawR, { x: rawJawR.x, y: rawJawR.y })

   
    // to match flipped coordinates
    const chinPx = { x: (1 - chin.x) * W, y: chin.y * H }
    const jawLPx = { x: (1 - jawL.x) * W, y: jawL.y * H }
    const jawRPx = { x: (1 - jawR.x) * W, y: jawR.y * H }

    // ── 5. Calculate necklace geometry ───────────────────

   // distance between left and right jaw in pixels
    const dx       = jawRPx.x - jawLPx.x
    const dy       = jawRPx.y - jawLPx.y


    const jawWidth = Math.sqrt(dx * dx + dy * dy)

       const tiltAngle = Math.atan2(dy, dx)

    
    const jawCenterX = (jawLPx.x + jawRPx.x) / 2

    // Look up the selected necklace
    const necklace = catalogueRef.current.find(n => n.id === activeIdRef.current)
    if (!necklace) return

    // Get the cached image
    const img = imgCache.current[necklace.id]
    if (!img) return

    // Necklace dimensions
    const widthRatio = necklace.widthRatio ?? 1.0
    const perScale   = necklace.scale ?? 1.0
    const neckW = jawWidth * widthRatio * perScale * scaleRef.current

    const aspect = img.naturalHeight / img.naturalWidth
    const neckH  = neckW * aspect

    // centerd on jaw, pushed down from chin by yOffset.
    const neckCenterX = jawCenterX
    const neckCenterY = chinPx.y + yOffsetRef.current * H + neckH / 2

    // draw necklace with correct position, size, and rotation
    // use .save() and .restore() to isolate transformations and opacity changes to just the necklace drawing, so they don't affect the video frame or debug overlay.
    ctx.save()
    ctx.translate(neckCenterX, neckCenterY)
    ctx.rotate(tiltAngle)
    ctx.globalAlpha = opacityRef.current
    ctx.drawImage(img, -neckW / 2, -neckH / 2, neckW, neckH)
    ctx.globalAlpha = 1
    ctx.restore()

    setStatus('')

    // Debug overlay 
    if (showDebugRef.current) {
      const boxX = neckCenterX - neckW / 2
      const boxY = neckCenterY - neckH / 2
      ctx.strokeStyle = 'rgba(201,168,76,0.8)'
      ctx.lineWidth = 1
      ctx.setLineDash([4, 4])
      ctx.strokeRect(boxX, boxY, neckW, neckH)
      ctx.setLineDash([])

      const dots = [
        [chinPx.x, chinPx.y, '#67e8f9', 'chin'],
        [jawLPx.x, jawLPx.y, '#f87171', 'jawL'],
        [jawRPx.x, jawRPx.y, '#f87171', 'jawR'],
      ]
      dots.forEach(([x, y, color]) => {
        ctx.fillStyle = color
        ctx.beginPath()
        ctx.arc(x, y, 5, 0, Math.PI * 2)
        ctx.fill()
      })

      ctx.fillStyle = 'rgba(0,0,0,0.6)'
      ctx.fillRect(8, 8, 260, 96)
      ctx.fillStyle = '#e8cc80'
      ctx.font = '11px monospace'
      const tiltDeg = (tiltAngle * 180 / Math.PI).toFixed(1)
      ctx.fillText(`Jaw width:  ${Math.round(jawWidth)}px`,                     16, 26)
      ctx.fillText(`Necklace:   ${Math.round(neckW)} × ${Math.round(neckH)}px`, 16, 42)
      ctx.fillText(`Center:     ${Math.round(neckCenterX)}, ${Math.round(neckCenterY)}`, 16, 58)
      ctx.fillText(`Tilt:       ${tiltDeg}°`,                                   16, 74)
      ctx.fillText(`yOffset:    ${yOffsetRef.current.toFixed(3)}`,              16, 90)
    }
  }, [smooth])



  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
      })

      videoRef.current.srcObject = stream
      setStatus('Loading model…')

      await preloadAllImages()

      // Set up FaceMesh
      const faceMesh = new window.FaceMesh({
        locateFile: file =>
          `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4/${file}`,
      })
      faceMesh.setOptions({
        maxNumFaces:            1,
        refineLandmarks:        true,
        minDetectionConfidence: 0.6,
        minTrackingConfidence:  0.6,
      })
      faceMesh.onResults(renderFrame)
      faceMeshRef.current = faceMesh

      // Start the camera loop (~30 fps)
      const cam = new window.Camera(videoRef.current, {
        onFrame: async () => {
          await faceMeshRef.current.send({ image: videoRef.current })
        },
        width:  1280,
        height: 720,
      })
      await cam.start()
      cameraRef.current = cam

      setCameraOn(true)
      setStatus('')
      return true
    } catch (err) {
      console.error(err)
      setStatus('Camera access denied — check browser permissions')
      return false
    }
  }, [preloadAllImages, renderFrame])


// custom necklace upload
  // opts.src and opts.id let the caller supply a persisted backend URL/id
  // instead of a temporary blob URL, so uploads survive page refresh.
  const addCustomNecklace = useCallback((file, opts = {}) => {
  return new Promise((resolve, reject) => {
    const allowed = ['image/png', 'image/webp']
    if (!allowed.includes(file.type)) {
      reject(new Error('Only PNG or WebP images are allowed'))
      return
    }

    const url  = opts.src || URL.createObjectURL(file)
    const name = file.name
      .replace(/\.[^.]+$/, '')
      .replace(/[-_]/g, ' ')
    const id = opts.id || 'custom_' + Date.now()

    const entry = {
      id,
      name:        name.charAt(0).toUpperCase() + name.slice(1),
      type:        'Custom upload',
      price:       '—',
      yOffset:     0.04,
      widthRatio:  1.0,
      scale:       1.0,
      src:         url,
      isCustom:    true,
      description: 'Your custom uploaded necklace.',
    }
    catalogueRef.current = [...catalogueRef.current, entry]

    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload  = () => { imgCache.current[id] = img; setActiveId(id); resolve(entry) }
    // If the image fails to load (e.g., due to a corrupted file), we still want to add the necklace entry with a placeholder image so the user can see it in the catalogue and select it. We log a warning but resolve the promise anyway.
    img.onerror = () => {
      // Load a placeholder so renderFrame never sees naturalWidth=0 (which produces NaN dimensions)
      const ph = new Image()
      ph.src = buildPlaceholderDataURL(entry)
      ph.onload = () => { imgCache.current[id] = ph; setActiveId(id); resolve(entry) }
    }
    img.src = url
  })
}, [setActiveId, buildPlaceholderDataURL])

// what is returned here becomes available to any component that calls useTryOn(catalogue)
  return {
    // DOM refs
    videoRef,
    canvasRef,

    // Current state (for UI display)
    activeId,
    yOffset,
    scale,
    opacity,
    showDebug,
    status,
    cameraOn,

    // Actions
    setActiveId,
    setYOffset,
    setScale,
    setOpacity,
    toggleDebug,
    startCamera,
    addCustomNecklace,
    getCatalogue: () => catalogueRef.current,
  }
}