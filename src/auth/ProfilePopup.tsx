import React, { useState } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import {
  X, BadgeCheck, KeyRound, LogOut, ShieldAlert, Loader2, Mail,
} from 'lucide-react';
import { auth } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';

interface ProfilePopupProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
  onOpenAdmin: () => void;
}

const ROLE_LABELS: Record<string, string> = {
  pending: 'Menunggu Verifikasi',
  doctor: 'Dokter',
  resident: 'Residen',
  specialist: 'Spesialis',
  admin: 'Admin',
};

const MONTHS_ID = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

function formatDateID(d: Date): string {
  return `${String(d.getDate()).padStart(2, '0')} ${MONTHS_ID[d.getMonth()]} ${d.getFullYear()}`;
}

function getRawDate(val: any): Date | null {
  if (!val) return null;
  if (val?.toDate) return val.toDate();
  if (val instanceof Date) return val;
  if (typeof val === 'string' || typeof val === 'number') return new Date(val);
  if (val?.seconds) return new Date(val.seconds * 1000);
  return null;
}

export function ProfilePopup({ isOpen, onClose, onLogout, onOpenAdmin }: ProfilePopupProps) {
  const { user, userProfile } = useAuth();
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  if (!isOpen) return null;

  const isAdmin = userProfile?.role === 'admin' || (user?.email || '').trim().toLowerCase() === 'driverizqanf@gmail.com';
  const displayName = userProfile?.namaLengkap || userProfile?.username || user?.email || 'Pengguna';
  const initials = displayName.trim().slice(0, 1).toUpperCase();

  const expiredDate = getRawDate(userProfile?.subscriptionExpiredAt);
  const isExpired = !!expiredDate && expiredDate < new Date();

  let statusLabel = 'Tidak Aktif';
  let statusColor = 'var(--label-tertiary)';
  let statusBg = 'var(--fill-tertiary)';
  let statusSub = '';

  if (isExpired) {
    statusLabel = 'Kedaluwarsa';
    statusColor = 'var(--danger)';
    statusBg = 'rgba(255,59,48,0.10)';
    statusSub = expiredDate ? `Akses berakhir: ${formatDateID(expiredDate)}` : '';
  } else if (userProfile?.subscriptionStatus === 'active') {
    statusLabel = 'Aktif';
    statusColor = 'var(--success)';
    statusBg = 'rgba(52,199,89,0.10)';
    statusSub = expiredDate ? `Berlaku hingga: ${formatDateID(expiredDate)}` : 'Seumur hidup';
  } else if (userProfile?.subscriptionStatus === 'trial') {
    statusLabel = 'Masa Trial';
    statusColor = 'var(--warning)';
    statusBg = 'rgba(255,149,0,0.10)';
    statusSub = expiredDate ? `Berlaku hingga: ${formatDateID(expiredDate)}` : 'Seumur hidup';
  }

  const handleResetPassword = async () => {
    if (!user?.email) return;
    setResetLoading(true);
    setResetSent(false);
    try {
      await sendPasswordResetEmail(auth, user.email);
      setResetSent(true);
    } catch (err) {
      console.error('Failed to send password reset email:', err);
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <>
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0, zIndex: 400,
        background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
        animation: 'acls-fadein 180ms ease both',
      }}/>
      <div style={{
        position: 'fixed', inset: 0, zIndex: 401, display: 'flex', alignItems: 'center',
        justifyContent: 'center', padding: '24px 16px', pointerEvents: 'none',
      }}>
        <div style={{
          width: '100%', maxWidth: 360, background: 'var(--bg-primary)', borderRadius: 22,
          boxShadow: '0 8px 48px rgba(0,0,0,0.28), 0 0 0 0.5px var(--separator)',
          pointerEvents: 'auto', animation: 'acls-fadeslide 200ms var(--ease-out) both',
          overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{ padding: '20px 20px 16px', textAlign: 'center', position: 'relative' }}>
            <button onClick={onClose} style={{
              position: 'absolute', top: 12, right: 12, background: 'var(--fill-tertiary)',
              border: 0, borderRadius: 8, width: 28, height: 28, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--label-secondary)',
            }}><X size={14}/></button>

            <div style={{
              width: 64, height: 64, borderRadius: '50%', margin: '0 auto 10px',
              background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.5rem', fontWeight: 700, color: '#fff',
            }}>{initials}</div>

            <div style={{ fontWeight: 700, fontSize: '1.0625rem', color: 'var(--label-primary)' }}>{displayName}</div>
            {userProfile?.username && (
              <div style={{ fontSize: '0.8125rem', color: 'var(--label-secondary)', marginTop: 1 }}>@{userProfile.username}</div>
            )}

            <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.6875rem', fontWeight: 700, padding: '3px 10px', borderRadius: 8,
                background: 'var(--fill-tertiary)', color: 'var(--label-secondary)' }}>
                {ROLE_LABELS[userProfile?.role || ''] || userProfile?.role || '—'}
              </span>
              <span style={{ fontSize: '0.6875rem', fontWeight: 700, padding: '3px 10px', borderRadius: 8,
                display: 'inline-flex', alignItems: 'center', gap: 4,
                background: user?.emailVerified ? 'rgba(52,199,89,0.12)' : 'rgba(142,142,147,0.12)',
                color: user?.emailVerified ? 'var(--success)' : 'var(--label-tertiary)' }}>
                {user?.emailVerified ? <BadgeCheck size={11}/> : <Mail size={11}/>}
                {user?.emailVerified ? 'Email Terverifikasi' : 'Email Belum Verifikasi'}
              </span>
            </div>
          </div>

          {/* Subscription status */}
          <div style={{ padding: '0 20px 16px' }}>
            <div style={{ padding: '12px 14px', borderRadius: 12, background: statusBg }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: statusColor, flexShrink: 0 }}/>
                <span style={{ fontWeight: 700, fontSize: '0.875rem', color: statusColor }}>{statusLabel}</span>
              </div>
              {statusSub && (
                <div style={{ fontSize: '0.75rem', color: 'var(--label-secondary)', marginTop: 4 }}>{statusSub}</div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div style={{ padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {isAdmin && (
              <button onClick={onOpenAdmin} style={{
                width: '100%', padding: '12px 14px', borderRadius: 12, border: 0, cursor: 'pointer',
                background: 'var(--fill-quaternary)', display: 'flex', alignItems: 'center', gap: 10,
                boxShadow: 'inset 0 0 0 0.5px var(--separator)',
              }}>
                <ShieldAlert size={16} style={{ color: 'var(--accent)' }}/>
                <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--label-primary)' }}>Panel Admin</span>
              </button>
            )}

            <button onClick={handleResetPassword} disabled={resetLoading} style={{
              width: '100%', padding: '12px 14px', borderRadius: 12, border: 0, cursor: 'pointer',
              background: 'var(--fill-quaternary)', display: 'flex', alignItems: 'center', gap: 10,
              boxShadow: 'inset 0 0 0 0.5px var(--separator)',
            }}>
              {resetLoading ? (
                <Loader2 size={16} style={{ color: 'var(--label-secondary)', animation: 'acls-spin 0.8s linear infinite' }}/>
              ) : (
                <KeyRound size={16} style={{ color: 'var(--label-secondary)' }}/>
              )}
              <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--label-primary)' }}>
                {resetSent ? 'Email Terkirim ✓' : 'Ganti Password'}
              </span>
            </button>

            <button onClick={onLogout} style={{
              width: '100%', padding: '12px 14px', borderRadius: 12, border: 0, cursor: 'pointer',
              background: 'rgba(255,59,48,0.10)', display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <LogOut size={16} style={{ color: 'var(--danger)' }}/>
              <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--danger)' }}>Keluar</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
