import React, { useState, useEffect } from 'react';
import {
  Mic,
  Clock,
  Coffee,
  Mic2,
  FileSpreadsheet,
  BarChart3,
  Utensils,
  Volume2,
  VolumeX,
  Printer,
  ShieldCheck,
  User,
  Users,
  LogOut,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { UserAccount, AppsScriptConfig, ReceiptPaperWidth, BusinessProfile } from '../types';
import { soundManager } from '../services/soundService';

interface NavbarProps {
  currentTab: 'rooms' | 'fnb' | 'lc' | 'reports' | 'catalog';
  onSelectTab: (tab: 'rooms' | 'fnb' | 'lc' | 'reports' | 'catalog') => void;
  currentUser: UserAccount | null;
  appsScriptConfig: AppsScriptConfig;
  paperWidth: ReceiptPaperWidth;
  onChangePaperWidth: (w: ReceiptPaperWidth) => void;
  onOpenAppsScriptSettings: () => void;
  onOpenLoginModal: () => void;
  onOpenUserManagement: () => void;
  businessProfile: BusinessProfile;
  occupiedRoomsCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  currentUser,
  appsScriptConfig,
  paperWidth,
  onChangePaperWidth,
  onOpenAppsScriptSettings,
  onOpenLoginModal,
  onOpenUserManagement,
  businessProfile,
  occupiedRoomsCount,
}) => {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [isMuted, setIsMuted] = useState(soundManager.isMuted);

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const toggleSound = () => {
    soundManager.isMuted = !isMuted;
    setIsMuted(!isMuted);
    if (isMuted) {
      soundManager.playClick();
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Brand Wordmark Zone */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-slate-950 shadow-md shadow-amber-500/20">
              <Mic className="w-5 h-5 font-bold" />
            </div>
            <div>
              <div className="font-extrabold text-sm sm:text-base tracking-tight text-white flex items-center gap-1.5">
                <span>INTAN KARAOKE</span>
                <span className="text-amber-400 font-mono text-xs px-1.5 py-0.5 rounded bg-amber-400/10 border border-amber-400/20">
                  POS PRO
                </span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono hidden sm:block">
                Apps Script Integrated Cloud POS
              </div>
            </div>
          </div>

          {/* Navigation Links Zone */}
          <nav className="hidden lg:flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => onSelectTab('rooms')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                currentTab === 'rooms'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Sewa Room & Timer</span>
              {occupiedRoomsCount > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    currentTab === 'rooms' ? 'bg-slate-950 text-amber-400' : 'bg-cyan-500/20 text-cyan-400'
                  }`}
                >
                  {occupiedRoomsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => onSelectTab('fnb')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                currentTab === 'fnb'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Coffee className="w-3.5 h-3.5" />
              <span>Order F&B</span>
            </button>

            <button
              onClick={() => onSelectTab('lc')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                currentTab === 'lc'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Mic2 className="w-3.5 h-3.5" />
              <span>Pemandu Lagu (LC)</span>
            </button>

            <button
              onClick={() => onSelectTab('reports')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                currentTab === 'reports'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Rekapan Keuangan</span>
            </button>

            {currentUser?.role === 'admin' && (
              <button
                onClick={() => onSelectTab('catalog')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  currentTab === 'catalog'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Utensils className="w-3.5 h-3.5" />
                <span>Menu & Stok F&B</span>
              </button>
            )}
          </nav>

          {/* Action Zone: Live Clock, Apps Script Sync, Sound, User */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Live Clock */}
            <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300">
              <Clock className="w-3 h-3 text-amber-400" />
              <span>{currentTime || '00:00:00'}</span>
            </div>

            {/* Apps Script Status Button */}
            <button
              onClick={onOpenAppsScriptSettings}
              title="Konfigurasi Integrasi Google Apps Script & Spreadsheet"
              className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 border transition-all ${
                appsScriptConfig.webAppUrl
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {appsScriptConfig.webAppUrl ? 'Apps Script: Aktif' : 'Apps Script'}
              </span>
            </button>

            {/* Thermal Print Width Switcher */}
            <button
              onClick={() => onChangePaperWidth(paperWidth === '58mm' ? '80mm' : '58mm')}
              title="Ubah ukuran kertas cetak struk thermal default"
              className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-mono hidden md:flex items-center gap-1"
            >
              <Printer className="w-3 h-3 text-amber-400" />
              <span>{paperWidth}</span>
            </button>

            {/* Sound Toggle */}
            <button
              onClick={toggleSound}
              title={isMuted ? 'Nyalakan suara alarm/chime' : 'Matikan suara alarm/chime'}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-slate-500" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
            </button>

            {/* Employee Management Button for Admin */}
            {currentUser?.role === 'admin' && (
              <button
                onClick={onOpenUserManagement}
                title="Kelola Akun Karyawan & Ganti Password Admin"
                className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 text-xs flex items-center gap-1.5 transition-colors"
              >
                <Users className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Karyawan</span>
              </button>
            )}

            {/* Logged-in User Profile & Switcher */}
            <button
              onClick={onOpenLoginModal}
              title="Klik untuk ganti akun kasir / login"
              className="flex items-center gap-2 pl-2 pr-2.5 py-1 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-xs transition-all"
            >
              <div className="w-6 h-6 rounded-lg bg-slate-800 flex items-center justify-center text-amber-400">
                <User className="w-3.5 h-3.5" />
              </div>
              <div className="text-left hidden sm:block">
                <div className="text-white font-semibold text-[11px] leading-tight">
                  {currentUser?.name || 'Kasir'}
                </div>
                <div className="text-[9px] text-amber-400 uppercase font-mono">
                  {currentUser?.role || 'Petugas'}
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Strip */}
        <div className="flex lg:hidden items-center justify-around py-2 border-t border-slate-800/80 overflow-x-auto text-[11px]">
          <button
            onClick={() => onSelectTab('rooms')}
            className={`px-2.5 py-1 rounded-md font-semibold whitespace-nowrap ${
              currentTab === 'rooms' ? 'text-amber-400 font-bold' : 'text-slate-400'
            }`}
          >
            Room Timer ({occupiedRoomsCount})
          </button>
          <button
            onClick={() => onSelectTab('fnb')}
            className={`px-2.5 py-1 rounded-md font-semibold whitespace-nowrap ${
              currentTab === 'fnb' ? 'text-amber-400 font-bold' : 'text-slate-400'
            }`}
          >
            Order F&B
          </button>
          <button
            onClick={() => onSelectTab('lc')}
            className={`px-2.5 py-1 rounded-md font-semibold whitespace-nowrap ${
              currentTab === 'lc' ? 'text-amber-400 font-bold' : 'text-slate-400'
            }`}
          >
            LC Lounge
          </button>
          <button
            onClick={() => onSelectTab('reports')}
            className={`px-2.5 py-1 rounded-md font-semibold whitespace-nowrap ${
              currentTab === 'reports' ? 'text-amber-400 font-bold' : 'text-slate-400'
            }`}
          >
            Rekapan Keuangan
          </button>
          {currentUser?.role === 'admin' && (
            <button
              onClick={() => onSelectTab('catalog')}
              className={`px-2.5 py-1 rounded-md font-semibold whitespace-nowrap ${
                currentTab === 'catalog' ? 'text-amber-400 font-bold' : 'text-slate-400'
              }`}
            >
              Menu & Stok
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
