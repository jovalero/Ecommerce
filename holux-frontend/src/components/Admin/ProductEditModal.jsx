import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Image as ImageIcon, Video, Copy, Tag, DollarSign, Layers, Search, Sparkles } from 'lucide-react';

export default function ProductEditModal({ product, categories = [], onClose, onSave, onDuplicate }) {
  // Basic info
  const [name, setName] = useState(product?.name || '');
  const [brand, setBrand] = useState(product?.brand || 'HOLUX');
  const [categoryId, setCategoryId] = useState(product?.category_id || (categories[0]?.id || ''));
  const [description, setDescription] = useState(product?.description || '');
  const [tags, setTags] = useState(product?.tags ? product.tags.join(', ') : 'Trekking, Outdoor, Alta Montaña');

  // Pricing & Costs
  const [price, setPrice] = useState(product?.price || 0);
  const [offerPrice, setOfferPrice] = useState(product?.offer_price || 0);
  const [costPrice, setCostPrice] = useState(product?.cost_price || 0);
  const [stock, setStock] = useState(product?.stock ?? 10);
  const [installments, setInstallments] = useState(product?.installments || 6);

  const getProductImageFallback = (productName) => {
    if (!productName) return 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&auto=format&fit=crop&q=80';
    const clean = productName.toLowerCase();
    if (clean.includes('campera') || clean.includes('cortavientos')) return 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&auto=format&fit=crop&q=80';
    if (clean.includes('pantalón') || clean.includes('pantalon')) return 'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=600&auto=format&fit=crop&q=80';
    if (clean.includes('carpa') || clean.includes('domo')) return 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=600&auto=format&fit=crop&q=80';
    if (clean.includes('bolsa de dormir') || clean.includes('sleeping')) return 'https://images.unsplash.com/photo-1628155930542-3c7a64e2c833?w=600&auto=format&fit=crop&q=80';
    if (clean.includes('bota') || clean.includes('calzado') || clean.includes('zapatilla')) return 'https://images.unsplash.com/photo-1520639888713-7851133b1ed0?w=600&auto=format&fit=crop&q=80';
    if (clean.includes('mochila')) return 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&auto=format&fit=crop&q=80';
    if (clean.includes('bastón') || clean.includes('bastones')) return 'https://images.unsplash.com/photo-1517646287270-a5a9ca602e5c?w=600&auto=format&fit=crop&q=80';
    return 'https://images.unsplash.com/photo-1501555088652-021faa106b9b?w=600&auto=format&fit=crop&q=80';
  };

  // Media (Images & Video)
  const [images, setImages] = useState(
    product?.images && product.images.length > 0
      ? product.images
      : [product?.image_url || getProductImageFallback(product?.name)]
  );
  const [newImageUrl, setNewImageUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState(product?.video_url || '');

  // Variants State
  const [variants, setVariants] = useState(
    product?.variants || [
      { id: 1, color: 'Negro Mamba', size: 'M', stock: 12, price: product?.price || 0 },
      { id: 2, color: 'Rojo Volcán', size: 'L', stock: 8, price: product?.price || 0 }
    ]
  );
  const [newVarColor, setNewVarColor] = useState('');
  const [newVarSize, setNewVarSize] = useState('M');
  const [newVarStock, setNewVarStock] = useState(10);
  const [newVarPrice, setNewVarPrice] = useState(0);

  // SEO & Marketing
  const [slug, setSlug] = useState(product?.slug || '');
  const [metaTitle, setMetaTitle] = useState(product?.meta_title || '');
  const [metaDescription, setMetaDescription] = useState(product?.meta_description || '');

  // Auto-generate slug from name
  useEffect(() => {
    if (!product && name) {
      const generatedSlug = name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
      setSlug(generatedSlug);
      setMetaTitle(`${name} | HOLUX Equipamiento Outdoor`);
      setMetaDescription(`Comprá online ${name} con garantía oficial HOLUX, envíos gratis a todo el país y hasta 6 cuotas sin interés.`);
    }
  }, [name, product]);

  // Calculate profit margin percentage
  const effectiveSellPrice = Number(offerPrice) > 0 ? Number(offerPrice) : Number(price);
  const cost = Number(costPrice);
  const marginPercentage = cost > 0 ? (((effectiveSellPrice - cost) / cost) * 100).toFixed(1) : 0;

  const handleAddImage = () => {
    if (newImageUrl.trim()) {
      setImages([...images, newImageUrl.trim()]);
      setNewImageUrl('');
    }
  };

  const handleRemoveImage = (idx) => {
    setImages(images.filter((_, i) => i !== idx));
  };

  const handleAddVariant = () => {
    if (!newVarColor.trim()) return;
    setVariants([
      ...variants,
      {
        id: Date.now(),
        color: newVarColor.trim(),
        size: newVarSize,
        stock: Number(newVarStock),
        price: Number(newVarPrice) > 0 ? Number(newVarPrice) : Number(price)
      }
    ]);
    setNewVarColor('');
  };

  const handleRemoveVariant = (id) => {
    setVariants(variants.filter(v => v.id !== id));
  };

  // Curation Flags
  const [isFeatured, setIsFeatured] = useState(product?.is_featured || false);
  const [isNew, setIsNew] = useState(product?.is_new || false);

  // Submit Handler with Confirmation
  const handleSubmit = (e) => {
    e.preventDefault();
    setIsConfirmOpen(true);
  };

  const handleConfirmSave = () => {
    const payload = {
      id: product?.id,
      name,
      brand,
      category_id: categoryId,
      description,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      price: Number(price),
      offer_price: Number(offerPrice),
      cost_price: Number(costPrice),
      stock: Number(stock),
      installments: Number(installments),
      image_url: images[0] || '',
      images,
      video_url: videoUrl,
      variants,
      slug,
      meta_title: metaTitle,
      meta_description: metaDescription,
      is_featured: isFeatured,
      is_new: isNew
    };

    onSave(payload);
    setIsConfirmOpen(false);
  };

  // File upload handlers (Supabase Storage CDN API + FileReader fallback)
  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
    
    for (const file of files) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('bucket', file.type.startsWith('video/') ? 'videos' : 'product-images');

        const res = await fetch(`${API_BASE}/api/admin/upload`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('holux_auth_token') || 'mock_token'}`
          },
          body: formData
        });

        if (res.ok) {
          const data = await res.json();
          if (data.url) {
            if (file.type.startsWith('video/')) {
              setVideoUrl(data.url);
            } else {
              setImages(prev => [...prev, data.url]);
            }
            continue;
          }
        }
      } catch (err) {
        console.warn('Fallback to local DataURL', err);
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          if (file.type.startsWith('video/')) {
            setVideoUrl(event.target.result);
          } else {
            setImages(prev => [...prev, event.target.result]);
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files || []);
    const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

    for (const file of files) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('bucket', file.type.startsWith('video/') ? 'videos' : 'product-images');

        const res = await fetch(`${API_BASE}/api/admin/upload`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('holux_auth_token') || 'mock_token'}`
          },
          body: formData
        });

        if (res.ok) {
          const data = await res.json();
          if (data.url) {
            if (file.type.startsWith('video/')) {
              setVideoUrl(data.url);
            } else {
              setImages(prev => [...prev, data.url]);
            }
            continue;
          }
        }
      } catch (err) {
        console.warn('Fallback to local DataURL', err);
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          if (file.type.startsWith('video/')) {
            setVideoUrl(event.target.result);
          } else {
            setImages(prev => [...prev, event.target.result]);
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans text-gray-900">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md transition-opacity" onClick={onClose} />

      {/* Modal Container */}
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200 flex flex-col max-h-[92vh] z-10 animate-in fade-in zoom-in duration-200">
        
        {/* Modal Header */}
        <div className="bg-[#1C2321] text-white px-6 py-4 flex items-center justify-between border-b border-[#3C6E71]/30">
          <div className="flex items-center gap-3">
            <span className="bg-[#B85C38] text-white p-2 rounded-lg font-black">
              <Sparkles className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-display text-base font-bold tracking-wider uppercase">
                {product ? `EDITAR PRODUCTO: ${product.name}` : 'NUEVO PRODUCTO DE CATÁLOGO'}
              </h3>
              <p className="text-xs text-gray-400">Subida directa desde PC (Drag & Drop), video, variantes y SEO</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {product && onDuplicate && (
              <button
                type="button"
                onClick={() => onDuplicate(product)}
                className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-white rounded text-xs font-display font-bold tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer border border-gray-700"
                title="Duplicar este producto"
              >
                <Copy className="w-3.5 h-3.5" />
                DUPLICAR
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-white/10 rounded-lg transition-colors cursor-pointer text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto p-6 space-y-6 bg-gray-50 text-xs">
          
          {/* 1. INFORMACIÓN GENERAL */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
            <h4 className="font-display text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-2">
              <Tag className="w-4 h-4 text-[#3C6E71]" />
              INFORMACIÓN GENERAL DEL PRODUCTO
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Nombre del Producto *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Campera Cortavientos Fitz Roy Extreme"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-[#3C6E71] outline-none font-medium"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Marca *</label>
                <input
                  type="text"
                  required
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="Ej: HOLUX Outdoor"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-[#3C6E71] outline-none font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Categoría Principal *</label>
                <select
                  required
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-[#3C6E71] outline-none bg-white font-bold text-gray-800"
                >
                  <option value="">Seleccionar Categoría</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Etiquetas / Tags (separados por coma)</label>
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="Ej: Trekking, Impermeable, Nieve"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-[#3C6E71] outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Descripción Técnica Completa</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detalla materiales (Gore-Tex, Cordura), impermeabilidad (10.000mm), uso recomendado, etc."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-[#3C6E71] outline-none"
              />
            </div>

            {/* Curation Checkboxes */}
            <div className="flex flex-wrap gap-4 pt-2 border-t border-gray-100">
              <label className="flex items-center gap-2 cursor-pointer font-bold text-xs">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="w-4 h-4 text-[#3C6E71] rounded border-gray-300 focus:ring-[#3C6E71]"
                />
                <span className="bg-amber-100 text-amber-900 px-2.5 py-1 rounded-lg border border-amber-300 font-display">⭐ MOSTRAR EN DESTACADOS PORTADA</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer font-bold text-xs">
                <input
                  type="checkbox"
                  checked={isNew}
                  onChange={(e) => setIsNew(e.target.checked)}
                  className="w-4 h-4 text-[#3C6E71] rounded border-gray-300 focus:ring-[#3C6E71]"
                />
                <span className="bg-blue-100 text-blue-900 px-2.5 py-1 rounded-lg border border-blue-300 font-display">🔥 MOSTRAR EN NOVEDADES / NUEVOS</span>
              </label>
            </div>
          </div>

          {/* 2. PRECIOS, COSTO INTERNO Y MARGEN AUTOMÁTICO */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <h4 className="font-display text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                PRECIOS, COSTO INTERNO Y MARGEN AUTOMÁTICO
              </h4>
              {cost > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-500 font-bold uppercase">Margen Est.:</span>
                  <span className={`px-2.5 py-1 rounded-full font-mono-custom font-bold text-xs ${Number(marginPercentage) >= 40 ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-amber-100 text-amber-800 border border-amber-300'}`}>
                    +{marginPercentage}% (${netProfit.toLocaleString()} ARS)
                  </span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Precio Normal (ARS $)</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-[#3C6E71] outline-none font-mono-custom font-bold text-gray-800"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Precio de Oferta (ARS $)</label>
                <input
                  type="number"
                  min="0"
                  value={offerPrice}
                  onChange={(e) => setOfferPrice(e.target.value)}
                  placeholder="Dejar en 0 si no aplica"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-[#3C6E71] outline-none font-mono-custom font-bold text-emerald-700"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Costo Interno (ARS $)</label>
                <input
                  type="number"
                  min="0"
                  value={costPrice}
                  onChange={(e) => setCostPrice(e.target.value)}
                  placeholder="Costo de compra/producción"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-[#3C6E71] outline-none font-mono-custom text-gray-600"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Stock Global</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-[#3C6E71] outline-none font-bold"
                />
              </div>
            </div>
          </div>

          {/* 3. GALERÍA DE IMÁGENES Y VIDEO DEMOSTRATIVO CON SUBIDA LOCAL & DRAG & DROP */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
            <h4 className="font-display text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-2">
              <ImageIcon className="w-4 h-4 text-[#B85C38]" />
              MULTIMEDIA: SUBIR DESDE MI PC (DRAG & DROP) O VÍA URL
            </h4>

            {/* Drag & Drop Box */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className="border-2 border-dashed border-[#3C6E71]/40 hover:border-[#3C6E71] rounded-xl p-6 bg-gray-50 hover:bg-[#3C6E71]/5 transition-all text-center cursor-pointer group"
            >
              <input
                type="file"
                id="file-upload-input"
                multiple
                accept="image/*,video/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <label htmlFor="file-upload-input" className="cursor-pointer block">
                <div className="w-12 h-12 rounded-full bg-[#3C6E71]/10 text-[#3C6E71] group-hover:scale-110 flex items-center justify-center mx-auto mb-2 transition-transform">
                  <ImageIcon className="w-6 h-6" />
                </div>
                <p className="font-display font-bold text-xs text-gray-800">
                  ARRASTRÁ ARCHIVOS AQUÍ O HACÉ CLIC PARA BUSCAR EN TU EQUIPO
                </p>
                <p className="text-[10px] text-gray-400 mt-1">
                  Soporta archivos de imagen (JPG, PNG, WEBP) y videos (MP4, WEBM)
                </p>
              </label>
            </div>

            {/* List of images */}
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-2">Imágenes del Producto ({images.length})</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                {images.map((img, idx) => (
                  <div key={idx} className="relative group border border-gray-200 rounded-lg overflow-hidden bg-gray-100 h-28 flex items-center justify-center">
                    <img src={img} alt={`Preview ${idx}`} className="w-full h-full object-cover" />
                    {idx === 0 && (
                      <span className="absolute top-1 left-1 bg-[#3C6E71] text-white px-1.5 py-0.5 rounded text-[8px] font-bold tracking-wider font-display shadow">
                        PRINCIPAL
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow"
                      title="Eliminar imagen"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="url"
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  placeholder="O pegar URL web de imagen (http://...)"
                  className="flex-grow px-3 py-2 border border-gray-300 rounded-lg focus:border-[#3C6E71] outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddImage}
                  className="px-4 py-2 bg-[#3C6E71] hover:bg-[#3C6E71]/90 text-white font-display font-bold rounded-lg flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  AÑADIR URL
                </button>
              </div>
            </div>

            {/* Video URL & Local Video */}
            <div className="pt-2 border-t border-gray-100 space-y-2">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                <Video className="w-3.5 h-3.5 text-red-500" />
                Video Demostrativo (URL de YouTube / Vimeo / MP4 o Archivo Local)
              </label>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=... o archivo local"
                  className="flex-grow px-3 py-2 border border-gray-300 rounded-lg focus:border-[#3C6E71] outline-none font-mono-custom text-xs"
                />
                <input
                  type="file"
                  id="video-upload-file"
                  accept="video/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <label
                  htmlFor="video-upload-file"
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white font-display font-bold rounded-lg flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Video className="w-4 h-4" />
                  SUBIR VIDEO PC
                </label>
              </div>

              {videoUrl && videoUrl.startsWith('data:video') && (
                <div className="mt-2 p-2 bg-black rounded-lg overflow-hidden max-w-sm">
                  <video src={videoUrl} controls className="w-full h-36 rounded" />
                </div>
              )}
            </div>
          </div>

          {/* 4. VARIANTES (TALLE, COLOR, MATERIAL, STOCK Y PRECIO PROPIO) */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
            <h4 className="font-display text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-2">
              <Layers className="w-4 h-4 text-purple-600" />
              VARIANTES DE PRODUCTO (TALLES, COLORES & PRECIOS ESPECÍFICOS)
            </h4>

            <div className="space-y-2">
              {variants.map((v) => (
                <div key={v.id} className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-xs">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-gray-800">{v.name}</span>
                    <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded font-mono-custom text-[10px]">
                      Stock: {v.stock} uds.
                    </span>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="font-mono-custom font-bold text-gray-800">
                      ARS ${Number(v.price).toLocaleString()}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveVariant(v.id)}
                      className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add new variant controls */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-2 border-t border-gray-100">
              <input
                type="text"
                value={newVarName}
                onChange={(e) => setNewVarName(e.target.value)}
                placeholder="Nombre variante (Ej: Talle M - Azul)"
                className="px-3 py-1.5 border border-gray-300 rounded-lg focus:border-[#3C6E71] outline-none"
              />
              <input
                type="number"
                min="0"
                value={newVarStock}
                onChange={(e) => setNewVarStock(e.target.value)}
                placeholder="Stock variante"
                className="px-3 py-1.5 border border-gray-300 rounded-lg focus:border-[#3C6E71] outline-none"
              />
              <input
                type="number"
                min="0"
                value={newVarPrice}
                onChange={(e) => setNewVarPrice(e.target.value)}
                placeholder="Precio específico (opcional)"
                className="px-3 py-1.5 border border-gray-300 rounded-lg focus:border-[#3C6E71] outline-none"
              />
              <button
                type="button"
                onClick={handleAddVariant}
                className="px-4 py-1.5 bg-gray-800 hover:bg-gray-700 text-white font-display font-bold rounded-lg flex items-center justify-center gap-1 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                AGREGAR VARIANTE
              </button>
            </div>
          </div>

          {/* 5. CONFIGURACIÓN SEO Y METAETIQUETAS */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
            <h4 className="font-display text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-2">
              <Search className="w-4 h-4 text-blue-600" />
              OPTIMIZACIÓN PARA BUSCADORES (SEO)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Slug / URL amigable</label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="campera-impermeable-fitz-roy"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-[#3C6E71] outline-none font-mono-custom text-xs"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Meta Título (SEO)</label>
                <input
                  type="text"
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                  placeholder="Título para Google"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-[#3C6E71] outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Meta Descripción (SEO)</label>
              <textarea
                rows={2}
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                placeholder="Descripción corta para aparecer en resultados de búsqueda de Google"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-[#3C6E71] outline-none"
              />
            </div>
          </div>

          {/* Modal Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-xl font-display text-xs font-bold tracking-wider hover:bg-gray-100 transition-colors cursor-pointer"
            >
              CANCELAR
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-[#3C6E71] hover:bg-[#3C6E71]/90 text-white rounded-xl font-display text-xs font-bold tracking-wider transition-all shadow-md shadow-[#3C6E71]/20 cursor-pointer"
            >
              GUARDAR PRODUCTO
            </button>
          </div>

        </form>

        <ConfirmationModal
          isOpen={isConfirmOpen}
          onClose={() => setIsConfirmOpen(false)}
          onConfirm={handleConfirmSave}
          title="¿GUARDAR CAMBIOS EN EL PRODUCTO?"
          message={`¿Estás seguro de que deseas guardar los cambios realizados en el producto "${name}"? Impactarán de inmediato en la tienda.`}
        />
      </div>
    </div>
  );
}
