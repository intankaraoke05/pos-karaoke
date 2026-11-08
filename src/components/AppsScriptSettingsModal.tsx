import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Check,
  Copy,
  ExternalLink,
  RefreshCw,
  X,
  AlertCircle,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { AppsScriptConfig, Transaction, Expense, ShiftSession } from '../types';
import {
  APPS_SCRIPT_CODE_TEMPLATE,
  pingAppsScript,
  syncTransactionToAppsScript,
  syncExpenseToAppsScript,
} from '../services/appsScriptService';

interface AppsScriptSettingsModalProps {
  config: AppsScriptConfig;
  transactions: Transaction[];
  expenses: Expense[];
  onClose: () => void;
  onSaveConfig: (newConfig: AppsScriptConfig) => void;
  onBatchSyncComplete: () => void;
}

export const AppsScriptSettingsModal: React.FC<AppsScriptSettingsModalProps> = ({
  config,
  transactions,
  expenses,
  onClose,
  onSaveConfig,
  onBatchSyncComplete,
}) => {
  const [url, setUrl] = useState(config.webAppUrl || '');
  const [autoSync, setAutoSync] = useState(config.autoSync);
  const [isTesting, setIsTesting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedScript, setCopiedScript] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const unsyncedTxCount = transactions.filter((t) => !t.syncedToAppsScript).length;
  const unsyncedExpCount = expenses.filter((e) => !e.syncedToAppsScript).length;

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    setSyncStatusMsg(null);
    try {
      const res = await pingAppsScript(url.trim());
      setTestResult(res);
      if (res.success) {
        onSaveConfig({
          ...config,
          webAppUrl: url.trim(),
          isConfigured: true,
          status: 'connected',
        });
      }
    } catch (err: any) {
      setTestResult({ success: false, message: err.message || 'Koneksi gagal' });
    } finally {
      setIsTesting(false);
    }
  };

  const handleBatchSync = async () => {
    if (!url.trim()) {
      setSyncStatusMsg({ type: 'error', text: 'Masukkan URL Apps Script Web App terlebih dahulu' });
      return;
    }

    setIsSyncing(true);
    setSyncStatusMsg(null);
    try {
      // Sync pending transactions
      for (const tx of transactions) {
        await syncTransactionToAppsScript(url.trim(), tx);
      }
      // Sync pending expenses
      for (const exp of expenses) {
        await syncExpenseToAppsScript(url.trim(), exp);
      }

      onBatchSyncComplete();
      onSaveConfig({
        ...config,
        webAppUrl: url.trim(),
        lastSyncTime: new Date().toISOString(),
        status: 'connected',
      });
      setSyncStatusMsg({ type: 'success', text: 'Semua data transaksi dan pengeluaran berhasil dikirim ke Google Sheets!' });
    } catch (err: any) {
      setSyncStatusMsg({ type: 'error', text: 'Sinkronisasi sebagian data: ' + err.message });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(APPS_SCRIPT_CODE_TEMPLATE);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2500);
  };

  const handleSaveOnly = () => {
    onSaveConfig({
      ...config,
      webAppUrl: url.trim(),
      autoSync,
      isConfigured: Boolean(url.trim()),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Integrasi Google Apps Script & Google Sheets</h3>
              <p className="text-xs text-slate-400">Database cloud gratis tanpa server menggunakan Google Spreadsheet</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {syncStatusMsg && (
            <div
              className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-between ${
                syncStatusMsg.type === 'success'
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                  : 'bg-red-500/15 border-red-500/30 text-red-300'
              }`}
            >
              <span>{syncStatusMsg.type === 'success' ? '✓' : '⚠️'} {syncStatusMsg.text}</span>
              <button
                type="button"
                onClick={() => setSyncStatusMsg(null)}
                className="hover:text-white p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Web App URL Input Card */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <label className="block text-xs font-semibold text-white">
              URL Aplikasi Web Google Apps Script (Web App Deployment URL):
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="url"
                placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="flex-1 px-3.5 py-2 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white font-mono placeholder-slate-500 focus:outline-none focus:border-emerald-400"
              />
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTesting || !url.trim()}
                className="px-4 py-2 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 rounded-lg flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                <span>{isTesting ? 'Menguji...' : 'Uji Koneksi'}</span>
              </button>
            </div>

            {testResult && (
              <div
                className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                  testResult.success
                    ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                    : 'bg-red-500/10 border border-red-500/30 text-red-300'
                }`}
              >
                {testResult.success ? (
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                )}
                <span>{testResult.message}</span>
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-slate-850 text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  checked={autoSync}
                  onChange={(e) => setAutoSync(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-400"
                />
                <span>Kirim otomatis setiap transaksi kasir selesai</span>
              </label>

              <button
                type="button"
                onClick={handleBatchSync}
                disabled={isSyncing || !url.trim()}
                className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 p-1"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Kirim {transactions.length} Transaksi & Pengeluaran ke Sheets</span>
              </button>
            </div>
          </div>

          {/* Quick Setup Tutorial Step-by-Step */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <span>Cara Pasang Backend di Google Sheets (Hanya 2 Menit):</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                <div className="font-bold text-amber-400">1. Buka Google Spreadsheet</div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Buka browser, masuk ke Google Drive atau Spreadsheet baru. Beri judul spreadsheet Anda, misalnya "Database Karaoke POS".
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                <div className="font-bold text-amber-400">2. Masuk ke Apps Script</div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Di menu atas Google Sheets, klik <span className="text-white">Ekstensi</span> &gt; <span className="text-white">Apps Script</span>.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                <div className="font-bold text-amber-400">3. Paste Kode Backend</div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Hapus semua kode di <span className="text-white">Code.gs</span>, lalu paste kode yang telah disediakan di bawah ini dan tekan Simpan (Ctrl+S).
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                <div className="font-bold text-amber-400">4. Terapkan (Deploy as Web App)</div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Klik <span className="text-white">Terapkan</span> &gt; <span className="text-white">Penerapan Baru</span> &gt; Pilih <span className="text-white">Aplikasi Web</span>. Set akses ke <span className="text-emerald-400 font-bold">Siapa Saja (Anyone)</span>. Salin URL-nya ke aplikasi ini!
                </p>
              </div>
            </div>
          </div>

          {/* Apps Script Code Viewer & Copy Button */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">
                Script Lengkap Google Apps Script (Code.gs):
              </span>
              <button
                type="button"
                onClick={handleCopyCode}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-colors shadow-sm"
              >
                {copiedScript ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedScript ? 'Kode Berhasil Disalin!' : 'Salin Seluruh Kode (Code.gs)'}</span>
              </button>
            </div>

            <div className="relative">
              <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300 max-h-56 overflow-y-auto leading-relaxed select-text">
                {APPS_SCRIPT_CODE_TEMPLATE}
              </pre>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Aplikasi tetap 100% aktif offline secara lokal sekalipun belum terhubung ke Google Sheets.
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-slate-400 hover:text-white"
            >
              Tutup
            </button>
            <button
              type="button"
              onClick={handleSaveOnly}
              className="px-5 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors"
            >
              Simpan Konfigurasi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
