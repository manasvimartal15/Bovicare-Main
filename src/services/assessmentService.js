/**
 * BoviCare Assessment Service Interface
 * Modular contract for bovine health & udder image analysis.
 * Step 4: Image capture, validation, and inference preparation.
 * Note: Machine learning model inference will be connected in subsequent steps upon approval.
 */

export const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];

/**
 * Validate image file size and MIME type
 */
export function validateImageFile(file) {
  if (!file) {
    return { valid: false, error: 'No image file provided.' };
  }

  // Type check (allow empty string for some mobile webviews if file has image extension)
  const isAllowedType = ALLOWED_IMAGE_TYPES.includes(file.type) || 
    /\.(jpg|jpeg|png|webp|heic|heif)$/i.test(file.name || '');

  if (file.type && !isAllowedType) {
    return {
      valid: false,
      error: `Unsupported image format (${file.type}). Please select a JPG, PNG, or WebP image.`,
    };
  }

  // Size check
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `Image size (${sizeMB} MB) exceeds maximum allowed limit of 10 MB.`,
    };
  }

  return { valid: true };
}

/**
 * Assessment Pipeline Interface (Ready for ML Integration)
 * Prepares the cow metadata and validated udder image payload.
 * Strictly avoids inventing diagnosis scores or fake predictions.
 */
export async function prepareAssessmentPayload({ cow, imageFile, imageDataUrl, notes = '' }) {
  if (!cow) {
    throw new Error('Cow identification is required for health assessment.');
  }
  if (!imageDataUrl && !imageFile) {
    throw new Error('Valid udder image capture is required for health assessment.');
  }

  return {
    status: 'READY_FOR_ANALYSIS',
    prototypeNotice: 'Image ready for analysis — ML model not connected yet.',
    cowId: cow.id,
    cowName: cow.name,
    cowTagId: cow.tagId,
    breed: cow.breed,
    lactationStatus: cow.lactationStatus,
    capturedAt: new Date().toISOString(),
    imageMeta: {
      type: imageFile?.type || 'image/jpeg',
      size: imageFile?.size || null,
      name: imageFile?.name || 'capture.jpg',
    },
    imageDataUrl,
    notes,
  };
}
