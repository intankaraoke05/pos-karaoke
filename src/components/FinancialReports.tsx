import React, { useState } from 'react';
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  Banknote,
  QrCode,
  Calendar,
  Download,
  Printer,
  PlusCircle,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  Coffee,
  Mic2,
  Lock,
  Eye,
  AlertTriangle,
  X,
} from 'lucide-react';
import { Transaction, Expense, ShiftSession, BusinessProfile } from '../types';
import { formatRupiah, formatDateTimeIndo } from '../utils/formatters';

interface FinancialReportsProps {
  transactions: Transaction[];
  expenses: Expense[];
  currentShift: ShiftSession;
  businessProfile: BusinessProfile;
  isAdmin: boolean;
  onAddExpense: (expense: Expense) => void;
  onCloseShift: (actualCash: number, notes?: string) => void;
  onReprintReceipt: (tx: Transaction) => void;
}

export const FinancialReports: React.FC<FinancialReportsProps> = ({
  transactions,
  expenses,
  currentShift,
  businessProfile,
  isAdmin,
  onAddExpense,
  onCloseShift,
  onReprintReceipt,
}) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'transactions' | 'expenses' | 'shift'>('summary');
  const [dateRange, setDateRange] = useState<'today' | 'all'>('today');
  const [searchTx, setSearchTx] = useState('');
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isCloseShiftModalOpen, setIsCloseShiftModalOpen] = useState(false);
  const [selectedTxDetail, setSelectedTxDetail] = useState<Transaction | null>(null);

  // New Expense Form State
  const [expCategory, setExpCategory] = useState<Expense['category']>('Operasional');
  const [expDesc, setExpDesc] = useState('');
  const [expAmount, setExpAmount] = useState<number>(50000);
  const [expenseError, setExpenseError] = useState<string>('');

  // Close shift state
  const [countedCash, setCountedCash] = useState<number>(0);
  const [shiftNotes, setShiftNotes] = useState('');

  // Calculations
  const totalRevenue = transactions.reduce((sum, tx) => sum + tx.grandTotal, 0);
  const totalRoomRevenue = transactions.reduce((sum, tx) => sum + tx.roomTotal, 0);
  const totalFnbRevenue = transactions.reduce((sum, tx) => sum + tx.fnbTotal, 0);
  const totalLcRevenue = transactions.reduce((sum, tx) => sum + tx.lcTotal, 0);
  const totalTaxCollected = transactions.reduce((sum, tx) => sum + tx.taxAmount, 0);
  const totalServiceCollected = transactions.reduce((sum, tx) => sum + tx.serviceChargeAmount, 0);

  const cashSales = transactions.filter((tx) => tx.paymentMethod === 'cash').reduce((sum, tx) => sum + tx.grandTotal, 0);
  const qrisSales = transactions.filter((tx) => tx.paymentMethod === 'qris').reduce((sum, tx) => sum + tx.grandTotal, 0);
  const debitSales = transactions.filter((tx) => tx.paymentMethod === 'debit').reduce((sum, tx) => sum + tx.grandTotal, 0);
  const transferSales = transactions.filter((tx) => tx.paymentMethod === 'transfer').reduce((sum, tx) => sum + tx.grandTotal, 0);

  const totalExpensesAmount = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  // Shift expected cash
  const expectedCashInDrawer = currentShift.initialCash + cashSales - totalExpensesAmount;
  const difference = countedCash - expectedCashInDrawer;

  const filteredTransactions = transactions.filter((tx) => {
    return (
      tx.invoiceNumber.toLowerCase().includes(searchTx.toLowerCase()) ||
      tx.roomName.toLowerCase().includes(searchTx.toLowerCase()) ||
      tx.customerName.toLowerCase().includes(searchTx.toLowerCase())
    );
  });

  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expDesc.trim() || expAmount <= 0) {
      setExpenseError('Keterangan dan nominal pengeluaran wajib diisi');
      return;
    }
    setExpenseError('');

    const newExpense: Expense = {
      id: 'exp-' + Date.now(),
      date: new Date().toISOString(),
      category: expCategory,
      description: expDesc.trim(),
      amount: Number(expAmount),
      cashierName: currentShift.cashierName,
      createdAt: new Date().toISOString(),
      syncedToAppsScript: false,
    };

    onAddExpense(newExpense);
    setIsExpenseModalOpen(false);
    setExpDesc('');
    setExpAmount(50000);
  };

  const handleExportCsv = () => {
    const headers = [
      'No Invoice',
      'Tanggal',
      'Room',
      'Pelanggan',
      'Durasi (Jam)',
      'Total Room',
      'Total F&B',
      'Total LC',
      'Subtotal',
      'Diskon',
      'Service',
      'PB1 Pajak',
      'Grand Total',
      'Metode Bayar',
      'Kasir',
    ];

    const rows = transactions.map((t) => [
      t.invoiceNumber,
      `"${formatDateTimeIndo(t.createdAt)}"`,
      `"${t.roomName}"`,
      `"${t.customerName}"`,
      t.roomDurationHours,
      t.roomTotal,
      t.fnbTotal,
      t.lcTotal,
      t.subtotal,
      t.discountAmount,
      t.serviceChargeAmount,
      t.taxAmount,
      t.grandTotal,
      t.paymentMethod.toUpperCase(),
      `"${t.cashierName}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Rekapan_Karaoke_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5">
      {/* Top Navigation Tabs */}
      <div className="p-2 rounded-2xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setActiveTab('summary')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === 'summary'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Ikhtisar Omset
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === 'transactions'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Riwayat Transaksi ({transactions.length})
          </button>
          <button
            onClick={() => setActiveTab('expenses')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === 'expenses'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Pengeluaran Kas ({expenses.length})
          </button>
          <button
            onClick={() => setActiveTab('shift')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === 'shift'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Tutup Kasir / Shift
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExpenseModalOpen(true)}
            className="px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center gap-1.5 transition-colors border border-slate-700"
          >
            <PlusCircle className="w-3.5 h-3.5 text-amber-400" />
            <span>Catat Kas Keluar</span>
          </button>

          <button
            onClick={handleExportCsv}
            className="px-3 py-1.5 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* TAB 1: SUMMARY / IKHTISAR OMSET */}
      {activeTab === 'summary' && (
        <div className="space-y-5">
          {/* Main 4 Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-amber-500/30">
              <span className="text-[11px] font-semibold text-slate-400">TOTAL OMSET / PENDAPATAN</span>
              <div className="text-2xl font-bold font-mono text-amber-400 mt-1">
                {formatRupiah(totalRevenue)}
              </div>
              <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                <span>Total dari {transactions.length} transaksi sewa</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400">SEWA ROOM KARAOKE</span>
              <div className="text-xl font-bold font-mono text-cyan-400 mt-1">
                {formatRupiah(totalRoomRevenue)}
              </div>
              <div className="text-[10px] text-slate-500 mt-1">
                {totalRevenue > 0 ? Math.round((totalRoomRevenue / totalRevenue) * 100) : 0}% dari total omset
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400">PENJUALAN F&B (KITCHEN/BAR)</span>
              <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
                {formatRupiah(totalFnbRevenue)}
              </div>
              <div className="text-[10px] text-slate-500 mt-1">
                {totalRevenue > 0 ? Math.round((totalFnbRevenue / totalRevenue) * 100) : 0}% dari total omset
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400">JASA PEMANDU LAGU (LC)</span>
              <div className="text-xl font-bold font-mono text-pink-400 mt-1">
                {formatRupiah(totalLcRevenue)}
              </div>
              <div className="text-[10px] text-slate-500 mt-1">
                {totalRevenue > 0 ? Math.round((totalLcRevenue / totalRevenue) * 100) : 0}% dari total omset
              </div>
            </div>
          </div>

          {/* Payment Method Breakdown & Financial Health */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Payment Methods */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3.5">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Rincian Berdasarkan Metode Bayar
              </h4>

              <div className="space-y-2.5">
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800/80">
                  <div className="flex items-center gap-2.5">
                    <Banknote className="w-4 h-4 text-emerald-400" />
                    <div>
                      <div className="text-xs font-semibold text-white">Tunai (Cash)</div>
                      <div className="text-[10px] text-slate-400">Kas masuk ke laci kasir</div>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-emerald-400 text-sm">{formatRupiah(cashSales)}</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800/80">
                  <div className="flex items-center gap-2.5">
                    <QrCode className="w-4 h-4 text-cyan-400" />
                    <div>
                      <div className="text-xs font-semibold text-white">QRIS (GoPay/Dana/OVO/Shopee)</div>
                      <div className="text-[10px] text-slate-400">Rekening penampungan digital</div>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-cyan-400 text-sm">{formatRupiah(qrisSales)}</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800/80">
                  <div className="flex items-center gap-2.5">
                    <CreditCard className="w-4 h-4 text-purple-400" />
                    <div>
                      <div className="text-xs font-semibold text-white">Debit / Kartu Kredit EDC</div>
                      <div className="text-[10px] text-slate-400">BCA / Mandiri / BRI EDC</div>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-purple-400 text-sm">{formatRupiah(debitSales)}</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800/80">
                  <div className="flex items-center gap-2.5">
                    <TrendingUp className="w-4 h-4 text-amber-400" />
                    <div>
                      <div className="text-xs font-semibold text-white">Transfer Bank Langsung</div>
                      <div className="text-[10px] text-slate-400">Transfer m-banking tamu</div>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-amber-400 text-sm">{formatRupiah(transferSales)}</span>
                </div>
              </div>
            </div>

            {/* Net Profit & Expenses Balance */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3.5 flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Ikhtisar Arus Kas & Pengeluaran
                </h4>

                <div className="mt-3.5 p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Total Pendapatan Kotor:</span>
                    <span className="font-mono font-semibold text-white">{formatRupiah(totalRevenue)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Service Charge ({businessProfile.serviceChargePercent}%):</span>
                    <span className="font-mono text-slate-300">{formatRupiah(totalServiceCollected)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>PB1 / Pajak Hiburan ({businessProfile.taxPercent}%):</span>
                    <span className="font-mono text-slate-300">{formatRupiah(totalTaxCollected)}</span>
                  </div>
                  <div className="flex justify-between text-red-400 pt-2 border-t border-slate-800">
                    <span>Total Pengeluaran Kas Operasional:</span>
                    <span className="font-mono font-bold">-{formatRupiah(totalExpensesAmount)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-400 pt-2 border-t border-slate-800 text-sm font-bold">
                    <span>Estimasi Arus Kas Bersih (Net Cash):</span>
                    <span className="font-mono">{formatRupiah(totalRevenue - totalExpensesAmount)}</span>
                  </div>
                </div>
              </div>

              {/* Quick Action Button */}
              <div className="pt-2">
                <button
                  onClick={() => setActiveTab('shift')}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors border border-slate-700"
                >
                  <Lock className="w-4 h-4 text-amber-400" />
                  <span>Proses Tutup Kasir / Cetak Z-Report</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TRANSACTIONS LIST */}
      {activeTab === 'transactions' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <input
              type="text"
              placeholder="Cari no invoice, nama room, nama customer..."
              value={searchTx}
              onChange={(e) => setSearchTx(e.target.value)}
              className="w-full md:w-80 px-3.5 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
            />
            <span className="text-xs text-slate-400">
              Menampilkan {filteredTransactions.length} dari {transactions.length} Transaksi
            </span>
          </div>

          <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/70 text-slate-400">
                    <th className="py-3 px-4 font-semibold">NO. INVOICE</th>
                    <th className="py-3 px-4 font-semibold">WAKTU</th>
                    <th className="py-3 px-4 font-semibold">ROOM & TAMU</th>
                    <th className="py-3 px-4 font-semibold">RINCIAN (ROOM / F&B / LC)</th>
                    <th className="py-3 px-4 font-semibold text-right">TOTAL</th>
                    <th className="py-3 px-4 font-semibold text-center">METODE</th>
                    <th className="py-3 px-4 font-semibold text-right">AKSI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-semibold text-white">
                        {tx.invoiceNumber}
                      </td>
                      <td className="py-3 px-4 text-slate-400">
                        {formatDateTimeIndo(tx.createdAt)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-white">{tx.roomName}</div>
                        <span className="text-[11px] text-slate-400">{tx.customerName}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        <div className="text-[11px]">
                          Room: {formatRupiah(tx.roomTotal)} · F&B: {formatRupiah(tx.fnbTotal)} · LC: {formatRupiah(tx.lcTotal)}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-amber-400">
                        {formatRupiah(tx.grandTotal)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 uppercase">
                          {tx.paymentMethod}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => onReprintReceipt(tx)}
                            className="px-2.5 py-1 text-[11px] font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-md transition-colors flex items-center gap-1"
                          >
                            <Printer className="w-3 h-3" />
                            <span>Struk</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {filteredTransactions.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-500 text-xs">
                        Belum ada data transaksi yang tersimpan.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: EXPENSES LIST */}
      {activeTab === 'expenses' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-white uppercase">Daftar Pengeluaran Kas (Petty Cash)</h4>
              <p className="text-xs text-slate-400">Pengeluaran langsung memotong saldo kas laci shift saat ini</p>
            </div>
            <button
              onClick={() => setIsExpenseModalOpen(true)}
              className="px-3.5 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-500 rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Tambah Pengeluaran</span>
            </button>
          </div>

          <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/70 text-slate-400">
                  <th className="py-3 px-4 font-semibold">WAKTU</th>
                  <th className="py-3 px-4 font-semibold">KATEGORI</th>
                  <th className="py-3 px-4 font-semibold">KETERANGAN / KEPERLUAN</th>
                  <th className="py-3 px-4 font-semibold">PETUGAS / KASIR</th>
                  <th className="py-3 px-4 font-semibold text-right">NOMINAL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {expenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 text-slate-400">{formatDateTimeIndo(exp.date)}</td>
                    <td className="py-3 px-4">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                        {exp.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-white font-medium">{exp.description}</td>
                    <td className="py-3 px-4 text-slate-400">{exp.cashierName}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-red-400">
                      -{formatRupiah(exp.amount)}
                    </td>
                  </tr>
                ))}

                {expenses.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-500 text-xs">
                      Belum ada catatan pengeluaran kas operasional.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: SHIFT CLOSING (TUTUP KASIR / Z-REPORT) */}
      {activeTab === 'shift' && (
        <div className="max-w-2xl mx-auto p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-5">
          <div className="text-center border-b border-slate-800 pb-4">
            <h3 className="text-base font-bold text-white flex items-center justify-center gap-2">
              <Lock className="w-5 h-5 text-amber-400" />
              <span>Tutup Kasir Shift & Rekapan Kas (Z-Report)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Petugas Kasir: <span className="text-white font-semibold">{currentShift.cashierName}</span> · Buka Shift: {formatDateTimeIndo(currentShift.startTime)}
            </p>
          </div>

          <div className="space-y-2.5 p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Modal Awal Kasir:</span>
              <span className="font-mono text-white font-semibold">{formatRupiah(currentShift.initialCash)}</span>
            </div>
            <div className="flex justify-between text-emerald-400">
              <span>Total Penjualan Tunai (+):</span>
              <span className="font-mono font-bold">{formatRupiah(cashSales)}</span>
            </div>
            <div className="flex justify-between text-cyan-400">
              <span>Total Penjualan Non-Tunai (QRIS/Card/TF):</span>
              <span className="font-mono font-bold">{formatRupiah(qrisSales + debitSales + transferSales)}</span>
            </div>
            <div className="flex justify-between text-red-400">
              <span>Total Pengeluaran Kas (-):</span>
              <span className="font-mono font-bold">-{formatRupiah(totalExpensesAmount)}</span>
            </div>
            <div className="flex justify-between text-amber-400 pt-2 border-t border-slate-800 text-sm font-bold">
              <span>Uang Kas Diharapkan di Laci:</span>
              <span className="font-mono">{formatRupiah(expectedCashInDrawer)}</span>
            </div>
          </div>

          {/* Actual Cash Input */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Hitung Fisik Uang Kas di Laci (Kas Aktual):
              </label>
              <div className="relative">
                <span className="text-xs font-mono text-slate-500 absolute left-3 top-1/2 -translate-y-1/2">Rp</span>
                <input
                  type="number"
                  step="5000"
                  placeholder="Masukkan jumlah uang fisik di laci"
                  value={countedCash || ''}
                  onChange={(e) => setCountedCash(Number(e.target.value) || 0)}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-950 border border-slate-700 rounded-lg text-white font-mono font-bold focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            {/* Difference indicator */}
            {countedCash > 0 && (
              <div
                className={`p-3 rounded-xl border flex items-center justify-between text-xs font-bold ${
                  difference === 0
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : difference > 0
                    ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
                    : 'bg-red-500/10 border-red-500/30 text-red-400'
                }`}
              >
                <span>Status Selisih Kas:</span>
                <span className="font-mono">
                  {difference === 0 ? '✓ TEPAT / BALANCE (0)' : difference > 0 ? `LEBIH (+${formatRupiah(difference)})` : `KURANG (${formatRupiah(difference)})`}
                </span>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Catatan Serah Terima Shift</label>
              <input
                type="text"
                placeholder="Cth: Shift pagi lancar, titip nota beli mic cover"
                value={shiftNotes}
                onChange={(e) => setShiftNotes(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                onCloseShift(countedCash, shiftNotes);
                window.print();
              }}
              className="w-full py-3 px-4 rounded-xl text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 flex items-center justify-center gap-2 transition-all shadow-md shadow-amber-400/20 active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>Simpan & Cetak Struk Rekapan Shift (Z-Report)</span>
            </button>
          </div>
        </div>
      )}

      {/* Modal Catat Pengeluaran */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <PlusCircle className="w-4 h-4 text-red-400" />
                <span>Catat Pengeluaran Kas (Petty Cash)</span>
              </h3>
              <button
                onClick={() => setIsExpenseModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveExpense} className="p-6 space-y-4">
              {expenseError && (
                <div className="p-2.5 rounded-lg bg-red-500/15 border border-red-500/30 text-red-300 text-xs font-medium">
                  ⚠️ {expenseError}
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Kategori Pengeluaran</label>
                <select
                  value={expCategory}
                  onChange={(e) => setExpCategory(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-amber-400"
                >
                  <option value="Operasional">Operasional (Es batu, air galon, mic cover)</option>
                  <option value="Dapur & Bahan">Dapur & Bahan Masakan</option>
                  <option value="Maintenance & Sound">Maintenance Audio & Sound System</option>
                  <option value="Tips/Insentif">Tips / Insentif Staff</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Keterangan / Keperluan <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Beli es kristal 2 karung & spons mic"
                  value={expDesc}
                  onChange={(e) => setExpDesc(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Nominal Pengeluaran (Rp) <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  step="1000"
                  required
                  value={expAmount}
                  onChange={(e) => setExpAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsExpenseModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-bold text-white bg-red-600 hover:bg-red-500 rounded-lg transition-colors"
                >
                  Simpan Pengeluaran
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
