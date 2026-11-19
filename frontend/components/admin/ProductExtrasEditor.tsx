'use client';
import { Plus, Trash2, Palette, Type, ListChecks, Table2 } from 'lucide-react';
import type { ProductOptionGroup, ProductOptionValue } from '@/types';

export interface ProductExtras {
  options: ProductOptionGroup[];
  features: string[];
  specs: { label: string; value: string }[];
}

const newValue = (type: ProductOptionGroup['type']): ProductOptionValue =>
  type === 'color' ? { label: '', hex: '#000000', image: '', price_delta: 0 } : { label: '', image: '', price_delta: 0 };

// Options (couleurs, tailles…), points forts et caractéristiques d'un produit
export default function ProductExtrasEditor({ value, onChange, imageUrls }: {
  value: ProductExtras;
  onChange: (next: ProductExtras) => void;
  imageUrls: string[];   // images du produit, proposées pour illustrer une couleur
}) {
  const { options, features, specs } = value;
  const setOptions = (next: ProductOptionGroup[]) => onChange({ ...value, options: next });
  const updateGroup = (gi: number, patch: Partial<ProductOptionGroup>) =>
    setOptions(options.map((g, i) => (i === gi ? { ...g, ...patch } : g)));
  const updateValue = (gi: number, vi: number, patch: Partial<ProductOptionValue>) =>
    updateGroup(gi, { values: options[gi].values.map((v, i) => (i === vi ? { ...v, ...patch } : v)) });

  const addGroup = (type: ProductOptionGroup['type']) =>
    setOptions([...options, { name: type === 'color' ? 'Couleur' : 'Taille', type, values: [newValue(type)] }]);

  return (
    <>
      {/* OPTIONS */}
      <div className="card card-hover">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h3 className="font-bold text-lg">Options du produit</h3>
            <p className="text-sm text-gray-500">Couleurs, tailles, capacités… Le client devra choisir une valeur pour chaque option.</p>
          </div>
        </div>

        {options.length === 0 && <p className="text-sm text-gray-400 mb-4">Aucune option : le produit est vendu tel quel.</p>}

        <div className="space-y-4">
          {options.map((group, gi) => (
            <div key={gi} className="border border-gray-200 rounded-xl p-4 bg-gray-50/50">
              <div className="flex gap-2 items-center mb-3">
                {group.type === 'color' ? <Palette size={18} className="text-gold" /> : <Type size={18} className="text-gold" />}
                <input
                  className="input !py-1.5 font-semibold flex-1"
                  value={group.name}
                  placeholder="Nom de l'option (ex. Couleur)"
                  onChange={(e) => updateGroup(gi, { name: e.target.value })}
                />
                <button type="button" onClick={() => setOptions(options.filter((_, i) => i !== gi))} className="p-2 text-red-500 hover:bg-red-50 rounded-lg" title="Supprimer l'option">
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="space-y-2">
                {group.values.map((v, vi) => (
                  <div key={vi} className="flex flex-wrap gap-2 items-center bg-white rounded-lg p-2 border border-gray-100">
                    {group.type === 'color' && (
                      <input
                        type="color"
                        value={v.hex || '#000000'}
                        onChange={(e) => updateValue(gi, vi, { hex: e.target.value.toUpperCase() })}
                        className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer p-0.5"
                        title="Couleur de la pastille"
                      />
                    )}
                    <input
                      className="input !py-1.5 flex-1 min-w-[120px]"
                      value={v.label}
                      placeholder={group.type === 'color' ? 'ex. Noir' : 'ex. M, 128 Go'}
                      onChange={(e) => updateValue(gi, vi, { label: e.target.value })}
                    />
                    <label className="flex items-center gap-1 text-xs text-gray-500">
                      +
                      <input
                        type="number"
                        step="0.01"
                        className="input !py-1.5 w-24"
                        value={v.price_delta}
                        onChange={(e) => updateValue(gi, vi, { price_delta: Number(e.target.value) })}
                        title="Supplément de prix (€)"
                      />
                      €
                    </label>
                    {imageUrls.length > 0 && (
                      <select
                        className="input !py-1.5 w-36 text-xs"
                        value={v.image || ''}
                        onChange={(e) => updateValue(gi, vi, { image: e.target.value })}
                        title="Image affichée quand cette valeur est choisie"
                      >
                        <option value="">Image : principale</option>
                        {imageUrls.map((url, i) => <option key={url} value={url}>Image {i + 1}</option>)}
                      </select>
                    )}
                    {v.image && <img src={v.image} alt="" className="w-10 h-10 rounded object-cover" />}
                    <button
                      type="button"
                      onClick={() => updateGroup(gi, { values: group.values.filter((_, i) => i !== vi) })}
                      disabled={group.values.length === 1}
                      className="p-2 text-gray-400 hover:text-red-500 disabled:opacity-30"
                      title="Supprimer cette valeur"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
              <button type="button" onClick={() => updateGroup(gi, { values: [...group.values, newValue(group.type)] })} className="mt-2 text-sm text-gold font-semibold flex items-center gap-1 hover:underline">
                <Plus size={14} /> Ajouter une valeur
              </button>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
          <button type="button" onClick={() => addGroup('color')} className="btn-secondary !text-sm"><Palette size={14} /> Ajouter des couleurs</button>
          <button type="button" onClick={() => addGroup('text')} className="btn-secondary !text-sm"><Type size={14} /> Ajouter une option texte (taille…)</button>
        </div>
      </div>

      {/* POINTS FORTS */}
      <div className="card card-hover">
        <h3 className="font-bold text-lg flex items-center gap-2 mb-1"><ListChecks size={18} className="text-gold" /> Points forts</h3>
        <p className="text-sm text-gray-500 mb-4">Affichés à côté de la description sur la fiche produit.</p>
        <div className="space-y-2">
          {features.map((f, i) => (
            <div key={i} className="flex gap-2">
              <input className="input !py-1.5" value={f} placeholder="ex. Cuir véritable" onChange={(e) => onChange({ ...value, features: features.map((x, j) => (j === i ? e.target.value : x)) })} />
              <button type="button" onClick={() => onChange({ ...value, features: features.filter((_, j) => j !== i) })} className="p-2 text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
            </div>
          ))}
        </div>
        <button type="button" onClick={() => onChange({ ...value, features: [...features, ''] })} className="mt-2 text-sm text-gold font-semibold flex items-center gap-1 hover:underline">
          <Plus size={14} /> Ajouter un point fort
        </button>
      </div>

      {/* CARACTÉRISTIQUES */}
      <div className="card card-hover">
        <h3 className="font-bold text-lg flex items-center gap-2 mb-1"><Table2 size={18} className="text-gold" /> Caractéristiques</h3>
        <p className="text-sm text-gray-500 mb-4">Onglet « Caractéristiques » de la fiche produit (matière, dimensions, poids…).</p>
        <div className="space-y-2">
          {specs.map((s, i) => (
            <div key={i} className="flex gap-2">
              <input className="input !py-1.5 w-1/3" value={s.label} placeholder="ex. Matière" onChange={(e) => onChange({ ...value, specs: specs.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) })} />
              <input className="input !py-1.5 flex-1" value={s.value} placeholder="ex. Cuir de veau" onChange={(e) => onChange({ ...value, specs: specs.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)) })} />
              <button type="button" onClick={() => onChange({ ...value, specs: specs.filter((_, j) => j !== i) })} className="p-2 text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
            </div>
          ))}
        </div>
        <button type="button" onClick={() => onChange({ ...value, specs: [...specs, { label: '', value: '' }] })} className="mt-2 text-sm text-gold font-semibold flex items-center gap-1 hover:underline">
          <Plus size={14} /> Ajouter une caractéristique
        </button>
      </div>
    </>
  );
}
