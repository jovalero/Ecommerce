import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Image as ImageIcon, Video, Copy, Tag, DollarSign, Layers, Search, Sparkles, GripVertical, ArrowUp, ArrowDown, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import ConfirmationModal from './ConfirmationModal';
import { SmoothInput, SmoothTextarea } from '../Common/SmoothInput';

export default function ProductEditModal({ product, categories = [], onClose, onSave, onDuplicate }) {
  // Basic info
  const [name, setName] = useState(product?.name || '');
  const [brand, setBrand] = useState(product?.brand || 'HOLUX');
  const [categoryIds, setCategoryIds] = useState(() => {
    if (Array.isArray(product?.category_ids) && product.category_ids.length > 0) {
      return product.category_ids;
    }
    if (product?.category_id) {
      return [product.category_id];
    }
    return categories[0]?.id ? [categories[0].id] : [];
  });
  const [categoryId, setCategoryId] = useState(product?.category_id || (categories[0]?.id || ''));
  const [description, setDescription] = useState(product?.description || '');

  const toggleCategory = (catId) => {
    setCategoryIds(prev => {
      let updated;
      if (prev.includes(catId)) {
        if (prev.length === 1) return prev;
        updated = prev.filter(id => id !== catId);
      } else {
        updated = [...prev, catId];
      }
      if (updated.length > 0) {
        setCategoryId(updated[0]);
      }
      return updated;
    });
  };
  const [specs, setSpecs] = useState(() => {
    if (Array.isArray(product?.specs)) return product.specs.join('\n');
    if (Array.isArray(product?.specifications)) return product.specifications.join('\n');
    if (typeof product?.specs === 'string') return product.specs;
    if (typeof product?.specifications === 'string') return product.specifications;
    return '';
  });
  const [tags, setTags] = useState(product?.tags ? product.tags.join(', ') : 'Fragancias, Perfumes, Nicho');

  // Pricing & Costs
  const [price, setPrice] = useState(product?.price || 0);
  const [offerPrice, setOfferPrice] = useState(product?.offer_price || 0);
  const [costPrice, setCostPrice] = useState(product?.cost_price || 0);
  const [stock, setStock] = useState(product?.stock ?? 10);
  const [installments, setInstallments] = useState(product?.installments || 6);

  // Media (Images & Video)
  const [images, setImages] = useState(
    Array.isArray(product?.images) && product.images.length > 0
      ? product.images
      : (product?.image_url ? [product.image_url] : ['https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&auto=format&fit=crop&q=80'])
  );
  const [newImageUrl, setNewImageUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState(product?.video_url || '');

  // Variants State & Drag & Drop Reordering
  const [variants, setVariants] = useState(
    Array.isArray(product?.variants) ? product.variants : []
  );
  const [draggedVarIndex, setDraggedVarIndex] = useState(null);
  const [dragOverVarIndex, setDragOverVarIndex] = useState(null);
  const [newVarName, setNewVarName] = useState('');
  const [newVarStock, setNewVarStock] = useState(10);
  const [newVarPrice, setNewVarPrice] = useState(0);

  const handleDragStartVar = (e, index) => {
    setDraggedVarIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index);
  };

  const handleDragOverVar = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverVarIndex !== index) {
      setDragOverVarIndex(index);
    }
  };

  const handleDropVar = (e, targetIndex) => {
    e.preventDefault();
    if (draggedVarIndex === null || draggedVarIndex === targetIndex) {
      setDraggedVarIndex(null);
      setDragOverVarIndex(null);
      return;
    }
    setVariants(prev => {
      const updated = [...prev];
      const [removed] = updated.splice(draggedVarIndex, 1);
      updated.splice(targetIndex, 0, removed);
      return updated;
    });
    setDraggedVarIndex(null);
    setDragOverVarIndex(null);
  };

  const handleMoveVariant = (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= variants.length) return;
    setVariants(prev => {
      const updated = [...prev];
      const [item] = updated.splice(index, 1);
      updated.splice(targetIndex, 0, item);
      return updated;
    });
  };

  const handleAddVariant = () => {
    if (!newVarName || !newVarName.trim()) return;
    const newVariant = {
      id: Date.now(),
      name: newVarName.trim(),
      stock: Number(newVarStock) || 0,
      price: Number(newVarPrice) || Number(price) || 100
    };
    setVariants(prev => [...prev, newVariant]);
    setNewVarName('');
    setNewVarStock(10);
    setNewVarPrice(0);
  };

  const handleRemoveVariant = (id) => {
    setVariants(prev => prev.filter(v => v.id !== id));
  };

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

  const [draggedImageIndex, setDraggedImageIndex] = useState(null);

  const handleSetMainImage = (idx) => {
    if (idx === 0) return;
    const selected = images[idx];
    const remaining = images.filter((_, i) => i !== idx);
    setImages([selected, ...remaining]);
  };

  const handleMoveImage = (idx, direction) => {
    const targetIdx = idx + direction;
    if (targetIdx < 0 || targetIdx >= images.length) return;
    const updated = [...images];
    const temp = updated[idx];
    updated[idx] = updated[targetIdx];
    updated[targetIdx] = temp;
    setImages(updated);
  };

  const handleImageDragStart = (e, idx) => {
    setDraggedImageIndex(idx);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleImageDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleImageDrop = (e, targetIdx) => {
    e.preventDefault();
    if (draggedImageIndex === null || draggedImageIndex === targetIdx) return;
    const updated = [...images];
    const [draggedItem] = updated.splice(draggedImageIndex, 1);
    updated.splice(targetIdx, 0, draggedItem);
    setImages(updated);
    setDraggedImageIndex(null);
  };

  // Curation Flags
  const [isFeatured, setIsFeatured] = useState(product?.is_featured || false);
  const [isNew, setIsNew] = useState(product?.is_new || false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

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
      category_id: categoryIds[0] || categoryId || categories[0]?.id || '',
      category_ids: categoryIds,
      description,
      specs: specs ? specs.split('\n').map(s => s.trim()).filter(Boolean) : [],
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
            'Authorization': `Bearer ${localStorage.getItem('user_token') || localStorage.getItem('holux_auth_token') || ''}`
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
            'Authorization': `Bearer ${localStorage.getItem('user_token') || localStorage.getItem('holux_auth_token') || ''}`
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
                <SmoothInput
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
                <SmoothInput
                  type="text"
                  required
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="Ej: HOLUX Outdoor"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-[#3C6E71] outline-none font-medium"
                />
              </div>
            </div>

            {/* Categorías Múltiples (Checkboxes) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                  Categorías a las que pertenece el producto (Podés marcar varias) *
                </label>
                <span className="text-[10px] text-[#3C6E71] font-mono-custom font-bold bg-[#3C6E71]/10 px-2 py-0.5 rounded-full">
                  {categoryIds.length} seleccionada{categoryIds.length === 1 ? '' : 's'}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 bg-gray-50/80 p-3 rounded-xl border border-gray-200">
                {categories.map(cat => {
                  const isChecked = categoryIds.includes(cat.id);
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => toggleCategory(cat.id)}
                      className={`flex items-center gap-2.5 p-2.5 rounded-lg border text-xs cursor-pointer transition-all text-left ${
                        isChecked
                          ? 'bg-[#3C6E71]/10 border-[#3C6E71] text-[#3C6E71] shadow-2xs font-bold'
                          : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300 font-medium'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded flex items-center justify-center border transition-all shrink-0 ${
                        isChecked ? 'bg-[#3C6E71] border-[#3C6E71] text-white' : 'border-gray-300 bg-white'
                      }`}>
                        {isChecked && (
                          <svg className="w-3 h-3 fill-current" viewBox="0 0 20 20">
                            <path d="M0 11l2-2 5 5L18 3l2 2L7 18z"/>
                          </svg>
                        )}
                      </div>
                      <span className="truncate">{cat.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                Etiquetas / Tags adicionales (separados por coma)
              </label>
              <SmoothInput
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="Ej: Unisex, Amaderado, Cítrico, Noche, Verano"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-[#3C6E71] outline-none text-xs"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Descripción del Producto</label>
              <SmoothTextarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detalla notas olfativas de salida, corazón y fondo, acordes principales, fijación, etc."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-[#3C6E71] outline-none text-xs font-sans"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                  Detalles y Especificaciones (1 viñeta por línea)
                </label>
                <span className="text-[10px] text-gray-400 font-mono-custom">
                  Se muestran como viñetas debajo de la descripción
                </span>
              </div>
              <SmoothTextarea
                rows={4}
                value={specs}
                onChange={(e) => setSpecs(e.target.value)}
                placeholder={"100% Original en caja sellada con celofán y estampilla de importación\nConcentración Eau de Parfum (EDP) de alta fijación y proyección\nBatch code y número de serie verificable\nGarantía oficial Holux de autenticidad"}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-[#3C6E71] outline-none font-sans text-xs"
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

          {/* 2. PRECIOS, OFERTAS Y DESCUENTOS (% OFF) */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <h4 className="font-display text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                PRECIOS, OFERTAS Y DESCUENTOS (% OFF)
              </h4>
              {cost > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-500 font-bold uppercase">Margen Est.:</span>
                  <span className={`px-2.5 py-1 rounded-full font-mono-custom font-bold text-xs ${Number(marginPercentage) >= 40 ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-amber-100 text-amber-800 border border-amber-300'}`}>
                    +{marginPercentage}% (${(effectiveSellPrice - cost).toLocaleString('es-AR')} ARS)
                  </span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Precio Normal / Lista (ARS $) *</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-[#3C6E71] outline-none font-mono-custom font-bold text-gray-800 text-sm"
                  placeholder="Ej: 120000"
                />
                <span className="text-[10px] text-gray-400 mt-1 block">Precio base tachado si hay oferta</span>
              </div>

              <div>
                <label className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block mb-1">
                  Precio de Oferta / Venta (ARS $)
                </label>
                <input
                  type="number"
                  min="0"
                  value={offerPrice}
                  onChange={(e) => setOfferPrice(e.target.value)}
                  placeholder="0 para desactivar"
                  className="w-full px-3 py-2 border border-emerald-300 bg-emerald-50/30 rounded-lg focus:border-emerald-600 outline-none font-mono-custom font-bold text-emerald-800 text-sm"
                />
                <span className="text-[10px] text-emerald-600 mt-1 block font-medium">Dejar en 0 si no tiene descuento</span>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Costo Interno (ARS $)</label>
                <input
                  type="number"
                  min="0"
                  value={costPrice}
                  onChange={(e) => setCostPrice(e.target.value)}
                  placeholder="Costo de producción/compra"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-[#3C6E71] outline-none font-mono-custom text-gray-600"
                />
                <span className="text-[10px] text-gray-400 mt-1 block">Para calcular rentabilidad interna</span>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Stock Global Disponible *</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-[#3C6E71] outline-none font-bold font-mono-custom text-gray-900"
                />
                <span className="text-[10px] text-gray-400 mt-1 block">Unidades en inventario</span>
              </div>
            </div>

            {/* Quick Percentage Helper & Live Badge Preview */}
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">
                  ⚡ Asistente Rápido de % de Descuento:
                </span>
                <div className="flex flex-wrap items-center gap-1.5">
                  {[10, 15, 20, 25, 30, 35, 40, 50].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => {
                        const base = Number(price) || 0;
                        if (base > 0) {
                          const newOffer = Math.round(base * (1 - pct / 100));
                          setOfferPrice(newOffer);
                        }
                      }}
                      className="px-2 py-1 bg-white hover:bg-gray-200 border border-gray-300 rounded text-[10px] font-bold font-mono-custom cursor-pointer transition-all"
                    >
                      {pct}% OFF
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setOfferPrice(0)}
                    className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded text-[10px] font-bold cursor-pointer transition-all"
                  >
                    ✕ Quitar Oferta
                  </button>
                </div>
              </div>

              {/* Live Badge Preview Box */}
              {(() => {
                const baseP = Number(price) || 0;
                const offP = Number(offerPrice) || 0;
                const isOfferActive = offP > 0 && offP < baseP;
                const pct = isOfferActive ? Math.round(((baseP - offP) / baseP) * 100) : 0;
                const savings = isOfferActive ? baseP - offP : 0;

                if (isOfferActive) {
                  return (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="bg-[#3C6E71] text-white text-xs font-sans font-semibold tracking-wider px-3 py-1 rounded-full shadow-xs">
                          {pct}%
                        </span>
                        <div>
                          <p className="text-xs font-bold text-gray-900">
                            ¡Oferta Activa! Precio final: <span className="text-emerald-700">${offP.toLocaleString('es-AR')}</span>{' '}
                            <span className="text-gray-400 line-through text-[11px]">${baseP.toLocaleString('es-AR')}</span>
                          </p>
                          <p className="text-[10px] text-emerald-700 font-sans">
                            El cliente ahorra ${savings.toLocaleString('es-AR')} en esta compra.
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div className="p-2.5 bg-gray-100/70 border border-gray-200 rounded-lg text-gray-600 text-xs flex items-center justify-between">
                    <span>
                      ℹ️ <strong>Sin descuento activo:</strong> El producto se mostrará a ${baseP.toLocaleString('es-AR')} sin etiqueta de descuento ni precio tachado.
                    </span>
                  </div>
                );
              })()}
            </div>

            {/* 2.1 FINANCIACIÓN Y CARTEL DE CUOTAS FIJAS */}
            <div className="bg-purple-50/50 p-4 rounded-xl border border-purple-200 space-y-3 pt-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-[11px] font-bold text-purple-900 uppercase tracking-wider block">
                    💳 Cartel de Cuotas Fijas / Financiación Promocional:
                  </span>
                  <span className="text-[10px] text-purple-700">
                    Define cuántas cuotas mostrar en el badge morado de este producto (o poné 0 si no querés mostrar cuotas).
                  </span>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  {[
                    { label: 'Sin cuotas', val: 0 },
                    { label: '3 cuotas', val: 3 },
                    { label: '6 cuotas', val: 6 },
                    { label: '9 cuotas', val: 9 },
                    { label: '12 cuotas', val: 12 }
                  ].map((opt) => (
                    <button
                      key={opt.val}
                      type="button"
                      onClick={() => setInstallments(opt.val)}
                      className={`px-2.5 py-1 rounded text-[10px] font-bold font-mono-custom cursor-pointer transition-all border ${
                        Number(installments) === opt.val
                          ? 'bg-purple-700 text-white border-purple-800 shadow-xs'
                          : 'bg-white text-purple-900 border-purple-200 hover:bg-purple-100'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="w-full sm:w-48">
                  <label className="text-[10px] font-bold text-purple-800 uppercase block mb-1">
                    Número de Cuotas Personalizado:
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="48"
                    value={installments}
                    onChange={(e) => setInstallments(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full px-3 py-1.5 bg-white border border-purple-300 rounded-lg text-xs font-mono-custom font-bold text-purple-950 outline-none"
                    placeholder="0 para desactivar"
                  />
                </div>

                <div className="flex-grow">
                  {Number(installments) > 1 ? (
                    <div className="p-2.5 bg-white border border-purple-200 rounded-lg flex items-center gap-2.5">
                      <span className="bg-[#EBDCF0] text-[#7E3793] text-[10px] font-black px-2.5 py-1 rounded tracking-wide uppercase inline-block font-sans">
                        {installments} CUOTAS FIJAS DE ${Math.round(effectiveSellPrice / Number(installments)).toLocaleString('es-AR')}
                      </span>
                      <span className="text-[11px] text-purple-900 font-medium">
                        ← Así se verá el cartel morado en la tienda para este producto.
                      </span>
                    </div>
                  ) : (
                    <div className="p-2.5 bg-white/70 border border-purple-150 rounded-lg text-purple-800 text-xs">
                      🚫 <strong>Sin cuotas fijas:</strong> Este producto se mostrará sin el cartel morado de cuotas.
                    </div>
                  )}
                </div>
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
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                  Imágenes del Producto ({images.length})
                </label>
                <span className="text-[10px] text-[#3C6E71] font-mono-custom font-semibold">
                  💡 Arrastrá para reordenar o tocá "Hacer Principal"
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-3">
                {images.map((img, idx) => {
                  const isMain = idx === 0;
                  const isDragging = draggedImageIndex === idx;

                  return (
                    <div
                      key={idx}
                      draggable
                      onDragStart={(e) => handleImageDragStart(e, idx)}
                      onDragOver={handleImageDragOver}
                      onDrop={(e) => handleImageDrop(e, idx)}
                      className={`relative group border-2 rounded-xl overflow-hidden bg-gray-100 h-32 flex items-center justify-center transition-all cursor-grab active:cursor-grabbing select-none ${
                        isMain 
                          ? 'border-[#3C6E71] ring-2 ring-[#3C6E71]/25 shadow-sm' 
                          : 'border-gray-200 hover:border-[#3C6E71]/60'
                      } ${isDragging ? 'opacity-30 scale-95' : 'opacity-100'}`}
                    >
                      <img src={img} alt={`Preview ${idx}`} className="w-full h-full object-cover pointer-events-none" />
                      
                      {/* Badge Principal o Botón para Hacer Principal */}
                      {isMain ? (
                        <span className="absolute top-1.5 left-1.5 bg-[#3C6E71] text-white px-2 py-0.5 rounded text-[8px] font-bold tracking-wider font-display shadow flex items-center gap-1 z-10">
                          <Star className="w-2.5 h-2.5 fill-white" />
                          PRINCIPAL
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSetMainImage(idx);
                          }}
                          className="absolute top-1.5 left-1.5 bg-black/80 hover:bg-[#3C6E71] text-white px-2 py-0.5 rounded text-[8px] font-bold tracking-wider font-display shadow opacity-0 group-hover:opacity-100 transition-all cursor-pointer flex items-center gap-1 z-10"
                          title="Establecer como imagen principal del producto"
                        >
                          <Star className="w-2.5 h-2.5" />
                          HACER PRINCIPAL
                        </button>
                      )}

                      {/* Flechas de reordenar rápido a la izquierda / derecha */}
                      <div className="absolute bottom-1.5 left-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                        {idx > 0 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMoveImage(idx, -1);
                            }}
                            className="bg-black/75 hover:bg-black text-white p-1 rounded-md cursor-pointer transition-colors shadow"
                            title="Mover a la izquierda"
                          >
                            <ChevronLeft className="w-3 h-3" />
                          </button>
                        )}
                        {idx < images.length - 1 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMoveImage(idx, 1);
                            }}
                            className="bg-black/75 hover:bg-black text-white p-1 rounded-md cursor-pointer transition-colors shadow"
                            title="Mover a la derecha"
                          >
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>

                      {/* Botón eliminar imagen */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveImage(idx);
                        }}
                        className="absolute top-1.5 right-1.5 bg-red-600 hover:bg-red-700 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-all cursor-pointer shadow z-10"
                        title="Eliminar imagen"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
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
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <h4 className="font-display text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-600" />
                VARIANTES DE PRODUCTO (TALLES, COLORES & PRECIOS ESPECÍFICOS)
              </h4>
              {variants.length > 1 && (
                <span className="text-[10px] text-gray-400 font-medium">
                  💡 Arrastrá con el mouse para reordenar
                </span>
              )}
            </div>

            <div className="space-y-2">
              {variants.map((v, idx) => (
                <div
                  key={v.id || idx}
                  draggable
                  onDragStart={(e) => handleDragStartVar(e, idx)}
                  onDragOver={(e) => handleDragOverVar(e, idx)}
                  onDrop={(e) => handleDropVar(e, idx)}
                  onDragEnd={() => {
                    setDraggedVarIndex(null);
                    setDragOverVarIndex(null);
                  }}
                  className={`flex items-center justify-between bg-white border rounded-xl px-3.5 py-2.5 text-xs transition-all select-none ${
                    draggedVarIndex === idx
                      ? 'border-[#3C6E71] bg-[#3C6E71]/10 opacity-40 shadow-inner'
                      : dragOverVarIndex === idx
                        ? 'border-[#3C6E71] ring-2 ring-[#3C6E71]/30 bg-emerald-50/50 scale-[1.01]'
                        : 'border-gray-200 hover:border-gray-400 bg-gray-50/50 hover:bg-white hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Tirador de agarre para mouse */}
                    <div
                      className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-800 p-1 -ml-1 rounded hover:bg-gray-200 flex items-center justify-center transition-colors"
                      title="Hacé clic y arrastrá para cambiar de posición"
                    >
                      <GripVertical className="w-4 h-4" />
                    </div>

                    <span className="font-bold text-gray-900 text-xs">{v.name}</span>
                    <span className="bg-gray-200/80 text-gray-700 px-2 py-0.5 rounded font-mono-custom text-[10px] font-semibold">
                      Stock: {v.stock} uds.
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-mono-custom font-bold text-gray-800">
                      ARS ${Number(v.price).toLocaleString()}
                    </span>

                    {/* Botones de movimiento rápido */}
                    <div className="flex items-center gap-0.5 border-l border-gray-200 pl-2">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => handleMoveVariant(idx, -1)}
                        className={`p-1 rounded text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors ${idx === 0 ? 'opacity-20 cursor-not-allowed' : 'cursor-pointer'}`}
                        title="Subir un lugar"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === variants.length - 1}
                        onClick={() => handleMoveVariant(idx, 1)}
                        className={`p-1 rounded text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors ${idx === variants.length - 1 ? 'opacity-20 cursor-not-allowed' : 'cursor-pointer'}`}
                        title="Bajar un lugar"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveVariant(v.id)}
                      className="text-red-500 hover:text-red-700 p-1.5 rounded hover:bg-red-50 cursor-pointer transition-colors"
                      title="Eliminar variante"
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
