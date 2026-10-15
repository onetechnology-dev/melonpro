/**
 * Compresses an image file client-side to maximum dimensions and returns a Base64 data URL.
 * Keeps file size small (~150-350KB) so it can be stored reliably without bloating storage.
 */
export async function compressImageFile(
  file: File,
  maxWidth = 1920,
  maxHeight = 1080,
  quality = 0.85
): Promise<{ dataUrl: string; width: number; height: number; sizeBytes: number }> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      return reject(new Error('Selected file is not an image'));
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to load image for processing'));
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate aspect-ratio preserved dimensions
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error('Could not get canvas context'));
        }

        // Draw image onto canvas
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to JPEG data URL
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        
        // Approximate byte size of base64
        const head = 'data:image/jpeg;base64,';
        const base64Len = dataUrl.length - head.length;
        const sizeBytes = Math.round((base64Len * 3) / 4);

        resolve({ dataUrl, width, height, sizeBytes });
      };

      img.src = e.target?.result as string;
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Validates whether an external image URL can be loaded successfully.
 */
export function validateImageUrl(url: string, timeoutMs = 6000): Promise<boolean> {
  return new Promise((resolve) => {
    if (!url || (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('data:image/'))) {
      return resolve(false);
    }

    const timer = setTimeout(() => {
      resolve(false);
    }, timeoutMs);

    const img = new Image();
    img.onload = () => {
      clearTimeout(timer);
      resolve(true);
    };
    img.onerror = () => {
      clearTimeout(timer);
      resolve(false);
    };
    img.src = url;
  });
}
