import React, { useState, useMemo } from 'react';
import { Search, Filter, Plus, Flame, Clock, Coffee, Mic2, AlertTriangle, Sparkles } from 'lucide-react';
import { Room } from '../types';
import { RoomCard } from './RoomCard';
import { formatRupiah, getRoomSessionTiming } from '../utils/formatters';

interface RoomGridProps {
  rooms: Room[];
  onCheckIn: (room: Room) => void;
  onExtend: (room: Room) => void;
  onOrderFnb: (room: Room) => void;
  onAssignLc: (room: Room) => void;
  onTogglePause: (room: Room) => void;
  onCheckout: (room: Room) => void;
  onSetStatus: (room: Room, status: Room['status']) => void;
  onManageOrders?: (room: Room) => void;
  onAddNewRoom?: () => void;
}

export const RoomGrid: React.FC<RoomGridProps> = ({
  rooms,
  onCheckIn,
  onExtend,
  onOrderFnb,
  onAssignLc,
  onTogglePause,
  onCheckout,
  onSetStatus,
  onManageOrders,
  onAddNewRoom,
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const roomTypes = ['all', 'Small', 'Medium', 'Large', 'VIP', 'VVIP'];

  // Metrics
  const totalRooms = rooms.length;
  const occupiedRooms = rooms.filter((r) => r.status === 'occupied').length;
  const availableRooms = rooms.filter((r) => r.status === 'available').length;
  const warningRooms = rooms.filter((r) => {
    if (r.status !== 'occupied' || !r.activeSession) return false;
    const t = getRoomSessionTiming(r.activeSession);
    return t.isWarning || t.isExpired;
  }).length;

  const filteredRooms = useMemo(() => {
    return rooms.filter((room) => {
      // Status filter
      if (filterStatus === 'occupied' && room.status !== 'occupied') return false;
      if (filterStatus === 'available' && room.status !== 'available') return false;
      if (filterStatus === 'warning') {
        if (room.status !== 'occupied' || !room.activeSession) return false;
        const t = getRoomSessionTiming(room.activeSession);
        if (!t.isWarning && !t.isExpired) return false;
      }

      // Type filter
      if (filterType !== 'all' && room.type !== filterType) return false;

      // Search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchName = room.name.toLowerCase().includes(query);
        const matchNum = room.number.toLowerCase().includes(query);
        const matchCust = room.activeSession?.customerName?.toLowerCase().includes(query);
        if (!matchName && !matchNum && !matchCust) return false;
      }

      return true;
    });
  }, [rooms, filterStatus, filterType, searchQuery]);

  return (
    <div className="space-y-5">
      {/* KPI Metrics Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-[11px] text-slate-400 font-medium">TOTAL ROOM KARAOKE</div>
            <div className="text-xl font-bold font-mono text-white mt-0.5">{totalRooms} Room</div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-[11px] text-slate-400 font-medium">TERISI / AKTIF</div>
            <div className="text-xl font-bold font-mono text-cyan-400 mt-0.5">{occupiedRooms} Room</div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
            <Flame className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-[11px] text-slate-400 font-medium">KOSONG / SIAP SEWA</div>
            <div className="text-xl font-bold font-mono text-emerald-400 mt-0.5">{availableRooms} Room</div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-[11px] text-slate-400 font-medium">SEGERA BERAKHIR / HABIS</div>
            <div className="text-xl font-bold font-mono text-amber-400 mt-0.5">{warningRooms} Room</div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Left: Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              filterStatus === 'all'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Semua ({totalRooms})
          </button>
          <button
            onClick={() => setFilterStatus('occupied')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              filterStatus === 'occupied'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Terisi ({occupiedRooms})
          </button>
          <button
            onClick={() => setFilterStatus('available')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              filterStatus === 'available'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Kosong ({availableRooms})
          </button>
          <button
            onClick={() => setFilterStatus('warning')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              filterStatus === 'warning'
                ? 'bg-red-500 text-white font-bold shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Ending Soon ({warningRooms})
          </button>
        </div>

        {/* Right: Search and Room Type Selector */}
        <div className="flex items-center gap-2.5 w-full md:w-auto">
          {/* Room Type select */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-slate-950 border border-slate-700 text-xs text-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-amber-400"
          >
            <option value="all">Semua Tipe Room</option>
            <option value="Small">Small (4 Pax)</option>
            <option value="Medium">Medium (8 Pax)</option>
            <option value="Large">Large (14 Pax)</option>
            <option value="VIP">VIP Lounge</option>
            <option value="VVIP">VVIP Royal</option>
          </select>

          {/* Search box */}
          <div className="relative flex-1 md:w-60">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari Room / Tamu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
            />
          </div>
        </div>
      </div>

      {/* Grid of Karaoke Rooms */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredRooms.map((room) => (
          <RoomCard
            key={room.id}
            room={room}
            onCheckIn={onCheckIn}
            onExtend={onExtend}
            onOrderFnb={onOrderFnb}
            onAssignLc={onAssignLc}
            onTogglePause={onTogglePause}
            onCheckout={onCheckout}
            onSetStatus={onSetStatus}
            onManageOrders={onManageOrders}
          />
        ))}

        {filteredRooms.length === 0 && (
          <div className="col-span-full py-16 text-center text-xs text-slate-500 bg-slate-900/40 rounded-2xl border border-slate-800">
            Tidak ada room karaoke yang cocok dengan filter.
          </div>
        )}
      </div>
    </div>
  );
};
