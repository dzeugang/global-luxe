'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Plus, Edit2, Trash2, Save, X } from 'lucide-react';

export default function ShippingAdmin() {
  const [methods, setMethods] = useState<any[]>([]);
  const [editing, setEditing] = useState<any>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: '', price: 0, delivery_days: '', cj_code: '', is_active: true });

  const load = () => api.get('/shipping/').then((r) => setMethods(r.data.results || r.data));
  useEffect(() => { load(); }, []);

  const startCreate = () => {
    setForm({ name: '', price: 0, delivery_days: '', cj_code: '', is_active: true });
    setEditing(null); setCreating(true);
  };
  const startEdit = (m: any) => {
    setForm({ name: m.name, price: m.price, delivery_days: m.delivery_days, cj_code: m.cj_code || '', is_active: m.is_active });
    setEditing(m); setCreating(false);
  };
  const cancel = () => { setEditing(null); setCreating(false); };

  const save = async () => {
    try {
      if (editing) await api.patch(`/shipping/${editing.id}/`, form);
      else await api.post('/shipping/', form);
      cancel(); load();
    } catch { alert('Erreur'); }
  };

  const remove = async (m: any) => {
    if (!confirm(`Supprimer "${m.name}" ?`)) return;
    await api.delete(`/shipping/${m.id}/`);
    load();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">Méthodes de livraison</h1>
        <button onClick={startCreate} className="btn-gold"><Plus size={16} /> Nouvelle</button>
      </div>

      {(creating || editing) && (
        <div className="card mb-4 space-y-3">
          <h2 className="font-bold">{editing ? 'Modifier' : 'Créer'}</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <input placeholder="Nom" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" />
            <input type="number" step="0.01" placeholder="Prix (€)" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} className="input" />
            <input placeholder="Délai (ex: 7-14 jours)" value={form.delivery_days} onChange={(e) => setForm({ ...form, delivery_days: e.target.value })} className="input" />
            <input placeholder="Code CJ (optionnel)" value={form.cj_code} onChange={(e) => setForm({ ...form, cj_code: e.target.value })} className="input" />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} /> Active
          </label>
          <div className="flex gap-2">
            <button onClick={save} className="btn-gold"><Save size={16} /> Sauvegarder</button>
            <button onClick={cancel} className="btn-dark"><X size={16} /> Annuler</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase">
            <tr><th className="p-3">Nom</th><th className="p-3">Prix</th><th className="p-3">Délai</th>
                <th className="p-3">Code CJ</th><th className="p-3">Active</th><th className="p-3 text-right">Actions</th></tr>
          </thead>
          <tbody>
            {methods.map((m) => (
              <tr key={m.id} className="border-t hover:bg-gray-50">
                <td className="p-3 font-semibold">{m.name}</td>
                <td className="p-3 font-bold">{Number(m.price).toFixed(2)} €</td>
                <td className="p-3">{m.delivery_days}</td>
                <td className="p-3 text-gray-500">{m.cj_code || '-'}</td>
                <td className="p-3">
                  {m.is_active
                    ? <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">Oui</span>
                    : <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">Non</span>}
                </td>
                <td className="p-3 text-right">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => startEdit(m)} className="text-blue-600 p-1 hover:bg-blue-50 rounded"><Edit2 size={16} /></button>
                    <button onClick={() => remove(m)} className="text-red-600 p-1 hover:bg-red-50 rounded"><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}