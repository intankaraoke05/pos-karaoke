import React from 'react';
import {
  X,
  Coffee,
  Mic2,
  Trash2,
  Minus,
  Plus,
  AlertTriangle,
  Receipt,
  PlusCircle,
  Clock,
  Sparkles,
} from 'lucide-react';
import { Room, FnbOrderItem, LcBookingItem } from '../types';
import { formatRupiah, calculateBillSummary } from '../utils/formatters';
import { soundManager } from '../services/soundService';

interface RoomOrderManagerModalProps {
  room: Room;
  onClose: () => void;
  onRemoveFnbItem: (roomId: string, orderItemId: string, itemCatalogId: string, qty: number) => void;
  onChangeFnbQty: (roomId: string, orderItemId: string, itemCatalogId: string, newQty: number, oldQty: number) => void;
  onRemoveLcBooking: (roomId: string, bookingId: string, lcId: string) => void;
  onOpenOrderFnb: (roomId: string) => void;
  onOpenAssignLc: (room: Room) => void;
}

export const RoomOrderManagerModal: React.FC<RoomOrderManagerModalProps> = ({
  room,
  onClose,
  onRemoveFnbItem,
  onChangeFnbQty,
  onRemoveLcBooking,
  onOpenOrderFnb,
  onOpenAssignLc,
}) => {
  const session = room.activeSession;
  const [feedbackMessage, setFeedbackMessage] = React.useState<string>('');

  if (!session) return null;

  const bill = calculateBillSummary(session, 10, 5, 0);

  const handleCancelFnb = (item: FnbOrderItem) => {
    soundManager.playClick();
    onRemoveFnbItem(room.id, item.id, item.itemId, item.qty);
    const itemTotal = item.price * item.qty;
    setFeedbackMessage(`Pesanan "${item.name}" (Qty: ${item.qty}) berhasil dibatalkan. Tagihan berkurang ${formatRupiah(itemTotal)} & stok otomatis dikembalikan ke inventaris.`);
    setTimeout(() => setFeedbackMessage(''), 4000);
  };

  const handleCancelAllFnb = () => {
    if (session.fnbOrders.length === 0) return;
    soundManager.playClick();
    session.fnbOrders.forEach((item) => {
      onRemoveFnbItem(room.id, item.id, item.itemId, item.qty);
    });
    setFeedbackMessage(`Semua pesanan makanan & minuman di room ini berhasil dibatalkan. Seluruh stok telah dikembalikan ke sistem.`);
    setTimeout(() => setFeedbackMessage(''), 4500);
  };

  const handleDecrementQty = (item: FnbOrderItem) => {
    soundManager.playClick();
    if (item.qty <= 1) {
      handleCancelFnb(item);
    } else {
      onChangeFnbQty(room.id, item.id, item.itemId, item.qty - 1, item.qty);
      setFeedbackMessage(`Jumlah "${item.name}" dikurangi 1. Tagihan berkurang ${formatRupiah(item.price)} (stok bertambah 1).`);
      setTimeout(() => setFeedbackMessage(''), 3000);
    }
  };

  const handleIncrementQty = (item: FnbOrderItem) => {
    soundManager.playClick();
    onChangeFnbQty(room.id, item.id, item.itemId, item.qty + 1, item.qty);
    setFeedbackMessage(`Jumlah "${item.name}" ditambah 1. Tagihan bertambah ${formatRupiah(item.price)}.`);
    setTimeout(() => setFeedbackMessage(''), 3000);
  };

  const handleCancelLc = (booking: LcBookingItem) => {
    soundManager.playClick();
    onRemoveLcBooking(room.id, booking.id, booking.lcId);
    setFeedbackMessage(`Booking LC "${booking.lcName}" (${booking.durationHours} Jam) berhasil dibatalkan. Tagihan berkurang ${formatRupiah(booking.totalFee)} & status LC kembali Standby.`);
    setTimeout(() => setFeedbackMessage(''), 4000);
  };

  const totalItemCount = session.fnbOrders.length + session.lcBookings.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                FOLIO ROOM
              </span>
              <h3 className="text-sm font-bold text-white">Kelola & Batalkan Pesanan - {room.name}</h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Pelanggan: <span className="text-white font-semibold">{session.customerName}</span> · Klik "Batalkan" untuk menghapus item yang batal dipesan.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Alert Banner */}
        {feedbackMessage && (
          <div className="px-6 py-2.5 bg-emerald-500/15 border-b border-emerald-500/30 text-emerald-300 text-xs font-medium flex items-center justify-between animate-fadeIn">
            <span>✓ {feedbackMessage}</span>
            <button
              onClick={() => setFeedbackMessage('')}
              className="text-emerald-400 hover:text-white p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Section 1: F&B Orders */}
          <div className="space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Coffee className="w-4 h-4 text-amber-400" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Pesanan Makanan & Minuman ({session.fnbOrders.length} Item)
                </h4>
              </div>
              <div className="flex items-center gap-3">
                {session.fnbOrders.length > 1 && (
                  <button
                    type="button"
                    onClick={handleCancelAllFnb}
                    className="text-xs text-red-400 hover:text-red-300 font-semibold flex items-center gap-1 transition-colors px-2 py-0.5 rounded bg-red-500/10 hover:bg-red-500/20 border border-red-500/30"
                    title="Batalkan sekaligus seluruh pesanan makanan/minuman di room ini"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Batalkan Semua F&B</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenOrderFnb(room.id);
                  }}
                  className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 transition-colors"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>+ Tambah Menu Baru</span>
                </button>
              </div>
            </div>

            {session.fnbOrders.length > 0 ? (
              <div className="space-y-2">
                {session.fnbOrders.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white truncate">{item.name}</span>
                        {item.notes && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                            {item.notes}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {item.qty} x {formatRupiah(item.price)} ={' '}
                        <span className="text-amber-400 font-mono font-semibold">
                          {formatRupiah(item.qty * item.price)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-auto">
                      {/* Quantity Modifier */}
                      <div className="flex items-center gap-1.5 bg-slate-900 px-2 py-1 rounded-lg border border-slate-800">
                        <button
                          type="button"
                          onClick={() => handleDecrementQty(item)}
                          title="Kurangi Qty"
                          className="text-slate-400 hover:text-white p-0.5"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-xs font-bold text-white w-6 text-center font-mono">
                          {item.qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleIncrementQty(item)}
                          title="Tambah Qty"
                          className="text-slate-400 hover:text-white p-0.5"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Cancel / Delete Item Button */}
                      <button
                        type="button"
                        onClick={() => handleCancelFnb(item)}
                        className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-lg transition-colors"
                        title="Batalkan dan hapus dari tagihan room"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Batalkan</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-center text-xs text-slate-500">
                Belum ada pesanan F&B di room ini.
              </div>
            )}
          </div>

          {/* Section 2: LC Bookings */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mic2 className="w-4 h-4 text-pink-400" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Booking Pemandu Lagu / LC ({session.lcBookings.length})
                </h4>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAssignLc(room);
                }}
                className="text-xs text-pink-400 hover:text-pink-300 font-semibold flex items-center gap-1 transition-colors"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>+ Booking LC Baru</span>
              </button>
            </div>

            {session.lcBookings.length > 0 ? (
              <div className="space-y-2">
                {session.lcBookings.map((lc) => (
                  <div
                    key={lc.id}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-all flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{lc.lcName}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-pink-500/20 text-pink-300">
                          {lc.durationHours} Jam
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Tarif: {formatRupiah(lc.hourlyRate)}/jam · Total:{' '}
                        <span className="text-pink-400 font-mono font-semibold">
                          {formatRupiah(lc.totalFee)}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCancelLc(lc)}
                      className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-lg transition-colors"
                      title="Batalkan booking LC dan kembalikan ke Standby"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Batalkan LC</span>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-center text-xs text-slate-500">
                Tidak ada pemandu lagu (LC) yang sedang ditugaskan di room ini.
              </div>
            )}
          </div>

          {/* Running Bill Summary Card */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Sewa Room ({bill.billableHours} Jam):</span>
              <span className="font-mono text-white font-semibold">{formatRupiah(bill.roomCharge)}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Total F&B:</span>
              <span className="font-mono text-amber-400 font-semibold">{formatRupiah(bill.fnbTotal)}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Total Jasa LC:</span>
              <span className="font-mono text-pink-400 font-semibold">{formatRupiah(bill.lcTotal)}</span>
            </div>
            <div className="flex justify-between text-xs font-bold pt-2 border-t border-slate-800 text-amber-400">
              <span>Estimasi Grand Total Tagihan Saat Ini:</span>
              <span className="font-mono text-sm">{formatRupiah(bill.grandTotal)}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex justify-between items-center text-xs">
          <span className="text-slate-500">
            Setiap pembatalan item F&B otomatis mengembalikan stok ke sistem.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-all shadow-md shadow-amber-400/20"
          >
            Selesai / Simpan
          </button>
        </div>
      </div>
    </div>
  );
};
