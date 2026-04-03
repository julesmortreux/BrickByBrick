'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import Link from 'next/link';
import Image from 'next/image';

/* ─── Animated counter ─────────────────────────────────────────────────────── */
function AnimatedNumber({ target, suffix = '', prefix = '', duration = 2200 }: {
  target: number; suffix?: string; prefix?: string; duration?: number;
}) {
  const [value, setValue] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setStarted(true); },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    const t0 = Date.now();
    const tick = () => {
      const p = Math.min((Date.now() - t0) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(ease * target));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [started, target, duration]);

  const fmt = value >= 1_000_000
    ? `${(value / 1_000_000).toFixed(1)}M`
    : value >= 1_000
    ? `${(value / 1_000).toFixed(0)} 000`
    : `${value}`;

  return <span ref={ref}>{prefix}{fmt}{suffix}</span>;
}

/* ─── Logo (crop sans texte — PNG transparent ; SVG seul via /logo-mark.svg pour design) ─ */
function BrandMark({ height = 34, className = '', priority = false }: { height?: number; className?: string; priority?: boolean }) {
  const w = Math.round((height * 362) / 394);
  return (
    <Image
      src="/logo-mark.png"
      alt="BrickByBrick"
      width={w}
      height={height}
      className={`shrink-0 ${className}`}
      priority={priority}
      unoptimized
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

/* ─── LANDING PAGE ─────────────────────────────────────────────────────────── */
export default function LandingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading, user } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const disableRedirect = searchParams.get('fromOnboarding') === '1';

  useEffect(() => {
    setMounted(true);
    const fn = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  useEffect(() => {
    if (!disableRedirect && !isLoading && isAuthenticated && user?.onboarding_completed !== false) {
      router.push('/dashboard');
    }
  }, [disableRedirect, isLoading, isAuthenticated, user, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* ══════════════════ NAVBAR ══════════════════ */}
      <nav
        className="fixed top-0 inset-x-0 z-50 transition-all duration-300"
        style={{
          background: scrolled ? 'rgba(0,0,0,0.85)' : 'transparent',
          backdropFilter: scrolled ? 'blur(20px)' : 'none',
          borderBottom: scrolled ? '1px solid rgba(255,255,255,0.07)' : 'none',
        }}
      >
        <div className="flex items-center justify-between" style={{ width: '100%', maxWidth: 1152, marginLeft: 'auto', marginRight: 'auto', paddingLeft: 32, paddingRight: 32, boxSizing: 'border-box', height: 72 }}>
          <div className="flex items-center gap-10">
            <Link href="/" className="flex items-center gap-3" style={{ marginLeft: 12 }}>
              <BrandMark height={34} priority className="leading-none translate-y-[-4px]" />
              <Logo />
            </Link>
            <div className="hidden lg:flex items-center gap-8">
              {[['Fonctionnalités', '#features'], ['Comment ça marche', '#howto'], ['Tarifs', '#pricing']].map(([l, h]) => (
                <a key={l} href={h} className="text-sm text-zinc-400 hover:text-white transition-colors duration-200">{l}</a>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm text-zinc-400 hover:text-white transition-colors hidden sm:block">
              Se connecter
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center justify-center text-white font-semibold transition-all duration-200 hover:opacity-90 hover:-translate-y-px"
              style={{
                background: 'linear-gradient(135deg,#8b5cf6,#4f46e5)',
                borderRadius: '40px',
                boxShadow: '0 4px 20px rgba(139,92,246,0.4)',
                padding: '14px 32px',
                fontSize: '1rem',
                lineHeight: 1,
              }}
            >
              Commencer gratuitement
            </Link>
          </div>
        </div>
      </nav>

      {/* ══════════════════ HERO ══════════════════ */}
      <section className="relative flex flex-col items-center justify-center text-center overflow-hidden" style={{ minHeight: '100vh', paddingTop: '120px', paddingBottom: '110px' }}>

        {/* Subtle grid */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: 'linear-gradient(rgba(139,92,246,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.05) 1px, transparent 1px)',
          backgroundSize: '80px 80px',
        }} />

        {/* Background hero image (darker for text readability) */}
        <div className="absolute inset-0 pointer-events-none z-0" style={{ mixBlendMode: 'normal' }}>
          <Image
            src="/hero.png"
            alt=""
            fill
            priority
            style={{ objectFit: 'cover', objectPosition: 'center bottom', opacity: 0.28 }}
          />
        </div>
        {/* gradient masks */}
        <div className="absolute inset-0 pointer-events-none z-0" style={{ background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(139,92,246,0.15) 0%, transparent 70%)' }} />
        <div className="absolute bottom-0 inset-x-0 h-48 pointer-events-none z-0" style={{ background: 'linear-gradient(to top, #000 0%, transparent 100%)' }} />

        <div className="relative z-10" style={{ width: '100%', maxWidth: 1152, marginLeft: 'auto', marginRight: 'auto', paddingLeft: 32, paddingRight: 32, boxSizing: 'border-box' }}>

          {/* Headline */}
          <h1
            className="font-black leading-none tracking-tight mb-0"
            style={{
              fontSize: 'clamp(3rem, 8vw, 5.5rem)',
              opacity: mounted ? 1 : 0,
              transform: mounted ? 'translateY(0)' : 'translateY(20px)',
              transition: 'opacity .6s ease .1s, transform .6s ease .1s',
            }}
          >
            Investissez dans<br />
            <span style={{
              background: 'linear-gradient(135deg, #c4b5fd 0%, #818cf8 50%, #a5b4fc 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              l'immobilier
            </span>
            <br />en confiance.
          </h1>

          {/* Spacer: air strictement en pixels */}
          <div aria-hidden style={{ height: 34 }} />

          {/* Subline */}
          <div
            style={{
              width: '100%',
              maxWidth: 760,
              marginLeft: 'auto',
              marginRight: 'auto',
              textAlign: 'center',
            }}
          >
            <p
              className="text-zinc-400 leading-relaxed mb-0"
              style={{
                fontSize: '1.2rem',
                opacity: mounted ? 1 : 0,
                transform: mounted ? 'translateY(0)' : 'translateY(20px)',
                transition: 'opacity .6s ease .2s, transform .6s ease .2s',
              }}
            >
              Analysez le marché, calculez votre capacité d'emprunt et évaluez chaque annonce avec l'IA,
              pour faire <span className="text-white font-medium">le bon choix</span> dès le départ.
            </p>
          </div>

          {/* Spacer: air strictement en pixels */}
          <div aria-hidden style={{ height: 80 }} />

          {/* CTAs */}
          <div
          className="flex flex-wrap justify-center items-center gap-6 mb-0"
            style={{ opacity: mounted ? 1 : 0, transition: 'opacity .6s ease .3s' }}
          >
            <Link
              href="/register"
              className="group inline-flex items-center gap-2 font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:opacity-90"
            style={{ padding: '14px 40px', borderRadius: '40px', fontSize: '1rem', background: 'linear-gradient(135deg,#8b5cf6,#4f46e5)', boxShadow: '0 8px 30px rgba(139,92,246,0.5)' }}
            >
              Commencer gratuitement
              <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
            </Link>
            <a
              href="#howto"
              className="inline-flex items-center gap-2 font-semibold text-zinc-300 transition-all duration-200 hover:text-white hover:-translate-y-0.5"
            style={{ padding: '14px 40px', borderRadius: '40px', fontSize: '1rem', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.04)' }}
            >
              <svg className="w-5 h-5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              Voir la démo
            </a>
          </div>

          {/* Spacer: air strictement en pixels */}
          <div aria-hidden style={{ height: 24 }} />

        </div>

        {/* Scroll hint */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce" style={{ opacity: .4 }}>
          <svg className="w-5 h-5 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
        </div>
      </section>

      {/* Spacer: air strictement en pixels entre hero et la section suivante */}
      <div aria-hidden style={{ height: 12 }} />

      {/* ══════════════════ STATS ══════════════════ */}
      <section style={{ borderTop: '1px solid rgba(255,255,255,0.07)', borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '72px 0', background: 'rgba(255,255,255,0.02)' }}>
        <div style={{ width: '100%', maxWidth: 1152, marginLeft: 'auto', marginRight: 'auto', paddingLeft: 32, paddingRight: 32, boxSizing: 'border-box' }}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 text-center">
            {[
              { target: 6200000, suffix: '+', label: 'Transactions analysées', color: '#a78bfa' },
              { target: 96,      suffix: '',  label: 'Départements couverts',  color: '#60a5fa' },
              { target: 8,       suffix: '',  label: "Outils d'analyse",       color: '#34d399' },
              { target: 30,      suffix: 's', label: 'Pour une analyse IA',    color: '#fbbf24' },
            ].map(({ target, suffix, label, color }) => (
              <div key={label} className="w-full">
                <div style={{ fontSize: '2.5rem', fontWeight: 900, color, lineHeight: 1.1, marginBottom: 10 }}>
                  <AnimatedNumber target={target} suffix={suffix} />
                </div>
                <p style={{ color: '#52525b', fontSize: 14 }}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════ HOW IT WORKS ══════════════════ */}
      <section id="howto" style={{ padding: '130px 0' }}>
        <div style={{ width: '100%', maxWidth: 1152, marginLeft: 'auto', marginRight: 'auto', paddingLeft: 32, paddingRight: 32, boxSizing: 'border-box' }}>

          <div className="text-center" style={{ marginBottom: 72 }}>
            <p style={{ color: '#8b5cf6', fontSize: 13, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 20 }}>Simple et rapide</p>
            <h2 style={{ fontSize: 'clamp(2rem,5vw,3.25rem)', fontWeight: 900, lineHeight: 1.1, letterSpacing: '-0.02em' }}>
              De zéro à l'analyse<br />
              <span style={{ color: '#3f3f46', fontWeight: 300 }}>en 3 étapes</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { n: '01', title: 'Créez votre profil', desc: "Renseignez votre situation financière et votre projet. Obtenez votre score bancaire personnalisé en temps réel.", iconSrc: '/profil.svg' },
              { n: '02', title: 'Explorez le marché', desc: 'Prix réels, zones accessibles, tension locative, toutes les données utiles réunies en un seul endroit.', iconSrc: '/marche.svg' },
              { n: '03', title: 'Analysez chaque annonce', desc: "Collez un lien SeLoger ou Leboncoin, l'IA calcule la rentabilité, le cash-flow et donne un verdict clair.", iconSrc: '/analyse.svg' },
            ].map(({ n, title, desc, iconSrc }) => (
              <div
                key={n}
                className="group transition-all duration-300 hover:-translate-y-1 w-full text-center flex flex-col items-center justify-center"
                style={{ borderRadius: 22, padding: '44px 36px', border: `1px solid rgba(255,255,255,0.08)`, background: 'rgba(255,255,255,0.03)', minHeight: 360 }}
              >
                <div
                  className="transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110 shadow-[0_0_0_rgba(167,139,250,0.0)] group-hover:shadow-[0_0_35px_rgba(167,139,250,0.35)]"
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: 18,
                    background: 'rgba(167,139,250,0.18)',
                    border: '1px solid rgba(167,139,250,0.40)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 32px',
                  }}
                >
                  <Image
                    src={iconSrc}
                    alt=""
                    width={44}
                    height={44}
                    unoptimized
                    style={{ objectFit: 'contain', objectPosition: 'center' }}
                  />
                </div>
                <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.15em', color: '#a78bfa', opacity: 0.55, marginBottom: 12 }}>{n}</div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'white', marginBottom: 12 }}>{title}</h3>
                <p
                  style={{ fontSize: 15, color: '#71717a', lineHeight: 1.8 }}
                  className="overflow-hidden transition-all duration-300 md:opacity-0 md:max-h-0 md:group-hover:opacity-100 md:group-hover:max-h-[220px]"
                >
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════ FEATURES ══════════════════ */}
      <section
        id="features"
        style={{ padding: '120px 0', borderTop: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.015)' }}
      >
        <div style={{ width: '100%', maxWidth: 1152, marginLeft: 'auto', marginRight: 'auto', paddingLeft: 32, paddingRight: 32, boxSizing: 'border-box' }}>

          <div className="text-center" style={{ marginBottom: 72 }}>
            <p style={{ color: '#8b5cf6', fontSize: 13, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 20 }}>Fonctionnalités</p>
            <h2 style={{ fontSize: 'clamp(2rem,5vw,3.25rem)', fontWeight: 900, lineHeight: 1.1, letterSpacing: '-0.02em', marginBottom: 20 }}>
              Tous les outils dont<br />
              <span style={{ color: '#3f3f46', fontWeight: 300 }}>vous avez besoin</span>
            </h2>
            <p style={{ color: '#71717a', fontSize: '1.1rem', maxWidth: 480, margin: '0 auto' }}>
              Données réelles et actualisées, personnalisées selon votre profil financier.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { svgSrc: '/widgets/faisabilite.svg', title: 'Score de faisabilité', desc: "Votre score bancaire sur 100 et votre capacité d'emprunt réelle selon votre profil.", badge: 'Gratuit', badgeColor: '#10b981' },
              { svgSrc: '/widgets/dvf.svg', title: 'Évolution des prix', desc: "L'évolution réelle des prix au m² sur 5 ans dans les 96 départements.", badge: 'Gratuit', badgeColor: '#10b981' },
              { svgSrc: '/widgets/zonesaccessibles.svg', title: 'Zones accessibles', desc: "Toutes les zones où votre budget vous permet d'acheter, sur carte interactive.", badge: 'Premium', badgeColor: '#f59e0b' },
              { svgSrc: '/widgets/proximite.svg', title: 'Proximité domicile', desc: "Temps de trajet depuis chaque zone d'achat, investissez sans changer de vie.", badge: 'Premium', badgeColor: '#f59e0b' },
              { svgSrc: '/widgets/tensionlocative.svg', title: 'Tension locative', desc: 'Identifiez les zones à forte demande pour minimiser le risque de vacance locative.', badge: 'Premium', badgeColor: '#f59e0b' },
              { svgSrc: '/widgets/taille.svg', title: 'Répartition des surfaces', desc: 'Analysez la composition du marché par taille de bien, T1, T2, T3 et plus.', badge: 'Premium', badgeColor: '#f59e0b' },
              { svgSrc: '/widgets/rendementdepartement.svg', title: 'Meilleurs départements', desc: 'Classement des 96 départements par rendement locatif, trouvez les meilleures zones.', badge: 'Premium', badgeColor: '#f59e0b' },
              { svgSrc: '/widgets/rendementrequis.svg', title: 'Rendement requis', desc: 'Calculez le loyer minimal pour équilibrer votre crédit selon votre apport et durée.', badge: 'Premium', badgeColor: '#f59e0b' },
            ].map(({ svgSrc, title, desc, badge, badgeColor }) => (
              <div key={title} className="widget-flip">
                <div className="widget-flip-inner">

                  {/* ── FACE AVANT : grande icône ── */}
                  <div className="widget-flip-front">
                    <Image
                      src={svgSrc}
                      alt={title}
                      width={180}
                      height={180}
                      unoptimized
                      style={{ objectFit: 'contain', width: '75%', height: '75%' }}
                    />
                  </div>

                  {/* ── FACE ARRIÈRE : infos ── */}
                  <div className="widget-flip-back">
                    <span style={{ fontSize: 12, fontWeight: 700, padding: '5px 14px', borderRadius: '40px', background: `${badgeColor}18`, border: `1px solid ${badgeColor}40`, color: badgeColor }}>
                      {badge}
                    </span>
                    <Image
                      src={svgSrc}
                      alt=""
                      width={52}
                      height={52}
                      unoptimized
                      style={{ objectFit: 'contain', opacity: 0.6 }}
                    />
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'white', margin: 0 }}>{title}</h3>
                    <p style={{ fontSize: 13, color: '#71717a', lineHeight: 1.6, margin: 0 }}>{desc}</p>
                  </div>

                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════ AI SECTION ══════════════════ */}
      <section style={{ padding: '120px 0', position: 'relative', overflow: 'hidden', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        {/* bg buildings */}
        <div className="absolute inset-0 pointer-events-none" style={{ mixBlendMode: 'screen' }}>
          <Image src="/hero.svg" alt="" fill style={{ objectFit: 'cover', objectPosition: 'center', opacity: 0.35 }} />
        </div>
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(90deg, #000 30%, rgba(0,0,0,0.5) 60%, #000 100%)' }} />

        <div className="relative" style={{ width: '100%', maxWidth: 1152, marginLeft: 'auto', marginRight: 'auto', paddingLeft: 32, paddingRight: 32, boxSizing: 'border-box' }}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">

            {/* Left copy */}
            <div>
              <p style={{ color: '#8b5cf6', fontSize: 13, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 20 }}>Intelligence artificielle</p>
              <h2 style={{ fontSize: 'clamp(2rem,4.5vw,3rem)', fontWeight: 900, lineHeight: 1.1, letterSpacing: '-0.02em', marginBottom: 20 }}>
                Analysez n'importe<br />quelle annonce<br />
                <span style={{ background: 'linear-gradient(135deg,#a78bfa,#818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                  en 30 secondes.
                </span>
              </h2>
              <p style={{ color: '#71717a', fontSize: '1.1rem', lineHeight: 1.7, marginBottom: 32 }}>
                Collez un lien SeLoger, Leboncoin ou PAP. L'IA scrape l'annonce, croise les données du marché et vous livre un rapport complet — sans aucune connaissance financière requise.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 36 }}>
                {['Score sur 100 avec justification détaillée', 'Cash-flow calculé selon votre profil réel', 'Comparaison automatique avec les prix du quartier', 'Points forts et risques expliqués simplement'].map(p => (
                  <div key={p} style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 14, color: '#a1a1aa' }}>
                    <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <svg style={{ width: 12, height: 12, color: '#34d399' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    </div>
                    {p}
                  </div>
                ))}
              </div>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 font-semibold text-white transition-all duration-200 hover:-translate-y-0.5"
                style={{ padding: '14px 30px', borderRadius: '40px', fontSize: '0.95rem', background: 'linear-gradient(135deg,#8b5cf6,#4f46e5)', boxShadow: '0 8px 28px rgba(139,92,246,0.45)' }}
              >
                Essayer gratuitement
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
              </Link>
            </div>

            {/* Right: illustration + mock result card */}
            <div>
              {/* IA illustration */}
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
                <div style={{
                  width: 160,
                  height: 160,
                  borderRadius: 32,
                  background: 'rgba(139,92,246,0.08)',
                  border: '1px solid rgba(139,92,246,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 60px rgba(139,92,246,0.15)',
                }}>
                  <Image src="/widgets/analyseIA.svg" alt="" width={112} height={112} unoptimized style={{ objectFit: 'contain' }} />
                </div>
              </div>

            <div style={{ borderRadius: 20, padding: 28, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 20, marginBottom: 20, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <div>
                  <p style={{ fontSize: 12, color: '#52525b', marginBottom: 4 }}>Annonce analysée</p>
                  <p style={{ fontWeight: 600, color: 'white', fontSize: 15 }}>Appartement 2p — Lyon 3e</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: 12, color: '#52525b', marginBottom: 4 }}>Score IA</p>
                  <p style={{ fontSize: '1.9rem', fontWeight: 900, color: '#34d399', lineHeight: 1 }}>87<span style={{ fontSize: 14, color: '#52525b', fontWeight: 400 }}>/100</span></p>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0, marginBottom: 20 }}>
                {[
                  { l: 'Prix au m²', v: '3 850 €', t: '−8% vs marché' },
                  { l: 'Cash-flow mensuel', v: '+124 €', t: 'Autofinancé ✓' },
                  { l: 'Rentabilité nette', v: '5,8%', t: 'Bon niveau' },
                  { l: 'Taux de vacance', v: '3,2%', t: 'Zone tendue' },
                ].map(({ l, v, t }) => (
                  <div key={l} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <span style={{ fontSize: 14, color: '#71717a' }}>{l}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: 'white' }}>{v}</span>
                      <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: '40px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', color: '#34d399' }}>{t}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ borderRadius: 12, padding: '16px 18px', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)' }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#34d399', marginBottom: 6 }}>Verdict IA</p>
                <p style={{ fontSize: 13, color: '#a1a1aa', lineHeight: 1.6 }}>"Excellent rapport qualité-prix dans une zone tendue. Le bien s'autofinance et le prix est sous le marché. À saisir."</p>
              </div>
            </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════ PRICING ══════════════════ */}
      <section id="pricing" style={{ padding: '120px 0', borderTop: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.015)' }}>
        <div style={{ width: '100%', maxWidth: 1152, marginLeft: 'auto', marginRight: 'auto', paddingLeft: 32, paddingRight: 32, boxSizing: 'border-box' }}>

          <div className="text-center" style={{ marginBottom: 72 }}>
            <p style={{ color: '#f59e0b', fontSize: 13, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 20 }}>Tarifs</p>
            <h2 style={{ fontSize: 'clamp(2rem,5vw,3.25rem)', fontWeight: 900, lineHeight: 1.1, letterSpacing: '-0.02em', marginBottom: 16 }}>Simple et transparent</h2>
            <p style={{ color: '#71717a', fontSize: '1.1rem' }}>Commencez gratuitement. Passez Premium quand vous en avez besoin.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Free */}
            <div
              className="w-full"
              style={{ borderRadius: 24, padding: '40px 36px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)' }}
            >
              <p style={{ fontSize: 12, fontWeight: 700, color: '#52525b', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 24 }}>Gratuit</p>
              <div style={{ marginBottom: 8 }}>
                <span style={{ fontSize: '3.25rem', fontWeight: 900, color: 'white', lineHeight: 1 }}>0 €</span>
              </div>
              <p style={{ fontSize: 14, color: '#52525b', marginBottom: 36 }}>Pour toujours, sans carte bancaire</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 36 }}>
                {['Score de faisabilité bancaire', 'Évolution des prix du marché', '3 analyses IA par mois', 'Rapport résumé'].map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 14, color: '#a1a1aa' }}>
                    <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <svg style={{ width: 11, height: 11, color: '#71717a' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    </div>
                    {f}
                  </div>
                ))}
              </div>
              <Link
                href="/register"
                className="block w-full text-center font-semibold text-white transition-all duration-200 hover:bg-white/10"
                style={{ padding: '14px 24px', borderRadius: '40px', fontSize: 15, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)' }}
              >
                Commencer gratuitement
              </Link>
            </div>

            {/* Premium */}
            <div
              className="w-full"
              style={{ borderRadius: 24, padding: '40px 36px', border: '1px solid rgba(139,92,246,0.5)', background: 'linear-gradient(160deg,rgba(91,33,182,0.25) 0%,rgba(0,0,0,0.6) 60%)', position: 'relative', overflow: 'hidden', boxShadow: '0 0 60px rgba(139,92,246,0.15)' }}
            >
              <div style={{ position: 'absolute', top: 20, right: 20, padding: '5px 14px', borderRadius: '40px', background: 'linear-gradient(135deg,#8b5cf6,#4f46e5)', fontSize: 11, fontWeight: 800, color: 'white', letterSpacing: '0.05em' }}>POPULAIRE</div>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#a78bfa', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 24 }}>Premium</p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 8 }}>
                <span style={{ fontSize: '3.25rem', fontWeight: 900, color: 'white', lineHeight: 1 }}>9,90 €</span>
                <span style={{ fontSize: 14, color: '#71717a' }}>/mois</span>
              </div>
              <p style={{ fontSize: 14, color: '#52525b', marginBottom: 36 }}>Résiliable à tout moment</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 36 }}>
                {['Tout le plan Gratuit', 'Accès aux 6 outils premium', 'Analyses IA illimitées', 'Rapport complet détaillé', 'Zones accessibles personnalisées', 'Tension locative en temps réel'].map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 14, color: '#d4d4d8' }}>
                    <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <svg style={{ width: 11, height: 11, color: '#a78bfa' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    </div>
                    {f}
                  </div>
                ))}
              </div>
              <Link
                href="/register"
                className="block w-full text-center font-semibold text-white transition-all duration-200 hover:opacity-90 hover:-translate-y-px"
                style={{ padding: '14px 24px', borderRadius: '40px', fontSize: 15, background: 'linear-gradient(135deg,#8b5cf6,#4f46e5)', boxShadow: '0 8px 28px rgba(139,92,246,0.4)' }}
              >
                Démarrer l'essai gratuit
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════ CTA FINAL ══════════════════ */}
      <section style={{ padding: '120px 0', position: 'relative', overflow: 'hidden', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="absolute inset-0 pointer-events-none" style={{ mixBlendMode: 'screen' }}>
          <Image src="/hero2.svg" alt="" fill style={{ objectFit: 'cover', objectPosition: 'center top', opacity: 0.22 }} />
        </div>
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 60% 60% at 50% 50%, rgba(139,92,246,0.12) 0%, transparent 70%)' }} />
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'rgba(0,0,0,0.6)' }} />

        <div className="relative text-center" style={{ width: '100%', maxWidth: 1152, marginLeft: 'auto', marginRight: 'auto', paddingLeft: 32, paddingRight: 32, boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
            <BrandMark height={60} />
          </div>
          <h2 style={{ fontSize: 'clamp(2rem,5vw,3.25rem)', fontWeight: 900, lineHeight: 1.1, letterSpacing: '-0.02em', marginBottom: 20 }}>
            Votre prochain bien<br />
            <span style={{ background: 'linear-gradient(135deg,#c4b5fd,#818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              commence ici.
            </span>
          </h2>
          <p style={{ color: '#71717a', fontSize: '1.1rem', marginBottom: 40, maxWidth: 420, margin: '0 auto 40px' }}>
            Rejoignez des centaines de primo-accédants qui investissent avec confiance grâce à BrickByBrick.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-3 font-bold text-white transition-all duration-200 hover:-translate-y-0.5 hover:opacity-90"
            style={{ padding: '16px 40px', borderRadius: '40px', fontSize: '1.05rem', background: 'linear-gradient(135deg,#8b5cf6,#4f46e5)', boxShadow: '0 12px 40px rgba(139,92,246,0.5)' }}
          >
            Créer mon compte gratuit
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
          </Link>
          <p style={{ marginTop: 20, fontSize: 13, color: '#3f3f46' }}>Aucune carte bancaire requise • Gratuit pour toujours</p>
        </div>
      </section>

      {/* ══════════════════ FOOTER ══════════════════ */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.07)', padding: '40px 0' }}>
        <div className="flex flex-col md:flex-row items-center justify-between gap-4" style={{ width: '100%', maxWidth: 1152, marginLeft: 'auto', marginRight: 'auto', paddingLeft: 32, paddingRight: 32, boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <BrandMark height={28} />
            <span style={{ color: '#3f3f46', fontSize: 13, display: 'none' }} className="md:inline">— Investissement immobilier intelligent</span>
          </div>
          <p style={{ color: '#3f3f46', fontSize: 13 }}>Données : transactions notariales françaises • © 2026 BrickByBrick</p>
        </div>
      </footer>
    </div>
  );
}
