import React from 'react';
import { X, Star } from 'lucide-react';
import { SmoothTextarea } from '../Common/SmoothInput';

export default function CustomerReviewModal({
  isOpen,
  onClose,
  products = [],
  reviewProdSelect,
  setReviewProdSelect,
  reviewRatingSelect,
  setReviewRatingSelect,
  reviewCommentInput,
  setReviewCommentInput,
  onSubmit
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 font-sans">
      <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-6 shadow-2xl border border-gray-100 text-left relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-900 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
          <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
            <Star className="w-5 h-5 fill-amber-500 text-amber-500" />
          </div>
          <div>
            <h3 className="font-display font-black text-lg text-gray-900 uppercase">
              Valorar un Producto
            </h3>
            <p className="text-xs text-gray-500">Comparte tu experiencia de expedición</p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 text-xs font-sans">
          <div>
            <label className="block text-gray-700 font-bold mb-1">Producto</label>
            <select
              value={reviewProdSelect}
              onChange={(e) => setReviewProdSelect(e.target.value)}
              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-[#3C6E71] cursor-pointer"
            >
              {products.length > 0 ? (
                products.map(p => (
                  <option key={p.id} value={p.name}>{p.name}</option>
                ))
              ) : (
                <option value="Campera Cortavientos Fitz Roy">Campera Cortavientos Fitz Roy</option>
              )}
            </select>
          </div>

          <div>
            <label className="block text-gray-700 font-bold mb-1">Puntuación</label>
            <div className="flex items-center gap-2 pt-1">
              {[1, 2, 3, 4, 5].map(st => (
                <button
                  type="button"
                  key={st}
                  onClick={() => setReviewRatingSelect(st)}
                  className="p-1 cursor-pointer text-amber-400"
                >
                  <Star className={`w-6 h-6 ${st <= reviewRatingSelect ? 'fill-amber-400' : 'text-gray-300'}`} />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-gray-700 font-bold mb-1">Comentario</label>
            <SmoothTextarea
              required
              rows={3}
              value={reviewCommentInput}
              onChange={(e) => setReviewCommentInput(e.target.value)}
              placeholder="¿Qué tal rindió el equipo en tu aventura?"
              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-[#3C6E71]"
            />
          </div>

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="w-1/2 py-2.5 border border-gray-300 text-gray-700 font-display text-xs font-bold rounded-lg hover:bg-gray-50 cursor-pointer"
            >
              CANCELAR
            </button>
            <button
              type="submit"
              className="w-1/2 py-2.5 bg-[#1C2321] hover:bg-[#3C6E71] text-white font-display text-xs font-bold rounded-lg shadow transition-colors cursor-pointer"
            >
              ENVIAR VALORACIÓN
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
