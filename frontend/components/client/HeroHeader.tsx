'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search, ArrowRight, Play, Pause, Volume2, VolumeX,
} from 'lucide-react';
import { api } from '@/lib/api';

interface Category {
  id: number;
  name: string;
  slug: string;
  image?: string;
  banner?: string;
  description?: string;
  products_count?: number;
}

interface HeroHeaderProps {
  mediaSrc?: string;
  mediaType?: 'image' | 'video';
  badgeText?: string;
  title?: string[];
  subtitle?: string;
  ctaText?: string;
  ctaHref?: string;
  searchPlaceholder?: string;
  showCategories?: boolean;
}

export default function HeroHeader({
  mediaSrc = '/hero-default.jpg',
  mediaType = 'image',
  badgeText = '✨ Global Luxe Premium',
  title = ['Shop Smarter.', 'Live Better.', 'Experience Luxury.'],
  subtitle = 'Votre marketplace premium pour découvrir les meilleurs produits avec une expérience fluide, riche et professionnelle.',
  ctaText = 'Explorer les produits',
  ctaHref = '/categorie/smartphones',
  searchPlaceholder = 'Rechercher un produit, une marque...',
  showCategories = true,
}: HeroHeaderProps) {
  const router = useRouter();
  const [isVideoPlaying, setIsVideoPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);   // ✅ Catégories depuis l'API
  const videoRef = useRef<HTMLVideoElement>(null);

  // ✅ RÉCUPÉRER LES CATÉGORIES DEPUIS L'API
  useEffect(() => {
    api.get('/products/categories/')
      .then((r) => {
        const data = r.data.results || r.data;
        setCategories(Array.isArray(data) ? data : []);
      })
      .catch(() => setCategories([]));
  }, []);

  const toggleVideo = () => {
    if (videoRef.current) {
      if (isVideoPlaying) videoRef.current.pause();
      else videoRef.current.play();
      setIsVideoPlaying(!isVideoPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/recherche?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <section className="relative min-h-[80vh] overflow-hidden bg-dark">
      {/* === FOND === */}
      <div className="absolute inset-0 z-0">
        {mediaType === 'video' ? (
          <video
            ref={videoRef}
            src={mediaSrc}
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
            onLoadedData={() => setLoaded(true)}
          />
        ) : (
          <img
            src={mediaSrc}
            alt="Hero"
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.src = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1920&q=80';
            }}
            onLoad={() => setLoaded(true)}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-dark/95 via-dark/80 to-dark/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-dark via-transparent to-dark/30" />
      </div>

      {/* Effets décoratifs */}
      <div className="absolute inset-0 z-[1] opacity-30 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gold/10 rounded-full blur-[128px] animate-pulse-soft" />
        <div className="absolute bottom-1/4 right-1/3 w-64 h-64 bg-gold/5 rounded-full blur-[96px]" />
      </div>

      {/* Contenu principal */}
      <div className="relative z-10 container-app flex flex-col justify-center py-12 lg:py-20">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">

          {/* COLONNE GAUCHE */}
          <div className={`space-y-6 transition-all duration-1000 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-2 text-sm text-white/90 w-fit">
              <span className="w-2 h-2 rounded-full bg-gold animate-pulse" />
              {badgeText}
            </div>

            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black text-white leading-[1.1] tracking-tight">
              {title.map((line, i) => (
                <span key={i} className="block overflow-hidden">
                  <span
                    className="block transition-all duration-700"
                    style={{
                      transitionDelay: `${i * 150 + 200}ms`,
                      transform: loaded ? 'translateY(0)' : 'translateY(100%)',
                      opacity: loaded ? 1 : 0,
                    }}
                  >
                    {i === title.length - 1 ? (
                      <span className="bg-gradient-to-r from-gold via-gold-light to-gold bg-clip-text text-transparent">
                        {line}
                      </span>
                    ) : (
                      line
                    )}
                  </span>
                </span>
              ))}
            </h1>

            <p className="text-gray-300 text-base lg:text-lg max-w-xl leading-relaxed">
              {subtitle}
            </p>

            {/* Recherche */}
            <form onSubmit={handleSearch} className="max-w-xl">
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-2 flex items-center gap-2 shadow-2xl shadow-black/20">
                <div className="flex-1 flex items-center gap-3 px-4">
                  <Search size={20} className="text-gray-400" />
                  <input
                    type="text"
                    placeholder={searchPlaceholder}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-transparent border-0 outline-none text-white placeholder-gray-400 w-full py-3"
                  />
                </div>
                <button type="submit" className="btn-gold px-6 py-3 rounded-xl whitespace-nowrap">
                  Rechercher <ArrowRight size={16} />
                </button>
              </div>

              <div className="flex gap-2 mt-3 flex-wrap">
                {['iPhone 15', 'Sony WH', 'Apple Watch', 'PS5'].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => {
                      setSearchQuery(tag);
                      router.push(`/recherche?q=${encodeURIComponent(tag)}`);
                    }}
                    className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-xs text-gray-300 hover:bg-white/10 hover:border-gold/50 hover:text-white transition-all"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </form>

            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <Link href={ctaHref} className="btn-gold text-base px-8 py-4 group">
                {ctaText}
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/categorie/beauty"
                className="btn-outline border-white/30 text-white hover:bg-white/10 hover:text-white text-base px-8 py-4"
              >
                <Play size={18} className="mr-2" /> Découvrir
              </Link>
            </div>

            <div className="flex gap-8 pt-6 border-t border-white/10">
              {[
                { value: '10K+', label: 'Produits' },
                { value: '50K+', label: 'Clients' },
                { value: '99%', label: 'Satisfaction' },
              ].map((stat, i) => (
                <div key={i} className="text-center sm:text-left">
                  <div className="text-2xl lg:text-3xl font-black text-gold">{stat.value}</div>
                  <div className="text-xs text-gray-400 uppercase tracking-wider">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* COLONNE DROITE */}
          <div className={`relative hidden lg:block transition-all duration-1000 delay-500 ${loaded ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-12'}`}>
            <div className="relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl shadow-gold/5">
              <div className="aspect-[4/3] bg-gradient-to-br from-dark-soft to-dark-muted relative overflow-hidden">
                {mediaType === 'video' ? (
                  <video src={mediaSrc} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                ) : (
                  <img src={mediaSrc} alt="Preview" className="w-full h-full object-cover" />
                )}

                {mediaType === 'video' && (
                  <div className="absolute bottom-4 right-4 flex gap-2 z-10">
                    <button onClick={toggleVideo} className="p-2 bg-black/50 backdrop-blur-md rounded-full text-white hover:bg-black/70 transition">
                      {isVideoPlaying ? <Pause size={16} /> : <Play size={16} />}
                    </button>
                    <button onClick={toggleMute} className="p-2 bg-black/50 backdrop-blur-md rounded-full text-white hover:bg-black/70 transition">
                      {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 hidden lg:block animate-bounce">
        <div className="w-6 h-10 border-2 border-white/30 rounded-full flex items-start justify-center p-1.5">
          <div className="w-1 h-2 bg-white/60 rounded-full animate-pulse" />
        </div>
      </div>
    </section>
  );
}