'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Slider } from '@/components/ui/slider';
import { useAuth, authFetch } from '@/lib/auth';

// Liste complète des 96 départements français
const DEPARTEMENTS = [
  { code: "all", nom: "France entière" },
  { code: "01", nom: "Ain" },
  { code: "02", nom: "Aisne" },
  { code: "03", nom: "Allier" },
  { code: "04", nom: "Alpes-de-Haute-Provence" },
  { code: "05", nom: "Hautes-Alpes" },
  { code: "06", nom: "Alpes-Maritimes" },
  { code: "07", nom: "Ardèche" },
  { code: "08", nom: "Ardennes" },
  { code: "09", nom: "Ariège" },
  { code: "10", nom: "Aube" },
  { code: "11", nom: "Aude" },
  { code: "12", nom: "Aveyron" },
  { code: "13", nom: "Bouches-du-Rhône" },
  { code: "14", nom: "Calvados" },
  { code: "15", nom: "Cantal" },
  { code: "16", nom: "Charente" },
  { code: "17", nom: "Charente-Maritime" },
  { code: "18", nom: "Cher" },
  { code: "19", nom: "Corrèze" },
  { code: "2A", nom: "Corse-du-Sud" },
  { code: "2B", nom: "Haute-Corse" },
  { code: "21", nom: "Côte-d'Or" },
  { code: "22", nom: "Côtes-d'Armor" },
  { code: "23", nom: "Creuse" },
  { code: "24", nom: "Dordogne" },
  { code: "25", nom: "Doubs" },
  { code: "26", nom: "Drôme" },
  { code: "27", nom: "Eure" },
  { code: "28", nom: "Eure-et-Loir" },
  { code: "29", nom: "Finistère" },
  { code: "30", nom: "Gard" },
  { code: "31", nom: "Haute-Garonne" },
  { code: "32", nom: "Gers" },
  { code: "33", nom: "Gironde" },
  { code: "34", nom: "Hérault" },
  { code: "35", nom: "Ille-et-Vilaine" },
  { code: "36", nom: "Indre" },
  { code: "37", nom: "Indre-et-Loire" },
  { code: "38", nom: "Isère" },
  { code: "39", nom: "Jura" },
  { code: "40", nom: "Landes" },
  { code: "41", nom: "Loir-et-Cher" },
  { code: "42", nom: "Loire" },
  { code: "43", nom: "Haute-Loire" },
  { code: "44", nom: "Loire-Atlantique" },
  { code: "45", nom: "Loiret" },
  { code: "46", nom: "Lot" },
  { code: "47", nom: "Lot-et-Garonne" },
  { code: "48", nom: "Lozère" },
  { code: "49", nom: "Maine-et-Loire" },
  { code: "50", nom: "Manche" },
  { code: "51", nom: "Marne" },
  { code: "52", nom: "Haute-Marne" },
  { code: "53", nom: "Mayenne" },
  { code: "54", nom: "Meurthe-et-Moselle" },
  { code: "55", nom: "Meuse" },
  { code: "56", nom: "Morbihan" },
  { code: "57", nom: "Moselle" },
  { code: "58", nom: "Nièvre" },
  { code: "59", nom: "Nord" },
  { code: "60", nom: "Oise" },
  { code: "61", nom: "Orne" },
  { code: "62", nom: "Pas-de-Calais" },
  { code: "63", nom: "Puy-de-Dôme" },
  { code: "64", nom: "Pyrénées-Atlantiques" },
  { code: "65", nom: "Hautes-Pyrénées" },
  { code: "66", nom: "Pyrénées-Orientales" },
  { code: "67", nom: "Bas-Rhin" },
  { code: "68", nom: "Haut-Rhin" },
  { code: "69", nom: "Rhône" },
  { code: "70", nom: "Haute-Saône" },
  { code: "71", nom: "Saône-et-Loire" },
  { code: "72", nom: "Sarthe" },
  { code: "73", nom: "Savoie" },
  { code: "74", nom: "Haute-Savoie" },
  { code: "75", nom: "Paris" },
  { code: "76", nom: "Seine-Maritime" },
  { code: "77", nom: "Seine-et-Marne" },
  { code: "78", nom: "Yvelines" },
  { code: "79", nom: "Deux-Sèvres" },
  { code: "80", nom: "Somme" },
  { code: "81", nom: "Tarn" },
  { code: "82", nom: "Tarn-et-Garonne" },
  { code: "83", nom: "Var" },
  { code: "84", nom: "Vaucluse" },
  { code: "85", nom: "Vendée" },
  { code: "86", nom: "Vienne" },
  { code: "87", nom: "Haute-Vienne" },
  { code: "88", nom: "Vosges" },
  { code: "89", nom: "Yonne" },
  { code: "90", nom: "Territoire de Belfort" },
  { code: "91", nom: "Essonne" },
  { code: "92", nom: "Hauts-de-Seine" },
  { code: "93", nom: "Seine-Saint-Denis" },
  { code: "94", nom: "Val-de-Marne" },
  { code: "95", nom: "Val-d'Oise" }
];


// Icons SVG professionnels
const Icons = {
  home: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
  building: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  chart: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  check: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  x: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  star: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  ),
};

// Types pour les données de l'API
interface DistributionItem {
  type: string;
  nb_pieces: number;
  count: number;
  pct: number;
}

interface RepartitionData {
  budget: number;
  total_biens: number;
  distribution_by_type: Record<string, { count: number; pct: number }>;
  by_type_and_pieces: DistributionItem[];
  stats: {
    part_1_2: number;
    pct_1_2: number;
    part_3_4: number;
    pct_3_4: number;
    part_5plus: number;
    pct_5plus: number;
  };
}

export default function RepartitionTaillePage() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();
  
  const [budget, setBudget] = useState(150000);
  const [departement, setDepartement] = useState('all');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [prefsLoaded, setPrefsLoaded] = useState(false);
  const [repartitionData, setRepartitionData] = useState<RepartitionData | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);
  
  const deptInfo = DEPARTEMENTS.find(d => d.code === departement);
  
  // Charger les données depuis l'API backend (comme dans le notebook)
  useEffect(() => {
    const fetchRepartitionData = async () => {
      setIsLoadingData(true);
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const url = new URL(`${apiUrl}/api/market-data`);
        
        // Passer "all" explicitement au backend qui le gère maintenant
        url.searchParams.set('departement', departement);
        url.searchParams.set('budget_max', budget.toString());
        
        console.log('Appel API:', url.toString());
        const response = await fetch(url.toString());
        
        if (response.ok) {
          const data = await response.json();
          console.log('Données API reçues:', data);
          
          // Vérifier si on a des données de répartition
          if (data.scope_departement?.repartition_taille_budget) {
            const repartData = data.scope_departement.repartition_taille_budget;
            console.log('Données répartition:', repartData);
            
            // Vérifier que les données sont valides
            if (repartData && repartData.by_type_and_pieces && Array.isArray(repartData.by_type_and_pieces)) {
              setRepartitionData(repartData as RepartitionData);
            } else {
              console.warn('Format de données invalide:', repartData);
              setRepartitionData(null);
            }
          } else {
            console.warn('Pas de données repartition_taille_budget dans la réponse. Structure:', Object.keys(data));
            setRepartitionData(null);
          }
        } else {
          const errorText = await response.text();
          console.error('Erreur API:', response.status, errorText);
          setRepartitionData(null);
        }
      } catch (error) {
        console.error('Erreur chargement données:', error);
        setRepartitionData(null);
      } finally {
        setIsLoadingData(false);
      }
    };
    
    fetchRepartitionData();
  }, [budget, departement]);
  
  // Préparer les données pour le graphique (comme dans le notebook)
  const chartData = useMemo(() => {
    if (!repartitionData || !repartitionData.by_type_and_pieces || repartitionData.by_type_and_pieces.length === 0) {
      return [];
    }
    
    try {
      // Grouper par nombre de pièces et type
      const piecesRange = Array.from(new Set(repartitionData.by_type_and_pieces.map(d => d.nb_pieces))).sort((a, b) => a - b);
      const types = Array.from(new Set(repartitionData.by_type_and_pieces.map(d => d.type))).sort();
      
      const data = piecesRange.map(nbPieces => {
        const item: any = { nb_pieces: nbPieces, label: nbPieces <= 2 ? `T${nbPieces}` : `${nbPieces} pièces` };
        types.forEach(type => {
          const found = repartitionData.by_type_and_pieces.find(
            d => d.nb_pieces === nbPieces && d.type === type
          );
          item[type] = found ? found.count : 0;
        });
        return item;
      });
      
      return data;
    } catch (error) {
      console.error('Erreur préparation données graphique:', error);
      return [];
    }
  }, [repartitionData]);

  // Charger les préférences utilisateur
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
        if (data && data.prix_projet) {
          // Utiliser prix_projet du Widget 1 comme budget
          setBudget(data.prix_projet);
        }
        if (data && data.w3_departement) {
          setDepartement(data.w3_departement);
        }
      }
    } catch (error) {
      console.error('Erreur chargement préférences:', error);
    } finally {
      setPrefsLoaded(true);
    }
  };

  // Sauvegarder les préférences
  const savePreferences = async () => {
    if (!isAuthenticated) {
      setSaveMessage('Connectez-vous pour sauvegarder');
      setTimeout(() => setSaveMessage(''), 3000);
      return;
    }
    
    setIsSaving(true);
    setSaveMessage('');
    
    try {
      console.log('Début sauvegarde préférences Widget 3...');
      
      // D'abord récupérer les préférences existantes
      const getResponse = await authFetch('/auth/preferences');
      let existingPrefs = {};
      if (getResponse.ok) {
        const data = await getResponse.json();
        if (data) existingPrefs = data;
        console.log('Préférences existantes récupérées:', existingPrefs);
      } else {
        console.warn('Impossible de récupérer les préférences existantes');
      }
      
      // Mettre à jour avec les nouvelles valeurs Widget 3
      const prefsToSave = {
        ...existingPrefs,
        w3_budget: budget,
        w3_departement: departement,
      };
      
      console.log('Préférences à sauvegarder:', prefsToSave);
      
      const response = await authFetch('/auth/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prefsToSave),
      });
      
      if (response.ok) {
        const savedData = await response.json();
        console.log('Préférences sauvegardées avec succès:', savedData);
        // Rediriger vers la page d'accueil après un court délai
        setTimeout(() => {
          router.push('/');
        }, 500);
      } else {
        const errorText = await response.text();
        console.error('Erreur sauvegarde:', response.status, errorText);
        setSaveMessage(`Erreur lors de la sauvegarde (${response.status})`);
        setTimeout(() => setSaveMessage(''), 5000);
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      setSaveMessage(`Erreur de connexion: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
      setTimeout(() => setSaveMessage(''), 5000);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[var(--bg-secondary)]/80 backdrop-blur-xl border-b border-[var(--border-color)]">
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px 32px' }} className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-2xl font-bold tracking-tight">
              <span className="text-white">Brick</span>
              <span className="text-[var(--primary-light)]">ByBrick</span>
            </Link>
            <span className="text-[var(--text-muted)]">|</span>
            <span className="text-[var(--text-secondary)] text-sm">Répartition par Taille</span>
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
                  Déconnexion
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-5">
                <Link href="/login" className="px-6 py-3 rounded-xl text-sm text-[var(--text-secondary)] hover:text-white transition-colors">Connexion</Link>
                <Link href="/register" className="px-8 py-4 rounded-xl font-medium bg-[var(--primary)] text-white hover:opacity-90 transition-opacity">Créer un compte</Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="bg-gradient-to-b from-emerald-600/10 to-transparent" style={{ paddingTop: '120px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '60px 48px', textAlign: 'center' }}>
          <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium mb-8">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Analyse de l'accessibilité
          </div>
          <h1 className="text-5xl font-bold text-white mb-8">Répartition par Taille</h1>
          <p className="text-xl text-[var(--text-secondary)]" style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
            Découvrez quels types de biens sont accessibles avec votre budget
          </p>
        </div>
      </div>

      {/* Main Content */}
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 48px 60px 48px' }}>
        
        {/* Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8" style={{ marginBottom: '60px' }}>
          
          {/* Budget Slider */}
          <div className="bg-[var(--bg-card)] rounded-3xl border border-[var(--border-color)]" style={{ padding: '48px' }}>
            <div className="flex items-center gap-3 mb-16">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                {Icons.home}
              </div>
              <label className="text-lg font-medium text-white" style={{ paddingTop: '4px', paddingBottom: '4px' }}>Budget maximum</label>
            </div>
            
            <div className="text-center mb-16" style={{ paddingTop: '8px', paddingBottom: '8px' }}>
              <span className="text-5xl font-bold text-white">{(budget / 1000).toFixed(0)}</span>
              <span className="text-2xl text-[var(--text-muted)] ml-2">k €</span>
            </div>
            
            <div style={{ marginBottom: '40px', paddingTop: '8px', paddingBottom: '8px' }}>
              <Slider
                value={[budget]}
                onValueChange={(v) => setBudget(v[0])}
                min={50000}
                max={500000}
                step={10000}
                className="w-full"
              />
            </div>
            
            <div className="flex justify-between text-sm text-[var(--text-muted)]" style={{ paddingTop: '8px', paddingBottom: '8px', paddingLeft: '4px', paddingRight: '4px' }}>
              <span>50 000 €</span>
              <span>500 000 €</span>
            </div>
          </div>

          {/* Département */}
          <div className="bg-[var(--bg-card)] rounded-3xl border border-[var(--border-color)]" style={{ padding: '48px' }}>
            <div className="flex items-center gap-3 mb-16">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center text-blue-400">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <label className="text-lg font-medium text-white" style={{ paddingTop: '4px', paddingBottom: '8px' }}>Département</label>
            </div>
            <div style={{ height: '20px' }}></div>
            <select
              value={departement}
              onChange={(e) => setDepartement(e.target.value)}
              className="w-full rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-white text-base appearance-none cursor-pointer"
              style={{ 
                padding: '12px 20px',
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239ca3af'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, 
                backgroundRepeat: 'no-repeat', 
                backgroundPosition: 'right 16px center', 
                backgroundSize: '24px' 
              }}
            >
              {DEPARTEMENTS.map(dept => (
                <option key={dept.code} value={dept.code}>
                  {dept.code === 'all' ? dept.nom : `${dept.code} - ${dept.nom}`}
                </option>
              ))}
            </select>
            
            <p className="text-sm text-[var(--text-muted)] mt-8 text-center" style={{ paddingTop: '12px', paddingBottom: '8px', paddingLeft: '8px', paddingRight: '8px' }}>
              Sélectionnez un département pour voir les prix locaux, ou "France entière" pour une moyenne nationale.
            </p>
          </div>
        </div>

        {/* Chart & Stats */}
        {isLoadingData ? (
          <div className="text-center py-20">
            <div className="text-[var(--text-muted)]">Chargement des données...</div>
          </div>
        ) : !repartitionData ? (
          <div className="bg-[var(--bg-card)] rounded-3xl border border-[var(--border-color)]" style={{ padding: '40px', textAlign: 'center' }}>
            <div className="text-[var(--text-muted)] text-lg mb-4">
              ⚠️ Erreur de chargement des données
            </div>
            <div className="text-sm text-[var(--text-muted)]">
              Vérifiez que le backend est démarré sur {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}
            </div>
            <div className="text-sm text-[var(--text-muted)] mt-2">
              Ouvrez la console du navigateur (F12) pour voir les détails de l'erreur.
            </div>
          </div>
        ) : !repartitionData.by_type_and_pieces || repartitionData.by_type_and_pieces.length === 0 || chartData.length === 0 ? (
          <div className="bg-[var(--bg-card)] rounded-3xl border border-[var(--border-color)]" style={{ padding: '40px', textAlign: 'center' }}>
            <div className="text-[var(--text-muted)] text-lg">
              ⚠️ Aucun bien trouvé sous ce budget ({budget.toLocaleString()} €)
            </div>
            <div className="text-sm text-[var(--text-muted)] mt-2">
              Essayez d'augmenter le montant maximum ou de changer de département.
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12" style={{ marginBottom: '60px' }}>
            
            {/* Chart - Graphique en barres groupées comme dans le notebook */}
            <div className="lg:col-span-2 bg-[var(--bg-card)] rounded-3xl border border-[var(--border-color)]" style={{ padding: '48px' }}>
              <div className="flex items-center justify-between mb-16">
                <div style={{ paddingTop: '4px', paddingBottom: '4px' }}>
                  <h2 className="text-2xl font-bold text-white mb-6" style={{ paddingTop: '4px', paddingBottom: '4px' }}>Distribution des Ventes par Taille de Bien</h2>
                  <p className="text-[var(--text-muted)]" style={{ paddingTop: '4px', paddingBottom: '4px' }}>Budget ≤ {budget.toLocaleString()} € • {deptInfo?.nom}</p>
                </div>
                <div className="flex items-center gap-3" style={{ paddingTop: '4px', paddingBottom: '4px' }}>
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                    {Icons.chart}
                  </div>
                </div>
              </div>

              {chartData.length > 0 ? (
                <div className="h-80" style={{ paddingTop: '16px', paddingBottom: '16px', paddingLeft: '8px', paddingRight: '8px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 20, right: 40, left: 20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis 
                        dataKey="label" 
                        stroke="var(--text-muted)" 
                        fontSize={14}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis 
                        stroke="var(--text-muted)" 
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        label={{ value: 'Nombre de Ventes', angle: -90, position: 'insideLeft', style: { fill: 'var(--text-muted)' } }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'var(--bg-card)', 
                          border: '1px solid var(--border-color)',
                          borderRadius: '16px',
                          padding: '16px'
                        }}
                        formatter={(value: number) => [`${value.toLocaleString()} ventes`, '']}
                      />
                      {chartData[0] && 'Appartement' in chartData[0] && (
                        <Bar dataKey="Appartement" fill="#3b82f6" radius={[12, 12, 0, 0]} />
                      )}
                      {chartData[0] && 'Maison' in chartData[0] && (
                        <Bar dataKey="Maison" fill="#ef4444" radius={[12, 12, 0, 0]} />
                      )}
                      {chartData[0] && 'Autre' in chartData[0] && (
                        <Bar dataKey="Autre" fill="#10b981" radius={[12, 12, 0, 0]} />
                      )}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-80 flex items-center justify-center text-[var(--text-muted)]">
                  Aucune donnée à afficher
                </div>
              )}
              
              {/* Légende */}
              <div className="flex items-center justify-center gap-6 mt-6">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-[#3b82f6]"></div>
                  <span className="text-sm text-[var(--text-muted)]">Appartement</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-[#ef4444]"></div>
                  <span className="text-sm text-[var(--text-muted)]">Maison</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-[#10b981]"></div>
                  <span className="text-sm text-[var(--text-muted)]">Autre</span>
                </div>
              </div>
            </div>

            {/* Stats Panel - Exactement comme dans le notebook */}
            <div className="space-y-8">
              {/* Statistiques Globales */}
              <div className="bg-[var(--bg-card)] rounded-3xl border border-[var(--border-color)]" style={{ padding: '40px' }}>
                <h3 className="text-lg font-medium text-white mb-12" style={{ paddingTop: '4px', paddingBottom: '30px' }}>Statistiques Globales</h3>
                
                <div className="flex flex-col gap-4">
                  <div className="text-center rounded-2xl bg-[var(--bg-secondary)]" style={{ padding: '16px 12px' }}>
                    <div className="text-3xl font-bold text-white" style={{ paddingTop: '2px', paddingBottom: '2px' }}>{repartitionData.total_biens.toLocaleString()}</div>
                    <div className="text-sm text-[var(--text-muted)] mt-2" style={{ paddingTop: '2px', paddingBottom: '2px' }}>Total Ventes</div>
                    <div className="text-xs text-[var(--text-muted)] mt-1" style={{ paddingTop: '1px', paddingBottom: '1px' }}>Biens disponibles</div>
                  </div>
                  
                  <div className="text-center rounded-2xl bg-[var(--bg-secondary)]" style={{ padding: '16px 12px' }}>
                    <div className="text-3xl font-bold text-emerald-400" style={{ paddingTop: '2px', paddingBottom: '2px' }}>{repartitionData.stats.pct_1_2.toFixed(1)}%</div>
                    <div className="text-sm text-[var(--text-muted)] mt-2" style={{ paddingTop: '2px', paddingBottom: '2px' }}>Studios & T2</div>
                    <div className="text-xs text-[var(--text-muted)] mt-1" style={{ paddingTop: '1px', paddingBottom: '1px' }}>{repartitionData.stats.part_1_2.toLocaleString()} biens</div>
                  </div>
                  
                  <div className="text-center rounded-2xl bg-[var(--bg-secondary)]" style={{ padding: '16px 12px' }}>
                    <div className="text-3xl font-bold text-blue-400" style={{ paddingTop: '2px', paddingBottom: '2px' }}>{repartitionData.stats.pct_3_4.toFixed(1)}%</div>
                    <div className="text-sm text-[var(--text-muted)] mt-2" style={{ paddingTop: '2px', paddingBottom: '2px' }}>T3 & T4</div>
                    <div className="text-xs text-[var(--text-muted)] mt-1" style={{ paddingTop: '1px', paddingBottom: '1px' }}>{repartitionData.stats.part_3_4.toLocaleString()} biens</div>
                  </div>
                  
                  <div className="text-center rounded-2xl bg-[var(--bg-secondary)]" style={{ padding: '16px 12px' }}>
                    <div className="text-3xl font-bold text-purple-400" style={{ paddingTop: '2px', paddingBottom: '2px' }}>{repartitionData.stats.pct_5plus.toFixed(1)}%</div>
                    <div className="text-sm text-[var(--text-muted)] mt-2" style={{ paddingTop: '2px', paddingBottom: '2px' }}>T5+</div>
                    <div className="text-xs text-[var(--text-muted)] mt-1" style={{ paddingTop: '1px', paddingBottom: '1px' }}>{repartitionData.stats.part_5plus.toLocaleString()} biens</div>
                  </div>
                </div>
              </div>
              
              {/* Répartition par Type de Bien */}
              {repartitionData.distribution_by_type && (
                <div className="bg-[var(--bg-card)] rounded-3xl border border-[var(--border-color)]" style={{ padding: '40px' }}>
                  <h3 className="text-lg font-medium text-white mb-12" style={{ paddingTop: '4px', paddingBottom: '30px' }}>Répartition par Type de Bien</h3>
                  <div className="flex flex-col gap-4">
                    {Object.entries(repartitionData.distribution_by_type).map(([type, data]) => {
                      const colors: Record<string, string> = {
                        'Appartement': '#3b82f6',
                        'Maison': '#ef4444',
                        'Autre': '#10b981'
                      };
                      return (
                        <div key={type} className="flex items-center justify-between rounded-xl bg-[var(--bg-secondary)]" style={{ padding: '12px 16px' }}>
                          <div className="flex items-center gap-3" style={{ paddingTop: '1px', paddingBottom: '1px' }}>
                            <div className="w-3.5 h-3.5 rounded" style={{ backgroundColor: colors[type] || '#999' }}></div>
                            <span className="text-white font-medium text-sm" style={{ paddingTop: '1px', paddingBottom: '1px' }}>{type}</span>
                          </div>
                          <span className="font-bold text-sm" style={{ color: colors[type] || '#999', paddingTop: '1px', paddingBottom: '1px' }}>
                            {data.count.toLocaleString()} ({data.pct.toFixed(1)}%)
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}


        {/* Save Button */}
        <div style={{ textAlign: 'center', marginTop: '40px' }}>
          <button
            onClick={savePreferences}
            disabled={isSaving || !isAuthenticated}
            className="rounded-2xl font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
            style={{
              padding: '24px 80px',
              fontSize: '1.25rem',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            }}
          >
            {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
          </button>
          {saveMessage && (
            <p className="text-sm text-rose-400 mt-4">{saveMessage}</p>
          )}
        </div>
      </main>
    </div>
  );
}
