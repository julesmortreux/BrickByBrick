'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Slider } from '@/components/ui/slider';
import { useAuth, authFetch } from '@/lib/auth';
import { VilleSearch } from '@/components/VilleSearch';
import Sidebar from '@/components/Sidebar';
import Image from 'next/image';

interface Ville {
  nom: string;
  code_postal: string;
  lat?: number;
  lon?: number;
}

const CONTAINER_STYLE = {
  width: '100%',
  maxWidth: 860,
  marginLeft: 'auto',
  marginRight: 'auto',
  paddingLeft: 32,
  paddingRight: 32,
  boxSizing: 'border-box' as const,
};

const CARD_FORCE_STYLE = { padding: 36 } as const;
const CARD_FORCE_STYLE_SM = { padding: 24 } as const;

const SEGMENTED_BTN_FORCE_STYLE = {
  minHeight: 42,
  paddingLeft: 24,
  paddingRight: 24,
  paddingTop: 10,
  paddingBottom: 10,
  lineHeight: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
} as const;

function BrandMark({ height = 28 }: { height?: number }) {
  const w = Math.round((height * 362) / 394);
  return (
    <Image
      src="/logo-mark.png"
      alt="BrickByBrick"
      width={w}
      height={height}
      unoptimized
      priority
      style={{ objectFit: 'contain', objectPosition: 'center' }}
    />
  );
}

function Logo() {
  return (
    <span className="text-xl font-black tracking-tight leading-none">
      <span className="text-white">Brick</span>
      <span className="text-violet-400">By</span>
      <span className="text-white">Brick</span>
    </span>
  );
}

function SectionIcon({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex-shrink-0 flex items-center justify-center"
      style={{
        width: 44,
        height: 44,
        borderRadius: 12,
        background: 'rgba(139,92,246,0.12)',
        border: '1px solid rgba(139,92,246,0.25)',
        color: '#a78bfa',
      }}
    >
      {children}
    </div>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, user, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [prefsLoaded, setPrefsLoaded] = useState(false);

  // Situation personnelle
  const [statut, setStatut] = useState<'etudiant' | 'alternant' | 'cdi' | 'cdd' | 'fonctionnaire' | 'auto-entrepreneur' | 'retraite' | 'chomeur'>('etudiant');
  const [anciennete, setAnciennete] = useState(0);
  const [revenuMensuel, setRevenuMensuel] = useState(800);
  const [coBorrower, setCoBorrower] = useState(false);
  const [revenuCoBorrower, setRevenuCoBorrower] = useState(0);
  const [garant, setGarant] = useState<'aucun' | 'oui'>('oui');
  const [garantProprio, setGarantProprio] = useState(true);
  const [revenuGarant, setRevenuGarant] = useState(4000);

  // Projet
  const [prixProjet, setPrixProjet] = useState(150000);
  const [apport, setApport] = useState(15000);
  const [dureeCredit, setDureeCredit] = useState(20);
  const [tauxInteret, setTauxInteret] = useState(3.1);

  // Localisation
  const [villeDomicile, setVilleDomicile] = useState<Ville | null>(null);
  const [villesRelais, setVillesRelais] = useState<Ville[]>([]);
  const [rayon, setRayon] = useState(20);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sidebarOpen');
      setIsSidebarOpen(saved !== null ? saved === 'true' : window.innerWidth >= 1024);
    }
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidebarOpen', isSidebarOpen.toString());
    }
  }, [isSidebarOpen]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

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
        if (prefs) {
          if (prefs.statut) setStatut(prefs.statut);
          if (prefs.anciennete !== undefined) setAnciennete(prefs.anciennete);
          if (prefs.revenu_mensuel) setRevenuMensuel(prefs.revenu_mensuel);
          if (prefs.co_borrower !== undefined) setCoBorrower(prefs.co_borrower);
          if (prefs.revenu_co_borrower) setRevenuCoBorrower(prefs.revenu_co_borrower);
          if (prefs.garant) setGarant(prefs.garant);
          if (prefs.garant_proprio !== undefined) setGarantProprio(prefs.garant_proprio);
          if (prefs.revenu_garant) setRevenuGarant(prefs.revenu_garant);
          if (prefs.prix_projet) setPrixProjet(prefs.prix_projet);
          if (prefs.apport) setApport(prefs.apport);
          if (prefs.duree_credit) setDureeCredit(prefs.duree_credit);
          if (prefs.taux_interet !== undefined && prefs.taux_interet !== null) {
            setTauxInteret(prefs.taux_interet);
          } else {
            setTauxInteret(3.1);
          }
          if (prefs.w5_rayon) setRayon(prefs.w5_rayon);
          if (prefs.w5_ville_domicile) {
            try { setVilleDomicile(JSON.parse(prefs.w5_ville_domicile)); } catch {}
          }
          if (prefs.w5_villes_relais) {
            try { setVillesRelais(JSON.parse(prefs.w5_villes_relais)); } catch {}
          }
        }
      }
    } catch (error) {
      console.error('Failed to load preferences:', error);
    } finally {
      setPrefsLoaded(true);
    }
  };

  const savePreferences = async () => {
    if (!isAuthenticated) {
      setSaveMessage({ type: 'error', text: 'Connectez-vous pour sauvegarder' });
      setTimeout(() => setSaveMessage(null), 4000);
      return;
    }
    setIsSaving(true);
    setSaveMessage(null);
    try {
      const getResponse = await authFetch('/auth/preferences');
      let existingPrefs = {};
      if (getResponse.ok) {
        const data = await getResponse.json();
        if (data) existingPrefs = data;
      }
      const response = await authFetch('/auth/preferences', {
        method: 'PUT',
        body: JSON.stringify({
          ...existingPrefs,
          statut,
          anciennete,
          revenu_mensuel: revenuMensuel,
          co_borrower: coBorrower,
          revenu_co_borrower: revenuCoBorrower,
          garant,
          garant_proprio: garantProprio,
          revenu_garant: revenuGarant,
          prix_projet: prixProjet,
          apport,
          duree_credit: dureeCredit,
          taux_interet: tauxInteret,
          w5_rayon: rayon,
          w5_ville_domicile: villeDomicile ? JSON.stringify(villeDomicile) : null,
          w5_villes_relais: villesRelais.length > 0 ? JSON.stringify(villesRelais) : null,
        }),
      });
      if (response.ok) {
        setSaveMessage({ type: 'success', text: 'Paramètres sauvegardés avec succès' });
        setTimeout(() => setSaveMessage(null), 4000);
      } else {
        setSaveMessage({ type: 'error', text: 'Erreur lors de la sauvegarde' });
      }
    } catch {
      setSaveMessage({ type: 'error', text: 'Erreur de connexion' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSelectRelais = (ville: Ville) => {
    if (!villesRelais.find(v => v.nom === ville.nom && v.code_postal === ville.code_postal)) {
      setVillesRelais(prev => [...prev, ville]);
    }
  };

  const removeVilleRelais = (index: number) => {
    setVillesRelais(villesRelais.filter((_, i) => i !== index));
  };

  const initials = user ? `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}` : '';

  const statutOptions: { value: typeof statut; label: string }[] = [
    { value: 'etudiant', label: 'Étudiant' },
    { value: 'alternant', label: 'Alternant' },
    { value: 'cdi', label: 'CDI' },
    { value: 'cdd', label: 'CDD' },
    { value: 'fonctionnaire', label: 'Fonctionnaire' },
    { value: 'auto-entrepreneur', label: 'Auto-entrepreneur' },
    { value: 'retraite', label: 'Retraité' },
    { value: 'chomeur', label: 'Chômeur' },
  ];

  if (isLoading || !isAuthenticated || !prefsLoaded) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-white overflow-x-hidden" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* ══════════════════ TOPBAR ══════════════════ */}
      <nav
        className="fixed top-0 right-0 z-40 transition-all duration-300"
        style={{
          left: isSidebarOpen ? 268 : 0,
          height: 72,
          background: scrolled ? 'rgba(9,9,11,0.92)' : 'rgba(9,9,11,0.75)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        <div
          className="flex items-center justify-between h-full"
          style={{ paddingLeft: 24, paddingRight: 32 }}
        >
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
              <span className="text-sm font-medium text-[var(--text-secondary)]">Paramètres</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="hidden sm:inline-flex items-center gap-2 text-[var(--text-muted)] text-sm font-medium hover:text-white transition-colors duration-200"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
              Tableau de bord
            </Link>
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold"
                style={{ background: 'linear-gradient(135deg, #8b5cf6, #4f46e5)' }}
              >
                {initials}
              </div>
              <button
                onClick={logout}
                className="text-sm text-[var(--text-muted)] hover:text-white transition-colors duration-200"
              >
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* ══════════════════ MAIN ══════════════════ */}
      <main
        className="transition-all duration-300"
        style={{ marginLeft: isSidebarOpen ? 268 : 0, paddingTop: 72 }}
      >
        {/* Page header */}
        <div style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.015)' }}>
          <div style={{ ...CONTAINER_STYLE, paddingTop: 48, paddingBottom: 48 }}>
            <div className="flex items-start justify-between gap-6">
              <div>
                <p className="text-violet-400 text-xs font-bold tracking-widest uppercase" style={{ marginBottom: 12 }}>
                  Compte
                </p>
                <h1 className="text-3xl font-bold text-white" style={{ marginBottom: 8 }}>
                  Paramètres
                </h1>
                <p className="text-[var(--text-muted)] text-base">
                  Gérez votre profil financier et vos préférences de recherche.
                </p>
              </div>

              {/* Save button in header */}
              <button
                onClick={savePreferences}
                disabled={isSaving}
                className="flex-shrink-0 inline-flex items-center gap-2 font-semibold text-white transition-all duration-200 hover:opacity-90 hover:-translate-y-px disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                style={{
                  background: 'linear-gradient(135deg,#8b5cf6,#4f46e5)',
                  borderRadius: 40,
                  boxShadow: '0 4px 20px rgba(139,92,246,0.4)',
                  padding: '12px 28px',
                  fontSize: '0.875rem',
                  lineHeight: 1,
                }}
              >
                {isSaving ? (
                  <>
                    <div className="w-3.5 h-3.5 border border-white/40 border-t-white rounded-full animate-spin" />
                    Sauvegarde...
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    Sauvegarder
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Save notification */}
        {saveMessage && (
          <div style={{ ...CONTAINER_STYLE, paddingTop: 20, paddingBottom: 0 }}>
            <div
              className="flex items-center gap-3 text-sm font-medium"
              style={{
                padding: '14px 20px',
                borderRadius: 14,
                background: saveMessage.type === 'success' ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
                border: `1px solid ${saveMessage.type === 'success' ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`,
                color: saveMessage.type === 'success' ? '#34d399' : '#f87171',
              }}
            >
              {saveMessage.type === 'success' ? (
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              ) : (
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              )}
              {saveMessage.text}
            </div>
          </div>
        )}

        <div aria-hidden style={{ height: 40 }} />

        {/* ─── CONTENT ─── */}
        <div style={CONTAINER_STYLE}>
          <div className="flex flex-col" style={{ gap: 24 }}>

            {/* ── SECTION 1: Situation personnelle ── */}
            <section
              style={{
                borderRadius: 20,
                border: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(255,255,255,0.03)',
              }}
            >
              <div style={CARD_FORCE_STYLE}>
                <div className="flex items-center gap-4" style={{ marginBottom: 32 }}>
                  <SectionIcon>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  </SectionIcon>
                  <div>
                    <h2 className="text-lg font-semibold text-white">Situation personnelle</h2>
                    <p className="text-sm text-[var(--text-muted)]">Votre statut professionnel et vos revenus</p>
                  </div>
                </div>

                {/* Statut professionnel */}
                <label className="text-sm font-medium text-[var(--text-secondary)]">Statut professionnel</label>
                <div aria-hidden style={{ height: 14 }} />
                <div className="flex flex-wrap gap-2">
                  {statutOptions.map(({ value, label }) => (
                    <button
                      key={value}
                      onClick={() => setStatut(value)}
                      className={`text-sm font-semibold transition-all duration-200 hover:opacity-90 hover:-translate-y-px rounded-[40px] ${
                        statut === value
                          ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-[0_4px_20px_rgba(139,92,246,0.4)]'
                          : 'bg-white/5 text-[var(--text-secondary)] border border-white/10 hover:bg-white/7 hover:border-white/20 hover:text-white shadow-none opacity-100'
                      }`}
                      style={SEGMENTED_BTN_FORCE_STYLE}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {statut === 'cdi' && (
                  <>
                    <div aria-hidden style={{ height: 28 }} />
                    <div className="flex justify-between items-baseline">
                      <label className="text-sm font-medium text-[var(--text-secondary)]">Ancienneté</label>
                      <span className="text-base font-semibold text-white" style={{ fontVariantNumeric: 'tabular-nums' }}>{anciennete} mois</span>
                    </div>
                    <div aria-hidden style={{ height: 14 }} />
                    <Slider value={[anciennete]} onValueChange={(v) => setAnciennete(v[0])} min={0} max={120} step={1} />
                  </>
                )}

                <div aria-hidden style={{ height: 28 }} />

                {/* Revenu mensuel */}
                <div className="flex justify-between items-baseline">
                  <label className="text-sm font-medium text-[var(--text-secondary)]">Revenu mensuel net</label>
                  <span className="text-base font-semibold text-white" style={{ fontVariantNumeric: 'tabular-nums' }}>{revenuMensuel.toLocaleString()} €</span>
                </div>
                <div aria-hidden style={{ height: 14 }} />
                <Slider value={[revenuMensuel]} onValueChange={(v) => setRevenuMensuel(v[0])} min={0} max={10000} step={50} />

                <div aria-hidden style={{ height: 28 }} />

                {/* Co-emprunteur */}
                <div
                  style={{
                    borderRadius: 14,
                    border: '1px solid rgba(255,255,255,0.07)',
                    background: 'rgba(255,255,255,0.02)',
                  }}
                >
                  <div style={CARD_FORCE_STYLE_SM}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-[var(--text-secondary)]">Co-emprunteur</p>
                        <p className="text-xs text-[var(--text-muted)]" style={{ marginTop: 2 }}>Ajouter un second emprunteur</p>
                      </div>
                      <div className="flex gap-2">
                        {[true, false].map((val) => (
                          <button
                            key={String(val)}
                            onClick={() => setCoBorrower(val)}
                            className={`text-sm font-semibold transition-all duration-200 rounded-[40px] ${
                              coBorrower === val
                                ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-[0_4px_20px_rgba(139,92,246,0.4)]'
                                : 'bg-white/5 text-[var(--text-secondary)] border border-white/10 hover:bg-white/7 hover:text-white shadow-none'
                            }`}
                            style={{ ...SEGMENTED_BTN_FORCE_STYLE, paddingLeft: 20, paddingRight: 20 }}
                          >
                            {val ? 'Oui' : 'Non'}
                          </button>
                        ))}
                      </div>
                    </div>
                    {coBorrower && (
                      <>
                        <div aria-hidden style={{ height: 20 }} />
                        <div className="flex justify-between items-baseline">
                          <label className="text-sm font-medium text-[var(--text-muted)]">Revenu co-emprunteur</label>
                          <span className="text-base font-semibold text-white" style={{ fontVariantNumeric: 'tabular-nums' }}>{revenuCoBorrower.toLocaleString()} €</span>
                        </div>
                        <div aria-hidden style={{ height: 14 }} />
                        <Slider value={[revenuCoBorrower]} onValueChange={(v) => setRevenuCoBorrower(v[0])} min={0} max={10000} step={50} />
                      </>
                    )}
                  </div>
                </div>

                <div aria-hidden style={{ height: 24 }} />

                {/* Garant */}
                <div
                  style={{
                    borderRadius: 14,
                    border: '1px solid rgba(255,255,255,0.07)',
                    background: 'rgba(255,255,255,0.02)',
                  }}
                >
                  <div style={CARD_FORCE_STYLE_SM}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-[var(--text-secondary)]">Garant</p>
                        <p className="text-xs text-[var(--text-muted)]" style={{ marginTop: 2 }}>Caution personnelle</p>
                      </div>
                      <div className="flex gap-2">
                        {(['oui', 'aucun'] as const).map((val) => (
                          <button
                            key={val}
                            onClick={() => setGarant(val)}
                            className={`text-sm font-semibold transition-all duration-200 rounded-[40px] ${
                              garant === val
                                ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-[0_4px_20px_rgba(139,92,246,0.4)]'
                                : 'bg-white/5 text-[var(--text-secondary)] border border-white/10 hover:bg-white/7 hover:text-white shadow-none'
                            }`}
                            style={{ ...SEGMENTED_BTN_FORCE_STYLE, paddingLeft: 20, paddingRight: 20 }}
                          >
                            {val === 'oui' ? 'Oui' : 'Non'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {garant === 'oui' && (
                      <>
                        <div aria-hidden style={{ height: 20 }} />
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-[var(--text-muted)]">Garant propriétaire</p>
                            <p className="text-xs text-[var(--text-muted)] opacity-60" style={{ marginTop: 2 }}>Le garant est propriétaire de son logement</p>
                          </div>
                          <div className="flex gap-2">
                            {[true, false].map((val) => (
                              <button
                                key={String(val)}
                                onClick={() => setGarantProprio(val)}
                                className={`text-sm font-semibold transition-all duration-200 rounded-[40px] ${
                                  garantProprio === val
                                    ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-[0_4px_20px_rgba(139,92,246,0.4)]'
                                    : 'bg-white/5 text-[var(--text-secondary)] border border-white/10 hover:bg-white/7 hover:text-white shadow-none'
                                }`}
                                style={{ ...SEGMENTED_BTN_FORCE_STYLE, paddingLeft: 20, paddingRight: 20 }}
                              >
                                {val ? 'Oui' : 'Non'}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div aria-hidden style={{ height: 20 }} />
                        <div className="flex justify-between items-baseline">
                          <label className="text-sm font-medium text-[var(--text-muted)]">Revenu du garant</label>
                          <span className="text-base font-semibold text-white" style={{ fontVariantNumeric: 'tabular-nums' }}>{revenuGarant.toLocaleString()} €</span>
                        </div>
                        <div aria-hidden style={{ height: 14 }} />
                        <Slider value={[revenuGarant]} onValueChange={(v) => setRevenuGarant(v[0])} min={0} max={10000} step={100} />
                      </>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* ── SECTION 2: Votre projet ── */}
            <section
              style={{
                borderRadius: 20,
                border: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(255,255,255,0.03)',
              }}
            >
              <div style={CARD_FORCE_STYLE}>
                <div className="flex items-center gap-4" style={{ marginBottom: 32 }}>
                  <SectionIcon>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                  </SectionIcon>
                  <div>
                    <h2 className="text-lg font-semibold text-white">Votre projet</h2>
                    <p className="text-sm text-[var(--text-muted)]">Budget, apport et durée du crédit</p>
                  </div>
                </div>

                <div className="flex justify-between items-baseline">
                  <label className="text-sm font-medium text-[var(--text-secondary)]">Prix du bien</label>
                  <span className="text-base font-semibold text-white" style={{ fontVariantNumeric: 'tabular-nums' }}>{prixProjet.toLocaleString()} €</span>
                </div>
                <div aria-hidden style={{ height: 14 }} />
                <Slider value={[prixProjet]} onValueChange={(v) => setPrixProjet(v[0])} min={50000} max={500000} step={5000} />

                <div aria-hidden style={{ height: 28 }} />

                <div className="flex justify-between items-baseline">
                  <label className="text-sm font-medium text-[var(--text-secondary)]">Apport personnel</label>
                  <span className="text-base font-semibold text-white" style={{ fontVariantNumeric: 'tabular-nums' }}>{apport.toLocaleString()} €</span>
                </div>
                <div aria-hidden style={{ height: 14 }} />
                <Slider value={[apport]} onValueChange={(v) => setApport(v[0])} min={0} max={200000} step={1000} />

                <div aria-hidden style={{ height: 28 }} />

                <div className="flex justify-between items-baseline">
                  <label className="text-sm font-medium text-[var(--text-secondary)]">Durée du crédit</label>
                  <span className="text-base font-semibold text-white" style={{ fontVariantNumeric: 'tabular-nums' }}>{dureeCredit} ans</span>
                </div>
                <div aria-hidden style={{ height: 14 }} />
                <Slider value={[dureeCredit]} onValueChange={(v) => setDureeCredit(v[0])} min={5} max={25} step={1} />
              </div>
            </section>

            {/* ── SECTION 3: Paramètres du crédit ── */}
            <section
              style={{
                borderRadius: 20,
                border: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(255,255,255,0.03)',
              }}
            >
              <div style={CARD_FORCE_STYLE}>
                <div className="flex items-center gap-4" style={{ marginBottom: 32 }}>
                  <SectionIcon>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                  </SectionIcon>
                  <div>
                    <h2 className="text-lg font-semibold text-white">Paramètres du crédit</h2>
                    <p className="text-sm text-[var(--text-muted)]">Taux d'intérêt et conditions de financement</p>
                  </div>
                </div>

                <div className="flex justify-between items-baseline">
                  <label className="text-sm font-medium text-[var(--text-secondary)]">Taux d'intérêt annuel</label>
                  <span className="text-base font-semibold text-white" style={{ fontVariantNumeric: 'tabular-nums' }}>{tauxInteret.toFixed(2)} %</span>
                </div>
                <div aria-hidden style={{ height: 14 }} />
                <Slider value={[tauxInteret * 100]} onValueChange={(v) => setTauxInteret(v[0] / 100)} min={10} max={800} step={5} />
                <div className="flex justify-between" style={{ marginTop: 10 }}>
                  <span className="text-xs text-[var(--text-muted)]">0,1 %</span>
                  <span className="text-xs text-[var(--text-muted)]">8 %</span>
                </div>
              </div>
            </section>

            {/* ── SECTION 4: Localisation ── */}
            <section
              style={{
                borderRadius: 20,
                border: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(255,255,255,0.03)',
              }}
            >
              <div style={CARD_FORCE_STYLE}>
                <div className="flex items-center gap-4" style={{ marginBottom: 32 }}>
                  <SectionIcon>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
                  </SectionIcon>
                  <div>
                    <h2 className="text-lg font-semibold text-white">Localisation</h2>
                    <p className="text-sm text-[var(--text-muted)]">Votre domicile et vos zones d'intérêt</p>
                  </div>
                </div>

                {/* Ville domicile */}
                <label className="text-sm font-medium text-[var(--text-secondary)]">Où habitez-vous ?</label>
                <div aria-hidden style={{ height: 14 }} />
                {villeDomicile ? (
                  <div
                    className="flex items-center justify-between"
                    style={{
                      padding: 20,
                      borderRadius: 14,
                      background: 'rgba(139,92,246,0.06)',
                      border: '1px solid rgba(139,92,246,0.2)',
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.25)' }}>
                        <svg className="w-4 h-4 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-white">{villeDomicile.nom}</div>
                        {villeDomicile.code_postal && <div className="text-xs text-[var(--text-muted)]">{villeDomicile.code_postal}</div>}
                      </div>
                    </div>
                    <button
                      onClick={() => setVilleDomicile(null)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 transition-all duration-150"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                ) : (
                  <VilleSearch placeholder="Rechercher votre ville domicile..." onSelect={(v) => setVilleDomicile(v)} />
                )}

                <div aria-hidden style={{ height: 28 }} />

                {/* Villes d'intérêt */}
                <label className="text-sm font-medium text-[var(--text-secondary)]">Villes d'intérêt</label>
                <div aria-hidden style={{ height: 14 }} />
                <VilleSearch placeholder="Ajouter une ville..." onSelect={handleSelectRelais} />
                {villesRelais.length > 0 && (
                  <>
                    <div aria-hidden style={{ height: 12 }} />
                    <div className="flex flex-col" style={{ gap: 8 }}>
                      {villesRelais.map((ville, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between"
                          style={{
                            padding: '14px 18px',
                            borderRadius: 12,
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.07)',
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.05)' }}>
                              <svg className="w-3.5 h-3.5 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-white">{ville.nom}</div>
                              {ville.code_postal && <div className="text-xs text-[var(--text-muted)]">{ville.code_postal}</div>}
                            </div>
                          </div>
                          <button
                            onClick={() => removeVilleRelais(index)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 transition-all duration-150"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                <div aria-hidden style={{ height: 28 }} />

                {/* Rayon */}
                <div className="flex justify-between items-baseline">
                  <label className="text-sm font-medium text-[var(--text-secondary)]">Rayon de recherche</label>
                  <span className="text-base font-semibold text-white" style={{ fontVariantNumeric: 'tabular-nums' }}>{rayon} km</span>
                </div>
                <div aria-hidden style={{ height: 14 }} />
                <Slider value={[rayon]} onValueChange={(v) => setRayon(v[0])} min={5} max={50} step={5} />
              </div>
            </section>

            {/* ── SECTION 5: Compte & Abonnement ── */}
            <section
              style={{
                borderRadius: 20,
                border: '1px solid rgba(139,92,246,0.2)',
                background: 'linear-gradient(135deg, rgba(91,33,182,0.1) 0%, rgba(9,9,11,0.8) 100%)',
              }}
            >
              <div style={CARD_FORCE_STYLE}>
                <div className="flex items-center gap-4" style={{ marginBottom: 28 }}>
                  <SectionIcon>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
                  </SectionIcon>
                  <div>
                    <h2 className="text-lg font-semibold text-white">Abonnement</h2>
                    <p className="text-sm text-[var(--text-muted)]">Plan actuel et options Premium</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
                  <div>
                    <div className="flex items-center gap-3" style={{ marginBottom: 6 }}>
                      <span
                        className="text-xs font-bold"
                        style={{
                          padding: '4px 12px',
                          borderRadius: 40,
                          background: 'rgba(255,255,255,0.07)',
                          border: '1px solid rgba(255,255,255,0.12)',
                          color: '#a1a1aa',
                        }}
                      >
                        GRATUIT
                      </span>
                    </div>
                    <p className="text-sm text-[var(--text-muted)]">
                      Passez Premium pour débloquer 6 outils supplémentaires, des analyses IA illimitées et des rapports détaillés.
                    </p>
                  </div>
                  <a
                    href="#"
                    className="flex-shrink-0 inline-flex items-center gap-2 font-semibold text-white transition-all duration-200 hover:opacity-90 hover:-translate-y-px"
                    style={{
                      background: 'linear-gradient(135deg,#8b5cf6,#4f46e5)',
                      borderRadius: 40,
                      boxShadow: '0 4px 20px rgba(139,92,246,0.35)',
                      padding: '12px 26px',
                      fontSize: '0.875rem',
                      lineHeight: 1,
                    }}
                  >
                    Premium — 9,90 €/mois
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                  </a>
                </div>
              </div>
            </section>

          </div>

          <div aria-hidden style={{ height: 40 }} />

          {/* Bottom save bar */}
          <div
            className="flex items-center justify-between"
            style={{
              padding: '20px 28px',
              borderRadius: 16,
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.07)',
            }}
          >
            <p className="text-sm text-[var(--text-muted)]">Les modifications sont appliquées à tous vos outils.</p>
            <button
              onClick={savePreferences}
              disabled={isSaving}
              className="inline-flex items-center gap-2 font-semibold text-white transition-all duration-200 hover:opacity-90 hover:-translate-y-px disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: 'linear-gradient(135deg,#8b5cf6,#4f46e5)',
                borderRadius: 40,
                boxShadow: '0 4px 20px rgba(139,92,246,0.4)',
                padding: '12px 28px',
                fontSize: '0.875rem',
                lineHeight: 1,
              }}
            >
              {isSaving ? (
                <>
                  <div className="w-3.5 h-3.5 border border-white/40 border-t-white rounded-full animate-spin" />
                  Sauvegarde...
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  Sauvegarder les paramètres
                </>
              )}
            </button>
          </div>

          <div aria-hidden style={{ height: 56 }} />
        </div>

        {/* Footer */}
        <footer style={{ borderTop: '1px solid rgba(255,255,255,0.07)', padding: '28px 0' }}>
          <div className="flex items-center justify-between" style={CONTAINER_STYLE}>
            <BrandMark height={20} />
            <p className="text-xs text-zinc-600">© 2026 BrickByBrick</p>
          </div>
        </footer>
      </main>
    </div>
  );
}
