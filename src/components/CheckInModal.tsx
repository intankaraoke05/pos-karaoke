import React, { useState } from 'react';
import { X, Clock, User, Phone, DollarSign, FileText, CheckCircle2 } from 'lucide-react';
import { Room, ActiveSession } from '../types';
import { formatRupiah } from '../utils/formatters';

interface CheckInModalProps {
  room: Room;
  onClose: () => void;
  onConfirm: (session: ActiveSession) => void;
}

export const CheckInModal: React.FC<CheckInModalProps> = ({ room, onClose, onConfirm }) => {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [durationHours, setDurationHours] = useState<number>(2);
  const [isFlexible, setIsFlexible] = useState<boolean>(false);
  const [deposit, setDeposit] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [hourlyRate, setHourlyRate] = useState<number>(room.hourlyRate);
  const [formError, setFormError] = useState('');

  const durationOptions = [1, 2, 3, 4, 5];

  const estimatedRoomCost = isFlexible ? hourlyRate : hourlyRate * durationHours;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      setFormError('Mohon masukkan nama pelanggan/tamu terlebih dahulu');
      return;
    }

    const session: ActiveSession = {
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      checkInTime: new Date().toISOString(),
      durationHours: isFlexible ? 1 : durationHours,
      isFlexible,
      hourlyRate,
      deposit: Number(deposit) || 0,
      isPaused: false,
      extendedMinutes: 0,
      notes: notes.trim(),
      fnbOrders: [],
      lcBookings: [],
    };

    onConfirm(session);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                {room.type}
              </span>
              <h3 className="text-base font-bold text-white">Check-in {room.name}</h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Kapasitas: {room.capacity} Orang · Tarif: {formatRupiah(room.hourlyRate)}/jam
            </p>
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Customer Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Nama Pelanggan / Tamu <span className="text-amber-400">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="Contoh: Bpk. Budi / Mas Dimas"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-950 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">No. WhatsApp / HP</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  placeholder="0812xxxxxxx"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-950 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>
          </div>

          {/* Package / Duration Selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                Pilihan Durasi Sewa
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-400 hover:text-white">
                <input
                  type="checkbox"
                  checked={isFlexible}
                  onChange={(e) => setIsFlexible(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-950 text-amber-500 focus:ring-amber-400 w-3.5 h-3.5"
                />
                <span>Open Time (Fleksibel)</span>
              </label>
            </div>

            {!isFlexible ? (
              <div className="grid grid-cols-5 gap-2">
                {durationOptions.map((hrs) => (
                  <button
                    type="button"
                    key={hrs}
                    onClick={() => setDurationHours(hrs)}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all ${
                      durationHours === hrs
                        ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-md shadow-amber-500/10'
                        : 'bg-slate-950/70 text-slate-300 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {hrs} Jam
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-300">
                Mode Open Time: Timer akan menghitung maju (stopwatch) dan dihitung per jam/setengah jam saat checkout kasir.
              </div>
            )}
          </div>

          {/* Hourly Rate Adjustment & Deposit */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Tarif Room per Jam</label>
              <div className="relative">
                <DollarSign className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="number"
                  step="5000"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(Number(e.target.value))}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-950 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">DP / Uang Muka (Opsional)</label>
              <div className="relative">
                <span className="text-xs font-mono text-slate-500 absolute left-3 top-1/2 -translate-y-1/2">Rp</span>
                <input
                  type="number"
                  step="10000"
                  placeholder="0"
                  value={deposit || ''}
                  onChange={(e) => setDeposit(Number(e.target.value))}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-950 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              Catatan Khusus (Request Tamu)
            </label>
            <input
              type="text"
              placeholder="Contoh: Mic wireless 2 unit, tambah asbak, AC dingin"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* Cost Estimate Summary Banner */}
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400">Estimasi Sewa Room:</span>
            <div className="text-right">
              <span className="text-sm font-bold text-amber-400 font-mono">
                {formatRupiah(estimatedRoomCost)}
              </span>
              <span className="text-[10px] text-slate-400 block">
                {isFlexible ? 'Tarif dasar (Open Time)' : `${durationHours} Jam @ ${formatRupiah(hourlyRate)}`}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-all shadow-md shadow-amber-400/20 active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Mulai Sewa & Nyalakan Timer</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
