'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth, authFetch } from '@/lib/auth';

const CONTAINER = {
  maxWidth: 1400,
  marginLeft: 'auto',
  marginRight: 'auto',
  paddingLeft: 48,
  paddingRight: 48,
} as const;

const CTA_STYLE = {
  background: 'linear-gradient(135deg,#8b5cf6,#4f46e5)',
  borderRadius: 40,
  boxShadow: '0 4px 20px rgba(139,92,246,0.4)',
  padding: '14px 32px',
  fontSize: '1rem',
  lineHeight: 1,
} as const;

// All French departments
const DEPARTEMENTS = [
  { code: "01", nom: "Ain" }, { code: "02", nom: "Aisne" }, { code: "03", nom: "Allier" },
  { code: "04", nom: "Alpes-de-Haute-Provence" }, { code: "05", nom: "Hautes-Alpes" }, { code: "06", nom: "Alpes-Maritimes" },
  { code: "07", nom: "Ardèche" }, { code: "08", nom: "Ardennes" }, { code: "09", nom: "Ariège" },
  { code: "10", nom: "Aube" }, { code: "11", nom: "Aude" }, { code: "12", nom: "Aveyron" },
  { code: "13", nom: "Bouches-du-Rhône" }, { code: "14", nom: "Calvados" }, { code: "15", nom: "Cantal" },
  { code: "16", nom: "Charente" }, { code: "17", nom: "Charente-Maritime" }, { code: "18", nom: "Cher" },
  { code: "19", nom: "Corrèze" }, { code: "21", nom: "Côte-d'Or" }, { code: "22", nom: "Côtes-d'Armor" },
  { code: "23", nom: "Creuse" }, { code: "24", nom: "Dordogne" }, { code: "25", nom: "Doubs" },
  { code: "26", nom: "Drôme" }, { code: "27", nom: "Eure" }, { code: "28", nom: "Eure-et-Loir" },
  { code: "29", nom: "Finistère" }, { code: "2A", nom: "Corse-du-Sud" }, { code: "2B", nom: "Haute-Corse" },
  { code: "30", nom: "Gard" }, { code: "31", nom: "Haute-Garonne" }, { code: "32", nom: "Gers" },
  { code: "33", nom: "Gironde" }, { code: "34", nom: "Hérault" }, { code: "35", nom: "Ille-et-Vilaine" },
  { code: "36", nom: "Indre" }, { code: "37", nom: "Indre-et-Loire" }, { code: "38", nom: "Isère" },
  { code: "39", nom: "Jura" }, { code: "40", nom: "Landes" }, { code: "41", nom: "Loir-et-Cher" },
  { code: "42", nom: "Loire" }, { code: "43", nom: "Haute-Loire" }, { code: "44", nom: "Loire-Atlantique" },
  { code: "45", nom: "Loiret" }, { code: "46", nom: "Lot" }, { code: "47", nom: "Lot-et-Garonne" },
  { code: "48", nom: "Lozère" }, { code: "49", nom: "Maine-et-Loire" }, { code: "50", nom: "Manche" },
  { code: "51", nom: "Marne" }, { code: "52", nom: "Haute-Marne" }, { code: "53", nom: "Mayenne" },
  { code: "54", nom: "Meurthe-et-Moselle" }, { code: "55", nom: "Meuse" }, { code: "56", nom: "Morbihan" },
  { code: "57", nom: "Moselle" }, { code: "58", nom: "Nièvre" }, { code: "59", nom: "Nord" },
  { code: "60", nom: "Oise" }, { code: "61", nom: "Orne" }, { code: "62", nom: "Pas-de-Calais" },
  { code: "63", nom: "Puy-de-Dôme" }, { code: "64", nom: "Pyrénées-Atlantiques" }, { code: "65", nom: "Hautes-Pyrénées" },
  { code: "66", nom: "Pyrénées-Orientales" }, { code: "67", nom: "Bas-Rhin" }, { code: "68", nom: "Haut-Rhin" },
  { code: "69", nom: "Rhône" }, { code: "70", nom: "Haute-Saône" }, { code: "71", nom: "Saône-et-Loire" },
  { code: "72", nom: "Sarthe" }, { code: "73", nom: "Savoie" }, { code: "74", nom: "Haute-Savoie" },
  { code: "75", nom: "Paris" }, { code: "76", nom: "Seine-Maritime" }, { code: "77", nom: "Seine-et-Marne" },
  { code: "78", nom: "Yvelines" }, { code: "79", nom: "Deux-Sèvres" }, { code: "80", nom: "Somme" },
  { code: "81", nom: "Tarn" }, { code: "82", nom: "Tarn-et-Garonne" }, { code: "83", nom: "Var" },
  { code: "84", nom: "Vaucluse" }, { code: "85", nom: "Vendée" }, { code: "86", nom: "Vienne" },
  { code: "87", nom: "Haute-Vienne" }, { code: "88", nom: "Vosges" }, { code: "89", nom: "Yonne" },
  { code: "90", nom: "Territoire de Belfort" }, { code: "91", nom: "Essonne" }, { code: "92", nom: "Hauts-de-Seine" },
  { code: "93", nom: "Seine-Saint-Denis" }, { code: "94", nom: "Val-de-Marne" }, { code: "95", nom: "Val-d'Oise" }
];

// Base prices by department (simulated)
const BASE_PRICES: { [key: string]: number } = {
  '75': 10500, '92': 7500, '94': 5500, '93': 4200, '69': 4200, '13': 3600,
  '06': 5200, '33': 4100, '31': 3700, '44': 4300, '59': 2800, '67': 3100,
  '34': 3400, '35': 3500, '38': 3200, '74': 4800, '73': 4200, '83': 4500,
  'default': 2800
};

// Generate data based on department and years
const generateData = (dept: string, typeBien: string, startYear: number, endYear: number) => {
  const basePrice = BASE_PRICES[dept] || BASE_PRICES['default'];
  const variation = typeBien === 'Appartement' ? 1 : typeBien === 'Maison' ? 0.85 : 0.92;
  
  // Price evolution pattern (realistic market trend)
  const yearMultipliers: { [key: number]: number } = {
    2020: 0.88,
    2021: 0.94,
    2022: 1.02,
    2023: 1.00,
    2024: 0.97
  };
  
  const data = [];
  for (let year = startYear; year <= endYear; year++) {
    const multiplier = yearMultipliers[year] || 1;
    data.push({
      annee: year,
      prix: Math.round(basePrice * variation * multiplier),
    });
  }
  return data;
};

// Icons
const Icons = {
  chart: <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" /></svg>,
  trendUp: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>,
  trendDown: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" /></svg>,
};

export default function DVFComparateurPage() {
  const { isAuthenticated } = useAuth();
  
  // State
  const [departement, setDepartement] = useState('69');
  const [typeBien, setTypeBien] = useState('Appartement');
  const [anneeDebut, setAnneeDebut] = useState(2020);
  const [anneeFin, setAnneeFin] = useState(2024);
  const [prefsLoaded, setPrefsLoaded] = useState(false);

  // Load preferences
  useEffect(() => {
    if (isAuthenticated && !prefsLoaded) {
      loadPreferences();
    }
  }, [isAuthenticated, prefsLoaded]);

  const loadPreferences = async () => {
    try {
      const response = await authFetch('/auth/preferences');
      if (response.ok) {
        const prefs = await response.json();
        if (prefs !== null) {
          setDepartement(prefs.w2_departement || '69');
          setTypeBien(prefs.w2_type_bien || 'Appartement');
          setAnneeDebut(prefs.w2_annee_debut || 2020);
          setAnneeFin(prefs.w2_annee_fin || 2024);
        }
        setPrefsLoaded(true);
      }
    } catch (error) {
      console.error('Failed to load preferences:', error);
      setPrefsLoaded(true);
    }
  };

  // Generate chart data
  const data = useMemo(() => 
    generateData(departement, typeBien, anneeDebut, anneeFin),
    [departement, typeBien, anneeDebut, anneeFin]
  );

  // Calculate metrics
  const metrics = useMemo(() => {
    if (data.length < 2) return { variation: 0, trend: 'stable', prixActuel: 0, prixDepart: 0 };
    
    const prixDepart = data[0].prix;
    const prixActuel = data[data.length - 1].prix;
    const variation = ((prixActuel - prixDepart) / prixDepart * 100);
    
    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (variation > 3) trend = 'up';
    else if (variation < -3) trend = 'down';
    
    return { variation, trend, prixActuel, prixDepart };
  }, [data]);

  // Market analysis
  const analysis = useMemo(() => {
    const { trend, variation } = metrics;
    
    if (trend === 'down') {
      return {
        title: 'Bon moment pour acheter',
        description: 'Les prix sont en baisse sur cette période. C\'est une opportunité pour les acheteurs.',
        color: 'emerald',
        icon: Icons.trendDown
      };
    } else if (trend === 'up') {
      return {
        title: 'Marché en hausse',
        description: 'Les prix ont augmenté sur cette période. Favorable aux vendeurs.',
        color: 'amber',
        icon: Icons.trendUp
      };
    } else {
      return {
        title: 'Marché stable',
        description: 'Les prix sont restés relativement stables sur cette période.',
        color: 'blue',
        icon: Icons.chart
      };
    }
  }, [metrics]);

  const deptInfo = DEPARTEMENTS.find(d => d.code === departement);

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Hero */}
      <div className="bg-gradient-to-b from-blue-600/10 to-transparent" style={{ paddingTop: '72px' }}>
        <div style={{ ...CONTAINER, paddingTop: 64, paddingBottom: 56, textAlign: 'center' }}>
          <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 text-sm font-semibold">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            Outil • Évolution des prix
          </div>
          <div aria-hidden style={{ height: 22 }} />
          <h1 className="text-5xl font-bold text-white" style={{ letterSpacing: '-0.02em' }}>Évolution des prix</h1>
          <div aria-hidden style={{ height: 14 }} />
          <p style={{ fontSize: 18, lineHeight: 1.7, color: 'var(--text-secondary)', maxWidth: 820, marginLeft: 'auto', marginRight: 'auto' }}>
            Analysez les tendances du marché immobilier sur la période de votre choix. Les valeurs “de référence” se règlent dans les paramètres — ici, vous explorez.
          </p>
          <div aria-hidden style={{ height: 30 }} />
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center text-white font-semibold transition-all duration-200 hover:opacity-90 hover:-translate-y-px"
            style={CTA_STYLE}
          >
            Retour au tableau de bord
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <main style={{ ...CONTAINER, paddingTop: 0, paddingBottom: 60 }}>
        
        {/* Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8" style={{ marginBottom: '40px' }}>
          
          {/* Department Selector */}
          <div className="bg-[var(--bg-card)] rounded-3xl border border-[var(--border-color)]" style={{ padding: '40px' }}>
            <label className="text-lg font-medium text-white block mb-6">Département</label>
            <select
              value={departement}
              onChange={(e) => setDepartement(e.target.value)}
              className="w-full px-6 py-4 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-white text-lg appearance-none cursor-pointer"
              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239ca3af'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 16px center', backgroundSize: '24px' }}
            >
              {DEPARTEMENTS.map(dept => (
                <option key={dept.code} value={dept.code}>
                  {dept.code} - {dept.nom}
                </option>
              ))}
            </select>
          </div>

          {/* Property Type */}
          <div className="bg-[var(--bg-card)] rounded-3xl border border-[var(--border-color)]" style={{ padding: '40px' }}>
            <label className="text-lg font-medium text-white block mb-6">Type de bien</label>
            <div className="flex flex-col gap-3">
              {['Appartement', 'Maison', 'Tous'].map(type => (
                <button
                  key={type}
                  onClick={() => setTypeBien(type)}
                  className={`px-6 py-4 rounded-2xl text-left font-medium transition-all ${
                    typeBien === type
                      ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
                      : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)]'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Period Selector */}
          <div className="bg-[var(--bg-card)] rounded-3xl border border-[var(--border-color)]" style={{ padding: '40px' }}>
            <label className="text-lg font-medium text-white block mb-6">Période d'analyse</label>
            <div className="space-y-6">
              <div>
                <span className="text-sm text-[var(--text-muted)] block mb-3">De</span>
                <select
                  value={anneeDebut}
                  onChange={(e) => setAnneeDebut(Number(e.target.value))}
                  className="w-full px-6 py-4 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-white text-lg"
                >
                  {[2020, 2021, 2022, 2023].map(year => (
                    <option key={year} value={year} disabled={year >= anneeFin}>{year}</option>
                  ))}
                </select>
              </div>
              <div>
                <span className="text-sm text-[var(--text-muted)] block mb-3">À</span>
                <select
                  value={anneeFin}
                  onChange={(e) => setAnneeFin(Number(e.target.value))}
                  className="w-full px-6 py-4 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-white text-lg"
                >
                  {[2021, 2022, 2023, 2024].map(year => (
                    <option key={year} value={year} disabled={year <= anneeDebut}>{year}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Chart & Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mb-12">
          
          {/* Chart */}
          <div className="lg:col-span-2 bg-[var(--bg-card)] rounded-3xl border border-[var(--border-color)]" style={{ padding: '40px' }}>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">{deptInfo?.nom || departement}</h2>
                <p className="text-[var(--text-muted)]">{typeBien} • {anneeDebut} - {anneeFin}</p>
              </div>
              <div className={`px-6 py-3 rounded-2xl font-bold text-xl ${
                metrics.variation >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
              }`}>
                {metrics.variation >= 0 ? '+' : ''}{metrics.variation.toFixed(1)}%
              </div>
            </div>

            <div style={{ height: '320px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorPrix" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="annee" stroke="var(--text-muted)" fontSize={14} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--text-muted)" fontSize={14} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v/1000).toFixed(1)}k`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '16px' }}
                    labelStyle={{ color: 'white', fontWeight: 600, marginBottom: '8px' }}
                    formatter={(value: number) => [`${value.toLocaleString()} €/m²`, 'Prix médian']}
                  />
                  <Area type="monotone" dataKey="prix" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorPrix)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Analysis Card */}
          <div className="bg-[var(--bg-card)] rounded-3xl border border-[var(--border-color)]" style={{ padding: '40px' }}>
            <div className={`w-16 h-16 rounded-2xl mb-6 flex items-center justify-center ${
              analysis.color === 'emerald' ? 'bg-emerald-500/10 text-emerald-400' :
              analysis.color === 'amber' ? 'bg-amber-500/10 text-amber-400' :
              'bg-blue-500/10 text-blue-400'
            }`}>
              {analysis.icon}
            </div>
            
            <h3 className={`text-2xl font-bold mb-4 ${
              analysis.color === 'emerald' ? 'text-emerald-400' :
              analysis.color === 'amber' ? 'text-amber-400' :
              'text-blue-400'
            }`}>
              {analysis.title}
            </h3>
            
            <p className="text-lg text-[var(--text-secondary)] mb-8 leading-relaxed">
              {analysis.description}
            </p>

            <div className="space-y-4 pt-6 border-t border-[var(--border-color)]">
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Prix en {anneeDebut}</span>
                <span className="text-white font-semibold">{metrics.prixDepart.toLocaleString()} €/m²</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Prix en {anneeFin}</span>
                <span className="text-white font-semibold">{metrics.prixActuel.toLocaleString()} €/m²</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Évolution</span>
                <span className={`font-bold ${metrics.variation >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {metrics.variation >= 0 ? '+' : ''}{metrics.variation.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </div>

      </main>

      {/* Footer CTA */}
      <div
        className="border-t"
        style={{
          borderColor: 'rgba(255,255,255,0.08)',
          paddingTop: 64,
          paddingBottom: 96,
          background: 'linear-gradient(to top, rgba(59, 130, 246, 0.06), transparent)',
        }}
      >
        <div style={{ ...CONTAINER, textAlign: 'center' }}>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center text-white font-semibold transition-all duration-200 hover:opacity-90 hover:-translate-y-px"
            style={{ ...CTA_STYLE, padding: '18px 44px', fontSize: '1.05rem' }}
          >
            Retour au tableau de bord
          </Link>
          <div aria-hidden style={{ height: 14 }} />
          <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Pour modifier vos informations de référence, rendez-vous dans <span className="text-white/80">Paramètres</span>.
          </div>
        </div>
      </div>
    </div>
  );
}
