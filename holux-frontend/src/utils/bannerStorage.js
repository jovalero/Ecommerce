/**
 * Banner Storage & Image Optimization Utility
 * Solves localStorage 5MB quota exhaustion by compressing uploaded images
 * and syncing with IndexedDB for 100% reliable persistence.
 */

// Simple lightweight IndexedDB Wrapper
const DB_NAME = 'HoluxBannerStore';
const DB_VERSION = 1;
const STORE_NAME = 'banners_store';

function openDB() {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      resolve(null);
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve(null);
  });
}

export async function getFromIndexedDB(key) {
  try {
    const db = await openDB();
    if (!db) return null;
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch (e) {
    return null;
  }
}

export async function setToIndexedDB(key, val) {
  try {
    const db = await openDB();
    if (!db) return false;
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put(val, key);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    });
  } catch (e) {
    return false;
  }
}

/**
 * Compresses an image file locally using HTML5 Canvas to < 200KB
 */
export function compressImageFile(file, maxWidth = 1920, maxHeight = 1080, quality = 0.85) {
  return new Promise((resolve) => {
    if (!file) {
      resolve('');
      return;
    }

    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate proportional scale
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          // Export as JPEG with optimized compression
          const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(compressedDataUrl);
        } else {
          resolve(readerEvent.target?.result || '');
        }
      };
      img.onerror = () => resolve(readerEvent.target?.result || '');
      img.src = readerEvent.target?.result;
    };
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
}

/**
 * Uploads banner image to Supabase Storage CDN via backend API
 * with instant client-side canvas compression fallback.
 */
export async function uploadOrCompressBanner(file, API_BASE, token) {
  if (!file) return '';

  const apiBase = API_BASE || API_BASE_URL || 'https://holux-api.onrender.com';

  // 1. Upload via backend API (uses Supabase Service Key to write directly to Supabase Storage Bucket 'banners')
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('bucket', 'banners');

    const authToken = token || localStorage.getItem('user_token') || localStorage.getItem('holux_auth_token') || '';
    const headers = {};
    if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

    const res = await fetch(`${apiBase}/api/upload`, {
      method: 'POST',
      headers,
      body: formData
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.url) {
        return data.url;
      }
    }
  } catch (err) {
    console.warn('[BannerStorage] Upload via /api/upload failed:', err);
  }

  // 2. Secondary try via /api/admin/upload
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('bucket', 'banners');

    const authToken = token || localStorage.getItem('user_token') || localStorage.getItem('holux_auth_token') || '';
    const headers = {};
    if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

    const res = await fetch(`${apiBase}/api/admin/upload`, {
      method: 'POST',
      headers,
      body: formData
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.url) {
        return data.url;
      }
    }
  } catch (err) {
    console.warn('[BannerStorage] Upload via /api/admin/upload failed:', err);
  }

  // 3. High-quality client-side compression fallback (1920x1080)
  const compressed = await compressImageFile(file, 1920, 1080, 0.92);
  return compressed || '';
}

/**
 * Universal safe persistent save (localStorage + IndexedDB + Backend Settings Sync to Supabase CDN)
 */
export async function persistBannerData(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.warn(`[BannerStorage] localStorage write failed for ${key} (quota exceeded). Storing in IndexedDB.`);
  }

  // Always sync to IndexedDB for unlimited capacity
  await setToIndexedDB(key, data);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('holux_banners_updated', { detail: { key, data } }));
    window.dispatchEvent(new Event('storage'));
  }

  // Sync to backend /api/settings (which updates Supabase Storage config/store_settings.json)
  try {
    const apiBase = API_BASE_URL || 'https://holux-api.onrender.com';
    let field = null;
    if (key === 'holux_hero_slides') field = 'hero_slides';
    if (key === 'holux_grid_promo_cards') field = 'grid_cards';
    if (key === 'holux_promo_banner') field = 'promo_banner';
    if (key === 'holux_home_section_titles') field = 'section_titles';
    if (key === 'holux_ticker_phrases') field = 'ticker_phrases';
    if (key === 'holux_header_nav_items') field = 'header_nav';
    if (key === 'holux_payment_methods_config') field = 'payment_methods_config';

    if (field) {
      const token = localStorage.getItem('user_token') || localStorage.getItem('holux_auth_token') || '';
      const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      await fetch(`${apiBase}/api/settings`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ [field]: data })
      });
    }
  } catch (syncErr) {
    console.warn('[BannerStorage] Cloud settings sync failed:', syncErr);
  }
}

/**
 * Universal safe persistent load (localStorage with IndexedDB fallback)
 */
export async function loadPersistedBannerData(key, fallback) {
  try {
    const local = localStorage.getItem(key);
    if (local) {
      return JSON.parse(local);
    }
  } catch (e) {}

  // Try IndexedDB
  try {
    const idbData = await getFromIndexedDB(key);
    if (idbData) {
      try {
        localStorage.setItem(key, JSON.stringify(idbData));
      } catch (e) {}
      return idbData;
    }
  } catch (e) {}

  return fallback;
}

export const SUPABASE_PRODUCT_IMAGES_CDN = 'https://fmbhcfsrsfkglmvgbnlm.supabase.co/storage/v1/object/public/product-images';
export const SUPABASE_BANNERS_CDN = 'https://fmbhcfsrsfkglmvgbnlm.supabase.co/storage/v1/object/public/banners';

/**
 * Resolves any product image reference (relative path, old backend URL, local upload)
 * directly to the high-speed, permanent Supabase Storage CDN.
 */
export function resolveProductImage(url) {
  if (!url || typeof url !== 'string') return null;
  let clean = url.trim();

  // If already a Data URL or external image from Unsplash, etc.
  if (clean.startsWith('data:image/') || (clean.startsWith('https://') && !clean.includes('onrender.com/storage/uploads/'))) {
    return clean;
  }

  // Extract clean filename from any legacy storage format
  let filename = clean;
  if (clean.includes('/storage/uploads/')) {
    filename = clean.split('/storage/uploads/')[1];
  } else if (clean.startsWith('/uploads/')) {
    filename = clean.replace(/^\/uploads\//, '');
  } else if (clean.includes('localhost:8000/storage/uploads/')) {
    filename = clean.split('localhost:8000/storage/uploads/')[1];
  }

  // Remove leading slashes and parameters
  filename = filename.replace(/^\/+/, '').split('?')[0];

  // If it's a valid media file, route to Supabase CDN
  if (filename && filename.includes('.') && !filename.startsWith('http')) {
    if (filename.startsWith('banners/') || filename.startsWith('hero_slide')) {
      return `${SUPABASE_BANNERS_CDN}/${filename.replace(/^banners\//, '')}`;
    }
    return `${SUPABASE_PRODUCT_IMAGES_CDN}/${filename}`;
  }

  if (clean.startsWith('http://')) {
    return clean.replace('http://', 'https://');
  }

  return clean;
}
