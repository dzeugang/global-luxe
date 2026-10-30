'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import {
  Settings as SettingsIcon, Globe, CreditCard, Truck, Mail,
  Bell, Shield, Database, Plus, Save, Trash2, X, Eye, EyeOff,
  Check, AlertCircle, Sparkles, Key,
} from 'lucide-react';

interface AppSetting {
  id?: number;
  key: string;
  value: string;
  description?: string;
}

type TabKey = 'general' | 'payment' | 'shipping' | 'email' | 'notifications' | 'security' | 'integrations';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('general');
  const [settings, setSettings] = useState<AppSetting[]>([]);
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [newSetting, setNewSetting] = useState({ key: '', value: '', description: '' });
  const [showAddForm, setShowAddForm] = useState(false);
  const [success, setSuccess] = useState('');
  const [showKey, setShowKey] = useState<Record<string, boolean>>({});

  const load = () => api.get('/settings/').then((r) => setSettings(r.data.results || r.data)).catch(() => {});
  useEffect(() => { load(); }, []);

  const showSuccess = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 3000);
  };

  const create = async () => {
    if (!newSetting.key) return alert('Clé requise');
    try {
      await api.post('/settings/', newSetting);
      setNewSetting({ key: '', value: '', description: '' });
      setShowAddForm(false);
      load();
      showSuccess('✅ Paramètre créé');
    } catch { alert('Erreur'); }
  };

  const update = async (key: string) => {
    if (!(key in edits)) return;
    try {
      await api.patch(`/settings/${key}/`, { value: edits[key] });
      setEdits((prev) => { const c = { ...prev }; delete c[key]; return c; });
      load();
      showSuccess('✅ Paramètre mis à jour');
    } catch { alert('Erreur'); }
  };

  const remove = async (key: string) => {
    if (!confirm(`Supprimer "${key}" ?`)) return;
    await api.delete(`/settings/${key}/`);
    load();
    showSuccess('✅ Paramètre supprimé');
  };

  const TABS: { key: TabKey; label: string; icon: React.ElementType; color: string }[] = [
    { key: 'general', label: 'Général', icon: SettingsIcon, color: 'text-blue-600' },
    { key: 'payment', label: 'Paiement', icon: CreditCard, color: 'text-emerald-600' },
    { key: 'shipping', label: 'Livraison', icon: Truck, color: 'text-orange-600' },
    { key: 'email', label: 'Email', icon: Mail, color: 'text-purple-600' },
    { key: 'notifications', label: 'Notifications', icon: Bell, color: 'text-amber-600' },
    { key: 'integrations', label: 'Intégrations', icon: Database, color: 'text-pink-600' },
    { key: 'security', label: 'Sécurité', icon: Shield, color: 'text-red-600' },
  ];

  return (
    <div>
      {/* HEADER */}
      <div className="mb-8">
        <h1 className="h1 flex items-center gap-3">
          <SettingsIcon className="text-gold" size={32} />
          Paramètres
        </h1>
        <p className="text-gray-500 mt-1">Gérez la configuration globale de votre boutique.</p>
      </div>

      {/* TOAST SUCCESS */}
      {success && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-500 text-white px-6 py-3 rounded-xl shadow-2xl animate-slide-up flex items-center gap-2">
          <Check size={18} /> {success}
        </div>
      )}

      <div className="grid lg:grid-cols-4 gap-6">
        {/* SIDEBAR TABS */}
        <aside className="lg:col-span-1">
          <div className="card sticky top-24">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3 px-2">
              Catégories
            </p>
            <nav className="space-y-1">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                      active
                        ? 'bg-gold/10 text-gold border-l-4 border-gold'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Icon size={18} className={active ? 'text-gold' : tab.color} />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* CONTENU */}
        <div className="lg:col-span-3 space-y-6">
          {/* === GÉNÉRAL === */}
          {activeTab === 'general' && (
            <>
              <Section title="Informations de la boutique" icon={Globe} description="Configuration générale de votre boutique en ligne">
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="Nom de la boutique">
                    <input className="input" defaultValue="Global Luxe" />
                  </Field>
                  <Field label="Email de contact">
                    <input type="email" className="input" defaultValue="contact@globalluxe.com" />
                  </Field>
                  <Field label="Devise par défaut">
                    <select className="input">
                      <option>EUR (€)</option>
                      <option>USD ($)</option>
                      <option>GBP (£)</option>
                    </select>
                  </Field>
                  <Field label="Fuseau horaire">
                    <select className="input">
                      <option>Europe/Paris (UTC+1)</option>
                      <option>America/New_York (UTC-5)</option>
                      <option>Asia/Tokyo (UTC+9)</option>
                    </select>
                  </Field>
                  <Field label="Langue par défaut">
                    <select className="input">
                      <option>Français</option>
                      <option>English</option>
                      <option>Español</option>
                    </select>
                  </Field>
                  <Field label="Pays">
                    <input className="input" defaultValue="France" />
                  </Field>
                </div>
                <div className="mt-6 flex justify-end">
                  <button onClick={() => showSuccess('Paramètres généraux sauvegardés')} className="btn-gold">
                    <Save size={16} /> Sauvegarder
                  </button>
                </div>
              </Section>

              <Section title="SEO & Métadonnées" icon={Sparkles} description="Optimisation pour les moteurs de recherche">
                <div className="space-y-4">
                  <Field label="Meta Title (max 60 caractères)">
                    <input className="input" defaultValue="Global Luxe - Premium Marketplace" />
                  </Field>
                  <Field label="Meta Description (max 160 caractères)">
                    <textarea className="input" rows={3} defaultValue="Découvrez notre sélection exclusive de produits premium." />
                  </Field>
                  <Field label="Mots-clés (séparés par virgules)">
                    <input className="input" defaultValue="luxe, premium, marketplace, dropshipping" />
                  </Field>
                </div>
              </Section>
            </>
          )}

          {/* === PAIEMENT === */}
          {activeTab === 'payment' && (
            <>
              <Section
                title="Stripe"
                icon={CreditCard}
                description="Configuration des paiements par carte bancaire"
                badge={<span className="badge badge-success">Connecté</span>}
              >
                <div className="space-y-4">
                  <SecureField
                    label="Clé publique Stripe"
                    value="pk_test_xxxxxxxxxxxxxxxxxxxxx"
                    keyName="stripe_public"
                    show={showKey['stripe_public']}
                    onToggle={() => setShowKey({ ...showKey, stripe_public: !showKey['stripe_public'] })}
                  />
                  <SecureField
                    label="Clé secrète Stripe"
                    value="sk_test_xxxxxxxxxxxxxxxxxxxxx"
                    keyName="stripe_secret"
                    show={showKey['stripe_secret']}
                    onToggle={() => setShowKey({ ...showKey, stripe_secret: !showKey['stripe_secret'] })}
                  />
                  <Field label="Webhook URL">
                    <div className="flex gap-2">
                      <input
                        className="input font-mono text-sm"
                        defaultValue="https://votreapi.com/webhooks/stripe"
                        readOnly
                      />
                      <button className="btn-secondary">📋 Copier</button>
                    </div>
                  </Field>
                </div>
              </Section>

              <Section
                title="PayPal"
                icon={CreditCard}
                description="Configuration PayPal"
                badge={<span className="badge badge-warning">Non configuré</span>}
              >
                <div className="space-y-4">
                  <Field label="Client ID PayPal">
                    <input className="input" placeholder="AeXXXXXXXXXXXXXXXXXX" />
                  </Field>
                  <Field label="Secret PayPal">
                    <input type="password" className="input" placeholder="••••••••••••••" />
                  </Field>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" className="w-4 h-4 accent-gold" />
                      <span className="text-sm">Mode sandbox (test)</span>
                    </label>
                  </div>
                </div>
              </Section>
            </>
          )}

          {/* === LIVRAISON === */}
          {activeTab === 'shipping' && (
            <Section title="Configuration des livraisons" icon={Truck} description="Paramètres globaux d'expédition">
              <div className="space-y-4">
                <Field label="Délai standard estimé">
                  <select className="input">
                    <option>7-14 jours</option>
                    <option>3-7 jours</option>
                    <option>14-21 jours</option>
                  </select>
                </Field>
                <Field label="Seuil de livraison gratuite (€)">
                  <input type="number" className="input font-mono" defaultValue="50" />
                </Field>
                <Field label="Frais de port par défaut (€)">
                  <input type="number" step="0.01" className="input font-mono" defaultValue="9.99" />
                </Field>
                <p className="text-sm text-gray-500 bg-blue-50 border border-blue-200 rounded-lg p-3">
                  ℹ️ Pour gérer les méthodes de livraison détaillées, allez sur la page <a href="/admin/livraison" className="text-blue-600 hover:underline font-semibold">Shipping</a>.
                </p>
              </div>
            </Section>
          )}

          {/* === EMAIL === */}
          {activeTab === 'email' && (
            <Section title="Configuration Email (SendGrid)" icon={Mail} description="Paramètres d'envoi d'emails transactionnels">
              <div className="space-y-4">
                <SecureField
                  label="Clé API SendGrid"
                  value="SG.xxxxxxxxxxxxxxxxxxxxx"
                  keyName="sendgrid"
                  show={showKey['sendgrid']}
                  onToggle={() => setShowKey({ ...showKey, sendgrid: !showKey['sendgrid'] })}
                />
                <Field label="Email expéditeur">
                  <input type="email" className="input" defaultValue="noreply@globalluxe.com" />
                </Field>
                <Field label="Nom expéditeur">
                  <input className="input" defaultValue="Global Luxe" />
                </Field>
                <Field label="Email admin (notifications)">
                  <input type="email" className="input" defaultValue="admin@globalluxe.com" />
                </Field>
                <button className="btn-secondary mt-2">
                  📧 Envoyer un email de test
                </button>
              </div>
            </Section>
          )}

          {/* === NOTIFICATIONS === */}
          {activeTab === 'notifications' && (
            <Section title="Préférences de notifications" icon={Bell} description="Choisissez quand recevoir des alertes">
              <div className="space-y-3">
                {[
                  { label: 'Nouvelle commande', desc: 'Recevoir un email à chaque commande' },
                  { label: 'Stock faible', desc: 'Alerte quand un produit a moins de 10 unités' },
                  { label: 'Nouveau message client', desc: 'Notification pour chaque message' },
                  { label: 'Rapport hebdomadaire', desc: 'Résumé des ventes chaque lundi' },
                  { label: 'Mises à jour CJ', desc: 'Statut des commandes envoyées à CJ' },
                ].map((item, i) => (
                  <label key={i} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition">
                    <div>
                      <p className="font-semibold text-sm">{item.label}</p>
                      <p className="text-xs text-gray-500">{item.desc}</p>
                    </div>
                    <input type="checkbox" defaultChecked className="w-5 h-5 accent-gold" />
                  </label>
                ))}
              </div>
            </Section>
          )}

          {/* === INTÉGRATIONS === */}
          {activeTab === 'integrations' && (
            <>
              <Section
                title="CJ Dropshipping"
                icon={Database}
                description="Intégration avec CJ Dropshipping API v2"
                badge={<span className="badge badge-success">Connecté</span>}
              >
                <div className="space-y-4">
                  <Field label="Email du compte CJ">
                    <input type="email" className="input" defaultValue="votre@email.com" />
                  </Field>
                  <SecureField
                    label="Clé API CJ"
                    value="cj_api_xxxxxxxxxxxxxxxxxxxxx"
                    keyName="cj"
                    show={showKey['cj']}
                    onToggle={() => setShowKey({ ...showKey, cj: !showKey['cj'] })}
                  />
                  <div className="flex gap-2 mt-4">
                    <button className="btn-gold">🔄 Tester la connexion</button>
                    <button className="btn-secondary">📦 Synchroniser produits</button>
                  </div>
                </div>
              </Section>

              {/* PARAMÈTRES DYNAMIQUES (depuis BDD) */}
              <Section
                title="Paramètres avancés"
                icon={Key}
                description="Clés-valeurs personnalisées"
                action={
                  <button onClick={() => setShowAddForm(!showAddForm)} className="btn-gold !text-xs !py-2">
                    <Plus size={14} /> Ajouter
                  </button>
                }
              >
                {showAddForm && (
                  <div className="card bg-gray-50 border-dashed mb-4 animate-slide-up">
                    <div className="grid sm:grid-cols-3 gap-3">
                      <input
                        placeholder="Clé (ex: currency)"
                        value={newSetting.key}
                        onChange={(e) => setNewSetting({ ...newSetting, key: e.target.value })}
                        className="input"
                      />
                      <input
                        placeholder="Valeur"
                        value={newSetting.value}
                        onChange={(e) => setNewSetting({ ...newSetting, value: e.target.value })}
                        className="input"
                      />
                      <input
                        placeholder="Description"
                        value={newSetting.description}
                        onChange={(e) => setNewSetting({ ...newSetting, description: e.target.value })}
                        className="input"
                      />
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button onClick={create} className="btn-gold">
                        <Save size={14} /> Ajouter
                      </button>
                      <button onClick={() => setShowAddForm(false)} className="btn-secondary">
                        Annuler
                      </button>
                    </div>
                  </div>
                )}

                {settings.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-8">
                    Aucun paramètre personnalisé
                  </p>
                ) : (
                  <div className="space-y-2">
                    {settings.map((s) => (
                      <div key={s.key} className="card bg-gray-50/50 border-gray-200 hover:bg-white transition">
                        <div className="grid sm:grid-cols-4 gap-3 items-center">
                          <div>
                            <p className="font-bold text-sm font-mono">{s.key}</p>
                            {s.description && <p className="text-xs text-gray-500 mt-1">{s.description}</p>}
                          </div>
                          <input
                            type="text"
                            defaultValue={s.value}
                            onChange={(e) => setEdits({ ...edits, [s.key]: e.target.value })}
                            className="input sm:col-span-2 !min-h-[36px] !py-1.5"
                          />
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => update(s.key)}
                              disabled={!(s.key in edits)}
                              className="btn-gold !text-xs !py-2 !px-3 disabled:opacity-30"
                            >
                              <Save size={12} />
                            </button>
                            <button onClick={() => remove(s.key)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Section>
            </>
          )}

          {/* === SÉCURITÉ === */}
          {activeTab === 'security' && (
            <Section title="Sécurité du compte" icon={Shield} description="Protection et accès administrateur">
              <div className="space-y-6">
                <div>
                  <h4 className="font-bold mb-3">Changer le mot de passe</h4>
                  <div className="space-y-3">
                    <Field label="Mot de passe actuel">
                      <input type="password" className="input" />
                    </Field>
                    <Field label="Nouveau mot de passe">
                      <input type="password" className="input" />
                    </Field>
                    <Field label="Confirmer le nouveau mot de passe">
                      <input type="password" className="input" />
                    </Field>
                    <button className="btn-gold mt-2">
                      <Shield size={14} /> Mettre à jour
                    </button>
                  </div>
                </div>

                <hr className="border-gray-200" />

                <div>
                  <h4 className="font-bold mb-3">Sessions actives</h4>
                  <div className="card bg-emerald-50 border-emerald-200 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-sm">💻 Chrome — Windows</p>
                      <p className="text-xs text-gray-600">Paris, France — Active maintenant</p>
                    </div>
                    <span className="badge badge-success">Actuelle</span>
                  </div>
                </div>

                <hr className="border-gray-200" />

                <div>
                  <h4 className="font-bold mb-3 text-red-600">Zone dangereuse</h4>
                  <div className="card bg-red-50 border-red-200">
                    <p className="text-sm text-gray-700 mb-3">
                      Supprimer toutes les données et réinitialiser le compte. <strong>Cette action est irréversible.</strong>
                    </p>
                    <button className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-bold transition">
                      🗑️ Réinitialiser le compte
                    </button>
                  </div>
                </div>
              </div>
            </Section>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================
// COMPOSANTS HELPERS
// ============================================

interface SectionProps {
  title: string;
  icon: React.ElementType;
  description?: string;
  children: React.ReactNode;
  badge?: React.ReactNode;
  action?: React.ReactNode;
}

function Section({ title, icon: Icon, description, children, badge, action }: SectionProps) {
  return (
    <div className="card animate-fade-in">
      <div className="flex items-start justify-between mb-6 pb-4 border-b border-gray-100">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center flex-shrink-0">
            <Icon size={20} className="text-gold" />
          </div>
          <div>
            <h3 className="font-bold text-lg flex items-center gap-2">
              {title}
              {badge}
            </h3>
            {description && <p className="text-sm text-gray-500 mt-0.5">{description}</p>}
          </div>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

interface FieldProps {
  label: string;
  children: React.ReactNode;
}

function Field({ label, children }: FieldProps) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
      {children}
    </div>
  );
}

interface SecureFieldProps {
  label: string;
  value: string;
  keyName: string;
  show: boolean;
  onToggle: () => void;
}

function SecureField({ label, value, show, onToggle }: SecureFieldProps) {
  return (
    <Field label={label}>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          readOnly
          className="input font-mono pr-12"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </Field>
  );
}