import React from 'react';
import { X, Ruler } from 'lucide-react';

export default function SizeGuideModal({
  isOpen,
  onClose,
  category = 'tops',
  productName
}) {
  if (!isOpen) return null;

  const isFootwear = category === 'footwear' || (productName && (productName.toLowerCase().includes('bota') || productName.toLowerCase().includes('zapatilla')));

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 font-sans">
      <div className="bg-white rounded-xl max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-gray-100 text-left relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-900 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
          <div className="p-2 bg-emerald-50 text-[#3C6E71] rounded-lg">
            <Ruler className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-display font-black text-lg text-gray-900 uppercase">
              Tabla de Medidas y Talles
            </h3>
            <p className="text-xs text-gray-500 font-sans">
              {isFootwear ? 'Medidas de plantilla interior para calzado de montaña' : 'Medidas anatómicas en centímetros (cm)'}
            </p>
          </div>
        </div>

        {isFootwear ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-gray-700">
              <thead className="bg-gray-50 uppercase font-bold text-gray-900 text-[11px]">
                <tr>
                  <th className="p-2.5">Talle AR / EUR</th>
                  <th className="p-2.5">Largo de Pie (cm)</th>
                  <th className="p-2.5">US Men</th>
                  <th className="p-2.5">UK</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                <tr><td className="p-2.5 font-bold">39</td><td className="p-2.5">25.0 cm</td><td className="p-2.5">7.0</td><td className="p-2.5">6.0</td></tr>
                <tr><td className="p-2.5 font-bold">40</td><td className="p-2.5">25.5 cm</td><td className="p-2.5">7.5</td><td className="p-2.5">6.5</td></tr>
                <tr><td className="p-2.5 font-bold">41</td><td className="p-2.5">26.5 cm</td><td className="p-2.5">8.5</td><td className="p-2.5">7.5</td></tr>
                <tr><td className="p-2.5 font-bold">42</td><td className="p-2.5">27.0 cm</td><td className="p-2.5">9.0</td><td className="p-2.5">8.0</td></tr>
                <tr><td className="p-2.5 font-bold">43</td><td className="p-2.5">28.0 cm</td><td className="p-2.5">10.0</td><td className="p-2.5">9.0</td></tr>
                <tr><td className="p-2.5 font-bold">44</td><td className="p-2.5">28.5 cm</td><td className="p-2.5">10.5</td><td className="p-2.5">9.5</td></tr>
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-gray-700">
              <thead className="bg-gray-50 uppercase font-bold text-gray-900 text-[11px]">
                <tr>
                  <th className="p-2.5">Talle</th>
                  <th className="p-2.5">Pecho (cm)</th>
                  <th className="p-2.5">Cintura (cm)</th>
                  <th className="p-2.5">Cadera (cm)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                <tr><td className="p-2.5 font-bold">S</td><td className="p-2.5">88 - 94</td><td className="p-2.5">76 - 82</td><td className="p-2.5">90 - 96</td></tr>
                <tr><td className="p-2.5 font-bold">M</td><td className="p-2.5">95 - 102</td><td className="p-2.5">83 - 90</td><td className="p-2.5">97 - 104</td></tr>
                <tr><td className="p-2.5 font-bold">L</td><td className="p-2.5">103 - 110</td><td className="p-2.5">91 - 98</td><td className="p-2.5">105 - 112</td></tr>
                <tr><td className="p-2.5 font-bold">XL</td><td className="p-2.5">111 - 118</td><td className="p-2.5">99 - 106</td><td className="p-2.5">113 - 120</td></tr>
                <tr><td className="p-2.5 font-bold">XXL</td><td className="p-2.5">119 - 126</td><td className="p-2.5">107 - 114</td><td className="p-2.5">121 - 128</td></tr>
              </tbody>
            </table>
          </div>
        )}

        <div className="p-3 bg-gray-50 border border-gray-150 rounded-lg text-xs text-gray-600">
          <p className="font-bold text-gray-800 mb-1">Consejo de ajuste técnico:</p>
          <p>
            {isFootwear 
              ? 'Para calzado de trekking, recomendamos elegir medio punto o un punto adicional para permitir el uso de medias térmicas gruesas sin comprimir los dedos en los descensos.'
              : 'Nuestras camperas cuentan con corte técnico ergonómico para permitir capas intermedias (polar o abrigo liviano) debajo.'}
          </p>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 bg-[#1C2321] hover:bg-[#3C6E71] text-white font-display text-xs font-bold rounded-lg transition-colors cursor-pointer"
        >
          ENTENDIDO
        </button>
      </div>
    </div>
  );
}
