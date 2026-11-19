'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { api, apiError } from '@/lib/api';
import { shade, type ShopSettings } from '@/lib/shop';
import {
  Settings as SettingsIcon, Globe, Palette, Truck, Mail, Bell, Shield, Database,
  Save, Check, AlertCircle, Sparkles, Upload, X, CreditCard, Loader2,
} from 'lucide-react';

type AllSettings = ShopSettings & { notify_new_order: string; notify_new_message: string };
type TabKey = 'general' | 'appearance' | 'seo' | 'shipping' | 'notifications' | 'integrations' | 'security';

interface Status {
  stripe: boolean; stripe_mode: string; paypal: boolean; sendgrid: boolean; cj: boolean;
  email_from: string; admin_email: string; email_backend: string;
}

const TABS: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: 'general', label: 'Général', icon: Globe },
  { key: 'appearance', label: 'Apparence', icon: Palette },
  { key: 'seo', label: 'Référencement', icon: Sparkles },
  { key: 'shipping', label: 'Livraison', icon: Truck },
  { key: 'notifications', label: 'Notifications', icon: Bell },
  { key: 'integrations', label: 'Intégrations', icon: Database },
  { key: 'security', label: 'Sécurité', icon: Shield },
];

// Palettes proposées en un clic (couleur principale, couleur sombre)
const PRESETS = [
  { name: 'Or', primary: '#D4AF37', dark: '#0A0A0A' },
  { name: 'Émeraude', primary: '#059669', dark: '#0B1F17' },
  { name: 'Bleu nuit', primary: '#2563EB', dark: '#0F172A' },
  { name: 'Rose', primary: '#DB2777', dark: '#1F0A16' },
  { name: 'Terracotta', primary: '#C2410C', dark: '#1C1009' },
  { name: 'Violet', primary: '#7C3AED', dark: '#150B2E' },
];

const HEX = /^#[0-9a-fA-F]{6}$/;

export default function SettingsPage() {
  const [tab, setTab] = useState<TabKey>('general');
  const [values, setValues] = useState<AllSettings | null>(null);
  const [saved, setSaved] = useState<AllSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ ok: boolean; text: string } | null>(null);
  const [status, setStatus] = useState<Status | null>(null);

  useEffect(() => {
    api.get<AllSettings>('/settings/shop/').then((r) => { setValues(r.data); setSaved(r.data); }).catch(() => {});
    api.get<Status>('/settings/status/').then((r) => setStatus(r.data)).catch(() => {});
  }, []);

  const notify = (ok: boolean, text: string) => {
    setToast({ ok, text });
    setTimeout(() => setToast(null), 4000);
  };

  const set = (key: keyof AllSettings, value: string) => setValues((v) => (v ? { ...v, [key]: value } : v));
  const dirty = !!values && !!saved && (Object.keys(values) as (keyof AllSettings)[]).some((k) => values[k] !== saved[k]);

  const save = async () => {
    if (!values || !saved) return;
    const changes = Object.fromEntries((Object.keys(values) as (keyof AllSettings)[])
      .filter((k) => values[k] !== saved[k]).map((k) => [k, values[k]]));
    setSaving(true);
    try {
      const r = await api.post<AllSettings>('/settings/shop/', changes);
      setValues(r.data); setSaved(r.data);
      notify(true, 'Paramètres enregistrés. Le site est mis à jour en moins d\'une minute.');
    } catch (e) {
      notify(false, apiError(e).detail || 'Enregistrement impossible');
    } finally { setSaving(false); }
  };

  if (!values) return <div className="text-gray-500">Chargement des paramètres…</div>;

  const field = (key: keyof AllSettings, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}, hint?: string) => (
    <Field label={label} hint={hint}>
      <input className="input" value={values[key]} onChange={(e) => set(key, e.target.value)} {...props} />
    </Field>
  );

  return (
    <div>
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="h1 flex items-center gap-3"><SettingsIcon className="text-gold" size={32} /> Paramètres</h1>
          <p className="text-gray-500 mt-1">Identité, apparence et fonctionnement de votre boutique.</p>
        </div>
        {tab !== 'integrations' && tab !== 'security' && (
          <button onClick={save} disabled={!dirty || saving} className="btn-gold disabled:opacity-40">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {dirty ? 'Enregistrer les modifications' : 'Tout est enregistré'}
          </button>
        )}
      </div>

      {toast && (
        <div className={`fixed top-20 right-6 z-50 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-2 max-w-md ${toast.ok ? 'bg-emerald-600' : 'bg-red-600'}`}>
          {toast.ok ? <Check size={18} /> : <AlertCircle size={18} />} {toast.text}
        </div>
      )}

      <div className="grid lg:grid-cols-4 gap-6">
        <aside className="lg:col-span-1">
          <nav className="card lg:sticky lg:top-24 space-y-1">
            {TABS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                  tab === key ? 'bg-gold/10 text-gold border-l-4 border-gold' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon size={18} /> {label}
              </button>
            ))}
          </nav>
        </aside>

        <div className="lg:col-span-3 space-y-6">
          {tab === 'general' && (
            <>
              <Section title="Boutique" icon={Globe} description="Ces informations apparaissent sur tout le site (en-tête, pied de page, contact, emails).">
                <div className="grid sm:grid-cols-2 gap-4">
                  {field('shop_name', 'Nom de la boutique')}
                  {field('shop_tagline', 'Slogan', {}, 'Affiché dans le bandeau défilant de l\'accueil')}
                  {field('contact_email', 'Email de contact', { type: 'email' })}
                  {field('contact_phone', 'Téléphone', { type: 'tel' }, 'Laisser vide pour ne pas l\'afficher')}
                </div>
              </Section>
              <Section title="Réseaux sociaux" icon={Globe} description="Lien complet du profil. Un réseau laissé vide n'est pas affiché dans le pied de page.">
                <div className="grid sm:grid-cols-3 gap-4">
                  {field('social_instagram', 'Instagram', { placeholder: 'https://instagram.com/…' })}
                  {field('social_facebook', 'Facebook', { placeholder: 'https://facebook.com/…' })}
                  {field('social_tiktok', 'TikTok', { placeholder: 'https://tiktok.com/@…' })}
                </div>
              </Section>
              <Section title="Informations légales" icon={Shield} description="Utilisées par les pages Mentions légales et CGV.">
                <div className="grid sm:grid-cols-2 gap-4">
                  {field('legal_name', 'Raison sociale', {}, 'Si vide, le nom de la boutique est utilisé')}
                  {field('legal_id', 'N° d\'immatriculation (SIRET, RCCM…)')}
                  {field('legal_address', 'Adresse du siège')}
                  {field('legal_host', 'Hébergeur du site', { placeholder: 'ex. Vercel Inc., 340 S Lemon Ave, Walnut, CA' })}
                </div>
              </Section>
            </>
          )}

          {tab === 'appearance' && <Appearance values={values} set={set} onError={(t) => notify(false, t)} />}

          {tab === 'seo' && (
            <Section title="Référencement (Google)" icon={Sparkles} description="Titre et description affichés dans les résultats de recherche et l'onglet du navigateur.">
              <div className="space-y-4">
                <Field label={`Titre (${values.meta_title.length}/60 caractères)`}>
                  <input className="input" maxLength={70} value={values.meta_title} onChange={(e) => set('meta_title', e.target.value)} />
                </Field>
                <Field label={`Description (${values.meta_description.length}/160 caractères)`}>
                  <textarea className="input" rows={3} maxLength={200} value={values.meta_description} onChange={(e) => set('meta_description', e.target.value)} />
                </Field>
                <div className="rounded-xl border border-gray-200 p-4 bg-white">
                  <p className="text-xs text-gray-500 mb-1">Aperçu Google</p>
                  <p className="text-[#1a0dab] text-lg leading-tight truncate">{values.meta_title || values.shop_name}</p>
                  <p className="text-sm text-gray-600 line-clamp-2">{values.meta_description}</p>
                </div>
              </div>
            </Section>
          )}

          {tab === 'shipping' && (
            <Section title="Livraison et retours" icon={Truck} description="Affichés sur la fiche produit, le suivi de commande, la FAQ et les CGV.">
              <div className="grid sm:grid-cols-2 gap-4">
                {field('delivery_days', 'Délai de livraison', { placeholder: '7 à 12 jours ouvrés' })}
                {field('return_days', 'Délai de retour (jours)', { type: 'number', min: 14 }, 'Minimum légal en France : 14 jours')}
                {field('free_shipping_threshold', 'Livraison gratuite dès (€)', { type: 'number', min: 0, step: '0.01' }, 'Laisser vide pour désactiver')}
              </div>
              <p className="text-sm text-gray-600 bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
                Les modes de livraison et leurs prix se gèrent sur la page <Link href="/admin/livraison" className="text-blue-700 font-semibold hover:underline">Livraison</Link>.
              </p>
            </Section>
          )}

          {tab === 'notifications' && (
            <Section title="Emails reçus par l'administrateur" icon={Bell} description={`Envoyés à ${status?.admin_email || 'l\'email admin du fichier .env'}.`}>
              <div className="space-y-2">
                {([
                  ['notify_new_order', 'Nouvelle commande', 'Un email à chaque commande passée'],
                  ['notify_new_message', 'Nouveau message', 'Un email à chaque message du formulaire de contact'],
                ] as const).map(([key, label, desc]) => (
                  <label key={key} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer">
                    <span><span className="font-semibold text-sm block">{label}</span><span className="text-xs text-gray-500">{desc}</span></span>
                    <input type="checkbox" className="w-5 h-5 accent-gold" checked={values[key] === 'true'} onChange={(e) => set(key, String(e.target.checked))} />
                  </label>
                ))}
                <p className="text-xs text-gray-500 px-3">Les clients reçoivent toujours la confirmation de commande et les changements de statut.</p>
              </div>
            </Section>
          )}

          {tab === 'integrations' && <Integrations status={status} notify={notify} />}

          {tab === 'security' && <Security notify={notify} />}
        </div>
      </div>
    </div>
  );
}

// ============================================
// APPARENCE : couleurs, logo, aperçu en direct
// ============================================
function Appearance({ values, set, onError }: {
  values: AllSettings;
  set: (key: keyof AllSettings, value: string) => void;
  onError: (text: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const primary = HEX.test(values.color_primary) ? values.color_primary : '#D4AF37';
  const dark = HEX.test(values.color_dark) ? values.color_dark : '#0A0A0A';

  const uploadLogo = async (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('name', `logo-${file.name}`);
    setUploading(true);
    try {
      const r = await api.post('/media/', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      set('logo_url', r.data.file);
    } catch {
      onError('Envoi du logo impossible');
    } finally { setUploading(false); }
  };

  return (
    <>
      <Section title="Couleurs" icon={Palette} description="Appliquées à tout le site : boutons, liens, badges, pied de page, admin.">
        <p className="text-sm font-semibold text-gray-700 mb-2">Palettes prêtes à l&apos;emploi</p>
        <div className="flex flex-wrap gap-2 mb-6">
          {PRESETS.map((p) => (
            <button
              key={p.name}
              onClick={() => { set('color_primary', p.primary); set('color_dark', p.dark); }}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm ${
                primary.toLowerCase() === p.primary.toLowerCase() ? 'border-gray-900' : 'border-gray-200 hover:border-gray-400'
              }`}
            >
              <span className="w-5 h-5 rounded-full border border-black/10" style={{ background: p.primary }} />
              <span className="w-5 h-5 rounded-full border border-black/10 -ml-3" style={{ background: p.dark }} />
              {p.name}
            </button>
          ))}
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <ColorField label="Couleur principale" hint="Boutons, liens, accents" value={values.color_primary} onChange={(v) => set('color_primary', v)} />
          <ColorField label="Couleur sombre" hint="Pied de page, page de connexion, textes forts" value={values.color_dark} onChange={(v) => set('color_dark', v)} />
        </div>

        {/* Aperçu */}
        <p className="text-sm font-semibold text-gray-700 mt-6 mb-2">Aperçu</p>
        <div className="rounded-2xl overflow-hidden border border-gray-200">
          <div className="bg-white px-5 py-4 flex items-center justify-between border-b border-gray-100">
            {values.logo_url
              ? <img src={values.logo_url} alt="" className="h-8 w-auto" />
              : <span className="font-serif font-black uppercase tracking-wider" style={{ color: primary }}>{values.shop_name}</span>}
            <span className="text-sm" style={{ color: dark }}>Accueil · Catégories · Contact</span>
          </div>
          <div className="bg-gray-50 px-5 py-6 flex flex-wrap items-center gap-3">
            <span className="px-5 py-2.5 rounded-xl font-bold text-sm" style={{ background: primary, color: dark }}>Ajouter au panier</span>
            <span className="px-5 py-2.5 rounded-xl font-bold text-sm border-2" style={{ borderColor: dark, color: dark }}>Voir le produit</span>
            <span className="px-3 py-1 rounded-full text-xs font-bold" style={{ background: shade(primary, 0.85), color: shade(primary, -0.35) }}>Nouveau</span>
            <span className="text-sm font-semibold underline" style={{ color: primary }}>Un lien</span>
          </div>
          <div className="px-5 py-4 text-sm flex justify-between" style={{ background: dark, color: '#9CA3AF' }}>
            <span style={{ color: primary }} className="font-bold uppercase">{values.shop_name}</span>
            <span>Pied de page</span>
          </div>
        </div>
      </Section>

      <Section title="Logo" icon={Upload} description="PNG transparent ou SVG, environ 400 × 120 px. Sans logo, le nom de la boutique est affiché.">
        <div className="flex flex-col sm:flex-row gap-4 items-start">
          <div className="w-48 h-24 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center bg-[repeating-conic-gradient(#f3f4f6_0%_25%,#fff_0%_50%)] bg-[length:16px_16px]">
            {values.logo_url ? <img src={values.logo_url} alt="Logo" className="max-h-20 max-w-44 object-contain" /> : <span className="text-xs text-gray-400">Aucun logo</span>}
          </div>
          <div className="space-y-2 flex-1 w-full">
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadLogo(e.target.files[0])} />
            <div className="flex gap-2">
              <button onClick={() => fileRef.current?.click()} disabled={uploading} className="btn-secondary">
                {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />} Envoyer une image
              </button>
              {values.logo_url && (
                <button onClick={() => set('logo_url', '')} className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-1">
                  <X size={14} /> Retirer
                </button>
              )}
            </div>
            <input className="input text-sm" placeholder="…ou collez l'URL d'une image" value={values.logo_url} onChange={(e) => set('logo_url', e.target.value)} />
            <p className="text-xs text-gray-500">Le logo sert aussi d&apos;icône d&apos;onglet du navigateur.</p>
          </div>
        </div>
      </Section>
    </>
  );
}

function ColorField({ label, hint, value, onChange }: { label: string; hint: string; value: string; onChange: (v: string) => void }) {
  const valid = HEX.test(value);
  return (
    <Field label={label} hint={hint}>
      <div className="flex gap-2 items-center">
        <input type="color" value={valid ? value : '#000000'} onChange={(e) => onChange(e.target.value.toUpperCase())} className="w-12 h-11 rounded-lg border border-gray-200 cursor-pointer p-1 bg-white" />
        <input className={`input font-mono uppercase ${valid ? '' : '!border-red-400'}`} value={value} maxLength={7} onChange={(e) => onChange(e.target.value)} />
      </div>
      {!valid && <p className="text-xs text-red-500 mt-1">Format attendu : #RRGGBB</p>}
    </Field>
  );
}

// ============================================
// INTÉGRATIONS : état réel + tests
// ============================================
function Integrations({ status, notify }: { status: Status | null; notify: (ok: boolean, text: string) => void }) {
  const [testing, setTesting] = useState('');
  const [testTo, setTestTo] = useState('');

  const test = async (name: string, url: string, body = {}) => {
    setTesting(name);
    try {
      const r = await api.post(url, body);
      notify(true, r.data.detail);
    } catch (e) {
      notify(false, apiError(e).detail || 'Test impossible');
    } finally { setTesting(''); }
  };

  const badge = (ok?: boolean) => ok
    ? <span className="badge badge-success">Configuré</span>
    : <span className="badge badge-warning">Non configuré</span>;

  return (
    <>
      <p className="text-sm text-gray-600 bg-amber-50 border border-amber-200 rounded-lg p-3">
        Par sécurité, les clés secrètes ne sont jamais modifiables depuis le navigateur : elles se renseignent dans le fichier <code className="font-mono">backend/.env</code> du serveur.
      </p>

      <Section title="CJ Dropshipping" icon={Database} description="Variables CJ_EMAIL et CJ_API_KEY" badge={badge(status?.cj)}>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => test('cj', '/settings/test_cj/')} disabled={!!testing} className="btn-gold">
            {testing === 'cj' ? <Loader2 size={14} className="animate-spin" /> : null} Tester la connexion
          </button>
          <Link href="/admin/produits" className="btn-secondary">Importer des produits</Link>
        </div>
      </Section>

      <Section title="Emails" icon={Mail} description={`Envoi via : ${status?.email_backend || '…'} — expéditeur ${status?.email_from || ''}`} badge={badge(status?.sendgrid)}>
        {!status?.sendgrid && (
          <p className="text-xs text-gray-500 mb-3">Sans SENDGRID_API_KEY, les emails ne partent pas : ils s&apos;affichent dans le terminal du backend.</p>
        )}
        <div className="flex flex-col sm:flex-row gap-2">
          <input type="email" className="input" placeholder={status?.admin_email || 'destinataire@exemple.com'} value={testTo} onChange={(e) => setTestTo(e.target.value)} />
          <button onClick={() => test('email', '/settings/test_email/', testTo ? { to: testTo } : {})} disabled={!!testing} className="btn-secondary whitespace-nowrap">
            {testing === 'email' ? <Loader2 size={14} className="animate-spin" /> : <Mail size={14} />} Envoyer un email de test
          </button>
        </div>
      </Section>

      <Section title="Paiement" icon={CreditCard} description="Stripe (STRIPE_PUBLIC_KEY, STRIPE_SECRET_KEY) et PayPal (PAYPAL_CLIENT_ID, PAYPAL_SECRET)">
        <div className="space-y-2 text-sm">
          <p className="flex justify-between">Stripe {status?.stripe ? <span className="badge badge-success">Clés présentes ({status.stripe_mode})</span> : badge(false)}</p>
          <p className="flex justify-between">PayPal {badge(status?.paypal)}</p>
          <p className="text-xs text-gray-500 pt-2">Le paiement en ligne n&apos;est pas encore branché au tunnel de commande.</p>
        </div>
      </Section>
    </>
  );
}

// ============================================
// SÉCURITÉ : changement de mot de passe
// ============================================
function Security({ notify }: { notify: (ok: boolean, text: string) => void }) {
  const [form, setForm] = useState({ current: '', next: '', confirm: '' });
  const [busy, setBusy] = useState(false);
  const mismatch = form.confirm.length > 0 && form.next !== form.confirm;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mismatch) return;
    setBusy(true);
    try {
      const r = await api.post('/auth/change-password/', { current_password: form.current, new_password: form.next });
      notify(true, r.data.detail);
      setForm({ current: '', next: '', confirm: '' });
    } catch (err) {
      notify(false, apiError(err).detail || 'Changement impossible');
    } finally { setBusy(false); }
  };

  return (
    <Section title="Mot de passe administrateur" icon={Shield} description="Au moins 8 caractères, pas uniquement des chiffres, pas un mot de passe courant.">
      <form onSubmit={submit} className="space-y-3 max-w-md">
        <Field label="Mot de passe actuel"><input type="password" className="input" required autoComplete="current-password" value={form.current} onChange={(e) => setForm({ ...form, current: e.target.value })} /></Field>
        <Field label="Nouveau mot de passe"><input type="password" className="input" required minLength={8} autoComplete="new-password" value={form.next} onChange={(e) => setForm({ ...form, next: e.target.value })} /></Field>
        <Field label="Confirmer le nouveau mot de passe">
          <input type="password" className="input" required autoComplete="new-password" value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} />
          {mismatch && <p className="text-xs text-red-500 mt-1">Les deux mots de passe sont différents.</p>}
        </Field>
        <button type="submit" disabled={busy || mismatch} className="btn-gold">
          {busy ? <Loader2 size={14} className="animate-spin" /> : <Shield size={14} />} Mettre à jour
        </button>
      </form>
    </Section>
  );
}

// ============================================
// COMPOSANTS COMMUNS
// ============================================
function Section({ title, icon: Icon, description, children, badge }: {
  title: string; icon: React.ElementType; description?: string; children: React.ReactNode; badge?: React.ReactNode;
}) {
  return (
    <div className="card">
      <div className="flex items-start justify-between gap-3 mb-6 pb-4 border-b border-gray-100">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center flex-shrink-0">
            <Icon size={20} className="text-gold" />
          </div>
          <div>
            <h3 className="font-bold text-lg">{title}</h3>
            {description && <p className="text-sm text-gray-500 mt-0.5">{description}</p>}
          </div>
        </div>
        {badge}
      </div>
      {children}
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
      {children}
      {hint && <p className="text-xs text-gray-500 mt-1">{hint}</p>}
    </div>
  );
}
