'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import Image from 'next/image';

function BrandMarkAuth({ height = 44 }: { height?: number }) {
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

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err) {
      console.error('Login error:', err);
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-[var(--bg-primary)] text-white flex items-center justify-center relative overflow-x-hidden"
      style={{ padding: '48px' }}
    >
      <div className="absolute inset-0 pointer-events-none opacity-30 bg-grid" />
      <div className="absolute inset-0 pointer-events-none opacity-30 bg-noise" />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(139,92,246,0.18) 0%, transparent 60%)' }}
      />

      <div style={{ width: '100%', maxWidth: '520px', position: 'relative', zIndex: 1 }}>
        
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '64px' }}>
          <Link href="/" className="inline-block">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
              <BrandMarkAuth height={46} />
              <span className="text-3xl font-black tracking-tight leading-none">
                <span className="text-white">Brick</span>
                <span className="text-violet-400">By</span>
                <span className="text-white">Brick</span>
              </span>
            </div>
          </Link>
          <p style={{ color: 'var(--text-secondary)', marginTop: '16px', fontSize: '1.125rem' }}>
            Connectez-vous à votre compte
          </p>
        </div>

        {/* Card */}
        <div 
          className="glass-card"
          style={{ borderRadius: '24px', padding: '48px', boxShadow: '0 30px 80px rgba(0,0,0,0.35)' }}
        >
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            
            {/* Error */}
            {error && (
              <div 
                className="bg-rose-500/10 border border-rose-500/20"
                style={{ borderRadius: '16px', padding: '20px' }}
              >
                <p className="text-rose-400" style={{ fontSize: '0.9375rem' }}>{error}</p>
              </div>
            )}

            {/* Email */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <label style={{ fontSize: '1rem', fontWeight: '500', color: 'var(--text-secondary)' }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '20px 24px',
                  borderRadius: '16px',
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  color: 'white',
                  fontSize: '1rem',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                placeholder="votre@email.com"
              />
            </div>

            {/* Password */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <label style={{ fontSize: '1rem', fontWeight: '500', color: 'var(--text-secondary)' }}>
                Mot de passe
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '20px 24px',
                  borderRadius: '16px',
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  color: 'white',
                  fontSize: '1rem',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                placeholder="••••••••"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="transition-all duration-200 hover:-translate-y-px hover:opacity-90"
              style={{
                width: '100%',
                padding: '16px 24px',
                borderRadius: '40px',
                background: 'linear-gradient(135deg,#8b5cf6,#4f46e5)',
                color: 'white',
                fontWeight: '700',
                fontSize: '1.05rem',
                lineHeight: 1,
                border: 'none',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? 0.5 : 1,
                boxShadow: '0 8px 30px rgba(139,92,246,0.5)',
                transition: 'opacity 0.2s, transform 0.2s',
                marginTop: '8px'
              }}
            >
              {isLoading ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                  <svg className="animate-spin" style={{ height: '24px', width: '24px' }} viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Connexion...
                </span>
              ) : (
                'Se connecter'
              )}
            </button>
          </form>

          {/* Divider */}
          <div style={{ position: 'relative', margin: '40px 0' }}>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center' }}>
              <div style={{ width: '100%', borderTop: '1px solid var(--border-color)' }}></div>
            </div>
            <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
              <span style={{ padding: '0 20px', backgroundColor: 'var(--bg-card)', color: 'var(--text-muted)', fontSize: '0.9375rem' }}>
                ou
              </span>
            </div>
          </div>

          {/* Register Link */}
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '1rem' }}>
            Pas encore de compte ?{' '}
            <Link href="/register" style={{ color: 'var(--primary-light)', fontWeight: '500' }}>
              Créer un compte
            </Link>
          </p>
        </div>

        {/* Back to Home */}
        <p style={{ textAlign: 'center', marginTop: '40px' }}>
          <Link href="/" style={{ color: 'var(--text-muted)', fontSize: '0.9375rem', transition: 'color 0.2s' }}>
            ← Retour à l'accueil
          </Link>
        </p>
      </div>
    </div>
  );
}
