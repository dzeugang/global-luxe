'use client';
import { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import {
  X, Upload, Link2, Image as ImageIcon, Save,
  Check, AlertCircle, Loader2, Trash2,
} from 'lucide-react';

interface Category {
  id: number;
  name: string;
  slug: string;
  image?: string;
  image_url?: string;
  banner?: string;
  banner_url?: string;
  description?: string;
  order: number;
  is_active: boolean;
}

interface Props {
  category?: Category | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CategoryFormModal({ category, onClose, onSuccess }: Props) {
  const isEdit = Boolean(category);
  const imageFileRef = useRef<HTMLInputElement>(null);
  const bannerFileRef = useRef<HTMLInputElement>(null);

  // Champs du formulaire
  const [name, setName] = useState(category?.name || '');
  const [description, setDescription] = useState(category?.description || '');
  const [order, setOrder] = useState(category?.order || 0);
  const [isActive, setIsActive] = useState(category?.is_active ?? true);

  // Gestion image principale
  const [imageMode, setImageMode] = useState<'url' | 'upload'>('url');
  const [imageUrl, setImageUrl] = useState(category?.image || '');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState(category?.image_url || category?.image || '');

  // Gestion bannière
  const [bannerMode, setBannerMode] = useState<'url' | 'upload'>('url');
  const [bannerUrl, setBannerUrl] = useState(category?.banner || '');
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState(category?.banner_url || category?.banner || '');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // ============================================
  // 📸 GESTION DES FICHIERS
  // ============================================
  const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('❌ Veuillez sélectionner une image');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('❌ Image trop lourde (max 5 MB)');
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleBannerFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('❌ Veuillez sélectionner une image');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('❌ Bannière trop lourde (max 10 MB)');
      return;
    }

    setBannerFile(file);
    setBannerPreview(URL.createObjectURL(file));
  };

  const handleImageUrlChange = (url: string) => {
    setImageUrl(url);
    setImagePreview(url);
  };

  const handleBannerUrlChange = (url: string) => {
    setBannerUrl(url);
    setBannerPreview(url);
  };

  // ============================================
  // ✅ SAUVEGARDER
  // ============================================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!name.trim()) {
      setError('Le nom est requis');
      return;
    }

    setLoading(true);

    try {
      // ✅ FormData pour gérer fichiers + texte
      const fd = new FormData();
      fd.append('name', name);
      fd.append('description', description);
      fd.append('order', String(order));
      fd.append('is_active', String(isActive));

      // Image principale
      if (imageMode === 'upload' && imageFile) {
        fd.append('image_file', imageFile);
        fd.append('image', '');  // Vider l'URL si on upload
      } else if (imageMode === 'url' && imageUrl) {
        fd.append('image', imageUrl);
      }

      // Bannière
      if (bannerMode === 'upload' && bannerFile) {
        fd.append('banner_file', bannerFile);
        fd.append('banner', '');
      } else if (bannerMode === 'url' && bannerUrl) {
        fd.append('banner', bannerUrl);
      }

      const config = {
        headers: { 'Content-Type': 'multipart/form-data' },
      };

      if (isEdit && category) {
        await api.patch(`/products/categories/${category.slug}/`, fd, config);
        setSuccess(`✅ Catégorie "${name}" mise à jour !`);
      } else {
        await api.post('/products/categories/', fd, config);
        setSuccess(`✅ Catégorie "${name}" créée !`);
      }

      setTimeout(() => {
        onSuccess();
      }, 1000);
    } catch (e) {
      console.error('Erreur:', e);
      const err = e as {
        response?: { data?: Record<string, string[] | string> & { detail?: string } };
      };

      if (err.response?.data) {
        const errorData = err.response.data;
        if (errorData.detail) {
          setError(String(errorData.detail));
        } else {
          const messages = Object.entries(errorData)
            .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
            .join(' | ');
          setError(messages || 'Erreur lors de la sauvegarde');
        }
      } else {
        setError('Erreur de connexion');
      }
    } finally {
      setLoading(false);
    }
  };

  // Fermer si on clique sur l'overlay
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in overflow-y-auto"
      onClick={handleOverlayClick}
    >
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl my-8">
        {/* HEADER */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-xl font-black text-gray-900">
            {isEdit ? `✏️ Modifier "${category?.name}"` : '➕ Nouvelle catégorie'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* MESSAGES */}
        {error && (
          <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
            <AlertCircle size={18} className="text-red-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-700 font-medium">{error}</p>
            <button onClick={() => setError('')} className="text-red-400 hover:text-red-700">
              <X size={16} />
            </button>
          </div>
        )}

        {success && (
          <div className="mx-6 mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3">
            <Check size={18} className="text-emerald-500" />
            <p className="text-sm text-emerald-700 font-medium">{success}</p>
          </div>
        )}

        {/* FORMULAIRE */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* INFORMATIONS DE BASE */}
          <div>
            <h3 className="text-sm font-bold text-gold uppercase tracking-wider mb-4">
              Informations
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nom de la catégorie *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Ex: Smartphones"
                  className="input"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Description courte de la catégorie..."
                  className="input resize-y"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Ordre d&apos;affichage
                  </label>
                  <input
                    type="number"
                    value={order}
                    onChange={(e) => setOrder(Number(e.target.value))}
                    min="0"
                    className="input font-mono"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Statut
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer h-[44px] px-4 border border-gray-200 rounded-lg hover:border-gold">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="w-4 h-4 accent-gold"
                    />
                    <span className="text-sm">
                      {isActive ? '✅ Active' : '❌ Inactive'}
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* ============================================
              📸 IMAGE PRINCIPALE
              ============================================ */}
          <div>
            <h3 className="text-sm font-bold text-gold uppercase tracking-wider mb-4">
              🖼️ Image principale (carré recommandé : 800×800)
            </h3>

            {/* Tabs URL / Upload */}
            <div className="flex gap-2 mb-3 p-1 bg-gray-100 rounded-lg">
              <button
                type="button"
                onClick={() => setImageMode('url')}
                className={`flex-1 py-2 px-3 rounded-md text-sm font-semibold transition ${
                  imageMode === 'url'
                    ? 'bg-white text-gold shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Link2 size={14} className="inline mr-1" /> URL
              </button>
              <button
                type="button"
                onClick={() => setImageMode('upload')}
                className={`flex-1 py-2 px-3 rounded-md text-sm font-semibold transition ${
                  imageMode === 'upload'
                    ? 'bg-white text-gold shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Upload size={14} className="inline mr-1" /> Mon PC
              </button>
            </div>

            {/* Mode URL */}
            {imageMode === 'url' && (
              <div className="space-y-3">
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => handleImageUrlChange(e.target.value)}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="input"
                />
                <p className="text-xs text-gray-500">
                  💡 Astuce : Utilise <a href="https://unsplash.com" target="_blank" rel="noopener" className="text-gold hover:underline">Unsplash</a> pour des images gratuites de qualité
                </p>
              </div>
            )}

            {/* Mode Upload */}
            {imageMode === 'upload' && (
              <div>
                <input
                  ref={imageFileRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageFile}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => imageFileRef.current?.click()}
                  className="w-full border-2 border-dashed border-gray-300 hover:border-gold rounded-xl p-8 flex flex-col items-center justify-center transition hover:bg-gold/5"
                >
                  <Upload size={32} className="text-gray-400 mb-2" />
                  <p className="text-sm font-semibold text-gray-700">
                    Cliquez pour choisir une image
                  </p>
                  <p className="text-xs text-gray-500 mt-1">JPG, PNG — Max 5 MB</p>
                </button>
                {imageFile && (
                  <p className="text-sm text-emerald-600 mt-2 flex items-center gap-1">
                    <Check size={14} /> {imageFile.name}
                  </p>
                )}
              </div>
            )}

            {/* APERÇU */}
            {imagePreview && (
              <div className="mt-4">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                  Aperçu
                </p>
                <div className="relative inline-block">
                  <img
                    src={imagePreview}
                    alt="Aperçu"
                    className="w-32 h-32 object-cover rounded-xl border-2 border-gray-200"
                    onError={(e) => {
                      e.currentTarget.src = 'https://via.placeholder.com/200x200?text=Image';
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setImagePreview('');
                      setImageUrl('');
                      setImageFile(null);
                    }}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 shadow-lg"
                  >
                    <X size={12} />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ============================================
              🎨 BANNIÈRE
              ============================================ */}
          <div>
            <h3 className="text-sm font-bold text-gold uppercase tracking-wider mb-4">
              🎨 Bannière (large : 1920×600 recommandé)
            </h3>

            <div className="flex gap-2 mb-3 p-1 bg-gray-100 rounded-lg">
              <button
                type="button"
                onClick={() => setBannerMode('url')}
                className={`flex-1 py-2 px-3 rounded-md text-sm font-semibold transition ${
                  bannerMode === 'url'
                    ? 'bg-white text-gold shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Link2 size={14} className="inline mr-1" /> URL
              </button>
              <button
                type="button"
                onClick={() => setBannerMode('upload')}
                className={`flex-1 py-2 px-3 rounded-md text-sm font-semibold transition ${
                  bannerMode === 'upload'
                    ? 'bg-white text-gold shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Upload size={14} className="inline mr-1" /> Mon PC
              </button>
            </div>

            {bannerMode === 'url' && (
              <input
                type="url"
                value={bannerUrl}
                onChange={(e) => handleBannerUrlChange(e.target.value)}
                placeholder="https://images.unsplash.com/photo-..."
                className="input"
              />
            )}

            {bannerMode === 'upload' && (
              <div>
                <input
                  ref={bannerFileRef}
                  type="file"
                  accept="image/*"
                  onChange={handleBannerFile}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => bannerFileRef.current?.click()}
                  className="w-full border-2 border-dashed border-gray-300 hover:border-gold rounded-xl p-8 flex flex-col items-center justify-center transition hover:bg-gold/5"
                >
                  <Upload size={32} className="text-gray-400 mb-2" />
                  <p className="text-sm font-semibold text-gray-700">
                    Choisir une bannière
                  </p>
                  <p className="text-xs text-gray-500 mt-1">JPG, PNG — Max 10 MB</p>
                </button>
                {bannerFile && (
                  <p className="text-sm text-emerald-600 mt-2 flex items-center gap-1">
                    <Check size={14} /> {bannerFile.name}
                  </p>
                )}
              </div>
            )}

            {bannerPreview && (
              <div className="mt-4">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                  Aperçu bannière
                </p>
                <div className="relative">
                  <img
                    src={bannerPreview}
                    alt="Aperçu bannière"
                    className="w-full h-32 object-cover rounded-xl border-2 border-gray-200"
                    onError={(e) => {
                      e.currentTarget.src = 'https://via.placeholder.com/1920x600?text=Banniere';
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setBannerPreview('');
                      setBannerUrl('');
                      setBannerFile(null);
                    }}
                    className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 shadow-lg"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ACTIONS */}
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="btn-secondary"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-gold disabled:opacity-50"
            >
              {loading ? (
                <><Loader2 size={16} className="animate-spin" /> Sauvegarde...</>
              ) : (
                <><Save size={16} /> {isEdit ? 'Mettre à jour' : 'Créer la catégorie'}</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}