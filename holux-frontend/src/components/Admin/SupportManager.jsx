import React, { useState } from 'react';
import { MessageSquare, CheckCircle2, Clock, AlertCircle, Send, User, Search, Tag, Filter } from 'lucide-react';

export default function SupportManager() {
  const [tickets, setTickets] = useState([]);

  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [filterStatus, setFilterStatus] = useState('TODOS');

  const handleSendReply = (e) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedTicket) return;

    const newMsg = {
      sender: 'admin',
      text: replyText.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updated = tickets.map(t => {
      if (t.id === selectedTicket.id) {
        return {
          ...t,
          status: 'EN PROCESO',
          messages: [...t.messages, newMsg]
        };
      }
      return t;
    });

    setTickets(updated);
    setSelectedTicket({
      ...selectedTicket,
      status: 'EN PROCESO',
      messages: [...selectedTicket.messages, newMsg]
    });
    setReplyText('');
  };

  const handleUpdateStatus = (ticketId, newStatus) => {
    const updated = tickets.map(t => t.id === ticketId ? { ...t, status: newStatus } : t);
    setTickets(updated);
    if (selectedTicket && selectedTicket.id === ticketId) {
      setSelectedTicket({ ...selectedTicket, status: newStatus });
    }
  };

  const filteredTickets = filterStatus === 'TODOS'
    ? tickets
    : tickets.filter(t => t.status === filterStatus);

  return (
    <div className="space-y-6 text-left font-sans text-gray-900">
      
      {/* Header Banner */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex items-center justify-between">
        <div>
          <h3 className="font-display text-sm font-bold uppercase tracking-wider text-gray-900 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-[#3C6E71]" />
            CENTRO DE SOPORTE & ATENCIÓN AL CLIENTE
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Gestión centralizada de tickets de consulta, reclamos y soporte post-venta.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-xl">
          {['TODOS', 'ABIERTO', 'EN PROCESO', 'RESUELTO'].map(st => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1 rounded-lg text-xs font-display font-bold tracking-wider cursor-pointer transition-all ${filterStatus === st ? 'bg-[#3C6E71] text-white shadow-sm' : 'text-gray-600 hover:text-black'}`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Ticket List & Conversation Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Ticket List */}
        <div className="lg:col-span-5 bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-3">
          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100 pb-2 flex items-center justify-between">
            <span>TICKETS RECIBIDOS ({filteredTickets.length})</span>
            <Filter className="w-3.5 h-3.5" />
          </h4>

          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {filteredTickets.length > 0 ? (
              filteredTickets.map(t => (
                <div
                  key={t.id}
                  onClick={() => setSelectedTicket(t)}
                  className={`p-3.5 border rounded-xl cursor-pointer transition-all text-xs space-y-1.5 ${selectedTicket?.id === t.id ? 'border-[#3C6E71] bg-[#3C6E71]/5 shadow-sm' : 'border-gray-200 hover:bg-gray-50'}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono-custom font-bold text-[10px] text-gray-400">{t.id}</span>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${t.status === 'ABIERTO' ? 'bg-amber-100 text-amber-800' : t.status === 'EN PROCESO' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'}`}>
                      {t.status}
                    </span>
                  </div>

                  <h5 className="font-bold text-gray-900 font-display line-clamp-1">{t.subject}</h5>

                  <div className="flex items-center justify-between text-[10px] text-gray-500">
                    <span className="font-medium">{t.customer_name}</span>
                    <span>{t.created_at}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-16 px-4 text-center text-gray-400 space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto stroke-1" />
                <p className="font-display font-bold text-xs uppercase tracking-wider text-gray-700">
                  BANDEJA AL DÍA
                </p>
                <p className="text-[11px] text-gray-400 max-w-xs mx-auto">
                  No hay tickets de soporte recibidos por el momento.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Selected Conversation Panel */}
        <div className="lg:col-span-7 bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex flex-col min-h-[500px]">
          {selectedTicket ? (
            <div className="flex flex-col h-full space-y-4">
              
              {/* Ticket Detail Header */}
              <div className="border-b border-gray-200 pb-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono-custom text-xs font-bold text-gray-400">{selectedTicket.id}</span>
                    <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-[10px] font-bold">
                      {selectedTicket.category}
                    </span>
                  </div>
                  <h3 className="font-display font-bold text-sm text-gray-900">{selectedTicket.subject}</h3>
                  <p className="text-xs text-gray-500 font-medium">{selectedTicket.customer_name} ({selectedTicket.customer_email})</p>
                </div>

                {/* Change status control */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-400 font-bold uppercase">Estado:</span>
                  <select
                    value={selectedTicket.status}
                    onChange={(e) => handleUpdateStatus(selectedTicket.id, e.target.value)}
                    className="px-2 py-1 border border-gray-300 rounded text-xs font-bold bg-white focus:border-[#3C6E71] outline-none cursor-pointer"
                  >
                    <option value="ABIERTO">ABIERTO</option>
                    <option value="EN PROCESO">EN PROCESO</option>
                    <option value="RESUELTO">RESUELTO</option>
                  </select>
                </div>
              </div>

              {/* Message Chat History */}
              <div className="flex-grow space-y-3 overflow-y-auto p-3 bg-gray-50 rounded-xl border border-gray-200 max-h-[360px] text-xs">
                {selectedTicket.messages.map((m, idx) => (
                  <div
                    key={idx}
                    className={`flex flex-col ${m.sender === 'admin' ? 'items-end' : 'items-start'}`}
                  >
                    <div className={`max-w-[80%] p-3 rounded-2xl space-y-1 ${m.sender === 'admin' ? 'bg-[#3C6E71] text-white rounded-br-none' : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm'}`}>
                      <p className="leading-relaxed">{m.text}</p>
                      <span className={`text-[9px] block text-right font-mono-custom ${m.sender === 'admin' ? 'text-gray-300' : 'text-gray-400'}`}>
                        {m.time} {m.sender === 'admin' ? '• Soporte HOLUX' : ''}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Reply Box */}
              <form onSubmit={handleSendReply} className="flex gap-2 pt-2">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Escribí una respuesta oficial para el cliente..."
                  className="flex-grow px-3 py-2 border border-gray-300 rounded-xl text-xs outline-none focus:border-[#3C6E71] bg-white font-medium"
                />
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#3C6E71] hover:bg-[#3C6E71]/90 text-white font-display font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md shadow-[#3C6E71]/20 transition-all"
                >
                  <Send className="w-4 h-4" />
                  RESPONDER
                </button>
              </form>

            </div>
          ) : (
            <div className="flex-grow flex flex-col items-center justify-center text-center p-8 text-gray-400 space-y-2">
              <MessageSquare className="w-12 h-12 stroke-1 text-gray-300" />
              <p className="font-display font-bold text-xs uppercase tracking-wider text-gray-500">
                SELECCIONÁ UN TICKET PARA VER LA CONVERSACIÓN
              </p>
              <p className="text-[11px] max-w-xs">
                Podés responder consultas de clientes, cambiar estados o marcar tickets como resueltos.
              </p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
