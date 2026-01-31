'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';

export default function RegisterPage() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    if (!/[A-Z]/.test(password)) {
      setError('Le mot de passe doit contenir au moins une majuscule');
      return;
    }

    if (!/[0-9]/.test(password)) {
      setError('Le mot de passe doit contenir au moins un chiffre');
      return;
    }

    setIsLoading(true);

    try {
      await register(email, password, firstName, lastName);
      router.push('/');
    } catch (err) {
      console.error('Register error:', err);
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center" style={{ padding: '48px' }}>
      <div style={{ width: '100%', maxWidth: '520px' }}>
        
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '56px' }}>
          <Link href="/" className="inline-block">
            <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>
              <span className="text-white">Brick</span>
              <span className="bg-gradient-to-r from-[var(--primary-light)] to-[var(--accent-cyan)] bg-clip-text text-transparent">ByBrick</span>
            </h1>
          </Link>
          <p style={{ color: 'var(--text-secondary)', marginTop: '16px', fontSize: '1.125rem' }}>
            Créez votre compte gratuitement
          </p>
        </div>

        {/* Card */}
        <div 
          className="bg-[var(--bg-card)] border border-[var(--border-color)]"
          style={{ borderRadius: '24px', padding: '48px' }}
        >
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            
            {/* Error */}
            {error && (
              <div 
                className="bg-rose-500/10 border border-rose-500/20"
                style={{ borderRadius: '16px', padding: '20px' }}
              >
                <p className="text-rose-400" style={{ fontSize: '0.9375rem' }}>{error}</p>
              </div>
            )}

            {/* Name Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <label style={{ fontSize: '1rem', fontWeight: '500', color: 'var(--text-secondary)' }}>
                  Prénom
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '18px 20px',
                    borderRadius: '14px',
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    color: 'white',
                    fontSize: '1rem',
                    outline: 'none'
                  }}
                  placeholder="Jean"
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <label style={{ fontSize: '1rem', fontWeight: '500', color: 'var(--text-secondary)' }}>
                  Nom
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '18px 20px',
                    borderRadius: '14px',
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    color: 'white',
                    fontSize: '1rem',
                    outline: 'none'
                  }}
                  placeholder="Dupont"
                />
              </div>
            </div>

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
                  padding: '18px 20px',
                  borderRadius: '14px',
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  color: 'white',
                  fontSize: '1rem',
                  outline: 'none'
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
                  padding: '18px 20px',
                  borderRadius: '14px',
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  color: 'white',
                  fontSize: '1rem',
                  outline: 'none'
                }}
                placeholder="••••••••"
              />
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Min. 8 caractères, 1 majuscule, 1 chiffre
              </p>
            </div>

            {/* Confirm Password */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <label style={{ fontSize: '1rem', fontWeight: '500', color: 'var(--text-secondary)' }}>
                Confirmer le mot de passe
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '18px 20px',
                  borderRadius: '14px',
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  color: 'white',
                  fontSize: '1rem',
                  outline: 'none'
                }}
                placeholder="••••••••"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '20px',
                borderRadius: '16px',
                background: 'linear-gradient(to right, var(--primary), var(--primary-light))',
                color: 'white',
                fontWeight: '600',
                fontSize: '1.125rem',
                border: 'none',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? 0.5 : 1,
                transition: 'opacity 0.2s',
                marginTop: '8px'
              }}
            >
              {isLoading ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                  <svg className="animate-spin" style={{ height: '24px', width: '24px' }} viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Création en cours...
                </span>
              ) : (
                'Créer mon compte'
              )}
            </button>
          </form>

          {/* Divider */}
          <div style={{ position: 'relative', margin: '36px 0' }}>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center' }}>
              <div style={{ width: '100%', borderTop: '1px solid var(--border-color)' }}></div>
            </div>
            <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
              <span style={{ padding: '0 20px', backgroundColor: 'var(--bg-card)', color: 'var(--text-muted)', fontSize: '0.9375rem' }}>
                ou
              </span>
            </div>
          </div>

          {/* Login Link */}
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '1rem' }}>
            Déjà un compte ?{' '}
            <Link href="/login" style={{ color: 'var(--primary-light)', fontWeight: '500' }}>
              Se connecter
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
