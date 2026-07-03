import React, { useState, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
} from 'firebase/auth';
import { Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { auth } from '../lib/firebase';

interface LoginPageProps {
  onGoToSignUp: () => void;
  onLoginSuccess: () => void;
}

function mapAuthError(code: string): string {
  switch (code) {
    case 'auth/invalid-email': return 'Format email tidak valid.';
    case 'auth/user-disabled': return 'Akun ini telah dinonaktifkan.';
    case 'auth/user-not-found': return 'Email tidak terdaftar.';
    case 'auth/wrong-password': return 'Password salah.';
    case 'auth/invalid-credential': return 'Email atau password salah.';
    case 'auth/too-many-requests': return 'Terlalu banyak percobaan. Silakan coba lagi nanti.';
    default: return 'Terjadi kesalahan. Silakan coba lagi.';
  }
}

export function LoginPage({ onGoToSignUp, onLoginSuccess }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getRedirectResult(auth)
      .then((result) => {
        if (result) onLoginSuccess();
      })
      .catch((err) => {
        if (err?.code) setError(mapAuthError(err.code));
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setError('');
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      onLoginSuccess();
    } catch (err: any) {
      setError(mapAuthError(err?.code || ''));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setGoogleLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      onLoginSuccess();
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/popup-blocked') {
        try {
          await signInWithRedirect(auth, provider);
        } catch {
          setError('Gagal login dengan Google.');
        }
      } else if (code !== 'auth/popup-closed-by-user' && code !== 'auth/cancelled-popup-request') {
        setError('Gagal login dengan Google.');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-secondary)', padding: '24px 16px',
    }}>
      <div style={{
        width: '100%', maxWidth: 400,
        background: 'var(--bg-primary)', borderRadius: 22,
        boxShadow: '0 8px 48px rgba(0,0,0,0.10), 0 0 0 0.5px var(--separator)',
        padding: '32px 28px',
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16, margin: '0 auto 14px',
            background: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="30" height="30" viewBox="0 0 24 24" fill="#fff">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
            </svg>
          </div>
          <div style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--label-primary)', letterSpacing: '-0.02em' }}>
            ACLS Helper
          </div>
          <div style={{ fontSize: '0.875rem', color: 'var(--label-secondary)', marginTop: 4 }}>
            Masuk untuk melanjutkan
          </div>
        </div>

        {error && (
          <div style={{
            padding: '10px 14px', borderRadius: 10, background: 'rgba(255,59,48,0.10)',
            color: 'var(--danger)', fontSize: '0.8125rem', marginBottom: 16, lineHeight: 1.4,
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 14 }}>
            <label className="t-caption-2" style={{ color: 'var(--label-secondary)', fontWeight: 700,
              letterSpacing: '0.04em', display: 'block', marginBottom: 6 }}>EMAIL</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--label-tertiary)' }}/>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="nama@email.com" autoComplete="email" required
                style={{ width: '100%', padding: '11px 14px 11px 40px', borderRadius: 10,
                  border: '1px solid var(--separator)', background: 'var(--fill-quaternary)',
                  color: 'var(--label-primary)', fontSize: '0.9375rem', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label className="t-caption-2" style={{ color: 'var(--label-secondary)', fontWeight: 700,
              letterSpacing: '0.04em', display: 'block', marginBottom: 6 }}>PASSWORD</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--label-tertiary)' }}/>
              <input
                type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" autoComplete="current-password" required
                style={{ width: '100%', padding: '11px 40px 11px 40px', borderRadius: 10,
                  border: '1px solid var(--separator)', background: 'var(--fill-quaternary)',
                  color: 'var(--label-primary)', fontSize: '0.9375rem', boxSizing: 'border-box' }}
              />
              <button type="button" onClick={() => setShowPassword(v => !v)}
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 0, cursor: 'pointer', color: 'var(--label-tertiary)',
                  display: 'flex', alignItems: 'center', padding: 4 }}>
                {showPassword ? <EyeOff size={16}/> : <Eye size={16}/>}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading || googleLoading} style={{
            width: '100%', padding: '13px', borderRadius: 12, border: 0,
            background: loading ? 'var(--fill-secondary)' : 'var(--accent)',
            color: loading ? 'var(--label-quaternary)' : 'var(--accent-fg)',
            fontSize: '0.9375rem', fontWeight: 700, cursor: loading ? 'default' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
            {loading ? <Loader2 size={16} style={{ animation: 'acls-spin 0.8s linear infinite' }}/> : 'Masuk'}
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '20px 0' }}>
          <div style={{ flex: 1, height: 1, background: 'var(--separator)' }}/>
          <span style={{ fontSize: '0.75rem', color: 'var(--label-tertiary)' }}>ATAU</span>
          <div style={{ flex: 1, height: 1, background: 'var(--separator)' }}/>
        </div>

        <button onClick={handleGoogleLogin} disabled={loading || googleLoading} type="button" style={{
          width: '100%', padding: '12px', borderRadius: 12,
          border: '1px solid var(--separator)', background: 'var(--bg-primary)',
          color: 'var(--label-primary)', fontSize: '0.9375rem', fontWeight: 600,
          cursor: googleLoading ? 'default' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
        }}>
          {googleLoading ? (
            <Loader2 size={16} style={{ animation: 'acls-spin 0.8s linear infinite' }}/>
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.5 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.87c2.26-2.09 3.56-5.17 3.56-8.82z"/>
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.87-3c-1.08.72-2.45 1.16-4.06 1.16-3.13 0-5.78-2.11-6.73-4.96H1.27v3.09C3.24 21.3 7.29 24 12 24z"/>
                <path fill="#FBBC05" d="M5.27 14.29a7.24 7.24 0 010-4.58V6.62H1.27a12 12 0 000 10.76l4-3.09z"/>
                <path fill="#EA4335" d="M12 4.75c1.76 0 3.35.61 4.6 1.8l3.44-3.44C17.94 1.19 15.24 0 12 0 7.29 0 3.24 2.7 1.27 6.62l4 3.09C6.22 6.86 8.87 4.75 12 4.75z"/>
              </svg>
              Masuk dengan Google
            </>
          )}
        </button>

        <div style={{ textAlign: 'center', marginTop: 22 }}>
          <span style={{ fontSize: '0.875rem', color: 'var(--label-secondary)' }}>Belum punya akun? </span>
          <button onClick={onGoToSignUp} type="button" style={{
            background: 'none', border: 0, cursor: 'pointer',
            color: 'var(--accent)', fontSize: '0.875rem', fontWeight: 700,
          }}>Daftar</button>
        </div>
      </div>
    </div>
  );
}
