import React, { useState, useEffect, useMemo, useRef } from 'react';
import { collection, getDocs, doc, updateDoc, deleteDoc, setDoc, Timestamp, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import {
  ArrowLeft, Search, RefreshCw, Download, Upload, Pencil, Trash2,
  X, ShieldAlert, AlertTriangle, Loader2,
} from 'lucide-react';

interface AdminPageProps {
  onBack: () => void;
}

interface UserRow {
  uid: string;
  email: string;
  username: string;
  namaLengkap?: string;
  role: string;
  subscriptionStatus: string;
  verificationStatus?: string;
  subscriptionExpiredAt?: any;
  createdAt?: any;
  lastLogin?: any;
  [key: string]: any;
}

type StatusFilter = 'all' | 'active' | 'trial' | 'inactive';

const ROLE_OPTIONS = ['pending', 'doctor', 'resident', 'specialist', 'admin'];
const SUB_STATUS_OPTIONS = ['inactive', 'trial', 'active', 'expired'];
const VERIFICATION_OPTIONS = ['unverified', 'verified'];

function tsToDateInput(val: any): string {
  if (!val) return '';
  const d = val?.toDate ? val.toDate() : new Date(val);
  if (isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

function tsToDisplay(val: any): string {
  if (!val) return '—';
  const d = val?.toDate ? val.toDate() : new Date(val);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
}

export function AdminPage({ onBack }: AdminPageProps) {
  const { user, userProfile } = useAuth();
  const isAdmin = userProfile?.role === 'admin' || (user?.email || '').trim().toLowerCase() === 'driverizqanf@gmail.com';

  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [editingUser, setEditingUser] = useState<UserRow | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingUser, setDeletingUser] = useState<UserRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [importPreview, setImportPreview] = useState<UserRow[] | null>(null);
  const [importStep, setImportStep] = useState<1 | 2 | null>(null);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(query(collection(db, 'users'), orderBy('createdAt', 'desc')));
      setUsers(snap.docs.map(d => ({ uid: d.id, ...d.data() } as UserRow)));
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (isAdmin) loadUsers(); }, [isAdmin]);

  const filtered = useMemo(() => {
    let list = users;
    if (statusFilter !== 'all') list = list.filter(u => u.subscriptionStatus === statusFilter);
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(u =>
        (u.namaLengkap || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q) ||
        (u.username || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [users, statusFilter, search]);

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(users, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `acls-helper-users-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(String(ev.target?.result));
        if (!Array.isArray(parsed)) throw new Error('not array');
        setImportPreview(parsed);
        setImportStep(1);
      } catch {
        window.alert('File JSON tidak valid. Pastikan file adalah hasil export dari halaman ini.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const confirmImport = async () => {
    if (!importPreview) return;
    setImporting(true);
    try {
      for (const row of importPreview) {
        if (!row.uid) continue;
        await setDoc(doc(db, 'users', row.uid), row, { merge: true });
      }
      await loadUsers();
      setImportPreview(null);
      setImportStep(null);
    } catch (err) {
      console.error('Import failed:', err);
      window.alert('Import gagal. Silakan coba lagi.');
    } finally {
      setImporting(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;
    setSavingEdit(true);
    try {
      const expiredDate = editingUser.subscriptionExpiredAt;
      await updateDoc(doc(db, 'users', editingUser.uid), {
        namaLengkap: editingUser.namaLengkap || '',
        email: editingUser.email || '',
        role: editingUser.role,
        subscriptionStatus: editingUser.subscriptionStatus,
        verificationStatus: editingUser.verificationStatus || 'unverified',
        subscriptionExpiredAt: expiredDate ? Timestamp.fromDate(new Date(expiredDate)) : null,
      });
      await loadUsers();
      setEditingUser(null);
    } catch (err) {
      console.error('Save failed:', err);
      window.alert('Gagal menyimpan perubahan.');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingUser) return;
    setDeleting(true);
    try {
      await deleteDoc(doc(db, 'users', deletingUser.uid));
      await loadUsers();
      setDeletingUser(null);
    } catch (err) {
      console.error('Delete failed:', err);
      window.alert('Gagal menghapus data pengguna.');
    } finally {
      setDeleting(false);
    }
  };

  if (!isAdmin) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg-secondary)', padding: 24 }}>
        <div style={{ textAlign: 'center', maxWidth: 340 }}>
          <ShieldAlert size={40} style={{ color: 'var(--danger)', marginBottom: 14 }}/>
          <div style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--label-primary)', marginBottom: 6 }}>
            Akses Ditolak
          </div>
          <div style={{ fontSize: '0.875rem', color: 'var(--label-secondary)', marginBottom: 20 }}>
            Anda tidak memiliki izin untuk mengakses halaman ini.
          </div>
          <button onClick={onBack} style={{
            padding: '10px 22px', borderRadius: 10, border: 0, cursor: 'pointer',
            background: 'var(--accent)', color: 'var(--accent-fg)', fontWeight: 600, fontSize: '0.875rem',
          }}>Kembali</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: '100vh', background: 'var(--bg-secondary)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ background: 'var(--bg-primary)', borderBottom: '0.5px solid var(--separator)',
        padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        <button onClick={onBack} style={{ background: 'var(--fill-tertiary)', border: 0, borderRadius: 8,
          width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: 'var(--label-secondary)' }}>
          <ArrowLeft size={17}/>
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: '1.0625rem', color: 'var(--label-primary)' }}>Panel Admin</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--label-secondary)' }}>{users.length} pengguna terdaftar</div>
        </div>
        <button onClick={loadUsers} disabled={loading} title="Refresh" style={{
          background: 'var(--fill-tertiary)', border: 0, borderRadius: 8, width: 34, height: 34,
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--label-secondary)',
        }}>
          <RefreshCw size={16} style={{ animation: loading ? 'acls-spin 0.8s linear infinite' : 'none' }}/>
        </button>
        <button onClick={handleExport} title="Export JSON" style={{
          background: 'var(--fill-tertiary)', border: 0, borderRadius: 8, width: 34, height: 34,
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--label-secondary)',
        }}>
          <Download size={16}/>
        </button>
        <button onClick={() => fileInputRef.current?.click()} title="Import JSON" style={{
          background: 'var(--fill-tertiary)', border: 0, borderRadius: 8, width: 34, height: 34,
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--label-secondary)',
        }}>
          <Upload size={16}/>
        </button>
        <input ref={fileInputRef} type="file" accept="application/json" onChange={handleFileSelect} style={{ display: 'none' }}/>
      </div>

      {/* Filters */}
      <div style={{ padding: '14px 20px 0', display: 'flex', gap: 10, flexWrap: 'wrap', flexShrink: 0 }}>
        <div style={{ flex: '1 1 220px', position: 'relative' }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--label-tertiary)' }}/>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari nama, email, atau username…"
            style={{ width: '100%', padding: '9px 12px 9px 36px', borderRadius: 10, border: '1px solid var(--separator)',
              background: 'var(--bg-primary)', color: 'var(--label-primary)', fontSize: '0.875rem', boxSizing: 'border-box' }}/>
        </div>
        <div style={{ display: 'flex', background: 'var(--fill-quaternary)', borderRadius: 10, padding: 3, gap: 2 }}>
          {(['all', 'active', 'trial', 'inactive'] as StatusFilter[]).map(f => (
            <button key={f} onClick={() => setStatusFilter(f)} style={{
              padding: '7px 12px', borderRadius: 8, border: 0, cursor: 'pointer',
              background: statusFilter === f ? 'var(--bg-primary)' : 'none',
              color: statusFilter === f ? 'var(--label-primary)' : 'var(--label-secondary)',
              fontSize: '0.8125rem', fontWeight: statusFilter === f ? 700 : 500,
              boxShadow: statusFilter === f ? '0 1px 3px rgba(0,0,0,0.12)' : 'none',
            }}>
              {f === 'all' ? 'Semua' : f === 'active' ? 'Aktif' : f === 'trial' ? 'Trial' : 'Tidak Aktif'}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--label-tertiary)' }}>
            <Loader2 size={24} style={{ animation: 'acls-spin 0.8s linear infinite' }}/>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--label-tertiary)', fontSize: '0.875rem' }}>
            Tidak ada pengguna ditemukan.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filtered.map(u => (
              <div key={u.uid} style={{
                background: 'var(--bg-primary)', borderRadius: 14, padding: '14px 16px',
                boxShadow: 'var(--shadow-1)', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
              }}>
                <div style={{ flex: '1 1 220px', minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--label-primary)' }}>
                    {u.namaLengkap || u.username || '(Tanpa nama)'}
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--label-secondary)', marginTop: 1 }}>
                    {u.email} · @{u.username}
                  </div>
                </div>
                <span style={{ fontSize: '0.6875rem', fontWeight: 700, padding: '3px 9px', borderRadius: 7,
                  background: 'var(--fill-tertiary)', color: 'var(--label-secondary)' }}>{u.role}</span>
                <span style={{
                  fontSize: '0.6875rem', fontWeight: 700, padding: '3px 9px', borderRadius: 7,
                  background: u.subscriptionStatus === 'active' ? 'rgba(52,199,89,0.14)'
                    : u.subscriptionStatus === 'trial' ? 'rgba(255,149,0,0.14)'
                    : u.subscriptionStatus === 'expired' ? 'rgba(255,59,48,0.14)'
                    : 'var(--fill-tertiary)',
                  color: u.subscriptionStatus === 'active' ? 'var(--success)'
                    : u.subscriptionStatus === 'trial' ? 'var(--warning)'
                    : u.subscriptionStatus === 'expired' ? 'var(--danger)'
                    : 'var(--label-secondary)',
                }}>
                  {u.subscriptionStatus}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--label-tertiary)', minWidth: 100 }}>
                  {tsToDisplay(u.subscriptionExpiredAt)}
                </span>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => setEditingUser({ ...u, subscriptionExpiredAt: tsToDateInput(u.subscriptionExpiredAt) })}
                    style={{ width: 30, height: 30, borderRadius: 8, border: 0, cursor: 'pointer',
                      background: 'var(--fill-tertiary)', color: 'var(--label-secondary)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Pencil size={14}/>
                  </button>
                  <button onClick={() => setDeletingUser(u)}
                    style={{ width: 30, height: 30, borderRadius: 8, border: 0, cursor: 'pointer',
                      background: 'rgba(255,59,48,0.10)', color: 'var(--danger)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Trash2 size={14}/>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit modal */}
      {editingUser && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 400, display: 'flex', alignItems: 'center',
          justifyContent: 'center', background: 'rgba(0,0,0,0.45)', padding: 20 }}
          onClick={() => setEditingUser(null)}>
          <div onClick={e => e.stopPropagation()} style={{
            width: '100%', maxWidth: 420, background: 'var(--bg-primary)', borderRadius: 18,
            padding: 22, maxHeight: '90vh', overflowY: 'auto',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--label-primary)' }}>Edit Pengguna</div>
              <button onClick={() => setEditingUser(null)} style={{ background: 'none', border: 0, cursor: 'pointer', color: 'var(--label-tertiary)' }}>
                <X size={18}/>
              </button>
            </div>

            {[
              { label: 'Nama Lengkap', key: 'namaLengkap', type: 'text' },
              { label: 'Email', key: 'email', type: 'email' },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: 12 }}>
                <label className="t-caption-2" style={{ color: 'var(--label-secondary)', fontWeight: 700, display: 'block', marginBottom: 5 }}>{f.label}</label>
                <input type={f.type} value={editingUser[f.key] || ''}
                  onChange={e => setEditingUser({ ...editingUser, [f.key]: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 9, border: '1px solid var(--separator)',
                    background: 'var(--fill-quaternary)', color: 'var(--label-primary)', fontSize: '0.875rem', boxSizing: 'border-box' }}/>
              </div>
            ))}

            <div style={{ marginBottom: 12 }}>
              <label className="t-caption-2" style={{ color: 'var(--label-secondary)', fontWeight: 700, display: 'block', marginBottom: 5 }}>Role</label>
              <select value={editingUser.role} onChange={e => setEditingUser({ ...editingUser, role: e.target.value })}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 9, border: '1px solid var(--separator)',
                  background: 'var(--fill-quaternary)', color: 'var(--label-primary)', fontSize: '0.875rem' }}>
                {ROLE_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label className="t-caption-2" style={{ color: 'var(--label-secondary)', fontWeight: 700, display: 'block', marginBottom: 5 }}>Status Langganan</label>
              <select value={editingUser.subscriptionStatus} onChange={e => setEditingUser({ ...editingUser, subscriptionStatus: e.target.value })}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 9, border: '1px solid var(--separator)',
                  background: 'var(--fill-quaternary)', color: 'var(--label-primary)', fontSize: '0.875rem' }}>
                {SUB_STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label className="t-caption-2" style={{ color: 'var(--label-secondary)', fontWeight: 700, display: 'block', marginBottom: 5 }}>Status Verifikasi</label>
              <select value={editingUser.verificationStatus || 'unverified'} onChange={e => setEditingUser({ ...editingUser, verificationStatus: e.target.value })}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 9, border: '1px solid var(--separator)',
                  background: 'var(--fill-quaternary)', color: 'var(--label-primary)', fontSize: '0.875rem' }}>
                {VERIFICATION_OPTIONS.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>

            <div style={{ marginBottom: 18 }}>
              <label className="t-caption-2" style={{ color: 'var(--label-secondary)', fontWeight: 700, display: 'block', marginBottom: 5 }}>Berlaku Hingga</label>
              <input type="date" value={editingUser.subscriptionExpiredAt || ''}
                onChange={e => setEditingUser({ ...editingUser, subscriptionExpiredAt: e.target.value })}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 9, border: '1px solid var(--separator)',
                  background: 'var(--fill-quaternary)', color: 'var(--label-primary)', fontSize: '0.875rem', boxSizing: 'border-box' }}/>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setEditingUser(null)} style={{ flex: 1, padding: '11px', borderRadius: 10, border: '1px solid var(--separator)',
                background: 'none', color: 'var(--label-primary)', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' }}>
                Batal
              </button>
              <button onClick={handleSaveEdit} disabled={savingEdit} style={{ flex: 1, padding: '11px', borderRadius: 10, border: 0,
                background: 'var(--accent)', color: 'var(--accent-fg)', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                {savingEdit ? <Loader2 size={15} style={{ animation: 'acls-spin 0.8s linear infinite' }}/> : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deletingUser && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 400, display: 'flex', alignItems: 'center',
          justifyContent: 'center', background: 'rgba(0,0,0,0.45)', padding: 20 }}>
          <div style={{ width: '100%', maxWidth: 360, background: 'var(--bg-primary)', borderRadius: 18, padding: 22, textAlign: 'center' }}>
            <AlertTriangle size={32} style={{ color: 'var(--danger)', marginBottom: 12 }}/>
            <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--label-primary)', marginBottom: 6 }}>Hapus Pengguna?</div>
            <div style={{ fontSize: '0.875rem', color: 'var(--label-secondary)', marginBottom: 4, lineHeight: 1.5 }}>
              Data profil <strong>{deletingUser.namaLengkap || deletingUser.email}</strong> akan dihapus dari Firestore.
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--label-tertiary)', marginBottom: 20 }}>
              Akun Firebase Authentication tidak akan terhapus.
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setDeletingUser(null)} style={{ flex: 1, padding: '11px', borderRadius: 10, border: '1px solid var(--separator)',
                background: 'none', color: 'var(--label-primary)', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' }}>
                Batal
              </button>
              <button onClick={handleDelete} disabled={deleting} style={{ flex: 1, padding: '11px', borderRadius: 10, border: 0,
                background: 'var(--danger)', color: '#fff', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                {deleting ? <Loader2 size={15} style={{ animation: 'acls-spin 0.8s linear infinite' }}/> : 'Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import — step 1: preview */}
      {importStep === 1 && importPreview && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 400, display: 'flex', alignItems: 'center',
          justifyContent: 'center', background: 'rgba(0,0,0,0.45)', padding: 20 }}>
          <div style={{ width: '100%', maxWidth: 380, background: 'var(--bg-primary)', borderRadius: 18, padding: 22, textAlign: 'center' }}>
            <Upload size={30} style={{ color: 'var(--accent)', marginBottom: 12 }}/>
            <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--label-primary)', marginBottom: 6 }}>Import Data Pengguna</div>
            <div style={{ fontSize: '0.875rem', color: 'var(--label-secondary)', marginBottom: 20, lineHeight: 1.5 }}>
              File berisi <strong>{importPreview.length}</strong> data pengguna. Data yang cocok berdasarkan UID akan ditimpa.
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => { setImportStep(null); setImportPreview(null); }} style={{ flex: 1, padding: '11px', borderRadius: 10,
                border: '1px solid var(--separator)', background: 'none', color: 'var(--label-primary)', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' }}>
                Batal
              </button>
              <button onClick={() => setImportStep(2)} style={{ flex: 1, padding: '11px', borderRadius: 10, border: 0,
                background: 'var(--accent)', color: 'var(--accent-fg)', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer' }}>
                Lanjutkan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import — step 2: final warning */}
      {importStep === 2 && importPreview && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 401, display: 'flex', alignItems: 'center',
          justifyContent: 'center', background: 'rgba(0,0,0,0.45)', padding: 20 }}>
          <div style={{ width: '100%', maxWidth: 380, background: 'var(--bg-primary)', borderRadius: 18, padding: 22, textAlign: 'center' }}>
            <AlertTriangle size={32} style={{ color: 'var(--danger)', marginBottom: 12 }}/>
            <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--label-primary)', marginBottom: 6 }}>Konfirmasi Terakhir</div>
            <div style={{ fontSize: '0.875rem', color: 'var(--label-secondary)', marginBottom: 20, lineHeight: 1.5 }}>
              Tindakan ini akan menimpa data <strong>{importPreview.length}</strong> pengguna secara permanen. Lanjutkan?
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => { setImportStep(null); setImportPreview(null); }} disabled={importing} style={{ flex: 1, padding: '11px', borderRadius: 10,
                border: '1px solid var(--separator)', background: 'none', color: 'var(--label-primary)', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' }}>
                Batal
              </button>
              <button onClick={confirmImport} disabled={importing} style={{ flex: 1, padding: '11px', borderRadius: 10, border: 0,
                background: 'var(--danger)', color: '#fff', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                {importing ? <Loader2 size={15} style={{ animation: 'acls-spin 0.8s linear infinite' }}/> : 'Ya, Import Sekarang'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
