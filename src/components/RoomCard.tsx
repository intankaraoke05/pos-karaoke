import React from 'react';
import {
  Clock,
  User,
  Coffee,
  Mic2,
  PlusCircle,
  Play,
  Pause,
  Receipt,
  RotateCcw,
  AlertCircle,
  Sparkles,
  Trash2,
  ListOrdered,
} from 'lucide-react';
import { Room } from '../types';
import {
  formatRupiah,
  getRoomSessionTiming,
  calculateBillSummary,
} from '../utils/formatters';

interface RoomCardProps {
  room: Room;
  onCheckIn: (room: Room) => void;
  onExtend: (room: Room) => void;
  onOrderFnb: (room: Room) => void;
  onAssignLc: (room: Room) => void;
  onTogglePause: (room: Room) => void;
  onCheckout: (room: Room) => void;
  onSetStatus: (room: Room, status: Room['status']) => void;
  onManageOrders?: (room: Room) => void;
}

export const RoomCard: React.FC<RoomCardProps> = ({
  room,
  onCheckIn,
  onExtend,
  onOrderFnb,
  onAssignLc,
  onTogglePause,
  onCheckout,
  onSetStatus,
  onManageOrders,
}) => {
  const session = room.activeSession;
  const timing = getRoomSessionTiming(session);

  // Dynamic bill total for quick display
  const bill = session ? calculateBillSummary(session, 10, 5, 0) : null;

  // Determine border and accent colors based on status and timer
  let statusTheme = {
    badgeBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    cardBorder: 'border-slate-800 hover:border-slate-700',
    headerBg: 'bg-slate-950/60',
    statusLabel: 'KOSONG / TERSEDIA',
  };

  if (room.status === 'occupied') {
    if (timing.isExpired) {
      statusTheme = {
        badgeBg: 'bg-red-500/20 text-red-400 border-red-500/30 animate-pulse',
        cardBorder: 'border-red-500/40 shadow-lg shadow-red-950/20',
        headerBg: 'bg-red-950/20',
        statusLabel: 'WAKTU SELESAI',
      };
    } else if (timing.isWarning) {
      statusTheme = {
        badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
        cardBorder: 'border-amber-500/40 shadow-md shadow-amber-950/20',
        headerBg: 'bg-amber-950/20',
        statusLabel: 'SEGERA BERAKHIR',
      };
    } else {
      statusTheme = {
        badgeBg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
        cardBorder: 'border-cyan-500/30 shadow-md shadow-cyan-950/20',
        headerBg: 'bg-cyan-950/20',
        statusLabel: session?.isPaused ? 'TIMER PAUSED' : 'AKTIF DIGUNAKAN',
      };
    }
  } else if (room.status === 'cleaning') {
    statusTheme = {
      badgeBg: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      cardBorder: 'border-purple-500/30',
      headerBg: 'bg-purple-950/20',
      statusLabel: 'SEDANG DIBERSIHKAN',
    };
  } else if (room.status === 'maintenance') {
    statusTheme = {
      badgeBg: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
      cardBorder: 'border-slate-800',
      headerBg: 'bg-slate-950/80',
      statusLabel: 'MAINTENANCE',
    };
  }

  return (
    <div
      className={`rounded-2xl bg-slate-900 border transition-all flex flex-col justify-between overflow-hidden group ${statusTheme.cardBorder}`}
    >
      {/* Top Banner */}
      <div className={`px-4 py-3 border-b border-slate-800/80 flex items-center justify-between ${statusTheme.headerBg}`}>
        <div className="flex items-center gap-2">
          <span className="text-sm font-extrabold text-white tracking-wide">{room.name}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
            {room.type} ({room.capacity}P)
          </span>
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${statusTheme.badgeBg}`}>
          {statusTheme.statusLabel}
        </span>
      </div>

      {/* Middle Body */}
      <div className="p-4 space-y-3.5 flex-1 flex flex-col justify-between">
        {session ? (
          /* Active Session View */
          <div className="space-y-3">
            {/* Customer & Guest info */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-white font-semibold truncate max-w-[150px]">
                  {session.customerName}
                </span>
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                {session.isFlexible ? 'Open Time' : `${session.durationHours} Jam`}
              </span>
            </div>

            {/* Live Countdown Timer Digital Display */}
            <div
              className={`p-3 rounded-xl border text-center transition-all ${
                timing.isExpired
                  ? 'bg-red-500/10 border-red-500/30 text-red-400'
                  : timing.isWarning
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                  : 'bg-slate-950 border-slate-800 text-cyan-400'
              }`}
            >
              <div className="text-[10px] uppercase tracking-wider text-slate-400 font-medium mb-0.5">
                {session.isFlexible ? 'Waktu Berjalan (Elapsed)' : 'Sisa Waktu Sewa'}
              </div>
              <div className="text-2xl font-mono font-extrabold tracking-wider tabular-nums">
                {session.isFlexible ? timing.formattedElapsed : timing.formattedRemaining}
              </div>

              {/* Progress bar for fixed hours */}
              {!session.isFlexible && (
                <div className="w-full bg-slate-800/80 rounded-full h-1.5 mt-2 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-1000 ${
                      timing.isExpired ? 'bg-red-500' : timing.isWarning ? 'bg-amber-400' : 'bg-cyan-400'
                    }`}
                    style={{ width: `${timing.progressPercent}%` }}
                  />
                </div>
              )}
            </div>

            {/* Running Bill Strip: Room, F&B, LC */}
            {bill && (
              <div
                onClick={() => onManageOrders && onManageOrders(room)}
                className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 hover:border-amber-500/50 cursor-pointer transition-all space-y-1.5 text-[11px] group/bill relative"
                title="Klik untuk melihat rincian atau membatalkan pesanan F&B dan LC"
              >
                <div className="flex items-center justify-between text-[10px] text-slate-500 mb-0.5">
                  <span className="font-semibold tracking-wider uppercase">RINCIAN TAGIHAN</span>
                  <span className="text-amber-400 group-hover/bill:underline font-medium flex items-center gap-1">
                    <Trash2 className="w-3 h-3 text-red-400" />
                    <span>Hapus / Edit Item</span>
                  </span>
                </div>

                <div className="flex justify-between text-slate-400">
                  <span>Sewa Room:</span>
                  <span className="font-mono text-slate-200">{formatRupiah(bill.roomCharge)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span className="flex items-center gap-1">
                    <Coffee className="w-3 h-3 text-amber-400" />
                    <span>F&B ({session.fnbOrders.length}):</span>
                  </span>
                  <span className="font-mono text-amber-400">{formatRupiah(bill.fnbTotal)}</span>
                </div>
                {session.lcBookings.length > 0 && (
                  <div className="flex justify-between text-slate-400">
                    <span className="flex items-center gap-1">
                      <Mic2 className="w-3 h-3 text-pink-400" />
                      <span>LC ({session.lcBookings.length}):</span>
                    </span>
                    <span className="font-mono text-pink-400">{formatRupiah(bill.lcTotal)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-1 border-t border-slate-800 text-xs font-bold">
                  <span className="text-slate-300">Estimasi Total:</span>
                  <span className="font-mono text-amber-400">{formatRupiah(bill.grandTotal)}</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Empty / Available State */
          <div className="py-6 text-center space-y-2">
            <div className="w-12 h-12 mx-auto rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-500 group-hover:text-amber-400 group-hover:border-amber-400/40 transition-colors">
              <Clock className="w-6 h-6" />
            </div>
            <div className="text-xs font-semibold text-slate-300">Room Siap Digunakan</div>
            <div className="text-xs font-mono font-bold text-amber-400">
              {formatRupiah(room.hourlyRate)} / Jam
            </div>
          </div>
        )}

        {/* Action Buttons Toolbar */}
        <div className="pt-2 border-t border-slate-800/80">
          {session ? (
            <div className="space-y-2">
              {/* Quick Operation Buttons */}
              <div className="grid grid-cols-4 gap-1">
                <button
                  type="button"
                  onClick={() => onExtend(room)}
                  title="Tambah Jam Sewa"
                  className="py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-semibold flex flex-col items-center gap-0.5 transition-colors border border-slate-700"
                >
                  <PlusCircle className="w-3.5 h-3.5 text-amber-400" />
                  <span>+ Jam</span>
                </button>

                <button
                  type="button"
                  onClick={() => onOrderFnb(room)}
                  title="Pesan Makanan & Minuman"
                  className="py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-semibold flex flex-col items-center gap-0.5 transition-colors border border-slate-700"
                >
                  <Coffee className="w-3.5 h-3.5 text-amber-400" />
                  <span>F&B</span>
                </button>

                <button
                  type="button"
                  onClick={() => onAssignLc(room)}
                  title="Booking Pemandu Lagu (LC)"
                  className="py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-semibold flex flex-col items-center gap-0.5 transition-colors border border-slate-700"
                >
                  <Mic2 className="w-3.5 h-3.5 text-pink-400" />
                  <span>LC</span>
                </button>

                <button
                  type="button"
                  onClick={() => onTogglePause(room)}
                  title={session.isPaused ? 'Lanjutkan Timer' : 'Jeda Sementara Timer'}
                  className="py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-semibold flex flex-col items-center gap-0.5 transition-colors border border-slate-700"
                >
                  {session.isPaused ? (
                    <>
                      <Play className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Resume</span>
                    </>
                  ) : (
                    <>
                      <Pause className="w-3.5 h-3.5 text-yellow-400" />
                      <span>Pause</span>
                    </>
                  )}
                </button>
              </div>

              {/* Dedicated Button to Manage / Cancel Orders when room has items */}
              {(session.fnbOrders.length > 0 || session.lcBookings.length > 0) && (
                <button
                  type="button"
                  onClick={() => onManageOrders && onManageOrders(room)}
                  className="w-full py-1.5 px-3 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white text-[11px] font-semibold flex items-center justify-between border border-slate-700/80 transition-colors"
                  title="Batalkan minuman/camilan atau LC yang tidak jadi dipesan"
                >
                  <span className="flex items-center gap-1.5 text-red-300">
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                    <span>Kelola / Batalkan Pesanan</span>
                  </span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-900 text-amber-400 font-mono font-bold">
                    {session.fnbOrders.length + session.lcBookings.length} item
                  </span>
                </button>
              )}

              {/* Checkout / Bayar Primary Button */}
              <button
                type="button"
                onClick={() => onCheckout(room)}
                className="w-full py-2.5 px-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md shadow-amber-400/20 active:scale-98"
              >
                <Receipt className="w-4 h-4" />
                <span>Bayar / Checkout Room</span>
              </button>
            </div>
          ) : (
            <div className="space-y-1.5">
              {room.status === 'cleaning' ? (
                <button
                  type="button"
                  onClick={() => onSetStatus(room, 'available')}
                  className="w-full py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Selesai Dibersihkan (Set Siap)</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onCheckIn(room)}
                  className="w-full py-2.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-500/20 active:scale-98"
                >
                  <User className="w-4 h-4" />
                  <span>Check-in Sewa Tamu</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
