'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/lib/auth';
import Sidebar from '@/components/Sidebar';

/* ─── Layout constants ─── */
const CONTAINER = {
  width: '100%',
  maxWidth: 1100,
  marginLeft: 'auto',
  marginRight: 'auto',
  paddingLeft: 32,
  paddingRight: 32,
  boxSizing: 'border-box' as const,
};
const CARD = {
  borderRadius: 20,
  border: '1px solid rgba(255,255,255,0.08)',
  background: 'rgba(255,255,255,0.03)',
} as const;
const CARD_P = { padding: 32 } as const;

/* ─── Tooltip ─── */
function InfoTooltip({ text }: { text: string }) {
  const [show, setShow] = useState(false);
  return (
    <span className="relative inline-flex items-center ml-1.5 align-middle">
      <button
        type="button"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onFocus={() => setShow(true)}
        onBlur={() => setShow(false)}
        className="w-4 h-4 rounded-full border border-[var(--border-color)] text-[var(--text-muted)] text-[10px] font-bold flex items-center justify-center hover:border-violet-500/50 hover:text-violet-400 transition-colors"
        style={{ background: 'rgba(255,255,255,0.05)' }}
        aria-label="Définition"
      >i</button>
      {show && (
        <span className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 w-56 px-3 py-2.5 text-xs text-[var(--text-secondary)] shadow-xl leading-relaxed pointer-events-none" style={{ borderRadius: 12, background: 'rgba(24,24,27,0.98)', border: '1px solid rgba(255,255,255,0.1)' }}>
          {text}
          <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[rgba(255,255,255,0.1)]" />
        </span>
      )}
    </span>
  );
}

/* ─── Types ─── */
interface ScrapedData { url: string; prix: number|null; surface: number|null; code_postal: string|null; ville: string|null; nb_pieces: number|null; titre: string|null; success: boolean; error: string|null; }
interface FinancialResult { prix_achat: number; surface: number; prix_m2: number; code_postal: string; departement: string; frais_notaire: number; cout_total_projet: number; apport: number; montant_emprunt: number; mensualite_totale: number; loyer_mensuel_brut: number; loyer_annuel_brut: number; charges_totales_mensuel: number; charges_totales_annuel: number; rentabilite_brute: number; rentabilite_nette: number; rentabilite_nette_nette: number; cashflow_mensuel_brut: number; cashflow_mensuel_net: number; cashflow_annuel_net: number; autofinancement: boolean; effort_epargne_mensuel: number; score_investissement: number; verdict: string; conseils: string[]; }
interface WidgetsData { dvf_stats?: { prix_m2_median: number; prix_m2_mean: number; nb_ventes: number; comparaison?: { prix_m2_annonce: number; ecart_vs_median_pct: number; }; }; loyers_stats?: { loyer_m2_median: number; loyer_mensuel_estime: number; rendement_brut_estime: number; }; insee_stats?: { tension_locative: string; taux_vacance: number; part_locataires: number; }; transport_stats?: { nb_gares: number; noms_gares: string[]; }; student_stats?: { nb_etablissements: number; top_etablissements: string[]; }; cross_data?: CrossData; }
interface CrossData { rendement_dept?: { rendement_brut_pct: number; rang_national: number; total_departements: number; }; tendance_prix?: { evolution_pct: number; tendance: string; prix_m2_debut: number; prix_m2_fin: number; annee_debut: number; annee_fin: number; }; score_faisabilite?: number; distance_domicile_km?: number; distances_relais?: { nom: string; distance_km: number }[]; }
interface ScoreDetail { label: string; score: number; max: number; valeur: string; explication: string; }
interface AIAnalysis { score: number; verdict: string; resume: string; points_forts: string[]; points_vigilance: string[]; analyse_prix: { evaluation: string; explication: string; }; analyse_rentabilite: { niveau: string; explication: string; }; analyse_tension: { niveau: string; explication: string; }; analyse_faisabilite: { niveau: string; explication: string; }; analyse_localisation: { potentiel: string; explication: string; }; analyse_cashflow: { situation: string; explication: string; }; analyse_valorisation?: { tendance: string; explication: string; }; recommandations: string[]; conclusion: string; ai_generated: boolean; model: string; }
interface AnalysisResponse { success: boolean; scraped_data: ScrapedData; widgets_data: WidgetsData; financial_result: FinancialResult; ai_analysis: AIAnalysis; score_v2: number; verdict_v2: string; score_details: Record<string, ScoreDetail>; cross_data: CrossData; user_profile?: { authenticated: boolean; prenom?: string; statut?: string; }; summary: { url: string; prix: number; surface: number; localisation: string; score: number; verdict: string; cashflow_mensuel: number; rentabilite_nette: number; autofinancement: boolean; }; }

/* ─── Helpers ─── */
const fmtEUR = (v: number, d = 0) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: d, maximumFractionDigits: d }).format(v);
const fmtPct = (v: number) => `${v.toFixed(2)} %`;

function scoreTheme(s: number) {
  if (s >= 80) return { color: '#34d399', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.3)', label: 'Excellent' };
  if (s >= 65) return { color: '#60a5fa', bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.3)', label: 'Bon' };
  if (s >= 50) return { color: '#fbbf24', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)', label: 'Moyen' };
  return { color: '#f87171', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.3)', label: 'Faible' };
}

/* ─── SVG Gauge ─── */
function ScoreGauge({ score: rawScore, size = 180 }: { score: number; size?: number }) {
  const score = rawScore ?? 0;
  const theme = scoreTheme(score);
  const r = (size - 20) / 2;
  const circ = 2 * Math.PI * r;
  const arc = circ * 0.75; // 270deg arc
  const offset = arc - (arc * score / 100);
  const rot = 135; // start at bottom-left
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="mx-auto">
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={10}
        strokeDasharray={`${arc} ${circ}`} strokeLinecap="round"
        transform={`rotate(${rot} ${size/2} ${size/2})`} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={theme.color} strokeWidth={10}
        strokeDasharray={`${arc} ${circ}`} strokeDashoffset={offset} strokeLinecap="round"
        transform={`rotate(${rot} ${size/2} ${size/2})`}
        style={{ transition: 'stroke-dashoffset 1s ease-out', filter: `drop-shadow(0 0 8px ${theme.color}40)` }} />
      <text x={size/2} y={size/2 - 8} textAnchor="middle" fill={theme.color} fontSize={size * 0.26} fontWeight={900}>{score.toFixed(0)}</text>
      <text x={size/2} y={size/2 + 16} textAnchor="middle" fill="#52525b" fontSize={14} fontWeight={300}>/100</text>
    </svg>
  );
}

/* ─── Stat row ─── */
function StatRow({ label, value, sub, tooltip, color }: { label: string; value: string; sub?: string; tooltip?: string; color?: string }) {
  return (
    <div className="flex items-center justify-between" style={{ padding: '13px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
      <span className="text-sm text-[var(--text-secondary)] flex items-center">
        {label}{tooltip && <InfoTooltip text={tooltip} />}
      </span>
      <div className="text-right">
        <span className="text-sm font-bold" style={{ color: color || '#ffffff' }}>{value}</span>
        {sub && <div className="text-xs text-[var(--text-muted)]">{sub}</div>}
      </div>
    </div>
  );
}

/* ─── Small metric card ─── */
function MetricCard({ label, value, color, sub, tooltip }: { label: string; value: string; color?: string; sub?: string; tooltip?: string }) {
  return (
    <div style={{ padding: 20, borderRadius: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
      <div className="text-xs text-[var(--text-muted)] flex items-center" style={{ marginBottom: 8 }}>
        {label}{tooltip && <InfoTooltip text={tooltip} />}
      </div>
      <div className="text-xl font-bold" style={{ color: color || '#ffffff' }}>{value}</div>
      {sub && <div className="text-xs text-[var(--text-muted)]" style={{ marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

/* ─── Section header ─── */
function SectionHeader({ icon, title, badge }: { icon: React.ReactNode; title: string; badge?: string }) {
  return (
    <div className="flex items-center gap-3" style={{ marginBottom: 24 }}>
      <div className="flex-shrink-0 flex items-center justify-center" style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.25)', color: '#a78bfa' }}>
        {icon}
      </div>
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        {badge && (
          <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.35)', color: '#c4b5fd' }}>{badge}</span>
        )}
      </div>
    </div>
  );
}

/* ─── Flip Card for analysis ─── */
interface FlipCardProps {
  icon: React.ReactNode;
  title: string;
  metric: string;
  metricColor: string;
  badge?: string;
  badgeColor?: string;
  backText: string;
  tooltip?: string;
  sub?: string;
  scoreLabel?: string;
  scoreValue?: number;
  scoreMax?: number;
}

function AnalysisFlipCard({ icon, title, metric, metricColor, badge, badgeColor, backText, tooltip, sub, scoreLabel, scoreValue, scoreMax }: FlipCardProps) {
  return (
    <div className="widget-flip" style={{ height: 220 }}>
      <div className="widget-flip-inner">
        {/* FRONT */}
        <div className="widget-flip-front" style={{ padding: '24px 20px', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div className="w-full">
            <div className="flex items-center justify-between w-full" style={{ marginBottom: 14 }}>
              <div className="flex items-center gap-2.5">
                <div className="flex items-center justify-center" style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.25)', color: '#a78bfa' }}>
                  {icon}
                </div>
                <span className="text-sm font-semibold text-white flex items-center">
                  {title}
                  {tooltip && <InfoTooltip text={tooltip} />}
                </span>
              </div>
              {badge && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${badgeColor || metricColor}18`, border: `1px solid ${badgeColor || metricColor}50`, color: badgeColor || metricColor }}>
                  {badge}
                </span>
              )}
            </div>
            <div className="text-2xl font-black" style={{ color: metricColor, marginBottom: 4 }}>{metric}</div>
            {sub && <div className="text-xs text-[var(--text-muted)]">{sub}</div>}
          </div>
          {scoreValue !== undefined && scoreMax !== undefined && (
            <div className="w-full" style={{ marginTop: 8 }}>
              <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)]" style={{ marginBottom: 4 }}>
                <span>{scoreLabel || 'Score'}</span>
                <span>{scoreValue}/{scoreMax} pts</span>
              </div>
              <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.08)' }}>
                <div style={{ height: '100%', borderRadius: 2, width: `${(scoreValue / scoreMax) * 100}%`, background: metricColor, transition: 'width 0.6s ease-out' }} />
              </div>
            </div>
          )}
        </div>
        {/* BACK */}
        <div className="widget-flip-back" style={{ padding: '24px 20px', justifyContent: 'center', textAlign: 'left', gap: 0 }}>
          <div className="flex items-center gap-2" style={{ marginBottom: 12 }}>
            <div className="flex items-center justify-center" style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.25)', color: '#a78bfa' }}>
              {icon}
            </div>
            <span className="text-sm font-semibold text-white">{title}</span>
          </div>
          <p className="text-sm text-[var(--text-secondary)]" style={{ lineHeight: 1.7 }}>{backText}</p>
        </div>
      </div>
    </div>
  );
}

function BrandMark({ height = 26 }: { height?: number }) {
  const w = Math.round((height * 362) / 394);
  return <Image src="/logo-mark.png" alt="BrickByBrick" width={w} height={height} unoptimized priority style={{ objectFit: 'contain' }} />;
}
function Logo() {
  return (
    <span className="text-xl font-black tracking-tight leading-none">
      <span className="text-white">Brick</span><span className="text-violet-400">By</span><span className="text-white">Brick</span>
    </span>
  );
}

/* ─── SVG Icons ─── */
const ICONS = {
  prix: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" /></svg>,
  rendement: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" /></svg>,
  tension: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1A3.75 3.75 0 0012 18z" /></svg>,
  faisabilite: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>,
  localisation: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>,
  cashflow: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
};

/* ══════════════════════════════════════════════════════════════
   PAGE
══════════════════════════════════════════════════════════════ */
export default function AnalyzePage() {
  const { user, isAuthenticated, logout } = useAuth();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResponse | null>(null);
  const [mounted, setMounted] = useState(false);
  const [history, setHistory] = useState<{ id: number; name: string; url: string; score_v2: number; verdict_v2: string; created_at: string; scraped_data?: { ville?: string; prix?: number; surface?: number } }[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  const fetchHistory = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
      if (!token) return;
      const res = await fetch(`${apiUrl}/api/analyses/history`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setHistory(await res.json());
    } catch { /* ignore */ }
  };

  const loadSavedAnalysis = async (id: number) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
      if (!token) return;
      setIsLoading(true); setLoadingStep('Chargement de l\'analyse...');
      const res = await fetch(`${apiUrl}/api/analyses/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setResult(data);
      }
    } catch { /* ignore */ }
    finally { setIsLoading(false); setLoadingStep(''); }
  };

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sidebarOpen');
      setIsSidebarOpen(saved !== null ? saved === 'true' : window.innerWidth >= 1024);
    }
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', fn);
    inputRef.current?.focus();
    fetchHistory();
    return () => window.removeEventListener('scroll', fn);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') localStorage.setItem('sidebarOpen', isSidebarOpen.toString());
  }, [isSidebarOpen]);

  const analyzeAnnonce = async () => {
    if (!url.trim()) { setError("Veuillez entrer une URL d'annonce"); return; }
    if (!url.includes('seloger.com') && !url.includes('leboncoin.fr') && !url.includes('pap.fr') && !url.includes('bienici.com')) {
      setError("URL non reconnue. Sites supportés : SeLoger, Leboncoin, PAP, Bien'ici"); return;
    }
    setIsLoading(true); setError(null); setResult(null);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

      // Build headers with optional JWT auth
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('access_token');
        if (token) headers['Authorization'] = `Bearer ${token}`;
      }

      setLoadingStep("Extraction des données de l'annonce...");
      await new Promise(r => setTimeout(r, 500));
      setLoadingStep('Analyse financière et croisement des données...');
      const response = await fetch(`${apiUrl}/api/analyze`, { method: 'POST', headers, body: JSON.stringify({ url: url.trim() }) });
      if (!response.ok) { const e = await response.json(); throw new Error(e.detail?.message || e.detail || "Erreur lors de l'analyse"); }
      const data: AnalysisResponse = await response.json();
      if (!data.success) throw new Error(data.scraped_data?.error || "Impossible d'extraire les données de l'annonce");
      setLoadingStep('Finalisation...');
      await new Promise(r => setTimeout(r, 300));
      setResult(data);
      fetchHistory();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue lors de l'analyse");
    } finally { setIsLoading(false); setLoadingStep(''); }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === 'Enter' && !isLoading) analyzeAnnonce(); };
  const resetAnalysis = () => { setResult(null); setError(null); setUrl(''); setTimeout(() => inputRef.current?.focus(), 50); };

  const exportPDF = async () => {
    if (!reportRef.current || !result) return;
    try {
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');
      const el = reportRef.current;
      const canvas = await html2canvas(el, { backgroundColor: '#09090b', scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = (canvas.height * pdfW) / canvas.width;
      let y = 0;
      const pageH = pdf.internal.pageSize.getHeight();
      while (y < pdfH) {
        if (y > 0) pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, -y, pdfW, pdfH);
        y += pageH;
      }
      const ville = result.scraped_data.ville || 'analyse';
      pdf.save(`BrickByBrick_Analyse_${ville}_${new Date().toISOString().slice(0,10)}.pdf`);
    } catch (err) {
      console.error('PDF export error:', err);
    }
  };

  const score = result ? (result.score_v2 ?? result.ai_analysis?.score ?? result.financial_result?.score_investissement ?? 0) : 0;
  const theme = scoreTheme(score);
  const initials = user ? `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}` : '';

  /* ── Build flip cards data from result ── */
  const crossData = result?.cross_data || {};
  const scoreDetails = result?.score_details || {};
  const flipCards = result ? [
    {
      key: 'prix',
      icon: ICONS.prix,
      title: 'Prix vs Marché',
      metric: result.widgets_data?.dvf_stats?.comparaison
        ? `${result.widgets_data.dvf_stats.comparaison.ecart_vs_median_pct > 0 ? '+' : ''}${result.widgets_data.dvf_stats.comparaison.ecart_vs_median_pct.toFixed(1)}%`
        : fmtEUR(result.financial_result.prix_m2) + '/m²',
      metricColor: result.widgets_data?.dvf_stats?.comparaison
        ? (result.widgets_data.dvf_stats.comparaison.ecart_vs_median_pct <= 0 ? '#34d399' : result.widgets_data.dvf_stats.comparaison.ecart_vs_median_pct <= 10 ? '#fbbf24' : '#f87171')
        : '#ffffff',
      badge: result.ai_analysis?.analyse_prix?.evaluation,
      backText: result.ai_analysis?.analyse_prix?.explication || 'Données de comparaison non disponibles.',
      tooltip: "Écart entre le prix de l'annonce et le prix médian dans le département (données DVF).",
      sub: result.widgets_data?.dvf_stats ? `Médiane : ${fmtEUR(result.widgets_data.dvf_stats.prix_m2_median)}/m²` : undefined,
      detail: scoreDetails?.prix_marche,
    },
    {
      key: 'rentabilite',
      icon: ICONS.rendement,
      title: 'Rentabilité',
      metric: fmtPct(result.financial_result.rentabilite_nette),
      metricColor: result.financial_result.rentabilite_nette >= 4.5 ? '#34d399' : result.financial_result.rentabilite_nette >= 3 ? '#fbbf24' : '#f87171',
      badge: result.ai_analysis?.analyse_rentabilite?.niveau,
      backText: result.ai_analysis?.analyse_rentabilite?.explication || `Rentabilité nette de ${result.financial_result.rentabilite_nette.toFixed(2)}%.`,
      tooltip: "Ce qui reste après toutes les charges : copropriété, taxe foncière, assurance, gestion. Plus c'est haut, mieux c'est.",
      sub: `Brute : ${fmtPct(result.financial_result.rentabilite_brute)}`,
      detail: scoreDetails?.rentabilite,
    },
    {
      key: 'tension',
      icon: ICONS.tension,
      title: 'Tension Locative',
      metric: result.widgets_data?.insee_stats?.taux_vacance != null
        ? `${result.widgets_data.insee_stats.taux_vacance.toFixed(1)}%`
        : 'N/A',
      metricColor: result.widgets_data?.insee_stats?.taux_vacance != null
        ? (result.widgets_data.insee_stats.taux_vacance < 6 ? '#34d399' : result.widgets_data.insee_stats.taux_vacance < 8 ? '#fbbf24' : '#f87171')
        : '#71717a',
      badge: result.ai_analysis?.analyse_tension?.niveau,
      backText: result.ai_analysis?.analyse_tension?.explication || 'Données de tension non disponibles.',
      tooltip: "Le taux de vacance, c'est le pourcentage de logements vides. Moins de 6% = zone très demandée.",
      sub: 'Taux de vacance',
      detail: scoreDetails?.tension,
    },
    {
      key: 'faisabilite',
      icon: ICONS.faisabilite,
      title: 'Faisabilité',
      metric: crossData?.score_faisabilite != null
        ? `${result.cross_data.score_faisabilite.toFixed(0)}/100`
        : 'N/A',
      metricColor: crossData?.score_faisabilite != null
        ? (result.cross_data.score_faisabilite >= 75 ? '#34d399' : result.cross_data.score_faisabilite >= 55 ? '#fbbf24' : '#f87171')
        : '#71717a',
      badge: result.ai_analysis?.analyse_faisabilite?.niveau,
      backText: result.ai_analysis?.analyse_faisabilite?.explication || 'Connectez-vous pour une analyse personnalisée.',
      tooltip: "Score basé sur votre profil bancaire : statut, revenus, apport, garant. Plus c'est haut, plus le financement est probable.",
      sub: result.user_profile?.authenticated ? 'Score personnalisé' : 'Non connecté',
      detail: scoreDetails?.faisabilite,
    },
    {
      key: 'localisation',
      icon: ICONS.localisation,
      title: 'Localisation',
      metric: crossData?.distance_domicile_km != null
        ? `${result.cross_data.distance_domicile_km.toFixed(0)} km`
        : `${result.widgets_data?.transport_stats?.nb_gares || 0} gare(s)`,
      metricColor: crossData?.distance_domicile_km != null
        ? (result.cross_data.distance_domicile_km <= 30 ? '#34d399' : result.cross_data.distance_domicile_km <= 100 ? '#fbbf24' : '#f87171')
        : '#60a5fa',
      badge: result.ai_analysis?.analyse_localisation?.potentiel ? `Potentiel ${result.ai_analysis.analyse_localisation.potentiel}` : undefined,
      backText: result.ai_analysis?.analyse_localisation?.explication || 'Analyse de localisation non disponible.',
      tooltip: "Distance depuis votre domicile + accessibilité en transport + établissements d'enseignement supérieur à proximité.",
      sub: [
        result.widgets_data?.transport_stats?.nb_gares ? `${result.widgets_data.transport_stats.nb_gares} gare(s)` : null,
        result.widgets_data?.student_stats?.nb_etablissements ? `${result.widgets_data.student_stats.nb_etablissements} fac(s)` : null,
      ].filter(Boolean).join(' · ') || undefined,
      detail: scoreDetails?.localisation,
    },
    {
      key: 'cashflow',
      icon: ICONS.cashflow,
      title: 'Cash-flow',
      metric: `${result.financial_result.cashflow_mensuel_net >= 0 ? '+' : ''}${fmtEUR(result.financial_result.cashflow_mensuel_net)}`,
      metricColor: result.financial_result.cashflow_mensuel_net >= 0 ? '#34d399' : '#f87171',
      badge: result.ai_analysis?.analyse_cashflow?.situation,
      backText: result.ai_analysis?.analyse_cashflow?.explication || `Cash-flow net mensuel de ${result.financial_result.cashflow_mensuel_net.toFixed(0)}€.`,
      tooltip: "Le cash-flow, c'est ce qu'il vous reste chaque mois après avoir payé le crédit et toutes les charges. Positif = le bien se paie tout seul.",
      sub: result.financial_result.autofinancement ? 'Autofinancement' : `${fmtEUR(result.financial_result.effort_epargne_mensuel)}/mois à compléter`,
      detail: scoreDetails?.cashflow,
    },
  ] : [];

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-white overflow-x-hidden" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* ══ TOPBAR ══ */}
      <nav
        className="fixed top-0 right-0 z-40 transition-all duration-300"
        style={{ left: isSidebarOpen ? 268 : 0, height: 72, background: scrolled ? 'rgba(9,9,11,0.92)' : 'rgba(9,9,11,0.75)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}
      >
        <div className="flex items-center justify-between h-full" style={{ paddingLeft: 24, paddingRight: 32 }}>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(v => !v)}
              className="w-10 h-10 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] flex items-center justify-center hover:bg-[var(--bg-card)] transition-all duration-200"
              aria-label="Toggle sidebar"
            >
              <svg width="18" height="14" viewBox="0 0 18 14" fill="none">
                <rect y="0"  width="18" height="2" rx="1" fill="#a1a1aa" className={`transition-all duration-200 origin-center ${isSidebarOpen ? 'translate-y-[6px] rotate-45' : ''}`} />
                <rect y="6"  width="18" height="2" rx="1" fill="#a1a1aa" className={`transition-all duration-200 ${isSidebarOpen ? 'opacity-0' : ''}`} />
                <rect y="12" width="18" height="2" rx="1" fill="#a1a1aa" className={`transition-all duration-200 origin-center ${isSidebarOpen ? '-translate-y-[6px] -rotate-45' : ''}`} />
              </svg>
            </button>
            {!isSidebarOpen && (
              <Link href="/dashboard" className="flex items-center gap-3">
                <BrandMark height={26} />
                <Logo />
              </Link>
            )}
            <div className="hidden sm:flex items-center gap-2" style={{ marginLeft: 8 }}>
              <span className="text-[var(--text-muted)] text-sm">/</span>
              <span className="text-sm font-medium text-[var(--text-secondary)]">Analyseur IA</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {isAuthenticated && user ? (
              <>
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: 'linear-gradient(135deg,#8b5cf6,#4f46e5)' }}>{initials}</div>
                <button onClick={logout} className="text-sm text-[var(--text-muted)] hover:text-white transition-colors duration-200">Déconnexion</button>
              </>
            ) : (
              <>
                <Link href="/login" className="text-sm text-[var(--text-muted)] hover:text-white transition-colors">Connexion</Link>
                <Link href="/register" className="inline-flex items-center gap-2 text-white font-semibold transition-all duration-200 hover:opacity-90 hover:-translate-y-px text-sm" style={{ background: 'linear-gradient(135deg,#8b5cf6,#4f46e5)', borderRadius: 40, boxShadow: '0 4px 20px rgba(139,92,246,0.4)', padding: '10px 24px', lineHeight: 1 }}>Créer un compte</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ══ MAIN ══ */}
      <main className="transition-all duration-300" style={{ marginLeft: isSidebarOpen ? 268 : 0, paddingTop: 72 }}>

        {/* ── HERO / SEARCH ── */}
        <section
          className="relative overflow-hidden"
          style={{ background: 'linear-gradient(160deg, rgba(91,33,182,0.18) 0%, rgba(9,9,11,0.9) 55%, rgba(49,46,129,0.06) 100%)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}
        >
          <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(139,92,246,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.04) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
          <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(139,92,246,0.1) 0%, transparent 70%)' }} />

          <div className="relative text-center" style={{ ...CONTAINER, paddingTop: 72, paddingBottom: 64 }}>
            <div
              className="inline-flex items-center gap-2 text-sm font-semibold"
              style={{ padding: '6px 18px', borderRadius: 40, background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.3)', color: '#c4b5fd', marginBottom: 28 }}
            >
              <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
              Outil principal
            </div>

            <div aria-hidden style={{ height: 4 }} />

            <h1
              className="font-black leading-none tracking-tight text-white"
              style={{ fontSize: 'clamp(2.25rem,6vw,4rem)', marginBottom: 0 }}
            >
              Analysez n'importe quelle<br />
              <span style={{ background: 'linear-gradient(135deg, #c4b5fd 0%, #818cf8 50%, #a5b4fc 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                annonce en 30 secondes
              </span>
            </h1>

            <div aria-hidden style={{ height: 24 }} />

            <p className="text-[var(--text-secondary)] text-lg" style={{ maxWidth: 580, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.7 }}>
              Collez le lien d'une annonce SeLoger, Leboncoin ou PAP — l'IA analyse, croise vos données et vous livre un rapport personnalisé avec un score sur 100.
            </p>

            <div aria-hidden style={{ height: 48 }} />

            {/* Search box */}
            {!result && (
              <div style={{ maxWidth: 720, marginLeft: 'auto', marginRight: 'auto' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '8px 8px 8px 24px',
                    borderRadius: 20,
                    background: 'rgba(255,255,255,0.04)',
                    border: error ? '1.5px solid rgba(239,68,68,0.5)' : '1.5px solid rgba(255,255,255,0.1)',
                    transition: 'border-color .2s, box-shadow .2s',
                  }}
                >
                  <svg className="w-5 h-5 flex-shrink-0 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                  <input
                    ref={inputRef}
                    type="url"
                    value={url}
                    onChange={e => setUrl(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="https://www.seloger.com/annonces/achat/appartement/..."
                    disabled={isLoading}
                    className="flex-1 bg-transparent border-none outline-none text-white placeholder-[var(--text-muted)] text-base disabled:opacity-50"
                    style={{ padding: '14px 0' }}
                  />
                  <button
                    onClick={analyzeAnnonce}
                    disabled={isLoading || !url.trim()}
                    className="flex-shrink-0 inline-flex items-center gap-2 font-semibold text-white transition-all duration-200 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ background: 'linear-gradient(135deg,#8b5cf6,#4f46e5)', borderRadius: 14, boxShadow: '0 4px 20px rgba(139,92,246,0.4)', padding: '14px 28px', fontSize: '0.9rem', lineHeight: 1 }}
                  >
                    {isLoading ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>}
                    {isLoading ? 'Analyse...' : 'Analyser'}
                  </button>
                </div>

                {error && (
                  <div className="flex items-center gap-3 text-sm" style={{ marginTop: 14, padding: '12px 18px', borderRadius: 12, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171' }}>
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    {error}
                  </div>
                )}

                {isLoading && (
                  <div className="flex flex-col items-center" style={{ marginTop: 48 }}>
                    <div className="relative" style={{ width: 72, height: 72, marginBottom: 20 }}>
                      <div className="absolute inset-0 rounded-full" style={{ border: '3px solid rgba(139,92,246,0.2)' }} />
                      <div className="absolute inset-0 rounded-full border-t-transparent animate-spin" style={{ border: '3px solid #8b5cf6' }} />
                      <div className="absolute rounded-full" style={{ inset: 10, border: '3px solid rgba(99,102,241,0.2)' }} />
                      <div className="absolute rounded-full border-t-transparent animate-spin" style={{ inset: 10, border: '3px solid #6366f1', animationDirection: 'reverse', animationDuration: '0.7s' }} />
                    </div>
                    <p className="text-base text-[var(--text-secondary)] animate-pulse">{loadingStep}</p>
                    <p className="text-sm text-[var(--text-muted)]" style={{ marginTop: 6 }}>Cela peut prendre quelques instants...</p>
                  </div>
                )}

                {!isLoading && (
                  <div className="flex items-center justify-center gap-4 text-sm text-[var(--text-muted)]" style={{ marginTop: 20 }}>
                    <span>Sites supportés :</span>
                    {['SeLoger', 'Leboncoin', 'PAP', "Bien'ici"].map(s => (
                      <span key={s} className="text-xs px-3 py-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>{s}</span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* ── HOW IT WORKS (empty state) ── */}
        {!result && !isLoading && mounted && (
          <section>
            <div style={{ ...CONTAINER, paddingTop: 56, paddingBottom: 64 }}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {[
                  { n: '01', title: 'Copiez le lien', desc: "Trouvez une annonce sur SeLoger, Leboncoin ou PAP et copiez son URL.", color: '#a78bfa', iconPath: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
                  { n: '02', title: "Lancez l'analyse", desc: 'Collez le lien ci-dessus et cliquez sur Analyser pour déclencher le rapport.', color: '#60a5fa', iconPath: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
                  { n: '03', title: 'Obtenez le score', desc: 'Recevez un score sur 100, une analyse IA et des recommandations personnalisées.', color: '#34d399', iconPath: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
                ].map(({ n, title, desc, color, iconPath }) => (
                  <div key={n} className="text-center" style={{ ...CARD, padding: '36px 28px' }}>
                    <div className="flex items-center justify-center" style={{ width: 56, height: 56, borderRadius: 16, background: `${color}18`, border: `1px solid ${color}40`, marginLeft: 'auto', marginRight: 'auto', marginBottom: 20 }}>
                      <svg className="w-6 h-6" style={{ color }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d={iconPath} /></svg>
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.15em', color: '#52525b', marginBottom: 10 }}>{n}</div>
                    <h3 className="text-base font-semibold text-white" style={{ marginBottom: 10 }}>{title}</h3>
                    <p className="text-sm text-[var(--text-muted)]" style={{ lineHeight: 1.7 }}>{desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── HISTORY ── */}
        {!result && !isLoading && mounted && history.length > 0 && (
          <section>
            <div style={{ ...CONTAINER, paddingTop: 0, paddingBottom: 48 }}>
              <div className="flex items-center gap-3" style={{ marginBottom: 20 }}>
                <div className="flex items-center justify-center" style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.25)', color: '#a78bfa' }}>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <h2 className="text-lg font-semibold text-white">Analyses récentes</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {history.map(h => {
                  const t = scoreTheme(h.score_v2 || 0);
                  const date = h.created_at ? new Date(h.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
                  return (
                    <button
                      key={h.id}
                      onClick={() => loadSavedAnalysis(h.id)}
                      className="text-left transition-all duration-200 hover:-translate-y-0.5"
                      style={{ ...CARD, padding: '20px 22px' }}
                    >
                      <div className="flex items-center justify-between" style={{ marginBottom: 10 }}>
                        <span className="text-xs text-[var(--text-muted)]">{date}</span>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: t.bg, border: `1px solid ${t.border}`, color: t.color }}>{h.score_v2?.toFixed(0)}/100</span>
                      </div>
                      <div className="text-sm font-semibold text-white" style={{ marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {h.scraped_data?.ville || 'Bien'} — {h.scraped_data?.prix ? fmtEUR(h.scraped_data.prix) : ''}
                      </div>
                      <div className="text-xs text-[var(--text-muted)]" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {h.scraped_data?.surface ? `${h.scraped_data.surface} m²` : ''} {h.verdict_v2 ? `· ${h.verdict_v2}` : ''}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* ══ RESULTS ══ */}
        {result && (
          <section>
            <div ref={reportRef} style={{ ...CONTAINER, paddingTop: 48, paddingBottom: 72 }}>

              {/* New search + export buttons */}
              <div className="flex justify-center gap-3" style={{ marginBottom: 40 }}>
                <button
                  onClick={resetAnalysis}
                  className="inline-flex items-center gap-2 text-sm font-medium text-[var(--text-secondary)] hover:text-white transition-all duration-200 hover:-translate-y-px"
                  style={{ padding: '10px 22px', borderRadius: 40, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                  Nouvelle analyse
                </button>
                <button
                  onClick={exportPDF}
                  className="inline-flex items-center gap-2 text-sm font-medium text-[var(--text-secondary)] hover:text-white transition-all duration-200 hover:-translate-y-px"
                  style={{ padding: '10px 22px', borderRadius: 40, background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.25)' }}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  Exporter PDF
                </button>
              </div>

              {/* ── SCORE HERO ── */}
              <div
                className="relative overflow-hidden"
                style={{ borderRadius: 24, padding: '40px 48px', border: `1.5px solid ${theme.border}`, background: `linear-gradient(135deg, ${theme.bg} 0%, rgba(9,9,11,0.9) 60%)`, marginBottom: 28 }}
              >
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                  <div className="text-center lg:text-left">
                    <div className="flex items-center gap-2 justify-center lg:justify-start" style={{ marginBottom: 8 }}>
                      <p className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)]">Score d'investissement</p>
                      {result.ai_analysis?.ai_generated && (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.35)', color: '#c4b5fd' }}>IA</span>
                      )}
                      {result.user_profile?.authenticated && (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.35)', color: '#34d399' }}>Personnalisé</span>
                      )}
                    </div>
                    <ScoreGauge score={score} size={180} />
                    <div aria-hidden style={{ height: 12 }} />
                    <div className="flex justify-center lg:justify-start">
                      <div className="inline-flex items-center gap-2 text-lg font-bold" style={{ padding: '10px 24px', borderRadius: 40, background: theme.bg, border: `1px solid ${theme.border}`, color: theme.color }}>
                        {result.verdict_v2 || result.ai_analysis?.verdict || result.financial_result?.verdict || 'Analyse'}
                      </div>
                    </div>
                    {result.scraped_data.titre && (
                      <>
                        <div aria-hidden style={{ height: 16 }} />
                        <p className="text-sm text-[var(--text-muted)]" style={{ lineHeight: 1.5 }}>{result.scraped_data.titre}</p>
                      </>
                    )}
                  </div>

                  {/* Key metrics */}
                  <div className="grid grid-cols-2 gap-3">
                    <MetricCard label="Prix d'achat" value={fmtEUR(result.financial_result.prix_achat)} />
                    <MetricCard label="Surface" value={`${result.financial_result.surface} m²`} sub={`${fmtEUR(result.financial_result.prix_m2)}/m²`} />
                    <MetricCard
                      label="Rentabilité nette"
                      value={fmtPct(result.financial_result.rentabilite_nette)}
                      color={result.financial_result.rentabilite_nette >= 4.5 ? '#34d399' : result.financial_result.rentabilite_nette >= 3 ? '#fbbf24' : '#f87171'}
                      tooltip="Ce qui reste après déduction de toutes les charges. Au-dessus de 4,5% = bon investissement."
                    />
                    <MetricCard
                      label="Cash-flow net/mois"
                      value={`${result.financial_result.cashflow_mensuel_net >= 0 ? '+' : ''}${fmtEUR(result.financial_result.cashflow_mensuel_net)}`}
                      color={result.financial_result.cashflow_mensuel_net >= 0 ? '#34d399' : '#f87171'}
                      tooltip="Ce qu'il vous reste chaque mois après crédit + charges. Positif = le bien s'autofinance."
                    />
                  </div>
                </div>
              </div>

              {/* ── AI SUMMARY ── */}
              {result.ai_analysis?.resume && (
                <div style={{ ...CARD, padding: '22px 28px', marginBottom: 28 }}>
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 flex items-center justify-center" style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.25)', color: '#a78bfa' }}>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                    </div>
                    <p className="text-sm text-[var(--text-secondary)]" style={{ lineHeight: 1.75 }}>{result.ai_analysis.resume}</p>
                  </div>
                </div>
              )}

              {/* ── FLIP CARDS GRID ── */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5" style={{ marginBottom: 28 }}>
                {flipCards.map(card => (
                  <AnalysisFlipCard
                    key={card.key}
                    icon={card.icon}
                    title={card.title}
                    metric={card.metric}
                    metricColor={card.metricColor}
                    badge={card.badge}
                    backText={card.backText}
                    tooltip={card.tooltip}
                    sub={card.sub}
                    scoreValue={card.detail?.score}
                    scoreMax={card.detail?.max}
                  />
                ))}
              </div>

              {/* ── Valorisation card (if available) ── */}
              {result.ai_analysis?.analyse_valorisation && crossData?.tendance_prix && (
                <div style={{ ...CARD, padding: '20px 24px', marginBottom: 28 }}>
                  <div className="flex items-center gap-3" style={{ marginBottom: 12 }}>
                    <div className="flex items-center justify-center" style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.25)', color: '#a78bfa' }}>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6" /></svg>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white flex items-center">
                        Potentiel de valorisation
                        <InfoTooltip text="L'évolution des prix dans le département sur les 5 dernières années, un indicateur du potentiel de plus-value à la revente." />
                      </h3>
                      <span className="text-xs text-[var(--text-muted)]">
                        {result.cross_data.tendance_prix.annee_debut}-{result.cross_data.tendance_prix.annee_fin} · {result.cross_data.tendance_prix.evolution_pct > 0 ? '+' : ''}{result.cross_data.tendance_prix.evolution_pct}%
                      </span>
                    </div>
                    <span className="ml-auto text-sm font-bold" style={{ color: result.cross_data.tendance_prix.evolution_pct > 3 ? '#34d399' : result.cross_data.tendance_prix.evolution_pct > -3 ? '#fbbf24' : '#f87171' }}>
                      {result.cross_data.tendance_prix.tendance.charAt(0).toUpperCase() + result.cross_data.tendance_prix.tendance.slice(1)}
                    </span>
                  </div>
                  <p className="text-sm text-[var(--text-secondary)]" style={{ lineHeight: 1.7 }}>{result.ai_analysis.analyse_valorisation.explication}</p>
                </div>
              )}

              {/* ── TWO-COLUMN: Financial details + Market context ── */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" style={{ marginBottom: 28 }}>
                {/* Analyse financière */}
                <div style={CARD}>
                  <div style={CARD_P}>
                    <SectionHeader
                      icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                      title="Détail financier"
                    />
                    <StatRow label="Prix total projet" value={fmtEUR(result.financial_result.cout_total_projet)} sub={`Notaire : ${fmtEUR(result.financial_result.frais_notaire)}`} />
                    <StatRow label="Loyer mensuel estimé" value={`${fmtEUR(result.financial_result.loyer_mensuel_brut)}/mois`} />
                    <StatRow label="Mensualité crédit" value={`${fmtEUR(result.financial_result.mensualite_totale)}/mois`} />
                    <StatRow label="Charges mensuelles" value={`${fmtEUR(result.financial_result.charges_totales_mensuel)}/mois`} tooltip="Copropriété + taxe foncière + assurance propriétaire + gestion locative." />
                    <StatRow label="Rentabilité brute" value={fmtPct(result.financial_result.rentabilite_brute)} color={result.financial_result.rentabilite_brute >= 6 ? '#34d399' : '#ffffff'} tooltip="Loyers annuels / prix d'achat, avant charges et impôts." />
                    <StatRow label="Rentabilité nette" value={fmtPct(result.financial_result.rentabilite_nette)} color={result.financial_result.rentabilite_nette >= 4.5 ? '#34d399' : result.financial_result.rentabilite_nette >= 3 ? '#fbbf24' : '#f87171'} tooltip="Loyers - charges / coût total. Reflète le gain réel." />
                    <StatRow label="Rentabilité nette-nette" value={fmtPct(result.financial_result.rentabilite_nette_nette)} color="#71717a" tooltip="Après impôts (~30%). Le rendement final réel." />
                    <div style={{ padding: '13px 0' }}>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-[var(--text-secondary)] flex items-center">Cash-flow net<InfoTooltip text="Ce qu'il vous reste chaque mois après crédit et charges. Positif = le bien se paie tout seul." /></span>
                        <span className="text-base font-bold" style={{ color: result.financial_result.cashflow_mensuel_net >= 0 ? '#34d399' : '#f87171' }}>
                          {result.financial_result.cashflow_mensuel_net >= 0 ? '+' : ''}{fmtEUR(result.financial_result.cashflow_mensuel_net)}/mois
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contexte marché */}
                <div style={CARD}>
                  <div style={CARD_P}>
                    <SectionHeader
                      icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
                      title="Contexte marché"
                    />
                    {result.widgets_data?.dvf_stats && (
                      <div className="grid grid-cols-2 gap-3" style={{ marginBottom: 16 }}>
                        <MetricCard label="Prix médian/m²" value={fmtEUR(result.widgets_data.dvf_stats.prix_m2_median)} tooltip="Prix médian au m² dans le département (données DVF 2024)." />
                        <MetricCard label="Ventes 2024" value={result.widgets_data.dvf_stats.nb_ventes.toLocaleString()} />
                      </div>
                    )}
                    {crossData?.rendement_dept && (
                      <StatRow
                        label="Rendement département"
                        value={`${result.cross_data.rendement_dept.rendement_brut_pct}%`}
                        sub={`${result.cross_data.rendement_dept.rang_national}e/${result.cross_data.rendement_dept.total_departements} dép.`}
                        tooltip="Rendement brut moyen du département et son classement national."
                        color={result.cross_data.rendement_dept.rendement_brut_pct >= 6 ? '#34d399' : '#ffffff'}
                      />
                    )}
                    {result.widgets_data?.insee_stats && (
                      <StatRow label="Taux de vacance" value={`${result.widgets_data.insee_stats.taux_vacance?.toFixed(1)}%`} color={result.widgets_data.insee_stats.taux_vacance < 6 ? '#34d399' : result.widgets_data.insee_stats.taux_vacance < 8 ? '#fbbf24' : '#f87171'} tooltip="Pourcentage de logements vides. Moins de 6% = zone tendue." />
                    )}
                    {result.widgets_data?.transport_stats && result.widgets_data.transport_stats.nb_gares > 0 && (
                      <StatRow label="Gares à proximité" value={`${result.widgets_data.transport_stats.nb_gares} gare(s)`} sub={result.widgets_data.transport_stats.noms_gares.slice(0, 2).join(', ')} />
                    )}
                    {result.widgets_data?.student_stats && result.widgets_data.student_stats.nb_etablissements > 0 && (
                      <StatRow label="Enseignement supérieur" value={`${result.widgets_data.student_stats.nb_etablissements} établissement(s)`} />
                    )}
                    {crossData?.distance_domicile_km != null && (
                      <StatRow label="Distance domicile" value={`${result.cross_data.distance_domicile_km} km`} color={result.cross_data.distance_domicile_km <= 30 ? '#34d399' : result.cross_data.distance_domicile_km <= 100 ? '#fbbf24' : '#f87171'} />
                    )}
                    <div aria-hidden style={{ height: 12 }} />
                    <a
                      href={result.scraped_data.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full text-sm font-semibold transition-all duration-200 hover:opacity-80"
                      style={{ padding: '12px 0', borderRadius: 12, background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.25)', color: '#a78bfa' }}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                      Voir l'annonce originale
                    </a>
                  </div>
                </div>
              </div>

              {/* ── POINTS FORTS / VIGILANCE / RECOMMANDATIONS ── */}
              {result.ai_analysis && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" style={{ marginBottom: 28 }}>
                  {/* Points forts + vigilance */}
                  <div style={CARD}>
                    <div style={CARD_P}>
                      {result.ai_analysis.points_forts?.length > 0 && (
                        <>
                          <p className="text-xs font-bold uppercase tracking-wider" style={{ color: '#34d399', marginBottom: 10 }}>Points forts</p>
                          <div className="flex flex-col" style={{ gap: 6, marginBottom: 20 }}>
                            {result.ai_analysis.points_forts.map((p, i) => (
                              <div key={i} className="flex items-start gap-3" style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.2)' }}>
                                <svg className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: '#34d399' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                <p className="text-xs text-emerald-300" style={{ lineHeight: 1.5 }}>{p}</p>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                      {result.ai_analysis.points_vigilance?.length > 0 && (
                        <>
                          <p className="text-xs font-bold uppercase tracking-wider" style={{ color: '#fbbf24', marginBottom: 10 }}>Points de vigilance</p>
                          <div className="flex flex-col" style={{ gap: 6 }}>
                            {result.ai_analysis.points_vigilance.map((p, i) => (
                              <div key={i} className="flex items-start gap-3" style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)' }}>
                                <svg className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: '#fbbf24' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                <p className="text-xs text-amber-300" style={{ lineHeight: 1.5 }}>{p}</p>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Recommandations + Conclusion */}
                  <div style={CARD}>
                    <div style={CARD_P}>
                      {result.ai_analysis.recommandations?.length > 0 && (
                        <>
                          <p className="text-xs font-bold uppercase tracking-wider" style={{ color: '#60a5fa', marginBottom: 10 }}>Recommandations</p>
                          <div className="flex flex-col" style={{ gap: 6, marginBottom: 20 }}>
                            {result.ai_analysis.recommandations.map((r, i) => (
                              <div key={i} className="flex items-start gap-3" style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(59,130,246,0.07)', border: '1px solid rgba(59,130,246,0.2)' }}>
                                <span className="text-xs font-bold flex-shrink-0" style={{ color: '#60a5fa', minWidth: 16 }}>{i + 1}.</span>
                                <p className="text-xs text-blue-300" style={{ lineHeight: 1.5 }}>{r}</p>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                      {result.ai_analysis.conclusion && (
                        <div style={{ padding: '16px 18px', borderRadius: 12, background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)' }}>
                          <p className="text-xs font-bold uppercase tracking-wider" style={{ color: '#a78bfa', marginBottom: 8 }}>Conclusion</p>
                          <p className="text-sm text-[var(--text-secondary)]" style={{ lineHeight: 1.75 }}>{result.ai_analysis.conclusion}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

            </div>
          </section>
        )}

        {/* Footer */}
        <footer style={{ borderTop: '1px solid rgba(255,255,255,0.07)', padding: '28px 0' }}>
          <div className="flex items-center justify-between" style={CONTAINER}>
            <BrandMark height={20} />
            <p className="text-xs text-zinc-600">© 2026 BrickByBrick</p>
          </div>
        </footer>
      </main>
    </div>
  );
}
