import React, { useState, useEffect } from 'react';
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { User, Mail, Lock, AtSign, Loader2, CheckCircle2, MessageCircle } from 'lucide-react';
import { auth, db } from '../lib/firebase';

interface SignUpPageProps {
  onGoToLogin: () => void;
}

const WHATSAPP_NUMBER = '6287749076019';

function mapAuthError(code: string): string {
  switch (code) {
    case 'auth/email-already-in-use': return 'Email sudah terdaftar. Silakan masuk.';
    case 'auth/invalid-email': return 'Format email tidak valid.';
    case 'auth/weak-password': return 'Password terlalu lemah (minimal 6 karakter).';
    default: return 'Terjadi kesalahan. Silakan coba lagi.';
  }
}

export function SignUpPage({ onGoToLogin }: SignUpPageProps) {
  const [namaLengkap, setNamaLengkap] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!submitted) return;
    const t = setTimeout(() => onGoToLogin(), 3000);
    return () => clearTimeout(t);
  }, [submitted, onGoToLogin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!namaLengkap.trim() || !username.trim() || !email.trim() || !password) {
      setError('Semua kolom wajib diisi.');
      return;
    }
    if (password.length < 6) {
      setError('Password minimal 6 karakter.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Konfirmasi password tidak sama.');
      return;
    }

    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await setDoc(doc(db, 'users', cred.user.uid), {
        uid: cred.user.uid,
        email: email.trim(),
        username: username.trim(),
        namaLengkap: namaLengkap.trim(),
        role: 'pending',
        verificationStatus: 'unverified',
        isAdmin: false,
        subscriptionStatus: 'inactive',
        subscriptionPlan: null,
        subscriptionExpiredAt: null,
        profileCompleted: false,
        googleFormSubmitted: false,
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
      });
      // Sign out immediately — new accounts require manual verification/activation
      // before gaining app access, so we drop back to an unauthenticated state and
      // show the WhatsApp verification CTA rather than letting AuthGate render the app.
      await signOut(auth);
      setSubmitted(true);
    } catch (err: any) {
      setError(mapAuthError(err?.code || ''));
    } finally {
      setLoading(false);
    }
  };

  const waLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    `Hai dok, saya sudah daftar ACLS Helper MD Kit, username saya ${username.trim()}`
  )}`;

  if (submitted) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg-secondary)', padding: '24px 16px',
      }}>
        <div style={{
          width: '100%', maxWidth: 400, textAlign: 'center',
          background: 'var(--bg-primary)', borderRadius: 22,
          boxShadow: '0 8px 48px rgba(0,0,0,0.10), 0 0 0 0.5px var(--separator)',
          padding: '36px 28px',
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%', margin: '0 auto 18px',
            background: 'rgba(52,199,89,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <CheckCircle2 size={34} style={{ color: 'var(--success)' }}/>
          </div>
          <div style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--label-primary)', marginBottom: 10 }}>
            Pendaftaran Berhasil
          </div>
          <div style={{ fontSize: '0.9375rem', color: 'var(--label-secondary)', lineHeight: 1.6, marginBottom: 22 }}>
            Terima kasih telah mendaftar ACLS Helper! Silakan verifikasi akun dan status langganan Anda dengan menghubungi WhatsApp kami.
          </div>
          <a href={waLink} target="_blank" rel="noopener noreferrer" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            width: '100%', padding: '13px', borderRadius: 12, border: 0, textDecoration: 'none',
            background: '#25D366', color: '#fff', fontSize: '0.9375rem', fontWeight: 700, boxSizing: 'border-box',
          }}>
            <MessageCircle size={18}/> Hubungi via WhatsApp
          </a>
          <div style={{ fontSize: '0.8125rem', color: 'var(--label-tertiary)', marginTop: 16 }}>
            Mengalihkan ke halaman masuk...
          </div>
        </div>
      </div>
    );
  }

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
        <div style={{ textAlign: 'center', marginBottom: 26 }}>
          <div style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--label-primary)', letterSpacing: '-0.02em' }}>
            Buat Akun
          </div>
          <div style={{ fontSize: '0.875rem', color: 'var(--label-secondary)', marginTop: 4 }}>
            Daftar untuk mengakses ACLS Helper
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
              letterSpacing: '0.04em', display: 'block', marginBottom: 6 }}>NAMA LENGKAP</label>
            <div style={{ position: 'relative' }}>
              <User size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--label-tertiary)' }}/>
              <input value={namaLengkap} onChange={e => setNamaLengkap(e.target.value)}
                placeholder="dr. Nama Anda" autoComplete="name" required
                style={{ width: '100%', padding: '11px 14px 11px 40px', borderRadius: 10,
                  border: '1px solid var(--separator)', background: 'var(--fill-quaternary)',
                  color: 'var(--label-primary)', fontSize: '0.9375rem', boxSizing: 'border-box' }}/>
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label className="t-caption-2" style={{ color: 'var(--label-secondary)', fontWeight: 700,
              letterSpacing: '0.04em', display: 'block', marginBottom: 6 }}>USERNAME</label>
            <div style={{ position: 'relative' }}>
              <AtSign size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--label-tertiary)' }}/>
              <input value={username} onChange={e => setUsername(e.target.value)}
                placeholder="username" autoComplete="username" required
                style={{ width: '100%', padding: '11px 14px 11px 40px', borderRadius: 10,
                  border: '1px solid var(--separator)', background: 'var(--fill-quaternary)',
                  color: 'var(--label-primary)', fontSize: '0.9375rem', boxSizing: 'border-box' }}/>
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label className="t-caption-2" style={{ color: 'var(--label-secondary)', fontWeight: 700,
              letterSpacing: '0.04em', display: 'block', marginBottom: 6 }}>EMAIL</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--label-tertiary)' }}/>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="nama@email.com" autoComplete="email" required
                style={{ width: '100%', padding: '11px 14px 11px 40px', borderRadius: 10,
                  border: '1px solid var(--separator)', background: 'var(--fill-quaternary)',
                  color: 'var(--label-primary)', fontSize: '0.9375rem', boxSizing: 'border-box' }}/>
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label className="t-caption-2" style={{ color: 'var(--label-secondary)', fontWeight: 700,
              letterSpacing: '0.04em', display: 'block', marginBottom: 6 }}>PASSWORD</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--label-tertiary)' }}/>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="Minimal 6 karakter" autoComplete="new-password" required
                style={{ width: '100%', padding: '11px 14px 11px 40px', borderRadius: 10,
                  border: '1px solid var(--separator)', background: 'var(--fill-quaternary)',
                  color: 'var(--label-primary)', fontSize: '0.9375rem', boxSizing: 'border-box' }}/>
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label className="t-caption-2" style={{ color: 'var(--label-secondary)', fontWeight: 700,
              letterSpacing: '0.04em', display: 'block', marginBottom: 6 }}>KONFIRMASI PASSWORD</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--label-tertiary)' }}/>
              <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Ulangi password" autoComplete="new-password" required
                style={{ width: '100%', padding: '11px 14px 11px 40px', borderRadius: 10,
                  border: '1px solid var(--separator)', background: 'var(--fill-quaternary)',
                  color: 'var(--label-primary)', fontSize: '0.9375rem', boxSizing: 'border-box' }}/>
            </div>
          </div>

          <button type="submit" disabled={loading} style={{
            width: '100%', padding: '13px', borderRadius: 12, border: 0,
            background: loading ? 'var(--fill-secondary)' : 'var(--accent)',
            color: loading ? 'var(--label-quaternary)' : '#fff',
            fontSize: '0.9375rem', fontWeight: 700, cursor: loading ? 'default' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
            {loading ? <Loader2 size={16} style={{ animation: 'acls-spin 0.8s linear infinite' }}/> : 'Daftar'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 22 }}>
          <span style={{ fontSize: '0.875rem', color: 'var(--label-secondary)' }}>Sudah punya akun? </span>
          <button onClick={onGoToLogin} type="button" style={{
            background: 'none', border: 0, cursor: 'pointer',
            color: 'var(--accent)', fontSize: '0.875rem', fontWeight: 700,
          }}>Masuk</button>
        </div>
      </div>
    </div>
  );
}
