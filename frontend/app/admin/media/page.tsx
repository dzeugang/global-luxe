'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Upload, Trash2, Copy, Check } from 'lucide-react';

export default function MediaPage() {
  const [files, setFiles] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [copied, setCopied] = useState<number | null>(null);

  const load = () => api.get('/media/').then((r) => setFiles(r.data.results || r.data));
  useEffect(() => { load(); }, []);

  const upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', e.target.files[0]);
      fd.append('name', e.target.files[0].name);
      await api.post('/media/', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      load();
    } catch { alert('Erreur upload'); }
    finally { setUploading(false); e.target.value = ''; }
  };

  const remove = async (id: number) => {
    if (!confirm('Supprimer ce fichier ?')) return;
    await api.delete(`/media/${id}/`);
    load();
  };

  const copyUrl = (url: string, id: number) => {
    navigator.clipboard.writeText(url);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">Bibliothèque média</h1>
        <label className="btn-gold cursor-pointer">
          <Upload size={16} /> {uploading ? 'Upload…' : 'Uploader'}
          <input type="file" accept="image/*" onChange={upload} className="hidden" disabled={uploading} />
        </label>
      </div>

      {files.length === 0 ? (
        <div className="card text-center py-12 text-gray-500">
          <Upload size={48} className="mx-auto mb-2 opacity-40" />
          <p>Aucun fichier. Uploadez votre premier média.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
          {files.map((f) => (
            <div key={f.id} className="bg-white rounded-lg overflow-hidden shadow-sm group relative">
              <img src={f.file} alt={f.name} className="aspect-square object-cover w-full" />
              <div className="p-2">
                <p className="text-xs truncate" title={f.name}>{f.name}</p>
                <div className="flex gap-1 mt-2">
                  <button onClick={() => copyUrl(f.file, f.id)} className="flex-1 text-xs py-1 border rounded hover:bg-gray-50">
                    {copied === f.id ? <Check size={12} className="inline text-green-600" /> : <Copy size={12} className="inline" />}
                  </button>
                  <button onClick={() => remove(f.id)} className="text-xs py-1 px-2 border rounded text-red-600 hover:bg-red-50">
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}