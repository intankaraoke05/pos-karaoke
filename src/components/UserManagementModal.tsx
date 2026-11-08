import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Edit2,
  Trash2,
  KeyRound,
  ShieldCheck,
  User,
  Check,
  X,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { UserAccount } from '../types';
import { soundManager } from '../services/soundService';

interface UserManagementModalProps {
  users: UserAccount[];
  currentUser: UserAccount | null;
  onClose: () => void;
  onUpdateUser: (updatedUser: UserAccount) => void;
  onAddUser: (newUser: UserAccount) => void;
  onDeleteUser: (userId: string) => void;
}

export const UserManagementModal: React.FC<UserManagementModalProps> = ({
  users,
  currentUser,
  onClose,
  onUpdateUser,
  onAddUser,
  onDeleteUser,
}) => {
  const [isAddMode, setIsAddMode] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formUsername, setFormUsername] = useState('');
  const [formRole, setFormRole] = useState<'admin' | 'cashier'>('cashier');
  const [formPin, setFormPin] = useState('1234');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [confirmDeleteUserId, setConfirmDeleteUserId] = useState<string | null>(null);

  const handleStartAdd = () => {
    setEditingUserId(null);
    setFormName('');
    setFormUsername('');
    setFormRole('cashier');
    setFormPin('1234');
    setErrorMsg('');
    setSuccessMsg('');
    setConfirmDeleteUserId(null);
    setIsAddMode(true);
  };

  const handleStartEdit = (user: UserAccount) => {
    setIsAddMode(false);
    setEditingUserId(user.id);
    setFormName(user.name);
    setFormUsername(user.username);
    setFormRole(user.role);
    setFormPin(user.pin);
    setErrorMsg('');
    setSuccessMsg('');
    setConfirmDeleteUserId(null);
  };

  const handleCancelForm = () => {
    setIsAddMode(false);
    setEditingUserId(null);
    setErrorMsg('');
    setConfirmDeleteUserId(null);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formName.trim() || !formUsername.trim()) {
      setErrorMsg('Nama lengkap dan username wajib diisi!');
      return;
    }

    if (!formPin.trim() || formPin.length < 4) {
      setErrorMsg('PIN keamanan minimal 4 digit angka');
      return;
    }

    // Check username uniqueness
    const usernameConflict = users.some(
      (u) =>
        u.username.toLowerCase() === formUsername.trim().toLowerCase() &&
        u.id !== editingUserId
    );

    if (usernameConflict) {
      setErrorMsg(`Username "${formUsername}" sudah digunakan oleh karyawan lain!`);
      return;
    }

    if (editingUserId) {
      // Update existing user
      const updatedUser: UserAccount = {
        id: editingUserId,
        name: formName.trim(),
        username: formUsername.trim().toLowerCase(),
        role: formRole,
        pin: formPin.trim(),
      };
      onUpdateUser(updatedUser);
      soundManager.playSuccess();
      setSuccessMsg(`Data karyawan ${formName} berhasil diperbarui!`);
      setEditingUserId(null);
    } else {
      // Add new user
      const newUser: UserAccount = {
        id: 'u-' + Date.now(),
        name: formName.trim(),
        username: formUsername.trim().toLowerCase(),
        role: formRole,
        pin: formPin.trim(),
      };
      onAddUser(newUser);
      soundManager.playSuccess();
      setSuccessMsg(`Karyawan baru ${formName} berhasil ditambahkan!`);
      setIsAddMode(false);
    }

    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleDelete = (user: UserAccount) => {
    const adminCount = users.filter((u) => u.role === 'admin').length;
    if (user.role === 'admin' && adminCount <= 1) {
      setErrorMsg('Tidak dapat menghapus admin utama. Minimal harus ada 1 akun Admin di sistem!');
      return;
    }

    onDeleteUser(user.id);
    soundManager.playClick();
    setConfirmDeleteUserId(null);
    setSuccessMsg(`Akun "${user.name}" telah dihapus.`);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Kelola Karyawan & Akun Pengguna</h3>
              <p className="text-xs text-slate-400">Ganti username/PIN admin dan kelola akun kasir</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {successMsg && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form Area (Add or Edit) */}
          {(isAddMode || editingUserId) ? (
            <div className="p-5 rounded-2xl bg-slate-950 border border-amber-500/30 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>{editingUserId ? 'Edit Akun Karyawan / Admin' : 'Tambah Karyawan Baru'}</span>
                </h4>
                <button
                  type="button"
                  onClick={handleCancelForm}
                  className="text-slate-400 hover:text-white text-xs"
                >
                  Batal
                </button>
              </div>

              <form onSubmit={handleSaveForm} className="space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Nama Lengkap Karyawan <span className="text-amber-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Cth: Bpk. Hendra (Manager) / Siti"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Username Login <span className="text-amber-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Cth: admin / hendra / kasir1"
                      value={formUsername}
                      onChange={(e) => setFormUsername(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Hak Akses (Role)
                    </label>
                    <select
                      value={formRole}
                      onChange={(e) => setFormRole(e.target.value as any)}
                      className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-amber-400 font-semibold"
                    >
                      <option value="cashier">Kasir / Operator (Sewa room, F&B, LC, struk)</option>
                      <option value="admin">Admin / Manager (Akses penuh + laporan keuangan)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                      <span>PIN Keamanan (4-6 Digit Angka) <span className="text-amber-400">*</span></span>
                    </label>
                    <input
                      type="password"
                      maxLength={6}
                      required
                      placeholder="Cth: 1234 atau 8899"
                      value={formPin}
                      onChange={(e) => setFormPin(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white font-mono tracking-widest focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                {errorMsg && (
                  <div className="text-xs text-red-400 font-medium flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={handleCancelForm}
                    className="px-3.5 py-1.5 text-xs text-slate-400 hover:text-white"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm shadow-amber-400/20"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{editingUserId ? 'Simpan Perubahan' : 'Daftarkan Karyawan'}</span>
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Daftar Karyawan Terdaftar ({users.length})
                </h4>
                <p className="text-[11px] text-slate-400">
                  Klik tombol edit untuk mengubah username, nama, atau PIN karyawan.
                </p>
              </div>
              <button
                type="button"
                onClick={handleStartAdd}
                className="px-3.5 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-all shadow-md shadow-amber-400/20 flex items-center gap-1.5 active:scale-95"
              >
                <UserPlus className="w-4 h-4" />
                <span>+ Tambah Karyawan</span>
              </button>
            </div>
          )}

          {/* List of Registered Users */}
          <div className="space-y-2.5">
            {users.map((user) => (
              <div
                key={user.id}
                className={`p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                  currentUser?.id === user.id
                    ? 'bg-amber-500/10 border-amber-500/40'
                    : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                      user.role === 'admin'
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                        : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                    }`}
                  >
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{user.name}</span>
                      {currentUser?.id === user.id && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-400 text-slate-950 font-bold">
                          Sedang Aktif
                        </span>
                      )}
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase font-mono ${
                          user.role === 'admin'
                            ? 'bg-purple-500/20 text-purple-300'
                            : 'bg-cyan-500/20 text-cyan-300'
                        }`}
                      >
                        {user.role}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                      <span>Username: <strong className="text-slate-200 font-mono">{user.username}</strong></span>
                      <span>·</span>
                      <span>PIN: <strong className="text-slate-200 font-mono">{user.pin}</strong></span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={() => handleStartEdit(user)}
                    className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white flex items-center gap-1 transition-colors border border-slate-700"
                    title="Edit username, nama, atau PIN"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-amber-400" />
                    <span>Edit</span>
                  </button>

                  {confirmDeleteUserId === user.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleDelete(user)}
                        className="px-2 py-0.5 text-[10px] font-bold text-white bg-red-600 hover:bg-red-500 rounded transition-colors shadow-sm"
                      >
                        Yakin Hapus?
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteUserId(null)}
                        className="px-1.5 py-0.5 text-[10px] text-slate-400 hover:text-white"
                      >
                        Batal
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteUserId(user.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      title="Hapus Karyawan"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex justify-between items-center text-xs text-slate-500">
          <span>Data tersimpan otomatis di browser & siap digunakan untuk login.</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
