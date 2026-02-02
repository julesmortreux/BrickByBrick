'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';

const PUBLIC_ROUTES = ['/login', '/register', '/onboarding'];

export function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, user, isLoading } = useAuth();

  useEffect(() => {
    // Ne pas vérifier si on est sur une route publique
    if (PUBLIC_ROUTES.includes(pathname)) {
      return;
    }

    // Ne pas vérifier si on charge encore
    if (isLoading) {
      return;
    }

    // Si l'utilisateur est authentifié mais n'a pas complété l'onboarding
    if (isAuthenticated && user && !user.onboarding_completed) {
      router.push('/onboarding');
    }
  }, [isAuthenticated, user, isLoading, pathname, router]);

  return <>{children}</>;
}
