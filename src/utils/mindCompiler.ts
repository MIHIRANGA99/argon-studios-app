import { supabase, isSupabaseConfigured } from '../lib/supabase';

// MindAR in-browser Compiler interface
declare global {
  interface Window {
    MINDAR?: {
      IMAGE?: {
        Compiler?: any;
        MindARThree?: any;
      };
    };
  }
}

/**
 * Loads MindAR Image Compiler dynamically if not already present
 */
export async function loadMindCompiler(): Promise<any> {
  if (window.MINDAR?.IMAGE?.Compiler) {
    return window.MINDAR.IMAGE.Compiler;
  }

  try {
    const mod = await import('mind-ar/dist/mindar-image.prod.js');
    if (mod.Compiler) return mod.Compiler;
  } catch (err) {
    console.warn('Direct MindAR compiler import failed, loading from CDN fallback...', err);
  }

  // Fallback: dynamic script injection
  return new Promise((resolve, reject) => {
    if (window.MINDAR?.IMAGE?.Compiler) {
      return resolve(window.MINDAR.IMAGE.Compiler);
    }
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/mind-ar@1.2.5/dist/mindar-image.prod.js';
    script.type = 'module';
    script.onload = () => {
      if (window.MINDAR?.IMAGE?.Compiler) {
        resolve(window.MINDAR.IMAGE.Compiler);
      } else {
        reject(new Error('MindAR Compiler failed to initialize on window.MINDAR.IMAGE'));
      }
    };
    script.onerror = () => reject(new Error('Failed to load MindAR compiler script'));
    document.head.appendChild(script);
  });
}

/**
 * Compiles an image (URL or File) into a MindAR .mind target binary Uint8Array
 */
export async function compileImageToMind(
  imageSource: string | File,
  onProgress?: (percent: number) => void
): Promise<Uint8Array> {
  const CompilerClass = await loadMindCompiler();
  const compiler = new CompilerClass();

  // Load image into HTMLImageElement
  const img = new Image();
  img.crossOrigin = 'anonymous';

  let objectUrlToRevoke: string | null = null;
  if (typeof imageSource === 'string') {
    img.src = imageSource;
  } else {
    objectUrlToRevoke = URL.createObjectURL(imageSource);
    img.src = objectUrlToRevoke;
  }

  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = (e) => reject(new Error('Failed to load target image for compilation: ' + e));
  });

  if (objectUrlToRevoke) {
    URL.revokeObjectURL(objectUrlToRevoke);
  }

  // Compile image targets
  await compiler.compileImageTargets([img], (progress: number) => {
    if (onProgress) {
      onProgress(Math.round(progress));
    }
  });

  const exportedBuffer: Uint8Array = await compiler.exportData();
  return exportedBuffer;
}

/**
 * Uploads a compiled .mind binary to Supabase Storage and returns its public URL
 */
export async function uploadMindTargetAsync(
  cardId: string,
  mindBuffer: Uint8Array
): Promise<string | null> {
  const blob = new Blob([mindBuffer.buffer as ArrayBuffer], { type: 'application/octet-stream' });

  if (isSupabaseConfigured() && supabase) {
    try {
      const filePath = `targets/${cardId}-${Date.now()}.mind`;
      const { error } = await supabase.storage
        .from('argon-assets')
        .upload(filePath, blob, {
          contentType: 'application/octet-stream',
          upsert: true
        });

      if (!error) {
        const { data } = supabase.storage.from('argon-assets').getPublicUrl(filePath);
        return data.publicUrl;
      } else {
        console.warn('Supabase target upload failed, using local Blob URL:', error);
      }
    } catch (err) {
      console.warn('Failed to upload target to Supabase:', err);
    }
  }

  // Fallback: create an in-memory blob URL
  return URL.createObjectURL(blob);
}
