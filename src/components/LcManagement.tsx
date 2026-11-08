import React, { useState } from 'react';
import {
  Mic2,
  Plus,
  Search,
  DollarSign,
  UserCheck,
  Clock,
  Printer,
  Edit2,
  Trash2,
  Percent,
  CheckCircle2,
  X,
} from 'lucide-react';
import { LadyCompanion, Room } from '../types';
import { formatRupiah, formatDateTimeIndo } from '../utils/formatters';

interface LcManagementProps {
  lcRoster: LadyCompanion[];
  rooms: Room[];
  isAdmin: boolean;
  onUpdateLc: (updated: LadyCompanion) => void;
  onAddLc: (newLc: LadyCompanion) => void;
  onDeleteLc: (id: string) => void;
}

export const LcManagement: React.FC<LcManagementProps> = ({
  lcRoster,
  rooms,
  isAdmin,
  onUpdateLc,
  onAddLc,
  onDeleteLc,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedLcForSlip, setSelectedLcForSlip] = useState<LadyCompanion | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form state for add/edit
  const [formName, setFormName] = useState('');
  const [formNickname, setFormNickname] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formRate, setFormRate] = useState<number>(150000);
  const [formCommission, setFormCommission] = useState<number>(70);
  const [confirmDeleteLcId, setConfirmDeleteLcId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string>('');

  const filteredLcs = lcRoster.filter((lc) => {
    const matchSearch =
      lc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lc.nickname.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lc.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = filterStatus === 'all' || lc.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const totalLc = lcRoster.length;
  const onDutyCount = lcRoster.filter((l) => l.status === 'on_duty').length;
  const readyCount = lcRoster.filter((l) => l.status === 'ready').length;
  const totalHoursWorkedToday = lcRoster.reduce((sum, l) => sum + (l.totalHoursToday || 0), 0);
  const totalLcFeesToday = lcRoster.reduce((sum, l) => sum + (l.totalEarningsToday || 0), 0);

  const handleStatusChange = (lc: LadyCompanion, newStatus: LadyCompanion['status']) => {
    onUpdateLc({ ...lc, status: newStatus });
  };

  const handleCreateLc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNickname.trim()) {
      setFormError('Nama panggilan LC wajib diisi');
      return;
    }
    setFormError('');

    const nextNum = lcRoster.length + 1;
    const newLc: LadyCompanion = {
      id: 'lc-' + Date.now(),
      code: `LC-${String(nextNum).padStart(2, '0')}`,
      name: formName.trim() || formNickname.trim(),
      nickname: formNickname.trim(),
      phone: formPhone.trim() || '0812xxxxxxxx',
      hourlyRate: Number(formRate) || 150000,
      commissionPercent: Number(formCommission) || 70,
      status: 'ready',
      totalHoursToday: 0,
      totalEarningsToday: 0,
    };

    onAddLc(newLc);
    setIsAddModalOpen(false);
    setFormName('');
    setFormNickname('');
    setFormPhone('');
  };

  const handlePrintSlip = () => {
    window.print();
  };

  return (
    <div className="space-y-5">
      {/* Metrics Banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-[11px] text-slate-400 font-medium">TOTAL ROSTER LC</div>
          <div className="text-xl font-bold font-mono text-white mt-0.5">{totalLc} Personil</div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-[11px] text-slate-400 font-medium">ON DUTY / DALAM ROOM</div>
          <div className="text-xl font-bold font-mono text-pink-400 mt-0.5">{onDutyCount} LC</div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-[11px] text-slate-400 font-medium">STANDBY / READY</div>
          <div className="text-xl font-bold font-mono text-emerald-400 mt-0.5">{readyCount} LC</div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-[11px] text-slate-400 font-medium">TOTAL JAM & KOMISI HARI INI</div>
          <div className="text-base font-bold font-mono text-amber-400 mt-0.5">
            {totalHoursWorkedToday} Jam ({formatRupiah(totalLcFeesToday)})
          </div>
        </div>
      </div>

      {/* Control Toolbar */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              filterStatus === 'all'
                ? 'bg-pink-600 text-white font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Semua ({totalLc})
          </button>
          <button
            onClick={() => setFilterStatus('ready')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              filterStatus === 'ready'
                ? 'bg-emerald-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Ready ({readyCount})
          </button>
          <button
            onClick={() => setFilterStatus('on_duty')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              filterStatus === 'on_duty'
                ? 'bg-pink-500 text-white font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            On Duty ({onDutyCount})
          </button>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama, kode LC..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-pink-500"
            />
          </div>

          {isAdmin && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-3.5 py-1.5 text-xs font-bold text-white bg-pink-600 hover:bg-pink-500 rounded-lg flex items-center gap-1.5 transition-colors whitespace-nowrap shadow-sm shadow-pink-600/20"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah LC</span>
            </button>
          )}
        </div>
      </div>

      {/* Roster Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredLcs.map((lc) => (
          <div
            key={lc.id}
            className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between"
          >
            <div>
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-pink-500/10 border border-pink-500/20 flex items-center justify-center font-mono font-bold text-pink-400 text-xs">
                    {lc.code}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">{lc.nickname}</h4>
                    <span className="text-[11px] text-slate-400">{lc.name}</span>
                  </div>
                </div>

                {/* Status selector */}
                <select
                  value={lc.status}
                  onChange={(e) => handleStatusChange(lc, e.target.value as any)}
                  className={`text-[11px] font-semibold rounded-lg px-2 py-1 border focus:outline-none ${
                    lc.status === 'ready'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : lc.status === 'on_duty'
                      ? 'bg-pink-500/10 text-pink-400 border-pink-500/30'
                      : lc.status === 'break'
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  <option value="ready">Ready (Standby)</option>
                  <option value="on_duty">On Duty (Di Room)</option>
                  <option value="break">Istirahat (Break)</option>
                  <option value="off">Off / Libur</option>
                </select>
              </div>

              {/* LC Stats & Details */}
              <div className="mt-3.5 p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Tarif / Jam:</span>
                  <span className="font-mono text-white font-semibold">{formatRupiah(lc.hourlyRate)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Bagi Hasil Komisi:</span>
                  <span className="font-mono text-pink-400">{lc.commissionPercent}% LC / {100 - lc.commissionPercent}% Lounge</span>
                </div>
                {lc.currentRoomName && (
                  <div className="flex justify-between text-slate-400">
                    <span>Sedang di:</span>
                    <span className="font-semibold text-white truncate max-w-[140px]">{lc.currentRoomName}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-400 pt-1 border-t border-slate-800">
                  <span>Total Jam Hari Ini:</span>
                  <span className="font-mono text-amber-400 font-bold">{lc.totalHoursToday || 0} Jam</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Estimasi Komisi Hari Ini:</span>
                  <span className="font-mono text-emerald-400 font-bold">{formatRupiah(lc.totalEarningsToday || 0)}</span>
                </div>
              </div>
            </div>

            {/* Bottom Controls */}
            <div className="mt-3.5 pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setSelectedLcForSlip(lc)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700 flex-1 justify-center"
              >
                <Printer className="w-3.5 h-3.5 text-amber-400" />
                <span>Slip Fee LC</span>
              </button>

              {isAdmin && (
                confirmDeleteLcId === lc.id ? (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        onDeleteLc(lc.id);
                        setConfirmDeleteLcId(null);
                      }}
                      className="px-2 py-1 text-[11px] font-bold text-white bg-red-600 hover:bg-red-500 rounded-md transition-colors shadow-sm"
                    >
                      Yakin Hapus?
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteLcId(null)}
                      className="px-1.5 py-1 text-[11px] text-slate-400 hover:text-white"
                    >
                      Batal
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteLcId(lc.id)}
                    className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    title="Hapus LC"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Slip Komisi Modal */}
      {selectedLcForSlip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800 bg-slate-950">
              <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                <Printer className="w-4 h-4 text-pink-400" />
                <span>Slip Komisi Fee LC ({selectedLcForSlip.nickname})</span>
              </h3>
              <button
                onClick={() => setSelectedLcForSlip(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 bg-slate-950/50 flex justify-center">
              <div
                id="receipt-print-area"
                className="w-64 bg-white text-black p-4 font-receipt text-[11px] leading-tight rounded border border-neutral-300 space-y-2 select-text"
              >
                <div className="text-center border-b border-dashed border-neutral-400 pb-2">
                  <div className="font-bold text-xs uppercase">INTAN KARAOKE & LOUNGE</div>
                  <div className="text-[10px] text-neutral-600">SLIP FEE / KOMISI LC</div>
                  <div className="text-[9px] text-neutral-500 mt-0.5">{formatDateTimeIndo(new Date())}</div>
                </div>

                <div className="space-y-1 text-[10px] border-b border-dashed border-neutral-300 pb-2">
                  <div className="flex justify-between">
                    <span>Kode LC:</span>
                    <span className="font-bold">{selectedLcForSlip.code}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Nama:</span>
                    <span className="font-bold">{selectedLcForSlip.nickname}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tarif per Jam:</span>
                    <span>{formatRupiah(selectedLcForSlip.hourlyRate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Persentase Bagi:</span>
                    <span>{selectedLcForSlip.commissionPercent}%</span>
                  </div>
                </div>

                <div className="space-y-1 text-[10px] border-b border-dashed border-neutral-400 pb-2">
                  <div className="flex justify-between font-semibold">
                    <span>Total Jam Hari Ini:</span>
                    <span>{selectedLcForSlip.totalHoursToday || 0} Jam</span>
                  </div>
                  <div className="flex justify-between text-neutral-600">
                    <span>Total Omset Room:</span>
                    <span>{formatRupiah((selectedLcForSlip.totalHoursToday || 0) * selectedLcForSlip.hourlyRate)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-xs pt-1 border-t border-neutral-300 text-black">
                    <span>HAK KOMISI LC:</span>
                    <span>{formatRupiah(selectedLcForSlip.totalEarningsToday || 0)}</span>
                  </div>
                </div>

                <div className="pt-2 text-center text-[9px] text-neutral-500 space-y-6">
                  <div>Harap dicek kembali sebelum tanda tangan penerimaan fee.</div>
                  <div className="flex justify-between pt-4">
                    <div className="text-center">
                      <div>Kasir / Leader</div>
                      <div className="mt-8">_____________</div>
                    </div>
                    <div className="text-center">
                      <div>Penerima (LC)</div>
                      <div className="mt-8">_____________</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-950 flex justify-end gap-2">
              <button
                onClick={() => setSelectedLcForSlip(null)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                Tutup
              </button>
              <button
                onClick={handlePrintSlip}
                className="px-4 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak Slip Thermal</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add New LC Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Mic2 className="w-4 h-4 text-pink-400" />
                <span>Tambah Personil LC Baru</span>
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateLc} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Nama Panggilan (Nickname) <span className="text-pink-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Jessica / Natasha"
                  value={formNickname}
                  onChange={(e) => setFormNickname(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-pink-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Nama Lengkap (Sesuai KTP)
                </label>
                <input
                  type="text"
                  placeholder="Nama resmi"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-pink-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">No. WhatsApp / HP</label>
                <input
                  type="tel"
                  placeholder="0812xxxxxxxx"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-pink-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Tarif per Jam (Rp)</label>
                  <input
                    type="number"
                    step="10000"
                    value={formRate}
                    onChange={(e) => setFormRate(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-pink-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Komisi LC (%)</label>
                  <input
                    type="number"
                    min="10"
                    max="100"
                    value={formCommission}
                    onChange={(e) => setFormCommission(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-pink-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-bold text-white bg-pink-600 hover:bg-pink-500 rounded-lg transition-colors"
                >
                  Simpan Roster LC
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
