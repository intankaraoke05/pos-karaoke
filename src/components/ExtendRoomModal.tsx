import React, { useState } from 'react';
import { X, PlusCircle, Clock, AlertTriangle } from 'lucide-react';
import { Room } from '../types';
import { formatRupiah, getRoomSessionTiming } from '../utils/formatters';

interface ExtendRoomModalProps {
  room: Room;
  onClose: () => void;
  onConfirm: (additionalMinutes: number) => void;
}

export const ExtendRoomModal: React.FC<ExtendRoomModalProps> = ({ room, onClose, onConfirm }) => {
  const [selectedMinutes, setSelectedMinutes] = useState<number>(60);
  const session = room.activeSession;
  const timing = getRoomSessionTiming(session);

  const options = [
    { label: '+30 Menit', minutes: 30 },
    { label: '+1 Jam (60m)', minutes: 60 },
    { label: '+1.5 Jam (90m)', minutes: 90 },
    { label: '+2 Jam (120m)', minutes: 120 },
    { label: '+3 Jam (180m)', minutes: 180 },
  ];

  const hourlyRate = session?.hourlyRate || room.hourlyRate;
  const additionalCost = Math.round((selectedMinutes / 60) * hourlyRate);

  const handleExtend = () => {
    onConfirm(selectedMinutes);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-bold text-white">Tambah Jam Sewa: {room.name}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
            <div className="flex justify-between text-xs text-slate-400">
              <span>Tamu:</span>
              <span className="font-semibold text-white">{session?.customerName || '-'}</span>
            </div>
            <div className="flex justify-between text-xs text-slate-400">
              <span>Sisa Waktu Saat Ini:</span>
              <span className={`font-mono font-bold ${timing.isExpired ? 'text-red-400' : 'text-amber-400'}`}>
                {timing.formattedRemaining}
              </span>
            </div>
            <div className="flex justify-between text-xs text-slate-400">
              <span>Tarif Room:</span>
              <span className="font-mono text-slate-200">{formatRupiah(hourlyRate)}/jam</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-2 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              Pilih Tambahan Durasi:
            </label>
            <div className="grid grid-cols-2 gap-2">
              {options.map((opt) => (
                <button
                  type="button"
                  key={opt.minutes}
                  onClick={() => setSelectedMinutes(opt.minutes)}
                  className={`py-2.5 px-3 rounded-lg text-xs font-semibold border transition-all text-center ${
                    selectedMinutes === opt.minutes
                      ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-md shadow-amber-500/10'
                      : 'bg-slate-950/80 text-slate-300 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Additional Cost Banner */}
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-between">
            <span className="text-xs text-amber-300">Biaya Tambahan Room:</span>
            <span className="text-sm font-bold text-amber-400 font-mono">
              +{formatRupiah(additionalCost)}
            </span>
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
              type="button"
              onClick={handleExtend}
              className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-all shadow-md shadow-amber-400/20 active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Simpan & Perpanjang Timer</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
