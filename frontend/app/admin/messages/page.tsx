'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Mail, Send, Trash2, Check, Search, Inbox } from 'lucide-react';

interface Message {
  id: number;
  customer_email: string;
  customer_name?: string;
  subject: string;
  content: string;
  is_from_admin: boolean;
  is_read: boolean;
  created_at: string;
}

export default function MessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [selected, setSelected] = useState<Message | null>(null);
  const [reply, setReply] = useState('');
  const [search, setSearch] = useState('');
  const [sending, setSending] = useState(false);

  const load = () => api.get('/messages/').then((r) => setMessages(r.data.results || r.data)).catch(() => {});
  useEffect(() => { load(); }, []);

  const select = async (m: Message) => {
    setSelected(m); setReply('');
    if (!m.is_read) {
      await api.post(`/messages/${m.id}/mark_read/`).catch(() => {});
      load();
    }
  };

  const sendReply = async () => {
    if (!reply.trim() || !selected) return;
    setSending(true);
    try {
      await api.post(`/messages/${selected.id}/reply/`, { content: reply });
      alert('✅ Réponse envoyée');
      setReply(''); load();
    } catch { alert('Erreur'); }
    finally { setSending(false); }
  };

  const remove = async (m: Message) => {
    if (!confirm('Supprimer ce message ?')) return;
    await api.delete(`/messages/${m.id}/`);
    if (selected?.id === m.id) setSelected(null);
    load();
  };

  const filtered = messages.filter(m =>
    !search ||
    m.subject.toLowerCase().includes(search.toLowerCase()) ||
    m.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
    m.customer_email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-4xl font-black mb-2">Messages</h1>
        <p className="text-gray-500">Manage customer conversations and inquiries.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-4 h-[calc(100vh-280px)]">
        {/* Liste messages */}
        <div className="bg-white rounded-2xl border border-gray-300 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-gray-300">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search messages..."
                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-gold"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-gray-300">
            {filtered.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <Inbox size={32} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">Aucun message</p>
              </div>
            ) : filtered.map((m) => (
              <div key={m.id} className="flex items-stretch">
                <button
                  onClick={() => select(m)}
                  className={`flex-1 text-left p-4 hover:bg-gray-50 transition ${
                    selected?.id === m.id ? 'bg-gold/5 border-l-4 border-gold' : ''
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <p className={`text-sm truncate ${!m.is_read && !m.is_from_admin ? 'font-bold' : 'font-medium'}`}>
                      {m.customer_name || m.customer_email}
                    </p>
                    {!m.is_read && !m.is_from_admin && <span className="w-2 h-2 bg-gold rounded-full flex-shrink-0" />}
                  </div>
                  <p className="text-xs text-gray-500 truncate mb-1">{m.subject}</p>
                  <p className="text-xs text-gray-400">{new Date(m.created_at).toLocaleDateString('fr-FR')}</p>
                </button>
                <button
                  onClick={() => remove(m)}
                  className="px-3 text-gray-400 hover:text-red-500 hover:bg-red-50 transition"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Détail message */}
        <div className="bg-white rounded-2xl border border-gray-300 overflow-hidden lg:col-span-2 flex flex-col">
          {!selected ? (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <Mail size={48} className="mx-auto mb-3 opacity-30" />
                <p>Select a message to view</p>
              </div>
            </div>
          ) : (
            <>
              <div className="p-6 border-b border-gray-300">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h2 className="font-bold text-lg">{selected.subject}</h2>
                    <p className="text-sm text-gray-500 mt-1">From: {selected.customer_email}</p>
                  </div>
                  <span className="text-xs text-gray-400">{new Date(selected.created_at).toLocaleString('fr-FR')}</span>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                <p className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed">{selected.content}</p>
              </div>
              <div className="p-4 border-t border-gray-300 bg-gray-50">
                <h3 className="font-bold text-sm mb-2">Reply</h3>
                <textarea
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  rows={4}
                  placeholder="Type your reply..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-gold mb-3 resize-none"
                />
                <button
                  onClick={sendReply}
                  disabled={sending || !reply.trim()}
                  className="bg-gold hover:bg-gold-dark text-dark px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition disabled:opacity-50"
                >
                  <Send size={14} /> {sending ? 'Sending...' : 'Send Reply'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}