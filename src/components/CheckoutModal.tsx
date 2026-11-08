import React, { useState } from 'react';
import {
  X,
  CreditCard,
  QrCode,
  Banknote,
  Building2,
  Check,
  Receipt,
  Percent,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { Room, Transaction, BusinessProfile } from '../types';
import {
  formatRupiah,
  formatDateTimeIndo,
  calculateBillSummary,
  generateInvoiceNumber,
} from '../utils/formatters';
import { soundManager } from '../services/soundService';

interface CheckoutModalProps {
  room: Room;
  businessProfile: BusinessProfile;
  cashierName: string;
  onClose: () => void;
  onCompleteCheckout: (transaction: Transaction) => void;
  onRemoveFnbItem?: (roomId: string, orderItemId: string, itemCatalogId: string, qty: number) => void;
  onRemoveLcBooking?: (roomId: string, bookingId: string, lcId: string) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  room,
  businessProfile,
  cashierName,
  onClose,
  onCompleteCheckout,
  onRemoveFnbItem,
  onRemoveLcBooking,
}) => {
  const session = room.activeSession;
  if (!session) return null;

  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [includeService, setIncludeService] = useState<boolean>(true);
  const [includeTax, setIncludeTax] = useState<boolean>(true);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'qris' | 'debit' | 'transfer'>('cash');
  const [cashGiven, setCashGiven] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');
  const [actionFeedback, setActionFeedback] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const servicePercent = includeService ? businessProfile.serviceChargePercent : 0;
  const taxPercent = includeTax ? businessProfile.taxPercent : 0;

  const bill = calculateBillSummary(session, taxPercent, servicePercent, discountAmount);

  // Quick cash suggestion chips
  const quickCashOptions = [
    bill.remainingToPay,
    Math.ceil(bill.remainingToPay / 50000) * 50000,
    Math.ceil(bill.remainingToPay / 100000) * 100000,
    100000,
    200000,
    500000,
    1000000,
  ].filter((val, idx, arr) => val >= bill.remainingToPay && arr.indexOf(val) === idx).slice(0, 5);

  const changeGiven = paymentMethod === 'cash' ? Math.max(0, cashGiven - bill.remainingToPay) : 0;
  const isCashInsufficient = paymentMethod === 'cash' && cashGiven < bill.remainingToPay && cashGiven > 0;

  const handleDeleteFnb = (item: { id?: string; itemId: string; name: string; qty: number; price: number }) => {
    if (!onRemoveFnbItem) return;
    soundManager.playClick();
    onRemoveFnbItem(room.id, item.id || '', item.itemId, item.qty);
    const amount = item.price * item.qty;
    setActionFeedback(`Menu "${item.name}" (x${item.qty}) berhasil dihapus. Tagihan berkurang ${formatRupiah(amount)} & stok dikembalikan.`);
    setErrorMessage('');
    setTimeout(() => setActionFeedback(''), 4000);
  };

  const handleDeleteLc = (lc: { id: string; lcId: string; lcName: string; totalFee: number }) => {
    if (!onRemoveLcBooking) return;
    soundManager.playClick();
    onRemoveLcBooking(room.id, lc.id, lc.lcId);
    setActionFeedback(`Booking LC "${lc.lcName}" berhasil dibatalkan. Tagihan berkurang ${formatRupiah(lc.totalFee)} & status kembali Ready.`);
    setErrorMessage('');
    setTimeout(() => setActionFeedback(''), 4000);
  };

  const handleProcessPayment = () => {
    if (paymentMethod === 'cash' && cashGiven < bill.remainingToPay) {
      setErrorMessage(`Uang tunai kurang dari sisa tagihan (${formatRupiah(bill.remainingToPay - cashGiven)} lagi)`);
      soundManager.playWarning();
      return;
    }

    soundManager.playSuccess();

    const checkOutTime = new Date().toISOString();
    const invoiceNumber = generateInvoiceNumber();

    const transaction: Transaction = {
      id: 'tx-' + Date.now(),
      invoiceNumber,
      roomId: room.id,
      roomName: room.name,
      roomType: room.type,
      customerName: session.customerName,
      customerPhone: session.customerPhone,
      checkInTime: session.checkInTime,
      checkOutTime,
      roomDurationHours: bill.billableHours,
      roomRate: session.hourlyRate,
      roomTotal: bill.roomCharge,
      fnbOrders: session.fnbOrders,
      fnbTotal: bill.fnbTotal,
      lcBookings: session.lcBookings,
      lcTotal: bill.lcTotal,
      subtotal: bill.subtotal,
      serviceChargePercent: servicePercent,
      serviceChargeAmount: bill.serviceChargeAmount,
      taxPercent,
      taxAmount: bill.taxAmount,
      discountAmount,
      grandTotal: bill.grandTotal,
      depositUsed: bill.deposit,
      paymentMethod,
      cashGiven: paymentMethod === 'cash' ? cashGiven : bill.remainingToPay,
      changeGiven: paymentMethod === 'cash' ? changeGiven : 0,
      cashierName,
      notes: notes.trim() || undefined,
      createdAt: checkOutTime,
      syncedToAppsScript: false,
    };

    onCompleteCheckout(transaction);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/85 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                CHECKOUT ROOM
              </span>
              <h3 className="text-base font-bold text-white">{room.name}</h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Pelanggan: <span className="text-white font-semibold">{session.customerName}</span> · Masuk: {formatDateTimeIndo(session.checkInTime)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dynamic Action Notification Banner */}
        {actionFeedback && (
          <div className="px-6 py-2.5 bg-emerald-500/15 border-b border-emerald-500/30 text-emerald-300 text-xs font-medium flex items-center justify-between animate-fadeIn">
            <span>✓ {actionFeedback}</span>
            <button onClick={() => setActionFeedback('')} className="text-emerald-400 hover:text-white p-0.5">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Error Alert Banner */}
        {errorMessage && (
          <div className="px-6 py-2.5 bg-red-500/15 border-b border-red-500/30 text-red-300 text-xs font-medium flex items-center justify-between animate-fadeIn">
            <span>⚠️ {errorMessage}</span>
            <button onClick={() => setErrorMessage('')} className="text-red-400 hover:text-white p-0.5">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Content Body: Left Itemized Summary, Right Payment Options */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left Column: Bill Folio Breakdown */}
          <div className="flex-1 overflow-y-auto p-5 border-b md:border-b-0 md:border-r border-slate-800 space-y-4">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Rincian Tagihan Karaoke
            </h4>

            {/* 1. Room Charge */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-white">Sewa Room ({bill.billableHours} Jam)</span>
                <span className="font-mono font-bold text-amber-400">{formatRupiah(bill.roomCharge)}</span>
              </div>
              <div className="text-[11px] text-slate-400">
                Tarif: {formatRupiah(session.hourlyRate)}/jam {session.isFlexible ? '(Open Time)' : ''}
              </div>
            </div>

            {/* 2. F&B Orders */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex justify-between items-center text-xs border-b border-slate-800/80 pb-1.5">
                <span className="font-semibold text-white">Pesanan F&B ({session.fnbOrders.length} Item)</span>
                <span className="font-mono font-bold text-amber-400">{formatRupiah(bill.fnbTotal)}</span>
              </div>
              {session.fnbOrders.length > 0 ? (
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {session.fnbOrders.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-[11px] group/item">
                      <div className="flex items-center gap-1.5 min-w-0 pr-2">
                        {onRemoveFnbItem && (
                          <button
                            type="button"
                            onClick={() => handleDeleteFnb(item)}
                            className="text-slate-400 hover:text-red-400 p-1 rounded hover:bg-red-500/10 transition-colors"
                            title="Batalkan dan hapus item ini (stok kembali)"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-red-400" />
                          </button>
                        )}
                        <span className="text-slate-300 truncate max-w-[170px]">
                          {item.name} <span className="text-slate-500">x{item.qty}</span>
                        </span>
                      </div>
                      <span className="font-mono text-slate-400 shrink-0">
                        {formatRupiah(item.price * item.qty)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-[11px] text-slate-500 italic">Tidak ada pesanan F&B</div>
              )}
            </div>

            {/* 3. LC Services */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex justify-between items-center text-xs border-b border-slate-800/80 pb-1.5">
                <span className="font-semibold text-white">Jasa Pemandu Lagu (LC) ({session.lcBookings.length})</span>
                <span className="font-mono font-bold text-pink-400">{formatRupiah(bill.lcTotal)}</span>
              </div>
              {session.lcBookings.length > 0 ? (
                <div className="space-y-1.5">
                  {session.lcBookings.map((lc, idx) => (
                    <div key={idx} className="flex justify-between items-center text-[11px]">
                      <div className="flex items-center gap-1.5 min-w-0 pr-2">
                        {onRemoveLcBooking && (
                          <button
                            type="button"
                            onClick={() => handleDeleteLc(lc)}
                            className="text-slate-400 hover:text-red-400 p-1 rounded hover:bg-red-500/10 transition-colors"
                            title="Batalkan booking LC ini (status kembali Ready)"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-red-400" />
                          </button>
                        )}
                        <span className="text-slate-300 truncate max-w-[170px]">
                          {lc.lcName} <span className="text-slate-500">({lc.durationHours} Jam)</span>
                        </span>
                      </div>
                      <span className="font-mono text-pink-300 shrink-0">{formatRupiah(lc.totalFee)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-[11px] text-slate-500 italic">Tidak menggunakan jasa LC</div>
              )}
            </div>

            {/* Discounts and Tax Toggles */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Potongan Diskon (Rp):</span>
                <input
                  type="number"
                  step="5000"
                  placeholder="0"
                  value={discountAmount || ''}
                  onChange={(e) => setDiscountAmount(Number(e.target.value) || 0)}
                  className="w-32 px-2.5 py-1 text-xs text-right bg-slate-950 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeService}
                    onChange={(e) => setIncludeService(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-950 text-amber-500 focus:ring-amber-400"
                  />
                  <span>Service Charge ({businessProfile.serviceChargePercent}%)</span>
                </label>
                <span className="font-mono">{formatRupiah(bill.serviceChargeAmount)}</span>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeTax}
                    onChange={(e) => setIncludeTax(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-950 text-amber-500 focus:ring-amber-400"
                  />
                  <span>PB1 / Pajak Hiburan ({businessProfile.taxPercent}%)</span>
                </label>
                <span className="font-mono">{formatRupiah(bill.taxAmount)}</span>
              </div>
            </div>
          </div>

          {/* Right Column: Payment & Cash Calculations */}
          <div className="w-full md:w-[380px] lg:w-[420px] p-5 bg-slate-950 flex flex-col justify-between overflow-y-auto">
            <div className="space-y-4">
              {/* Grand Total Big Display */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-slate-900 to-slate-950 border border-amber-500/30 text-center">
                <span className="text-xs text-slate-400 font-medium">TOTAL TAGIHAN KASIR</span>
                <div className="text-2xl lg:text-3xl font-extrabold text-amber-400 font-mono tracking-tight my-1">
                  {formatRupiah(bill.grandTotal)}
                </div>
                {bill.deposit > 0 && (
                  <div className="flex justify-between text-xs text-slate-400 px-3 pt-2 border-t border-slate-800">
                    <span>DP Masuk: -{formatRupiah(bill.deposit)}</span>
                    <span className="font-bold text-white">Sisa: {formatRupiah(bill.remainingToPay)}</span>
                  </div>
                )}
              </div>

              {/* Payment Method Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Metode Pembayaran:
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethod('cash');
                      setCashGiven(bill.remainingToPay);
                    }}
                    className={`py-2 px-1 rounded-lg text-xs font-semibold flex flex-col items-center gap-1 border transition-all ${
                      paymentMethod === 'cash'
                        ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-sm'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    <Banknote className="w-4 h-4" />
                    <span>TUNAI</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('qris')}
                    className={`py-2 px-1 rounded-lg text-xs font-semibold flex flex-col items-center gap-1 border transition-all ${
                      paymentMethod === 'qris'
                        ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-sm'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    <QrCode className="w-4 h-4" />
                    <span>QRIS</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('debit')}
                    className={`py-2 px-1 rounded-lg text-xs font-semibold flex flex-col items-center gap-1 border transition-all ${
                      paymentMethod === 'debit'
                        ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-sm'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>DEBIT</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('transfer')}
                    className={`py-2 px-1 rounded-lg text-xs font-semibold flex flex-col items-center gap-1 border transition-all ${
                      paymentMethod === 'transfer'
                        ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-sm'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    <Building2 className="w-4 h-4" />
                    <span>TRANSFER</span>
                  </button>
                </div>
              </div>

              {/* Cash Given & Change Input */}
              {paymentMethod === 'cash' && (
                <div className="space-y-2.5 p-3.5 bg-slate-900 rounded-xl border border-slate-800">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-slate-300">Uang Diterima (Rp):</label>
                    <input
                      type="number"
                      step="5000"
                      value={cashGiven || ''}
                      onChange={(e) => setCashGiven(Number(e.target.value) || 0)}
                      placeholder={String(bill.remainingToPay)}
                      className="w-36 px-3 py-1.5 text-sm text-right bg-slate-950 border border-slate-700 rounded-lg text-white font-mono font-bold focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  {/* Quick Cash Chips */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => setCashGiven(bill.remainingToPay)}
                      className="px-2 py-1 text-[11px] font-semibold bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-md border border-slate-700"
                    >
                      Uang Pas
                    </button>
                    {quickCashOptions.map((amount) => (
                      <button
                        key={amount}
                        type="button"
                        onClick={() => setCashGiven(amount)}
                        className="px-2 py-1 text-[11px] font-mono bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md border border-slate-700"
                      >
                        {formatRupiah(amount)}
                      </button>
                    ))}
                  </div>

                  {/* Kembalian / Change */}
                  <div className="flex justify-between items-center pt-2 border-t border-slate-800">
                    <span className="text-xs text-slate-400">Kembalian:</span>
                    <span className="text-base font-bold font-mono text-emerald-400">
                      {formatRupiah(changeGiven)}
                    </span>
                  </div>

                  {isCashInsufficient && (
                    <div className="text-[11px] text-red-400 font-medium">
                      Uang tunai kurang {formatRupiah(bill.remainingToPay - cashGiven)}
                    </div>
                  )}
                </div>
              )}

              {/* QRIS Display Mode */}
              {paymentMethod === 'qris' && (
                <div className="p-4 bg-white text-slate-900 rounded-xl text-center space-y-2">
                  <div className="text-xs font-bold tracking-wider text-slate-800 uppercase">
                    QRIS INTAN KARAOKE LOUNGE
                  </div>
                  {/* Dynamic simulated QR representation */}
                  <div className="w-36 h-36 mx-auto bg-slate-100 border-2 border-dashed border-slate-400 rounded-lg p-2 flex flex-col items-center justify-center relative">
                    <QrCode className="w-24 h-24 text-slate-900" />
                    <span className="text-[9px] text-slate-600 font-mono mt-1">NMID: ID10293847561</span>
                  </div>
                  <div className="text-xs font-semibold font-mono text-slate-900">
                    Total: {formatRupiah(bill.remainingToPay)}
                  </div>
                  <div className="text-[10px] text-emerald-600 flex items-center justify-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Mendukung GoPay, OVO, Dana, BCA, Mandiri QR</span>
                  </div>
                </div>
              )}

              {/* Transfer Mode */}
              {paymentMethod === 'transfer' && (
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-xs space-y-2">
                  <div className="text-slate-400">Rekening Tujuan Karaoke:</div>
                  <div className="p-2 bg-slate-950 rounded-lg border border-slate-800 font-mono text-xs text-white">
                    <div className="text-amber-400 font-bold">BCA: 888-0912-334</div>
                    <div className="text-slate-400 text-[11px]">a/n INTAN KARAOKE LOUNGE</div>
                  </div>
                  <div className="p-2 bg-slate-950 rounded-lg border border-slate-800 font-mono text-xs text-white">
                    <div className="text-amber-400 font-bold">MANDIRI: 142-00-9876543-1</div>
                    <div className="text-slate-400 text-[11px]">a/n INTAN KARAOKE LOUNGE</div>
                  </div>
                </div>
              )}

              {/* Debit Card Mode */}
              {paymentMethod === 'debit' && (
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-xs space-y-2">
                  <div className="text-slate-400">Gesek kartu EDC Mesin Kasir</div>
                  <input
                    type="text"
                    placeholder="Nomor Approval / Trace Code EDC (Opsional)"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-slate-800 space-y-2">
              <button
                type="button"
                onClick={handleProcessPayment}
                disabled={paymentMethod === 'cash' && cashGiven < bill.remainingToPay}
                className="w-full py-3 px-4 rounded-xl text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-400/20 active:scale-95"
              >
                <Receipt className="w-4 h-4" />
                <span>Bayar Lunas & Cetak Struk Thermal</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-2 text-xs text-slate-400 hover:text-white transition-colors"
              >
                Kembali / Batal
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
