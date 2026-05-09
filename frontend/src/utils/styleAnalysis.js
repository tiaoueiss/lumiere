// Frontend helpers for the style analysis feature.
// The UI gives us an image, and this file handles the API details.

const API_BASE = import.meta.env.VITE_API_URL || ''

function imageToBase64(imageUrl) {
  return new Promise((resolve, reject) => {
    if (imageUrl.startsWith('data:')) {
      resolve(imageUrl)
      return
    }

    const img = new Image()
    img.crossOrigin = 'anonymous'

    img.onload = () => {
      const canvas = document.createElement('canvas')

      // Keep the upload small enough for the backend/API without losing useful detail.
      const MAX_DIM = 1024
      let { width, height } = img
      if (width > MAX_DIM || height > MAX_DIM) {
        const scale = MAX_DIM / Math.max(width, height)
        width = Math.round(width * scale)
        height = Math.round(height * scale)
      }

      canvas.width = width
      canvas.height = height
      canvas.getContext('2d').drawImage(img, 0, 0, width, height)

      resolve(canvas.toDataURL('image/jpeg', 0.85))
    }

    img.onerror = () => reject(new Error('Could not load image for analysis'))
    img.src = imageUrl
  })
}

export async function analyzePhoto(imageUrl) {
  const base64Image = await imageToBase64(imageUrl)

  const response = await fetch(`${API_BASE}/api/style-analysis`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: base64Image }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(
      errorData.error || `Analysis failed (status ${response.status}). Please try again.`
    )
  }

  return response.json()
}

export async function askStyleFollowUp({ analysis, question, history = [] }) {
  const response = await fetch(`${API_BASE}/api/style-analysis/follow-up`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ analysis, question, history }),
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(
      data.message || `Follow-up failed (status ${response.status}). Please try again.`
    )
  }

  const answer = data?.data?.answer
  if (!answer) {
    throw new Error('Unexpected response from server. Please try again.')
  }
  return answer
}
