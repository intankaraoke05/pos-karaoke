import React, { useState } from 'react';
import { X, Mic2, Clock, DollarSign, UserCheck, Trash2, Plus, Sparkles } from 'lucide-react';
import { Room, LadyCompanion, LcBookingItem } from '../types';
import { formatRupiah } from '../utils/formatters';

interface LcAssignModalProps {
  room: Room;
  lcRoster: LadyCompanion[];
  onClose: () => void;
  onAssignLc: (roomId: string, booking: LcBookingItem) => void;
  onRemoveLc: (roomId: string, bookingId: string, lcId: string) => void;
}

export const LcAssignModal: React.FC<LcAssignModalProps> = ({
  room,
  lcRoster,
  onClose,
  onAssignLc,
  onRemoveLc,
}) => {
  const activeLcBookings = room.activeSession?.lcBookings || [];

  const availableLcs = lcRoster.filter(
    (lc) => lc.status === 'ready' || (lc.status === 'on_duty' && lc.currentRoomId === room.id)
  );

  const [selectedLcId, setSelectedLcId] = useState<string>(availableLcs[0]?.id || '');
  const [durationHours, setDurationHours] = useState<number>(2);
  const [customRate, setCustomRate] = useState<number>(150000);
  const [notes, setNotes] = useState<string>('');
  const [formError, setFormError] = useState<string>('');

  const currentSelectedLc = lcRoster.find((l) => l.id === selectedLcId);

  // Sync rate when LC changes
  const handleSelectLc = (id: string) => {
    setSelectedLcId(id);
    setFormError('');
    const target = lcRoster.find((l) => l.id === id);
    if (target) {
      setCustomRate(target.hourlyRate);
    }
  };

  const totalFee = durationHours * (customRate || currentSelectedLc?.hourlyRate || 150000);

  const handleAssign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSelectedLc) {
      setFormError('Pilih LC yang akan ditugaskan ke room ini');
      return;
    }

    const booking: LcBookingItem = {
      id: 'lcb-' + Date.now(),
      lcId: currentSelectedLc.id,
      lcName: `${currentSelectedLc.nickname} (${currentSelectedLc.code})`,
      startTime: new Date().toISOString(),
      durationHours,
      hourlyRate: customRate,
      totalFee,
      notes: notes.trim() || undefined,
    };

    onAssignLc(room.id, booking);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400">
              <Mic2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Booking Pemandu Lagu (LC) - {room.name}</h3>
              <p className="text-xs text-slate-400">Atur pemandu lagu pendamping room karaoke</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {formError && (
          <div className="px-6 py-2.5 bg-red-500/15 border-b border-red-500/30 text-red-300 text-xs font-medium flex items-center justify-between">
            <span>⚠️ {formError}</span>
            <button type="button" onClick={() => setFormError('')} className="text-red-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <div className="p-6 space-y-6">
          {/* Active LCs in this Room */}
          {activeLcBookings.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-slate-300">LC Sedang Bertugas di Room Ini:</h4>
              <div className="space-y-2">
                {activeLcBookings.map((b) => (
                  <div
                    key={b.id}
                    className="p-3 rounded-xl bg-slate-950 border border-pink-500/20 flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{b.lcName}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-pink-500/20 text-pink-300">
                          {b.durationHours} Jam
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Tarif: {formatRupiah(b.hourlyRate)}/jam · Total: {formatRupiah(b.totalFee)}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onRemoveLc(room.id, b.id, b.lcId)}
                      className="text-xs text-red-400 hover:text-red-300 p-1.5 hover:bg-red-500/10 rounded-lg flex items-center gap-1 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hentikan</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Form to Assign New LC */}
          <form onSubmit={handleAssign} className="space-y-4">
            <h4 className="text-xs font-semibold text-slate-300">Pilih & Tambah LC Baru:</h4>

            {availableLcs.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {availableLcs.map((lc) => (
                  <div
                    key={lc.id}
                    onClick={() => handleSelectLc(lc.id)}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      selectedLcId === lc.id
                        ? 'bg-pink-500/10 border-pink-500 text-white shadow-sm'
                        : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                        {lc.code}
                      </span>
                      <span className="text-[10px] text-emerald-400">Ready</span>
                    </div>
                    <div className="font-bold text-xs text-white mt-1.5">{lc.nickname}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{formatRupiah(lc.hourlyRate)}/jam</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-slate-950 rounded-xl text-center text-xs text-slate-500">
                Semua LC sedang bertugas atau belum ada LC yang ready. Silakan kelola di menu LC.
              </div>
            )}

            {/* Duration Selector */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-pink-400" />
                  Durasi Jam LC
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[1, 2, 3, 4].map((hrs) => (
                    <button
                      type="button"
                      key={hrs}
                      onClick={() => setDurationHours(hrs)}
                      className={`py-2 rounded-lg text-xs font-semibold border transition-all ${
                        durationHours === hrs
                          ? 'bg-pink-500 text-white border-pink-400 font-bold'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {hrs} Jam
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-pink-400" />
                  Tarif per Jam (Rp)
                </label>
                <input
                  type="number"
                  step="10000"
                  value={customRate}
                  onChange={(e) => setCustomRate(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-pink-400"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Catatan (Opsional)</label>
              <input
                type="text"
                placeholder="Contoh: Tamu langganan, request lagu pop/dangdut"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-pink-400"
              />
            </div>

            {/* Total Banner */}
            <div className="p-3 bg-pink-500/10 border border-pink-500/20 rounded-xl flex items-center justify-between">
              <span className="text-xs text-pink-300">Total Biaya LC Ditambahkan:</span>
              <span className="text-sm font-bold text-pink-400 font-mono">
                {formatRupiah(totalFee)}
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
              >
                Tutup
              </button>
              <button
                type="submit"
                disabled={!currentSelectedLc}
                className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-pink-600 hover:bg-pink-500 rounded-lg transition-all shadow-md shadow-pink-600/20 active:scale-95 disabled:opacity-50"
              >
                <UserCheck className="w-4 h-4" />
                <span>Tugaskan LC ke {room.name}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
