'use client';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Check, FileText, Truck, Package, Clock, User, MapPin, Mail, ArrowRight } from 'lucide-react';

export default function ConfirmationPage() {
  const sp = useSearchParams();
  const orderId = sp.get('order') || 'GL-94827';

  return (
    <div className="container-app py-8 lg:py-12 max-w-3xl">
      <div className="card overflow-hidden p-0">
        {/* En-tête succès */}
        <div className="bg-white text-center py-10 px-6 border-b border-gray-100">
          <div className="w-20 h-20 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Check size={40} className="text-emerald-600" strokeWidth={3} />
          </div>
          <h1 className="text-3xl lg:text-4xl font-black mb-2">Merci pour votre commande !</h1>
          <p className="text-gray-600">
            Votre transaction s&apos;est déroulée avec succès. Numéro de commande :{' '}
            <span className="font-bold text-emerald-600">#{orderId}</span>
          </p>
        </div>

        {/* Suivi logistique */}
        <div className="px-6 py-8 border-b border-gray-100">
          <h2 className="text-center text-xl font-bold mb-8">Suivi Logistique</h2>

          <div className="relative max-w-md mx-auto">
            <div className="flex justify-between relative z-10">
              {[
                { icon: FileText, label: 'Confirmé', done: true },
                { icon: Truck, label: 'Expédié', done: true },
                { icon: Package, label: 'Livré', done: false },
              ].map((step, i) => {
                const Icon = step.icon;
                return (
                  <div key={i} className="flex flex-col items-center">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
                      step.done
                        ? 'bg-emerald-600 text-white'
                        : 'bg-gray-100 text-gray-400 border-2 border-gray-200'
                    }`}>
                      <Icon size={20} />
                    </div>
                    <span className={`text-sm font-bold ${
                      step.done ? 'text-gray-900' : 'text-gray-400'
                    }`}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
            {/* Ligne de progression */}
            <div className="absolute top-6 left-6 right-6 h-0.5 bg-gray-200 -z-0">
              <div className="h-full bg-emerald-600" style={{ width: '50%' }} />
            </div>
          </div>

          {/* Estimation livraison */}
          <div className="mt-8 bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Clock size={18} className="text-blue-600" />
            </div>
            <div>
              <p className="font-bold text-sm mb-1">Livraison estimée</p>
              <p className="text-sm text-gray-600">
                Entre 7 et 12 jours ouvrés via Global Priority Logistics.
              </p>
            </div>
          </div>
        </div>

        {/* Détails commande */}
        <div className="grid md:grid-cols-2 gap-6 px-6 py-8 border-b border-gray-100">
          {/* Articles */}
          <div>
            <h3 className="font-bold text-lg mb-4">Articles Commandés</h3>
            <div className="flex gap-3">
              <div className="w-20 h-20 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                <img src="/placeholder-product.jpg" alt="" className="w-full h-full object-cover" />
              </div>
              <div>
                <p className="font-bold text-sm">Lumina Pro Series X</p>
                <p className="text-xs text-gray-500 mb-1">Quantité : 1</p>
                <p className="font-black text-emerald-600">€349.00</p>
              </div>
            </div>
          </div>

          {/* Adresse */}
          <div>
            <h3 className="font-bold text-lg mb-4">Informations de Livraison</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <User size={16} className="text-gray-400 mt-0.5" />
                <span>Jean Dupont</span>
              </div>
              <div className="flex items-start gap-2">
                <MapPin size={16} className="text-gray-400 mt-0.5" />
                <div>
                  <p>14 Avenue des Champs-Élysées</p>
                  <p>Appartement 4B</p>
                  <p>75008 Paris</p>
                  <p>France</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Mail size={16} className="text-gray-400 mt-0.5" />
                <span>jean.dupont@email.com</span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-gray-50 px-6 py-6 flex flex-col sm:flex-row justify-end gap-3">
          <Link
            href="/"
            className="px-6 py-3 border border-gray-200 rounded-xl text-sm font-bold hover:bg-white transition text-center"
          >
            Continuer mes achats
          </Link>
          <button className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition">
            Suivre ma commande <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}