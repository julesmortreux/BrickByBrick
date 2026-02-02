'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Slider } from '@/components/ui/slider';
import { useAuth, authFetch } from '@/lib/auth';
import { VilleSearch } from '@/components/VilleSearch';

// Types
interface Ville {
  nom: string;
  code_postal: string;
  lat?: number;
  lon?: number;
}

// Icons
const Icons = {
  user: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
  home: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
  calculator: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>,
  map: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>,
  check: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>,
  x: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>,
  settings: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
};

export default function SettingsPage() {
  const router = useRouter();
  const { isAuthenticated, user, logout } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [prefsLoaded, setPrefsLoaded] = useState(false);

  // Situation personnelle
  const [statut, setStatut] = useState<'etudiant' | 'alternant' | 'cdi' | 'cdd' | 'fonctionnaire'>('etudiant');
  const [anciennete, setAnciennete] = useState(0);
  const [revenuMensuel, setRevenuMensuel] = useState(800);
  const [coBorrower, setCoBorrower] = useState(false);
  const [revenuCoBorrower, setRevenuCoBorrower] = useState(0);
  const [garant, setGarant] = useState<'aucun' | 'oui'>('oui');
  const [revenuGarant, setRevenuGarant] = useState(4000);

  // Projet
  const [prixProjet, setPrixProjet] = useState(150000);
  const [apport, setApport] = useState(15000);
  const [dureeCredit, setDureeCredit] = useState(20);

  // Crédit
  const [tauxInteret, setTauxInteret] = useState(3.5);
  const [inclureCharges, setInclureCharges] = useState(true);

  // Localisation
  const [villeDomicile, setVilleDomicile] = useState<Ville | null>(null);
  const [villesRelais, setVillesRelais] = useState<Ville[]>([]);
  const [rayon, setRayon] = useState(20);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    if (isAuthenticated && !prefsLoaded) {
      loadPreferences();
    }
  }, [isAuthenticated, prefsLoaded, router]);

  const loadPreferences = async () => {
    try {
      const response = await authFetch('/auth/preferences');
      if (response.ok) {
        const prefs = await response.json();
        if (prefs) {
          // Situation
          if (prefs.statut) setStatut(prefs.statut);
          if (prefs.anciennete !== undefined) setAnciennete(prefs.anciennete);
          if (prefs.revenu_mensuel) setRevenuMensuel(prefs.revenu_mensuel);
          if (prefs.co_borrower !== undefined) setCoBorrower(prefs.co_borrower);
          if (prefs.revenu_co_borrower) setRevenuCoBorrower(prefs.revenu_co_borrower);
          if (prefs.garant) setGarant(prefs.garant);
          if (prefs.revenu_garant) setRevenuGarant(prefs.revenu_garant);
          // Projet
          if (prefs.prix_projet) setPrixProjet(prefs.prix_projet);
          if (prefs.apport) setApport(prefs.apport);
          if (prefs.duree_credit) setDureeCredit(prefs.duree_credit);
          // Crédit
          if (prefs.taux_interet) setTauxInteret(prefs.taux_interet);
          // Localisation
          if (prefs.w5_rayon) setRayon(prefs.w5_rayon);
          if (prefs.w5_ville_domicile) {
            try {
              setVilleDomicile(JSON.parse(prefs.w5_ville_domicile));
            } catch {}
          }
          if (prefs.w5_villes_relais) {
            try {
              setVillesRelais(JSON.parse(prefs.w5_villes_relais));
            } catch {}
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
      setTimeout(() => setSaveMessage(null), 3000);
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
          // Situation
          statut,
          anciennete,
          revenu_mensuel: revenuMensuel,
          co_borrower: coBorrower,
          revenu_co_borrower: revenuCoBorrower,
          garant,
          revenu_garant: revenuGarant,
          // Projet
          prix_projet: prixProjet,
          apport,
          duree_credit: dureeCredit,
          // Crédit
          taux_interet: tauxInteret,
          // Localisation
          w5_rayon: rayon,
          w5_ville_domicile: villeDomicile ? JSON.stringify(villeDomicile) : null,
          w5_villes_relais: villesRelais.length > 0 ? JSON.stringify(villesRelais) : null,
        }),
      });

      if (response.ok) {
        setSaveMessage({ type: 'success', text: 'Données sauvegardées avec succès' });
        setTimeout(() => setSaveMessage(null), 3000);
      } else {
        setSaveMessage({ type: 'error', text: 'Erreur lors de la sauvegarde' });
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
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

  if (!isAuthenticated || !prefsLoaded) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <div className="text-[var(--text-muted)]">Chargement...</div>
      </div>
    );
  }

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
            <span className="text-[var(--text-secondary)] text-sm">Paramètres</span>
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
      <div className="bg-gradient-to-b from-indigo-600/10 to-transparent" style={{ paddingTop: '120px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '60px 48px', textAlign: 'center' }}>
          <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-medium mb-8">
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
            Gestion des données personnelles
          </div>
          <h1 className="text-5xl font-bold text-white mb-8">Mes Données</h1>
          <p className="text-xl text-[var(--text-secondary)] text-center" style={{ maxWidth: '700px', margin: '0 auto' }}>
            Gérez toutes vos informations personnelles en un seul endroit. Vous pouvez également utiliser les widgets pour faire des simulations.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <main style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 48px 80px 48px' }}>
        {/* Message de sauvegarde */}
        {saveMessage && (
          <div className={`mb-6 p-4 rounded-2xl ${
            saveMessage.type === 'success' 
              ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' 
              : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
          }`}>
            {saveMessage.text}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {/* Section 1: Situation personnelle */}
          <section className="bg-[var(--bg-card)] rounded-3xl border border-[var(--border-color)]" style={{ padding: '40px' }}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-400">
                {Icons.user}
              </div>
              <h2 className="text-2xl font-semibold text-white">Situation personnelle</h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Statut */}
              <div>
                <label className="text-lg text-[var(--text-secondary)] mb-3 block">Statut professionnel</label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {(['etudiant', 'alternant', 'cdi', 'cdd', 'fonctionnaire'] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setStatut(s)}
                      className={`px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                        statut === s
                          ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/30'
                          : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-card)]'
                      }`}
                    >
                      {s === 'etudiant' ? 'Étudiant' : s === 'alternant' ? 'Alternant' : s === 'cdi' ? 'CDI' : s === 'cdd' ? 'CDD' : 'Fonctionnaire'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Ancienneté */}
              {statut === 'cdi' && (
                <div>
                  <div className="flex justify-between items-baseline mb-3">
                    <label className="text-lg text-[var(--text-secondary)]">Ancienneté (mois)</label>
                    <span className="text-xl font-bold text-white">{anciennete} mois</span>
                  </div>
                  <div style={{ padding: '0 8px' }}>
                    <Slider value={[anciennete]} onValueChange={(v) => setAnciennete(v[0])} min={0} max={120} step={1} />
                  </div>
                </div>
              )}

              {/* Revenu mensuel */}
              <div>
                <div className="flex justify-between items-baseline mb-3">
                  <label className="text-lg text-[var(--text-secondary)]">Revenu mensuel net</label>
                  <span className="text-xl font-bold text-white">{revenuMensuel.toLocaleString()} €</span>
                </div>
                <div style={{ padding: '0 8px' }}>
                  <Slider value={[revenuMensuel]} onValueChange={(v) => setRevenuMensuel(v[0])} min={0} max={10000} step={50} />
                </div>
              </div>

              {/* Co-emprunteur */}
              <div className="bg-[var(--bg-secondary)] rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-lg text-[var(--text-secondary)]">Co-emprunteur</label>
                  <button
                    onClick={() => setCoBorrower(!coBorrower)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      coBorrower ? 'bg-violet-500 text-white' : 'bg-[var(--bg-card)] text-[var(--text-muted)]'
                    }`}
                  >
                    {coBorrower ? 'Oui' : 'Non'}
                  </button>
                </div>
                {coBorrower && (
                  <div className="mt-4">
                    <div className="flex justify-between items-baseline mb-3">
                      <label className="text-sm text-[var(--text-secondary)]">Revenu co-emprunteur</label>
                      <span className="text-lg font-bold text-white">{revenuCoBorrower.toLocaleString()} €</span>
                    </div>
                    <div style={{ padding: '0 8px' }}>
                      <Slider value={[revenuCoBorrower]} onValueChange={(v) => setRevenuCoBorrower(v[0])} min={0} max={10000} step={50} />
                    </div>
                  </div>
                )}
              </div>

              {/* Garant */}
              <div>
                <label className="text-lg text-[var(--text-secondary)] mb-3 block">Garant</label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setGarant('oui')}
                    className={`flex-1 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      garant === 'oui'
                        ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/30'
                        : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)]'
                    }`}
                  >
                    Oui
                  </button>
                  <button
                    onClick={() => setGarant('aucun')}
                    className={`flex-1 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      garant === 'aucun'
                        ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/30'
                        : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)]'
                    }`}
                  >
                    Non
                  </button>
                </div>
                {garant === 'oui' && (
                  <div className="mt-4">
                    <div className="flex justify-between items-baseline mb-3">
                      <label className="text-sm text-[var(--text-secondary)]">Revenu garant</label>
                      <span className="text-lg font-bold text-white">{revenuGarant.toLocaleString()} €</span>
                    </div>
                    <div style={{ padding: '0 8px' }}>
                      <Slider value={[revenuGarant]} onValueChange={(v) => setRevenuGarant(v[0])} min={0} max={10000} step={100} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Section 2: Projet */}
          <section className="bg-[var(--bg-card)] rounded-3xl border border-[var(--border-color)]" style={{ padding: '40px' }}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400">
                {Icons.home}
              </div>
              <h2 className="text-2xl font-semibold text-white">Votre projet</h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div>
                <div className="flex justify-between items-baseline mb-3">
                  <label className="text-lg text-[var(--text-secondary)]">Prix du bien</label>
                  <span className="text-xl font-bold text-white">{prixProjet.toLocaleString()} €</span>
                </div>
                <div style={{ padding: '0 8px' }}>
                  <Slider value={[prixProjet]} onValueChange={(v) => setPrixProjet(v[0])} min={50000} max={500000} step={5000} />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-baseline mb-3">
                  <label className="text-lg text-[var(--text-secondary)]">Apport</label>
                  <span className="text-xl font-bold text-white">{apport.toLocaleString()} €</span>
                </div>
                <div style={{ padding: '0 8px' }}>
                  <Slider value={[apport]} onValueChange={(v) => setApport(v[0])} min={0} max={200000} step={1000} />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-baseline mb-3">
                  <label className="text-lg text-[var(--text-secondary)]">Durée du crédit</label>
                  <span className="text-xl font-bold text-white">{dureeCredit} ans</span>
                </div>
                <div style={{ padding: '0 8px' }}>
                  <Slider value={[dureeCredit]} onValueChange={(v) => setDureeCredit(v[0])} min={5} max={30} step={1} />
                </div>
              </div>
            </div>
          </section>

          {/* Section 3: Crédit */}
          <section className="bg-[var(--bg-card)] rounded-3xl border border-[var(--border-color)]" style={{ padding: '40px' }}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                {Icons.calculator}
              </div>
              <h2 className="text-2xl font-semibold text-white">Paramètres du crédit</h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div>
                <div className="flex justify-between items-baseline mb-3">
                  <label className="text-lg text-[var(--text-secondary)]">Taux d'intérêt annuel</label>
                  <span className="text-xl font-bold text-white">{tauxInteret.toFixed(2)}%</span>
                </div>
                <div style={{ padding: '0 8px' }}>
                  <Slider value={[tauxInteret * 100]} onValueChange={(v) => setTauxInteret(v[0] / 100)} min={10} max={800} step={5} />
                </div>
                <div className="flex justify-between text-sm text-[var(--text-muted)] mt-2">
                  <span>0,1%</span>
                  <span>8%</span>
                </div>
              </div>
            </div>
          </section>

          {/* Section 4: Localisation */}
          <section className="bg-[var(--bg-card)] rounded-3xl border border-[var(--border-color)]" style={{ padding: '40px' }}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-lime-500/10 flex items-center justify-center text-lime-400">
                {Icons.map}
              </div>
              <h2 className="text-2xl font-semibold text-white">Localisation</h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Ville domicile */}
              <div>
                <label className="text-lg font-semibold text-white mb-3 block">Ville domicile</label>
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
                    onSelect={(ville) => setVilleDomicile(ville)}
                  />
                )}
              </div>

              {/* Villes relais */}
              <div>
                <label className="text-lg font-semibold text-white mb-3 block">Villes relais</label>
                <VilleSearch
                  placeholder="Ajouter une ville relais..."
                  onSelect={handleSelectRelais}
                />
                {villesRelais.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {villesRelais.map((ville, index) => (
                      <div key={index} className="bg-[var(--bg-secondary)] rounded-xl p-3 border border-blue-500/20">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                              {Icons.map}
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

              {/* Rayon */}
              <div>
                <div className="flex justify-between items-baseline mb-3">
                  <label className="text-lg text-[var(--text-secondary)]">Rayon de recherche</label>
                  <span className="text-xl font-bold text-white">{rayon} km</span>
                </div>
                <div style={{ padding: '0 8px' }}>
                  <Slider value={[rayon]} onValueChange={(v) => setRayon(v[0])} min={5} max={50} step={5} />
                </div>
              </div>
            </div>
          </section>

          {/* Liens vers widgets */}
          <div className="bg-[var(--bg-card)] rounded-3xl border border-[var(--border-color)]" style={{ padding: '40px' }}>
            <h3 className="text-xl font-semibold text-white mb-4">Simulations avancées</h3>
            <p className="text-[var(--text-secondary)] mb-6">
              Utilisez les widgets pour faire des simulations avec différentes configurations :
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/widgets/faisabilite" className="px-4 py-2 rounded-xl bg-violet-500/10 text-violet-400 hover:bg-violet-500/20 transition-colors">
                Faisabilité d'achat
              </Link>
              <Link href="/widgets/rendement-requis" className="px-4 py-2 rounded-xl bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 transition-colors">
                Rendement requis
              </Link>
              <Link href="/widgets/proximite-domicile" className="px-4 py-2 rounded-xl bg-lime-500/10 text-lime-400 hover:bg-lime-500/20 transition-colors">
                Proximité domicile
              </Link>
            </div>
          </div>

          {/* Bouton de sauvegarde */}
          <div className="flex justify-center">
            <button
              onClick={savePreferences}
              disabled={isSaving}
              style={{ padding: '20px 60px', fontSize: '1.125rem', borderRadius: '16px' }}
              className="font-bold transition-all shadow-2xl bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600 text-white hover:shadow-indigo-500/30 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
            >
              {isSaving ? 'Sauvegarde...' : 'Sauvegarder les modifications'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
