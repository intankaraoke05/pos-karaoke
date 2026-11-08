import React, { useState } from 'react';
import { Printer, Copy, Check, X, ShieldCheck, Share2 } from 'lucide-react';
import { Transaction, ReceiptPaperWidth, BusinessProfile } from '../types';
import { formatRupiah, formatDateTimeIndo } from '../utils/formatters';

interface ReceiptViewProps {
  transaction: Transaction;
  businessProfile: BusinessProfile;
  initialPaperWidth?: ReceiptPaperWidth;
  onClose: () => void;
}

export const ReceiptView: React.FC<ReceiptViewProps> = ({
  transaction,
  businessProfile,
  initialPaperWidth = '58mm',
  onClose,
}) => {
  const [paperWidth, setPaperWidth] = useState<ReceiptPaperWidth>(initialPaperWidth);
  const [copiedRaw, setCopiedRaw] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  // Generate plain text ESC/POS formatted receipt for copy or bluetooth printer
  const generatePlainTextReceipt = () => {
    const is58 = paperWidth === '58mm';
    const lineWidth = is58 ? 32 : 44;
    const divider = '-'.repeat(lineWidth);
    const doubleDivider = '='.repeat(lineWidth);

    const center = (text: string) => {
      const pad = Math.max(0, Math.floor((lineWidth - text.length) / 2));
      return ' '.repeat(pad) + text;
    };

    const twoCol = (left: string, right: string) => {
      const spaceCount = Math.max(1, lineWidth - left.length - right.length);
      return left + ' '.repeat(spaceCount) + right;
    };

    let lines: string[] = [];
    lines.push(center(businessProfile.name));
    lines.push(center(businessProfile.address.substring(0, lineWidth)));
    lines.push(center(`Telp: ${businessProfile.phone}`));
    lines.push(doubleDivider);
    lines.push(twoCol(`No: ${transaction.invoiceNumber}`, ''));
    lines.push(twoCol(`Tgl: ${formatDateTimeIndo(transaction.createdAt)}`, ''));
    lines.push(twoCol(`Kasir: ${transaction.cashierName}`, `Room: ${transaction.roomName}`));
    lines.push(twoCol(`Customer: ${transaction.customerName}`, ''));
    lines.push(divider);

    // Room
    lines.push(`SEWA ROOM:`);
    lines.push(twoCol(` ${transaction.roomDurationHours} Jam x ${transaction.roomRate.toLocaleString('id-ID')}`, transaction.roomTotal.toLocaleString('id-ID')));

    // F&B
    if (transaction.fnbOrders && transaction.fnbOrders.length > 0) {
      lines.push(`F&B / KITCHEN:`);
      transaction.fnbOrders.forEach((item) => {
        lines.push(` ${item.name}`);
        lines.push(twoCol(`   ${item.qty} x ${item.price.toLocaleString('id-ID')}`, (item.qty * item.price).toLocaleString('id-ID')));
      });
    }

    // LC
    if (transaction.lcBookings && transaction.lcBookings.length > 0) {
      lines.push(`PEMANDU LAGU (LC):`);
      transaction.lcBookings.forEach((lc) => {
        lines.push(` ${lc.lcName}`);
        lines.push(twoCol(`   ${lc.durationHours} Jam x ${lc.hourlyRate.toLocaleString('id-ID')}`, lc.totalFee.toLocaleString('id-ID')));
      });
    }

    lines.push(divider);
    lines.push(twoCol('Subtotal', transaction.subtotal.toLocaleString('id-ID')));
    if (transaction.discountAmount > 0) {
      lines.push(twoCol('Diskon', `-${transaction.discountAmount.toLocaleString('id-ID')}`));
    }
    if (transaction.serviceChargeAmount > 0) {
      lines.push(twoCol(`Service (${transaction.serviceChargePercent}%)`, transaction.serviceChargeAmount.toLocaleString('id-ID')));
    }
    if (transaction.taxAmount > 0) {
      lines.push(twoCol(`PB1 / Pajak (${transaction.taxPercent}%)`, transaction.taxAmount.toLocaleString('id-ID')));
    }
    lines.push(doubleDivider);
    lines.push(twoCol('TOTAL TAGIHAN', `Rp ${transaction.grandTotal.toLocaleString('id-ID')}`));
    if (transaction.depositUsed > 0) {
      lines.push(twoCol('DP / Deposit', `-Rp ${transaction.depositUsed.toLocaleString('id-ID')}`));
    }
    lines.push(twoCol('Bayar (' + transaction.paymentMethod.toUpperCase() + ')', `Rp ${(transaction.cashGiven || transaction.grandTotal).toLocaleString('id-ID')}`));
    if (transaction.changeGiven !== undefined && transaction.changeGiven > 0) {
      lines.push(twoCol('Kembali', `Rp ${transaction.changeGiven.toLocaleString('id-ID')}`));
    }
    lines.push(divider);
    lines.push(center('TERIMA KASIH ATAS KUNJUNGANNYA'));
    lines.push(center('SEMOGA HARI ANDA MENYENANGKAN'));
    lines.push(center('*** LUNAS ***'));

    return lines.join('\n');
  };

  const handleCopyRaw = () => {
    const rawText = generatePlainTextReceipt();
    navigator.clipboard.writeText(rawText);
    setCopiedRaw(true);
    setTimeout(() => setCopiedRaw(false), 2000);
  };

  const is58 = paperWidth === '58mm';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-semibold text-white">Cetak Struk Kasir Karaoke</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Paper Size Selector & Quick Controls */}
        <div className="p-4 bg-slate-950/40 border-b border-slate-800/80 flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setPaperWidth('58mm')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                paperWidth === '58mm'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Thermal 58mm (2")
            </button>
            <button
              onClick={() => setPaperWidth('80mm')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                paperWidth === '80mm'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Thermal 80mm (3")
            </button>
          </div>

          <button
            onClick={handleCopyRaw}
            title="Salin teks struk untuk printer bluetooth / raw text"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700"
          >
            {copiedRaw ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedRaw ? 'Tersalin' : 'Salin ESC/POS'}</span>
          </button>
        </div>

        {/* Receipt Visual Paper Simulation */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-950/60 flex justify-center items-start">
          <div
            id="receipt-print-area"
            style={{ width: is58 ? '260px' : '330px' }}
            className="bg-white text-black p-4 rounded-sm shadow-xl font-receipt text-[11px] leading-tight select-text border border-neutral-300 transition-all relative"
          >
            {/* Top jagged cut visual simulation */}
            <div className="border-b-2 border-dashed border-neutral-400 pb-2 mb-2 text-center">
              <div className="font-bold text-sm uppercase tracking-wide">{businessProfile.name}</div>
              <div className="text-[10px] text-neutral-600 mt-0.5 leading-snug">{businessProfile.address}</div>
              <div className="text-[10px] text-neutral-600">Telp: {businessProfile.phone}</div>
            </div>

            {/* Meta Info */}
            <div className="space-y-0.5 border-b border-dashed border-neutral-300 pb-2 mb-2 text-[10px]">
              <div className="flex justify-between">
                <span>No. Inv:</span>
                <span className="font-semibold">{transaction.invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>Waktu:</span>
                <span>{formatDateTimeIndo(transaction.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span>Kasir:</span>
                <span>{transaction.cashierName}</span>
              </div>
              <div className="flex justify-between">
                <span>Room:</span>
                <span className="font-bold">{transaction.roomName}</span>
              </div>
              <div className="flex justify-between">
                <span>Pelanggan:</span>
                <span>{transaction.customerName}</span>
              </div>
            </div>

            {/* Line Items */}
            <div className="space-y-2 border-b border-dashed border-neutral-300 pb-2 mb-2">
              {/* Room Rent */}
              <div>
                <div className="font-semibold flex justify-between">
                  <span>SEWA ROOM ({transaction.roomDurationHours} Jam)</span>
                  <span>{transaction.roomTotal.toLocaleString('id-ID')}</span>
                </div>
                <div className="text-[10px] text-neutral-500">
                  @ Rp {transaction.roomRate.toLocaleString('id-ID')}/jam
                </div>
              </div>

              {/* F&B Items */}
              {transaction.fnbOrders && transaction.fnbOrders.length > 0 && (
                <div className="pt-1">
                  <div className="font-semibold text-[10px] uppercase text-neutral-600 border-t border-dotted border-neutral-200 pt-1 mb-1">
                    Pesanan F&B
                  </div>
                  {transaction.fnbOrders.map((item, idx) => (
                    <div key={idx} className="mb-1">
                      <div className="flex justify-between">
                        <span className="truncate pr-1">{item.name}</span>
                        <span>{(item.qty * item.price).toLocaleString('id-ID')}</span>
                      </div>
                      <div className="text-[10px] text-neutral-500">
                        {item.qty} x {item.price.toLocaleString('id-ID')} {item.notes ? `(${item.notes})` : ''}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* LC Services */}
              {transaction.lcBookings && transaction.lcBookings.length > 0 && (
                <div className="pt-1">
                  <div className="font-semibold text-[10px] uppercase text-neutral-600 border-t border-dotted border-neutral-200 pt-1 mb-1">
                    Pemandu Lagu (LC)
                  </div>
                  {transaction.lcBookings.map((lc, idx) => (
                    <div key={idx} className="mb-1">
                      <div className="flex justify-between">
                        <span>{lc.lcName}</span>
                        <span>{lc.totalFee.toLocaleString('id-ID')}</span>
                      </div>
                      <div className="text-[10px] text-neutral-500">
                        {lc.durationHours} Jam @ Rp {lc.hourlyRate.toLocaleString('id-ID')}/jam
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Financial Summary */}
            <div className="space-y-1 border-b-2 border-dashed border-neutral-400 pb-2 mb-2">
              <div className="flex justify-between text-neutral-700">
                <span>Subtotal:</span>
                <span>Rp {transaction.subtotal.toLocaleString('id-ID')}</span>
              </div>
              {transaction.discountAmount > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Diskon:</span>
                  <span>-Rp {transaction.discountAmount.toLocaleString('id-ID')}</span>
                </div>
              )}
              {transaction.serviceChargeAmount > 0 && (
                <div className="flex justify-between text-neutral-700">
                  <span>Service ({transaction.serviceChargePercent}%):</span>
                  <span>Rp {transaction.serviceChargeAmount.toLocaleString('id-ID')}</span>
                </div>
              )}
              {transaction.taxAmount > 0 && (
                <div className="flex justify-between text-neutral-700">
                  <span>PB1 / Pajak ({transaction.taxPercent}%):</span>
                  <span>Rp {transaction.taxAmount.toLocaleString('id-ID')}</span>
                </div>
              )}

              <div className="flex justify-between text-xs font-bold pt-1 border-t border-neutral-300">
                <span>GRAND TOTAL:</span>
                <span>Rp {transaction.grandTotal.toLocaleString('id-ID')}</span>
              </div>

              {transaction.depositUsed > 0 && (
                <div className="flex justify-between text-[10px] text-neutral-600">
                  <span>DP Terbayar:</span>
                  <span>-Rp {transaction.depositUsed.toLocaleString('id-ID')}</span>
                </div>
              )}

              <div className="flex justify-between text-[10px]">
                <span className="uppercase">Metode: {transaction.paymentMethod}</span>
                <span>Rp {(transaction.cashGiven || transaction.grandTotal).toLocaleString('id-ID')}</span>
              </div>

              {transaction.changeGiven !== undefined && transaction.changeGiven > 0 && (
                <div className="flex justify-between text-[10px] font-semibold">
                  <span>Kembali:</span>
                  <span>Rp {transaction.changeGiven.toLocaleString('id-ID')}</span>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="text-center pt-1 space-y-1">
              <div className="font-bold text-[11px] tracking-widest uppercase">*** LUNAS ***</div>
              <div className="text-[9px] text-neutral-600 whitespace-pre-line leading-tight">
                {businessProfile.footerNote}
              </div>
              <div className="pt-2 text-[8px] text-neutral-400">
                {transaction.syncedToAppsScript ? '✓ Synced to Google Sheets' : 'Simpanan Sistem Kasir POS'}
              </div>
            </div>
          </div>
        </div>

        {/* Action Bottom Bar */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
          >
            Selesai / Tutup
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-all shadow-md shadow-amber-400/20 active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Thermal ({paperWidth})</span>
          </button>
        </div>
      </div>
    </div>
  );
};
