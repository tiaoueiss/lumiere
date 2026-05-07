const sharp = require('sharp');

const MAX_IMAGE_DIMENSION = 1024; // Resize large images to save tokens & latency

/**
 * Preprocess the image for better analysis accuracy:
 *  1. Resize to a reasonable dimension (saves tokens, speeds up API)
 *  2. Normalize levels (reduce impact of bad lighting)
 *  3. Basic quality stats to detect unusable images
 */
async function preprocessImage(base64Data, mediaType) {
  const inputBuffer = Buffer.from(base64Data, 'base64');

  const metadata = await sharp(inputBuffer).metadata();
  const { width, height } = metadata;

  console.log(`[preprocess] Original: ${width}x${height}, format: ${metadata.format}`);

  let pipeline = sharp(inputBuffer);

  if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
    pipeline = pipeline.resize(MAX_IMAGE_DIMENSION, MAX_IMAGE_DIMENSION, {
      fit: 'inside',
      withoutEnlargement: true,
    });
  }

  // Normalize auto-adjusts brightness/contrast — biggest improvement for undertone accuracy
  // because it reduces the effect of yellow indoor lighting or blue screen glow
  pipeline = pipeline.normalize();

  // Light sharpen to help the model see facial features
  pipeline = pipeline.sharpen({ sigma: 0.8 });

  const outputBuffer = await pipeline.jpeg({ quality: 90 }).toBuffer();
  const outputBase64 = outputBuffer.toString('base64');

  // Compute basic image stats for quality gating
  const stats = await sharp(inputBuffer).stats();
  const avgBrightness = stats.channels.reduce((sum, c) => sum + c.mean, 0) / stats.channels.length;
  const avgContrast = stats.channels.reduce((sum, c) => sum + c.stdev, 0) / stats.channels.length;

  const qualityFlags = [];
  if (avgBrightness < 40) qualityFlags.push('very_dark');
  if (avgBrightness > 220) qualityFlags.push('very_bright');
  if (avgContrast < 20) qualityFlags.push('low_contrast');

  console.log(`[preprocess] Brightness: ${avgBrightness.toFixed(1)}, Contrast: ${avgContrast.toFixed(1)}, Flags: ${qualityFlags.join(', ') || 'none'}`);

  return {
    base64: outputBase64,
    mediaType: 'image/jpeg',
    qualityFlags,
    originalWidth: width,
    originalHeight: height,
  };
}

module.exports = { preprocessImage };
