import React, { useState, useMemo } from 'react';
import { X, Search, Plus, Minus, ShoppingBag, Trash2, Utensils, Coffee, Beer, Sparkles } from 'lucide-react';
import { FnbItem, Room, FnbOrderItem } from '../types';
import { formatRupiah } from '../utils/formatters';
import { soundManager } from '../services/soundService';

interface OrderFnbModalProps {
  rooms: Room[];
  selectedRoomId?: string;
  fnbCatalog: FnbItem[];
  onClose: () => void;
  onConfirmOrder: (targetRoomId: string, items: FnbOrderItem[]) => void;
}

export const OrderFnbModal: React.FC<OrderFnbModalProps> = ({
  rooms,
  selectedRoomId,
  fnbCatalog,
  onClose,
  onConfirmOrder,
}) => {
  const [targetRoomId, setTargetRoomId] = useState<string>(selectedRoomId || (rooms.find((r) => r.status === 'occupied')?.id || rooms[0]?.id || ''));
  const [activeCategory, setActiveCategory] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [cart, setCart] = useState<{ [id: string]: { item: FnbItem; qty: number; notes: string } }>({});
  const [orderError, setOrderError] = useState<string>('');

  const categories = ['Semua', 'Minuman', 'Snack & Bites', 'Makanan Berat', 'Paket Combo', 'Rokok & Lainnya'];

  const filteredItems = useMemo(() => {
    return fnbCatalog.filter((item) => {
      const matchCat = activeCategory === 'Semua' || item.category === activeCategory;
      const matchSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.code.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch && item.isAvailable;
    });
  }, [fnbCatalog, activeCategory, searchQuery]);

  const handleAddToCart = (item: FnbItem) => {
    soundManager.playClick();
    setOrderError('');
    setCart((prev) => {
      const existing = prev[item.id];
      if (existing) {
        return {
          ...prev,
          [item.id]: { ...existing, qty: existing.qty + 1 },
        };
      }
      return {
        ...prev,
        [item.id]: { item, qty: 1, notes: '' },
      };
    });
  };

  const handleQuantityChange = (itemId: string, delta: number) => {
    soundManager.playClick();
    setOrderError('');
    setCart((prev) => {
      const existing = prev[itemId];
      if (!existing) return prev;
      const newQty = existing.qty + delta;
      if (newQty <= 0) {
        const copy = { ...prev };
        delete copy[itemId];
        return copy;
      }
      return {
        ...prev,
        [itemId]: { ...existing, qty: newQty },
      };
    });
  };

  const handleNotesChange = (itemId: string, notes: string) => {
    setCart((prev) => {
      if (!prev[itemId]) return prev;
      return {
        ...prev,
        [itemId]: { ...prev[itemId], notes },
      };
    });
  };

  const handleRemoveFromCart = (itemId: string) => {
    soundManager.playClick();
    setOrderError('');
    setCart((prev) => {
      const copy = { ...prev };
      delete copy[itemId];
      return copy;
    });
  };

  const cartList = Object.values(cart);
  const totalCartCount = cartList.reduce((sum, entry) => sum + entry.qty, 0);
  const totalCartPrice = cartList.reduce((sum, entry) => sum + entry.item.price * entry.qty, 0);

  const handleSendOrder = () => {
    if (cartList.length === 0) {
      setOrderError('Pilih minimal satu menu F&B terlebih dahulu');
      return;
    }
    if (!targetRoomId) {
      setOrderError('Pilih room tujuan pesanan');
      return;
    }

    const orderItems: FnbOrderItem[] = cartList.map((entry) => ({
      id: 'ord-' + Date.now() + '-' + Math.floor(Math.random() * 10000),
      itemId: entry.item.id,
      name: entry.item.name,
      price: entry.item.price,
      qty: entry.qty,
      notes: entry.notes.trim() || undefined,
      timestamp: new Date().toISOString(),
    }));

    onConfirmOrder(targetRoomId, orderItems);
  };

  const selectedRoom = rooms.find((r) => r.id === targetRoomId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/80 backdrop-blur-sm overflow-hidden">
      <div className="w-full max-w-5xl h-[90vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Utensils className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Order F&B / Dapur & Bar Karaoke</h3>
              <p className="text-xs text-slate-400">
                Pilih menu dan masukkan ke tagihan Room Karaoke
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Target Room Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 hidden sm:inline">Tujuan:</span>
              <select
                value={targetRoomId}
                onChange={(e) => setTargetRoomId(e.target.value)}
                className="bg-slate-950 border border-slate-700 text-xs text-white rounded-lg px-3 py-1.5 focus:outline-none focus:border-amber-400 font-medium"
              >
                {rooms.map((rm) => (
                  <option key={rm.id} value={rm.id}>
                    {rm.name} {rm.status === 'occupied' ? `(${rm.activeSession?.customerName || 'Aktif'})` : '(Kosong)'}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Area: Left Catalog, Right Cart Drawer */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Menu Catalog Section */}
          <div className="flex-1 flex flex-col border-b md:border-b-0 md:border-r border-slate-800 overflow-hidden">
            {/* Search and Category Filters */}
            <div className="p-4 bg-slate-950/50 border-b border-slate-800 space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari makanan, minuman, snack, bir..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Category Segmented Buttons */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-3 py-1 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                      activeCategory === cat
                        ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                        : 'bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Menu Grid */}
            <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredItems.map((item) => {
                const inCartQty = cart[item.id]?.qty || 0;
                return (
                  <div
                    key={item.id}
                    onClick={() => handleAddToCart(item)}
                    className={`group relative p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                      inCartQty > 0
                        ? 'bg-amber-500/10 border-amber-500/40'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-950'
                    }`}
                  >
                    {inCartQty > 0 && (
                      <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-bold flex items-center justify-center">
                        {inCartQty}
                      </div>
                    )}
                    <div>
                      <div className="text-[10px] text-slate-400">{item.code} · {item.category}</div>
                      <h4 className="text-xs font-semibold text-white mt-1 group-hover:text-amber-400 transition-colors line-clamp-2">
                        {item.name}
                      </h4>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-400 font-mono">
                        {formatRupiah(item.price)}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddToCart(item);
                        }}
                        className="p-1 rounded-md bg-slate-800 text-slate-300 hover:bg-amber-500 hover:text-slate-950 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}

              {filteredItems.length === 0 && (
                <div className="col-span-full py-12 text-center text-xs text-slate-500">
                  Tidak ada menu F&B yang sesuai dengan pencarian.
                </div>
              )}
            </div>
          </div>

          {/* Cart Drawer / Order Folio */}
          <div className="w-full md:w-80 lg:w-96 flex flex-col bg-slate-950/90 overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-amber-400" />
                <h4 className="text-xs font-bold text-white">Rincian Order ({totalCartCount})</h4>
              </div>
              <span className="text-xs font-mono font-bold text-amber-400">
                {formatRupiah(totalCartPrice)}
              </span>
            </div>

            {/* Room target info badge */}
            <div className="px-4 py-2 bg-slate-900/60 border-b border-slate-800/80 text-[11px] text-slate-400 flex justify-between">
              <span>Masuk tagihan ke:</span>
              <span className="text-white font-semibold">{selectedRoom?.name || 'Pilih Room'}</span>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cartList.map(({ item, qty, notes }) => (
                <div key={item.id} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h5 className="text-xs font-semibold text-white truncate">{item.name}</h5>
                      <span className="text-[11px] text-amber-400 font-mono">{formatRupiah(item.price)}</span>
                    </div>

                    {/* Qty controls */}
                    <div className="flex items-center gap-1.5 bg-slate-950 px-1.5 py-0.5 rounded-md border border-slate-800">
                      <button
                        onClick={() => handleQuantityChange(item.id, -1)}
                        className="text-slate-400 hover:text-white p-0.5"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-bold text-white w-5 text-center font-mono">{qty}</span>
                      <button
                        onClick={() => handleQuantityChange(item.id, 1)}
                        className="text-slate-400 hover:text-white p-0.5"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <button
                      onClick={() => handleRemoveFromCart(item.id)}
                      className="text-slate-500 hover:text-red-400 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Note input */}
                  <input
                    type="text"
                    placeholder="Catatan (cth: Less ice, pedas)"
                    value={notes}
                    onChange={(e) => handleNotesChange(item.id, e.target.value)}
                    className="w-full px-2 py-1 text-[11px] bg-slate-950 border border-slate-800 rounded text-slate-300 placeholder-slate-600 focus:outline-none focus:border-amber-400"
                  />
                </div>
              ))}

              {cartList.length === 0 && (
                <div className="py-16 text-center text-xs text-slate-500">
                  Keranjang pesanan masih kosong.<br />Klik menu di sebelah kiri untuk menambahkan.
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="p-4 border-t border-slate-800 bg-slate-950 space-y-3">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Subtotal Menu:</span>
                <span className="font-mono text-white font-semibold">{formatRupiah(totalCartPrice)}</span>
              </div>

              {orderError && (
                <div className="p-2 rounded-lg bg-red-500/15 border border-red-500/30 text-red-300 text-xs font-medium text-center">
                  ⚠️ {orderError}
                </div>
              )}

              <button
                type="button"
                onClick={handleSendOrder}
                disabled={cartList.length === 0}
                className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md ${
                  cartList.length > 0
                    ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-amber-400/20 active:scale-95'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Kirim Pesanan ke {selectedRoom?.name || 'Room'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
