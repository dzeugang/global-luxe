'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { productSchema, type ProductFormData, type ProductFormInput } from '@/schemas/product.schema';
import Link from 'next/link';
import {
  Save, ArrowLeft, Info, FileText, Image as ImageIcon,
  DollarSign, Trash2, Plus, X, CloudUpload,
  Eye, Sparkles, Tag, Star, TrendingDown,
  AlertCircle, Check, Link2,
} from 'lucide-react';

interface Category {
  id: number;
  name: string;
  slug: string;
}

interface UploadedImage {
  id: string;
  url: string;
  file?: File;
  isMain: boolean;
  uploading?: boolean;
  source: 'upload' | 'url';
}

interface Props {
  productId?: string;
  initialData?: Partial<ProductFormData> & { main_image?: string; images?: string[] };
}

export default function ProductForm({ productId, initialData }: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [imageUrl, setImageUrl] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const isEdit = Boolean(productId);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProductFormInput, unknown, ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      sku: '',
      description: '',
      is_active: true,
      is_featured: false,
      is_best_seller: false,
      stock: 0,
      base_price: 0,
      sale_price: 0,
      ...initialData,
    },
  });

  const salePrice = Number(watch('sale_price') || 0);
  const basePrice = Number(watch('base_price') || 0);
  const margin = salePrice - basePrice;
  const marginPercent = salePrice > 0 ? ((margin / salePrice) * 100).toFixed(1) : '0';

  // Charger les catégories
  useEffect(() => {
    api.get('/products/categories/')
      .then((r) => setCategories(r.data.results || r.data))
      .catch((e) => console.error('Erreur chargement catégories:', e));
  }, []);

  // ============================================
  // 🖼️ CHARGER LES IMAGES EXISTANTES (mode édition)
  // ============================================
  useEffect(() => {
    if (initialData?.main_image) {
      const existing: UploadedImage[] = [{
        id: 'main',
        url: initialData.main_image,
        isMain: true,
        source: 'url',
      }];

      // Ajouter les images secondaires
      (initialData.images || []).forEach((img: string, i: number) => {
        // Éviter les doublons avec main_image
        if (img !== initialData.main_image) {
          existing.push({
            id: `img-${i}`,
            url: img,
            isMain: false,
            source: 'url',
          });
        }
      });

      setImages(existing);
    }
  }, [initialData]);

  // ============================================
  // 📸 UPLOAD D'IMAGES DEPUIS LE PC
  // ============================================
  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newImages: UploadedImage[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      if (!file.type.startsWith('image/')) {
        alert(`${file.name} n'est pas une image`);
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert(`${file.name} dépasse 5 MB`);
        continue;
      }

      newImages.push({
        id: `upload-${Date.now()}-${i}`,
        url: URL.createObjectURL(file),
        file,
        isMain: images.length === 0 && i === 0,
        uploading: true,
        source: 'upload',
      });
    }

    setImages((prev) => [...prev, ...newImages]);

    // Upload chaque image vers Media Library
    for (const img of newImages) {
      if (!img.file) continue;
      try {
        const fd = new FormData();
        fd.append('file', img.file);
        fd.append('name', img.file.name);

        const r = await api.post('/media/', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        setImages((prev) =>
          prev.map((i) =>
            i.id === img.id ? { ...i, url: r.data.file, uploading: false } : i
          )
        );
      } catch (e) {
        console.error('❌ Erreur upload image:', e);
        setImages((prev) =>
          prev.map((i) => (i.id === img.id ? { ...i, uploading: false } : i))
        );
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  };

  const addImageByUrl = () => {
    if (!imageUrl.trim()) return;
    setImages((prev) => [
      ...prev,
      {
        id: `url-${Date.now()}`,
        url: imageUrl.trim(),
        isMain: prev.length === 0,
        source: 'url',
      },
    ]);
    setImageUrl('');
    setShowUrlInput(false);
  };

  const removeImage = (id: string) => {
    setImages((prev) => {
      const updated = prev.filter((i) => i.id !== id);
      if (updated.length > 0 && !updated.some((i) => i.isMain)) {
        updated[0].isMain = true;
      }
      return updated;
    });
  };

  const setAsMain = (id: string) => {
    setImages((prev) => prev.map((i) => ({ ...i, isMain: i.id === id })));
  };

  // ============================================
  // ✅ ENVOI DU FORMULAIRE (création OU modification)
  // ============================================
  const onSubmit = async (data: ProductFormData) => {
    setError('');
    setSuccess('');

    if (images.length === 0) {
      setError('⚠️ Au moins une image est requise');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const uploading = images.some((i) => i.uploading);
    if (uploading) {
      setError('⏳ Attendez la fin de l\'upload des images');
      return;
    }

    const mainImg = images.find((i) => i.isMain) || images[0];
    const otherImages = images.filter((i) => !i.isMain).map((i) => i.url);

    const payload: Record<string, unknown> = {
      name: data.name,
      sku: data.sku || '',
      description: data.description || '',
      main_image: mainImg.url,
      images: otherImages,
      base_price: Number(data.base_price) || 0,
      sale_price: Number(data.sale_price),
      stock: Number(data.stock) || 0,
      is_active: Boolean(data.is_active),
      is_featured: Boolean(data.is_featured),
      is_best_seller: Boolean(data.is_best_seller),
    };

    if (data.category && Number(data.category) > 0) {
      payload.category = Number(data.category);
    }

    try {
      if (isEdit) {
        // 📝 MODIFICATION
        await api.patch(`/products/${productId}/`, payload);
        setSuccess(`✅ Produit "${data.name}" mis à jour avec succès !`);
      } else {
        // ➕ CRÉATION
        await api.post('/products/', payload);
        setSuccess(`✅ Produit "${data.name}" créé avec succès !`);
      }

      // Redirection après 1.5s
      setTimeout(() => router.push('/admin/produits'), 1500);
    } catch (e) {
      console.error('❌ Erreur API:', e);
      const err = e as {
        response?: {
          data?: Record<string, string[] | string> & { detail?: string };
          status?: number;
        };
      };

      if (err.response?.status === 401) {
        setError('🔒 Vous devez être connecté en admin');
        setTimeout(() => router.push('/admin/login'), 2000);
      } else if (err.response?.data) {
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
        setError('🌐 Erreur de connexion au serveur');
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const onError = (validationErrors: Record<string, { message?: string }>) => {
    console.error('❌ Validation échouée:', validationErrors);
    const fieldErrors = Object.entries(validationErrors)
      .map(([field, err]) => `${field}: ${err?.message || 'invalide'}`)
      .join(' | ');
    setError(`⚠️ Vérifiez les champs : ${fieldErrors}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ============================================
  // 🚪 CONFIRMATION AVANT DE QUITTER (si modifications)
  // ============================================
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  return (
    <div>
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <Link
            href="/admin/produits"
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gold mb-2 transition"
          >
            <ArrowLeft size={14} /> Retour aux produits
          </Link>
          <h1 className="h1 flex items-center gap-3">
            {isEdit ? (
              <>✏️ Modifier <span className="text-gold">{initialData?.name || 'le produit'}</span></>
            ) : (
              <>✨ Nouveau Produit</>
            )}
          </h1>
          <p className="text-gray-500 mt-1">
            {isEdit
              ? 'Modifiez les informations de ce produit'
              : 'Configurez les détails, prix et médias pour votre catalogue'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button type="button" className="btn-secondary">
            <Eye size={16} /> Aperçu
          </button>
          <button
            type="submit"
            form="product-form"
            disabled={isSubmitting}
            className="btn-gold"
          >
            <Save size={16} />
            {isSubmitting
              ? 'Enregistrement…'
              : isEdit
                ? 'Mettre à jour'
                : 'Créer le produit'
            }
          </button>
        </div>
      </div>

      {/* ============================================
          💬 MESSAGES (mêmes pour création/modification)
          ============================================ */}
      {error && (
        <div className="card mb-6 bg-red-50 border-red-200 flex items-start gap-3 animate-slide-up">
          <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-red-800 mb-1">Erreur</p>
            <p className="text-sm text-red-700">{error}</p>
          </div>
          <button
            onClick={() => setError('')}
            className="text-red-400 hover:text-red-700"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {success && (
        <div className="card mb-6 bg-emerald-50 border-emerald-200 flex items-center gap-3 animate-slide-up">
          <Check size={20} className="text-emerald-500 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-semibold text-emerald-800">{success}</p>
            <p className="text-sm text-emerald-600 mt-0.5">
              Redirection vers la liste des produits...
            </p>
          </div>
        </div>
      )}

      {/* Badge mode */}
      {isEdit && (
        <div className="mb-6 inline-flex items-center gap-2 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-full text-sm">
          <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
          <span className="font-semibold text-blue-700">Mode édition</span>
          <span className="text-blue-500">— Toute modification sera sauvegardée lors du clic sur &quot;Mettre à jour&quot;</span>
        </div>
      )}

      {/* FORMULAIRE */}
      <form
        id="product-form"
        onSubmit={handleSubmit(onSubmit, onError)}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        {/* COLONNE GAUCHE */}
        <div className="lg:col-span-2 space-y-6">
          {/* Informations de base */}
          <div className="card card-hover">
            <h2 className="section-header h3">
              <Info size={20} className="text-gold" />
              Informations de base
            </h2>
            <div className="space-y-4">
              <Field label="Nom du produit *" error={errors.name?.message}>
                <input {...register('name')} className="input" placeholder="Ex: Montre Connectée Pro X1" />
              </Field>

              <Field label="SKU (Code produit)" error={errors.sku?.message}>
                <input {...register('sku')} className="input font-mono text-sm" placeholder="GL-PROD-001" />
              </Field>
            </div>
          </div>

          {/* Description */}
          <div className="card card-hover">
            <h2 className="section-header h3">
              <FileText size={20} className="text-gold" />
              Description détaillée
            </h2>
            <textarea
              {...register('description')}
              rows={8}
              className="input resize-y"
              placeholder="Rédigez une description convaincante de votre produit..."
            />
          </div>

          {/* Images */}
          <div className="card card-hover">
            <div className="section-header flex items-center justify-between">
              <h2 className="h3 flex items-center gap-3">
                <ImageIcon size={20} className="text-gold" />
                Images du produit
              </h2>
              <span className="badge badge-info">{images.length} image(s)</span>
            </div>

            <div
              onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center cursor-pointer transition-all ${
                dragActive ? 'border-gold bg-gold/5 scale-[1.01]' : 'border-gray-300 hover:border-gold hover:bg-gold/5'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => handleFiles(e.target.files)}
                className="hidden"
              />
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gold/20 to-gold/5 flex items-center justify-center mb-4">
                <CloudUpload size={32} className="text-gold" />
              </div>
              <p className="text-base font-bold text-gray-800 text-center mb-1">
                {dragActive ? '✨ Déposez vos images ici' : 'Glissez-déposez ou cliquez pour parcourir'}
              </p>
              <p className="text-sm text-gray-500 text-center">JPG, PNG, WEBP — Max 5 MB par image</p>
            </div>

            <div className="mt-3">
              {!showUrlInput ? (
                <button
                  type="button"
                  onClick={() => setShowUrlInput(true)}
                  className="text-sm text-gold hover:underline font-semibold flex items-center gap-1"
                >
                  <Link2 size={14} /> Ou ajouter par URL
                </button>
              ) : (
                <div className="flex gap-2 animate-slide-up">
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://exemple.com/image.jpg"
                    className="input flex-1"
                  />
                  <button type="button" onClick={addImageByUrl} className="btn-gold">Ajouter</button>
                  <button
                    type="button"
                    onClick={() => { setShowUrlInput(false); setImageUrl(''); }}
                    className="btn-secondary"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
            </div>

            {images.length > 0 && (
              <div className="mt-6">
                <p className="text-sm font-semibold text-gray-700 mb-3">
                  Images uploadées (cliquez pour définir comme principale)
                </p>
                <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3">
                  {images.map((img) => (
                    <div key={img.id} className="relative group aspect-square">
                      <button
                        type="button"
                        onClick={() => setAsMain(img.id)}
                        className={`w-full h-full rounded-xl overflow-hidden border-2 transition relative bg-gray-100 ${
                          img.isMain ? 'border-gold ring-2 ring-gold/30' : 'border-gray-200 hover:border-gold'
                        }`}
                      >
                        <img src={img.url} alt="" className="w-full h-full object-cover" />
                        {img.uploading && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <div className="text-white text-xs animate-pulse">⏳ Upload...</div>
                          </div>
                        )}
                        {img.isMain && (
                          <span className="absolute top-1 left-1 badge badge-gold !text-[10px] !py-0.5 !px-1.5">
                            ⭐ MAIN
                          </span>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => removeImage(img.id)}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition hover:bg-red-600 shadow-lg"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-square rounded-xl border-2 border-dashed border-gray-300 hover:border-gold hover:bg-gold/5 flex items-center justify-center text-gray-400 hover:text-gold transition"
                  >
                    <Plus size={32} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* COLONNE DROITE */}
        <div className="lg:col-span-1 space-y-6">
          <div className="card card-hover">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gold mb-4 flex items-center gap-2">
              <Sparkles size={12} /> Publication
            </h3>
            <div className="space-y-4">
              <Field label="Catégorie">
                <select {...register('category')} className="input">
                  <option value="">— Sélectionner —</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </Field>

              <Field label="Stock disponible" error={errors.stock?.message}>
                <input
                  type="number"
                  min="0"
                  {...register('stock', { valueAsNumber: true })}
                  className="input font-mono"
                />
              </Field>

              <div className="pt-3 border-t border-gray-100 space-y-2.5">
                <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition">
                  <input type="checkbox" {...register('is_active')} className="w-4 h-4 accent-gold rounded" />
                  <div className="flex-1">
                    <span className="text-sm font-medium">Actif</span>
                    <p className="text-xs text-gray-500">Visible sur le site</p>
                  </div>
                </label>
                <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition">
                  <input type="checkbox" {...register('is_featured')} className="w-4 h-4 accent-gold rounded" />
                  <div className="flex-1">
                    <span className="text-sm font-medium flex items-center gap-1">
                      <Star size={12} className="text-amber-500" /> En vedette
                    </span>
                  </div>
                </label>
                <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition">
                  <input type="checkbox" {...register('is_best_seller')} className="w-4 h-4 accent-gold rounded" />
                  <div className="flex-1">
                    <span className="text-sm font-medium flex items-center gap-1">
                      <Tag size={12} className="text-pink-500" /> Best Seller
                    </span>
                  </div>
                </label>
              </div>
            </div>
          </div>

          <div className="card card-hover relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gold/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />

            <h2 className="section-header h3 relative">
              <DollarSign size={20} className="text-gold" />
              Prix & Marge
            </h2>

            <div className="space-y-4 relative">
              <Field label="Prix de vente (€) *" error={errors.sale_price?.message}>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    {...register('sale_price', { valueAsNumber: true })}
                    className="input font-mono text-lg font-bold pr-8"
                    placeholder="0.00"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">€</span>
                </div>
              </Field>

              <Field label="Coût d'achat CJ (€)" error={errors.base_price?.message}>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    {...register('base_price', { valueAsNumber: true })}
                    className="input font-mono pr-8"
                    placeholder="0.00"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">€</span>
                </div>
              </Field>

              {salePrice > 0 && basePrice > 0 && (
                <div className={`p-4 rounded-xl border animate-slide-up ${
                  margin > 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs uppercase tracking-wide text-gray-600 font-bold">Marge brute</span>
                    {margin > 0 ? <Check size={14} className="text-emerald-600" /> : <TrendingDown size={14} className="text-red-500" />}
                  </div>
                  <p className={`text-2xl font-black font-mono ${margin > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                    {margin.toFixed(2)} €
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    Soit <strong>{marginPercent}%</strong> de marge
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

interface FieldProps {
  label: string;
  error?: string;
  children: React.ReactNode;
}

function Field({ label, error, children }: FieldProps) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
      {children}
      {error && (
        <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
          <AlertCircle size={12} /> {error}
        </p>
      )}
    </div>
  );
}