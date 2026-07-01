import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LoginPage } from './LoginPage';
import { SignUpPage } from './SignUpPage';
import { AdminPage } from './AdminPage';

type AuthScreen = 'login' | 'signup' | 'admin';

interface AuthGateProps {
  children: React.ReactNode;
}

export function AuthGate({ children }: AuthGateProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const [screen, setScreen] = useState<AuthScreen>('login');

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--bg-secondary)'
      }}>
        <p style={{ color: 'var(--label-secondary)', fontSize: 14, fontWeight: 600 }}>
          Memuat...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    if (screen === 'signup') {
      return <SignUpPage onGoToLogin={() => setScreen('login')} />;
    }
    return <LoginPage
      onGoToSignUp={() => setScreen('signup')}
      onLoginSuccess={() => setScreen('login')}
    />;
  }

  if (screen === 'admin') {
    return <AdminPage onBack={() => setScreen('login')} />;
  }

  return (
    <>
      {children}
    </>
  );
}

export function useAuthNavigation() {
  const [screen, setScreen] = useState<AuthScreen>('login');
  return {
    goToAdmin: () => setScreen('admin'),
    goToLogin: () => setScreen('login'),
    currentScreen: screen,
  };
}
