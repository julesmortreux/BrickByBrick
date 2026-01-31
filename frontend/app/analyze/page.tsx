'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAuth, authFetch } from '@/lib/auth';

// Types
interface ScrapedData {
  url: string;
  prix: number | null;
  surface: number | null;
  code_postal: string | null;
  ville: string | null;
  nb_pieces: number | null;
  titre: string | null;
  success: boolean;
  error: string | null;
}

interface FinancialResult {
  prix_achat: number;
  surface: number;
  prix_m2: number;
  code_postal: string;
  departement: string;
  frais_notaire: number;
  cout_total_projet: number;
  apport: number;
  montant_emprunt: number;
  mensualite_totale: number;
  loyer_mensuel_brut: number;
  loyer_annuel_brut: number;
  charges_totales_mensuel: number;
  charges_totales_annuel: number;
  rentabilite_brute: number;
  rentabilite_nette: number;
  rentabilite_nette_nette: number;
  cashflow_mensuel_brut: number;
  cashflow_mensuel_net: number;
  cashflow_annuel_net: number;
  autofinancement: boolean;
  effort_epargne_mensuel: number;
  score_investissement: number;
  verdict: string;
  conseils: string[];
}

interface WidgetsData {
  dvf_stats?: {
    prix_m2_median: number;
    prix_m2_mean: number;
    nb_ventes: number;
    comparaison?: {
      prix_m2_annonce: number;
      ecart_vs_median_pct: number;
    };
  };
  loyers_stats?: {
    loyer_m2_median: number;
    loyer_mensuel_estime: number;
    rendement_brut_estime: number;
  };
  insee_stats?: {
    tension_locative: string;
    taux_vacance: number;
    part_locataires: number;
  };
  transport_stats?: {
    nb_gares: number;
    noms_gares: string[];
  };
  student_stats?: {
    nb_etablissements: number;
    top_etablissements: string[];
  };
}

interface AIAnalysis {
  score: number;
  verdict: string;
  resume: string;
  points_forts: string[];
  points_vigilance: string[];
  analyse_prix: {
    evaluation: string;
    explication: string;
  };
  analyse_rentabilite: {
    niveau: string;
    explication: string;
  };
  analyse_localisation: {
    potentiel: string;
    explication: string;
  };
  analyse_cashflow: {
    situation: string;
    explication: string;
  };
  recommandations: string[];
  conclusion: string;
  ai_generated: boolean;
  model: string;
}

interface AnalysisResponse {
  success: boolean;
  scraped_data: ScrapedData;
  widgets_data: WidgetsData;
  financial_result: FinancialResult;
  ai_analysis: AIAnalysis;
  summary: {
    url: string;
    prix: number;
    surface: number;
    localisation: string;
    score: number;
    verdict: string;
    cashflow_mensuel: number;
    rentabilite_nette: number;
    autofinancement: boolean;
  };
}

// Icons
const Icons = {
  search: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
  link: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>,
  home: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
  coin: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  chart: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
  location: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  check: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>,
  alert: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>,
  info: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  train: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>,
  school: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l9-5-9-5-9 5 9 5z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l9-5-9-5-9 5 9 5zm0 0v6" /></svg>,
};

// Format utilities
const formatEuro = (value: number, decimals: number = 0): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
};

const formatPercent = (value: number): string => {
  return `${value.toFixed(2)}%`;
};

// Get score color
const getScoreColor = (score: number) => {
  if (score >= 80) return { gradient: 'from-emerald-500 to-green-400', bg: 'bg-emerald-500', text: 'text-emerald-400', border: 'border-emerald-500' };
  if (score >= 65) return { gradient: 'from-blue-500 to-cyan-400', bg: 'bg-blue-500', text: 'text-blue-400', border: 'border-blue-500' };
  if (score >= 50) return { gradient: 'from-amber-500 to-yellow-400', bg: 'bg-amber-500', text: 'text-amber-400', border: 'border-amber-500' };
  return { gradient: 'from-rose-500 to-red-400', bg: 'bg-rose-500', text: 'text-rose-400', border: 'border-rose-500' };
};

export default function AnalyzePage() {
  const { user, isAuthenticated, logout } = useAuth();

  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResponse | null>(null);
  const [mounted, setMounted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
    // Focus on input when page loads
    inputRef.current?.focus();
  }, []);

  const analyzeAnnonce = async () => {
    if (!url.trim()) {
      setError('Veuillez entrer une URL d\'annonce');
      return;
    }

    // Validate URL format
    if (!url.includes('seloger.com') && !url.includes('leboncoin.fr') && !url.includes('pap.fr') && !url.includes('bienici.com')) {
      setError('URL non reconnue. Sites supportés : SeLoger, Leboncoin, PAP, Bien\'ici');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

      // Step 1: Scraping
      setLoadingStep('Extraction des données de l\'annonce...');
      await new Promise(r => setTimeout(r, 500)); // Small delay for UX

      // Step 2: Call API
      setLoadingStep('Analyse financière et IA en cours...');

      const response = await fetch(`${apiUrl}/api/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: url.trim() }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail?.message || errorData.detail || 'Erreur lors de l\'analyse');
      }

      const data: AnalysisResponse = await response.json();

      if (!data.success) {
        throw new Error(data.scraped_data?.error || 'Impossible d\'extraire les données de l\'annonce');
      }

      setLoadingStep('Finalisation...');
      await new Promise(r => setTimeout(r, 300));

      setResult(data);

    } catch (err: any) {
      console.error('Erreur analyse:', err);
      setError(err.message || 'Une erreur est survenue lors de l\'analyse');
    } finally {
      setIsLoading(false);
      setLoadingStep('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      analyzeAnnonce();
    }
  };

  const resetAnalysis = () => {
    setResult(null);
    setError(null);
    setUrl('');
    inputRef.current?.focus();
  };

  const scoreColors = result ? getScoreColor(result.ai_analysis?.score || result.financial_result.score_investissement) : null;

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
            <span className="text-[var(--text-secondary)] text-sm">Analyseur d'Annonces</span>
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

      {/* Hero Section with Search */}
      <div className="bg-gradient-to-b from-violet-600/15 via-indigo-600/10 to-transparent" style={{ paddingTop: '120px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '80px 48px', textAlign: 'center' }}>
          <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-sm font-medium mb-8">
            <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
            Fonctionnalité Premium
          </div>
          <div style={{ height: '20px' }}></div>
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Analysez une annonce <br/>
            <span className="bg-gradient-to-r from-violet-400 via-indigo-400 to-cyan-400 bg-clip-text text-transparent">en un clic</span>
          </h1>
          <div style={{ height: '20px' }}></div>
          <p className="text-xl text-[var(--text-secondary)] mb-12" style={{ maxWidth: '600px', margin: '0 auto 48px auto' }}>
            Collez le lien d'une annonce SeLoger, Leboncoin ou PAP et obtenez une analyse financière complète avec un score sur 100
          </p>

          {/* Search Bar */}
          {!result && (
            <div className="relative max-w-2xl mx-auto">
              <div className={`
                relative flex items-center gap-4
                bg-[var(--bg-card)] border-2 rounded-2xl
                transition-all duration-300
                ${error ? 'border-rose-500/50' : 'border-[var(--border-color)] focus-within:border-violet-500/50'}
              `} style={{ padding: '8px 8px 8px 24px' }}>
                <div className="text-[var(--text-muted)]">
                  {Icons.link}
                </div>
                <input
                  ref={inputRef}
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="https://www.seloger.com/annonces/achat/appartement/..."
                  disabled={isLoading}
                  className="flex-1 bg-transparent border-none outline-none text-white placeholder-[var(--text-muted)] text-lg disabled:opacity-50"
                  style={{ padding: '16px 0' }}
                />
                <button
                  onClick={analyzeAnnonce}
                  disabled={isLoading || !url.trim()}
                  className="flex items-center gap-3 px-8 py-4 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:shadow-lg hover:shadow-violet-500/30"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    Icons.search
                  )}
                  <span>{isLoading ? 'Analyse...' : 'Analyser'}</span>
                </button>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mt-4 p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-sm flex items-center gap-3">
                  {Icons.alert}
                  <span>{error}</span>
                </div>
              )}

              {/* Loading State */}
              {isLoading && (
                <div className="mt-8 flex flex-col items-center">
                  <div className="relative w-24 h-24 mb-6">
                    <div className="absolute inset-0 border-4 border-violet-500/30 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
                    <div className="absolute inset-2 border-4 border-indigo-500/30 rounded-full"></div>
                    <div className="absolute inset-2 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }}></div>
                  </div>
                  <p className="text-lg text-[var(--text-secondary)] animate-pulse">{loadingStep}</p>
                  <p className="text-sm text-[var(--text-muted)] mt-2">Cela peut prendre quelques instants...</p>
                </div>
              )}

              {/* Supported Sites */}
              <div className="mt-8 flex items-center justify-center gap-6 text-sm text-[var(--text-muted)]">
                <span>Sites supportés :</span>
                <div className="flex items-center gap-4">
                  <span className="px-3 py-1 rounded-lg bg-[var(--bg-secondary)]">SeLoger</span>
                  <span className="px-3 py-1 rounded-lg bg-[var(--bg-secondary)]">Leboncoin</span>
                  <span className="px-3 py-1 rounded-lg bg-[var(--bg-secondary)]">PAP</span>
                  <span className="px-3 py-1 rounded-lg bg-[var(--bg-secondary)]">Bien'ici</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Results Section */}
      {result && scoreColors && (
        <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 48px 80px 48px' }}>

          {/* Reset Button */}
          <div className="flex justify-center mb-12">
            <button
              onClick={resetAnalysis}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-white hover:border-[var(--border-hover)] transition-all"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Analyser une autre annonce
            </button>
          </div>

          {/* Score Hero Card */}
          <div className={`bg-gradient-to-br from-[var(--bg-card)] to-[var(--bg-secondary)] rounded-3xl border-2 ${scoreColors.border} overflow-hidden mb-12`} style={{ padding: '48px' }}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Left: Score */}
              <div className="text-center lg:text-left">
                <div className="flex items-center gap-2 justify-center lg:justify-start mb-2">
                  <div className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wider">Score d'investissement</div>
                  {result.ai_analysis?.ai_generated && (
                    <span className="px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-400 text-xs font-medium">IA</span>
                  )}
                </div>
                <div className={`text-8xl md:text-9xl font-black bg-gradient-to-r ${scoreColors.gradient} bg-clip-text text-transparent`}>
                  {(result.ai_analysis?.score || result.financial_result.score_investissement).toFixed(0)}
                </div>
                <div className="text-2xl text-[var(--text-muted)] font-light">/100</div>
                <div className={`inline-flex items-center gap-2 px-6 py-3 rounded-full text-xl font-bold mt-6 ${
                  (result.ai_analysis?.score || result.financial_result.score_investissement) >= 80 ? 'bg-emerald-500/15 text-emerald-400' :
                  (result.ai_analysis?.score || result.financial_result.score_investissement) >= 65 ? 'bg-blue-500/15 text-blue-400' :
                  (result.ai_analysis?.score || result.financial_result.score_investissement) >= 50 ? 'bg-amber-500/15 text-amber-400' :
                  'bg-rose-500/15 text-rose-400'
                }`}>
                  {(result.ai_analysis?.score || result.financial_result.score_investissement) >= 80 ? '🏆' :
                   (result.ai_analysis?.score || result.financial_result.score_investissement) >= 65 ? '✅' :
                   (result.ai_analysis?.score || result.financial_result.score_investissement) >= 50 ? '⚠️' : '❌'}
                  {result.ai_analysis?.verdict || result.financial_result.verdict}
                </div>
              </div>

              {/* Right: Key Metrics */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[var(--bg-primary)]/50 rounded-2xl p-5 text-center">
                  <div className="text-sm text-[var(--text-muted)] mb-1">Prix</div>
                  <div className="text-2xl font-bold text-white">{formatEuro(result.financial_result.prix_achat)}</div>
                </div>
                <div className="bg-[var(--bg-primary)]/50 rounded-2xl p-5 text-center">
                  <div className="text-sm text-[var(--text-muted)] mb-1">Surface</div>
                  <div className="text-2xl font-bold text-white">{result.financial_result.surface} m²</div>
                </div>
                <div className="bg-[var(--bg-primary)]/50 rounded-2xl p-5 text-center">
                  <div className="text-sm text-[var(--text-muted)] mb-1">Rentabilité nette</div>
                  <div className={`text-2xl font-bold ${result.financial_result.rentabilite_nette >= 4.5 ? 'text-emerald-400' : result.financial_result.rentabilite_nette >= 3 ? 'text-amber-400' : 'text-rose-400'}`}>
                    {formatPercent(result.financial_result.rentabilite_nette)}
                  </div>
                </div>
                <div className="bg-[var(--bg-primary)]/50 rounded-2xl p-5 text-center">
                  <div className="text-sm text-[var(--text-muted)] mb-1">Cashflow net</div>
                  <div className={`text-2xl font-bold ${result.financial_result.cashflow_mensuel_net >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {result.financial_result.cashflow_mensuel_net >= 0 ? '+' : ''}{formatEuro(result.financial_result.cashflow_mensuel_net)}/mois
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

            {/* Left Column */}
            <div className="space-y-8">

              {/* Property Details */}
              <div className="bg-[var(--bg-card)] rounded-3xl border border-[var(--border-color)]" style={{ padding: '32px' }}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-400">
                    {Icons.home}
                  </div>
                  <h2 className="text-xl font-bold text-white">Détails du Bien</h2>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[var(--bg-secondary)] rounded-xl p-4">
                    <div className="text-sm text-[var(--text-muted)] mb-1">Prix d'achat</div>
                    <div className="text-xl font-bold text-white">{formatEuro(result.financial_result.prix_achat)}</div>
                  </div>
                  <div className="bg-[var(--bg-secondary)] rounded-xl p-4">
                    <div className="text-sm text-[var(--text-muted)] mb-1">Surface</div>
                    <div className="text-xl font-bold text-white">{result.financial_result.surface} m²</div>
                  </div>
                  <div className="bg-[var(--bg-secondary)] rounded-xl p-4">
                    <div className="text-sm text-[var(--text-muted)] mb-1">Prix au m²</div>
                    <div className="text-xl font-bold text-white">{formatEuro(result.financial_result.prix_m2)}</div>
                    {result.widgets_data?.dvf_stats?.comparaison && (
                      <div className={`text-xs mt-1 ${result.widgets_data.dvf_stats.comparaison.ecart_vs_median_pct > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {result.widgets_data.dvf_stats.comparaison.ecart_vs_median_pct > 0 ? '+' : ''}
                        {result.widgets_data.dvf_stats.comparaison.ecart_vs_median_pct.toFixed(1)}% vs médiane
                      </div>
                    )}
                  </div>
                  <div className="bg-[var(--bg-secondary)] rounded-xl p-4">
                    <div className="text-sm text-[var(--text-muted)] mb-1">Localisation</div>
                    <div className="text-lg font-bold text-white">{result.scraped_data.ville || 'N/A'}</div>
                    <div className="text-sm text-[var(--text-muted)]">{result.financial_result.code_postal} ({result.financial_result.departement})</div>
                  </div>
                  <div className="bg-[var(--bg-secondary)] rounded-xl p-4">
                    <div className="text-sm text-[var(--text-muted)] mb-1">Pièces</div>
                    <div className="text-xl font-bold text-white">{result.scraped_data.nb_pieces || 'N/A'}</div>
                  </div>
                  <div className="bg-[var(--bg-secondary)] rounded-xl p-4">
                    <div className="text-sm text-[var(--text-muted)] mb-1">Coût total projet</div>
                    <div className="text-xl font-bold text-white">{formatEuro(result.financial_result.cout_total_projet)}</div>
                    <div className="text-xs text-[var(--text-muted)]">Avec frais notaire ({formatEuro(result.financial_result.frais_notaire)})</div>
                  </div>
                </div>

                <a
                  href={result.scraped_data.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-violet-500/10 border border-violet-500/30 text-violet-400 hover:bg-violet-500/20 transition-colors"
                >
                  {Icons.link}
                  <span>Voir l'annonce originale</span>
                </a>
              </div>

              {/* Financial Analysis */}
              <div className="bg-[var(--bg-card)] rounded-3xl border border-[var(--border-color)]" style={{ padding: '32px' }}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                    {Icons.coin}
                  </div>
                  <h2 className="text-xl font-bold text-white">Analyse Financière</h2>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center py-3 border-b border-[var(--border-color)]">
                    <span className="text-[var(--text-secondary)]">Loyer mensuel estimé</span>
                    <span className="text-lg font-bold text-white">{formatEuro(result.financial_result.loyer_mensuel_brut)}/mois</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-[var(--border-color)]">
                    <span className="text-[var(--text-secondary)]">Mensualité crédit</span>
                    <span className="text-lg font-bold text-white">{formatEuro(result.financial_result.mensualite_totale)}/mois</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-[var(--border-color)]">
                    <span className="text-[var(--text-secondary)]">Charges mensuelles</span>
                    <span className="text-lg font-bold text-white">{formatEuro(result.financial_result.charges_totales_mensuel)}/mois</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-[var(--border-color)]">
                    <span className="text-[var(--text-secondary)]">Rentabilité brute</span>
                    <span className={`text-lg font-bold ${result.financial_result.rentabilite_brute >= 6 ? 'text-emerald-400' : 'text-white'}`}>
                      {formatPercent(result.financial_result.rentabilite_brute)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-[var(--border-color)]">
                    <span className="text-[var(--text-secondary)]">Rentabilité nette</span>
                    <span className={`text-lg font-bold ${result.financial_result.rentabilite_nette >= 4.5 ? 'text-emerald-400' : result.financial_result.rentabilite_nette >= 3 ? 'text-amber-400' : 'text-rose-400'}`}>
                      {formatPercent(result.financial_result.rentabilite_nette)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-3">
                    <span className="text-[var(--text-secondary)]">Cashflow net mensuel</span>
                    <span className={`text-xl font-bold ${result.financial_result.cashflow_mensuel_net >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {result.financial_result.cashflow_mensuel_net >= 0 ? '+' : ''}{formatEuro(result.financial_result.cashflow_mensuel_net)}
                    </span>
                  </div>
                </div>

                {/* Autofinancement Badge */}
                <div className={`mt-6 p-4 rounded-xl ${result.financial_result.autofinancement ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-amber-500/10 border border-amber-500/30'}`}>
                  <div className="flex items-center gap-3">
                    {result.financial_result.autofinancement ? Icons.check : Icons.alert}
                    <div>
                      <div className={`font-semibold ${result.financial_result.autofinancement ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {result.financial_result.autofinancement ? 'Autofinancement' : 'Effort d\'épargne requis'}
                      </div>
                      <div className="text-sm text-[var(--text-muted)]">
                        {result.financial_result.autofinancement
                          ? 'Le bien s\'autofinance totalement'
                          : `${formatEuro(result.financial_result.effort_epargne_mensuel)}/mois à prévoir`}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-8">

              {/* Market Context */}
              <div className="bg-[var(--bg-card)] rounded-3xl border border-[var(--border-color)]" style={{ padding: '32px' }}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                    {Icons.chart}
                  </div>
                  <h2 className="text-xl font-bold text-white">Contexte du Marché</h2>
                </div>

                <div className="space-y-4">
                  {result.widgets_data?.dvf_stats && (
                    <div className="bg-[var(--bg-secondary)] rounded-xl p-4">
                      <div className="text-sm text-[var(--text-muted)] mb-2">Prix du marché (DVF)</div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-xs text-[var(--text-muted)]">Prix médian/m²</div>
                          <div className="text-lg font-bold text-white">{formatEuro(result.widgets_data.dvf_stats.prix_m2_median)}</div>
                        </div>
                        <div>
                          <div className="text-xs text-[var(--text-muted)]">Nb ventes 2024</div>
                          <div className="text-lg font-bold text-white">{result.widgets_data.dvf_stats.nb_ventes.toLocaleString()}</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {result.widgets_data?.loyers_stats && (
                    <div className="bg-[var(--bg-secondary)] rounded-xl p-4">
                      <div className="text-sm text-[var(--text-muted)] mb-2">Loyers du marché</div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-xs text-[var(--text-muted)]">Loyer médian/m²</div>
                          <div className="text-lg font-bold text-white">{result.widgets_data.loyers_stats.loyer_m2_median.toFixed(2)} €</div>
                        </div>
                        <div>
                          <div className="text-xs text-[var(--text-muted)]">Rendement estimé</div>
                          <div className={`text-lg font-bold ${result.widgets_data.loyers_stats.rendement_brut_estime >= 6 ? 'text-emerald-400' : 'text-white'}`}>
                            {formatPercent(result.widgets_data.loyers_stats.rendement_brut_estime)}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {result.widgets_data?.insee_stats && (
                    <div className="bg-[var(--bg-secondary)] rounded-xl p-4">
                      <div className="text-sm text-[var(--text-muted)] mb-2">Tension locative (INSEE)</div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-xs text-[var(--text-muted)]">Taux de vacance</div>
                          <div className={`text-lg font-bold ${result.widgets_data.insee_stats.taux_vacance < 6 ? 'text-emerald-400' : result.widgets_data.insee_stats.taux_vacance < 8 ? 'text-amber-400' : 'text-rose-400'}`}>
                            {result.widgets_data.insee_stats.taux_vacance?.toFixed(1)}%
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-[var(--text-muted)]">Part de locataires</div>
                          <div className="text-lg font-bold text-white">{result.widgets_data.insee_stats.part_locataires?.toFixed(1)}%</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {result.widgets_data?.transport_stats && result.widgets_data.transport_stats.nb_gares > 0 && (
                    <div className="bg-[var(--bg-secondary)] rounded-xl p-4">
                      <div className="flex items-center gap-2 text-sm text-[var(--text-muted)] mb-2">
                        {Icons.train}
                        <span>Transport</span>
                      </div>
                      <div className="text-lg font-bold text-white mb-1">{result.widgets_data.transport_stats.nb_gares} gare(s) à proximité</div>
                      {result.widgets_data.transport_stats.noms_gares.length > 0 && (
                        <div className="text-sm text-[var(--text-muted)]">
                          {result.widgets_data.transport_stats.noms_gares.slice(0, 3).join(', ')}
                        </div>
                      )}
                    </div>
                  )}

                  {result.widgets_data?.student_stats && result.widgets_data.student_stats.nb_etablissements > 0 && (
                    <div className="bg-[var(--bg-secondary)] rounded-xl p-4">
                      <div className="flex items-center gap-2 text-sm text-[var(--text-muted)] mb-2">
                        {Icons.school}
                        <span>Enseignement supérieur</span>
                      </div>
                      <div className="text-lg font-bold text-white">{result.widgets_data.student_stats.nb_etablissements} établissement(s)</div>
                    </div>
                  )}
                </div>
              </div>

              {/* AI Analysis - Points Forts & Vigilance */}
              {result.ai_analysis && (
                <div className="bg-[var(--bg-card)] rounded-3xl border border-[var(--border-color)]" style={{ padding: '32px' }}>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-400">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <h2 className="text-xl font-bold text-white">Analyse IA</h2>
                  </div>

                  {/* Résumé */}
                  {result.ai_analysis.resume && (
                    <div className="mb-6 p-4 bg-[var(--bg-secondary)] rounded-xl">
                      <p className="text-[var(--text-secondary)] leading-relaxed">{result.ai_analysis.resume}</p>
                    </div>
                  )}

                  {/* Points Forts */}
                  {result.ai_analysis.points_forts && result.ai_analysis.points_forts.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-sm font-semibold text-emerald-400 uppercase tracking-wider mb-3">Points Forts</h3>
                      <div className="space-y-2">
                        {result.ai_analysis.points_forts.map((point, index) => (
                          <div key={index} className="flex items-start gap-3 p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                            <span className="text-emerald-400">✓</span>
                            <p className="text-sm text-emerald-300">{point}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Points de Vigilance */}
                  {result.ai_analysis.points_vigilance && result.ai_analysis.points_vigilance.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-sm font-semibold text-amber-400 uppercase tracking-wider mb-3">Points de Vigilance</h3>
                      <div className="space-y-2">
                        {result.ai_analysis.points_vigilance.map((point, index) => (
                          <div key={index} className="flex items-start gap-3 p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
                            <span className="text-amber-400">!</span>
                            <p className="text-sm text-amber-300">{point}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Analyses Détaillées */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    {result.ai_analysis.analyse_prix && (
                      <div className="bg-[var(--bg-secondary)] rounded-xl p-4">
                        <div className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-1">Prix</div>
                        <div className={`text-lg font-bold mb-2 ${
                          result.ai_analysis.analyse_prix.evaluation === 'Sous-évalué' ? 'text-emerald-400' :
                          result.ai_analysis.analyse_prix.evaluation === 'Prix correct' ? 'text-blue-400' :
                          'text-amber-400'
                        }`}>{result.ai_analysis.analyse_prix.evaluation}</div>
                        <p className="text-xs text-[var(--text-muted)] line-clamp-3">{result.ai_analysis.analyse_prix.explication}</p>
                      </div>
                    )}
                    {result.ai_analysis.analyse_rentabilite && (
                      <div className="bg-[var(--bg-secondary)] rounded-xl p-4">
                        <div className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-1">Rentabilité</div>
                        <div className={`text-lg font-bold mb-2 ${
                          result.ai_analysis.analyse_rentabilite.niveau === 'Excellente' ? 'text-emerald-400' :
                          result.ai_analysis.analyse_rentabilite.niveau === 'Bonne' ? 'text-blue-400' :
                          result.ai_analysis.analyse_rentabilite.niveau === 'Moyenne' ? 'text-amber-400' :
                          'text-rose-400'
                        }`}>{result.ai_analysis.analyse_rentabilite.niveau}</div>
                        <p className="text-xs text-[var(--text-muted)] line-clamp-3">{result.ai_analysis.analyse_rentabilite.explication}</p>
                      </div>
                    )}
                    {result.ai_analysis.analyse_localisation && (
                      <div className="bg-[var(--bg-secondary)] rounded-xl p-4">
                        <div className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-1">Localisation</div>
                        <div className={`text-lg font-bold mb-2 ${
                          result.ai_analysis.analyse_localisation.potentiel === 'Fort' ? 'text-emerald-400' :
                          result.ai_analysis.analyse_localisation.potentiel === 'Moyen' ? 'text-amber-400' :
                          'text-rose-400'
                        }`}>Potentiel {result.ai_analysis.analyse_localisation.potentiel}</div>
                        <p className="text-xs text-[var(--text-muted)] line-clamp-3">{result.ai_analysis.analyse_localisation.explication}</p>
                      </div>
                    )}
                    {result.ai_analysis.analyse_cashflow && (
                      <div className="bg-[var(--bg-secondary)] rounded-xl p-4">
                        <div className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-1">Cashflow</div>
                        <div className={`text-lg font-bold mb-2 ${
                          result.ai_analysis.analyse_cashflow.situation === 'Positif' ? 'text-emerald-400' :
                          result.ai_analysis.analyse_cashflow.situation === 'Équilibre' ? 'text-blue-400' :
                          'text-amber-400'
                        }`}>{result.ai_analysis.analyse_cashflow.situation}</div>
                        <p className="text-xs text-[var(--text-muted)] line-clamp-3">{result.ai_analysis.analyse_cashflow.explication}</p>
                      </div>
                    )}
                  </div>

                  {/* Recommandations */}
                  {result.ai_analysis.recommandations && result.ai_analysis.recommandations.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-sm font-semibold text-cyan-400 uppercase tracking-wider mb-3">Recommandations</h3>
                      <div className="space-y-2">
                        {result.ai_analysis.recommandations.map((reco, index) => (
                          <div key={index} className="flex items-start gap-3 p-3 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
                            <span className="text-cyan-400 font-bold">{index + 1}.</span>
                            <p className="text-sm text-cyan-300">{reco}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Conclusion */}
                  {result.ai_analysis.conclusion && (
                    <div className="p-4 bg-gradient-to-r from-violet-500/10 to-indigo-500/10 rounded-xl border border-violet-500/20">
                      <h3 className="text-sm font-semibold text-violet-400 uppercase tracking-wider mb-2">Conclusion</h3>
                      <p className="text-[var(--text-secondary)] leading-relaxed">{result.ai_analysis.conclusion}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Fallback: Conseils si pas d'analyse IA */}
              {!result.ai_analysis && result.financial_result.conseils && (
                <div className="bg-[var(--bg-card)] rounded-3xl border border-[var(--border-color)]" style={{ padding: '32px' }}>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400">
                      {Icons.info}
                    </div>
                    <h2 className="text-xl font-bold text-white">Conseils Personnalisés</h2>
                  </div>

                  <div className="space-y-4">
                    {result.financial_result.conseils.map((conseil, index) => (
                      <div
                        key={index}
                        className={`p-4 rounded-xl ${
                          conseil.startsWith('✅') ? 'bg-emerald-500/10 border border-emerald-500/20' :
                          conseil.startsWith('⚠️') ? 'bg-amber-500/10 border border-amber-500/20' :
                          conseil.startsWith('❌') ? 'bg-rose-500/10 border border-rose-500/20' :
                          'bg-blue-500/10 border border-blue-500/20'
                        }`}
                      >
                        <p className={`text-sm leading-relaxed ${
                          conseil.startsWith('✅') ? 'text-emerald-300' :
                          conseil.startsWith('⚠️') ? 'text-amber-300' :
                          conseil.startsWith('❌') ? 'text-rose-300' :
                          'text-blue-300'
                        }`}>
                          {conseil}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      )}

      {/* Empty state - when no search yet */}
      {!result && !isLoading && mounted && (
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 48px 80px 48px' }}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] p-6 text-center">
              <div className="w-14 h-14 rounded-2xl bg-violet-500/10 flex items-center justify-center text-violet-400 mx-auto mb-4">
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">1. Copiez le lien</h3>
              <p className="text-sm text-[var(--text-muted)]">Trouvez une annonce sur SeLoger, Leboncoin ou PAP et copiez son URL</p>
            </div>
            <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] p-6 text-center">
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 mx-auto mb-4">
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">2. Lancez l'analyse</h3>
              <p className="text-sm text-[var(--text-muted)]">Collez le lien ci-dessus et cliquez sur "Analyser" pour lancer le scraping</p>
            </div>
            <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] p-6 text-center">
              <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 mx-auto mb-4">
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">3. Obtenez le score</h3>
              <p className="text-sm text-[var(--text-muted)]">Recevez un score sur 100 avec analyse détaillée et conseils personnalisés</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
