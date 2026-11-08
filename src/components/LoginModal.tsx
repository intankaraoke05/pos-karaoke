import React, { useState } from 'react';
import { Lock, User, ShieldCheck, KeyRound, Check, X, LogIn } from 'lucide-react';
import { UserAccount } from '../types';

interface LoginModalProps {
  users: UserAccount[];
  currentUser: UserAccount | null;
  onClose: () => void;
  onLogin: (user: UserAccount) => void;
  onOpenUserManagement?: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  users,
  currentUser,
  onClose,
  onLogin,
  onOpenUserManagement,
}) => {
  const [selectedUserId, setSelectedUserId] = useState<string>(users[0]?.id || '');
  const [pin, setPin] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const selectedUser = users.find((u) => u.id === selectedUserId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    if (pin === selectedUser.pin || pin === '1234') {
      onLogin(selectedUser);
      onClose();
    } else {
      setErrorMessage('PIN Kasir salah. Default demo PIN: 1234');
    }
  };

  const handleQuickLogin = (user: UserAccount) => {
    onLogin(user);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Login Admin & Kasir Karaoke</h3>
              <p className="text-xs text-slate-400">Pilih akun petugas atau ganti hak akses</p>
            </div>
          </div>
          {currentUser && (
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="p-6 space-y-5">
          {/* Quick Account Switcher Buttons */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300">
                Pilih Akun Petugas:
              </label>
              {onOpenUserManagement && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenUserManagement();
                  }}
                  className="text-[11px] font-semibold text-amber-400 hover:text-amber-300 transition-colors"
                >
                  + Kelola / Tambah Karyawan
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {users.map((u) => (
                <button
                  type="button"
                  key={u.id}
                  onClick={() => handleQuickLogin(u)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    currentUser?.id === u.id
                      ? 'bg-amber-500/10 border-amber-500/40 text-white'
                      : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">{u.name}</span>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                        u.role === 'admin'
                          ? 'bg-purple-500/20 text-purple-300'
                          : 'bg-cyan-500/20 text-cyan-300'
                      }`}
                    >
                      {u.role}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">Username: {u.username} (PIN: 1234)</div>
                </button>
              ))}
            </div>
          </div>

          {/* Form with PIN */}
          <form onSubmit={handleSubmit} className="pt-2 border-t border-slate-800 space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Pilih Akun Petugas</label>
              <select
                value={selectedUserId}
                onChange={(e) => {
                  setSelectedUserId(e.target.value);
                  setErrorMessage('');
                }}
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-amber-400"
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                <span>Masukkan PIN Keamanan</span>
              </label>
              <input
                type="password"
                maxLength={6}
                placeholder="Default: 1234"
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  setErrorMessage('');
                }}
                className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-700 rounded-lg text-white font-mono tracking-widest focus:outline-none focus:border-amber-400"
              />
            </div>

            {errorMessage && (
              <div className="text-xs text-red-400 font-medium">{errorMessage}</div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              {currentUser && (
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Batal
                </button>
              )}
              <button
                type="submit"
                className="w-full py-2.5 px-4 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-all shadow-md shadow-amber-400/20 flex items-center justify-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                <span>Masuk Aplikasi Kasir</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
