import React, { useState, useEffect, useCallback } from 'react';
import { MessageSquare, CheckCircle2, Clock, AlertCircle, Send, User, Search, Tag, Filter, RefreshCw, Mail, Phone, ExternalLink, Trash2 } from 'lucide-react';

export default function SupportManager({ API_BASE_URL = 'https://holux-api.onrender.com', token }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);
  const [filterStatus, setFilterStatus] = useState('TODOS');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionMessage, setActionMessage] = useState(null);

  const getAuthToken = () => {
    return token || localStorage.getItem('supabase_token') || localStorage.getItem('token') || '';
  };

  const showNotification = (msg, type = 'success') => {
    setActionMessage({ text: msg, type });
    setTimeout(() => setActionMessage(null), 3500);
  };

  // Fetch tickets from backend API (with Supabase Storage CDN instant fallback)
  const fetchTickets = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    const SUPABASE_CDN_URL = 'https://fmbhcfsrsfkglmvgbnlm.supabase.co/storage/v1/object/public/product-images/config/support_tickets.json';

    try {
      const authToken = getAuthToken();
      let ticketList = [];
      let backendSuccess = false;

      // 1. Load directly from permanent Supabase CDN first (instant 200 OK, zero 404 error)
      try {
        const cdnRes = await fetch(`${SUPABASE_CDN_URL}?v=${Date.now()}`);
        if (cdnRes.ok) {
          const cdnData = await cdnRes.json();
          if (Array.isArray(cdnData)) {
            ticketList = cdnData;
          }
        }
      } catch (cdnErr) {
        console.warn('Fallback CDN warning:', cdnErr);
      }

      // 2. If available, sync with live backend API
      if (authToken) {
        try {
          const res = await fetch(`${API_BASE_URL}/api/admin/tickets`, {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${authToken}`
            }
          });

          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data.tickets) && data.tickets.length > 0) {
              ticketList = data.tickets;
            }
          }
        } catch (backendErr) {
          // Backend offline or redeploying
        }
      }

      setTickets(ticketList);

      // Keep selected ticket updated with fresh messages if one was selected
      if (selectedTicket) {
        const fresh = ticketList.find(t => t.id === selectedTicket.id);
        if (fresh) setSelectedTicket(fresh);
      }
    } catch (err) {
      console.error('Error al sincronizar tickets:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [API_BASE_URL, selectedTicket]);

  useEffect(() => {
    fetchTickets();
  }, [API_BASE_URL]);

  // Send admin reply to ticket
  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedTicket || replying) return;

    setReplying(true);
    try {
      const authToken = getAuthToken();
      const res = await fetch(`${API_BASE_URL}/api/admin/tickets/${selectedTicket.id}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
          'apikey': import.meta.env?.VITE_SUPABASE_ANON_KEY || ''
        },
        body: JSON.stringify({ text: replyText.trim() })
      });

      if (res.ok) {
        const data = await res.json();
        const updatedTicket = data.ticket;
        
        // Update local state immediately
        setTickets(prev => prev.map(t => t.id === updatedTicket.id ? updatedTicket : t));
        setSelectedTicket(updatedTicket);
        setReplyText('');
        showNotification('Respuesta oficial enviada al ticket.');
      } else {
        showNotification('No se pudo enviar la respuesta. Reintentá.', 'error');
      }
    } catch (err) {
      console.error('Error al responder ticket:', err);
      showNotification('Error de conexión al responder.', 'error');
    } finally {
      setReplying(false);
    }
  };

  // Update status (ABIERTO, EN PROCESO, RESUELTO)
  const handleUpdateStatus = async (ticketId, newStatus) => {
    try {
      const authToken = getAuthToken();
      const res = await fetch(`${API_BASE_URL}/api/admin/tickets/${ticketId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
          'apikey': import.meta.env?.VITE_SUPABASE_ANON_KEY || ''
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (res.ok) {
        const data = await res.json();
        const updatedTicket = data.ticket;

        setTickets(prev => prev.map(t => t.id === ticketId ? updatedTicket : t));
        if (selectedTicket && selectedTicket.id === ticketId) {
          setSelectedTicket(updatedTicket);
        }
        showNotification(`Estado del ticket cambiado a ${newStatus}.`);
      }
    } catch (err) {
      console.error('Error al actualizar estado:', err);
      showNotification('No se pudo actualizar el estado.', 'error');
    }
  };

  // Delete ticket
  const handleDeleteTicket = async (ticketId) => {
    if (!window.confirm('¿Estás seguro de que deseás eliminar este ticket de consulta?')) return;

    try {
      const authToken = getAuthToken();
      const res = await fetch(`${API_BASE_URL}/api/admin/tickets/${ticketId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'apikey': import.meta.env?.VITE_SUPABASE_ANON_KEY || ''
        }
      });

      if (res.ok) {
        setTickets(prev => prev.filter(t => t.id !== ticketId));
        if (selectedTicket && selectedTicket.id === ticketId) {
          setSelectedTicket(null);
        }
        showNotification('Ticket eliminado con éxito.');
      }
    } catch (err) {
      console.error('Error al eliminar ticket:', err);
    }
  };

  // Filter & Search logic
  const filteredTickets = tickets.filter(t => {
    const matchStatus = filterStatus === 'TODOS' || (t.status || 'ABIERTO') === filterStatus;
    const query = searchQuery.toLowerCase().trim();
    if (!query) return matchStatus;

    const matchQuery = 
      (t.id && t.id.toLowerCase().includes(query)) ||
      (t.customer_name && t.customer_name.toLowerCase().includes(query)) ||
      (t.customer_email && t.customer_email.toLowerCase().includes(query)) ||
      (t.subject && t.subject.toLowerCase().includes(query));

    return matchStatus && matchQuery;
  });

  return (
    <div className="space-y-6 text-left font-sans text-gray-900">
      
      {/* Toast Notification */}
      {actionMessage && (
        <div className={`p-3 rounded-xl text-xs font-bold shadow-md transition-all flex items-center justify-between ${actionMessage.type === 'error' ? 'bg-rose-50 border border-rose-200 text-rose-800' : 'bg-emerald-50 border border-emerald-200 text-emerald-800'}`}>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{actionMessage.text}</span>
          </div>
          <button onClick={() => setActionMessage(null)} className="text-gray-400 hover:text-black">✕</button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-display text-sm font-bold uppercase tracking-wider text-gray-900 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-[#3C6E71]" />
            CENTRO DE SOPORTE & ATENCIÓN AL CLIENTE
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Gestión centralizada y en tiempo real de consultas recibidas desde la tienda web y el panel de usuarios.
          </p>
        </div>

        {/* Filter Pills & Refresh */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
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

          <button
            onClick={() => fetchTickets(true)}
            disabled={refreshing}
            title="Sincronizar tickets desde la nube"
            className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-[#3C6E71]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-3 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar ticket por código (#HLX-...), nombre, email o asunto..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs outline-none focus:border-[#3C6E71] shadow-sm text-gray-800"
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery('')} className="absolute right-3.5 top-2.5 text-xs text-gray-400 hover:text-black">✕</button>
        )}
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
            {loading ? (
              <div className="py-16 text-center text-gray-400 space-y-2">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#3C6E71]" />
                <p className="text-xs font-medium">Cargando consultas de la nube...</p>
              </div>
            ) : filteredTickets.length > 0 ? (
              filteredTickets.map(t => (
                <div
                  key={t.id}
                  onClick={() => setSelectedTicket(t)}
                  className={`p-3.5 border rounded-xl cursor-pointer transition-all text-xs space-y-1.5 ${selectedTicket?.id === t.id ? 'border-[#3C6E71] bg-[#3C6E71]/5 shadow-sm' : 'border-gray-200 hover:bg-gray-50'}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono-custom font-bold text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">{t.id}</span>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${t.status === 'ABIERTO' ? 'bg-amber-100 text-amber-800' : t.status === 'EN PROCESO' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'}`}>
                      {t.status}
                    </span>
                  </div>

                  <h5 className="font-bold text-gray-900 font-display line-clamp-1">{t.subject || 'Consulta sin asunto'}</h5>

                  <div className="flex items-center justify-between text-[10px] text-gray-500">
                    <span className="font-medium truncate max-w-[140px]">{t.customer_name || 'Cliente'}</span>
                    <span className="font-mono-custom">{t.created_at}</span>
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
                  {searchQuery ? 'No se encontraron tickets con esa búsqueda.' : 'No hay tickets de soporte recibidos por el momento.'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Selected Conversation Panel */}
        <div className="lg:col-span-7 bg-white border border-gray-200 rounded-xl p-5 sm:p-6 shadow-sm flex flex-col min-h-[520px]">
          {selectedTicket ? (
            <div className="flex flex-col h-full space-y-4">
              
              {/* Ticket Detail Header */}
              <div className="border-b border-gray-200 pb-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono-custom text-xs font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded">{selectedTicket.id}</span>
                      <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-[10px] font-bold">
                        {selectedTicket.category || 'CONSULTA GENERAL'}
                      </span>
                    </div>
                    <h3 className="font-display font-bold text-base text-gray-900">{selectedTicket.subject}</h3>
                    <p className="text-xs text-gray-600 font-medium">
                      {selectedTicket.customer_name} • <span className="font-mono-custom text-gray-500">{selectedTicket.customer_email}</span>
                      {selectedTicket.customer_phone && <span className="ml-1 font-mono-custom">• Tel: {selectedTicket.customer_phone}</span>}
                    </p>
                  </div>

                  {/* Change status control */}
                  <div className="flex items-center gap-2 self-start sm:self-center">
                    <span className="text-[10px] text-gray-500 font-bold uppercase">Estado:</span>
                    <select
                      value={selectedTicket.status}
                      onChange={(e) => handleUpdateStatus(selectedTicket.id, e.target.value)}
                      className="px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs font-bold bg-white focus:border-[#3C6E71] outline-none cursor-pointer shadow-sm"
                    >
                      <option value="ABIERTO">ABIERTO</option>
                      <option value="EN PROCESO">EN PROCESO</option>
                      <option value="RESUELTO">RESUELTO</option>
                    </select>
                    
                    <button
                      onClick={() => handleDeleteTicket(selectedTicket.id)}
                      title="Eliminar ticket"
                      className="p-1.5 hover:bg-rose-50 text-gray-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Quick Contact Buttons Row */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <a
                    href={`mailto:${selectedTicket.customer_email}?subject=Respuesta a Ticket ${selectedTicket.id} - Holux`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-[11px] font-bold transition-colors"
                  >
                    <Mail className="w-3.5 h-3.5 text-[#3C6E71]" />
                    <span>Enviar Email Directo</span>
                  </a>

                  {selectedTicket.customer_phone && (
                    <a
                      href={`https://wa.me/${selectedTicket.customer_phone.replace(/\D/g, '')}?text=Hola%20${encodeURIComponent(selectedTicket.customer_name || 'Cliente')},%20te%20escribimos%20de%20Holux%20en%20referencia%20a%20tu%20ticket%20${selectedTicket.id}.`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-[11px] font-bold border border-emerald-200 transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Contactar por WhatsApp</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Message Chat History */}
              <div className="flex-grow space-y-3 overflow-y-auto p-4 bg-gray-50 rounded-xl border border-gray-200 max-h-[380px] text-xs">
                {Array.isArray(selectedTicket.messages) && selectedTicket.messages.map((m, idx) => (
                  <div
                    key={m.id || idx}
                    className={`flex flex-col ${m.sender === 'admin' ? 'items-end' : 'items-start'}`}
                  >
                    <div className={`max-w-[85%] p-3.5 rounded-2xl space-y-1 ${m.sender === 'admin' ? 'bg-[#3C6E71] text-white rounded-br-none' : 'bg-white border border-gray-200 text-gray-900 rounded-bl-none shadow-sm'}`}>
                      <p className="leading-relaxed whitespace-pre-wrap">{m.text}</p>
                      <span className={`text-[9px] block text-right font-mono-custom ${m.sender === 'admin' ? 'text-white/80' : 'text-gray-400'}`}>
                        {m.time || ''} {m.sender === 'admin' ? '• Soporte Oficial HOLUX' : `• ${m.sender_name || selectedTicket.customer_name || 'Cliente'}`}
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
                  disabled={replying}
                  className="flex-grow px-3.5 py-2.5 border border-gray-300 rounded-xl text-xs outline-none focus:border-[#3C6E71] bg-white font-medium shadow-sm"
                />
                <button
                  type="submit"
                  disabled={replying || !replyText.trim()}
                  className="px-5 py-2.5 bg-[#3C6E71] hover:bg-[#3C6E71]/90 text-white font-display font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md shadow-[#3C6E71]/20 transition-all disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  {replying ? 'ENVIANDO...' : 'RESPONDER'}
                </button>
              </form>

            </div>
          ) : (
            <div className="flex-grow flex flex-col items-center justify-center text-center p-8 text-gray-400 space-y-2">
              <MessageSquare className="w-12 h-12 stroke-1 text-gray-300" />
              <p className="font-display font-bold text-xs uppercase tracking-wider text-gray-600">
                SELECCIONÁ UN TICKET PARA VER LA CONVERSACIÓN
              </p>
              <p className="text-[11px] max-w-xs text-gray-400">
                Podés responder consultas de clientes, cambiar estados o contactarlos directamente por correo o WhatsApp.
              </p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
