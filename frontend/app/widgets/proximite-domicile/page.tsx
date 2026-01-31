'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Link from 'next/link';
import { Slider } from '@/components/ui/slider';
import { useAuth, authFetch } from '@/lib/auth';
import dynamic from 'next/dynamic';

// Import dynamique du composant Map pour éviter les erreurs SSR
const MapComponentProximite = dynamic(
  () => import('@/components/MapComponentProximite'),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-2xl border border-[var(--border-color)] flex items-center justify-center text-[var(--text-muted)]" style={{ height: '500px' }}>
        Chargement de la carte...
      </div>
    )
  }
);

// Hook de debounce personnalisé
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Types
interface Commune {
  code_postal: string;
  commune: string;
  lat: number;
  lon: number;
  pct_access: number;
  prix_median?: number;
  nb_ventes?: number;
  distance_min: number;
}

interface Ville {
  nom: string;
  code_postal: string;
  lat?: number;
  lon?: number;
}

interface CommuneSearchResult {
  nom: string;
  code_postal: string | null;
  lat?: number;
  lon?: number;
}

// Icons
const Icons = {
  map: <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>,
  home: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
  x: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>,
  search: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
  pin: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
};

// Composant de recherche de ville réutilisable
interface VilleSearchProps {
  placeholder: string;
  onSelect: (ville: Ville) => void;
  disabled?: boolean;
}

function VilleSearch({ placeholder, onSelect, disabled }: VilleSearchProps) {
  const [input, setInput] = useState('');
  const [results, setResults] = useState<CommuneSearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const debouncedInput = useDebounce(input, 300);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Fermer les résultats quand on clique ailleurs
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Recherche de communes
  useEffect(() => {
    const searchCommunes = async () => {
      if (debouncedInput.length < 2) {
        setResults([]);
        setShowResults(false);
        return;
      }

      setIsSearching(true);
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const response = await fetch(`${apiUrl}/api/communes/search?q=${encodeURIComponent(debouncedInput)}`);

        if (response.ok) {
          const data = await response.json();
          setResults(data.communes || []);
          setShowResults(true);
        }
      } catch (error) {
        console.error('Erreur recherche communes:', error);
      } finally {
        setIsSearching(false);
      }
    };

    searchCommunes();
  }, [debouncedInput]);

  const handleSelect = (result: CommuneSearchResult) => {
    const ville: Ville = {
      nom: result.nom,
      code_postal: result.code_postal || '',
      lat: result.lat,
      lon: result.lon
    };
    onSelect(ville);
    setInput('');
    setShowResults(false);
    setResults([]);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onFocus={() => results.length > 0 && setShowResults(true)}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full px-5 py-4 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-white text-lg disabled:opacity-50"
        />
        {isSearching && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none">
            <div className="w-5 h-5 border-2 border-[var(--text-muted)] border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {showResults && results.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl overflow-hidden shadow-2xl" style={{ maxHeight: '300px', overflowY: 'auto' }}>
          {results.map((result, index) => (
            <button
              key={`${result.nom}-${result.code_postal}-${index}`}
              onClick={() => handleSelect(result)}
              className="w-full px-5 py-4 text-left hover:bg-[var(--bg-secondary)] transition-colors border-b border-[var(--border-color)] last:border-b-0 flex items-center gap-3"
            >
              <span className="text-[var(--text-muted)]">{Icons.pin}</span>
              <div>
                <div className="text-white font-medium">{result.nom}</div>
                {result.code_postal && (
                  <div className="text-sm text-[var(--text-muted)]">{result.code_postal}</div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {showResults && results.length === 0 && debouncedInput.length >= 2 && !isSearching && (
        <div className="absolute z-50 w-full mt-2 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-4 text-center text-[var(--text-muted)]">
          Aucune commune trouvée
        </div>
      )}
    </div>
  );
}

export default function ProximiteDomicilePage() {
  const { user, isAuthenticated, logout } = useAuth();

  // Budget
  const [budget, setBudget] = useState(150000);

  // Ville domicile (une seule)
  const [villeDomicile, setVilleDomicile] = useState<Ville | null>(null);

  // Villes relais (plusieurs)
  const [villesRelais, setVillesRelais] = useState<Ville[]>([]);

  // Rayon
  const [rayon, setRayon] = useState(20);

  // Données communes
  const [communesData, setCommunesData] = useState<Commune[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Préférences
  const [isSaving, setIsSaving] = useState(false);
  const [prefsLoaded, setPrefsLoaded] = useState(false);

  // Debounce
  const debouncedBudget = useDebounce(budget, 500);
  const debouncedRayon = useDebounce(rayon, 300);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Charger les préférences
  useEffect(() => {
    if (isAuthenticated && !prefsLoaded) {
      loadPreferences();
    }
  }, [isAuthenticated, prefsLoaded]);

  const loadPreferences = async () => {
    try {
      const response = await authFetch('/auth/preferences');
      if (response.ok) {
        const data = await response.json();
        if (data) {
          if (data.prix_projet) setBudget(data.prix_projet);
          if (data.w5_rayon) setRayon(data.w5_rayon);
          if (data.w5_ville_domicile) {
            try {
              setVilleDomicile(JSON.parse(data.w5_ville_domicile));
            } catch {}
          }
          if (data.w5_villes_relais) {
            try {
              setVillesRelais(JSON.parse(data.w5_villes_relais));
            } catch {}
          }
        }
      }
    } catch (error) {
      console.error('Erreur chargement préférences:', error);
    } finally {
      setPrefsLoaded(true);
    }
  };

  // Clé de dépendance pour les villes
  const villesKey = useMemo(() => {
    const domicileKey = villeDomicile ? `${villeDomicile.nom}-${villeDomicile.code_postal}` : '';
    const relaisKey = villesRelais.map(v => `${v.nom}-${v.code_postal}`).join('|');
    return `${domicileKey}|${relaisKey}`;
  }, [villeDomicile, villesRelais]);

  // Charger les communes dans le rayon
  useEffect(() => {
    const fetchCommunes = async () => {
      const villesList: Ville[] = [];
      if (villeDomicile) villesList.push(villeDomicile);
      villesList.push(...villesRelais);

      if (villesList.length === 0 || debouncedBudget <= 0) {
        setCommunesData([]);
        return;
      }

      // Vérifier que toutes les villes ont des coordonnées
      const villesAvecCoords = villesList.filter(v => v.lat && v.lon);
      if (villesAvecCoords.length === 0) {
        setCommunesData([]);
        return;
      }

      setIsLoadingData(true);
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

        const villesStr = villesAvecCoords
          .map(v => `${v.nom}:${v.code_postal}`)
          .join(',');

        const url = new URL(`${apiUrl}/api/proximite/communes`);
        url.searchParams.set('villes', villesStr);
        url.searchParams.set('rayon_km', debouncedRayon.toString());
        url.searchParams.set('budget_max', debouncedBudget.toString());

        const response = await fetch(url.toString());

        if (response.ok) {
          const data = await response.json();
          setCommunesData(data.communes || []);
        } else {
          setCommunesData([]);
        }
      } catch (error) {
        console.error('Erreur chargement communes:', error);
        setCommunesData([]);
      } finally {
        setIsLoadingData(false);
      }
    };

    if (mounted) {
      fetchCommunes();
    }
  }, [villesKey, debouncedRayon, debouncedBudget, mounted]);

  // Ajouter ville domicile
  const handleSelectDomicile = (ville: Ville) => {
    setVilleDomicile(ville);
  };

  // Ajouter ville relais
  const handleSelectRelais = (ville: Ville) => {
    if (!villesRelais.find(v => v.nom === ville.nom && v.code_postal === ville.code_postal)) {
      setVillesRelais(prev => [...prev, ville]);
    }
  };

  // Supprimer une ville relais
  const removeVilleRelais = (index: number) => {
    setVillesRelais(villesRelais.filter((_, i) => i !== index));
  };

  // Centre de la carte
  const mapCenter = useMemo(() => {
    const villes = [villeDomicile, ...villesRelais].filter(Boolean) as Ville[];

    if (villes.length === 0) {
      return { lat: 46.5, lon: 2.5, zoom: 6 };
    }

    const lats = villes.filter(v => v.lat).map(v => v.lat!);
    const lons = villes.filter(v => v.lon).map(v => v.lon!);

    if (lats.length === 0 || lons.length === 0) {
      return { lat: 46.5, lon: 2.5, zoom: 6 };
    }

    const avgLat = lats.reduce((a, b) => a + b, 0) / lats.length;
    const avgLon = lons.reduce((a, b) => a + b, 0) / lons.length;

    return { lat: avgLat, lon: avgLon, zoom: villes.length === 1 ? 10 : 8 };
  }, [villeDomicile, villesRelais]);

  // Statistiques
  const stats = useMemo(() => {
    if (communesData.length === 0) {
      return { total: 0, tresAccessibles: 0, accessibles: 0, limites: 0, peuAccessibles: 0, maxVentes: 1 };
    }

    return {
      total: communesData.length,
      tresAccessibles: communesData.filter(c => c.pct_access >= 75).length,
      accessibles: communesData.filter(c => c.pct_access >= 50 && c.pct_access < 75).length,
      limites: communesData.filter(c => c.pct_access >= 25 && c.pct_access < 50).length,
      peuAccessibles: communesData.filter(c => c.pct_access < 25).length,
      maxVentes: Math.max(...communesData.map(c => c.nb_ventes || 1)),
    };
  }, [communesData]);

  // Sauvegarder
  const savePreferences = async () => {
    if (!isAuthenticated) {
      window.location.href = '/login';
      return;
    }

    setIsSaving(true);

    try {
      const response = await authFetch('/auth/preferences');
      let currentPrefs = {};
      if (response.ok) {
        const data = await response.json();
        if (data) currentPrefs = data;
      }

      const updateResponse = await authFetch('/auth/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...currentPrefs,
          w5_rayon: rayon,
          w5_ville_domicile: villeDomicile ? JSON.stringify(villeDomicile) : null,
          w5_villes_relais: villesRelais.length > 0 ? JSON.stringify(villesRelais) : null,
        }),
      });

      if (updateResponse.ok) {
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[var(--bg-primary)]/95 backdrop-blur-xl border-b border-[var(--border-color)]">
        <div className="max-w-7xl mx-auto px-8 py-5 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="text-xl font-bold">
              <span className="text-white">Brick</span>
              <span className="text-[var(--primary-light)]">ByBrick</span>
            </Link>
            <span className="text-[var(--text-muted)]">|</span>
            <span className="text-[var(--text-secondary)] text-sm">Proximite Domicile</span>
          </div>

          <div className="flex items-center gap-6">
            {isAuthenticated && user ? (
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--primary-light)] flex items-center justify-center text-white font-semibold">
                    {user.first_name.charAt(0)}{user.last_name.charAt(0)}
                  </div>
                  <span className="text-white font-medium hidden sm:block">{user.first_name}</span>
                </div>
                <button onClick={logout} className="px-6 py-3 rounded-xl text-sm text-[var(--text-secondary)] hover:text-white hover:bg-[var(--bg-secondary)] transition-colors">
                  Deconnexion
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-5">
                <Link href="/login" className="px-6 py-3 rounded-xl text-sm text-[var(--text-secondary)] hover:text-white transition-colors">Connexion</Link>
                <Link href="/register" className="px-8 py-4 rounded-xl font-medium bg-[var(--primary)] text-white hover:opacity-90 transition-opacity">Creer un compte</Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="bg-gradient-to-b from-lime-600/10 to-transparent" style={{ paddingTop: '120px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '60px 48px', textAlign: 'center' }}>
          <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-lime-500/10 border border-lime-500/20 text-lime-400 text-sm font-medium mb-8">
            <span className="w-2 h-2 rounded-full bg-lime-400 animate-pulse" />
            Recherche par proximite
          </div>
          <div style={{ height: '20px' }}></div>
          <h1 className="text-5xl font-bold text-white mb-8">Proximite Domicile</h1>
          <div style={{ height: '20px' }}></div>
          <p className="text-xl text-[var(--text-secondary)] text-center" style={{ maxWidth: '700px', margin: '0 auto' }}>
            Trouvez les communes accessibles autour de votre domicile et de vos villes relais
          </p>
        </div>
      </div>

      {/* Main Content */}
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 48px 60px 48px' }}>

        {/* Parametres */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">

          {/* Budget */}
          <div className="bg-[var(--bg-card)] rounded-3xl border border-[var(--border-color)]" style={{ padding: '32px' }}>
            <label className="text-lg font-medium text-white block mb-6">Budget maximum</label>
            <div style={{ height: '20px' }}></div>
            <div className="flex justify-between items-baseline mb-4">
              <span className="text-2xl font-bold text-white">{budget.toLocaleString('fr-FR')} EUR</span>
            </div>
            <div style={{ height: '16px' }}></div>
            <Slider
              value={[budget]}
              onValueChange={(v) => setBudget(v[0])}
              min={50000}
              max={1000000}
              step={10000}
            />
            <div style={{ height: '12px' }}></div>
            <div className="flex justify-between text-sm text-[var(--text-muted)]">
              <span>50k</span>
              <span>1M</span>
            </div>
          </div>

          {/* Rayon */}
          <div className="bg-[var(--bg-card)] rounded-3xl border border-[var(--border-color)]" style={{ padding: '32px' }}>
            <label className="text-lg font-medium text-white block mb-6">Rayon de recherche</label>
            <div style={{ height: '20px' }}></div>
            <div className="flex justify-between items-baseline mb-4">
              <span className="text-2xl font-bold text-white">{rayon} km</span>
            </div>
            <div style={{ height: '16px' }}></div>
            <Slider
              value={[rayon]}
              onValueChange={(v) => setRayon(v[0])}
              min={5}
              max={50}
              step={5}
            />
            <div style={{ height: '12px' }}></div>
            <div className="flex justify-between text-sm text-[var(--text-muted)]">
              <span>5 km</span>
              <span>50 km</span>
            </div>
          </div>
        </div>
        <div style={{ height: '30px' }}></div>
        {/* Selection des villes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">

          {/* Ville domicile */}
          <div className="bg-[var(--bg-card)] rounded-3xl border border-[var(--border-color)]" style={{ padding: '32px' }}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-400">
                {Icons.home}
              </div>
            <div>
              <h3 className="text-xl font-bold text-white">Ville domicile</h3>
              <p className="text-sm text-[var(--text-muted)]">Votre lieu de residence principal</p>
            </div>
          </div>
          <div style={{ height: '20px' }}></div>

            {villeDomicile ? (
              <div className="bg-[var(--bg-secondary)] rounded-2xl p-4 border border-red-500/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-400">
                      {Icons.home}
                    </div>
                    <div>
                      <div className="text-white font-semibold">{villeDomicile.nom}</div>
                      {villeDomicile.code_postal && (
                        <div className="text-sm text-[var(--text-muted)]">{villeDomicile.code_postal}</div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setVilleDomicile(null)}
                    className="w-10 h-10 rounded-xl bg-red-500/10 hover:bg-red-500/20 flex items-center justify-center text-red-400 transition-colors"
                  >
                    {Icons.x}
                  </button>
                </div>
              </div>
            ) : (
              <VilleSearch
                placeholder="Rechercher votre ville domicile..."
                onSelect={handleSelectDomicile}
              />
            )}
          </div>

          {/* Villes relais */}
          <div className="bg-[var(--bg-card)] rounded-3xl border border-[var(--border-color)]" style={{ padding: '32px' }}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                {Icons.pin}
              </div>
            <div>
              <h3 className="text-xl font-bold text-white">Villes relais</h3>
              <p className="text-sm text-[var(--text-muted)]">Lieux de travail, famille, etc.</p>
            </div>
          </div>
          <div style={{ height: '20px' }}></div>

            <VilleSearch
              placeholder="Ajouter une ville relais..."
              onSelect={handleSelectRelais}
            />
            <div style={{ height: '10px' }}></div>
            {villesRelais.length > 0 && (
              <div className="mt-4 space-y-2">
                {villesRelais.map((ville, index) => (
                  <div key={index} className="bg-[var(--bg-secondary)] rounded-xl p-3 border border-blue-500/20">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                          {Icons.pin}
                        </div>
                        <div>
                          <div className="text-white font-medium text-sm">{ville.nom}</div>
                          {ville.code_postal && (
                            <div className="text-xs text-[var(--text-muted)]">{ville.code_postal}</div>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => removeVilleRelais(index)}
                        className="w-8 h-8 rounded-lg bg-red-500/10 hover:bg-red-500/20 flex items-center justify-center text-red-400 transition-colors"
                      >
                        {Icons.x}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div style={{ height: '30px' }}></div>
        {/* Statistiques */}
        {(villeDomicile || villesRelais.length > 0) && (
          <div className="bg-[var(--bg-card)] rounded-3xl border border-[var(--border-color)] mb-8" style={{ padding: '32px' }}>
            <h3 className="text-xl font-bold text-white mb-6">Communes trouvees dans le rayon</h3>
            <div style={{ height: '20px' }}></div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-[var(--bg-secondary)] rounded-2xl p-4 text-center">
                <div className="text-3xl font-bold text-white mb-1">{stats.total}</div>
                <div className="text-sm text-[var(--text-muted)]">Total</div>
              </div>
              <div className="bg-emerald-500/10 rounded-2xl p-4 text-center border border-emerald-500/20">
                <div className="text-3xl font-bold text-emerald-400 mb-1">{stats.tresAccessibles}</div>
                <div className="text-sm text-emerald-400/70">Tres accessibles</div>
              </div>
              <div className="bg-blue-500/10 rounded-2xl p-4 text-center border border-blue-500/20">
                <div className="text-3xl font-bold text-blue-400 mb-1">{stats.accessibles}</div>
                <div className="text-sm text-blue-400/70">Accessibles</div>
              </div>
              <div className="bg-amber-500/10 rounded-2xl p-4 text-center border border-amber-500/20">
                <div className="text-3xl font-bold text-amber-400 mb-1">{stats.limites}</div>
                <div className="text-sm text-amber-400/70">Limites</div>
              </div>
              <div className="bg-red-500/10 rounded-2xl p-4 text-center border border-red-500/20">
                <div className="text-3xl font-bold text-red-400 mb-1">{stats.peuAccessibles}</div>
                <div className="text-sm text-red-400/70">Peu accessibles</div>
              </div>
            </div>
          </div>
        )}
        <div style={{ height: '30px' }}></div>
        {/* Carte */}
        <div className="bg-[var(--bg-card)] rounded-3xl border border-[var(--border-color)]" style={{ padding: '32px' }}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Carte des communes</h2>
              <p className="text-[var(--text-muted)]">
                Rayon : {rayon} km | Budget : {budget.toLocaleString('fr-FR')} EUR
              </p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-lime-500/10 flex items-center justify-center text-lime-400">
              {Icons.map}
            </div>
          </div>
          <div style={{ height: '20px' }}></div>

          {isLoadingData ? (
            <div className="rounded-2xl border border-[var(--border-color)] flex flex-col items-center justify-center text-[var(--text-muted)]" style={{ height: '500px' }}>
              <div className="w-8 h-8 border-2 border-lime-500 border-t-transparent rounded-full animate-spin mb-4" />
              <div>Chargement des communes...</div>
            </div>
          ) : mounted && (villeDomicile || villesRelais.length > 0) ? (
            <div className="rounded-2xl overflow-hidden border border-[var(--border-color)]" style={{ position: 'relative' }}>
              <MapComponentProximite
                villes={[villeDomicile, ...villesRelais].filter(Boolean) as Ville[]}
                communesData={communesData}
                mapCenter={mapCenter}
                rayon={rayon}
                budget={budget}
                maxVentes={stats.maxVentes}
              />
              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: '100px',
                  background: 'linear-gradient(to top, rgba(10, 10, 15, 0.95) 0%, rgba(10, 10, 15, 0.5) 50%, transparent 100%)',
                  pointerEvents: 'none',
                  borderRadius: '0 0 16px 16px',
                  zIndex: 1000,
                }}
              />
            </div>
          ) : (
            <div className="rounded-2xl border border-[var(--border-color)] flex flex-col items-center justify-center text-[var(--text-muted)]" style={{ height: '500px' }}>
              <div className="w-16 h-16 rounded-2xl bg-lime-500/10 flex items-center justify-center text-lime-400 mb-4">
                {Icons.map}
              </div>
              <div className="text-lg mb-2">Selectionnez une ville pour commencer</div>
              <div className="text-sm">La carte affichera les communes accessibles dans le rayon</div>
            </div>
          )}

          {/* Legende */}
          <div className="flex flex-wrap justify-center gap-6 mt-6">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#10b981' }} />
              <span className="text-sm text-[var(--text-secondary)]">Très accessible (≥75%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#3b82f6' }} />
              <span className="text-sm text-[var(--text-secondary)]">Accessible (50-75%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#f59e0b' }} />
              <span className="text-sm text-[var(--text-secondary)]">Limite (25-50%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#ef4444' }} />
              <span className="text-sm text-[var(--text-secondary)]">Peu accessible (&lt;25%)</span>
            </div>
          </div>
        </div>
      </main>

      {/* Save Section */}
      <div
        className="border-t border-[var(--border-color)]"
        style={{ padding: '60px 48px', background: 'linear-gradient(to top, rgba(132, 204, 22, 0.05), transparent)' }}
      >
        <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
          <button
            onClick={savePreferences}
            disabled={isSaving}
            style={{ padding: '20px 60px', fontSize: '1.125rem', borderRadius: '16px' }}
            className="font-bold transition-all shadow-2xl bg-gradient-to-r from-lime-600 via-lime-500 to-lime-600 text-white hover:shadow-lime-500/30 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
          >
            {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
          </button>
        </div>
      </div>
    </div>
  );
}
